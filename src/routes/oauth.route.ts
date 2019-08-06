import * as Router from 'koa-router'
import * as jwt from 'jsonwebtoken'
const querystring = require('querystring');

import config from '../../config/config'
import wechatHelper, { PublicPlatforms } from '../helpers/wechat'

const router = new Router()

// 百展客公众号 微信授权
router.get('/oauth/authorize', (ctx, next) => {
  const query = ctx.query
  console.log(`oauth authorize, `, query)
  if (!ctx.query.redirect_uri) {
    return ctx.throw('redirect_uri required', 400)
  }

  const state = querystring.stringify({
    redirect_uri: ctx.query.redirect_uri,
    exhibition_id: ctx.query.exhibition_id
  })

  const url = wechatHelper.getAuthorizeURL(state)
  ctx.redirect(url)
})
// 百展客公众号 微信授权回调
router.get('/oauth/wechat-web-oauth', async (ctx, next) => {
  console.log(`code: ${ctx.query.code}, time: `, new Date())
  console.log(`ctx-request-headers: `, ctx.request.header)
  const openid = await wechatHelper.getOpenID(ctx.query.code)
  const userInfo = (await wechatHelper.getUser(openid))
  const state = querystring.parse(ctx.query.state)

  console.log(`userinfo: `, userInfo)

  const redirect_uri = state.redirect_uri
  const redirect_url = redirect_uri + `?openid=${userInfo.openid}&nickname=${encodeURIComponent(userInfo.nickname)}&sex=${userInfo.sex}&language=${userInfo.language}&city=${encodeURIComponent(userInfo.city)}&province=${encodeURIComponent(userInfo.province)}&country=${encodeURIComponent(userInfo.country)}&headimgurl=${userInfo.headimgurl}&unionid=${userInfo.unionid}`;

  console.log(`redirect_url: ${redirect_url}`)
  ctx.redirect(redirect_url)
})

// 互动公众号 微信授权
router.get('/oauth/authorize-hudong', (ctx, next) => {
  const query = ctx.query
  console.log(`oauth authorize, `, query)
  if (!ctx.query.redirect_uri) {
    return ctx.throw('redirect_uri required', 400)
  }

  const state = querystring.stringify({
    redirect_uri: ctx.query.redirect_uri,
    exhibition_id: ctx.query.exhibition_id
  })

  const url = wechatHelper.getAuthorizeURL(state, PublicPlatforms.HUDONG)
  ctx.redirect(url)
})
// 互动公众号 微信授权回调
router.get('/oauth/wechat-web-oauth-hudong', async (ctx, next) => {
  console.log(`code: ${ctx.query.code}, time: `, new Date())
  console.log(`ctx-request-headers: `, ctx.request.header)
  const openid = await wechatHelper.getOpenID(ctx.query.code, PublicPlatforms.HUDONG)
  const userInfo = (await wechatHelper.getUser(openid, PublicPlatforms.HUDONG))
  const state = querystring.parse(ctx.query.state)

  console.log(`userinfo: `, userInfo)

  const redirect_uri = state.redirect_uri
  const redirect_url = redirect_uri + `?openid=${userInfo.openid}&nickname=${encodeURIComponent(userInfo.nickname)}&sex=${userInfo.sex}&language=${userInfo.language}&city=${encodeURIComponent(userInfo.city)}&province=${encodeURIComponent(userInfo.province)}&country=${encodeURIComponent(userInfo.country)}&headimgurl=${userInfo.headimgurl}&unionid=${userInfo.unionid}`;

  console.log(`redirect_url: ${redirect_url}`)
  ctx.redirect(redirect_url)
})



// 网站应用 微信授权
router.get('/oauth/wechat-website-oauth', async (ctx, next) => {
  const redirectUrl = ctx.query.state
  const data = await wechatHelper.getWebsiteUserInfo(ctx.query.code)

  console.log(`data: `, data)
  const result = data.unionid ? { unionid: data.unionid, openid: data.openid } : { openid: data.openid }

  ctx.redirect(decodeURIComponent(redirectUrl) + `?${querystring.stringify(result)}`)
})


export default router

