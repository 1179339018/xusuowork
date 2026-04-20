'use strict';

const db = uniCloud.database()
const { getWxConfig } = require('../common/wechat-config')

exports.main = async (event, context) => {
	const { code, phone } = event
	
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
		
		// 如果有手机号，说明是绑定流程
		if (phone) {
			// 1. 检查该手机号是否已存在
			const phoneUserRes = await db.collection('users').where({
				phone: phone
			}).get()
			
			if (phoneUserRes.data.length === 0) {
				return {
					success: false,
					error: '该手机号未在系统中注册，请联系管理员添加'
				}
			}
			
			const existingUser = phoneUserRes.data[0]
			
			// 2. 检查该手机号是否已被其他微信绑定
			if (existingUser.openid && existingUser.openid !== openid) {
				return {
					success: false,
					error: '该手机号已被其他微信绑定'
				}
			}
			
			// 3. 检查该微信是否已绑定其他手机号
			const openidUserRes = await db.collection('users').where({
				openid: openid
			}).get()
			
			if (openidUserRes.data.length > 0) {
				const openidUser = openidUserRes.data[0]
				if (openidUser.phone && openidUser.phone !== phone) {
					return {
						success: false,
						error: '该微信已绑定其他手机号'
					}
				}
				
				// 如果该微信记录就是手机号记录（已绑定），直接登录
				if (openidUser._id === existingUser._id) {
					return {
						success: true,
						userInfo: {
							_id: existingUser._id,
							openid: existingUser.openid,
							name: existingUser.name,
							phone: existingUser.phone,
							role: existingUser.role,
							authorized_roles: existingUser.authorized_roles || [existingUser.role],
							community: existingUser.community,
							avatar: existingUser.avatar
						}
					}
				}
				
				// 删除旧的微信记录（未绑定手机号的）
				await db.collection('users').doc(openidUser._id).remove()
			}
			
			// 4. 更新手机号记录，绑定openid
			await db.collection('users').doc(existingUser._id).update({
				openid: openid,
				update_time: Date.now()
			})
			
			return {
				success: true,
				userInfo: {
					_id: existingUser._id,
					openid: openid,
					name: existingUser.name,
					phone: existingUser.phone,
					role: existingUser.role,
					authorized_roles: existingUser.authorized_roles || [existingUser.role],
					community: existingUser.community,
					avatar: existingUser.avatar
				}
			}
		} else {
			// 没有手机号，只是检查微信是否已绑定
			const userRes = await db.collection('users').where({
				openid: openid
			}).get()
			
			if (userRes.data.length > 0 && userRes.data[0].phone) {
				// 已绑定，返回用户信息
				const user = userRes.data[0]
				return {
					success: true,
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
			
			return {
				success: false,
				error: '请先绑定手机号'
			}
		}
		
	} catch (e) {
		console.error('登录系统异常', e)
		return {
			success: false,
			error: e.message
		}
	}
}
