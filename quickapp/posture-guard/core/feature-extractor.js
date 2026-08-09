/**
 * feature-extractor.js - 时序特征提取器
 *
 * 从滑动窗口原始传感器数据中提取特征向量，用于体态分类。
 * 特征包括：统计特征（均值、方差）、频域特征（FFT）、姿态角等。
 *
 * 输入：5秒滑动窗口（50Hz采样 = 250帧）
 * 输出：特征向量对象
 *
 * @module core/feature-extractor
 */

/**
 * 特征向量结构
 * @typedef {Object} FeatureVector
 * @property {Object} accMean - 加速度各轴均值 {x, y, z}
 * @property {Object} accVar - 加速度各轴方差 {x, y, z}
 * @property {number} gyroPitch - 俯仰角均值（度）
 * @property {number} gyroRoll - 横滚角均值（度）
 * @property {number} dominantFreq - Z轴主导频率（Hz）
 * @property {number} zeroCrossRate - 零速检测率
 * @property {number} asymmetryIndex - 左右轴不对称指数
 * @property {Object} orientation - 姿态角 {pitch, roll, yaw}
 */

class FeatureExtractor {
  /**
   * @param {Object} options - 配置选项
   * @param {number} [options.windowSize=250] - 滑动窗口大小（帧数）
   * @param {number} [options.sampleRate=50] - 采样率（Hz）
   * @param {number} [options.fftSize=64] - FFT点数
   */
  constructor(options = {}) {
    /** @type {number} 滑动窗口大小 */
    this.windowSize = options.windowSize || 250

    /** @type {number} 采样率 */
    this.sampleRate = options.sampleRate || 50

    /** @type {number} FFT点数 */
    this.fftSize = options.fftSize || 64

    /** @type {Array} 数据缓冲区 */
    this.buffer = []

    /** @type {number} 重叠步进（50%重叠） */
    this.stepSize = Math.floor(this.windowSize / 2)

    /** @type {number} 帧计数器 */
    this.frameCount = 0

    /** @type {boolean} 窗口是否已满 */
    this.isWindowReady = false
  }

  /**
   * 输入一帧传感器数据
   * @param {Object} data - { timestamp, acc: {x,y,z}, gyro: {x,y,z} }
   * @returns {FeatureVector|null} 特征向量，窗口未满时返回null
   */
  input(data) {
    // 添加到缓冲区
    this.buffer.push({
      timestamp: data.timestamp,
      acc: { ...data.acc },
      gyro: { ...data.gyro },
    })

    // 限制缓冲区大小
    if (this.buffer.length > this.windowSize) {
      this.buffer.shift()
    }

    this.frameCount++

    // 检查窗口是否已满
    if (this.buffer.length < this.windowSize) {
      return null
    }

    // 检查是否到达步进点
    if (this.frameCount % this.stepSize !== 0 && this.isWindowReady) {
      return null
    }

    this.isWindowReady = true

    // 提取特征
    return this._extractFeatures()
  }

  /**
   * 提取特征向量
   * @private
   * @returns {FeatureVector}
   */
  _extractFeatures() {
    const buffer = this.buffer
    const n = buffer.length

    // 1. 加速度统计特征
    const accMean = this._calcAccMean(buffer)
    const accVar = this._calcAccVar(buffer)

    // 2. 陀螺仪统计特征
    const gyroStats = this._calcGyroStats(buffer)

    // 3. 频域特征（Z轴FFT）
    const freqFeatures = this._extractFreqFeatures(buffer)

    // 4. 零速检测率
    const zeroCrossRate = this._calcZeroCrossRate(buffer)

    // 5. 不对称指数（用于跷腿检测）
    const asymmetryIndex = this._calcAsymmetryIndex(buffer)

    // 6. 姿态角解算
    const orientation = this._calcOrientation(buffer)

    return {
      accMean,
      accVar,
      gyroPitch: gyroStats.pitch,
      gyroRoll: gyroStats.roll,
      dominantFreq: freqFeatures.dominantFreq,
      zeroCrossRate,
      asymmetryIndex,
      orientation,
    }
  }

