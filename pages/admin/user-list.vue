<template>
  <view class="container" :style="{ paddingTop: safeAreaTop + 'px' }">
    <!-- 自定义导航栏 -->
    <view class="nav-bar" :style="{ height: safeAreaTop + 'px' }">
      <view class="nav-left" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <view class="nav-title">用户管理</view>
      <view class="nav-right"></view>
    </view>
    
    <!-- 顶部统计卡片 -->
    <view class="stats-card">
      <view class="stats-content">
        <view class="stats-icon">👥</view>
        <view class="stats-info">
          <text class="stats-number">{{ userList.length }}</text>
          <text class="stats-label">位用户</text>
        </view>
      </view>
      <view class="add-btn" @click="openAddModal">
        <text class="add-icon">+</text>
        <text class="add-text">添加用户</text>
      </view>
    </view>
    
    <!-- 用户列表 -->
    <scroll-view scroll-y class="user-list" enable-back-to-top>
      <view 
        v-for="(item, index) in userList" 
        :key="item._id" 
        class="user-card fade-in"
        :style="{ animationDelay: index * 0.05 + 's' }"
      >
        <view class="user-header">
          <view class="avatar-section">
            <view class="avatar">{{ item.name ? item.name[0] : '无' }}</view>
            <view class="bind-badge" :class="{ 'is-bound': item.openid }">
              {{ item.openid ? '已绑定' : '未绑定' }}
            </view>
          </view>
          <view class="user-main-info">
            <text class="user-name">{{ item.name || '未命名' }}</text>
            <text class="user-phone">📱 {{ item.phone || '无手机号' }}</text>
          </view>
        </view>
        
        <view class="roles-section">
          <text class="section-label">授权角色</text>
          <view class="roles-list">
            <text 
              v-for="role in (item.authorized_roles || [item.role])" 
              :key="role" 
              class="role-tag"
              :class="getRoleClass(role)"
            >
              {{ role }}
            </text>
          </view>
        </view>
        
        <view class="action-section">
          <view class="action-btn edit" @click="openEditModal(item)">
            <text class="btn-icon">✏️</text>
            <text>编辑</text>
          </view>
          <view 
            v-if="item.openid" 
            class="action-btn unbind" 
            @click="unbindWechat(item)"
          >
            <text class="btn-icon">🔗</text>
            <text>解绑</text>
          </view>
          <view 
            v-if="canDelete(item)" 
            class="action-btn delete" 
            @click="deleteUser(item)"
          >
            <text class="btn-icon">🗑️</text>
            <text>删除</text>
          </view>
        </view>
      </view>
      
      <!-- 底部间距 -->
      <view class="bottom-space"></view>
    </scroll-view>
    
    <!-- 添加/编辑弹窗 -->
    <view v-if="showModal" class="modal-mask" @click="closeModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <view class="modal-icon">{{ isEdit ? '✏️' : '👤' }}</view>
          <text class="modal-title">{{ isEdit ? '编辑用户' : '添加用户' }}</text>
          <text class="modal-subtitle">{{ isEdit ? '修改用户信息' : '创建新用户账号' }}</text>
        </view>
        
        <view class="form-body">
          <view class="form-item">
            <text class="form-label">
              <text class="label-icon">📱</text>
              手机号
              <text class="required">*</text>
            </text>
            <input 
              class="form-input" 
              placeholder="请输入手机号" 
              type="number" 
              maxlength="11"
              v-model="form.phone"
            />
          </view>
          
          <view class="form-item">
            <text class="form-label">
              <text class="label-icon">🏷️</text>
              姓名
            </text>
            <input 
              class="form-input" 
              placeholder="请输入姓名" 
              v-model="form.name"
            />
          </view>
          
          <view class="form-item">
            <text class="form-label">
              <text class="label-icon">🎭</text>
              授权角色
              <text class="required">*</text>
            </text>
            <view class="role-options">
              <view
                v-for="role in roleOptions" 
                :key="role"
                class="role-option"
                :class="{ 'is-selected': form.roles.includes(role) }"
                @click="toggleRole(role)"
              >
                <text class="option-icon">{{ getRoleIcon(role) }}</text>
                <text class="option-text">{{ role }}</text>
                <view v-if="form.roles.includes(role)" class="check-mark">✓</view>
              </view>
            </view>
          </view>
        </view>
        
        <view class="modal-footer">
          <button class="btn-cancel" @click="closeModal">取消</button>
          <button class="btn-confirm" @click="submitForm">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const userList = ref([])
