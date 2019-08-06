import * as R from 'ramda'
const WechatOAuth = require('wechat-oauth')
const WechatAPI = require('wechat-api')
import config from '../../config/config'

const wechatClientBaiZhanKe = new WechatOAuth(config.wechatPublicPlatformBaiZhanKe.appId, config.wechatPublicPlatformBaiZhanKe.secret)
const wechatApiBaiZhanKe = new WechatAPI(config.wechatPublicPlatformBaiZhanKe.appId, config.wechatPublicPlatformBaiZhanKe.secret)

const wechatClientHuDong = new WechatOAuth(config.wechatPublicPlatformHuDong.appId, config.wechatPublicPlatformHuDong.secret)
const wechatApiHuDong = new WechatAPI(config.wechatPublicPlatformHuDong.appId, config.wechatPublicPlatformHuDong.secret)

export enum PublicPlatforms {
  BAIZHANKE = 'BAIZHANKE',
  HUDONG = 'HUDONG'
}

interface GetAuthorizeURLOptions {
  state: string
  scope?: 'snsapi_base' | 'snsapi_userinfo'
}

const DEFAULT_SCOPE = 'snsapi_userinfo'

function getAuthorizeURL(params: GetAuthorizeURLOptions | string, publicPlatform = PublicPlatforms.BAIZHANKE): string {
  const scope =
    typeof params === 'string' ? DEFAULT_SCOPE : params.scope || DEFAULT_SCOPE
  const state = typeof params === 'string' ? params : params.state
  const client = resolveWechatClient(publicPlatform)
  const config = resolveConfig(publicPlatform)
  return client.getAuthorizeURL(
    config.oauthCallbackUrl,
    state,
    scope
  )
}

function getWebSiteAuthorizeURL(state: string): string {
  const appid = config.wechatOpenPlatform.appId
  const redirect_uri = config.wechatOpenPlatform.oauthCallbackUrl
  return `https://open.weixin.qq.com/connect/qrconnect?appid=${appid}&redirect_uri=${redirect_uri}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`
}

function getOpenID(code: string, publicPlatform = PublicPlatforms.BAIZHANKE): Promise<string> {
  const client = resolveWechatClient(publicPlatform)
  return new Promise<string>((resolve, reject) => {
    client.getAccessToken(code, (err: Error, result: any) => {
      if (err) {
        return reject(err)
      }
      const accessToken = result.data.access_token
      const openid = result.data.openid
      resolve(openid)
    })
  })
}

function getJsConfig(url: string, publicPlatform = PublicPlatforms.BAIZHANKE): Promise<Object> {
  const wechatAPI = resolveWechatAPI(publicPlatform)
  return new Promise((resolve, reject) => {
    wechatAPI.getJsConfig({ url }, (err: Error, result: any) => {
      if (err) {
        return reject(err)
      }
      return resolve(R.filter(R.complement(R.isNil), result))
    })
  })
}


function getUser(openid: string, publicPlatform = PublicPlatforms.BAIZHANKE): Promise<UserInfo> {
  const client = resolveWechatClient(publicPlatform)
  return new Promise((resolve, reject) => {
    client.getUser(openid, (err: Error, result: any) => {
      if (err) {
        return reject(err)
      }
      resolve(result)
    })
  })
}


function getBuffer(mediaId: string, publicPlatform = PublicPlatforms.BAIZHANKE): Promise<any> {
  const wechatAPI = resolveWechatAPI(publicPlatform)
  return new Promise((resolve, reject) => {
    wechatAPI.getMedia(mediaId, (err: Error, result: any) => {
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

function resolveWechatClient(publicPlatform: PublicPlatforms) {
  switch (publicPlatform) {
    case PublicPlatforms.HUDONG:
      return wechatClientHuDong;
    case PublicPlatforms.BAIZHANKE:
      return wechatClientBaiZhanKe
    default:
      return wechatClientBaiZhanKe
  }
}

function resolveWechatAPI(publicPlatform: PublicPlatforms) {
  switch (publicPlatform) {
    case PublicPlatforms.HUDONG:
      return wechatApiHuDong;
    case PublicPlatforms.BAIZHANKE:
      return wechatApiBaiZhanKe
    default:
      return wechatApiBaiZhanKe
  }
}

function resolveConfig(publicPlatform: PublicPlatforms) {
  switch (publicPlatform) {
    case PublicPlatforms.HUDONG:
      return config.wechatPublicPlatformHuDong;
    case PublicPlatforms.BAIZHANKE:
      return config.wechatPublicPlatformBaiZhanKe
    default:
      return config.wechatPublicPlatformBaiZhanKe
  }
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