  /**
   * 计算加速度均值
   * @private
   * @param {Array} buffer - 数据缓冲区
   * @returns {{x: number, y: number, z: number}}
   */
  _calcAccMean(buffer) {
    const n = buffer.length
    let sumX = 0, sumY = 0, sumZ = 0

    for (let i = 0; i < n; i++) {
      sumX += buffer[i].acc.x
      sumY += buffer[i].acc.y
      sumZ += buffer[i].acc.z
    }

    return {
      x: sumX / n,
      y: sumY / n,
      z: sumZ / n,
    }
  }

  /**
   * 计算加速度方差
   * @private
   * @param {Array} buffer - 数据缓冲区
   * @returns {{x: number, y: number, z: number}}
   */
  _calcAccVar(buffer) {
    const n = buffer.length
    if (n < 2) return { x: 0, y: 0, z: 0 }

    const mean = this._calcAccMean(buffer)
    let varX = 0, varY = 0, varZ = 0

    for (let i = 0; i < n; i++) {
      const dx = buffer[i].acc.x - mean.x
      const dy = buffer[i].acc.y - mean.y
      const dz = buffer[i].acc.z - mean.z
      varX += dx * dx
      varY += dy * dy
      varZ += dz * dz
    }

    return {
      x: varX / n,
      y: varY / n,
      z: varZ / n,
    }
  }

  /**
   * 计算陀螺仪统计特征
   * @private
   * @param {Array} buffer - 数据缓冲区
   * @returns {{pitch: number, roll: number}}
   */
  _calcGyroStats(buffer) {
    const n = buffer.length
    let sumPitch = 0, sumRoll = 0

    for (let i = 0; i < n; i++) {
      // 俯仰角（绕X轴）：gyro.y
      sumPitch += buffer[i].gyro.y
      // 横滚角（绕Y轴）：gyro.x
      sumRoll += buffer[i].gyro.x
    }

    // 转换为角度（简化：直接使用均值）
    return {
      pitch: (sumPitch / n) * (180 / Math.PI),
      roll: (sumRoll / n) * (180 / Math.PI),
    }
  }

  /**
   * 提取频域特征（轻量级FFT）
   * @private
   * @param {Array} buffer - 数据缓冲区
   * @returns {{dominantFreq: number}}
   */
  _extractFreqFeatures(buffer) {
    const n = Math.min(buffer.length, this.fftSize)

    // 提取Z轴数据用于FFT
    const signal = new Array(n)
    for (let i = 0; i < n; i++) {
      signal[i] = buffer[buffer.length - n + i].acc.z
    }

    // 计算FFT幅度谱
    const magnitude = this._fftMagnitude(signal)

    // 找到主导频率（排除直流分量）
    let maxMag = 0
    let dominantBin = 0
    for (let i = 1; i < n / 2; i++) {
      if (magnitude[i] > maxMag) {
        maxMag = magnitude[i]
        dominantBin = i
      }
    }

    // 计算主导频率
    const dominantFreq = (dominantBin * this.sampleRate) / n

    return { dominantFreq }
  }

  /**
   * 简化的FFT幅度计算（Goertzel算法，仅计算特定频率）
   * @private
   * @param {Array} signal - 输入信号
   * @returns {Array} 幅度谱
   */
  _fftMagnitude(signal) {
    const n = signal.length
    const magnitude = new Array(n / 2)

    // 简化的DFT计算（适用于小规模数据）
    for (let k = 0; k < n / 2; k++) {
      let real = 0
      let imag = 0

      for (let t = 0; t < n; t++) {
        const angle = (2 * Math.PI * k * t) / n
        real += signal[t] * Math.cos(angle)
        imag -= signal[t] * Math.sin(angle)
      }

      magnitude[k] = Math.sqrt(real * real + imag * imag) / n
    }

    return magnitude
  }

