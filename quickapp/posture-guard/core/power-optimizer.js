/**
 * 功耗优化模块
 *
 * 实现自适应采样、duty-cycling、批量存储等功耗优化策略：
 * - 自适应采样：根据加速度方差动态切换 active/static/night 模式
 * - AI引擎 duty-cycling：根据数据变化率调整推理间隔
 * - 存储I/O批量化：内存缓冲 + 定时批量写入
 *
 * @module core/power-optimizer
 */

import { eventBus } from '../common/event-bus'

/**
 * 功耗模式
 */
export const POWER_MODE = {
  ACTIVE: 'active',     // 高性能：50Hz采样，1s推理
  BALANCED: 'balanced', // 均衡：20Hz采样，2s推理
  POWER_SAVE: 'power',  // 省电：10Hz采样，5s推理
  NIGHT: 'night',       // 夜间：0Hz采样，停止推理
}

/**
 * 采样率配置 (Hz)
 */
const SAMPLING_RATES = {
  [POWER_MODE.ACTIVE]: 50,
  [POWER_MODE.BALANCED]: 20,
  [POWER_MODE.POWER_SAVE]: 10,
  [POWER_MODE.NIGHT]: 0,
}

/**
 * 推理间隔配置 (ms)
 */
const INFERENCE_INTERVALS = {
  [POWER_MODE.ACTIVE]: 1000,
  [POWER_MODE.BALANCED]: 2000,
  [POWER_MODE.POWER_SAVE]: 5000,
  [POWER_MODE.NIGHT]: 0,
}

/**
 * 存储批量配置
 */
const BATCH_CONFIG = {
  maxBufferSize: 100,      // 缓冲区最大条数
  flushIntervalMs: 30000,  // 30秒刷盘
  maxBufferTimeMs: 30000,  // 最大缓冲时间
}

/**
 * 功耗优化器
 */
export class PowerOptimizer {
  constructor() {
    // 当前功耗模式
    this._currentMode = POWER_MODE.ACTIVE

    // 自适应采样参数
    this._accVarianceHistory = []
    this._varianceWindowSize = 50
    this._modeTransitionThreshold = {
      toBalanced: 0.5,    // 方差 < 0.5 切换到均衡
      toPowerSave: 0.1,   // 方差 < 0.1 切换到省电
      toActive: 1.0,      // 方差 > 1.0 切换到活跃
    }

    // AI引擎 duty-cycling
    this._dataChangeRate = 0
    this._changeRateHistory = []
    this._inferenceInterval = INFERENCE_INTERVALS[POWER_MODE.ACTIVE]
    this._lastInferenceTime = 0

    // 存储批量缓冲
    this._writeBuffer = []
    this._lastFlushTime = Date.now()
    this._flushTimer = null

    // 统计信息
    this._stats = {
      modeChanges: 0,
      inferencesSkipped: 0,
      batchWrites: 0,
      totalWrites: 0,
      estimatedPowerSaving: 0,
    }
  }

  /**
   * 初始化功耗优化器
   *
   * @returns {Promise<boolean>}
   */
  async init() {
    // 启动存储刷盘定时器
    this._startFlushTimer()

    // 监听传感器数据
    this._setupEventListeners()

    console.log('[PowerOptimizer] Initialized')
    return true
  }

  /**
   * 获取当前采样率
   *
   * @returns {number} Hz
   */
  getSamplingRate() {
    return SAMPLING_RATES[this._currentMode]
  }

  /**
   * 获取当前推理间隔
   *
   * @returns {number} ms
   */
  getInferenceInterval() {
    return this._inferenceInterval
  }

  /**
   * 处理传感器数据，更新自适应采样
   *
   * @param {Object} data - 传感器数据
   * @returns {boolean} 是否应该进行推理
   */
  processSensorData(data) {
    if (this._currentMode === POWER_MODE.NIGHT) {
      return false
    }

    // 更新加速度方差历史
    if (data.accVariance !== undefined) {
      this._accVarianceHistory.push(data.accVariance)
      if (this._accVarianceHistory.length > this._varianceWindowSize) {
        this._accVarianceHistory.shift()
      }
    }

    // 自适应模式切换
    this._adaptMode()

    // Duty-cycling：检查是否应该进行推理
    return this._shouldInfer()
  }

