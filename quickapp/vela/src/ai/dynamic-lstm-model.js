/**
 * dynamic-lstm-model.js — 动态 LSTM 模型（预留接口）
 *
 * 第二阶段实现，当前为空实现。
 * 接口与 StaticCNNModel 一致，替换模型文件和配置即可激活。
 *
 * @module ai/dynamic-lstm-model
 */

import { PoseModel, POSE_TYPE, MODEL_TYPE } from './pose-model'

class DynamicLSTMModel extends PoseModel {
  constructor() {
    super()
    this._modelType = MODEL_TYPE.DYNAMIC_LSTM
    this._initialized = false
  }

  async init() {
    this._initialized = true
    console.log('[DynamicLSTMModel] Initialized (placeholder)')
    return true
  }

  preprocess(rawData, dataType) {
    // 第二阶段实现：处理不定长序列
    console.warn('[DynamicLSTMModel] preprocess not implemented yet')
    return rawData
  }

  infer(inputTensor) {
    // 第二阶段实现：LSTM 前向推理
    console.warn('[DynamicLSTMModel] infer not implemented yet')
    return [0, 0, 0, 0, 0, 0, 1]
  }

  postprocess(outputTensor, taskType) {
    // 第二阶段实现：动作检测后处理
    console.warn('[DynamicLSTMModel] postprocess not implemented yet')
    return {
      pose: POSE_TYPE.UNKNOWN,
      confidence: 0,
      timestamp: Date.now(),
      modelType: this._modelType,
      probabilities: [0, 0, 0, 0, 0, 0, 1],
    }
  }

  release() {
    this._initialized = false
  }
}

export { DynamicLSTMModel }
