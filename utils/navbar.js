// 获取导航栏配置（胶囊按钮位置、状态栏高度等）
export function getNavbarConfig() {
  try {
    // 获取系统信息
    const systemInfo = uni.getSystemInfoSync();
    
    // 获取胶囊按钮位置信息
    const menuButtonInfo = uni.getMenuButtonBoundingClientRect();
    
    // 状态栏高度
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    
    // 胶囊按钮高度
    const menuButtonHeight = menuButtonInfo.height || 32;
    
    // 胶囊按钮距离顶部的距离
    const menuButtonTop = menuButtonInfo.top || 0;
    
    // 计算导航栏总高度
    // 导航栏高度 = 胶囊按钮高度 + (胶囊按钮顶部距离 - 状态栏高度) * 2
    const navbarHeight = menuButtonHeight + (menuButtonTop - statusBarHeight) * 2;
    
    // 计算内容区域距离顶部的安全距离
    // 安全距离 = 状态栏高度 + 导航栏高度
    const safeAreaTop = statusBarHeight + navbarHeight;
    
    return {
      statusBarHeight,
      menuButtonHeight,
      menuButtonTop,
      navbarHeight,
      safeAreaTop
    };
  } catch (error) {
    console.error('获取导航栏配置失败:', error);
    // 降级处理：使用默认值
    return {
      statusBarHeight: 44,
      menuButtonHeight: 32,
      menuButtonTop: 48,
      navbarHeight: 88,
      safeAreaTop: 132
    };
  }
}

// 获取CSS样式字符串，用于动态设置padding
export function getNavbarStyle() {
  const config = getNavbarConfig();
  return `padding-top: ${config.safeAreaTop}px;`;
}

// 获取导航栏高度样式
export function getNavbarHeightStyle() {
  const config = getNavbarConfig();
  return `height: ${config.navbarHeight}px;`;
}