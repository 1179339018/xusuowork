'use strict';

const db = uniCloud.database()
const dbCmd = db.command

exports.main = async (event, context) => {
	const { disputeData, userInfo } = event
	
	try {
		// 创建纠纷记录
		const dispute = {
			source: disputeData.source,
			title: disputeData.title,
			description: disputeData.description,
			location: disputeData.location,
			parties: disputeData.parties,
			urgency: disputeData.urgency,
			status: '待分派',
			occur_count: disputeData.occur_count || 1,
			create_user: userInfo.openid,
			create_time: new Date()
		}
		
		const addRes = await db.collection('disputes').add(dispute)
		
		// 记录日志
		await db.collection('logs').add({
			entity_id: addRes.id,
			entity_type: 'dispute',
			action: 'create',
			user_id: userInfo.openid,
			user_name: userInfo.name,
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
