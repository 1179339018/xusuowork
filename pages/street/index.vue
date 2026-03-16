<template>
	<view class="container">
		<!-- 搜索栏 -->
		<view class="search-section">
			<view class="search-box">
				<text class="search-icon">🔍</text>
				<input 
					class="search-input" 
					v-model="keyword" 
					placeholder="搜索纠纷标题/当事人/描述" 
					@confirm="refresh" 
				/>
			</view>
			<view class="filter-btn" @click="showDatePicker = true">
				<text class="filter-icon">📅</text>
				<text class="filter-text">{{ dateRangeText }}</text>
			</view>
		</view>
		
		<!-- 状态标签 -->
		<view class="tabs-section">
			<scroll-view scroll-x class="tabs-scroll" :show-scrollbar="false">
				<view class="tabs-wrapper">
					<view 
						v-for="(item, index) in statusTabs" 
						:key="index"
						class="tab-item"
						:class="{ active: currentStatus === item }"
						@click="switchStatus(item)">
						<text>{{ item }}</text>
					</view>
				</view>
			</scroll-view>
		</view>
		
		<!-- 统计概览 -->
		<view class="stats-section">
			<view class="stats-card">
				<text class="stats-num">{{ statistics.todayNew }}</text>
				<text class="stats-label">今日新增</text>
			</view>
			<view class="stats-card warning">
				<text class="stats-num">{{ statistics.pendingAssign }}</text>
				<text class="stats-label">待分派</text>
			</view>
			<view class="stats-card success">
				<text class="stats-num">{{ statistics.resolved }}</text>
				<text class="stats-label">已化解</text>
			</view>
		</view>
		
		<!-- 列表 -->
		<scroll-view 
			scroll-y 
			class="list-container"
			@scrolltolower="loadMore"
			refresher-enabled
			@refresherrefresh="refresh">
			<view v-for="item in disputeList" :key="item._id" class="list-item" @click="goToDetail(item._id)">
				<view class="item-header">
					<view class="header-left">
						<text class="item-title">{{ item.title }}</text>
						<text class="tag" :class="getUrgencyClass(item.urgency)">{{ item.urgency }}</text>
					</view>
					<text class="status-text" :class="getStatusClass(item.status)">{{ item.status }}</text>
				</view>
				
				<view class="item-content">
					<view class="info-row">
						<text class="label">来源</text>
						<text class="value">{{ item.source }}</text>
					</view>
					<view class="info-row">
						<text class="label">时间</text>
						<text class="value">{{ formatTime(item.create_time) }}</text>
					</view>
					<view class="info-row">
						<text class="label">位置</text>
						<text class="value location">{{ item.location?.address || '未知' }}</text>
					</view>
				</view>
				
				<view class="item-footer" v-if="item.status === '待分派'">
					<button class="btn-assign" @click.stop="openAssignModal(item)">分派社区</button>
				</view>
			</view>
			
			<view v-if="loading" class="loading">加载中...</view>
			<view v-if="!hasMore && disputeList.length > 0" class="no-more">没有更多了</view>
			<view v-if="disputeList.length === 0 && !loading" class="empty">
				<text class="empty-icon">📭</text>
				<text class="empty-text">暂无相关纠纷</text>
			</view>
		</scroll-view>
		
		<!-- 分派弹窗 -->
		<view class="modal-mask" v-if="showAssign" @click="showAssign = false">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">分派纠纷</text>
					<text class="close-btn" @click="showAssign = false">×</text>
				</view>
				<view class="modal-body">
					<view class="form-item">
						<text class="form-label">选择社区</text>
						<picker mode="selector" :range="communityOptions" :value="assignForm.communityIndex" @change="onCommunityChange">
							<view class="picker-input">
								<text class="picker-text">{{ assignForm.communityName || '请选择社区' }}</text>
								<text class="arrow">›</text>
							</view>
						</picker>
					</view>
					<view class="form-item">
						<text class="form-label">备注</text>
						<textarea 
							class="textarea" 
							v-model="assignForm.remark" 
							placeholder="请输入分派备注（可选）"
							maxlength="200" />
					</view>
				</view>
				<view class="modal-footer">
					<button class="btn-cancel" @click="showAssign = false">取消</button>
					<button class="btn-confirm" @click="confirmAssign" :loading="assigning">确认分派</button>
				</view>
			</view>
		</view>
		
		<!-- 日期选择器 -->
		<picker 
			mode="date" 
			:value="startDate"
			:end="endDate"
			@change="onStartDateChange"
			v-if="showDatePicker">
		</picker>
	</view>
