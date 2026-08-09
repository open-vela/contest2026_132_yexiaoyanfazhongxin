# 安全白皮书 - 体态安全卫士

## 1. 威胁模型

### 1.1 资产识别

| 资产 | 敏感级别 | 保护需求 |
|------|----------|----------|
| 原始传感器数据 | 高 | 脱敏+加密 |
| 心率数据 | 高 | 区间化+加密 |
| 运动坐标 | 中 | DP噪声+加密 |
| 体态识别结果 | 低 | 聚合统计 |
| 用户配置 | 低 | L1加密 |

### 1.2 威胁分析

| 威胁 | 攻击向量 | 影响 | 防护措施 |
|------|----------|------|----------|
| 数据泄露 | 物理接触设备 | 隐私侵犯 | 全量加密 |
| 明文存储 | 存储介质被读取 | 信息泄露 | 强制加密 |
| 密钥窃取 | 内存/文件读取 | 数据解密 | Shamir分片 |
| 未授权访问 | 应用沙箱逃逸 | 数据滥用 | 权限最小化 |
| 网络传输 | 中间人攻击 | 数据截获 | 禁止网络请求 |

## 2. 安全设计原则

### 2.1 隐私优先 (Privacy by Design)

- **数据最小化**: 仅采集必要的传感器数据
- **目的限制**: 数据仅用于体态识别，不用于其他用途
- **存储限制**: 自动销毁过期数据
- **默认保护**: 所有数据默认加密存储

### 2.2 纵深防御 (Defense in Depth)

```
第一层: 传感器数据脱敏 (Desensitizer)
第二层: 差分隐私噪声注入 (DifferentialPrivacy)
第三层: AES-GCM加密存储 (CryptoManager)
第四层: 密钥分片保护 (KeyDerivation)
第五层: 生命周期自动销毁 (LifecycleManager)
第六层: 审计日志追溯 (AuditLogger)
```

### 2.3 零信任架构

- 所有数据流转必须经过Privacy Hub审查
- 禁止模块间直接访问内部状态
- 所有I/O操作必须通过SecureStorage封装

## 3. 加密方案

### 3.1 密钥派生

```
主密钥 = PBKDF2-HMAC-SHA256(
  key = deviceId + ":" + userPin,
  salt = random_salt,
  iterations = 10000
)
```

### 3.2 分级密钥

| 级别 | 派生方式 | 用途 |
|------|----------|------|
| L1 | HKDF(主密钥, "posture-guard-l1") | 统计数据加密 |
| L2 | HKDF(主密钥, "posture-guard-l2") | 生理数据加密 |
| L3 | Shamir分片恢复 | 原始特征加密 |

### 3.3 Shamir秘密共享

**参数**:
- 有限域: p = 2^127 - 1 (梅森素数)
- 门限: 2-of-3
- 多项式: f(x) = secret + a*x (mod p)

**分片生成**:
```javascript
const secret = masterKey.slice(0, 16);
const a = randomBigInt(p);
const f = (x) => (secret + a * x) % p;

shard1 = { index: 1, value: f(1) };
shard2 = { index: 2, value: f(2) };
shard3 = { index: 3, value: f(3) };
```

**密钥恢复** (拉格朗日插值):
```javascript
function reconstruct(shards) {
  let result = 0;
  for (let i = 0; i < shards.length; i++) {
    let lagrange = 1;
    for (let j = 0; j < shards.length; j++) {
      if (i === j) continue;
      lagrange *= (0 - shards[j].index) / (shards[i].index - shards[j].index);
    }
    result += shards[i].value * lagrange;
  }
  return result % p;
}
```

### 3.4 AES-GCM加密

**参数**:
- L1: AES-128-GCM (128位密钥)
- L2/L3: AES-256-GCM (256位密钥)
- IV: 96位随机数
- Auth Tag: 128位

**输出格式**:
```json
{
  "iv": "base64编码的12字节IV",
  "ciphertext": "base64编码的密文",
  "authTag": "base64编码的16字节认证标签",
  "level": 1
}
```

## 4. 差分隐私

### 4.1 数学定义

**定义**: 一个随机化算法 M 满足 (ε,δ)-差分隐私，如果对于任意相邻数据集 D, D' 和任意输出集合 S:

```
Pr[M(D) ∈ S] ≤ e^ε × Pr[M(D') ∈ S] + δ
```

### 4.2 Laplace机制

**实现**:
```javascript
function addNoise(value, sensitivity, epsilon) {
  const scale = sensitivity / epsilon;  // b = Δf / ε
  const u = Math.random() - 0.5;       // U(-0.5, 0.5)
  const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  return value + noise;
}
```

**参数选择**:
- ε = 0.1 (隐私预算)
- sensitivity = 1.0 (全局敏感度)
- scale = 10 (Laplace分布尺度)

### 4.3 隐私保证

| 查询类型 | 隐私损失 | 说明 |
|----------|----------|------|
| 单次查询 | ε = 0.1 | 满足ε-DP |
| k次序列 | k×ε | 基本组合定理 |
| 高级组合 | ε√(2k ln(1/δ)) | 更紧的界 |

## 5. 审计日志

### 5.1 日志格式

```json
{
  "timestamp": 1700000000000,
  "eventType": "data_write|encrypt|decrypt|destroy",
  "dataLevel": "l1|l2|l3|system",
  "result": "success|failure",
  "details": { ... }
}
```

### 5.2 防篡改机制

- **哈希链**: 每日文件SHA-256哈希存储在次日文件头部
- **加密存储**: 审计日志本身AES-256-GCM加密
- **只追加**: 禁止修改历史日志

### 5.3 日志查询

```javascript
// 查询最近7天日志
const logs = await auditLogger.queryLogs(
  Date.now() - 7 * 24 * 60 * 60 * 1000,
  Date.now()
);
```

## 6. 安全验证

### 6.1 自动化检测

| 检测项 | 方法 | 通过标准 |
|--------|------|----------|
| 明文敏感字段 | 正则匹配 | 零检出 |
| 硬编码密钥 | 源码扫描 | 零检出 |
| 网络请求代码 | AST分析 | 零检出 |
| 存储文件加密 | 格式检查 | 100%加密 |

### 6.2 手动验证

- [ ] 圆形表盘布局无裁剪
- [ ] 方形表盘布局正常
- [ ] 隐私中心加密对比展示清晰
- [ ] 审计日志时间线正确
- [ ] 设置页采样策略生效

## 7. 合规性

### 7.1 数据保护法规

- **GDPR**: 数据最小化、目的限制、存储限制
- **CCPA**: 用户知情权、删除权
- **PIPL**: 同意原则、最小必要

### 7.2 安全标准

- **OWASP Mobile Top 10**: 不安全存储、不安全通信
- **NIST SP 800-175B**: 密码学标准
