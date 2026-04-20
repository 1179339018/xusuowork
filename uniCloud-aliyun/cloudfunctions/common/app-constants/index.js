'use strict'

const USER_ROLES = Object.freeze({
  POLICE: '派出所',
  STREET: '街道',
  COMMUNITY: '社区',
  ADMIN: '管理员'
})

const DISPUTE_STATUS = Object.freeze({
  PENDING_ASSIGN: '待分派',
  PENDING_VISIT: '待回访',
  PROCESSING: '处理中',
  RESOLVED: '已化解',
  CLOSED: '已关闭'
})

const URGENCY_OPTIONS = Object.freeze(['一般', '紧急', '特急'])

const COMMUNITY_OPTIONS = Object.freeze([
  '光大街社区',
  '大来井社区',
  '核桃湾社区',
  '火井沱社区',
  '大湾井社区',
  '马吃水社区',
  '芭蕉冲社区',
  '其他'
])

const SUPER_ADMIN_PHONE = '18926249923'

function hasRole(user, role) {
  if (!user) {
    return false
  }

  if (user.role === role) {
    return true
  }

  return Array.isArray(user.authorized_roles) && user.authorized_roles.includes(role)
}

module.exports = {
  USER_ROLES,
  DISPUTE_STATUS,
  URGENCY_OPTIONS,
  COMMUNITY_OPTIONS,
  SUPER_ADMIN_PHONE,
  hasRole
}
