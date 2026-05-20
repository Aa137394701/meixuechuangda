/**
 * 视觉维度美学工具函数
 * 定义色彩属性与美学参数的映射关系
 */

const WUXING_AESTHETICS = {
  metal: {
    name: '金',
    dimension: '质感平衡',
    english: 'Crisp/Polished',
    description: '强调剪裁的利落感和配饰的冷感',
    icon: '⚪',
    color: '#E8E8E8',  // 改为白色系
    keywords: ['利落', '精致', '秩序', '冷感', '结构']
  },
  wood: {
    name: '木',
    dimension: '生机比例',
    english: 'Growth/Organic',
    description: '强调天然面料和纵向拉伸的视觉比例',
    icon: '🟢',
    color: '#4CD964',
    keywords: ['自然', '生长', '纵向', '棉麻', '透气']
  },
  water: {
    name: '水',
    dimension: '柔和流动',
    english: 'Fluid/Soft',
    description: '强调面料的垂坠感、不规则剪裁和波浪线条',
    icon: '⚫',
    color: '#007AFF',
    keywords: ['流动', '垂坠', '柔和', '波浪', '灵动']
  },
  fire: {
    name: '火',
    dimension: '明亮能量',
    english: 'Luminosity/Vivid',
    description: '强调色彩的饱和度、视觉重心和光泽感面料',
    icon: '🔴',
    color: '#FF3B30',
    keywords: ['饱和', '光泽', '热情', '张扬', '能量']
  },
  earth: {
    name: '土',
    dimension: '沉稳底蕴',
    english: 'Grounded/Solid',
    description: '强调廓形的稳重感、大地色系的层次和厚实的质感',
    icon: '🟡',
    color: '#FFCC00',
    keywords: ['稳重', '厚实', '大地色', '层次', '包容']
  }
}

/**
 * 根据缺失色彩属性生成视觉维度能量值分布
 * @param {string} missingWuxing - 需要补充的色彩属性
 * @returns {Object} 视觉维度能量值分布 {metal, wood, water, fire, earth}
 */
function generateEnergyValues(missingWuxing) {
  // 基础能量值
  const baseValues = {
    metal: 70,
    wood: 70,
    water: 70,
    fire: 70,
    earth: 70
  }

  // 需要补充的色彩属性视觉能量较低
  if (missingWuxing && WUXING_AESTHETICS[missingWuxing]) {
    baseValues[missingWuxing] = 40 // 缺失属性视觉能量较低
    
    // 根据色彩互补关系调整其他属性
    const generatingCycle = {
      water: 'wood',    // 水木互补
      wood: 'fire',     // 木火互补
      fire: 'earth',    // 火土互补
      earth: 'metal',   // 土金互补
      metal: 'water'    // 金水互补
    }
    
    const controlledCycle = {
      metal: 'wood',    // 金克木
      wood: 'earth',    // 木克土
      earth: 'water',   // 土克水
      water: 'fire',    // 水克火
      fire: 'metal'     // 火克金
    }
    
    // 被生的属性也较弱
    if (generatingCycle[missingWuxing]) {
      baseValues[generatingCycle[missingWuxing]] = 55
    }
    
    // 相克的属性较强
    if (controlledCycle[missingWuxing]) {
      baseValues[controlledCycle[missingWuxing]] = 85
    }
  }

  return baseValues
}

/**
 * 生成视觉维度美学总结文案
 * @param {Object} energyValues - 视觉维度能量值分布
 * @param {string} missingWuxing - 需要补充的色彩属性
 * @returns {string} 总结文案
 */
function generateAestheticsSummary(energyValues, missingWuxing) {
  if (!missingWuxing || !WUXING_AESTHETICS[missingWuxing]) {
    return '今日美学能量平衡，展现自然和谐之美。'
  }

  const wuxing = WUXING_AESTHETICS[missingWuxing]
  const dimension = wuxing.dimension
  
  // 找出能量最强的属性
  let maxElement = 'metal'
  let maxValue = 0
  Object.keys(energyValues).forEach(key => {
    if (energyValues[key] > maxValue) {
      maxValue = energyValues[key]
      maxElement = key
    }
  })

  const maxWuxing = WUXING_AESTHETICS[maxElement]
  
  return `今日审美建议：增强'${wuxing.name}'的${dimension.toLowerCase()}以平衡'${maxWuxing.name}'的${maxWuxing.dimension.toLowerCase()}感。`
}

/**
 * 获取色彩属性对应的色彩建议
 * @param {string} wuxing - 色彩属性
 * @returns {string[]} 推荐色值
 */
function getWuxingColors(wuxing) {
  const colorMap = {
    metal: ['#FFFFFF', '#E8E8E8', '#C0C0C0', '#F5F5F5'],
    wood: ['#2E7D32', '#4CAF50', '#81C784', '#A5D6A7'],
    water: ['#1976D2', '#2196F3', '#64B5F6', '#90CAF9'],
    fire: ['#E53935', '#FF5722', '#FF8A65', '#FFCCBC'],
    earth: ['#8D6E63', '#A1887F', '#D7CCC8', '#EFEBE9']
  }
  
  return colorMap[wuxing] || colorMap.water
}

module.exports = {
  WUXING_AESTHETICS,
  generateEnergyValues,
  generateAestheticsSummary,
  getWuxingColors
}
