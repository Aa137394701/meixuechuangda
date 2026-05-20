/**
 * 色彩互补关系：木火互补，火土互补，土金互补，金水互补，水木互补
 * 色彩对比关系：木土对比，土水对比，水火对比，火金对比，金木对比
 * 
 * 配色原则：
 * - 首选色系：根据用户色彩属性需求 + 今日色彩属性，生成最佳配色方案（3 种颜色组合）
 * - 次选色系：与首选色系相协调的色彩
 * - 点缀色系：色彩对比关系的配色方案（用于配饰点缀，增加层次感）
 * 
 * 每个色系都包含 3 种颜色：主色 + 辅色 + 点缀色
 */

// 色彩互补顺序
const GENERATING_CYCLE = {
  wood: 'fire',    // 木火互补
  fire: 'earth',   // 火土互补
  earth: 'metal',  // 土金互补
  metal: 'water',  // 金水互补
  water: 'wood'    // 水木互补
}

// 色彩对比顺序
const CONTROLLING_CYCLE = {
  wood: 'earth',   // 木土对比
  earth: 'water',  // 土水对比
  water: 'fire',   // 水火对比
  fire: 'metal',   // 火金对比
  metal: 'wood'    // 金木对比
}

// 色彩属性基础颜色库
const WUXING_COLORS = {
  wood: { hex: '#4CAF50', name: '生机绿', category: '绿色系' },
  fire: { hex: '#FF6B6B', name: '珊瑚红', category: '红色系' },
  earth: { hex: '#D4A574', name: '大地黄', category: '黄色系' },
  metal: { hex: '#E8E8E8', name: '纯净白', category: '白色系' },
  water: { hex: '#4A90E2', name: '深海蓝', category: '蓝色系' }
}

/**
 * 生成配色方案（包含主色、辅色、点缀色）
 * @param {string} missingWuxing - 需要补充的色彩属性
 * @returns {Object} 包含三个色系的配色方案
 */
function generateColorPalette(missingWuxing) {
  // 首选色系：补充需要补充的色彩属性 + 互补色彩 + 平衡色彩
  const primaryMain = WUXING_COLORS[missingWuxing]
  const generatingElement = GENERATING_CYCLE[missingWuxing]
  const primarySecondary = WUXING_COLORS[generatingElement]
  const controllingElement = CONTROLLING_CYCLE[missingWuxing]
  const primaryAccent = WUXING_COLORS[controllingElement]
  
  const primary = {
    colors: [primaryMain, primarySecondary, primaryAccent],
    description: `以${primaryMain.category}为主调，搭配${primarySecondary.category}和${primaryAccent.category}，形成视觉平衡的和谐美感`
  }
  
  // 次选色系：互补关系的配色
  const secondaryMain = WUXING_COLORS[generatingElement]
  const nextElement = GENERATING_CYCLE[generatingElement]
  const secondarySecondary = WUXING_COLORS[nextElement]
  const secondaryAccent = primaryMain // 回到主色彩属性
  
  const secondary = {
    colors: [secondaryMain, secondarySecondary, secondaryAccent],
    description: `以${secondaryMain.category}为主调，温和协调${missingWuxing}属性，效果温和持久`
  }
  
  // 点缀色系：色彩对比关系的配色（用于配饰）
  const controlledElement = CONTROLLING_CYCLE[missingWuxing]
  const accentMain = WUXING_COLORS[controlledElement]
  const accentGenerating = GENERATING_CYCLE[controlledElement]
  const accentSecondary = WUXING_COLORS[accentGenerating]
  const accentAccent = WUXING_COLORS[missingWuxing] // 回到主色彩属性作为点缀
  
  const accent = {
    colors: [accentMain, accentSecondary, accentAccent],
    description: `以${accentMain.category}为点缀，通过色彩对比丰富视觉层次，适合配饰小物`
  }
  
  return {
    primary,    // 首选色系
    secondary,  // 次选色系
    accent      // 点缀色系
  }
}

module.exports = {
  generateColorPalette,
  WUXING_COLORS,
  GENERATING_CYCLE,
  CONTROLLING_CYCLE
}
