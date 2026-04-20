'use strict';

const db = uniCloud.database()
const dbCmd = db.command
const { DISPUTE_STATUS } = require('../common/app-constants')

exports.main = async (event, context) => {
	const { disputeData, userInfo } = event
	const requestOpenid = context.OPENID || context.openid || userInfo?.openid

	if (!requestOpenid) {
		return {
			success: false,
			error: '未获取到登录身份，请重新登录后再试'
		}
	}
	
	try {
		// 创建纠纷记录
		const dispute = {
			source: disputeData.source,
			title: disputeData.title,
			description: disputeData.description,
			community: disputeData.community || '',
			location: disputeData.location,
			parties: disputeData.parties,
			urgency: disputeData.urgency,
			status: DISPUTE_STATUS.PENDING_ASSIGN,
			occur_count: disputeData.occur_count || 1,
			create_user: requestOpenid || '',
			create_time: new Date()
		}
		
		const addRes = await db.collection('disputes').add(dispute)
		
		// 记录日志
		await db.collection('logs').add({
			entity_id: addRes.id,
			entity_type: 'dispute',
			action: 'create',
			user_id: requestOpenid || '',
			user_name: userInfo?.name || '',
			details: {
				source: disputeData.source,
				title: disputeData.title
			},
			timestamp: new Date()
		})
		
		return {
			success: true,
			disputeId: addRes.id
		}
	} catch (e) {
		console.error('推送失败', e)
		return {
			success: false,
			error: e.message
		}
	}
}
