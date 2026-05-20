const cloud = require('wx-server-sdk')
const axios = require('axios')
const wuxingUtils = require('./wuxing')
const colorPalette = require('./color-palette')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 视觉维度美学工具函数（云函数内联版本）
const WUXING_AESTHETICS = {
  metal: { name: '金', dimension: '质感平衡', color: '#E8E8E8' },
  wood: { name: '木', dimension: '生机比例', color: '#4CD964' },
  water: { name: '水', dimension: '柔和流动', color: '#007AFF' },
  fire: { name: '火', dimension: '明亮能量', color: '#FF3B30' },
  earth: { name: '土', dimension: '沉稳底蕴', color: '#FFCC00' }
}

function generateAestheticsSummary(energyValues, missingWuxing) {
  if (!missingWuxing || !WUXING_AESTHETICS[missingWuxing]) {
    return '今日美学能量平衡，展现自然和谐之美。'
  }
  
  const wuxing = WUXING_AESTHETICS[missingWuxing]
  const dimension = wuxing.dimension
  
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

// DeepSeek API 配置
const DEEPSEEK_API_KEY = 'sk-14d04dec05d74f4e84b936c31c596d53' // DeepSeek API 密钥
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

// 色彩属性对应的色彩和风格描述
const WUXING_STYLE_MAP = {
  metal: {
    color: '#FFFFFF',
    style: '简约利落',
    fabric: '挺括有型',
    description: '金属性代表纯净与精致'
  },
  wood: {
    color: '#4CAF50',
    style: '自然清新',
    fabric: '柔软透气',
    description: '木属性象征生机与活力'
  },
  water: {
    color: '#2196F3',
    style: '流动优雅',
    fabric: '垂顺丝滑',
    description: '水属性寓意灵动与智慧'
  },
  fire: {
    color: '#FF5722',
    style: '热情张扬',
    fabric: '轻盈有光泽',
    description: '火属性展现活力与自信'
  },
  earth: {
    color: '#A1887F',
    style: '沉稳大气',
    fabric: '厚实温暖',
    description: '土属性传递踏实与包容'
  }
}

// 敏感词过滤列表
const SENSITIVE_WORDS = [
  '算命', '占卜', '运气', '灾祸', '吉凶', '八字', '风水', '命理',
  '桃花运', '破财', '血光', '灾难', '保佑', '辟邪', '迷信', '命运',
  '转运', '旺财', '旺夫', '克星', '煞气', '化解', '开运', '招财'
]

/**
 * 内容安全检查
 * @param {string} text - 待检测文本
 * @returns {Promise<boolean>} 是否通过检测
 */
async function checkContentSecurity(text) {
  try {
    const result = await cloud.openapi.security.msgSecCheck({
      content: text
    })
    
    return result.errCode === 0
  } catch (error) {
    console.error('内容安全检测失败:', error)
    
    // 如果云检测失败，使用本地敏感词过滤
    return !SENSITIVE_WORDS.some(word => text.includes(word))
  }
}

/**
 * 清理敏感内容
 * @param {string} text - 待清理文本
 * @returns {string} 清理后的文本
 */
function cleanSensitiveContent(text) {
  let cleanedText = text
  
  SENSITIVE_WORDS.forEach(word => {
    const regex = new RegExp(word, 'g')
    cleanedText = cleanedText.replace(regex, '')
  })
  
  return cleanedText
}

/**
 * 生成色彩美学解析
 * @param {string} missingWuxing - 需要补充的色彩属性
 * @param {string} wuxingName - 色彩属性名称
 * @param {object} energyValues - 视觉维度能量值
 * @param {string} birthday - 用户生日
 * @returns {Promise<string>} 解析文案
 */
async function generateWuxingAnalysis(missingWuxing, wuxingName, energyValues, birthday) {
  // 找出能量值最低和最高的属性
  let weakestElement = 'metal'
  let weakestValue = 100
  let strongestElement = 'metal'
  let strongestValue = 0
  
  Object.keys(energyValues).forEach(key => {
    if (energyValues[key] < weakestValue) {
      weakestValue = energyValues[key]
      weakestElement = key
    }
    if (energyValues[key] > strongestValue) {
      strongestValue = energyValues[key]
      strongestElement = key
    }
  })
  
  const WUXING_NAMES = {
    metal: '金',
    wood: '木',
    water: '水',
    fire: '火',
    earth: '土'
  }
  
  const WUXING_COLORS = {
    metal: '白色系、银白色',
    wood: '绿色系、青色',
    water: '黑色系、蓝色',
    fire: '红色系、粉色',
    earth: '黄色系、棕色'
  }
  
  const weakestName = WUXING_NAMES[weakestElement]
  const strongestName = WUXING_NAMES[strongestElement]
  const weakestColors = WUXING_COLORS[weakestElement]
  const strongestColors = WUXING_COLORS[strongestElement]
  
  const prompt = `你是一位精通传统色彩美学和视觉平衡理论的专家。请根据以下信息生成穿搭色彩解析：

用户信息：
- 出生日期：${birthday}
- 视觉维度分布：金属性${energyValues.metal}、木属性${energyValues.wood}、水属性${energyValues.water}、火属性${energyValues.fire}、土属性${energyValues.earth}
- 能量值最高属性（今日主导）：${strongestName}属性（${strongestValue}分）
- 能量值最低属性（需要增强）：${weakestName}属性（${weakestValue}分）

请从色彩心理学、视觉美学、传统美学角度解析：
1. 今日色彩特点（如${strongestName}属性较强，${weakestName}属性较弱）
2. 为什么首选色系是${strongestColors}（顺应今日主导能量）
3. 首选色系（${strongestColors}）的作用和象征意义
4. 次选色系的辅助作用
5. 不建议色系的原因（特别是${weakestColors}，因为${weakestName}属性已经太弱）
6. 对用户思维、情绪、气质的积极影响

重要要求：
- 使用"视觉维度"、"色彩美学"、"视觉平衡"、"色彩互补"等现代语境
- 严禁出现：算命、占卜、运气、风水、命理、吉凶、灾祸、桃花运、破财、五行生克、主导、克制、运势、决断力、命理、八字等词汇
- 强调色彩对心理、情绪、气质的影响
- 保持积极正向的表达
- 文案优美有文化底蕴，200-300 字
- 将"五行能量"改为"视觉维度能量"
- 将"生克关系"改为"色彩互补关系"
- 将"调和气场"改为"营造视觉和谐"
- **重要：描述色彩属性时，使用"金属性"、"木属性"、"水属性"、"火属性"、"土属性"，不要说"金色"、"木色"等具体颜色**
- **金属性对应白色系，描述时应该说"白色系"、"银白色"，而不是"金色"**
- **必须明确提到首选色系是${strongestColors}，不建议色系是${weakestColors}**

请直接返回解析文案，不需要 JSON 格式。`

  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一位传统文化与色彩美学专家，擅长用现代语言诠释五行色彩理论。你的解析聚焦于色彩心理学、美学平衡、气质提升，不涉及任何迷信内容。所有建议都从视觉美学、心理暗示、文化传承角度出发。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 600
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    let analysis = response.data.choices[0].message.content
    
    // 清理可能的 markdown 格式
    analysis = analysis.replace(/```[\s\S]*?```/g, '').trim()
    
    // 内容安全检查
    const isSafe = await checkContentSecurity(analysis)
    if (!isSafe) {
      console.warn('解析内容未通过安全检测，进行清理')
      analysis = cleanSensitiveContent(analysis)
    }
    
    return analysis
  } catch (error) {
    console.error('生成解析失败:', error.message)
    return `今日视觉维度分析：${wuxingName}属性为主导。根据色彩美学理论，建议选择与${wuxingName}相协调的色彩搭配，以${WUXING_STYLE_MAP[missingWuxing].color}为主色调，能够营造视觉上的和谐美感，提升整体气质与个人魅力。`
  }
}

