<template>
	<view id="app">
		<!-- 全局样式 -->
	</view>
</template>

<script>
	import { useUserStore } from '@/store/user'
	export default {
			data() {
				return {
					tabBarUpdating: false
				}
			},
			methods: {
				initTabBar() {
					// 防止重复执行，避免无限循环
					if (this.tabBarUpdating) return
					
					this.tabBarUpdating = true
					
					const userStore = useUserStore()
					const role = userStore.role
				
				// 基础tabBar项
				let tabBarList = [
					{
						"pagePath": "pages/community/index",
						"iconPath": "static/tabbar/task.png",
						"selectedIconPath": "static/tabbar/task-active.png",
						"text": "我的任务"
					},
					{
						"pagePath": "pages/input/index",
						"iconPath": "static/tabbar/add.png",
						"selectedIconPath": "static/tabbar/add-active.png",
						"text": "录入"
					}
				]
				
				// 根据角色添加不同的tab项
				if (role === '管理员') {
					tabBarList.unshift({
						"pagePath": "pages/index/index",
						"iconPath": "static/tabbar/home.png",
						"selectedIconPath": "static/tabbar/home-active.png",
						"text": "首页"
					})
					tabBarList.push({
						"pagePath": "pages/street/index",
						"iconPath": "static/tabbar/street.png",
						"selectedIconPath": "static/tabbar/street-active.png",
						"text": "街道"
					})
				} else if (role === '街道') {
					tabBarList.unshift({
						"pagePath": "pages/index/index",
						"iconPath": "static/tabbar/home.png",
						"selectedIconPath": "static/tabbar/home-active.png",
						"text": "首页"
					})
					tabBarList.push({
						"pagePath": "pages/street/index",
						"iconPath": "static/tabbar/street.png",
						"selectedIconPath": "static/tabbar/street-active.png",
						"text": "街道"
					})
				} else if (role === '派出所' || role === '社区') {
					tabBarList.unshift({
						"pagePath": "pages/index/index",
						"iconPath": "static/tabbar/home.png",
						"selectedIconPath": "static/tabbar/home-active.png",
						"text": "首页"
					})
				}
				
				// 所有人都有"我的"页面
				tabBarList.push({
					"pagePath": "pages/mine/index",
					"iconPath": "static/tabbar/mine.png",
					"selectedIconPath": "static/tabbar/mine-active.png",
					"text": "我的"
				})
				
				// 更新tabBar
				if (uni.setTabBarItem) {
					try {
						// 先隐藏tabBar
						uni.hideTabBar({ success: () => {}, fail: () => {} })
						
						// 延迟一下，确保tabBar已隐藏
						setTimeout(() => {
							try {
								// 使用uni.setTabBarStyle设置样式
								uni.setTabBarStyle({
									color: '#7A7E83',
									selectedColor: '#1677ff',
									borderStyle: 'black',
									backgroundColor: '#ffffff',
									success: () => {},
									fail: () => {}
								})
								
								// 重新设置tabBar项
								tabBarList.forEach((item, index) => {
									uni.setTabBarItem({
										index: index,
										pagePath: item.pagePath,
										iconPath: item.iconPath,
										selectedIconPath: item.selectedIconPath,
										text: item.text,
										success: () => {},
										fail: () => {}
									})
								})
								
								// 显示tabBar
								uni.showTabBar({ success: () => {}, fail: () => {} })
							} catch (error) {
								console.log('TabBar操作失败:', error)
							}
						},
						100,
						() => {
							// 重置标志，允许下次更新
							this.tabBarUpdating = false
						}
					)
					} catch (error) {
						console.log('TabBar操作失败:', error)
						// 重置标志，允许下次更新
						this.tabBarUpdating = false
					}
				} else {
					// 如果没有setTabBarItem方法，直接重置标志
					this.tabBarUpdating = false
				}
			}
		},
		onLaunch: function() {
			// 启动时的初始化操作
			console.log('App launched')
			// 延迟一下，确保用户状态已加载
			setTimeout(() => {
				this.initTabBar()
			}, 100)
		},
		onShow: function() {
			// App显示时更新tabBar
			// 延迟一下，确保用户状态已加载
			setTimeout(() => {
				this.initTabBar()
			}, 100)
		},
		onHide: function() {
			// App隐藏
		}
	}
</script>

<style lang="scss">
	/* ========== 全局样式 - 现代化设计系统 ========== */
	page {
		background: #e6f2ff;
		font-size: 28rpx;
		color: #1e293b;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
		line-height: 1.6;
	}
	
	/* ========== 主题色系统 ========== */
	:root {
		--primary: #1677ff;
		--primary-light: #4096ff;
		--primary-dark: #0958d9;
		--success: #52c41a;
		--warning: #faad14;
		--danger: #ff4d4f;
		--info: #1677ff;
		--bg: #e6f2ff;
		--bg-card: #f0f7ff;
		--text-primary: #1e293b;
		--text-secondary: #64748b;
		--text-tertiary: #94a3b8;
		--border: #e2e8f0;
		--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);
		--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
		--shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.12);
		--radius-sm: 8rpx;
		--radius-md: 16rpx;
		--radius-lg: 24rpx;
		--radius-xl: 32rpx;
	}
	
	.primary-color {
		color: var(--primary);
	}
	
	.primary-bg {
		background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
		color: #fff;
	}
	
	/* ========== 通用样式 ========== */
	.container {
		min-height: 100vh;
		background-color: var(--bg);
	}
	
	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		color: var(--text-primary);
		margin-bottom: 20rpx;
	}
	
	.card {
		background: #fff;
		border-radius: var(--radius-lg);
		padding: 30rpx;
		margin-bottom: 20rpx;
		box-shadow: var(--shadow-sm);
	}
	
	.btn-primary {
		background-color: var(--primary);
		color: #fff;
		border-radius: 8rpx;
	}
	
	.btn-primary:after {
		border: none;
	}
	
	/* ========== 表单样式 ========== */
	.form-section {
		margin-bottom: 30rpx;
	}
	
	.form-label {
		font-size: 28rpx;
		color: var(--text-primary);
		margin-bottom: 12rpx;
		font-weight: 500;
	}
	
	.input {
		width: 100%;
		height: 80rpx;
		background: #f5f7fa;
		border-radius: 8rpx;
		padding: 0 24rpx;
		font-size: 28rpx;
		box-sizing: border-box;
	}
	
	.textarea {
		width: 100%;
		height: 200rpx;
		background: #f5f7fa;
		border-radius: 8rpx;
		padding: 24rpx;
		font-size: 28rpx;
		box-sizing: border-box;
		resize: none;
	}
	
	/* ========== 状态标签 ========== */
	.tag {
		padding: 4rpx 16rpx;
		border-radius: 12rpx;
		font-size: 20rpx;
	}
	
	.tag-primary {
		background: #e6f7ff;
		color: var(--primary);
	}
	
	.tag-success {
		background: #f6ffed;
		color: var(--success);
	}
	
	.tag-warning {
		background: #fff7e6;
		color: var(--warning);
	}
	
	.tag-danger {
		background: #fff1f0;
		color: var(--danger);
	}
	
	/* ========== 加载动画 ========== */
	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 200rpx;
		font-size: 28rpx;
		color: var(--text-tertiary);
	}
	
	/* ========== 空状态 ========== */
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400rpx;
		text-align: center;
	}
	
	.empty-icon {
		font-size: 80rpx;
		margin-bottom: 20rpx;
	}
	
	.empty-text {
		font-size: 28rpx;
		color: var(--text-tertiary);
	}
</style>
