'use strict';

const db = uniCloud.database()
const dbCmd = db.command
const { DISPUTE_STATUS, USER_ROLES, hasRole } = require('../common/app-constants')

exports.main = async (event, context) => {
	const { disputeId, feedbackData, userInfo } = event
	const requestOpenid = context.OPENID || context.openid || userInfo?.openid
	
	try {
		const [userRes, disputeRes] = await Promise.all([
			db.collection('users').where({
				openid: requestOpenid
			}).get(),
			db.collection('disputes').doc(disputeId).get()
		])

		if (userRes.data.length === 0 || !hasRole(userRes.data[0], USER_ROLES.COMMUNITY)) {
			return {
				success: false,
				error: '权限不足'
			}
		}

		if (disputeRes.data.length === 0) {
			return {
				success: false,
				error: '纠纷不存在'
			}
		}

		const dispute = disputeRes.data[0]
		if (userRes.data[0].community && dispute.assign_community && userRes.data[0].community !== dispute.assign_community) {
			return {
				success: false,
				error: '只能处理所属社区的纠纷'
			}
		}

		// 创建回访记录
		const feedback = {
			dispute_id: disputeId,
			type: feedbackData.type,
			method: feedbackData.method,
			result: feedbackData.result,
			notes: feedbackData.notes,
			media: feedbackData.media || [],
			next_date: feedbackData.next_date ? new Date(feedbackData.next_date) : null,
			feedback_user: requestOpenid,
			feedback_time: new Date()
		}
		
		// 确定新状态
		let newStatus = DISPUTE_STATUS.PROCESSING
		if (feedbackData.result === DISPUTE_STATUS.RESOLVED) {
			newStatus = DISPUTE_STATUS.RESOLVED
		} else if (feedbackData.next_date) {
			newStatus = DISPUTE_STATUS.PENDING_VISIT
		}
		
		// 并行执行：添加反馈、更新状态、记录日志
		const [addRes, updateRes, logRes] = await Promise.all([
			db.collection('feedbacks').add(feedback),
			db.collection('disputes').doc(disputeId).update({
				status: newStatus
			}),
			db.collection('logs').add({
				entity_id: disputeId,
				entity_type: 'feedback',
				action: 'feedback',
				user_id: requestOpenid,
				user_name: userRes.data[0].name || userInfo?.name || '',
				details: {
					result: feedbackData.result,
					type: feedbackData.type
				},
				timestamp: new Date()
			})
		])
		
		// 返回新创建的反馈记录和更新后的状态，避免前端重新加载
		const newFeedback = {
			_id: addRes.id,
			...feedback
		}
		
		return {
			success: true,
			feedbackId: addRes.id,
			data: {
				feedback: newFeedback,
				dispute: {
					status: newStatus
				}
			}
		}
	} catch (e) {
		console.error('提交回访失败', e)
		return {
			success: false,
			error: e.message
		}
	}
}
