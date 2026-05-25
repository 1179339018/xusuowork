const CACHE_PREFIX = 'page_cache:'
const DIRTY_PREFIX = 'page_cache_dirty:'
const MAX_CACHE_ENTRIES = 80

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
    trimPageCache()
    uni.setStorageSync(buildKey(key), {
      value,
      timestamp: Date.now()
    })
  } catch (error) {
    // Ignore cache write failures and keep the UI responsive.
  }
}

function trimPageCache() {
  try {
    const { keys = [] } = uni.getStorageInfoSync()
    const cacheKeys = keys.filter((key) => typeof key === 'string' && key.startsWith(CACHE_PREFIX))

    if (cacheKeys.length < MAX_CACHE_ENTRIES) {
      return
    }

    const sortedKeys = cacheKeys
      .map((key) => {
        const payload = uni.getStorageSync(key)
        return {
          key,
          timestamp: Number(payload?.timestamp || 0)
        }
      })
      .sort((a, b) => a.timestamp - b.timestamp)

    sortedKeys.slice(0, cacheKeys.length - MAX_CACHE_ENTRIES + 1).forEach((item) => {
      uni.removeStorageSync(item.key)
    })
  } catch (error) {
    // Cache trimming must never block normal page rendering.
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
