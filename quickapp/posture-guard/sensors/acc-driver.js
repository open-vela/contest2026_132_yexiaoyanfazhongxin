/**
 * acc-driver.js - 加速度计驱动
 *
 * 实现加速度计传感器的采样控制：
 * - 支持真实传感器调用（OpenVela系统API）
 * - 支持Mock模式切换
 * - 数据格式：{ timestamp, acc: {x, y, z} }
 *
 * @module sensors/acc-driver
 */

import sensor from '@system.sensor'
import { SensorInterface } from './sensor-interface'
import { SAMPLING_STRATEGY, getSamplingInterval } from '../common/constants/sampling-config'

/**
 * 加速度计驱动类
 * @extends SensorInterface
 */
class AccDriver extends SensorInterface {
  constructor() {
    super('accelerometer')

    /** @type {number|null} 真实传感器订阅ID */
    this.subscriptionId = null

    /** @type {number|null} Mock模式定时器ID */
    this.mockTimerId = null
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
      console.warn('[AccDriver] Already sampling, stopping first')
      this.stopSampling()
    }

    const { strategy, mockMode = false, mockSource = null } = config

    this.currentMode = strategy
    this.isMockMode = mockMode
    this.mockSource = mockSource

    const interval = getSamplingInterval(strategy, 'accelerometer')

    // 停止采样模式
    if (strategy === SAMPLING_STRATEGY.NIGHT || interval === 0) {
      console.log('[AccDriver] Night mode, sampling disabled')
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

    // 停止Mock模式
    if (this.mockTimerId) {
      clearInterval(this.mockTimerId)
      this.mockTimerId = null
    }

    // 停止真实传感器
    if (this.subscriptionId) {
      try {
        sensor.unsubscribeAccelerometer()
        this.subscriptionId = null
      } catch (e) {
        console.error('[AccDriver] Unsubscribe error:', e)
      }
    }

    this.isSampling = false
    console.log('[AccDriver] Stopped')
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
      sensor.subscribeAccelerometer({
        callback: (data) => {
          this._onRealData(data)
        },
        fail: (data, code) => {
          console.error('[AccDriver] Subscribe fail:', code)
          this.isSampling = false
        },
      })

      this.isSampling = true
      console.log(`[AccDriver] Real sampling started, interval: ${intervalMs}ms`)
      return true
    } catch (e) {
      console.error('[AccDriver] Start error:', e)
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
    if (!this.mockSource) {
      console.error('[AccDriver] No mock source')
      return false
    }

    // 设置Mock采样间隔
    this.mockSource.setSampleInterval(intervalMs)

    // 注册Mock数据回调
    this.mockSource.onDataCallback = (mockData) => {
      this._onMockData(mockData)
    }

    this.isSampling = true
    console.log(`[AccDriver] Mock sampling started, interval: ${intervalMs}ms`)
    return true
  }

  /**
   * 处理真实传感器数据
   * @private
   * @param {Object} data - 原始传感器数据 { x, y, z }
   */
  _onRealData(data) {
    // 包装数据并输出
    this._emitData({
      timestamp: Date.now(),
      acc: {
        x: data.x,
        y: data.y,
        z: data.z,
      },
    })
  }

  /**
   * 处理Mock数据
   * @private
   * @param {Object} mockData - Mock数据
   */
  _onMockData(mockData) {
    // 仅输出加速度数据部分
    this._emitData({
      timestamp: mockData.timestamp,
      acc: mockData.acc,
    })
  }

  /**
   * 重置驱动状态
   */
  reset() {
    this.stopSampling()
    this.currentMode = SAMPLING_STRATEGY.NIGHT
    this.dataCallback = null
  }
}

export { AccDriver }
export default AccDriver
