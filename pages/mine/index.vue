<template>
  <view class="container">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="avatar-section" @click="handleAvatarClick">
        <view class="avatar">
          <image v-if="userStore.avatar" :src="userStore.avatar" class="avatar-img" mode="aspectFill"/>
          <text v-else class="avatar-text">{{ userStore.name ? userStore.name[0] : '用' }}</text>
        </view>
        <view class="avatar-tip">点击更换头像</view>
      </view>
      
      <view class="info-section">
        <view class="name-row" @click="editName">
          <text class="name">{{ userStore.name || '未命名用户' }}</text>
          <text v-if="userStore.isLogin" class="edit-icon">✏️</text>
        </view>
        <view v-if="userStore.role" class="role-tag">
          <text class="role-icon">👤</text>
          <text>{{ userStore.role }}</text>
        </view>
      </view>
    </view>
    
    <!-- 功能菜单 -->
    <view class="menu-card">
      <view class="menu-title">功能菜单</view>
      
      <view class="menu-list">
        <!-- 切换角色 -->
        <view v-if="canSwitchRole" class="menu-item" @click="switchRole">
          <view class="item-left">
            <text class="item-icon">🔄</text>
            <text class="menu-text">切换角色</text>
          </view>
          <view class="item-right">
            <text class="item-value">{{ userStore.role }}</text>
            <text class="arrow">›</text>
          </view>
        </view>
        
        <!-- 用户管理（管理员） -->
        <view v-if="isAdmin" class="menu-item" @click="goToUserManage">
          <view class="item-left">
            <text class="item-icon">👥</text>
            <text class="menu-text">用户管理</text>
          </view>
          <text class="arrow">›</text>
        </view>
        
        <!-- 纠纷任务管理 -->
        <view v-if="userStore.isLogin" class="menu-item" @click="goToTaskManage">
          <view class="item-left">
            <text class="item-icon">📋</text>
            <text class="menu-text">纠纷任务管理</text>
          </view>
          <text class="arrow">›</text>
        </view>
        
        <!-- 订阅任务提醒 -->
        <view v-if="userStore.isLogin" class="menu-item" @click="subscribeMessage">
          <view class="item-left">
            <text class="item-icon">🔔</text>
            <text class="menu-text">订阅任务提醒</text>
          </view>
          <text class="arrow">›</text>
        </view>
      </view>
    </view>
    
    <!-- 退出登录 -->
    <view class="logout-section">
      <button class="btn-logout" @click="logout">
        <text class="logout-icon">🚪</text>
        <text>退出登录</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const canSwitchRole = computed(() => {
  return userStore.authorized_roles && userStore.authorized_roles.length > 1
})

const isAdmin = computed(() => {
  return userStore.authorized_roles && userStore.authorized_roles.includes('管理员')
})

const handleAvatarClick = () => {
  if (!userStore.isLogin) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  
  const itemList = ['上传头像']
  if (userStore.avatar) {
    itemList.push('查看大头像')
  }
  
  uni.showActionSheet({
    itemList,
    success: (res) => {
      const action = itemList[res.tapIndex]
      if (action === '上传头像') {
        uploadAvatar()
      } else if (action === '查看大头像') {
        previewAvatar()
      }
    }
  })
}

