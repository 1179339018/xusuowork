'use strict'

const { db, getCurrentUserFromEvent, canViewDispute } = require('auth-helper')

exports.main = async (event, context) => {
  const { disputeId } = event
  if (!disputeId) return { success: false, error: '缺少纠纷ID' }

  try {
    const auth = await getCurrentUserFromEvent(event, context)
    if (!auth.success) return auth

    const disputeRes = await db.collection('disputes').doc(disputeId).get()
    const dispute = disputeRes.data && disputeRes.data[0]
    if (!dispute) return { success: false, error: '纠纷不存在' }
    if (!canViewDispute(auth.user, dispute)) return { success: false, error: '无权查看该纠纷' }

    const [feedbackRes, logRes] = await Promise.all([
      db.collection('feedbacks').where({ dispute_id: disputeId }).orderBy('feedback_time', 'desc').limit(50).get(),
      db.collection('logs').where({ entity_id: disputeId }).orderBy('timestamp', 'desc').limit(100).get()
    ])

    return {
      success: true,
      data: {
        dispute,
        feedbacks: feedbackRes.data || [],
        logs: logRes.data || []
      }
    }
  } catch (e) {
    console.error('getDisputeDetail failed', e)
    return { success: false, error: '获取详情失败' }
  }
}
