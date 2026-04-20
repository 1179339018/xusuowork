'use strict';
const db = uniCloud.database()
const { DISPUTE_STATUS, USER_ROLES } = require('../common/app-constants')

exports.main = async (event, context) => {
	// 模拟的初始用户数据
	const users = [
		{
			openid: 'test_admin_001',
			role: USER_ROLES.POLICE,
			name: '张警官',
			create_time: Date.now()
		},
		{
			openid: 'test_community_001',
			role: USER_ROLES.COMMUNITY,
			name: '李社工',
			community: 'happiness_community', // 幸福社区
			create_time: Date.now()
		}
	]

	// 模拟的初始纠纷数据
	const disputes = [
		{
			source: '接处警',
			title: '邻里噪音纠纷',
			description: '楼上装修噪音太大，楼下老人无法休息',
			location: {
				address: '幸福小区3号楼402',
				latitude: 30.12345,
				longitude: 120.12345
			},
			parties: '王某, 赵某',
			urgency: '一般',
			status: DISPUTE_STATUS.PENDING_ASSIGN,
			occur_count: 1,
			create_time: Date.now(),
			create_user: 'test_admin_001'
		},
		{
			source: '社区摸排',
			title: '家庭矛盾',
			description: '夫妻吵架，影响邻居',
			location: {
				address: '幸福小区5号楼101',
				latitude: 30.12346,
				longitude: 120.12346
			},
			parties: '孙某, 李某',
			urgency: '紧急',
			status: DISPUTE_STATUS.PROCESSING,
			assign_community: 'happiness_community',
			occur_count: 2,
			create_time: Date.now() - 86400000, // 昨天
			create_user: 'test_community_001'
		}
	]

	try {
		// 批量插入用户
		// 注意：实际生产中可能需要判断是否存在，这里为了演示直接插入
		const userRes = await db.collection('users').add(users)
		console.log('用户数据初始化成功', userRes)
		
		// 批量插入纠纷
		const disputeRes = await db.collection('disputes').add(disputes)
		console.log('纠纷数据初始化成功', disputeRes)

		return {
			success: true,
			msg: '初始化数据成功',
			data: {
				addedUsers: userRes.inserted,
				addedDisputes: disputeRes.inserted
			}
		}
	} catch (e) {
		console.error('初始化失败', e)
		return {
			success: false,
			msg: '初始化失败: ' + e.message
		}
	}
}
