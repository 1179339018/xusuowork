<template>
  <view class="street-page" :style="{ paddingTop: `${safeAreaTop + 12}px` }">
    <view class="toolbar-card">
      <view class="search-shell">
        <image class="toolbar-icon" src="/static/icons/icon-search.svg" mode="aspectFit" />
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索标题、当事人或描述"
          @confirm="applySearch"
        />
      </view>

      <picker mode="date" :value="startDate" @change="onStartDateChange">
        <view class="date-trigger">
          <image class="toolbar-icon" src="/static/icons/icon-calendar.svg" mode="aspectFit" />
          <text class="date-text">{{ dateRangeText }}</text>
        </view>
      </picker>
    </view>

    <view class="tabs-card">
      <scroll-view scroll-x class="tabs-scroll" :show-scrollbar="false">
        <view class="tabs-wrap">
          <view
            v-for="status in statusTabs"
            :key="status"
            class="tab-item"
            :class="{ active: currentStatus === status }"
            @click="switchStatus(status)"
          >
            <text>{{ status }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <view v-if="filterChips.length > 0" class="filter-card">
      <text class="filter-label">当前筛选</text>
      <view class="filter-chips">
        <view v-for="chip in filterChips" :key="chip" class="filter-chip">
          <text>{{ chip }}</text>
        </view>
      </view>
      <text class="filter-clear" @click="resetFilters">清空</text>
    </view>

    <view class="stats-grid">
      <view class="stats-card">
        <text class="stats-label">今日新增</text>
        <text class="stats-value">{{ statistics.todayNew }}</text>
      </view>
      <view class="stats-card warning">
        <text class="stats-label">待分派</text>
        <text class="stats-value">{{ statistics.pendingAssign }}</text>
      </view>
      <view class="stats-card success">
        <text class="stats-label">已化解</text>
        <text class="stats-value">{{ statistics.resolved }}</text>
      </view>
    </view>

    <view class="focus-card">
      <text class="focus-title">{{ focusTitle }}</text>
      <text class="focus-desc">{{ focusDesc }}</text>
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
        v-for="item in disputeList"
        :key="item._id"
        class="list-card"
        @click="goToDetail(item._id)"
      >
        <view class="card-top">
          <view class="title-wrap">
            <text class="card-title">{{ item.title || '未命名纠纷' }}</text>
            <text class="urgency-chip" :class="getUrgencyClass(item.urgency)">
              {{ item.urgency || '一般' }}
            </text>
          </view>
          <text class="status-chip" :class="getStatusClass(item.status)">
            {{ item.status || '状态未知' }}
          </text>
        </view>

        <view class="card-body">
          <view class="info-row">
            <text class="info-label">来源</text>
            <text class="info-value">{{ item.source || '未填写' }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">位置</text>
            <text class="info-value location">{{ item.location?.address || '未知' }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">时间</text>
            <text class="info-value">{{ formatTime(item.create_time) }}</text>
          </view>
        </view>

        <view v-if="item.status === DISPUTE_STATUS.PENDING_ASSIGN" class="card-action">
          <button class="btn-assign" @click.stop="openAssignModal(item)">分派社区</button>
        </view>
      </view>

      <view v-if="loading" class="state-text">加载中...</view>
      <view v-else-if="!hasMore && disputeList.length > 0" class="state-text">没有更多了</view>
      <view v-else-if="!loading && disputeList.length === 0" class="empty-state">
        <view class="empty-mark"></view>
        <text class="empty-text">暂无相关纠纷</text>
        <text class="empty-desc">可以尝试切换状态、清空关键词，或重新选择日期</text>
        <view class="empty-actions">
          <button class="btn-secondary empty-btn" @click="resetFilters">重置筛选</button>
          <button class="btn-primary empty-btn" @click="refresh">重新加载</button>
        </view>
      </view>
    </scroll-view>

    <view v-if="showAssign" class="modal-mask" @click="showAssign = false">
      <view class="modal-card" @click.stop>
        <view class="modal-head">
          <text class="modal-title">分派纠纷</text>
          <image
            class="modal-close"
            src="/static/icons/icon-close.svg"
            mode="aspectFit"
            @click="showAssign = false"
          />
        </view>

        <view class="modal-body">
          <view class="form-row">
            <text class="form-label">选择社区</text>
            <picker
              mode="selector"
              :range="communityOptions"
              :value="assignForm.communityIndex"
              @change="onAssignCommunityChange"
            >
              <view class="picker-shell">
                <text>{{ assignForm.communityName || '请选择社区' }}</text>
                <image class="picker-arrow" src="/static/icons/icon-arrow.svg" mode="aspectFit" />
              </view>
            </picker>
          </view>

          <view class="form-row">
            <text class="form-label">备注</text>
            <textarea
              v-model="assignForm.remark"
              class="remark-input"
              maxlength="200"
              placeholder="输入分派备注（可选）"
            />
          </view>
        </view>

        <view class="modal-actions">
          <button class="btn-secondary" @click="showAssign = false">取消</button>
          <button class="btn-primary" :loading="assigning" @click="confirmAssign">确认分派</button>
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
import { callCloudFunction, settleTasks } from '@/utils/cloud'
import {
  COMMUNITY_OPTIONS,
  DISPUTE_STATUS,
  FILTER_ALL,
  STATUS_CLASS_MAP,
  URGENCY_TAG_CLASS_MAP,
  USER_ROLES
} from '@/utils/constants'
import { clearPageCacheByPrefix, getPageCache, getPageCacheDirtyAt, setPageCache } from '@/utils/page-cache'
import { getTaskTabByRole } from '@/utils/navigation'

const userStore = useUserStore()
const safeAreaTop = ref(0)
const currentStatus = ref(FILTER_ALL)
const keyword = ref('')
const startDate = ref('')
const disputeList = ref([])
const loading = ref(false)
const refreshing = ref(false)
const page = ref(1)
const hasMore = ref(true)
const lastRefreshAt = ref(0)
const isInitializing = ref(false)
const hasInitialized = ref(false)
const statistics = ref({
  todayNew: 0,
  pendingAssign: 0,
  resolved: 0
})
const showAssign = ref(false)
const assigning = ref(false)
const currentDispute = ref(null)
const pageSize = 10
const communityOptions = COMMUNITY_OPTIONS
const statusTabs = [
  FILTER_ALL,
  DISPUTE_STATUS.PENDING_ASSIGN,
  DISPUTE_STATUS.PENDING_VISIT,
  DISPUTE_STATUS.PROCESSING,
  DISPUTE_STATUS.RESOLVED
]

const assignForm = reactive({
  communityId: '',
  communityName: '',
  communityIndex: 0,
  remark: ''
})

const CACHE_AGE = 60 * 1000
const REFRESH_INTERVAL = 45 * 1000

const initNavbar = () => {
  const config = getNavbarConfig()
  safeAreaTop.value = config.safeAreaTop
}

const ensureStreetAccess = () => {
  if (userStore.role === USER_ROLES.STREET || userStore.role === USER_ROLES.ADMIN) {
    return true
  }

  uni.reLaunch({ url: getTaskTabByRole() })
  return false
}

const buildKey = (scope) => {
  const community = userStore.community || 'all'
  const openid = userStore.openid || 'anonymous'
  return `street:${scope}:${userStore.role}:${openid}:${community}:${currentStatus.value}:${keyword.value || 'all'}:${startDate.value || 'none'}`
}

const dateRangeText = computed(() => (
  startDate.value || '筛选日期'
))

const filterChips = computed(() => {
  const chips = []
  if (currentStatus.value !== FILTER_ALL) {
    chips.push(`状态：${currentStatus.value}`)
  }
  if (keyword.value.trim()) {
    chips.push(`关键词：${keyword.value.trim()}`)
  }
  if (startDate.value) {
    chips.push(`日期：${startDate.value}`)
  }
  return chips
})

const focusTitle = computed(() => {
  if (currentStatus.value === FILTER_ALL) {
    return `当前待分派 ${statistics.value.pendingAssign || 0} 条`
  }
  return `当前聚焦：${currentStatus.value}`
})

const focusDesc = computed(() => {
  if (keyword.value.trim()) {
    return `已按关键词“${keyword.value.trim()}”筛选，适合集中处理当前查询结果。`
  }
  if (startDate.value) {
    return `已限定日期范围，便于快速排查 ${dateRangeText.value} 的任务。`
  }
  if (currentStatus.value === DISPUTE_STATUS.PENDING_ASSIGN) {
    return '优先处理待分派纠纷，尽快把任务下发到对应社区。'
  }
  if (currentStatus.value === DISPUTE_STATUS.PENDING_VISIT) {
    return '当前视图聚焦待回访事项，便于跟踪社区处理进度。'
  }
  return '街道页已按轻刷新模式运行，返回页面时只会在必要时更新数据。'
})

const hydrateCache = () => {
  const statsKey = `street:stats:${userStore.role}:${userStore.openid || 'anonymous'}:${userStore.community || 'all'}`
  const cachedStats = getPageCache(statsKey, CACHE_AGE)
  const cachedList = getPageCache(buildKey('list'), CACHE_AGE)
  let hasCache = false

  if (cachedStats) {
    statistics.value = { ...statistics.value, ...cachedStats }
    hasCache = true
  }
  if (Array.isArray(cachedList)) {
    disputeList.value = cachedList
    hasCache = true
  }

  return hasCache
}

const loadStatistics = async (force = false) => {
  const statsKey = `street:stats:${userStore.role}:${userStore.openid || 'anonymous'}:${userStore.community || 'all'}`
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
    todayNew: result.data?.todayNew || 0,
    pendingAssign: result.data?.pendingAssign || 0,
    resolved: result.data?.resolved || 0
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
      disputeList.value = cachedList
    }
  }

  loading.value = true
  try {
    const { result } = await callCloudFunction('getDisputeList', {
        role: USER_ROLES.STREET,
        openid: userStore.openid,
        status: currentStatus.value === FILTER_ALL ? '' : currentStatus.value,
        keyword: keyword.value.trim(),
        startDate: startDate.value,
        endDate: startDate.value,
        lite: true,
        page: page.value,
        pageSize,
        needTotal: false
      }, { timeout: 8000 })

    if (!result?.success) {
      throw new Error(result?.error || '列表加载失败')
    }

    const rows = result.data || []
    disputeList.value = page.value === 1 ? rows : [...disputeList.value, ...rows]
    hasMore.value = Boolean(result.hasMore)

    if (page.value === 1) {
      setPageCache(buildKey('list'), disputeList.value)
    }
  } finally {
    loading.value = false
  }
}

const refresh = async () => {
  refreshing.value = true
  try {
    await settleTasks([
      loadStatistics(true),
      loadList({ force: true, reset: true })
    ])
    lastRefreshAt.value = Date.now()
  } catch (error) {
    console.error('街道页刷新失败', error)
    uni.showToast({ title: error.message || '刷新失败', icon: 'none' })
  } finally {
    refreshing.value = false
  }
}

const applySearch = async () => {
  await loadList({ force: true, reset: true })
}

const resetFilters = async () => {
  const hadFilters = currentStatus.value !== FILTER_ALL || keyword.value.trim() || startDate.value
  currentStatus.value = FILTER_ALL
  keyword.value = ''
  startDate.value = ''
  if (hadFilters) {
    await loadList({ force: true, reset: true })
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

const goToDetail = (id) => {
  uni.navigateTo({ url: `/pages/detail/index?id=${id}` })
}

const openAssignModal = (item) => {
  currentDispute.value = item
  assignForm.communityId = ''
  assignForm.communityName = ''
  assignForm.communityIndex = 0
  assignForm.remark = ''
  showAssign.value = true
}

const onAssignCommunityChange = (e) => {
  const index = Number(e.detail.value) || 0
  assignForm.communityIndex = index
  assignForm.communityName = communityOptions[index]
  assignForm.communityId = communityOptions[index]
}

const confirmAssign = async () => {
  if (!assignForm.communityId) {
    uni.showToast({ title: '请选择社区', icon: 'none' })
    return
  }

  assigning.value = true
  try {
    const { result } = await callCloudFunction('assignToCommunity', {
        disputeId: currentDispute.value._id,
        communityId: assignForm.communityId,
        remark: assignForm.remark,
        userInfo: {
          openid: userStore.openid,
          name: userStore.name
        }
      }, { timeout: 10000 })

    if (!result?.success) {
      throw new Error(result?.error || '分派失败')
    }

    uni.showToast({ title: '分派成功', icon: 'success' })
    clearPageCacheByPrefix('home:')
    clearPageCacheByPrefix('street:')
    clearPageCacheByPrefix('task:')
    clearPageCacheByPrefix('detail:')
    showAssign.value = false
    await refresh()
  } catch (error) {
    console.error('分派失败', error)
    uni.showToast({ title: error.message || '分派失败', icon: 'none' })
  } finally {
    assigning.value = false
  }
}

const onStartDateChange = async (e) => {
  startDate.value = e.detail.value
  await loadList({ force: true, reset: true })
}

const formatTime = (value) => {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

const getStatusClass = (status) => STATUS_CLASS_MAP[status] || ''
const getUrgencyClass = (urgency) => URGENCY_TAG_CLASS_MAP[urgency] || 'tag-primary'

onMounted(async () => {
  if (!ensureStreetAccess()) {
    return
  }

  initNavbar()
  const hasCache = hydrateCache()

  if (hasCache) {
    hasInitialized.value = true
    void refresh().catch((error) => {
      console.error('街道页后台刷新失败', error)
    })
    return
  }

  isInitializing.value = true
  try {
    await Promise.all([
      loadStatistics(false),
      loadList({ force: false, reset: true })
    ])
    lastRefreshAt.value = Date.now()
  } catch (error) {
    console.error('街道页加载失败', error)
  } finally {
    isInitializing.value = false
    hasInitialized.value = true
  }
})

onShow(async () => {
  if (!ensureStreetAccess()) {
    return
  }

  initNavbar()
  if (isInitializing.value || !hasInitialized.value) {
    return
  }

  const isDirty = getPageCacheDirtyAt('street:') > lastRefreshAt.value
  const isStale = Date.now() - lastRefreshAt.value > REFRESH_INTERVAL
  if (disputeList.value.length === 0 || isStale || isDirty) {
    await refresh()
  }
})
</script>

<style lang="scss" scoped>
.street-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20rpx;
  box-sizing: border-box;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.7), transparent 24%),
    linear-gradient(180deg, #deecff 0%, #f7faff 38%, #eef4ff 100%);
}

.toolbar-card,
.tabs-card,
.filter-card,
.stats-card,
.focus-card,
.list-card,
.modal-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 24rpx;
  border: 1rpx solid rgba(22, 119, 255, 0.08);
  box-shadow: 0 12rpx 28rpx rgba(22, 119, 255, 0.08);
}

.toolbar-card {
  padding: 20rpx;
  display: flex;
  gap: 14rpx;
  margin-bottom: 18rpx;
}

.search-shell,
.date-trigger,
.picker-shell {
  min-height: 82rpx;
  border-radius: 18rpx;
  background: #f7faff;
  border: 1rpx solid #e6edf5;
  display: flex;
  align-items: center;
}

.search-shell {
  flex: 1;
  padding: 0 22rpx;
}

.date-trigger {
  min-width: 220rpx;
  padding: 0 18rpx;
  justify-content: center;
  gap: 10rpx;
}

.toolbar-icon,
.picker-arrow,
.modal-close {
  width: 28rpx;
  height: 28rpx;
}

.search-input {
  flex: 1;
  margin-left: 12rpx;
  font-size: 27rpx;
  color: #20324b;
}

.date-text {
  font-size: 24rpx;
  color: #5e748f;
}

.tabs-card {
  padding: 14rpx 0;
  margin-bottom: 18rpx;
}

.tabs-scroll,
.list-container {
  flex: 1;
}

.tabs-wrap {
  display: inline-flex;
  gap: 14rpx;
  padding: 0 20rpx;
}

.tab-item {
  padding: 16rpx 26rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: #55708f;
  background: #f3f8ff;
}

.tab-item.active {
  color: #fff;
  background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
}

.filter-card {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 18rpx 20rpx;
  margin-bottom: 18rpx;
}

.filter-label,
.filter-clear {
  font-size: 24rpx;
  color: #4b6787;
}

.filter-clear {
  color: #1677ff;
}

.filter-chips {
  display: flex;
  gap: 10rpx;
  flex: 1;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #edf4ff;
  color: #2d4f73;
  font-size: 22rpx;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
  margin-bottom: 18rpx;
}

.stats-card {
  padding: 24rpx 18rpx;
}

.stats-card.warning {
  background: linear-gradient(180deg, rgba(255, 247, 230, 0.98), rgba(255, 255, 255, 0.96));
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
  font-size: 40rpx;
  font-weight: 700;
  color: #20324b;
}

.focus-card {
  padding: 24rpx;
  margin-bottom: 18rpx;
}

.focus-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #20324b;
}