  /**
   * 计算零速检测率（Z轴过零率）
   * @private
   * @param {Array} buffer - 数据缓冲区
   * @returns {number} 过零率 (0-1)
   */
  _calcZeroCrossRate(buffer) {
    const n = buffer.length
    if (n < 2) return 0

    // 计算Z轴均值作为参考点
    let sumZ = 0
    for (let i = 0; i < n; i++) {
      sumZ += buffer[i].acc.z
    }
    const meanZ = sumZ / n

    // 计算过零次数
    let crossings = 0
    let prevSign = (buffer[0].acc.z - meanZ) >= 0 ? 1 : -1

    for (let i = 1; i < n; i++) {
      const currSign = (buffer[i].acc.z - meanZ) >= 0 ? 1 : -1
      if (currSign !== prevSign) {
        crossings++
      }
      prevSign = currSign
    }

    return crossings / (n - 1)
  }

  /**
   * 计算左右轴不对称指数（用于跷腿检测）
   * @private
   * @param {Array} buffer - 数据缓冲区
   * @returns {number} 不对称指数 (0-1)
   */
  _calcAsymmetryIndex(buffer) {
    const n = buffer.length

    // 计算X轴和Y轴的能量比
    let energyX = 0
    let energyY = 0

    for (let i = 0; i < n; i++) {
      energyX += buffer[i].acc.x * buffer[i].acc.x
      energyY += buffer[i].acc.y * buffer[i].acc.y
    }

    // 不对称指数：两轴能量差异归一化
    const totalEnergy = energyX + energyY
    if (totalEnergy === 0) return 0

    return Math.abs(energyX - energyY) / totalEnergy
  }

  /**
   * 姿态角解算（互补滤波）
   * @private
   * @param {Array} buffer - 数据缓冲区
   * @returns {{pitch: number, roll: number, yaw: number}}
   */
  _calcOrientation(buffer) {
    const n = buffer.length

    // 使用最后一个窗口的数据进行姿态解算
    // 互补滤波：加速度计提供长期稳定，陀螺仪提供短期响应

    const lastAcc = buffer[n - 1].acc
    const lastGyro = buffer[n - 1].gyro

    // 从加速度计计算姿态角（仅在静止时准确）
    const accPitch = Math.atan2(-lastAcc.x, Math.sqrt(lastAcc.y * lastAcc.y + lastAcc.z * lastAcc.z)) * (180 / Math.PI)
    const accRoll = Math.atan2(lastAcc.y, lastAcc.z) * (180 / Math.PI)

    // 陀螺仪积分（简化：使用均值）
    let sumGyroPitch = 0
    let sumGyroRoll = 0
    const dt = 1 / this.sampleRate

    for (let i = 0; i < n; i++) {
      sumGyroPitch += buffer[i].gyro.y * dt
      sumGyroRoll += buffer[i].gyro.x * dt
    }

    const gyroPitch = sumGyroPitch * (180 / Math.PI)
    const gyroRoll = sumGyroRoll * (180 / Math.PI)

    // 互补滤波融合（alpha = 0.98 偏向陀螺仪）
    const alpha = 0.98
    const pitch = alpha * gyroPitch + (1 - alpha) * accPitch
    const roll = alpha * gyroRoll + (1 - alpha) * accRoll

    // Yaw无法从加速度计获得，使用陀螺仪积分（会有漂移）
    const yaw = 0 // 简化：不计算yaw

    return {
      pitch: Math.round(pitch * 100) / 100,
      roll: Math.round(roll * 100) / 100,
      yaw,
    }
  }

  /**
   * 获取当前缓冲区状态
   * @returns {{size: number, ready: boolean, frameCount: number}}
   */
  getStatus() {
    return {
      size: this.buffer.length,
      ready: this.isWindowReady,
      frameCount: this.frameCount,
    }
  }

  /**
   * 清空缓冲区
   */
  reset() {
    this.buffer = []
    this.frameCount = 0
    this.isWindowReady = false
  }
}

export { FeatureExtractor }
export default FeatureExtractor
