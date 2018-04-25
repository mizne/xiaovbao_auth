import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as koaBody from 'koa-body'

import config from '../config/config'
import route from './routes'

const app = new Koa()
const router = new Router()

app.use(koaBody())

route(app)

app.listen(config.port, () => {
  console.log(`listening on port: ${config.port} !!!`)
})