.focus-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #6f85a0;
}

.list-container {
  min-height: 0;
}

.list-card {
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.card-top,
.title-wrap,
.info-row,
.modal-head,
.modal-actions,
.picker-shell {
  display: flex;
  align-items: center;
}

.card-top,
.info-row,
.modal-head,
.modal-actions {
  justify-content: space-between;
}

.title-wrap {
  min-width: 0;
  flex: 1;
  gap: 12rpx;
}

.card-title {
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

.card-body {
  margin-top: 18rpx;
  display: grid;
  gap: 12rpx;
}

.info-label {
  width: 72rpx;
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

.card-action {
  margin-top: 18rpx;
}

.btn-assign,
.btn-primary,
.btn-secondary,
.empty-btn {
  height: 78rpx;
  line-height: 78rpx;
  border-radius: 18rpx;
  font-size: 26rpx;
}

.btn-primary,
.btn-assign {
  background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
  color: #fff;
}

.btn-secondary {
  background: #f6f9fd;
  color: #305172;
}

.btn-primary::after,
.btn-secondary::after,
.btn-assign::after {
  border: none;
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
  font-size: 30rpx;
  font-weight: 700;
  color: #1f3150;
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

.picker-shell {
  justify-content: space-between;
  padding: 0 20rpx;
}

.remark-input {
  width: 100%;
  min-height: 180rpx;
  padding: 20rpx;
  border-radius: 18rpx;
  box-sizing: border-box;
  background: #f7faff;
  border: 1rpx solid #e6edf5;
  font-size: 24rpx;
  color: #223754;
}

.modal-actions {
  gap: 14rpx;
  margin-top: 24rpx;
}

.modal-actions button {
  flex: 1;
}
</style>
