<template>
  <view class="mine-page" :style="{ paddingTop: `${safeAreaTop + 12}px` }">
    <view class="profile-card">
      <view class="profile-main">
        <view class="avatar-wrap" @click="handleAvatarClick">
          <view class="avatar">
            <image
              v-if="userStore.avatar"
              :src="userStore.avatar"
              class="avatar-image"
              mode="aspectFill"
            />
            <text v-else class="avatar-fallback">{{ userInitial }}</text>
          </view>
          <text class="avatar-tip">点击更换头像</text>
        </view>

        <view class="profile-info">
          <view class="name-row" @click="editName">
            <text class="user-name">{{ userStore.name || '未命名用户' }}</text>
            <text v-if="userStore.isLogin" class="edit-tag">修改</text>
          </view>

          <view class="meta-row">
            <view class="role-pill">
              <image class="role-icon" :src="currentRoleIcon" mode="aspectFit" />
              <text>{{ userStore.role || '未分配角色' }}</text>
            </view>
            <text class="phone-text">{{ userStore.phone || '未绑定手机号' }}</text>
          </view>
        </view>
      </view>

      <view class="profile-stats">
        <view class="stat-item">
          <text class="stat-label">当前角色</text>
          <text class="stat-value">{{ userStore.role || '未分配' }}</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">可切换角色</text>
          <text class="stat-value">{{ roleCountLabel }}</text>
        </view>
      </view>
    </view>

    <view class="panel-card">
      <view class="panel-header">
        <text class="panel-title">常用功能</text>
        <text class="panel-subtitle">统一入口，减少跳转成本</text>
      </view>

      <view v-if="false" class="quick-actions">
        <view class="quick-action" @click="goToInput">
          <view class="quick-action-icon quick-action-primary">
            <image class="quick-action-image" src="/static/icons/icon-add.svg" mode="aspectFit" />
          </view>
          <text class="quick-action-text">快速录入</text>
        </view>
        <view class="quick-action" @click="goToTaskManage">
          <view class="quick-action-icon quick-action-soft">
            <image class="quick-action-image" src="/static/icons/mine-task-manage.svg" mode="aspectFit" />
          </view>
          <text class="quick-action-text">我的任务</text>
        </view>
        <view v-if="showStreetQuickAction" class="quick-action" @click="goToStreetManage">
          <view class="quick-action-icon quick-action-soft">
            <image class="quick-action-image" src="/static/icons/role-street.svg" mode="aspectFit" />
          </view>
          <text class="quick-action-text">街道管理</text>
        </view>
        <view v-if="showAdminQuickAction" class="quick-action" @click="goToUserManage">
          <view class="quick-action-icon quick-action-soft">
            <image class="quick-action-image" src="/static/icons/mine-user-manage.svg" mode="aspectFit" />
          </view>
          <text class="quick-action-text">用户管理</text>
        </view>
      </view>

      <view class="menu-list">
        <view v-if="canSwitchRole" class="menu-item" @click="switchRole">
          <view class="menu-left">
            <view class="icon-box">
              <image class="menu-icon" :src="menuIcons.switchRole" mode="aspectFit" />
            </view>
            <view class="menu-copy">
              <text class="menu-title">切换角色</text>
              <text class="menu-desc">当前为 {{ userStore.role }}</text>
            </view>
          </view>
          <image class="menu-arrow" src="/static/icons/icon-arrow.svg" mode="aspectFit" />
        </view>

        <view v-if="isAdmin" class="menu-item" @click="goToUserManage">
          <view class="menu-left">
            <view class="icon-box">
              <image class="menu-icon" :src="menuIcons.userManage" mode="aspectFit" />
            </view>
            <view class="menu-copy">
              <text class="menu-title">用户管理</text>
              <text class="menu-desc">维护账号、角色和社区归属</text>
            </view>
          </view>
          <image class="menu-arrow" src="/static/icons/icon-arrow.svg" mode="aspectFit" />
        </view>

        <view v-if="userStore.isLogin" class="menu-item" @click="goToTaskManage">
          <view class="menu-left">
            <view class="icon-box">
              <image class="menu-icon" :src="menuIcons.taskManage" mode="aspectFit" />
            </view>
            <view class="menu-copy">
              <text class="menu-title">我的任务</text>
              <text class="menu-desc">查看当前账号可见的纠纷任务</text>
            </view>
          </view>
          <image class="menu-arrow" src="/static/icons/icon-arrow.svg" mode="aspectFit" />
        </view>

        <view v-if="userStore.isLogin" class="menu-item" @click="subscribeMessage">
          <view class="menu-left">
            <view class="icon-box">
              <image class="menu-icon" :src="menuIcons.subscribe" mode="aspectFit" />
            </view>
            <view class="menu-copy">
              <text class="menu-title">任务提醒订阅</text>
              <text class="menu-desc">接收分派、回访等消息提醒</text>
            </view>
          </view>
          <image class="menu-arrow" src="/static/icons/icon-arrow.svg" mode="aspectFit" />
        </view>
      </view>
    </view>

    <view v-if="false" class="panel-card guide-card">
      <view class="panel-header">
        <text class="panel-title">当前角色建议</text>
        <text class="panel-subtitle">根据当前身份给出更直接的操作入口</text>
      </view>

      <view class="guide-body">
        <text class="guide-title">{{ currentGuideTitle }}</text>
        <text class="guide-desc">{{ currentGuideDesc }}</text>
        <button class="guide-btn" @click="goToPrimaryWork">{{ currentGuideAction }}</button>
      </view>
    </view>

    <view class="panel-card quick-card">
      <view class="panel-header">
        <text class="panel-title">账号状态</text>
        <text class="panel-subtitle">当前账号基础信息概览</text>
      </view>

      <view class="status-grid">
        <view class="status-chip">
          <text class="status-name">登录状态</text>
          <text class="status-value">{{ userStore.isLogin ? '已登录' : '未登录' }}</text>
        </view>
        <view class="status-chip">
          <text class="status-name">所属社区</text>
          <text class="status-value">{{ userStore.community || '未设置' }}</text>
        </view>
      </view>
    </view>

    <view class="logout-wrap">
      <button class="logout-btn" @click="logout">退出登录</button>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { USER_ROLES } from '@/utils/constants'
