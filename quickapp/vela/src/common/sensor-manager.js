/**
 * sensor-manager.js - IMU传感器管理器
 *
 * 职责：
 * 1. 管理加速度计和陀螺仪的订阅/取消订阅
 * 2. 维护环形缓冲区，存储最近N帧传感器数据
 * 3. 控制采样频率
 * 4. 检测传感器异常并尝试恢复
 * 5. 功耗优化：前台高频/后台低频或暂停
 *
 * 使用方式：
 *   var SensorManager = require('sensor-manager');
 *   var sm = new SensorManager();
 *   sm.start(50);  // 50Hz采样
 *   // ... 获取数据 ...
 *   sm.stop();
 */

// 导入OpenVela传感器API
import sensor from '@system.sensor';

// 导入常量配置
var constants = require('./constants');

/**
 * 传感器管理器类
 */
function SensorManager() {
  // 环形缓冲区: 存储最近 MODEL_WINDOW_SIZE 帧数据
  // 每帧格式: { accX, accY, accZ, gyroX, gyroY, gyroZ, timestamp }
  this._buffer = [];
  this._bufferIndex = 0;
  this._maxBufferSize = constants.MODEL_WINDOW_SIZE;

  // 采样状态
  this._isRunning = false;
  this._sampleRate = constants.DEFAULT_SAMPLE_RATE;
  this._sampleTimer = null;

  // 最新一帧数据（用于UI实时显示）
  this._latestFrame = null;

  // 传感器状态
  this._accelAvailable = true;
  this._gyroAvailable = true;
  this._consecutiveErrors = 0;
  this._maxConsecutiveErrors = 10;

  // 回调函数
  this._onDataCallback = null;

  // 模拟模式（用于无硬件测试）
  this._mockMode = false;
  this._mockTimer = null;

  console.log('[SensorManager] 传感器管理器已初始化');
}

/**
 * 启动传感器采集
 * @param {number} rate - 采样频率 (Hz)，可选，默认使用配置值
 * @param {boolean} mockMode - 是否启用模拟模式
 */
SensorManager.prototype.start = function (rate, mockMode) {
  if (this._isRunning) {
    console.log('[SensorManager] 传感器已在运行中');
    return;
  }

  this._sampleRate = rate || constants.DEFAULT_SAMPLE_RATE;
  this._mockMode = mockMode || false;
  this._buffer = [];
  this._bufferIndex = 0;
  this._consecutiveErrors = 0;

  console.log('[SensorManager] 启动传感器采集, 频率=' + this._sampleRate + 'Hz, 模式=' + (this._mockMode ? '模拟' : '真实'));

  if (this._mockMode) {
    this._startMockMode();
  } else {
    this._startRealSensors();
  }

  this._isRunning = true;
};

/**
 * 启动真实传感器
 * 使用OpenVela sensor API订阅加速度计和陀螺仪
 */
SensorManager.prototype._startRealSensors = function () {
  var self = this;

  // 计算采样间隔(ms)
  var interval = 1000 / this._sampleRate;

  // 订阅加速度计
  // OpenVela API: sensor.subscribeAccelerometer({ callback: function(data) {} })
  try {
    sensor.subscribeAccelerometer({
      callback: function (data) {
        // data包含 x, y, z 三个分量，单位 m/s²
        self._onAccelData(data);
      },
      // 采样间隔(ms)，部分设备支持
      interval: interval
    });
    this._accelAvailable = true;
    console.log('[SensorManager] 加速度计订阅成功');
  } catch (e) {
    this._accelAvailable = false;
    console.error('[SensorManager] 加速度计订阅失败: ' + e.message);
  }

  // 订阅陀螺仪
  // OpenVela API: sensor.subscribeGyroscope({ callback: function(data) {} })
  try {
    sensor.subscribeGyroscope({
      callback: function (data) {
        // data包含 x, y, z 三个分量，单位 rad/s
        self._onGyroData(data);
      },
      interval: interval
    });
    this._gyroAvailable = true;
    console.log('[SensorManager] 陀螺仪订阅成功');
  } catch (e) {
    this._gyroAvailable = false;
    console.error('[SensorManager] 陀螺仪订阅失败: ' + e.message);
  }
};

/**
 * 启动模拟模式
 * 生成模拟传感器数据，用于无硬件环境测试
 */
