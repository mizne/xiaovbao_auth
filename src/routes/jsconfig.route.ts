import * as Router from 'koa-router'
import wechatHelper from '../helpers/wechat'
import { uploadCos } from '../helpers/cos'
import * as fs from 'fs'
import axios from 'axios'

const router = new Router()

router.get('/oauth/wechat-jsconfig', async (ctx, next) => {
  const url = ctx.query.url

  console.log(`url: ${decodeURIComponent(url)}`)

  const config = await wechatHelper.getJsConfig(url)

  ctx.body = config
})

router.get('/oauth/upload-media', async (ctx, next) => {
  const mediaId = ctx.query.mediaId
  console.log(`mediaId: ${mediaId}`)

  const buffer = await wechatHelper.getBuffer(mediaId)

  const result = await uploadCos(buffer)
  ctx.body = result
})

router.get('/oauth/image', async (ctx, next) => {
  const url = ctx.query.url
  try {
    const arraybuffer = await axios
      .request({
        responseType: 'arraybuffer',
        url,
        method: 'get',
        headers: {
          'Content-Type': 'image/png'
        }
      })
      .then(result => {
        console.log(result.data)
        return result.data
      })

    ctx.body = {
      resCode: 0,
      resMsg: 'fetch arraybuffer ok',
      result: arraybuffer
    }
  } catch (e) {
    ctx.body = {
      resCode: -1,
      resMsg: e.message,
      resutl: ''
    }
  }
})

export default router
