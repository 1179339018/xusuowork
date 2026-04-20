<template>
  <view class="container" :style="{ paddingTop: safeAreaTop + 'px' }">
    <view class="ambient ambient-left"></view>
    <view class="ambient ambient-right"></view>

    <view class="hero">
      <view class="hero-badge">基层矛盾纠纷协同平台</view>
      <view class="hero-mark">
        <text class="hero-mark-icon">衡</text>
      </view>
      <text class="hero-title">欢迎登录</text>
      <text class="hero-subtitle">使用已授权手机号完成绑定，进入纠纷分派、跟进与回访流程。</text>
    </view>

    <view class="form-card">
      <view class="card-header">
        <text class="card-title">手机号验证</text>
        <text class="card-desc">首次登录会将当前微信与账号绑定，后续可直接自动识别。</text>
      </view>

      <view class="field">
        <text class="field-label">手机号码</text>
        <view class="input-shell">
          <text class="input-prefix">+86</text>
          <input
            v-model="phone"
            class="input"
            type="number"
            maxlength="11"
            placeholder="请输入 11 位手机号"
          />
        </view>
      </view>

      <button class="submit-btn" @click="handleLogin" :loading="loading">
        {{ loading ? '登录中...' : '登录并进入系统' }}
      </button>

      <view class="trust-list">
        <view class="trust-item">
          <text class="trust-dot trust-blue"></text>
          <text class="trust-text">仅限授权账号访问</text>
        </view>
        <view class="trust-item">
          <text class="trust-dot trust-gold"></text>
          <text class="trust-text">支持微信自动识别与账号绑定</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { getNavbarConfig } from '@/utils/navbar'
import { goHomeByRole } from '@/utils/navigation'

const userStore = useUserStore()
const loading = ref(false)
const phone = ref('')
const safeAreaTop = ref(0)

const initNavbar = () => {
  const config = getNavbarConfig()
  safeAreaTop.value = config.safeAreaTop
}

onMounted(() => {
  initNavbar()
  if (userStore.hasSession || userStore.restoreUser()) {
    goHome()
  }
})

onShow(() => {
  initNavbar()
})

const createTimeoutPromise = (message, timeout = 30000) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), timeout)
  })
}

const goHome = () => {
  return goHomeByRole(userStore.role)
}

const handleLogin = async () => {
  if (!/^1\d{10}$/.test(phone.value)) {
    uni.showToast({
      title: '请输入正确的手机号',
      icon: 'none'
    })
    return
  }

  loading.value = true

  try {
    const loginRes = await Promise.race([
      uni.login({
        provider: 'weixin'
      }),
      createTimeoutPromise('微信登录超时，请检查网络后重试')
    ])

    if (loginRes.errMsg !== 'login:ok') {
      throw new Error('微信登录失败')
    }

    const { result } = await Promise.race([
      uniCloud.callFunction({
        name: 'login',
        data: {
          code: loginRes.code,
          phone: phone.value
        }
      }),
      createTimeoutPromise('登录请求超时，请稍后重试')
    ])

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
      goHome()
    }, 1200)
  } catch (error) {
    console.error(error)
    const message = error.message || '请稍后重试'
    const content = message.includes('超时')
      ? `${message}\n当前可能是开发工具网络波动或云函数响应较慢，请稍后重试。`
      : message
    uni.showModal({
      title: '登录失败',
      content,
      showCancel: false
    })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  padding: 40rpx 36rpx 64rpx;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 18% 18%, rgba(255, 255, 255, 0.58), transparent 22%),
    radial-gradient(circle at 88% 12%, rgba(145, 199, 255, 0.38), transparent 24%),
    linear-gradient(180deg, #d8e8ff 0%, #edf4ff 42%, #f8fbff 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.ambient {
  position: absolute;
  border-radius: 999rpx;
  filter: blur(10rpx);
  opacity: 0.75;
}

.ambient-left {
  width: 320rpx;
  height: 320rpx;
  left: -120rpx;
  top: 180rpx;
  background: rgba(31, 110, 245, 0.12);
}

.ambient-right {
  width: 260rpx;
  height: 260rpx;
  right: -80rpx;
  bottom: 180rpx;
  background: rgba(255, 196, 94, 0.14);
}

.hero {
  position: relative;
  z-index: 1;
  margin-bottom: 40rpx;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  height: 52rpx;
  padding: 0 20rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.86);
  border: 1rpx solid rgba(22, 119, 255, 0.14);
  color: #2459b8;
  font-size: 22rpx;
  letter-spacing: 2rpx;
  margin-bottom: 28rpx;
}

.hero-mark {
  width: 132rpx;
  height: 132rpx;
  border-radius: 36rpx;
  background: linear-gradient(145deg, #145bd7 0%, #5ba3ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20rpx 40rpx rgba(20, 91, 215, 0.24);
  margin-bottom: 30rpx;
}

.hero-mark-icon {
  font-size: 58rpx;
  color: #fff;
  font-weight: 700;
}

.hero-title {
  display: block;
  font-size: 52rpx;
  line-height: 1.14;
  color: #153158;
  font-weight: 700;
  margin-bottom: 16rpx;
}

.hero-subtitle {
  display: block;
  font-size: 28rpx;
  line-height: 1.7;
  color: #58708f;
}

.form-card {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.94);
  border-radius: 32rpx;
  padding: 36rpx 30rpx 32rpx;
  box-shadow: 0 18rpx 50rpx rgba(27, 73, 145, 0.12);
  border: 1rpx solid rgba(22, 119, 255, 0.08);
}

.card-header {
  margin-bottom: 32rpx;
}

.card-title {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
  color: #1c2e47;
  margin-bottom: 10rpx;
}

.card-desc {
  display: block;
  font-size: 24rpx;
  line-height: 1.7;
  color: #72839a;
}

.field {
  margin-bottom: 28rpx;
}

.field-label {
  display: block;
  font-size: 25rpx;
  color: #50627d;
  margin-bottom: 14rpx;
}

.input-shell {
  height: 100rpx;
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 0 28rpx;
  background: #f6f9ff;
  border: 2rpx solid rgba(22, 119, 255, 0.08);
  border-radius: 24rpx;
}

.input-prefix {
  font-size: 28rpx;
  color: #2459b8;
  font-weight: 600;
}

.input {
  flex: 1;
  height: 100%;
  font-size: 30rpx;
  color: #22334c;
}

.submit-btn {
  width: 100%;
  height: 94rpx;
  line-height: 94rpx;
  margin-top: 8rpx;
  border-radius: 999rpx;
  color: #fff;
  font-size: 30rpx;
  font-weight: 600;
  background: linear-gradient(135deg, #145bd7 0%, #4f95ff 100%);
  box-shadow: 0 16rpx 28rpx rgba(20, 91, 215, 0.22);

  &::after {
    border: none;
  }
}

.trust-list {
  margin-top: 28rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.trust-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.trust-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
}

.trust-blue {
  background: #1677ff;
}

.trust-gold {
  background: #f5b447;
}

.trust-text {
  font-size: 24rpx;
  color: #6e7f95;
}
</style>
