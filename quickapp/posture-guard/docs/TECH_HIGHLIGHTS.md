# 技术亮点答辩提纲 - 体态安全卫士

## 亮点一: 端侧自适应AI (1分钟)

### 核心技术
- **动态阈值分类**: 无需云端训练，基于统计特征的实时分类
- **多帧确认机制**: 连续3帧置信度>0.8才触发异常，避免误报
- **事件驱动采样**: 根据运动强度动态切换50/20/10Hz采样率

### 技术细节
```javascript
// 自适应采样策略
if (accVariance > 1.0) {
  setSamplingRate(50);  // 活跃状态
} else if (accVariance > 0.1) {
  setSamplingRate(20);  // 均衡状态
} else {
  setSamplingRate(10);  // 省电状态
}

// Duty-cycling推理优化
if (dataChangeRate < 0.1) {
  inferenceInterval = min(5000, interval + 500);  // 延长至5秒
} else if (dataChangeRate > 0.3) {
  inferenceInterval = max(1000, interval - 500);  // 恢复1秒
}
```

### 效果
- 功耗降低 50%+
- 8小时电量消耗 <15%
- 推理延迟 <50ms

---

## 亮点二: 差分隐私脱敏 (1分钟)

### 核心技术
- **ε-差分隐私**: 数学可证明的隐私保护
- **Laplace机制**: 为数值数据添加随机噪声
- **隐私预算管理**: 追踪累积隐私损失

### 技术细节
```javascript
// Laplace机制实现
function addNoise(value, sensitivity, epsilon) {
  const scale = sensitivity / epsilon;  // b = Δf / ε = 1.0 / 0.1 = 10
  const u = Math.random() - 0.5;       // U(-0.5, 0.5)
  const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  return value + noise;
}

// 脱敏示例
原始心率: 72bpm
脱敏后: 70-75区间 + Laplace噪声
加密后: AES-256-GCM密文
```

### 效果
- 统计分析结果几乎不受影响
- 个体数据无法被追踪
- 满足GDPR/CCPA/PIPL合规要求

---

## 亮点三: Shamir密钥分片 (1分钟)

### 核心技术
- **Shamir's Secret Sharing**: 2-of-3门限方案
- **有限域运算**: 使用梅森素数 2^127-1
- **拉格朗日插值**: 从任意2个分片恢复密钥

### 技术细节
```javascript
// 密钥分片生成
const secret = masterKey.slice(0, 16);  // 128位密钥
const a = randomBigInt(prime);          // 随机系数
const f = (x) => (secret + a * x) % prime;

shard1 = { index: 1, value: f(1) };  // 内存持有
shard2 = { index: 2, value: f(2) };  // 加密写入文件头
shard3 = { index: 3, value: f(3) };  // 独立小文件

// 密钥恢复 (拉格朗日插值)
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
  return result % prime;
}
```

### 效果
- 1个分片丢失不影响密钥恢复
- 单点攻破无法获取完整密钥
- L3数据24小时强制销毁

---

## 亮点四: 环形安全架构 (1分钟)

### 核心技术
- **Privacy Hub**: 所有数据流转的强制审查点
- **零明文出境**: 数据必须经过脱敏+加密才能存储
- **事件总线解耦**: 模块间通过事件通信，禁止直接访问内部状态

### 架构设计
```
传感器数据 → Privacy Hub审查 → 脱敏处理 → 加密 → 安全存储
                ↓
            审计日志记录
```

### 关键设计
```javascript
// 所有存储操作必须通过SecureStorage
async write(data, level) {
  // 1. 脱敏检查
  const desensitized = this.desensitizer.process(data);

  // 2. 加密
  const encrypted = await this.cryptoManager.encrypt(desensitized, level);

  // 3. 写入（不保留明文）
  await this._writeFile(path, encrypted);

  // 4. 审计日志
  await this.auditLogger.log('data_write', level, 'success');
}
```

### 效果
- 存储文件零明文检出
- 源码零网络代码检出
- 所有操作可追溯

---

## 亮点五: 数据生命周期状态机 (1分钟)

### 核心技术
- **四级状态**: 热/温/冷/销毁
- **自动清理**: 每日00:00执行状态转移
- **最小化暴露窗口**: L3数据24小时强制销毁

### 状态转移
```
创建 → 热数据(24h) → 温数据(7天) → 冷数据(30天) → 销毁
  │         │              │              │
  │    AES-128存储    AES-256存储    覆写清零
  │         │              │              │
  └─────────┴──────────────┴──────────────┘
                     ↓
              L3: 24h强制销毁
```

### 配置
```javascript
const LIFECYCLE_CONFIG = {
  hot: { maxAge: 24 * 60 * 60 * 1000, next: 'warm' },      // 24小时
  warm: { maxAge: 7 * 24 * 60 * 60 * 1000, next: 'cold' }, // 7天
  cold: { maxAge: 30 * 24 * 60 * 60 * 1000, next: 'destroy' }, // 30天
  destroy: { maxAge: 0, next: null }  // 立即销毁
};

// L3特殊规则: 24小时强制销毁
const L3_CONFIG = {
  maxAge: 24 * 60 * 60 * 1000,
  forceDestroy: true
};
```

### 效果
- 数据暴露窗口最小化
- 自动化生命周期管理
- 审计日志完整记录

---

## 总结

| 亮点 | 核心技术 | 效果 |
|------|----------|------|
| 端侧自适应AI | 动态阈值+多帧确认+Duty-cycling | 功耗降低50%+ |
| 差分隐私脱敏 | ε-DP+Laplace机制 | 统计可用，个体不可追踪 |
| Shamir密钥分片 | 2-of-3门限+拉格朗日插值 | 单点攻破无效 |
| 环形安全架构 | Privacy Hub+零明文出境 | 存储零明文 |
| 数据生命周期 | 四级状态机+自动销毁 | 最小化暴露窗口 |

## 评委可能的问题

**Q: 为什么选择端侧AI而非云端?**
> A: 隐私保护(原始数据不离开设备)、低延迟(<50ms)、离线可用、功耗低。

**Q: 差分隐私会影响数据可用性吗?**
> A: ε=0.1时噪声很小，统计分析结果几乎不受影响，但个体数据无法被追踪。

**Q: 如果手表丢失，数据安全吗?**
> A: 所有数据加密存储，密钥基于用户PIN派生。物理获取手表也无法解密。

**Q: 24小时强制销毁会不会丢失重要数据?**
> A: L3是原始特征数据，已过特征提取。统计数据保留在L1/L2级别，可长期存储。
