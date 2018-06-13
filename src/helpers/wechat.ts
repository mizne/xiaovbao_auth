import * as R from 'ramda'
const WechatOAuth = require('wechat-oauth')
const WechatAPI = require('wechat-api')
import config from '../../config/config'

const wechatClient = new WechatOAuth(config.wechatPublicPlatform.appId, config.wechatPublicPlatform.secret)
const wechatApi = new WechatAPI(config.wechatPublicPlatform.appId, config.wechatPublicPlatform.secret)

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
    config.wechatPublicPlatform.oauthCallbackUrl,
    state,
    scope
  )
}

function getWebSiteAuthorizeURL(state: string): string {
  const appid = config.wechatOpenPlatform.appId
  const redirect_uri = config.wechatOpenPlatform.oauthCallbackUrl
  return `https://open.weixin.qq.com/connect/qrconnect?appid=${appid}&redirect_uri=${redirect_uri}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`
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

function getUser(openid: string): Promise<UserInfo> {
  return new Promise((resolve, reject) => {
    wechatClient.getUser(openid, (err: Error, result: any) => {
      if (err) {
        return reject(err)
      }
      resolve(result)
    })
  })
}


function getBuffer(mediaId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    wechatApi.getMedia(mediaId, (err: Error, result: any) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

function getWebsiteUserInfo(code: string): Promise<WebsiteUserInfo> {
  const websiteWechatClient = new WechatOAuth(config.wechatOpenPlatform.appId, config.wechatOpenPlatform.secret)
  return new Promise((resolve, reject) => {
    websiteWechatClient.getAccessToken(code, function (err: Error, result: any) {
      const data: WebsiteUserInfo = result.data

      if (err) {
        return reject(err)
      }
      return resolve(data)
    });
  })
}


export interface UserInfo {
  openid: string
  nickname: string
  sex: number
  language: string
  city: string
  province: string
  country: string
  headimgurl: string
  privilege: string[]
  unionid: string
}

export interface WebsiteUserInfo {
  access_token: string
  expires_in: number
  refresh_token: string
  openid: string
  scope: string
  unionid: string
  create_at: number
}

export default {
  getAuthorizeURL,
  getWebSiteAuthorizeURL,
  getOpenID,
  getJsConfig,
  getUser,
  getBuffer,
  getWebsiteUserInfo
}