/**
 * 基于五运六气理论，结合用户命局和当日五行，智能推荐颜色
 * @param {string} birthday - 用户生日
 * @param {string} currentDate - 今日日期
 * @param {string} missingWuxing - 用户需要补充的色彩属性
 * @returns {Promise<Object>} 颜色推荐结果
 */
async function generateColorRecommendationByWuxing(birthday, currentDate, missingWuxing) {
  const prompt = `你是一位精通传统历法和色彩美学的专家。请根据以下信息，分析用户命局与当日五行的关系，并推荐适合的颜色：

用户信息：
- 出生日期：${birthday}
- 今日日期：${currentDate}
- 需要补充的色彩属性：${missingWuxing}

请基于五运六气理论分析：
1. 用户的命局特点（基于生日的年月日干支）
2. 今日的色彩能量特点（基于今日干支历的年月日）
3. 用户命局与今日五行的关系（相生、相克、比和等）
4. 根据这种关系，推荐今日最适合的颜色

五行对应颜色：
- 金：白色、银色、杏色、乳白色
- 木：绿色、青色、翠色
- 水：黑色、蓝色、深灰色
- 火：红色、粉色、橙色、紫色
- 土：黄色、咖啡色、棕色、卡其色

五行相生关系：金生水、水生木、木生火、火生土、土生金
五行相克关系：金克木、木克土、土克水、水克火、火克金

请返回严格的 JSON 格式（不要任何其他文字）：
{
  "primary_color": "首选色系（如'wood'、'fire'、'earth'、'metal'、'water'）",
  "secondary_color": "次选色系",
  "normal_color": "一般色系",
  "not_recommended_color": "不建议色系",
  "strongly_not_recommended_color": "强烈不建议色系",
  "reason": "推荐理由（100字以内，解释为什么这样推荐）"
}

重要要求：
- 使用"视觉维度"、"色彩能量"、"美学属性"等现代语境
- 严禁出现：算命、占卜、运势、风水、命理、八字、吉凶、灾祸等词汇
- 这是色彩美学分析，不是命运预测
- 必须返回 5 个色系的推荐，每个都是五行之一（wood/fire/earth/metal/water）
- 只返回 JSON，不要任何其他文字`

  try {
    console.log('调用 DeepSeek API 分析五运六气...')
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一位传统历法与色彩美学专家，擅长用现代语言诠释传统智慧。你的分析聚焦于色彩心理学、美学平衡、气质提升，不涉及任何迷信内容。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const aiContent = response.data.choices[0].message.content
    console.log('AI 返回内容:', aiContent)
    
    // 解析 JSON
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const colorRecommendation = JSON.parse(jsonMatch[0])
        console.log('解析后的颜色推荐:', colorRecommendation)
        
        // 验证数据有效性
        if (colorRecommendation.primary_color && colorRecommendation.secondary_color) {
          console.log('✓ AI 颜色推荐成功')
          return colorRecommendation
        } else {
          console.log('✗ AI 返回的数据不完整')
        }
      } else {
        console.log('✗ AI 返回内容中没有找到 JSON')
      }
    } catch (parseError) {
      console.error('✗ JSON 解析失败:', parseError)
      console.log('原始内容:', aiContent)
    }
    
    // 如果 AI 分析失败，使用备用方案
    console.log('⚠ AI 分析失败，使用备用方案')
    return generateColorRecommendationFallback(missingWuxing)
    
  } catch (error) {
    console.error('✗ AI 颜色推荐异常:', error.message)
    // 返回备用方案
    return generateColorRecommendationFallback(missingWuxing)
  }
}

