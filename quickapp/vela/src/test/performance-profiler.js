/**
 * 性能/功耗分析工具
 *
 * 记录运行期间的 CPU 占用、内存占用、存储写入次数，
 * 估算电量消耗。
 *
 * @module test/performance-profiler
 */

/**
 * 功耗模型参数
 */
const POWER_MODEL = {
  // 基础功耗 (mAh/h)
  basePower: 2.0,
  // 传感器功耗系数
  sensorPower: {
    active: 1.5,
    balanced: 0.8,
    power: 0.4,
    night: 0.05,
  },
  // AI推理功耗 (mAh/次)
  inferencePower: 0.001,
  // 存储写入功耗 (mAh/次)
  storageWritePower: 0.0005,
  // 电池容量 (mAh)
  batteryCapacity: 300,
}

/**
 * 性能分析器
 */
export class PerformanceProfiler {
  constructor() {
    // 采样记录
    this._samples = []
    this._sampleInterval = null
    this._sampleIntervalMs = 60000 // 每分钟采样一次

    // 运行统计
    this._startTime = Date.now()
    this._inferenceCount = 0
    this._storageWriteCount = 0
    this._sensorDataCount = 0

    // 模式记录
    this._modeHistory = []
    this._currentMode = 'active'
  }

  /**
   * 初始化分析器
   *
   * @returns {Promise<boolean>}
   */
  async init() {
    this._startTime = Date.now()
    this._startSampling()
    return true
  }

  /**
   * 开始采样
   * @private
   */
  _startSampling() {
    this._sampleInterval = setInterval(() => {
      this._collectSample()
    }, this._sampleIntervalMs)
  }

  /**
   * 收集性能样本
   * @private
   */
  _collectSample() {
    const sample = {
      timestamp: Date.now(),
      elapsedMs: Date.now() - this._startTime,
      // 模拟内存使用 (实际使用 @system.device API)
      memoryUsed: this._estimateMemoryUsage(),
      memoryTotal: 64, // MB
      // 模拟 CPU 使用
      cpuUsage: this._estimateCpuUsage(),
      // 模式
      mode: this._currentMode,
    }

    this._samples.push(sample)

    // 限制样本数量
    if (this._samples.length > 480) { // 8小时 * 60分钟
      this._samples.shift()
    }
  }

  /**
   * 记录推理事件
   */
  recordInference() {
    this._inferenceCount++
  }

  /**
   * 记录存储写入事件
   */
  recordStorageWrite() {
    this._storageWriteCount++
  }

  /**
   * 记录传感器数据事件
   */
  recordSensorData() {
    this._sensorDataCount++
  }

  /**
   * 记录模式切换
   *
   * @param {string} mode
   */
  recordModeChange(mode) {
    this._currentMode = mode
    this._modeHistory.push({
      timestamp: Date.now(),
      mode,
    })
  }

  /**
   * 获取运行时长
   *
   * @returns {number} 小时
   */
  getRuntimeHours() {
    return (Date.now() - this._startTime) / (1000 * 60 * 60)
  }

  /**
   * 估算内存使用
   * @private
   */
  _estimateMemoryUsage() {
    // 简化估算：基础 + 数据缓冲 + 引擎状态
    const baseMemory = 8 // MB
    const bufferMemory = Math.min(this._sensorDataCount * 0.001, 5) // 最多5MB
    const engineMemory = 4 // MB
    return baseMemory + bufferMemory + engineMemory
  }

  /**
   * 估算 CPU 使用率
   * @private
   */
  _estimateCpuUsage() {
    const modeCpu = {
      active: 35,
      balanced: 20,
      power: 10,
      night: 2,
    }
    return modeCpu[this._currentMode] || 20
  }

  /**
   * 估算功耗
   *
   * @param {number} hours - 运行小时数
   * @returns {Object}
   */
  estimatePowerConsumption(hours) {
    // 计算各模式运行时长
    const modeDurations = this._calculateModeDurations(hours)

    // 计算传感器功耗
    let sensorPower = 0
    for (const [mode, duration] of Object.entries(modeDurations)) {
      sensorPower += (POWER_MODEL.sensorPower[mode] || 0) * duration
    }

    // 计算推理功耗
    const inferencePower = this._inferenceCount * POWER_MODEL.inferencePower

    // 计算存储写入功耗
    const storagePower = this._storageWriteCount * POWER_MODEL.storageWritePower

    // 基础功耗
    const basePower = POWER_MODEL.basePower * hours

    // 总功耗
    const totalPower = basePower + sensorPower + inferencePower + storagePower

    // 转换为百分比
    const percentConsumed = (totalPower / POWER_MODEL.batteryCapacity) * 100

    return {
      totalMah: Math.round(totalPower * 100) / 100,
      percentConsumed: Math.round(percentConsumed * 100) / 100,
      breakdown: {
        base: Math.round(basePower * 100) / 100,
        sensor: Math.round(sensorPower * 100) / 100,
        inference: Math.round(inferencePower * 1000) / 1000,
        storage: Math.round(storagePower * 1000) / 1000,
      },
      modeDurations,
      batteryCapacity: POWER_MODEL.batteryCapacity,
    }
  }

