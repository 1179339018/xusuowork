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
            <text class="summary-number">{{ totalUserCount || userList.length }}</text>
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

      <view v-if="userList.length > 0 && hasMoreUsers" class="load-more-row">
        <button class="btn-secondary load-more-btn" :disabled="syncing" @click="loadMoreUsers">
          {{ syncing ? '加载中...' : '加载更多用户' }}
        </button>
      </view>

      <view v-if="filteredUserList.length === 0" class="empty-state">
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
                <text v-if="form.roles.includes(role)" class="role-check">已选</text>
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { getNavbarConfig } from '@/utils/navbar'
import { callCloudFunction } from '@/utils/cloud'
import { COMMUNITY_OPTIONS, USER_ROLES, USER_ROLE_OPTIONS } from '@/utils/constants'
import { clearPageCacheByPrefix, getPageCache, getPageCacheDirtyAt, setPageCache } from '@/utils/page-cache'

const userStore = useUserStore()
const userList = ref([])
const showModal = ref(false)
const isEdit = ref(false)
const safeAreaTop = ref(0)
const lastRefreshAt = ref(0)
const syncing = ref(false)
const keyword = ref('')
const userPage = ref(1)
const userPageSize = 50
const totalUserCount = ref(0)
const hasMoreUsers = ref(false)
let searchTimer = null

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

const buildUserListCacheKey = (search = keyword.value) => (
  `admin:user-list:${userStore.openid || 'anonymous'}:${String(search || 'all').trim()}`
)

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
  const cached = getPageCache(buildUserListCacheKey(), CACHE_AGE)
  const cachedList = Array.isArray(cached) ? cached : cached?.list
  if (Array.isArray(cachedList)) {
    userList.value = cachedList.map(normalizeUser)
    totalUserCount.value = Number(cached?.total || cachedList.length)
    hasMoreUsers.value = Boolean(cached?.hasMore)
    userPage.value = Number(cached?.page || 1)
    lastRefreshAt.value = Date.now()
  }
}

const persistUserList = (nextList, meta = {}) => {
  const normalized = nextList.map(normalizeUser)
  userList.value = normalized
  totalUserCount.value = Number(meta.total ?? (totalUserCount.value || normalized.length))
  hasMoreUsers.value = Boolean(meta.hasMore ?? hasMoreUsers.value)
  userPage.value = Number(meta.page || userPage.value || 1)
  setPageCache(buildUserListCacheKey(), {
    list: normalized,
    total: totalUserCount.value,
    hasMore: hasMoreUsers.value,
    page: userPage.value
  })
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
      : [normalized, ...userList.value],
    {
      total: exists ? totalUserCount.value : totalUserCount.value + 1
    }
  )
}

const loadUserList = async (force = false, { silent = false, append = false } = {}) => {
  if (syncing.value) {
    return
  }

  let hasCachedList = userList.value.length > 0
  if (!force && !append) {
    const cachedList = getPageCache(buildUserListCacheKey(), CACHE_AGE)
    const cacheRows = Array.isArray(cachedList) ? cachedList : cachedList?.list
    if (Array.isArray(cacheRows)) {
      userList.value = cacheRows.map(normalizeUser)
      totalUserCount.value = Number(cachedList?.total || cacheRows.length)
      hasMoreUsers.value = Boolean(cachedList?.hasMore)
      userPage.value = Number(cachedList?.page || 1)
      hasCachedList = cacheRows.length > 0
    }
  }

  if (!silent && !hasCachedList) {
    uni.showLoading({ title: '加载中...' })
  }

  syncing.value = true
  try {
    const nextPage = append ? userPage.value + 1 : 1
    const { result } = await callCloudFunction('adminManager', {
        action: 'getUserList',
        params: {
          page: nextPage,
          pageSize: userPageSize,
          keyword: keyword.value.trim()
        }
      }, { timeout: 8000 })

    if (!result?.success) {
      throw new Error(result?.error || '加载失败')
    }

    const incoming = (result.data || []).map(normalizeUser)
    const merged = append ? [...userList.value, ...incoming] : incoming
    persistUserList(merged, {
      total: result.total,
      hasMore: merged.length < Number(result.total || 0),
      page: nextPage
    })
  } catch (error) {
    console.error('加载用户列表失败', error)
    uni.showToast({ title: error.message || '加载失败', icon: 'none' })
  } finally {
    syncing.value = false
    if (!silent && !hasCachedList) {
      uni.hideLoading()
    }
  }
}

const loadMoreUsers = () => {
  if (!hasMoreUsers.value || syncing.value) {
    return
  }
  void loadUserList(true, { silent: true, append: true })
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
    return false
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

    const { result } = await callCloudFunction('adminManager', {
      action,
      params
    }, { timeout: 8000 })

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
        const { result } = await callCloudFunction('adminManager', {
            action: 'unbindWechat',
            params: {
              operatorOpenid: userStore.openid,
              userId: item._id
            }
          }, { timeout: 8000 })

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
        const { result } = await callCloudFunction('adminManager', {
            action: 'deleteUser',
            params: {
              operatorOpenid: userStore.openid,
              userId: item._id
            }
          }, { timeout: 8000 })

        if (!result?.success) {
          throw new Error(result?.error || '删除失败')
        }

        uni.showToast({ title: '删除成功', icon: 'success' })
        const deletedUserId = result.data?.userId || item._id
        persistUserList(userList.value.filter((user) => user._id !== deletedUserId), {
          total: Math.max(totalUserCount.value - 1, 0)
        })
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

watch(keyword, () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    userPage.value = 1
    void loadUserList(true, {
      silent: userList.value.length > 0
    })
  }, 300)
})

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
.mini-stat,
.toolbar-card,
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

