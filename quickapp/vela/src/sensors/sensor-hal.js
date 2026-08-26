/**
 * sensor-hal.js — 传感器硬件抽象层
 *
 * 封装 OpenVela system.sensor 调用，提供统一的 IMU 数据采集接口。
 * 支持真实传感器和 Mock 模式切换。
 *
 * @module sensors/sensor-hal
 */

import sensor from '@system.sensor'

const SENSOR_TYPE = {
  ACCEL: 'accelerometer',
  GYRO: 'gyroscope',
}

const DEFAULT_CONFIG = {
  sampleRate: 50,       // Hz
  accelRange: 8,        // g
  gyroRange: 500,       // dps
}

class SensorHAL {
  constructor() {
    this._config = { ...DEFAULT_CONFIG }
    this._accelSubId = null
    this._gyroSubId = null
    this._accelCallback = null
    this._gyroCallback = null
    this._isRunning = false
  }

  /**
   * 配置传感器参数
   * @param {Object} config
   */
  configure(config) {
    Object.assign(this._config, config)
  }

  /**
   * 启动 IMU 采集
   * @param {Function} onData - (sample: {timestamp, ax, ay, az, gx, gy, gz}) => void
   */
  start(onData) {
    if (this._isRunning) return

    this._isRunning = true
    const interval = Math.round(1000 / this._config.sampleRate)

    // 加速度计
    sensor.subscribe({
      type: SENSOR_TYPE.ACCEL,
      interval: interval,
      callback: (data) => {
        if (this._accelCallback) this._accelCallback(data)
      },
    })

    // 陀螺仪
    sensor.subscribe({
      type: SENSOR_TYPE.GYRO,
      interval: interval,
      callback: (data) => {
        if (this._gyroCallback) this._gyroCallback(data)
      },
    })

    // 数据合并
    let accelData = null
    let gyroData = null

    this._accelCallback = (data) => {
      accelData = data
      if (gyroData) this._mergeAndEmit(accelData, gyroData, onData)
    }

    this._gyroCallback = (data) => {
      gyroData = data
      if (accelData) this._mergeAndEmit(accelData, gyroData, onData)
    }

    console.log(`[SensorHAL] Started, interval: ${interval}ms`)
  }

  /**
   * 停止采集
   */
  stop() {
    if (!this._isRunning) return

    sensor.unsubscribe({ type: SENSOR_TYPE.ACCEL })
    sensor.unsubscribe({ type: SENSOR_TYPE.GYRO })
    this._accelCallback = null
    this._gyroCallback = null
    this._isRunning = false
    console.log('[SensorHAL] Stopped')
  }

  /**
   * 合并加速度计和陀螺仪数据
   * @private
   */
  _mergeAndEmit(accel, gyro, onData) {
    onData({
      timestamp: Date.now(),
      ax: accel.x || 0,
      ay: accel.y || 0,
      az: accel.z || 0,
      gx: gyro.x || 0,
      gy: gyro.y || 0,
      gz: gyro.z || 0,
    })
  }

  get isRunning() {
    return this._isRunning
  }
}

export { SensorHAL, DEFAULT_CONFIG }
