'use strict';

const db = uniCloud.database()
const dbCmd = db.command

exports.main = async (event, context) => {
	const { disputeId, feedbackData, userInfo } = event
	
	try {
		// 创建回访记录
		const feedback = {
			dispute_id: disputeId,
			type: feedbackData.type,
			method: feedbackData.method,
			result: feedbackData.result,
			notes: feedbackData.notes,
			media: feedbackData.media || [],
			next_date: feedbackData.next_date ? new Date(feedbackData.next_date) : null,
			feedback_user: userInfo.openid,
			feedback_time: new Date()
		}
		
		// 确定新状态
		let newStatus = '处理中'
		if (feedbackData.result === '已化解') {
			newStatus = '已化解'
		} else if (feedbackData.next_date) {
			newStatus = '待回访'
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
				user_id: userInfo.openid,
				user_name: userInfo.name,
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