  /**
   * 计算数据变化率
   *
   * @param {Object} currentFeatures - 当前特征
   * @param {Object} previousFeatures - 上一帧特征
   * @returns {number} 变化率 (0-1)
   */
  calculateChangeRate(currentFeatures, previousFeatures) {
    if (!currentFeatures || !previousFeatures) return 0

    let totalChange = 0
    let count = 0

    // 比较各特征的变化
    const features = ['accMean', 'gyroPitch', 'gyroRoll', 'dominantFreq']
    for (const feat of features) {
      if (currentFeatures[feat] !== undefined && previousFeatures[feat] !== undefined) {
        const curr = typeof currentFeatures[feat] === 'object'
          ? (currentFeatures[feat].x || 0) + (currentFeatures[feat].y || 0) + (currentFeatures[feat].z || 0)
          : currentFeatures[feat]
        const prev = typeof previousFeatures[feat] === 'object'
          ? (previousFeatures[feat].x || 0) + (previousFeatures[feat].y || 0) + (previousFeatures[feat].z || 0)
          : previousFeatures[feat]

        const diff = Math.abs(curr - prev)
        totalChange += Math.min(diff / 10, 1) // 归一化到 0-1
        count++
      }
    }

    this._dataChangeRate = count > 0 ? totalChange / count : 0

    // 更新变化率历史
    this._changeRateHistory.push(this._dataChangeRate)
    if (this._changeRateHistory.length > 20) {
      this._changeRateHistory.shift()
    }

    // 调整推理间隔
    this._adjustInferenceInterval()

    return this._dataChangeRate
  }

  /**
   * 添加数据到写入缓冲区
   *
   * @param {Object} data - 待写入数据
   * @returns {boolean} 缓冲区是否已满
   */
  addToBuffer(data) {
    this._writeBuffer.push({
      data,
      timestamp: Date.now(),
    })

    this._stats.totalWrites++

    // 检查是否需要立即刷盘
    if (this._writeBuffer.length >= BATCH_CONFIG.maxBufferSize) {
      this.flushBuffer()
      return true
    }

    return false
  }

  /**
   * 刷新写入缓冲区
   *
   * @returns {Promise<Array>} 待写入的数据列表
   */
  async flushBuffer() {
    if (this._writeBuffer.length === 0) return []

    const dataToWrite = [...this._writeBuffer]
    this._writeBuffer = []
    this._lastFlushTime = Date.now()
    this._stats.batchWrites++

    console.log(`[PowerOptimizer] Flushing ${dataToWrite.length} items to storage`)

    // 发布刷盘事件
    eventBus.emit('storage:flush', {
      count: dataToWrite.length,
      data: dataToWrite,
    })

    return dataToWrite
  }

  /**
   * 获取缓冲区数据（不刷新）
   *
   * @returns {Array}
   */
  getBufferData() {
    return [...this._writeBuffer]
  }

  /**
   * 获取缓冲区状态
   *
   * @returns {Object}
   */
  getBufferStatus() {
    return {
      size: this._writeBuffer.length,
      maxSize: BATCH_CONFIG.maxBufferSize,
      lastFlushTime: this._lastFlushTime,
      timeSinceFlush: Date.now() - this._lastFlushTime,
    }
  }

  /**
   * 切换功耗模式
   *
   * @param {string} mode
   */
  setMode(mode) {
    if (mode === this._currentMode) return

    const oldMode = this._currentMode
    this._currentMode = mode
    this._inferenceInterval = INFERENCE_INTERVALS[mode]
    this._stats.modeChanges++

    console.log(`[PowerOptimizer] Mode changed: ${oldMode} -> ${mode}`)

    eventBus.emit('system:status', {
      module: 'power',
      status: 'ok',
      details: {
        oldMode,
        newMode: mode,
        samplingRate: this.getSamplingRate(),
        inferenceInterval: this._inferenceInterval,
      },
    })
  }

  /**
   * 获取当前功耗模式
   *
   * @returns {string}
   */
  getMode() {
    return this._currentMode
  }

