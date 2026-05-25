'use strict'

const { db, getCurrentUserFromEvent, canAssignDispute } = require('auth-helper')
const { DISPUTE_STATUS } = require('app-constants')

exports.main = async (event, context) => {
  const { disputeId, communityId, remark } = event
  if (!disputeId || !communityId) return { success: false, error: '缺少必要参数' }

  try {
    const auth = await getCurrentUserFromEvent(event, context)
    if (!auth.success) return auth
    if (!canAssignDispute(auth.user)) return { success: false, error: '权限不足' }

    const disputeRes = await db.collection('disputes').doc(disputeId).get()
    const dispute = disputeRes.data && disputeRes.data[0]
    if (!dispute) return { success: false, error: '纠纷不存在' }
    if (dispute.status !== DISPUTE_STATUS.PENDING_ASSIGN) return { success: false, error: '当前纠纷状态不允许重复分派' }

    await db.collection('disputes').doc(disputeId).update({
      status: DISPUTE_STATUS.PENDING_VISIT,
      assign_community: communityId,
      assign_time: new Date()
    })

    await db.collection('assignments').add({
      dispute_id: disputeId,
      community_id: communityId,
      assign_user: auth.openid,
      remark: remark || '',
      assign_time: new Date()
    })

    await db.collection('logs').add({
      entity_id: disputeId,
      entity_type: 'assignment',
      action: 'assign',
      user_id: auth.openid,
      user_name: auth.user.name || '',
      details: { community_id: communityId, remark: remark || '' },
      timestamp: new Date()
    })

    return { success: true }
  } catch (e) {
    console.error('assignToCommunity failed', e)
    return { success: false, error: '分派失败' }
  }
}
