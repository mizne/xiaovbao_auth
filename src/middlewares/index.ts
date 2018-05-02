import * as Koa from 'koa'
import * as koaBody from 'koa-body'
import * as cors from '@koa/cors'

export default function(app: Koa) {
  app.use(koaBody())
  app.use(cors())
}
