import * as Router from 'koa-router'
import * as jwt from 'jsonwebtoken'
const querystring = require('querystring');

import config from '../../config/config'
import wechatHelper from '../helpers/wechat'

const router = new Router()


router.get('/oauth/authorize', (ctx, next) => {
  const query = ctx.query
  console.log(`oauth authorize, `, query)
  if (!ctx.query.redirect_uri) {
    return ctx.throw('redirect_uri required', 400)
  }

  if (ctx.query.provider === 'wechat-website') {
    const state = ctx.query.redirect_uri

    const url = wechatHelper.getWebSiteAuthorizeURL(state)
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
  const data = await wechatHelper.getWebsiteUserInfo(ctx.query.code)

  console.log(`data: `, data)
  const result = data.unionid ? {unionid: data.unionid, openid: data.openid} : {openid: data.openid}
  
  ctx.redirect(decodeURIComponent(redirectUrl) + `?${querystring.stringify(result)}`)
})

router.get('/oauth/wechat-web-oauth', async (ctx, next) => {
  console.log(`code: ${ctx.query.code}, time: `, new Date())
  const openid = await wechatHelper.getOpenID(ctx.query.code)
  const userInfo = (await wechatHelper.getUser(openid))
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

