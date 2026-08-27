/**
 * post-processor.js — 后处理模块
 *
 * 支持两种任务模式：
 * - classification: 分类结果映射
 * - action_detection: 动作检测（预留）
 *
 * @module ai/post-processor
 */

import { POSE_TYPE, POSE_NAME, POSE_ICON } from './pose-model'

/**
 * 后处理器
 */
class PostProcessor {
  constructor() {
    /** @type {Array} 历史结果缓冲（用于平滑） */
    this._history = []
    this._maxHistory = 5
  }

  /**
   * 后处理推理结果
   * @param {Object} rawResult - 模型原始输出
   * @param {string} taskType - 'classification' | 'action_detection'
   * @returns {Object} 处理后的结果
   */
  process(rawResult, taskType = 'classification') {
    if (taskType === 'classification') {
      return this._classificationPostprocess(rawResult)
    }
    // action_detection 预留
    return rawResult
  }

  /**
   * 分类后处理：多帧平滑
   * @private
   */
  _classificationPostprocess(rawResult) {
    // 添加到历史
    this._history.push(rawResult)
    if (this._history.length > this._maxHistory) {
      this._history.shift()
    }

    // 多数投票平滑
    const smoothed = this._majorityVote()

    return {
      pose: smoothed.pose,
      confidence: rawResult.confidence,
      poseName: POSE_NAME[smoothed.pose] || '未知',
      poseIcon: POSE_ICON[smoothed.pose] || '❓',
      timestamp: rawResult.timestamp || Date.now(),
      modelType: rawResult.modelType || 'unknown',
      probabilities: rawResult.probabilities || [],
    }
  }

  /**
   * 多数投票（最近 N 帧中出现最多的类别）
   * @private
   */
  _majorityVote() {
    if (this._history.length === 0) {
      return { pose: POSE_TYPE.UNKNOWN }
    }

    const counts = {}
    for (const r of this._history) {
      const p = r.pose || POSE_TYPE.UNKNOWN
      counts[p] = (counts[p] || 0) + 1
    }

    let maxPose = POSE_TYPE.UNKNOWN
    let maxCount = 0
    for (const [pose, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count
        maxPose = pose
      }
    }

    return { pose: maxPose }
  }

  /**
   * 重置历史
   */
  reset() {
    this._history = []
  }
}

export { PostProcessor }
