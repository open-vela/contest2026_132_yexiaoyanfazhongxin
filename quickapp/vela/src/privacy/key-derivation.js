/**
 * 密钥派生与分片模块
 *
 * 实现分层密钥管理体系：
 * - 主密钥：PBKDF2-HMAC-SHA256 派生
 * - L1 密钥：HKDF 派生，普通安全区域
 * - L2 密钥：单独派生，隔离上下文（模拟安全域）
 * - L3 密钥：Shamir's Secret Sharing (2-of-3) 分片
 *
 * 安全原则：
 * 1. 密钥不得硬编码，必须在运行时派生
 * 2. 主密钥基于 deviceId + userPin + salt
 * 3. L3 密钥使用 Shamir 分片，2/3 恢复
 *
 * @module privacy/key-derivation
 */

/**
 * 密钥派生与分片管理器
 */
export class KeyDerivation {
  constructor() {
    // 主密钥缓存（运行时）
    this._masterKey = null
    // L3 密钥分片缓存
    this._l3Shards = {
      shard1: null, // 内存中临时持有
      shard2: null, // 加密写入文件头
      shard3: null, // 独立小文件
    }
    // 设备标识（运行时获取）
    this._deviceId = null
    // 用户 PIN
    this._userPin = null
    // 盐值
    this._salt = null
  }

  /**
   * 初始化密钥系统
   *
   * @param {Object} params
   * @param {string} params.deviceId - 设备唯一标识
   * @param {string} params.userPin - 用户 PIN 码
   * @param {string} [params.salt] - 盐值（可选，自动生成）
   * @returns {Promise<boolean>} 初始化是否成功
   */
  async init({ deviceId, userPin, salt }) {
    if (!deviceId || !userPin) {
      throw new Error('deviceId and userPin are required')
    }

    this._deviceId = deviceId
    this._userPin = userPin
    this._salt = salt || this._generateSalt()

    // 派生主密钥
    this._masterKey = await this._deriveMasterKey()

    // 派生各级密钥
    await this._deriveLevelKeys()

    // 生成 L3 Shamir 分片
    await this._generateL3Shards()

    return true
  }

  /**
   * 获取指定级别的加密密钥
   *
   * @param {number} level - 数据级别 (1, 2, 3)
   * @returns {Promise<CryptoKey>} 对应级别的密钥
   */
  async getKey(level) {
    if (!this._masterKey) {
      throw new Error('KeyDerivation not initialized')
    }

    switch (level) {
      case 1:
        return this._deriveAESKey('l1', 128)
      case 2:
        return this._deriveAESKey('l2', 256)
      case 3:
        return this._reconstructL3Key()
      default:
        throw new Error(`Invalid key level: ${level}`)
    }
  }

  /**
   * 获取 L3 密钥分片
   *
   * @returns {Object} { shard1, shard2, shard3 }
   */
  getL3Shards() {
    return {
      shard1: this._l3Shards.shard1 ? { ...this._l3Shards.shard1 } : null,
      shard2: this._l3Shards.shard2 ? { ...this._l3Shards.shard2 } : null,
      shard3: this._l3Shards.shard3 ? { ...this._l3Shards.shard3 } : null,
    }
  }

  /**
   * 从分片恢复密钥（需要至少 2 个分片）
   *
   * @param {Array} shards - 分片数组，每个分片 { index, value }
   * @returns {Promise<CryptoKey>} 恢复的密钥
   */
  async reconstructKey(shards) {
    if (!shards || shards.length < 2) {
      throw new Error('At least 2 shards required for key reconstruction')
    }

    // 使用拉格朗日插值恢复主密钥
    const recovered = this._lagrangeInterpolate(shards)

    // 用恢复的值派生 AES 密钥
    return this._importKey(recovered, 256)
  }

  /**
   * PBKDF2-HMAC-SHA256 派生主密钥
   *
   * @returns {Promise<ArrayBuffer>} 主密钥
   * @private
   */
  async _deriveMasterKey() {
    const iterations = 10000
    const keyLength = 32 // 256 bits

    // 组合输入材料
    const material = this._deviceId + ':' + this._userPin

    // 导入密码材料
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      this._encoder().encode(material),
      'PBKDF2',
      false,
      ['deriveBits']
    )

