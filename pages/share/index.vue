<template>
  <view class="share-container">
    <view class="share-backdrop backdrop-left"></view>
    <view class="share-backdrop backdrop-right"></view>

    <view class="hero-panel">
      <view class="hero-label">基层调解协同</view>
      <text class="hero-title">矛盾纠纷管理系统</text>
      <text class="hero-desc">让上报、分派、跟进、回访和留痕在一个页面闭环完成，减少线下沟通成本。</text>
    </view>

    <view class="preview-card">
      <view class="preview-top">
        <view class="preview-mark">
          <text class="mark-main">衡</text>
        </view>
        <view class="preview-copy">
          <text class="preview-title">更快接住问题</text>
          <text class="preview-text">街道、社区、派出所多角色协同，任务状态一眼可见。</text>
        </view>
      </view>

      <view class="feature-list">
        <view class="feature-item">
          <text class="feature-kicker">01</text>
          <text class="feature-name">纠纷上报</text>
          <text class="feature-desc">定位、描述、风险等级统一录入。</text>
        </view>
        <view class="feature-item">
          <text class="feature-kicker">02</text>
          <text class="feature-name">分派跟进</text>
          <text class="feature-desc">街道分派到社区，过程记录完整留痕。</text>
        </view>
        <view class="feature-item">
          <text class="feature-kicker">03</text>
          <text class="feature-name">回访闭环</text>
          <text class="feature-desc">处理结果、图片材料与回访计划统一沉淀。</text>
        </view>
      </view>
    </view>

    <view class="cta-card">
      <text class="cta-title">打开小程序，直接进入工作流</text>
      <text class="cta-desc">适合街道治理、社区调解、基层综治场景使用。</text>
      <button class="cta-btn" @click="goToLogin">立即体验</button>
    </view>
  </view>
</template>

<script setup>
import { useUserStore } from '@/store/user'
import { goHomeByRole } from '@/utils/navigation'

const userStore = useUserStore()

const goToLogin = () => {
  if (userStore.isLogin && userStore.openid && userStore.role) {
    goHomeByRole(userStore.role)
    return
  }

  uni.redirectTo({
    url: '/pages/login/index'
  })
}
</script>

<style lang="scss" scoped>
.share-container {
  min-height: 100vh;
  padding: 72rpx 32rpx 52rpx;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 16% 10%, rgba(255, 255, 255, 0.56), transparent 18%),
    radial-gradient(circle at 82% 8%, rgba(130, 188, 255, 0.36), transparent 20%),
    linear-gradient(180deg, #d5e8ff 0%, #edf4ff 42%, #f8fbff 100%);
}

.share-backdrop {
  position: absolute;
  border-radius: 999rpx;
  filter: blur(10rpx);
}

.backdrop-left {
  width: 280rpx;
  height: 280rpx;
  left: -100rpx;
  top: 320rpx;
  background: rgba(20, 91, 215, 0.12);
}

.backdrop-right {
  width: 220rpx;
  height: 220rpx;
  right: -60rpx;
  bottom: 260rpx;
  background: rgba(245, 180, 71, 0.12);
}

.hero-panel,
.preview-card,
.cta-card {
  position: relative;
  z-index: 1;
}

.hero-panel {
  margin-bottom: 28rpx;
}

.hero-label {
  display: inline-flex;
  align-items: center;
  height: 52rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.88);
  border: 1rpx solid rgba(20, 91, 215, 0.1);
  color: #2459b8;
  font-size: 22rpx;
  letter-spacing: 2rpx;
  margin-bottom: 20rpx;
}

.hero-title {
  display: block;
  font-size: 56rpx;
  line-height: 1.12;
  font-weight: 700;
  color: #163052;
  margin-bottom: 14rpx;
}

.hero-desc {
  display: block;
  font-size: 27rpx;
  line-height: 1.72;
  color: #60748e;
}

.preview-card {
  background: rgba(255, 255, 255, 0.94);
  border-radius: 34rpx;
  padding: 30rpx;
  box-shadow: 0 18rpx 48rpx rgba(27, 73, 145, 0.12);
  border: 1rpx solid rgba(22, 119, 255, 0.08);
  margin: 30rpx 0 24rpx;
}

.preview-top {
  display: flex;
  gap: 20rpx;
  align-items: center;
  margin-bottom: 28rpx;
}

.preview-mark {
  width: 108rpx;
  height: 108rpx;
  border-radius: 30rpx;
  background: linear-gradient(145deg, #145bd7 0%, #5ba3ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 18rpx 36rpx rgba(20, 91, 215, 0.2);
}

.mark-main {
  color: #fff;
  font-size: 48rpx;
  font-weight: 700;
}

.preview-copy {
  flex: 1;
}

.preview-title {
  display: block;
  font-size: 34rpx;
  color: #1f3150;
  font-weight: 700;
  margin-bottom: 10rpx;
}

.preview-text {
  display: block;
  font-size: 24rpx;
  line-height: 1.7;
  color: #72839a;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.feature-item {
  background: #f7faff;
  border-radius: 22rpx;
  padding: 22rpx 22rpx 20rpx;
}

.feature-kicker {
  display: block;
  font-size: 20rpx;
  color: #7d95b6;
  letter-spacing: 2rpx;
  margin-bottom: 8rpx;
}

.feature-name {
  display: block;
  font-size: 30rpx;
  color: #1f3150;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.feature-desc {
  display: block;
  font-size: 24rpx;
  line-height: 1.65;
  color: #6f829a;
}

.cta-card {
  background: linear-gradient(135deg, #134fbf 0%, #3f89f2 100%);
  border-radius: 30rpx;
  padding: 30rpx;
  color: #fff;
  box-shadow: 0 20rpx 38rpx rgba(20, 91, 215, 0.18);
}

.cta-title {
  display: block;
  font-size: 34rpx;
  line-height: 1.36;
  font-weight: 700;
  margin-bottom: 10rpx;
}

.cta-desc {
  display: block;
  font-size: 24rpx;
  line-height: 1.72;
  color: rgba(255, 255, 255, 0.82);
  margin-bottom: 24rpx;
}

.cta-btn {
  width: 100%;
  height: 92rpx;
  line-height: 92rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.94);
  color: #145bd7;
  font-size: 30rpx;
  font-weight: 700;

  &::after {
    border: none;
  }
}
</style>
