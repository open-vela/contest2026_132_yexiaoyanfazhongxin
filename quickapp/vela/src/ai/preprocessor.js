/**
 * preprocessor.js — IMU 数据预处理管线
 *
 * 实现完整的数据预处理流程：
 * 1. 卡尔曼滤波 — 去除高频噪声
 * 2. 重力分离 — 转换为线性加速度
 * 3. 特征工程 — 时域+频域特征提取
 * 4. 归一化 — 标准化到统一范围
 *
 * @module ai/preprocessor
 */

/**
 * 简化的一维卡尔曼滤波器
 */
class KalmanFilter1D {
  constructor(q = 0.01, r = 0.1) {
    this.q = q  // 过程噪声
    this.r = r  // 测量噪声
    this.x = 0  // 估计值
    this.p = 1  // 估计误差
    this.k = 0  // 卡尔曼增益
  }

  /**
   * 滤波单个值
   * @param {number} measurement - 测量值
   * @returns {number} 滤波后的值
   */
  filter(measurement) {
    // 预测
    this.p += this.q

    // 更新
    this.k = this.p / (this.p + this.r)
    this.x += this.k * (measurement - this.x)
    this.p *= (1 - this.k)

    return this.x
  }

  reset() {
    this.x = 0
    this.p = 1
  }
}

/**
 * 特征向量结构
 * @typedef {Object} FeatureVector
 * @property {Object} accMean - 加速度均值 {x, y, z}
 * @property {Object} accStd  - 加速度标准差 {x, y, z}
 * @property {Object} accMin  - 加速度最小值 {x, y, z}
 * @property {Object} accMax  - 加速度最大值 {x, y, z}
 * @property {Object} gyroMean - 陀螺仪均值 {x, y, z}
 * @property {Object} gyroStd  - 陀螺仪标准差 {x, y, z}
 * @property {number} dominantFreq - 主频率 (Hz)
 * @property {number} zeroCrossRate - 过零率
 * @property {number} motionIntensity - 运动强度
 */

class Preprocessor {
  constructor() {
    // 卡尔曼滤波器（每轴一个）
    this._kfAx = new KalmanFilter1D()
    this._kfAy = new KalmanFilter1D()
    this._kfAz = new KalmanFilter1D()
    this._kfGx = new KalmanFilter1D()
    this._kfGy = new KalmanFilter1D()
    this._kfGz = new KalmanFilter1D()

    // 重力估计（低通滤波）
    this._gravity = { x: 0, y: 0, z: -9.8 }
    this._gravityAlpha = 0.02  // 低通系数

    // 归一化参数
    this._accelRange = 2 * 9.8   // ±2g
    this._gyroRange = 250 * Math.PI / 180  // ±250dps -> rad/s
  }

  /**
   * 预处理一个采样窗口
   * @param {Array} window - 采样点数组 [{timestamp, ax, ay, az, gx, gy, gz}, ...]
   * @returns {FeatureVector|null} 特征向量，窗口不足时返回 null
   */
  processWindow(window) {
    if (!window || window.length < 10) return null

    const n = window.length

    // 1. 卡尔曼滤波 + 重力分离
    const filtered = []
    for (let i = 0; i < n; i++) {
      const s = window[i]
      const ax = this._kfAx.filter(s.ax)
      const ay = this._kfAy.filter(s.ay)
      const az = this._kfAz.filter(s.az)
      const gx = this._kfGx.filter(s.gx)
      const gy = this._kfGy.filter(s.gy)
      const gz = this._kfGz.filter(s.gz)

      // 重力分离（低通滤波估计重力分量）
      this._gravity.x += this._gravityAlpha * (ax - this._gravity.x)
      this._gravity.y += this._gravityAlpha * (ay - this._gravity.y)
      this._gravity.z += this._gravityAlpha * (az - this._gravity.z)

      // 线性加速度 = 原始加速度 - 重力
      filtered.push({
        ax: ax - this._gravity.x,
        ay: ay - this._gravity.y,
        az: az - this._gravity.z,
        gx: gx,
        gy: gy,
        gz: gz,
      })
    }

    // 2. 时域特征提取
    const accMean = this._calcMean(filtered, 'a')
    const accStd = this._calcStd(filtered, 'a', accMean)
    const accMin = this._calcMin(filtered, 'a')
    const accMax = this._calcMax(filtered, 'a')
    const gyroMean = this._calcMean(filtered, 'g')
    const gyroStd = this._calcStd(filtered, 'g', gyroMean)

    // 3. 频域特征（Z轴FFT主频率）
    const azValues = filtered.map(f => f.az)
    const dominantFreq = this._calcDominantFreq(azValues)

    // 4. 过零率
    const zeroCrossRate = this._calcZeroCrossRate(azValues)

    // 5. 运动强度
    const motionIntensity = this._calcMotionIntensity(accStd)

    return {
      accMean,
      accStd,
      accMin,
      accMax,
      gyroMean,
      gyroStd,
      dominantFreq,
      zeroCrossRate,
      motionIntensity,
    }
  }

