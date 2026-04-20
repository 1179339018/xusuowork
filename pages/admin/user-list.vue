<template>
  <view class="user-manage-page" :style="{ paddingTop: `${safeAreaTop + 12}px` }">
    <view class="nav-bar" :style="{ height: `${safeAreaTop}px` }">
      <view class="nav-left" @click="goBack">
        <image class="back-icon" src="/static/icons/icon-arrow.svg" mode="aspectFit" />
      </view>
      <text class="nav-title">用户管理</text>
      <view class="nav-right"></view>
    </view>

    <view class="content-area">
      <view class="summary-card">
        <view class="summary-main">
          <view class="summary-icon">
            <image class="summary-icon-image" src="/static/icons/mine-user-manage.svg" mode="aspectFit" />
          </view>
          <view class="summary-copy">
            <text class="summary-number">{{ userList.length }}</text>
            <text class="summary-text">当前已配置用户</text>
          </view>
        </view>
        <button class="add-btn" @click="openAddModal">添加用户</button>
      </view>

      <view class="summary-grid">
        <view class="mini-stat">
          <text class="mini-stat__label">已绑定</text>
          <text class="mini-stat__value">{{ boundUserCount }}</text>
        </view>
        <view class="mini-stat">
          <text class="mini-stat__label">社区账号</text>
          <text class="mini-stat__value">{{ communityUserCount }}</text>
        </view>
        <view class="mini-stat">
          <text class="mini-stat__label">管理员</text>
          <text class="mini-stat__value">{{ adminUserCount }}</text>
        </view>
      </view>

      <view class="toolbar-card">
        <view class="search-shell">
          <image class="search-icon" src="/static/icons/icon-search.svg" mode="aspectFit" />
          <input
            v-model="keyword"
            class="search-input"
            placeholder="搜索姓名、手机号或社区"
          />
        </view>
      </view>

      <view v-if="filteredUserList.length > 0" class="user-list">
        <view v-for="item in filteredUserList" :key="item._id" class="user-card">
          <view class="user-top">
            <view class="identity-wrap">
              <view class="avatar">
                <image v-if="item.avatar" class="avatar-image" :src="item.avatar" mode="aspectFill" />
                <text v-else>{{ getUserInitial(item) }}</text>
              </view>
              <view class="identity-copy">
                <text class="user-name">{{ item.name || '未命名' }}</text>
                <text class="user-phone">{{ item.phone || '未填写手机号' }}</text>
              </view>
            </view>
            <text class="bind-tag" :class="{ active: item.openid }">
              {{ item.openid ? '已绑定' : '未绑定' }}
            </text>
          </view>

          <view class="role-panel">
            <text class="panel-label">授权角色</text>
            <view class="role-list">
              <view
                v-for="role in getUserRoles(item)"
                :key="role"
                class="role-pill"
                :class="getRoleClass(role)"
              >
                <image class="role-icon" :src="getRoleIcon(role)" mode="aspectFit" />
                <text>{{ role }}</text>
              </view>
            </view>
            <text v-if="item.community" class="community-text">所属社区：{{ item.community }}</text>
          </view>

          <view class="action-row">
            <button class="row-btn btn-secondary" @click="openEditModal(item)">编辑</button>
            <button v-if="item.openid" class="row-btn btn-secondary" @click="unbindWechat(item)">解绑</button>
            <button v-if="canDelete(item)" class="row-btn btn-danger" @click="deleteUser(item)">删除</button>
          </view>
        </view>
      </view>

      <view v-else class="empty-state">
        <view class="empty-mark"></view>
        <text class="empty-text">{{ userList.length > 0 ? '没有匹配的用户' : '暂无用户数据' }}</text>
      </view>
    </view>

    <view v-if="showModal" class="modal-mask" @click="closeModal">
      <view class="modal-card" @click.stop>
        <view class="modal-head">
          <text class="modal-title">{{ isEdit ? '编辑用户' : '添加用户' }}</text>
          <text class="modal-subtitle">
            {{ isEdit ? '调整基础信息、角色和社区归属' : '新增账号并配置授权角色' }}
          </text>
        </view>

        <view class="modal-body">
          <view class="form-row">
            <text class="form-label">手机号</text>
            <input
              v-model="form.phone"
              class="form-input"
              type="number"
              maxlength="11"
              placeholder="请输入手机号"
            />
          </view>

          <view class="form-row">
            <text class="form-label">姓名</text>
            <input
              v-model="form.name"
              class="form-input"
              placeholder="请输入姓名"
            />
          </view>

          <view class="form-row">
            <text class="form-label">授权角色</text>
            <view class="role-grid">
              <view
                v-for="role in roleOptions"
                :key="role"
                class="role-option"
                :class="{ selected: form.roles.includes(role) }"
                @click="toggleRole(role)"
              >
                <image class="role-option-icon" :src="getRoleIcon(role)" mode="aspectFit" />
                <text class="role-option-text">{{ role }}</text>
                <text v-if="form.roles.includes(role)" class="role-check">✓</text>
              </view>
            </view>
          </view>

          <view v-if="form.roles.includes(communityRole)" class="form-row">
            <text class="form-label">所属社区</text>
            <picker
              mode="selector"
              :range="communityChoices"
              :value="Math.max(communityChoices.indexOf(form.community), 0)"
              @change="onCommunityPick"
            >
              <view class="picker-shell">
                <text :class="{ placeholder: !form.community }">
                  {{ form.community || '请选择社区' }}
                </text>
                <image class="picker-arrow" src="/static/icons/icon-arrow.svg" mode="aspectFit" />
              </view>
            </picker>
          </view>
        </view>

        <view class="modal-actions">
          <button class="btn-secondary" @click="closeModal">取消</button>
          <button class="btn-primary" @click="submitForm">{{ isEdit ? '保存修改' : '确认添加' }}</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { getNavbarConfig } from '@/utils/navbar'
