/**
 * anonymizer.js - 穿戴隐私数据本地脱敏
 *
 * 对传感器和健康数据进行本地匿名化处理：
 * - 心率：降采样到5分钟粒度，保留区间特征，去除精确时间戳
 * - 步数：聚合为小时粒度
 * - 加速度：仅保留统计特征向量（方差、主轴方向）
 * - 压力：降采样到10分钟粒度
 *
 * 原则：数据可用不可见，只保留体态分析有效特征
 */

// 脱敏数据类型标识
const ANON_TYPE = {
  HR_FEATURE: 'hr_feature',           // 心率特征
  ACCEL_FEATURE: 'accel_feature',     // 加速度特征
  STEP_FEATURE: 'step_feature',       // 步数特征
  STRESS_FEATURE: 'stress_feature',   // 压力特征
  POSTURE_FEATURE: 'posture_feature', // 体态特征
}

// 心率区间分类
const HR_ZONE = {
  REST: { min: 0, max: 60, label: '静息' },
  NORMAL: { min: 60, max: 100, label: '正常' },
  ELEVATED: { min: 100, max: 140, label: '偏高' },
  HIGH: { min: 140, max: 200, label: '过高' },
}

class Anonymizer {
  constructor() {
    // 心率缓冲区（用于5分钟降采样）
    this.hrBuffer = []
    this.hrBufferStartTime = null
    // 压力缓冲区（用于10分钟降采样）
    this.stressBuffer = []
    this.stressBufferStartTime = null
    // 步数缓冲区（用于小时聚合）
    this.stepBuffer = []
    this.stepBufferHour = null
  }

  /**
   * 脱敏心率数据
   * @param {Object} rawData - { timeStamp: number, value: number }
   * @returns {Object|null} 脱敏后的特征，或null（未到降采样时间）
   */
  anonymizeHeartRate(rawData) {
    const now = rawData.timeStamp
    const hourBucket = Math.floor(now / 3600000)

    // 初始化缓冲区
    if (this.hrBufferStartTime === null) {
      this.hrBufferStartTime = now
    }

    // 检查是否在同一个5分钟窗口
    const elapsed = now - this.hrBufferStartTime
    const FIVE_MINUTES = 5 * 60 * 1000

    this.hrBuffer.push(rawData.value)

    if (elapsed < FIVE_MINUTES) {
      return null // 未到降采样时间
    }

    // 生成脱敏特征
    const values = this.hrBuffer
    const feature = {
      type: ANON_TYPE.HR_FEATURE,
      hourBucket: hourBucket,
      avgValue: Math.round(this._calcMean(values)),
      minValue: Math.min(...values),
      maxValue: Math.max(...values),
      zone: this._classifyHRZone(this._calcMean(values)),
      sampleCount: values.length,
      // 不保留精确时间戳
      // 不保留每个精确数值
    }

    // 重置缓冲区
    this.hrBuffer = []
    this.hrBufferStartTime = now

    return feature
  }

  /**
   * 脱敏加速度数据（用于体态分析）
   * @param {Array} samples - [{ x, y, z }] 最近2秒的数据
   * @returns {Object} 脱敏后的特征向量
   */
  anonymizeAcceleration(samples) {
    if (!samples || samples.length === 0) {
      return null
    }

    const n = samples.length

    // 计算各轴均值
    const avgX = this._calcAxisMean(samples, 'x')
    const avgY = this._calcAxisMean(samples, 'y')
    const avgZ = this._calcAxisMean(samples, 'z')

    // 计算各轴方差
    const varX = this._calcAxisVariance(samples, 'x')
    const varY = this._calcAxisVariance(samples, 'y')
    const varZ = this._calcAxisVariance(samples, 'z')

    // 确定主轴方向（重力方向）
    const dominantAxis = this._getDominantAxis(avgX, avgY, avgZ)

    // 计算总方差（用于判断静止/运动）
    const totalVariance = varX + varY + varZ

    return {
      type: ANON_TYPE.ACCEL_FEATURE,
      timestamp: Date.now(),
      avgX: avgX.toFixed(3),
      avgY: avgY.toFixed(3),
      avgZ: avgZ.toFixed(3),
      varX: varX.toFixed(4),
      varY: varY.toFixed(4),
      varZ: varZ.toFixed(4),
      dominantAxis: dominantAxis,
      isStationary: totalVariance < 0.01,
      sampleCount: n,
      // 不保留原始坐标序列
      // 不保留精确采样时间
    }
  }

