/**
 * adaptive-threshold.js - 自适应阈值基线
 *
 * 维护用户7日历史基线，动态调整体态判定阈值。
 * 每日结束时更新阈值：新阈值 = 0.7*默认阈值 + 0.3*历史均值
 *
 * @module core/adaptive-threshold
 */

import storage from '@system.storage'

/**
 * 默认阈值配置
 * @readonly
 */
const DEFAULT_THRESHOLDS = {
  sedentary: {
    variance: 0.01,      // 加速度方差阈值
    time: 30 * 60,       // 持续时间（秒），30分钟
  },
  forwardTilt: {
    angle: -30,          // 俯仰角阈值（度），负值表示低头
    time: 10,            // 持续时间（秒）
  },
  crossLeg: {
    asymmetry: 0.25,     // 不对称指数阈值
    variance: 0.05,      // 加速度方差上限
    time: 10,            // 持续时间（秒）
  },
}

/**
 * 更新权重配置
 * @readonly
 */
const UPDATE_WEIGHTS = {
  default: 0.7,    // 默认阈值权重
  history: 0.3,    // 历史均值权重
}

/**
 * 历史数据存储键前缀
 * @type {string}
 */
const STORAGE_KEY_PREFIX = 'pg_threshold_'

/**
 * 历史数据保留天数
 * @type {number}
 */
const HISTORY_DAYS = 7

class AdaptiveThreshold {
  /**
   * @param {Object} options - 配置选项
   * @param {number} [options.historyDays=7] - 历史数据保留天数
   */
  constructor(options = {}) {
    /** @type {number} 历史数据保留天数 */
    this.historyDays = options.historyDays || HISTORY_DAYS

    /** @type {Object} 当前阈值（默认值） */
    this.currentThresholds = JSON.parse(JSON.stringify(DEFAULT_THRESHOLDS))

    /** @type {Object} 历史统计数据 */
    this.historyStats = {
      sedentaryVariance: [],
      sedentaryTime: [],
      forwardTiltAngle: [],
      forwardTiltTime: [],
      crossLegAsymmetry: [],
      crossLegVariance: [],
      crossLegTime: [],
    }

    /** @type {boolean} 是否已加载历史数据 */
    this.isLoaded = false

    /** @type {string} 当前日期 */
    this.currentDate = this._getDateStr()
  }

  /**
   * 初始化：加载历史数据
   * @returns {Promise<void>}
   */
  async init() {
    await this._loadHistory()
    this._updateThresholds()
    this.isLoaded = true
    console.log('[AdaptiveThreshold] Initialized')
  }

  /**
   * 获取当前阈值
   * @returns {Object} 阈值配置
   */
  getCurrentThresholds() {
    return JSON.parse(JSON.stringify(this.currentThresholds))
  }

  /**
   * 记录一次体态检测结果（用于更新历史基线）
   * @param {string} postureType - 体态类型
   * @param {Object} features - 特征向量
   * @param {number} duration - 持续时间（秒）
   */
  recordDetection(postureType, features, duration) {
    const today = this._getDateStr()

    // 只记录异常体态（非正常）
    if (postureType === 'normal' || postureType === 'walking') {
      return
    }

    switch (postureType) {
      case 'sedentary':
        this.historyStats.sedentaryVariance.push(features.accVar)
        this.historyStats.sedentaryTime.push(duration)
        break

      case 'forward_tilt':
        this.historyStats.forwardTiltAngle.push(features.gyroPitch)
        this.historyStats.forwardTiltTime.push(duration)
        break

      case 'cross_leg':
        this.historyStats.crossLegAsymmetry.push(features.asymmetryIndex)
        this.historyStats.crossLegVariance.push(features.accVar)
        this.historyStats.crossLegTime.push(duration)
        break
    }

    // 限制历史数据量
    this._trimHistory()
  }

  /**
   * 保存历史数据（每日结束时调用）
   * @returns {Promise<void>}
   */
  async saveHistory() {
    const data = {
      date: this.currentDate,
      stats: this.historyStats,
      thresholds: this.currentThresholds,
    }

    return new Promise((resolve, reject) => {
      storage.set({
        key: STORAGE_KEY_PREFIX + this.currentDate,
        value: JSON.stringify(data),
        success: () => {
          console.log(`[AdaptiveThreshold] History saved for ${this.currentDate}`)
          resolve()
        },
        fail: (data, code) => {
          console.error(`[AdaptiveThreshold] Save failed: ${code}`)
          reject(new Error(`Storage save failed: ${code}`))
        },
      })
    })
  }

