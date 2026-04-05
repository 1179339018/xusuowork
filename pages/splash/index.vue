<template>
  <view class="splash-container">
    <view class="logo-section">
      <view class="logo">
        <text class="logo-icon">⚖️</text>
        <text class="logo-text">矛盾纠纷管理系统</text>
      </view>
      <view class="slogan">快速响应 · 高效解决</view>
    </view>
    
    <view class="loading-section">
      <view class="loading-spinner"></view>
      <text class="loading-text">正在加载中...</text>
    </view>
    
    <view class="footer">
      <text class="version">版本 1.0.0</text>
    </view>
  </view>
</template>

<script>
  import { useUserStore } from '@/store/user'
  
  export default {
    onLoad() {
      this.checkLogin()
    },
    methods: {
      async checkLogin() {
        // 设置超时处理，避免长时间等待
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('登录超时')), 8000)
        })
        
        try {
          const userStore = useUserStore()
          
          // 添加调试信息
          console.log('检查登录状态 - userStore:', {
            isLogin: userStore.isLogin,
            openid: userStore.openid,
            role: userStore.role,
            manuallyLoggedOut: userStore.manuallyLoggedOut
          })
          
          // 直接从本地存储中读取用户信息，确保在 Pinia 完成状态恢复之前就能获取到
          const storedUser = uni.getStorageSync('user')
          console.log('本地存储中的用户信息:', storedUser)
          
          // 如果用户手动退出，跳过自动登录
          if (userStore.manuallyLoggedOut || (storedUser && storedUser.manuallyLoggedOut)) {
            console.log('用户手动退出，跳转到登录页面')
            uni.redirectTo({
              url: '/pages/login/index'
            })
            return
          }
          
          // 先检查本地存储中是否已有用户信息
          if ((userStore.openid && userStore.role) || (storedUser && storedUser.openid && storedUser.role)) {
            console.log('检测到用户已登录，跳转到首页')
            // 本地已有用户信息，直接跳转到首页
            // 如果 Pinia 还没有恢复状态，手动设置用户信息
            if (!userStore.isLogin && storedUser) {
              console.log('Pinia 状态未恢复，手动设置用户信息')
              userStore.setUser(storedUser)
            }
            uni.switchTab({
              url: '/pages/index/index'
            })
            return
          }
          
          // 尝试微信自动登录（检查该微信是否已绑定）
          const loginRes = await Promise.race([
            uni.login({
              provider: 'weixin'
            }),
            timeoutPromise
          ])
          
          if (loginRes.errMsg === 'login:ok') {
            // 调用云函数检查该微信是否已绑定
            const { result } = await Promise.race([
              uniCloud.callFunction({
                name: 'checkBind',
                data: {
                  code: loginRes.code
                }
              }),
              timeoutPromise
            ])
            
            if (result && result.success && result.isBound) {
              // 微信已绑定，自动登录
              userStore.setUser(result.userInfo)
              uni.switchTab({
                url: '/pages/index/index'
              })
              return
            }
          }
          
          // 微信未绑定，跳转到登录页
          uni.redirectTo({
            url: '/pages/login/index'
          })
          
        } catch (e) {
          console.error('登录检查失败:', e)
          // 发生错误，跳转到登录页
          uni.redirectTo({
            url: '/pages/login/index'
          })
        }
      }
    }
  }
</script>

<style lang="scss" scoped>
  .splash-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40rpx;
    box-sizing: border-box;
  }
  
  .logo-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 80rpx;
  }
  
  .logo {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 32rpx;
  }
  
  .logo-icon {
    font-size: 120rpx;
    margin-bottom: 24rpx;
  }
  
  .logo-text {
    font-size: 42rpx;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
  }
  
  .slogan {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
  }
  
  .loading-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 80rpx;
  }
  
  .loading-spinner {
    width: 80rpx;
    height: 80rpx;
    border: 6rpx solid rgba(255, 255, 255, 0.3);
    border-top: 6rpx solid #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 24rpx;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .loading-text {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.9);
  }
  
  .footer {
    position: absolute;
    bottom: 40rpx;
    left: 0;
    right: 0;
    text-align: center;
  }
  
  .version {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.7);
  }
</style>
