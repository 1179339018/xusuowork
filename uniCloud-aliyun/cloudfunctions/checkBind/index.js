'use strict';

const db = uniCloud.database()
const { getWxConfig } = require('../common/wechat-config')

exports.main = async (event, context) => {
	const { code } = event
	
	if (!code) {
		return {
			success: false,
			error: '缺少code参数'
		}
	}
	
	try {
		const wxConfig = getWxConfig()
		// 调用微信接口获取 openid
		const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${wxConfig.appid}&secret=${wxConfig.secret}&js_code=${code}&grant_type=authorization_code`
		const res = await uniCloud.httpclient.request(url, {
			dataType: 'json'
		})
		
		if (res.status !== 200 || res.data.errcode) {
			console.error('微信登录失败', res.data)
			return {
				success: false,
				error: res.data.errmsg || '微信登录失败'
			}
		}
		
		const openid = res.data.openid
		
		// 查询该openid是否已绑定手机号
		const userRes = await db.collection('users').where({
			openid: openid
		}).get()
		
		if (userRes.data.length > 0) {
			const user = userRes.data[0]
			// 检查是否有手机号（已绑定）
			if (user.phone) {
				return {
					success: true,
					isBound: true,
					userInfo: {
						_id: user._id,
						openid: user.openid,
						name: user.name,
						phone: user.phone,
						role: user.role,
						authorized_roles: user.authorized_roles || [user.role],
						community: user.community,
						avatar: user.avatar
					}
				}
			}
		}
		
		// 未绑定
		return {
			success: true,
			isBound: false
		}
		
	} catch (e) {
		console.error('检查绑定状态异常', e)
		return {
			success: false,
			error: e.message
		}
	}
}
