/**
 * preprocessor.js - 信号预处理模块
 *
 * 职责：
 * 1. 对原始传感器数据进行归一化（Z-score / Min-Max）
 * 2. 低通滤波去除高频噪声
 * 3. 异常值检测和插值修复
 * 4. 数据质量评估
 *
 * 设计原则：
 * - 纯JS实现，无需外部依赖
 * - 内存友好，使用固定大小的滑动窗口
 * - 计算高效，适合手表低算力环境
 */

var constants = require('./constants');

/**
 * 信号预处理器类
 */
function Preprocessor() {
  // Z-score标准化参数（每个通道独立）
  // 格式: { mean: [6个通道的均值], variance: [6个通道的方差] }
  this._stats = {
    mean: new Float32Array(constants.MODEL_INPUT_CHANNELS),
    variance: new Float32Array(constants.MODEL_INPUT_CHANNELS),
    count: 0
  };

  // 滑动窗口标准化的缓冲区
  this._normBuffer = [];
  this._normBufferSize = constants.NORM_WINDOW_SIZE;

  // 低通滤波器状态（简单一阶IIR滤波器）
  // 每个通道独立的滤波器
  this._filterState = new Float32Array(constants.MODEL_INPUT_CHANNELS);
  this._filterAlpha = this._calculateFilterAlpha(
    constants.FILTER_CUTOFF_HZ,
    constants.FILTER_SAMPLE_RATE
  );

  // 异常值统计
  this._anomalyCount = 0;
  this._totalFrames = 0;

  console.log('[Preprocessor] 预处理器已初始化, 滤波系数=' + this._filterAlpha.toFixed(4));
}

/**
 * 计算一阶低通滤波器的alpha系数
 *
 * alpha = dt / (RC + dt)
 * 其中 RC = 1 / (2π × cutoff_freq)
 * 简化为: alpha = 2π × cutoff × dt / (1 + 2π × cutoff × dt)
 *
 * @param {number} cutoffFreq - 截止频率 (Hz)
 * @param {number} sampleRate - 采样率 (Hz)
 * @returns {number} alpha系数 (0-1)
 */
Preprocessor.prototype._calculateFilterAlpha = function (cutoffFreq, sampleRate) {
  var dt = 1.0 / sampleRate;
  var rc = 1.0 / (2 * Math.PI * cutoffFreq);
  return dt / (rc + dt);
};

/**
 * 预处理一帧数据
 *
 * 处理流程:
 * 1. 异常值检测 -> 2. 低通滤波 -> 3. Z-score标准化
 *
 * @param {Object} frame - 原始数据帧 { accX, accY, accZ, gyroX, gyroY, gyroZ }
 * @returns {Float32Array} 预处理后的6通道数据 (归一化到近似[-1,1])
 */
Preprocessor.prototype.process = function (frame) {
  this._totalFrames++;

  // Step 1: 提取6通道原始数据
  var raw = new Float32Array([
    frame.accX, frame.accY, frame.accZ,
    frame.gyroX, frame.gyroY, frame.gyroZ
  ]);

  // Step 2: 异常值检测和修复
  raw = this._handleOutliers(raw);

  // Step 3: 低通滤波
  var filtered = this._lowPassFilter(raw);

  // Step 4: 更新统计量并标准化
  var normalized = this._normalize(filtered);

  return normalized;
};

/**
 * 批量预处理缓冲区数据
 *
 * @param {Float32Array} buffer - 原始传感器数据 [N×6]
 * @param {number} length - 有效帧数
 * @returns {Float32Array} 预处理后的数据 [N×6]
 */
Preprocessor.prototype.processBuffer = function (buffer, length) {
  var result = new Float32Array(length * constants.MODEL_INPUT_CHANNELS);

  for (var i = 0; i < length; i++) {
    var offset = i * 6;
    var frame = {
      accX: buffer[offset],
      accY: buffer[offset + 1],
      accZ: buffer[offset + 2],
      gyroX: buffer[offset + 3],
      gyroY: buffer[offset + 4],
      gyroZ: buffer[offset + 5]
    };

    var processed = this.process(frame);
    var resultOffset = i * constants.MODEL_INPUT_CHANNELS;
    for (var j = 0; j < constants.MODEL_INPUT_CHANNELS; j++) {
      result[resultOffset + j] = processed[j];
    }
  }

  return result;
};

