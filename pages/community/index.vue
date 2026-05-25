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
import { callCloudFunction, settleTasks } from '@/utils/cloud'
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
  let hasCache = false

  if (cachedStats) {
    statistics.value = { ...statistics.value, ...cachedStats }
    hasCache = true
  }

  if (Array.isArray(cachedList)) {
    taskList.value = cachedList
    hasCache = true
  }

  return hasCache
}

const loadTaskCounts = async (force = false) => {
  const statsKey = `task:stats:${userStore.role || 'guest'}:${userStore.openid || 'anonymous'}:${userStore.community || 'all'}`
  if (!force) {
    const cachedStats = getPageCache(statsKey, CACHE_AGE)
    if (cachedStats) {
      statistics.value = { ...statistics.value, ...cachedStats }
    }
  }

  const { result } = await callCloudFunction('getStatistics', {
      role: userStore.role,
      openid: userStore.openid,
      community: userStore.community
    }, { timeout: 8000 })

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
    const { result } = await callCloudFunction('getDisputeList', {
        role: userStore.role,
        openid: userStore.openid,
        community: userStore.community,
        status: currentStatus.value === FILTER_ALL ? '' : currentStatus.value,
        lite: true,
        page: page.value,
        pageSize,
        needTotal: false
      }, { timeout: 8000 })

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
    await settleTasks([
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

  initNavbar()
  const hasCache = hydrateCache()

  if (hasCache) {
    hasInitialized.value = true
    void refresh().catch((error) => {
      console.error('任务页后台刷新失败', error)
    })
    return
  }

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
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.72), transparent 24%),
    linear-gradient(180deg, #deecff 0%, #f7faff 38%, #eef4ff 100%);
}

.hero-card,
.stats-card,
.task-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 24rpx;
  border: 1rpx solid rgba(22, 119, 255, 0.08);
  box-shadow: 0 12rpx 28rpx rgba(22, 119, 255, 0.08);
}

.hero-card {
  display: flex;
  justify-content: space-between;
  gap: 24rpx;
  padding: 28rpx;
  margin-bottom: 18rpx;
  background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
}

.hero-title,
.hero-desc,
.hero-badge {
  color: #fff;
}

.hero-title {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
}

.hero-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.7;
  opacity: 0.88;
}

.hero-badge {
  align-self: flex-start;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.18);
  font-size: 24rpx;
}

.action-strip {
  display: flex;
  gap: 12rpx;
  margin-bottom: 18rpx;
}

.action-btn,
.btn-primary,
.btn-secondary,
.empty-btn {
  height: 78rpx;
  line-height: 78rpx;
  border-radius: 18rpx;
  font-size: 26rpx;
}

.action-btn {
  flex: 1;
}

.btn-primary {
  background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
  color: #fff;
}

.btn-secondary {
  background: #f7faff;
  color: #305172;
}

.btn-primary::after,
.btn-secondary::after {
  border: none;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
  margin-bottom: 18rpx;
}

.stats-card {
  padding: 22rpx 18rpx;
}

.stats-card.warning {
  background: linear-gradient(180deg, rgba(255, 247, 230, 0.98), rgba(255, 255, 255, 0.96));
}

.stats-card.accent {
  background: linear-gradient(180deg, rgba(237, 244, 255, 0.98), rgba(255, 255, 255, 0.96));
}

.stats-card.success {
  background: linear-gradient(180deg, rgba(240, 255, 244, 0.98), rgba(255, 255, 255, 0.96));
}

.stats-label {
  display: block;
  font-size: 22rpx;
  color: #7790aa;
}

.stats-value {
  display: block;
  margin-top: 10rpx;
  font-size: 36rpx;
  font-weight: 700;
  color: #223754;
}

.tabs-card {
  margin-bottom: 18rpx;
}

.tabs-card {
  padding: 4rpx 0 2rpx;
  overflow: hidden;
}

.tabs-wrap {
  display: inline-flex;
  gap: 12rpx;
  padding: 0 2rpx 4rpx;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  min-height: 58rpx;
  padding: 0 22rpx;
  border-radius: 999rpx;
  color: #496682;
  background: rgba(255, 255, 255, 0.68);
  border: 1rpx solid rgba(91, 124, 160, 0.14);
  font-size: 24rpx;
  box-shadow: 0 6rpx 16rpx rgba(30, 76, 128, 0.05);
}

.tab-item.active {
  color: #fff;
  background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
  border-color: transparent;
  box-shadow: 0 10rpx 22rpx rgba(22, 119, 255, 0.22);
}

.tab-badge {
  min-width: 30rpx;
  padding: 2rpx 9rpx;
  border-radius: 999rpx;
  background: rgba(22, 119, 255, 0.1);
  color: #1677ff;
  text-align: center;
  font-size: 20rpx;
}

.tab-item.active .tab-badge {
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
}

.task-top,
.title-wrap,
.task-footer,
.time-chip {
  display: flex;
  align-items: center;
}

.task-top,
.task-footer {
  justify-content: space-between;
}

.list-container {
  flex: 1;
  min-height: 0;
}

.task-card {
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.title-wrap {
  gap: 12rpx;
  min-width: 0;
  flex: 1;
}

.task-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #223754;
}

.urgency-chip,
.status-chip {
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
}

.tag-primary {
  background: #edf4ff;
  color: #1677ff;
}

.tag-warning {
  background: #fff4de;
  color: #d48806;
}

.tag-danger {
  background: #fff0f0;
  color: #cf1322;
}

.status-pending {
  background: #fff7e6;
  color: #d48806;
}

.status-processing {
  background: #edf4ff;
  color: #1677ff;
}

.status-resolved {
  background: #f6ffed;
  color: #389e0d;
}

.status-closed {
  background: #f5f5f5;
  color: #8c8c8c;
}

.task-body {
  margin-top: 18rpx;
  display: grid;
  gap: 12rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 12rpx;
}

.info-label {
  width: 96rpx;
  font-size: 24rpx;
  color: #7b91aa;
}

.info-value {
  flex: 1;
  text-align: right;
  font-size: 24rpx;
  color: #223754;
}

.info-value.location {
  max-width: 420rpx;
}

.task-footer {
  margin-top: 20rpx;
}

.time-chip {
  gap: 10rpx;
  font-size: 23rpx;
  color: #6f85a0;
}

.time-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #1677ff;
}

.state-text,
.empty-text,
.empty-desc {
  text-align: center;
}

.state-text {
  padding: 24rpx 0 36rpx;
  font-size: 24rpx;
  color: #6f85a0;
}

.empty-state {
  padding: 80rpx 24rpx 60rpx;
}

.empty-mark {
  width: 120rpx;
  height: 120rpx;
  margin: 0 auto 20rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #edf4ff 0%, #f8fbff 100%);
}

.empty-text {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #223754;
}

.empty-desc {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #7790aa;
}

.empty-actions {
  display: flex;
  gap: 14rpx;
  margin-top: 26rpx;
}

.empty-btn {
  flex: 1;
}
</style>
