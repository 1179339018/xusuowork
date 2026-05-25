'use strict'

const db = uniCloud.database()
const { getWxConfig } = require('wx-config')
const { createSessionToken } = require('session-helper')

async function buildUserInfo(user) {
  const session = createSessionToken()
  await db.collection('users').doc(user._id).update({
    session_token: session.token,
    session_expire: session.expireAt,
    last_login_time: Date.now()
  })

  return {
    _id: user._id,
    openid: user.openid,
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
    console.error('wechat checkBind failed', res.data)
    throw new Error(res.data.errmsg || '微信登录失败')
  }

  return res.data.openid
}

exports.main = async (event) => {
  const { code } = event
  if (!code) return { success: false, error: '缺少 code 参数' }

  try {
    const openid = await getOpenidByCode(code)
    const userRes = await db.collection('users').where({ openid }).limit(1).get()
    const user = userRes.data && userRes.data[0]

    if (user && user.phone) {
      return {
        success: true,
        isBound: true,
        userInfo: await buildUserInfo(user)
      }
    }

    return { success: true, isBound: false }
  } catch (e) {
    console.error('checkBind failed', e)
    return { success: false, error: e.message || '检查绑定状态失败' }
  }
}
