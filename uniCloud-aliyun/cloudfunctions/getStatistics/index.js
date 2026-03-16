'use strict';

const db = uniCloud.database()
const dbCmd = db.command

exports.main = async (event, context) => {
	const { role, community } = event
	
	try {
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		const tomorrow = new Date(today)
		tomorrow.setDate(tomorrow.getDate() + 1)
		
		let baseQuery = db.collection('disputes')
		
		// 根据角色过滤
		if (role === '社区') {
			baseQuery = baseQuery.where({
				assign_community: community
			})
		}
		
		// 今日新增
		const todayNewRes = await baseQuery
			.where({
				create_time: dbCmd.gte(today).and(dbCmd.lt(tomorrow))
			})
			.count()
		
		// 待分派（街道）
		const pendingAssignRes = await db.collection('disputes')
			.where({
				status: '待分派'
			})
			.count()
		
		// 待回访（社区）
		const pendingVisitRes = await baseQuery
			.where({
				status: '待回访'
			})
			.count()
		
		// 已化解
		const resolvedRes = await baseQuery
			.where({
				status: '已化解'
			})
			.count()
		
		// 总数
			const totalRes = await baseQuery.count()
			
			// 化解率
			const resolveRate = totalRes.total > 0 
				? ((resolvedRes.total / totalRes.total) * 100).toFixed(1) 
				: '0.0'
			
			// 用户数（仅管理员需要）
			let userCount = 0
			if (role === '管理员') {
				const userRes = await db.collection('users').count()
				userCount = userRes.total
			}
			
			return {
				success: true,
				data: {
					todayNew: todayNewRes.total,
					pendingAssign: pendingAssignRes.total,
					pendingVisit: pendingVisitRes.total,
					resolved: resolvedRes.total,
					totalCount: totalRes.total,
					resolveRate: resolveRate,
					userCount: userCount
				}
			}
	} catch (e) {
		console.error('获取统计失败', e)
		return {
			success: false,
			error: e.message
		}
	}
}
