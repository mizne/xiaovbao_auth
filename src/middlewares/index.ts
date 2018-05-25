import * as Koa from 'koa'
import * as koaBody from 'koa-body'
import cors from './cors'

export default function(app: Koa) {
  app.use(cors())
  app.use(koaBody())
}
