'use strict'

const { db, getCurrentUserFromEvent, canCreateDispute } = require('auth-helper')
const { DISPUTE_STATUS } = require('app-constants')

exports.main = async (event, context) => {
  const { disputeData = {} } = event

  try {
    const auth = await getCurrentUserFromEvent(event, context)
    if (!auth.success) return auth
    if (!canCreateDispute(auth.user)) return { success: false, error: '无权录入纠纷' }
    if (!disputeData.title || !disputeData.description) return { success: false, error: '请填写纠纷标题和情况描述' }

    const dispute = {
      source: disputeData.source,
      title: disputeData.title,
      description: disputeData.description,
      community: disputeData.community || auth.user.community || '',
      location: disputeData.location,
      parties: disputeData.parties,
      urgency: disputeData.urgency,
      status: DISPUTE_STATUS.PENDING_ASSIGN,
      occur_count: disputeData.occur_count || 1,
      create_user: auth.openid,
      create_time: new Date()
    }

    const addRes = await db.collection('disputes').add(dispute)
    await db.collection('logs').add({
      entity_id: addRes.id,
      entity_type: 'dispute',
      action: 'create',
      user_id: auth.openid,
      user_name: auth.user.name || '',
      details: { source: disputeData.source, title: disputeData.title },
      timestamp: new Date()
    })

    return { success: true, disputeId: addRes.id }
  } catch (e) {
    console.error('pushToStreet failed', e)
    return { success: false, error: '录入失败' }
  }
}
