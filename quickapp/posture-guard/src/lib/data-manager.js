/**
 * data-manager.js - 数据生命周期管理
 *
 * 管理所有本地数据的存储、查询、过期清理：
 * - 体态统计数据（L1）
 * - 体态异常记录（L2加密）
 * - 心率/压力原始数据（L3加密）
 * - 数据过期自动销毁
 * - 一键清除隐私数据
 */

import CryptoStore, { CRYPTO_LEVEL } from './crypto-store'

// 数据类型常量
const DATA_TYPE = {
  POSTURE_DAILY: 'posture_daily',         // 每日体态统计
  POSTURE_ALERT: 'posture_alert',         // 体态异常记录
  HR_FEATURE: 'hr_feature',               // 心率脱敏特征
  STRESS_FEATURE: 'stress_feature',       // 压力脱敏特征
  SETTINGS: 'settings',                   // 应用设置
}

// 数据过期时间配置（毫秒）
const EXPIRY = {
  [DATA_TYPE.POSTURE_DAILY]: 7 * 24 * 3600 * 1000,    // 7天
  [DATA_TYPE.POSTURE_ALERT]: 30 * 24 * 3600 * 1000,   // 30天
  [DATA_TYPE.HR_FEATURE]: 30 * 24 * 3600 * 1000,      // 30天
  [DATA_TYPE.STRESS_FEATURE]: 30 * 24 * 3600 * 1000,  // 30天
}

// 数据加密级别映射
const LEVEL_MAP = {
  [DATA_TYPE.POSTURE_DAILY]: CRYPTO_LEVEL.L1,
  [DATA_TYPE.POSTURE_ALERT]: CRYPTO_LEVEL.L2,
  [DATA_TYPE.HR_FEATURE]: CRYPTO_LEVEL.L3,
  [DATA_TYPE.STRESS_FEATURE]: CRYPTO_LEVEL.L3,
  [DATA_TYPE.SETTINGS]: CRYPTO_LEVEL.L1,
}

class DataManager {
  constructor() {
    this.cryptoStore = new CryptoStore()
    // 键名注册表（用于遍历清理）
    this.keyRegistry = []
  }

  /**
   * 生成存储键名
   * @private
   */
  _makeKey(type, date) {
    const dateStr = date || this._getDateStr()
    return `pg_${type}_${dateStr}`
  }

  /**
   * 获取日期字符串 YYYY-MM-DD
   * @private
   */
  _getDateStr(ts) {
    const d = ts ? new Date(ts) : new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  /**
   * 保存体态统计数据
   * @param {Object} stats - { sedentaryCount, headTiltCount, legCrossCount, totalAlerts }
   * @param {Function} callback - 完成回调
   */
  savePostureStats(stats, callback) {
    const key = this._makeKey(DATA_TYPE.POSTURE_DAILY)
    const data = {
      ...stats,
      date: this._getDateStr(),
      timestamp: Date.now(),
    }

    this._registerKey(key)
    this.cryptoStore.save(
      LEVEL_MAP[DATA_TYPE.POSTURE_DAILY],
      key,
      data,
      () => {
        console.log(`[DataManager] save posture stats: ${key}`)
        if (callback) callback(true)
      },
      () => {
        if (callback) callback(false)
      }
    )
  }

  /**
   * 保存体态异常记录
   * @param {Object} alert - { type, confidence, detail, timestamp }
   * @param {Function} callback - 完成回调
   */
  savePostureAlert(alert, callback) {
    const today = this._getDateStr()
    const key = this._makeKey(DATA_TYPE.POSTURE_ALERT) + '_' + Date.now()

    const data = {
      ...alert,
      date: today,
      timestamp: alert.timestamp || Date.now(),
    }

    this._registerKey(key)
    this.cryptoStore.save(
      LEVEL_MAP[DATA_TYPE.POSTURE_ALERT],
      key,
      data,
      () => {
        console.log(`[DataManager] save posture alert`)
        if (callback) callback(true)
      },
      () => {
        if (callback) callback(false)
      }
    )
  }

  /**
   * 保存心率脱敏特征
   * @param {Object} feature - anonymizer 输出的特征
   * @param {Function} callback - 完成回调
   */
  saveHRFeature(feature, callback) {
    const key = this._makeKey(DATA_TYPE.HR_FEATURE) + '_' + feature.hourBucket

    this._registerKey(key)
    this.cryptoStore.save(
      LEVEL_MAP[DATA_TYPE.HR_FEATURE],
      key,
      feature,
      () => {
        console.log(`[DataManager] save HR feature`)
        if (callback) callback(true)
      },
      () => {
        if (callback) callback(false)
      }
    )
  }

  /**
   * 保存压力脱敏特征
   * @param {Object} feature - anonymizer 输出的特征
   * @param {Function} callback - 完成回调
   */
  saveStressFeature(feature, callback) {
    const key = this._makeKey(DATA_TYPE.STRESS_FEATURE) + '_' + feature.hourBucket

    this._registerKey(key)
    this.cryptoStore.save(
      LEVEL_MAP[DATA_TYPE.STRESS_FEATURE],
      key,
      feature,
      () => {
        console.log(`[DataManager] save stress feature`)
        if (callback) callback(true)
      },
      () => {
        if (callback) callback(false)
      }
    )
  }

  /**
   * 加载今日体态统计
   * @param {Function} callback - (data) => {}
   */
  loadTodayPostureStats(callback) {
    const key = this._makeKey(DATA_TYPE.POSTURE_DAILY)
    this.cryptoStore.load(LEVEL_MAP[DATA_TYPE.POSTURE_DAILY], key, callback, () => {
      callback(null)
    })
  }

  /**
   * 加载今日体态异常记录
   * @param {Function} callback - (alerts[]) => {}
   */
  loadTodayAlerts(callback) {
    // 从注册表中筛选今日的异常记录键
    const todayPrefix = this._makeKey(DATA_TYPE.POSTURE_ALERT)
    const todayKeys = this.keyRegistry.filter((k) => k.startsWith(todayPrefix))

    if (todayKeys.length === 0) {
      callback([])
      return
    }

    const alerts = []
    let remaining = todayKeys.length

    todayKeys.forEach((key) => {
      this.cryptoStore.load(LEVEL_MAP[DATA_TYPE.POSTURE_ALERT], key, (data) => {
        if (data) alerts.push(data)
        remaining--
        if (remaining === 0) {
          // 按时间排序
          alerts.sort((a, b) => a.timestamp - b.timestamp)
          callback(alerts)
        }
      }, () => {
        remaining--
        if (remaining === 0) callback(alerts)
      })
    })
  }

  /**
   * 加载指定日期范围的心率特征
   * @param {number} days - 回溯天数
   * @param {Function} callback - (features[]) => {}
   */
  loadHRFeatures(days, callback) {
    const features = []
    let remaining = 0

    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = this._getDateStr(date.getTime())
      const prefix = `pg_${DATA_TYPE.HR_FEATURE}_${dateStr}`
      const keys = this.keyRegistry.filter((k) => k.startsWith(prefix))
      remaining += keys.length

      keys.forEach((key) => {
        this.cryptoStore.load(LEVEL_MAP[DATA_TYPE.HR_FEATURE], key, (data) => {
          if (data) features.push(data)
          remaining--
          if (remaining === 0) callback(features)
        }, () => {
          remaining--
          if (remaining === 0) callback(features)
        })
      })
    }

    if (remaining === 0) callback(features)
  }

