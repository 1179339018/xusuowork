<template>
	<view class="container">
		<!-- 派出所视图 -->
		<view v-if="isPolice" class="police-view">
			<view class="action-card">
				<button class="btn-primary btn-large" @click="goToInput">
					<text class="icon-plus">+</text>
					<text>新增纠纷</text>
				</button>
			</view>
			
			<view class="stats-section">
				<view class="stats-card">
					<view class="stats-title">今日推送</view>
					<view class="stats-value">{{statistics.todayNew}}</view>
					<view class="stats-desc">条纠纷已推送至街道</view>
				</view>
				
				<view v-if="statistics.pendingPolice > 0" class="stats-card highlight">
					<view class="stats-title">待处理</view>
					<view class="stats-value">{{statistics.pendingPolice}}</view>
					<view class="stats-desc">条社区转办的纠纷</view>
				</view>
			</view>
			
			<view class="recent-list">
				<view class="section-title">最近推送</view>
				<view v-for="(item, index) in recentDisputes" :key="item._id" class="list-item fade-in" @click="goToDetail(item._id)">
					<view class="item-header">
						<text class="item-title">{{item.title}}</text>
						<text class="tag tag-primary">{{item.source}}</text>
					</view>
					<view class="item-info">
						<text class="item-time">{{formatTime(item.create_time)}}</text>
						<text :class="['status-text', item.statusClass]">{{item.status}}</text>
					</view>
				</view>
				<view v-if="recentDisputes.length === 0" class="empty">
					<text class="empty-icon">📭</text>
					<text class="empty-text">暂无推送记录</text>
				</view>
			</view>
		</view>
		
		<!-- 街道视图 -->
		<view v-else-if="isStreet" class="street-view">
			<view class="stats-grid">
				<view class="stats-card">
					<view class="stats-title">待分派</view>
					<view class="stats-value">{{statistics.pendingAssign}}</view>
				</view>
				<view class="stats-card">
					<view class="stats-title">已化解</view>
					<view class="stats-value">{{statistics.resolved}}</view>
				</view>
				<view class="stats-card">
					<view class="stats-title">化解率</view>
					<view class="stats-value">{{statistics.resolveRate}}%</view>
				</view>
			</view>
			
			<view class="action-card">
				<button class="btn-primary" @click="goToStreetManage">
					<text>管理纠纷</text>
				</button>
			</view>
			
			<view class="recent-list">
				<view class="section-title">待分派纠纷</view>
				<view v-for="(item, index) in recentDisputes" :key="item._id" class="list-item fade-in" @click="goToDetail(item._id)">
					<view class="item-header">
						<text class="item-title">{{item.title}}</text>
						<text class="tag tag-danger" v-if="item.urgency === '特急'">特急</text>
						<text class="tag tag-warning" v-else-if="item.urgency === '紧急'">紧急</text>
					</view>
					<view class="item-info">
						<text class="item-time">{{formatTime(item.create_time)}}</text>
						<text class="status-text pending">{{item.status}}</text>
					</view>
				</view>
				<view v-if="recentDisputes.length === 0" class="empty">
					<text class="empty-icon">✅</text>
					<text class="empty-text">暂无待分派纠纷</text>
				</view>
			</view>
		</view>
		
		<!-- 社区视图 -->
		<view v-else-if="isCommunity" class="community-view">
			<view class="stats-section">
				<view class="stats-card">
					<view class="stats-title">待回访</view>
					<view class="stats-value">{{statistics.pendingVisit}}</view>
					<view class="stats-desc">条任务需要回访</view>
				</view>
			</view>
			
			<view class="recent-list">
				<view class="section-title">最近任务</view>
				<view v-for="(item, index) in recentDisputes" :key="item._id" class="list-item fade-in" @click="goToDetail(item._id)">
					<view class="item-header">
						<text class="item-title">{{item.title}}</text>
						<text class="tag tag-primary">{{item.status}}</text>
					</view>
					<view class="item-info">
						<text class="item-time">{{formatTime(item.assign_time || item.create_time)}}</text>
						<text class="item-from">来自：{{item.source}}</text>
					</view>
				</view>
				<view v-if="recentDisputes.length === 0" class="empty">
					<text class="empty-icon">😌</text>
					<text class="empty-text">暂无任务</text>
				</view>
			</view>
		</view>
		
		<!-- 管理员视图 -->
		<view v-else-if="isAdmin" class="admin-view">
			<view class="stats-grid">
				<view class="stats-card">
					<view class="stats-title">纠纷总数</view>
					<view class="stats-value">{{statistics.totalCount}}</view>
				</view>
				<view class="stats-card">
					<view class="stats-title">已化解</view>
					<view class="stats-value">{{statistics.resolved}}</view>
				</view>
				<view class="stats-card">
					<view class="stats-title">用户数</view>
					<view class="stats-value">{{statistics.userCount}}</view>
				</view>
			</view>
			
			<view class="admin-actions">
				<view class="action-grid">
					<view class="action-item" @click="goToUserManage">
						<view class="action-icon">👥</view>
						<view class="action-text">用户管理</view>
					</view>
					<view class="action-item" @click="goToStreetManage">
						<view class="action-icon">📋</view>
						<view class="action-text">纠纷管理</view>
					</view>
					<view class="action-item" @click="exportData">
						<view class="action-icon">📊</view>
						<view class="action-text">数据导出</view>
					</view>
				</view>
			</view>
			
			<view class="export-section">
				<view class="section-title">数据导出</view>
				<view class="export-form">
					<view class="form-row">
						<text class="form-label">状态筛选</text>
						<picker mode="selector" :range="statusOptions" :value="statusIndex" @change="onStatusChange">
							<view class="picker-input">
								<text>{{statusOptions[statusIndex]}}</text>
								<text class="arrow">›</text>
							</view>
						</picker>
					</view>
					<view class="form-row">
						<text class="form-label">开始日期</text>
						<picker mode="date" @change="onStartDateChange">
							<view class="picker-input">
								<text>{{startDate || '请选择'}}</text>
								<text class="arrow">›</text>
							</view>
						</picker>
					</view>
					<view class="form-row">
						<text class="form-label">结束日期</text>
						<picker mode="date" @change="onEndDateChange">
							<view class="picker-input">
								<text>{{endDate || '请选择'}}</text>
								<text class="arrow">›</text>
							</view>
						</picker>
					</view>
					<view class="form-actions">
						<button class="btn-primary btn-export" @click="exportData">导出数据</button>
						<button class="btn-secondary" @click="resetForm">重置</button>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 无角色提示 -->
		<view v-else-if="userInfo" class="no-role-view">
			<view class="empty">
				<text class="empty-icon">⚠️</text>
				<text class="empty-text">您还没有分配角色</text>
				<text class="empty-subtext">请联系管理员分配角色</text>
			</view>
		</view>
		
		<!-- 未登录提示 -->
		<view v-else class="not-login-view">
			<view class="empty">
				<text class="empty-icon">🔐</text>
				<text class="empty-text">请先登录</text>
				<navigator url="/pages/login/index" class="login-btn">去登录</navigator>
			</view>
		</view>
	</view>
