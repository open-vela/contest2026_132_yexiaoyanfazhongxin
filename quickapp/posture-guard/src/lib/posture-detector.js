/**
 * posture-detector.js - 端侧AI体态识别算法
 *
 * 基于加速度计三轴数据的轻量化时序分析：
 * - 久坐检测：加速度方差极低 + 持续时间
 * - 低头前倾检测：z轴重力分量异常
 * - 跷二郎腿检测：x轴偏移 + y轴周期性微振
 *
 * 算法特点：
 * - 纯规则引擎，无需神经网络推理
 * - 滑动窗口统计（2秒窗口，~100样本）
 * - 低功耗：仅在采样时计算
 */

// 体态类型常量
const POSTURE_TYPE = {
  NORMAL: 'normal',
  SEDENTARY: 'sedentary',       // 久坐
  HEAD_TILT: 'head_tilt',       // 低头前倾
  LEG_CROSS: 'leg_cross',       // 跷二郎腿
}

// 体态类型中文名
const POSTURE_NAME = {
  [POSTURE_TYPE.NORMAL]: '正常',
  [POSTURE_TYPE.SEDENTARY]: '久坐',
  [POSTURE_TYPE.HEAD_TILT]: '低头前倾',
  [POSTURE_TYPE.LEG_CROSS]: '跷二郎腿',
}

class PostureDetector {
  constructor(options = {}) {
    // 滑动窗口大小（样本数）
    this.windowSize = options.windowSize || 100
    // 久坐提醒阈值（毫秒），默认30分钟
    this.sedentaryThreshold = options.sedentaryThreshold || 30 * 60 * 1000
    // 数据缓冲区
    this.buffer = []
    // 久坐起始时间
    this.sitStartTime = null
    // 今日久坐总时长（毫秒）
    this.todaySedentaryMs = 0
    // 上次检测时间
    this.lastDetectTime = 0
    // 检测结果回调
    this.onDetect = null
    // 状态变更回调
    this.onStateChange = null
  }

  /**
   * 输入加速度计样本数据
   * @param {Object} sample - { x: number, y: number, z: number }
   * @returns {Object} 检测结果 { type, confidence, detail }
   */
  input(sample) {
    const now = Date.now()
    // 控制检测频率，最多每200ms检测一次
    if (now - this.lastDetectTime < 200) {
      return null
    }
    this.lastDetectTime = now

    // 添加到滑动窗口
    this.buffer.push({
      x: sample.x,
      y: sample.y,
      z: sample.z,
      t: now,
    })
    if (this.buffer.length > this.windowSize) {
      this.buffer.shift()
    }

    // 窗口未满时返回正常
    if (this.buffer.length < 20) {
      return { type: POSTURE_TYPE.NORMAL, confidence: 1.0, detail: '数据采集中' }
    }

    // 执行检测
    const result = this._detect()

    // 触发回调
    if (this.onDetect) {
      this.onDetect(result)
    }

    return result
  }

  /**
   * 核心检测逻辑
   * @private
   */
  _detect() {
    const buffer = this.buffer

    // 1. 久坐检测：加速度方差极低 + 持续时间
    const sedentaryResult = this._detectSedentary(buffer)
    if (sedentaryResult.type === POSTURE_TYPE.SEDENTARY) {
      return sedentaryResult
    }

    // 2. 低头前倾检测：z轴重力分量异常
    const headTiltResult = this._detectHeadTilt(buffer)
    if (headTiltResult.type === POSTURE_TYPE.HEAD_TILT) {
      return headTiltResult
    }

    // 3. 跷二郎腿检测：x轴偏移 + y轴周期性微振
    const legCrossResult = this._detectLegCross(buffer)
    if (legCrossResult.type === POSTURE_TYPE.LEG_CROSS) {
      return legCrossResult
    }

    // 正常体态
    this.sitStartTime = null
    return { type: POSTURE_TYPE.NORMAL, confidence: 1.0, detail: '体态正常' }
  }

  /**
   * 久坐检测
   * 原理：加速度三轴方差极低表示几乎静止，持续超过阈值判定为久坐
   * @private
   */
  _detectSedentary(buffer) {
    const variance = this._calcVariance(buffer)
    const now = Date.now()

    // 方差阈值：低于0.01表示几乎静止
    const VARIANCE_THRESHOLD = 0.01

    if (variance < VARIANCE_THRESHOLD) {
      // 检测到静止状态
      if (!this.sitStartTime) {
        this.sitStartTime = now
      }

      const sedentaryDuration = now - this.sitStartTime
      if (sedentaryDuration > this.sedentaryThreshold) {
        return {
          type: POSTURE_TYPE.SEDENTARY,
          confidence: Math.min(0.95, 0.7 + sedentaryDuration / (this.sedentaryThreshold * 5)),
          detail: `已静坐 ${Math.floor(sedentaryDuration / 60000)} 分钟`,
        }
      }
    } else {
      // 活动状态，重置计时
      if (this.sitStartTime) {
        this.todaySedentaryMs += now - this.sitStartTime
      }
      this.sitStartTime = null
    }

    return { type: POSTURE_TYPE.NORMAL, confidence: 1.0, detail: '' }
  }

