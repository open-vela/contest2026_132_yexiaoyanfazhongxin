/**
 * imu-scenarios.js — 7 类体态 IMU 模拟数据
 *
 * 为每种体态生成特征鲜明的 IMU 模拟数据。
 * 每个场景包含 5 秒的循环数据序列（250 采样点 @50Hz）。
 *
 * @module mock/imu-scenarios
 */

/**
 * 体态类型枚举
 */
const POSE_TYPE = {
  STANDARD_SIT: 'standard_sit',
  HUNCHED_SIT: 'hunched_sit',
  STANDARD_STAND: 'standard_stand',
  WALKING: 'walking',
  RUNNING: 'running',
  STILL: 'still',
  UNKNOWN: 'unknown',
}

/**
 * 场景配置：每种体态的 IMU 数据特征
 * ax/ay/az: 加速度 (m/s²)，静止时 az ≈ -9.8
 * gx/gy/gz: 陀螺仪角速度 (rad/s)
 */
const SCENE_CONFIG = {
  // 标准坐姿：轻微晃动，z轴稳定
  [POSE_TYPE.STANDARD_SIT]: {
    ax: { mean: 0.1, noise: 0.05 },
    ay: { mean: 0.0, noise: 0.03 },
    az: { mean: -9.75, noise: 0.02 },
    gx: { mean: 0.0, noise: 0.01 },
    gy: { mean: 0.0, noise: 0.01 },
    gz: { mean: 0.0, noise: 0.005 },
  },

  // 驼背坐姿：z轴偏移，前倾特征
  [POSE_TYPE.HUNCHED_SIT]: {
    ax: { mean: 0.8, noise: 0.1 },     // 前倾
    ay: { mean: 0.0, noise: 0.05 },
    az: { mean: -9.5, noise: 0.05 },   // z轴偏小（倾斜）
    gx: { mean: -0.1, noise: 0.02 },   // 轻微前倾角速度
    gy: { mean: 0.0, noise: 0.01 },
    gz: { mean: 0.0, noise: 0.01 },
  },

  // 标准站姿：z轴稳定，微小晃动
  [POSE_TYPE.STANDARD_STAND]: {
    ax: { mean: 0.0, noise: 0.03 },
    ay: { mean: 0.0, noise: 0.03 },
    az: { mean: -9.8, noise: 0.02 },
    gx: { mean: 0.0, noise: 0.008 },
    gy: { mean: 0.0, noise: 0.008 },
    gz: { mean: 0.0, noise: 0.005 },
  },

  // 行走：周期性加速度波动
  [POSE_TYPE.WALKING]: {
    ax: { mean: 0.0, noise: 0.8, pattern: 'sine', freq: 2.0, amp: 0.6 },
    ay: { mean: 0.0, noise: 0.3, pattern: 'sine', freq: 2.0, amp: 0.2 },
    az: { mean: -9.8, noise: 0.5, pattern: 'sine', freq: 2.0, amp: 0.4 },
    gx: { mean: 0.0, noise: 0.15, pattern: 'sine', freq: 2.0, amp: 0.1 },
    gy: { mean: 0.0, noise: 0.1, pattern: 'sine', freq: 2.0, amp: 0.08 },
    gz: { mean: 0.0, noise: 0.05 },
  },

  // 跑步：高频大幅波动
  [POSE_TYPE.RUNNING]: {
    ax: { mean: 0.0, noise: 1.5, pattern: 'sine', freq: 3.0, amp: 1.2 },
    ay: { mean: 0.0, noise: 0.8, pattern: 'sine', freq: 3.0, amp: 0.5 },
    az: { mean: -9.8, noise: 2.0, pattern: 'sine', freq: 3.0, amp: 1.5 },
    gx: { mean: 0.0, noise: 0.3, pattern: 'sine', freq: 3.0, amp: 0.2 },
    gy: { mean: 0.0, noise: 0.2, pattern: 'sine', freq: 3.0, amp: 0.15 },
    gz: { mean: 0.0, noise: 0.1 },
  },

  // 静止/躺卧：几乎无波动
  [POSE_TYPE.STILL]: {
    ax: { mean: 0.0, noise: 0.01 },
    ay: { mean: 0.0, noise: 0.01 },
    az: { mean: -9.81, noise: 0.005 },
    gx: { mean: 0.0, noise: 0.002 },
    gy: { mean: 0.0, noise: 0.002 },
    gz: { mean: 0.0, noise: 0.001 },
  },

  // 未知/过渡：不规则波动
  [POSE_TYPE.UNKNOWN]: {
    ax: { mean: 0.5, noise: 0.5, pattern: 'random' },
    ay: { mean: 0.3, noise: 0.4, pattern: 'random' },
    az: { mean: -9.5, noise: 0.8, pattern: 'random' },
    gx: { mean: 0.1, noise: 0.2, pattern: 'random' },
    gy: { mean: 0.05, noise: 0.15, pattern: 'random' },
    gz: { mean: 0.02, noise: 0.1, pattern: 'random' },
  },
}

/**
 * IMU 数据生成器
 */
