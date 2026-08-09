/**
 * postures.js - 体态类型常量定义
 *
 * 定义所有支持的体态类型，用于体态识别模块和UI展示
 * @module constants/postures
 */

/**
 * 体态类型枚举
 * @readonly
 * @enum {string}
 */
const POSTURE_TYPE = {
  /** 正常体态 */
  NORMAL: 'normal',
  /** 久坐 - 静止超过阈值时间 */
  SEDENTARY: 'sedentary',
  /** 低头前倾 - z轴重力分量异常 */
  FORWARD_TILT: 'forward_tilt',
  /** 跷二郎腿 - x轴偏移+y轴周期性振荡 */
  CROSS_LEG: 'cross_leg',
  /** 行走中 */
  WALKING: 'walking',
}

/**
 * 体态类型中文名称映射
 * @readonly
 * @enum {string}
 */
const POSTURE_NAME = {
  [POSTURE_TYPE.NORMAL]: '正常',
  [POSTURE_TYPE.SEDENTARY]: '久坐',
  [POSTURE_TYPE.FORWARD_TILT]: '低头前倾',
  [POSTURE_TYPE.CROSS_LEG]: '跷二郎腿',
  [POSTURE_TYPE.WALKING]: '行走中',
}

/**
 * 体态类型图标映射
 * @readonly
 * @enum {string}
 */
const POSTURE_ICON = {
  [POSTURE_TYPE.NORMAL]: '😊',
  [POSTURE_TYPE.SEDENTARY]: '🪑',
  [POSTURE_TYPE.FORWARD_TILT]: '📱',
  [POSTURE_TYPE.CROSS_LEG]: '🦵',
  [POSTURE_TYPE.WALKING]: '🚶',
}

/**
 * 获取体态类型的中文名称
 * @param {string} type - 体态类型
 * @returns {string} 中文名称
 */
function getPostureName(type) {
  return POSTURE_NAME[type] || '未知'
}

/**
 * 获取体态类型的图标
 * @param {string} type - 体态类型
 * @returns {string} 图标字符
 */
function getPostureIcon(type) {
  return POSTURE_ICON[type] || '❓'
}

export { POSTURE_TYPE, POSTURE_NAME, POSTURE_ICON, getPostureName, getPostureIcon }
