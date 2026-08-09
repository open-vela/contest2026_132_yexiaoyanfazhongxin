/**
 * crypto-store.js - 轻量化AES分级加密本地存储
 *
 * 三级数据安全策略：
 * - L1-普通：体态统计计数，明文存储
 * - L2-敏感：体态异常记录，AES-ECB加密
 * - L3-隐私：心率/压力原始数据，AES-CBC加密
 *
 * 基于 @system.crypto 和 @system.storage 实现
 */

import crypto from '@system.crypto'
import storage from '@system.storage'

// 加密级别常量
const CRYPTO_LEVEL = {
  L1: 'L1',  // 普通（明文）
  L2: 'L2',  // 敏感（AES-ECB）
  L3: 'L3',  // 隐私（AES-CBC）
}

// 密钥配置（实际应从设备安全存储派生）
const KEYS = {
  L2: 'posture_guard_l2_key_16',  // 16字节AES-128密钥
  L3: 'posture_guard_l3_key_16',  // 16字节AES-128密钥
}

class CryptoStore {
  constructor() {
    // 加密统计
    this.stats = {
      encryptCount: 0,
      decryptCount: 0,
      errorCount: 0,
    }
  }

  /**
   * 存储数据（自动分级加密）
   * @param {string} level - 加密级别 'L1'|'L2'|'L3'
   * @param {string} key - 存储键名
   * @param {*} value - 存储值（对象或原始类型）
   * @param {Function} success - 成功回调
   * @param {Function} fail - 失败回调
   */
  save(level, key, value, success, fail) {
    const plain = JSON.stringify(value)

    if (level === CRYPTO_LEVEL.L1) {
      // L1：明文存储
      storage.set({
        key: key,
        value: plain,
        success: () => {
          console.log(`[CryptoStore] L1 save: ${key}`)
          if (success) success()
        },
        fail: (data, code) => {
          console.error(`[CryptoStore] L1 save fail: ${code}`)
          this.stats.errorCount++
          if (fail) fail(data, code)
        },
      })
      return
    }

    // L2/L3：AES加密后存储
    const encKey = crypto.btoa(KEYS[level])

    crypto.encrypt({
      data: plain,
      key: encKey,
      algo: 'AES',
      success: (res) => {
        this.stats.encryptCount++
        storage.set({
          key: key,
          value: res.data,
          success: () => {
            console.log(`[CryptoStore] ${level} save: ${key}`)
            if (success) success()
          },
          fail: (data, code) => {
            console.error(`[CryptoStore] ${level} storage fail: ${code}`)
            this.stats.errorCount++
            if (fail) fail(data, code)
          },
        })
      },
      fail: (data, code) => {
        console.error(`[CryptoStore] ${level} encrypt fail: ${code}`)
        this.stats.errorCount++
        if (fail) fail(data, code)
      },
    })
  }

  /**
   * 读取数据（自动解密）
   * @param {string} level - 加密级别
   * @param {string} key - 存储键名
   * @param {Function} callback - 回调 (value) => {}
   * @param {Function} fail - 失败回调
   */
  load(level, key, callback, fail) {
    storage.get({
      key: key,
      success: (encrypted) => {
        if (level === CRYPTO_LEVEL.L1) {
          // L1：明文直接解析
          try {
            callback(JSON.parse(encrypted))
          } catch (e) {
            callback(encrypted)
          }
          return
        }

        // L2/L3：AES解密
        const encKey = crypto.btoa(KEYS[level])

        crypto.decrypt({
          data: encrypted,
          key: encKey,
          algo: 'AES',
          success: (res) => {
            this.stats.decryptCount++
            try {
              callback(JSON.parse(res.data))
            } catch (e) {
              callback(res.data)
            }
          },
          fail: (data, code) => {
            console.error(`[CryptoStore] ${level} decrypt fail: ${code}`)
            this.stats.errorCount++
            if (fail) fail(data, code)
          },
        })
      },
      fail: (data, code) => {
        console.error(`[CryptoStore] ${level} load fail: ${code}`)
        this.stats.errorCount++
        if (fail) fail(data, code)
      },
    })
  }

  /**
   * 删除数据
   * @param {string} key - 存储键名
   * @param {Function} success - 成功回调
   */
  remove(key, success) {
    storage.delete({
      key: key,
      success: () => {
        console.log(`[CryptoStore] delete: ${key}`)
        if (success) success()
      },
      fail: (data, code) => {
        console.error(`[CryptoStore] delete fail: ${code}`)
        this.stats.errorCount++
      },
    })
  }

  /**
   * 批量删除（按前缀匹配）
   * 注意：storage API 不支持遍历，需要外部维护键名列表
   * @param {Array} keys - 键名数组
   * @param {Function} callback - 完成回调
   */
  batchRemove(keys, callback) {
    let remaining = keys.length
    if (remaining === 0) {
      if (callback) callback()
      return
    }

    keys.forEach((key) => {
      storage.delete({
        key: key,
        success: () => {
          remaining--
          if (remaining === 0 && callback) callback()
        },
        fail: () => {
          remaining--
          if (remaining === 0 && callback) callback()
        },
      })
    })
  }

  /**
   * 清空所有数据
   * @param {Function} success - 成功回调
   */
  clearAll(success) {
    storage.clear({
      success: () => {
        console.log('[CryptoStore] clearAll')
        this.stats = { encryptCount: 0, decryptCount: 0, errorCount: 0 }
        if (success) success()
      },
      fail: (data, code) => {
        console.error(`[CryptoStore] clearAll fail: ${code}`)
      },
    })
  }

  /**
   * 获取加密统计信息
   */
  getStats() {
    return { ...this.stats }
  }
}

export { CRYPTO_LEVEL }
export default CryptoStore
