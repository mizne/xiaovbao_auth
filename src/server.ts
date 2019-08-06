import * as Koa from 'koa'

import config from '../config/config'
import bindMilldewares from './middlewares'
import bindRoutes from './routes'

const cors = require('@koa/cors');


const app = new Koa();
app.use(cors());

const fs = require('fs')

app.use(async (ctx, next) => {
  try {
    console.log('app index middleware')
    await next()
  } catch(e) {
    console.log(`xiaovbao auth catch app error, `, e)

    fs.appendFile(
      'error.txt',
      `timestamps: ${new Date().toLocaleString()}; error msg: ${
        e.message
      };\n error stack: ${e.stack}\n`,
      'utf8'
    )

    ctx.body = {
      resCode: -1,
      resMsg: e.message,
      result: []
    }
  }
})

app.use(async (ctx, next) => {
  const startTime = new Date().getTime()

  await next()
  const endTime = new Date().getTime()
  const costTime = endTime - startTime
  console.log(`------------------------cost time millseconds: ${costTime} ms---------------------------`)
})

bindMilldewares(app)

bindRoutes(app)

app.listen(config.port, () => {
  console.log(`listening on port: ${config.port} !!!`)
})

