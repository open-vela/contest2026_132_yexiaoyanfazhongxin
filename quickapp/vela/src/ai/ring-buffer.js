/**
 * ring-buffer.js — 环形缓冲区
 *
 * 缓存最近 N 个 IMU 采样点，支持滑动窗口提取和回溯读取。
 * 默认容量 500 点（10秒 @50Hz）。
 *
 * @module ai/ring-buffer
 */

class RingBuffer {
  /**
   * @param {number} capacity - 缓冲区容量（采样点数）
   */
  constructor(capacity = 500) {
    this.capacity = capacity
    this.buffer = new Array(capacity)
    this.head = 0    // 写入位置
    this.count = 0   // 当前数据量
  }

  /**
   * 写入一个采样点
   * @param {Object} sample - { timestamp, ax, ay, az, gx, gy, gz }
   */
  write(sample) {
    this.buffer[this.head] = sample
    this.head = (this.head + 1) % this.capacity
    if (this.count < this.capacity) this.count++
  }

  /**
   * 获取最近 windowSize 个采样点（滑动窗口）
   * @param {number} windowSize - 窗口大小
   * @returns {Array|null} 窗口数据，不足时返回 null
   */
  getWindow(windowSize) {
    if (this.count < windowSize) return null

    const start = (this.head - windowSize + this.capacity) % this.capacity
    const result = []
    for (let i = 0; i < windowSize; i++) {
      result.push(this.buffer[(start + i) % this.capacity])
    }
    return result
  }

  /**
   * 回溯读取最近 n 个采样点（用于动态模式上下文）
   * @param {number} n - 回溯点数
   * @returns {Array}
   */
  lookBack(n) {
    const size = Math.min(n, this.count)
    const result = []
    for (let i = 0; i < size; i++) {
      const idx = (this.head - size + i + this.capacity) % this.capacity
      result.push(this.buffer[idx])
    }
    return result
  }

  /**
   * 清空缓冲区
   */
  clear() {
    this.head = 0
    this.count = 0
  }

  /**
   * 当前数据量
   */
  get length() {
    return this.count
  }
}

export { RingBuffer }
