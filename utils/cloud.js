export function callCloudFunction(name, data = {}, options = {}) {
  const timeout = Number(options.timeout || 10000)
  const storedUser = uni.getStorageSync('user') || {}
  const sessionToken = storedUser.sessionToken || ''
  const payload = sessionToken
    ? {
        ...data,
        sessionToken
      }
    : data

  if (!timeout || timeout <= 0) {
    return uniCloud.callFunction({ name, data: payload })
  }

  let timer = null
  const timeoutTask = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${name} 请求超时，请稍后重试`))
    }, timeout)
  })

  return Promise.race([
    uniCloud.callFunction({ name, data: payload }),
    timeoutTask
  ]).finally(() => {
    if (timer) {
      clearTimeout(timer)
    }
  })
}

export async function settleTasks(tasks) {
  const results = await Promise.allSettled(tasks)
  const rejected = results.find((item) => item.status === 'rejected')
  if (rejected) {
    throw rejected.reason
  }
  return results.map((item) => item.value)
}
