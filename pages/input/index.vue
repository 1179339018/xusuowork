<template>
	<view class="container" :style="{ paddingTop: safeAreaTop + 'px' }">
		<scroll-view scroll-y class="form-container">
			<!-- 表单卡片 -->
			<view class="form-card">
				<view class="card-title">基本信息</view>
				
				<view class="form-item">
					<view class="form-label">
						<text class="label-text">纠纷来源</text>
						<text class="required">*</text>
					</view>
					<picker mode="selector" :range="sourceOptions" :value="sourceIndex" @change="onSourceChange">
						<view class="picker-box">
							<text :class="['picker-text', { placeholder: !formData.source }]">
								{{ formData.source || '请选择纠纷来源' }}
							</text>
							<text class="arrow">›</text>
						</view>
					</picker>
				</view>
				
				<view class="form-item">
					<view class="form-label">
						<text class="label-text">所属社区</text>
						<text class="required">*</text>
					</view>
					<picker mode="selector" :range="communityOptions" :value="communityIndex" @change="onCommunityChange">
						<view class="picker-box">
							<text :class="['picker-text', { placeholder: !formData.community }]">
								{{ formData.community || '请选择所属社区' }}
							</text>
							<text class="arrow">›</text>
						</view>
					</picker>
				</view>
				
				<view class="form-item">
					<view class="form-label">
						<text class="label-text">纠纷标题</text>
						<text class="required">*</text>
					</view>
					<input 
						class="input" 
						v-model="formData.title" 
						placeholder="请输入纠纷标题" 
						maxlength="100" 
					/>
				</view>
				
				<view class="form-item">
					<view class="form-label">
						<text class="label-text">纠纷描述</text>
						<text class="required">*</text>
					</view>
					<textarea 
						class="textarea" 
						v-model="formData.description" 
						placeholder="请详细描述纠纷情况" 
						maxlength="500" 
					/>
				</view>
			</view>
			
			<!-- 位置信息 -->
			<view class="form-card">
				<view class="card-title">位置信息</view>
				
				<view class="form-item">
					<view class="form-label">
						<text class="label-text">发生位置</text>
						<text class="required">*</text>
					</view>
					<view class="location-box" @click="chooseLocation">
						<view v-if="formData.location.address" class="location-selected">
							<text class="location-icon">📍</text>
							<text class="location-text">{{ formData.location.address }}</text>
							<text class="change-btn">修改</text>
						</view>
						<view v-else class="location-empty">
							<text class="location-icon">📍</text>
							<text class="location-tip">点击选择位置</text>
						</view>
					</view>
					<map v-if="formData.location.latitude" 
						:latitude="formData.location.latitude" 
						:longitude="formData.location.longitude"
						:markers="markers"
						class="map-view"
						@tap="chooseLocation">
					</map>
				</view>
			</view>
			
			<!-- 其他信息 -->
			<view class="form-card">
				<view class="card-title">其他信息</view>
				
				<view class="form-item">
					<view class="form-label">
						<text class="label-text">涉及人员</text>
					</view>
					<input 
						class="input" 
						v-model="formData.parties" 
						placeholder="请输入涉及人员姓名，多人用逗号分隔" 
					/>
				</view>
				
				<view class="form-item">
					<view class="form-label">
						<text class="label-text">风险程度</text>
					</view>
					<view class="urgency-group">
						<view 
							v-for="(item, index) in urgencyOptions" 
							:key="index"
							class="urgency-item"
							:class="{ active: formData.urgency === item }"
							@click="formData.urgency = item">
							<text class="urgency-dot" :class="getUrgencyClass(item)"></text>
							<text class="urgency-text">{{ item }}</text>
						</view>
					</view>
				</view>
				
				<view class="form-item">
					<view class="form-label">
						<text class="label-text">发生次数</text>
					</view>
					<view class="count-box">
						<text class="count-btn" @click="decreaseCount">−</text>
						<input 
							class="count-input" 
							type="number" 
							v-model.number="formData.occur_count" 
							placeholder="1" 
						/>
						<text class="count-btn" @click="increaseCount">+</text>
					</view>
				</view>
			</view>
			
			<!-- 提交按钮 -->
			<view class="submit-section">
				<button 
					class="btn-submit" 
					@click="submitForm" 
					:loading="submitting"
					:disabled="submitting">
					<text v-if="!submitting">提交录入</text>
					<text v-else>提交中...</text>
				</button>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
	import { ref, reactive, onMounted, onUnmounted } from 'vue'
	import { useUserStore } from '@/store/user'
	
	const userStore = useUserStore()
	
	const sourceOptions = ['接处警', '社区摸排', '工作发现', '其他']
const urgencyOptions = ['低风险', '中风险', '高风险']
const communityOptions = ['光大街社区', '大来井社区', '核桃湾社区', '火井沱社区', '大湾井社区', '马吃水社区', '芭蕉冲社区', '其他']
const sourceIndex = ref(0)
const communityIndex = ref(0)
const safeAreaTop = ref(0)
	
	const formData = reactive({
	source: '',
	title: '',
	description: '',
	community: '',
	location: {
		address: '',
		latitude: null,
		longitude: null
	},
	parties: '',
	urgency: '低风险',
	occur_count: 1
})
	
	const markers = ref([])
