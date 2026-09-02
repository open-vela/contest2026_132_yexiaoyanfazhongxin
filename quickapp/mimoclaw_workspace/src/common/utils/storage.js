/**
 * 存储工具类
 * 封装 @system.storage，提供便捷的数据持久化方法
 */

import storage from '@system.storage'

class StorageUtil {
  /**
   * 获取数据
   */
  static get(key) {
    return new Promise((resolve, reject) => {
      storage.get({
        key: key,
        success: (data) => {
          if (data) {
            try {
              resolve(JSON.parse(data))
            } catch (e) {
              resolve(data)
            }
          } else {
            resolve(null)
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  }

  /**
   * 设置数据
   */
  static set(key, value) {
    return new Promise((resolve, reject) => {
      const data = typeof value === 'object' ? JSON.stringify(value) : value
      storage.set({
        key: key,
        value: data,
        success: () => {
          resolve()
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  }

  /**
   * 删除数据
   */
  static delete(key) {
    return new Promise((resolve, reject) => {
      storage.delete({
        key: key,
        success: () => {
          resolve()
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  }

  /**
   * 清空所有数据
   */
  static clear() {
    return new Promise((resolve, reject) => {
      storage.clear({
        success: () => {
          resolve()
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  }

  /**
   * 获取所有键
   */
  static getAllKeys() {
    return new Promise((resolve, reject) => {
      storage.getAllKeys({
        success: (data) => {
          resolve(data)
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  }

  /**
   * 检查键是否存在
   */
  static async has(key) {
    try {
      const value = await this.get(key)
      return value !== null
    } catch (e) {
      return false
    }
  }

  /**
   * 获取带过期时间的数据
   */
  static async getWithExpiry(key) {
    try {
      const data = await this.get(key)
      if (!data) return null

      if (data.expiry && Date.now() > data.expiry) {
        await this.delete(key)
        return null
      }

      return data.value
    } catch (e) {
      return null
    }
  }

  /**
   * 设置带过期时间的数据
   */
  static setWithExpiry(key, value, ttlMs) {
    const data = {
      value: value,
      expiry: Date.now() + ttlMs
    }
    return this.set(key, data)
  }

  /**
   * 批量获取
   */
  static async getMultiple(keys) {
    const results = {}
    for (const key of keys) {
      try {
        results[key] = await this.get(key)
      } catch (e) {
        results[key] = null
      }
    }
    return results
  }

  /**
   * 批量设置
   */
  static async setMultiple(data) {
    const promises = Object.entries(data).map(([key, value]) => {
      return this.set(key, value)
    })
    return Promise.all(promises)
  }

  /**
   * 原子操作：读取-修改-写入
   */
  static async update(key, modifier) {
    const current = await this.get(key)
    const updated = modifier(current)
    await this.set(key, updated)
    return updated
  }

  /**
   * 计数器自增
   */
  static async increment(key, amount = 1) {
    return this.update(key, (current) => {
      const num = typeof current === 'number' ? current : 0
      return num + amount
    })
  }

  /**
   * 列表追加
   */
  static async append(key, item, maxItems = 100) {
    return this.update(key, (current) => {
      const list = Array.isArray(current) ? current : []
      list.push(item)
      if (list.length > maxItems) {
        list.shift()
      }
      return list
    })
  }
}

export default StorageUtil
