'use strict'

const createConfig = require('uni-config-center')

function getWxConfig() {
  const plugin = createConfig({
    pluginId: 'dispute-management',
    defaultConfig: {
      mpWeixin: {
        appid: process.env.WX_APPID || '',
        secret: process.env.WX_SECRET || ''
      }
    }
  })

  const appid = plugin.config('mpWeixin.appid') || process.env.WX_APPID || ''
  const secret = plugin.config('mpWeixin.secret') || process.env.WX_SECRET || ''

  if (!appid || !secret) {
    throw new Error('Missing WeChat appid or secret')
  }

  return { appid, secret }
}

module.exports = {
  getWxConfig
}
