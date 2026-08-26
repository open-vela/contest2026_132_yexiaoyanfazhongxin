/**
 * 异常处理与降级策略模块
 *
 * 实现系统级异常处理和降级策略：
 * - 传感器故障：连续 10 秒无数据，自动切换到 Mock 模式或提示用户
 * - 存储空间不足：>90% 时自动清理超期冷数据
 * - 加密模块异常：数据暂存内存缓冲区，不写入明文
 * - 密钥分片丢失：标记 L3 数据为不可恢复，自动销毁
 *
 * @module core/error-handler
 */

import { eventBus } from '../common/event-bus'

/**
 * 系统状态枚举
 */
export const SYSTEM_STATUS = {
  OK: 'ok',
  DEGRADED: 'degraded',
  ERROR: 'error',
  CRITICAL: 'critical',
}

/**
 * 模块状态
 */
export const MODULE_STATUS = {
  SENSOR: 'sensor',
  ENGINE: 'engine',
  PRIVACY: 'privacy',
  STORAGE: 'storage',
}

/**
 * 错误类型
 */
export const ERROR_TYPE = {
  SENSOR_TIMEOUT: 'sensor_timeout',
  SENSOR_FAILURE: 'sensor_failure',
  STORAGE_FULL: 'storage_full',
  STORAGE_IO_ERROR: 'storage_io_error',
  CRYPTO_ERROR: 'crypto_error',
  KEY_SHARD_LOST: 'key_shard_lost',
  MEMORY_LOW: 'memory_low',
  UNKNOWN: 'unknown',
}

/**
 * 异常处理器
 */
export class ErrorHandler {
  constructor() {
    // 模块状态 { module: { status, lastUpdate, error } }
    this._moduleStatus = {}

    // 传感器超时检测
    this._sensorLastDataTime = 0
    this._sensorTimeoutTimer = null
    this._sensorTimeoutMs = 10000 // 10秒

    // 存储空间监控
    this._storageCheckTimer = null
    this._storageThreshold = 0.9 // 90%

    // 内存缓冲区（加密异常时暂存）
    this._memoryBuffer = []
    this._memoryBufferLimit = 50

    // 错误日志
    this._errorLog = []
    this._maxErrorLog = 100

    // 初始化模块状态
    for (const mod of Object.values(MODULE_STATUS)) {
      this._moduleStatus[mod] = {
        status: SYSTEM_STATUS.OK,
        lastUpdate: Date.now(),
        error: null,
      }
    }
  }

  /**
   * 初始化错误处理器
   *
   * @returns {Promise<boolean>}
   */
  async init() {
    // 启动传感器超时检测
    this._startSensorTimeoutCheck()

    // 启动存储空间监控
    this._startStorageMonitor()

    // 监听系统事件
    this._setupEventListeners()

    console.log('[ErrorHandler] Initialized')
    return true
  }

  /**
   * 报告传感器数据到达（重置超时计时器）
   */
  reportSensorData() {
    this._sensorLastDataTime = Date.now()
    this._updateModuleStatus(MODULE_STATUS.SENSOR, SYSTEM_STATUS.OK)
  }

  /**
   * 报告传感器错误
   *
   * @param {string} errorType
   * @param {Object} details
   */
  reportSensorError(errorType, details = {}) {
    const error = { type: errorType, ...details, timestamp: Date.now() }

    this._updateModuleStatus(MODULE_STATUS.SENSOR, SYSTEM_STATUS.ERROR, error)
    this._logError(errorType, MODULE_STATUS.SENSOR, details)

    // 触发降级策略
    this._handleSensorFailure(error)
  }

  /**
   * 报告存储错误
   *
   * @param {string} errorType
   * @param {Object} details
   */
  reportStorageError(errorType, details = {}) {
    const error = { type: errorType, ...details, timestamp: Date.now() }

    this._updateModuleStatus(MODULE_STATUS.STORAGE, SYSTEM_STATUS.ERROR, error)
    this._logError(errorType, MODULE_STATUS.STORAGE, details)

    // 触发降级策略
    this._handleStorageError(error)
  }