/**
 * 异常值检测和处理
 * 使用滑动窗口统计检测超出阈值的异常值
 * 异常值用前一个有效值替换（简单插值）
 *
 * @param {Float32Array} data - 6通道数据
 * @returns {Float32Array} 修复后的数据
 */
Preprocessor.prototype._handleOutliers = function (data) {
  // 如果统计量还没建立，跳过异常值检测
  if (this._stats.count < 10) {
    return data;
  }

  var result = new Float32Array(data.length);
  var threshold = constants.OUTLIER_THRESHOLD;

  for (var ch = 0; ch < data.length; ch++) {
    var value = data[ch];
    var mean = this._stats.mean[ch];
    var std = Math.sqrt(this._stats.variance[ch]);

    // 避免除以零
    if (std < 0.001) {
      std = 0.001;
    }

    // Z-score检验
    var zScore = Math.abs((value - mean) / std);

    if (zScore > threshold) {
      // 异常值：用均值替代
      result[ch] = mean;
      this._anomalyCount++;
    } else {
      result[ch] = value;
    }
  }

  return result;
};

/**
 * 一阶低通滤波器 (IIR)
 *
 * y[n] = alpha × x[n] + (1 - alpha) × y[n-1]
 *
 * @param {Float32Array} data - 当前帧6通道数据
 * @returns {Float32Array} 滤波后的数据
 */
Preprocessor.prototype._lowPassFilter = function (data) {
  var result = new Float32Array(data.length);
  var alpha = this._filterAlpha;

  for (var ch = 0; ch < data.length; ch++) {
    // IIR低通滤波
    result[ch] = alpha * data[ch] + (1 - alpha) * this._filterState[ch];
    // 更新滤波器状态
    this._filterState[ch] = result[ch];
  }

  return result;
};

/**
 * Z-score标准化
 * 使用在线算法更新均值和方差
 * normalized = (x - mean) / sqrt(variance + epsilon)
 *
 * @param {Float32Array} data - 滤波后的6通道数据
 * @returns {Float32Array} 标准化后的数据
 */
Preprocessor.prototype._normalize = function (data) {
  var result = new Float32Array(data.length);
  var epsilon = 1e-6; // 防止除以零

  // 更新滑动窗口缓冲区
  this._normBuffer.push(new Float32Array(data));
  if (this._normBuffer.length > this._normBufferSize) {
    this._normBuffer.shift();
  }

  // 重新计算滑动窗口内的统计量
  for (var ch = 0; ch < data.length; ch++) {
    var sum = 0;
    var sumSq = 0;
    var n = this._normBuffer.length;

    for (var i = 0; i < n; i++) {
      sum += this._normBuffer[i][ch];
      sumSq += this._normBuffer[i][ch] * this._normBuffer[i][ch];
    }

    var mean = sum / n;
    var variance = sumSq / n - mean * mean;
    if (variance < 0) variance = 0; // 数值稳定性

    // 更新全局统计量（用于异常值检测）
    this._stats.mean[ch] = mean;
    this._stats.variance[ch] = variance;
    this._stats.count++;

    // 标准化
    result[ch] = (data[ch] - mean) / Math.sqrt(variance + epsilon);

    // 限制到[-5, 5]范围，防止极端值
    if (result[ch] > 5) result[ch] = 5;
    if (result[ch] < -5) result[ch] = -5;
  }

  return result;
};

/**
 * 重置预处理器状态
 * 在传感器重启或长时间暂停后调用
 */
Preprocessor.prototype.reset = function () {
  this._stats = {
    mean: new Float32Array(constants.MODEL_INPUT_CHANNELS),
    variance: new Float32Array(constants.MODEL_INPUT_CHANNELS),
    count: 0
  };
  this._normBuffer = [];
  this._filterState = new Float32Array(constants.MODEL_INPUT_CHANNELS);
  this._anomalyCount = 0;
  this._totalFrames = 0;
  console.log('[Preprocessor] 预处理器状态已重置');
};

/**
 * 获取数据质量报告
 *
 * @returns {Object} 质量报告
 */
Preprocessor.prototype.getQualityReport = function () {
  return {
    totalFrames: this._totalFrames,
    anomalyCount: this._anomalyCount,
    anomalyRate: this._totalFrames > 0
      ? (this._anomalyCount / this._totalFrames * 100).toFixed(2) + '%'
      : '0%',
    normBufferSize: this._normBuffer.length,
    statsReady: this._stats.count > 10
  };
};

module.exports = Preprocessor;
