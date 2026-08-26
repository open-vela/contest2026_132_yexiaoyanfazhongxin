/**
 * sensor-mock.js - Mock场景库
 *
 * 提供预设的体态数据流场景，用于模拟器测试
 * 支持注入场景数据，按真实采样频率逐帧输出
 *
 * 场景数据格式：
 * {
 *   type: string,        // 体态类型
 *   duration: number,    // 持续时间（秒）
 *   accVar: number,      // 加速度方差（用于久坐检测）
 *   gyroPitch: number,   // 陀螺仪俯仰角均值
 *   asymmetry?: number   // 可选：不对称系数（用于跷二郎腿检测）
 * }
 *
 * @module utils/sensor-mock
 */

import { POSTURE_TYPE } from '../constants/postures'

/**
 * Mock场景定义
 * @readonly
 */
const MOCK_SCENARIOS = {
  /**
   * 办公场景（含低头）- 1小时
   * 模拟办公室工作：大部分时间静坐，偶尔低头看手机
   */
  'office-work-1h': {
    name: '办公场景（含低头）',
    description: '模拟办公室工作：静坐办公+偶尔低头',
    totalDuration: 3600, // 1小时
    dataSequence: [
      { type: POSTURE_TYPE.NORMAL, duration: 300, accVar: 0.02, gyroPitch: -10 },
      { type: POSTURE_TYPE.FORWARD_TILT, duration: 60, accVar: 0.015, gyroPitch: -45 },
      { type: POSTURE_TYPE.NORMAL, duration: 600, accVar: 0.025, gyroPitch: -8 },
      { type: POSTURE_TYPE.FORWARD_TILT, duration: 45, accVar: 0.012, gyroPitch: -50 },
      { type: POSTURE_TYPE.NORMAL, duration: 900, accVar: 0.03, gyroPitch: -12 },
      { type: POSTURE_TYPE.SEDENTARY, duration: 180, accVar: 0.005, gyroPitch: -5 },
      { type: POSTURE_TYPE.NORMAL, duration: 450, accVar: 0.02, gyroPitch: -10 },
      { type: POSTURE_TYPE.FORWARD_TILT, duration: 30, accVar: 0.01, gyroPitch: -55 },
      { type: POSTURE_TYPE.NORMAL, duration: 1035, accVar: 0.022, gyroPitch: -9 },
    ],
  },

  /**
   * 久坐场景 - 2小时
   * 模拟长时间静坐：加速度方差极低，几乎没有运动
   */
  'sedentary-2h': {
    name: '久坐场景',
    description: '模拟长时间静坐办公',
    totalDuration: 7200, // 2小时
    dataSequence: [
      { type: POSTURE_TYPE.NORMAL, duration: 600, accVar: 0.015, gyroPitch: -10 },
      { type: POSTURE_TYPE.SEDENTARY, duration: 1200, accVar: 0.003, gyroPitch: -3 },
      { type: POSTURE_TYPE.NORMAL, duration: 300, accVar: 0.08, gyroPitch: -15 },
      { type: POSTURE_TYPE.SEDENTARY, duration: 1800, accVar: 0.002, gyroPitch: -2 },
      { type: POSTURE_TYPE.NORMAL, duration: 180, accVar: 0.12, gyroPitch: -20 },
      { type: POSTURE_TYPE.SEDENTARY, duration: 2400, accVar: 0.002, gyroPitch: -2 },
      { type: POSTURE_TYPE.NORMAL, duration: 120, accVar: 0.06, gyroPitch: -12 },
      { type: POSTURE_TYPE.SEDENTARY, duration: 600, accVar: 0.003, gyroPitch: -3 },
    ],
  },

  /**
   * 跷二郎腿场景 - 30分钟
   * 模拟跷二郎腿坐姿：x轴偏移+y轴周期性微振
   */
  'cross-leg-30m': {
    name: '跷二郎腿场景',
    description: '模拟跷二郎腿坐姿',
    totalDuration: 1800, // 30分钟
    dataSequence: [
      { type: POSTURE_TYPE.NORMAL, duration: 120, accVar: 0.02, gyroPitch: -10, asymmetry: 0.1 },
      { type: POSTURE_TYPE.CROSS_LEG, duration: 600, accVar: 0.04, gyroPitch: -8, asymmetry: 0.35 },
      { type: POSTURE_TYPE.NORMAL, duration: 60, accVar: 0.15, gyroPitch: -25, asymmetry: 0.15 },
      { type: POSTURE_TYPE.CROSS_LEG, duration: 480, accVar: 0.035, gyroPitch: -9, asymmetry: 0.32 },
      { type: POSTURE_TYPE.NORMAL, duration: 90, accVar: 0.1, gyroPitch: -18, asymmetry: 0.12 },
      { type: POSTURE_TYPE.CROSS_LEG, duration: 360, accVar: 0.038, gyroPitch: -7, asymmetry: 0.33 },
      { type: POSTURE_TYPE.NORMAL, duration: 90, accVar: 0.08, gyroPitch: -15, asymmetry: 0.1 },
    ],
  },

  /**
   * 混合日常场景
   * 模拟一天的混合活动：办公、行走、休息等
   */
  'mixed-daily': {
    name: '混合日常场景',
    description: '模拟一天的混合活动',
    totalDuration: 3600, // 1小时（压缩版）
    dataSequence: [
      { type: POSTURE_TYPE.WALKING, duration: 300, accVar: 0.25, gyroPitch: 0 },
      { type: POSTURE_TYPE.NORMAL, duration: 180, accVar: 0.03, gyroPitch: -10 },
      { type: POSTURE_TYPE.SEDENTARY, duration: 900, accVar: 0.003, gyroPitch: -3 },
      { type: POSTURE_TYPE.FORWARD_TILT, duration: 120, accVar: 0.015, gyroPitch: -48 },
      { type: POSTURE_TYPE.NORMAL, duration: 300, accVar: 0.02, gyroPitch: -8 },
      { type: POSTURE_TYPE.WALKING, duration: 240, accVar: 0.22, gyroPitch: 5 },
      { type: POSTURE_TYPE.CROSS_LEG, duration: 480, accVar: 0.035, gyroPitch: -9, asymmetry: 0.3 },
      { type: POSTURE_TYPE.NORMAL, duration: 150, accVar: 0.04, gyroPitch: -12 },
      { type: POSTURE_TYPE.SEDENTARY, duration: 480, accVar: 0.004, gyroPitch: -4 },
      { type: POSTURE_TYPE.NORMAL, duration: 450, accVar: 0.025, gyroPitch: -10 },
      { type: POSTURE_TYPE.WALKING, duration: 300, accVar: 0.28, gyroPitch: 3 },
    ],
  },
}