  /**
   * 计算各模式运行时长
   * @private
   */
  _calculateModeDurations(totalHours) {
    const durations = {
      active: 0,
      balanced: 0,
      power: 0,
      night: 0,
    }

    if (this._modeHistory.length === 0) {
      durations[this._currentMode] = totalHours
      return durations
    }

    // 根据历史记录估算
    const modeCounts = {}
    for (const entry of this._modeHistory) {
      modeCounts[entry.mode] = (modeCounts[entry.mode] || 0) + 1
    }

    const total = Object.values(modeCounts).reduce((a, b) => a + b, 0)
    for (const [mode, count] of Object.entries(modeCounts)) {
      durations[mode] = (count / total) * totalHours
    }

    return durations
  }

  /**
   * 生成性能报告
   *
   * @returns {Object}
   */
  generateReport() {
    const runtimeHours = this.getRuntimeHours()
    const powerEstimate = this.estimatePowerConsumption(runtimeHours)

    const avgMemory = this._samples.length > 0
      ? this._samples.reduce((sum, s) => sum + s.memoryUsed, 0) / this._samples.length
      : 0

    const avgCpu = this._samples.length > 0
      ? this._samples.reduce((sum, s) => sum + s.cpuUsage, 0) / this._samples.length
      : 0

    return {
      timestamp: Date.now(),
      runtime: {
        hours: Math.round(runtimeHours * 100) / 100,
        startTime: this._startTime,
      },
      resources: {
        avgMemoryMb: Math.round(avgMemory * 10) / 10,
        avgCpuPercent: Math.round(avgCpu),
        maxMemoryMb: Math.round(Math.max(...this._samples.map(s => s.memoryUsed), 0) * 10) / 10,
      },
      counters: {
        inferences: this._inferenceCount,
        storageWrites: this._storageWriteCount,
        sensorDataPoints: this._sensorDataCount,
        modeChanges: this._modeHistory.length,
      },
      power: powerEstimate,
      samples: this._samples.length,
    }
  }

  /**
   * 格式化性能报告
   *
   * @param {Object} report
   * @returns {string}
   */
  static formatReport(report) {
    let text = '=== 性能分析报告 ===\n'
    text += `时间: ${new Date(report.timestamp).toLocaleString()}\n`
    text += `运行时长: ${report.runtime.hours} 小时\n\n`

    text += '--- 资源使用 ---\n'
    text += `平均内存: ${report.resources.avgMemoryMb} MB\n`
    text += `最大内存: ${report.resources.maxMemoryMb} MB\n`
    text += `平均CPU: ${report.resources.avgCpuPercent}%\n\n`

    text += '--- 事件计数 ---\n'
    text += `推理次数: ${report.counters.inferences}\n`
    text += `存储写入: ${report.counters.storageWrites}\n`
    text += `传感器数据: ${report.counters.sensorDataPoints}\n`
    text += `模式切换: ${report.counters.modeChanges}\n\n`

    text += '--- 功耗估算 ---\n'
    text += `总功耗: ${report.power.totalMah} mAh\n`
    text += `电量消耗: ${report.power.percentConsumed}%\n`
    text += `电池容量: ${report.power.batteryCapacity} mAh\n\n`

    text += '--- 功耗分解 ---\n'
    text += `基础功耗: ${report.power.breakdown.base} mAh\n'
    text += `传感器: ${report.power.breakdown.sensor} mAh\n`
    text += `AI推理: ${report.power.breakdown.inference} mAh\n`
    text += `存储写入: ${report.power.breakdown.storage} mAh\n\n`

    text += `结论: ${report.power.percentConsumed < 15 ? '✅ 功耗达标 (<15%)' : '❌ 功耗超标'}\n`

    return text
  }

  /**
   * 停止分析器
   */
  stop() {
    if (this._sampleInterval) {
      clearInterval(this._sampleInterval)
      this._sampleInterval = null
    }
  }
}

export default PerformanceProfiler