SensorManager.prototype._startMockMode = function () {
  var self = this;
  var interval = 1000 / this._sampleRate;
  var time = 0;

  // 模拟状态：默认站立
  this._mockPosture = 0; // 0-4: 站立/坐下/行走/抬手/摔倒
  this._mockTime = 0;

  this._mockTimer = setInterval(function () {
    time += interval / 1000;
    self._mockTime = time;

    // 生成模拟传感器数据
    var mockData = self._generateMockData(time);

    // 构造帧数据并加入缓冲区
    self._addFrame({
      accX: mockData.accX,
      accY: mockData.accY,
      accZ: mockData.accZ,
      gyroX: mockData.gyroX,
      gyroY: mockData.gyroY,
      gyroZ: mockData.gyroZ,
      timestamp: Date.now()
    });
  }, interval);

  console.log('[SensorManager] 模拟模式已启动');
};

/**
 * 生成模拟传感器数据
 * 根据模拟姿态生成相应的传感器信号特征
 *
 * @param {number} t - 当前时间(秒)
 * @returns {Object} 模拟的6轴数据
 */
SensorManager.prototype._generateMockData = function (t) {
  var posture = this._mockPosture;
  var accX = 0, accY = 0, accZ = 0;
  var gyroX = 0, gyroY = 0, gyroZ = 0;

  // 加入微量噪声
  var noise = function () { return (Math.random() - 0.5) * 0.3; };

  switch (posture) {
    case 0: // 站立 - 静止，加速度主要在Z轴(重力)
      accX = noise();
      accY = noise();
      accZ = 9.8 + noise();
      gyroX = noise() * 0.1;
      gyroY = noise() * 0.1;
      gyroZ = noise() * 0.1;
      break;

    case 1: // 坐下 - 类似站立但Z轴略小(角度变化)
      accX = noise();
      accY = noise();
      accZ = 9.5 + noise() * 0.5;
      gyroX = noise() * 0.1;
      gyroY = noise() * 0.1;
      gyroZ = noise() * 0.1;
      break;

    case 2: // 行走 - 周期性加速度变化
      var walkFreq = 2.0; // 步频2Hz
      accX = Math.sin(2 * Math.PI * walkFreq * t) * 2.0 + noise();
      accY = Math.cos(2 * Math.PI * walkFreq * t) * 1.0 + noise();
      accZ = 9.8 + Math.sin(2 * Math.PI * walkFreq * t * 2) * 1.5 + noise();
      gyroX = Math.sin(2 * Math.PI * walkFreq * t) * 0.5 + noise() * 0.2;
      gyroY = Math.cos(2 * Math.PI * walkFreq * t) * 0.3 + noise() * 0.2;
      gyroZ = Math.sin(2 * Math.PI * walkFreq * t + 0.5) * 0.2 + noise() * 0.1;
      break;

    case 3: // 抬手 - Z轴减小，X或Y轴增大
      accX = 5.0 + Math.sin(t * 3) * 1.0 + noise();
      accY = noise();
      accZ = 5.0 + Math.cos(t * 3) * 1.0 + noise();
      gyroX = Math.sin(t * 2) * 1.0 + noise() * 0.3;
      gyroY = noise() * 0.2;
      gyroZ = Math.cos(t * 2) * 0.5 + noise() * 0.2;
      break;

    case 4: // 摔倒 - 短暂失重后冲击
      var fallPhase = t % 3; // 3秒一个周期
      if (fallPhase < 0.5) {
        // 下落阶段: 接近失重
        accX = noise() * 2;
        accY = noise() * 2;
        accZ = 2.0 + noise() * 3;
        gyroX = (Math.random() - 0.5) * 5;
        gyroY = (Math.random() - 0.5) * 5;
        gyroZ = (Math.random() - 0.5) * 5;
      } else if (fallPhase < 0.8) {
        // 冲击阶段: 大加速度
        accX = (Math.random() - 0.5) * 20;
        accY = (Math.random() - 0.5) * 20;
        accZ = 25 + Math.random() * 15;
        gyroX = (Math.random() - 0.5) * 8;
        gyroY = (Math.random() - 0.5) * 8;
        gyroZ = (Math.random() - 0.5) * 8;
      } else {
        // 静止阶段: 类似躺下
        accX = noise();
        accY = noise();
        accZ = 2.0 + noise();
        gyroX = noise() * 0.1;
        gyroY = noise() * 0.1;
        gyroZ = noise() * 0.1;
      }
      break;
  }

  return {
    accX: accX,
    accY: accY,
    accZ: accZ,
    gyroX: gyroX,
    gyroY: gyroY,
    gyroZ: gyroZ
  };
};

