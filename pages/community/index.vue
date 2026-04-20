<template>
  <view class="task-page" :style="{ paddingTop: `${safeAreaTop + 12}px` }">
    <view class="hero-card">
      <view>
        <text class="hero-title">{{ pageTitle }}</text>
        <text class="hero-desc">{{ pageDesc }}</text>
      </view>
      <view class="hero-badge">{{ userStore.role || '未登录' }}</view>
    </view>

    <view class="action-strip">
      <button v-if="canCreateDispute" class="btn-primary action-btn" @click="goToInput">录入纠纷</button>
      <button v-if="canGoStreetManage" class="btn-secondary action-btn" @click="goToStreetManage">街道管理</button>
      <button v-else class="btn-secondary action-btn" @click="refresh">刷新任务</button>
    </view>

    <view class="stats-grid">
      <view
        v-for="card in summaryCards"
        :key="card.label"
        class="stats-card"
        :class="card.type"
      >
        <text class="stats-label">{{ card.label }}</text>
        <text class="stats-value">{{ card.value }}</text>
      </view>
    </view>

    <view class="tabs-card">
      <scroll-view scroll-x class="tabs-scroll" :show-scrollbar="false">
        <view class="tabs-wrap">
          <view
            v-for="status in statusTabs"
            :key="status.value"
            class="tab-item"
            :class="{ active: currentStatus === status.value }"
            @click="switchStatus(status.value)"
          >
            <text class="tab-label">{{ status.label }}</text>
            <text v-if="status.count > 0" class="tab-badge">{{ status.count }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="status-summary-card">
      <view class="status-summary-main">
        <text class="status-summary-title">当前视图</text>
        <text class="status-summary-value">{{ currentStatusLabel }}</text>
      </view>
      <text class="status-summary-desc">{{ statusSummaryDesc }}</text>
    </view>

    <scroll-view
      scroll-y
      class="list-container"
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="refresh"
    >
      <view
        v-for="item in taskList"
        :key="item._id"
        class="task-card"
        @click="goToDetail(item._id)"
      >
        <view class="task-top">
          <view class="title-wrap">
            <text class="task-title">{{ item.title || '未命名纠纷' }}</text>
            <text class="urgency-chip" :class="getUrgencyClass(item.urgency)">
              {{ item.urgency || '一般' }}
            </text>
          </view>
          <text class="status-chip" :class="getStatusClass(item.status)">
            {{ item.status || '状态未知' }}
          </text>
        </view>

        <view class="task-body">
          <view class="info-row">
            <text class="info-label">来源</text>
            <text class="info-value">{{ item.source || '未填写' }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">涉及人员</text>
            <text class="info-value">{{ item.parties || '未填写' }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">发生地点</text>
            <text class="info-value location">{{ item.location?.address || '未填写' }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">发生次数</text>
            <text class="info-value">{{ item.occur_count || 1 }} 次</text>
          </view>
        </view>

        <view class="task-footer">
          <view class="time-chip">
            <view class="time-dot"></view>
            <text>{{ formatTime(item.assign_time || item.create_time) }}</text>
          </view>

          <button
            v-if="item.status === DISPUTE_STATUS.PENDING_VISIT"
            class="btn-primary"
            @click.stop="goToDetail(item._id)"
          >
            立即回访
          </button>
          <button
            v-else
            class="btn-secondary"
            @click.stop="goToDetail(item._id)"
          >
            查看详情
          </button>
        </view>
      </view>

      <view v-if="loading" class="state-text">加载中...</view>
      <view v-else-if="!hasMore && taskList.length > 0" class="state-text">没有更多了</view>
      <view v-else-if="!loading && taskList.length === 0" class="empty-state">
        <view class="empty-mark"></view>
        <text class="empty-text">当前条件下暂无任务</text>
        <text class="empty-desc">可以下拉刷新，或切换到其他状态查看历史任务</text>
        <view class="empty-actions">
          <button
            v-if="availableStatuses.length > 1"
            class="btn-secondary empty-btn"
            @click="switchStatus(availableStatuses[0])"
          >
            查看全部
          </button>
          <button class="btn-primary empty-btn" @click="refresh">重新加载</button>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { getNavbarConfig } from '@/utils/navbar'
import {
  DISPUTE_STATUS,
  FILTER_ALL,
  STATUS_CLASS_MAP,
  URGENCY_TAG_CLASS_MAP,
  USER_ROLES
} from '@/utils/constants'
import { getPageCache, getPageCacheDirtyAt, setPageCache } from '@/utils/page-cache'
import { getStreetTabByRole, switchTabWithFallback } from '@/utils/navigation'

const userStore = useUserStore()
const safeAreaTop = ref(0)
const taskList = ref([])
const loading = ref(false)
const refreshing = ref(false)
const page = ref(1)
const pageSize = 10
const hasMore = ref(true)
const lastRefreshAt = ref(0)
const isInitializing = ref(false)
const hasInitialized = ref(false)
const statistics = ref({
  todayNew: 0,
  pendingAssign: 0,
  pendingVisit: 0,
  processing: 0,
  resolved: 0,
  totalCount: 0
})

const CACHE_AGE = 60 * 1000
const REFRESH_INTERVAL = 45 * 1000

const roleStatusMap = {
  [USER_ROLES.POLICE]: [
    FILTER_ALL,
    DISPUTE_STATUS.PENDING_ASSIGN,
    DISPUTE_STATUS.PENDING_VISIT,
    DISPUTE_STATUS.PROCESSING,
    DISPUTE_STATUS.RESOLVED,
    DISPUTE_STATUS.CLOSED
  ],
  [USER_ROLES.STREET]: [
    FILTER_ALL,
    DISPUTE_STATUS.PENDING_ASSIGN,
    DISPUTE_STATUS.PENDING_VISIT,
    DISPUTE_STATUS.PROCESSING,
    DISPUTE_STATUS.RESOLVED,
    DISPUTE_STATUS.CLOSED
  ],
  [USER_ROLES.COMMUNITY]: [
    DISPUTE_STATUS.PENDING_VISIT,
    DISPUTE_STATUS.PROCESSING,
    DISPUTE_STATUS.RESOLVED
  ],
  [USER_ROLES.ADMIN]: [
    FILTER_ALL,
    DISPUTE_STATUS.PENDING_ASSIGN,
    DISPUTE_STATUS.PENDING_VISIT,
    DISPUTE_STATUS.PROCESSING,
    DISPUTE_STATUS.RESOLVED,
    DISPUTE_STATUS.CLOSED
  ]
}

const getDefaultStatus = () => (
  userStore.role === USER_ROLES.COMMUNITY
    ? DISPUTE_STATUS.PENDING_VISIT
    : FILTER_ALL
)

const currentStatus = ref(getDefaultStatus())

const initNavbar = () => {
  const config = getNavbarConfig()
  safeAreaTop.value = config.safeAreaTop
}

const ensureTaskAccess = () => {
  if (userStore.isLogin && userStore.openid) {
    return true
  }

  uni.redirectTo({ url: '/pages/login/index' })
  return false
}

const availableStatuses = computed(() => (
  roleStatusMap[userStore.role] || [FILTER_ALL]
))

const getStatusCount = (status) => {
  switch (status) {
    case FILTER_ALL:
      return statistics.value.totalCount || 0
    case DISPUTE_STATUS.PENDING_ASSIGN:
      return statistics.value.pendingAssign || 0
    case DISPUTE_STATUS.PENDING_VISIT:
      return statistics.value.pendingVisit || 0
    case DISPUTE_STATUS.PROCESSING:
      return statistics.value.processing || 0
    case DISPUTE_STATUS.RESOLVED:
      return statistics.value.resolved || 0
    default:
      return 0
  }
}

const statusTabs = computed(() => (
  availableStatuses.value.map((status) => ({
    label: status,
    value: status,
    count: getStatusCount(status)
  }))
))

const currentStatusLabel = computed(() => {
  const hit = statusTabs.value.find((item) => item.value === currentStatus.value)
  return hit?.label || currentStatus.value
})

const statusSummaryDesc = computed(() => {
  if (currentStatus.value === FILTER_ALL) {
    return '当前展示当前角色可见的全部任务，便于快速浏览整体进展。'
  }

  return `当前聚焦“${currentStatusLabel.value}”任务，适合集中处理同一阶段事项。`
})

const pageTitle = computed(() => {
  switch (userStore.role) {
    case USER_ROLES.POLICE:
      return '我的任务'
    case USER_ROLES.STREET:
      return '街道任务'
    case USER_ROLES.COMMUNITY:
      return '社区任务'
    case USER_ROLES.ADMIN:
      return '任务总览'
    default:
      return '任务列表'
  }
})

const pageDesc = computed(() => {
  switch (userStore.role) {
    case USER_ROLES.POLICE:
      return '查看我录入的纠纷处理进度。'
    case USER_ROLES.STREET:
      return '查看街道侧需要跟进和分派的纠纷任务。'
    case USER_ROLES.COMMUNITY:
      return '查看分派到社区的纠纷任务与回访进展。'
    case USER_ROLES.ADMIN:
      return '统一查看全部纠纷任务的最新进展。'
    default:
      return '查看当前账号可见的纠纷任务。'
  }
})

const canCreateDispute = computed(() => userStore.isLogin && !!userStore.openid)

const canGoStreetManage = computed(() => (
  userStore.role === USER_ROLES.STREET || userStore.role === USER_ROLES.ADMIN
))

const summaryCards = computed(() => {
  switch (userStore.role) {
    case USER_ROLES.POLICE:
      return [
        { label: '今日录入', value: statistics.value.todayNew || 0, type: '' },
        { label: '我的纠纷', value: statistics.value.totalCount || 0, type: 'accent' },
        { label: '已化解', value: statistics.value.resolved || 0, type: 'success' }
      ]
    case USER_ROLES.STREET:
      return [
        { label: '待分派', value: statistics.value.pendingAssign || 0, type: 'warning' },
        { label: '处理中', value: statistics.value.processing || 0, type: 'accent' },
        { label: '已化解', value: statistics.value.resolved || 0, type: 'success' }
      ]
    case USER_ROLES.COMMUNITY:
      return [
        { label: '待回访', value: statistics.value.pendingVisit || 0, type: 'warning' },
        { label: '处理中', value: statistics.value.processing || 0, type: 'accent' },
        { label: '已化解', value: statistics.value.resolved || 0, type: 'success' }
      ]
    case USER_ROLES.ADMIN:
      return [
        { label: '纠纷总数', value: statistics.value.totalCount || 0, type: '' },
        { label: '待分派', value: statistics.value.pendingAssign || 0, type: 'warning' },
        { label: '已化解', value: statistics.value.resolved || 0, type: 'success' }
      ]
    default:
      return [{ label: '任务总数', value: statistics.value.totalCount || 0, type: '' }]
  }
})

const buildKey = (scope) => {
  const role = userStore.role || 'guest'
  const openid = userStore.openid || 'anonymous'
  const community = userStore.community || 'all'
  return `task:${scope}:${role}:${openid}:${community}:${currentStatus.value}`
}

const hydrateCache = () => {
  const statsKey = `task:stats:${userStore.role || 'guest'}:${userStore.openid || 'anonymous'}:${userStore.community || 'all'}`
  const cachedStats = getPageCache(statsKey, CACHE_AGE)
  const cachedList = getPageCache(buildKey('list'), CACHE_AGE)

  if (cachedStats) {
    statistics.value = { ...statistics.value, ...cachedStats }
  }

  if (Array.isArray(cachedList)) {
    taskList.value = cachedList
  }
}

const loadTaskCounts = async (force = false) => {
  const statsKey = `task:stats:${userStore.role || 'guest'}:${userStore.openid || 'anonymous'}:${userStore.community || 'all'}`
  if (!force) {
    const cachedStats = getPageCache(statsKey, CACHE_AGE)
    if (cachedStats) {
      statistics.value = { ...statistics.value, ...cachedStats }
    }
  }

  const { result } = await uniCloud.callFunction({
    name: 'getStatistics',
    data: {
      role: userStore.role,
      openid: userStore.openid,
      community: userStore.community
    }
  })

  if (!result?.success) {
    throw new Error(result?.error || '统计加载失败')
  }

  statistics.value = {
    ...statistics.value,
    ...result.data
  }
  setPageCache(statsKey, statistics.value)
}

const loadList = async ({ force = false, reset = false } = {}) => {
  if (loading.value) {
    return
  }

  if (reset) {
    page.value = 1
    hasMore.value = true
  }

  if (!force && page.value === 1) {
    const cachedList = getPageCache(buildKey('list'), CACHE_AGE)
    if (Array.isArray(cachedList)) {
      taskList.value = cachedList
    }
  }

  loading.value = true
  try {
    const { result } = await uniCloud.callFunction({
      name: 'getDisputeList',
      data: {
        role: userStore.role,
        openid: userStore.openid,
        community: userStore.community,
        status: currentStatus.value === FILTER_ALL ? '' : currentStatus.value,
        lite: true,
        page: page.value,
        pageSize,
        needTotal: false
      }
    })

    if (!result?.success) {
      throw new Error(result?.error || '任务加载失败')
    }

    const rows = result.data || []
    taskList.value = page.value === 1 ? rows : [...taskList.value, ...rows]
    hasMore.value = Boolean(result.hasMore)

    if (page.value === 1) {
      setPageCache(buildKey('list'), taskList.value)
    }
  } finally {
    loading.value = false
  }
}

const refresh = async () => {
  refreshing.value = true
  try {
    await Promise.all([
      loadTaskCounts(true),
      loadList({ force: true, reset: true })
    ])
    lastRefreshAt.value = Date.now()
  } catch (error) {
    console.error('任务页刷新失败', error)
    uni.showToast({ title: error.message || '刷新失败', icon: 'none' })
  } finally {
    refreshing.value = false
  }
}

const switchStatus = async (status) => {
  if (currentStatus.value === status) {
    return
  }
  currentStatus.value = status
  await loadList({ force: true, reset: true })
}

const loadMore = async () => {
  if (!hasMore.value || loading.value) {
    return
  }
  page.value += 1
  await loadList({ force: true })
}

const goToInput = () => {
  switchTabWithFallback('/pages/input/index')
}

const goToStreetManage = () => {
  switchTabWithFallback(getStreetTabByRole(userStore.role))
}

const goToDetail = (id) => {
  uni.navigateTo({ url: `/pages/detail/index?id=${id}` })
}

const formatTime = (value) => {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (minutes < 1440) return `${Math.floor(minutes / 60)} 小时前`

  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const mins = `${date.getMinutes()}`.padStart(2, '0')
  return `${month}-${day} ${hours}:${mins}`
}

const getStatusClass = (status) => STATUS_CLASS_MAP[status] || ''
const getUrgencyClass = (urgency) => URGENCY_TAG_CLASS_MAP[urgency] || 'tag-primary'

watch(
  () => userStore.role,
  () => {
    if (!availableStatuses.value.includes(currentStatus.value)) {
      currentStatus.value = getDefaultStatus()
    }
  }
)

onMounted(async () => {
  if (!ensureTaskAccess()) {
    return
  }

  if (!availableStatuses.value.includes(currentStatus.value)) {
    currentStatus.value = getDefaultStatus()
  }

  initNavbar()
  hydrateCache()

  isInitializing.value = true
  try {
    await Promise.all([
      loadTaskCounts(false),
      loadList({ force: false, reset: true })
    ])
    lastRefreshAt.value = Date.now()
  } catch (error) {
    console.error('任务页加载失败', error)
  } finally {
    isInitializing.value = false
    hasInitialized.value = true
  }
})

onShow(async () => {
  if (!ensureTaskAccess()) {
    return
  }

  initNavbar()
  if (!availableStatuses.value.includes(currentStatus.value)) {
    currentStatus.value = getDefaultStatus()
  }

  if (isInitializing.value || !hasInitialized.value) {
    return
  }

  const isDirty = getPageCacheDirtyAt('task:') > lastRefreshAt.value
  const isStale = Date.now() - lastRefreshAt.value > REFRESH_INTERVAL
  if (taskList.value.length === 0 || isStale || isDirty) {
    await refresh()
  }
})
</script>

<style lang="scss" scoped>
.task-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20rpx;
  box-sizing: border-box;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.7), transparent 24%),
    linear-gradient(180deg, #deecff 0%, #f7faff 38%, #eef4ff 100%);
}

.hero-card,
.tabs-card,
.task-card,
.stats-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 24rpx;
  border: 1rpx solid rgba(22, 119, 255, 0.08);
  box-shadow: 0 12rpx 28rpx rgba(22, 119, 255, 0.08);
}

.hero-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
  padding: 28rpx;
  margin-bottom: 18rpx;
}