    // PBKDF2 派生
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: this._encoder().encode(this._salt),
        iterations: iterations,
        hash: 'SHA-256',
      },
      passwordKey,
      keyLength * 8
    )

    return derivedBits
  }

  /**
   * 派生各级密钥
   *
   * @private
   */
  async _deriveLevelKeys() {
    // L1 密钥：HKDF 派生（使用 Web Crypto HKDF 或简化版）
    this._l1Key = await this._hkdfDerive('posture-guard-l1', 16)

    // L2 密钥：单独派生（模拟隔离上下文）
    this._l2Key = await this._hkdfDerive('posture-guard-l2', 32)
  }

  /**
   * HKDF 简化实现
   *
   * @param {string} info - 上下文信息
   * @param {number} length - 密钥长度（字节）
   * @returns {Promise<ArrayBuffer>} 派生密钥
   * @private
   */
  async _hkdfDerive(info, length) {
    // 使用 HMAC-SHA256 进行简化 HKDF
    const hmacKey = await crypto.subtle.importKey(
      'raw',
      this._masterKey,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    // Extract 阶段：PRK = HMAC-Hash(salt, IKM)
    const prk = await crypto.subtle.sign('HMAC', hmacKey, this._encoder().encode('hkdf-extract'))

    // Expand 阶段：T(1) = HMAC-Hash(PRK, info || 0x01)
    const prkKey = await crypto.subtle.importKey(
      'raw',
      prk,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const infoBytes = this._encoder().encode(info)
    const concat = new Uint8Array(infoBytes.length + 1)
    concat.set(infoBytes)
    concat[infoBytes.length] = 0x01

    const okm = await crypto.subtle.sign('HMAC', prkKey, concat)

    // 截取所需长度
    return okm.slice(0, length)
  }

  /**
   * 派生 AES 密钥
   *
   * @param {string} purpose - 用途标识
   * @param {number} bits - 密钥位数 (128 or 256)
   * @returns {Promise<CryptoKey>} AES 密钥
   * @private
   */
  async _deriveAESKey(purpose, bits) {
    const keyMaterial = purpose === 'l1' ? this._l1Key : this._l2Key

    return crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    )
  }

  /**
   * 导入原始密钥材料
   *
   * @param {ArrayBuffer} rawKey - 原始密钥字节
   * @param {number} bits - 位数
   * @returns {Promise<CryptoKey>} AES 密钥
   * @private
   */
  async _importKey(rawKey, bits) {
    return crypto.subtle.importKey(
      'raw',
      rawKey,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    )
  }

  /**
   * 生成 L3 Shamir 分片
   *
   * Shamir's Secret Sharing (2-of-3)：
   * - 将密钥视为有限域上的多项式系数
   * - 构造 f(x) = secret + a*x (mod p)
   * - 计算 f(1), f(2), f(3) 作为三个分片
   * - 任意两个分片可通过拉格朗日插值恢复 secret
   *
   * @private
   */
  async _generateL3Shards() {
    // 将主密钥转换为大整数（简化版：使用前 16 字节）
    const keyBytes = new Uint8Array(this._masterKey)
    const secret = this._bytesToBigInt(keyBytes.slice(0, 16))

    // 有限域质数（2^127 - 1，梅森素数）
    const prime = BigInt('170141183460469231731687303715884105727')

    // 生成随机系数 a
    const a = this._randomBigInt(prime)

    // 构造多项式 f(x) = secret + a*x mod p
    const f = (x) => (secret + a * x) % prime

    // 计算三个分片
    this._l3Shards.shard1 = {
      index: 1,
      value: this._bigIntToHex(f(BigInt(1))),
    }
    this._l3Shards.shard2 = {
      index: 2,
      value: this._bigIntToHex(f(BigInt(2))),
    }
    this._l3Shards.shard3 = {
      index: 3,
      value: this._bigIntToHex(f(BigInt(3))),
    }
  }

  /**
   * 拉格朗日插值恢复密钥
   *
   * @param {Array} shards - 至少 2 个分片 [{index, value}, ...]
   * @returns {ArrayBuffer} 恢复的密钥
   * @private
   */
  _lagrangeInterpolate(shards) {
    const prime = BigInt('170141183460469231731687303715884105727')

    let result = BigInt(0)

    for (let i = 0; i < shards.length; i++) {
      const xi = BigInt(shards[i].index)
      const yi = BigInt('0x' + shards[i].value)

      let numerator = BigInt(1)
      let denominator = BigInt(1)

      for (let j = 0; j < shards.length; j++) {
        if (i === j) continue
        const xj = BigInt(shards[j].index)
        numerator = (numerator * (BigInt(0) - xj)) % prime
        denominator = (denominator * (xi - xj)) % prime
      }

      // 计算模逆
      const invDenom = this._modInverse(denominator, prime)
      const lagrangeCoeff = (numerator * invDenom) % prime

      result = (result + yi * lagrangeCoeff) % prime
    }

    // 确保结果为正数
    result = (result + prime) % prime

    // 转换回字节数组
    return this._bigIntToBytes(result, 16)
  }

  /**
   * 模逆运算（扩展欧几里得算法）
   *
   * @param {BigInt} a - 输入
   * @param {BigInt} m - 模数
   * @returns {BigInt} a^(-1) mod m
   * @private
   */
  _modInverse(a, m) {
    let [old_r, r] = [a % m, m]
    let [old_s, s] = [BigInt(1), BigInt(0)]

    while (r !== BigInt(0)) {
      const quotient = old_r / r
      ;[old_r, r] = [r, old_r - quotient * r]
      ;[old_s, s] = [s, old_s - quotient * s]
    }

    return (old_s % m + m) % m
  }

  /**
   * 生成盐值
   *
   * @returns {string} 十六进制盐值
   * @private
   */
  _generateSalt() {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * 字节数组转 BigInt
   *
   * @param {Uint8Array} bytes
   * @returns {BigInt}
   * @private
   */
  _bytesToBigInt(bytes) {
    let result = BigInt(0)
    for (let i = 0; i < bytes.length; i++) {
      result = (result << BigInt(8)) | BigInt(bytes[i])
    }
    return result
  }

  /**
   * BigInt 转十六进制字符串
   *
   * @param {BigInt} value
   * @returns {string}
   * @private
   */
  _bigIntToHex(value) {
    return value.toString(16).padStart(32, '0')
  }

  /**
   * BigInt 转字节数组
   *
   * @param {BigInt} value
   * @param {number} length
   * @returns {ArrayBuffer}
   * @private
   */
  _bigIntToBytes(value, length) {
    const hex = value.toString(16).padStart(length * 2, '0')
    const bytes = new Uint8Array(length)
    for (let i = 0; i < length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
    }
    return bytes.buffer
  }

  /**
   * 生成指定范围内的随机 BigInt
   *
   * @param {BigInt} max
   * @returns {BigInt}
   * @private
   */
  _randomBigInt(max) {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    let value = this._bytesToBigInt(bytes)
    return value % max
  }

  /**
   * 获取 TextEncoder
   *
   * @returns {TextEncoder}
   * @private
   */
  _encoder() {
    return new TextEncoder()
  }
}

export default KeyDerivation
