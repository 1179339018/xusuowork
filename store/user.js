import { defineStore } from 'pinia'
import { USER_ROLES } from '@/utils/constants'

const STORAGE_KEY = 'user'

function buildStorageAdapter() {
  return {
    getItem: (key) => uni.getStorageSync(key),
    setItem: (key, value) => uni.setStorageSync(key, value),
    removeItem: (key) => uni.removeStorageSync(key)
  }
}

function createDefaultState() {
  return {
    _id: '',
    openid: '',
    role: '',
    name: '',
    phone: '',
    avatar: '',
    community: '',
    authorized_roles: [],
    isLogin: false,
    manuallyLoggedOut: false
  }
}

function normalizeUserInfo(userInfo = {}) {
  const roles = Array.isArray(userInfo.authorized_roles) && userInfo.authorized_roles.length > 0
    ? userInfo.authorized_roles
    : (userInfo.role ? [userInfo.role] : [])

  return {
    ...createDefaultState(),
    ...userInfo,
    role: userInfo.role || roles[0] || '',
    authorized_roles: roles,
    isLogin: Boolean(userInfo.openid && (userInfo.role || roles[0])),
    manuallyLoggedOut: Boolean(userInfo.manuallyLoggedOut)
  }
}

export const useUserStore = defineStore('user', {
  state: () => createDefaultState(),

  getters: {
    isPolice: (state) => state.role === USER_ROLES.POLICE,
    isStreet: (state) => state.role === USER_ROLES.STREET,
    isCommunity: (state) => state.role === USER_ROLES.COMMUNITY,
    isAdmin: (state) => state.role === USER_ROLES.ADMIN,
    hasSession: (state) => Boolean(state.openid && state.role),
    hasAuthorizedRoles: (state) => Array.isArray(state.authorized_roles) && state.authorized_roles.length > 0
  },

  actions: {
    syncStorage() {
      try {
        uni.setStorageSync(STORAGE_KEY, {
          _id: this._id,
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
      } catch (error) {
        console.error('保存用户信息失败', error)
      }
    },

    applyUser(userInfo = {}) {
      const normalized = normalizeUserInfo(userInfo)
      Object.assign(this, normalized)
      this.isLogin = this.hasSession
    },

    setUser(userInfo = {}) {
      this.applyUser({
        ...userInfo,
        manuallyLoggedOut: false
      })
      this.syncStorage()
    },

    restoreUser(userInfo = null) {
      const storedUser = userInfo || uni.getStorageSync(STORAGE_KEY)
      if (!storedUser || storedUser.manuallyLoggedOut) {
        return false
      }

      const normalized = normalizeUserInfo(storedUser)
      if (!normalized.openid || !normalized.role) {
        return false
      }

      this.applyUser(normalized)
      return true
    },

    clearUser(options = {}) {
      const manuallyLoggedOut = Boolean(options.manuallyLoggedOut)
      Object.assign(this, createDefaultState(), {
        manuallyLoggedOut
      })
      this.syncStorage()
    },

    logout() {
      this.clearUser({ manuallyLoggedOut: true })
    },

    switchRole(newRole) {
      if (!this.authorized_roles.includes(newRole)) {
        return
      }

      this.role = newRole
      this.isLogin = this.hasSession
      this.syncStorage()
    }
  },

  persist: {
    enabled: true,
    strategies: [
      {
        key: STORAGE_KEY,
        storage: buildStorageAdapter()
      }
    ]
  }
})
