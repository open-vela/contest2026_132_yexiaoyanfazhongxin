/**
 * inference-scheduler.js — 推理调度器
 *
 * 自适应推理频率控制：
 * - 静止状态：每 5 秒推理 1 次
 * - 活动状态：每秒推理 1 次
 * - 基于加速度方差判断运动强度
 * - 状态切换时触发回调
 *
 * @module ai/inference-scheduler
 */

const MOTION_THRESHOLD = 0.5   // 运动强度阈值
const STATIC_INTERVAL = 5000   // 静止推理间隔 (ms)
const ACTIVE_INTERVAL = 1000   // 活动推理间隔 (ms)
const WINDOW_SIZE = 100        // 滑动窗口大小（采样点数）

class InferenceScheduler {
  constructor() {
    /** @type {Object|null} 模型实例 */
    this._model = null

    /** @type {Object|null} 预处理器 */
    this._preprocessor = null

    /** @type {Object|null} IMU 采集器 */
    this._collector = null

    /** @type {Function|null} 结果回调 */
    this._onResult = null

    /** @type {Function|null} 状态切换回调 */
    this._onStateChange = null

    /** @type {number|null} 推理定时器 */
    this._timer = null

    /** @type {boolean} 是否运行中 */
    this._running = false

    /** @type {string} 当前运动状态 */
    this._motionState = 'static'  // 'static' | 'active'

    /** @type {number} 上次推理时间 */
    this._lastInferTime = 0

    /** @type {number} 当前推理间隔 */
    this._currentInterval = STATIC_INTERVAL

    /** @type {number} 数据计数 */
    this._dataCount = 0
  }

  /**
   * 启动推理调度
   * @param {Object} options
   * @param {Object} options.model - 模型实例
   * @param {Object} options.preprocessor - 预处理器
   * @param {Object} options.collector - IMU 采集器
   * @param {Function} options.onResult - 结果回调
   * @param {Function} [options.onStateChange] - 状态切换回调
   */
  start(options) {
    if (this._running) return

    this._model = options.model
    this._preprocessor = options.preprocessor
    this._collector = options.collector
    this._onResult = options.onResult || null
    this._onStateChange = options.onStateChange || null
    this._running = true
    this._dataCount = 0

    // 启动自适应定时推理
    this._scheduleNext()

    console.log('[InferenceScheduler] Started')
  }

  /**
   * 停止推理调度
   */
  stop() {
    if (!this._running) return

    if (this._timer) {
      clearTimeout(this._timer)
      this._timer = null
    }

    this._running = false
    this._model = null
    this._preprocessor = null
    this._collector = null

    console.log('[InferenceScheduler] Stopped')
  }

  /**
   * 通知有新数据到达
   * @param {Object} sample - 采样点
   */
  onNewData(sample) {
    if (!this._running) return

    this._dataCount++

    // 每 50 个采样点（1秒）评估一次运动状态
    if (this._dataCount % 50 === 0) {
      this._evaluateMotionState()
    }
  }

  /**
   * 评估运动状态并调整推理频率
   * @private
   */
  _evaluateMotionState() {
    if (!this._collector) return

    // 获取最近 1 秒的数据窗口
    const window = this._collector.getWindow(50)
    if (!window || window.length < 10) return

    // 计算加速度标准差作为运动强度指标
    let sx = 0, sy = 0, sz = 0
    const n = window.length
    let axSum = 0, aySum = 0, azSum = 0

    for (let i = 0; i < n; i++) {
      axSum += window[i].ax
      aySum += window[i].ay
      azSum += window[i].az
    }

    const axMean = axSum / n
    const ayMean = aySum / n
    const azMean = azSum / n

    for (let i = 0; i < n; i++) {
      const dx = window[i].ax - axMean
      const dy = window[i].ay - ayMean
      const dz = window[i].az - azMean
      sx += dx * dx
      sy += dy * dy
      sz += dz * dz
    }

    const intensity = Math.sqrt(
      (sx + sy + sz) / (n * 3)
    )

    // 判断运动状态
    const newState = intensity > MOTION_THRESHOLD ? 'active' : 'static'

    // 状态切换
    if (newState !== this._motionState) {
      this._motionState = newState
      this._currentInterval = newState === 'active' ? ACTIVE_INTERVAL : STATIC_INTERVAL

      if (this._onStateChange) {
        this._onStateChange(newState)
      }

      console.log(`[InferenceScheduler] State: ${newState}, interval: ${this._currentInterval}ms`)
    }
  }

  /**
   * 调度下次推理
   * @private
   */
  _scheduleNext() {
    if (!this._running) return

    this._timer = setTimeout(() => {
      this._runInference()
      this._scheduleNext()
    }, this._currentInterval)
  }

  /**
   * 执行一次推理
   * @private
   */
  _runInference() {
    if (!this._model || !this._preprocessor || !this._collector) return

    // 获取滑动窗口
    const window = this._collector.getWindow(WINDOW_SIZE)
    if (!window) return  // 数据不足

    // 预处理
    const features = this._preprocessor.processWindow(window)
    if (!features) return

    // 转换为张量
    const tensor = this._preprocessor.toTensor(features)
    if (!tensor) return

    // 推理
    const probs = this._model.infer(tensor)
    if (!probs) return

    // 后处理
    const result = this._model.postprocess(probs)
    if (result) {
      result.timestamp = Date.now()
      result.modelType = this._model._modelType || 'unknown'
      if (this._onResult) this._onResult(result)
    }

    this._lastInferTime = Date.now()
  }
}

export { InferenceScheduler, MOTION_THRESHOLD, STATIC_INTERVAL, ACTIVE_INTERVAL }