/**
 * 备用方案：基于用户缺失五行推荐颜色
 * @param {string} missingWuxing - 用户需要补充的色彩属性
 * @returns {Object} 颜色推荐结果
 */
function generateColorRecommendationFallback(missingWuxing) {
  const GENERATING_CYCLE = {
    wood: 'fire',
    fire: 'earth',
    earth: 'metal',
    metal: 'water',
    water: 'wood'
  }

  const CONTROLLING_CYCLE = {
    wood: 'earth',
    earth: 'water',
    water: 'fire',
    fire: 'metal',
    metal: 'wood'
  }

  // 找出克制 missingWuxing 的属性
  let controlledBy = ''
  for (let key in CONTROLLING_CYCLE) {
    if (CONTROLLING_CYCLE[key] === missingWuxing) {
      controlledBy = key
      break
    }
  }

  // 找出被 missingWuxing 克制的属性
  let controls = CONTROLLING_CYCLE[missingWuxing]

  return {
    primary_color: missingWuxing,
    secondary_color: GENERATING_CYCLE[missingWuxing],
    normal_color: controls,
    not_recommended_color: controlledBy,
    strongly_not_recommended_color: controlledBy,
    reason: '基于用户需要补充的色彩属性推荐'
  }
}

/**
 * 生成视觉维度能量值（基于五运六气理论，由 AI 计算）
 * @param {string} birthday - 用户生日
 * @param {string} currentDate - 今日日期
 * @param {string} missingWuxing - 用户需要补充的色彩属性
 * @returns {Promise<Object>} 能量值分布
 */
