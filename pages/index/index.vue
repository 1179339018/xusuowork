<template>
  <view class="home-page" :style="{ paddingTop: `${safeAreaTop + 12}px` }">
    <view v-if="userStore.isLogin && !isAdmin" class="hero-card">
      <view class="hero-copy">
        <text class="hero-kicker">纠纷协同工作台</text>
        <text class="hero-title">{{ heroTitle }}</text>
        <text class="hero-desc">{{ heroDesc }}</text>
      </view>
      <view class="hero-side">
        <text class="hero-role">{{ userStore.role || '未登录' }}</text>
        <text class="hero-meta">{{ recentDisputes.length }} 条最近动态</text>
      </view>
    </view>

    <view v-if="isPolice" class="page-section">
      <view class="action-card">
        <button class="btn-primary btn-large" @click="goToInput">新增纠纷</button>
      </view>

      <view class="quick-grid">
        <view class="quick-item" @click="goToInput">
          <image class="quick-icon" src="/static/icons/icon-add.svg" mode="aspectFit" />
          <text class="quick-title">快速录入</text>
          <text class="quick-desc">直接进入纠纷录入页</text>
        </view>
        <view class="quick-item" @click="goToDetailList">
          <image class="quick-icon" src="/static/icons/mine-task-manage.svg" mode="aspectFit" />
          <text class="quick-title">我的任务</text>
          <text class="quick-desc">查看录入后的处理进度</text>
        </view>
      </view>

      <view class="stats-grid single-column">
        <view class="stats-card">
          <text class="stats-label">今日上报</text>
          <text class="stats-value">{{ statistics.todayNew }}</text>
          <text class="stats-desc">今日已上报到街道的纠纷数量</text>
        </view>
        <view class="stats-card accent">
          <text class="stats-label">累计上报</text>
          <text class="stats-value">{{ statistics.totalCount }}</text>
          <text class="stats-desc">当前账号录入的全部纠纷</text>
        </view>
      </view>

      <view class="panel-card">
        <view class="panel-head">
          <text class="panel-title">最近上报</text>
          <text class="panel-meta">{{ recentDisputes.length }} 条</text>
        </view>

        <view v-if="recentDisputes.length > 0" class="list-stack">
          <view
            v-for="item in recentDisputes"
            :key="item._id"
            class="list-item"
            @click="goToDetail(item._id)"
          >
            <view class="item-top">
              <text class="item-title">{{ item.title || '未命名纠纷' }}</text>
              <text class="status-chip" :class="item.statusClass">{{ item.status || '状态未知' }}</text>
            </view>
            <view class="item-bottom">
              <text class="item-sub">{{ item.source || '未填写来源' }}</text>
              <text class="item-time">{{ formatDateTime(item.create_time) }}</text>
            </view>
          </view>
        </view>

        <view v-else class="empty-state">
          <view class="empty-mark"></view>
          <text class="empty-text">暂无上报记录</text>
          <text class="empty-desc">可以先新增一条纠纷，系统会自动进入后续分派和跟进流程。</text>
          <button class="btn-primary empty-btn" @click="goToInput">立即录入</button>
        </view>
      </view>
    </view>

    <view v-else-if="isStreet" class="page-section">
      <view class="stats-grid three-column">
        <view class="stats-card">
          <text class="stats-label">待分派</text>
          <text class="stats-value">{{ statistics.pendingAssign }}</text>
        </view>
        <view class="stats-card">
          <text class="stats-label">处理中</text>
          <text class="stats-value">{{ statistics.processing }}</text>
        </view>
        <view class="stats-card accent">
          <text class="stats-label">已化解</text>
          <text class="stats-value">{{ statistics.resolved }}</text>
        </view>
      </view>

      <view class="action-card compact">
        <button class="btn-primary" @click="goToStreetManage">进入街道管理</button>
      </view>

      <view class="panel-card">
        <view class="panel-head">
          <text class="panel-title">待分派纠纷</text>
          <text class="panel-meta">优先处理紧急项</text>
        </view>

        <view v-if="recentDisputes.length > 0" class="list-stack">
          <view
            v-for="item in recentDisputes"
            :key="item._id"
            class="list-item"
            @click="goToDetail(item._id)"
          >
            <view class="item-top">
              <text class="item-title">{{ item.title || '未命名纠纷' }}</text>
              <text class="urgency-chip" :class="getUrgencyClass(item.urgency)">{{ item.urgency || '一般' }}</text>
            </view>
            <view class="item-bottom">
              <text class="item-sub">{{ item.location?.address || '位置待补充' }}</text>
              <text class="item-time">{{ formatDateTime(item.create_time) }}</text>
            </view>
          </view>
        </view>

        <view v-else class="empty-state">
          <view class="empty-mark"></view>
          <text class="empty-text">暂无待分派纠纷</text>
          <text class="empty-desc">当前没有新的待分派事项，可以进入街道管理查看全部任务。</text>
          <button class="btn-secondary empty-btn" @click="goToStreetManage">查看全部任务</button>
        </view>
      </view>
    </view>

    <view v-else-if="isCommunity" class="page-section">
      <view class="stats-grid two-column">
        <view class="stats-card">
          <text class="stats-label">待回访</text>
          <text class="stats-value">{{ statistics.pendingVisit }}</text>
          <text class="stats-desc">优先处理未回访任务</text>
        </view>
        <view class="stats-card accent">
          <text class="stats-label">处理中</text>
          <text class="stats-value">{{ statistics.processing }}</text>
          <text class="stats-desc">持续跟进中的任务</text>
        </view>
      </view>

      <view class="panel-card">
        <view class="panel-head">
          <text class="panel-title">最近任务</text>
          <text class="panel-meta">{{ userStore.community || '社区任务' }}</text>
        </view>

        <view v-if="recentDisputes.length > 0" class="list-stack">
          <view
            v-for="item in recentDisputes"
            :key="item._id"
            class="list-item"
            @click="goToDetail(item._id)"
          >
            <view class="item-top">
              <text class="item-title">{{ item.title || '未命名纠纷' }}</text>
              <text class="status-chip" :class="item.statusClass">{{ item.status || '状态未知' }}</text>
            </view>
            <view class="item-bottom">
              <text class="item-sub">{{ item.source || '未填写来源' }}</text>
              <text class="item-time">{{ formatDateTime(item.assign_time || item.create_time) }}</text>
            </view>
          </view>
        </view>

        <view v-else class="empty-state">
          <view class="empty-mark"></view>
          <text class="empty-text">暂无社区任务</text>
          <text class="empty-desc">当前没有分派到本社区的事项，可以稍后下拉刷新查看最新任务。</text>
          <button class="btn-secondary empty-btn" @click="goToDetailList">进入任务页</button>
        </view>
      </view>
    </view>

    <view v-else-if="isAdmin" class="page-section">
      <view class="stats-grid three-column">
        <view class="stats-card">
          <text class="stats-label">纠纷总数</text>
          <text class="stats-value">{{ statistics.totalCount }}</text>
        </view>
        <view class="stats-card">
          <text class="stats-label">已化解</text>
          <text class="stats-value">{{ statistics.resolved }}</text>
        </view>
        <view class="stats-card accent">
          <text class="stats-label">用户数</text>
          <text class="stats-value">{{ statistics.userCount }}</text>
        </view>
      </view>

      <view class="action-grid">
        <view class="action-item" @click="goToUserManage">
          <image class="action-icon" src="/static/icons/mine-user-manage.svg" mode="aspectFit" />
          <text class="action-title">用户管理</text>
          <text class="action-desc">查看账号和角色配置</text>
        </view>
        <view class="action-item" @click="goToStreetManage">
          <image class="action-icon" src="/static/icons/mine-task-manage.svg" mode="aspectFit" />
          <text class="action-title">纠纷管理</text>
          <text class="action-desc">进入任务列表进行分派与跟进</text>
        </view>
        <view class="action-item" @click="exportData">
          <image class="action-icon" src="/static/icons/icon-edit.svg" mode="aspectFit" />
          <text class="action-title">数据导出</text>
          <text class="action-desc">按筛选条件导出 CSV</text>
        </view>
      </view>

      <view class="panel-card">
        <view class="panel-head">
          <text class="panel-title">导出筛选</text>
          <text class="panel-meta">支持状态、社区、紧急程度与日期</text>
        </view>

        <view class="filter-grid">
          <view class="form-row">
            <text class="form-label">状态</text>
            <picker mode="selector" :range="statusOptions" :value="statusIndex" @change="onStatusChange">
              <view class="picker-shell">
                <text>{{ statusOptions[statusIndex] }}</text>
                <image class="picker-arrow" src="/static/icons/icon-arrow.svg" mode="aspectFit" />
              </view>
            </picker>
          </view>

          <view class="form-row">
            <text class="form-label">社区</text>
            <picker mode="selector" :range="communityOptions" :value="communityIndex" @change="onCommunityChange">
              <view class="picker-shell">
                <text>{{ communityOptions[communityIndex] }}</text>
                <image class="picker-arrow" src="/static/icons/icon-arrow.svg" mode="aspectFit" />
              </view>
            </picker>
          </view>

          <view class="form-row">
            <text class="form-label">紧急程度</text>
            <picker mode="selector" :range="riskLevelOptions" :value="riskLevelIndex" @change="onRiskLevelChange">
              <view class="picker-shell">
                <text>{{ riskLevelOptions[riskLevelIndex] }}</text>
                <image class="picker-arrow" src="/static/icons/icon-arrow.svg" mode="aspectFit" />
              </view>
            </picker>
          </view>

          <view class="form-row">
            <text class="form-label">开始日期</text>
            <picker mode="date" @change="onStartDateChange">
              <view class="picker-shell">
                <text>{{ startDate || '请选择' }}</text>
                <image class="picker-arrow" src="/static/icons/icon-arrow.svg" mode="aspectFit" />
              </view>
            </picker>
          </view>

          <view class="form-row">
            <text class="form-label">结束日期</text>
            <picker mode="date" @change="onEndDateChange">
              <view class="picker-shell">
                <text>{{ endDate || '请选择' }}</text>
                <image class="picker-arrow" src="/static/icons/icon-arrow.svg" mode="aspectFit" />
              </view>
            </picker>
          </view>
        </view>

        <view class="filter-actions">
          <button class="btn-primary" @click="exportData">导出数据</button>
          <button class="btn-secondary" @click="resetForm">重置筛选</button>
        </view>
      </view>
    </view>

    <view v-else-if="userStore.isLogin" class="empty-wrap">
      <view class="empty-state">
        <view class="empty-mark"></view>
        <text class="empty-text">当前账号尚未分配角色</text>
        <text class="empty-desc">请联系管理员分配角色后，再进入对应工作台处理纠纷事项。</text>
      </view>
    </view>

    <view v-else class="empty-wrap">
      <view class="empty-state">
        <view class="empty-mark"></view>
        <text class="empty-text">请先登录后进入首页</text>
        <text class="empty-desc">登录后系统会根据你的角色自动展示对应首页视图。</text>
        <navigator url="/pages/login/index" class="login-link">去登录</navigator>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { getNavbarConfig } from '@/utils/navbar'