import { getNavbarConfig } from '@/utils/navbar'
import { getHomeTabByRole, getStreetTabByRole, getTaskTabByRole, switchTabWithFallback } from '@/utils/navigation'

const userStore = useUserStore()
const safeAreaTop = ref(0)

const menuIcons = {
  switchRole: '/static/icons/mine-switch-role.svg',
  userManage: '/static/icons/mine-user-manage.svg',
  taskManage: '/static/icons/mine-task-manage.svg',
  subscribe: '/static/icons/mine-subscribe.svg'
}

const roleIcons = {
  [USER_ROLES.POLICE]: '/static/icons/role-police.svg',
  [USER_ROLES.STREET]: '/static/icons/role-street.svg',
  [USER_ROLES.COMMUNITY]: '/static/icons/role-community.svg',
  [USER_ROLES.ADMIN]: '/static/icons/role-admin.svg'
}

const initNavbar = () => {
  const config = getNavbarConfig()
  safeAreaTop.value = config.safeAreaTop
}

const canSwitchRole = computed(() => (
  Array.isArray(userStore.authorized_roles) && userStore.authorized_roles.length > 1
))

const isAdmin = computed(() => userStore.role === USER_ROLES.ADMIN)
const showStreetQuickAction = computed(() => (
  userStore.role === USER_ROLES.STREET || userStore.role === USER_ROLES.ADMIN
))
const showAdminQuickAction = computed(() => userStore.role === USER_ROLES.ADMIN)

const userInitial = computed(() => (
  userStore.name ? String(userStore.name).slice(0, 1) : 'U'
))

const roleCountLabel = computed(() => {
  const count = Array.isArray(userStore.authorized_roles) ? userStore.authorized_roles.length : 0
  return `${count} 个`
})

const currentRoleIcon = computed(() => (
  roleIcons[userStore.role] || '/static/icons/role-admin.svg'
))
const currentGuideTitle = computed(() => {
  if (userStore.role === USER_ROLES.POLICE) return '适合先录入，再看任务进度'
  if (userStore.role === USER_ROLES.STREET) return '适合先处理街道待分派事项'
  if (userStore.role === USER_ROLES.COMMUNITY) return '适合先查看待回访与处理中任务'
  if (userStore.role === USER_ROLES.ADMIN) return '适合先检查用户配置和全局任务流转'
  return '当前账号可从常用功能开始'
})

const currentGuideDesc = computed(() => {
  if (userStore.role === USER_ROLES.POLICE) return '新增纠纷后，可以直接去“我的任务”查看后续分派与处理情况。'
  if (userStore.role === USER_ROLES.STREET) return '进入街道管理后，可以优先分派新纠纷，并跟踪处理中事项。'
  if (userStore.role === USER_ROLES.COMMUNITY) return '进入任务页后，可以尽快补齐回访结果、备注和现场材料。'
  if (userStore.role === USER_ROLES.ADMIN) return '优先检查用户、角色和社区归属，再进入任务页查看整体进度。'
  return '可以从录入或任务页开始处理当前工作。'
})

