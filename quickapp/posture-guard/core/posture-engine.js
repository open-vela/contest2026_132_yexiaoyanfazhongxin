/**
 * posture-engine.js - 体态识别主引擎
 *
 * 整合所有核心模块，提供统一的start()/stop()接口。
 * 内部维护滑动窗口缓冲区，支持50%重叠步进。
 * 订阅sensor-interface的数据流，驱动整个推理pipeline。
 *
 * @module core/posture-engine
 */

import { FeatureExtractor } from './feature-extractor'
import { PostureClassifier } from './posture-classifier'
import { ConfidenceFilter } from './confidence-filter'
import { AdaptiveThreshold } from './adaptive-threshold'
import { AlertTrigger } from './alert-trigger'
import { POSTURE_TYPE } from '../common/constants/postures'

/**
 * 引擎状态枚举
 * @readonly
 */
const ENGINE_STATE = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
}

class PostureEngine {
  /**
   * @param {Object} options - 配置选项
   * @param {Object} [options.sensorInterface] - 传感器接口实例
   * @param {number} [options.windowSize=250] - 滑动窗口大小
   * @param {number} [options.sampleRate=50] - 采样率
   */
  constructor(options = {}) {
    /** @type {Object} 传感器接口 */
    this.sensorInterface = options.sensorInterface || null

    /** @type {string} 引擎状态 */
    this.state = ENGINE_STATE.IDLE

    /** @type {FeatureExtractor} 特征提取器 */
    this.featureExtractor = new FeatureExtractor({
      windowSize: options.windowSize || 250,
      sampleRate: options.sampleRate || 50,
    })

    /** @type {PostureClassifier} 分类器 */
    this.classifier = null

    /** @type {ConfidenceFilter} 置信度过滤器 */
    this.confidenceFilter = new ConfidenceFilter()

    /** @type {AdaptiveThreshold} 自适应阈值 */
    this.adaptiveThreshold = new AdaptiveThreshold()

    /** @type {AlertTrigger} 提醒触发器 */
    this.alertTrigger = new AlertTrigger()

    /** @type {Object|null} 最新分类结果 */
    this.latestResult = null

    /** @type {Object|null} 最新过滤结果 */
    this.latestFilterResult = null

    /** @type {Function|null} 结果回调 */
    this.onResult = null

    /** @type {Function|null} 事件回调 */
    this.onEvent = null

    /** @type {number} 帧计数器 */
    this.frameCount = 0

    /** @type {number} 推理开始时间 */
    this.inferenceStartTime = 0

    /** @type {Array} 推理延迟记录（用于性能统计） */
    this.latencyRecords = []

    /** @type {Object} 统计信息 */
    this.stats = {
      totalFrames: 0,
      detections: {
        normal: 0,
        sedentary: 0,
        forward_tilt: 0,
        cross_leg: 0,
        walking: 0,
      },
      alerts: {
        level1: 0,
        level2: 0,
        level3: 0,
      },
    }
  }

  /**
   * 初始化引擎
   * @returns {Promise<void>}
   */
  async init() {
    // 初始化自适应阈值
    await this.adaptiveThreshold.init()

    // 使用当前阈值初始化分类器
    const thresholds = this.adaptiveThreshold.getCurrentThresholds()
    this.classifier = new PostureClassifier(thresholds)

    // 设置提醒事件回调
    this.alertTrigger.onEvent = (eventType, event) => {
      this._handleAlertEvent(eventType, event)
    }

    console.log('[PostureEngine] Initialized')
  }

  /**
   * 启动引擎
   * @param {Object} [options] - 启动选项
   * @param {boolean} [options.mockMode=false] - 是否使用Mock模式
   * @param {Object} [options.mockSource] - Mock数据源
   * @returns {boolean} 是否成功启动
   */
  start(options = {}) {
    if (this.state === ENGINE_STATE.RUNNING) {
      console.warn('[PostureEngine] Already running')
      return false
    }

    // 重置状态
    this.featureExtractor.reset()
    this.confidenceFilter.reset()
    this.frameCount = 0
    this.latencyRecords = []

    // 订阅传感器数据
    if (this.sensorInterface) {
      this.sensorInterface.onData((data) => {
        this._processFrame(data)
      })
    }

    this.state = ENGINE_STATE.RUNNING
    console.log('[PostureEngine] Started')
    return true
  }

  /**
   * 停止引擎
   * @returns {boolean} 是否成功停止
   */
  stop() {
    if (this.state === ENGINE_STATE.IDLE) {
      return true
    }

    // 取消传感器订阅
    if (this.sensorInterface) {
      this.sensorInterface.onData(null)
    }

    // 保存历史数据
    this.adaptiveThreshold.saveHistory()

    this.state = ENGINE_STATE.IDLE
    console.log('[PostureEngine] Stopped')
    return true
  }

  /**
   * 暂停引擎
   */
  pause() {
    if (this.state === ENGINE_STATE.RUNNING) {
      this.state = ENGINE_STATE.PAUSED
      console.log('[PostureEngine] Paused')
    }
  }

