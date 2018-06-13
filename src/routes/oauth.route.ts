import * as Router from 'koa-router'
import * as jwt from 'jsonwebtoken'
import axios from 'axios'
const querystring = require('querystring');
const WechatOAuth = require('wechat-oauth')

const appid = 'wx91bc09f79c7bbd76'
const appsecret = 'cc4ee13c932d3928f1673f38212890cc'

const websiteWechatClient = new WechatOAuth(appid, appsecret)


import config from '../../config/config'
import wechatHelper from '../helpers/wechat'

const router = new Router()

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

router.get('/oauth/authorize', (ctx, next) => {
  const query = ctx.query
  console.log(`oauth authorize, `, query)
  if (!ctx.query.redirect_uri) {
    return ctx.throw('redirect_uri required', 400)
  }

  if (ctx.query.provider === 'wechat-website') {

    const redirect_uri = 'http://auth.xiaovbao.cn/oauth/wechat-website-oauth'
    const state = ctx.query.redirect_uri

    const url = `https://open.weixin.qq.com/connect/qrconnect?appid=${appid}&redirect_uri=${redirect_uri}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`
    return ctx.redirect(url)
  }

  // 开发环境 微信网页授权state有长度限制 故不用token
  const state = config.environment.production
    ? jwt.sign(
      {
        redirect_uri: ctx.query.redirect_uri,
        response_type: ctx.query.response_type,
        exhibition_id: ctx.query.exhibition_id
      },
      config.jwtSecret,
      {
        expiresIn: '30s'
      }
    )
    : querystring.stringify({
      redirect_uri: ctx.query.redirect_uri,
      exhibition_id: ctx.query.exhibition_id
    })

  const url = wechatHelper.getAuthorizeURL(state)
  ctx.redirect(url)
})



router.get('/oauth/wechat-website-oauth', async (ctx, next) => {
  const redirectUrl = ctx.query.state
  const data = await getWebsiteUserInfo(ctx.query.code)

  console.log(`data: `, data)
  const result = data.unionid ? {unionid: data.unionid, openid: data.openid} : {openid: data.openid}
  
  ctx.redirect(decodeURIComponent(redirectUrl) + `?${querystring.stringify(result)}`)
})

router.get('/oauth/wechat-web-oauth', async (ctx, next) => {
  console.log(`code: ${ctx.query.code}, time: `, new Date())
  const openid = await wechatHelper.getOpenID(ctx.query.code)
  const userInfo = (await wechatHelper.getUser(openid)) as UserInfo
  const state = config.environment.production
    ? (jwt.verify(ctx.query.state, config.jwtSecret) as any)
    : querystring.parse(ctx.query.state)

  console.log(`userinfo: `, userInfo)

  const redirect_uri = state.redirect_uri
  const redirect_url = redirect_uri + `?openid=${userInfo.openid}&nickname=${encodeURIComponent(userInfo.nickname)}&sex=${userInfo.sex}&language=${userInfo.language}&city=${userInfo.city}&province=${userInfo.province}&country=${userInfo.country}&headimgurl=${userInfo.headimgurl}&unionid=${userInfo.unionid}`;
  
  console.log(`redirect_url: ${redirect_url}`)
  ctx.redirect(redirect_url)
})

// 测试授权回调是否成功
router.get('/oauth/test', async (ctx, next) => {
  ctx.body = ctx.query
})

export default router

async function loginFromExhibitorShow(userInfo: UserInfo, exhibition_id: string) {
  return axios
    .post('https://deal.xiaovbao.cn/v2/data/GetUserServiceInfo', {
      params: {
        ExhibitionId: exhibition_id,
        ServiceType: 'ExhibitorShow',
        Name: userInfo.nickname,
        OpenId: userInfo.openid,
        UnioinId: userInfo.unionid,
        Logo: userInfo.headimgurl,
        Sex: String(userInfo.sex)
      }
    })
    .then(res => {
      if (res.data.resCode !== 0) {
        console.log(`loginFromExhibitorShow api failed, code: ${res.data.resMsg}`)
        return Promise.reject(new Error(res.data.resMsg))
      }
      if (res.data.result.length === 0) {
        console.log(`loginFromExhibitorShow api failed, result: ${res.data}`)
        return Promise.reject(new Error(res.data.resMsg))
      }
      return Promise.resolve(res.data.result)
    })
    .catch(err => {
      console.log(`loginFromExhibitorShow failed, error: `, err)
      return Promise.reject(err)
    })
}

async function loginFromWechatWebsite(data: WebsiteUserInfo): Promise<{
  tenantId: string,
  userId: string
}> {
  return axios
    .post('https://deal.xiaovbao.cn/v2/data/Login', {
      params: {
        Unicode: data.unionid,
        LoginType: '微信号码登录'
      }
    })
    .then(res => {
      if (res.data.resCode === 0 && res.data.result.length > 0) {
        return Promise.resolve({
          tenantId: res.data.result[0].TenantId,
          userId: res.data.result[0].UserId,
        })
      }
      console.log(`loginFromWechatWebsite api failed, data: `, res.data)
      return Promise.reject(new Error(res.data.resMsg))
    })
    .catch(err => {
      console.log(`loginFromWechatWebsite failed, error: ${err.message}`)
      return Promise.reject(err)
    })
}

function getWebsiteUserInfo(code: string): Promise<WebsiteUserInfo> {
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

