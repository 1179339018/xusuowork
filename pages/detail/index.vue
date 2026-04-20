<template>
  <view class="detail-page" :style="{ paddingTop: `${safeAreaTop + 12}px` }">
    <view class="nav-bar" :style="{ height: `${safeAreaTop}px` }">
      <view class="nav-left" @click="goBack">
        <image class="back-icon" src="/static/icons/icon-arrow.svg" mode="aspectFit" />
      </view>
      <text class="nav-title">纠纷详情</text>
      <view class="nav-right"></view>
    </view>

    <scroll-view scroll-y class="content-scroll">
      <view class="info-card">
        <view class="overview-hero">
          <view class="overview-top">
            <text class="overview-title">{{ disputeInfo.title || '纠纷详情' }}</text>
            <text class="status-badge" :class="getStatusClass(disputeInfo.status)">
              {{ disputeInfo.status || '状态未知' }}
            </text>
          </view>

          <view class="overview-tags">
            <text class="tag tag-primary">{{ disputeInfo.source || '来源待补充' }}</text>
            <text class="tag" :class="getUrgencyClass(disputeInfo.urgency)">
              {{ disputeInfo.urgency || '一般' }}
            </text>
            <text v-if="disputeInfo.community" class="tag tag-neutral">{{ disputeInfo.community }}</text>
          </view>

          <text class="overview-summary">{{ disputeInfo.description || '暂无纠纷描述。' }}</text>

          <view class="overview-grid">
            <view class="summary-item">
              <text class="summary-label">发生次数</text>
              <text class="summary-value">{{ disputeInfo.occur_count || 1 }} 次</text>
            </view>
            <view class="summary-item">
              <text class="summary-label">涉及人员</text>
              <text class="summary-value">{{ disputeInfo.parties || '未填写' }}</text>
            </view>
            <view class="summary-item">
              <text class="summary-label">创建时间</text>
              <text class="summary-value">{{ formatDateTime(disputeInfo.create_time) || '未记录' }}</text>
            </view>
            <view class="summary-item">
              <text class="summary-label">发生位置</text>
              <text class="summary-value">{{ disputeInfo.location?.address || '未填写' }}</text>
            </view>
          </view>
        </view>

        <view class="card-header">
          <text class="card-title">基础信息</text>
        </view>

        <view class="info-body">
          <view class="info-row">
            <text class="info-label">纠纷来源</text>
            <text class="tag tag-primary">{{ disputeInfo.source || '未填写' }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">风险等级</text>
            <text class="tag" :class="getUrgencyClass(disputeInfo.urgency)">{{ disputeInfo.urgency || '一般' }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">涉及人员</text>
            <text class="info-value">{{ disputeInfo.parties || '未填写' }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">发生位置</text>
            <text class="info-value location">{{ disputeInfo.location?.address || '未填写' }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">发生次数</text>
            <text class="info-value">{{ disputeInfo.occur_count || 1 }} 次</text>
          </view>
          <view class="info-row">
            <text class="info-label">创建时间</text>
            <text class="info-value">{{ formatDateTime(disputeInfo.create_time) || '未记录' }}</text>
          </view>

          <view class="description-section">
            <text class="section-label">纠纷描述</text>
            <view class="description-box">
              <text class="description-text">{{ disputeInfo.description || '暂无内容' }}</text>
            </view>
          </view>

          <map
            v-if="disputeInfo.location?.latitude"
            class="map-view"
            :latitude="disputeInfo.location.latitude"
            :longitude="disputeInfo.location.longitude"
            :markers="markers"
          />
        </view>
      </view>

      <view class="summary-card">
        <view class="summary-chip">
          <text class="summary-chip__label">当前状态</text>
          <text class="summary-chip__value">{{ disputeInfo.status || '状态未知' }}</text>
        </view>
        <view class="summary-chip">
          <text class="summary-chip__label">回访次数</text>
          <text class="summary-chip__value">{{ feedbacks.length }}</text>
        </view>
        <view class="summary-chip">
          <text class="summary-chip__label">下次跟进</text>
          <text class="summary-chip__value">{{ nextFollowText }}</text>
        </view>
      </view>

      <view v-if="feedbacks.length > 0" class="timeline-card">
        <view class="card-header">
          <text class="card-title">回访记录</text>
          <text class="record-count">共 {{ feedbacks.length }} 条</text>
        </view>

        <view class="timeline">
          <view v-for="(feedback, index) in feedbacks" :key="feedback._id || index" class="timeline-item">
            <view class="timeline-left">
              <view class="timeline-dot" :class="getResultClass(feedback.result)"></view>
              <view v-if="index < feedbacks.length - 1" class="timeline-line"></view>
            </view>

            <view class="timeline-content">
              <view class="timeline-header">
                <text class="timeline-time">{{ formatDateTime(feedback.feedback_time) }}</text>
                <text class="result-tag" :class="getResultClass(feedback.result)">{{ feedback.result || '未填写' }}</text>
              </view>

              <view class="timeline-body">
                <view class="info-line">
                  <text class="line-label">回访方式</text>
                  <text class="line-value">{{ feedback.type || '未填写' }}</text>
                </view>
                <view v-if="feedback.method" class="info-line">
                  <text class="line-label">处理措施</text>
                  <text class="line-value">{{ feedback.method }}</text>
                </view>
                <view v-if="feedback.notes" class="info-line">
                  <text class="line-label">备注</text>
                  <text class="line-value">{{ feedback.notes }}</text>
                </view>

                <view v-if="feedback.media && feedback.media.length > 0" class="media-grid">
                  <view v-for="(media, idx) in feedback.media" :key="idx" class="media-card">
                    <image
                      v-if="media.type === 'image'"
                      :src="media.url"
                      class="media-image"
                      mode="aspectFill"
                      @click="previewImage(media.url, feedback.media)"
                    />
                    <view v-else class="media-audio">
                      <image class="audio-icon" src="/static/icons/icon-audio.svg" mode="aspectFit" />
                      <text class="audio-name">{{ media.name || '录音' }}</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-else class="timeline-card empty-card">
        <view class="empty-state">
          <view class="empty-state__mark"></view>
          <text class="empty-state__text">暂无回访记录，请等待后续跟进</text>
        </view>
      </view>

      <view v-if="userStore.isCommunity && canFeedback" class="feedback-card">
        <view class="card-header">
          <text class="card-title">提交回访</text>
          <text class="record-count">更新当前纠纷状态</text>
        </view>

        <view class="feedback-form">
          <view class="form-item">
            <view class="form-label">
              <text class="label-text">回访方式</text>
              <text class="required">*</text>
            </view>
            <view class="option-group">
              <view
                v-for="type in typeOptions"
                :key="type"
                class="option-item"
                :class="{ active: feedbackForm.type === type }"
                @click="feedbackForm.type = type"
              >
                <text>{{ type }}</text>
              </view>
            </view>
          </view>

          <view class="form-item">
            <view class="form-label">
              <text class="label-text">回访结果</text>
              <text class="required">*</text>
            </view>
            <view class="option-group">
              <view
                v-for="result in resultOptions"
                :key="result"
                class="option-item"
                :class="{
                  active: feedbackForm.result === result,
                  success: result === resolvedLabel,
                  warning: result === unresolvedLabel
                }"
                @click="feedbackForm.result = result"
              >
                <text>{{ result }}</text>
              </view>
            </view>
          </view>

          <view class="form-item">
            <view class="form-label">
              <text class="label-text">处理措施</text>
            </view>
            <textarea
              v-model="feedbackForm.method"
              class="textarea"
              placeholder="请描述采取的处理措施"
              maxlength="500"
            />
          </view>

          <view class="form-item">
            <view class="form-label">
              <text class="label-text">备注</text>
            </view>
            <textarea
              v-model="feedbackForm.notes"
              class="textarea"
              placeholder="请输入备注信息（可选）"
              maxlength="200"
            />
          </view>

          <view class="form-item">
            <view class="form-label">
              <text class="label-text">照片/录音</text>
            </view>
            <view class="media-upload">
              <view v-for="(media, index) in feedbackForm.media" :key="index" class="media-item">
                <image
                  v-if="media.type === 'image'"
                  :src="media.url"
                  class="media-preview"
                  mode="aspectFill"
                  @click="previewImage(media.url, feedbackForm.media)"
                />
                <view v-else class="media-preview audio-preview">
                  <image class="audio-icon" src="/static/icons/icon-audio.svg" mode="aspectFit" />
                  <text class="audio-name">{{ media.name || '录音' }}</text>
                </view>
                <view class="media-delete" @click="removeMedia(index)">
                  <image class="media-delete-icon" src="/static/icons/icon-close.svg" mode="aspectFit" />
                </view>
              </view>

              <view class="media-add" :class="{ disabled: uploadingMedia }" @click="chooseMedia">
                <image class="add-icon" src="/static/icons/icon-plus.svg" mode="aspectFit" />
                <text class="add-text">{{ uploadingMedia ? '上传中...' : '添加' }}</text>
              </view>
            </view>
          </view>

          <view class="form-item">
            <view class="form-label">
              <text class="label-text">下次回访日期</text>
            </view>
            <picker mode="date" :value="feedbackForm.nextDate" :start="minDate" @change="onDateChange">
              <view class="picker-box">
                <text :class="['picker-text', { placeholder: !feedbackForm.nextDate }]">
                  {{ feedbackForm.nextDate || '选择日期（可选）' }}
                </text>
                <image class="picker-arrow" src="/static/icons/icon-arrow.svg" mode="aspectFit" />
              </view>
            </picker>
          </view>

          <button class="btn-submit" :loading="submitting" :disabled="submitting" @click="submitFeedback">
            {{ submitting ? '提交中...' : '提交回访' }}
          </button>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { getNavbarConfig } from '@/utils/navbar'
import { DISPUTE_STATUS, STATUS_CLASS_MAP, URGENCY_TAG_CLASS_MAP } from '@/utils/constants'
import { clearPageCacheByPrefix, getPageCache, getPageCacheDirtyAt, setPageCache } from '@/utils/page-cache'

const userStore = useUserStore()
const safeAreaTop = ref(0)
const disputeId = ref('')
const disputeInfo = ref({})
const feedbacks = ref([])
const logs = ref([])
const loading = ref(false)
const lastRefreshAt = ref(0)
const isInitializing = ref(false)
const submitting = ref(false)
const uploadingMedia = ref(false)
const markers = ref([])

const typeOptions = ['见面', '电话']
const resolvedLabel = '已化解'
const unresolvedLabel = '未化解'
const resultOptions = [resolvedLabel, unresolvedLabel]

const feedbackForm = reactive({
  type: '',
  result: '',
  method: '',
  notes: '',
  media: [],
  nextDate: ''
})

const DETAIL_CACHE_AGE = 60 * 1000
const DETAIL_REFRESH_INTERVAL = 45 * 1000

const minDate = computed(() => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
})

const canFeedback = computed(() => (
  disputeInfo.value.status === DISPUTE_STATUS.PENDING_VISIT
  || disputeInfo.value.status === DISPUTE_STATUS.PROCESSING
))

const nextFollowText = computed(() => {
  const nextDate = feedbacks.value.find((item) => item?.next_date)?.next_date
  if (nextDate) {
    return nextDate
  }
  if (canFeedback.value) {
    return '待安排'
  }
  return '已完成'
})

const initNavbar = () => {
  const config = getNavbarConfig()
  safeAreaTop.value = config.safeAreaTop
}

const buildDetailCacheKey = () => `detail:${disputeId.value || 'unknown'}`

const updateMarkers = () => {
  if (disputeInfo.value.location?.latitude) {
    markers.value = [
      {
        id: 1,
        latitude: disputeInfo.value.location.latitude,
        longitude: disputeInfo.value.location.longitude,
        title: disputeInfo.value.location.address,
        width: 30,
        height: 30
      }
    ]
    return
  }

  markers.value = []
}

const hydrateCache = () => {
  const cachedDetail = getPageCache(buildDetailCacheKey(), DETAIL_CACHE_AGE)
  if (!cachedDetail) {
    return
  }

  disputeInfo.value = cachedDetail.dispute || {}
  feedbacks.value = cachedDetail.feedbacks || []
  logs.value = cachedDetail.logs || []
  lastRefreshAt.value = cachedDetail.timestamp || 0
  updateMarkers()
}

const persistDetailCache = () => {
  setPageCache(buildDetailCacheKey(), {
    dispute: disputeInfo.value,
    feedbacks: feedbacks.value,
    logs: logs.value,
    timestamp: Date.now()
  })
  lastRefreshAt.value = Date.now()
}

const resetFeedbackForm = () => {
  feedbackForm.type = ''
  feedbackForm.result = ''
  feedbackForm.method = ''
  feedbackForm.notes = ''
  feedbackForm.media = []
  feedbackForm.nextDate = ''
}

const loadDetail = async () => {
  loading.value = true
  try {
    const res = await uniCloud.callFunction({
      name: 'getDisputeDetail',
      data: { disputeId: disputeId.value }
    })

    if (!res.result?.success) {
      throw new Error(res.result?.error || '加载失败')
    }

    disputeInfo.value = res.result.data.dispute || {}
    feedbacks.value = res.result.data.feedbacks || []
    logs.value = res.result.data.logs || []
    updateMarkers()
    persistDetailCache()
  } catch (error) {
    console.error('加载详情失败', error)
    uni.showToast({ title: error.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const onDateChange = (e) => {
  feedbackForm.nextDate = e.detail.value
}

const chooseMedia = async () => {
  if (uploadingMedia.value) {
    return
  }

  try {
    uploadingMedia.value = true
    const res = await uni.chooseMedia({
      count: 9 - feedbackForm.media.length,
      mediaType: ['image'],
      sourceType: ['camera', 'album']
    })

    if (!res.tempFiles?.length) {
      return
    }

    uni.showLoading({ title: '上传中...' })
    const uploadedMedia = await Promise.all(res.tempFiles.map(async (tempFile) => {
      const uploadRes = await uniCloud.uploadFile({
        filePath: tempFile.tempFilePath,
        cloudPath: `feedback/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${tempFile.tempFilePath.split('.').pop()}`
      })

      return {
        type: tempFile.fileType === 'image' ? 'image' : 'audio',
        url: uploadRes.fileID,
        name: tempFile.name
      }
    }))

    feedbackForm.media.push(...uploadedMedia)
  } catch (error) {
    console.error('选择媒体失败', error)
    if (error?.errMsg && !error.errMsg.includes('cancel')) {
      uni.showToast({ title: '选择失败', icon: 'none' })
    }
  } finally {
    uploadingMedia.value = false
    uni.hideLoading()
  }
}

const removeMedia = (index) => {
  feedbackForm.media.splice(index, 1)
}

const previewImage = (current, mediaList) => {
  const imageUrls = mediaList.filter((item) => item.type === 'image').map((item) => item.url)
  uni.previewImage({ current, urls: imageUrls })
}

const submitFeedback = async () => {
  if (!feedbackForm.type) {
    uni.showToast({ title: '请选择回访方式', icon: 'none' })
    return
  }

  if (!feedbackForm.result) {
    uni.showToast({ title: '请选择回访结果', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    const res = await uniCloud.callFunction({
      name: 'submitFeedback',
      data: {
        disputeId: disputeId.value,
        feedbackData: {
          type: feedbackForm.type,
          result: feedbackForm.result,
          method: feedbackForm.method,
          notes: feedbackForm.notes,
          media: feedbackForm.media,
          next_date: feedbackForm.nextDate
        },
        userInfo: {
          openid: userStore.openid,
          name: userStore.name
        }
      }
    })

    if (!res.result?.success) {
      throw new Error(res.result?.error || '提交失败')
    }

    uni.showToast({ title: '提交成功', icon: 'success' })

    if (res.result.data?.feedback) {
      feedbacks.value = [res.result.data.feedback, ...feedbacks.value]
    }

    if (res.result.data?.dispute) {
      disputeInfo.value = {
        ...disputeInfo.value,
        ...res.result.data.dispute
      }
      updateMarkers()
    }

    clearPageCacheByPrefix('home:')
    clearPageCacheByPrefix('street:')
    clearPageCacheByPrefix('task:')
    persistDetailCache()
    resetFeedbackForm()
  } catch (error) {
    console.error('提交回访失败', error)
    uni.showToast({ title: error.message || '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

const formatDateTime = (timestamp) => {
  if (!timestamp) {
    return ''
  }

  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

const getStatusClass = (status) => STATUS_CLASS_MAP[status] || ''
const getUrgencyClass = (urgency) => URGENCY_TAG_CLASS_MAP[urgency] || 'tag-primary'
const getResultClass = (result) => (result === resolvedLabel ? 'tag-success' : 'tag-warning')

const goBack = () => {
  uni.navigateBack({ delta: 1 })
}

onMounted(() => {
  initNavbar()

  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  disputeId.value = currentPage?.options?.id || ''

  if (disputeId.value) {
    hydrateCache()
    isInitializing.value = true
    loadDetail().finally(() => {
      isInitializing.value = false
    })
  }
})

onShow(() => {
  initNavbar()
  if (!disputeId.value || isInitializing.value) {
    return
  }

  const isDirty = getPageCacheDirtyAt('detail:') > lastRefreshAt.value
  const isStale = Date.now() - lastRefreshAt.value > DETAIL_REFRESH_INTERVAL
  if (!disputeInfo.value._id || isStale || isDirty) {
    void loadDetail()
  }
})
</script>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.66), transparent 24%),
    linear-gradient(180deg, #deecff 0%, #f7faff 34%, #eef4ff 100%);
  display: flex;
  flex-direction: column;
  padding: 0 20rpx;
  box-sizing: border-box;
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

.content-scroll {
  flex: 1;
  padding: 24rpx 0 40rpx;
  padding-top: calc(24rpx + env(safe-area-inset-top));
}

.info-card,
.summary-card,
.timeline-card,
.feedback-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 12rpx 28rpx rgba(22, 119, 255, 0.08);
  border: 1rpx solid rgba(22, 119, 255, 0.08);
  overflow: hidden;
}

.summary-card {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
  padding: 22rpx;
}

.summary-chip {
  padding: 20rpx 18rpx;
  border-radius: 20rpx;
  background: #f7faff;
}

.summary-chip__label {
  display: block;
  font-size: 22rpx;
  color: #7d90a7;
  margin-bottom: 8rpx;
}

.summary-chip__value {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #1f3150;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 28rpx;
  border-bottom: 1rpx solid #edf3f8;
}

.card-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1f3150;
}

.record-count {
  font-size: 24rpx;
  color: #7b8ea6;
}

.empty-card {
  padding: 0;
}

.overview-hero {
  padding: 32rpx 28rpx 20rpx;
  background: linear-gradient(135deg, rgba(13, 71, 161, 0.96), rgba(22, 119, 255, 0.9));
  color: #fff;
}

.overview-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 18rpx;
}

.overview-title {
  flex: 1;
  font-size: 38rpx;
  font-weight: 700;
  line-height: 1.35;
}

.overview-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 18rpx;
}

.overview-summary {
  display: block;
  font-size: 25rpx;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.86);
  margin-bottom: 20rpx;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.summary-item {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 18rpx;
  padding: 18rpx 20rpx;
}

.summary-label {
  display: block;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.72);
  margin-bottom: 8rpx;
}

.summary-value {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  line-height: 1.5;
}

.status-badge {
  font-size: 24rpx;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
}

.status-badge.status-pending {
  background: rgba(250, 173, 20, 0.18);
  color: #fff4d1;
}

.status-badge.status-processing {
  background: rgba(255, 255, 255, 0.18);
  color: #eef6ff;
}

.status-badge.status-resolved {
  background: rgba(82, 196, 26, 0.2);
  color: #e4f9d8;
}

.status-badge.status-closed {
  background: rgba(148, 163, 184, 0.24);
  color: #e2e8f0;
}

.tag {
  font-size: 22rpx;
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  font-weight: 500;
}

.tag-primary {
  background: #e6f7ff;
  color: #1677ff;
}

.tag-warning {
  background: #fff7e6;
  color: #faad14;
}

.tag-danger {
  background: #fff1f0;
  color: #ff4d4f;
}

.tag-neutral {
  background: #f3f4f6;
  color: #475569;
}

.tag-success {
  background: #f6ffed;
  color: #52c41a;
}

.info-body {
  padding: 24rpx 28rpx;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  width: 140rpx;
  font-size: 26rpx;
  color: #7c8fa7;
  flex-shrink: 0;
}

.info-value {
  flex: 1;
  font-size: 28rpx;
  color: #223754;
}

.info-value.location {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;
}

.description-section {
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid #edf3f8;
}

.section-label {
  font-size: 26rpx;
  color: #7c8fa7;
  margin-bottom: 16rpx;
  display: block;
}

.description-box {
  background: #f7faff;
  border-radius: 18rpx;
  padding: 20rpx;
}

.description-text {
  font-size: 28rpx;
  color: #223754;
  line-height: 1.7;
}

.map-view {
  width: 100%;
  height: 360rpx;
  border-radius: 18rpx;
  margin-top: 24rpx;
}

.timeline {
  padding: 24rpx 28rpx;
}

.timeline-item {
  display: flex;
  margin-bottom: 32rpx;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 20rpx;
}

.timeline-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
}

.timeline-dot.tag-success {
  background: #52c41a;
}

.timeline-dot.tag-warning {
  background: #faad14;
}

.timeline-line {
  flex: 1;
  width: 2rpx;
  background: #e8e8e8;
  margin-top: 8rpx;
}

.timeline-content {
  flex: 1;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.timeline-time {
  font-size: 24rpx;
  color: #7b8ea6;
}

.result-tag {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 10rpx;
  font-weight: 500;
}

.timeline-body {
  background: #f7faff;
  border-radius: 18rpx;
  padding: 20rpx;
}

.info-line {
  display: flex;
  margin-bottom: 12rpx;
  font-size: 26rpx;
}

.info-line:last-child {
  margin-bottom: 0;
}

.line-label {
  color: #7c8fa7;
  width: 140rpx;
  flex-shrink: 0;
}

.line-value {
  color: #223754;
  flex: 1;
}

.media-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 16rpx;
}

.media-card {
  width: 140rpx;
  height: 140rpx;
}

.media-image,
.media-audio {
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
}

.media-audio {
  background: #eef4ff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
}

.audio-icon {
  width: 40rpx;
  height: 40rpx;
}

.audio-name {
  font-size: 20rpx;
  color: #5e748f;
}

.feedback-form {
  padding: 24rpx 28rpx;
}

.form-item {
  margin-bottom: 28rpx;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.label-text {
  font-size: 28rpx;
  color: #223754;
  font-weight: 600;
}

.required {
  color: #ff4d4f;
  margin-left: 8rpx;
}

.option-group {
  display: flex;
  gap: 16rpx;
}

.option-item {
  flex: 1;
  padding: 20rpx 0;
  text-align: center;
  background: #f6f9ff;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #5f748f;
}

.option-item.active {
  background: #e6f7ff;
  color: #1677ff;
  font-weight: 600;
}

.option-item.active.success {
  background: #f6ffed;
  color: #52c41a;
}

.option-item.active.warning {
  background: #fff7e6;
  color: #faad14;
}

.textarea {
  width: 100%;
  min-height: 160rpx;
  padding: 20rpx 24rpx;
  background: #f8fafc;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #223754;
  box-sizing: border-box;
}

.picker-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 84rpx;
  padding: 0 24rpx;
  background: #f8fafc;
  border-radius: 16rpx;
}

.picker-text {
  font-size: 28rpx;
  color: #223754;
}

.picker-text.placeholder {
  color: #93a5ba;
}

.picker-arrow {
  width: 28rpx;
  height: 28rpx;
  opacity: 0.72;
  flex-shrink: 0;
}

.media-upload {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.media-item {
  position: relative;
  width: 140rpx;
  height: 140rpx;
}

.media-preview {
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
}

.audio-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  gap: 10rpx;
}

.media-delete {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 36rpx;
  height: 36rpx;
  background: #ff4d4f;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-delete-icon {
  width: 18rpx;
  height: 18rpx;
}

.media-add {
  width: 140rpx;
  height: 140rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border-radius: 12rpx;
  border: 2rpx dashed #d9d9d9;
}

.media-add.disabled {
  opacity: 0.72;
}

.add-icon {
  width: 36rpx;
  height: 36rpx;
  margin-bottom: 10rpx;
}

.add-text {
  font-size: 22rpx;
  color: #7c8fa7;
}

.btn-submit {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
  color: #fff;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 600;
  margin-top: 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(22, 119, 255, 0.3);
}

.btn-submit::after {
  border: none;
}

.btn-submit[disabled] {
  opacity: 0.7;
}

@media (max-width: 520px) {
  .summary-card {
    grid-template-columns: 1fr;
  }
}
</style>
