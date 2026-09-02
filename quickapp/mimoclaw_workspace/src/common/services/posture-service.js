/**
 * 体态检测服务
 * 负责传感器数据采集、体态分析、异常检测
 */

import sensor from '@system.sensor'
import storage from '@system.storage'

class PostureService {
  constructor() {
    this.isMonitoring = false
    this.sensorData = {
      accelerometer: { x: 0, y: 0, z: 0 },
      gyroscope: { x: 0, y: 0, z: 0 }
    }
    this.postureHistory = []
    this.lastCheckTime = null
    this.checkInterval = 30 * 60 * 1000 // 30分钟
    this.timer = null
  }

  /**
   * 开始监测
   */
  startMonitoring(callback) {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.onStatusChange = callback

    // 订阅加速度传感器
    sensor.subscribeAccelerometer({
      interval: 'normal',
      success: (data) => {
        this.sensorData.accelerometer = data
        this.analyzePosture()
      },
      fail: (err) => {
        console.error('加速度传感器错误:', err)
      }
    })

    // 订阅陀螺仪传感器
    sensor.subscribeGyroscope({
      interval: 'normal',
      success: (data) => {
        this.sensorData.gyroscope = data
      },
      fail: (err) => {
        console.error('陀螺仪传感器错误:', err)
      }
    })

    // 定时检测
    this.timer = setInterval(() => {
      this.checkPosture()
    }, this.checkInterval)

    console.log('体态监测已启动')
  }

  /**
   * 停止监测
   */
  stopMonitoring() {
    if (!this.isMonitoring) return

    this.isMonitoring = false

    // 取消传感器订阅
    sensor.unsubscribeAccelerometer()
    sensor.unsubscribeGyroscope()

    // 清除定时器
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }

    console.log('体态监测已停止')
  }

  /**
   * 分析体态
   * 基于加速度和陀螺仪数据判断体态
   */
  analyzePosture() {
    const accel = this.sensorData.accelerometer
    const gyro = this.sensorData.gyroscope

    // 计算倾斜角度
    const pitch = Math.atan2(accel.y, Math.sqrt(accel.x * accel.x + accel.z * accel.z)) * 180 / Math.PI
    const roll = Math.atan2(accel.x, Math.sqrt(accel.y * accel.y + accel.z * accel.z)) * 180 / Math.PI

    // 判断体态
    const posture = this.classifyPosture(pitch, roll)

    // 更新历史记录
    this.postureHistory.push({
      timestamp: Date.now(),
      posture: posture,
      pitch: pitch,
      roll: roll,
      accel: { ...accel },
      gyro: { ...gyro }
    })

    // 保持最近100条记录
    if (this.postureHistory.length > 100) {
      this.postureHistory.shift()
    }

    return posture
  }

  /**
   * 分类体态
   * @param {number} pitch - 俯仰角
   * @param {number} roll - 横滚角
   * @returns {string} 体态类型
   */
  classifyPosture(pitch, roll) {
    // 良好坐姿：身体基本直立，轻微前倾
    if (pitch > -20 && pitch < 20 && Math.abs(roll) < 15) {
      return 'good'
    }

    // 前倾过度
    if (pitch <= -20) {
      return 'leaning_forward'
    }

    // 后仰
    if (pitch >= 20) {
      return 'leaning_back'
    }

    // 侧倾
    if (Math.abs(roll) >= 15) {
      return 'tilted'
    }

    return 'unknown'
  }

  /**
   * 定时检查体态
   */
  checkPosture() {
    const posture = this.analyzePosture()
    const isGood = posture === 'good'

    // 通知回调
    if (this.onStatusChange) {
      this.onStatusChange({
        isGood: isGood,
        posture: posture,
        timestamp: Date.now()
      })
    }

    this.lastCheckTime = Date.now()
    return { isGood, posture }
  }

  /**
   * 获取当前体态状态
   */
  getCurrentPosture() {
    if (this.postureHistory.length === 0) {
      return { posture: 'unknown', isGood: false }
    }

    const latest = this.postureHistory[this.postureHistory.length - 1]
    return {
      posture: latest.posture,
      isGood: latest.posture === 'good',
      pitch: latest.pitch,
      roll: latest.roll
    }
  }

  /**
   * 获取体态统计
   */
  getPostureStats() {
    if (this.postureHistory.length === 0) {
      return {
        goodCount: 0,
        badCount: 0,
        goodPercent: 0,
        mostCommon: 'unknown'
      }
    }

    let goodCount = 0
    let badCount = 0
    const postureCounts = {}

    this.postureHistory.forEach(record => {
      if (record.posture === 'good') {
        goodCount++
      } else {
        badCount++
      }

      postureCounts[record.posture] = (postureCounts[record.posture] || 0) + 1
    })

    // 找出最常见的体态
    let mostCommon = 'unknown'
    let maxCount = 0
    Object.entries(postureCounts).forEach(([posture, count]) => {
      if (count > maxCount) {
        maxCount = count
        mostCommon = posture
      }
    })

    return {
      goodCount,
      badCount,
      goodPercent: Math.round((goodCount / this.postureHistory.length) * 100),
      mostCommon
    }
  }

  /**
   * 设置检测间隔
   */
  setCheckInterval(minutes) {
    this.checkInterval = minutes * 60 * 1000

    // 如果正在监测，重启定时器
    if (this.isMonitoring && this.timer) {
      clearInterval(this.timer)
      this.timer = setInterval(() => {
        this.checkPosture()
      }, this.checkInterval)
    }
  }

  /**
   * 保存数据到本地存储
   */
  saveData() {
    const today = this.getDateKey()
    const stats = this.getPostureStats()

    storage.set({
      key: `posture_${today}`,
      value: JSON.stringify({
        stats: stats,
        history: this.postureHistory.slice(-50) // 只保存最近50条
      }),
      success: () => {
        console.log('体态数据已保存')
      }
    })
  }

  /**
   * 加载历史数据
   */
  loadData(date) {
    return new Promise((resolve, reject) => {
      const key = `posture_${date || this.getDateKey()}`
      storage.get({
        key: key,
        success: (data) => {
          if (data) {
            resolve(JSON.parse(data))
          } else {
            resolve(null)
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  }

  /**
   * 获取日期键
   */
  getDateKey() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }

  /**
   * 获取体态描述
   */
  getPostureDescription(posture) {
    const descriptions = {
      'good': '✅ 良好坐姿',
      'leaning_forward': '⚠️ 过度前倾',
      'leaning_back': '⚠️ 过度后仰',
      'tilted': '⚠️ 身体侧倾',
      'unknown': '❓ 未知状态'
    }
    return descriptions[posture] || descriptions['unknown']
  }

  /**
   * 获取改善建议
   */
  getImprovementTips(posture) {
    const tips = {
      'good': ['继续保持当前坐姿！', '记得定时起身活动。'],
      'leaning_forward': ['调整椅子高度，使双脚平放地面。', '将屏幕抬高至与视线平齐。', '收紧核心肌群，保持背部挺直。'],
      'leaning_back': ['调整靠背角度，保持90-100度。', '使用腰靠支撑腰部曲线。', '避免长时间后仰看手机。'],
      'tilted': ['检查桌子是否平整。', '避免单侧负重。', '均衡使用双手。'],
      'unknown': ['请保持正确坐姿。']
    }
    return tips[posture] || tips['unknown']
  }
}

// 导出单例
export default new PostureService()