  /**
   * 报告加密错误
   *
   * @param {string} errorType
   * @param {Object} data - 待加密数据
   * @param {Object} details
   */
  reportCryptoError(errorType, data = null, details = {}) {
    const error = { type: errorType, ...details, timestamp: Date.now() }

    this._updateModuleStatus(MODULE_STATUS.PRIVACY, SYSTEM_STATUS.DEGRADED, error)
    this._logError(errorType, MODULE_STATUS.PRIVACY, details)

    // 将数据暂存内存缓冲区
    if (data && this._memoryBuffer.length < this._memoryBufferLimit) {
      this._memoryBuffer.push({
        data,
        timestamp: Date.now(),
        error: errorType,
      })
      console.warn(`[ErrorHandler] Data buffered in memory (${this._memoryBuffer.length}/${this._memoryBufferLimit})`)
    }
  }

  /**
   * 报告密钥分片丢失
   *
   * @param {number} shardIndex - 丢失的分片索引
   * @param {Object} details
   */
  reportKeyShardLost(shardIndex, details = {}) {
    const error = {
      type: ERROR_TYPE.KEY_SHARD_LOST,
      shardIndex,
      ...details,
      timestamp: Date.now(),
    }

    this._updateModuleStatus(MODULE_STATUS.PRIVACY, SYSTEM_STATUS.CRITICAL, error)
    this._logError(ERROR_TYPE.KEY_SHARD_LOST, MODULE_STATUS.PRIVACY, details)

    // 触发 L3 数据销毁
    this._handleKeyShardLost(shardIndex)
  }

  /**
   * 检查存储空间
   *
   * @param {number} usedRatio - 已使用比例 (0-1)
   */
  checkStorageSpace(usedRatio) {
    if (usedRatio >= this._storageThreshold) {
      this.reportStorageError(ERROR_TYPE.STORAGE_FULL, {
        usedRatio,
        threshold: this._storageThreshold,
      })
    }
  }

  /**
   * 获取内存缓冲区数据（用于重试写入）
   *
   * @returns {Array}
   */
  getBufferedData() {
    return [...this._memoryBuffer]
  }

  /**
   * 清除内存缓冲区（写入成功后调用）
   */
  clearBufferedData() {
    this._memoryBuffer = []
  }

  /**
   * 获取指定模块状态
   *
   * @param {string} module
   * @returns {Object}
   */
  getModuleStatus(module) {
    return this._moduleStatus[module] || { status: SYSTEM_STATUS.UNKNOWN }
  }

  /**
   * 获取整体系统状态
   *
   * @returns {string}
   */
  getSystemStatus() {
    const statuses = Object.values(this._moduleStatus).map(s => s.status)

    if (statuses.includes(SYSTEM_STATUS.CRITICAL)) {
      return SYSTEM_STATUS.CRITICAL
    }
    if (statuses.includes(SYSTEM_STATUS.ERROR)) {
      return SYSTEM_STATUS.ERROR
    }
    if (statuses.includes(SYSTEM_STATUS.DEGRADED)) {
      return SYSTEM_STATUS.DEGRADED
    }
    return SYSTEM_STATUS.OK
  }

  /**
   * 获取所有模块状态
   *
   * @returns {Object}
   */
  getAllModuleStatus() {
    return { ...this._moduleStatus }
  }

  /**
   * 获取错误日志
   *
   * @param {number} [count=20]
   * @returns {Array}
   */
  getErrorLog(count = 20) {
    return this._errorLog.slice(-count)
  }

  /**
   * 停止监控
   */
  stop() {
    if (this._sensorTimeoutTimer) {
      clearInterval(this._sensorTimeoutTimer)
      this._sensorTimeoutTimer = null
    }
    if (this._storageCheckTimer) {
      clearInterval(this._storageCheckTimer)
      this._storageCheckTimer = null
    }
  }

