'use strict';

const db = uniCloud.database();

exports.main = async (event, context) => {
  const { openid, name, avatar } = event;
  
  if (!openid) {
    return {
      success: false,
      error: '缺少openid参数'
    };
  }
  
  try {
    // 构建更新数据
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;
    
    // 更新用户信息
    const result = await db.collection('users').where({
      openid: openid
    }).update(updateData);
    
    if (result.updated === 0) {
      return {
        success: false,
        error: '用户不存在'
      };
    }
    
    return {
      success: true,
      message: '更新成功'
    };
    
  } catch (error) {
    console.error('更新用户信息失败', error);
    return {
      success: false,
      error: error.message || '更新失败'
    };
  }
};