  /**
   * 低头前倾检测
   * 原理：正常站立时z轴约-1g，低头时z轴绝对值减小
   * @private
   */
  _detectHeadTilt(buffer) {
    const avgZ = this._calcAxisMean(buffer, 'z')
    const variance = this._calcVariance(buffer)

    // 静止或微动时才检测（运动中z轴变化大，不可靠）
    if (variance > 0.05) {
      return { type: POSTURE_TYPE.NORMAL, confidence: 1.0, detail: '' }
    }

    // 正常站立z≈-1.0, 低头时z在-0.6到-0.9之间
    const HEAD_TILT_Z_MIN = -0.95
    const HEAD_TILT_Z_MAX = -0.5

    if (avgZ > HEAD_TILT_Z_MIN && avgZ < HEAD_TILT_Z_MAX) {
      // z越接近-0.5，低头越严重
      const severity = (avgZ - HEAD_TILT_Z_MIN) / (HEAD_TILT_Z_MAX - HEAD_TILT_Z_MIN)
      return {
        type: POSTURE_TYPE.HEAD_TILT,
        confidence: Math.min(0.85, 0.5 + severity * 0.35),
        detail: `低头前倾 ${(severity * 100).toFixed(0)}%`,
      }
    }

    return { type: POSTURE_TYPE.NORMAL, confidence: 1.0, detail: '' }
  }

  /**
   * 跷二郎腿检测
   * 原理：跷二郎腿时x轴有明显偏移，y轴出现周期性微振
   * @private
   */
  _detectLegCross(buffer) {
    const avgX = this._calcAxisMean(buffer, 'x')
    const variance = this._calcVariance(buffer)

    // 需要一定活动量（纯静止无法判断）
    if (variance < 0.005 || variance > 0.1) {
      return { type: POSTURE_TYPE.NORMAL, confidence: 1.0, detail: '' }
    }

    const X_OFFSET_THRESHOLD = 0.25
    const hasXOffset = Math.abs(avgX) > X_OFFSET_THRESHOLD
    const hasYOscillation = this._detectPeriodicOscillation(buffer, 'y')

    if (hasXOffset && hasYOscillation) {
      return {
        type: POSTURE_TYPE.LEG_CROSS,
        confidence: 0.65,
        detail: '疑似跷二郎腿',
      }
    }

    return { type: POSTURE_TYPE.NORMAL, confidence: 1.0, detail: '' }
  }

  /**
   * 计算三轴方差
   * @private
   */
  _calcVariance(buffer) {
    const n = buffer.length
    if (n < 2) return 0

    let sum = 0
    for (let i = 0; i < n; i++) {
      const s = buffer[i]
      const magnitude = Math.sqrt(s.x * s.x + s.y * s.y + s.z * s.z)
      sum += magnitude
    }
    const mean = sum / n

    let variance = 0
    for (let i = 0; i < n; i++) {
      const s = buffer[i]
      const magnitude = Math.sqrt(s.x * s.x + s.y * s.y + s.z * s.z)
      variance += (magnitude - mean) * (magnitude - mean)
    }
    return variance / n
  }

  /**
   * 计算指定轴均值
   * @private
   */
  _calcAxisMean(buffer, axis) {
    const n = buffer.length
    if (n === 0) return 0
    let sum = 0
    for (let i = 0; i < n; i++) {
      sum += buffer[i][axis]
    }
    return sum / n
  }

  /**
   * 检测周期性微振（简化版：检测符号变化频率）
   * @private
   */
  _detectPeriodicOscillation(buffer, axis) {
    const n = buffer.length
    if (n < 30) return false

    // 计算符号变化次数
    let signChanges = 0
    for (let i = 1; i < n; i++) {
      if ((buffer[i][axis] >= 0 && buffer[i - 1][axis] < 0) ||
        (buffer[i][axis] < 0 && buffer[i - 1][axis] >= 0)) {
        signChanges++
      }
    }

    // 周期性振荡：符号变化频率在合理范围内
    const changeRate = signChanges / n
    return changeRate > 0.1 && changeRate < 0.5
  }

  /**
   * 获取今日久坐总时长（毫秒）
   */
  getTodaySedentaryMs() {
    let total = this.todaySedentaryMs
    if (this.sitStartTime) {
      total += Date.now() - this.sitStartTime
    }
    return total
  }

  /**
   * 重置今日统计（每日零点调用）
   */
  resetDailyStats() {
    this.todaySedentaryMs = 0
    this.sitStartTime = null
  }

  /**
   * 获取体态类型中文名
   */
  static getPostureName(type) {
    return POSTURE_NAME[type] || '未知'
  }
}

// 导出
export { POSTURE_TYPE, POSTURE_NAME }
export default PostureDetector