import {
  COMMUNITY_FILTER_OPTIONS,
  DISPUTE_STATUS,
  FILTER_ALL,
  RISK_LEVEL_OPTIONS,
  STATUS_CLASS_MAP,
  STATUS_FILTER_OPTIONS,
  URGENCY_TAG_CLASS_MAP,
  USER_ROLES
} from '@/utils/constants'
import { getPageCache, getPageCacheDirtyAt, setPageCache } from '@/utils/page-cache'
import { getStreetTabByRole, switchTabWithFallback } from '@/utils/navigation'

const userStore = useUserStore()
const safeAreaTop = ref(0)
const statistics = ref({
  todayNew: 0,
  pendingAssign: 0,
  pendingVisit: 0,
  processing: 0,
  resolved: 0,
  totalCount: 0,
  userCount: 0
})
const recentDisputes = ref([])
const startDate = ref('')
const endDate = ref('')
const statusOptions = STATUS_FILTER_OPTIONS
const communityOptions = COMMUNITY_FILTER_OPTIONS
const riskLevelOptions = RISK_LEVEL_OPTIONS
const statusIndex = ref(0)
const communityIndex = ref(0)
const riskLevelIndex = ref(0)
const lastRefreshAt = ref(0)
const isInitializing = ref(false)
const hasInitialized = ref(false)
const refreshingDashboard = ref(false)

