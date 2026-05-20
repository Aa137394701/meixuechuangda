const app = getApp()

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
    currentDate: '',
    currentDay: '',
    lunarDate: '',
    showLoading: false,
    colorGuide: {
      first: { title: '', colors: '', hex: '' },
      secondary: { title: '', colors: '', hex: '' },
      normal: { title: '', colors: '', hex: '' },
      notRecommended: { title: '', colors: '', hex: '' },
      stronglyNotRecommended: { title: '', colors: '', hex: '' }
    }
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

    // 首页仅根据当日五行能量做推荐，不结合用户生日
    const todayWuxing = this.calculateDailyWuxing(now)
    const colorGuide = this.generateColorGuide(todayWuxing)

    const lunarDate = this.getLunarDate(now)

    this.setData({
      currentDate: `${year}年${month}月`,
      currentDay: day,
      lunarDate: lunarDate,
      colorGuide: colorGuide
    })
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
      title: '色彩美学指南 - 今日穿搭推荐',
      path: '/pages/inspiration/inspiration',
      imageUrl: ''
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '色彩美学指南 - 今日穿搭推荐',
      query: '',
      imageUrl: ''
    }
  },

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

  getDayWuxing(year, month, day) {
    const baseDate = new Date(1900, 0, 1)
    const targetDate = new Date(year, month - 1, day)
    const diffDays = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24))
    const wuxingElements = ['metal', 'wood', 'water', 'fire', 'earth']
    return wuxingElements[diffDays % 5]
  },

  generateColorGuide(todayWuxing) {
    const todayKey = todayWuxing.hex === '#4CAF50' ? 'wood' :
                     todayWuxing.hex === '#FF6B6B' ? 'fire' :
                     todayWuxing.hex === '#D4A574' ? 'earth' :
                     todayWuxing.hex === '#E8E8E8' ? 'metal' : 'water'

    // 找到生今天的元素（次选）
    let generating = ''
    for (let key in GENERATING_CYCLE) {
      if (GENERATING_CYCLE[key] === todayKey) {
        generating = key
        break
      }
    }

    // 找到今天生的元素（一般）
    const generated = GENERATING_CYCLE[todayKey]

    // 找到克今天的元素（不建议）
    let controlledBy = ''
    for (let key in CONTROLLING_CYCLE) {
      if (CONTROLLING_CYCLE[key] === todayKey) {
        controlledBy = key
        break
      }
    }

    // 找到今天克的元素（强烈不建议）
    const controlling = CONTROLLING_CYCLE[todayKey]

    return {
      first: {
        title: '首选色系',
        colors: todayWuxing.colors,
        hex: todayWuxing.hex
      },
      secondary: {
        title: '次选色系',
        colors: WUXING_COLORS[generating].colors,
        hex: WUXING_COLORS[generating].hex
      },
      normal: {
        title: '一般色系',
        colors: WUXING_COLORS[generated].colors,
        hex: WUXING_COLORS[generated].hex
      },
      notRecommended: {
        title: '不建议色系',
        colors: WUXING_COLORS[controlledBy].colors,
        hex: WUXING_COLORS[controlledBy].hex
      },
      stronglyNotRecommended: {
        title: '强烈不建议',
        colors: WUXING_COLORS[controlling].colors,
        hex: WUXING_COLORS[controlling].hex
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
