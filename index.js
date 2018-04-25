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
    token,
    'snsapi_base'
  )

  ctx.redirect(url)
})

router.get('/oauth/wechat-web-oauth', async (ctx, next) => {
  console.log(`wechat web oauth redirect correct`)
  console.log(ctx.query)

  const code = await getOpenID(ctx.query.code)
  const userInfo = await getUser(code)

  const decoded = jwt.verify(ctx.query.state, config.jwtSecret)
  console.log(userInfo)
  console.log(decoded)

  if (decoded.redirect_uri) {
    ctx.redirect(decoded.redirect_uri)
  } else {
    ctx.body = {
      msg: 'wechat_web_oauth'
    }
  }
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
