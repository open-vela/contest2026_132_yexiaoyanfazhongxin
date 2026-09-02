/**
 * 日期工具类
 * 提供日期格式化、计算等功能
 */

class DateUtil {
  /**
   * 格式化日期
   */
  static format(date, format = 'YYYY-MM-DD HH:mm:ss') {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
  }

  /**
   * 获取今天的日期键
   */
  static getTodayKey() {
    return this.format(new Date(), 'YYYY-MM-DD')
  }

  /**
   * 获取当前时间
   */
  static getCurrentTime() {
    return this.format(new Date(), 'HH:mm')
  }

  /**
   * 获取星期几
   */
  static getDayOfWeek(date) {
    const d = new Date(date)
    const days = ['日', '一', '二', '三', '四', '五', '六']
    return days[d.getDay()]
  }

  /**
   * 获取本周的日期范围
   */
  static getWeekRange() {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const start = new Date(now)
    start.setDate(now.getDate() - dayOfWeek + 1) // 周一

    const end = new Date(start)
    end.setDate(start.getDate() + 6) // 周日

    return {
      start: this.format(start, 'MM月DD日'),
      end: this.format(end, 'MM月DD日')
    }
  }

  /**
   * 获取本周的所有日期
   */
  static getWeekDates() {
    const dates = []
    const now = new Date()
    const dayOfWeek = now.getDay()
    const start = new Date(now)
    start.setDate(now.getDate() - dayOfWeek + 1) // 周一

    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      dates.push({
        date: this.format(date, 'YYYY-MM-DD'),
        display: this.format(date, 'MM月DD日'),
        day: this.getDayOfWeek(date),
        isToday: this.format(date, 'YYYY-MM-DD') === this.getTodayKey()
      })
    }

    return dates
  }

  /**
   * 计算时间差
   */
  static getTimeDiff(startTime, endTime) {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const diffMs = end - start

    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    return {
      milliseconds: diffMs,
      minutes: diffMinutes,
      hours: diffHours,
      days: diffDays
    }
  }

  /**
   * 获取友好的时间描述
   */
  static getFriendlyTime(date) {
    const now = new Date()
    const d = new Date(date)
    const diff = this.getTimeDiff(d, now)

    if (diff.minutes < 1) {
      return '刚刚'
    } else if (diff.minutes < 60) {
      return `${diff.minutes}分钟前`
    } else if (diff.hours < 24) {
      return `${diff.hours}小时前`
    } else if (diff.days < 7) {
      return `${diff.days}天前`
    } else {
      return this.format(d, 'MM月DD日')
    }
  }

  /**
   * 判断是否是今天
   */
  static isToday(date) {
    const d = new Date(date)
    const today = new Date()
    return d.getFullYear() === today.getFullYear() &&
           d.getMonth() === today.getMonth() &&
           d.getDate() === today.getDate()
  }

  /**
   * 判断是否是本周
   */
  static isThisWeek(date) {
    const d = new Date(date)
    const now = new Date()
    const dayOfWeek = now.getDay()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - dayOfWeek + 1)
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)

    return d >= startOfWeek && d < endOfWeek
  }

  /**
   * 获取时间段描述
   */
  static getTimePeriod() {
    const hour = new Date().getHours()

    if (hour >= 5 && hour < 8) {
      return '早上好'
    } else if (hour >= 8 && hour < 12) {
      return '上午好'
    } else if (hour >= 12 && hour < 14) {
      return '中午好'
    } else if (hour >= 14 && hour < 18) {
      return '下午好'
    } else if (hour >= 18 && hour < 22) {
      return '晚上好'
    } else {
      return '夜深了'
    }
  }

  /**
   * 计算分钟数转换为小时分钟
   */
  static minutesToHoursMinutes(minutes) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours === 0) {
      return `${mins}分钟`
    } else if (mins === 0) {
      return `${hours}小时`
    } else {
      return `${hours}小时${mins}分钟`
    }
  }

  /**
   * 获取倒计时文本
   */
  static getCountdown(targetTime) {
    const now = new Date()
    const target = new Date(targetTime)
    const diff = this.getTimeDiff(now, target)

    if (diff.milliseconds < 0) {
      return '已过期'
    }

    if (diff.days > 0) {
      return `${diff.days}天${diff.hours}小时后`
    } else if (diff.hours > 0) {
      return `${diff.hours}小时${diff.minutes % 60}分钟后`
    } else {
      return `${diff.minutes}分钟后`
    }
  }
}

export default DateUtil
