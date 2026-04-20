const CACHE_PREFIX = 'page_cache:'
const DIRTY_PREFIX = 'page_cache_dirty:'

function buildKey(key) {
  return `${CACHE_PREFIX}${key}`
}

function buildDirtyKey(prefix) {
  return `${DIRTY_PREFIX}${prefix}`
}

export function getPageCache(key, maxAge = 0) {
  try {
    const payload = uni.getStorageSync(buildKey(key))
    if (!payload || typeof payload !== 'object') return null

    const { value, timestamp } = payload
    if (!timestamp) return null

    if (maxAge > 0 && Date.now() - timestamp > maxAge) {
      return null
    }

    return value
  } catch (error) {
    return null
  }
}

export function setPageCache(key, value) {
  try {
    uni.setStorageSync(buildKey(key), {
      value,
      timestamp: Date.now()
    })
  } catch (error) {
    // Ignore cache write failures and keep the UI responsive.
  }
}

export function removePageCache(key) {
  try {
    uni.removeStorageSync(buildKey(key))
  } catch (error) {
    // noop
  }
}

export function clearPageCacheByPrefix(prefix) {
  try {
    const { keys = [] } = uni.getStorageInfoSync()
    const fullPrefix = buildKey(prefix)

    keys.forEach((key) => {
      if (typeof key === 'string' && key.startsWith(fullPrefix)) {
        uni.removeStorageSync(key)
      }
    })

    uni.setStorageSync(buildDirtyKey(prefix), Date.now())
  } catch (error) {
    // noop
  }
}

export function getPageCacheDirtyAt(prefix) {
  try {
    return Number(uni.getStorageSync(buildDirtyKey(prefix)) || 0)
  } catch (error) {
    return 0
  }
}