  /**
   * 保存应用设置
   * @param {Object} settings
   * @param {Function} callback
   */
  saveSettings(settings, callback) {
    const key = 'pg_settings'
    this._registerKey(key)
    this.cryptoStore.save(CRYPTO_LEVEL.L1, key, settings, () => {
      if (callback) callback(true)
    }, () => {
      if (callback) callback(false)
    })
  }

  /**
   * 加载应用设置
   * @param {Function} callback - (settings) => {}
   */
  loadSettings(callback) {
    this.cryptoStore.load(CRYPTO_LEVEL.L1, 'pg_settings', callback, () => {
      callback({
        sedentaryThreshold: 30 * 60 * 1000, // 默认30分钟
        vibrationEnabled: true,
        alertEnabled: true,
      })
    })
  }

  /**
   * 清理过期数据
   * @param {Function} callback - (cleanedCount) => {}
   */
  cleanExpired(callback) {
    const now = Date.now()
    const expiredKeys = []

    this.keyRegistry.forEach((key) => {
      // 从键名中提取类型
      for (const [type, expiryMs] of Object.entries(EXPIRY)) {
        if (key.includes(type)) {
          // 尝试从键名中提取时间戳或日期
          const dateMatch = key.match(/(\d{4}-\d{2}-\d{2})/)
          if (dateMatch) {
            const dataDate = new Date(dateMatch[1]).getTime()
            if (now - dataDate > expiryMs) {
              expiredKeys.push(key)
            }
          }
          break
        }
      }
    })

    if (expiredKeys.length === 0) {
      if (callback) callback(0)
      return
    }

    // 从注册表中移除过期键
    this.keyRegistry = this.keyRegistry.filter((k) => !expiredKeys.includes(k))

    // 删除过期数据
    this.cryptoStore.batchRemove(expiredKeys, () => {
      console.log(`[DataManager] cleaned ${expiredKeys.length} expired keys`)
      if (callback) callback(expiredKeys.length)
    })
  }

  /**
   * 一键清除所有隐私数据（保留设置）
   * @param {Function} callback - 完成回调
   */
  clearAllPrivacyData(callback) {
    const privacyKeys = this.keyRegistry.filter(
      (k) => !k.includes(DATA_TYPE.SETTINGS)
    )
    this.keyRegistry = this.keyRegistry.filter((k) => k.includes(DATA_TYPE.SETTINGS))

    this.cryptoStore.batchRemove(privacyKeys, () => {
      console.log(`[DataManager] cleared ${privacyKeys.length} privacy keys`)
      if (callback) callback()
    })
  }

  /**
   * 获取数据统计摘要
   * @param {Function} callback - (summary) => {}
   */
  getSummary(callback) {
    const summary = {
      totalKeys: this.keyRegistry.length,
      postureDaily: 0,
      postureAlerts: 0,
      hrFeatures: 0,
      stressFeatures: 0,
    }

    this.keyRegistry.forEach((key) => {
      if (key.includes(DATA_TYPE.POSTURE_DAILY)) summary.postureDaily++
      else if (key.includes(DATA_TYPE.POSTURE_ALERT)) summary.postureAlerts++
      else if (key.includes(DATA_TYPE.HR_FEATURE)) summary.hrFeatures++
      else if (key.includes(DATA_TYPE.STRESS_FEATURE)) summary.stressFeatures++
    })

    summary.cryptoStats = this.cryptoStore.getStats()
    callback(summary)
  }

  /**
   * 注册键名到注册表
   * @private
   */
  _registerKey(key) {
    if (!this.keyRegistry.includes(key)) {
      this.keyRegistry.push(key)
    }
  }
}

export { DATA_TYPE, EXPIRY }
export default DataManager