</template>

<script>
	import { ref, computed, onMounted } from 'vue'
	import { useUserStore } from '@/store/user'
	import { useDisputeStore } from '@/store/dispute'
	
	export default {
		setup() {
			const userStore = useUserStore()
			const disputeStore = useDisputeStore()
			
			const isLoading = ref(false)
			const statistics = ref({
				todayNew: 0,
				pendingAssign: 0,
				pendingVisit: 0,
				pendingPolice: 0,
				resolved: 0,
				resolveRate: '0.0',
				totalCount: 0,
				userCount: 0
			})
			const recentDisputes = ref([])
			const startDate = ref('')
			const endDate = ref('')
			const statusOptions = ['全部', '待分派', '待回访', '处理中', '已化解', '已关闭']
			const statusIndex = ref(0)
			
			// 计算属性
			const userInfo = computed(() => ({
				_id: userStore._id,
				openid: userStore.openid,
				name: userStore.name,
				phone: userStore.phone,
				role: userStore.role,
				authorized_roles: userStore.authorized_roles,
				community: userStore.community,
				avatar: userStore.avatar
			}))
			const isPolice = computed(() => userStore.role === '派出所')
			const isStreet = computed(() => userStore.role === '街道')
			const isCommunity = computed(() => userStore.role === '社区')
			const isAdmin = computed(() => userStore.role === '管理员')
			
			// 方法
			const goToInput = () => {
				uni.navigateTo({
					url: '/pages/input/index'
				})
			}
			
			const goToStreetManage = () => {
				uni.switchTab({
					url: '/pages/street/index'
				})
			}
			
			const goToDetail = (id) => {
				uni.navigateTo({
					url: `/pages/detail/index?id=${id}`
				})
			}
			
			const goToUserManage = () => {
				uni.navigateTo({
					url: '/pages/admin/user-list'
				})
			}
			
			const formatTime = (time) => {
				if (!time) return ''
				const date = new Date(time)
				return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
			}
			
			const onStartDateChange = (e) => {
				startDate.value = e.detail.value
				if (endDate.value && endDate.value < startDate.value) {
					endDate.value = ''
				}
			}
			
			const onEndDateChange = (e) => {
				endDate.value = e.detail.value
				if (startDate.value && endDate.value < startDate.value) {
					const temp = startDate.value
					startDate.value = endDate.value
					endDate.value = temp
				}
			}
			
			const onStatusChange = (e) => {
				statusIndex.value = Number(e.detail.value) || 0
			}
			
			const resetForm = () => {
				startDate.value = ''
				endDate.value = ''
			}
			
			const exportData = async () => {
				if (!userStore.isAdmin) return
				
				try {
					uni.showLoading({
						title: '正在导出...'
					})
					
					const pageSize = 100
					let page = 1
					const allData = []
					const status = statusOptions[statusIndex.value]
					const statusFilter = status === '全部' ? '' : status
					
					// 分批获取数据
					while (true) {
						const res = await uniCloud.callFunction({
							name: 'getDisputeList',
							data: {
								role: userStore.role,
								community: userStore.community,
								status: statusFilter,
								startDate: startDate.value,
								endDate: endDate.value,
								page: page,
								pageSize: pageSize,
								needTotal: false
							}
						})
						
						if (!res.result || !res.result.success) {
							throw new Error('获取数据失败')
						}
						
						const data = res.result.data || []
						allData.push(...data)
						
						if (!res.result.hasMore || data.length < pageSize) {
							break
						}
						
						page++
					}
					
					if (allData.length === 0) {
						uni.hideLoading()
						uni.showToast({
							title: '暂无数据可导出',
							icon: 'none'
						})
						return
					}
					
					// 生成CSV
					const headers = ['纠纷ID', '标题', '来源', '状态', '紧急度', '发生次数', '涉及人员', '地址', '创建时间', '分派社区ID', '分派时间']
					const rows = allData.map(item => {
						const createTime = item.create_time ? new Date(item.create_time) : null
						const assignTime = item.assign_time ? new Date(item.assign_time) : null
						
						const formatDate = (date) => {
							if (!date) return ''
							return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
						}
						
						const formatNumber = (num) => {
							if (num == null) return ''
							return String(num)
						}
						
						return [
							item._id || '',
							`"${item.title || ''}"`,
							item.source || '',
							item.status || '',
							item.urgency || '',
							formatNumber(item.occur_count || 1),
							`"${item.parties || ''}"`,
							`"${item.location?.address || ''}"`,
							formatDate(createTime),
							item.assign_community_id || '',
							formatDate(assignTime)
						]
					})
					
					const csvContent = [
						headers.join(','),
						...rows.map(row => row.join(','))
					].join('\n')
					
					// 导出文件
					const fileName = `纠纷数据_${new Date().toISOString().split('T')[0]}.csv`
					
					if (uni.saveFile) {
							// 小程序环境
							const tempFilePath = `${wx.env.USER_DATA_PATH}/${fileName}`
							const fs = wx.getFileSystemManager()
							fs.writeFile({
								filePath: tempFilePath,
								data: csvContent,
								encoding: 'utf8',
								success: (res) => {
									uni.hideLoading()
									uni.showToast({
										title: '导出成功',
										icon: 'success'
									})
									
									// 打开文件
									wx.openDocument({
										filePath: tempFilePath
									})
								},
								fail: (err) => {
									uni.hideLoading()
									uni.showToast({
										title: '导出失败',
										icon: 'none'
									})
									console.error('导出失败', err)
								}
							})
					} else {
						// H5环境
						const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
						const link = document.createElement('a')
						const url = URL.createObjectURL(blob)
						link.setAttribute('href', url)
						link.setAttribute('download', fileName)
						link.style.visibility = 'hidden'
						document.body.appendChild(link)
						link.click()
						document.body.removeChild(link)
						uni.hideLoading()
						uni.showToast({
							title: '导出成功',
							icon: 'success'
						})
					}
				} catch (error) {
					uni.hideLoading()
					uni.showToast({
						title: '导出失败',
						icon: 'none'
					})
					console.error('导出失败', error)
				}
			}
			
			const loadStatistics = async () => {
				if (!userStore.isLogin) return
				
				try {
					// 直接获取数据，不使用缓存，确保数据及时更新
					const res = await uniCloud.callFunction({
						name: 'getStatistics',
						data: {
							role: userStore.role,
							community: userStore.community
						}
					})
					
					if (res.result && res.result.success) {
						statistics.value = {
							...statistics.value,
							...res.result.data
						}
					}
				} catch (error) {
					console.error('获取统计数据失败', error)
				}
			}
			
			const loadRecentDisputes = async () => {
				if (!userStore.isLogin) return
				
				try {
					// 检查缓存
					const cacheKey = `recent_${userStore.role}_${userStore.community || 'all'}`
					const cachedData = uni.getStorageSync(cacheKey)
					const cacheTime = uni.getStorageSync(`${cacheKey}_time`)
					
					// 如果缓存存在且未过期（2分钟）
					if (cachedData && cacheTime && Date.now() - cacheTime < 2 * 60 * 1000) {
						recentDisputes.value = cachedData
						return
					}
					
					const res = await uniCloud.callFunction({
						name: 'getDisputeList',
						data: {
							role: userStore.role,
							community: userStore.community,
							page: 1,
							pageSize: 10,
							needTotal: false
						}
					})
					
					if (res.result && res.result.success) {
						const processedData = (res.result.data || []).map(item => ({
							...item,
							statusClass: {
								'待分派': 'pending',
								'待回访': 'pending',
								'处理中': 'processing',
								'已化解': 'resolved',
								'已关闭': 'closed'
							}[item.status] || ''
						}))
						recentDisputes.value = processedData
						
						// 缓存数据
						uni.setStorageSync(cacheKey, processedData)
						uni.setStorageSync(`${cacheKey}_time`, Date.now())
					}
				} catch (error) {
					console.error('获取最近纠纷失败', error)
				}
			}
			
			// 检查登录状态
			const checkLogin = () => {
				if (!userStore.isLogin) {
					uni.redirectTo({
						url: '/pages/login/index'
					})
					return false
				}
				return true
			}
			
			// 生命周期
			onMounted(async () => {
				if (checkLogin()) {
					// 并行执行数据获取，减少加载时间
					try {
						isLoading.value = true
						await Promise.all([
							loadStatistics(),
							loadRecentDisputes()
						])
					} finally {
						isLoading.value = false
					}
				}
			})
			
			// 下拉刷新
			const onPullDownRefresh = async () => {
				if (checkLogin()) {
					try {
						await Promise.all([
							loadStatistics(),
							loadRecentDisputes()
						])
					} finally {
						uni.stopPullDownRefresh()
					}
				}
			}
			
			return {
				userInfo,
				isPolice,
				isStreet,
				isCommunity,
				isAdmin,
				isLoading,
				statistics,
				recentDisputes,
				startDate,
				endDate,
				statusOptions,
				statusIndex,
				goToInput,
				goToStreetManage,
				goToDetail,
				goToUserManage,
				formatTime,
				onStartDateChange,
				onEndDateChange,
				onStatusChange,
				resetForm,
				exportData,
				onPullDownRefresh
			}
		}
	}