</template>

<script setup>
	import { ref, reactive, computed, onMounted } from 'vue'
	import { onShow } from '@dcloudio/uni-app'
	import { useUserStore } from '@/store/user'
	import { useDisputeStore } from '@/store/dispute'
	
	const userStore = useUserStore()
	const disputeStore = useDisputeStore()
	
	const statusTabs = ['全部', '待分派', '待回访', '处理中', '已化解']
	const currentStatus = ref('全部')
	const keyword = ref('')
	const startDate = ref('')
	const endDate = ref('')
	const showDatePicker = ref(false)
	
	const disputeList = ref([])
	const loading = ref(false)
	const page = ref(1)
	const pageSize = 10
	const hasMore = ref(true)

	const statistics = ref({
		todayNew: 0,
		pendingAssign: 0,
		resolved: 0
	})

	const showAssign = ref(false)
	const assigning = ref(false)
	const currentDispute = ref(null)
	const assignForm = reactive({
		communityId: '',
		communityName: '',
		communityIndex: 0,
		remark: ''
	})
	const communityOptions = ref(['社区A', '社区B', '社区C', '社区D'])

	const dateRangeText = computed(() => {
		if (startDate.value && endDate.value) {
			return `${startDate.value} 至 ${endDate.value}`
		}
		return '筛选日期'
	})

	onMounted(() => {
		loadStatistics()
		loadList()
	})

	onShow(() => {
		loadStatistics()
		refresh()
	})

	async function loadStatistics() {
		try {
			const res = await uniCloud.callFunction({
				name: 'getStatistics',
				data: { role: userStore.role }
			})
			if (res.result.success) {
				statistics.value = res.result.data
			}
		} catch (e) {
			console.error('加载统计失败', e)
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
					status: currentStatus.value === '全部' ? '' : currentStatus.value,
					keyword: keyword.value,
					startDate: startDate.value,
					endDate: endDate.value,
					page: page.value,
					pageSize: pageSize
				}
			})
			
			if (res && res.result) {
				if (res.result.success) {
					if (page.value === 1) {
						disputeList.value = res.result.data || []
					} else {
						disputeList.value.push(...(res.result.data || []))
					}
					hasMore.value = res.result.hasMore || false
				} else {
					console.error('加载列表失败:', res.result.error)
					uni.showToast({ title: '加载失败', icon: 'none' })
				}
			} else {
				console.error('加载列表失败: 无效响应')
				uni.showToast({ title: '网络异常', icon: 'none' })
			}
		} catch (e) {
			console.error('加载列表失败', e)
			uni.showToast({ title: '网络异常', icon: 'none' })
		} finally {
			loading.value = false
		}
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
	
	function switchStatus(status) {
		currentStatus.value = status
		refresh()
	}
	
	function goToDetail(id) {
		uni.navigateTo({ url: `/pages/detail/index?id=${id}` })
	}
	
	function openAssignModal(item) {
		currentDispute.value = item
		assignForm.remark = ''
		assignForm.communityId = ''
		assignForm.communityName = ''
		showAssign.value = true
	}
	
	function onCommunityChange(e) {
		const index = e.detail.value
		assignForm.communityIndex = index
		assignForm.communityName = communityOptions.value[index]
		assignForm.communityId = `community_${index + 1}`
	}
	
	async function confirmAssign() {
		if (!assignForm.communityId) {
			uni.showToast({ title: '请选择社区', icon: 'none' })
			return
		}
		
		assigning.value = true
		try {
			const res = await uniCloud.callFunction({
				name: 'assignToCommunity',
				data: {
					disputeId: currentDispute.value._id,
					communityId: assignForm.communityId,
					remark: assignForm.remark,
					userInfo: { openid: userStore.openid, name: userStore.name }
				}
			})
			
			if (res.result.success) {
				uni.showToast({ title: '分派成功', icon: 'success' })
				showAssign.value = false
				refresh()
				loadStatistics()
			} else {
				throw new Error(res.result.error)
			}
		} catch (e) {
			console.error('分派失败', e)
			uni.showToast({ title: '分派失败', icon: 'none' })
		} finally {
			assigning.value = false
		}
	}
	
	function onStartDateChange(e) {
		startDate.value = e.detail.value
		showDatePicker.value = false
		refresh()
	}
	
	function formatTime(timestamp) {
		if (!timestamp) return ''
		const date = new Date(timestamp)
		return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
	}
	
	function getStatusClass(status) {
		const map = {
			'待分派': 'status-pending',
			'待回访': 'status-pending',
			'处理中': 'status-processing',
			'已化解': 'status-resolved',
			'已关闭': 'status-closed'
		}
		return map[status] || ''
	}
	
	function getUrgencyClass(urgency) {
		const map = {
			'特急': 'tag-danger',
			'紧急': 'tag-warning',
			'一般': 'tag-primary'
		}
		return map[urgency] || ''
	}

	const onShareAppMessage = () => ({
		title: '街道纠纷管理',
		path: '/pages/street/index',
		desc: '管理和分派矛盾纠纷，提升治理效率',
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
		padding: 100rpx 20rpx;
		padding-top: calc(100rpx + env(safe-area-inset-top));
		box-sizing: border-box;
	}
	
	/* 搜索区域 */
	.search-section {
		background: #fff;
		border-radius: 16rpx;
		padding: 20rpx;
		margin-bottom: 20rpx;
		display: flex;
		align-items: center;
		gap: 16rpx;
		box-shadow: 0 2rpx 12rpx rgba(22, 119, 255, 0.06);
		
		.search-box {
			flex: 1;
			background: #f5f7fa;
			border-radius: 30rpx;
			padding: 16rpx 24rpx;
			display: flex;
			align-items: center;
			
			.search-icon {
				font-size: 28rpx;
				margin-right: 12rpx;
				color: #999;
			}
			
			.search-input {
				flex: 1;
				font-size: 28rpx;
				color: #333;
			}
		}
		
		.filter-btn {
			display: flex;
			align-items: center;
			gap: 8rpx;
			padding: 16rpx 20rpx;
			background: #f5f7fa;
			border-radius: 30rpx;
			
			.filter-icon {
				font-size: 24rpx;
			}
			
			.filter-text {
				font-size: 24rpx;
				color: #666;
				max-width: 140rpx;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
		}
	}
	
	/* 标签区域 */
	.tabs-section {
		background: #fff;
		border-radius: 16rpx;
		padding: 16rpx 0;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 12rpx rgba(22, 119, 255, 0.06);
		
		.tabs-scroll {
			white-space: nowrap;
			
			.tabs-wrapper {
				display: flex;
				padding: 0 20rpx;
				
				.tab-item {
					padding: 16rpx 32rpx;
					font-size: 28rpx;
					color: #666;
					position: relative;
					transition: all 0.3s ease;
					
					&.active {
						color: #1677ff;
						font-weight: 600;
						
						&::after {
							content: '';
							position: absolute;
							bottom: 0;
							left: 50%;
							transform: translateX(-50%);
							width: 32rpx;
							height: 4rpx;
							background: #1677ff;
							border-radius: 2rpx;
						}
					}
				}
			}
		}
	}
	
	/* 统计区域 */
	.stats-section {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16rpx;
		margin-bottom: 20rpx;
		
		.stats-card {
			background: #fff;
			border-radius: 16rpx;
			padding: 28rpx 16rpx;
			text-align: center;
			box-shadow: 0 2rpx 12rpx rgba(22, 119, 255, 0.06);
			position: relative;
			overflow: hidden;
			
			&::before {
				content: '';
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				height: 4rpx;
				background: linear-gradient(90deg, #1677ff 0%, #4096ff 100%);
			}
			
			&.warning::before {
				background: linear-gradient(90deg, #faad14 0%, #ffc53d 100%);
			}
			
			&.success::before {
				background: linear-gradient(90deg, #52c41a 0%, #73d13d 100%);
			}
			
			.stats-num {
				font-size: 40rpx;
				font-weight: bold;
				color: #1677ff;
				margin-bottom: 8rpx;
				display: block;
			}
			
			&.warning .stats-num {
				color: #faad14;
			}
			
			&.success .stats-num {
				color: #52c41a;
			}
			
			.stats-label {
				font-size: 24rpx;
				color: #666;
			}
		}
	}
	
	/* 列表区域 */
	.list-container {
		flex: 1;
		height: 0;
		
		.list-item {
			background: #fff;
			border-radius: 16rpx;
			padding: 28rpx;
			margin-bottom: 20rpx;
			box-shadow: 0 2rpx 12rpx rgba(22, 119, 255, 0.06);
			
			.item-header {
				display: flex;
				justify-content: space-between;
				align-items: flex-start;
				margin-bottom: 20rpx;
				
				.header-left {
					display: flex;
					align-items: center;
					flex: 1;
					margin-right: 16rpx;
					
					.item-title {
						font-size: 30rpx;
						font-weight: 600;
						color: #333;
						flex: 1;
						margin-right: 12rpx;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
					}
					
					.tag {
						font-size: 20rpx;
						padding: 4rpx 12rpx;
						border-radius: 8rpx;
						font-weight: 500;
						flex-shrink: 0;
						
						&.tag-primary {
							background: #e6f7ff;
							color: #1677ff;
						}
						
						&.tag-warning {
							background: #fff7e6;
							color: #faad14;
						}
						
						&.tag-danger {
							background: #fff1f0;
							color: #ff4d4f;
						}
					}
				}
				
				.status-text {
					font-size: 24rpx;
					font-weight: 500;
					flex-shrink: 0;
					
					&.status-pending { color: #faad14; }
					&.status-processing { color: #1677ff; }
					&.status-resolved { color: #52c41a; }
					&.status-closed { color: #999; }
				}
			}
			
			.item-content {
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
					
					.label {
						color: #999;
						width: 80rpx;
						flex-shrink: 0;
					}
					
					.value {
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
			
			.item-footer {
				display: flex;
				justify-content: flex-end;
				
				.btn-assign {
					font-size: 26rpx;
					background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
					color: #fff;
					padding: 12rpx 32rpx;
					border-radius: 30rpx;
					margin: 0;
					box-shadow: 0 4rpx 12rpx rgba(22, 119, 255, 0.2);
					
					&:active {
						transform: scale(0.96);
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
				font-size: 80rpx;
				margin-bottom: 20rpx;
			}
			
			.empty-text {
				font-size: 28rpx;
				color: #999;
			}
		}
	}
	
	/* 弹窗样式 */
	.modal-mask {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 999;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40rpx;
	}
	
	.modal-content {
		background: #fff;
		width: 100%;
		max-width: 600rpx;
		border-radius: 20rpx;
		overflow: hidden;
		animation: slideUp 0.3s ease;
	}
	
	@keyframes slideUp {
		from {
			transform: translateY(50rpx);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
	
	.modal-header {
		padding: 32rpx;
		border-bottom: 1rpx solid #f0f0f0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		
		.modal-title {
			font-size: 32rpx;
			font-weight: 600;
			color: #333;
		}
		
		.close-btn {
			font-size: 40rpx;
			color: #999;
			line-height: 1;
			padding: 8rpx;
		}
	}
	
	.modal-body {
		padding: 32rpx;
		
		.form-item {
			margin-bottom: 28rpx;
			
			&:last-child {
				margin-bottom: 0;
			}
			
			.form-label {
				display: block;
				font-size: 28rpx;
				color: #333;
				margin-bottom: 16rpx;
				font-weight: 500;
			}
			
			.picker-input {
				background: #f5f7fa;
				padding: 24rpx;
				border-radius: 12rpx;
				display: flex;
				justify-content: space-between;
				align-items: center;
				
				.picker-text {
					font-size: 28rpx;
					color: #333;
				}
				
				.arrow {
					font-size: 32rpx;
					color: #999;
				}
			}
			
			.textarea {
				background: #f5f7fa;
				width: 100%;
				height: 160rpx;
				padding: 20rpx;
				border-radius: 12rpx;
				font-size: 28rpx;
				box-sizing: border-box;
			}
		}
	}
	
	.modal-footer {
		display: flex;
		border-top: 1rpx solid #f0f0f0;
		
		.btn-cancel, .btn-confirm {
			flex: 1;
			background: #fff;
			border: none;
			border-radius: 0;
			font-size: 30rpx;
			padding: 28rpx 0;
			font-weight: 500;
			
			&::after {
				border: none;
			}
		}
		
		.btn-cancel {
			color: #666;
			border-right: 1rpx solid #f0f0f0;
		}
		
		.btn-confirm {
			color: #1677ff;
		}
	}
</style>
