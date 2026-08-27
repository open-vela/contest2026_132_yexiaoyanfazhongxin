/**
 * power-manager.js — 功耗管理
 *
 * 动态调节传感器采样率和推理频率，优化电池续航。
 * 静止状态降低采样率，活动状态恢复高频采样。
 *
 * @module power/power-manager
 */

const POWER_MODE = {
  LOW: 'low',       // 低功耗：10Hz 采样，5秒推理
  NORMAL: 'normal', // 正常：50Hz 采样，1秒推理
  HIGH: 'high',     // 高性能：50Hz 采样，500ms推理（预留动态阶段）
}

const MODE_CONFIG = {
  [POWER_MODE.LOW]: {
    sampleRate: 10,
    inferInterval: 5000,
    description: '低功耗模式',
  },
  [POWER_MODE.NORMAL]: {
    sampleRate: 50,
    inferInterval: 1000,
    description: '正常模式',
  },
  [POWER_MODE.HIGH]: {
    sampleRate: 50,
    inferInterval: 500,
    description: '高性能模式',
  },
}

class PowerManager {
  constructor() {
    /** @type {string} 当前功耗模式 */
    this._currentMode = POWER_MODE.NORMAL

    /** @type {Object} 模式配置 */
    this._config = { ...MODE_CONFIG }

    /** @type {Function|null} 模式切换回调 */
    this._onModeChange = null

    /** @type {boolean} 是否启用自适应 */
    this._adaptiveEnabled = true

    /** @type {number} 连续静止计数 */
    this._staticCount = 0

    /** @type {number} 连续活动计数 */
    this._activeCount = 0

    /** @type {number} 切换阈值 */
    this._switchThreshold = 3
  }

  /**
   * 根据运动状态调整功耗模式
   * @param {string} motionState - 'static' | 'active'
   */
  adjustForMotion(motionState) {
    if (!this._adaptiveEnabled) return

    if (motionState === 'static') {
      this._staticCount++
      this._activeCount = 0

      if (this._staticCount >= this._switchThreshold && this._currentMode !== POWER_MODE.LOW) {
        this.setMode(POWER_MODE.LOW)
      }
    } else {
      this._activeCount++
      this._staticCount = 0

      if (this._activeCount >= this._switchThreshold && this._currentMode !== POWER_MODE.NORMAL) {
        this.setMode(POWER_MODE.NORMAL)
      }
    }
  }

  /**
   * 设置功耗模式
   * @param {string} mode
   */
  setMode(mode) {
    if (mode === this._currentMode) return

    const oldMode = this._currentMode
    this._currentMode = mode

    if (this._onModeChange) {
      this._onModeChange(mode, oldMode)
    }

    console.log(`[PowerManager] Mode: ${oldMode} → ${mode} (${this._config[mode].description})`)
  }

  /**
   * 启用/禁用自适应功耗
   * @param {boolean} enabled
   */
  setAdaptive(enabled) {
    this._adaptiveEnabled = enabled
    if (!enabled) {
      this.setMode(POWER_MODE.NORMAL)
    }
  }

  /**
   * 设置模式切换回调
   * @param {Function} callback - (newMode, oldMode) => void
   */
  onModeChange(callback) {
    this._onModeChange = callback
  }

  /**
   * 获取当前配置
   * @returns {Object} { sampleRate, inferInterval, description }
   */
  getCurrentConfig() {
    return { ...this._config[this._currentMode] }
  }

  /** @returns {string} 当前功耗模式 */
  get currentMode() {
    return this._currentMode
  }

  /** @returns {boolean} 是否自适应启用 */
  get isAdaptive() {
    return this._adaptiveEnabled
  }
}

export { PowerManager, POWER_MODE, MODE_CONFIG }
