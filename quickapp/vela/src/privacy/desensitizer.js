/**
 * 脱敏规则引擎
 *
 * 对原始传感器数据和 AI 引擎输出进行隐私脱敏处理，
 * 包括时间戳模糊化、生理数据区间化、坐标差分隐私噪声注入等。
 *
 * 核心原则：
 * 1. 原始传感器数据脱敏后立即释放，不得保留明文副本
 * 2. 所有输出均标记 desensitized: true
 * 3. 同一输入多次脱敏结果不同（差分隐私噪声随机性）
 *
 * @module privacy/desensitizer
 */

import { DifferentialPrivacy } from './differential-privacy'

/**
 * 脱敏规则配置
 */
const DESENSITIZE_RULES = {
  // 时间戳：精确毫秒 → 模糊到 5 分钟区间
  TIMESTAMP: {
    type: 'range',
    intervalMs: 5 * 60 * 1000, // 5 分钟
  },
  // 心率：精确值 → 区间化
  HEART_RATE: {
    type: 'bucket',
    bucketSize: 5, // 5 bpm 区间
  },
  // 运动坐标：差分隐私噪声
  MOTION_COORD: {
    type: 'dp_noise',
    epsilon: 0.1,
    sensitivity: 1.0,
  },
  // 步数：模糊到 10 步区间
  STEP_COUNT: {
    type: 'bucket',
    bucketSize: 10,
  },
  // 原始波形：丢弃，仅保留统计特征
  RAW_WAVEFORM: {
    type: 'discard',
  },
}

/**
 * 脱敏规则引擎
 */
export class Desensitizer {
  constructor() {
    this._rules = { ...DESENSITIZE_RULES }
    this._dp = DifferentialPrivacy
  }

  /**
   * 脱敏传感器原始数据
   *
   * 输入格式：
   * {
   *   timestamp: 1700000000000,
   *   acc: { x: 0.1, y: -9.8, z: 0.2 },
   *   gyro: { pitch: 5.0, roll: -2.0 },
   *   heartRate: 72,
   *   steps: 1234
   * }
   *
   * @param {Object} rawData - 原始传感器数据
   * @returns {Object} 脱敏后的特征包
   */
  desensitizeSensorData(rawData) {
    if (!rawData) return null

    const result = {
      desensitized: true,
      desensitizedAt: Date.now(),
    }

    // 时间戳模糊化
    if (rawData.timestamp !== undefined) {
      result.timestampRange = this._desensitizeTimestamp(rawData.timestamp)
    }

    // 加速度数据：差分隐私噪声
    if (rawData.acc) {
      result.acc = {
        x: this._addDpNoise(rawData.acc.x, this._rules.MOTION_COORD),
        y: this._addDpNoise(rawData.acc.y, this._rules.MOTION_COORD),
        z: this._addDpNoise(rawData.acc.z, this._rules.MOTION_COORD),
      }
    }

    // 陀螺仪数据：差分隐私噪声
    if (rawData.gyro) {
      result.gyro = {
        pitch: this._addDpNoise(rawData.gyro.pitch, this._rules.MOTION_COORD),
        roll: this._addDpNoise(rawData.gyro.roll, this._rules.MOTION_COORD),
      }
    }

    // 心率：区间化
    if (rawData.heartRate !== undefined) {
      result.heartRateRange = this._desensitizeHeartRate(rawData.heartRate)
    }

    // 步数：模糊化
    if (rawData.steps !== undefined) {
      result.stepRange = this._desensitizeStepCount(rawData.steps)
    }

    // 原始波形：丢弃（标记为已丢弃）
    result.rawWaveformDiscarded = true

    return result
  }

  /**
   * 脱敏 AI 引擎输出
   *
   * 输入格式（PostureEngine 输出）：
   * {
   *   posture: 'normal',
   *   confidence: 0.92,
   *   severity: 1,
   *   duration: 45,
   *   timestamp: 1700000000000,
   *   features: { accMean, accVar, gyroPitch, ... }
   * }
   *
   * @param {Object} engineOutput - AI 引擎输出
   * @returns {Object} 脱敏后的输出
   */
  desensitizeEngineOutput(engineOutput) {
    if (!engineOutput) return null

    const result = {
      desensitized: true,
      desensitizedAt: Date.now(),
    }

    // 姿态类型：直接保留（非敏感）
    result.posture = engineOutput.posture

    // 置信度：保留（用于统计，不敏感）
    result.confidence = engineOutput.confidence

    // 严重程度：保留
    result.severity = engineOutput.severity

    // 持续时间：区间化（5分钟）
    if (engineOutput.duration !== undefined) {
      result.durationRange = this._desensitizeDuration(engineOutput.duration)
    }

    // 时间戳：模糊化
    if (engineOutput.timestamp !== undefined) {
      result.timestampRange = this._desensitizeTimestamp(engineOutput.timestamp)
    }

    // 特征向量：部分脱敏
    if (engineOutput.features) {
      result.features = this._desensitizeFeatures(engineOutput.features)
    }

    return result
  }

