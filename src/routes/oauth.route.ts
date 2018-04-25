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

  const url = wechatHelper.getAuthorizeURL(ctx.query.redirect_uri)
  ctx.redirect(url)
})

router.get('/oauth/wechat-web-oauth', async (ctx, next) => {
  const openid = await wechatHelper.getOpenID(ctx.query.code)

  const token = jwt.sign(
    {
      openid: openid
    },
    config.jwtSecret,
    {
      expiresIn: '12h'
    }
  )

  ctx.redirect(
    ctx.query.state +
      `?access_token=${token}&openid=${openid}&expires_in=${12 * 60 * 60}`
  )
})

export default router
