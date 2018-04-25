const Koa = require('koa')
const Router = require('koa-router')
const koaBody = require('koa-body')
const jwt = require('jsonwebtoken')
const jwtMiddleware = require('koa-jwt')

const app = new Koa()
const router = new Router()

const jwtSecret = 'xiaovbao_jwt_secret'

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
  // const token = jwt.sign(ctx.request.body, jwtSecret, {
  //   expiresIn: '10s'
  // })
  ctx.body = query
})

router.get('/wechat_web_oauth', async (ctx, next) => {
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

app.listen(8000, () => {
  console.log(`listening on port: 2000`)
})
