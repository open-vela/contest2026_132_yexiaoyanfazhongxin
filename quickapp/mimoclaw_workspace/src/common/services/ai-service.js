/**
 * AI 服务
 * 负责与云端LLM通信，提供智能分析和对话能力
 */

import fetch from '@system.fetch'

class AIService {
  constructor() {
    // 默认配置
    this.config = {
      providers: {
        kimi: {
          url: 'https://api.moonshot.cn/v1/chat/completions',
          model: 'kimi-k2.5',
          apiKey: ''
        },
        deepseek: {
          url: 'https://api.deepseek.com/v1/chat/completions',
          model: 'deepseek-chat',
          apiKey: ''
        },
        mimo: {
          url: 'https://api.mimo.com/v1/chat/completions',
          model: 'mimo-v2-flash',
          apiKey: ''
        }
      },
      currentProvider: 'kimi',
      maxTokens: 200,
      temperature: 0.7
    }

    // 对话历史
    this.conversationHistory = []
    this.maxHistoryLength = 10
  }

  /**
   * 设置API密钥
   */
  setApiKey(provider, apiKey) {
    if (this.config.providers[provider]) {
      this.config.providers[provider].apiKey = apiKey
    }
  }

  /**
   * 切换LLM后端
   */
  setProvider(provider) {
    if (this.config.providers[provider]) {
      this.config.currentProvider = provider
    }
  }

  /**
   * 发送消息到LLM
   */
  chat(message, context = {}) {
    return new Promise((resolve, reject) => {
      const provider = this.config.providers[this.config.currentProvider]

      if (!provider.apiKey) {
        reject(new Error('请先设置API密钥'))
        return
      }

      // 构建系统提示词
      const systemPrompt = this.buildSystemPrompt(context)

      // 构建消息列表
      const messages = [
        { role: 'system', content: systemPrompt },
        ...this.conversationHistory.slice(-this.maxHistoryLength),
        { role: 'user', content: message }
      ]

      // 发送请求
      fetch.fetch({
        url: provider.url,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        data: JSON.stringify({
          model: provider.model,
          messages: messages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature
        }),
        success: (res) => {
          try {
            const data = JSON.parse(res.data)
            const reply = data.choices[0].message.content

            // 更新对话历史
            this.conversationHistory.push(
              { role: 'user', content: message },
              { role: 'assistant', content: reply }
            )

            // 保持历史长度
            if (this.conversationHistory.length > this.maxHistoryLength * 2) {
              this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength * 2)
            }

            resolve(reply)
          } catch (err) {
            reject(new Error('解析响应失败'))
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  }

  /**
   * 构建系统提示词
   */
  buildSystemPrompt(context) {
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    let prompt = `你是一个运行在智能手表上的AI体态守护助手。

当前时间：${timeStr}
设备：智能手表（屏幕较小，回复要简洁）

你的职责：
1. 分析用户的体态数据，提供改善建议
2. 回答关于体态健康的问题
3. 提供友好的鼓励和提醒

回复要求：
- 使用简短的语言（手表屏幕小）
- 优先使用表情符号辅助表达
- 给出具体可操作的建议
- 保持友好和鼓励的语气`

    // 添加上下文信息
    if (context.score !== undefined) {
      prompt += `\n\n用户当前体态评分：${context.score}分`
    }
    if (context.goodMinutes !== undefined) {
      prompt += `\n良好体态时间：${context.goodMinutes}分钟`
    }
    if (context.badMinutes !== undefined) {
      prompt += `\n不良体态时间：${context.badMinutes}分钟`
    }
    if (context.postureType) {
      prompt += `\n当前体态状态：${context.postureType}`
    }

    return prompt
  }

  /**
   * 分析体态数据
   */
  analyzePostureData(data) {
    const context = {
      score: data.score,
      goodMinutes: data.goodPostureMinutes,
      badMinutes: data.badPostureMinutes
    }

    let question = ''

    if (data.score >= 90) {
      question = '我的体态评分很高，请给我一些保持的建议。'
    } else if (data.score >= 70) {
      question = '我的体态评分还不错，如何进一步改善？'
    } else if (data.score >= 50) {
      question = '我的体态评分一般，需要如何改善？'
    } else {
      question = '我的体态评分较低，请给出详细的改善建议。'
    }

    return this.chat(question, context)
  }

  /**
   * 获取体态建议
   */
  getPostureAdvice(postureType) {
    const context = { postureType }

    const questions = {
      'leaning_forward': '我经常前倾，如何改善？',
      'leaning_back': '我经常后仰，如何调整？',
      'tilted': '我身体容易侧倾，怎么办？',
      'good': '如何保持良好的坐姿习惯？'
    }

    const question = questions[postureType] || '如何改善体态？'
    return this.chat(question, context)
  }

  /**
   * 生成每日报告
   */
  generateDailyReport(data) {
    const context = {
      score: data.score,
      goodMinutes: data.goodPostureMinutes,
      badMinutes: data.badPostureMinutes
    }

    const question = `请生成一份简短的每日体态报告，包括：
1. 今日表现总结
2. 需要注意的问题
3. 明日改善建议`

    return this.chat(question, context)
  }

  /**
   * 生成周报
   */
  generateWeeklyReport(weekData) {
    let summary = '最近一周的体态数据：\n'
    weekData.forEach((day, index) => {
      summary += `${index + 1}. ${day.date}: ${day.score}分\n`
    })

    const question = `${summary}
请分析这一周的体态趋势，给出总结和改进建议。`

    return this.chat(question)
  }

  /**
   * 清除对话历史
   */
  clearHistory() {
    this.conversationHistory = []
  }

  /**
   * 获取当前配置
   */
  getConfig() {
    return { ...this.config }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig) {
    Object.assign(this.config, newConfig)
  }
}

// 导出单例
export default new AIService()