/**
 * Mock传感器数据生成器
 */
class SensorMock {
  constructor() {
    /** @type {string|null} 当前激活的场景名称 */
    this.currentScenario = null
    /** @type {Object|null} 当前场景配置 */
    this.scenarioConfig = null
    /** @type {number} 当前序列索引 */
    this.sequenceIndex = 0
    /** @type {number} 当前序列内已过时间（秒） */
    this.elapsedInSegment = 0
    /** @type {Function|null} 数据回调 */
    this.onDataCallback = null
    /** @type {number|null} 定时器ID */
    this.timerId = null
    /** @type {number} 采样间隔（毫秒） */
    this.sampleInterval = 50 // 默认20Hz
    /** @type {number} 起始时间戳 */
    this.startTime = 0
  }

  /**
   * 注入Mock场景
   * @param {string} scenarioName - 场景名称
   * @returns {boolean} 是否成功注入
   */
  injectScenario(scenarioName) {
    const scenario = MOCK_SCENARIOS[scenarioName]
    if (!scenario) {
      console.error(`[SensorMock] Unknown scenario: ${scenarioName}`)
      return false
    }

    this.currentScenario = scenarioName
    this.scenarioConfig = scenario
    this.sequenceIndex = 0
    this.elapsedInSegment = 0
    this.startTime = Date.now()

    console.log(`[SensorMock] Injected scenario: ${scenario.name}`)
    return true
  }

  /**
   * 获取所有可用场景列表
   * @returns {Array<{name: string, description: string, duration: number}>}
   */
  getAvailableScenarios() {
    return Object.entries(MOCK_SCENARIOS).map(([key, scenario]) => ({
      id: key,
      name: scenario.name,
      description: scenario.description,
      duration: scenario.totalDuration,
    }))
  }

  /**
   * 设置采样间隔
   * @param {number} intervalMs - 采样间隔（毫秒）
   */
  setSampleInterval(intervalMs) {
    if (intervalMs > 0) {
      this.sampleInterval = intervalMs
    }
  }

  /**
   * 启动Mock数据流
   * @param {Function} callback - 数据回调 (data) => {}
   *   data格式: { timestamp, acc: {x,y,z}, gyro: {x,y,z}, posture: string }
   */
  startStream(callback) {
    if (!this.currentScenario) {
      console.error('[SensorMock] No scenario injected')
      return
    }

    this.onDataCallback = callback

    // 启动定时器，按采样间隔输出数据
    this.timerId = setInterval(() => {
      this._generateSample()
    }, this.sampleInterval)

    console.log(`[SensorMock] Stream started, interval: ${this.sampleInterval}ms`)
  }

