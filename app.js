App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'a137394701-d2gla6y3wfc7b4ab8', // 云环境 ID
        traceUser: true,
      })
    }
    
    // 初始化全局数据
    this.globalData = {
      brandColor: '#2E58EB',
      userInfo: null,
      hasUserInfo: false,
      aestheticData: null, // 今日美学数据（雷达图、色系推荐等）
      lastUpdateDate: null // 上次更新日期
    }
    
    // 启动时加载本地缓存的用户信息
    this.loadLocalUserInfo()
    
    // 检查日期是否更新，如果更新则刷新美学数据
    this.checkAndUpdateAestheticData()
  },
  
  // 加载本地缓存的用户信息
  loadLocalUserInfo() {
    try {
      const userInfo = wx.getStorageSync('userProfile')
      if (userInfo && userInfo.birthday) {
        console.log('✅ 从本地缓存加载用户信息:', userInfo)
        this.globalData.userInfo = userInfo
        this.globalData.hasUserInfo = true
      }
    } catch (err) {
      console.log('本地缓存无用户信息')
    }
  },
  
  // 保存用户信息到本地缓存和云数据库
  async saveUserInfo(userInfo) {
    try {
      // 1. 保存到本地缓存（持久化）
      wx.setStorageSync('userProfile', userInfo)
      console.log('✅ 用户信息已保存到本地缓存')
      
      // 2. 更新全局数据
      this.globalData.userInfo = userInfo
      this.globalData.hasUserInfo = true
      
      // 3. 保存到云数据库
      const db = wx.cloud.database()
      
      // 先尝试创建集合（如果不存在）
      try {
        await db.createCollection('users')
        console.log('users 集合已创建')
      } catch (createErr) {
        // 如果集合已存在，会报错，忽略
        if (createErr.errCode !== -502005) {
          throw createErr
        }
        console.log('users 集合已存在')
      }
      
      const _ = db.command
      
      // 检查是否已存在用户记录
      const userRecord = await db.collection('users').where({
        openid: userInfo.openid
      }).get()
      
      if (userRecord.data.length > 0) {
        // 更新现有记录
        await db.collection('users').doc(userRecord.data[0]._id).update({
          data: {
            ...userInfo,
            updatedAt: db.serverDate()
          }
        })
      } else {
        // 创建新记录
        await db.collection('users').add({
          data: {
            ...userInfo,
            createdAt: db.serverDate(),
            updatedAt: db.serverDate()
          }
        })
      }
      
      // 4. 立即生成今日美学数据
      await this.refreshAestheticData()
      
      return { success: true }
    } catch (err) {
      console.error('保存用户信息失败', err)
      return { success: false, error: err }
    }
  },
  
  // 获取用户信息（优先从全局/本地缓存，其次从云数据库）
  async getUserInfo() {
    try {
      console.log('=== 开始获取用户信息 ===')
      
      // 1. 优先从全局数据获取
      if (this.globalData.userInfo && this.globalData.userInfo.birthday) {
        console.log('✅ 从全局数据获取用户信息')
        return { success: true, data: this.globalData.userInfo }
      }
      
      // 2. 从本地缓存获取
      const localInfo = wx.getStorageSync('userProfile')
      if (localInfo && localInfo.birthday) {
        console.log('✅ 从本地缓存获取用户信息')
        this.globalData.userInfo = localInfo
        this.globalData.hasUserInfo = true
        return { success: true, data: localInfo }
      }
      
      // 3. 从云数据库获取
      const res = await wx.cloud.callFunction({
        name: 'userManager',
        data: { action: 'get' }
      })
      
      console.log('云函数返回结果:', res)
      
      if (res.result && res.result.success && res.result.data) {
        const userInfo = res.result.data
        console.log('✅ 从云数据库获取到用户信息:', userInfo)
        this.globalData.userInfo = userInfo
        this.globalData.hasUserInfo = true
        
        // 同步到本地缓存
        wx.setStorageSync('userProfile', userInfo)
        
        return { success: true, data: userInfo }
      } else {
        console.log('❌ 未找到用户信息')
        this.globalData.hasUserInfo = false
        return { success: false, message: '未找到用户信息' }
      }
    } catch (err) {
      console.error('❌ 获取用户信息失败', err)
      this.globalData.hasUserInfo = false
      return { success: false, error: err }
    }
  },
  
  // 检查日期是否更新，如果更新则刷新美学数据
  async checkAndUpdateAestheticData(forceRefresh = false) {
    const today = this.getTodayString()
    const lastDate = this.globalData.lastUpdateDate
    
    console.log('检查日期更新:', { today, lastDate, forceRefresh })
    
    // 如果日期不同，或者还没有美学数据，或者强制刷新，则刷新
    if (today !== lastDate || !this.globalData.aestheticData || forceRefresh) {
      console.log(' 日期已更新或强制刷新，开始刷新美学数据...')
      await this.refreshAestheticData()
    } else {
      console.log('✅ 日期未更新，使用缓存的美学数据')
    }
  },
  
  // 刷新美学数据（调用云函数生成今日推荐）
  async refreshAestheticData() {
    try {
      // 获取用户信息
      const userInfoResult = await this.getUserInfo()
      
      if (!userInfoResult.success || !userInfoResult.data.birthday) {
        console.log('️ 用户未输入生日，无法生成美学数据')
        return { success: false, message: '用户未输入生日' }
      }
      
      const birthday = userInfoResult.data.birthday
      const today = this.getTodayString()
      
      console.log('开始生成美学数据:', { birthday, today })
      
      // 调用云函数生成美学数据
      const result = await wx.cloud.callFunction({
        name: 'generateOOTD',
        data: {
          birthday: birthday,
          currentDate: today
        }
      })
      
      if (result.result && result.result.success) {
        const aestheticData = result.result.data
        
        // 保存到全局数据
        this.globalData.aestheticData = aestheticData
        this.globalData.lastUpdateDate = today
        
        // 保存到本地缓存
        wx.setStorageSync('aestheticData', aestheticData)
        wx.setStorageSync('lastUpdateDate', today)
        
        console.log('✅ 美学数据已更新并缓存')
        return { success: true, data: aestheticData }
      } else {
        console.error('❌ 云函数返回失败:', result.result)
        return { success: false, message: '云函数返回失败' }
      }
    } catch (err) {
      console.error('❌ 刷新美学数据失败:', err)
      return { success: false, error: err }
    }
  },
  
  // 获取本地缓存的美学数据
  getCachedAestheticData() {
    try {
      const cachedData = wx.getStorageSync('aestheticData')
      const cachedDate = wx.getStorageSync('lastUpdateDate')
      const today = this.getTodayString()
      
      // 如果缓存日期是今天，返回缓存数据
      if (cachedData && cachedDate === today) {
        console.log('✅ 使用缓存的美学数据')
        this.globalData.aestheticData = cachedData
        this.globalData.lastUpdateDate = cachedDate
        return cachedData
      }
      
      return null
    } catch (err) {
      console.log('读取缓存美学数据失败')
      return null
    }
  },
  
  // 获取今日日期字符串（YYYY-MM-DD）
  getTodayString() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },
  
  // 清除用户信息
  clearUserInfo() {
    this.globalData.userInfo = null
    this.globalData.hasUserInfo = false
    this.globalData.aestheticData = null
    this.globalData.lastUpdateDate = null
    
    // 清除本地缓存
    wx.removeStorageSync('userProfile')
    wx.removeStorageSync('aestheticData')
    wx.removeStorageSync('lastUpdateDate')
  }
})
