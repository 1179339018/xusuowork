const DEFAULT_NAVBAR_CONFIG = {
  statusBarHeight: 44,
  menuButtonHeight: 32,
  menuButtonTop: 48,
  navbarHeight: 88,
  safeAreaTop: 132
}

let cachedNavbarConfig = null

function resolveNavbarConfig() {
  const deviceInfo = typeof uni.getDeviceInfo === 'function' ? uni.getDeviceInfo() : {}
  const windowInfo = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : {}
  const appBaseInfo = typeof uni.getAppBaseInfo === 'function' ? uni.getAppBaseInfo() : {}
  const menuButtonInfo = typeof uni.getMenuButtonBoundingClientRect === 'function'
    ? uni.getMenuButtonBoundingClientRect()
    : {}

  const statusBarHeight =
    windowInfo.statusBarHeight ||
    appBaseInfo.statusBarHeight ||
    deviceInfo.statusBarHeight ||
    DEFAULT_NAVBAR_CONFIG.statusBarHeight

  const menuButtonHeight = menuButtonInfo.height || DEFAULT_NAVBAR_CONFIG.menuButtonHeight
  const menuButtonTop = menuButtonInfo.top || statusBarHeight + 8
  const verticalInset = Math.max(menuButtonTop - statusBarHeight, 4)
  const navbarHeight = menuButtonHeight + verticalInset * 2
  const safeAreaTop = statusBarHeight + navbarHeight

  return {
    statusBarHeight,
    menuButtonHeight,
    menuButtonTop,
    navbarHeight,
    safeAreaTop
  }
}

export function getNavbarConfig(forceRefresh = false) {
  if (!forceRefresh && cachedNavbarConfig) {
    return cachedNavbarConfig
  }

  try {
    cachedNavbarConfig = resolveNavbarConfig()
  } catch (error) {
    console.error('获取导航栏配置失败', error)
    cachedNavbarConfig = { ...DEFAULT_NAVBAR_CONFIG }
  }

  return cachedNavbarConfig
}

export function resetNavbarConfigCache() {
  cachedNavbarConfig = null
}

export function getNavbarStyle() {
  const config = getNavbarConfig()
  return `padding-top: ${config.safeAreaTop}px;`
}

export function getNavbarHeightStyle() {
  const config = getNavbarConfig()
  return `height: ${config.navbarHeight}px;`
}