  /**
   * 更新阈值（基于历史数据）
   * @private
   */
  _updateThresholds() {
    const stats = this.historyStats
    const defaults = DEFAULT_THRESHOLDS
    const w = UPDATE_WEIGHTS

    // 计算历史均值
    const avgSedentaryVariance = this._calcAvg(stats.sedentaryVariance)
    const avgSedentaryTime = this._calcAvg(stats.sedentaryTime)
    const avgForwardTiltAngle = this._calcAvg(stats.forwardTiltAngle)
    const avgForwardTiltTime = this._calcAvg(stats.forwardTiltTime)
    const avgCrossLegAsymmetry = this._calcAvg(stats.crossLegAsymmetry)
    const avgCrossLegVariance = this._calcAvg(stats.crossLegVariance)
    const avgCrossLegTime = this._calcAvg(stats.crossLegTime)

    // 如果有历史数据，使用加权更新
    if (stats.sedentaryVariance.length > 0) {
      this.currentThresholds.sedentary.variance =
        w.default * defaults.sedentary.variance + w.history * avgSedentaryVariance
      this.currentThresholds.sedentary.time =
        w.default * defaults.sedentary.time + w.history * avgSedentaryTime
    }

    if (stats.forwardTiltAngle.length > 0) {
      this.currentThresholds.forwardTilt.angle =
        w.default * defaults.forwardTilt.angle + w.history * avgForwardTiltAngle
      this.currentThresholds.forwardTilt.time =
        w.default * defaults.forwardTilt.time + w.history * avgForwardTiltTime
    }

    if (stats.crossLegAsymmetry.length > 0) {
      this.currentThresholds.crossLeg.asymmetry =
        w.default * defaults.crossLeg.asymmetry + w.history * avgCrossLegAsymmetry
      this.currentThresholds.crossLeg.variance =
        w.default * defaults.crossLeg.variance + w.history * avgCrossLegVariance
      this.currentThresholds.crossLeg.time =
        w.default * defaults.crossLeg.time + w.history * avgCrossLegTime
    }

    console.log('[AdaptiveThreshold] Thresholds updated')
  }

  /**
   * 加载历史数据
   * @private
   * @returns {Promise<void>}
   */
  async _loadHistory() {
    const dates = this._getRecentDates(this.historyDays)

    for (const date of dates) {
      try {
        const data = await this._readStorage(STORAGE_KEY_PREFIX + date)
        if (data) {
          this._mergeHistoryData(data.stats)
        }
      } catch (e) {
        // 忽略读取失败的日期
      }
    }
  }

  /**
   * 合并历史数据
   * @private
   * @param {Object} stats - 历史统计数据
   */
  _mergeHistoryData(stats) {
    if (!stats) return

    const merge = (target, source) => {
      if (Array.isArray(source)) {
        target.push(...source)
      }
    }

    merge(this.historyStats.sedentaryVariance, stats.sedentaryVariance)
    merge(this.historyStats.sedentaryTime, stats.sedentaryTime)
    merge(this.historyStats.forwardTiltAngle, stats.forwardTiltAngle)
    merge(this.historyStats.forwardTiltTime, stats.forwardTiltTime)
    merge(this.historyStats.crossLegAsymmetry, stats.crossLegAsymmetry)
    merge(this.historyStats.crossLegVariance, stats.crossLegVariance)
    merge(this.historyStats.crossLegTime, stats.crossLegTime)
  }

  /**
   * 读取存储
   * @private
   * @param {string} key - 存储键
   * @returns {Promise<Object|null>}
   */
  _readStorage(key) {
    return new Promise((resolve, reject) => {
      storage.get({
        key,
        success: (data) => {
          try {
            resolve(JSON.parse(data))
          } catch (e) {
            resolve(null)
          }
        },
        fail: () => {
          resolve(null)
        },
      })
    })
  }

  /**
   * 计算数组均值
   * @private
   * @param {Array} arr - 数组
   * @returns {number} 均值
   */
  _calcAvg(arr) {
    if (!arr || arr.length === 0) return 0
    const sum = arr.reduce((a, b) => a + b, 0)
    return sum / arr.length
  }

  /**
   * 限制历史数据量（每个类型最多保留100条）
   * @private
   */
  _trimHistory() {
    const MAX_RECORDS = 100

    const trim = (arr) => {
      while (arr.length > MAX_RECORDS) {
        arr.shift()
      }
    }

    trim(this.historyStats.sedentaryVariance)
    trim(this.historyStats.sedentaryTime)
    trim(this.historyStats.forwardTiltAngle)
    trim(this.historyStats.forwardTiltTime)
    trim(this.historyStats.crossLegAsymmetry)
    trim(this.historyStats.crossLegVariance)
    trim(this.historyStats.crossLegTime)
  }

  /**
   * 获取最近N天的日期字符串
   * @private
   * @param {number} days - 天数
   * @returns {Array<string>} 日期字符串数组
   */
  _getRecentDates(days) {
    const dates = []
    const now = new Date()

    for (let i = 0; i < days; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      dates.push(this._formatDate(d))
    }

    return dates
  }

  /**
   * 获取当前日期字符串
   * @private
   * @returns {string} YYYY-MM-DD
   */
  _getDateStr() {
    return this._formatDate(new Date())
  }

  /**
   * 格式化日期
   * @private
   * @param {Date} d - 日期对象
   * @returns {string} YYYY-MM-DD
   */
  _formatDate(d) {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  /**
   * 检查是否需要更新日期
   */
  checkDateUpdate() {
    const today = this._getDateStr()
    if (today !== this.currentDate) {
      // 日期变化，保存旧数据并更新
      this.saveHistory().then(() => {
        this.currentDate = today
        this.historyStats = {
          sedentaryVariance: [],
          sedentaryTime: [],
          forwardTiltAngle: [],
          forwardTiltTime: [],
          crossLegAsymmetry: [],
          crossLegVariance: [],
          crossLegTime: [],
        }
        this._loadHistory().then(() => {
          this._updateThresholds()
        })
      })
    }
  }
}

export { AdaptiveThreshold, DEFAULT_THRESHOLDS }
export default AdaptiveThreshold
