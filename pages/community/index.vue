<template>
	<view class="container">
		<!-- 状态标签 -->
		<view class="tabs-section">
			<view 
				v-for="(status, index) in statusTabs" 
				:key="index"
				class="tab-item"
				:class="{ active: currentStatus === status.value }"
				@click="switchStatus(status.value)">
				<text class="tab-label">{{ status.label }}</text>
				<text v-if="status.count > 0" class="badge">{{ status.count }}</text>
			</view>
		</view>
		
		<!-- 任务列表 -->
		<scroll-view 
			scroll-y 
			class="list-container"
			@scrolltolower="loadMore"
			refresher-enabled
			@refresherrefresh="refresh">
			<view v-for="item in taskList" :key="item._id" class="task-card" @click="goToDetail(item._id)">
				<view class="card-header">
					<view class="title-row">
						<text class="task-title">{{ item.title }}</text>
						<view class="tag-group">
							<text v-if="item.urgency === '特急'" class="tag tag-danger">特急</text>
							<text v-else-if="item.urgency === '紧急'" class="tag tag-warning">紧急</text>
							<text v-else class="tag tag-normal">一般</text>
						</view>
					</view>
					<text class="task-source">{{ item.source }}</text>
				</view>
				
				<view class="card-body">
					<view class="info-row">
						<text class="info-label">涉及人员</text>
						<text class="info-value">{{ item.parties || '未填写' }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">发生位置</text>
						<text class="info-value location">{{ item.location?.address || '未填写' }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">发生次数</text>
						<text class="info-value">{{ item.occur_count || 1 }}次</text>
					</view>
				</view>
				
				<view class="card-footer">
					<view class="time-section">
						<text class="time-icon">🕐</text>
						<text class="task-time">{{ formatTime(item.assign_time || item.create_time) }}</text>
					</view>
					<text class="status-text" :class="getStatusClass(item.status)">{{ item.status }}</text>
				</view>
				
				<view v-if="item.status === '待回访'" class="card-action">
					<button class="btn-visit" @click.stop="goToDetail(item._id)">立即回访</button>
				</view>
			</view>
			
			<view v-if="loading" class="loading">加载中...</view>
			<view v-if="!hasMore && taskList.length > 0" class="no-more">没有更多了</view>
			<view v-if="taskList.length === 0 && !loading" class="empty">
				<text class="empty-icon">📋</text>
				<text class="empty-text">暂无任务</text>
				<text class="empty-desc">当前状态下没有待处理的任务</text>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
	import { ref, onMounted } from 'vue'
	import { onShow } from '@dcloudio/uni-app'
	import { useUserStore } from '@/store/user'
	
	const userStore = useUserStore()
	
	const statusTabs = ref([
		{ label: '待回访', value: '待回访', count: 0 },
		{ label: '处理中', value: '处理中', count: 0 },
		{ label: '已完成', value: '已化解', count: 0 }
	])
	const currentStatus = ref('待回访')
	
	const taskList = ref([])
	const loading = ref(false)
	const page = ref(1)
	const pageSize = 10
	const hasMore = ref(true)
	
	onMounted(() => {
		loadTaskCounts()
		loadList()
	})
	
	onShow(() => {
		loadTaskCounts()
		refresh()
	})
	
	async function loadTaskCounts() {
		try {
			const countRes = await uniCloud.callFunction({
				name: 'getStatistics',
				data: {
					role: userStore.role,
					community: userStore.community
				}
			})
			
			if (countRes.result.success) {
				const data = countRes.result.data
				statusTabs.value[0].count = data?.pendingVisit || 0
				statusTabs.value[1].count = data?.processing || 0
				statusTabs.value[2].count = data?.resolved || 0
			}
		} catch (e) {
			console.error('加载任务数量失败', e)
		}
	}
	
	async function loadList() {
		if (loading.value) return
		
		loading.value = true
		try {
			const res = await uniCloud.callFunction({
				name: 'getDisputeList',
				data: {
					role: userStore.role,
					community: userStore.community,
					status: currentStatus.value,
					page: page.value,
					pageSize: pageSize
				}
			})
			
			if (res.result.success) {
				if (page.value === 1) {
					taskList.value = res.result.data
				} else {
					taskList.value.push(...res.result.data)
				}
				hasMore.value = res.result.hasMore
			}
		} catch (e) {
			console.error('加载任务列表失败', e)
			uni.showToast({ title: '加载失败', icon: 'none' })
		} finally {
			loading.value = false
		}
	}
	
	function switchStatus(status) {
		currentStatus.value = status
		page.value = 1
		hasMore.value = true
		loadList()
	}
	
	function refresh() {
		page.value = 1
		hasMore.value = true
		loadList()
	}
	
	function loadMore() {
		if (hasMore.value && !loading.value) {
			page.value++
			loadList()
		}
	}
	
	function goToDetail(id) {
		uni.navigateTo({ url: `/pages/detail/index?id=${id}` })
	}
	
	function formatTime(timestamp) {
		if (!timestamp) return ''
		const date = new Date(timestamp)
		const now = new Date()
		const diff = now - date
		const minutes = Math.floor(diff / 60000)
		
		if (minutes < 1) return '刚刚'
		if (minutes < 60) return `${minutes}分钟前`
		if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`
		return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
	}
	
	function getStatusClass(status) {
		const map = {
			'待回访': 'status-pending',
			'处理中': 'status-processing',
			'已化解': 'status-resolved',
			'已关闭': 'status-closed'
		}
		return map[status] || ''
	}

	const onShareAppMessage = () => ({
		title: '社区任务管理',
		path: '/pages/community/index',
		desc: '查看和处理社区矛盾纠纷任务',
		imageUrl: '/static/logo.png'
	})

	defineExpose({ onShareAppMessage })
</script>

<style lang="scss" scoped>
	.container {
		min-height: 100vh;
		background: linear-gradient(180deg, #e6f2ff 0%, #f0f7ff 100%);
		display: flex;
		flex-direction: column;
		padding: 60rpx 20rpx;
		padding-top: calc(60rpx + env(safe-area-inset-top));
		box-sizing: border-box;
	}
	
	/* 标签区域 */
	.tabs-section {
		background: #fff;
		border-radius: 16rpx;
		padding: 16rpx;
		margin-bottom: 20rpx;
		display: flex;
		box-shadow: 0 2rpx 12rpx rgba(22, 119, 255, 0.06);
		
		.tab-item {
			flex: 1;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 20rpx 0;
			position: relative;
			transition: all 0.3s ease;
			
			.tab-label {
				font-size: 28rpx;
				color: #666;
				font-weight: 500;
			}
			
			&.active {
				.tab-label {
					color: #1677ff;
					font-weight: 600;
				}
				
				&::after {
					content: '';
					position: absolute;
					bottom: 0;
					left: 50%;
					transform: translateX(-50%);
					width: 40rpx;
					height: 4rpx;
					background: #1677ff;
					border-radius: 2rpx;
				}
			}
			
			.badge {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				min-width: 32rpx;
				height: 32rpx;
				padding: 0 10rpx;
				margin-left: 8rpx;
				background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
				color: #fff;
				border-radius: 16rpx;
				font-size: 20rpx;
				font-weight: 600;
			}
		}
	}
	
	/* 列表区域 */
	.list-container {
		flex: 1;
		height: 0;
		
		.task-card {
			background: #fff;
			border-radius: 16rpx;
			padding: 28rpx;
			margin-bottom: 20rpx;
			box-shadow: 0 2rpx 12rpx rgba(22, 119, 255, 0.06);
			
			.card-header {
				margin-bottom: 20rpx;
				
				.title-row {
					display: flex;
					align-items: center;
					margin-bottom: 12rpx;
					
					.task-title {
						flex: 1;
						font-size: 30rpx;
						font-weight: 600;
						color: #333;
						margin-right: 16rpx;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
					}
					
					.tag-group {
						display: flex;
						gap: 8rpx;
						flex-shrink: 0;
						
						.tag {
							font-size: 20rpx;
							padding: 4rpx 12rpx;
							border-radius: 8rpx;
							font-weight: 500;
							
							&.tag-danger {
								background: #fff1f0;
								color: #ff4d4f;
							}
							
							&.tag-warning {
								background: #fff7e6;
								color: #faad14;
							}
							
							&.tag-normal {
								background: #f6ffed;
								color: #52c41a;
							}
						}
					}
				}
				
				.task-source {
					font-size: 24rpx;
					color: #999;
					display: block;
				}
			}
			
			.card-body {
				background: #f8fafc;
				border-radius: 12rpx;
				padding: 20rpx;
				margin-bottom: 20rpx;
				
				.info-row {
					display: flex;
					margin-bottom: 12rpx;
					font-size: 26rpx;
					
					&:last-child {
						margin-bottom: 0;
					}
					
					.info-label {
						color: #999;
						width: 120rpx;
						flex-shrink: 0;
					}
					
					.info-value {
						color: #333;
						flex: 1;
						
						&.location {
							display: -webkit-box;
							-webkit-box-orient: vertical;
							-webkit-line-clamp: 1;
							overflow: hidden;
						}
					}
				}
			}
			
			.card-footer {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 20rpx;
				
				.time-section {
					display: flex;
					align-items: center;
					gap: 8rpx;
					
					.time-icon {
						font-size: 24rpx;
					}
					
					.task-time {
						font-size: 24rpx;
						color: #999;
					}
				}
				
				.status-text {
					font-size: 24rpx;
					font-weight: 500;
					
					&.status-pending { color: #faad14; }
					&.status-processing { color: #1677ff; }
					&.status-resolved { color: #52c41a; }
					&.status-closed { color: #999; }
				}
			}
			
			.card-action {
				padding-top: 20rpx;
				border-top: 1rpx solid #f0f0f0;
				
				.btn-visit {
					width: 100%;
					height: 72rpx;
					line-height: 72rpx;
					background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
					color: #fff;
					border-radius: 36rpx;
					font-size: 28rpx;
					font-weight: 500;
					box-shadow: 0 4rpx 12rpx rgba(22, 119, 255, 0.2);
					
					&:active {
						transform: scale(0.98);
					}
					
					&::after {
						border: none;
					}
				}
			}
		}
		
		.loading, .no-more {
			text-align: center;
			padding: 40rpx;
			color: #999;
			font-size: 26rpx;
		}
		
		.empty {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 120rpx 40rpx;
			
			.empty-icon {
				font-size: 100rpx;
				margin-bottom: 20rpx;
			}
			
			.empty-text {
				font-size: 32rpx;
				color: #333;
				font-weight: 500;
				margin-bottom: 12rpx;
			}
			
			.empty-desc {
				font-size: 26rpx;
				color: #999;
			}
		}
	}
</style>