.action-strip {
  display: flex;
  gap: 14rpx;
  margin-bottom: 18rpx;
}

.action-btn {
  flex: 1;
}

.hero-title {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
  color: #1f3150;
  margin-bottom: 8rpx;
}

.hero-desc {
  display: block;
  font-size: 24rpx;
  line-height: 1.6;
  color: #6f839d;
}

.hero-badge {
  flex-shrink: 0;
  min-width: 136rpx;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  text-align: center;
  background: #edf4ff;
  color: #145bd7;
  font-size: 24rpx;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14rpx;
  margin-bottom: 18rpx;
}

.stats-card {
  padding: 24rpx 18rpx;
  text-align: center;
}

.stats-card.warning .stats-value {
  color: #fa8c16;
}

.stats-card.success .stats-value {
  color: #52c41a;
}

.stats-card.accent {
  background: linear-gradient(135deg, rgba(20, 91, 215, 0.96) 0%, rgba(79, 149, 255, 0.96) 100%);
}

.stats-card.accent .stats-label,
.stats-card.accent .stats-value {
  color: #fff;
}

.stats-label {
  display: block;
  font-size: 23rpx;
  color: #7587a0;
  margin-bottom: 8rpx;
}

.stats-value {
  display: block;
  font-size: 42rpx;
  line-height: 1.1;
  font-weight: 700;
  color: #163052;
}

