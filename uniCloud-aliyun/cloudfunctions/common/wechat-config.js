'use strict'

const path = require('path')
const createConfig = require('./uni-config-center')

function getWxConfig() {
  const plugin = createConfig({
    pluginId: 'dispute-management',
    root: path.resolve(__dirname),
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
    throw new Error('未配置微信小程序 appid/secret，请在云函数环境变量或 uni-config-center 中配置')
  }

  return {
    appid,
    secret
  }
}

module.exports = {
  getWxConfig
}
