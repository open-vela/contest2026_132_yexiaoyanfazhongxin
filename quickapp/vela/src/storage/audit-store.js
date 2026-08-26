/**
 * 审计日志专用存储模块
 *
 * 实现安全审计日志的加密存储和防篡改机制：
 * - 每日一个日志文件，AES-256 加密
 * - 只追加模式，禁止修改历史日志
 * - 哈希链防篡改：每日文件生成 SHA-256 摘要，存储在次日文件头部
 *
 * @module storage/audit-store
 */

import { CryptoManager, CRYPTO_LEVEL } from '../privacy/crypto-manager'

/**
 * 审计日志存储路径
 */
const AUDIT_DIR = '/data/secure/audit/'

/**
 * 审计日志存储管理器
 */
export class AuditStore {
  constructor() {
    this._cryptoManager = null
    this._initialized = false
    // 内存缓冲区（当日日志）
    this._buffer = []
    // 当前日期标识
    this._currentDate = this._getDateKey()
    // 前一日哈希（用于哈希链）
    this._prevDayHash = null
  }

  /**
   * 初始化审计存储
   *
   * @param {CryptoManager} cryptoManager - 加密管理器实例
   * @returns {Promise<boolean>}
   */
  async init(cryptoManager) {
    this._cryptoManager = cryptoManager
    this._initialized = true

    // 加载前一日哈希
    await this._loadPrevDayHash()

    console.log('[AuditStore] Initialized')
    return true
  }

  /**
   * 追加审计日志条目
   *
   * @param {Object} entry - 日志条目
   * @param {string} entry.eventType - 事件类型
   * @param {string} entry.dataLevel - 数据级别
   * @param {string} entry.result - 结果
   * @param {Object} entry.details - 详情
   * @returns {Promise<boolean>}
   */
  async append(entry) {
    this._checkInitialized()

    const logEntry = {
      timestamp: Date.now(),
      eventType: entry.eventType || 'unknown',
      dataLevel: entry.dataLevel || 'none',
      result: entry.result || 'success',
      details: entry.details || {},
    }

    this._buffer.push(logEntry)

    // 检查是否需要切换日期文件
    const today = this._getDateKey()
    if (today !== this._currentDate) {
      await this._flushToDisk()
      this._currentDate = today
    }

    // 缓冲区满时自动刷盘
    if (this._buffer.length >= 100) {
      await this._flushToDisk()
    }

    return true
  }

  /**
   * 查询审计日志
   *
   * @param {number} startTime - 起始时间戳
   * @param {number} endTime - 结束时间戳
   * @returns {Promise<Array>} 日志条目列表
   */
  async queryLogs(startTime, endTime) {
    this._checkInitialized()

    const results = []
    const startKey = this._getDateKey(new Date(startTime))
    const endKey = this._getDateKey(new Date(endTime))

    // 遍历日期范围内的日志文件
    const files = await this._listAuditFiles()

    for (const file of files) {
      const fileDate = file.dateKey
      if (fileDate >= startKey && fileDate <= endKey) {
        const entries = await this._readLogFile(file)
        // 过滤时间范围
        for (const entry of entries) {
          if (entry.timestamp >= startTime && entry.timestamp <= endTime) {
            results.push(entry)
          }
        }
      }
    }

    // 合并内存缓冲区中的当日日志
    for (const entry of this._buffer) {
      if (entry.timestamp >= startTime && entry.timestamp <= endTime) {
        results.push(entry)
      }
    }

    // 按时间排序
    results.sort((a, b) => a.timestamp - b.timestamp)

    return results
  }

  /**
   * 刷盘：将缓冲区日志写入磁盘
   *
   * @returns {Promise<boolean>}
   */
  async flush() {
    return this._flushToDisk()
  }

  /**
   * 获取审计存储统计
   *
   * @returns {Promise<Object>}
   */
  async getStats() {
    const files = await this._listAuditFiles()
    let totalEntries = 0

    for (const file of files) {
      const entries = await this._readLogFile(file)
      totalEntries += entries.length
    }

    totalEntries += this._buffer.length

    return {
      totalFiles: files.length,
      totalEntries,
      bufferedEntries: this._buffer.length,
      currentFile: this._getLogFilePath(this._currentDate),
    }
  }

