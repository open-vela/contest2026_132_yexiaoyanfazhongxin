/**
 * alert-trigger.js - 分级提醒触发器
 *
 * 根据体态异常的严重程度触发不同级别的提醒：
 * - 轻微（severity=1）：单次短震动（50ms），30分钟内最多1次
 * - 中度（severity=2）：震动（100ms）+ 呼吸灯事件，15分钟内最多1次
 * - 严重（severity=3）：震动（200ms）+ 弹窗事件，即时触发但每小时最多2次
 *
 * @module core/alert-trigger
 */

import vibrator from '@system.vibrator'
import prompt from '@system.prompt'

/**
 * 提醒级别配置
 * @readonly
 */
const ALERT_LEVELS = {
  1: {
    name: '轻微',
    vibrationDuration: 50,
    cooldownMs: 30 * 60 * 1000, // 30分钟
    maxPerPeriod: 1,
    icon: '💡',
  },
  2: {
    name: '中度',
    vibrationDuration: 100,
    cooldownMs: 15 * 60 * 1000, // 15分钟
    maxPerPeriod: 1,
    icon: '⚠️',
  },
  3: {
    name: '严重',
    vibrationDuration: 200,
    cooldownMs: 60 * 60 * 1000, // 1小时
    maxPerPeriod: 2,
    icon: '🚨',
  },
}

/**
 * 体态类型中文名
 * @readonly
 */
const POSTURE_NAMES = {
  sedentary: '久坐',
  forward_tilt: '低头前倾',
  cross_leg: '跷二郎腿',
}

class AlertTrigger {
  constructor() {
    /** @type {Object} 各级别最后触发时间 */
    this.lastTriggerTime = {
      1: 0,
      2: 0,
      3: 0,
    }

    /** @type {Object} 各级别触发计数（用于每周期限制） */
    this.triggerCount = {
      1: 0,
      2: 0,
      3: 0,
    }

    /** @type {Object} 各级别计数重置时间 */
    this.countResetTime = {
      1: 0,
      2: 0,
      3: 0,
    }

    /** @type {Function|null} 事件回调 */
    this.onEvent = null

    /** @type {boolean} 是否静音模式 */
    this.isMuted = false
  }

  /**
   * 触发提醒
   * @param {Object} filterResult - 过滤器输出 { confirmed, posture, confidence, duration, severity, detail }
   * @returns {boolean} 是否成功触发
   */
  trigger(filterResult) {
    const { confirmed, posture, severity, duration, detail } = filterResult

    // 未确认的异常不触发提醒
    if (!confirmed) return false

    // 检查是否在冷却期
    if (this._isInCooldown(severity)) {
      return false
    }

    // 检查是否超过每周期最大次数
    if (this._isOverLimit(severity)) {
      return false
    }

    // 执行提醒
    const levelConfig = ALERT_LEVELS[severity]
    const postureName = POSTURE_NAMES[posture] || '未知'

    console.log(`[AlertTrigger] Triggering level ${severity}: ${postureName}`)

    // 1. 震动提醒
    if (!this.isMuted) {
      this._vibrate(levelConfig.vibrationDuration)
    }

    // 2. UI事件
    this._emitEvent(severity, posture, postureName, duration, detail)

    // 3. Toast提醒（仅严重级别）
    if (severity === 3) {
      this._showToast(`${levelConfig.icon} 检测到${postureName}异常，请注意调整姿势`)
    }

    // 4. 更新触发记录
    this._recordTrigger(severity)

    return true
  }

  /**
   * 震动提醒
   * @private
   * @param {number} duration - 震动时长（毫秒）
   */
  _vibrate(duration) {
    try {
      vibrator.vibrate({
        mode: 'short',
        duration: duration,
      })
    } catch (e) {
      console.error('[AlertTrigger] Vibrate error:', e)
    }
  }

  /**
   * 发送事件给UI层
   * @private
   * @param {number} severity - 严重程度
   * @param {string} posture - 体态类型
   * @param {string} postureName - 体态中文名
   * @param {number} duration - 持续时间（秒）
   * @param {string} detail - 详细描述
   */
  _emitEvent(severity, posture, postureName, duration, detail) {
    if (!this.onEvent) return

    const event = {
      type: 'posture_alert',
      severity,
      posture,
      postureName,
      duration: Math.round(duration),
      detail,
      timestamp: Date.now(),
      levelName: ALERT_LEVELS[severity].name,
      icon: ALERT_LEVELS[severity].icon,
    }

    // 根据级别发送不同事件
    switch (severity) {
      case 1:
        // 轻微：发送震动事件
        this.onEvent('light_alert', event)
        break
      case 2:
        // 中度：发送呼吸灯事件
        this.onEvent('breathing_light', event)
        break
      case 3:
        // 严重：发送弹窗事件
        this.onEvent('popup_alert', event)
        break
    }
  }

  /**
   * 显示Toast
   * @private
   * @param {string} message - 消息内容
   */
  _showToast(message) {
    try {
      prompt.showToast({
        message,
        duration: 3,
      })
    } catch (e) {
      console.error('[AlertTrigger] Toast error:', e)
    }
  }

  /**
   * 检查是否在冷却期
   * @private
   * @param {number} severity - 严重程度
   * @returns {boolean}
   */
  _isInCooldown(severity) {
    const levelConfig = ALERT_LEVELS[severity]
    const lastTime = this.lastTriggerTime[severity]
    const now = Date.now()

    return (now - lastTime) < levelConfig.cooldownMs
  }

  /**
   * 检查是否超过每周期最大次数
   * @private
   * @param {number} severity - 严重程度
   * @returns {boolean}
   */
  _isOverLimit(severity) {
    const levelConfig = ALERT_LEVELS[severity]
    const now = Date.now()
    const countTime = this.countResetTime[severity]

    // 检查是否需要重置计数
    if (now - countTime > levelConfig.cooldownMs) {
      this.triggerCount[severity] = 0
      this.countResetTime[severity] = now
      return false
    }

    return this.triggerCount[severity] >= levelConfig.maxPerPeriod
  }

  /**
   * 记录触发
   * @private
   * @param {number} severity - 严重程度
   */
  _recordTrigger(severity) {
    this.lastTriggerTime[severity] = Date.now()
    this.triggerCount[severity]++
  }

  /**
   * 设置静音模式
   * @param {boolean} muted - 是否静音
   */
  setMuted(muted) {
    this.isMuted = muted
    console.log(`[AlertTrigger] Mute mode: ${muted ? 'on' : 'off'}`)
  }

  /**
   * 获取提醒状态
   * @returns {Object}
   */
  getStatus() {
    const now = Date.now()
    const status = {}

    for (let level = 1; level <= 3; level++) {
      const levelConfig = ALERT_LEVELS[level]
      const lastTime = this.lastTriggerTime[level]
      const cooldownRemaining = Math.max(0, levelConfig.cooldownMs - (now - lastTime))

      status[level] = {
        name: levelConfig.name,
        cooldownRemaining: Math.round(cooldownRemaining / 1000), // 秒
        triggerCount: this.triggerCount[level],
        maxPerPeriod: levelConfig.maxPerPeriod,
      }
    }

    return status
  }

  /**
   * 重置所有触发记录
   */
  reset() {
    this.lastTriggerTime = { 1: 0, 2: 0, 3: 0 }
    this.triggerCount = { 1: 0, 2: 0, 3: 0 }
    this.countResetTime = { 1: 0, 2: 0, 3: 0 }
    console.log('[AlertTrigger] Reset')
  }
}

export { AlertTrigger, ALERT_LEVELS }
export default AlertTrigger
