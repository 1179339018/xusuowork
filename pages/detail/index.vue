<template>
	<view class="container">
		<!-- 自定义导航栏 -->
		<view class="nav-bar">
			<view class="nav-left" @click="goBack">
				<text class="back-icon">←</text>
			</view>
			<view class="nav-title">纠纷详情</view>
			<view class="nav-right"></view>
		</view>
		
		<scroll-view scroll-y class="content-scroll">
			<!-- 纠纷信息 -->
			<view class="info-card">
				<view class="card-header">
					<text class="card-title">纠纷信息</text>
					<text class="status-badge" :class="getStatusClass(disputeInfo.status)">{{ disputeInfo.status }}</text>
				</view>
				
				<view class="info-body">
					<view class="info-row">
						<text class="info-label">纠纷标题</text>
						<text class="info-value title">{{ disputeInfo.title }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">纠纷来源</text>
						<text class="tag tag-primary">{{ disputeInfo.source }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">紧急度</text>
						<text class="tag" :class="getUrgencyClass(disputeInfo.urgency)">{{ disputeInfo.urgency }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">涉及人员</text>
						<text class="info-value">{{ disputeInfo.parties || '未填写' }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">发生位置</text>
						<text class="info-value location">{{ disputeInfo.location?.address || '未填写' }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">发生次数</text>
						<text class="info-value">{{ disputeInfo.occur_count || 1 }}次</text>
					</view>
					<view class="info-row">
						<text class="info-label">创建时间</text>
						<text class="info-value">{{ formatDateTime(disputeInfo.create_time) }}</text>
					</view>
					
					<view class="description-section">
						<text class="section-label">纠纷描述</text>
						<view class="description-box">
							<text class="description-text">{{ disputeInfo.description }}</text>
						</view>
					</view>
					
					<map 
						v-if="disputeInfo.location?.latitude" 
						:latitude="disputeInfo.location.latitude" 
						:longitude="disputeInfo.location.longitude"
						:markers="markers"
						class="map-view">
					</map>
				</view>
			</view>
			
			<!-- 历史回访时间线 -->
			<view v-if="feedbacks.length > 0" class="timeline-card">
				<view class="card-header">
					<text class="card-title">回访记录</text>
					<text class="record-count">共{{ feedbacks.length }}条</text>
				</view>
				
				<view class="timeline">
					<view v-for="(feedback, index) in feedbacks" :key="feedback._id" class="timeline-item">
						<view class="timeline-left">
							<view class="timeline-dot" :class="getResultClass(feedback.result)"></view>
							<view v-if="index < feedbacks.length - 1" class="timeline-line"></view>
						</view>
						<view class="timeline-content">
							<view class="timeline-header">
								<text class="timeline-time">{{ formatDateTime(feedback.feedback_time) }}</text>
								<text class="result-tag" :class="getResultClass(feedback.result)">{{ feedback.result }}</text>
							</view>
							<view class="timeline-body">
								<view class="info-line">
									<text class="line-label">回访方式</text>
									<text class="line-value">{{ feedback.type }}</text>
								</view>
								<view v-if="feedback.method" class="info-line">
									<text class="line-label">处理措施</text>
									<text class="line-value">{{ feedback.method }}</text>
								</view>
								<view v-if="feedback.notes" class="info-line">
									<text class="line-label">备注</text>
									<text class="line-value">{{ feedback.notes }}</text>
								</view>
								<view v-if="feedback.media && feedback.media.length > 0" class="media-grid">
									<image 
										v-for="(media, idx) in feedback.media" 
										:key="idx"
										v-if="media.type === 'image'"
										:src="media.url"
										class="media-image"
										mode="aspectFill"
										@click="previewImage(media.url, feedback.media)" />
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 回访表单 -->
			<view v-if="userStore.isCommunity && canFeedback" class="feedback-card">
				<view class="card-header">
					<text class="card-title">提交回访</text>
				</view>
				
				<view class="feedback-form">
					<view class="form-item">
						<view class="form-label">
							<text class="label-text">回访方式</text>
							<text class="required">*</text>
						</view>
						<view class="option-group">
							<view 
								v-for="(type, index) in typeOptions" 
								:key="index"
								class="option-item"
								:class="{ active: feedbackForm.type === type }"
								@click="feedbackForm.type = type">
								<text>{{ type }}</text>
							</view>
						</view>
					</view>
					
					<view class="form-item">
						<view class="form-label">
							<text class="label-text">回访结果</text>
							<text class="required">*</text>
						</view>
						<view class="option-group">
							<view 
								v-for="(result, index) in resultOptions" 
								:key="index"
								class="option-item"
								:class="{ active: feedbackForm.result === result, success: result === '已化解', warning: result === '未化解' }"
								@click="feedbackForm.result = result">
								<text>{{ result }}</text>
							</view>
						</view>
					</view>
					
					<view class="form-item">
						<view class="form-label">
							<text class="label-text">处理措施</text>
						</view>
						<textarea 
							class="textarea" 
							v-model="feedbackForm.method" 
							placeholder="请描述采取的处理措施"
							maxlength="500" />
					</view>
					
					<view class="form-item">
						<view class="form-label">
							<text class="label-text">备注</text>
						</view>
						<textarea 
							class="textarea" 
							v-model="feedbackForm.notes" 
							placeholder="请输入备注信息（可选）"
							maxlength="200" />
					</view>
					
					<view class="form-item">
						<view class="form-label">
							<text class="label-text">照片/录音</text>
						</view>
						<view class="media-upload">
							<view v-for="(media, index) in feedbackForm.media" :key="index" class="media-item">
								<image 
									v-if="media.type === 'image'"
									:src="media.url"
									class="media-preview"
									mode="aspectFill"
									@click="previewImage(media.url, feedbackForm.media)" />
								<view v-else class="media-preview audio-preview">
									<text class="audio-icon">🎵</text>
									<text class="audio-name">{{ media.name || '录音' }}</text>
								</view>
								<view class="media-delete" @click="removeMedia(index)">×</view>
							</view>
							<view class="media-add" @click="chooseMedia">
								<text class="add-icon">+</text>
								<text class="add-text">添加</text>
							</view>
						</view>
					</view>
					
					<view class="form-item">
						<view class="form-label">
							<text class="label-text">下次回访日期</text>
						</view>
						<picker 
							mode="date" 
							:value="feedbackForm.nextDate"
							:start="minDate"
							@change="onDateChange">
							<view class="picker-box">
								<text :class="['picker-text', { placeholder: !feedbackForm.nextDate }]">
									{{ feedbackForm.nextDate || '选择日期（可选）' }}
								</text>
								<text class="arrow">›</text>
							</view>
						</picker>
					</view>
					
					<button 
						class="btn-submit" 
						@click="submitFeedback" 
						:loading="submitting"
						:disabled="submitting">
						<text v-if="!submitting">提交回访</text>
						<text v-else>提交中...</text>
					</button>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
	import { ref, reactive, computed, onMounted } from 'vue'
	import { useUserStore } from '@/store/user'
	
	const userStore = useUserStore()
	
	const disputeId = ref('')
	const disputeInfo = ref({})
	const feedbacks = ref([])
	const logs = ref([])
	const loading = ref(false)
	
	const typeOptions = ['见面', '电话']
	const resultOptions = ['已化解', '未化解']
	
	const feedbackForm = reactive({
		type: '',
		result: '',
		method: '',
		notes: '',
		media: [],
		nextDate: ''
	})
	
	const submitting = ref(false)
	const minDate = computed(() => {
		const tomorrow = new Date()
		tomorrow.setDate(tomorrow.getDate() + 1)
		return tomorrow.toISOString().split('T')[0]
	})
	
	const markers = ref([])
	
	const canFeedback = computed(() => {
		return disputeInfo.value.status === '待回访' || disputeInfo.value.status === '处理中'
	})
	
	onMounted(() => {
		const pages = getCurrentPages()
		const currentPage = pages[pages.length - 1]
		disputeId.value = currentPage.options?.id || ''
		
		if (disputeId.value) {
			loadDetail()
		}
	})
	
	async function loadDetail() {
		loading.value = true
		try {
			const res = await uniCloud.callFunction({
				name: 'getDisputeDetail',
				data: { disputeId: disputeId.value }
			})
			
			if (res.result.success) {
				disputeInfo.value = res.result.data.dispute
				feedbacks.value = res.result.data.feedbacks
				logs.value = res.result.data.logs
				
				if (disputeInfo.value.location?.latitude) {
					markers.value = [{
						id: 1,
						latitude: disputeInfo.value.location.latitude,
						longitude: disputeInfo.value.location.longitude,
						title: disputeInfo.value.location.address,
						width: 30,
						height: 30
					}]
				}
			} else {
				throw new Error(res.result.error || '加载失败')
			}
		} catch (e) {
			console.error('加载详情失败', e)
			uni.showToast({ title: e.message || '加载失败', icon: 'none' })
		} finally {
			loading.value = false
		}
	}
	
	function onDateChange(e) {
		feedbackForm.nextDate = e.detail.value
	}
	
	async function chooseMedia() {
		try {
			const res = await uni.chooseMedia({
				count: 9 - feedbackForm.media.length,
				mediaType: ['image', 'video'],
				sourceType: ['camera', 'album']
			})
			
			for (let tempFile of res.tempFiles) {
				const uploadRes = await uniCloud.uploadFile({
					filePath: tempFile.tempFilePath,
					cloudPath: `feedback/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${tempFile.tempFilePath.split('.').pop()}`
				})
				
				feedbackForm.media.push({
					type: tempFile.fileType === 'image' ? 'image' : 'audio',
					url: uploadRes.fileID,
					name: tempFile.name
				})
			}
		} catch (e) {
			console.error('选择媒体失败', e)
			if (e.errMsg && !e.errMsg.includes('cancel')) {
				uni.showToast({ title: '选择失败', icon: 'none' })
			}
		}
	}
	
	function removeMedia(index) {
		feedbackForm.media.splice(index, 1)
	}
	
	function previewImage(current, urls) {
		const imageUrls = urls.filter(m => m.type === 'image').map(m => m.url)
		uni.previewImage({ current: current, urls: imageUrls })
	}
	
	async function submitFeedback() {
		if (!feedbackForm.type) {
			uni.showToast({ title: '请选择回访方式', icon: 'none' })
			return
		}
		
		if (!feedbackForm.result) {
			uni.showToast({ title: '请选择回访结果', icon: 'none' })
			return
		}
		
		submitting.value = true
		
		try {
			const res = await uniCloud.callFunction({
				name: 'submitFeedback',
				data: {
					disputeId: disputeId.value,
					feedbackData: {
						type: feedbackForm.type,
						result: feedbackForm.result,
						method: feedbackForm.method,
						notes: feedbackForm.notes,
						media: feedbackForm.media,
						next_date: feedbackForm.nextDate
					},
					userInfo: { openid: userStore.openid, name: userStore.name }
				}
			})
			
			if (res.result.success) {
				uni.showToast({ title: '提交成功', icon: 'success' })
				
				feedbackForm.type = ''
				feedbackForm.result = ''
				feedbackForm.method = ''
				feedbackForm.notes = ''
				feedbackForm.media = []
				feedbackForm.nextDate = ''
				
				setTimeout(() => loadDetail(), 1500)
			} else {
				throw new Error(res.result.error || '提交失败')
			}
		} catch (e) {
			console.error('提交回访失败', e)
			uni.showToast({ title: e.message || '提交失败', icon: 'none' })
		} finally {
			submitting.value = false
		}
	}
	
	function formatDateTime(timestamp) {
		if (!timestamp) return ''
		const date = new Date(timestamp)
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		const hours = String(date.getHours()).padStart(2, '0')
		const minutes = String(date.getMinutes()).padStart(2, '0')
		return `${year}-${month}-${day} ${hours}:${minutes}`
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
			'一般': 'tag-primary',
			'紧急': 'tag-warning',
			'特急': 'tag-danger'
		}
		return map[urgency] || ''
	}
	
	function getResultClass(result) {
		return result === '已化解' ? 'tag-success' : 'tag-warning'
	}

	function goBack() {
		uni.navigateBack({ delta: 1 })
	}

	const onShareAppMessage = () => ({
		title: `纠纷详情：${disputeInfo.value.title || '矛盾纠纷'}`,
		path: `/pages/detail/index?id=${disputeId.value}`,
		desc: '查看矛盾纠纷详情和处理记录',
		imageUrl: '/static/logo.png'
	})

	defineExpose({ onShareAppMessage })
</script>

<style lang="scss" scoped>
	.container {
		min-height: 100vh;
		background: linear-gradient(180deg, #e6f2ff 0%, #f0f7ff 100%);
		box-sizing: border-box;
	}

	/* 导航栏 */
	.nav-bar {
		height: 88rpx;
		background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 24rpx;
		box-shadow: 0 2rpx 12rpx rgba(22, 119, 255, 0.1);
		position: sticky;
		top: 0;
		z-index: 99;
		
		.nav-left {
			width: 80rpx;
			height: 100%;
			display: flex;
			align-items: center;
			justify-content: flex-start;
			
			.back-icon {
				font-size: 40rpx;
				color: #fff;
				font-weight: bold;
				line-height: 1;
			}
		}
		
		.nav-title {
			flex: 1;
			text-align: center;
			font-size: 32rpx;
			font-weight: 600;
			color: #fff;
		}
		
		.nav-right {
			width: 80rpx;
		}
	}

	.content-scroll {
		padding: 40rpx 20rpx;
		padding-top: calc(40rpx + env(safe-area-inset-top));
		height: calc(100vh - 88rpx);
	}
	
	/* 卡片通用样式 */
	.info-card, .timeline-card, .feedback-card {
		background: #fff;
		border-radius: 16rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 12rpx rgba(22, 119, 255, 0.06);
		overflow: hidden;
		
		.card-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 24rpx 28rpx;
			border-bottom: 1rpx solid #f0f0f0;
			
			.card-title {
				font-size: 30rpx;
				font-weight: 600;
				color: #333;
			}
			
			.status-badge {
				font-size: 24rpx;
				padding: 6rpx 16rpx;
				border-radius: 20rpx;
				font-weight: 500;
				
				&.status-pending {
					background: #fff7e6;
					color: #faad14;
				}
				&.status-processing {
					background: #e6f7ff;
					color: #1677ff;
				}
				&.status-resolved {
					background: #f6ffed;
					color: #52c41a;
				}
				&.status-closed {
					background: #f5f5f5;
					color: #999;
				}
			}
			
			.record-count {
				font-size: 24rpx;
				color: #999;
			}
		}
	}
	
	/* 信息卡片 */
	.info-body {
		padding: 24rpx 28rpx;
		
		.info-row {
			display: flex;
			align-items: center;
			margin-bottom: 20rpx;
			
			&:last-child {
				margin-bottom: 0;
			}
			
			.info-label {
				width: 140rpx;
				font-size: 26rpx;
				color: #999;
				flex-shrink: 0;
			}
			
			.info-value {
				flex: 1;
				font-size: 28rpx;
				color: #333;
				
				&.title {
					font-weight: 600;
				}
				
				&.location {
					display: -webkit-box;
					-webkit-box-orient: vertical;
					-webkit-line-clamp: 1;
					overflow: hidden;
				}
			}
			
			.tag {
				font-size: 22rpx;
				padding: 4rpx 12rpx;
				border-radius: 8rpx;
				font-weight: 500;
				
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
		
		.description-section {
			margin-top: 24rpx;
			padding-top: 24rpx;
			border-top: 1rpx solid #f0f0f0;
			
			.section-label {
				font-size: 26rpx;
				color: #999;
				margin-bottom: 16rpx;
				display: block;
			}
			
			.description-box {
				background: #f8fafc;
				border-radius: 12rpx;
				padding: 20rpx;
				
				.description-text {
					font-size: 28rpx;
					color: #333;
					line-height: 1.6;
				}
			}
		}
		
		.map-view {
			width: 100%;
			height: 360rpx;
			border-radius: 12rpx;
			margin-top: 24rpx;
		}
	}
	
	/* 时间线 */
	.timeline {
		padding: 24rpx 28rpx;
		
		.timeline-item {
			display: flex;
			margin-bottom: 32rpx;
			
			&:last-child {
				margin-bottom: 0;
			}
			
			.timeline-left {
				display: flex;
				flex-direction: column;
				align-items: center;
				margin-right: 20rpx;
				
				.timeline-dot {
					width: 24rpx;
					height: 24rpx;
					border-radius: 50%;
					
					&.tag-success {
						background: #52c41a;
					}
					&.tag-warning {
						background: #faad14;
					}
				}
				
				.timeline-line {
					flex: 1;
					width: 2rpx;
					background: #e8e8e8;
					margin-top: 8rpx;
				}
			}
			
			.timeline-content {
				flex: 1;
				
				.timeline-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 16rpx;
					
					.timeline-time {
						font-size: 24rpx;
						color: #999;
					}
					
					.result-tag {
						font-size: 22rpx;
						padding: 4rpx 12rpx;
						border-radius: 8rpx;
						font-weight: 500;
						
						&.tag-success {
							background: #f6ffed;
							color: #52c41a;
						}
						&.tag-warning {
							background: #fff7e6;
							color: #faad14;
						}
					}
				}
				
				.timeline-body {
					background: #f8fafc;
					border-radius: 12rpx;
					padding: 20rpx;
					
					.info-line {
						display: flex;
						margin-bottom: 12rpx;
						font-size: 26rpx;
						
						&:last-child {
							margin-bottom: 0;
						}
						
						.line-label {
							color: #999;
							width: 140rpx;
							flex-shrink: 0;
						}
						
						.line-value {
							color: #333;
							flex: 1;
						}
					}
					
					.media-grid {
						display: flex;
						flex-wrap: wrap;
						gap: 16rpx;
						margin-top: 16rpx;
						
						.media-image {
							width: 140rpx;
							height: 140rpx;
							border-radius: 8rpx;
						}
					}
				}
			}
		}
	}
	
	/* 回访表单 */
	.feedback-form {
		padding: 24rpx 28rpx;
		
		.form-item {
			margin-bottom: 28rpx;
			
			&:last-child {
				margin-bottom: 0;
			}
			
			.form-label {
				display: flex;
				align-items: center;
				margin-bottom: 16rpx;
				
				.label-text {
					font-size: 28rpx;
					color: #333;
					font-weight: 500;
				}
				
				.required {
					color: #ff4d4f;
					margin-left: 8rpx;
				}
			}
			
			.option-group {
				display: flex;
				gap: 16rpx;
				
				.option-item {
					flex: 1;
					padding: 20rpx 0;
					text-align: center;
					background: #f8fafc;
					border-radius: 12rpx;
					font-size: 28rpx;
					color: #666;
					transition: all 0.3s ease;
					
					&.active {
						background: #e6f7ff;
						color: #1677ff;
						font-weight: 500;
						
						&.success {
							background: #f6ffed;
							color: #52c41a;
						}
						
						&.warning {
							background: #fff7e6;
							color: #faad14;
						}
					}
				}
			}
			
			.textarea {
				width: 100%;
				min-height: 160rpx;
				padding: 20rpx 24rpx;
				background: #f8fafc;
				border-radius: 12rpx;
				font-size: 28rpx;
				color: #333;
				box-sizing: border-box;
				
				&::placeholder {
					color: #999;
				}
			}
			
			.picker-box {
				display: flex;
				justify-content: space-between;
				align-items: center;
				height: 80rpx;
				padding: 0 24rpx;
				background: #f8fafc;
				border-radius: 12rpx;
				
				.picker-text {
					font-size: 28rpx;
					color: #333;
					
					&.placeholder {
						color: #999;
					}
				}
				
				.arrow {
					color: #999;
					font-size: 32rpx;
				}
			}
			
			.media-upload {
				display: flex;
				flex-wrap: wrap;
				gap: 16rpx;
				
				.media-item {
					position: relative;
					width: 140rpx;
					height: 140rpx;
					
					.media-preview {
						width: 100%;
						height: 100%;
						border-radius: 8rpx;
						
						&.audio-preview {
							display: flex;
							flex-direction: column;
							align-items: center;
							justify-content: center;
							background: #f8fafc;
							
							.audio-icon {
								font-size: 40rpx;
								margin-bottom: 8rpx;
							}
							
							.audio-name {
								font-size: 20rpx;
								color: #666;
							}
						}
					}
					
					.media-delete {
						position: absolute;
						top: -8rpx;
						right: -8rpx;
						width: 36rpx;
						height: 36rpx;
						line-height: 32rpx;
						text-align: center;
						background: #ff4d4f;
						color: #fff;
						border-radius: 50%;
						font-size: 28rpx;
					}
				}
				
				.media-add {
					width: 140rpx;
					height: 140rpx;
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					background: #f8fafc;
					border-radius: 8rpx;
					border: 2rpx dashed #d9d9d9;
					
					.add-icon {
						font-size: 40rpx;
						color: #999;
						margin-bottom: 8rpx;
					}
					
					.add-text {
						font-size: 22rpx;
						color: #999;
					}
				}
			}
		}
		
		.btn-submit {
			width: 100%;
			height: 88rpx;
			line-height: 88rpx;
			background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
			color: #fff;
			border-radius: 44rpx;
			font-size: 32rpx;
			font-weight: 600;
			margin-top: 20rpx;
			box-shadow: 0 8rpx 24rpx rgba(22, 119, 255, 0.3);
			
			&:active {
				transform: scale(0.98);
			}
			
			&::after {
				border: none;
			}
			
			&[disabled] {
				opacity: 0.7;
			}
		}
	}
</style>
