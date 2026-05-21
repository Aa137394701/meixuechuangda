const app = getApp()
const aestheticsUtils = require('../../utils/aesthetics.js')

Page({
  data: {
    loading: true,
    hasUserInfo: false,
    userInfo: null,
    currentDate: '',
    lunarDate: '',
    primaryColor: { name: '', hex: '' },
    colorGuide: {
      first: { title: '首选色系', colors: '', hex: '' },
      secondary: { title: '次选色系', colors: '', hex: '' },
      normal: { title: '一般色系', colors: '', hex: '' },
      notRecommended: { title: '不建议色系', colors: '', hex: '' },
      stronglyNotRecommended: { title: '强烈不建议', colors: '', hex: '' }
    },
    energyValues: {
      metal: 0,
      wood: 0,
      water: 0,
      fire: 0,
      earth: 0
    },
    missingWuxing: '',
    aestheticsSummary: '',
    wuxingAnalysis: '',
    hasLoadedData: false // 标记是否已加载过数据
  },

  onLoad() {
    this.checkUserInfo()
  },

  onShow() {
    // 只在第一次显示时检查用户信息，避免返回时重复加载
    if (!this.data.hasLoadedData) {
      this.checkUserInfo()
    }
  },

  // 检查用户信息
  async checkUserInfo() {
    try {
      wx.showLoading({ title: '检查中...' })
      
      // 优先使用 app.getUserInfo()，它会先从本地缓存获取
      const userInfoResult = await app.getUserInfo()
      
      wx.hideLoading()
      console.log('检查用户信息结果:', userInfoResult)
      
      if (userInfoResult.success && userInfoResult.data && userInfoResult.data.birthday) {
        console.log('✅ 用户已登录，生日:', userInfoResult.data.birthday)
        this.setData({
          hasUserInfo: true,
          userInfo: userInfoResult.data
        })
        
        // 加载用户数据
        this.loadUserData()
      } else {
        console.log('❌ 用户未登录或无生日信息')
        this.setData({
          hasUserInfo: false,
          loading: false
        })
      }
    } catch (err) {
      console.error('❌ 检查用户信息失败', err)
      wx.hideLoading()
      this.setData({
        hasUserInfo: false,
        loading: false
      })
    }
  },

  // 加载用户数据
  async loadUserData() {
    this.setData({ loading: true })

    try {
      // 确保 userInfo 存在，如果不存在则从 app.getUserInfo() 获取
      if (!this.data.userInfo || !this.data.userInfo.birthday) {
        console.log('本地 userInfo 不存在，尝试从 app.getUserInfo() 获取')
        const userInfoResult = await app.getUserInfo()
        if (userInfoResult.success && userInfoResult.data && userInfoResult.data.birthday) {
          this.setData({
            hasUserInfo: true,
            userInfo: userInfoResult.data
          })
        } else {
          console.error('用户信息不存在')
          this.setData({
            hasUserInfo: false,
            loading: false
          })
          return
        }
      }

      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      
      console.log('=== 开始加载用户数据 ===')
      console.log('用户生日:', this.data.userInfo.birthday)
      
      // 使用本地计算生成推荐（快速可靠）
      this.loadLocalFallback(now, year, month, day)
    } catch (error) {
      console.error('加载数据失败:', error)
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      this.loadLocalFallback(now, year, month, day)
    }
  },

  // 本地备用方案（云函数失败时使用）
  loadLocalFallback(now, year, month, day) {
    const birthday = this.data.userInfo.birthday
    const missingWuxing = this.calculateMissingWuxing(birthday)
    
    // 生成视觉维度分布
    const energyValues = aestheticsUtils.generateEnergyValues(missingWuxing)
    const aestheticsSummary = aestheticsUtils.generateAestheticsSummary(energyValues, missingWuxing)
    
    // 计算当日五行
    const todayWuxing = this.calculateDailyWuxing(now)
    const todayWuxingKey = todayWuxing.name === '木' ? 'wood' : 
                           todayWuxing.name === '火' ? 'fire' : 
                           todayWuxing.name === '土' ? 'earth' : 
                           todayWuxing.name === '金' ? 'metal' : 'water'
    
    // 使用简化的本地颜色推荐逻辑
    const colorGuide = this.generateSimpleColorGuide(todayWuxingKey, missingWuxing)
    const primaryColor = this.extractPrimaryColor(colorGuide.first.colors, colorGuide.first.hex)

    // 生成本地色彩美学解析
    const wuxingAnalysis = this.generateLocalAnalysis(colorGuide, energyValues)

    this.setData({
      currentDate: `${year}年${month}月${day}日`,
      lunarDate: this.getLunarDate(now),
      primaryColor: primaryColor,
      colorGuide: colorGuide,
      energyValues: energyValues,
      missingWuxing: missingWuxing,
      aestheticsSummary: aestheticsSummary,
      wuxingAnalysis: wuxingAnalysis,
      loading: false,
      hasLoadedData: true
    })
  },

  // 生成本地色彩美学解析文案（基于实际推荐色系和雷达图能量值）
  generateLocalAnalysis(colorGuide, energyValues) {
    const WUXING_NAMES = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' }
    const WUXING_STYLES = {
      wood: '自然清新',
      fire: '热情活力',
      earth: '沉稳大气',
      metal: '简约精致',
      water: '优雅灵动'
    }
    const WUXING_HEX_MAP = {
      '#4CAF50': 'wood',
      '#FF6B6B': 'fire',
      '#D4A574': 'earth',
      '#E8E8E8': 'metal',
      '#4A90E2': 'water'
    }

    // 根据色系 hex 找到对应的五行属性
    const firstElement = WUXING_HEX_MAP[colorGuide.first.hex] || 'earth'
    const secondaryElement = WUXING_HEX_MAP[colorGuide.secondary.hex] || 'water'
    const normalElement = WUXING_HEX_MAP[colorGuide.normal.hex] || 'fire'
    const notRecommendedElement = WUXING_HEX_MAP[colorGuide.notRecommended.hex] || 'earth'
    const stronglyNotRecommendedElement = WUXING_HEX_MAP[colorGuide.stronglyNotRecommended.hex] || 'water'

    const firstName = WUXING_NAMES[firstElement]
    const secondaryName = WUXING_NAMES[secondaryElement]
    const normalName = WUXING_NAMES[normalElement]
    const notRecommendedName = WUXING_NAMES[notRecommendedElement]
    const stronglyNotRecommendedName = WUXING_NAMES[stronglyNotRecommendedElement]

    const firstStyle = WUXING_STYLES[firstElement]
    const secondaryStyle = WUXING_STYLES[secondaryElement]

    // 找出能量最高和最低的元素
    let maxElement = 'metal', maxVal = 0
    let minElement = 'metal', minVal = 100
    Object.keys(energyValues).forEach(key => {
      if (energyValues[key] > maxVal) { maxVal = energyValues[key]; maxElement = key }
      if (energyValues[key] < minVal) { minVal = energyValues[key]; minElement = key }
    })
    const maxName = WUXING_NAMES[maxElement]
    const minName = WUXING_NAMES[minElement]

    return `今日首选色系为${colorGuide.first.colors}（${firstName}属性），这些色彩具有${firstStyle}的特质，能够与您今日的能量场形成最佳共振。雷达图显示您的${maxName}属性能量最强（${maxVal}分），${minName}属性相对较弱（${minVal}分），因此以${firstName}属性色彩为主色调，可以有效平衡您的视觉维度分布。

次选色系${colorGuide.secondary.colors}（${secondaryName}属性）作为辅助搭配，具有${secondaryStyle}的气质，能够增强整体造型的层次感。一般色系${colorGuide.normal.colors}（${normalName}属性）可作为点缀使用，为穿搭增添变化。

不建议色系${colorGuide.notRecommended.colors}（${notRecommendedName}属性）和强烈不建议的${colorGuide.stronglyNotRecommended.colors}（${stronglyNotRecommendedName}属性），从色彩互补角度来看，这些色彩与您今日的能量分布不够协调，容易造成视觉上的冲突感，建议尽量避免大面积使用。`
  },

  // 简化的本地颜色推荐（不依赖复杂逻辑）
  generateSimpleColorGuide(todayWuxing, missingWuxing) {
    const WUXING_COLORS = {
      wood: { hex: '#4CAF50', name: '木', colors: '绿色、青色、翠色' },
      fire: { hex: '#FF6B6B', name: '火', colors: '红色、粉色、橙色、紫色' },
      earth: { hex: '#D4A574', name: '土', colors: '黄色、咖啡色、棕色、卡其色' },
      metal: { hex: '#E8E8E8', name: '金', colors: '白色、银色、杏色、乳白色' },
      water: { hex: '#4A90E2', name: '水', colors: '黑色、蓝色、深灰色' }
    }

    // 五行相生：木→火→土→金→水→木
    const GENERATING = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' }
    // 五行相克：木→土→水→火→金→木
    const CONTROLLING = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' }

    // 确保 missingWuxing 和 todayWuxing 是有效的
    const validElements = ['wood', 'fire', 'earth', 'metal', 'water']
    const safeMissing = validElements.includes(missingWuxing) ? missingWuxing : 'water'
    const safeToday = validElements.includes(todayWuxing) ? todayWuxing : 'wood'

    // 找到生 missingWuxing 的元素
    let generatesMissing = ''
    for (let key in GENERATING) {
      if (GENERATING[key] === safeMissing) {
        generatesMissing = key
        break
      }
    }
    if (!generatesMissing) generatesMissing = 'water'

    // 找到克 safeToday 的元素
    let controlsToday = ''
    for (let key in CONTROLLING) {
      if (CONTROLLING[key] === safeToday) {
        controlsToday = key
        break
      }
    }
    if (!controlsToday) controlsToday = 'fire'

    return {
      first: {
        title: '首选色系',
        colors: WUXING_COLORS[safeMissing].colors,
        hex: WUXING_COLORS[safeMissing].hex
      },
      secondary: {
        title: '次选色系',
        colors: WUXING_COLORS[safeToday].colors,
        hex: WUXING_COLORS[safeToday].hex
      },
      normal: {
        title: '一般色系',
        colors: WUXING_COLORS[generatesMissing].colors,
        hex: WUXING_COLORS[generatesMissing].hex
      },
      notRecommended: {
        title: '不建议色系',
        colors: WUXING_COLORS[controlsToday].colors,
        hex: WUXING_COLORS[controlsToday].hex
      },
      stronglyNotRecommended: {
        title: '强烈不建议',
        colors: WUXING_COLORS[CONTROLLING[safeMissing]].colors,
        hex: WUXING_COLORS[CONTROLLING[safeMissing]].hex
      }
    }
  },

  // 计算用户需要补充的五行（本地备用）
  calculateMissingWuxing(birthday) {
    const WUXING_ELEMENTS = ['metal', 'wood', 'water', 'fire', 'earth']
    const baseDate = new Date(2000, 0, 1)
    const birthDate = new Date(birthday)
    const diffDays = Math.floor((birthDate - baseDate) / (1000 * 60 * 60 * 24))
    // 处理负数取模
    const index = ((diffDays % 5) + 5) % 5
    return WUXING_ELEMENTS[index]
  },

  // 重新生成
  regenerate() {
    this.loadUserData()
    wx.showToast({
      title: '已重新生成',
      icon: 'success'
    })
  },

  // 跳转到首页
  goToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  // 提取首选色系的第一个颜色作为用户今日主色调
  extractPrimaryColor(colorsStr, defaultHex) {
    // 从颜色字符串中提取第一个颜色名称
    // 例如："黄色、咖啡色、棕色、卡其色" → "黄色"
    if (colorsStr) {
      const firstColorName = colorsStr.split(/[、,]/)[0].trim()
      
      // 根据颜色名称返回对应的 hex 值
      const colorMap = {
        '黄色': '#D4A574',
        '咖啡色': '#D4A574',
        '棕色': '#8D6E63',
        '卡其色': '#C2B280',
        '白色': '#E8E8E8',
        '银色': '#C0C0C0',
        '杏色': '#F0E6D2',
        '乳白色': '#F5F5F5',
        '绿色': '#4CAF50',
        '青色': '#00CED1',
        '翠色': '#00FF7F',
        '红色': '#FF6B6B',
        '粉色': '#FFB6C1',
        '橙色': '#FFA500',
        '紫色': '#9370DB',
        '黑色': '#2C2C2C',
        '蓝色': '#4A90E2',
        '深灰色': '#696969'
      }
      
      return {
        name: firstColorName,
        hex: colorMap[firstColorName] || defaultHex
      }
    }
    
    // 默认返回
    return {
      name: '推荐色',
      hex: defaultHex
    }
  },

  // 将 AI 五运六气颜色推荐转换为前端显示格式
  buildColorGuideFromAI(colorRecommendation) {
    const WUXING_COLORS = {
      wood: { hex: '#4CAF50', name: '木', colors: '绿色、青色、翠色' },
      fire: { hex: '#FF6B6B', name: '火', colors: '红色、粉色、橙色、紫色' },
      earth: { hex: '#D4A574', name: '土', colors: '黄色、咖啡色、棕色、卡其色' },
      metal: { hex: '#E8E8E8', name: '金', colors: '白色、银色、杏色、乳白色' },
      water: { hex: '#4A90E2', name: '水', colors: '黑色、蓝色、深灰色' }
    }

    return {
      first: {
        title: '首选色系',
        colors: WUXING_COLORS[colorRecommendation.primary_color].colors,
        hex: WUXING_COLORS[colorRecommendation.primary_color].hex
      },
      secondary: {
        title: '次选色系',
        colors: WUXING_COLORS[colorRecommendation.secondary_color].colors,
        hex: WUXING_COLORS[colorRecommendation.secondary_color].hex
      },
      normal: {
        title: '一般色系',
        colors: WUXING_COLORS[colorRecommendation.normal_color].colors,
        hex: WUXING_COLORS[colorRecommendation.normal_color].hex
      },
      notRecommended: {
        title: '不建议色系',
        colors: WUXING_COLORS[colorRecommendation.not_recommended_color].colors,
        hex: WUXING_COLORS[colorRecommendation.not_recommended_color].hex
      },
      stronglyNotRecommended: {
        title: '强烈不建议',
        colors: WUXING_COLORS[colorRecommendation.strongly_not_recommended_color].colors,
        hex: WUXING_COLORS[colorRecommendation.strongly_not_recommended_color].hex
      }
    }
  },

  // 结合当日五行和用户缺失五行，生成综合推荐
  generateCombinedColorGuide(todayWuxing, missingWuxing) {
    const WUXING_COLORS = {
      wood: { hex: '#4CAF50', name: '木', colors: '绿色、青色、翠色' },
      fire: { hex: '#FF6B6B', name: '火', colors: '红色、粉色、橙色、紫色' },
      earth: { hex: '#D4A574', name: '土', colors: '黄色、咖啡色、棕色、卡其色' },
      metal: { hex: '#E8E8E8', name: '金', colors: '白色、银色、杏色、乳白色' },
      water: { hex: '#4A90E2', name: '水', colors: '黑色、蓝色、深灰色' }
    }

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

    // 首选色系：用户需要补充的五行（最重要）
    const primary = {
      title: '首选色系',
      colors: WUXING_COLORS[missingWuxing].colors,
      hex: WUXING_COLORS[missingWuxing].hex
    }
    
    // 次选色系：当日五行（顺应今日能量）
    const secondary = {
      title: '次选色系',
      colors: WUXING_COLORS[todayWuxing].colors,
      hex: WUXING_COLORS[todayWuxing].hex
    }
    
    // 一般色系：生助用户缺失五行的属性
    let generatingMissing = ''
    for (let key in GENERATING_CYCLE) {
      if (GENERATING_CYCLE[key] === missingWuxing) {
        generatingMissing = key
        break
      }
    }
    const normal = {
      title: '一般色系',
      colors: WUXING_COLORS[generatingMissing].colors,
      hex: WUXING_COLORS[generatingMissing].hex
    }
    
    // 不建议色系：克制当日五行的属性
    let controlledByToday = ''
    for (let key in CONTROLLING_CYCLE) {
      if (CONTROLLING_CYCLE[key] === todayWuxing) {
        controlledByToday = key
        break
      }
    }
    const notRecommended = {
      title: '不建议色系',
      colors: WUXING_COLORS[controlledByToday].colors,
      hex: WUXING_COLORS[controlledByToday].hex
    }
    
    // 强烈不建议：克制用户缺失五行的属性
    let controlledByMissing = ''
    for (let key in CONTROLLING_CYCLE) {
      if (CONTROLLING_CYCLE[key] === missingWuxing) {
        controlledByMissing = key
        break
      }
    }
    const stronglyNotRecommended = {
      title: '强烈不建议',
      colors: WUXING_COLORS[controlledByMissing].colors,
      hex: WUXING_COLORS[controlledByMissing].hex
    }
    
    return {
      first: primary,
      secondary: secondary,
      normal: normal,
      notRecommended: notRecommended,
      stronglyNotRecommended: stronglyNotRecommended
    }
  },

  // 生成色彩美学推荐（基于用户需要补充的色彩属性）
  generateColorGuideForMissingWuxing(missingWuxing) {
    const WUXING_COLORS = {
      wood: { hex: '#4CAF50', name: '木', colors: '绿色、青色、翠色' },
      fire: { hex: '#FF6B6B', name: '火', colors: '红色、粉色、橙色、紫色' },
      earth: { hex: '#D4A574', name: '土', colors: '黄色、咖啡色、棕色、卡其色' },
      metal: { hex: '#E8E8E8', name: '金', colors: '白色、银色、杏色、乳白色' },
      water: { hex: '#4A90E2', name: '水', colors: '黑色、蓝色、深灰色' }
    }

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

    // 首选色系：补充用户需要补充的色彩属性
    const primary = {
      title: '首选色系',
      colors: WUXING_COLORS[missingWuxing].colors,
      hex: WUXING_COLORS[missingWuxing].hex
    }
    
    // 次选色系：互补色彩
    const generating = GENERATING_CYCLE[missingWuxing]
    const secondary = {
      title: '次选色系',
      colors: WUXING_COLORS[generating].colors,
      hex: WUXING_COLORS[generating].hex
    }
    
    // 一般色系：平衡色彩
    const controlling = CONTROLLING_CYCLE[missingWuxing]
    const normal = {
      title: '一般色系',
      colors: WUXING_COLORS[controlling].colors,
      hex: WUXING_COLORS[controlling].hex
    }
    
    // 不建议色系：对比色彩
    let controlled = ''
    for (let key in CONTROLLING_CYCLE) {
      if (CONTROLLING_CYCLE[key] === missingWuxing) {
        controlled = key
        break
      }
    }
    const notRecommended = {
      title: '不建议色系',
      colors: WUXING_COLORS[controlled].colors,
      hex: WUXING_COLORS[controlled].hex
    }
    
    // 强烈不建议：冲突色彩
    const stronglyNotRecommended = {
      title: '强烈不建议',
      colors: WUXING_COLORS[missingWuxing === controlled ? generating : controlled].colors,
      hex: WUXING_COLORS[missingWuxing === controlled ? generating : controlled].hex
    }
    
    return {
      first: primary,
      secondary: secondary,
      normal: normal,
      notRecommended: notRecommended,
      stronglyNotRecommended: stronglyNotRecommended
    }
  },

  // 生成当日主色调
  calculateDailyWuxing(date) {
    const WUXING_COLORS = {
      wood: { hex: '#4CAF50', name: '木' },
      fire: { hex: '#FF6B6B', name: '火' },
      earth: { hex: '#D4A574', name: '土' },
      metal: { hex: '#E8E8E8', name: '金' },
      water: { hex: '#4A90E2', name: '水' }
    }
    
    const day = date.getDate()
    const lastDigit = day % 10
    const wuxingMap = {
      0: WUXING_COLORS.metal,
      1: WUXING_COLORS.water,
      2: WUXING_COLORS.wood,
      3: WUXING_COLORS.wood,
      4: WUXING_COLORS.fire,
      5: WUXING_COLORS.fire,
      6: WUXING_COLORS.earth,
      7: WUXING_COLORS.earth,
      8: WUXING_COLORS.metal,
      9: WUXING_COLORS.water
    }
    
    return wuxingMap[lastDigit] || WUXING_COLORS.metal
  },

  // 生成色彩美学推荐
  generateColorGuide(todayWuxing) {
    const WUXING_COLORS = {
      wood: { hex: '#4CAF50', name: '木', colors: '绿色、青色、翠色' },
      fire: { hex: '#FF6B6B', name: '火', colors: '红色、粉色、橙色、紫色' },
      earth: { hex: '#D4A574', name: '土', colors: '黄色、咖啡色、棕色、卡其色' },
      metal: { hex: '#E8E8E8', name: '金', colors: '白色、银色、杏色、乳白色' },
      water: { hex: '#4A90E2', name: '水', colors: '黑色、蓝色、深灰色' }
    }

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

    const todayKey = todayWuxing.hex === '#4CAF50' ? 'wood' :
                     todayWuxing.hex === '#FF6B6B' ? 'fire' :
                     todayWuxing.hex === '#D4A574' ? 'earth' :
                     todayWuxing.hex === '#E8E8E8' ? 'metal' : 'water'
    
    const generating = GENERATING_CYCLE[todayKey]
    const controlling = CONTROLLING_CYCLE[todayKey]
    
    let controlled = ''
    for (let key in CONTROLLING_CYCLE) {
      if (CONTROLLING_CYCLE[key] === todayKey) {
        controlled = key
        break
      }
    }
    
    let controlledBy = ''
    for (let key in CONTROLLING_CYCLE) {
      if (key === todayKey) {
        controlledBy = CONTROLLING_CYCLE[key]
        break
      }
    }
    
    return {
      first: {
        title: '首选色系',
        colors: todayWuxing.hex === '#4CAF50' ? WUXING_COLORS.wood.colors :
                todayWuxing.hex === '#FF6B6B' ? WUXING_COLORS.fire.colors :
                todayWuxing.hex === '#D4A574' ? WUXING_COLORS.earth.colors :
                todayWuxing.hex === '#E8E8E8' ? WUXING_COLORS.metal.colors : WUXING_COLORS.water.colors,
        hex: todayWuxing.hex
      },
      secondary: {
        title: '次选色系',
        colors: WUXING_COLORS[generating].colors,
        hex: WUXING_COLORS[generating].hex
      },
      normal: {
        title: '一般色系',
        colors: WUXING_COLORS[controlling].colors,
        hex: WUXING_COLORS[controlling].hex
      },
      notRecommended: {
        title: '不建议色系',
        colors: WUXING_COLORS[controlledBy].colors,
        hex: WUXING_COLORS[controlledBy].hex
      },
      stronglyNotRecommended: {
        title: '强烈不建议',
        colors: WUXING_COLORS[controlled].colors,
        hex: WUXING_COLORS[controlled].hex
      }
    }
  },

  getLunarDate(date) {
    const lunarInfo = [
      0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
      0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
      0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
      0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
      0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
      0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,
      0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
      0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,
      0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
      0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0,
      0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
      0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
      0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
      0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
      0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,
      0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,
      0x092e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,
      0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,
      0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,
      0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a4d0,0x0d150,0x0f252,
      0x0d520
    ]
    
    const lunarMonthName = ['正','二','三','四','五','六','七','八','九','十','冬','腊']
    const lunarDayName = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
                          '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
                          '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十']
    
    function lYearDays(y) {
      let sum = 348
      for (let i = 0x8000; i > 0x8; i >>= 1) {
        sum += (lunarInfo[y - 1900] & i) ? 1 : 0
      }
      return sum + leapDays(y)
    }
    
    function leapDays(y) {
      if (lunarInfo[y - 1900] & 0xf) {
        return (lunarInfo[y - 1900] & 0x10000) ? 30 : 29
      }
      return 0
    }
    
    function leapMonth(y) {
      return lunarInfo[y - 1900] & 0xf
    }
    
    function monthDays(y, m) {
      return (lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29
    }
    
    let offset = Math.floor((date - new Date(1900, 0, 31)) / 86400000)
    let lunarYear = 1900
    
    while (offset > 0) {
      const days = lYearDays(lunarYear)
      if (offset >= days) {
        offset -= days
        lunarYear++
      } else {
        break
      }
    }
    
    while (offset < 0) {
      lunarYear--
      offset += lYearDays(lunarYear)
    }
    
    const leap = leapMonth(lunarYear)
    let isLeap = false
    let lunarMonth = 1
    
    for (let i = 1; i <= 12; i++) {
      if (leap > 0 && i === leap && !isLeap) {
        const days = leapDays(lunarYear)
        if (offset < days) {
          lunarMonth = i
          const lunarDay = offset
          return `${lunarMonthName[lunarMonth - 1]}月闰${lunarDayName[lunarDay]}`
        }
        offset -= days
        isLeap = true
        i--
        continue
      }
      
      const days = monthDays(lunarYear, i)
      if (offset < days) {
        lunarMonth = i
        const lunarDay = offset
        return `${lunarMonthName[lunarMonth - 1]}月${lunarDayName[lunarDay]}`
      }
      offset -= days
    }
    
    return '腊月三十'
  }
})