  /**
   * 恢复引擎
   */
  resume() {
    if (this.state === ENGINE_STATE.PAUSED) {
      this.state = ENGINE_STATE.RUNNING
      console.log('[PostureEngine] Resumed')
    }
  }

  /**
   * 处理一帧传感器数据
   * @private
   * @param {Object} data - 传感器数据 { timestamp, acc, gyro, hr }
   */
  _processFrame(data) {
    if (this.state !== ENGINE_STATE.RUNNING) return

    // 记录推理开始时间
    this.inferenceStartTime = Date.now()

    // 1. 特征提取
    const features = this.featureExtractor.input(data)
    if (!features) {
      // 窗口未满，跳过分类
      return
    }

    // 2. 分类
    const classification = this.classifier.classify(features)

    // 3. 置信度过滤
    const filterResult = this.confidenceFilter.filter(classification)

    // 4. 记录统计
    this._updateStats(filterResult)

    // 5. 触发提醒
    if (filterResult.confirmed) {
      this.alertTrigger.trigger(filterResult)
    }

    // 6. 更新自适应阈值
    if (filterResult.confirmed && filterResult.duration > 0) {
      this.adaptiveThreshold.recordDetection(
        filterResult.posture,
        features,
        filterResult.duration
      )
    }

    // 7. 记录结果
    this.latestResult = classification
    this.latestFilterResult = filterResult

    // 8. 计算推理延迟
    const latency = Date.now() - this.inferenceStartTime
    this.latencyRecords.push(latency)
    if (this.latencyRecords.length > 100) {
      this.latencyRecords.shift()
    }

    // 9. 触发结果回调
    if (this.onResult) {
      this.onResult(filterResult, features)
    }

    this.frameCount++
  }

  /**
   * 处理提醒事件
   * @private
   * @param {string} eventType - 事件类型
   * @param {Object} event - 事件数据
   */
  _handleAlertEvent(eventType, event) {
    // 更新统计
    if (event.severity === 1) this.stats.alerts.level1++
    else if (event.severity === 2) this.stats.alerts.level2++
    else if (event.severity === 3) this.stats.alerts.level3++

    // 触发事件回调
    if (this.onEvent) {
      this.onEvent(eventType, event)
    }
  }

  /**
   * 更新统计信息
   * @private
   * @param {Object} filterResult - 过滤结果
   */
  _updateStats(filterResult) {
    this.stats.totalFrames++

    const posture = filterResult.posture
    if (this.stats.detections[posture] !== undefined) {
      this.stats.detections[posture]++
    }
  }

  /**
   * 获取最新结果
   * @returns {{classification: Object, filter: Object}}
   */
  getLatestResult() {
    return {
      classification: this.latestResult,
      filter: this.latestFilterResult,
    }
  }

  /**
   * 获取统计信息
   * @returns {Object}
   */
  getStats() {
    const avgLatency = this.latencyRecords.length > 0
      ? this.latencyRecords.reduce((a, b) => a + b, 0) / this.latencyRecords.length
      : 0

    const maxLatency = this.latencyRecords.length > 0
      ? Math.max(...this.latencyRecords)
      : 0

    return {
      ...this.stats,
      frameCount: this.frameCount,
      avgLatency: Math.round(avgLatency * 100) / 100,
      maxLatency,
      alertStatus: this.alertTrigger.getStatus(),
    }
  }

  /**
   * 获取当前体态状态（简化接口，用于UI）
   * @returns {Object}
   */
  getCurrentPosture() {
    if (!this.latestFilterResult) {
      return {
        type: POSTURE_TYPE.NORMAL,
        name: '等待数据...',
        icon: '⏳',
        confidence: 0,
        severity: 1,
        confirmed: false,
        detail: '',
      }
    }

    const result = this.latestFilterResult
    const names = {
      normal: '正常',
      sedentary: '久坐',
      forward_tilt: '低头前倾',
      cross_leg: '跷二郎腿',
      walking: '行走中',
    }

    const icons = {
      normal: '😊',
      sedentary: '🪑',
      forward_tilt: '📱',
      cross_leg: '🦵',
      walking: '🚶',
    }

    return {
      type: result.posture,
      name: names[result.posture] || '未知',
      icon: icons[result.posture] || '❓',
      confidence: result.confidence,
      severity: result.severity,
      confirmed: result.confirmed,
      detail: result.detail,
      duration: result.duration,
    }
  }

  /**
   * 更新阈值
   * @param {Object} thresholds - 新阈值
   */
  updateThresholds(thresholds) {
    this.adaptiveThreshold.currentThresholds = thresholds
    this.classifier.updateThresholds(thresholds)
    console.log('[PostureEngine] Thresholds updated')
  }

  /**
   * 设置提醒静音
   * @param {boolean} muted - 是否静音
   */
  setAlertMuted(muted) {
    this.alertTrigger.setMuted(muted)
  }

  /**
   * 检查日期更新
   */
  checkDateUpdate() {
    this.adaptiveThreshold.checkDateUpdate()
  }
}

export { PostureEngine, ENGINE_STATE }
export default PostureEngine
