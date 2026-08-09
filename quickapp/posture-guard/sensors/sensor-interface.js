/**
 * sensor-interface.js - 传感器抽象层统一接口
 *
 * 定义所有传感器驱动必须实现的接口：
 * - startSampling(config): 开始采样
 * - stopSampling(): 停止采样
 * - onData(callback): 注册数据回调
 * - getCurrentMode(): 获取当前采样模式
 *
 * 原始传感器数据禁止直接暴露给上层，必须通过接口包装后输出
 *
 * @module sensors/sensor-interface
 */

import { SAMPLING_STRATEGY, DEFAULT_STRATEGY, getSamplingInterval } from '../common/constants/sampling-config'

/**
 * 传感器数据格式
 * @typedef {Object} SensorData
 * @property {number} timestamp - 时间戳（设备本地时间）
 * @property {Object} acc - 加速度数据
 * @property {number} acc.x - X轴加速度 (m/s²)
 * @property {number} acc.y - Y轴加速度 (m/s²)
 * @property {number} acc.z - Z轴加速度 (m/s²)
 * @property {Object} gyro - 陀螺仪数据
 * @property {number} gyro.x - X轴角速度 (rad/s)
 * @property {number} gyro.y - Y轴角速度 (rad/s)
 * @property {number} gyro.z - Z轴角速度 (rad/s)
 * @property {number} [hr] - 心率 (bpm)
 */

/**
 * 传感器抽象基类
 * 所有传感器驱动必须继承此类并实现抽象方法
 */
class SensorInterface {
  /**
   * @param {string} sensorType - 传感器类型 'accelerometer'|'gyroscope'|'heartRate'
   */
  constructor(sensorType) {
    if (new.target === SensorInterface) {
      throw new Error('SensorInterface is abstract and cannot be instantiated directly')
    }

    /** @type {string} 传感器类型 */
    this.sensorType = sensorType

    /** @type {string} 当前采样策略 */
    this.currentMode = SAMPLING_STRATEGY.NIGHT

    /** @type {Function|null} 数据回调 */
    this.dataCallback = null

    /** @type {boolean} 是否正在采样 */
    this.isSampling = false

    /** @type {boolean} 是否为Mock模式 */
    this.isMockMode = false

    /** @type {Object|null} Mock数据源 */
    this.mockSource = null
  }

  /**
   * 开始采样
   * @param {Object} config - 采样配置
   * @param {string} config.strategy - 采样策略
   * @param {boolean} [config.mockMode=false] - 是否使用Mock模式
   * @param {Object} [config.mockSource] - Mock数据源
   * @throws {Error} 如果未实现此方法
   */
  startSampling(config) {
    throw new Error('startSampling() must be implemented by subclass')
  }

  /**
   * 停止采样
   * @throws {Error} 如果未实现此方法
   */
  stopSampling() {
    throw new Error('stopSampling() must be implemented by subclass')
  }

  /**
   * 注册数据回调
   * @param {Function} callback - 回调函数 (data: SensorData) => void
   */
  onData(callback) {
    this.dataCallback = callback
  }

  /**
   * 获取当前采样模式
   * @returns {string} 采样策略枚举值
   */
  getCurrentMode() {
    return this.currentMode
  }

  /**
   * 获取当前采样间隔
   * @returns {number} 采样间隔（毫秒）
   */
  getSamplingInterval() {
    return getSamplingInterval(this.currentMode, this.sensorType)
  }

  /**
   * 检查是否正在采样
   * @returns {boolean}
   */
  isRunning() {
    return this.isSampling
  }

  /**
   * 输出数据给上层（内部使用）
   * @protected
   * @param {Object} rawData - 原始传感器数据
   */
  _emitData(rawData) {
    if (!this.dataCallback) return

    // 包装数据，确保格式统一
    const wrappedData = this._wrapData(rawData)
    this.dataCallback(wrappedData)
  }

  /**
   * 包装原始数据为统一格式（子类可重写）
   * @protected
   * @param {Object} rawData - 原始数据
   * @returns {Object} 包装后的数据
   */
  _wrapData(rawData) {
    return {
      timestamp: rawData.timestamp || Date.now(),
      ...rawData,
    }
  }

  /**
   * 切换到Mock模式
   * @param {Object} mockSource - Mock数据源
   */
  enableMockMode(mockSource) {
    this.isMockMode = true
    this.mockSource = mockSource
    console.log(`[${this.sensorType}] Mock mode enabled`)
  }

  /**
   * 禁用Mock模式
   */
  disableMockMode() {
    this.isMockMode = false
    this.mockSource = null
    console.log(`[${this.sensorType}] Mock mode disabled`)
  }
}

export { SensorInterface, getSamplingInterval }
export default SensorInterface
