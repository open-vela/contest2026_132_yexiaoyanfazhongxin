/**
 * hr-driver.js - 心率传感器驱动
 *
 * 实现心率传感器的采样控制：
 * - 支持真实传感器调用（OpenVela系统health API）
 * - 支持Mock模式切换
 * - 数据格式：{ timestamp, hr: number }
 *
 * @module sensors/hr-driver
 */

import health from '@service.health'
import { SensorInterface } from './sensor-interface'
import { SAMPLING_STRATEGY, getSamplingInterval } from '../common/constants/sampling-config'

/**
 * 心率驱动类
 * @extends SensorInterface
 */
class HRDriver extends SensorInterface {
  constructor() {
    super('heartRate')

    /** @type {number} Mock心率基准值 */
    this.mockBaseHR = 72

    /** @type {number} Mock心率波动范围 */
    this.mockHRVariance = 5
  }

  /**
   * 开始采样
   * @param {Object} config - 采样配置
   * @param {string} config.strategy - 采样策略
   * @param {boolean} [config.mockMode=false] - 是否使用Mock模式
   * @param {Object} [config.mockSource] - Mock数据源（SensorMock实例）
   * @returns {boolean} 是否成功启动
   */
  startSampling(config) {
    if (this.isSampling) {
      console.warn('[HRDriver] Already sampling, stopping first')
      this.stopSampling()
    }

    const { strategy, mockMode = false, mockSource = null } = config

    this.currentMode = strategy
    this.isMockMode = mockMode
    this.mockSource = mockSource

    const interval = getSamplingInterval(strategy, 'heartRate')

    // 停止采样模式
    if (strategy === SAMPLING_STRATEGY.NIGHT || interval === 0) {
      console.log('[HRDriver] Night mode, sampling disabled')
      return true
    }

    if (mockMode && mockSource) {
      return this._startMockSampling(interval)
    } else {
      return this._startRealSampling(interval)
    }
  }

  /**
   * 停止采样
   * @returns {boolean} 是否成功停止
   */
  stopSampling() {
    if (!this.isSampling) return true

    // 停止真实传感器
    try {
      health.unsubscribeSample({ dataType: health.DATA_TYPES.HEART_RATE })
    } catch (e) {
      console.error('[HRDriver] Unsubscribe error:', e)
    }

    this.isSampling = false
    console.log('[HRDriver] Stopped')
    return true
  }

  /**
   * 启动真实传感器采样
   * @private
   * @param {number} intervalMs - 采样间隔（毫秒）
   * @returns {boolean}
   */
  _startRealSampling(intervalMs) {
    try {
      health.subscribeSample({
        dataType: health.DATA_TYPES.HEART_RATE,
        callback: (sample) => {
          this._onRealData(sample)
        },
        fail: (data, code) => {
          console.error('[HRDriver] Subscribe fail:', code)
          this.isSampling = false
        },
      })

      this.isSampling = true
      console.log(`[HRDriver] Real sampling started, interval: ${intervalMs}ms`)
      return true
    } catch (e) {
      console.error('[HRDriver] Start error:', e)
      return false
    }
  }

  /**
   * 启动Mock模式采样
   * @private
   * @param {number} intervalMs - 采样间隔（毫秒）
   * @returns {boolean}
   */
  _startMockSampling(intervalMs) {
    // Mock模式使用定时器生成模拟心率
    this.mockTimerId = setInterval(() => {
      this._generateMockHR()
    }, intervalMs)

    this.isSampling = true
    console.log(`[HRDriver] Mock sampling started, interval: ${intervalMs}ms`)
    return true
  }

  /**
   * 处理真实传感器数据
   * @private
   * @param {Object} sample - 原始心率数据 { timeStamp, value }
   */
  _onRealData(sample) {
    // 包装数据并输出
    this._emitData({
      timestamp: sample.timeStamp || Date.now(),
      hr: sample.value,
    })
  }

  /**
   * 生成Mock心率数据
   * @private
   */
  _generateMockHR() {
    // 生成带有随机波动的模拟心率
    const variance = (Math.random() - 0.5) * this.mockHRVariance
    const hr = Math.round(this.mockBaseHR + variance)

    this._emitData({
      timestamp: Date.now(),
      hr: hr,
    })
  }

  /**
   * 设置Mock心率参数
   * @param {number} baseHR - 基准心率
   * @param {number} variance - 波动范围
   */
  setMockParams(baseHR, variance) {
    this.mockBaseHR = baseHR
    this.mockHRVariance = variance
  }

  /**
   * 重置驱动状态
   */
  reset() {
    this.stopSampling()
    this.currentMode = SAMPLING_STRATEGY.NIGHT
    this.dataCallback = null
    this.mockBaseHR = 72
    this.mockHRVariance = 5
  }
}

export { HRDriver }
export default HRDriver