  /**
   * 获取统计信息
   *
   * @returns {Object}
   */
  getStats() {
    const avgChangeRate = this._changeRateHistory.length > 0
      ? this._changeRateHistory.reduce((a, b) => a + b, 0) / this._changeRateHistory.length
      : 0

    return {
      ...this._stats,
      currentMode: this._currentMode,
      samplingRate: this.getSamplingRate(),
      inferenceInterval: this._inferenceInterval,
      bufferSize: this._writeBuffer.length,
      avgChangeRate,
    }
  }

  /**
   * 估算功耗节省
   *
   * @param {number} hours - 运行小时数
   * @returns {Object}
   */
  estimatePowerConsumption(hours) {
    // 简化功耗模型
    // 基础功耗：传感器 + AI推理 + 存储写入
    const basePowerPerHour = 5 // mAh/h

    const modeMultipliers = {
      [POWER_MODE.ACTIVE]: 1.0,
      [POWER_MODE.BALANCED]: 0.6,
      [POWER_MODE.POWER_SAVE]: 0.3,
      [POWER_MODE.NIGHT]: 0.1,
    }

    const multiplier = modeMultipliers[this._currentMode] || 1.0
    const estimatedmAh = basePowerPerHour * multiplier * hours

    // 假设电池容量 300mAh
    const batteryCapacity = 300
    const percentConsumed = (estimatedmAh / batteryCapacity) * 100

    return {
      estimatedmAh: Math.round(estimatedmAh * 10) / 10,
      percentConsumed: Math.round(percentConsumed * 10) / 10,
      mode: this._currentMode,
      hours,
    }
  }

  /**
   * 停止优化器
   */
  stop() {
    if (this._flushTimer) {
      clearInterval(this._flushTimer)
      this._flushTimer = null
    }
  }

  // ============================================================
  // 私有方法
  // ============================================================

  /**
   * 自适应模式切换
   * @private
   */
  _adaptMode() {
    if (this._accVarianceHistory.length < 10) return

    // 计算最近的平均方差
    const recentVariance = this._accVarianceHistory.slice(-10)
    const avgVariance = recentVariance.reduce((a, b) => a + b, 0) / recentVariance.length

    let newMode = this._currentMode

    if (avgVariance < this._modeTransitionThreshold.toPowerSave) {
      newMode = POWER_MODE.POWER_SAVE
    } else if (avgVariance < this._modeTransitionThreshold.toBalanced) {
      newMode = POWER_MODE.BALANCED
    } else if (avgVariance > this._modeTransitionThreshold.toActive) {
      newMode = POWER_MODE.ACTIVE
    }

    if (newMode !== this._currentMode) {
      this.setMode(newMode)
    }
  }

  /**
   * 调整推理间隔
   * @private
   */
  _adjustInferenceInterval() {
    const avgChangeRate = this._changeRateHistory.length > 0
      ? this._changeRateHistory.reduce((a, b) => a + b, 0) / this._changeRateHistory.length
      : 0

    // 变化率 < 0.1：推理间隔逐步延长至 5 秒
    if (avgChangeRate < 0.1) {
      this._inferenceInterval = Math.min(5000, this._inferenceInterval + 500)
    }
    // 变化率 > 0.3：恢复 1 秒间隔
    else if (avgChangeRate > 0.3) {
      this._inferenceInterval = Math.max(1000, this._inferenceInterval - 500)
    }
    // 中间值：保持当前间隔
  }

  /**
   * 判断是否应该进行推理
   * @private
   */
  _shouldInfer() {
    const now = Date.now()
    const elapsed = now - this._lastInferenceTime

    if (elapsed >= this._inferenceInterval) {
      this._lastInferenceTime = now
      return true
    }

    this._stats.inferencesSkipped++
    return false
  }

  /**
   * 启动刷盘定时器
   * @private
   */
  _startFlushTimer() {
    this._flushTimer = setInterval(() => {
      const timeSinceFlush = Date.now() - this._lastFlushTime
      if (this._writeBuffer.length > 0 && timeSinceFlush >= BATCH_CONFIG.maxBufferTimeMs) {
        this.flushBuffer()
      }
    }, 10000) // 每10秒检查一次
  }

  /**
   * 设置事件监听
   * @private
   */
  _setupEventListeners() {
    // 应用进入后台时刷盘
    eventBus.on('app:background', () => {
      this.flushBuffer()
    })
  }
}

export default PowerOptimizer