  /**
   * 停止Mock数据流
   */
  stopStream() {
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }
    this.onDataCallback = null
    console.log('[SensorMock] Stream stopped')
  }

  /**
   * 生成单个采样点数据
   * @private
   */
  _generateSample() {
    if (!this.scenarioConfig || !this.onDataCallback) return

    const sequence = this.scenarioConfig.dataSequence
    if (this.sequenceIndex >= sequence.length) {
      // 场景结束，循环播放
      this.sequenceIndex = 0
      this.elapsedInSegment = 0
      console.log('[SensorMock] Scenario looped')
    }

    const segment = sequence[this.sequenceIndex]
    const sampleDurationMs = this.sampleInterval / 1000 // 转换为秒

    // 生成传感器数据
    const data = this._interpolateSegment(segment, sampleDurationMs)

    // 输出数据
    this.onDataCallback(data)

    // 更新时间
    this.elapsedInSegment += sampleDurationMs

    // 检查是否进入下一个片段
    if (this.elapsedInSegment >= segment.duration) {
      this.sequenceIndex++
      this.elapsedInSegment = 0
    }
  }

  /**
   * 根据片段配置插值生成传感器数据
   * @private
   * @param {Object} segment - 片段配置
   * @param {number} timeOffset - 时间偏移（秒）
   * @returns {Object} 传感器数据
   */
  _interpolateSegment(segment, timeOffset) {
    const timestamp = Date.now()

    // 生成加速度数据（基于方差）
    const acc = this._generateAccData(segment.accVar, segment.type)

    // 生成陀螺仪数据（基于俯仰角）
    const gyro = this._generateGyroData(segment.gyroPitch, segment.asymmetry)

    return {
      timestamp,
      acc,
      gyro,
      posture: segment.type,
      // Mock元数据
      _mock: {
        scenario: this.currentScenario,
        segmentIndex: this.sequenceIndex,
        segmentType: segment.type,
      },
    }
  }

  /**
   * 生成加速度数据
   * @private
   * @param {number} variance - 目标方差
   * @param {string} postureType - 体态类型
   * @returns {{x: number, y: number, z: number}}
   */
  _generateAccData(variance, postureType) {
    // 基础重力分量
    let x = 0, y = 0, z = -9.8

    // 根据体态类型调整基础值
    if (postureType === POSTURE_TYPE.FORWARD_TILT) {
      // 低头时z轴绝对值减小
      z = -6.5 + (Math.random() - 0.5) * 0.5
      x = (Math.random() - 0.5) * 0.3
    } else if (postureType === POSTURE_TYPE.CROSS_LEG) {
      // 跷二郎腿时x轴偏移
      x = 2.5 + (Math.random() - 0.5) * 0.4
      z = -9.2 + (Math.random() - 0.5) * 0.3
    } else if (postureType === POSTURE_TYPE.WALKING) {
      // 行走时有明显运动
      x = (Math.random() - 0.5) * 4
      y = (Math.random() - 0.5) * 3
      z = -9.8 + (Math.random() - 0.5) * 2
    } else {
      // 正常/久坐：添加基于方差的噪声
      const noiseScale = Math.sqrt(variance) * 10
      x = (Math.random() - 0.5) * noiseScale
      y = (Math.random() - 0.5) * noiseScale
      z = -9.8 + (Math.random() - 0.5) * noiseScale
    }

    return {
      x: Math.round(x * 1000) / 1000,
      y: Math.round(y * 1000) / 1000,
      z: Math.round(z * 1000) / 1000,
    }
  }

  /**
   * 生成陀螺仪数据
   * @private
   * @param {number} pitch - 俯仰角均值（度）
   * @param {number} asymmetry - 不对称系数
   * @returns {{x: number, y: number, z: number}}
   */
  _generateGyroData(pitch, asymmetry) {
    // 俯仰角转换为弧度/秒（简化模型）
    const pitchRad = (pitch * Math.PI) / 180

    let x = 0, y = 0, z = 0

    // 主要俯仰运动
    y = pitchRad + (Math.random() - 0.5) * 0.1

    // 如果有不对称系数，添加周期性振荡
    if (asymmetry && asymmetry > 0.2) {
      const t = Date.now() / 1000
      const freq = 0.5 + asymmetry * 0.5 // 0.5-1 Hz
      x = Math.sin(2 * Math.PI * freq * t) * asymmetry * 0.5
      z = Math.cos(2 * Math.PI * freq * t * 0.7) * asymmetry * 0.3
    }

    return {
      x: Math.round(x * 1000) / 1000,
      y: Math.round(y * 1000) / 1000,
      z: Math.round(z * 1000) / 1000,
    }
  }

  /**
   * 获取当前场景进度
   * @returns {{ current: number, total: number, percent: number }}
   */
  getProgress() {
    if (!this.scenarioConfig) {
      return { current: 0, total: 0, percent: 0 }
    }

    const elapsed = (Date.now() - this.startTime) / 1000
    const total = this.scenarioConfig.totalDuration

    return {
      current: Math.round(elapsed),
      total,
      percent: Math.min(100, Math.round((elapsed / total) * 100)),
    }
  }
}

export { MOCK_SCENARIOS, SensorMock }
export default SensorMock
