const SHARE_IMAGE_URL = '/static/share-cover.png'

export function getDefaultShareConfig() {
  return {
    title: '矛盾纠纷管理系统',
    path: '/pages/share/index',
    imageUrl: SHARE_IMAGE_URL
  }
}

export function getDefaultShareTimelineConfig() {
  return {
    title: '矛盾纠纷管理系统',
    query: 'from=timeline',
    imageUrl: SHARE_IMAGE_URL
  }
}
