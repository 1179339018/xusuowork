'use strict'

const crypto = require('crypto')

const SESSION_TTL = 7 * 24 * 60 * 60 * 1000

function createSessionToken() {
  const token = crypto.randomBytes(32).toString('hex')
  return {
    token,
    expireAt: Date.now() + SESSION_TTL
  }
}

module.exports = {
  SESSION_TTL,
  createSessionToken
}
