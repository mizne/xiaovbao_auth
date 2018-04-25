import * as Router from 'koa-router'
import * as jwt from 'jsonwebtoken'

import config from '../../config/config'
import wechatHelper from '../helpers/wechat'

const router = new Router()

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
  const userInfo = await wechatHelper.getUser(openid)

  const token = jwt.sign(
    {
      openid: openid
    },
    config.jwtSecret,
    {
      expiresIn: '12h'
    }
  )

  // 开发环境 微信网页授权state有长度限制 故不用token
  const redirect_uri = config.environment.production
    ? (jwt.verify(ctx.query.state, config.jwtSecret) as any).redirect_uri
    : ctx.query.state

  ctx.redirect(
    redirect_uri +
      `?access_token=${token}&openid=${openid}&expires_in=${12 * 60 * 60}`
  )
})

// 测试授权回调是否成功
router.get('/oauth/test', async (ctx, next) => {
  ctx.body = ctx.query
})

export default router
