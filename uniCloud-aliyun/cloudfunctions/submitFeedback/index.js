'use strict'

const { db, getCurrentUserFromEvent, canSubmitFeedback } = require('auth-helper')
const { DISPUTE_STATUS } = require('app-constants')

exports.main = async (event, context) => {
  const { disputeId, feedbackData = {} } = event
  if (!disputeId) return { success: false, error: '缺少纠纷ID' }

  try {
    const [auth, disputeRes] = await Promise.all([
      getCurrentUserFromEvent(event, context),
      db.collection('disputes').doc(disputeId).get()
    ])
    if (!auth.success) return auth

    const dispute = disputeRes.data && disputeRes.data[0]
    if (!dispute) return { success: false, error: '纠纷不存在' }
    if (!canSubmitFeedback(auth.user, dispute)) return { success: false, error: '只能处理所属社区的纠纷' }

    const feedback = {
      dispute_id: disputeId,
      type: feedbackData.type,
      method: feedbackData.method,
      result: feedbackData.result,
      notes: feedbackData.notes,
      media: feedbackData.media || [],
      next_date: feedbackData.next_date ? new Date(feedbackData.next_date) : null,
      feedback_user: auth.openid,
      feedback_time: new Date()
    }

    let newStatus = DISPUTE_STATUS.PROCESSING
    if (feedbackData.result === DISPUTE_STATUS.RESOLVED) newStatus = DISPUTE_STATUS.RESOLVED
    else if (feedbackData.next_date) newStatus = DISPUTE_STATUS.PENDING_VISIT

    const [addRes] = await Promise.all([
      db.collection('feedbacks').add(feedback),
      db.collection('disputes').doc(disputeId).update({ status: newStatus }),
      db.collection('logs').add({
        entity_id: disputeId,
        entity_type: 'feedback',
        action: 'feedback',
        user_id: auth.openid,
        user_name: auth.user.name || '',
        details: { result: feedbackData.result, type: feedbackData.type },
        timestamp: new Date()
      })
    ])

    return {
      success: true,
      feedbackId: addRes.id,
      data: {
        feedback: { _id: addRes.id, ...feedback },
        dispute: { status: newStatus }
      }
    }
  } catch (e) {
    console.error('submitFeedback failed', e)
    return { success: false, error: '提交回访失败' }
  }
}
