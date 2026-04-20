'use strict';

const db = uniCloud.database()
const dbCmd = db.command
const { USER_ROLES } = require('../common/app-constants')

exports.main = async (event, context) => {
	const {
		role,
		openid,
		community,
		communityFilter,
		status,
		urgency,
		keyword,
		startDate,
		endDate,
		lite = false,
		page = 1,
		pageSize = 10
	} = event

	try {
		const currentPage = Math.max(Number(page) || 1, 1)
		const currentPageSize = Math.min(Math.max(Number(pageSize) || 10, 1), 50)

		let query = db.collection('disputes')
		const filters = []

		if (role === USER_ROLES.POLICE && openid) {
			filters.push({
				create_user: openid
			})
		}

		if (role === USER_ROLES.COMMUNITY && community) {
			filters.push({
				assign_community: community
			})
		}

		if (status && status !== '全部') {
			filters.push({
				status
			})
		}

		if (communityFilter && communityFilter !== '全部') {
			filters.push(dbCmd.or([
				{ community: communityFilter },
				{ assign_community: communityFilter }
			]))
		}

		if (urgency) {
			filters.push({
				urgency
			})
		}

		if (keyword) {
			filters.push(dbCmd.or([
				{ title: new RegExp(keyword, 'i') },
				{ description: new RegExp(keyword, 'i') },
				{ parties: new RegExp(keyword, 'i') }
			]))
		}

		if (startDate || endDate) {
			const dateFilter = {}
			if (startDate) {
				dateFilter.create_time = dbCmd.gte(new Date(startDate))
			}

			if (endDate) {
				const end = new Date(endDate)
				end.setHours(23, 59, 59, 999)
				dateFilter.create_time = dateFilter.create_time
					? dateFilter.create_time.and(dbCmd.lte(end))
					: dbCmd.lte(end)
			}

			filters.push(dateFilter)
		}

		if (filters.length > 0) {
			query = query.where(filters.length === 1 ? filters[0] : dbCmd.and(filters))
		}

		if (lite) {
			query = query.field({
				title: true,
				source: true,
				status: true,
				urgency: true,
				location: true,
				parties: true,
				occur_count: true,
				create_time: true,
				assign_time: true,
				community: true,
				assign_community: true
			})
		}

		const res = await query
			.orderBy('create_time', 'desc')
			.skip((currentPage - 1) * currentPageSize)
			.limit(currentPageSize + 1)
			.get()

		const rows = res.data || []
		const hasMore = rows.length > currentPageSize
		const data = hasMore ? rows.slice(0, currentPageSize) : rows

		let total = 0
		if (event.needTotal !== false) {
			const countRes = await query.count()
			total = countRes.total || 0
		}

		return {
			success: true,
			data,
			total,
			hasMore
		}
	} catch (e) {
		console.error('获取列表失败', e)
		return {
			success: false,
			error: e.message,
			data: [],
			total: 0,
			hasMore: false
		}
	}
}