async function generateEnergyValuesByAI(birthday, currentDate, missingWuxing) {
  const prompt = `你是一位精通传统历法和色彩美学的专家。请根据以下信息，计算用户在今日的视觉维度能量分布：

用户信息：
- 出生日期：${birthday}
- 今日日期：${currentDate}
- 需要补充的色彩属性：${missingWuxing}

请基于传统历法（类似五运六气的逻辑），分析：
1. 用户的先天色彩属性特点（基于生日的年月日）
2. 今日的色彩能量特点（基于今日干支历的年月日）
3. 用户在今日的综合能量分布

返回严格的 JSON 格式（不要任何其他文字）：
{
  "metal": 数字（0-100，代表金属性能量），
  "wood": 数字（0-100，代表木属性能量），
  "water": 数字（0-100，代表水属性能量），
  "fire": 数字（0-100，代表火属性能量），
  "earth": 数字（0-100，代表土属性能量）
}

重要要求：
- 使用"视觉维度"、"色彩能量"、"美学属性"等现代语境
- 严禁出现：算命、占卜、运势、风水、命理、八字、吉凶、灾祸等词汇
- 这是色彩美学分析，不是命运预测
- 能量值反映的是色彩对个人气质的影响程度
- 必须返回 5 个属性的数值，每个都是 0-100 的数字
- 只返回 JSON，不要任何其他文字`

  try {
    console.log('调用 DeepSeek API 计算能量值...')
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一位传统历法与色彩美学专家，擅长用现代语言诠释传统智慧。你的分析聚焦于色彩心理学、美学平衡、气质提升，不涉及任何迷信内容。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const aiContent = response.data.choices[0].message.content
    console.log('AI 返回内容:', aiContent)
    
    // 解析 JSON
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const energyValues = JSON.parse(jsonMatch[0])
        console.log('解析后的能量值:', energyValues)
        
        // 验证数据有效性
        if (energyValues.metal !== undefined && energyValues.wood !== undefined) {
          console.log('✓ AI 能量计算成功')
          return energyValues
        } else {
          console.log('✗ AI 返回的数据不完整，缺少某些属性')
        }
      } else {
        console.log('✗ AI 返回内容中没有找到 JSON')
      }
    } catch (parseError) {
      console.error('✗ JSON 解析失败:', parseError)
      console.log('原始内容:', aiContent)
    }
    
    // 如果 AI 计算失败，使用备用方案
    console.log('⚠ AI 计算失败，使用备用方案')
    return generateEnergyValuesForToday(missingWuxing, currentDate)
    
  } catch (error) {
    console.error('✗ AI 能量计算异常:', error.message)
    // 返回备用方案
    return generateEnergyValuesForToday(missingWuxing, currentDate)
  }
}

/**
 * 生成视觉维度能量值（备用方案：基于今日五行）
 * @param {string} missingWuxing - 用户需要补充的色彩属性
 * @param {string} currentDate - 今日日期
 * @returns {Object} 能量值分布
 */
function generateEnergyValuesForToday(missingWuxing, currentDate) {
  // 计算今日五行
  const [year, month, day] = currentDate.split('-').map(Number)
  const todayWuxing = wuxingUtils.getDailyWuxing(year, month, day)
  
  // 基础能量值
  const baseValues = {
    metal: 60,
    wood: 60,
    water: 60,
    fire: 60,
    earth: 60
  }
  
  // 用户需要补充的属性能量较低（需要增强）
  baseValues[missingWuxing] = 40
  
  // 今日五行属性能量较高（得到天时加持）
  baseValues[todayWuxing.element] = 85
  
  // 根据色彩互补关系调整
  const GENERATING_CYCLE = {
    water: 'wood',
    wood: 'fire',
    fire: 'earth',
    earth: 'metal',
    metal: 'water'
  }
  
  // 今日五行生助的属性也较强
  const generatedByToday = GENERATING_CYCLE[todayWuxing.element]
  if (generatedByToday && generatedByToday !== missingWuxing) {
    baseValues[generatedByToday] = 70
  }
  
  // 克制今日五行的属性较弱
  const CONTROLLING_CYCLE = {
    wood: 'earth',
    earth: 'water',
    water: 'fire',
    fire: 'metal',
    metal: 'wood'
  }
  
  const controlledByToday = CONTROLLING_CYCLE[todayWuxing.element]
  if (controlledByToday && controlledByToday !== missingWuxing) {
    baseValues[controlledByToday] = 50
  }
  
  return baseValues
}