  /**
   * 脱敏体态检测结果
   * @param {Object} postureResult - 体态检测器输出
   * @returns {Object} 脱敏后的体态记录
   */
  anonymizePostureResult(postureResult) {
    return {
      type: ANON_TYPE.POSTURE_FEATURE,
      timestamp: Date.now(),
      postureType: postureResult.type,
      confidence: postureResult.confidence,
      // 不保留详细检测参数
    }
  }

  /**
   * 脱敏步数数据
   * @param {Object} rawData - { timeStamp: number, value: number }
   * @returns {Object|null} 脱敏后的特征
   */
  anonymizeStep(rawData) {
    const hour = new Date(rawData.timeStamp).getHours()
    const hourBucket = Math.floor(rawData.timeStamp / 3600000)

    if (this.stepBufferHour === null) {
      this.stepBufferHour = hourBucket
    }

    // 检查是否在同一小时
    if (hourBucket !== this.stepBufferHour) {
      // 生成上一小时的脱敏特征
      const feature = {
        type: ANON_TYPE.STEP_FEATURE,
        hourBucket: this.stepBufferHour,
        totalSteps: this.stepBuffer.reduce((a, b) => a + b, 0),
        sampleCount: this.stepBuffer.length,
      }
      // 重置缓冲区
      this.stepBuffer = [rawData.value]
      this.stepBufferHour = hourBucket
      return feature
    }

    this.stepBuffer.push(rawData.value)
    return null
  }

  /**
   * 脱敏压力数据
   * @param {Object} rawData - { timeStamp: number, value: number }
   * @returns {Object|null} 脱敏后的特征
   */
  anonymizeStress(rawData) {
    const now = rawData.timeStamp

    if (this.stressBufferStartTime === null) {
      this.stressBufferStartTime = now
    }

    const elapsed = now - this.stressBufferStartTime
    const TEN_MINUTES = 10 * 60 * 1000

    this.stressBuffer.push(rawData.value)

    if (elapsed < TEN_MINUTES) {
      return null
    }

    const values = this.stressBuffer
    const feature = {
      type: ANON_TYPE.STRESS_FEATURE,
      hourBucket: Math.floor(this.stressBufferStartTime / 3600000),
      avgValue: Math.round(this._calcMean(values)),
      maxValue: Math.max(...values),
      sampleCount: values.length,
    }

    this.stressBuffer = []
    this.stressBufferStartTime = now

    return feature
  }

  /**
   * 心率区间分类
   * @private
   */
  _classifyHRZone(value) {
    for (const [key, zone] of Object.entries(HR_ZONE)) {
      if (value >= zone.min && value < zone.max) {
        return zone.label
      }
    }
    return '未知'
  }

  /**
   * 计算均值
   * @private
   */
  _calcMean(arr) {
    if (arr.length === 0) return 0
    return arr.reduce((a, b) => a + b, 0) / arr.length
  }

  /**
   * 计算指定轴均值
   * @private
   */
  _calcAxisMean(samples, axis) {
    const n = samples.length
    if (n === 0) return 0
    let sum = 0
    for (let i = 0; i < n; i++) {
      sum += samples[i][axis]
    }
    return sum / n
  }

  /**
   * 计算指定轴方差
   * @private
   */
  _calcAxisVariance(samples, axis) {
    const n = samples.length
    if (n < 2) return 0
    const mean = this._calcAxisMean(samples, axis)
    let variance = 0
    for (let i = 0; i < n; i++) {
      const diff = samples[i][axis] - mean
      variance += diff * diff
    }
    return variance / n
  }

  /**
   * 获取主轴方向（重力方向）
   * @private
   */
  _getDominantAxis(avgX, avgY, avgZ) {
    const absX = Math.abs(avgX)
    const absY = Math.abs(avgY)
    const absZ = Math.abs(avgZ)
    if (absX >= absY && absX >= absZ) return 'x'
    if (absY >= absX && absY >= absZ) return 'y'
    return 'z'
  }
}

export { ANON_TYPE, HR_ZONE }
export default Anonymizer