import { COMMUNITY_OPTIONS, USER_ROLES, USER_ROLE_OPTIONS, SUPER_ADMIN_PHONE } from '@/utils/constants'
import { clearPageCacheByPrefix, getPageCache, getPageCacheDirtyAt, setPageCache } from '@/utils/page-cache'

const userStore = useUserStore()
const userList = ref([])
const showModal = ref(false)
const isEdit = ref(false)
const safeAreaTop = ref(0)
const lastRefreshAt = ref(0)
const syncing = ref(false)
const keyword = ref('')

const roleOptions = USER_ROLE_OPTIONS
const communityChoices = COMMUNITY_OPTIONS
const communityRole = USER_ROLES.COMMUNITY

const roleIconMap = {
  [USER_ROLES.ADMIN]: '/static/icons/role-admin.svg',
  [USER_ROLES.STREET]: '/static/icons/role-street.svg',
  [USER_ROLES.COMMUNITY]: '/static/icons/role-community.svg',
  [USER_ROLES.POLICE]: '/static/icons/role-police.svg'
}

const CACHE_AGE = 3 * 60 * 1000
const REFRESH_INTERVAL = 2 * 60 * 1000

const form = reactive({
  id: '',
  phone: '',
  name: '',
  roles: [],
  community: ''
})

const isSuperAdmin = computed(() => userStore.phone === SUPER_ADMIN_PHONE)
const boundUserCount = computed(() => userList.value.filter((item) => !!item.openid).length)
const communityUserCount = computed(() => (
  userList.value.filter((item) => getUserRoles(item).includes(USER_ROLES.COMMUNITY)).length
))
const adminUserCount = computed(() => (
  userList.value.filter((item) => getUserRoles(item).includes(USER_ROLES.ADMIN)).length
))
const filteredUserList = computed(() => {
  const search = keyword.value.trim().toLowerCase()
  if (!search) {
    return userList.value
  }

  return userList.value.filter((item) => {
    const roles = getUserRoles(item).join(' ')
    return [item.name, item.phone, item.community, roles]
      .some((field) => String(field || '').toLowerCase().includes(search))
  })
})

