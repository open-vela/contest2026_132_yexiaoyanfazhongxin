/**
 * posture-classifier.js - 动态阈值分类器
 *
 * 基于特征向量和动态阈值，分类当前体态类型。
 * 分类逻辑：
 * - SEDENTARY：加速度方差极低 + 持续时间超阈值
 * - FORWARD_TILT：俯仰角异常 + 持续时间超阈值
 * - CROSS_LEG：不对称指数高 + 加速度方差低
 * - NORMAL：以上均不满足
 *
 * @module core/posture-classifier
 */

import { POSTURE_TYPE } from '../common/constants/postures'

/**
 * 分类结果结构
 * @typedef {Object} ClassificationResult
 * @property {string} posture - 体态类型
 * @property {number} confidence - 置信度 (0-1)
 * @property {number} severity - 严重程度 (1-3)
 * @property {string} detail - 详细描述
 * @property {Object} metrics - 分类指标
 */

class PostureClassifier {
  /**
   * @param {Object} thresholds - 阈值配置
   */
  constructor(thresholds) {
    /** @type {Object} 当前阈值 */
    this.thresholds = thresholds

    /** @type {Object} 各体态持续时间计数器 */
    this.durationCounters = {
      sedentary: 0,
      forward_tilt: 0,
      cross_leg: 0,
    }

    /** @type {string} 上一帧的体态类型 */
    this.prevPosture = POSTURE_TYPE.NORMAL

    /** @type {number} 采样间隔（秒） */
    this.sampleInterval = 0.02 // 50Hz = 0.02s

    /** @type {number} 最大持续时间（秒） */
    this.maxDuration = 3600 // 1小时
  }

  /**
   * 更新阈值配置
   * @param {Object} thresholds - 新阈值
   */
  updateThresholds(thresholds) {
    this.thresholds = thresholds
  }

  /**
   * 分类当前体态
   * @param {Object} features - 特征向量
   * @returns {ClassificationResult} 分类结果
   */
  classify(features) {
    // 更新持续时间计数器
    this._updateDurations(features)

    // 按优先级检测各种异常体态
    // 1. 久坐检测（优先级最高）
    const sedentaryResult = this._detectSedentary(features)
    if (sedentaryResult.posture !== POSTURE_TYPE.NORMAL) {
      return sedentaryResult
    }

    // 2. 低头前倾检测
    const forwardTiltResult = this._detectForwardTilt(features)
    if (forwardTiltResult.posture !== POSTURE_TYPE.NORMAL) {
      return forwardTiltResult
    }

    // 3. 跷二郎腿检测
    const crossLegResult = this._detectCrossLeg(features)
    if (crossLegResult.posture !== POSTURE_TYPE.NORMAL) {
      return crossLegResult
    }

    // 4. 检查是否在运动
    if (this._detectWalking(features)) {
      return this._createResult(POSTURE_TYPE.WALKING, 0.8, 1, '运动中')
    }

    // 正常体态
    this._resetDurations()
    return this._createResult(POSTURE_TYPE.NORMAL, 1.0, 1, '体态正常')
  }

  /**
   * 检测久坐
   * @private
   * @param {Object} features - 特征向量
   * @returns {ClassificationResult}
   */
  _detectSedentary(features) {
    const threshold = this.thresholds.sedentary
    const avgVar = (features.accVar.x + features.accVar.y + features.accVar.z) / 3

    // 检查方差是否低于阈值
    if (avgVar < threshold.variance) {
      this.durationCounters.sedentary += this.sampleInterval

      // 检查持续时间
      if (this.durationCounters.sedentary >= threshold.time) {
        // 计算严重程度
        const severity = this._calcSeverity(
          this.durationCounters.sedentary,
          threshold.time,
          this.maxDuration
        )

        // 计算置信度
        const confidence = this._calcConfidence(
          avgVar,
          threshold.variance,
          0.001, // 最小方差
          this.durationCounters.sedentary,
          threshold.time
        )

        const detail = `已静坐 ${Math.floor(this.durationCounters.sedentary / 60)} 分钟`

        return this._createResult(POSTURE_TYPE.SEDENTARY, confidence, severity, detail, {
          avgVariance: avgVar,
          thresholdVariance: threshold.variance,
          duration: this.durationCounters.sedentary,
          thresholdDuration: threshold.time,
        })
      }
    } else {
      // 方差增大，重置计数器
      this.durationCounters.sedentary = 0
    }

    return this._createResult(POSTURE_TYPE.NORMAL, 1.0, 1, '')
  }