  /**
   * 将特征向量转换为模型输入张量
   * @param {FeatureVector} features
   * @returns {Array} 一维数组，可直接输入模型
   */
  toTensor(features) {
    if (!features) return null

    return [
      // 加速度均值 (3)
      features.accMean.x, features.accMean.y, features.accMean.z,
      // 加速度标准差 (3)
      features.accStd.x, features.accStd.y, features.accStd.z,
      // 加速度极值 (6)
      features.accMin.x, features.accMin.y, features.accMin.z,
      features.accMax.x, features.accMax.y, features.accMax.z,
      // 陀螺仪均值 (3)
      features.gyroMean.x, features.gyroMean.y, features.gyroMean.z,
      // 陀螺仪标准差 (3)
      features.gyroStd.x, features.gyroStd.y, features.gyroStd.z,
      // 频域+统计 (3)
      features.dominantFreq,
      features.zeroCrossRate,
      features.motionIntensity,
    ]
  }

  /**
   * 重置滤波器状态
   */
  reset() {
    this._kfAx.reset()
    this._kfAy.reset()
    this._kfAz.reset()
    this._kfGx.reset()
    this._kfGy.reset()
    this._kfGz.reset()
    this._gravity = { x: 0, y: 0, z: -9.8 }
  }

  // ── 统计计算 ──

  _calcMean(data, prefix) {
    const key = prefix + 'x'
    let sx = 0, sy = 0, sz = 0
    const n = data.length
    for (let i = 0; i < n; i++) {
      sx += data[i][prefix + 'x']
      sy += data[i][prefix + 'y']
      sz += data[i][prefix + 'z']
    }
    return { x: sx / n, y: sy / n, z: sz / n }
  }

  _calcStd(data, prefix, mean) {
    let sx = 0, sy = 0, sz = 0
    const n = data.length
    for (let i = 0; i < n; i++) {
      const dx = data[i][prefix + 'x'] - mean.x
      const dy = data[i][prefix + 'y'] - mean.y
      const dz = data[i][prefix + 'z'] - mean.z
      sx += dx * dx
      sy += dy * dy
      sz += dz * dz
    }
    return {
      x: Math.sqrt(sx / n),
      y: Math.sqrt(sy / n),
      z: Math.sqrt(sz / n),
    }
  }

  _calcMin(data, prefix) {
    let mx = Infinity, my = Infinity, mz = Infinity
    for (let i = 0; i < data.length; i++) {
      if (data[i][prefix + 'x'] < mx) mx = data[i][prefix + 'x']
      if (data[i][prefix + 'y'] < my) my = data[i][prefix + 'y']
      if (data[i][prefix + 'z'] < mz) mz = data[i][prefix + 'z']
    }
    return { x: mx, y: my, z: mz }
  }

  _calcMax(data, prefix) {
    let mx = -Infinity, my = -Infinity, mz = -Infinity
    for (let i = 0; i < data.length; i++) {
      if (data[i][prefix + 'x'] > mx) mx = data[i][prefix + 'x']
      if (data[i][prefix + 'y'] > my) my = data[i][prefix + 'y']
      if (data[i][prefix + 'z'] > mz) mz = data[i][prefix + 'z']
    }
    return { x: mx, y: my, z: mz }
  }

  /**
   * 简化 FFT 主频率检测
   * @private
   */
  _calcDominantFreq(signal) {
    const n = signal.length
    if (n < 2) return 0

    // 简化版：用过零率近似主频率
    let crossings = 0
    const mean = signal.reduce((a, b) => a + b, 0) / n
    for (let i = 1; i < n; i++) {
      if ((signal[i - 1] - mean) * (signal[i] - mean) < 0) crossings++
    }

    return crossings / (2 * n) * 50  // 采样率 50Hz
  }

  /**
   * 过零率
   * @private
   */
  _calcZeroCrossRate(signal) {
    let crossings = 0
    for (let i = 1; i < signal.length; i++) {
      if (signal[i - 1] * signal[i] < 0) crossings++
    }
    return crossings / (signal.length - 1)
  }

  /**
   * 运动强度（加速度标准差的模）
   * @private
   */
  _calcMotionIntensity(accStd) {
    return Math.sqrt(accStd.x * accStd.x + accStd.y * accStd.y + accStd.z * accStd.z)
  }
}

export { Preprocessor, KalmanFilter1D }
