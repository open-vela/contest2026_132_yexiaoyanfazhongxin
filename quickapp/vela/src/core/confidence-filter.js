/**
 * confidence-filter.js - 多帧确认与置信度过滤
 *
 * 实现多帧确认机制：连续3帧（约1秒）置信度均>0.8才确认异常。
 * 若置信度低于0.6，直接判定为NORMAL，不进入确认流程。
 *
 * @module core/confidence-filter
 */

import { POSTURE_TYPE } from '../common/constants/postures'

/**
 * 过滤结果结构
 * @typedef {Object} FilterResult
 * @property {boolean} confirmed - 是否确认异常
 * @property {string} posture - 体态类型
 * @property {number} confidence - 置信度 (0-1)
 * @property {number} duration - 持续时间（秒）
 * @property {number} severity - 严重程度 (1-3)
 * @property {string} detail - 详细描述
 */

class ConfidenceFilter {
  /**
   * @param {Object} options - 配置选项
   * @param {number} [options.confirmFrames=3] - 确认所需连续帧数
   * @param {number} [options.highConfidence=0.8] - 高置信度阈值
   * @param {number} [options.lowConfidence=0.6] - 低置信度阈值
   */
  constructor(options = {}) {
    /** @type {number} 确认所需连续帧数 */
    this.confirmFrames = options.confirmFrames || 3

    /** @type {number} 高置信度阈值 */
    this.highConfidence = options.highConfidence || 0.8

    /** @type {number} 低置信度阈值 */
    this.lowConfidence = options.lowConfidence || 0.6

    /** @type {Array} 历史分类结果缓冲区 */
    this.historyBuffer = []

    /** @type {number} 历史缓冲区最大长度 */
    this.maxHistorySize = 10

    /** @type {Object|null} 当前确认的异常体态 */
    this.confirmedAbnormal = null

    /** @type {number} 异常开始时间戳 */
    this.abnormalStartTime = 0

    /** @type {number} 帧间隔（秒） */
    this.frameInterval = 0.02 // 50Hz = 0.02s
  }

  /**
   * 输入分类结果并进行过滤
   * @param {Object} classification - 分类器输出 { posture, confidence, severity, detail, metrics }
   * @returns {FilterResult} 过滤结果
   */
  filter(classification) {
    const { posture, confidence, severity, detail, metrics } = classification

    // 添加到历史缓冲区
    this._addToHistory(classification)

    // 1. 低置信度直接判定为NORMAL
    if (confidence < this.lowConfidence) {
      this._resetAbnormal()
      return this._createResult(false, POSTURE_TYPE.NORMAL, confidence, 0, 1, '置信度不足')
    }

    // 2. 正常体态，重置异常状态
    if (posture === POSTURE_TYPE.NORMAL || posture === POSTURE_TYPE.WALKING) {
      this._resetAbnormal()
      return this._createResult(false, posture, confidence, 0, severity, detail)
    }

    // 3. 异常体态，检查是否需要多帧确认
    const isSameAbnormal = this.confirmedAbnormal &&
      this.confirmedAbnormal.posture === posture

    if (isSameAbnormal) {
      // 同一异常持续中
      const duration = this._calcDuration()
      const confirmed = this._checkConfirmation()

      if (confirmed) {
        return this._createResult(true, posture, confidence, duration, severity, detail)
      } else {
        return this._createResult(false, posture, confidence, duration, severity, `等待确认: ${detail}`)
      }
    } else {
      // 新的异常类型
      this._startAbnormal(posture, confidence, severity, detail, metrics)
      const duration = this.frameInterval

      // 检查是否立即确认（置信度很高时可以快速确认）
      if (confidence >= 0.9 && this._checkQuickConfirm(posture)) {
        return this._createResult(true, posture, confidence, duration, severity, detail)
      }

      return this._createResult(false, posture, confidence, duration, severity, `检测到: ${detail}`)
    }
  }

  /**
   * 检查多帧确认
   * @private
   * @returns {boolean} 是否确认
   */
  _checkConfirmation() {
    const recentFrames = this.historyBuffer.slice(-this.confirmFrames)

    // 检查最近N帧是否都是同一异常且置信度达标
    if (recentFrames.length < this.confirmFrames) {
      return false
    }

    return recentFrames.every(frame =>
      frame.posture === this.confirmedAbnormal.posture &&
      frame.confidence >= this.highConfidence
    )
  }

  /**
   * 快速确认检查（高置信度情况）
   * @private
   * @param {string} posture - 体态类型
   * @returns {boolean} 是否快速确认
   */
  _checkQuickConfirm(posture) {
    // 检查最近2帧是否都是同一异常
    const recentFrames = this.historyBuffer.slice(-2)
    return recentFrames.length >= 2 &&
      recentFrames.every(frame => frame.posture === posture)
  }

  /**
   * 开始新的异常记录
   * @private
   * @param {string} posture - 体态类型
   * @param {number} confidence - 置信度
   * @param {number} severity - 严重程度
   * @param {string} detail - 详细描述
   * @param {Object} metrics - 分类指标
   */
  _startAbnormal(posture, confidence, severity, detail, metrics) {
    this.confirmedAbnormal = {
      posture,
      confidence,
      severity,
      detail,
      metrics,
    }
    this.abnormalStartTime = Date.now()
  }

  /**
   * 重置异常状态
   * @private
   */
  _resetAbnormal() {
    this.confirmedAbnormal = null
    this.abnormalStartTime = 0
  }

  /**
   * 计算异常持续时间
   * @private
   * @returns {number} 持续时间（秒）
   */
  _calcDuration() {
    if (this.abnormalStartTime === 0) return 0
    return (Date.now() - this.abnormalStartTime) / 1000
  }

  /**
   * 添加到历史缓冲区
   * @private
   * @param {Object} classification - 分类结果
   */
  _addToHistory(classification) {
    this.historyBuffer.push({
      posture: classification.posture,
      confidence: classification.confidence,
      timestamp: Date.now(),
    })

    // 限制缓冲区大小
    if (this.historyBuffer.length > this.maxHistorySize) {
      this.historyBuffer.shift()
    }
  }

  /**
   * 创建过滤结果对象
   * @private
   * @param {boolean} confirmed - 是否确认
   * @param {string} posture - 体态类型
   * @param {number} confidence - 置信度
   * @param {number} duration - 持续时间
   * @param {number} severity - 严重程度
   * @param {string} detail - 详细描述
   * @returns {FilterResult}
   */
  _createResult(confirmed, posture, confidence, duration, severity, detail) {
    return {
      confirmed,
      posture,
      confidence: Math.round(confidence * 100) / 100,
      duration: Math.round(duration * 10) / 10,
      severity,
      detail,
    }
  }

  /**
   * 获取当前状态
   * @returns {{hasAbnormal: boolean, abnormalType: string|null, duration: number}}
   */
  getStatus() {
    return {
      hasAbnormal: this.confirmedAbnormal !== null,
      abnormalType: this.confirmedAbnormal ? this.confirmedAbnormal.posture : null,
      duration: this._calcDuration(),
    }
  }

  /**
   * 重置过滤器
   */
  reset() {
    this.historyBuffer = []
    this.confirmedAbnormal = null
    this.abnormalStartTime = 0
  }
}

export { ConfidenceFilter }
export default ConfidenceFilter
