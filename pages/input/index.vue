<template>
  <view class="input-page" :style="{ paddingTop: `${safeAreaTop + 12}px` }">
    <scroll-view scroll-y class="form-scroll">
      <view class="progress-card">
        <view class="progress-copy">
          <text class="progress-title">录入进度</text>
          <text class="progress-desc">先完成基础信息，再补充位置和风险等级</text>
        </view>
        <view class="progress-ring">
          <text class="progress-value">{{ completionText }}</text>
        </view>
      </view>

      <view class="tips-card">
        <text class="tips-title">{{ isReadyToSubmit ? '已满足提交条件' : '还差这些必填项' }}</text>
        <view class="tips-chips">
          <view v-for="item in requiredFieldHints" :key="item.label" class="tips-chip" :class="{ done: item.done }">
            <text>{{ item.label }}</text>
          </view>
        </view>
      </view>

      <view class="section-card compact-card">
        <view class="section-head">
          <view>
            <text class="section-title">基础信息</text>
            <text class="section-subtitle">先填写纠纷来源、社区和标题</text>
          </view>
          <text class="required-tip">* 为必填</text>
        </view>

        <view class="form-item">
          <view class="label-row">
            <text class="label-text">纠纷来源</text>
            <text class="required">*</text>
          </view>
          <picker mode="selector" :range="sourceOptions" :value="sourceIndex" @change="onSourceChange">
            <view class="picker-box">
              <text :class="['picker-text', { placeholder: !formData.source }]">
                {{ formData.source || '请选择纠纷来源' }}
              </text>
              <image class="picker-arrow" src="/static/icons/icon-arrow.svg" mode="aspectFit" />
            </view>
          </picker>
        </view>

        <view class="form-item">
          <view class="label-row">
            <text class="label-text">所属社区</text>
            <text class="required">*</text>
          </view>
          <picker mode="selector" :range="communityOptions" :value="communityIndex" @change="onCommunityChange">
            <view class="picker-box">
              <text :class="['picker-text', { placeholder: !formData.community }]">
                {{ formData.community || '请选择所属社区' }}
              </text>
              <image class="picker-arrow" src="/static/icons/icon-arrow.svg" mode="aspectFit" />
            </view>
          </picker>
        </view>

        <view class="form-item">
          <view class="label-row">
            <text class="label-text">纠纷标题</text>
            <text class="required">*</text>
          </view>
          <input
            v-model="formData.title"
            class="form-input"
            maxlength="100"
            placeholder="请输入纠纷标题"
          />
        </view>

        <view class="form-item">
          <view class="label-row">
            <text class="label-text">纠纷描述</text>
            <text class="required">*</text>
          </view>
          <textarea
            v-model="formData.description"
            class="form-textarea"
            maxlength="500"
            placeholder="请详细描述纠纷情况"
          />
        </view>
      </view>

      <view class="section-card">
        <view class="section-head">
          <view>
            <text class="section-title">发生位置</text>
            <text class="section-subtitle">支持地图选点，便于后续跟进</text>
          </view>
        </view>

        <view class="form-item">
          <view class="label-row">
            <text class="label-text">发生地点</text>
            <text class="required">*</text>
          </view>

          <view class="location-box" @click="chooseLocation">
            <view v-if="formData.location.address" class="location-selected">
              <image class="location-icon" src="/static/icons/icon-location.svg" mode="aspectFit" />
              <view class="location-copy">
                <text class="location-title">已选择位置</text>
                <text class="location-address">{{ formData.location.address }}</text>
              </view>
              <text class="location-action">修改</text>
            </view>
            <view v-else class="location-empty">
              <image class="location-icon" src="/static/icons/icon-location.svg" mode="aspectFit" />
              <text class="location-empty-text">点击选择位置</text>
            </view>
          </view>

          <map
            v-if="markers.length > 0"
            class="map-view"
            :latitude="markers[0].latitude"
            :longitude="markers[0].longitude"
            :markers="markers"
            @tap="chooseLocation"
          />
        </view>
      </view>

      <view class="section-card">
        <view class="section-head">
          <view>
            <text class="section-title">补充信息</text>
            <text class="section-subtitle">这些内容会帮助街道和社区更快处理</text>
          </view>
        </view>

        <view class="form-item">
          <view class="label-row">
            <text class="label-text">涉及人员</text>
          </view>
          <input
            v-model="formData.parties"
            class="form-input"
            placeholder="请输入涉及人员，多个可用逗号分隔"
          />
        </view>

        <view class="form-item">
          <view class="label-row">
            <text class="label-text">风险等级</text>
          </view>
          <view class="urgency-group">
            <view
              v-for="item in urgencyOptions"
              :key="item"
              class="urgency-item"
              :class="{ active: formData.urgency === item }"
              @click="formData.urgency = item"
            >
              <text class="urgency-dot" :class="getUrgencyClass(item)"></text>
              <text class="urgency-text">{{ item }}</text>
            </view>
          </view>
        </view>

        <view class="form-item">
          <view class="label-row">
            <text class="label-text">发生次数</text>
          </view>
          <view class="count-box">
            <text class="count-btn" @click="decreaseCount">-</text>
            <input
              v-model.number="formData.occur_count"
              class="count-input"
              type="number"
              placeholder="1"
            />
            <text class="count-btn" @click="increaseCount">+</text>
          </view>
        </view>
      </view>

      <view class="submit-bar">
        <view class="submit-meta">
          <text class="submit-title">确认后将推送到街道待分派</text>
          <text class="submit-desc">{{ formSummaryText }}</text>
        </view>
        <button class="submit-btn" :loading="submitting" :disabled="submitting" @click="submitForm">
          {{ submitting ? '提交中...' : '提交录入' }}
        </button>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { getNavbarConfig } from '@/utils/navbar'