const STATS_CACHE_AGE = 60 * 1000
const RECENT_CACHE_AGE = 90 * 1000
const REFRESH_INTERVAL = 60 * 1000

const isPolice = computed(() => userStore.role === USER_ROLES.POLICE)
const isStreet = computed(() => userStore.role === USER_ROLES.STREET)
const isCommunity = computed(() => userStore.role === USER_ROLES.COMMUNITY)
const isAdmin = computed(() => userStore.role === USER_ROLES.ADMIN)

const heroTitle = computed(() => {
  if (isPolice.value) return '上报入口与进度总览'
  if (isStreet.value) return '街道分派与跟进总览'
  if (isCommunity.value) return '社区回访与处理总览'
  if (isAdmin.value) return '管理员工作台'
  return '欢迎进入纠纷管理系统'
})

const heroDesc = computed(() => {
  if (isPolice.value) return '快速录入纠纷，并查看后续分派与处理动态。'
  if (isStreet.value) return '优先查看待分派和处理中事项，减少漏派与积压。'
  if (isCommunity.value) return '集中查看回访任务，及时更新处理结果和回访记录。'
  if (isAdmin.value) return '统一查看用户、任务和处理进度，保持管理视图清晰。'
  return '系统会根据角色展示对应工作台。'
})

const initNavbar = () => {
  const config = getNavbarConfig()
  safeAreaTop.value = config.safeAreaTop
}

