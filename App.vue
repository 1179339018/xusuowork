<script>
export default {
  onLaunch() {},
  onShow() {},
  onHide() {}
}
</script>

<style lang="scss">
page {
  background: #eef4ff;
  color: #1f3150;
  font-size: 28rpx;
  line-height: 1.6;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

:root {
  --color-primary: #1677ff;
  --color-primary-deep: #145bd7;
  --color-primary-soft: #edf4ff;
  --color-success: #52c41a;
  --color-warning: #fa8c16;
  --color-danger: #ff4d4f;
  --color-text-main: #1f3150;
  --color-text-sub: #6f839d;
  --color-text-light: #95a5bb;
  --color-border: rgba(22, 119, 255, 0.08);
  --card-radius: 24rpx;
  --card-shadow: 0 12rpx 30rpx rgba(22, 119, 255, 0.08);
}

view,
text,
button,
input,
textarea,
scroll-view,
navigator {
  box-sizing: border-box;
}

button {
  border: none;
}

.page-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.72), transparent 24%),
    linear-gradient(180deg, #deecff 0%, #f7faff 38%, #eef4ff 100%);
}

.surface-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: var(--card-radius);
  border: 1rpx solid var(--color-border);
  box-shadow: var(--card-shadow);
}

.muted-text {
  color: var(--color-text-sub);
}

.empty-state {
  padding: 90rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.empty-state__mark {
  width: 88rpx;
  height: 88rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, #d6e7ff 0%, #eef5ff 100%);
  margin-bottom: 18rpx;
}

.empty-state__text {
  font-size: 28rpx;
  color: var(--color-text-sub);
}
</style>