import { COMMUNITY_OPTIONS, SOURCE_OPTIONS, URGENCY_DOT_CLASS_MAP, URGENCY_OPTIONS } from '@/utils/constants'
import { clearPageCacheByPrefix } from '@/utils/page-cache'
import { switchTabWithFallback } from '@/utils/navigation'

const userStore = useUserStore()
const safeAreaTop = ref(0)
const sourceOptions = SOURCE_OPTIONS
const communityOptions = COMMUNITY_OPTIONS
const urgencyOptions = URGENCY_OPTIONS
const sourceIndex = ref(0)
const communityIndex = ref(0)
const submitting = ref(false)
const markers = ref([])

const formData = reactive({
  source: '',
  title: '',
  description: '',
  community: '',
  location: {
    address: '',
    latitude: null,
    longitude: null
  },
  parties: '',
  urgency: URGENCY_OPTIONS[0] || '',
  occur_count: 1
})

const completionCount = computed(() => {
  let count = 0
  if (formData.source) count += 1
  if (formData.community) count += 1
  if (formData.title.trim()) count += 1
  if (formData.description.trim()) count += 1
  if (formData.location.address) count += 1
  return count
})

const completionText = computed(() => `${completionCount.value}/5`)
const requiredFieldHints = computed(() => ([
  { label: '纠纷来源', done: !!formData.source },
  { label: '所属社区', done: !!formData.community },
  { label: '纠纷标题', done: !!formData.title.trim() },
  { label: '纠纷描述', done: !!formData.description.trim() },
  { label: '发生位置', done: !!formData.location.address }
]))
const isReadyToSubmit = computed(() => requiredFieldHints.value.every((item) => item.done))
const formSummaryText = computed(() => {
  const title = formData.title.trim() || '未填写标题'
  const location = formData.location.address || '未选择位置'
  return `${title} · ${location}`
})

const initNavbar = () => {
  const config = getNavbarConfig()
  safeAreaTop.value = config.safeAreaTop
}

const ensureInputAccess = () => {
  if (userStore.isLogin && userStore.openid) {
    return true
  }

  uni.showToast({ title: '请先登录后再录入', icon: 'none' })
  uni.redirectTo({ url: '/pages/login/index' })
  return false
}

const syncLocationMarker = () => {
  if (!formData.location.latitude || !formData.location.longitude) {
    markers.value = []
    return
  }

  markers.value = [
    {
      id: 1,
      latitude: formData.location.latitude,
      longitude: formData.location.longitude,
      title: formData.location.address || '发生位置',
      width: 30,
      height: 30
    }
  ]
}

const resetForm = () => {
  formData.source = ''
  formData.title = ''
  formData.description = ''
  formData.community = ''
  formData.location = {
    address: '',
    latitude: null,
    longitude: null
  }
  formData.parties = ''
  formData.urgency = URGENCY_OPTIONS[0] || ''
  formData.occur_count = 1
  sourceIndex.value = 0
  communityIndex.value = 0
  markers.value = []
}

const onSourceChange = (e) => {
  const index = Number(e.detail.value) || 0
  sourceIndex.value = index
  formData.source = sourceOptions[index] || ''
}

