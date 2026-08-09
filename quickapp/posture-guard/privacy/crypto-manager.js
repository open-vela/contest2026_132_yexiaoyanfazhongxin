/**
 * 加密/解密管理模块
 *
 * 实现轻量级 AES-GCM 加密系统：
 * - L1：AES-128-GCM（普通统计数据）
 * - L2：AES-256-GCM（生理趋势数据）
 * - L3：AES-256-GCM（原始特征，24h 强制销毁）
 *
 * 加密输出格式：
 * { iv: base64, ciphertext: base64, authTag: base64, level: number }
 *
 * @module privacy/crypto-manager
 */

import { KeyDerivation } from './key-derivation'

/**
 * 加密级别
 */
export const CRYPTO_LEVEL = {
  L1: 1, // AES-128-GCM
  L2: 2, // AES-256-GCM
  L3: 3, // AES-256-GCM（Shamir 分片）
}

/**
 * 加密管理器
 */
export class CryptoManager {
  constructor() {
    this._keyDerivation = new KeyDerivation()
    this._initialized = false
    // 密钥缓存
    this._keyCache = {}
  }

  /**
   * 初始化加密系统
   *
   * @param {Object} params
   * @param {string} params.deviceId - 设备标识
   * @param {string} params.userPin - 用户 PIN
   * @param {string} [params.salt] - 盐值
   * @returns {Promise<boolean>}
   */
  async init(params) {
    await this._keyDerivation.init(params)
    this._initialized = true
    // 预派生 L1 和 L2 密钥
    this._keyCache[CRYPTO_LEVEL.L1] = await this._keyDerivation.getKey(1)
    this._keyCache[CRYPTO_LEVEL.L2] = await this._keyDerivation.getKey(2)
    return true
  }

  /**
   * 加密数据
   *
   * @param {Object|string|ArrayBuffer} data - 待加密数据
   * @param {number} level - 加密级别 (1, 2, 3)
   * @returns {Promise<Object>} 加密后的数据包 { iv, ciphertext, authTag, level }
   */
  async encrypt(data, level = CRYPTO_LEVEL.L1) {
    if (!this._initialized) {
      throw new Error('CryptoManager not initialized')
    }

    const key = await this._getKeyForLevel(level)
    const iv = this._generateIV()
    const encodedData = this._encodeData(data)

    // AES-GCM 加密
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128, // 128-bit auth tag
      },
      key,
      encodedData
    )

    // 分离密文和认证标签
    const encryptedArray = new Uint8Array(encrypted)
    const ciphertext = encryptedArray.slice(0, encryptedArray.length - 16)
    const authTag = encryptedArray.slice(encryptedArray.length - 16)

    return {
      iv: this._arrayBufferToBase64(iv),
      ciphertext: this._arrayBufferToBase64(ciphertext.buffer),
      authTag: this._arrayBufferToBase64(authTag.buffer),
      level,
      algorithm: level === CRYPTO_LEVEL.L1 ? 'AES-128-GCM' : 'AES-256-GCM',
    }
  }

  /**
   * 解密数据
   *
   * @param {Object} encryptedBlob - 加密数据包 { iv, ciphertext, authTag, level }
   * @returns {Promise<Object|string|ArrayBuffer>} 解密后的数据
   */
  async decrypt(encryptedBlob) {
    if (!this._initialized) {
      throw new Error('CryptoManager not initialized')
    }

    const { iv, ciphertext, authTag, level } = encryptedBlob
    const key = await this._getKeyForLevel(level)

    // 合并密文和认证标签
    const ciphertextBytes = this._base64ToArrayBuffer(ciphertext)
    const authTagBytes = this._base64ToArrayBuffer(authTag)
    const combined = new Uint8Array(ciphertextBytes.byteLength + authTagBytes.byteLength)
    combined.set(new Uint8Array(ciphertextBytes))
    combined.set(new Uint8Array(authTagBytes), ciphertextBytes.byteLength)

    // AES-GCM 解密
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: this._base64ToArrayBuffer(iv),
        tagLength: 128,
      },
      key,
      combined.buffer
    )

    return this._decodeData(decrypted)
  }

  /**
   * 生成随机 IV（96 bits for AES-GCM）
   *
   * @returns {Uint8Array} 12 字节 IV
   * @private
   */
  _generateIV() {
    const iv = new Uint8Array(12) // 96 bits
    crypto.getRandomValues(iv)
    return iv
  }

  /**
   * 根据级别获取密钥
   *
   * @param {number} level
   * @returns {Promise<CryptoKey>}
   * @private
   */
  async _getKeyForLevel(level) {
    // L3 需要实时从分片重建
    if (level === CRYPTO_LEVEL.L3) {
      if (!this._keyCache[CRYPTO_LEVEL.L3]) {
        this._keyCache[CRYPTO_LEVEL.L3] = await this._keyDerivation.getKey(3)
      }
      return this._keyCache[CRYPTO_LEVEL.L3]
    }

    return this._keyCache[level]
  }

  /**
   * 编码数据为 ArrayBuffer
   *
   * @param {Object|string} data
   * @returns {ArrayBuffer}
   * @private
   */
  _encodeData(data) {
    if (data instanceof ArrayBuffer) {
      return data
    }

    const encoder = new TextEncoder()

    if (typeof data === 'string') {
      return encoder.encode(data).buffer
    }

    // 对象序列化为 JSON
    return encoder.encode(JSON.stringify(data)).buffer
  }

  /**
   * 解码 ArrayBuffer 为原始数据
   *
   * @param {ArrayBuffer} buffer
   * @returns {Object|string}
   * @private
   */
  _decodeData(buffer) {
    const decoder = new TextDecoder()
    const text = decoder.decode(buffer)

    // 尝试解析为 JSON
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  }

  /**
   * ArrayBuffer 转 Base64
   *
   * @param {ArrayBuffer} buffer
   * @returns {string}
   * @private
   */
  _arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  /**
   * Base64 转 ArrayBuffer
   *
   * @param {string} base64
   * @returns {ArrayBuffer}
   * @private
   */
  _base64ToArrayBuffer(base64) {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }

  /**
   * 清除密钥缓存（安全擦除）
   */
  secureWipe() {
    // 清除密钥缓存引用
    this._keyCache = {}
    this._initialized = false
  }

  /**
   * 获取 L3 密钥分片（用于外部存储）
   *
   * @returns {Object} { shard1, shard2, shard3 }
   */
  getL3Shards() {
    return this._keyDerivation.getL3Shards()
  }

  /**
   * 从分片恢复 L3 密钥（用于解密）
   *
   * @param {Array} shards - 至少 2 个分片
   * @returns {Promise<CryptoKey>}
   */
  async reconstructL3Key(shards) {
    const key = await this._keyDerivation.reconstructKey(shards)
    this._keyCache[CRYPTO_LEVEL.L3] = key
    return key
  }
}

export default CryptoManager
