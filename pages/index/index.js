const app = getApp()

// 十二生肖基础信息
const ZODIAC_BASE = {
  rat: { name: '鼠', icon: '\u{1F400}' },
  ox: { name: '牛', icon: '\u{1F402}' },
  tiger: { name: '虎', icon: '\u{1F405}' },
  rabbit: { name: '兔', icon: '\u{1F407}' },
  dragon: { name: '龙', icon: '\u{1F409}' },
  snake: { name: '蛇', icon: '\u{1F40D}' },
  horse: { name: '马', icon: '\u{1F40E}' },
  sheep: { name: '羊', icon: '\u{1F411}' },
  monkey: { name: '猴', icon: '\u{1F412}' },
  rooster: { name: '鸡', icon: '\u{1F413}' },
  dog: { name: '狗', icon: '\u{1F415}' },
  pig: { name: '猪', icon: '\u{1F416}' }
}

// 天干详细信息 (甲子纪年法)
const HEAVENLY_STEMS = [
  { name: '甲', element: 'wood', color: '绿', yinYang: '阳' },
  { name: '乙', element: 'wood', color: '青', yinYang: '阴' },
  { name: '丙', element: 'fire', color: '红', yinYang: '阳' },
  { name: '丁', element: 'fire', color: '粉', yinYang: '阴' },
  { name: '戊', element: 'earth', color: '黄', yinYang: '阳' },
  { name: '己', element: 'earth', color: '棕', yinYang: '阴' },
  { name: '庚', element: 'metal', color: '白', yinYang: '阳' },
  { name: '辛', element: 'metal', color: '银', yinYang: '阴' },
  { name: '壬', element: 'water', color: '黑', yinYang: '阳' },
  { name: '癸', element: 'water', color: '蓝', yinYang: '阴' }
]

// 地支对应生肖
const EARTHLY_BRANCHES = ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake',
                          'horse', 'sheep', 'monkey', 'rooster', 'dog', 'pig']

// 色彩属性基础颜色库
const WUXING_COLORS = {
  wood: { hex: '#4CAF50', name: '木', colors: '绿色、青色、翠色' },
  fire: { hex: '#FF6B6B', name: '火', colors: '红色、粉色、橙色、紫色' },
  earth: { hex: '#D4A574', name: '土', colors: '黄色、咖啡色、棕色、卡其色' },
  metal: { hex: '#E8E8E8', name: '金', colors: '白色、银色、杏色、乳白色' },
  water: { hex: '#4A90E2', name: '水', colors: '黑色、蓝色、深灰色' }
}

// 色彩互补关系
const GENERATING_CYCLE = {
  wood: 'fire',
  fire: 'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood'
}

// 色彩对比关系
const CONTROLLING_CYCLE = {
  wood: 'earth',
  earth: 'water',
  water: 'fire',
  fire: 'metal',
  metal: 'wood'
}