const buildUserListCacheKey = () => `admin:user-list:${userStore.openid || 'anonymous'}`

const initNavbar = () => {
  const config = getNavbarConfig()
  safeAreaTop.value = config.safeAreaTop
}

const normalizeUser = (item = {}) => ({
  ...item,
  authorized_roles: Array.isArray(item.authorized_roles) && item.authorized_roles.length > 0
    ? item.authorized_roles
    : (item.role ? [item.role] : []),
  role: item.role || (Array.isArray(item.authorized_roles) ? item.authorized_roles[0] : '') || '',
  community: item.community || ''
})

const getUserRoles = (item) => normalizeUser(item).authorized_roles

const getUserInitial = (item) => {
  const name = item?.name || ''
  return name ? String(name).slice(0, 1) : 'U'
}

const getRoleClass = (role) => {
  const classMap = {
    [USER_ROLES.ADMIN]: 'role-admin',
    [USER_ROLES.STREET]: 'role-street',
    [USER_ROLES.COMMUNITY]: 'role-community',
    [USER_ROLES.POLICE]: 'role-police'
  }
  return classMap[role] || ''
}

const getRoleIcon = (role) => roleIconMap[role] || '/static/icons/role-admin.svg'

const hydrateCache = () => {
  const cachedList = getPageCache(buildUserListCacheKey(), CACHE_AGE)
  if (Array.isArray(cachedList)) {
    userList.value = cachedList.map(normalizeUser)
    lastRefreshAt.value = Date.now()
  }
}

const persistUserList = (nextList) => {
  const normalized = nextList.map(normalizeUser)
  userList.value = normalized
  setPageCache(buildUserListCacheKey(), normalized)
  lastRefreshAt.value = Date.now()
}

const invalidateRelatedCaches = () => {
  clearPageCacheByPrefix('admin:')
  clearPageCacheByPrefix('home:')
  clearPageCacheByPrefix('street:')
  clearPageCacheByPrefix('task:')
}

const buildUserFromForm = (source = {}) => normalizeUser({
  ...source,
  _id: source._id || form.id || source.id || `local_${Date.now()}`,
  phone: form.phone,
  name: form.name,
  role: form.roles[0] || '',
  authorized_roles: [...form.roles],
  community: form.roles.includes(communityRole) ? form.community : ''
})

const mergeUserIntoList = (nextUser) => {
  const normalized = normalizeUser(nextUser)
  const exists = userList.value.some((item) => item._id === normalized._id)
  persistUserList(
    exists
      ? userList.value.map((item) => (item._id === normalized._id ? normalized : item))
      : [normalized, ...userList.value]
  )
}

const loadUserList = async (force = false, { silent = false } = {}) => {
  if (syncing.value) {
    return
  }

  let hasCachedList = userList.value.length > 0
  if (!force) {
    const cachedList = getPageCache(buildUserListCacheKey(), CACHE_AGE)
    if (Array.isArray(cachedList)) {
      userList.value = cachedList.map(normalizeUser)
      hasCachedList = cachedList.length > 0
    }
  }

  if (!silent && !hasCachedList) {
    uni.showLoading({ title: '加载中...' })
  }

  syncing.value = true
  try {
    const { result } = await uniCloud.callFunction({
      name: 'adminManager',
      data: {
        action: 'getUserList',
        params: {
          operatorOpenid: userStore.openid
        }
      }
    })

    if (!result?.success) {
      throw new Error(result?.error || '加载失败')
    }

    persistUserList((result.data || []).map(normalizeUser))
  } catch (error) {
    console.error('加载用户列表失败', error)
    uni.showToast({ title: error.message || '加载失败', icon: 'none' })
  } finally {
    syncing.value = false
    if (!silent) {
      uni.hideLoading()
    }
  }
}

const resetForm = () => {
  form.id = ''
  form.phone = ''
  form.name = ''
  form.roles = []
  form.community = ''
}