const onCommunityChange = (e) => {
  const index = Number(e.detail.value) || 0
  communityIndex.value = index
  formData.community = communityOptions[index] || ''
}

const increaseCount = () => {
  formData.occur_count = Number(formData.occur_count || 1) + 1
}

const decreaseCount = () => {
  const nextValue = Number(formData.occur_count || 1) - 1
  formData.occur_count = nextValue > 1 ? nextValue : 1
}

const getUrgencyClass = (urgency) => URGENCY_DOT_CLASS_MAP[urgency] || 'dot-normal'

const tryMatchCommunityByAddress = (address) => {
  if (!address) {
    return
  }

  const hitIndex = communityOptions.findIndex((community) => address.includes(community))
  if (hitIndex >= 0) {
    communityIndex.value = hitIndex
    formData.community = communityOptions[hitIndex]
    return
  }

  const fallbackIndex = communityOptions.findIndex((community) => community === '其他')
  if (fallbackIndex >= 0) {
    communityIndex.value = fallbackIndex
    formData.community = communityOptions[fallbackIndex]
  }
}

const chooseLocation = async () => {
  try {
    const res = await uni.chooseLocation()
    formData.location = {
      address: res.address || res.name || '',
      latitude: res.latitude,
      longitude: res.longitude
    }
    syncLocationMarker()
    tryMatchCommunityByAddress(formData.location.address)
  } catch (error) {
    if (error?.errMsg?.includes('cancel')) {
      return
    }
    console.error('选择位置失败', error)
    uni.showToast({ title: '选择位置失败', icon: 'none' })
  }
}

const validateForm = () => {
  if (!formData.source) {
    uni.showToast({ title: '请选择纠纷来源', icon: 'none' })
    return false
  }

  if (!formData.community) {
    uni.showToast({ title: '请选择所属社区', icon: 'none' })
    return false
  }

  if (!formData.title.trim()) {
    uni.showToast({ title: '请输入纠纷标题', icon: 'none' })
    return false
  }

  if (!formData.description.trim()) {
    uni.showToast({ title: '请输入纠纷描述', icon: 'none' })
    return false
  }

  if (!formData.location.address) {
    uni.showToast({ title: '请选择发生位置', icon: 'none' })
    return false
  }

  return true
}

const submitForm = async () => {
  if (!ensureInputAccess()) {
    return
  }

  if (!validateForm()) {
    return
  }

  submitting.value = true
  try {
    const { result } = await uniCloud.callFunction({
      name: 'pushToStreet',
      data: {
        disputeData: {
          ...formData,
          title: formData.title.trim(),
          description: formData.description.trim(),
          parties: formData.parties.trim()
        },
        userInfo: {
          openid: userStore.openid,
          name: userStore.name
        }
      }
    })

    if (!result?.success) {
      throw new Error(result?.error || '提交失败')
    }

    clearPageCacheByPrefix('home:')
    clearPageCacheByPrefix('street:')
    clearPageCacheByPrefix('task:')
    uni.showToast({ title: '提交成功', icon: 'success' })
    resetForm()
    switchTabWithFallback('/pages/index/index')
  } catch (error) {
    console.error('提交失败', error)
    uni.showToast({ title: error.message || '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  if (!ensureInputAccess()) {
    return
  }

  initNavbar()
})

onShow(() => {
  if (!ensureInputAccess()) {
    return
  }

  initNavbar()
})
</script>

<style lang="scss" scoped>
.input-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.7), transparent 24%),
    linear-gradient(180deg, #deecff 0%, #f7faff 36%, #eef4ff 100%);
  box-sizing: border-box;
  padding: 0 20rpx;
}

.form-scroll {
  height: calc(100vh - env(safe-area-inset-top));
  padding-bottom: 40rpx;
  box-sizing: border-box;
}

.progress-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 26rpx 28rpx;
  margin-bottom: 18rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, rgba(20, 91, 215, 0.96), rgba(79, 149, 255, 0.9));
  color: #fff;
  box-shadow: 0 16rpx 32rpx rgba(20, 91, 215, 0.18);
}

.tips-card {
  padding: 24rpx 26rpx;
  margin-bottom: 18rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.84);
  border: 1rpx solid rgba(22, 119, 255, 0.08);
}

.tips-title {
  display: block;
  font-size: 27rpx;
  font-weight: 700;
  color: #1f3150;
  margin-bottom: 14rpx;
}

.tips-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tips-chip {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #fff7e6;
  color: #a96a00;
  font-size: 22rpx;
}

