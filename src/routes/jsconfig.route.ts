import * as Router from 'koa-router'
import wechatHelper from '../helpers/wechat'

const router = new Router()

router.get('/oauth/wechat-jsconfig', async (ctx, next) => {
  const config = await wechatHelper.getJsConfig()

  ctx.body = config
})

export default router
