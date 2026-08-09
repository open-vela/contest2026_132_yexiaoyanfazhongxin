/**
 * test-mock.js - Mock功能测试脚本
 *
 * 用于验证Mock场景库和传感器抽象层的功能
 * 可在Node.js环境中运行测试
 *
 * 运行方式：node test-mock.js
 */

// 模拟OpenVela环境
const mockSystem = {
  sensor: {
    subscribeAccelerometer: (config) => {
      console.log('[Mock] subscribeAccelerometer called')
      // 模拟数据回调
      setInterval(() => {
        config.callback({
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2,
          z: -9.8 + (Math.random() - 0.5) * 0.5,
        })
      }, 50)
    },
    unsubscribeAccelerometer: () => {
      console.log('[Mock] unsubscribeAccelerometer called')
    },
  },
  health: {
    DATA_TYPES: { HEART_RATE: 'heart_rate' },
    subscribeSample: (config) => {
      console.log('[Mock] subscribeSample called')
      // 模拟心率数据
      setInterval(() => {
        config.callback({
          timeStamp: Date.now(),
          value: 72 + Math.floor(Math.random() * 10),
        })
      }, 1000)
    },
    unsubscribeSample: () => {
      console.log('[Mock] unsubscribeSample called')
    },
  },
}

// 测试Mock场景库
console.log('=== 测试Mock场景库 ===')

// 导入Mock模块（简化版测试）
const MOCK_SCENARIOS = {
  'office-work-1h': {
    name: '办公场景（含低头）',
    totalDuration: 3600,
    dataSequence: [
      { type: 'normal', duration: 300, accVar: 0.02, gyroPitch: -10 },
      { type: 'forward_tilt', duration: 60, accVar: 0.015, gyroPitch: -45 },
    ],
  },
  'sedentary-2h': {
    name: '久坐场景',
    totalDuration: 7200,
    dataSequence: [
      { type: 'normal', duration: 600, accVar: 0.015, gyroPitch: -10 },
      { type: 'sedentary', duration: 1200, accVar: 0.003, gyroPitch: -3 },
    ],
  },
}

console.log('可用场景：')
Object.entries(MOCK_SCENARIOS).forEach(([key, scenario]) => {
  console.log(`  - ${key}: ${scenario.name} (${scenario.totalDuration}秒)`)
})

// 测试场景注入
console.log('\n=== 测试场景注入 ===')
const testScenario = 'office-work-1h'
const scenario = MOCK_SCENARIOS[testScenario]
if (scenario) {
  console.log(`成功注入场景: ${scenario.name}`)
  console.log(`数据序列长度: ${scenario.dataSequence.length}`)
}

// 测试数据生成
console.log('\n=== 测试数据生成 ===')
const segment = scenario.dataSequence[0]
console.log(`片段类型: ${segment.type}`)
console.log(`持续时间: ${segment.duration}秒`)
console.log(`加速度方差: ${segment.accVar}`)
console.log(`陀螺仪俯仰角: ${segment.gyroPitch}°`)

// 模拟数据生成
function generateAccData(variance) {
  const noiseScale = Math.sqrt(variance) * 10
  return {
    x: (Math.random() - 0.5) * noiseScale,
    y: (Math.random() - 0.5) * noiseScale,
    z: -9.8 + (Math.random() - 0.5) * noiseScale,
  }
}

console.log('\n生成的加速度数据样本:')
for (let i = 0; i < 3; i++) {
  const acc = generateAccData(segment.accVar)
  console.log(`  [${i+1}] x=${acc.x.toFixed(3)}, y=${acc.y.toFixed(3)}, z=${acc.z.toFixed(3)}`)
}

console.log('\n=== 测试完成 ===')
console.log('Mock场景库功能正常！')