const currentGuideAction = computed(() => {
  if (userStore.role === USER_ROLES.STREET) return '进入街道管理'
  if (userStore.role === USER_ROLES.ADMIN) return '进入用户管理'
  if (userStore.role === USER_ROLES.POLICE) return '快速录入'
  return '进入我的任务'
})

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
    const res = await uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera']
    })

    if (!res.tempFilePaths?.length) {
      return
    }

    uni.showLoading({ title: '上传中...' })
    const tempFilePath = res.tempFilePaths[0]
    const ext = tempFilePath.split('.').pop() || 'png'
    const uploadRes = await uniCloud.uploadFile({
      filePath: tempFilePath,
      cloudPath: `avatar/${userStore.openid || Date.now()}_${Date.now()}.${ext}`
    })

    const fileID = uploadRes.fileID || uploadRes.fileId
    if (!fileID) {
      throw new Error('头像上传失败')
    }

    const { result } = await uniCloud.callFunction({
      name: 'updateUserInfo',
      data: {
        openid: userStore.openid,
        avatar: fileID
      }
    })

    if (!result?.success) {
      throw new Error(result?.error || '头像更新失败')
    }

    userStore.avatar = fileID
    userStore.syncStorage()
    uni.showToast({ title: '头像已更新', icon: 'success' })
  } catch (error) {
    if (error?.errMsg?.includes('cancel')) {
      return
    }
    console.error('上传头像失败', error)
    uni.showToast({ title: error.message || '上传失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const editName = () => {
  if (!userStore.isLogin) {
    return
  }

  uni.showModal({
    title: '修改姓名',
    editable: true,
    placeholderText: '请输入新的姓名',
    content: userStore.name || '',
    success: async (res) => {
      const nextName = (res.content || '').trim()
      if (!res.confirm || !nextName || nextName === userStore.name) {
        return
      }

      try {
        uni.showLoading({ title: '保存中...' })
        const { result } = await uniCloud.callFunction({
          name: 'updateUserInfo',
          data: {
            openid: userStore.openid,
            name: nextName
          }
        })

        if (!result?.success) {
          throw new Error(result?.error || '姓名更新失败')
        }

        userStore.name = nextName
        userStore.syncStorage()
        uni.showToast({ title: '姓名已更新', icon: 'success' })
      } catch (error) {
        console.error('更新姓名失败', error)
        uni.showToast({ title: error.message || '更新失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
  })
}

const switchRole = () => {
  const roles = userStore.authorized_roles || []
  if (roles.length <= 1) {
    return
  }

  uni.showActionSheet({
    itemList: roles,
    success: (res) => {
      const selectedRole = roles[res.tapIndex]
      if (!selectedRole || selectedRole === userStore.role) {
        return
      }

      userStore.switchRole(selectedRole)
      uni.showToast({ title: `已切换为${selectedRole}`, icon: 'none' })
      setTimeout(() => {
        switchTabWithFallback(getHomeTabByRole(selectedRole))
      }, 250)
    }
  })
}

const goToUserManage = () => {
  uni.navigateTo({ url: '/pages/admin/user-list' })
}

const goToStreetManage = () => {
  switchTabWithFallback(getStreetTabByRole(userStore.role))
}

const goToTaskManage = () => {
  switchTabWithFallback(getTaskTabByRole())
}

const goToInput = () => {
  switchTabWithFallback('/pages/input/index')
}

const goToPrimaryWork = () => {
  if (userStore.role === USER_ROLES.STREET) {
    goToStreetManage()
    return
  }

  if (userStore.role === USER_ROLES.ADMIN) {
    goToUserManage()
    return
  }

  if (userStore.role === USER_ROLES.POLICE) {
    goToInput()
    return
  }

  goToTaskManage()
}

const subscribeMessage = () => {
  const tmplId = '5dkonBVIOQ1yUZYDyA7QE-YND6WQUQcFkFP9LifwVHw'
  uni.requestSubscribeMessage({
    tmplIds: [tmplId],
    success: (res) => {
      if (res[tmplId] === 'accept') {
        uni.showToast({ title: '订阅成功', icon: 'success' })
        return
      }
      uni.showToast({ title: '已取消订阅', icon: 'none' })
    },
    fail: (error) => {
      console.error('订阅消息失败', error)
      uni.showToast({ title: '订阅失败，请稍后重试', icon: 'none' })
    }
  })
}

const logout = () => {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出当前账号吗？',
    success: (res) => {
      if (!res.confirm) {
        return
      }

      userStore.logout()
      uni.reLaunch({ url: '/pages/login/index' })
    }
  })
}

onMounted(() => {
  initNavbar()
})

onShow(() => {
  initNavbar()
})
</script>

<style lang="scss" scoped>
.mine-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 20rpx;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.72), transparent 24%),
    linear-gradient(180deg, #deecff 0%, #f7faff 38%, #eef4ff 100%);
}

.profile-card,
.panel-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 28rpx;
  border: 1rpx solid rgba(22, 119, 255, 0.08);
  box-shadow: 0 12rpx 30rpx rgba(22, 119, 255, 0.08);
}

.profile-card {
  padding: 30rpx;
  margin-bottom: 20rpx;
  background: linear-gradient(135deg, #1677ff 0%, #4f95ff 100%);
  color: #fff;
}

.profile-main {
  display: flex;
  gap: 24rpx;
  align-items: center;
}

.avatar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.avatar {
  width: 128rpx;
  height: 128rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar-image {
  width: 100%;
  height: 100%;
}

.avatar-fallback {
  font-size: 52rpx;
  font-weight: 700;
  color: #fff;
}

.avatar-tip {
  margin-top: 14rpx;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.82);
}

.profile-info {
  min-width: 0;
  flex: 1;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.user-name {
  font-size: 38rpx;
  font-weight: 700;
  color: #fff;
}

.edit-tag {
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  color: #fff;
  background: rgba(255, 255, 255, 0.16);
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  align-items: center;
}

.role-pill {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.18);
  font-size: 24rpx;
}

.role-icon {
  width: 26rpx;
  height: 26rpx;
}

.phone-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.82);
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
  margin-top: 24rpx;
}

