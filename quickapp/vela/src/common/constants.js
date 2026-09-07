/**
 * constants.js - 全局常量定义
 *
 * 定义姿态识别系统的所有配置常量，包括：
 * - 姿态类别映射
 * - 模型超参数
 * - 传感器采样配置
 * - UI显示配置
 * - 功耗管理配置
 */

// ============================================================
// 姿态类别定义
// ============================================================

/**
 * 姿态类别名称映射
 * key: 姿态ID (0-4)
 * value: 姿态中文名称
 */
const POSTURE_LABELS = {
  0: '站立',
  1: '坐下',
  2: '行走',
  3: '抬手',
  4: '摔倒'
};

/**
 * 姿态对应的emoji图标
 * 用于UI显示，增强可读性
 */
const POSTURE_ICONS = {
  0: '🧍',  // 站立
  1: '🪑',  // 坐下
  2: '🚶',  // 行走
  3: '🖐️',  // 抬手
  4: '⚠️'   // 摔倒
};

/**
 * 姿态对应的警示级别
 * 0: 正常, 1: 注意, 2: 警告(摔倒)
 */
const POSTURE_ALERT_LEVEL = {
  0: 0,  // 站立 - 正常
  1: 0,  // 坐下 - 正常
  2: 0,  // 行走 - 正常
  3: 1,  // 抬手 - 注意
  4: 2   // 摔倒 - 警告
};

// ============================================================
// 模型超参数
// ============================================================

/**
 * 输入窗口大小
 * 表示每次推理使用最近 N 帧传感器数据
 * 50帧 × 20ms/帧 = 1秒的时序窗口
 */
const MODEL_WINDOW_SIZE = 50;

/**
 * 输入通道数
 * 3轴加速度 + 3轴陀螺仪 = 6通道
 */
const MODEL_INPUT_CHANNELS = 6;

/**
 * 输出类别数
 */
const MODEL_OUTPUT_CLASSES = 5;

/**
 * CNN模型配置
 * 轻量级1D-CNN结构参数
 */
const MODEL_CONFIG = {
  // 第一层卷积
  conv1: {
    inChannels: 6,       // 输入通道: acc_xyz + gyro_xyz
    outChannels: 16,     // 输出通道数
    kernelSize: 5,       // 卷积核大小
    stride: 1,           // 步长
    padding: 2           // 填充(保持尺寸)
  },
  // 第二层卷积
  conv2: {
    inChannels: 16,      // 输入通道(来自conv1)
    outChannels: 32,     // 输出通道数
    kernelSize: 3,       // 卷积核大小
    stride: 1,           // 步长
    padding: 1           // 填充
  },
  // 全连接层
  fc: {
    inFeatures: 32 * 12, // 经过池化后的特征维度 (50→25→12)
    outFeatures: 5       // 输出: 5个姿态类别
  },
  // 池化层
  pool: {
    kernelSize: 2,       // 池化窗口
    stride: 2            // 池化步长
  }
};

// ============================================================
// 传感器采样配置
// ============================================================

/**
 * 默认采样频率 (Hz)
 * 50Hz 是功耗和精度的平衡点
 */
const DEFAULT_SAMPLE_RATE = 50;

/**
 * 可选采样频率列表
 */
const SAMPLE_RATE_OPTIONS = [25, 50, 100];

/**
 * 采样间隔映射 (Hz -> ms)
 */
const SAMPLE_INTERVAL_MS = {
  25: 40,   // 40ms
  50: 20,   // 20ms
  100: 10   // 10ms
};

// ============================================================
// 推理配置
// ============================================================

/**
 * 推理间隔 (ms)
 * 每500ms执行一次推理，平衡实时性和功耗
 */
const INFERENCE_INTERVAL_MS = 500;

/**
 * 置信度阈值
 * 低于此值认为姿态不确定
 */
const CONFIDENCE_THRESHOLD = 0.4;

/**
 * 结果平滑窗口大小
 * 使用最近N次推理结果投票，消除抖动
 */
const SMOOTH_WINDOW_SIZE = 5;

// ============================================================
// 信号预处理配置
// ============================================================

/**
 * 低通滤波器截止频率 (Hz)
 */
const FILTER_CUTOFF_HZ = 20;

/**
 * 滤波器采样频率 (Hz)
 */
const FILTER_SAMPLE_RATE = 50;

/**
 * Z-score标准化窗口大小
 */
const NORM_WINDOW_SIZE = 100;

/**
 * 异常值阈值 (标准差倍数)
 */
const OUTLIER_THRESHOLD = 3.0;

/**
 * 加速度计量程 (m/s²)
 * 用于数据归一化到 [-1, 1] 范围
 */
const ACCEL_RANGE = 19.6;  // ±2g

/**
 * 陀螺仪量程 (rad/s)
 * 用于数据归一化到 [-1, 1] 范围
 */
const GYRO_RANGE = 20.0;   // ±200°/s ≈ ±3.49 rad/s, 这里用简化值

// ============================================================
// UI配置
// ============================================================

/**
 * 数据刷新间隔 (ms)
 * UI刷新频率，避免过度刷新消耗资源
 */
const UI_REFRESH_INTERVAL_MS = 200;

/**
 * 传感器数据历史显示条数
 */
const SENSOR_HISTORY_LENGTH = 10;

/**
 * 历史记录最大保存条数
 */
const MAX_HISTORY_RECORDS = 50;

// ============================================================
// 功耗管理配置
// ============================================================

/**
 * 后台等待时间 (ms)
 * 超过此时间未操作，降低采样率
 */
const BACKGROUND_TIMEOUT_MS = 30000;

/**
 * 低功耗模式采样率 (Hz)
 */
const LOW_POWER_SAMPLE_RATE = 10;

// ============================================================
// 存储键名
// ============================================================

const STORAGE_KEYS = {
  SETTINGS: 'posture_settings',      // 用户设置
  HISTORY: 'posture_history',        // 识别历史
  MODEL_LOADED: 'model_loaded'       // 模型加载状态
};

// 导出所有常量
module.exports = {
  POSTURE_LABELS,
  POSTURE_ICONS,
  POSTURE_ALERT_LEVEL,
  MODEL_WINDOW_SIZE,
  MODEL_INPUT_CHANNELS,
  MODEL_OUTPUT_CLASSES,
  MODEL_CONFIG,
  DEFAULT_SAMPLE_RATE,
  SAMPLE_RATE_OPTIONS,
  SAMPLE_INTERVAL_MS,
  INFERENCE_INTERVAL_MS,
  CONFIDENCE_THRESHOLD,
  SMOOTH_WINDOW_SIZE,
  FILTER_CUTOFF_HZ,
  FILTER_SAMPLE_RATE,
  NORM_WINDOW_SIZE,
  OUTLIER_THRESHOLD,
  ACCEL_RANGE,
  GYRO_RANGE,
  UI_REFRESH_INTERVAL_MS,
  SENSOR_HISTORY_LENGTH,
  MAX_HISTORY_RECORDS,
  BACKGROUND_TIMEOUT_MS,
  LOW_POWER_SAMPLE_RATE,
  STORAGE_KEYS
};
