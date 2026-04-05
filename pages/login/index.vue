<template>
  <view class="container" :style="{ paddingTop: safeAreaTop + 'px' }">
    <view class="header">
      <view class="logo-wrapper">
        <text class="logo-icon">⚖️</text>
      </view>
      <text class="title">矛盾纠纷管理系统</text>
      <text class="subtitle">欢迎登录</text>
    </view>
    
    <view class="form-card">
      <view class="info-text">
        <text>本系统仅限授权人员访问</text>
        <text>请输入手机号进行登录</text>
      </view>
      
      <view class="input-group">
        <input 
          class="input" 
          type="number" 
          placeholder="请输入手机号" 
          maxlength="11" 
          v-model="phone"
        />
      </view>
      
      <button 
        class="btn-primary btn-block" 
        @click="handleLogin"
        :loading="loading"
      >
        {{ loading ? '登录中...' : '登录' }}
      </button>
      
      <view class="tips">
        <text>首次登录将自动绑定当前微信</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const loading = ref(false)
const phone = ref('')
const safeAreaTop = ref(0)

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

// 手动登录（带手机号）
const handleLogin = async () => {
  if (phone.value && phone.value.length === 11) {
    loading.value = true
    try {
      const loginRes = await uni.login({
        provider: 'weixin'
      })
      
      if (loginRes.errMsg !== 'login:ok') {
        throw new Error('微信登录失败')
      }
      
      const { result } = await uniCloud.callFunction({
        name: 'login',
        data: {
          code: loginRes.code,
          phone: phone.value
        }
      })
      
      if (!result.success) {
        throw new Error(result.error || '登录失败')
      }
      
      const userInfo = result.userInfo
      userStore.setUser(userInfo)
      
      uni.showToast({
        title: `欢迎回来，${userInfo.name || '用户'}`,
        icon: 'success'
      })
      
      setTimeout(() => {
        uni.switchTab({
          url: '/pages/index/index'
        })
      }, 1500)
      
    } catch (error) {
      console.error(error)
      uni.showModal({
        title: '登录失败',
        content: error.message || '请重试',
        showCancel: false
      })
    } finally {
      loading.value = false
    }
  } else {
    uni.showToast({
      title: '请输入正确的手机号',
      icon: 'none'
    })
  }
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1677ff, #4096ff);
  padding: 20rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.container:before {
  content: "";
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,.15) 0%, transparent 70%);
  animation: rotate 20s linear infinite;
}

@keyframes rotate {
  0% { transform: rotate(0); }
  100% { transform: rotate(360deg); }
}

.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
  position: relative;
  z-index: 1;
}

.header .logo-wrapper {
  width: 160rpx;
  height: 160rpx;
  background: rgba(255,255,255,.2);
  -webkit-backdrop-filter: blur(10rpx);
  backdrop-filter: blur(10rpx);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40rpx;
  border: 3rpx solid rgba(255,255,255,.3);
  box-shadow: 0 8rpx 32rpx rgba(0,0,0,.1);
}

.header .logo-icon {
  font-size: 60rpx;
  line-height: 1;
}

.header .title {
  font-size: 44rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 16rpx;
  text-shadow: 0 2rpx 8rpx rgba(0,0,0,.1);
}

.header .subtitle {
  font-size: 28rpx;
  color: rgba(255,255,255,.9);
}

.form-card {
  width: 100%;
  background: rgba(255,255,255,.95);
  -webkit-backdrop-filter: blur(20rpx);
  backdrop-filter: blur(20rpx);
  border-radius: var(--radius-xl);
  padding: 48rpx 40rpx;
  box-shadow: 0 20rpx 60rpx rgba(0,0,0,.15);
  border: 1rpx solid rgba(255,255,255,.5);
  position: relative;
  z-index: 1;
}

.info-text {
  text-align: center;
  margin-bottom: 60rpx;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  font-size: 28rpx;
  line-height: 1.6;
}

.input-group {
  margin-bottom: 40rpx;
}

.input {
  width: 100%;
  height: 96rpx;
  background: #f5f7fa;
  border-radius: 48rpx;
  padding: 0 40rpx;
  font-size: 32rpx;
  color: var(--text-primary);
  border: 2rpx solid transparent;
  transition: all 0.3s ease;
}

.input:focus {
  background: #fff;
  border-color: var(--primary);
  box-shadow: 0 0 0 4rpx rgba(22,119,255,.1);
}

.btn-primary {
  background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  height: 96rpx;
  line-height: 96rpx;
  border-radius: 48rpx;
  box-shadow: 0 8rpx 24rpx rgba(22,119,255,.3);
  transition: all 0.3s ease;
}

.btn-primary:active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 12rpx rgba(22,119,255,.2);
}

.btn-primary:after {
  border: none;
}

.btn-block {
  width: 100%;
}

.tips {
  margin-top: 40rpx;
  text-align: center;
}

.tips text {
  font-size: 24rpx;
  color: var(--text-secondary);
}
</style>
