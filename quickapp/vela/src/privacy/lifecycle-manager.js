/**
 * 数据生命周期管理模块
 *
 * 实现数据四级状态机：
 * - 热数据：24小时内，内存缓存，快速访问
 * - 温数据：1-7天，AES-128 存储
 * - 冷数据：7-30天，AES-256 + 压缩存储
 * - 销毁：30天后覆写清零
 *
 * L3 数据特殊规则：24小时强制销毁，不可配置
 *
 * @module privacy/lifecycle-manager
 */

import { AuditLogger, AUDIT_EVENT } from './audit-logger'

/**
 * 数据生命周期状态
 */
export const LIFECYCLE_STATE = {
  HOT: 'hot',       // 热数据：24小时内
  WARM: 'warm',     // 温数据：1-7天
  COLD: 'cold',     // 冷数据：7-30天
  DESTROY: 'destroy', // 待销毁
}

/**
 * 生命周期配置（毫秒）
 */
const LIFECYCLE_CONFIG = {
  [LIFECYCLE_STATE.HOT]: {
    maxAge: 24 * 60 * 60 * 1000,  // 24小时
    nextState: LIFECYCLE_STATE.WARM,
    storageLevel: 1,  // AES-128
  },
  [LIFECYCLE_STATE.WARM]: {
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7天
    nextState: LIFECYCLE_STATE.COLD,
    storageLevel: 1,  // AES-128
  },
  [LIFECYCLE_STATE.COLD]: {
    maxAge: 30 * 24 * 60 * 60 * 1000,  // 30天
    nextState: LIFECYCLE_STATE.DESTROY,
    storageLevel: 2,  // AES-256
  },
  [LIFECYCLE_STATE.DESTROY]: {
    maxAge: 0,  // 立即销毁
    nextState: null,
    storageLevel: null,
  },
}

/**
 * L3 数据特殊配置：24小时强制销毁
 */
const L3_CONFIG = {
  maxAge: 24 * 60 * 60 * 1000,  // 24小时
  forceDestroy: true,
  storageLevel: 3,
}

/**
 * 数据生命周期管理器
 */
export class LifecycleManager {
  constructor() {
    this._auditLogger = null
    this._storageManager = null
    this._initialized = false

    // 内存中的热数据缓存
    this._hotCache = new Map()

    // 文件元数据索引 { path: { state, createdAt, level, size } }
    this._metadataIndex = new Map()

    // 清理任务定时器
    this._cleanupTimer = null
  }

  /**
   * 初始化生命周期管理器
   *
   * @param {Object} params
   * @param {AuditLogger} params.auditLogger - 审计日志
   * @param {Object} params.storageManager - 存储管理器
   * @returns {Promise<boolean>}
   */
  async init(params) {
    this._auditLogger = params.auditLogger
    this._storageManager = params.storageManager
    this._initialized = true

    // 扫描现有文件，建立元数据索引
    await this._scanExistingFiles()

    // 启动清理任务
    this._startCleanupTask()

    // 执行一次初始清理
    await this._runCleanup()

    return true
  }

  /**
   * 注册新数据到生命周期管理
   *
   * @param {Object} params
   * @param {string} params.path - 文件路径
   * @param {number} params.level - 数据级别 (1, 2, 3)
   * @param {number} params.size - 数据大小
   * @returns {Promise<Object>} 初始状态信息
   */
  async register(params) {
    this._checkInitialized()

    const { path, level, size } = params
    const now = Date.now()

    // L3 数据特殊处理
    if (level === 3) {
      const metadata = {
        path,
        level,
        state: LIFECYCLE_STATE.HOT,
        createdAt: now,
        updatedAt: now,
        size,
        isL3: true,
        destroyAt: now + L3_CONFIG.maxAge,
      }
      this._metadataIndex.set(path, metadata)

      await this._auditLogger.logLifecycleTransfer(path, 'new', LIFECYCLE_STATE.HOT)

      return metadata
    }

    // 普通数据
    const metadata = {
      path,
      level,
      state: LIFECYCLE_STATE.HOT,
      createdAt: now,
      updatedAt: now,
      size,
      isL3: false,
    }
    this._metadataIndex.set(path, metadata)

    // 添加到热缓存
    this._hotCache.set(path, { data: null, metadata })

    await this._auditLogger.logLifecycleTransfer(path, 'new', LIFECYCLE_STATE.HOT)

    return metadata
  }