</script>

<style lang="scss">
	.container {
		min-height: 100vh;
		background: linear-gradient(180deg, #e6f2ff 0%, #f0f7ff 100%);
		padding: 100rpx 20rpx;
		padding-top: calc(100rpx + env(safe-area-inset-top));
		box-sizing: border-box;
	}
	
	/* 通用卡片样式 */
	.stats-card {
		background: #fff;
		border-radius: 20rpx;
		padding: 40rpx 32rpx;
		text-align: center;
		box-shadow: 0 4rpx 20rpx rgba(22, 119, 255, 0.08);
		border: 1rpx solid rgba(22, 119, 255, 0.06);
		position: relative;
		overflow: hidden;
		transition: all 0.3s ease;
		
		&::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 4rpx;
			background: linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%);
		}
		
		&:active {
			transform: scale(0.98);
		}
		
		&.highlight {
			background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
			color: #fff;
			box-shadow: 0 8rpx 24rpx rgba(22, 119, 255, 0.25);
			
			&::before {
				display: none;
			}
			
			.stats-title {
				color: rgba(255, 255, 255, 0.9);
			}
			
			.stats-value {
				color: #fff;
			}
			
			.stats-desc {
				color: rgba(255, 255, 255, 0.8);
			}
		}
		
		.stats-title {
			font-size: 26rpx;
			color: var(--text-secondary);
			margin-bottom: 16rpx;
		}
		
		.stats-value {
			font-size: 56rpx;
			font-weight: bold;
			color: var(--text-primary);
			margin-bottom: 12rpx;
			line-height: 1.2;
		}
		
		.stats-desc {
			font-size: 24rpx;
			color: var(--text-tertiary);
		}
	}
	
	/* 通用按钮样式 */
	.btn-primary {
		background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
		color: #fff;
		font-size: 30rpx;
		font-weight: 600;
		border-radius: 16rpx;
		box-shadow: 0 6rpx 20rpx rgba(22, 119, 255, 0.25);
		transition: all 0.3s ease;
		
		&:active {
			transform: scale(0.98);
			box-shadow: 0 4rpx 12rpx rgba(22, 119, 255, 0.2);
		}
		
		&::after {
			border: none;
		}
	}
	
	/* 通用列表样式 */
	.recent-list {
		background: #fff;
		border-radius: 20rpx;
		padding: 32rpx;
		box-shadow: 0 4rpx 20rpx rgba(22, 119, 255, 0.08);
		border: 1rpx solid rgba(22, 119, 255, 0.06);
		
		.section-title {
			font-size: 30rpx;
			font-weight: 600;
			color: var(--text-primary);
			margin-bottom: 24rpx;
			text-align: center;
			position: relative;
			padding-bottom: 16rpx;
			
			&::after {
				content: '';
				position: absolute;
				bottom: 0;
				left: 50%;
				transform: translateX(-50%);
				width: 60rpx;
				height: 4rpx;
				background: linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%);
				border-radius: 2rpx;
			}
		}
		
		.list-item {
			padding: 24rpx 0;
			border-bottom: 1rpx solid var(--border);
			transition: all 0.3s ease;
			
			&:last-child {
				border-bottom: none;
			}
			
			&:active {
				background: var(--bg-card);
				margin: 0 -16rpx;
				padding-left: 16rpx;
				padding-right: 16rpx;
				border-radius: 12rpx;
			}
			
			.item-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 16rpx;
				
				.item-title {
					font-size: 28rpx;
					font-weight: 500;
					color: var(--text-primary);
					flex: 1;
					margin-right: 16rpx;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}
			}
			
			.item-info {
				display: flex;
				justify-content: space-between;
				align-items: center;
				
				.item-time {
					font-size: 24rpx;
					color: var(--text-tertiary);
				}
				
				.item-from {
					font-size: 24rpx;
					color: var(--text-secondary);
				}
				
				.status-text {
					font-size: 24rpx;
					font-weight: 500;
					
					&.pending {
						color: var(--warning);
					}
					
					&.processing {
						color: var(--primary);
					}
					
					&.resolved {
						color: var(--success);
					}
					
					&.closed {
						color: var(--text-tertiary);
					}
				}
			}
		}
	}
	
	/* 派出所视图 */
	.police-view {
		.action-card {
			margin-bottom: 24rpx;
			
			.btn-large {
				width: 100%;
				height: 120rpx;
				line-height: 120rpx;
				font-size: 34rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 16rpx;
				
				.icon-plus {
					font-size: 36rpx;
					font-weight: 700;
				}
			}
		}
		
		.stats-section {
			margin-bottom: 24rpx;
			
			.stats-card {
				margin-bottom: 20rpx;
				
				&:last-child {
					margin-bottom: 0;
				}
			}
		}
	}
	
	/* 街道视图 */
	.street-view {
		.stats-grid {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 16rpx;
			margin-bottom: 24rpx;
			
			.stats-card {
				padding: 32rpx 16rpx;
				
				.stats-title {
					font-size: 24rpx;
				}
				
				.stats-value {
					font-size: 44rpx;
				}
			}
		}
		
		.action-card {
			margin-bottom: 24rpx;
			
			.btn-primary {
				width: 100%;
				height: 88rpx;
				line-height: 88rpx;
			}
		}
	}
	
	/* 社区视图 */
	.community-view {
		.stats-section {
			margin-bottom: 24rpx;
			
			.stats-card {
				&::before {
					background: linear-gradient(90deg, var(--success) 0%, #73d13d 100%);
				}
			}
		}
	}
	
	/* 管理员视图 */
	.admin-view {
		.stats-grid {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 16rpx;
			margin-bottom: 24rpx;
			
			.stats-card {
				padding: 32rpx 16rpx;
				
				.stats-title {
					font-size: 24rpx;
				}
				
				.stats-value {
					font-size: 44rpx;
				}
			}
		}
		
		.admin-actions {
			background: #fff;
			border-radius: 20rpx;
			padding: 32rpx 24rpx;
			margin-bottom: 24rpx;
			box-shadow: 0 4rpx 20rpx rgba(22, 119, 255, 0.08);
			border: 1rpx solid rgba(22, 119, 255, 0.06);
			
			.action-grid {
				display: grid;
				grid-template-columns: repeat(3, 1fr);
				gap: 20rpx;
				
				.action-item {
					display: flex;
					flex-direction: column;
					align-items: center;
					padding: 28rpx 16rpx;
					background: #f8fafc;
					border-radius: 16rpx;
					transition: all 0.3s ease;
					
					&:active {
						transform: scale(0.96);
						background: var(--primary);
						
						.action-icon,
						.action-text {
							color: #fff;
						}
					}
					
					.action-icon {
						font-size: 52rpx;
						margin-bottom: 12rpx;
					}
					
					.action-text {
						font-size: 24rpx;
						color: var(--text-secondary);
						font-weight: 500;
					}
				}
			}
		}
		
		.export-section {
			background: #fff;
			border-radius: 20rpx;
			padding: 32rpx;
			box-shadow: 0 4rpx 20rpx rgba(22, 119, 255, 0.08);
			border: 1rpx solid rgba(22, 119, 255, 0.06);
			
			.export-form {
				.form-row {
					margin-bottom: 24rpx;
					
					.form-label {
						display: block;
						font-size: 28rpx;
						color: var(--text-primary);
						margin-bottom: 12rpx;
						font-weight: 500;
					}
					
					.picker-input {
						display: flex;
						align-items: center;
						justify-content: space-between;
						background: #f8fafc;
						border-radius: 12rpx;
						padding: 24rpx;
						font-size: 28rpx;
						color: var(--text-primary);
						border: 1rpx solid var(--border);
						
						.arrow {
							font-size: 32rpx;
							color: var(--text-tertiary);
						}
					}
				}
				
				.form-actions {
					display: flex;
					gap: 20rpx;
					margin-top: 32rpx;
					
					button {
						flex: 1;
						height: 84rpx;
						line-height: 84rpx;
						font-size: 28rpx;
						font-weight: 500;
						border-radius: 12rpx;
					}
					
					.btn-secondary {
						background: #f5f5f5;
						color: #333;
						border: 1rpx solid var(--border);
					}
					
					.btn-export {
						background: #f0f0f0;
						color: #333;
						box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
						border: 1rpx solid #e0e0e0;
					}
				}
			}
		}
	}
	
	/* 标签样式 */
	.tag {
		padding: 6rpx 16rpx;
		border-radius: 8rpx;
		font-size: 22rpx;
		font-weight: 500;
		
		&.tag-primary {
			background: #e6f7ff;
			color: var(--primary);
		}
		
		&.tag-danger {
			background: #fff1f0;
			color: var(--danger);
		}
		
		&.tag-warning {
			background: #fff7e6;
			color: var(--warning);
		}
	}
	
	/* 空状态 */
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 80rpx 40rpx;
		text-align: center;
		
		.empty-icon {
			font-size: 72rpx;
			margin-bottom: 20rpx;
		}
		
		.empty-text {
			font-size: 28rpx;
			color: var(--text-tertiary);
			margin-bottom: 12rpx;
		}
		
		.empty-subtext {
			font-size: 24rpx;
			color: var(--text-tertiary);
			opacity: 0.7;
		}
		
		.login-btn {
			margin-top: 32rpx;
			padding: 16rpx 48rpx;
			background: var(--primary);
			color: #fff;
			border-radius: 12rpx;
			font-size: 28rpx;
			font-weight: 500;
		}
	}
	
	/* 无角色视图 */
	.no-role-view,
	.not-login-view {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
	}
	
	/* 动画 */
	.fade-in {
		animation: fadeIn 0.4s ease-out;
	}
	
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(16rpx);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
