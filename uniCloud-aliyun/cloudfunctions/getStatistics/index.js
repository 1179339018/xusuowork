'use strict';

const db = uniCloud.database()
const dbCmd = db.command
const { DISPUTE_STATUS, USER_ROLES } = require('../common/app-constants')

exports.main = async (event, context) => {
	const { role, community, openid } = event

	try {
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		const tomorrow = new Date(today)
		tomorrow.setDate(tomorrow.getDate() + 1)

		const baseFilters = []
		if (role === USER_ROLES.COMMUNITY && community) {
			baseFilters.push({
				assign_community: community
			})
		}

		if (role === USER_ROLES.POLICE && openid) {
			baseFilters.push({
				create_user: openid
			})
		}

		const buildQuery = (extraFilter) => {
			const filters = extraFilter ? [...baseFilters, extraFilter] : [...baseFilters]
			if (filters.length === 0) {
				return db.collection('disputes')
			}
			return db.collection('disputes').where(filters.length === 1 ? filters[0] : dbCmd.and(filters))
		}

		const [
			todayNewRes,
			pendingAssignRes,
			pendingVisitRes,
			processingRes,
			resolvedRes,
			totalRes,
			userRes
		] = await Promise.all([
			buildQuery({
				create_time: dbCmd.gte(today).and(dbCmd.lt(tomorrow))
			}).count(),
			buildQuery({
				status: DISPUTE_STATUS.PENDING_ASSIGN
			}).count(),
			buildQuery({
				status: DISPUTE_STATUS.PENDING_VISIT
			}).count(),
			buildQuery({
				status: DISPUTE_STATUS.PROCESSING
			}).count(),
			buildQuery({
				status: DISPUTE_STATUS.RESOLVED
			}).count(),
			buildQuery().count(),
			role === USER_ROLES.ADMIN ? db.collection('users').count() : Promise.resolve({ total: 0 })
		])

		const resolveRate = totalRes.total > 0
			? ((resolvedRes.total / totalRes.total) * 100).toFixed(1)
			: '0.0'

		return {
			success: true,
			data: {
				todayNew: todayNewRes.total,
				pendingAssign: pendingAssignRes.total,
				pendingVisit: pendingVisitRes.total,
				processing: processingRes.total,
				resolved: resolvedRes.total,
				pendingPolice: 0,
				totalCount: totalRes.total,
				resolveRate,
				userCount: userRes.total || 0
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
