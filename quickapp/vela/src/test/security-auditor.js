/**
 * 安全扫描工具
 *
 * 扫描项目代码和存储文件，检测安全风险：
 * - 明文敏感字段检测
 * - 硬编码密钥检测
 * - 网络请求代码检测
 * - 存储文件安全检查
 *
 * @module test/security-auditor
 */

/**
 * 敏感字段正则模式
 */
const SENSITIVE_PATTERNS = {
  heartRate: /\b(heart[_-]?rate|hr|bpm)\s*[=:]\s*\d{2,3}\b/gi,
  coordinates: /\b(x|y|z|lat|lng|longitude|latitude)\s*[=:]\s*-?\d+\.\d+/gi,
  timestamp: /\b(timestamp|time|date)\s*[=:]\s*\d{10,13}\b/gi,
  steps: /\b(steps|step[_-]?count)\s*[=:]\s*\d+/gi,
}

/**
 * 硬编码密钥模式
 */
const KEY_PATTERNS = {
  hardcodedKey: /(?:key|secret|password|token)\s*[=:]\s*['"][A-Za-z0-9+/=]{16,}['"]/gi,
  aesKey: /\bAES[_-]?\d{2,3}\b.*(?:key|secret)\s*[=:]/gi,
}

/**
 * 网络请求模式
 */
const NETWORK_PATTERNS = {
  fetch: /\bfetch\s*\(/gi,
  xmlhttp: /\bXMLHttpRequest\b/gi,
  websocket: /\bWebSocket\b/gi,
  axios: /\baxios\b/gi,
  http: /\bhttp[s]?:\/\//gi,
}

/**
 * 安全审计器
 */
export class SecurityAuditor {
  constructor() {
    this._findings = []
    this._fileContents = new Map()
  }

  /**
   * 加载文件内容进行扫描
   *
   * @param {string} filePath - 文件路径
   * @param {string} content - 文件内容
   */
  loadFile(filePath, content) {
    this._fileContents.set(filePath, content)
  }

  /**
   * 运行完整安全扫描
   *
   * @returns {Promise<Object>} 安全报告
   */
  async runFullScan() {
    this._findings = []

    // 1. 检查明文敏感字段
    this._scanForPlaintextSensitive()

    // 2. 检查硬编码密钥
    this._scanForHardcodedKeys()

    // 3. 检查网络请求代码
    this._scanForNetworkCode()

    // 4. 检查存储文件安全
    this._scanStorageFiles()

    return this._generateReport()
  }

  /**
   * 扫查明文敏感字段
   * @private
   */
  _scanForPlaintextSensitive() {
    for (const [filePath, content] of this._fileContents) {
      // 跳过测试文件和 node_modules
      if (filePath.includes('node_modules') || filePath.includes('/test/')) {
        continue
      }

      for (const [fieldName, pattern] of Object.entries(SENSITIVE_PATTERNS)) {
        const matches = content.match(pattern)
        if (matches) {
          for (const match of matches) {
            this._findings.push({
              type: 'plaintext_sensitive',
              severity: 'high',
              file: filePath,
              field: fieldName,
              match: match.slice(0, 50),
              message: `发现明文敏感字段: ${fieldName}`,
            })
          }
        }
      }
    }
  }

  /**
   * 扫查硬编码密钥
   * @private
   */
  _scanForHardcodedKeys() {
    for (const [filePath, content] of this._fileContents) {
      if (filePath.includes('node_modules')) {
        continue
      }

      for (const [keyType, pattern] of Object.entries(KEY_PATTERNS)) {
        const matches = content.match(pattern)
        if (matches) {
          for (const match of matches) {
            this._findings.push({
              type: 'hardcoded_key',
              severity: 'critical',
              file: filePath,
              keyType,
              match: match.slice(0, 50) + '...',
              message: `发现疑似硬编码密钥: ${keyType}`,
            })
          }
        }
      }
    }
  }

  /**
   * 扫描网络请求代码
   * @private
   */
  _scanForNetworkCode() {
    for (const [filePath, content] of this._fileContents) {
      if (filePath.includes('node_modules') || filePath.includes('/test/')) {
        continue
      }

      for (const [apiName, pattern] of Object.entries(NETWORK_PATTERNS)) {
        const matches = content.match(pattern)
        if (matches) {
          for (const match of matches) {
            this._findings.push({
              type: 'network_code',
              severity: 'critical',
              file: filePath,
              api: apiName,
              match: match.slice(0, 50),
              message: `发现网络请求代码: ${apiName}`,
            })
          }
        }
      }
    }
  }

  /**
   * 扫描存储文件
   * @private
   */
  _scanStorageFiles() {
    for (const [filePath, content] of this._fileContents) {
      if (!filePath.includes('/data/secure/')) {
        continue
      }

      // 检查是否为加密文件
      try {
        const data = JSON.parse(content)
        if (data.payload && data.payload.ciphertext) {
          // 加密文件，检查是否包含明文元数据
          if (data.metadata && typeof data.metadata === 'object') {
            const metadataStr = JSON.stringify(data.metadata)
            for (const [fieldName, pattern] of Object.entries(SENSITIVE_PATTERNS)) {
              if (pattern.test(metadataStr)) {
                this._findings.push({
                  type: 'storage_plaintext',
                  severity: 'medium',
                  file: filePath,
                  field: fieldName,
                  message: `存储文件元数据包含明文敏感字段: ${fieldName}`,
                })
              }
            }
          }
        } else {
          // 未加密文件
          this._findings.push({
            type: 'unencrypted_storage',
            severity: 'high',
            file: filePath,
            message: '存储文件未加密',
          })
        }
      } catch {
        // 非 JSON 文件
        this._findings.push({
          type: 'unknown_storage_format',
          severity: 'low',
          file: filePath,
          message: '存储文件格式未知',
        })
      }
    }
  }

  /**
   * 生成安全报告
   * @private
   */
  _generateReport() {
    const critical = this._findings.filter(f => f.severity === 'critical')
    const high = this._findings.filter(f => f.severity === 'high')
    const medium = this._findings.filter(f => f.severity === 'medium')
    const low = this._findings.filter(f => f.severity === 'low')

    const passed = critical.length === 0 && high.length === 0

    return {
      timestamp: Date.now(),
      passed,
      summary: {
        total: this._findings.length,
        critical: critical.length,
        high: high.length,
        medium: medium.length,
        low: low.length,
      },
      findings: this._findings,
    }
  }

  /**
   * 格式化安全报告
   *
   * @param {Object} report
   * @returns {string}
   */
  static formatReport(report) {
    let text = '=== 安全扫描报告 ===\n'
    text += `时间: ${new Date(report.timestamp).toLocaleString()}\n`
    text += `结论: ${report.passed ? '✅ 通过' : '❌ 存在安全风险'}\n\n`

    text += '--- 发现问题 ---\n'
    if (report.findings.length === 0) {
      text += '未发现安全问题\n'
    } else {
      for (const f of report.findings) {
        const icon = f.severity === 'critical' ? '🔴' :
                     f.severity === 'high' ? '🟠' :
                     f.severity === 'medium' ? '🟡' : '🟢'
        text += `${icon} [${f.severity.toUpperCase()}] ${f.message}\n`
        text += `   文件: ${f.file}\n`
        if (f.match) {
          text += `   匹配: ${f.match}\n`
        }
        text += '\n'
      }
    }

    text += '--- 统计 ---\n'
    text += `严重: ${report.summary.critical}\n`
    text += `高危: ${report.summary.high}\n`
    text += `中危: ${report.summary.medium}\n`
    text += `低危: ${report.summary.low}\n`

    return text
  }
}

export default SecurityAuditor
