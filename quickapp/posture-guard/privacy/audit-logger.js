/**
 * 安全审计日志模块
 *
 * 记录所有数据访问、加密、解密、销毁事件。
 * 所有日志通过 AuditStore 加密存储，支持哈希链防篡改。
 *
 * 事件类型：
 * - DATA_ACCESS: 数据读取访问
 * - DATA_WRITE: 数据写入
 * - DATA_DELETE: 数据删除
 * - DATA_DESSENSITIZE: 数据脱敏处理
 * - ENCRYPT: 加密操作
 * - DECRYPT: 解密操作
 * - KEY_DERIVE: 密钥派生
 * - KEY_SHARD: 密钥分片
 * - LIFECYCLE_TRANSFER: 生命周期状态转移
 * - LIFECYCLE_DESTROY: 数据销毁
 * - ALERT_TRIGGER: 提醒触发
 *
 * @module privacy/audit-logger
 */

import { AuditStore } from '../storage/audit-store'

/**
 * 事件类型枚举
 */
export const AUDIT_EVENT = {
  DATA_ACCESS: 'data_access',
  DATA_WRITE: 'data_write',
  DATA_DELETE: 'data_delete',
  DATA_DESSENSITIZE: 'data_desensitize',
  ENCRYPT: 'encrypt',
  DECRYPT: 'decrypt',
  KEY_DERIVE: 'key_derive',
  KEY_SHARD: 'key_shard',
  LIFECYCLE_TRANSFER: 'lifecycle_transfer',
  LIFECYCLE_DESTROY: 'lifecycle_destroy',
  ALERT_TRIGGER: 'alert_trigger',
}

/**
 * 安全审计日志管理器
 */
export class AuditLogger {
  constructor() {
    this._store = new AuditStore()
    this._initialized = false
    // 内存缓冲区（用于高频事件聚合）
    this._recentEvents = []
    this._maxRecentEvents = 50
  }

  /**
   * 初始化审计日志
   *
   * @param {CryptoManager} cryptoManager - 加密管理器
   * @returns {Promise<boolean>}
   */
  async init(cryptoManager) {
    await this._store.init(cryptoManager)
    this._initialized = true

    // 记录初始化事件
    await this.log(AUDIT_EVENT.DATA_ACCESS, 'system', 'initialized', {
      message: 'AuditLogger initialized',
    })

    return true
  }

  /**
   * 记录审计事件
   *
   * @param {string} eventType - 事件类型
   * @param {string} dataLevel - 数据级别 (l1, l2, l3, system)
   * @param {string} result - 结果 (success, failure, denied)
   * @param {Object} [details] - 详情
   * @returns {Promise<boolean>}
   */
  async log(eventType, dataLevel, result, details = {}) {
    if (!this._initialized) {
      console.warn('[AuditLogger] Not initialized, event dropped')
      return false
    }

    // 添加到最近事件列表
    this._recentEvents.unshift({
      timestamp: Date.now(),
      eventType,
      dataLevel,
      result,
      details,
    })

    // 限制内存缓冲大小
    if (this._recentEvents.length > this._maxRecentEvents) {
      this._recentEvents.pop()
    }

    // 写入持久化存储
    return this._store.append({
      eventType,
      dataLevel,
      result,
      details: {
        ...details,
        source: 'audit-logger',
      },
    })
  }

  /**
   * 记录数据访问事件
   *
   * @param {string} path - 数据路径
   * @param {string} level - 数据级别
   * @param {string} result - 结果
   * @param {Object} [details]
   */
  async logAccess(path, level, result, details = {}) {
    return this.log(AUDIT_EVENT.DATA_ACCESS, level, result, {
      path,
      ...details,
    })
  }

  /**
   * 记录数据写入事件
   *
   * @param {string} path - 数据路径
   * @param {string} level - 数据级别
   * @param {number} size - 数据大小
   * @param {Object} [details]
   */
  async logWrite(path, level, size, details = {}) {
    return this.log(AUDIT_EVENT.DATA_WRITE, level, 'success', {
      path,
      size,
      ...details,
    })
  }

  /**
   * 记录数据删除事件
   *
   * @param {string} path - 数据路径
   * @param {string} level - 数据级别
   * @param {string} reason - 删除原因
   */
  async logDelete(path, level, reason) {
    return this.log(AUDIT_EVENT.DATA_DELETE, level, 'success', {
      path,
      reason,
    })
  }

  /**
   * 记录脱敏处理事件
   *
   * @param {string} dataType - 数据类型
   * @param {Object} rules - 应用的脱敏规则
   */
  async logDesensitize(dataType, rules) {
    return this.log(AUDIT_EVENT.DATA_DESSENSITIZE, 'system', 'success', {
      dataType,
      rules: Object.keys(rules),
    })
  }

  /**
   * 记录加密事件
   *
   * @param {string} level - 加密级别
   * @param {string} algorithm - 算法
   * @param {Object} [details]
   */
  async logEncrypt(level, algorithm, details = {}) {
    return this.log(AUDIT_EVENT.ENCRYPT, level, 'success', {
      algorithm,
      ...details,
    })
  }

  /**
   * 记录解密事件
   *
   * @param {string} level - 加密级别
   * @param {string} result - 结果
   * @param {Object} [details]
   */
  async logDecrypt(level, result, details = {}) {
    return this.log(AUDIT_EVENT.DECRYPT, level, result, details)
  }

  /**
   * 记录数据销毁事件
   *
   * @param {string} path - 数据路径
   * @param {string} level - 数据级别
   * @param {string} reason - 销毁原因
   */
  async logDestroy(path, level, reason) {
    return this.log(AUDIT_EVENT.LIFECYCLE_DESTROY, level, 'success', {
      path,
      reason,
      destroyMethod: 'overwrite_zero',
    })
  }

  /**
   * 记录生命周期状态转移
   *
   * @param {string} path - 数据路径
   * @param {string} fromState - 原状态
   * @param {string} toState - 新状态
   */
  async logLifecycleTransfer(path, fromState, toState) {
    return this.log(AUDIT_EVENT.LIFECYCLE_TRANSFER, 'system', 'success', {
      path,
      fromState,
      toState,
    })
  }

  /**
   * 查询审计日志
   *
   * @param {number} startTime - 起始时间戳
   * @param {number} endTime - 结束时间戳
   * @returns {Promise<Array>} 日志条目列表
   */
  async queryLogs(startTime, endTime) {
    return this._store.queryLogs(startTime, endTime)
  }

  /**
   * 获取最近的事件（内存中）
   *
   * @param {number} [count=20] - 获取条数
   * @returns {Array}
   */
  getRecentEvents(count = 20) {
    return this._recentEvents.slice(0, count)
  }

  /**
   * 获取统计信息
   *
   * @returns {Promise<Object>}
   */
  async getStats() {
    const storeStats = await this._store.getStats()

    // 统计事件类型分布
    const eventTypeCounts = {}
    for (const event of this._recentEvents) {
      eventTypeCounts[event.eventType] = (eventTypeCounts[event.eventType] || 0) + 1
    }

    return {
      ...storeStats,
      recentEventTypes: eventTypeCounts,
    }
  }

  /**
   * 刷新缓冲区到磁盘
   *
   * @returns {Promise<boolean>}
   */
  async flush() {
    return this._store.flush()
  }
}

export default AuditLogger
