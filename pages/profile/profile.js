const app = getApp()

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    cacheSize: '0KB',
    maxDate: ''
  },

  onShow() {
    this.initMaxDate()
    this.loadUserInfo()
    this.calculateCacheSize()
  },

  // 初始化最大日期
  initMaxDate() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    this.setData({
      maxDate: `${year}-${month}-${day}`
    })
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = app.globalData.userInfo

    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        isLoggedIn: true
      })
    } else {
      this.setData({
        userInfo: null,
        isLoggedIn: false
      })
    }
  },

  // 计算缓存大小
  calculateCacheSize() {
    try {
      const info = wx.getStorageInfoSync()
      const sizeKB = Math.round(info.currentSize / 1024 * 100) / 100
      this.setData({
        cacheSize: `${sizeKB}KB`
      })
    } catch (err) {
      this.setData({
        cacheSize: '0KB'
      })
    }
  },

  // 处理登录
  async handleLogin() {
    try {
      const userProfile = await wx.getUserProfile({
        desc: '用于完善用户资料',
        lang: 'zh_CN'
      })

      const userInfo = {
        avatarUrl: userProfile.userInfo.avatarUrl,
        nickName: userProfile.userInfo.nickName,
        gender: userProfile.userInfo.gender,
        birthday: ''
      }

      // 如果已有生日信息，保留
      const cachedProfile = wx.getStorageSync('userProfile')
      if (cachedProfile && cachedProfile.birthday) {
        userInfo.birthday = cachedProfile.birthday
      }

      // 保存到全局数据
      app.globalData.userInfo = userInfo
      app.globalData.hasUserInfo = true

      // 保存到本地缓存
      wx.setStorageSync('userProfile', userInfo)

      this.setData({
        userInfo: userInfo,
        isLoggedIn: true
      })

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })
    } catch (err) {
      console.log('用户取消授权')
    }
  },

  // 生日选择器变化
  onBirthdayChange(e) {
    const newBirthday = e.detail.value
    
    if (!newBirthday) return

    // 直接保存并跳转
    this.saveNewBirthday(newBirthday)
  },

  // 保存新生日
  async saveNewBirthday(newBirthday) {
    wx.showLoading({ title: '更新中...' })

    try {
      // 1. 更新本地缓存
      const userInfo = wx.getStorageSync('userProfile') || {}
      userInfo.birthday = newBirthday
      wx.setStorageSync('userProfile', userInfo)

      // 2. 更新全局数据
      if (app.globalData.userInfo) {
        app.globalData.userInfo.birthday = newBirthday
      } else {
        app.globalData.userInfo = { birthday: newBirthday }
      }

      // 3. 清除旧的美学数据
      wx.removeStorageSync('aestheticData')
      wx.removeStorageSync('lastUpdateDate')
      app.globalData.aestheticData = null
      app.globalData.lastUpdateDate = null
      
      // 清除灵感页面的缓存数据
      wx.removeStorageSync('inspirationColorData')

      // 4. 更新云数据库
      await wx.cloud.callFunction({
        name: 'userManager',
        data: {
          action: 'save',
          data: { birthday: newBirthday }
        }
      })

      wx.hideLoading()

      wx.showToast({
        title: '修改成功',
        icon: 'success'
      })

      // 5. 跳转到灵感页面，灵感页面会自动生成新数据
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/inspiration/inspiration'
        })
      }, 1500)
    } catch (err) {
      wx.hideLoading()
      console.error('保存新生日失败:', err)
      wx.showToast({
        title: '修改失败，请重试',
        icon: 'none'
      })
    }
  },

  // 关于我们
  handleAbout() {
    wx.showModal({
      title: '关于5行穿衣搭配指南',
      content: '基于传统色彩美学理论的每日穿搭建议工具。\n\n通过视觉维度分析，为您提供个性化的色彩搭配方案，帮助您打造更和谐的个人形象。',
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#2E58EB'
    })
  },

  // 意见反馈
  handleFeedback() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 清除缓存
  handleClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？包括用户信息和美学推荐。',
      confirmText: '清除',
      confirmColor: '#F44336',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.clearStorageSync()

            // 重置全局数据
            app.globalData.userInfo = null
            app.globalData.hasUserInfo = false
            app.globalData.aestheticData = null
            app.globalData.lastUpdateDate = null

            this.setData({
              userInfo: null,
              isLoggedIn: false,
              cacheSize: '0KB'
            })

            wx.showToast({
              title: '缓存已清除',
              icon: 'success'
            })
          } catch (err) {
            wx.showToast({
              title: '清除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      confirmText: '退出',
      confirmColor: '#F44336',
      success: (res) => {
        if (res.confirm) {
          app.clearUserInfo()

          this.setData({
            userInfo: null,
            isLoggedIn: false
          })

          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
        }
      }
    })
  }
})
