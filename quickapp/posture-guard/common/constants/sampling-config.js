/**
 * sampling-config.js - 采样策略配置
 *
 * 定义不同场景下的传感器采样率配置
 * 支持动态切换采样策略以平衡功耗和精度
 * @module constants/sampling-config
 */

/**
 * 采样策略枚举
 * @readonly
 * @enum {string}
 */
const SAMPLING_STRATEGY = {
  /** 活跃状态 - 高频采样，用于运动检测 */
  ACTIVE: 'active',
  /** 静止状态 - 低频采样，用于久坐检测 */
  STATIC: 'static',
  /** 夜间/休眠 - 停止采样，节省功耗 */
  NIGHT: 'night',
  /** Mock模式 - 用于模拟器测试 */
  MOCK: 'mock',
}

/**
 * 采样配置详情
 * @readonly
 */
const SAMPLING_CONFIG = {
  [SAMPLING_STRATEGY.ACTIVE]: {
    /** 加速度计采样率 (Hz) */
    accelerometer: 50,
    /** 陀螺仪采样率 (Hz) */
    gyroscope: 50,
    /** 心率采样率 (Hz) */
    heartRate: 1,
    /** 描述 */
    description: '活跃状态 - 高频采样',
  },
  [SAMPLING_STRATEGY.STATIC]: {
    accelerometer: 10,
    gyroscope: 10,
    heartRate: 0.2, // 每5秒一次
    description: '静止状态 - 低频采样',
  },
  [SAMPLING_STRATEGY.NIGHT]: {
    accelerometer: 0,
    gyroscope: 0,
    heartRate: 0,
    description: '夜间/休眠 - 停止采样',
  },
  [SAMPLING_STRATEGY.MOCK]: {
    accelerometer: 20,
    gyroscope: 20,
    heartRate: 1,
    description: 'Mock模式 - 模拟器测试',
  },
}

/**
 * 默认采样策略
 * @type {string}
 */
const DEFAULT_STRATEGY = SAMPLING_STRATEGY.STATIC

/**
 * 获取指定策略的采样间隔（毫秒）
 * @param {string} strategy - 采样策略
 * @param {string} sensorType - 传感器类型 'accelerometer'|'gyroscope'|'heartRate'
 * @returns {number} 采样间隔（毫秒），0表示停止采样
 */
function getSamplingInterval(strategy, sensorType) {
  const config = SAMPLING_CONFIG[strategy]
  if (!config || !config[sensorType]) return 0
  const hz = config[sensorType]
  if (hz === 0) return 0
  return Math.round(1000 / hz)
}

export { SAMPLING_STRATEGY, SAMPLING_CONFIG, DEFAULT_STRATEGY, getSamplingInterval }