.summary-main,
.identity-wrap,
.user-top,
.modal-actions,
.role-pill,
.picker-shell {
  display: flex;
  align-items: center;
}

.summary-main,
.identity-wrap {
  gap: 18rpx;
}

.summary-icon {
  width: 92rpx;
  height: 92rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #edf4ff 0%, #f7fbff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-icon-image {
  width: 42rpx;
  height: 42rpx;
}

.summary-number {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #20324b;
}

.summary-text {
  display: block;
  margin-top: 6rpx;
  font-size: 23rpx;
  color: #7790aa;
}

.add-btn,
.btn-primary,
.btn-secondary,
.btn-danger,
.row-btn {
  height: 78rpx;
  line-height: 78rpx;
  border-radius: 18rpx;
  font-size: 26rpx;
}

.add-btn,
.btn-primary {
  background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
  color: #fff;
}

.btn-secondary {
  background: #f7faff;
  color: #305172;
}

.btn-danger {
  background: #fff1f0;
  color: #cf1322;
}

.add-btn::after,
.btn-primary::after,
.btn-secondary::after,
.btn-danger::after {
  border: none;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
  margin-bottom: 18rpx;
}

.mini-stat {
  padding: 22rpx 18rpx;
}

.mini-stat__label {
  display: block;
  font-size: 22rpx;
  color: #7790aa;
}

.mini-stat__value {
  display: block;
  margin-top: 10rpx;
  font-size: 34rpx;
  font-weight: 700;
  color: #20324b;
}

.toolbar-card {
  padding: 20rpx;
  margin-bottom: 18rpx;
}

.search-shell,
.form-input,
.picker-shell {
  min-height: 82rpx;
  border-radius: 18rpx;
  background: #f7faff;
  border: 1rpx solid #e6edf5;
  display: flex;
  align-items: center;
}

.search-shell {
  padding: 0 20rpx;
}

.search-icon,
.picker-arrow {
  width: 28rpx;
  height: 28rpx;
}

.search-input {
  flex: 1;
  margin-left: 12rpx;
  font-size: 27rpx;
  color: #20324b;
}

.user-list {
  display: grid;
  gap: 16rpx;
}

.load-more-row {
  display: flex;
  justify-content: center;
  padding: 24rpx 0 8rpx;
}

.load-more-btn {
  min-width: 240rpx;
  padding: 0 28rpx;
}

.user-card {
  padding: 24rpx;
}

.user-top {
  justify-content: space-between;
  gap: 18rpx;
}

.avatar {
  width: 92rpx;
  height: 92rpx;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  font-weight: 700;
}

.avatar-image {
  width: 100%;
  height: 100%;
}

.identity-copy {
  min-width: 0;
}

.user-name {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #223754;
}

.user-phone {
  display: block;
  margin-top: 6rpx;
  font-size: 23rpx;
  color: #7d90a7;
}

.bind-tag {
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  color: #8c8c8c;
  background: #f5f5f5;
}

.bind-tag.active {
  color: #1677ff;
  background: #edf4ff;
}

.role-panel {
  margin-top: 20rpx;
}

.panel-label {
  display: block;
  font-size: 24rpx;
  color: #6b839e;
}

.role-list {
  display: flex;
  gap: 10rpx;
  flex-wrap: wrap;
  margin-top: 12rpx;
}

.role-pill {
  gap: 8rpx;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
}

.role-icon,
.role-option-icon {
  width: 24rpx;
  height: 24rpx;
}

.role-admin {
  background: #fff7e6;
  color: #d48806;
}

.role-street {
  background: #edf4ff;
  color: #1677ff;
}

.role-community {
  background: #f6ffed;
  color: #389e0d;
}

.role-police {
  background: #f9f0ff;
  color: #722ed1;
}

.community-text {
  display: block;
  margin-top: 12rpx;
  font-size: 23rpx;
  color: #6f85a0;
}

.action-row {
  display: flex;
  gap: 12rpx;
  margin-top: 22rpx;
}

.row-btn {
  flex: 1;
}

.empty-state {
  padding: 80rpx 24rpx 60rpx;
  text-align: center;
}

.empty-mark {
  width: 120rpx;
  height: 120rpx;
  margin: 0 auto 20rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #edf4ff 0%, #f8fbff 100%);
}

.empty-text {
  font-size: 30rpx;
  font-weight: 700;
  color: #223754;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 35, 60, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30rpx;
  z-index: 999;
}

.modal-card {
  width: 100%;
  max-width: 680rpx;
  padding: 28rpx;
}

.modal-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #1f3150;
}

.modal-subtitle {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #7c8fa7;
}

.modal-body {
  margin-top: 24rpx;
}

.form-row + .form-row {
  margin-top: 18rpx;
}

.form-label {
  display: block;
  margin-bottom: 12rpx;
  font-size: 24rpx;
  color: #5a7492;
}

.form-input {
  width: 100%;
  padding: 0 20rpx;
  box-sizing: border-box;
  font-size: 24rpx;
  color: #223754;
}

.role-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
}

.role-option {
  position: relative;
  padding: 18rpx;
  border-radius: 20rpx;
  border: 1rpx solid #e6edf5;
  background: #f9fbff;
}

.role-option.selected {
  border-color: #91caff;
  background: #edf4ff;
}

.role-option-text {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #223754;
}

.role-check {
  position: absolute;
  top: 16rpx;
  right: 18rpx;
  font-size: 20rpx;
  color: #1677ff;
}

.picker-shell {
  justify-content: space-between;
  padding: 0 20rpx;
}

.placeholder {
  color: #9aaec4;
}

.modal-actions {
  gap: 14rpx;
  margin-top: 24rpx;
}

.modal-actions button {
  flex: 1;
}
</style>
