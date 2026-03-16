'use strict';

const db = uniCloud.database();

exports.main = async (event, context) => {
  const { action, params } = event;
  
  try {
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

// 获取用户列表
async function getUserList() {
  const result = await db.collection('users').get();
  return {
    success: true,
    data: result.data
  };
}

// 添加用户
async function addUser(params) {
  const { phone, name, roles } = params;
  
  if (!phone || !roles || roles.length === 0) {
    return {
      success: false,
      error: '手机号和角色不能为空'
    };
  }
  
  // 检查手机号是否已存在
  const existUser = await db.collection('users').where({
    phone: phone
  }).get();
  
  if (existUser.data.length > 0) {
    return {
      success: false,
      error: '该手机号已存在'
    };
  }
  
  // 创建新用户
  const userData = {
    phone: phone,
    name: name || '',
    authorized_roles: roles,
    role: roles[0], // 默认使用第一个角色
    openid: '', // 未绑定微信
    create_time: Date.now()
  };
  
  await db.collection('users').add(userData);
  
  return {
    success: true,
    message: '添加成功'
  };
}

// 更新用户
async function updateUser(params) {
  const { userId, phone, name, roles } = params;
  
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
    updateData.role = roles[0]; // 更新默认角色
  }
  
  await db.collection('users').doc(userId).update(updateData);
  
  return {
    success: true,
    message: '更新成功'
  };
}

// 删除用户
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
    message: '删除成功'
  };
}

// 解绑微信
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
  
  return {
    success: true,
    message: '解绑成功'
  };
}
