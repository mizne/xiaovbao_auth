import * as Koa from 'koa'

import config from '../config/config'
import bindMilldewares from './middlewares'
import bindRoutes from './routes'

const app = new Koa()

bindMilldewares(app)

bindRoutes(app)

app.listen(config.port, () => {
  console.log(`listening on port: ${config.port} !!!`)
})