  /**
   * 脱敏时间戳到 5 分钟区间
   *
   * @param {number} timestamp - 精确时间戳（毫秒）
   * @returns {Object} { start, end, label }
   * @private
   */
  _desensitizeTimestamp(timestamp) {
    const interval = this._rules.TIMESTAMP.intervalMs
    const bucketStart = Math.floor(timestamp / interval) * interval
    const bucketEnd = bucketStart + interval

    const start = new Date(bucketStart)
    const end = new Date(bucketEnd)
    const label = `${this._pad(start.getHours())}:${this._pad(start.getMinutes())}-${this._pad(end.getHours())}:${this._pad(end.getMinutes())}`

    return {
      start: bucketStart,
      end: bucketEnd,
      label,
    }
  }

  /**
   * 心率区间化
   *
   * @param {number} bpm - 精确心率
   * @returns {Object} { min, max, label }
   * @private
   */
  _desensitizeHeartRate(bpm) {
    const bucketSize = this._rules.HEART_RATE.bucketSize
    const min = Math.floor(bpm / bucketSize) * bucketSize
    const max = min + bucketSize

    return {
      min,
      max,
      label: `${min}-${max}`,
    }
  }

  /**
   * 步数模糊化
   *
   * @param {number} steps - 精确步数
   * @returns {Object} { min, max, label }
   * @private
   */
  _desensitizeStepCount(steps) {
    const bucketSize = this._rules.STEP_COUNT.bucketSize
    const min = Math.floor(steps / bucketSize) * bucketSize
    const max = min + bucketSize

    return {
      min,
      max,
      label: `${min}-${max}`,
    }
  }

  /**
   * 持续时间区间化（5分钟）
   *
   * @param {number} seconds - 精确秒数
   * @returns {Object} { minSec, maxSec, label }
   * @private
   */
  _desensitizeDuration(seconds) {
    const intervalSec = 300 // 5 分钟
    const min = Math.floor(seconds / intervalSec) * intervalSec
    const max = min + intervalSec

    const minMin = Math.floor(min / 60)
    const maxMin = Math.floor(max / 60)

    return {
      minSec: min,
      maxSec: max,
      label: `${minMin}-${maxMin}分钟`,
    }
  }

  /**
   * 特征向量脱敏
   *
   * @param {Object} features - 原始特征
   * @returns {Object} 脱敏后的特征
   * @private
   */
  _desensitizeFeatures(features) {
    const result = {}

    // 加速度均值：添加差分隐私噪声
    if (features.accMean) {
      result.accMean = {
        x: this._addDpNoise(features.accMean.x, this._rules.MOTION_COORD),
        y: this._addDpNoise(features.accMean.y, this._rules.MOTION_COORD),
        z: this._addDpNoise(features.accMean.z, this._rules.MOTION_COORD),
      }
    }

    // 加速度方差：保留（统计特征，不敏感）
    if (features.accVar) {
      result.accVar = features.accVar
    }

    // 陀螺仪角度：添加差分隐私噪声
    if (features.gyroPitch !== undefined) {
      result.gyroPitch = this._addDpNoise(features.gyroPitch, this._rules.MOTION_COORD)
    }
    if (features.gyroRoll !== undefined) {
      result.gyroRoll = this._addDpNoise(features.gyroRoll, this._rules.MOTION_COORD)
    }

    // 主频、过零率、不对称指数：保留（统计特征）
    if (features.dominantFreq !== undefined) {
      result.dominantFreq = features.dominantFreq
    }
    if (features.zeroCrossRate !== undefined) {
      result.zeroCrossRate = features.zeroCrossRate
    }
    if (features.asymmetryIndex !== undefined) {
      result.asymmetryIndex = features.asymmetryIndex
    }

    // 姿态四元数：添加差分隐私噪声
    if (features.orientation) {
      result.orientation = {
        w: this._addDpNoise(features.orientation.w, this._rules.MOTION_COORD),
        x: this._addDpNoise(features.orientation.x, this._rules.MOTION_COORD),
        y: this._addDpNoise(features.orientation.y, this._rules.MOTION_COORD),
        z: this._addDpNoise(features.orientation.z, this._rules.MOTION_COORD),
      }
    }

    return result
  }

  /**
   * 添加差分隐私噪声
   *
   * @param {number} value - 原始值
   * @param {Object} rule - 噪声规则配置
   * @returns {number} 添加噪声后的值
   * @private
   */
  _addDpNoise(value, rule) {
    if (typeof value !== 'number' || isNaN(value)) return value
    return this._dp.addNoise(value, rule.sensitivity, rule.epsilon)
  }

  /**
   * 数字补零
   *
   * @param {number} num - 数字
   * @returns {string} 补零后的字符串
   * @private
   */
  _pad(num) {
    return String(num).padStart(2, '0')
  }

  /**
   * 更新脱敏规则
   *
   * @param {string} ruleName - 规则名称
   * @param {Object} config - 新规则配置
   */
  updateRule(ruleName, config) {
    if (this._rules[ruleName]) {
      this._rules[ruleName] = { ...this._rules[ruleName], ...config }
    }
  }

  /**
   * 获取当前规则配置（只读）
   *
   * @returns {Object} 规则配置副本
   */
  getRules() {
    return JSON.parse(JSON.stringify(this._rules))
  }
}

export default Desensitizer
