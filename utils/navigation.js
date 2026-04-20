import { USER_ROLES } from '@/utils/constants'

export const TASK_PAGE_PATH = '/pages/community/index'
export const STREET_PAGE_PATH = '/pages/street/index'

export function getHomeTabByRole(role) {
  switch (role) {
    case USER_ROLES.STREET:
      return STREET_PAGE_PATH
    case USER_ROLES.COMMUNITY:
      return TASK_PAGE_PATH
    case USER_ROLES.ADMIN:
    case USER_ROLES.POLICE:
    default:
      return '/pages/index/index'
  }
}

export function getTaskTabByRole() {
  return TASK_PAGE_PATH
}

export function getStreetTabByRole(role) {
  if (role === USER_ROLES.STREET || role === USER_ROLES.ADMIN) {
    return STREET_PAGE_PATH
  }

  return TASK_PAGE_PATH
}

export function switchTabWithFallback(url) {
  return new Promise((resolve, reject) => {
    uni.switchTab({
      url,
      success: resolve,
      fail: (error) => {
        console.warn(`switchTab 失败，尝试使用 reLaunch 兜底: ${url}`, error)
        uni.reLaunch({
          url,
          success: resolve,
          fail: reject
        })
      }
    })
  })
}

export function goHomeByRole(role) {
  return switchTabWithFallback(getHomeTabByRole(role))
}
