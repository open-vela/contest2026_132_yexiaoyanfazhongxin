/**
 * 安全存储封装模块
 *
 * 封装所有文件 IO 操作，上层模块禁止直接调用系统文件 API。
 * 所有数据写入前必须经过脱敏检查和加密处理。
 *
 * 写入流程：数据 → 脱敏检查 → 加密 → 写入磁盘
 * 读取流程：文件 → 解密 → 返回
 *
 * 目录结构：
 * /data/secure/l1/  # 普通统计数据
 * /data/secure/l2/  # 生理趋势
 * /data/secure/l3/  # 原始特征（24h 销毁）
 * /data/secure/audit/ # 审计日志
 *
 * @module storage/secure-storage
 */

import { CryptoManager, CRYPTO_LEVEL } from '../privacy/crypto-manager'
import { Desensitizer } from '../privacy/desensitizer'

/**
 * 数据级别对应的存储目录
 */
const STORAGE_PATHS = {
  [CRYPTO_LEVEL.L1]: '/data/secure/l1/',
  [CRYPTO_LEVEL.L2]: '/data/secure/l2/',
  [CRYPTO_LEVEL.L3]: '/data/secure/l3/',
  audit: '/data/secure/audit/',
}

/**
 * 安全存储管理器
 */
export class SecureStorage {
  constructor() {
    this._cryptoManager = new CryptoManager()
    this._desensitizer = new Desensitizer()
    this._initialized = false
    this._deviceId = null
  }

  /**
   * 初始化安全存储
   *
   * @param {Object} params
   * @param {string} params.deviceId - 设备标识
   * @param {string} params.userPin - 用户 PIN
   * @returns {Promise<boolean>}
   */
  async init(params) {
    this._deviceId = params.deviceId
    await this._cryptoManager.init(params)

    // 确保存储目录存在
    await this._ensureDirectories()

    this._initialized = true
    return true
  }

  /**
   * 安全写入数据
   *
   * @param {Object} data - 原始数据
   * @param {number} level - 数据级别 (1, 2, 3)
   * @param {string} [filename] - 文件名（可选，自动生成）
   * @returns {Promise<Object>} 写入结果 { path, size, timestamp }
   */
  async write(data, level = CRYPTO_LEVEL.L1, filename = null) {
    this._checkInitialized()

    // 1. 脱敏检查
    const desensitized = this._desensitizer.desensitizeSensorData(data) ||
                         this._desensitizer.desensitizeEngineOutput(data)

    // 2. 加密
    const encrypted = await this._cryptoManager.encrypt(desensitized, level)

    // 3. 生成文件元数据
    const metadata = {
      filename: filename || this._generateFilename(level),
      level,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      size: 0,
      hash: await this._computeHash(encrypted),
    }

    // 4. 写入磁盘
    const path = STORAGE_PATHS[level] + metadata.filename
    const fileData = {
      metadata,
      payload: encrypted,
    }

    // 模拟文件系统写入（在 OpenVela 中使用 @system.file）
    await this._writeFile(path, JSON.stringify(fileData))

    metadata.size = JSON.stringify(fileData).length

    return {
      path,
      size: metadata.size,
      timestamp: metadata.createdAt,
    }
  }

  /**
   * 安全读取数据
   *
   * @param {string} path - 文件路径
   * @returns {Promise<Object>} 解密后的数据
   */
  async read(path) {
    this._checkInitialized()

    // 1. 读取文件
    const fileContent = await this._readFile(path)
    const fileData = JSON.parse(fileContent)

    // 2. 验证完整性
    const hash = await this._computeHash(fileData.payload)
    if (hash !== fileData.metadata.hash) {
      throw new Error('File integrity check failed')
    }

    // 3. 解密
    const decrypted = await this._cryptoManager.decrypt(fileData.payload)

    return decrypted
  }

  /**
   * 安全删除文件（覆写后删除）
   *
   * @param {string} path - 文件路径
   * @param {number} [overwriteTimes=3] - 覆写次数
   * @returns {Promise<boolean>}
   */
  async secureDelete(path, overwriteTimes = 3) {
    this._checkInitialized()

    // 覆写文件内容
    for (let i = 0; i < overwriteTimes; i++) {
      const noise = this._generateRandomBytes(1024)
      await this._writeFile(path, noise)
    }

    // 最终删除
    await this._deleteFile(path)

    return true
  }

