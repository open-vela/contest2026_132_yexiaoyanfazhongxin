/**
 * 差分隐私噪声注入模块
 *
 * 实现 Laplace 机制，为数值型敏感数据添加随机噪声，
 * 保证在 ε-差分隐私保护下的数据可用性。
 *
 * 数学原理：
 * - Laplace 分布：Lap(b) 的 PDF 为 f(x) = (1/2b) * exp(-|x|/b)
 * - 其中 b = sensitivity / epsilon
 * - 对于任意相邻数据集 D, D'，输出 M(D) 和 M(D') 的比值 ≤ e^ε
 *
 * @module privacy/differential-privacy
 */

/**
 * Laplace 机制差分隐私实现
 */
export class DifferentialPrivacy {
  /**
   * 为数值添加 Laplace 噪声
   *
   * @param {number} value - 原始数值
   * @param {number} sensitivity - 全局敏感度 Δf（查询函数的最大变化量）
   * @param {number} epsilon - 隐私预算 ε，越小隐私保护越强
   * @returns {number} 添加噪声后的值
   */
  static addNoise(value, sensitivity, epsilon) {
    if (typeof value !== 'number' || isNaN(value)) {
      return value
    }
    if (sensitivity <= 0 || epsilon <= 0) {
      throw new Error('sensitivity and epsilon must be positive')
    }

    const scale = sensitivity / epsilon
    const noise = DifferentialPrivacy._laplaceSample(scale)
    return value + noise
  }

  /**
   * 批量为多个值添加噪声（使用相同的隐私预算分配）
   *
   * @param {number[]} values - 原始数值数组
   * @param {number} sensitivity - 全局敏感度
   * @param {number} epsilon - 总隐私预算
   * @returns {number[]} 添加噪声后的值数组
   */
  static addNoiseBatch(values, sensitivity, epsilon) {
    if (!Array.isArray(values)) return values
    // 隐私预算均分（序列组合性）
    const perQueryEpsilon = epsilon / values.length
    return values.map(v => DifferentialPrivacy.addNoise(v, sensitivity, perQueryEpsilon))
  }

  /**
   * 校准 epsilon 以满足 (ε, δ)-近似差分隐私
   *
   * @param {number} delta - 近似参数 δ（通常取 1e-5 或更小）
   * @param {number} sensitivity - 全局敏感度
   * @param {number} targetVariance - 目标方差
   * @returns {number} 推荐的 epsilon 值
   */
  static calibrateNoise(delta, sensitivity, targetVariance) {
    // 对于 Laplace 机制：Var = 2 * (sensitivity/epsilon)^2
    // 解 epsilon = sensitivity * sqrt(2 / targetVariance)
    if (targetVariance <= 0) {
      throw new Error('targetVariance must be positive')
    }
    return sensitivity * Math.sqrt(2 / targetVariance)
  }

  /**
   * 生成符合 Laplace 分布的随机样本
   * 使用逆变换采样法：X = -b * sgn(U) * ln(1 - 2|U|)
   * 其中 U ~ Uniform(-0.5, 0.5)
   *
   * @param {number} scale - 尺度参数 b = sensitivity / epsilon
   * @returns {number} Laplace 分布随机样本
   * @private
   */
  static _laplaceSample(scale) {
    // 生成 (-0.5, 0.5) 范围内的均匀分布随机数
    const u = Math.random() - 0.5
    // 逆变换采样
    return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u))
  }

  /**
   * 评估隐私损失（用于隐私预算追踪）
   *
   * @param {number} epsilon - 已使用的隐私预算
   * @param {number} numQueries - 查询次数
   * @returns {number} 累积隐私损失
   */
  static cumulativePrivacyLoss(epsilon, numQueries) {
    // 基本组合定理：k 次 ε-DP 查询的总隐私损失为 k*ε
    return epsilon * numQueries
  }

  /**
   * 高级组合定理（更紧的界）
   *
   * @param {number} epsilon - 单次隐私预算
   * @param {number} numQueries - 查询次数
   * @param {number} delta - 近似参数
   * @returns {number} 更紧的隐私损失界
   */
  static advancedComposition(epsilon, numQueries, delta = 1e-5) {
    const k = numQueries
    const ep2 = epsilon * epsilon
    // 定理：k 次 (ε,δ)-DP 的组合为 (ε', kδ + δ')
    // ε' = ε * sqrt(2k * ln(1/δ')) + k * ε * (e^ε - 1)
    const deltaPrime = delta / 2
    const term1 = epsilon * Math.sqrt(2 * k * Math.log(1 / deltaPrime))
    const term2 = k * epsilon * (Math.exp(epsilon) - 1)
    return term1 + term2
  }
}

export default DifferentialPrivacy