const buildScopedKey = (scope) => {
  const role = userStore.role || 'guest'
  const community = userStore.community || 'all'
  const openid = userStore.openid || 'anonymous'
  return `home:${scope}:${role}:${community}:${openid}`
}

const getRecentQuery = () => {
  if (isStreet.value) {
    return { status: DISPUTE_STATUS.PENDING_ASSIGN }
  }

  if (isCommunity.value) {
    return { status: DISPUTE_STATUS.PENDING_VISIT }
  }

  return {}
}

const mapDispute = (item) => ({
  ...item,
  statusClass: STATUS_CLASS_MAP[item.status] || '',
  urgencyClass: URGENCY_TAG_CLASS_MAP[item.urgency] || 'tag-primary'
})

const hydrateCache = () => {
  const cachedStats = getPageCache(buildScopedKey('stats'), STATS_CACHE_AGE)
  const cachedRecent = getPageCache(buildScopedKey('recent'), RECENT_CACHE_AGE)

  if (cachedStats) {
    statistics.value = { ...statistics.value, ...cachedStats }
  }

  if (Array.isArray(cachedRecent)) {
    recentDisputes.value = cachedRecent
  }
}

const loadStatistics = async (force = false) => {
  if (!userStore.isLogin) {
    return
  }

  if (!force) {
    const cachedStats = getPageCache(buildScopedKey('stats'), STATS_CACHE_AGE)
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
  setPageCache(buildScopedKey('stats'), statistics.value)
}

const loadRecentDisputes = async (force = false) => {
  if (!userStore.isLogin) {
    return
  }

  if (!force) {
    const cachedRecent = getPageCache(buildScopedKey('recent'), RECENT_CACHE_AGE)
    if (Array.isArray(cachedRecent)) {
      recentDisputes.value = cachedRecent
    }
  }

  const { result } = await uniCloud.callFunction({
    name: 'getDisputeList',
    data: {
      role: userStore.role,
      openid: userStore.openid,
      community: userStore.community,
      page: 1,
      pageSize: 6,
      lite: true,
      needTotal: false,
      ...getRecentQuery()
    }
  })

  if (!result?.success) {
    throw new Error(result?.error || '列表加载失败')
  }

  recentDisputes.value = (result.data || []).map(mapDispute)
  setPageCache(buildScopedKey('recent'), recentDisputes.value)
}

const refreshDashboard = async (force = false) => {
  if (!userStore.isLogin) {
    return
  }

  if (refreshingDashboard.value) {
    return
  }

  refreshingDashboard.value = true
  try {
    await Promise.all([
      loadStatistics(force),
      loadRecentDisputes(force)
    ])
    lastRefreshAt.value = Date.now()
  } finally {
    refreshingDashboard.value = false
  }
}

const formatDateTime = (value) => {
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

const getUrgencyClass = (urgency) => URGENCY_TAG_CLASS_MAP[urgency] || 'tag-primary'

const goToInput = () => {
  switchTabWithFallback('/pages/input/index')
}

const goToStreetManage = () => {
  switchTabWithFallback(getStreetTabByRole(userStore.role))
}

const goToDetailList = () => {
  switchTabWithFallback('/pages/community/index')
}

const goToDetail = (id) => {
  uni.navigateTo({ url: `/pages/detail/index?id=${id}` })
}

const goToUserManage = () => {
  uni.navigateTo({ url: '/pages/admin/user-list' })
}

const onStatusChange = (e) => {
  statusIndex.value = Number(e.detail.value) || 0
}

const onCommunityChange = (e) => {
  communityIndex.value = Number(e.detail.value) || 0
}

const onRiskLevelChange = (e) => {
  riskLevelIndex.value = Number(e.detail.value) || 0
}

const onStartDateChange = (e) => {
  startDate.value = e.detail.value
  if (endDate.value && endDate.value < startDate.value) {
    endDate.value = ''
  }
}

const onEndDateChange = (e) => {
  endDate.value = e.detail.value
  if (startDate.value && endDate.value < startDate.value) {
    const temp = startDate.value
    startDate.value = endDate.value
    endDate.value = temp
  }
}

const resetForm = () => {
  startDate.value = ''
  endDate.value = ''
  statusIndex.value = 0
  communityIndex.value = 0
  riskLevelIndex.value = 0
}

const exportData = async () => {
  if (!isAdmin.value) {
    return
  }

  try {
    uni.showLoading({ title: '导出中...' })

    const allRows = []
    let currentPage = 1
    const exportPageSize = 100

    while (true) {
      const { result } = await uniCloud.callFunction({
        name: 'getDisputeList',
        data: {
          role: userStore.role,
          openid: userStore.openid,
          community: userStore.community,
          page: currentPage,
          pageSize: exportPageSize,
          needTotal: false,
          status: statusOptions[statusIndex.value] === FILTER_ALL ? '' : statusOptions[statusIndex.value],
          communityFilter: communityOptions[communityIndex.value] === FILTER_ALL ? '' : communityOptions[communityIndex.value],
          urgency: riskLevelOptions[riskLevelIndex.value] === FILTER_ALL ? '' : riskLevelOptions[riskLevelIndex.value],
          startDate: startDate.value,
          endDate: endDate.value
        }
      })

      if (!result?.success) {
        throw new Error(result?.error || '导出失败')
      }

      const rows = result.data || []
      allRows.push(...rows)
      if (!result.hasMore || rows.length < exportPageSize) {
        break
      }
      currentPage += 1
    }

    if (allRows.length === 0) {
      uni.showToast({ title: '暂无数据可导出', icon: 'none' })
      return
    }

    const headers = [
      '纠纷ID',
      '标题',
      '来源',
      '状态',
      '紧急程度',
      '所属社区',
      '分派社区',
      '发生次数',
      '涉及人员',
      '地址',
      '创建时间'
    ]

    const body = allRows.map((item) => [
      item._id || '',
      `"${item.title || ''}"`,
      item.source || '',
      item.status || '',
      item.urgency || '',
      item.community || '',
      item.assign_community || '',
      item.occur_count || 1,
      `"${item.parties || ''}"`,
      `"${item.location?.address || ''}"`,
      item.create_time ? new Date(item.create_time).toLocaleString('zh-CN', { hour12: false }) : ''
    ])

    const csv = [headers.join(','), ...body.map((row) => row.join(','))].join('\n')
    const fileName = `纠纷数据_${new Date().toISOString().slice(0, 10)}.csv`
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`

    wx.getFileSystemManager().writeFileSync(filePath, csv, 'utf8')
    uni.showToast({ title: '导出成功', icon: 'success' })
    wx.openDocument({ filePath })
  } catch (error) {
    console.error('导出失败', error)
    uni.showToast({ title: error.message || '导出失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

onMounted(async () => {
  initNavbar()
  hydrateCache()

  if (userStore.isLogin) {
    isInitializing.value = true
    try {
      await refreshDashboard(false)
    } catch (error) {
      console.error('首页数据加载失败', error)
    } finally {
      isInitializing.value = false
      hasInitialized.value = true
    }
  } else {
    hasInitialized.value = true
  }
})

onShow(async () => {
  initNavbar()
  if (!userStore.isLogin) {
    return
  }
  if (isInitializing.value || !hasInitialized.value) {
    return
  }

  const isDirty = getPageCacheDirtyAt('home:') > lastRefreshAt.value
  const isStale = Date.now() - lastRefreshAt.value > REFRESH_INTERVAL
  if (recentDisputes.value.length === 0 || isStale || isDirty) {
    try {
      await refreshDashboard(isStale || isDirty)
    } catch (error) {
      console.error('首页轻刷新失败', error)
    }
  }
})

onPullDownRefresh(async () => {
  try {
    await refreshDashboard(true)
  } catch (error) {
    console.error('首页下拉刷新失败', error)
  } finally {
    uni.stopPullDownRefresh()
  }
})
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  padding: 20rpx;
  box-sizing: border-box;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.7), transparent 24%),
    linear-gradient(180deg, #deecff 0%, #f7faff 38%, #eef4ff 100%);
}

.page-section {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.hero-card {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, rgba(20, 91, 215, 0.96) 0%, rgba(79, 149, 255, 0.92) 100%);
  box-shadow: 0 18rpx 38rpx rgba(20, 91, 215, 0.18);
  color: #fff;
}

.hero-copy {
  flex: 1;
}

.hero-kicker {
  display: block;
  font-size: 22rpx;
  letter-spacing: 2rpx;
  color: rgba(255, 255, 255, 0.74);
}

.hero-title {
  display: block;
  margin-top: 10rpx;
  font-size: 38rpx;
  line-height: 1.28;
  font-weight: 700;
}

.hero-desc {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.84);
}

.hero-side {
  flex-shrink: 0;
  min-width: 180rpx;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12rpx;
}

.hero-role,
.hero-meta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.16);
  font-size: 22rpx;
}

.action-card,
.panel-card,
.stats-card,
.action-item {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 24rpx;
  border: 1rpx solid rgba(22, 119, 255, 0.08);
  box-shadow: 0 12rpx 28rpx rgba(22, 119, 255, 0.08);
}

.action-card {
  padding: 22rpx;
}

.action-card.compact {
  padding: 18rpx;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.quick-item {
  padding: 24rpx 22rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.92);
  border: 1rpx solid rgba(22, 119, 255, 0.08);
  box-shadow: 0 12rpx 28rpx rgba(22, 119, 255, 0.08);
}

.quick-icon {
  width: 34rpx;
  height: 34rpx;
  margin-bottom: 16rpx;
}

.quick-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #1f3150;
}

.quick-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 1.6;
  color: #7b8ea6;
}

.btn-primary,
.btn-secondary {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 18rpx;
  font-size: 30rpx;
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

.btn-large {
  height: 104rpx;
  line-height: 104rpx;
  font-size: 34rpx;
}

.btn-secondary {
  color: #35506f;
  background: #eef4ff;
}

.stats-grid {
  display: grid;
  gap: 16rpx;
}

.single-column {
  grid-template-columns: 1fr;
}

.two-column {
  grid-template-columns: repeat(2, 1fr);
}

.three-column {
  grid-template-columns: repeat(3, 1fr);
}

.stats-card {
  padding: 28rpx 24rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.stats-card.accent {
  background: linear-gradient(135deg, rgba(20, 91, 215, 0.96) 0%, rgba(79, 149, 255, 0.96) 100%);
}

.stats-card.accent .stats-label,
.stats-card.accent .stats-value,
.stats-card.accent .stats-desc {
  color: #fff;
}

.stats-label {
  font-size: 24rpx;
  color: #6c7f96;
}

.stats-value {
  font-size: 50rpx;
  line-height: 1.1;
  font-weight: 700;
  color: #163052;
}

.stats-desc {
  font-size: 22rpx;
  color: #8190a4;
}

.panel-card {
  padding: 28rpx;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.panel-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1f3150;
}

.panel-meta {
  font-size: 22rpx;
  color: #7a8ea7;
}

.list-stack {
  display: flex;
  flex-direction: column;
}

.list-item {
  padding: 22rpx 0;
  border-bottom: 1rpx solid #eef3f8;
}

.list-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.item-top,
.item-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18rpx;
}

.item-bottom {
  margin-top: 12rpx;
}

.item-title {
  flex: 1;
  font-size: 28rpx;
  color: #1f3150;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-sub,
.item-time {
  font-size: 23rpx;
  color: #7b8ea6;
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

.action-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.action-item {
  padding: 26rpx 22rpx;
}

.action-icon {
  width: 34rpx;
  height: 34rpx;
  margin-bottom: 16rpx;
}

.action-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #1f3150;
  margin-bottom: 8rpx;
}

.action-desc {
  display: block;
  font-size: 22rpx;
  line-height: 1.6;
  color: #7b8ea6;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18rpx 16rpx;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.form-label {
  font-size: 24rpx;
  color: #62758c;
}

.picker-shell {
  min-height: 84rpx;
  padding: 0 22rpx;
  border-radius: 18rpx;
  background: #f7faff;
  border: 1rpx solid #e6edf5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 26rpx;
  color: #22334c;
}

.picker-arrow {
  width: 28rpx;
  height: 28rpx;
  opacity: 0.72;
  flex-shrink: 0;
}

.filter-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
  margin-top: 24rpx;
}

.empty-wrap {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 56rpx 40rpx;
  text-align: center;
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
}

.empty-btn {
  min-width: 220rpx;
  margin-top: 22rpx;
}

@media (max-width: 520px) {
  .hero-card {
    flex-direction: column;
  }

  .hero-side {
    align-items: flex-start;
    min-width: 0;
  }

  .quick-grid,
  .action-grid,
  .filter-grid {
    grid-template-columns: 1fr;
  }

  .filter-actions {
    grid-template-columns: 1fr;
  }
}

.login-link {
  margin-top: 24rpx;
  padding: 16rpx 34rpx;
  border-radius: 999rpx;
  background: #145bd7;
  color: #fff;
  font-size: 26rpx;
}
</style>
