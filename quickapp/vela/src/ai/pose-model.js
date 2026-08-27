/**
 * pose-model.js — 模型抽象接口
 *
 * 定义 AI 推理层的统一接口，支持多种模型实现：
 * - static_cnn: 静态体态分类（1D-CNN）
 * - dynamic_lstm: 动态动作识别（LSTM，预留）
 *
 * @module ai/pose-model
 */

/**
 * 体态类别枚举
 */
const POSE_TYPE = {
  STANDARD_SIT: 'standard_sit',     // 标准坐姿
  HUNCHED_SIT: 'hunched_sit',       // 驼背坐姿
  STANDARD_STAND: 'standard_stand', // 标准站姿
  WALKING: 'walking',               // 行走中
  RUNNING: 'running',               // 跑步中
  STILL: 'still',                   // 静止/躺卧
  UNKNOWN: 'unknown',               // 未知/过渡
}

/**
 * 体态类型中文名映射
 */
const POSE_NAME = {
  [POSE_TYPE.STANDARD_SIT]: '标准坐姿',
  [POSE_TYPE.HUNCHED_SIT]: '驼背坐姿',
  [POSE_TYPE.STANDARD_STAND]: '标准站姿',
  [POSE_TYPE.WALKING]: '行走中',
  [POSE_TYPE.RUNNING]: '跑步中',
  [POSE_TYPE.STILL]: '静止',
  [POSE_TYPE.UNKNOWN]: '未知',
}

/**
 * 体态类型图标映射
 */
const POSE_ICON = {
  [POSE_TYPE.STANDARD_SIT]: '🪑',
  [POSE_TYPE.HUNCHED_SIT]: '😮‍💨',
  [POSE_TYPE.STANDARD_STAND]: '🧍',
  [POSE_TYPE.WALKING]: '🚶',
  [POSE_TYPE.RUNNING]: '🏃',
  [POSE_TYPE.STILL]: '😴',
  [POSE_TYPE.UNKNOWN]: '❓',
}

/**
 * 模型类型枚举
 */
const MODEL_TYPE = {
  STATIC_CNN: 'static_cnn',
  DYNAMIC_LSTM: 'dynamic_lstm',
}

/**
 * 推理结果结构
 * @typedef {Object} PoseResult
 * @property {string} pose - 体态类型
 * @property {number} confidence - 置信度 0-1
 * @property {number} timestamp - 时间戳
 * @property {string} modelType - 使用的模型类型
 * @property {Array} probabilities - 各类别概率
 */

/**
 * 模型抽象基类
 * 所有模型实现必须继承此类
 */
class PoseModel {
  /**
   * 初始化模型
   * @param {string} modelType - 模型类型
   * @param {string} modelPath - 模型文件路径
   * @returns {Promise<boolean>}
   */
  async init(modelType, modelPath) {
    throw new Error('init() must be implemented')
  }

  /**
   * 预处理输入数据
   * @param {Array} rawData - 原始特征向量
   * @param {string} dataType - 数据类型 'window' | 'sequence'
   * @returns {Array} 预处理后的张量
   */
  preprocess(rawData, dataType) {
    throw new Error('preprocess() must be implemented')
  }

  /**
   * 前向推理
   * @param {Array} inputTensor - 输入张量
   * @returns {Array} 输出张量（各类别概率）
   */
  infer(inputTensor) {
    throw new Error('infer() must be implemented')
  }

  /**
   * 后处理
   * @param {Array} outputTensor - 输出张量
   * @param {string} taskType - 任务类型 'classification' | 'action_detection'
   * @returns {PoseResult} 推理结果
   */
  postprocess(outputTensor, taskType) {
    throw new Error('postprocess() must be implemented')
  }

  /**
   * 释放资源
   */
  release() {
    // 默认空实现
  }
}

export { PoseModel, POSE_TYPE, POSE_NAME, POSE_ICON, MODEL_TYPE }