const submitting = ref(false)

// 获取导航栏配置
const getNavbarConfig = () => {
	try {
		// 获取系统信息
		const systemInfo = uni.getSystemInfoSync()
		
		// 获取胶囊按钮位置信息
		const menuButtonInfo = uni.getMenuButtonBoundingClientRect()
		
		// 状态栏高度
		const statusBarHeight = systemInfo.statusBarHeight || 0
		
		// 胶囊按钮高度
		const menuButtonHeight = menuButtonInfo.height || 32
		
		// 胶囊按钮距离顶部的距离
		const menuButtonTop = menuButtonInfo.top || 0
		
		// 计算导航栏总高度
		// 导航栏高度 = 胶囊按钮高度 + (胶囊按钮顶部距离 - 状态栏高度) * 2
		const navbarHeight = menuButtonHeight + (menuButtonTop - statusBarHeight) * 2
		
		// 计算内容区域距离顶部的安全距离
		// 安全距离 = 状态栏高度 + 导航栏高度
		const safeAreaTopValue = statusBarHeight + navbarHeight
		
		return {
			statusBarHeight,
			menuButtonHeight,
			menuButtonTop,
			navbarHeight,
			safeAreaTop: safeAreaTopValue
		}
	} catch (error) {
		console.error('获取导航栏配置失败:', error)
		// 降级处理：使用默认值
		return {
			statusBarHeight: 44,
			menuButtonHeight: 32,
			menuButtonTop: 48,
			navbarHeight: 88,
			safeAreaTop: 132
		}
	}
}

// 初始化导航栏配置
const initNavbar = () => {
	const config = getNavbarConfig()
	safeAreaTop.value = config.safeAreaTop
}

// 生命周期
onMounted(() => {
	initNavbar()
	// 监听页面显示事件
	uni.$on('pageShow', () => {
		initNavbar()
	})
})

// 页面卸载时移除监听
onUnmounted(() => {
	uni.$off('pageShow')
})

// 获取风险程度对应的类名
function getUrgencyClass(urgency) {
  const classMap = {
    '低风险': 'dot-normal',
    '中风险': 'dot-urgent',
    '高风险': 'dot-emergency'
  }
  return classMap[urgency] || 'dot-normal'
}
	
	function onSourceChange(e) {
		const index = parseInt(e.detail.value)
		sourceIndex.value = index
		formData.source = sourceOptions[index]
	}
	
	function onCommunityChange(e) {
		const index = parseInt(e.detail.value)
		communityIndex.value = index
		formData.community = communityOptions[index]
	}
	
	function increaseCount() {
		formData.occur_count++
	}
	
	function decreaseCount() {
		if (formData.occur_count > 1) {
			formData.occur_count--
		}
	}
	
	async function chooseLocation() {
		try {
			await uni.chooseLocation({
				success: (res) => {
							formData.location = {
								address: res.address,
								latitude: res.latitude,
								longitude: res.longitude
							}
							markers.value = [{
									id: 1,
									latitude: res.latitude,
									longitude: res.longitude,
									title: res.name,
									width: 30,
									height: 30
								}]
							
							// 根据地址自动判断所属社区
							const address = res.address
							for (let i = 0; i < communityOptions.length; i++) {
								const community = communityOptions[i]
								if (address.includes(community)) {
									formData.community = community
									communityIndex.value = i
									break
								}
							}
							
							// 如果没有找到匹配的社区，默认为'其他'
							if (!formData.community) {
								formData.community = '其他'
								communityIndex.value = communityOptions.indexOf('其他')
							}
						},
				fail: (err) => {
					console.error('选择位置失败', err)
					uni.showToast({ title: '选择位置失败', icon: 'none' })
				}
			})
		} catch (e) {
			console.error('获取位置失败', e)
			uni.showToast({ title: '请授权位置权限', icon: 'none' })
		}
	}
	
	async function submitForm() {
		if (!formData.source) {
		uni.showToast({ title: '请选择纠纷来源', icon: 'none' })
		return
	}
	
	if (!formData.community) {
		uni.showToast({ title: '请选择所属社区', icon: 'none' })
		return
	}
		
		if (!formData.title.trim()) {
			uni.showToast({ title: '请输入纠纷标题', icon: 'none' })
			return
		}
		
		if (!formData.description.trim()) {
			uni.showToast({ title: '请输入纠纷描述', icon: 'none' })
			return
		}
		
		if (!formData.location.address) {
			uni.showToast({ title: '请选择发生位置', icon: 'none' })
			return
		}
		
		submitting.value = true
		
		try {
			const res = await uniCloud.callFunction({
				name: 'pushToStreet',
				data: {
					disputeData: formData,
					userInfo: { openid: userStore.openid, name: userStore.name }
				}
			})
			
			if (res.result.success) {
				uni.showToast({ title: '提交成功', icon: 'success' })
				
				setTimeout(() => {
				formData.source = ''
				formData.community = ''
				formData.title = ''
				formData.description = ''
				formData.location = { address: '', latitude: null, longitude: null }
				formData.parties = ''
				formData.urgency = '低风险'
				formData.occur_count = 1
				markers.value = []
				sourceIndex.value = 0
				communityIndex.value = 0
					
					uni.switchTab({ url: '/pages/index/index' })
				}, 1500)
			} else {
				throw new Error(res.result.error || '提交失败')
			}
		} catch (e) {
			console.error('提交失败', e)
			uni.showToast({ title: e.message || '提交失败', icon: 'none' })
		} finally {
			submitting.value = false
		}
	}

	const onShareAppMessage = () => ({
		title: '纠纷录入',
		path: '/pages/input/index',
		desc: '快速录入矛盾纠纷信息，及时处理社会问题',
		imageUrl: '/static/logo.png'
	})

	defineExpose({ onShareAppMessage })