class IMUScenarioGenerator {
  /**
   * @param {string} scenarioType - 体态类型
   * @param {Object} [options]
   * @param {number} [options.sampleRate=50] - 采样率
   * @param {number} [options.duration=5] - 循环时长（秒）
   */
  constructor(scenarioType, options = {}) {
    this._type = scenarioType
    this._sampleRate = options.sampleRate || 50
    this._duration = options.duration || 5
    this._totalSamples = this._sampleRate * this._duration
    this._sampleIndex = 0

    this._config = SCENE_CONFIG[scenarioType] || SCENE_CONFIG[POSE_TYPE.UNKNOWN]
  }

  /**
   * 生成下一个采样点
   * @returns {Object} { timestamp, ax, ay, az, gx, gy, gz }
   */
  generateSample() {
    const t = this._sampleIndex / this._sampleRate
    const sample = {
      timestamp: Date.now(),
    }

    for (const axis of ['ax', 'ay', 'az', 'gx', 'gy', 'gz']) {
      const cfg = this._config[axis]
      let value = cfg.mean

      // 正弦模式（行走/跑步）
      if (cfg.pattern === 'sine') {
        value += cfg.amp * Math.sin(2 * Math.PI * cfg.freq * t)
      }

      // 添加噪声
      value += (Math.random() - 0.5) * 2 * cfg.noise

      sample[axis] = value
    }

    this._sampleIndex = (this._sampleIndex + 1) % this._totalSamples
    return sample
  }

  /**
   * 重置到序列开头
   */
  reset() {
    this._sampleIndex = 0
  }

  /** @returns {string} 场景类型 */
  get type() {
    return this._type
  }
}

/**
 * 混合场景生成器
 * 按时间比例混合多种体态
 */
class MixedScenarioGenerator {
  /**
   * @param {Array} segments - [{ type, duration }, ...]
   * @param {Object} [options]
   */
  constructor(segments, options = {}) {
    this._segments = segments
    this._sampleRate = options.sampleRate || 50

    // 预计算每段的采样数
    this._segmentSamples = segments.map(s => s.duration * this._sampleRate)
    this._totalSamples = this._segmentSamples.reduce((a, b) => a + b, 0)

    // 为每段创建生成器
    this._generators = segments.map(s => new IMUScenarioGenerator(s.type, { sampleRate: this._sampleRate }))

    this._currentSegment = 0
    this._segmentIndex = 0
  }

  /**
   * 生成下一个采样点
   * @returns {Object}
   */
  generateSample() {
    if (this._currentSegment >= this._generators.length) {
      // 循环回到第一段
      this._currentSegment = 0
      this._segmentIndex = 0
      this._generators.forEach(g => g.reset())
    }

    const sample = this._generators[this._currentSegment].generateSample()
    this._segmentIndex++

    // 切换到下一段
    if (this._segmentIndex >= this._segmentSamples[this._currentSegment]) {
      this._currentSegment++
      this._segmentIndex = 0
    }

    return sample
  }

  /** @returns {string} 当前段的体态类型 */
  get currentType() {
    if (this._currentSegment < this._segments.length) {
      return this._segments[this._currentSegment].type
    }
    return POSE_TYPE.UNKNOWN
  }
}

// ── 预定义场景 ──

const PRESET_SCENARIOS = {
  // 坐姿办公 1 小时
  'office-1h': () => new MixedScenarioGenerator([
    { type: POSE_TYPE.STANDARD_SIT, duration: 60 },
    { type: POSE_TYPE.HUNCHED_SIT, duration: 40 },
    { type: POSE_TYPE.WALKING, duration: 10 },
    { type: POSE_TYPE.STANDARD_SIT, duration: 50 },
    { type: POSE_TYPE.HUNCHED_SIT, duration: 30 },
    { type: POSE_TYPE.WALKING, duration: 5 },
    { type: POSE_TYPE.STANDARD_SIT, duration: 35 },
  ]),

  // 久坐 2 小时
  'sedentary-2h': () => new MixedScenarioGenerator([
    { type: POSE_TYPE.STANDARD_SIT, duration: 120 },
    { type: POSE_TYPE.HUNCHED_SIT, duration: 80 },
    { type: POSE_TYPE.STILL, duration: 20 },
  ]),

  // 混合日常
  'mixed-daily': () => new MixedScenarioGenerator([
    { type: POSE_TYPE.STANDARD_SIT, duration: 60 },
    { type: POSE_TYPE.WALKING, duration: 20 },
    { type: POSE_TYPE.STANDARD_STAND, duration: 15 },
    { type: POSE_TYPE.HUNCHED_SIT, duration: 45 },
    { type: POSE_TYPE.RUNNING, duration: 10 },
    { type: POSE_TYPE.STILL, duration: 30 },
    { type: POSE_TYPE.WALKING, duration: 20 },
  ]),

  // 运动跑步
  'running-session': () => new MixedScenarioGenerator([
    { type: POSE_TYPE.STANDARD_STAND, duration: 10 },
    { type: POSE_TYPE.WALKING, duration: 20 },
    { type: POSE_TYPE.RUNNING, duration: 60 },
    { type: POSE_TYPE.WALKING, duration: 15 },
    { type: POSE_TYPE.STILL, duration: 15 },
  ]),
}

export {
  POSE_TYPE,
  SCENE_CONFIG,
  IMUScenarioGenerator,
  MixedScenarioGenerator,
  PRESET_SCENARIOS,
}
