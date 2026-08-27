/**
 * ai-pose-feature.js — AI Feature 接口层
 *
 * 模拟 OpenVela Native Feature 接口，封装 AI 推理服务。
 * 快应用层通过此接口调用底层 AI 能力。
 *
 * 对外接口:
 *   aiPose.init({ modelType, modelPath })
 *   aiPose.startRecognition({ success, fail })
 *   aiPose.stopRecognition()
 *   aiPose.getCurrentPose()
 *   aiPose.setModelType(type)
 *
 * @module ai/ai-pose-feature
 */

import { IMUCollector } from '../sensors/imu-collector'
import { Preprocessor } from './preprocessor'
import { StaticCNNModel } from './static-cnn-model'
import { DynamicLSTMModel } from './dynamic-lstm-model'
import { InferenceScheduler } from './inference-scheduler'
import { POSE_TYPE, MODEL_TYPE } from './pose-model'

/**
 * AI Pose Feature 模块
 * 提供完整的 AI 体态识别服务
 */
class AiPoseFeature {
  constructor() {
    /** @type {IMUCollector} */
    this._collector = new IMUCollector()

    /** @type {Preprocessor} */
    this._preprocessor = new Preprocessor()

    /** @type {Object} 当前激活的模型 */
    this._model = null

    /** @type {string} 当前模型类型 */
    this._modelType = MODEL_TYPE.STATIC_CNN

    /** @type {InferenceScheduler} */
    this._scheduler = new InferenceScheduler()

    /** @type {Object} 当前识别结果 */
    this._currentResult = null

    /** @type {Function|null} 成功回调 */
    this._successCallback = null

    /** @type {Function|null} 失败回调 */
    this._failCallback = null

    /** @type {boolean} 是否已初始化 */
    this._initialized = false

    /** @type {boolean} 是否正在识别 */
    this._recording = false

    /** @type {Object|null} Mock 数据源 */
    this._mockSource = null
  }

  /**
   * 初始化 AI 服务
   * @param {Object} options
   * @param {string} [options.modelType='static_cnn'] - 模型类型
   * @param {string} [options.modelPath] - 模型文件路径
   * @param {Object} [options.mockSource] - Mock 数据源（演示用）
   * @returns {Promise<boolean>}
   */
  async init(options = {}) {
    if (this._initialized) return true

    const modelType = options.modelType || MODEL_TYPE.STATIC_CNN
    const modelPath = options.modelPath || '/system/models/pose_static.tflite'

    // 选择模型实现
    if (modelType === MODEL_TYPE.DYNAMIC_LSTM) {
      this._model = new DynamicLSTMModel()
    } else {
      this._model = new StaticCNNModel()
    }

    // 初始化模型
    const ok = await this._model.init(modelType, modelPath)
    if (!ok) {
      console.error('[AiPose] Model init failed')
      return false
    }

    this._modelType = modelType
    this._mockSource = options.mockSource || null
    this._initialized = true

    console.log(`[AiPose] Initialized, model: ${modelType}`)
    return true
  }

  /**
   * 开始实时识别
   * @param {Object} callbacks
   * @param {Function} [callbacks.success] - (result: PoseResult) => void
   * @param {Function} [callbacks.fail] - (err: {code, message}) => void
   */
  startRecognition(callbacks = {}) {
    if (!this._initialized) {
      callbacks.fail && callbacks.fail({ code: -1, message: 'Not initialized' })
      return
    }

    if (this._recording) return

    this._successCallback = callbacks.success || null
    this._failCallback = callbacks.fail || null
    this._recording = true

    // 重置预处理器
    this._preprocessor.reset()

    // 启动 IMU 采集
    this._collector.start({
      mockMode: !!this._mockSource,
      mockSource: this._mockSource,
      onData: (sample) => {
        // 数据到达时通知调度器
        this._scheduler.onNewData(sample)
      },
    })

    // 启动推理调度器
    this._scheduler.start({
      model: this._model,
      preprocessor: this._preprocessor,
      collector: this._collector,
      onResult: (result) => {
        this._currentResult = result
        if (this._successCallback) {
          this._successCallback(result)
        }
      },
      onStateChange: (motionState) => {
        // 状态切换时震动反馈
        console.log(`[AiPose] Motion state: ${motionState}`)
      },
    })

    console.log('[AiPose] Recognition started')
  }

  /**
   * 停止识别
   */
  stopRecognition() {
    if (!this._recording) return

    this._scheduler.stop()
    this._collector.stop()
    this._recording = false
    this._successCallback = null
    this._failCallback = null

    console.log('[AiPose] Recognition stopped')
  }

  /**
   * 获取当前一帧识别结果（同步）
   * @returns {Object|null} { pose, confidence, timestamp, modelType }
   */
  getCurrentPose() {
    return this._currentResult
  }

  /**
   * 切换模型类型（预留动态阶段）
   * @param {string} type - 模型类型
   */
  setModelType(type) {
    if (this._recording) {
      console.warn('[AiPose] Cannot switch model while recording')
      return
    }

    if (type === MODEL_TYPE.DYNAMIC_LSTM) {
      this._model = new DynamicLSTMModel()
    } else {
      this._model = new StaticCNNModel()
    }

    this._modelType = type
    this._initialized = false  // 需要重新 init
    console.log(`[AiPose] Model type set to: ${type}`)
  }

  /**
   * 切换 Mock 数据源
   * @param {Object} mockSource
   */
  setMockSource(mockSource) {
    this._mockSource = mockSource
  }

  /** @returns {boolean} 是否正在识别 */
  get isRecording() {
    return this._recording
  }

  /** @returns {string} 当前模型类型 */
  get modelType() {
    return this._modelType
  }
}

// 单例
const aiPose = new AiPoseFeature()

export { aiPose, AiPoseFeature }