  /**
   * 列出指定级别的所有文件
   *
   * @param {number} level - 数据级别
   * @returns {Promise<Array>} 文件元数据列表
   */
  async listFiles(level) {
    this._checkInitialized()

    const dirPath = STORAGE_PATHS[level] || STORAGE_PATHS.audit
    const files = await this._listDirectory(dirPath)

    return files.map(file => ({
      ...file,
      level,
    }))
  }

  /**
   * 获取存储统计信息
   *
   * @returns {Promise<Object>} { totalFiles, totalSize, byLevel }
   */
  async getStats() {
    this._checkInitialized()

    const stats = {
      totalFiles: 0,
      totalSize: 0,
      byLevel: {
        [CRYPTO_LEVEL.L1]: { count: 0, size: 0 },
        [CRYPTO_LEVEL.L2]: { count: 0, size: 0 },
        [CRYPTO_LEVEL.L3]: { count: 0, size: 0 },
        audit: { count: 0, size: 0 },
      },
    }

    for (const [levelKey, dirPath] of Object.entries(STORAGE_PATHS)) {
      const files = await this._listDirectory(dirPath)
      const levelStats = stats.byLevel[levelKey] || { count: 0, size: 0 }
      levelStats.count = files.length
      levelStats.size = files.reduce((sum, f) => sum + (f.size || 0), 0)
      stats.totalFiles += levelStats.count
      stats.totalSize += levelStats.size
    }

    return stats
  }

  /**
   * 确保存储目录存在
   *
   * @private
   */
  async _ensureDirectories() {
    for (const dirPath of Object.values(STORAGE_PATHS)) {
      await this._createDirectory(dirPath)
    }
  }

  /**
   * 生成文件名
   *
   * @param {number} level
   * @returns {string}
   * @private
   */
  _generateFilename(level) {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `l${level}_${timestamp}_${random}.enc`
  }

  /**
   * 计算数据哈希
   *
   * @param {Object} data
   * @returns {Promise<string>}
   * @private
   */
  async _computeHash(data) {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(JSON.stringify(data))
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * 生成随机字节（用于覆写）
   *
   * @param {number} length
   * @returns {string}
   * @private
   */
  _generateRandomBytes(length) {
    const bytes = new Uint8Array(length)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, b => String.fromCharCode(b)).join('')
  }

  /**
   * 检查是否已初始化
   * @private
   */
  _checkInitialized() {
    if (!this._initialized) {
      throw new Error('SecureStorage not initialized')
    }
  }

  // ============================================================
  // 以下为模拟文件系统操作（在 OpenVela 中替换为真实 API）
  // ============================================================

  /**
   * 写入文件（模拟）
   *
   * @param {string} path
   * @param {string} content
   * @private
   */
  async _writeFile(path, content) {
    // OpenVela: @system.file.write
    // 模拟实现：使用内存存储
    if (!this._mockFs) this._mockFs = {}
    this._mockFs[path] = content
    console.log(`[SecureStorage] Write: ${path} (${content.length} bytes)`)
  }

  /**
   * 读取文件（模拟）
   *
   * @param {string} path
   * @returns {Promise<string>}
   * @private
   */
  async _readFile(path) {
    // OpenVela: @system.file.read
    if (!this._mockFs || !this._mockFs[path]) {
      throw new Error(`File not found: ${path}`)
    }
    return this._mockFs[path]
  }

  /**
   * 删除文件（模拟）
   *
   * @param {string} path
   * @private
   */
  async _deleteFile(path) {
    // OpenVela: @system.file.delete
    if (this._mockFs) {
      delete this._mockFs[path]
    }
    console.log(`[SecureStorage] Deleted: ${path}`)
  }

  /**
   * 列出目录（模拟）
   *
   * @param {string} dirPath
   * @returns {Promise<Array>}
   * @private
   */
  async _listDirectory(dirPath) {
    // OpenVela: @system.file.list
    if (!this._mockFs) return []

    const files = []
    for (const path of Object.keys(this._mockFs)) {
      if (path.startsWith(dirPath)) {
        const filename = path.replace(dirPath, '')
        try {
          const content = this._mockFs[path]
          const fileData = JSON.parse(content)
          files.push({
            filename,
            path,
            size: content.length,
            createdAt: fileData.metadata?.createdAt || 0,
          })
        } catch {
          files.push({
            filename,
            path,
            size: content.length,
            createdAt: 0,
          })
        }
      }
    }
    return files
  }

  /**
   * 创建目录（模拟）
   *
   * @param {string} dirPath
   * @private
   */
  async _createDirectory(dirPath) {
    // OpenVela: @system.file.mkdir
    console.log(`[SecureStorage] Ensure dir: ${dirPath}`)
  }
}

export default SecureStorage