.stat-item {
  padding: 20rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.14);
}

.stat-label {
  display: block;
  margin-bottom: 8rpx;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.74);
}

.stat-value {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #fff;
}

.panel-card {
  padding: 0 0 8rpx;
  margin-bottom: 20rpx;
}

.guide-card {
  padding-bottom: 20rpx;
}

.guide-body {
  padding: 0 24rpx;
}

.guide-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #1f3150;
}

.guide-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 23rpx;
  line-height: 1.7;
  color: #7c8fa7;
}

.guide-btn {
  margin-top: 20rpx;
  height: 82rpx;
  line-height: 82rpx;
  border-radius: 18rpx;
  background: linear-gradient(135deg, #145bd7 0%, #4f95ff 100%);
  color: #fff;
  font-size: 27rpx;
  font-weight: 600;
}

.guide-btn::after {
  border: none;
}

.panel-header {
  padding: 26rpx 28rpx 16rpx;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
  padding: 0 24rpx 18rpx;
}

.quick-action {
  padding: 20rpx 18rpx;
  border-radius: 22rpx;
  background: #f7faff;
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.quick-action-icon {
  width: 68rpx;
  height: 68rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.quick-action-primary {
  background: linear-gradient(135deg, #145bd7 0%, #4f95ff 100%);
}

.quick-action-soft {
  background: #e8f1ff;
}

.quick-action-image {
  width: 30rpx;
  height: 30rpx;
}

.quick-action-text {
  font-size: 26rpx;
  color: #223754;
  font-weight: 600;
}

.panel-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #1f3150;
}

.panel-subtitle {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #7c8fa7;
}

.menu-list {
  padding: 0 16rpx;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 22rpx 12rpx;
  border-top: 1rpx solid rgba(22, 119, 255, 0.08);
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
  min-width: 0;
  flex: 1;
}

.icon-box {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #edf4ff 0%, #f7fbff 100%);
  flex-shrink: 0;
}

.menu-icon {
  width: 34rpx;
  height: 34rpx;
}

.menu-copy {
  min-width: 0;
  flex: 1;
}

.menu-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #223754;
}

.menu-desc {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #7d90a7;
}

.menu-arrow {
  width: 28rpx;
  height: 28rpx;
  opacity: 0.72;
  flex-shrink: 0;
}

.quick-card {
  padding-bottom: 18rpx;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
  padding: 0 24rpx;
}

.status-chip {
  padding: 20rpx;
  border-radius: 20rpx;
  background: #f7faff;
}

.status-name {
  display: block;
  font-size: 22rpx;
  color: #7c8fa7;
  margin-bottom: 8rpx;
}

.status-value {
  display: block;
  font-size: 26rpx;
  color: #223754;
  font-weight: 600;
}

.logout-wrap {
  padding-bottom: 32rpx;
}

.logout-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 22rpx;
  border: 1rpx solid #ffd6d6;
  background: rgba(255, 255, 255, 0.96);
  color: #ff4d4f;
  font-size: 28rpx;
  font-weight: 600;
  box-shadow: 0 12rpx 26rpx rgba(22, 119, 255, 0.08);

  &::after {
    border: none;
  }
}
</style>