.tabs-card {
  padding: 14rpx 0;
  margin-bottom: 18rpx;
}

.status-summary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  padding: 20rpx 22rpx;
  margin-bottom: 18rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.84);
  border: 1rpx solid rgba(22, 119, 255, 0.08);
}

.status-summary-main {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.status-summary-title {
  font-size: 22rpx;
  color: #7b8ea6;
}

.status-summary-value {
  font-size: 30rpx;
  color: #1f3150;
  font-weight: 700;
}

.status-summary-desc {
  flex: 1;
  text-align: right;
  font-size: 22rpx;
  line-height: 1.6;
  color: #7b8ea6;
}

.tabs-wrap {
  display: flex;
  gap: 12rpx;
  padding: 0 18rpx;
}

.tab-item {
  padding: 14rpx 24rpx;
  border-radius: 999rpx;
  background: #f4f8ff;
  color: #5d7390;
  font-size: 25rpx;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
}

.tab-item.active {
  background: linear-gradient(135deg, #145bd7 0%, #4f95ff 100%);
}

.tab-item.active .tab-label,
.tab-item.active .tab-badge {
  color: #fff;
}

.tab-item.active .tab-badge {
  background: rgba(255, 255, 255, 0.18);
}

.tab-badge {
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 10rpx;
  border-radius: 999rpx;
  background: #e6eef8;
  font-size: 20rpx;
  color: #48617f;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.list-container {
  flex: 1;
  height: 0;
}

.task-card {
  padding: 26rpx;
  margin-bottom: 18rpx;
}

.task-top {
  display: flex;
  justify-content: space-between;
  gap: 14rpx;
  margin-bottom: 18rpx;
}

.title-wrap {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.task-title {
  font-size: 29rpx;
  font-weight: 700;
  color: #1f3150;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-chip,
.urgency-chip {
  flex-shrink: 0;
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 600;
}

.status-pending {
  background: #fff7e6;
  color: #fa8c16;
}

.status-processing {
  background: #e6f4ff;
  color: #1677ff;
}

.status-resolved {
  background: #f6ffed;
  color: #52c41a;
}

.status-closed {
  background: #f5f5f5;
  color: #8c8c8c;
}

.tag-primary {
  background: #e6f4ff;
  color: #1677ff;
}

.tag-warning {
  background: #fff7e6;
  color: #fa8c16;
}

.tag-danger {
  background: #fff1f0;
  color: #ff4d4f;
}

.task-body {
  background: #f7faff;
  border-radius: 18rpx;
  padding: 20rpx;
}

.info-row {
  display: flex;
  gap: 18rpx;
  margin-bottom: 12rpx;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  width: 96rpx;
  flex-shrink: 0;
  font-size: 24rpx;
  color: #7c8fa7;
}

.info-value {
  flex: 1;
  font-size: 25rpx;
  color: #24364f;
}

.location {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-footer {
  margin-top: 18rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
}

.time-chip {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  color: #7b8ea6;
  font-size: 23rpx;
}

.time-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #1677ff;
}

.btn-primary,
.btn-secondary {
  min-width: 176rpx;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 18rpx;
  font-size: 24rpx;
  font-weight: 600;
}

.btn-primary::after,
.btn-secondary::after {
  border: none;
}

.btn-primary {
  color: #fff;
  background: linear-gradient(135deg, #145bd7 0%, #4f95ff 100%);
}

.btn-secondary {
  color: #35506f;
  background: #eef4ff;
}

.state-text {
  text-align: center;
  font-size: 24rpx;
  color: #7c8fa7;
  padding: 24rpx 0 40rpx;
}

.empty-state {
  padding: 90rpx 40rpx;
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

.empty-desc {
  margin-top: 10rpx;
  font-size: 23rpx;
  line-height: 1.6;
  color: #91a2b7;
  text-align: center;
}

.empty-actions {
  display: flex;
  gap: 14rpx;
  margin-top: 22rpx;
}

.empty-btn {
  min-width: 170rpx;
}

@media (max-width: 520px) {
  .action-strip,
  .status-summary-card,
  .empty-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .status-summary-desc {
    text-align: left;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
