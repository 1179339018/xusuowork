'use strict'

const { db, dbCmd, getCurrentUserFromEvent, canManageUsers } = require('auth-helper')
const { USER_ROLES } = require('app-constants')

exports.main = async (event, context) => {
  const { action, params = {} } = event

  try {
    const auth = await getCurrentUserFromEvent(event, context)
    if (!auth.success) return auth
    if (!canManageUsers(auth.user)) return { success: false, error: '无权执行管理员操作' }

    switch (action) {
      case 'getUserList':
        return await getUserList(params)
      case 'addUser':
        return await addUser(params)
      case 'updateUser':
        return await updateUser(params, auth.user)
      case 'deleteUser':
        return await deleteUser(params, auth.user)
      case 'unbindWechat':
        return await unbindWechat(params)
      default:
        return { success: false, error: '未知操作' }
    }
  } catch (error) {
    console.error('adminManager failed', error)
    return { success: false, error: '操作失败' }
  }
}

function normalizeRoles(roles) {
  return Array.isArray(roles) ? roles.filter(Boolean) : []
}

function isValidPhone(phone) {
  return /^1\d{10}$/.test(String(phone || ''))
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function getUserList(params = {}) {
  const page = Math.max(Number(params.page) || 1, 1)
  const pageSize = Math.min(Math.max(Number(params.pageSize) || 50, 1), 100)
  const keyword = String(params.keyword || '').trim().slice(0, 30)

  let query = db.collection('users')
  if (keyword) {
    const reg = new RegExp(escapeRegExp(keyword), 'i')
    query = query.where(dbCmd.or([{ phone: reg }, { name: reg }, { community: reg }]))
  }

  const result = await query
    .field({
      phone: true,
      name: true,
      role: true,
      authorized_roles: true,
      openid: true,
      avatar: true,
      community: true,
      create_time: true
    })
    .orderBy('create_time', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()

  const countRes = await query.count()
  return { success: true, data: result.data || [], total: countRes.total || 0 }
}

async function addUser(params) {
  const { phone, name, community } = params
  const roles = normalizeRoles(params.roles)
  if (!isValidPhone(phone) || roles.length === 0) return { success: false, error: '请填写正确手机号并选择角色' }

  const existUser = await db.collection('users').where({ phone }).limit(1).get()
  if (existUser.data.length > 0) return { success: false, error: '该手机号已存在' }

  const userData = {
    phone,
    name: name || '',
    authorized_roles: roles,
    role: roles[0],
    openid: '',
    avatar: '',
    community: roles.includes(USER_ROLES.COMMUNITY) ? (community || '') : '',
    create_time: Date.now()
  }
  const addResult = await db.collection('users').add(userData)
  return { success: true, message: '添加成功', data: { _id: addResult.id, ...userData } }
}

async function updateUser(params, operator) {
  const { userId, phone, name, community } = params
  const roles = params.roles === undefined ? undefined : normalizeRoles(params.roles)
  if (!userId) return { success: false, error: '用户ID不能为空' }
  if (phone !== undefined && !isValidPhone(phone)) return { success: false, error: '手机号格式不正确' }
  if (operator && operator._id === userId && roles && !roles.includes(USER_ROLES.ADMIN)) {
    return { success: false, error: '不能移除自己的管理员权限' }
  }

  if (phone !== undefined) {
    const existUser = await db.collection('users').where({ phone, _id: dbCmd.neq(userId) }).limit(1).get()
    if (existUser.data.length > 0) return { success: false, error: '该手机号已存在' }
  }

  const updateData = {}
  if (phone !== undefined) updateData.phone = phone
  if (name !== undefined) updateData.name = name
  if (roles !== undefined) {
    if (roles.length === 0) return { success: false, error: '至少保留一个角色' }
    updateData.authorized_roles = roles
    updateData.role = roles[0]
    updateData.community = roles.includes(USER_ROLES.COMMUNITY) ? (community || '') : ''
  } else if (community !== undefined) {
    updateData.community = community
  }

  await db.collection('users').doc(userId).update(updateData)
  const updatedResult = await db.collection('users').doc(userId).get()
  return { success: true, message: '更新成功', data: updatedResult.data[0] || { _id: userId, ...updateData } }
}

async function deleteUser(params, operator) {
  const { userId } = params
  if (!userId) return { success: false, error: '用户ID不能为空' }
  if (operator && operator._id === userId) return { success: false, error: '不能删除当前登录管理员' }
  await db.collection('users').doc(userId).remove()
  return { success: true, message: '删除成功', data: { userId } }
}

async function unbindWechat(params) {
  const { userId } = params
  if (!userId) return { success: false, error: '用户ID不能为空' }
  await db.collection('users').doc(userId).update({ openid: '' })
  const updatedResult = await db.collection('users').doc(userId).get()
  return { success: true, message: '解绑成功', data: updatedResult.data[0] || { _id: userId, openid: '' } }
}
