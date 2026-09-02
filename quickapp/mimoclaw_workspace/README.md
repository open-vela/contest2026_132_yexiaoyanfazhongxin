# 体态守护 (Posture Guard)

AI智能体态监测助手 - 基于 openvela 的智能手表快应用

## 📱 应用简介

体态守护是一款运行在 openvela 智能手表上的快应用，通过传感器数据实时监测用户体态，结合 AI 分析提供个性化的体态改善建议。

### 核心功能

- 🏃 **实时体态监测** - 基于加速度传感器和陀螺仪数据，实时判断用户坐姿
- 🤖 **AI 智能分析** - 接入云端 LLM，提供个性化的体态改善建议
- 📊 **数据可视化** - 图表展示体态趋势，直观了解改善进度
- 🔔 **智能提醒** - 不良体态时震动提醒，培养良好习惯
- 📅 **历史记录** - 记录每日体态数据，支持周/月视图

## 🛠️ 技术栈

- **框架**: openvela 快应用框架
- **语言**: JavaScript
- **UI**: Flex 布局 + 响应式设计
- **传感器**: @system.sensor (加速度传感器、陀螺仪)
- **存储**: @system.storage (本地数据持久化)
- **网络**: @system.fetch (云端 AI API 调用)
- **震动**: @system.vibrator (体态提醒)

## 📁 项目结构

```
posture-guard/
├── manifest.json              # 应用配置
├── package.json               # 项目依赖
├── app.ux                     # 全局入口
├── src/
│   ├── pages/
│   │   ├── home/              # 首页（体态评分+统计）
│   │   ├── settings/          # 设置页
│   │   ├── history/           # 历史记录页
│   │   └── alert/             # 告警/AI分析页
│   ├── common/
│   │   ├── services/
│   │   │   ├── posture-service.js  # 体态检测服务
│   │   │   └── ai-service.js       # AI 服务
│   │   ├── utils/
│   │   │   ├── storage.js          # 存储工具
│   │   │   └── date.js             # 日期工具
│   │   └── icons/                  # 图标资源
│   └── i18n/
│       ├── defaults.json           # 默认语言
│       └── zh-CN.json              # 中文语言包
├── sign/                           # 签名文件
└── README.md
```

## 🚀 快速开始

### 环境准备

1. 安装 AIoT-IDE
2. 安装 Node.js 18+
3. 安装 aiot-toolkit

```bash
npm install -g aiot-toolkit --registry=https://registry.npmmirror.com
```

### 运行项目

1. 在 AIoT-IDE 中打开项目
2. 选择目标模拟器（466×466 方屏手表）
3. 点击"运行"按钮

### 打包发布

```bash
# 开发模式打包
aiot-toolkit build

# 生产模式打包（需要签名文件）
aiot-toolkit release
```

## ⚙️ 配置说明

### AI 配置

在 `manifest.json` 中配置 AI 服务：

```json
{
  "data": {
    "aiEndpoint": "https://api.moonshot.cn/v1/chat/completions",
    "aiModel": "kimi-k2.5"
  }
}
```

支持的 LLM 后端：
- **Kimi** (Moonshot AI) - 默认
- **DeepSeek**
- **MiMo** (小米大模型)
- 任意 OpenAI 兼容接口

### 传感器配置

在 `manifest.json` 中声明所需传感器权限：

```json
{
  "features": [
    { "name": "system.sensor" },
    { "name": "system.vibrator" }
  ]
}
```

## 📊 数据模型

### 体态数据

```javascript
{
  timestamp: 1725168000000,
  score: 85,                    // 体态评分 (0-100)
  goodPostureMinutes: 45,       // 良好体态时间（分钟）
  badPostureMinutes: 15,        // 不良体态时间（分钟）
  totalChecks: 12,              // 检测次数
  reminders: 3                  // 提醒次数
}
```

### 体态类型

- `good` - 良好坐姿
- `leaning_forward` - 过度前倾
- `leaning_back` - 过度后仰
- `tilted` - 身体侧倾
- `unknown` - 未知状态

## 🎨 界面设计

### 配色方案

- 主背景: 深蓝渐变 (#1a1a2e → #16213e → #0f3460)
- 主色调: 绿色 (#4ade80) - 代表健康
- 强调色: 紫色 (#a78bfa) - 代表 AI
- 警告色: 黄色 (#fbbf24) - 代表注意
- 危险色: 红色 (#ef4444) - 代表警告

### 设计规范

- 设计尺寸: 466×466px（方屏手表基准）
- 布局方式: Flex 弹性布局
- 字体大小: 10-48px
- 圆角: 8-25px
- 间距: 5-20px

## 🔧 开发指南

### 添加新页面

1. 在 `src/pages/` 下创建新目录
2. 创建 `.ux` 文件（template + style + script）
3. 在 `manifest.json` 的 router.pages 中注册

### 调用传感器

```javascript
import sensor from '@system.sensor'

sensor.subscribeAccelerometer({
  interval: 'normal',
  success: (data) => {
    console.log('加速度:', data.x, data.y, data.z)
  }
})
```

### 调用 AI 服务

```javascript
import aiService from '../common/services/ai-service'

// 设置API密钥
aiService.setApiKey('kimi', 'your-api-key')

// 发送消息
const reply = await aiService.chat('如何改善体态？')
console.log(reply)
```

### 本地存储

```javascript
import storage from '@system.storage'

// 保存数据
storage.set({
  key: 'settings',
  value: JSON.stringify({ interval: 30 })
})

// 读取数据
storage.get({
  key: 'settings',
  success: (data) => {
    const settings = JSON.parse(data)
  }
})
```

## 📝 更新日志

### v1.0.0 (2026-09-01)
- ✨ 初始版本发布
- 🏃 基础体态监测功能
- 🤖 AI 智能分析
- 📊 数据可视化
- 🔔 震动提醒

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

- 项目主页: https://github.com/your-username/posture-guard
- 问题反馈: https://github.com/your-username/posture-guard/issues