  /**
   * 检测低头前倾
   * @private
   * @param {Object} features - 特征向量
   * @returns {ClassificationResult}
   */
  _detectForwardTilt(features) {
    const threshold = this.thresholds.forwardTilt
    const pitch = features.gyroPitch

    // 检查俯仰角是否异常（负值表示低头）
    if (pitch < threshold.angle) {
      this.durationCounters.forward_tilt += this.sampleInterval

      // 检查持续时间
      if (this.durationCounters.forward_tilt >= threshold.time) {
        // 计算严重程度
        const severity = this._calcAngleSeverity(
          pitch,
          threshold.angle,
          -60 // 极端低头角度
        )

        // 计算置信度
        const confidence = this._calcAngleConfidence(
          pitch,
          threshold.angle,
          -60
        )

        const detail = `低头前倾 ${Math.abs(pitch).toFixed(0)}°`

        return this._createResult(POSTURE_TYPE.FORWARD_TILT, confidence, severity, detail, {
          pitch,
          thresholdAngle: threshold.angle,
          duration: this.durationCounters.forward_tilt,
          thresholdDuration: threshold.time,
        })
      }
    } else {
      // 角度恢复，重置计数器
      this.durationCounters.forward_tilt = 0
    }

    return this._createResult(POSTURE_TYPE.NORMAL, 1.0, 1, '')
  }

  /**
   * 检测跷二郎腿
   * @private
   * @param {Object} features - 特征向量
   * @returns {ClassificationResult}
   */
  _detectCrossLeg(features) {
    const threshold = this.thresholds.crossLeg
    const avgVar = (features.accVar.x + features.accVar.y + features.accVar.z) / 3

    // 检查不对称指数和方差
    if (features.asymmetryIndex > threshold.asymmetry && avgVar < threshold.variance) {
      this.durationCounters.cross_leg += this.sampleInterval

      // 检查持续时间
      if (this.durationCounters.cross_leg >= threshold.time) {
        // 计算严重程度
        const severity = this._calcAsymmetrySeverity(
          features.asymmetryIndex,
          threshold.asymmetry,
          0.5 // 极端不对称
        )

        // 计算置信度
        const confidence = this._calcAsymmetryConfidence(
          features.asymmetryIndex,
          threshold.asymmetry,
          0.5
        )

        const detail = '疑似跷二郎腿'

        return this._createResult(POSTURE_TYPE.CROSS_LEG, confidence, severity, detail, {
          asymmetryIndex: features.asymmetryIndex,
          thresholdAsymmetry: threshold.asymmetry,
          avgVariance: avgVar,
          thresholdVariance: threshold.variance,
          duration: this.durationCounters.cross_leg,
          thresholdDuration: threshold.time,
        })
      }
    } else {
      // 条件不满足，重置计数器
      this.durationCounters.cross_leg = 0
    }

    return this._createResult(POSTURE_TYPE.NORMAL, 1.0, 1, '')
  }

  /**
   * 检测行走
   * @private
   * @param {Object} features - 特征向量
   * @returns {boolean}
   */
  _detectWalking(features) {
    const avgVar = (features.accVar.x + features.accVar.y + features.accVar.z) / 3

    // 行走特征：加速度方差较高
    return avgVar > 0.1
  }

  /**
   * 更新持续时间计数器
   * @private
   * @param {Object} features - 特征向量
   */
  _updateDurations(features) {
    // 这里可以添加更复杂的持续时间逻辑
    // 目前在各检测函数中直接更新
  }