  /**
   * 获取数据（自动处理生命周期）
   *
   * @param {string} path - 文件路径
   * @returns {Promise<Object|null>} 数据内容
   */
  async get(path) {
    this._checkInitialized()

    const metadata = this._metadataIndex.get(path)
    if (!metadata) {
      await this._auditLogger.logAccess(path, 'unknown', 'not_found')
      return null
    }

    // 检查是否已过期
    if (this._isExpired(metadata)) {
      await this._destroy(path, metadata)
      return null
    }

    // 从热缓存读取
    if (metadata.state === LIFECYCLE_STATE.HOT) {
      const cached = this._hotCache.get(path)
      if (cached && cached.data) {
        await this._auditLogger.logAccess(path, `l${metadata.level}`, 'success', {
          source: 'hot_cache',
        })
        return cached.data
      }
    }

    // 从存储读取
    try {
      const data = await this._storageManager.read(path)
      await this._auditLogger.logAccess(path, `l${metadata.level}`, 'success', {
        source: 'storage',
        state: metadata.state,
      })
      return data
    } catch (error) {
      await this._auditLogger.logAccess(path, `l${metadata.level}`, 'failure', {
        error: error.message,
      })
      return null
    }
  }

  /**
   * 执行生命周期清理
   *
   * @returns {Promise<Object>} 清理统计
   */
  async runCleanup() {
    return this._runCleanup()
  }

  /**
   * 获取生命周期统计
   *
   * @returns {Object}
   */
  getStats() {
    const stats = {
      total: this._metadataIndex.size,
      byState: {
        [LIFECYCLE_STATE.HOT]: 0,
        [LIFECYCLE_STATE.WARM]: 0,
        [LIFECYCLE_STATE.COLD]: 0,
        [LIFECYCLE_STATE.DESTROY]: 0,
      },
      byLevel: {
        1: 0,
        2: 0,
        3: 0,
      },
      hotCacheSize: this._hotCache.size,
      totalSize: 0,
    }

    for (const metadata of this._metadataIndex.values()) {
      stats.byState[metadata.state]++
      stats.byLevel[metadata.level]++
      stats.totalSize += metadata.size || 0
    }

    return stats
  }

  /**
   * 销毁所有数据（紧急情况）
   *
   * @returns {Promise<number>} 销毁的文件数量
   */
  async destroyAll() {
    let count = 0
    for (const [path, metadata] of this._metadataIndex.entries()) {
      await this._destroy(path, metadata)
      count++
    }
    this._hotCache.clear()
    return count
  }

  /**
   * 执行清理任务
   *
   * @returns {Promise<Object>}
   * @private
   */
  async _runCleanup() {
    const now = Date.now()
    const stats = {
      scanned: 0,
      transferred: 0,
      destroyed: 0,
    }

    for (const [path, metadata] of this._metadataIndex.entries()) {
      stats.scanned++

      const age = now - metadata.createdAt

      // L3 数据特殊处理：24小时强制销毁
      if (metadata.isL3) {
        if (age >= L3_CONFIG.maxAge) {
          await this._destroy(path, metadata)
          stats.destroyed++
        }
        continue
      }

      // 普通数据状态转移
      const currentState = metadata.state
      const config = LIFECYCLE_CONFIG[currentState]

      if (age >= config.maxAge && config.nextState) {
        if (config.nextState === LIFECYCLE_STATE.DESTROY) {
          await this._destroy(path, metadata)
          stats.destroyed++
        } else {
          await this._transfer(path, metadata, config.nextState)
          stats.transferred++
        }
      }
    }

    // 记录清理审计
    await this._auditLogger.log(AUDIT_EVENT.LIFECYCLE_TRANSFER, 'system', 'success', {
      action: 'cleanup',
      ...stats,
    })

    return stats
  }

