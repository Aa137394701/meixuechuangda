const app = getApp()

Page({
  data: {
    formattedDate: '',
    lunarDate: '',
    currentDay: ''
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

    this.setData({
      formattedDate: `${year}年${month}月${day}日`,
      currentDay: day,
      lunarDate: this.getLunarDate(now)
    })
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
