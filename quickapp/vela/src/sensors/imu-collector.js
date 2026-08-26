/**
 * imu-collector.js — IMU 数据采集器
 *
 * 统一采集加速度计+陀螺仪 6 轴数据。
 * 内置环形缓冲区，缓存最近 10 秒数据。
 * 支持真实传感器和 Mock 模式。
 *
 * @module sensors/imu-collector
 */

import { SensorHAL } from './sensor-hal'
import { RingBuffer } from '../ai/ring-buffer'

const SAMPLE_RATE = 50  // Hz
const BUFFER_DURATION = 10  // 秒
const BUFFER_SIZE = SAMPLE_RATE * BUFFER_DURATION  // 500 采样点

class IMUCollector {
  constructor() {
    /** @type {SensorHAL} */
    this._hal = new SensorHAL()

    /** @type {RingBuffer} 环形缓冲区 */
    this._buffer = new RingBuffer(BUFFER_SIZE)

    /** @type {Function|null} 数据回调 */
    this._onDataCallback = null

    /** @type {boolean} 是否使用 Mock 模式 */
    this._mockMode = false

    /** @type {Object|null} Mock 数据源 */
    this._mockSource = null

    /** @type {number|null} Mock 定时器 */
    this._mockTimer = null

    /** @type {number} 采样计数 */
    this._sampleCount = 0
  }

  /**
   * 启动 IMU 采集
   * @param {Object} [options]
   * @param {boolean} [options.mockMode=false] - Mock 模式
   * @param {Object} [options.mockSource] - Mock 数据源
   * @param {Function} [options.onData] - 数据回调
   */
  start(options = {}) {
    this._mockMode = options.mockMode || false
    this._onDataCallback = options.onData || null

    if (this._mockMode && options.mockSource) {
      this._mockSource = options.mockSource
      this._startMockStream()
    } else {
      this._startRealSensor()
    }

    console.log(`[IMUCollector] Started (mode: ${this._mockMode ? 'mock' : 'real'})`)
  }

  /**
   * 停止采集
   */
  stop() {
    if (this._mockMode) {
      this._stopMockStream()
    } else {
      this._hal.stop()
    }
    console.log('[IMUCollector] Stopped')
  }

  /**
   * 获取最近 N 个采样点的窗口
   * @param {number} windowSize - 窗口大小（默认 100 = 2秒）
   * @returns {Array|null}
   */
  getWindow(windowSize = 100) {
    return this._buffer.getWindow(windowSize)
  }

  /**
   * 回溯读取
   * @param {number} n
   * @returns {Array}
   */
  lookBack(n) {
    return this._buffer.lookBack(n)
  }

  /**
   * 清空缓冲区
   */
  clear() {
    this._buffer.clear()
    this._sampleCount = 0
  }

  /** @returns {number} 当前采样总数 */
  get sampleCount() {
    return this._sampleCount
  }

  /** @returns {number} 缓冲区数据量 */
  get bufferLength() {
    return this._buffer.length
  }

  // ── 真实传感器 ──

  _startRealSensor() {
    this._hal.configure({ sampleRate: SAMPLE_RATE })
    this._hal.start((sample) => {
      this._onSample(sample)
    })
  }

  // ── Mock 模式 ──

  _startMockStream() {
    if (!this._mockSource) return

    const interval = Math.round(1000 / SAMPLE_RATE)
    this._mockTimer = setInterval(() => {
      const sample = this._mockSource.generateSample()
      if (sample) this._onSample(sample)
    }, interval)
  }

  _stopMockStream() {
    if (this._mockTimer) {
      clearInterval(this._mockTimer)
      this._mockTimer = null
    }
  }

  // ── 内部 ──

  _onSample(sample) {
    this._buffer.write(sample)
    this._sampleCount++

    if (this._onDataCallback) {
      this._onDataCallback(sample)
    }
  }
}

export { IMUCollector, SAMPLE_RATE, BUFFER_SIZE }
