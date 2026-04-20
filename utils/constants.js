export const USER_ROLES = Object.freeze({
  POLICE: '派出所',
  STREET: '街道',
  COMMUNITY: '社区',
  ADMIN: '管理员'
})

export const USER_ROLE_OPTIONS = Object.freeze(Object.values(USER_ROLES))

export const DISPUTE_STATUS = Object.freeze({
  PENDING_ASSIGN: '待分派',
  PENDING_VISIT: '待回访',
  PROCESSING: '处理中',
  RESOLVED: '已化解',
  CLOSED: '已关闭'
})

export const DISPUTE_STATUS_OPTIONS = Object.freeze([
  DISPUTE_STATUS.PENDING_ASSIGN,
  DISPUTE_STATUS.PENDING_VISIT,
  DISPUTE_STATUS.PROCESSING,
  DISPUTE_STATUS.RESOLVED,
  DISPUTE_STATUS.CLOSED
])

export const SOURCE_OPTIONS = Object.freeze([
  '接处警',
  '社区摸排',
  '工作发现',
  '其他'
])

export const URGENCY_OPTIONS = Object.freeze([
  '一般',
  '紧急',
  '特急'
])

export const COMMUNITY_OPTIONS = Object.freeze([
  '光大街社区',
  '大来井社区',
  '核桃湾社区',
  '火井沱社区',
  '大湾井社区',
  '马吃水社区',
  '芭蕉冲社区',
  '其他'
])

export const FILTER_ALL = '全部'

export const STATUS_FILTER_OPTIONS = Object.freeze([FILTER_ALL, ...DISPUTE_STATUS_OPTIONS])
export const COMMUNITY_FILTER_OPTIONS = Object.freeze([FILTER_ALL, ...COMMUNITY_OPTIONS])
export const RISK_LEVEL_OPTIONS = Object.freeze([FILTER_ALL, ...URGENCY_OPTIONS])

export const STATUS_CLASS_MAP = Object.freeze({
  [DISPUTE_STATUS.PENDING_ASSIGN]: 'status-pending',
  [DISPUTE_STATUS.PENDING_VISIT]: 'status-pending',
  [DISPUTE_STATUS.PROCESSING]: 'status-processing',
  [DISPUTE_STATUS.RESOLVED]: 'status-resolved',
  [DISPUTE_STATUS.CLOSED]: 'status-closed'
})

export const URGENCY_TAG_CLASS_MAP = Object.freeze({
  一般: 'tag-primary',
  紧急: 'tag-warning',
  特急: 'tag-danger'
})

export const URGENCY_DOT_CLASS_MAP = Object.freeze({
  一般: 'dot-normal',
  紧急: 'dot-urgent',
  特急: 'dot-emergency'
})

export const SUPER_ADMIN_PHONE = '18926249923'
