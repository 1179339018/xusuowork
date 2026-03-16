'use strict';

const db = uniCloud.database()
const dbCmd = db.command

exports.main = async (event, context) => {
	const { disputeId, communityId, remark, userInfo } = event

	// 输入验证
	if (!disputeId || !communityId || !userInfo || !userInfo.openid) {
		return {
			success: false,
			error: '缺少必要参数'
		}
	}

	try {
		// 检查用户权限
		const userRes = await db.collection('users').where({
			openid: userInfo.openid
		}).get()

		if (userRes.data.length === 0 || userRes.data[0].role !== 'street') {
			return {
				success: false,
				error: '权限不足'
			}
		}

		// 检查纠纷是否存在
		const disputeRes = await db.collection('disputes').doc(disputeId).get()
		if (disputeRes.data.length === 0) {
			return {
				success: false,
				error: '纠纷不存在'
			}
		}

		// 更新纠纷状态
		await db.collection('disputes').doc(disputeId).update({
			status: '待回访',
			assign_community: communityId,
			assign_time: new Date()
		})

		// 创建分派记录
		await db.collection('assignments').add({
			dispute_id: disputeId,
			community_id: communityId,
			assign_user: userInfo.openid,
			remark: remark || '',
			assign_time: new Date()
		})

		// 记录日志
		await db.collection('logs').add({
			entity_id: disputeId,
			entity_type: 'assignment',
			action: 'assign',
			user_id: userInfo.openid,
			user_name: userInfo.name,
			details: {
				community_id: communityId,
				remark: remark
			},
			timestamp: new Date()
		})

		// TODO: 发送模板消息通知社区

		return {
			success: true
		}
	} catch (e) {
		console.error('分派失败', e)
		return {
			success: false,
			error: e.message
		}
	}
}
