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

const jwtSecret = 'xiaovbao_jwt_secret'
const port = 8000

app.use(function(ctx, next) {
  return next().catch(err => {
    if (err.status === 401) {
      ctx.status = 401
      ctx.body = {
        error: err.originalError ? err.originalError.message : err.message
      }
    } else {
      throw err
    }
  })
})

app.use(koaBody())

// app.use(jwtMiddleware({
//   secret: jwtSecret
// }).unless({
//   path: [/\/login/, /\/register/, /^\/public/]
// }));

router.get('/oauth/authorize', (ctx, next) => {
  const query = ctx.query
  console.log(ctx.query)
  const url = wechatClient.getAuthorizeURL(
    config.wechat.oauthCallbackUrl,
    ctx.query.state,
    'snsapi_base'
  )
  // const token = jwt.sign(ctx.request.body, jwtSecret, {
  //   expiresIn: '10s'
  // })
  ctx.redirect(url)
  // ctx.body = query
})

router.get('/wechat_web_oauth', async (ctx, next) => {
  console.log(`wechat web oauth redirect correct`)
  console.log(ctx.query)
  ctx.body = {
    msg: 'wechat_web_oauth'
  }
})

router.get('/public/home', (ctx, next) => {
  ctx.body = {
    msg: 'hello from home!!!'
  }
})

router.get('/about', (ctx, next) => {
  console.log(ctx.state.user)
  ctx.body = {
    msg: 'hello from about!!!'
  }
})

app.use(router.routes()).use(router.allowedMethods())

app.listen(port, () => {
  console.log(`listening on port: ${port}`)
})
