'use strict';

const db = uniCloud.database()
const dbCmd = db.command

exports.main = async (event, context) => {
	const { disputeId } = event
	
	try {
		// 并行获取所有数据，提升性能
		const [disputeRes, feedbackRes, logRes] = await Promise.all([
			// 获取纠纷详情
			db.collection('disputes').doc(disputeId).get(),
			// 获取回访记录（限制数量，避免数据过大）
			db.collection('feedbacks')
				.where({
					dispute_id: disputeId
				})
				.orderBy('feedback_time', 'desc')
				.limit(50) // 限制最多50条回访记录
				.get(),
			// 获取操作日志（限制数量）
			db.collection('logs')
				.where({
					entity_id: disputeId
				})
				.orderBy('timestamp', 'desc')
				.limit(100) // 限制最多100条日志
				.get()
		])
		
		if (disputeRes.data.length === 0) {
			return {
				success: false,
				error: '纠纷不存在'
			}
		}
		
		return {
			success: true,
			data: {
				dispute: disputeRes.data[0],
				feedbacks: feedbackRes.data || [],
				logs: logRes.data || []
			}
		}
	} catch (e) {
		console.error('获取详情失败', e)
		return {
			success: false,
			error: e.message
		}
	}
}
