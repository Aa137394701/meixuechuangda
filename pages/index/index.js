const app = getApp()

const WUXING_AESTHETICS = {
  metal: { name: '金', dimension: '质感平衡', color: '#E8E8E8', colors: '白色、银色、杏色' },
  wood: { name: '木', dimension: '生机比例', color: '#4CD964', colors: '绿色、青色、翠色' },
  water: { name: '水', dimension: '柔和流动', color: '#007AFF', colors: '黑色、蓝色、深灰色' },
  fire: { name: '火', dimension: '明亮能量', color: '#FF3B30', colors: '红色、粉色、橙色' },
  earth: { name: '土', dimension: '沉稳底蕴', color: '#FFCC00', colors: '黄色、咖啡色、棕色' }
}

function generateAestheticsSummary(energyValues, missingWuxing) {
  if (!missingWuxing || !WUXING_AESTHETICS[missingWuxing]) {
    return '今日美学能量平衡，展现自然和谐之美。'
  }
  const wuxing = WUXING_AESTHETICS[missingWuxing]
  return `今日审美建议：多穿${wuxing.colors}等${wuxing.name}属性色彩，增强${wuxing.dimension}。`
}

Page({
  data: {
    formattedDate: '',
    lunarDate: '',
    currentDay: '',
    birthday: '',
    maxDate: '',
    loading: false,
    hasUserInfo: false,
    showInputForm: true,
    userInfo: null,
    aestheticData: null,
    energyValues: { metal: 70, wood: 70, water: 70, fire: 70, earth: 70 },
    aestheticsSummary: '',
    colorGuide: {
      first: { title: '首选色系', colors: '', hex: '#4CAF50' },
      secondary: { title: '次选色系', colors: '', hex: '#2196F3' },
      normal: { title: '一般色系', colors: '', hex: '#FFC107' },
      notRecommended: { title: '不建议色系', colors: '', hex: '#9E9E9E' },
      stronglyNotRecommended: { title: '强烈不建议', colors: '', hex: '#F44336' }
    },
    primaryColor: { name: '推荐色', hex: '#2E58EB' },
    aiAdvice: { style_advice: '', clothing_items: [], fragrance_note: '' },
    wuxingAnalysis: '',
    wuxingMap: WUXING_AESTHETICS
  },

  onLoad() {
    this.initDate()
  },

  onShow() {
    // 每次显示页面时，检查用户状态和数据（不阻塞 UI）
    this.checkUserStatus()
  },

  initDate() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    
    this.setData({
      formattedDate: `${year}年${month}月${day}日`,
      currentDay: day,
      lunarDate: this.getLunarDate(now),
      maxDate: `${year}-${month}-${day}`
    })
  },

  // 检查用户状态
  async checkUserStatus() {
    const app = getApp()
    
    // 1. 检查是否有缓存的美学数据
    const cachedData = app.getCachedAestheticData()
    
    if (cachedData) {
      // 有缓存数据，直接显示个人看板
      console.log('✅ 使用缓存数据，显示个人看板')
      this.renderDashboard(cachedData)
      return
    }
    
    // 2. 检查用户是否已输入生日
    const userInfoResult = await app.getUserInfo()
    
    if (userInfoResult.success && userInfoResult.data.birthday) {
      // 用户已输入生日，但没有缓存数据，需要生成
      console.log('✅ 用户已输入生日，生成美学数据')
      this.setData({
        hasUserInfo: true,
        showInputForm: false,
        userInfo: userInfoResult.data
      })
      
      // 生成美学数据
      await this.generateAestheticData(userInfoResult.data.birthday)
    } else {
      // 新用户，显示输入表单
      console.log('新用户，显示输入表单')
      this.setData({
        hasUserInfo: false,
        showInputForm: true
      })
    }
  },

  // 渲染个人看板
  renderDashboard(aestheticData) {
    // 兼容新旧数据格式
    let missingWuxing, energyValues, styleAdvice, clothingItems, fragranceNote, wuxingAnalysis
    
    if (aestheticData.radar_data) {
      // 新格式：统一 JSON 结构
      missingWuxing = aestheticData.radar_data.wuxing_element
      energyValues = aestheticData.radar_data.energy_values
      styleAdvice = aestheticData.aesthetic_advice.style_advice
      clothingItems = aestheticData.aesthetic_advice.clothing_items
      fragranceNote = aestheticData.aesthetic_advice.fragrance_note
      wuxingAnalysis = aestheticData.aesthetic_advice.analysis
    } else {
      // 旧格式：扁平结构（向后兼容）
      missingWuxing = aestheticData.wuxing_element || 'water'
      energyValues = aestheticData.energy_values || this.data.energyValues
      styleAdvice = aestheticData.style_advice || ''
      clothingItems = aestheticData.clothing_items || []
      fragranceNote = aestheticData.fragrance_note || ''
      wuxingAnalysis = aestheticData.wuxing_analysis || ''
    }
    
    const aestheticsSummary = generateAestheticsSummary(energyValues, missingWuxing)
    
    // 根据能量值找出最低和最高的属性
    const weakestElement = this.findWeakestElement(energyValues)
    const strongestElement = this.findStrongestElement(energyValues)
    
    const colorGuide = this.generateColorGuideByEnergy(weakestElement, strongestElement, energyValues)
    
    const primaryColor = this.extractPrimaryColor(colorGuide.first.colors, colorGuide.first.hex)
    
    const aiAdvice = {
      style_advice: styleAdvice,
      clothing_items: clothingItems,
      fragrance_note: fragranceNote
    }
    
    this.setData({
      hasUserInfo: true,
      showInputForm: false,
      userInfo: getApp().globalData.userInfo,
      aestheticData: aestheticData,
      energyValues: energyValues,
      aestheticsSummary: aestheticsSummary,
      colorGuide: colorGuide,
      primaryColor: primaryColor,
      aiAdvice: aiAdvice,
      wuxingAnalysis: wuxingAnalysis
    })
  },

  onBirthdayChange(e) {
    this.setData({
      birthday: e.detail.value
    })
  },

  // 生成美学数据
  async generateAestheticData(birthday) {
    this.setData({ loading: true })

    try {
      const app = getApp()
      const today = app.getTodayString()
      
      const result = await wx.cloud.callFunction({
        name: 'generateOOTD',
        data: {
          birthday: birthday,
          currentDate: today
        }
      })

      if (result.result && result.result.success) {
        const aestheticData = result.result.data
        
        // 渲染个人看板
        this.renderDashboard(aestheticData)
        
        wx.showToast({
          title: '美学指南已生成',
          icon: 'success'
        })
      } else {
        throw new Error(result.result?.message || '生成失败')
      }
    } catch (error) {
      console.error('生成失败:', error)
      wx.showToast({
        title: error.message || '生成失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 提交生日
  async submitBirthday() {
    if (!this.data.birthday) {
      wx.showToast({
        title: '请先选择生日',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })

    try {
      const app = getApp()
      
      // 获取用户信息（头像、昵称）
      let userInfo = {
        birthday: this.data.birthday,
        avatarUrl: '',
        nickName: '用户',
        gender: 0
      }
      
      // 尝试获取用户头像和昵称
      try {
        const userProfile = await wx.getUserProfile({
          desc: '用于完善用户资料',
          lang: 'zh_CN'
        })
        userInfo.avatarUrl = userProfile.userInfo.avatarUrl
        userInfo.nickName = userProfile.userInfo.nickName
        userInfo.gender = userProfile.userInfo.gender
      } catch (err) {
        console.log('用户未授权获取头像昵称，使用默认值')
      }
      
      // 保存到全局数据和本地缓存
      await app.saveUserInfo(userInfo)
      
      // 生成美学数据
      await this.generateAestheticData(this.data.birthday)
      
    } catch (error) {
      console.error('提交失败:', error)
      wx.showToast({
        title: error.message || '提交失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 重新生成
  async regenerate() {
    const app = getApp()
    
    if (app.globalData.userInfo && app.globalData.userInfo.birthday) {
      await this.generateAestheticData(app.globalData.userInfo.birthday)
    }
  },

  // 跳转到灵感页面查看色系推荐
  goToMyColor() {
    console.log('=== 点击首页"查看我的今日色系推荐"按钮 ===')
    console.log('准备跳转到灵感页面...')
    
    // 先检查是否有美学数据
    const app = getApp()
    const cachedData = app.getCachedAestheticData()
    
    if (!cachedData) {
      console.log('⚠️ 没有缓存数据，先刷新美学数据')
      // 如果没有缓存数据，先刷新
      app.checkAndUpdateAestheticData(true).then(() => {
        console.log('✅ 美学数据已刷新，跳转到灵感页面')
        wx.switchTab({
          url: '/pages/inspiration/inspiration'
        })
      })
    } else {
      console.log('✅ 有缓存数据，直接跳转到灵感页面')
      wx.switchTab({
        url: '/pages/inspiration/inspiration'
      })
    }
  },

  // 找出能量值最低的属性
  findWeakestElement(energyValues) {
    let weakest = 'metal'
    let minValue = 100
    
    Object.keys(energyValues).forEach(key => {
      if (energyValues[key] < minValue) {
        minValue = energyValues[key]
        weakest = key
      }
    })
    
    return weakest
  },

  // 找出能量值最高的属性
  findStrongestElement(energyValues) {
    let strongest = 'metal'
    let maxValue = 0
    
    Object.keys(energyValues).forEach(key => {
      if (energyValues[key] > maxValue) {
        maxValue = energyValues[key]
        strongest = key
      }
    })
    
    return strongest
  },

  // 基于能量值生成色彩美学推荐
  generateColorGuideByEnergy(weakestElement, strongestElement, energyValues) {
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

    // 首选色系：能量值最高的属性（今日主导属性，应该顺应）
    const primary = {
      title: '首选色系',
      colors: WUXING_COLORS[strongestElement].colors,
      hex: WUXING_COLORS[strongestElement].hex
    }
    
    // 次选色系：生助最高属性的属性（互补增强）
    let generating = ''
    for (let key in GENERATING_CYCLE) {
      if (GENERATING_CYCLE[key] === strongestElement) {
        generating = key
        break
      }
    }
    const secondary = {
      title: '次选色系',
      colors: WUXING_COLORS[generating].colors,
      hex: WUXING_COLORS[generating].hex
    }
    
    // 一般色系：被最高属性克制的属性（平衡）
    const controlling = CONTROLLING_CYCLE[strongestElement]
    const normal = {
      title: '一般色系',
      colors: WUXING_COLORS[controlling].colors,
      hex: WUXING_COLORS[controlling].hex
    }
    
    // 不建议色系：克制最高属性的属性（会削弱主导能量）
    let controlled = ''
    for (let key in CONTROLLING_CYCLE) {
      if (CONTROLLING_CYCLE[key] === strongestElement) {
        controlled = key
        break
      }
    }
    const notRecommended = {
      title: '不建议色系',
      colors: WUXING_COLORS[controlled].colors,
      hex: WUXING_COLORS[controlled].hex
    }
    
    // 强烈不建议：能量值最低的属性（已经太弱，不宜再削弱）
    const stronglyNotRecommended = {
      title: '强烈不建议',
      colors: WUXING_COLORS[weakestElement].colors,
      hex: WUXING_COLORS[weakestElement].hex
    }
    
    return {
      first: primary,
      secondary: secondary,
      normal: normal,
      notRecommended: notRecommended,
      stronglyNotRecommended: stronglyNotRecommended
    }
  },

  // 生成色彩美学推荐（基于用户需要补充的色彩属性）- 保留向后兼容
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

  // 提取首选色系的主色调
  extractPrimaryColor(colorsText, defaultHex) {
    if (!colorsText) {
      return {
        name: '推荐色',
        hex: defaultHex
      }
    }
    
    // 提取第一个颜色
    const firstColor = colorsText.split('、')[0]
    
    return {
      name: firstColor,
      hex: defaultHex
    }
  },

  // 获取农历日期
  getLunarDate(date) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    
    const lunarMonths = ['正月', '二月', '三月', '四月', '五月', '六月', 
                        '七月', '八月', '九月', '十月', '冬月', '腊月']
    const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', 
                      '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五',
                      '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三',
                      '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']
    
    const baseDate = new Date(1900, 0, 31)
    const targetDate = new Date(year, month - 1, day)
    const diffDays = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24))
    
    let lunarYear = 1900
    let lunarMonth = 0
    let lunarDay = 0
    
    const lunarData = [
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
    
    function lYearDays(y) {
      let sum = 348
      for (let i = 0x8000; i > 0x8; i >>= 1) {
        sum += (lunarData[y - 1900] & i) ? 1 : 0
      }
      return sum + leapDays(y)
    }
    
    function leapDays(y) {
      if (lunarData[y - 1900] & 0xf) {
        return (lunarData[y - 1900] & 0x10000) ? 30 : 29
      }
      return 0
    }
    
    function leapMonth(y) {
      return lunarData[y - 1900] & 0xf
    }
    
    function monthDays(y, m) {
      return (lunarData[y - 1900] & (0x10000 >> m)) ? 30 : 29
    }
    
    let offset = diffDays
    let currentYear = lunarYear
    
    while (offset > 0) {
      const days = lYearDays(currentYear)
      if (offset >= days) {
        offset -= days
        currentYear++
      } else {
        break
      }
    }
    
    while (offset < 0) {
      currentYear--
      offset += lYearDays(currentYear)
    }
    
    lunarYear = currentYear
    const leap = leapMonth(lunarYear)
    let isLeap = false
    
    for (let i = 1; i <= 12; i++) {
      if (leap > 0 && i === leap && !isLeap) {
        const days = leapDays(lunarYear)
        if (offset < days) {
          lunarMonth = i
          lunarDay = offset
          isLeap = true
          break
        }
        offset -= days
      }
      
      const days = monthDays(lunarYear, i)
      if (offset < days) {
        lunarMonth = isLeap ? i : i
        lunarDay = offset
        break
      }
      offset -= days
      
      if (leap > 0 && i === leap && !isLeap) {
        isLeap = true
        i--
      }
    }
    
    return `${lunarMonths[lunarMonth - 1]}${lunarDays[lunarDay]}`
  }
})
