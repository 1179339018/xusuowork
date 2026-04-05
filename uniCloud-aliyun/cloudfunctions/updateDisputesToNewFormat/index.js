'use strict';

const db = uniCloud.database();

exports.main = async (event, context) => {
  try {
    // 获取所有纠纷数据
    const disputesRes = await db.collection('disputes').get();
    const disputes = disputesRes.data;
    
    if (disputes.length === 0) {
      return {
        success: true,
        message: '没有需要更新的纠纷数据',
        updated: 0
      };
    }
    
    let updatedCount = 0;
    
    // 更新每个纠纷数据
    for (const dispute of disputes) {
      const updateData = {};
      
      // 添加社区字段（根据地址自动判断）
      if (!dispute.community) {
        const address = dispute.location?.address || '';
        const communityOptions = ['光大街社区', '大来井社区', '核桃湾社区', '火井沱社区', '大湾井社区', '马吃水社区', '芭蕉冲社区', '其他'];
        
        let foundCommunity = '其他';
        for (const community of communityOptions) {
          if (address.includes(community)) {
            foundCommunity = community;
            break;
          }
        }
        updateData.community = foundCommunity;
      }
      
      // 更新风险程度字段（将紧急度转换为风险程度）
      if (!dispute.risk_level && dispute.urgency) {
        const urgencyMap = {
          '一般': '低风险',
          '紧急': '中风险',
          '特急': '高风险'
        };
        updateData.risk_level = urgencyMap[dispute.urgency] || '低风险';
      }
      
      // 如果有需要更新的字段，则执行更新
      if (Object.keys(updateData).length > 0) {
        await db.collection('disputes').doc(dispute._id).update(updateData);
        updatedCount++;
      }
    }
    
    return {
      success: true,
      message: `成功更新了 ${updatedCount} 条纠纷数据`,
      updated: updatedCount,
      total: disputes.length
    };
    
  } catch (error) {
    console.error('更新纠纷数据失败:', error);
    return {
      success: false,
      error: error.message || '更新失败'
    };
  }
};