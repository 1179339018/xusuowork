'use strict'

const { db, dbCmd, getCurrentUserFromEvent, buildDisputeScopeFilters, isAdmin } = require('auth-helper')
const { DISPUTE_STATUS } = require('app-constants')

exports.main = async (event, context) => {
  try {
    const auth = await getCurrentUserFromEvent(event, context)
    if (!auth.success) return auth

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const baseFilters = buildDisputeScopeFilters(auth.user)

    const buildQuery = (extraFilters = []) => {
      const filters = [...baseFilters, ...extraFilters.filter(Boolean)]
      if (filters.length === 0) return db.collection('disputes')
      return db.collection('disputes').where(filters.length === 1 ? filters[0] : dbCmd.and(filters))
    }

    const [todayNewRes, pendingAssignRes, pendingVisitRes, processingRes, resolvedRes, totalRes, userRes] = await Promise.all([
      buildQuery([{ create_time: dbCmd.gte(today) }, { create_time: dbCmd.lt(tomorrow) }]).count(),
      buildQuery([{ status: DISPUTE_STATUS.PENDING_ASSIGN }]).count(),
      buildQuery([{ status: DISPUTE_STATUS.PENDING_VISIT }]).count(),
      buildQuery([{ status: DISPUTE_STATUS.PROCESSING }]).count(),
      buildQuery([{ status: DISPUTE_STATUS.RESOLVED }]).count(),
      buildQuery().count(),
      isAdmin(auth.user) ? db.collection('users').count() : Promise.resolve({ total: 0 })
    ])

    const resolveRate = totalRes.total > 0 ? ((resolvedRes.total / totalRes.total) * 100).toFixed(1) : '0.0'
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
    console.error('getStatistics failed', e)
    return { success: false, error: '获取统计失败' }
  }
}
