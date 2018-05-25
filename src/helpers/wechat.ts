import * as R from 'ramda'
const WechatOAuth = require('wechat-oauth')
const WechatAPI = require('wechat-api')
import config from '../../config/config'

const wechatClient = new WechatOAuth(config.wechat.appId, config.wechat.secret)
const wechatApi = new WechatAPI(config.wechat.appId, config.wechat.secret)

interface GetAuthorizeURLOptions {
  state: string
  scope?: 'snsapi_base' | 'snsapi_userinfo'
}

const DEFAULT_SCOPE = 'snsapi_userinfo'

function getAuthorizeURL(opt: GetAuthorizeURLOptions): string
function getAuthorizeURL(state: string): string
function getAuthorizeURL(params: GetAuthorizeURLOptions | string): string {
  const scope =
    typeof params === 'string' ? DEFAULT_SCOPE : params.scope || DEFAULT_SCOPE
  const state = typeof params === 'string' ? params : params.state
  return wechatClient.getAuthorizeURL(
    config.wechat.oauthCallbackUrl,
    state,
    scope
  )
}

function getOpenID(code: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    wechatClient.getAccessToken(code, (err: Error, result: any) => {
      if (err) {
        return reject(err)
      }
      const accessToken = result.data.access_token
      const openid = result.data.openid
      resolve(openid)
    })
  })
}

function getJsConfig(url: string): Promise<Object> {
  return new Promise((resolve, reject) => {
    wechatApi.getJsConfig({url}, (err: Error, result: any) => {
      if (err) {
        return reject(err)
      }
      return resolve(R.filter(R.complement(R.isNil), result))
    })
  })
}

function getUser(openid: string): Promise<Object> {
  return new Promise<string>((resolve, reject) => {
    wechatClient.getUser(openid, (err: Error, result: any) => {
      if (err) {
        return reject(err)
      }
      resolve(result)
    })
  })
}

export default {
  getAuthorizeURL,
  getOpenID,
  getJsConfig,
  getUser
}