</script>

<style lang="scss" scoped>
	.container {
		min-height: 100vh;
		background: linear-gradient(180deg, #e6f2ff 0%, #f0f7ff 100%);
		padding: 60rpx 20rpx;
		padding-top: calc(60rpx + env(safe-area-inset-top));
		box-sizing: border-box;
	}
	
	.form-container {
		height: calc(100vh - 200rpx - env(safe-area-inset-top));
	}
	
	/* 表单卡片 */
	.form-card {
		background: #fff;
		border-radius: 16rpx;
		padding: 28rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 12rpx rgba(22, 119, 255, 0.06);
		
		.card-title {
			font-size: 30rpx;
			font-weight: 600;
			color: #333;
			margin-bottom: 24rpx;
			padding-bottom: 16rpx;
			border-bottom: 1rpx solid #f0f0f0;
		}
	}
	
	/* 表单项 */
	.form-item {
		margin-bottom: 24rpx;
		
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
		
		.input {
			width: 100%;
			height: 80rpx;
			padding: 0 24rpx;
			background: #f8fafc;
			border-radius: 12rpx;
			font-size: 28rpx;
			color: #333;
			box-sizing: border-box;
			
			&::placeholder {
				color: #999;
			}
		}
		
		.textarea {
			width: 100%;
			min-height: 200rpx;
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
	}
	
	/* 位置选择 */
	.location-box {
		background: #f8fafc;
		border-radius: 12rpx;
		padding: 24rpx;
		
		.location-selected {
			display: flex;
			align-items: center;
			gap: 12rpx;
			
			.location-icon {
				font-size: 32rpx;
			}
			
			.location-text {
				flex: 1;
				font-size: 28rpx;
				color: #333;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
			
			.change-btn {
				font-size: 24rpx;
				color: #1677ff;
				padding: 8rpx 16rpx;
				background: #e6f7ff;
				border-radius: 8rpx;
			}
		}
		
		.location-empty {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 12rpx;
			color: #999;
			padding: 20rpx 0;
			
			.location-icon {
				font-size: 32rpx;
			}
			
			.location-tip {
				font-size: 28rpx;
			}
		}
	}
	
	.map-view {
		width: 100%;
		height: 360rpx;
		border-radius: 12rpx;
		margin-top: 20rpx;
	}
	
	/* 紧急度选择 */
	.urgency-group {
		display: flex;
		gap: 16rpx;
		
		.urgency-item {
			flex: 1;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 12rpx;
			padding: 20rpx 0;
			background: #f8fafc;
			border-radius: 12rpx;
			transition: all 0.3s ease;
			
			&.active {
				background: #e6f7ff;
				
				.urgency-text {
					color: #1677ff;
					font-weight: 500;
				}
			}
			
			.urgency-dot {
				width: 16rpx;
				height: 16rpx;
				border-radius: 50%;
				
				&.dot-normal { background: #52c41a; }
				&.dot-urgent { background: #faad14; }
				&.dot-emergency { background: #ff4d4f; }
			}
			
			.urgency-text {
				font-size: 28rpx;
				color: #666;
			}
		}
	}
	
	/* 次数选择 */
	.count-box {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 24rpx;
		
		.count-btn {
			width: 64rpx;
			height: 64rpx;
			line-height: 60rpx;
			text-align: center;
			background: #f8fafc;
			border-radius: 12rpx;
			font-size: 36rpx;
			color: #1677ff;
			font-weight: bold;
			
			&:active {
				background: #e6f7ff;
			}
		}
		
		.count-input {
			width: 120rpx;
			height: 64rpx;
			text-align: center;
			background: #f8fafc;
			border-radius: 12rpx;
			font-size: 32rpx;
			color: #333;
			font-weight: 600;
		}
	}
	
	/* 提交区域 */
	.submit-section {
		padding: 20rpx 0 40rpx;
		
		.btn-submit {
			width: 100%;
			height: 88rpx;
			line-height: 88rpx;
			background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
			color: #fff;
			border-radius: 44rpx;
			font-size: 32rpx;
			font-weight: 600;
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
