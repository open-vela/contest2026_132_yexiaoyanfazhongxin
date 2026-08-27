/**
 * data-store.js — KVDB 数据存储
 *
 * 基于 system.storage 的体态数据存储。
 * 存储体态历史记录和每日统计数据。
 *
 * @module storage/data-store
 */

import storage from '@system.storage'

const STORAGE_KEYS = {
  DAILY_STATS: 'pose_daily_stats',      // 每日统计
  HISTORY: 'pose_history',              // 体态历史（最近 7 天）
  SETTINGS: 'pose_settings',           // 用户设置
  CURRENT_SESSION: 'pose_session',      // 当前会话数据
}

class DataStore {
  constructor() {
    this._cache = {}
  }

  /**
   * 初始化存储
   * @returns {Promise<void>}
   */
  async init() {
    // 加载缓存
    for (const [key, value] of Object.entries(STORAGE_KEYS)) {
      try {
        const data = await this._get(value)
        this._cache[value] = data ? JSON.parse(data) : null
      } catch (e) {
        this._cache[value] = null
      }
    }
    console.log('[DataStore] Initialized')
  }

  /**
   * 记录一次体态识别结果
   * @param {Object} result - { pose, confidence, timestamp }
   */
  async recordPosture(result) {
    const today = this._getTodayKey()

    // 更新当前会话
    if (!this._cache[STORAGE_KEYS.CURRENT_SESSION]) {
      this._cache[STORAGE_KEYS.CURRENT_SESSION] = {
        date: today,
        records: [],
        summary: {},
      }
    }

    const session = this._cache[STORAGE_KEYS.CURRENT_SESSION]
    session.records.push({
      pose: result.pose,
      confidence: result.confidence,
      timestamp: result.timestamp || Date.now(),
    })

    // 限制会话记录数
    if (session.records.length > 10000) {
      session.records = session.records.slice(-5000)
    }

    // 更新每日统计
    this._updateDailyStats(today, result)

    // 异步持久化（不阻塞）
    this._persistSession()
  }

  /**
   * 获取每日统计
   * @param {string} [date] - 日期 key，默认今天
   * @returns {Object} { date, total, distribution: {pose: count}, avgConfidence }
   */
  async getDailyStats(date) {
    const key = date || this._getTodayKey()
    const stats = this._cache[STORAGE_KEYS.DAILY_STATS]
    return stats && stats[key] ? stats[key] : {
      date: key,
      total: 0,
      distribution: {},
      avgConfidence: 0,
    }
  }

  /**
   * 获取最近 N 天的统计
   * @param {number} days - 天数
   * @returns {Array}
   */
  async getWeeklyStats(days = 7) {
    const stats = this._cache[STORAGE_KEYS.DAILY_STATS] || {}
    const result = []

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = this._formatDate(d)
      result.push(stats[key] || {
        date: key,
        total: 0,
        distribution: {},
        avgConfidence: 0,
      })
    }

    return result
  }

  /**
   * 获取当前会话记录
   * @returns {Array}
   */
  getSessionRecords() {
    const session = this._cache[STORAGE_KEYS.CURRENT_SESSION]
    return session ? session.records : []
  }

  /**
   * 清除当前会话
   */
  async clearSession() {
    this._cache[STORAGE_KEYS.CURRENT_SESSION] = null
    await this._remove(STORAGE_KEYS.CURRENT_SESSION)
  }

  /**
   * 获取所有设置
   * @returns {Object}
   */
  async getSettings() {
    const data = await this._get(STORAGE_KEYS.SETTINGS)
    return data ? JSON.parse(data) : {
      sensitivity: 'medium',
      samplingRate: 50,
      retentionDays: 30,
      modelType: 'static_cnn',
    }
  }

  /**
   * 保存设置
   * @param {Object} settings
   */
  async saveSettings(settings) {
    await this._set(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
  }

  // ── 内部方法 ──

  _updateDailyStats(today, result) {
    if (!this._cache[STORAGE_KEYS.DAILY_STATS]) {
      this._cache[STORAGE_KEYS.DAILY_STATS] = {}
    }

    const stats = this._cache[STORAGE_KEYS.DAILY_STATS]
    if (!stats[today]) {
      stats[today] = { date: today, total: 0, distribution: {}, avgConfidence: 0 }
    }

    const day = stats[today]
    day.total++
    day.distribution[result.pose] = (day.distribution[result.pose] || 0) + 1
    day.avgConfidence = (day.avgConfidence * (day.total - 1) + result.confidence) / day.total
  }

  _getTodayKey() {
    return this._formatDate(new Date())
  }

  _formatDate(d) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  async _persistSession() {
    try {
      const session = this._cache[STORAGE_KEYS.CURRENT_SESSION]
      if (session) {
        await this._set(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session))
      }
      // 同时持久化统计
      const stats = this._cache[STORAGE_KEYS.DAILY_STATS]
      if (stats) {
        await this._set(STORAGE_KEYS.DAILY_STATS, JSON.stringify(stats))
      }
    } catch (e) {
      console.error('[DataStore] Persist failed:', e)
    }
  }

  _get(key) {
    return new Promise((resolve, reject) => {
      storage.get({
        key,
        success: (data) => resolve(data),
        fail: () => resolve(null),
      })
    })
  }

  _set(key, value) {
    return new Promise((resolve, reject) => {
      storage.set({
        key,
        value,
        success: () => resolve(),
        fail: (err) => reject(err),
      })
    })
  }

  _remove(key) {
    return new Promise((resolve) => {
      storage.delete({
        key,
        success: () => resolve(),
        fail: () => resolve(),
      })
    })
  }
}

export { DataStore, STORAGE_KEYS }