.tips-chip.done {
  background: #f6ffed;
  color: #389e0d;
}

.progress-copy {
  flex: 1;
}

.progress-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
}

.progress-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.84);
}

.progress-ring {
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  border: 2rpx solid rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.progress-value {
  font-size: 28rpx;
  font-weight: 700;
}

.section-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 24rpx;
  border: 1rpx solid rgba(22, 119, 255, 0.08);
  box-shadow: 0 12rpx 28rpx rgba(22, 119, 255, 0.08);
  padding: 28rpx;
  margin-bottom: 18rpx;
}

.compact-card {
  margin-top: 2rpx;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #1f3150;
}

.section-subtitle {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #7b8ea6;
}

.required-tip {
  font-size: 22rpx;
  color: #7b8ea6;
}

.form-item {
  margin-bottom: 24rpx;
}

.form-item:last-child {
  margin-bottom: 0;
}

.label-row {
  display: flex;
  align-items: center;
  margin-bottom: 14rpx;
}

.label-text {
  font-size: 27rpx;
  color: #1f3150;
  font-weight: 600;
}

.required {
  margin-left: 8rpx;
  color: #ff4d4f;
}

.form-input,
.form-textarea,
.picker-box,
.location-box,
.count-input {
  width: 100%;
  box-sizing: border-box;
  border-radius: 18rpx;
  background: #f7faff;
  border: 1rpx solid #e6edf5;
}

.form-input,
.picker-box {
  min-height: 84rpx;
  padding: 0 20rpx;
  display: flex;
  align-items: center;
}

.form-input {
  font-size: 26rpx;
  color: #20324b;
}

.form-textarea {
  min-height: 200rpx;
  padding: 18rpx 20rpx;
  font-size: 26rpx;
  color: #20324b;
}

.picker-box {
  justify-content: space-between;
}

.picker-text {
  font-size: 26rpx;
  color: #20324b;
}

.picker-text.placeholder {
  color: #95a4b8;
}

.picker-arrow {
  width: 28rpx;
  height: 28rpx;
  opacity: 0.72;
  flex-shrink: 0;
}

.location-box {
  padding: 20rpx;
}

.location-selected,
.location-empty {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.location-icon {
  width: 34rpx;
  height: 34rpx;
  display: block;
}

.location-copy {
  flex: 1;
  min-width: 0;
}

.location-title {
  display: block;
  font-size: 22rpx;
  color: #7b8ea6;
  margin-bottom: 4rpx;
}

.location-address,
.location-empty-text {
  display: block;
  font-size: 26rpx;
  color: #20324b;
}

.location-address {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-action {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #e6f4ff;
  color: #1677ff;
  font-size: 22rpx;
  font-weight: 600;
}

.map-view {
  width: 100%;
  height: 340rpx;
  border-radius: 18rpx;
  margin-top: 16rpx;
}

.urgency-group {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
}

.urgency-item {
  min-height: 86rpx;
  border-radius: 18rpx;
  background: #f7faff;
  border: 1rpx solid #e6edf5;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
}

.urgency-item.active {
  background: #eef4ff;
  border-color: #b7d0ff;
}

.urgency-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
}

.dot-normal {
  background: #52c41a;
}

.dot-urgent {
  background: #faad14;
}

.dot-emergency {
  background: #ff4d4f;
}

.urgency-text {
  font-size: 24rpx;
  color: #20324b;
}

.count-box {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.count-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 18rpx;
  background: #eef4ff;
  color: #1677ff;
  font-size: 34rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.count-input {
  flex: 1;
  min-height: 72rpx;
  text-align: center;
  font-size: 28rpx;
  color: #20324b;
}

.submit-bar {
  position: sticky;
  bottom: 0;
  padding: 12rpx 0 24rpx;
  background: linear-gradient(180deg, rgba(238, 244, 255, 0), #eef4ff 36%);
}

.submit-meta {
  padding: 0 6rpx 14rpx;
}

.submit-title {
  display: block;
  font-size: 24rpx;
  color: #1f3150;
  font-weight: 600;
}

.submit-desc {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #7b8ea6;
}

.submit-btn {
  width: 100%;
  height: 92rpx;
  line-height: 92rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #145bd7 0%, #4f95ff 100%);
  color: #fff;
  font-size: 30rpx;
  font-weight: 700;
  box-shadow: 0 16rpx 32rpx rgba(20, 91, 215, 0.2);
}

.submit-btn::after {
  border: none;
}
</style>
