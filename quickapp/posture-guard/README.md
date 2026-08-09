# 体态安全卫士（Posture Guard）

基于端侧AI体态识别的穿戴隐私安全防护系统

## 一、作品简介

本应用是一款运行在智能手表上的隐私安全防护系统，通过端侧AI算法实时识别用户不良体态（久坐、低头前倾、跷二郎腿），并对所有健康数据进行本地脱敏和分级加密存储，确保数据"可用不可见"，全程零网络请求。

### 核心功能

1. **端侧AI体态识别**：基于加速度计三轴数据的轻量化时序分析，实时检测不良体态并触发震动+弹窗提醒
2. **隐私数据本地脱敏**：心率、步数、压力等敏感数据自动降采样、聚合，仅保留统计特征
3. **AES分级加密存储**：L1明文/L2-AES-ECB/L3-AES-CBC三级数据安全策略
4. **本地数据可视化**：适配圆形表盘，展示体态评分、异常分布、加密状态

## 二、选题方向

**快应用 / 手表应用创新**

选择理由：
- 充分利用手表加速度传感器能力
- 解决现代人久坐、低头等健康痛点
- 端侧隐私保护符合数据安全趋势
- 纯离线运行，无需依赖手机或云端

## 三、目录结构

```
quickapp/posture-guard/
├── package.json                    # 项目配置
├── README.md                       # 本文件
└── src/
    ├── app.ux                      # 应用入口（全局生命周期）
    ├── manifest.json               # 权限声明、路由配置
    ├── common/
    │   └── logo.png                # 应用图标
    ├── lib/
    │   ├── posture-detector.js     # 体态识别算法（规则引擎）
    │   ├── anonymizer.js           # 隐私数据脱敏处理
    │   ├── crypto-store.js         # AES分级加密存储封装
    │   └── data-manager.js         # 数据生命周期管理
    └── pages/
        ├── index/index.ux          # 首页：仪表盘总览
        ├── posture/posture.ux      # 体态监测详情页
        ├── privacy/privacy.ux      # 隐私防护状态页
        └── report/report.ux        # 健康报表页
```

## 四、运行方式

### 环境准备

1. 安装 AIoT IDE：https://iot.mi.com/vela/quickapp/zh/guide/start/use-ide.html
2. 配置 MiMo 大模型（可选，用于 AI 辅助开发）

### 开发调试

1. 用 AIoT IDE 打开 `quickapp/posture-guard/` 目录
2. 点击「模拟器」→「新建」→ 选择 `vela-watch-5` 镜像
3. 点击「运行」启动应用

### 部署到 OpenVela 模拟器

```bash
# 1. 打包生成 rpk（在 AIoT IDE 中操作）
# 2. 启动 OpenVela 模拟器
./emulator.sh cmake_out/vela_goldfish-arm64-v8a-ap/

# 3. 推送应用
unzip posture-guard.release.1.0.0.rpk -d posture-guard
adb -s emulator-5554 push posture-guard /data/app/com.openvela.posture.guard

# 4. 启动应用
vapp hap://app/com.openvela.posture.guard
```

## 五、技术实现

### 体态识别算法

基于加速度计三轴数据的规则引擎：
- **久坐检测**：加速度方差 < 0.01 且持续 > 30分钟
- **低头前倾**：z轴重力分量在 -0.5 到 -0.95 之间
- **跷二郎腿**：x轴偏移 > 0.25 且 y轴有周期性振荡

### 隐私脱敏策略

| 数据类型 | 脱敏方式 |
|----------|----------|
| 心率 | 降采样到5分钟粒度，保留区间特征 |
| 步数 | 聚合为小时粒度 |
| 加速度 | 仅保留统计特征向量 |
| 压力 | 降采样到10分钟粒度 |

### 加密分级

| 级别 | 数据类型 | 加密方式 |
|------|----------|----------|
| L1 | 体态统计计数 | 无加密 |
| L2 | 体态异常记录 | AES-ECB |
| L3 | 心率/压力原始数据 | AES-CBC |

## 六、AI Coding 使用说明

本项目使用 Claude Code 辅助开发：
- **需求分析**：将中文需求文档转化为技术架构设计
- **代码生成**：根据架构设计自动生成所有模块代码
- **API 验证**：查阅 OpenVela 文档确认可用 API
- **UI 设计**：生成适配圆形表盘的 Flex 布局

完整对话日志见 `logs/` 目录。