const loading = ref(false)
const showModal = ref(false)
const isEdit = ref(false)
const safeAreaTop = ref(0)

const roleOptions = ['派出所', '街道', '社区', '管理员']

// 是否是超级管理员（根据手机号判断）
const isSuperAdmin = computed(() => {
  return userStore.phone === '18926249923'
})

const form = reactive({
  id: '',
  phone: '',
  name: '',
  roles: []
})

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

onMounted(() => {
  initNavbar()
  // 监听页面显示事件
  uni.$on('pageShow', () => {
    initNavbar()
  })
  loadUserList()
})

// 页面卸载时移除监听
onUnmounted(() => {
  uni.$off('pageShow')
})

// 获取角色样式类
const getRoleClass = (role) => {
  const classMap = {
    '管理员': 'role-admin',
    '街道': 'role-street',
    '社区': 'role-community',
    '派出所': 'role-police'
  }
  return classMap[role] || ''
}

// 获取角色图标
const getRoleIcon = (role) => {
  const iconMap = {
    '管理员': '👑',
    '街道': '🏢',
    '社区': '🏘️',
    '派出所': '👮'
  }
  return iconMap[role] || '👤'
}

// 切换角色选择
const toggleRole = (role) => {
  const index = form.roles.indexOf(role)
  if (index > -1) {
    form.roles.splice(index, 1)
  } else {
    form.roles.push(role)
  }
}

// 加载用户列表
const loadUserList = async () => {
  uni.showLoading({ title: '加载中...' })
  try {
    const { result } = await uniCloud.callFunction({
      name: 'adminManager',
      data: {
        action: 'getUserList'
      }
    })
    
    if (result.success) {
      userList.value = result.data
    }
  } catch (error) {
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    uni.hideLoading()
  }
}

// 打开添加弹窗
const openAddModal = () => {
  isEdit.value = false
  form.id = ''
  form.phone = ''
  form.name = ''
  form.roles = []
  showModal.value = true
}

// 打开编辑弹窗
const openEditModal = (item) => {
  isEdit.value = true
  form.id = item._id
  form.phone = item.phone || ''
  form.name = item.name || ''
  form.roles = item.authorized_roles || (item.role ? [item.role] : [])
  showModal.value = true
}

// 关闭弹窗
const closeModal = () => {
  showModal.value = false
}

// 角色选择变化
const onRoleChange = (e) => {
  form.roles = e.detail.value
}

// 判断是否可以删除用户
const canDelete = (item) => {
  // 管理员不能删除其他管理员，除非自己是超级管理员
  if (item.authorized_roles && item.authorized_roles.includes('管理员')) {
    return isSuperAdmin.value
  }
  return true
}

// 提交表单
const submitForm = async () => {
  if (!form.phone || form.roles.length === 0) {
    uni.showToast({
      title: '请填写手机号并选择角色',
      icon: 'none'
    })
    return
  }
  
  uni.showLoading({ title: '提交中...' })
  
  try {
    const action = isEdit.value ? 'updateUser' : 'addUser'
    const params = {
      phone: form.phone,
      name: form.name,
      roles: form.roles
    }
    
    if (isEdit.value) {
      params.userId = form.id
    }
    
    const { result } = await uniCloud.callFunction({
      name: 'adminManager',
      data: {
        action,
        params
      }
    })
    
    if (result.success) {
      uni.showToast({
        title: isEdit.value ? '更新成功' : '添加成功'
      })
      closeModal()
      loadUserList()
    } else {
      uni.showToast({
        title: result.error || '操作失败',
        icon: 'none'
      })
    }
  } catch (error) {
    uni.showToast({
      title: '系统异常',
      icon: 'none'
    })
  } finally {
    uni.hideLoading()
  }
}

