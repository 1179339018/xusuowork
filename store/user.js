import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
	state: () => ({
		openid: '',
		role: '', // 当前角色：'派出所' | '街道' | '社区' | '管理员'
		name: '',
		phone: '',
		avatar: '',
		community: '', // 社区ID（仅社区角色有）
		authorized_roles: [], // 授权的角色列表
		isLogin: false,
		manuallyLoggedOut: false
	}),
	
	getters: {
		isPolice: (state) => state.role === '派出所',
		isStreet: (state) => state.role === '街道',
		isCommunity: (state) => state.role === '社区',
		isAdmin: (state) => state.role === '管理员'
	},
	
	actions: {
		setUser(userInfo) {
			console.log('设置用户信息:', userInfo)
			this.openid = userInfo.openid || ''
			this.role = userInfo.role || ''
			this.name = userInfo.name || ''
			this.phone = userInfo.phone || ''
			this.avatar = userInfo.avatar || ''
			this.community = userInfo.community || ''
			this.authorized_roles = userInfo.authorized_roles || []
			this.isLogin = true
			this.manuallyLoggedOut = false
			
			// 手动保存到本地存储，确保数据被正确保存
			try {
				uni.setStorageSync('user', {
					openid: this.openid,
					role: this.role,
					name: this.name,
					phone: this.phone,
					avatar: this.avatar,
					community: this.community,
					authorized_roles: this.authorized_roles,
					isLogin: this.isLogin,
					manuallyLoggedOut: this.manuallyLoggedOut
				})
				console.log('用户信息已保存到本地存储')
			} catch (error) {
				console.error('保存用户信息到本地存储失败:', error)
			}
		},
		
		clearUser() {
			this.openid = ''
			this.role = ''
			this.name = ''
			this.phone = ''
			this.avatar = ''
			this.community = ''
			this.authorized_roles = []
			this.isLogin = false
			this.manuallyLoggedOut = false
		},
		
		logout() {
			this.clearUser()
		},
		
		switchRole(newRole) {
			if (this.authorized_roles.includes(newRole)) {
				this.role = newRole
			}
		}
	},
	
	persist: {
		enabled: true,
		strategies: [
			{
				key: 'user',
				storage: {
					getItem: (key) => uni.getStorageSync(key),
					setItem: (key, value) => uni.setStorageSync(key, value),
					removeItem: (key) => uni.removeStorageSync(key)
				}
			}
		]
	}
})
