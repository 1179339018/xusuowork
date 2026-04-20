<template>
  <view class="splash-container">
    <view class="halo halo-left"></view>
    <view class="halo halo-right"></view>

    <view class="brand-block">
      <view class="brand-mark">
        <text class="brand-mark-text">衡</text>
      </view>
      <text class="brand-title">矛盾纠纷管理系统</text>
      <text class="brand-subtitle">基层治理协同、任务闭环与过程留痕</text>
    </view>

    <view class="status-card">
      <view class="status-line">
        <view class="spinner"></view>
        <text class="status-title">正在初始化系统</text>
      </view>
      <text class="status-desc">校验登录状态并准备工作台，请稍候片刻。</text>
    </view>

    <view class="version-chip">版本 1.0.0</view>
  </view>
</template>

<script>
import { useUserStore } from '@/store/user'
import { goHomeByRole } from '@/utils/navigation'

export default {
  onLoad() {
    this.checkLogin()
  },
  methods: {
    createTimeoutPromise(message, timeout = 30000) {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error(message)), timeout)
      })
    },
    redirectToLogin(reason = '') {
      if (reason) {
        console.warn('启动页跳转登录：', reason)
      }

      uni.redirectTo({
        url: '/pages/login/index'
      })
    },
    goToHome() {
      return goHomeByRole(useUserStore().role || uni.getStorageSync('user')?.role)
    },
    async checkLogin() {
      try {
        const userStore = useUserStore()
        const storedUser = uni.getStorageSync('user')

        if (userStore.manuallyLoggedOut || storedUser?.manuallyLoggedOut) {
          uni.redirectTo({
            url: '/pages/login/index'
          })
          return
        }

        if (userStore.hasSession || userStore.restoreUser(storedUser)) {
          this.goToHome()
          return
        }

        const loginRes = await Promise.race([
          uni.login({
            provider: 'weixin'
          }),
          this.createTimeoutPromise('微信登录超时，请检查网络后重试')
        ])

        if (loginRes.errMsg === 'login:ok') {
          const { result } = await Promise.race([
            uniCloud.callFunction({
              name: 'checkBind',
              data: {
                code: loginRes.code
              }
            }),
            this.createTimeoutPromise('绑定校验超时，请稍后重试')
          ])

          if (result && result.success && result.isBound) {
            userStore.setUser(result.userInfo)
            this.goToHome()
            return
          }
        }

        this.redirectToLogin('未绑定或自动识别失败')
      } catch (e) {
        console.error('登录检查失败', e)

        const userStore = useUserStore()
        const fallbackUser = uni.getStorageSync('user')
        if (userStore.restoreUser(fallbackUser)) {
          this.goToHome()
          return
        }

        this.redirectToLogin(e?.message || '启动检查异常')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.splash-container {
  min-height: 100vh;
  padding: 88rpx 40rpx 56rpx;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background:
    radial-gradient(circle at 18% 16%, rgba(255, 255, 255, 0.56), transparent 20%),
    radial-gradient(circle at 84% 12%, rgba(135, 194, 255, 0.36), transparent 22%),
    linear-gradient(180deg, #d7e9ff 0%, #ebf3ff 46%, #f8fbff 100%);
}

.halo {
  position: absolute;
  border-radius: 999rpx;
  filter: blur(12rpx);
}

.halo-left {
  width: 320rpx;
  height: 320rpx;
  left: -100rpx;
  top: 260rpx;
  background: rgba(20, 91, 215, 0.12);
}

.halo-right {
  width: 260rpx;
  height: 260rpx;
  right: -80rpx;
  bottom: 240rpx;
  background: rgba(245, 180, 71, 0.12);
}

.brand-block,
.status-card,
.version-chip {
  position: relative;
  z-index: 1;
}

.brand-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 44rpx;
}

.brand-mark {
  width: 150rpx;
  height: 150rpx;
  border-radius: 42rpx;
  background: linear-gradient(145deg, #145bd7 0%, #5ba3ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 24rpx 42rpx rgba(20, 91, 215, 0.22);
  margin-bottom: 30rpx;
}

.brand-mark-text {
  font-size: 62rpx;
  color: #fff;
  font-weight: 700;
}

.brand-title {
  display: block;
  font-size: 52rpx;
  line-height: 1.16;
  font-weight: 700;
  color: #143055;
  margin-bottom: 16rpx;
}

.brand-subtitle {
  display: block;
  font-size: 28rpx;
  line-height: 1.7;
  color: #5e7694;
}

.status-card {
  background: rgba(255, 255, 255, 0.94);
  border-radius: 30rpx;
  padding: 30rpx;
  box-shadow: 0 18rpx 48rpx rgba(27, 73, 145, 0.12);
  border: 1rpx solid rgba(22, 119, 255, 0.08);
}

.status-line {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-bottom: 12rpx;
}

.spinner {
  width: 34rpx;
  height: 34rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(20, 91, 215, 0.16);
  border-top-color: #145bd7;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.status-title {
  font-size: 32rpx;
  color: #213450;
  font-weight: 600;
}

.status-desc {
  display: block;
  font-size: 24rpx;
  line-height: 1.7;
  color: #72839a;
}

.version-chip {
  align-self: center;
  margin-top: 28rpx;
  height: 50rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.78);
  color: #6580a4;
  font-size: 22rpx;
  display: flex;
  align-items: center;
}
</style>
