// cloudfunctions/userManager/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action, data } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    switch (action) {
      case 'save': {
        // 保存用户信息
        const userRecord = await db.collection('users').where({
          openid: openid
        }).get()

        if (userRecord.data.length > 0) {
          // 更新
          await db.collection('users').doc(userRecord.data[0]._id).update({
            data: {
              ...data,
              openid: openid,
              updatedAt: db.serverDate()
            }
          })
          return {
            success: true,
            message: '用户信息已更新',
            action: 'update'
          }
        } else {
          // 新增
          await db.collection('users').add({
            data: {
              ...data,
              openid: openid,
              createdAt: db.serverDate(),
              updatedAt: db.serverDate()
            }
          })
          return {
            success: true,
            message: '用户信息已保存',
            action: 'create'
          }
        }
      }

      case 'get': {
        // 获取用户信息
        try {
          const userRecord = await db.collection('users').where({
            openid: openid
          }).get()

          if (userRecord.data.length > 0) {
            return {
              success: true,
              data: userRecord.data[0]
            }
          } else {
            return {
              success: false,
              message: '未找到用户信息'
            }
          }
        } catch (dbErr) {
          // 如果集合不存在，先创建
          if (dbErr.errCode === -502005 || (dbErr.code && dbErr.code.includes('DATABASE_COLLECTION_NOT_EXIST'))) {
            try {
              await db.createCollection('users')
              console.log('users 集合已创建')
              // 创建后返回空结果
              return {
                success: false,
                message: '未找到用户信息'
              }
            } catch (createErr) {
              console.error('创建集合失败:', createErr)
              return {
                success: false,
                error: '数据库初始化失败'
              }
            }
          }
          throw dbErr
        }
      }

      case 'delete': {
        // 删除用户信息
        const userRecord = await db.collection('users').where({
          openid: openid
        }).get()

        if (userRecord.data.length > 0) {
          await db.collection('users').doc(userRecord.data[0]._id).remove()
          return {
            success: true,
            message: '用户信息已删除'
          }
        }
        return {
          success: false,
          message: '未找到用户信息'
        }
      }

      default:
        return {
          success: false,
          message: '未知操作'
        }
    }
  } catch (err) {
    console.error('用户管理错误:', err)
    return {
      success: false,
      error: err.message
    }
  }
}
