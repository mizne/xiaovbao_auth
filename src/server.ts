import * as Koa from 'koa'

import config from '../config/config'
import bindMilldewares from './middlewares'
import bindRoutes from './routes'

const app = new Koa()

app.use(async (ctx, next) => {
  try {
    console.log('app index middleware')
    await next()
  } catch(e) {
    console.log(`xiaovbao auth catch app error, `, e)
    ctx.body = {
      resCode: -1,
      resMsg: e.message,
      result: []
    }
  }
})

bindMilldewares(app)

bindRoutes(app)

app.listen(config.port, () => {
  console.log(`listening on port: ${config.port} !!!`)
})