/**
 * 调用 DeepSeek API 生成穿搭建议
 * @param {string} missingWuxing - 缺失的五行属性
 * @param {string} wuxingName - 五行名称
 * @returns {Promise<object>} AI 生成的建议
 */
async function callDeepSeekAPI(missingWuxing, wuxingName) {
  const styleInfo = WUXING_STYLE_MAP[missingWuxing]
  
  const prompt = `你是一位时尚穿搭博主，精通传统色彩美学。请根据以下信息生成穿搭建议：

美学背景：基于传统色彩美学理论的视觉灵感计算
今日美学属性：${wuxingName} (${missingWuxing})
属性特点：${styleInfo.description}
建议风格：${styleInfo.style}
建议面料：${styleInfo.fabric}
建议色值：${styleInfo.color}

请生成一份穿搭指南，要求：
1. 聚焦在色彩心理学、面料触感、款式风格
2. 文案优雅有质感，符合现代审美
3. 提供 3-5 个穿搭关键词
4. 可选：推荐一款匹配的香氛类型
5. 严禁出现算命、占卜、运气、风水等词汇
6. 保持"视觉美学灵感计算"的语境，强调视觉平衡和色彩美学
7. 色彩建议要考虑主色、辅色、点缀色的层次搭配
8. 使用"色彩互补"、"视觉平衡"、"美学协调"等现代语境

请以 JSON 格式返回：
{
  "style_advice": "风格建议文案 (100-200 字)",
  "color_hex": "推荐主色值",
  "clothing_items": ["关键词 1", "关键词 2", "关键词 3"],
  "fragrance_note": "香氛建议 (可选)"
}`

  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的时尚穿搭博主，擅长将传统色彩美学与现代时尚结合。你的建议聚焦于色彩心理、面料质感和款式风格，强调视觉平衡和美学计算，不涉及任何迷信内容。所有解析都应从美学、色彩学、设计学角度出发。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const aiContent = response.data.choices[0].message.content
    
    // 尝试解析 JSON
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      console.error('JSON 解析失败:', parseError)
    }

    // 如果解析失败，返回默认格式
    return {
      style_advice: `今日适合${styleInfo.style}风格的穿搭。选择${styleInfo.fabric}的面料，能为你带来舒适的穿着体验。${styleInfo.description}，建议以${styleInfo.color}为主色调，打造简约而有质感的造型。`,
      color_hex: styleInfo.color,
      clothing_items: [`${styleInfo.style}上衣`, '修身下装', '简约配饰'],
      fragrance_note: '清新淡雅的香氛'
    }
  } catch (error) {
    console.error('DeepSeek API 调用失败:', error.message)
    throw new Error('AI 服务暂时不可用，请稍后重试')
  }
}

/**
 * 云函数主入口
 */
