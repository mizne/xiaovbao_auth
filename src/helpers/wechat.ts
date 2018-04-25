import * as R from 'ramda'
const WechatOAuth = require('wechat-oauth')
const WechatAPI = require('wechat-api')
import config from '../../config/config'

const wechatClient = new WechatOAuth(config.wechat.appId, config.wechat.secret)
const wechatApi = new WechatAPI(config.wechat.appId, config.wechat.secret)

interface GetAuthorizeURLOptions {
  state: string
  scope?: string
}

function getAuthorizeURL(opt: GetAuthorizeURLOptions): string
function getAuthorizeURL(state: string): string
function getAuthorizeURL(params: GetAuthorizeURLOptions | string): string {
  const scope =
    typeof params === 'string' ? 'snsapi_base' : params.scope || 'snsapi_base'
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

function getJsConfig(): Promise<Object> {
  return new Promise((resolve, reject) => {
    wechatApi.getJsConfig({}, (err: Error, result: any) => {
      if (err) {
        return reject(err)
      }
      return resolve(R.filter(R.complement(R.isNil), result))
    })
  })
}

export default {
  getAuthorizeURL,
  getOpenID,
  getJsConfig
}
