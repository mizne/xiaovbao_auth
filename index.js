const Koa = require('koa')
const Router = require('koa-router')
const koaBody = require('koa-body')
const jwt = require('jsonwebtoken')
const jwtMiddleware = require('koa-jwt')
const WechatOAuth = require('wechat-oauth')
const config = require('./config/config')

const app = new Koa()
const router = new Router()
const wechatClient = new WechatOAuth(config.wechat.appId, config.wechat.secret)

app.use(koaBody())

router.get('/oauth/authorize', (ctx, next) => {
  const query = ctx.query
  console.log(ctx.query)
  if (!ctx.query.redirect_uri) {
    return ctx.throw('redirect_uri required', 400)
  }

  const token = jwt.sign(
    {
      redirect_uri: ctx.query.redirect_uri
    },
    config.jwtSecret,
    {
      expiresIn: '30s'
    }
  )

  const url = wechatClient.getAuthorizeURL(
    config.wechat.oauthCallbackUrl,
    ctx.query.redirect_uri,
    'snsapi_base'
  )

  ctx.redirect(url)
})

router.get('/oauth/wechat-web-oauth', async (ctx, next) => {
  console.log(`wechat web oauth redirect correct`)
  console.log(ctx.query)

  const openid = await getOpenID(ctx.query.code)
  const userInfo = await getUser(openid)

  console.log(userInfo)

  const token = jwt.sign(
    {
      openid: openid
    },
    config.jwtSecret,
    {
      expiresIn: '12h'
    }
  )

  if (decoded.redirect_uri) {
    ctx.redirect(
      ctx.query.state + `?access_token=${token}&expires_in=${12 * 60 * 60}`
    )
  }
})

router.get('/oauth/test', async (ctx, next) => {
  console.log(ctx.query)
  ctx.body = ctx.query
})

app.use(router.routes()).use(router.allowedMethods())

app.listen(config.port, () => {
  console.log(`listening on port: ${config.port}`)
})

function getOpenID(code) {
  return new Promise((resolve, reject) => {
    wechatClient.getAccessToken(code, (err, result) => {
      if (err) {
        console.log(err)
        return reject(err)
      }
      const accessToken = result.data.access_token
      const openid = result.data.openid
      resolve(openid)
    })
  })
}

function getUser(openid) {
  return new Promise((resolve, reject) => {
    wechatClient.getUser(openid, (err, result) => {
      if (err) {
        console.log(err)
        return reject(err)
      }
      return resolve(result)
    })
  })
}