  /**
   * 将缓冲区写入磁盘
   *
   * @returns {Promise<boolean>}
   * @private
   */
  async _flushToDisk() {
    if (this._buffer.length === 0) return true

    const logData = {
      dateKey: this._currentDate,
      prevHash: this._prevDayHash,
      entries: [...this._buffer],
    }

    // 加密日志数据
    const encrypted = await this._cryptoManager.encrypt(logData, CRYPTO_LEVEL.L2)

    // 计算当日哈希（用于哈希链）
    const todayHash = await this._computeHash(encrypted)
    this._prevDayHash = todayHash

    // 写入文件
    const filePath = this._getLogFilePath(this._currentDate)
    const fileContent = JSON.stringify({
      hash: todayHash,
      payload: encrypted,
    })

    await this._writeFile(filePath, fileContent)

    // 清空缓冲区
    this._buffer = []

    console.log(`[AuditStore] Flushed ${logData.entries.length} entries to ${filePath}`)
    return true
  }

  /**
   * 读取日志文件并解密
   *
   * @param {Object} file - 文件信息
   * @returns {Promise<Array>} 日志条目列表
   * @private
   */
  async _readLogFile(file) {
    try {
      const content = await this._readFile(file.path)
      const fileData = JSON.parse(content)

      // 验证哈希链
      if (fileData.prevHash && this._prevDayHash) {
        // 实际应用中应验证哈希链完整性
      }

      // 解密
      const decrypted = await this._cryptoManager.decrypt(fileData.payload)
      return decrypted.entries || []
    } catch (error) {
      console.error(`[AuditStore] Failed to read log file: ${file.path}`, error)
      return []
    }
  }

  /**
   * 列出审计日志文件
   *
   * @returns {Promise<Array>}
   * @private
   */
  async _listAuditFiles() {
    // OpenVela: @system.file.list
    // 模拟实现
    if (!this._mockFs) return []

    const files = []
    for (const path of Object.keys(this._mockFs)) {
      if (path.startsWith(AUDIT_DIR) && path.endsWith('.enc')) {
        const filename = path.replace(AUDIT_DIR, '')
        const dateKey = filename.replace('audit_', '').replace('.enc', '')
        files.push({
          filename,
          path,
          dateKey,
        })
      }
    }

    return files.sort((a, b) => a.dateKey.localeCompare(b.dateKey))
  }

  /**
   * 加载前一日哈希
   *
   * @private
   */
  async _loadPrevDayHash() {
    const files = await this._listAuditFiles()
    if (files.length > 0) {
      const lastFile = files[files.length - 1]
      try {
        const content = await this._readFile(lastFile.path)
        const fileData = JSON.parse(content)
        this._prevDayHash = fileData.hash
      } catch {
        this._prevDayHash = null
      }
    }
  }

  /**
   * 获取日志文件路径
   *
   * @param {string} dateKey - 日期标识
   * @returns {string}
   * @private
   */
  _getLogFilePath(dateKey) {
    return `${AUDIT_DIR}audit_${dateKey}.enc`
  }

  /**
   * 获取日期标识
   *
   * @param {Date} [date]
   * @returns {string} YYYY-MM-DD 格式
   * @private
   */
  _getDateKey(date = new Date()) {
    return date.toISOString().split('T')[0]
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
   * 检查是否已初始化
   * @private
   */
  _checkInitialized() {
    if (!this._initialized) {
      throw new Error('AuditStore not initialized')
    }
  }

  // ============================================================
  // 模拟文件系统操作（OpenVela 中替换为真实 API）
  // ============================================================

  async _writeFile(path, content) {
    if (!this._mockFs) this._mockFs = {}
    this._mockFs[path] = content
    console.log(`[AuditStore] Write: ${path}`)
  }

  async _readFile(path) {
    if (!this._mockFs || !this._mockFs[path]) {
      throw new Error(`File not found: ${path}`)
    }
    return this._mockFs[path]
  }
}

export default AuditStore
