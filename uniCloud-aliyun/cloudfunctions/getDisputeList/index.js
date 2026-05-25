'use strict'

const { db, dbCmd, getCurrentUserFromEvent, buildDisputeScopeFilters } = require('auth-helper')

function isAllFilter(value) {
  return !value || value === '全部'
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

exports.main = async (event, context) => {
  const {
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
    const auth = await getCurrentUserFromEvent(event, context)
    if (!auth.success) return { ...auth, data: [], total: 0, hasMore: false }

    const currentPage = Math.max(Number(page) || 1, 1)
    const currentPageSize = Math.min(Math.max(Number(pageSize) || 10, 1), 50)
    const filters = buildDisputeScopeFilters(auth.user)

    if (!isAllFilter(status)) filters.push({ status })
    if (!isAllFilter(communityFilter)) {
      filters.push(dbCmd.or([
        { community: communityFilter },
        { assign_community: communityFilter }
      ]))
    }
    if (urgency) filters.push({ urgency })

    const safeKeyword = String(keyword || '').trim().slice(0, 30)
    if (safeKeyword) {
      const reg = new RegExp(escapeRegExp(safeKeyword), 'i')
      filters.push(dbCmd.or([{ title: reg }, { description: reg }, { parties: reg }]))
    }

    if (startDate || endDate) {
      if (startDate) {
        const start = new Date(startDate)
        if (!Number.isNaN(start.getTime())) {
          filters.push({ create_time: dbCmd.gte(start) })
        }
      }
      if (endDate) {
        const end = new Date(endDate)
        if (!Number.isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999)
          filters.push({ create_time: dbCmd.lte(end) })
        }
      }
    }

    let query = db.collection('disputes')
    if (filters.length > 0) query = query.where(filters.length === 1 ? filters[0] : dbCmd.and(filters))

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

    const res = await query.orderBy('create_time', 'desc').skip((currentPage - 1) * currentPageSize).limit(currentPageSize + 1).get()
    const rows = res.data || []
    const hasMore = rows.length > currentPageSize
    const data = hasMore ? rows.slice(0, currentPageSize) : rows
    let total = 0
    if (event.needTotal !== false) {
      const countRes = await query.count()
      total = countRes.total || 0
    }

    return { success: true, data, total, hasMore }
  } catch (e) {
    console.error('getDisputeList failed', e)
    return { success: false, error: '获取列表失败', data: [], total: 0, hasMore: false }
  }
}