/**
 * 设置模拟姿态
 * 仅在模拟模式下有效
 *
 * @param {number} postureId - 姿态ID (0-4)
 */
SensorManager.prototype.setMockPosture = function (postureId) {
  if (postureId >= 0 && postureId <= 4) {
    this._mockPosture = postureId;
    console.log('[SensorManager] 模拟姿态切换为: ' + constants.POSTURE_LABELS[postureId]);
  }
};

/**
 * 加速度计数据回调
 *
 * @param {Object} data - { x, y, z } 加速度分量 (m/s²)
 */
SensorManager.prototype._onAccelData = function (data) {
  // 缓存加速度数据，等待陀螺仪数据一起处理
  this._tempAccel = {
    x: data.x || 0,
    y: data.y || 0,
    z: data.z || 0
  };

  // 如果已经有陀螺仪数据，合并成一帧
  if (this._tempGyro) {
    this._mergeAndAddFrame();
  }
};

/**
 * 陀螺仪数据回调
 *
 * @param {Object} data - { x, y, z } 角速度分量 (rad/s)
 */
SensorManager.prototype._onGyroData = function (data) {
  this._tempGyro = {
    x: data.x || 0,
    y: data.y || 0,
    z: data.z || 0
  };

  // 如果已经有加速度数据，合并成一帧
  if (this._tempAccel) {
    this._mergeAndAddFrame();
  }
};

/**
 * 合并加速度和陀螺仪数据为一帧
 */
SensorManager.prototype._mergeAndAddFrame = function () {
  var frame = {
    accX: this._tempAccel.x,
    accY: this._tempAccel.y,
    accZ: this._tempAccel.z,
    gyroX: this._tempGyro.x,
    gyroY: this._tempGyro.y,
    gyroZ: this._tempGyro.z,
    timestamp: Date.now()
  };

  this._addFrame(frame);

  // 清除临时数据
  this._tempAccel = null;
  this._tempGyro = null;
};

/**
 * 将一帧数据加入环形缓冲区
 *
 * @param {Object} frame - 6轴传感器数据帧
 */
SensorManager.prototype._addFrame = function (frame) {
  // 数据完整性检查
  if (!this._validateFrame(frame)) {
    this._consecutiveErrors++;
    if (this._consecutiveErrors >= this._maxConsecutiveErrors) {
      console.error('[SensorManager] 连续错误过多，传感器可能异常');
      this._handleSensorError();
    }
    return;
  }

  this._consecutiveErrors = 0;

  // 环形缓冲区写入
  if (this._buffer.length < this._maxBufferSize) {
    // 缓冲区未满，直接追加
    this._buffer.push(frame);
  } else {
    // 缓冲区已满，覆盖最旧的数据
    this._buffer[this._bufferIndex] = frame;
    this._bufferIndex = (this._bufferIndex + 1) % this._maxBufferSize;
  }

  // 更新最新帧
  this._latestFrame = frame;

  // 触发回调
  if (this._onDataCallback) {
    this._onDataCallback(frame, this.getBuffer());
  }
};

/**
 * 验证数据帧有效性
 *
 * @param {Object} frame - 数据帧
 * @returns {boolean} 是否有效
 */
SensorManager.prototype._validateFrame = function (frame) {
  // 检查必要字段
  if (!frame || typeof frame.accX !== 'number' || typeof frame.gyroX !== 'number') {
    return false;
  }

  // 检查NaN和Infinity
  var values = [frame.accX, frame.accY, frame.accZ, frame.gyroX, frame.gyroY, frame.gyroZ];
  for (var i = 0; i < values.length; i++) {
    if (isNaN(values[i]) || !isFinite(values[i])) {
      return false;
    }
  }

  // 检查数值范围合理性（防止传感器故障产生极端值）
  var maxAccel = constants.ACCEL_RANGE * 2;
  var maxGyro = constants.GYRO_RANGE * 2;
  if (Math.abs(frame.accX) > maxAccel || Math.abs(frame.accY) > maxAccel || Math.abs(frame.accZ) > maxAccel) {
    return false;
  }
  if (Math.abs(frame.gyroX) > maxGyro || Math.abs(frame.gyroY) > maxGyro || Math.abs(frame.gyroZ) > maxGyro) {
    return false;
  }

  return true;
};

