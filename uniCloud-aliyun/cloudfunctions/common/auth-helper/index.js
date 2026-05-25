'use strict'

const db = uniCloud.database()
const dbCmd = db.command
const { USER_ROLES, hasRole } = require('app-constants')

function getContextOpenid(context = {}) {
  return context.OPENID || context.openid || context.OPENID_MP_WEIXIN || ''
}

async function getUserByOpenid(openid) {
  const userRes = await db.collection('users').where({ openid }).limit(1).get()
  return userRes.data && userRes.data[0]
}

async function getUserBySessionToken(sessionToken) {
  if (!sessionToken) return null

  const userRes = await db.collection('users').where({ session_token: sessionToken }).limit(1).get()
  const user = userRes.data && userRes.data[0]
  if (!user) return null

  const expireAt = Number(user.session_expire || 0)
  if (!expireAt || Date.now() > expireAt) return null

  return user
}

async function getCurrentUserFromEvent(event = {}, context = {}) {
  const contextOpenid = getContextOpenid(context)
  const user = contextOpenid
    ? await getUserByOpenid(contextOpenid)
    : await getUserBySessionToken(event.sessionToken || event.__sessionToken)

  if (!user) {
    return { success: false, error: '登录状态已失效，请重新登录' }
  }

  return {
    success: true,
    openid: user.openid,
    user
  }
}

function isAdmin(user) {
  return hasRole(user, USER_ROLES.ADMIN)
}

function isStreet(user) {
  return hasRole(user, USER_ROLES.STREET)
}

function isPolice(user) {
  return hasRole(user, USER_ROLES.POLICE)
}

function isCommunity(user) {
  return hasRole(user, USER_ROLES.COMMUNITY)
}

function canManageUsers(user) {
  return isAdmin(user)
}

function canCreateDispute(user) {
  return isPolice(user) || isStreet(user) || isCommunity(user) || isAdmin(user)
}

function canAssignDispute(user) {
  return isStreet(user) || isAdmin(user)
}

function canSubmitFeedback(user, dispute) {
  return Boolean(isCommunity(user) && user.community && dispute.assign_community && user.community === dispute.assign_community)
}

function canViewDispute(user, dispute) {
  if (isAdmin(user) || isStreet(user)) return true
  if (isPolice(user) && dispute.create_user === user.openid) return true
  if (isCommunity(user) && user.community && dispute.assign_community === user.community) return true
  return false
}

function buildDisputeScopeFilters(user) {
  if (isAdmin(user) || isStreet(user)) return []
  if (isPolice(user)) return [{ create_user: user.openid }]
  if (isCommunity(user) && user.community) return [{ assign_community: user.community }]
  return [{ _id: '__NO_ACCESS__' }]
}

module.exports = {
  db,
  dbCmd,
  getContextOpenid,
  getCurrentUserFromEvent,
  isAdmin,
  isStreet,
  isPolice,
  isCommunity,
  canManageUsers,
  canCreateDispute,
  canAssignDispute,
  canSubmitFeedback,
  canViewDispute,
  buildDisputeScopeFilters
}