exports.main = async (event, context) => {
  const { birthday, currentDate } = event
  
  // 参数验证
  if (!birthday || !currentDate) {
    return {
      success: false,
      message: '缺少必要参数'
    }
  }

  try {
    // 计算需要补充的色彩属性
    const missingWuxing = wuxingUtils.getMissingWuxing(birthday, currentDate)
    const wuxingName = wuxingUtils.WUXING_NAMES[wuxingUtils.WUXING_ELEMENTS.indexOf(missingWuxing)]
    
    console.log(`用户生日：${birthday}, 今日：${currentDate}, 需要补充的色彩属性：${wuxingName}(${missingWuxing})`)

    // 调用 AI 生成穿搭建议
    const aiAdvice = await callDeepSeekAPI(missingWuxing, wuxingName)
    
    // 内容安全检查
    const contentToCheck = [
      aiAdvice.style_advice,
      aiAdvice.clothing_items.join(' '),
      aiAdvice.fragrance_note || ''
    ].join(' ')

    const isSafe = await checkContentSecurity(contentToCheck)
    
    if (!isSafe) {
      console.warn('内容安全检测未通过')
      return {
        success: false,
        message: '内容不符合规范，请重新生成'
      }
    }

    // 使用 AI 基于五运六气理论分析用户命局和当日五行，智能推荐颜色
    console.log('开始 AI 颜色推荐分析...')
    const colorRecommendation = await generateColorRecommendationByWuxing(birthday, currentDate, missingWuxing)
    console.log('AI 颜色推荐结果:', colorRecommendation)
    
    // 生成配色方案
    const colorPaletteList = colorPalette.generateColorPalette(missingWuxing)
    console.log('生成的配色方案:', colorPaletteList)
    
    // 使用 AI 基于五运六气理论计算今日能量分布
    console.log('开始 AI 能量计算...')
    const energyValues = await generateEnergyValuesByAI(birthday, currentDate, missingWuxing)
    console.log('AI 生成的能量值:', energyValues)
    
    // 生成色彩美学解析
    const wuxingAnalysis = await generateWuxingAnalysis(missingWuxing, wuxingName, energyValues, birthday)
    
    // 构建统一的 JSON 格式返回数据
    const unifiedData = {
      // 模块 A：雷达图数据（看板之魂）
      radar_data: {
        energy_values: energyValues,
        wuxing_element: missingWuxing,
        wuxing_name: wuxingName,
        aesthetics_summary: generateAestheticsSummary(energyValues, missingWuxing)
      },
      
      // 模块 B：色系推荐（核心识别）
      color_scheme: {
        primary_color: aiAdvice.color_hex || WUXING_STYLE_MAP[missingWuxing].color,
        color_palette: colorPaletteList,
        wuxing_colors: {
          metal: { name: '金', color: '白', hex: '#E8E8E8', colors: '白色、银色、杏色、乳白色' },
          wood: { name: '木', color: '绿', hex: '#4CAF50', colors: '绿色、青色、翠色' },
          water: { name: '水', color: '黑', hex: '#4A90E2', colors: '黑色、蓝色、深灰色' },
          fire: { name: '火', color: '红', hex: '#FF6B6B', colors: '红色、粉色、橙色、紫色' },
          earth: { name: '土', color: '黄', hex: '#D4A574', colors: '黄色、咖啡色、棕色、卡其色' }
        }
      },
      
      // 模块 C：内容呈现（Bento卡片）
      aesthetic_advice: {
        style_advice: cleanSensitiveContent(aiAdvice.style_advice),
        clothing_items: aiAdvice.clothing_items.map(item => cleanSensitiveContent(item)),
        fragrance_note: aiAdvice.fragrance_note ? cleanSensitiveContent(aiAdvice.fragrance_note) : '',
        analysis: wuxingAnalysis
      },
      
      // 新增：AI 基于五运六气的颜色推荐
      color_recommendation: colorRecommendation,
      
      // 兼容旧版字段（向后兼容）
      style_advice: cleanSensitiveContent(aiAdvice.style_advice),
      color_hex: aiAdvice.color_hex || WUXING_STYLE_MAP[missingWuxing].color,
      primary_color: aiAdvice.color_hex || WUXING_STYLE_MAP[missingWuxing].color,
      color_palette: colorPaletteList,
      clothing_items: aiAdvice.clothing_items.map(item => cleanSensitiveContent(item)),
      fragrance_note: aiAdvice.fragrance_note ? cleanSensitiveContent(aiAdvice.fragrance_note) : '',
      wuxing_element: missingWuxing,
      energy_values: energyValues,
      wuxing_analysis: wuxingAnalysis
    }

    console.log('统一格式返回数据:', unifiedData)

    return {
      success: true,
      data: unifiedData
    }
  } catch (error) {
    console.error('生成失败:', error)
    return {
      success: false,
      message: error.message || '生成失败，请稍后重试'
    }
  }
}