const openAddModal = () => {
  isEdit.value = false
  resetForm()
  showModal.value = true
}

const openEditModal = (item) => {
  isEdit.value = true
  form.id = item._id
  form.phone = item.phone || ''
  form.name = item.name || ''
  form.roles = [...getUserRoles(item)]
  form.community = item.community || ''
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const toggleRole = (role) => {
  const index = form.roles.indexOf(role)
  if (index >= 0) {
    form.roles.splice(index, 1)
  } else {
    form.roles.push(role)
  }

  if (!form.roles.includes(communityRole)) {
    form.community = ''
  }
}

const onCommunityPick = (e) => {
  const index = Number(e.detail.value) || 0
  form.community = communityChoices[index] || ''
}

const canDelete = (item) => {
  if (getUserRoles(item).includes(USER_ROLES.ADMIN)) {
    return isSuperAdmin.value
  }
  return true
}

const submitForm = async () => {
  if (!/^1\d{10}$/.test(form.phone) || form.roles.length === 0) {
    uni.showToast({ title: '请填写正确手机号并选择角色', icon: 'none' })
    return
  }

  if (form.roles.includes(communityRole) && !form.community) {
    uni.showToast({ title: '请选择所属社区', icon: 'none' })
    return
  }

  uni.showLoading({ title: '提交中...' })
  try {
    const action = isEdit.value ? 'updateUser' : 'addUser'
    const params = {
      operatorOpenid: userStore.openid,
      phone: form.phone,
      name: form.name,
      roles: form.roles,
      community: form.roles.includes(communityRole) ? form.community : ''
    }

    if (isEdit.value) {
      params.userId = form.id
    }

    const { result } = await uniCloud.callFunction({
      name: 'adminManager',
      data: { action, params }
    })

    if (!result?.success) {
      throw new Error(result?.error || '操作失败')
    }

    uni.showToast({ title: isEdit.value ? '更新成功' : '添加成功', icon: 'success' })

    const returnedUser = result.data || buildUserFromForm(
      userList.value.find((item) => item._id === form.id) || {}
    )
    mergeUserIntoList(returnedUser)

    invalidateRelatedCaches()
    closeModal()
  } catch (error) {
    console.error('提交用户失败', error)
    uni.showToast({ title: error.message || '系统异常', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const unbindWechat = (item) => {
  uni.showModal({
    title: '确认解绑',
    content: `确定解绑 ${item.name || '该用户'} 的微信账号吗？`,
    success: async (res) => {
      if (!res.confirm) {
        return
      }

      uni.showLoading({ title: '处理中...' })
      try {
        const { result } = await uniCloud.callFunction({
          name: 'adminManager',
          data: {
            action: 'unbindWechat',
            params: {
              operatorOpenid: userStore.openid,
              userId: item._id
            }
          }
        })

        if (!result?.success) {
          throw new Error(result?.error || '解绑失败')
        }

        uni.showToast({ title: '解绑成功', icon: 'success' })
        mergeUserIntoList(result.data || { ...item, openid: '' })
        invalidateRelatedCaches()
      } catch (error) {
        console.error('解绑失败', error)
        uni.showToast({ title: error.message || '解绑失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
  })
}

const deleteUser = (item) => {
  uni.showModal({
    title: '确认删除',
    content: `确定删除 ${item.name || '该用户'} 吗？此操作不可恢复。`,
    confirmColor: '#ff4d4f',
    success: async (res) => {
      if (!res.confirm) {
        return
      }

      uni.showLoading({ title: '删除中...' })
      try {
        const { result } = await uniCloud.callFunction({
          name: 'adminManager',
          data: {
            action: 'deleteUser',
            params: {
              operatorOpenid: userStore.openid,
              userId: item._id
            }
          }
        })

        if (!result?.success) {
          throw new Error(result?.error || '删除失败')
        }

        uni.showToast({ title: '删除成功', icon: 'success' })
        const deletedUserId = result.data?.userId || item._id
        persistUserList(userList.value.filter((user) => user._id !== deletedUserId))
        invalidateRelatedCaches()
      } catch (error) {
        console.error('删除失败', error)
        uni.showToast({ title: error.message || '删除失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
  })
}

const goBack = () => {
  uni.navigateBack({ delta: 1 })
}

onMounted(() => {
  initNavbar()
  hydrateCache()
})

onShow(() => {
  initNavbar()
  const isDirty = getPageCacheDirtyAt('admin:') > lastRefreshAt.value
  const isStale = Date.now() - lastRefreshAt.value > REFRESH_INTERVAL
  if (userList.value.length === 0 || isStale || isDirty) {
    void loadUserList(isStale || isDirty, {
      silent: userList.value.length > 0
    })
  }
})
</script>

<style lang="scss" scoped>
.user-manage-page {
  min-height: 100vh;
  padding: 0 20rpx;
  box-sizing: border-box;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.7), transparent 24%),
    linear-gradient(180deg, #deecff 0%, #f7faff 38%, #eef4ff 100%);
}

.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  margin: 0 -20rpx;
  padding: 0 24rpx 12rpx;
  background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  box-shadow: 0 8rpx 24rpx rgba(22, 119, 255, 0.16);
  z-index: 99;
}

.nav-left,
.nav-right {
  width: 80rpx;
  height: 44px;
  display: flex;
  align-items: center;
}

.back-icon {
  width: 28rpx;
  height: 28rpx;
  display: block;
  transform: rotate(180deg);
}

.nav-title {
  flex: 1;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 700;
  color: #fff;
}

.content-area {
  padding: 24rpx 0 40rpx;
  padding-top: calc(24rpx + env(safe-area-inset-top));
}

.summary-card,
.user-card,
.modal-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 24rpx;
  border: 1rpx solid rgba(22, 119, 255, 0.08);
  box-shadow: 0 12rpx 28rpx rgba(22, 119, 255, 0.08);
}

.summary-card {
  padding: 28rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
  margin-bottom: 18rpx;
}

.mini-stat,
.toolbar-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 22rpx;
  border: 1rpx solid rgba(22, 119, 255, 0.08);
  box-shadow: 0 10rpx 24rpx rgba(22, 119, 255, 0.08);
}

.mini-stat {
  padding: 22rpx 18rpx;
  text-align: center;
}

.mini-stat__label {
  display: block;
  font-size: 22rpx;
  color: #7d90a7;
  margin-bottom: 8rpx;
}

.mini-stat__value {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
  color: #1f3150;
}

.toolbar-card {
  padding: 18rpx;
  margin-bottom: 18rpx;
}

.search-shell {
  min-height: 82rpx;
  display: flex;
  align-items: center;
  border-radius: 18rpx;
  background: #f7faff;
  border: 1rpx solid #e6edf5;
  padding: 0 20rpx;
}

.search-icon {
  width: 28rpx;
  height: 28rpx;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  margin-left: 12rpx;
  font-size: 26rpx;
  color: #213450;
}

.summary-main {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.summary-icon {
  width: 78rpx;
  height: 78rpx;
  border-radius: 22rpx;
  background: #eef4ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-icon-image {
  width: 38rpx;
  height: 38rpx;
}

.summary-copy {
  display: flex;
  flex-direction: column;
}

.summary-number {
  font-size: 40rpx;
  font-weight: 700;
  color: #1f3150;
}

.summary-text {
  font-size: 24rpx;
  color: #7488a0;
}

.add-btn,
.btn-primary,
.btn-secondary,
.btn-danger {
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 18rpx;
  font-size: 27rpx;
  font-weight: 600;

  &::after {
    border: none;
  }
}

.add-btn,
.btn-primary {
  color: #fff;
  background: linear-gradient(135deg, #145bd7 0%, #4f95ff 100%);
}

.btn-secondary {
  color: #395371;
  background: #eef4ff;
}

.btn-danger {
  color: #ff4d4f;
  background: #fff2f0;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.user-card {
  padding: 26rpx;
}

.user-top {
  display: flex;
  justify-content: space-between;
  gap: 18rpx;
  margin-bottom: 20rpx;
}

.identity-wrap {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #145bd7 0%, #4f95ff 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  font-weight: 700;
  overflow: hidden;
}

.avatar-image {
  width: 100%;
  height: 100%;
}

.identity-copy {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.user-name {
  font-size: 30rpx;
  font-weight: 700;
  color: #1f3150;
}

.user-phone {
  font-size: 24rpx;
  color: #7488a0;
}

.bind-tag {
  align-self: flex-start;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #f5f5f5;
  color: #8c8c8c;
  font-size: 22rpx;
  font-weight: 600;
}

.bind-tag.active {
  background: #f6ffed;
  color: #52c41a;
}

.role-panel {
  background: #f7faff;
  border-radius: 20rpx;
  padding: 18rpx 20rpx;
  margin-bottom: 18rpx;
}

.community-text {
  display: block;
  margin-top: 12rpx;
  font-size: 23rpx;
  color: #6f849d;
}

.panel-label,
.form-label {
  display: block;
  font-size: 24rpx;
  color: #62758c;
  margin-bottom: 12rpx;
}

.role-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.role-pill {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 600;
}

.role-icon {
  width: 20rpx;
  height: 20rpx;
}

.role-admin {
  background: #fff7e6;
  color: #fa8c16;
}

.role-street {
  background: #e6f4ff;
  color: #1677ff;
}

.role-community {
  background: #f6ffed;
  color: #52c41a;
}

.role-police {
  background: #f9f0ff;
  color: #722ed1;
}

.action-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
}

.row-btn {
  width: 100%;
}

.empty-state {
  padding: 96rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-mark {
  width: 88rpx;
  height: 88rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, #d6e7ff 0%, #eef5ff 100%);
  margin-bottom: 18rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #70839b;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(9, 24, 45, 0.38);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  z-index: 999;
}

.modal-card {
  width: 100%;
  max-width: 640rpx;
  overflow: hidden;
}

.modal-head,
.modal-actions {
  padding: 24rpx 28rpx;
}

.modal-head {
  border-bottom: 1rpx solid #edf3f8;
}

.modal-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #1f3150;
  margin-bottom: 8rpx;
}

.modal-subtitle {
  display: block;
  font-size: 23rpx;
  color: #7b8ea6;
}

.modal-body {
  padding: 28rpx;
}

.form-row {
  margin-bottom: 22rpx;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-input {
  width: 100%;
  min-height: 84rpx;
  box-sizing: border-box;
  border-radius: 18rpx;
  background: #f7faff;
  border: 1rpx solid #e6edf5;
  padding: 0 20rpx;
  font-size: 26rpx;
  color: #20324b;
}

.picker-shell {
  min-height: 84rpx;
  border-radius: 18rpx;
  background: #f7faff;
  border: 1rpx solid #e6edf5;
  padding: 0 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 26rpx;
  color: #20324b;
}

.picker-shell .placeholder {
  color: #93a5ba;
}

.picker-arrow {
  width: 28rpx;
  height: 28rpx;
  opacity: 0.72;
  flex-shrink: 0;
}

.role-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12rpx;
}

.role-option {
  min-height: 88rpx;
  border-radius: 18rpx;
  background: #f7faff;
  border: 1rpx solid #e6edf5;
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 0 18rpx;
}

.role-option.selected {
  background: #eef4ff;
  border-color: #b7d0ff;
}

.role-option-icon {
  width: 24rpx;
  height: 24rpx;
}

.role-option-text {
  flex: 1;
  font-size: 25rpx;
  color: #20324b;
}

.role-check {
  font-size: 24rpx;
  color: #1677ff;
}

.modal-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
  border-top: 1rpx solid #edf3f8;
}

@media (max-width: 520px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
