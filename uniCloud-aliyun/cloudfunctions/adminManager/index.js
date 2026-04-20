'use strict';

const db = uniCloud.database();
const { SUPER_ADMIN_PHONE, USER_ROLES, hasRole } = require('../common/app-constants');

exports.main = async (event, context) => {
  const { action, params = {} } = event;

  try {
    const requestOpenid = context.OPENID || context.openid || params.operatorOpenid;
    const operator = await getOperatorUser(requestOpenid);
    const authResult = ensureAdminAccess(operator);
    if (!authResult.success) {
      return authResult;
    }

    switch (action) {
      case 'getUserList':
        return await getUserList();
      case 'addUser':
        return await addUser(params);
      case 'updateUser':
        return await updateUser(params);
      case 'deleteUser':
        return await deleteUser(params);
      case 'unbindWechat':
        return await unbindWechat(params);
      default:
        return {
          success: false,
          error: '未知操作'
        };
    }
  } catch (error) {
    console.error('adminManager error:', error);
    return {
      success: false,
      error: error.message || '操作失败'
    };
  }
};

async function getOperatorUser(operatorOpenid) {
  if (!operatorOpenid) {
    return null;
  }

  const result = await db.collection('users').where({
    openid: operatorOpenid
  }).limit(1).get();

  return result.data[0] || null;
}

function ensureAdminAccess(user) {
  if (!user) {
    return {
      success: false,
      error: '缺少管理员身份信息'
    };
  }

  const isAllowed = hasRole(user, USER_ROLES.ADMIN) || user.phone === SUPER_ADMIN_PHONE;
  if (!isAllowed) {
    return {
      success: false,
      error: '无权限执行该操作'
    };
  }

  return { success: true };
}

async function getUserList() {
  const result = await db.collection('users')
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
    .get();
  return {
    success: true,
    data: result.data
  };
}

async function addUser(params) {
  const { phone, name, roles, community } = params;

  if (!phone || !Array.isArray(roles) || roles.length === 0) {
    return {
      success: false,
      error: '手机号和角色不能为空'
    };
  }

  const existUser = await db.collection('users').where({ phone }).limit(1).get();
  if (existUser.data.length > 0) {
    return {
      success: false,
      error: '该手机号已存在'
    };
  }

  const userData = {
    phone,
    name: name || '',
    authorized_roles: roles,
    role: roles[0],
    openid: '',
    avatar: '',
    community: roles.includes(USER_ROLES.COMMUNITY) ? (community || '') : '',
    create_time: Date.now()
  };

  const addResult = await db.collection('users').add(userData);

  return {
    success: true,
    message: '添加成功',
    data: {
      _id: addResult.id,
      ...userData
    }
  };
}

async function updateUser(params) {
  const { userId, phone, name, roles, community } = params;

  if (!userId) {
    return {
      success: false,
      error: '用户ID不能为空'
    };
  }

  const updateData = {};
  if (phone !== undefined) updateData.phone = phone;
  if (name !== undefined) updateData.name = name;
  if (roles !== undefined) {
    updateData.authorized_roles = roles;
    updateData.role = roles[0];
    updateData.community = roles.includes(USER_ROLES.COMMUNITY) ? (community || '') : '';
  } else if (community !== undefined) {
    updateData.community = community;
  }

  await db.collection('users').doc(userId).update(updateData);
  const updatedResult = await db.collection('users').doc(userId).get();

  return {
    success: true,
    message: '更新成功',
    data: updatedResult.data[0] || { _id: userId, ...updateData }
  };
}

async function deleteUser(params) {
  const { userId } = params;

  if (!userId) {
    return {
      success: false,
      error: '用户ID不能为空'
    };
  }

  await db.collection('users').doc(userId).remove();

  return {
    success: true,
    message: '删除成功',
    data: { userId }
  };
}

async function unbindWechat(params) {
  const { userId } = params;

  if (!userId) {
    return {
      success: false,
      error: '用户ID不能为空'
    };
  }

  await db.collection('users').doc(userId).update({
    openid: ''
  });
  const updatedResult = await db.collection('users').doc(userId).get();

  return {
    success: true,
    message: '解绑成功',
    data: updatedResult.data[0] || { _id: userId, openid: '' }
  };
}