  /**
   * 转移数据状态
   *
   * @param {string} path
   * @param {Object} metadata
   * @param {string} newState
   * @private
   */
  async _transfer(path, metadata, newState) {
    const oldState = metadata.state
    const newConfig = LIFECYCLE_CONFIG[newState]

    // 更新元数据
    metadata.state = newState
    metadata.updatedAt = Date.now()
    metadata.level = newConfig.storageLevel

    // 从热缓存移除（如果不在热状态）
    if (oldState === LIFECYCLE_STATE.HOT) {
      this._hotCache.delete(path)
    }

    await this._auditLogger.logLifecycleTransfer(path, oldState, newState)

    console.log(`[Lifecycle] Transferred: ${path} from ${oldState} to ${newState}`)
  }

  /**
   * 销毁数据
   *
   * @param {string} path
   * @param {Object} metadata
   * @private
   */
  async _destroy(path, metadata) {
    // 从缓存移除
    this._hotCache.delete(path)

    // 安全删除文件
    try {
      await this._storageManager.secureDelete(path, 3)
    } catch (error) {
      console.error(`[Lifecycle] Failed to delete file: ${path}`, error)
    }

    // 记录销毁审计
    await this._auditLogger.logDestroy(path, `l${metadata.level}`, metadata.isL3 ? 'l3_expire' : 'age_expire')

    // 从索引移除
    this._metadataIndex.delete(path)

    console.log(`[Lifecycle] Destroyed: ${path}`)
  }

  /**
   * 检查数据是否过期
   *
   * @param {Object} metadata
   * @returns {boolean}
   * @private
   */
  _isExpired(metadata) {
    const now = Date.now()
    const age = now - metadata.createdAt

    if (metadata.isL3) {
      return age >= L3_CONFIG.maxAge
    }

    const config = LIFECYCLE_CONFIG[metadata.state]
    return age >= config.maxAge
  }

  /**
   * 扫描现有文件建立索引
   *
   * @private
   */
  async _scanExistingFiles() {
    // 扫描各级别目录
    for (const level of [1, 2, 3]) {
      try {
        const files = await this._storageManager.listFiles(level)
        for (const file of files) {
          if (!this._metadataIndex.has(file.path)) {
            const age = Date.now() - (file.createdAt || Date.now())
            let state = LIFECYCLE_STATE.HOT

            if (file.level === 3 && age >= L3_CONFIG.maxAge) {
              // L3 已过期，待销毁
              state = LIFECYCLE_STATE.DESTROY
            } else if (age >= LIFECYCLE_CONFIG[LIFECYCLE_STATE.COLD].maxAge) {
              state = LIFECYCLE_STATE.COLD
            } else if (age >= LIFECYCLE_CONFIG[LIFECYCLE_STATE.WARM].maxAge) {
              state = LIFECYCLE_STATE.WARM
            }

            this._metadataIndex.set(file.path, {
              path: file.path,
              level: file.level,
              state,
              createdAt: file.createdAt || Date.now(),
              updatedAt: file.createdAt || Date.now(),
              size: file.size || 0,
              isL3: file.level === 3,
            })
          }
        }
      } catch (error) {
        console.warn(`[Lifecycle] Failed to scan level ${level}:`, error)
      }
    }
  }

  /**
   * 启动清理任务定时器
   * 每日 00:00 执行清理（或启动时检查）
   *
   * @private
   */
  _startCleanupTask() {
    // 计算距下一个 00:00 的毫秒数
    const now = new Date()
    const nextMidnight = new Date(now)
    nextMidnight.setHours(24, 0, 0, 0)
    const msUntilMidnight = nextMidnight.getTime() - now.getTime()

    // 首次在午夜执行
    setTimeout(() => {
      this._runCleanup()
      // 之后每 24 小时执行一次
      this._cleanupTimer = setInterval(() => {
        this._runCleanup()
      }, 24 * 60 * 60 * 1000)
    }, msUntilMidnight)
  }

  /**
   * 停止清理任务
   */
  stop() {
    if (this._cleanupTimer) {
      clearInterval(this._cleanupTimer)
      this._cleanupTimer = null
    }
  }

  /**
   * 检查是否已初始化
   * @private
   */
  _checkInitialized() {
    if (!this._initialized) {
      throw new Error('LifecycleManager not initialized')
    }
  }
}

export default LifecycleManager
