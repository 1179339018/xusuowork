'use strict'

const db = uniCloud.database()
const { getWxConfig } = require('wx-config')
const { createSessionToken } = require('session-helper')

async function buildUserInfo(user, openid = user.openid) {
  const session = createSessionToken()
  await db.collection('users').doc(user._id).update({
    session_token: session.token,
    session_expire: session.expireAt,
    last_login_time: Date.now()
  })

  return {
    _id: user._id,
    openid,
    name: user.name,
    phone: user.phone,
    role: user.role,
    authorized_roles: user.authorized_roles || [user.role],
    community: user.community,
    avatar: user.avatar,
    sessionToken: session.token
  }
}

async function getOpenidByCode(code) {
  const wxConfig = getWxConfig()
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${wxConfig.appid}&secret=${wxConfig.secret}&js_code=${code}&grant_type=authorization_code`
  const res = await uniCloud.httpclient.request(url, { dataType: 'json' })

  if (res.status !== 200 || res.data.errcode || !res.data.openid) {
    console.error('wechat login failed', res.data)
    throw new Error(res.data.errmsg || '微信登录失败')
  }

  return res.data.openid
}

exports.main = async (event) => {
  const { code, phone } = event
  if (!code) return { success: false, error: '缺少 code 参数' }

  try {
    const openid = await getOpenidByCode(code)

    if (phone) {
      const phoneUserRes = await db.collection('users').where({ phone }).limit(1).get()
      const existingUser = phoneUserRes.data && phoneUserRes.data[0]
      if (!existingUser) return { success: false, error: '该手机号未在系统中注册，请联系管理员添加' }
      if (existingUser.openid && existingUser.openid !== openid) return { success: false, error: '该手机号已被其他微信绑定' }

      const openidUserRes = await db.collection('users').where({ openid }).limit(1).get()
      const openidUser = openidUserRes.data && openidUserRes.data[0]

      if (openidUser) {
        if (openidUser.phone && openidUser.phone !== phone) return { success: false, error: '该微信已绑定其他手机号' }
        if (openidUser._id === existingUser._id) return { success: true, userInfo: await buildUserInfo(existingUser, existingUser.openid) }
        await db.collection('users').doc(openidUser._id).remove()
      }

      await db.collection('users').doc(existingUser._id).update({
        openid,
        update_time: Date.now()
      })

      return { success: true, userInfo: await buildUserInfo(existingUser, openid) }
    }

    const userRes = await db.collection('users').where({ openid }).limit(1).get()
    const user = userRes.data && userRes.data[0]
    if (user && user.phone) return { success: true, userInfo: await buildUserInfo(user, user.openid) }

    return { success: false, error: '请先绑定手机号' }
  } catch (e) {
    console.error('login failed', e)
    return { success: false, error: e.message || '登录失败' }
  }
}
