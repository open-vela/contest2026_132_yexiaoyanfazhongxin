/**
 * 轻量级全局事件总线
 *
 * 模块间通过事件通信，禁止直接引用内部状态。
 * 支持事件订阅、发布、一次性订阅、取消订阅。
 *
 * 事件类型：
 * - sensor:data        - 传感器数据
 * - sensor:error       - 传感器错误
 * - sensor:status      - 传感器状态变化
 * - engine:result      - AI 推理结果
 * - engine:stats       - 引擎统计
 * - engine:error       - 引擎错误
 * - privacy:desensitized - 数据脱敏完成
 * - privacy:encrypted  - 数据加密完成
 * - privacy:error      - 隐私模块错误
 * - storage:written    - 存储写入完成
 * - storage:error      - 存储错误
 * - storage:flush      - 存储缓冲区刷新
 * - lifecycle:transfer - 数据状态转移
 * - lifecycle:destroy  - 数据销毁
 * - alert:trigger      - 提醒触发
 * - system:status      - 系统状态更新
 * - system:error       - 系统错误
 * - app:background     - 应用进入后台
 * - app:foreground     - 应用进入前台
 *
 * @module common/event-bus
 */

/**
 * 全局事件总线
 */
export class EventBus {
  constructor() {
    // 事件监听器映射 { eventType: [callback1, callback2, ...] }
    this._listeners = new Map()

    // 一次性监听器
    this._onceListeners = new Map()

    // 事件历史（用于调试）
    this._history = []
    this._maxHistory = 50

    // 统计信息
    this._stats = {
      emitted: 0,
      handled: 0,
      errors: 0,
    }
  }

  /**
   * 订阅事件
   *
   * @param {string} eventType - 事件类型
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消订阅函数
   */
  on(eventType, callback) {
    if (!this._listeners.has(eventType)) {
      this._listeners.set(eventType, [])
    }
    this._listeners.get(eventType).push(callback)

    // 返回取消订阅函数
    return () => this.off(eventType, callback)
  }

  /**
   * 一次性订阅事件
   *
   * @param {string} eventType - 事件类型
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消订阅函数
   */
  once(eventType, callback) {
    if (!this._onceListeners.has(eventType)) {
      this._onceListeners.set(eventType, [])
    }
    this._onceListeners.get(eventType).push(callback)

    return () => {
      const onceCbs = this._onceListeners.get(eventType)
      if (onceCbs) {
        const idx = onceCbs.indexOf(callback)
        if (idx >= 0) onceCbs.splice(idx, 1)
      }
    }
  }

  /**
   * 取消订阅事件
   *
   * @param {string} eventType - 事件类型
   * @param {Function} callback - 回调函数
   */
  off(eventType, callback) {
    const listeners = this._listeners.get(eventType)
    if (listeners) {
      const idx = listeners.indexOf(callback)
      if (idx >= 0) listeners.splice(idx, 1)
    }
  }

  /**
   * 发布事件
   *
   * @param {string} eventType - 事件类型
   * @param {*} data - 事件数据
   */
  emit(eventType, data) {
    this._stats.emitted++

    // 记录事件历史
    this._recordHistory(eventType, data)

    // 处理普通监听器
    const listeners = this._listeners.get(eventType)
    if (listeners) {
      for (const callback of listeners) {
        try {
          callback(data)
          this._stats.handled++
        } catch (error) {
          console.error(`[EventBus] Error in listener for ${eventType}:`, error)
          this._stats.errors++
        }
      }
    }

    // 处理一次性监听器
    const onceListeners = this._onceListeners.get(eventType)
    if (onceListeners && onceListeners.length > 0) {
      const callbacks = [...onceListeners]
      this._onceListeners.set(eventType, [])
      for (const callback of callbacks) {
        try {
          callback(data)
          this._stats.handled++
        } catch (error) {
          console.error(`[EventBus] Error in once listener for ${eventType}:`, error)
          this._stats.errors++
        }
      }
    }
  }

  /**
   * 发布异步事件（等待所有监听器完成）
   *
   * @param {string} eventType - 事件类型
   * @param {*} data - 事件数据
   * @returns {Promise<void>}
   */
  async emitAsync(eventType, data) {
    this._stats.emitted++
    this._recordHistory(eventType, data)

    const allListeners = [
      ...(this._listeners.get(eventType) || []),
      ...(this._onceListeners.get(eventType) || []),
    ]
    this._onceListeners.set(eventType, [])

    for (const callback of allListeners) {
      try {
        await callback(data)
        this._stats.handled++
      } catch (error) {
        console.error(`[EventBus] Error in async listener for ${eventType}:`, error)
        this._stats.errors++
      }
    }
  }

  /**
   * 清除所有监听器
   */
  clear() {
    this._listeners.clear()
    this._onceListeners.clear()
  }

  /**
   * 获取事件历史
   *
   * @param {number} [count=10] - 获取条数
   * @returns {Array}
   */
  getHistory(count = 10) {
    return this._history.slice(-count)
  }

  /**
   * 获取统计信息
   *
   * @returns {Object}
   */
  getStats() {
    return { ...this._stats }
  }

  /**
   * 记录事件历史
   *
   * @param {string} eventType
   * @param {*} data
   * @private
   */
  _recordHistory(eventType, data) {
    this._history.push({
      timestamp: Date.now(),
      type: eventType,
      dataPreview: typeof data === 'object' ? '[Object]' : String(data).slice(0, 50),
    })

    if (this._history.length > this._maxHistory) {
      this._history.shift()
    }
  }
}

// 全局单例
export const eventBus = new EventBus()

export default eventBus
