'use strict'

const { db, getCurrentUserFromEvent } = require('auth-helper')

exports.main = async (event, context) => {
  const { openid, name, avatar } = event

  try {
    const auth = await getCurrentUserFromEvent(event, context)
    if (!auth.success) return auth
    if (openid && auth.openid !== openid) return { success: false, error: '无权修改其他用户资料' }

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (avatar !== undefined) updateData.avatar = avatar
    if (Object.keys(updateData).length === 0) return { success: false, error: '没有可更新的资料' }

    const result = await db.collection('users').where({ openid: auth.openid }).update(updateData)
    if (result.updated === 0) return { success: false, error: '用户不存在' }

    return { success: true, message: '更新成功' }
  } catch (error) {
    console.error('updateUserInfo failed', error)
    return { success: false, error: '更新失败' }
  }
}
