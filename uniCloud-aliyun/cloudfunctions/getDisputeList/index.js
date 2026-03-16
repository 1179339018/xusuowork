'use strict';

const db = uniCloud.database()
const dbCmd = db.command

exports.main = async (event, context) => {
	const { 
		role, 
		community, 
		status, 
		keyword, 
		startDate, 
		endDate,
		page = 1,
		pageSize = 10
	} = event
	
	try {
		let query = db.collection('disputes')
		
		// 根据角色过滤
		if (role === '社区') {
			query = query.where({
				assign_community: community
			})
		}
		
		// 状态过滤
		if (status && status !== '全部') {
			query = query.where({
				status: status
			})
		}
		
		// 关键词搜索
		if (keyword) {
			query = query.where(
				dbCmd.or([
					{ title: new RegExp(keyword, 'i') },
					{ description: new RegExp(keyword, 'i') },
					{ parties: new RegExp(keyword, 'i') }
				])
			)
		}
		
		// 日期范围
		if (startDate && endDate) {
			query = query.where({
				create_time: dbCmd.gte(new Date(startDate)).and(dbCmd.lte(new Date(endDate)))
			})
		}
		
		// 排序和分页
		const res = await query
			.orderBy('create_time', 'desc')
			.skip((page - 1) * pageSize)
			.limit(pageSize)
			.get()
		
		// 只有在需要总数时才查询（首页最近列表不需要总数）
		let total = 0
		if (event.needTotal !== false) {
			const countRes = await query.count()
			total = countRes.total || 0
		}
		
		return {
			success: true,
			data: res.data,
			total: total,
			hasMore: res.data.length === pageSize
		}
	} catch (e) {
		console.error('获取列表失败', e)
		return {
			success: false,
			error: e.message,
			data: [],
			total: 0
		}
	}
}
