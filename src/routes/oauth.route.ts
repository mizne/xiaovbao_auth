import * as Router from 'koa-router'
import * as jwt from 'jsonwebtoken'
import axios from 'axios'

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
}

router.get('/oauth/authorize', (ctx, next) => {
  const query = ctx.query
  if (!ctx.query.redirect_uri) {
    return ctx.throw('redirect_uri required', 400)
  }

  // 开发环境 微信网页授权state有长度限制 故不用token
  const state = config.environment.production
    ? jwt.sign(
        {
          redirect_uri: ctx.query.redirect_uri,
          response_type: ctx.query.response_type
        },
        config.jwtSecret,
        {
          expiresIn: '30s'
        }
      )
    : ctx.query.redirect_uri

  const url = wechatHelper.getAuthorizeURL(state)

  ctx.redirect(url)
})

router.get('/oauth/wechat-web-oauth', async (ctx, next) => {
  const openid = await wechatHelper.getOpenID(ctx.query.code)
  const userInfo = (await wechatHelper.getUser(openid)) as UserInfo

  // 将用户信息写进数据库
  const registerInfo = (await fetchRegisterInfo(userInfo)) as any
  console.log(registerInfo)
  const token = jwt.sign(registerInfo, config.jwtSecret, {
    expiresIn: '12h'
  })

  // 开发环境 微信网页授权state有长度限制 故不用token
  const redirect_uri = config.environment.production
    ? (jwt.verify(ctx.query.state, config.jwtSecret) as any).redirect_uri
    : ctx.query.state

  const redirect_url =
    redirect_uri +
    `?access_token=${token}&expires_in=${12 * 60 * 60}&${
      registerInfo.openId
        ? `openid=${registerInfo.openId}`
        : `tenantid=${registerInfo.tenantId}&userid=${registerInfo.userId}`
    }`
  console.log(`redirect_url: ${redirect_url}`)
  ctx.redirect(redirect_url)
})

// 测试授权回调是否成功
router.get('/oauth/test', async (ctx, next) => {
  ctx.body = ctx.query
})

export default router

async function fetchRegisterInfo(userInfo: UserInfo) {
  return axios
    .post('https://deal.xiaovbao.cn', {
      params: {
        ServiceType: 'ExhibitorShow',
        Name: userInfo.nickname,
        OpenId: userInfo.openid,
        Logo: userInfo.headimgurl,
        Sex: String(userInfo.sex),
        Type: '2'
      }
    })
    .then(res => {
      if (res.data.result.IfRegister) {
        return {
          tenantId: res.data.result.TenantId,
          userId: res.data.result.UserId
        }
      } else {
        return {
          openId: userInfo.openid
        }
      }
    })
    .catch(err => {
      console.log(`fetchRegisterInfo failed, error: ${err.message}`)
      return Promise.reject(err)
    })
  // return Math.random() > 0.5
  //   ? {
  //       openId: userInfo.openid
  //     }
  //   : {
  //       tenantId: 'fakeTenantId',
  //       userId: 'fakeUserId'
  //     }
}