  // ============================================================
  // 私有方法
  // ============================================================

  /**
   * 更新模块状态
   * @private
   */
  _updateModuleStatus(module, status, error = null) {
    this._moduleStatus[module] = {
      status,
      lastUpdate: Date.now(),
      error,
    }

    // 发布状态变更事件
    eventBus.emit('system:status', {
      module,
      status,
      systemStatus: this.getSystemStatus(),
    })
  }

  /**
   * 记录错误日志
   * @private
   */
  _logError(type, module, details) {
    const entry = {
      timestamp: Date.now(),
      type,
      module,
      details,
    }

    this._errorLog.push(entry)
    if (this._errorLog.length > this._maxErrorLog) {
      this._errorLog.shift()
    }

    eventBus.emit('system:error', entry)
  }

  /**
   * 启动传感器超时检测
   * @private
   */
  _startSensorTimeoutCheck() {
    this._sensorLastDataTime = Date.now()

    this._sensorTimeoutTimer = setInterval(() => {
      const elapsed = Date.now() - this._sensorLastDataTime
      if (elapsed > this._sensorTimeoutMs) {
        this._handleSensorTimeout(elapsed)
      }
    }, 5000) // 每5秒检查一次
  }

  /**
   * 处理传感器超时
   * @private
   */
  _handleSensorTimeout(elapsedMs) {
    console.warn(`[ErrorHandler] Sensor timeout: ${elapsedMs}ms since last data`)

    this._updateModuleStatus(MODULE_STATUS.SENSOR, SYSTEM_STATUS.DEGRADED, {
      type: ERROR_TYPE.SENSOR_TIMEOUT,
      elapsedMs,
    })

    // 发布传感器故障事件
    eventBus.emit('sensor:error', {
      type: ERROR_TYPE.SENSOR_TIMEOUT,
      elapsedMs,
      message: `传感器 ${Math.round(elapsedMs / 1000)}秒无数据`,
    })
  }

  /**
   * 处理传感器故障
   * @private
   */
  _handleSensorFailure(error) {
    // 自动切换到 Mock 模式
    eventBus.emit('sensor:error', {
      ...error,
      action: 'fallback_mock',
      message: '传感器故障，切换到 Mock 模式',
    })
  }

  /**
   * 处理存储错误
   * @private
   */
  _handleStorageError(error) {
    if (error.type === ERROR_TYPE.STORAGE_FULL) {
      // 触发自动清理
      eventBus.emit('storage:error', {
        ...error,
        action: 'auto_cleanup',
        message: '存储空间不足，自动清理超期数据',
      })
    }
  }

  /**
   * 处理密钥分片丢失
   * @private
   */
  _handleKeyShardLost(shardIndex) {
    // 标记 L3 数据不可恢复，触发销毁
    eventBus.emit('privacy:error', {
      type: ERROR_TYPE.KEY_SHARD_LOST,
      shardIndex,
      action: 'destroy_l3',
      message: `密钥分片 ${shardIndex} 丢失，L3 数据将被销毁`,
    })
  }

  /**
   * 启动存储空间监控
   * @private
   */
  _startStorageMonitor() {
    // 每5分钟检查一次存储空间
    this._storageCheckTimer = setInterval(() => {
      // 实际实现中调用系统 API 获取存储使用率
      // 模拟实现：随机生成使用率
      const usedRatio = Math.random() * 0.5 + 0.3 // 30%-80%
      this.checkStorageSpace(usedRatio)
    }, 5 * 60 * 1000)
  }

  /**
   * 设置事件监听
   * @private
   */
  _setupEventListeners() {
    // 监听传感器数据，重置超时计时器
    eventBus.on('sensor:data', () => {
      this.reportSensorData()
    })
  }
}

export default ErrorHandler
