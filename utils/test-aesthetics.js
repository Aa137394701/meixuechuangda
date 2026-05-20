const aestheticsUtils = require('../../utils/aesthetics.js')

// 测试能量值生成
console.log('=== 测试五行美学维度工具 ===')

// 测试 1: 生成缺失金属的能量值
const metalValues = aestheticsUtils.generateEnergyValues('metal')
console.log('缺失金的能量分布:', metalValues)

// 测试 2: 生成缺失木的能量值
const woodValues = aestheticsUtils.generateEnergyValues('wood')
console.log('缺失木的能量分布:', woodValues)

// 测试 3: 生成美学总结
const summary = aestheticsUtils.generateAestheticsSummary(metalValues, 'metal')
console.log('美学总结:', summary)

// 测试 4: 获取五行颜色
const colors = aestheticsUtils.getWuxingColors('metal')
console.log('金属性颜色:', colors)

// 测试 5: 获取五行属性信息
const metalInfo = aestheticsUtils.WUXING_AESTHETICS.metal
console.log('金属性信息:', metalInfo)

console.log('=== 测试完成 ===')