const uploadAvatar = async () => {
  try {
    const chooseRes = await uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera']
    })
    
    const tempFilePath = chooseRes.tempFilePaths[0]
    if (!tempFilePath) return
    
    uni.showLoading({ title: '上传中...' })
    
    const uploadRes = await uniCloud.uploadFile({
      filePath: tempFilePath,
      cloudPath: `avatar/${userStore.openid || Date.now()}_${Math.random().toString(36).slice(2)}.${tempFilePath.split('.').pop()}`
    })
    
    const fileID = uploadRes.fileID || uploadRes.fileId
    if (!fileID) {
      throw new Error('上传失败，请稍后重试')
    }
    
    const { result } = await uniCloud.callFunction({
      name: 'updateUserInfo',
      data: {
        openid: userStore.openid,
        avatar: fileID
      }
    })
    
    if (!result || !result.success) {
      throw new Error(result && result.error || '更新失败')
    }
    
    userStore.avatar = fileID
    uni.showToast({ title: '头像已更新', icon: 'success' })
    
  } catch (error) {
    if (error && error.errMsg && error.errMsg.includes('cancel')) return
    console.error('上传头像失败', error)
    uni.showToast({ title: error.message || '上传失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const previewAvatar = () => {
  if (userStore.avatar) {
    uni.previewImage({
      current: userStore.avatar,
      urls: [userStore.avatar]
    })
  } else {
    uni.showToast({ title: '请先上传头像', icon: 'none' })
  }
}

const switchRole = () => {
  const roles = [...userStore.authorized_roles]
  uni.showActionSheet({
    itemList: roles,
    success: (res) => {
      const selectedRole = roles[res.tapIndex]
      if (selectedRole !== userStore.role) {
        userStore.switchRole(selectedRole)
        uni.showToast({ title: `已切换为${selectedRole}`, icon: 'none' })
      }
    }
  })
}

const goToUserManage = () => {
  uni.navigateTo({ url: '/pages/admin/user-list' })
}

const goToTaskManage = () => {
  uni.switchTab({ url: '/pages/street/index' })
}

const subscribeMessage = () => {
  const tmplId = '5dkonBVIOQ1yUZYDyA7QE-YND6WQUQcFkFP9LifwVHw'
  uni.requestSubscribeMessage({
    tmplIds: [tmplId],
    success: (res) => {
      if (res[tmplId] === 'accept') {
        uni.showToast({ title: '订阅成功', icon: 'success' })
      } else {
        uni.showToast({ title: '已取消订阅', icon: 'none' })
      }
    },
    fail: (err) => {
      console.error('订阅失败', err)
      uni.showToast({ title: '订阅失败，请稍后重试', icon: 'none' })
    }
  })
}

const editName = () => {
  if (!userStore.isLogin) return
  
  uni.showModal({
    title: '修改姓名',
    content: userStore.name,
    editable: true,
    success: async (res) => {
      if (res.confirm && res.content && res.content !== userStore.name) {
        try {
          uni.showLoading({ title: '更新中...' })
          
          const { result } = await uniCloud.callFunction({
            name: 'updateUserInfo',
            data: {
              openid: userStore.openid,
              name: res.content
            }
          })
          
          if (result && result.success) {
            userStore.setUser({
              ...userStore.$state,
              name: res.content
            })
            uni.showToast({ title: '修改成功', icon: 'success' })
          } else {
            throw new Error(result && result.error || '更新失败')
          }
        } catch (error) {
          uni.showToast({ title: error.message || '修改失败', icon: 'none' })
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
}

const logout = () => {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
        uni.showToast({ title: '已退出登录', icon: 'success' })
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/login/index' })
        }, 1500)
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(180deg, #e6f2ff 0%, #f0f7ff 100%);
  padding: 100rpx 20rpx;
  padding-top: calc(100rpx + env(safe-area-inset-top));
  box-sizing: border-box;
}

/* 用户卡片 */
.user-card {
  background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 8rpx 32rpx rgba(22, 119, 255, 0.25);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
  }
  
  .avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 24rpx;
    position: relative;
    z-index: 1;
    
    .avatar {
      width: 140rpx;
      height: 140rpx;
      background: rgba(255,255,255,0.2);
      border-radius: 70rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 4rpx solid rgba(255,255,255,0.4);
      overflow: hidden;
      margin-bottom: 16rpx;
      
      .avatar-text {
        font-size: 56rpx;
        font-weight: 600;
        color: #fff;
      }
      
      .avatar-img {
        width: 100%;
        height: 100%;
        border-radius: 70rpx;
      }
    }
    
    .avatar-tip {
      font-size: 22rpx;
      color: rgba(255,255,255,0.8);
    }
  }
  
  .info-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    z-index: 1;
    
    .name-row {
      display: flex;
      align-items: center;
      margin-bottom: 16rpx;
      
      .name {
        font-size: 40rpx;
        font-weight: 700;
        color: #fff;
      }
      
      .edit-icon {
        margin-left: 12rpx;
        font-size: 24rpx;
        opacity: 0.9;
      }
    }
    
    .role-tag {
      display: flex;
      align-items: center;
      gap: 8rpx;
      background: rgba(255,255,255,0.2);
      padding: 10rpx 24rpx;
      border-radius: 24rpx;
      font-size: 26rpx;
      color: #fff;
      font-weight: 500;
      border: 1rpx solid rgba(255,255,255,0.3);
      
      .role-icon {
        font-size: 24rpx;
      }
    }
  }
}

/* 菜单卡片 */
.menu-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(22, 119, 255, 0.06);
  
  .menu-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 16rpx;
    padding-bottom: 16rpx;
    border-bottom: 1rpx solid #f0f0f0;
  }
  
  .menu-list {
    .menu-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24rpx 0;
      border-bottom: 1rpx solid #f5f5f5;
      
      &:last-child {
        border-bottom: none;
      }
      
      &:active {
        opacity: 0.7;
      }
      
      .item-left {
        display: flex;
        align-items: center;
        gap: 16rpx;
        
        .item-icon {
          font-size: 32rpx;
        }
        
        .menu-text {
          font-size: 30rpx;
          color: #333;
        }
      }
      
      .item-right {
        display: flex;
        align-items: center;
        gap: 12rpx;
        
        .item-value {
          font-size: 26rpx;
          color: #999;
        }
      }
      
      .arrow {
        font-size: 32rpx;
        color: #ccc;
      }
    }
  }
}

/* 退出登录 */
.logout-section {
  padding: 20rpx 0;
  
  .btn-logout {
    width: 100%;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    background: #fff;
    border-radius: 44rpx;
    font-size: 30rpx;
    color: #ff4d4f;
    font-weight: 500;
    box-shadow: 0 2rpx 12rpx rgba(255, 77, 79, 0.1);
    
    &:active {
      background: #fff1f0;
    }
    
    &::after {
      border: none;
    }
    
    .logout-icon {
      font-size: 28rpx;
    }
  }
}
</style>