  /**
   * 重置持续时间计数器
   * @private
   */
  _resetDurations() {
    this.durationCounters.sedentary = 0
    this.durationCounters.forward_tilt = 0
    this.durationCounters.cross_leg = 0
  }

  /**
   * 计算严重程度（基于方差/时间）
   * @private
   * @param {number} value - 当前值
   * @param {number} threshold - 阈值
   * @param {number} maxValue - 最大值
   * @returns {number} 1-3
   */
  _calcSeverity(value, threshold, maxValue) {
    const ratio = value / threshold
    if (ratio < 1.5) return 1
    if (ratio < 3) return 2
    return 3
  }

  /**
   * 计算角度严重程度
   * @private
   * @param {number} angle - 当前角度
   * @param {number} threshold - 阈值角度
   * @param {number} extremeAngle - 极端角度
   * @returns {number} 1-3
   */
  _calcAngleSeverity(angle, threshold, extremeAngle) {
    const range = Math.abs(threshold - extremeAngle)
    const deviation = Math.abs(angle - threshold)
    const ratio = deviation / range

    if (ratio < 0.33) return 1
    if (ratio < 0.66) return 2
    return 3
  }

  /**
   * 计算不对称严重程度
   * @private
   * @param {number} asymmetry - 当前不对称指数
   * @param {number} threshold - 阈值
   * @param {number} extremeValue - 极端值
   * @returns {number} 1-3
   */
  _calcAsymmetrySeverity(asymmetry, threshold, extremeValue) {
    const range = extremeValue - threshold
    const deviation = asymmetry - threshold
    const ratio = deviation / range

    if (ratio < 0.33) return 1
    if (ratio < 0.66) return 2
    return 3
  }

  /**
   * 计算置信度（基于方差）
   * @private
   * @param {number} value - 当前值
   * @param {number} threshold - 阈值
   * @param {number} minValue - 最小值
   * @param {number} duration - 持续时间
   * @param {number} thresholdDuration - 持续时间阈值
   * @returns {number} 0-1
   */
  _calcConfidence(value, threshold, minValue, duration, thresholdDuration) {
    // 基于偏离程度
    const valueConfidence = 1 - (value / threshold)
    // 基于持续时间
    const durationConfidence = Math.min(1, duration / (thresholdDuration * 2))

    return Math.min(0.95, 0.5 + valueConfidence * 0.25 + durationConfidence * 0.25)
  }

  /**
   * 计算角度置信度
   * @private
   * @param {number} angle - 当前角度
   * @param {number} threshold - 阈值角度
   * @param {number} extremeAngle - 极端角度
   * @returns {number} 0-1
   */
  _calcAngleConfidence(angle, threshold, extremeAngle) {
    const range = Math.abs(threshold - extremeAngle)
    const deviation = Math.abs(angle - threshold)
    const ratio = Math.min(1, deviation / range)

    return Math.min(0.9, 0.6 + ratio * 0.3)
  }

  /**
   * 计算不对称置信度
   * @private
   * @param {number} asymmetry - 当前不对称指数
   * @param {number} threshold - 阈值
   * @param {number} extremeValue - 极端值
   * @returns {number} 0-1
   */
  _calcAsymmetryConfidence(asymmetry, threshold, extremeValue) {
    const range = extremeValue - threshold
    const deviation = asymmetry - threshold
    const ratio = Math.min(1, deviation / range)

    return Math.min(0.85, 0.55 + ratio * 0.3)
  }

  /**
   * 创建分类结果对象
   * @private
   * @param {string} posture - 体态类型
   * @param {number} confidence - 置信度
   * @param {number} severity - 严重程度
   * @param {string} detail - 详细描述
   * @param {Object} [metrics] - 分类指标
   * @returns {ClassificationResult}
   */
  _createResult(posture, confidence, severity, detail, metrics = {}) {
    return {
      posture,
      confidence: Math.round(confidence * 100) / 100,
      severity,
      detail,
      metrics,
    }
  }
}

export { PostureClassifier }
export default PostureClassifier
