import * as Koa from 'koa'
import * as koaBody from 'koa-body'

export default function(app: Koa) {
  app.use(koaBody())
}
