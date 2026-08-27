/**
 * static-cnn-model.js — 静态 CNN 模型实现
 *
 * 模拟 1D-CNN 推理，使用规则+权重矩阵实现体态分类。
 * 在真实部署中，此处替换为 TensorFlow Lite Micro 调用。
 *
 * 模型结构（模拟）：
 * 输入: 21 维特征向量（从预处理器提取）
 * 输出: 7 类概率分布
 *
 * @module ai/static-cnn-model
 */

import { PoseModel, POSE_TYPE, MODEL_TYPE } from './pose-model'

/**
 * 类别顺序（与输出节点对应）
 */
const CLASS_ORDER = [
  POSE_TYPE.STANDARD_SIT,
  POSE_TYPE.HUNCHED_SIT,
  POSE_TYPE.STANDARD_STAND,
  POSE_TYPE.WALKING,
  POSE_TYPE.RUNNING,
  POSE_TYPE.STILL,
  POSE_TYPE.UNKNOWN,
]

/**
 * 模拟的分类权重（基于特征阈值的规则引擎）
 * 真实场景中这些权重来自训练好的 CNN 模型
 */
const CLASSIFICATION_RULES = {
  // 运动强度阈值
  MOTION_WALKING: 0.8,
  MOTION_RUNNING: 2.5,
  MOTION_STILL: 0.15,

  // 加速度 Z 轴特征（坐姿 vs 站姿）
  ACC_Z_SIT: -7.0,   // 坐姿时 Z 轴绝对值较小
  ACC_Z_STAND: -9.0,  // 站姿时 Z 轴接近重力

  // 陀螺仪俯仰角（驼背检测）
  GYRO_PITCH_HUNCH: -15,  // 低头/驼背时俯仰角负值更大

  // 主频率（行走/跑步区分）
  FREQ_WALKING: 1.5,
  FREQ_RUNNING: 2.5,
}

class StaticCNNModel extends PoseModel {
  constructor() {
    super()
    this._modelType = MODEL_TYPE.STATIC_CNN
    this._initialized = false
  }

  /**
   * 初始化模型
   * @returns {Promise<boolean>}
   */
  async init() {
    this._initialized = true
    console.log('[StaticCNNModel] Initialized (rule-based simulation)')
    return true
  }

  /**
   * 预处理：直接使用预处理器输出的特征向量
   * @param {Array} featureVector - 21 维特征
   * @returns {Array} 归一化后的张量
   */
  preprocess(featureVector) {
    if (!featureVector || featureVector.length !== 21) return null

    // 简单归一化（模拟 INT8 量化）
    return featureVector.map(v => Math.max(-1, Math.min(1, v / 10)))
  }

  /**
   * 前向推理：基于规则的分类（模拟 CNN 输出）
   * @param {Array} inputTensor - 归一化后的特征
   * @returns {Array} 7 类概率
   */
  infer(inputTensor) {
    if (!inputTensor || inputTensor.length !== 21) {
      return [0, 0, 0, 0, 0, 0, 1]  // 默认 unknown
    }

    // 提取关键特征
    const accMeanZ = inputTensor[2] * 10   // 还原归一化
    const accStdX = inputTensor[3] * 10
    const accStdY = inputTensor[4] * 10
    const accStdZ = inputTensor[5] * 10
    const gyroMeanY = inputTensor[13] * 10
    const dominantFreq = inputTensor[18] * 10
    const motionIntensity = inputTensor[20] * 10

    // 计算各类别得分
    const scores = [0, 0, 0, 0, 0, 0, 0]
    const R = CLASSIFICATION_RULES

    // 运动强度分类
    if (motionIntensity > R.MOTION_RUNNING) {
      scores[4] += 3  // running
      scores[3] += 1
    } else if (motionIntensity > R.MOTION_WALKING) {
      scores[3] += 3  // walking
      if (dominantFreq > R.FREQ_RUNNING) scores[4] += 2
    } else if (motionIntensity < R.MOTION_STILL) {
      scores[5] += 3  // still
    }

    // 姿态分类（静止/坐姿场景）
    if (motionIntensity < R.MOTION_WALKING) {
      if (accMeanZ > R.ACC_Z_STAND) {
        // Z 轴接近重力 → 站姿
        scores[2] += 2  // standard_stand
      } else {
        // Z 轴绝对值减小 → 坐姿
        scores[0] += 2  // standard_sit
        scores[1] += 1

        // 驼背检测（俯仰角异常）
        if (gyroMeanY < R.GYRO_PITCH_HUNCH) {
          scores[1] += 2  // hunched_sit
          scores[0] -= 1
        }
      }
    }

    // 加速度方差辅助判断
    const totalVar = accStdX + accStdY + accStdZ
    if (totalVar < 0.3) {
      scores[5] += 1  // 非常静止
    }

    // Softmax 归一化
    return this._softmax(scores)
  }

  /**
   * 后处理：概率 → 分类结果
   * @param {Array} probabilities - 7 类概率
   * @returns {Object} { pose, confidence, probabilities }
   */
  postprocess(probabilities) {
    if (!probabilities || probabilities.length !== 7) {
      return {
        pose: POSE_TYPE.UNKNOWN,
        confidence: 0,
        probabilities: [0, 0, 0, 0, 0, 0, 1],
      }
    }

    // 找最大概率类别
    let maxIdx = 0
    let maxVal = probabilities[0]
    for (let i = 1; i < probabilities.length; i++) {
      if (probabilities[i] > maxVal) {
        maxVal = probabilities[i]
        maxIdx = i
      }
    }

    return {
      pose: CLASS_ORDER[maxIdx],
      confidence: maxVal,
      probabilities: probabilities,
    }
  }

  /**
   * 完整推理流程
   * @param {Array} featureVector - 21 维特征向量
   * @returns {Object} 推理结果
   */
  predict(featureVector) {
    const tensor = this.preprocess(featureVector)
    const probs = this.infer(tensor)
    const result = this.postprocess(probs)
    result.timestamp = Date.now()
    result.modelType = this._modelType
    return result
  }

  release() {
    this._initialized = false
  }

  // ── 内部方法 ──

  _softmax(scores) {
    const max = Math.max(...scores)
    const exps = scores.map(s => Math.exp(s - max))
    const sum = exps.reduce((a, b) => a + b, 0)
    return exps.map(e => e / sum)
  }
}

export { StaticCNNModel, CLASS_ORDER }