Page({
  data: {
    formattedDate: '',
    lunarDate: '',
    currentDay: '',
    showLoading: false,
    zodiacList: []
  },

  onLoad() {
    this.initDate()
  },

  onShow() {
    this.initDate()
  },

  initDate() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')

    const todayWuxing = this.calculateDailyWuxing(now)
    const zodiacList = this.generateZodiacRecommendations(todayWuxing)

    this.setData({
      formattedDate: `${year}年${month}月${day}日`,
      currentDay: day,
      lunarDate: this.getLunarDate(now),
      zodiacList: zodiacList
    })
  },

  // 根据日期生成当日主色调（传统干支历法）
  calculateDailyWuxing(date) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const dayWuxing = this.getDayWuxing(year, month, day)

    const wuxingMap = {
      metal: WUXING_COLORS.metal,
      wood: WUXING_COLORS.wood,
      water: WUXING_COLORS.water,
      fire: WUXING_COLORS.fire,
      earth: WUXING_COLORS.earth
    }

    return wuxingMap[dayWuxing] || WUXING_COLORS.metal
  },

  // 计算日柱五行（简化版干支历法）
  getDayWuxing(year, month, day) {
    const baseDate = new Date(1900, 0, 1)
    const targetDate = new Date(year, month - 1, day)
    const diffDays = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24))
    const wuxingElements = ['metal', 'wood', 'water', 'fire', 'earth']
    return wuxingElements[diffDays % 5]
  },

  // 生成十二生肖今日推荐颜色
  generateZodiacRecommendations(todayWuxing) {
    const zodiacList = []

    for (let key in ZODIAC_BASE) {
      const zodiac = ZODIAC_BASE[key]
      // 获取该生肖今年的年份天干信息
      const zodiacStem = this.getZodiacYearStem(key)
      const colors = this.calculateZodiacColors(zodiacStem, todayWuxing)

      zodiacList.push({
        name: zodiac.name,
        icon: zodiac.icon,
        colors: colors
      })
    }

    return zodiacList
  },

  // 根据生肖获取今年对应年份的天干信息
  getZodiacYearStem(zodiacKey) {
    const now = new Date()
    const currentYear = now.getFullYear()

    // 找到该生肖今年的年份
    const zodiacIndex = EARTHLY_BRANCHES.indexOf(zodiacKey)
    // 1900年是鼠年（rat），天干为庚（金）
    const baseYear = 1900
    const baseZodiacIndex = 0 // 1900年是鼠年

    // 计算该生肖今年的年份
    let zodiacYear = currentYear
    const currentZodiacIndex = (currentYear - baseYear) % 12
    const diff = (zodiacIndex - currentZodiacIndex + 12) % 12
    zodiacYear = currentYear - diff

    // 计算该年的天干（10年一循环）
    const stemIndex = (zodiacYear - 4) % 10 // 4年是甲子年开始
    return HEAVENLY_STEMS[stemIndex]
  },

  // 计算生肖今日推荐颜色
  calculateZodiacColors(zodiacStem, todayWuxing) {
    const todayKey = todayWuxing.hex === '#4CAF50' ? 'wood' :
                     todayWuxing.hex === '#FF6B6B' ? 'fire' :
                     todayWuxing.hex === '#D4A574' ? 'earth' :
                     todayWuxing.hex === '#E8E8E8' ? 'metal' : 'water'

    const colorMap = { wood: '绿', fire: '红', earth: '黄', metal: '白', water: '黑' }

    let recommendedColors = []

    // 1. 本命色（生肖年份天干对应的颜色，如甲=绿、乙=青、丙=红、丁=粉）
    recommendedColors.push(zodiacStem.color)

    // 2. 今日五行颜色（如果与本命色不同则添加）
    const todayColor = colorMap[todayKey]
    if (todayColor !== zodiacStem.color) {
      recommendedColors.push(todayColor)
    }

    // 3. 相生色（生助生肖五行的元素对应的颜色）
    const generatingElement = Object.keys(GENERATING_CYCLE).find(key =>
      GENERATING_CYCLE[key] === zodiacStem.element
    )
    if (generatingElement) {
      const genColor = colorMap[generatingElement]
      if (!recommendedColors.includes(genColor)) {
        recommendedColors.push(genColor)
      }
    }

    return recommendedColors.join('、')
  },

  async goToMyColor() {
    try {
      const userInfoResult = await app.getUserInfo()

      if (userInfoResult.success && userInfoResult.data.birthday) {
        // 已填写生日，显示自定义加载遮罩
        this.setData({ showLoading: true })

        try {
          await app.checkAndUpdateAestheticData(true)
          this.setData({ showLoading: false })
          wx.navigateTo({
            url: '/pages/my-color/my-color'
          })
        } catch (err) {
          this.setData({ showLoading: false })
          wx.showToast({
            title: '生成失败，请重试',
            icon: 'none'
          })
        }
      } else {
        // 未填写生日，提示去"我的"页面设置
        wx.showModal({
          title: '提示',
          content: '您还没有记录生日信息，请先在"我的"页面设置生日获取专属分析',
          confirmText: '去设置',
          confirmColor: '#2E58EB',
          success: (res) => {
            if (res.confirm) {
              wx.switchTab({
                url: '/pages/profile/profile'
              })
            }
          }
        })
      }
    } catch (err) {
      wx.showToast({
        title: '检查失败，请重试',
        icon: 'none'
      })
    }
  },

  cancelLoading() {
    this.setData({ showLoading: false })
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '5行穿衣搭配指南 - 今日穿搭推荐',
      path: '/pages/index/index',
      imageUrl: ''
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '5行穿衣搭配指南 - 今日穿搭推荐',
      query: '',
      imageUrl: ''
    }
  },

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