/**
 * 处理传感器错误
 * 尝试重新订阅传感器
 */
SensorManager.prototype._handleSensorError = function () {
  console.warn('[SensorManager] 尝试恢复传感器...');
  // 先取消订阅
  this._unsubscribeSensors();
  // 等待后重新订阅
  var self = this;
  setTimeout(function () {
    if (self._isRunning && !self._mockMode) {
      self._startRealSensors();
      self._consecutiveErrors = 0;
    }
  }, 1000);
};

/**
 * 停止传感器采集
 */
SensorManager.prototype.stop = function () {
  if (!this._isRunning) {
    return;
  }

  console.log('[SensorManager] 停止传感器采集');

  if (this._mockMode) {
    // 停止模拟模式
    if (this._mockTimer) {
      clearInterval(this._mockTimer);
      this._mockTimer = null;
    }
  } else {
    this._unsubscribeSensors();
  }

  this._isRunning = false;
  this._latestFrame = null;
};

/**
 * 取消传感器订阅
 */
SensorManager.prototype._unsubscribeSensors = function () {
  try {
    sensor.unsubscribeAccelerometer();
    console.log('[SensorManager] 加速度计已取消订阅');
  } catch (e) {
    console.warn('[SensorManager] 取消加速度计订阅失败: ' + e.message);
  }

  try {
    sensor.unsubscribeGyroscope();
    console.log('[SensorManager] 陀螺仪已取消订阅');
  } catch (e) {
    console.warn('[SensorManager] 取消陀螺仪订阅失败: ' + e.message);
  }
};

/**
 * 获取缓冲区数据的副本
 * 返回格式: Float32Array [accX0, accY0, accZ0, gyroX0, gyroY0, gyroZ0, accX1, ...]
 * 这是模型推理所需的输入格式
 *
 * @returns {Float32Array} 传感器数据数组
 */
SensorManager.prototype.getBuffer = function () {
  var result = new Float32Array(this._buffer.length * 6);
  for (var i = 0; i < this._buffer.length; i++) {
    var frame = this._buffer[i];
    var offset = i * 6;
    result[offset] = frame.accX;
    result[offset + 1] = frame.accY;
    result[offset + 2] = frame.accZ;
    result[offset + 3] = frame.gyroX;
    result[offset + 4] = frame.gyroY;
    result[offset + 5] = frame.gyroZ;
  }
  return result;
};

/**
 * 获取缓冲区当前帧数
 *
 * @returns {number} 当前缓冲区中的帧数
 */
SensorManager.prototype.getBufferLength = function () {
  return this._buffer.length;
};

/**
 * 获取最新一帧数据
 *
 * @returns {Object|null} 最新帧数据，或null
 */
SensorManager.prototype.getLatestFrame = function () {
  return this._latestFrame;
};

/**
 * 设置数据回调
 *
 * @param {Function} callback - 回调函数(frame, buffer)
 */
SensorManager.prototype.onData = function (callback) {
  this._onDataCallback = callback;
};

/**
 * 检查缓冲区是否已满（可以开始推理）
 *
 * @returns {boolean} 缓冲区是否已满
 */
SensorManager.prototype.isBufferReady = function () {
  return this._buffer.length >= this._maxBufferSize;
};

/**
 * 检查传感器是否在运行
 *
 * @returns {boolean} 是否运行中
 */
SensorManager.prototype.isRunning = function () {
  return this._isRunning;
};

/**
 * 获取传感器状态信息
 *
 * @returns {Object} 状态信息
 */
SensorManager.prototype.getStatus = function () {
  return {
    isRunning: this._isRunning,
    sampleRate: this._sampleRate,
    bufferLength: this._buffer.length,
    bufferMax: this._maxBufferSize,
    bufferReady: this.isBufferReady(),
    accelAvailable: this._accelAvailable,
    gyroAvailable: this._gyroAvailable,
    mockMode: this._mockMode,
    consecutiveErrors: this._consecutiveErrors
  };
};

module.exports = SensorManager;