// 解绑微信
const unbindWechat = (item) => {
  uni.showModal({
    title: '解绑确认',
    content: `确定要解除 "${item.name}" 的微信绑定吗？解绑后该用户可以使用任意微信重新绑定登录。`,
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '处理中...' })
        
        try {
          const { result } = await uniCloud.callFunction({
            name: 'adminManager',
            data: {
              action: 'unbindWechat',
              params: {
                userId: item._id
              }
            }
          })
          
          if (result.success) {
            uni.showToast({
              title: '解绑成功',
              icon: 'success'
            })
            loadUserList()
          } else {
            uni.showToast({
              title: result.error || '解绑失败',
              icon: 'none'
            })
          }
        } catch (error) {
          uni.showToast({
            title: '系统异常',
            icon: 'none'
          })
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
}

// 删除用户
const deleteUser = (item) => {
  uni.showModal({
    title: '删除确认',
    content: `确定要删除用户 "${item.name}" 吗？此操作不可恢复。`,
    confirmColor: '#ff4d4f',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '删除中...' })
        
        try {
          const { result } = await uniCloud.callFunction({
            name: 'adminManager',
            data: {
              action: 'deleteUser',
              params: {
                userId: item._id
              }
            }
          })
          
          if (result.success) {
            uni.showToast({
              title: '删除成功',
              icon: 'success'
            })
            loadUserList()
          } else {
            uni.showToast({
              title: result.error || '删除失败',
              icon: 'none'
            })
          }
        } catch (error) {
          uni.showToast({
            title: '系统异常',
            icon: 'none'
          })
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
}

// 返回上一页
const goBack = () => {
  uni.navigateBack({ delta: 1 })
}
</script>

<style lang="scss" scoped>
.container {
		min-height: 100vh;
		background: linear-gradient(180deg, #e6f2ff 0%, #f0f7ff 100%);
		display: flex;
		flex-direction: column;
		padding: 0 20rpx;
		box-sizing: border-box;
	}

/* 导航栏 */
.nav-bar {
  background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 20rpx 12rpx 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(22, 119, 255, 0.1);
  z-index: 99;
  margin: 0 -20rpx;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  
  .nav-left {
    width: 80rpx;
    height: 44px;
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
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .nav-right {
    width: 80rpx;
    height: 44px;
  }
}

/* 顶部统计卡片 */
.stats-card {
  background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
  border-radius: 24rpx;
  padding: 32rpx;
  margin: 20rpx 0;
  margin-bottom: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
}

.stats-content {
  display: flex;
  align-items: center;
  gap: 20rpx;
  position: relative;
  z-index: 1;
}

.stats-icon {
  font-size: 48rpx;
}

.stats-info {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
}

.stats-number {
  font-size: 48rpx;
  font-weight: 700;
  color: #fff;
}

.stats-label {
  font-size: 28rpx;
  color: rgba(255,255,255,0.9);
}

.add-btn {
  background: rgba(255,255,255,0.2);
  border: 2rpx solid rgba(255,255,255,0.3);
  border-radius: 16rpx;
  padding: 16rpx 28rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
  
  &:active {
    background: rgba(255,255,255,0.3);
    transform: scale(0.98);
  }
}

.add-icon {
  font-size: 32rpx;
  color: #fff;
  font-weight: 700;
}

.add-text {
  font-size: 28rpx;
  color: #fff;
  font-weight: 500;
}

/* 用户列表 */
.user-list {
  flex: 1;
  padding: 40rpx 20rpx;
  padding-top: calc(40rpx + env(safe-area-inset-top));
  display: flex;
  flex-direction: column;
  align-items: center;
}

.user-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(22, 119, 255, 0.08);
  border: 1rpx solid rgba(22, 119, 255, 0.08);
  width: 100%;
  max-width: 600rpx;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 6rpx 24rpx rgba(22, 119, 255, 0.12);
    transform: translateY(-2rpx);
  }
}

.user-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 24rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.avatar-section {
  position: relative;
}

.avatar {
  width: 88rpx;
  height: 88rpx;
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f7ff 100%);
  color: #1677ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(22, 119, 255, 0.15);
}

.bind-badge {
  position: absolute;
  bottom: -4rpx;
  right: -4rpx;
  font-size: 18rpx;
  padding: 4rpx 10rpx;
  background: #f5f5f5;
  color: #999;
  border-radius: 12rpx;
  border: 2rpx solid #fff;
  
  &.is-bound {
    background: #52c41a;
    color: #fff;
  }
}

.user-main-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.user-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.user-phone {
  font-size: 26rpx;
  color: #666;
}

/* 角色区域 */
.roles-section {
  margin-bottom: 24rpx;
}

.section-label {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 12rpx;
  display: block;
}

.roles-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.role-tag {
  font-size: 24rpx;
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  font-weight: 500;
}

.role-admin {
  background: #fff2f0;
  color: #ff4d4f;
}

.role-street {
  background: #e6f7ff;
  color: #1677ff;
}

.role-community {
  background: #f6ffed;
  color: #52c41a;
}

.role-police {
  background: #fff7e6;
  color: #fa8c16;
}

/* 操作按钮区域 */
.action-section {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 20rpx 0;
  border-radius: 12rpx;
  font-size: 26rpx;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:active {
    transform: scale(0.98);
    opacity: 0.8;
  }
  
  &.edit {
    background: #e6f7ff;
    color: #1677ff;
  }
  
  &.unbind {
    background: #fff7e6;
    color: #fa8c16;
  }
  
  &.delete {
    background: #fff2f0;
    color: #ff4d4f;
  }
}

.btn-icon {
  font-size: 28rpx;
}

.bottom-space {
  height: 40rpx;
}

/* 弹窗样式 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 40rpx;
}

.modal-content {
  width: 100%;
  max-width: 640rpx;
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(50rpx);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
  padding: 40rpx;
  text-align: center;
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
}

.modal-icon {
  font-size: 56rpx;
  margin-bottom: 16rpx;
  position: relative;
  z-index: 1;
}

.modal-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
  display: block;
  margin-bottom: 8rpx;
  position: relative;
  z-index: 1;
}

.modal-subtitle {
  font-size: 26rpx;
  color: rgba(255,255,255,0.85);
  position: relative;
  z-index: 1;
}

.form-body {
  padding: 32rpx;
}

.form-item {
  margin-bottom: 28rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 16rpx;
}

.label-icon {
  font-size: 32rpx;
}

.required {
  color: #ff4d4f;
}

.form-input {
  width: 100%;
  height: 88rpx;
  background: #f8fafc;
  border: 2rpx solid #e8e8e8;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  color: #333;
  box-sizing: border-box;
  transition: all 0.3s ease;
  
  &:focus {
    border-color: #1677ff;
    background: #fff;
    box-shadow: 0 0 0 4rpx rgba(22, 119, 255, 0.1);
  }
}

/* 角色选项 */
.role-options {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.role-option {
  flex: 1;
  min-width: 140rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 24rpx 16rpx;
  background: #f8fafc;
  border: 2rpx solid #e8e8e8;
  border-radius: 16rpx;
  transition: all 0.3s ease;
  position: relative;
  
  &:active {
    transform: scale(0.98);
  }
  
  &.is-selected {
    background: #e6f7ff;
    border-color: #1677ff;
  }
}

.option-icon {
  font-size: 40rpx;
}

.option-text {
  font-size: 26rpx;
  color: #666;
  
  .is-selected & {
    color: #1677ff;
    font-weight: 500;
  }
}

.check-mark {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 32rpx;
  height: 32rpx;
  background: #1677ff;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  font-weight: 700;
}

.modal-footer {
  display: flex;
  gap: 20rpx;
  padding: 24rpx 32rpx 40rpx;
  border-top: 1rpx solid #f0f0f0;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  height: 88rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 500;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:active {
    transform: scale(0.98);
  }
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-confirm {
  background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
  color: #fff;
  box-shadow: 0 4rpx 16rpx rgba(22, 119, 255, 0.3);
}

/* 动画 */
.fade-in {
  animation: fadeIn 0.5s ease forwards;
  opacity: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
