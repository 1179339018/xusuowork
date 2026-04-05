<template>
  <view class="container" :style="{ paddingTop: safeAreaTop + 'px' }">
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const safeAreaTop = ref(0)

// 获取导航栏配置
const getNavbarConfig = () => {
  try {
    const systemInfo = uni.getSystemInfoSync()
    const menuButtonInfo = uni.getMenuButtonBoundingClientRect()
    
    const statusBarHeight = systemInfo.statusBarHeight || 0
    const menuButtonHeight = menuButtonInfo.height || 32
    const menuButtonTop = menuButtonInfo.top || 0
    
    const navbarHeight = menuButtonHeight + (menuButtonTop - statusBarHeight) * 2
    const safeAreaTopValue = statusBarHeight + navbarHeight
    
    return { statusBarHeight, menuButtonHeight, menuButtonTop, navbarHeight, safeAreaTop: safeAreaTopValue }
  } catch (error) {
    console.error('获取导航栏配置失败:', error)
    return { statusBarHeight: 44, menuButtonHeight: 32, menuButtonTop: 48, navbarHeight: 88, safeAreaTop: 132 }
  }
}

// 初始化导航栏配置
const initNavbar = () => {
  const config = getNavbarConfig()
  safeAreaTop.value = config.safeAreaTop
}

// 角色判断
const canSwitchRole = computed(() => {
  return userStore.authorized_roles && userStore.authorized_roles.length > 1
})

const isAdmin = computed(() => {
  return userStore.authorized_roles && userStore.authorized_roles.includes('管理员')
})

// 功能方法
const handleAvatarClick = () => {
  if (!userStore.isLogin) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  
  const itemList = ['上传头像']
  if (userStore.avatar) {
    itemList.push('查看头像')
  }
  
  uni.showActionSheet({
    itemList,
    success: async (res) => {
      if (res.tapIndex === 0) {
        await uploadAvatar()
      } else if (res.tapIndex === 1 && userStore.avatar) {
        uni.previewImage({ urls: [userStore.avatar] })
      }
    }
  })
}

const uploadAvatar = async () => {
  try {
    uni.showLoading({ title: '选择图片...' })
    
    const res = await uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera']
    })
    
    if (!res.tempFilePaths || res.tempFilePaths.length === 0) return
    
    const tempFilePath = res.tempFilePaths[0]
    
    uni.showLoading({ title: '上传中...' })
    
    const uploadRes = await uniCloud.uploadFile({
      filePath: tempFilePath,
      cloudPath: `avatar/${userStore.openid || Date.now()}_${Math.random().toString(36).slice(2)}.${tempFilePath.split('.').pop()}`
    })
    
    const fileID = uploadRes.fileID || uploadRes.fileId
    if (!fileID) throw new Error('上传失败，请稍后重试')
    
    const { result } = await uniCloud.callFunction({
      name: 'updateUserInfo',
      data: { openid: userStore.openid, avatar: fileID }
    })
    
    if (!result || !result.success) throw new Error(result?.error || '更新失败')
    
    userStore.avatar = fileID
    uni.showToast({ title: '头像已更新', icon: 'success' })
    
  } catch (error) {
    if (error?.errMsg?.includes('cancel')) return
    console.error('上传头像失败', error)
    uni.showToast({ title: error.message || '上传失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
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
            data: { openid: userStore.openid, name: res.content }
          })
          
          if (!result || !result.success) throw new Error(result?.error || '更新失败')
          
          userStore.name = res.content
          uni.showToast({ title: '姓名已更新', icon: 'success' })
          
        } catch (error) {
          console.error('更新姓名失败', error)
          uni.showToast({ title: error.message || '更新失败', icon: 'none' })
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
}

// 切换角色
const switchRole = () => {
  if (!canSwitchRole.value) return
  
  const roles = userStore.authorized_roles || []
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

const logout = () => {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
        uni.reLaunch({ url: '/pages/login/index' })
      }
    }
  })
}

// 生命周期
onMounted(() => {
  initNavbar()
  uni.$on('pageShow', initNavbar)
})

onUnmounted(() => {
  uni.$off('pageShow', initNavbar)
})
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(180deg, #e6f2ff 0%, #f0f7ff 100%);
  padding: 20rpx;
  box-sizing: border-box;
}

/* 用户卡片 */
.user-card {
  background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 8rpx 32rpx rgba(22, 119, 255, 0.25);
  
  .avatar-section {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;
    
    .avatar {
      width: 120rpx;
      height: 120rpx;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20rpx;
      
      .avatar-img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
      }
      
      .avatar-text {
        font-size: 48rpx;
        color: #fff;
        font-weight: bold;
      }
    }
    
    .avatar-tip {
      color: rgba(255, 255, 255, 0.8);
      font-size: 24rpx;
    }
  }
  
  .info-section {
    .name-row {
      display: flex;
      align-items: center;
      margin-bottom: 10rpx;
      
      .name {
        font-size: 36rpx;
        color: #fff;
        font-weight: bold;
        margin-right: 10rpx;
      }
      
      .edit-icon {
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.7);
      }
    }
    
    .role-tag {
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.2);
      padding: 8rpx 16rpx;
      border-radius: 20rpx;
      
      .role-icon {
        margin-right: 8rpx;
        font-size: 24rpx;
      }
      
      text {
        color: #fff;
        font-size: 24rpx;
      }
    }
  }
}

/* 菜单卡片 */
.menu-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 0;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  
  .menu-title {
    padding: 24rpx 32rpx;
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    border-bottom: 1rpx solid #f0f0f0;
  }
  
  .menu-list {
    .menu-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24rpx 32rpx;
      border-bottom: 1rpx solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .item-left {
        display: flex;
        align-items: center;
        
        .item-icon {
          font-size: 32rpx;
          margin-right: 16rpx;
        }
        
        .menu-text {
          font-size: 28rpx;
          color: #333;
        }
      }
      
      .item-right {
        display: flex;
        align-items: center;
        
        .item-value {
          font-size: 24rpx;
          color: #666;
          margin-right: 8rpx;
        }
        
        .arrow {
          font-size: 24rpx;
          color: #999;
        }
      }
    }
  }
}

/* 退出登录 */
.logout-section {
  .btn-logout {
    width: 100%;
    background: #fff;
    border: 1rpx solid #ff4d4f;
    color: #ff4d4f;
    border-radius: 12rpx;
    padding: 24rpx;
    font-size: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .logout-icon {
      margin-right: 8rpx;
      font-size: 24rpx;
    }
  }
}
</style>