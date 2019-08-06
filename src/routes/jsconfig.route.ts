import * as Router from 'koa-router'
import wechatHelper, { PublicPlatforms } from '../helpers/wechat'
import { uploadCos } from '../helpers/cos'
import * as fs from 'fs'
import axios from 'axios'

const router = new Router()

// 百展客公众号获取js config
router.get('/oauth/wechat-jsconfig', async (ctx, next) => {
  const url = ctx.query.url

  console.log(`url: ${url}`)
  console.log(`decode url: ${decodeURIComponent(url)}`)

  const config = await wechatHelper.getJsConfig(url)

  ctx.body = config
})

// 互动公众号获取js config
router.get('/oauth/wechat-jsconfig-hudong', async (ctx, next) => {
  const url = ctx.query.url

  console.log(`url: ${url}`)
  console.log(`decode url: ${decodeURIComponent(url)}`)

  const config = await wechatHelper.getJsConfig(url, PublicPlatforms.HUDONG)

  ctx.body = config
})

// 百展客公众号上传微信media
router.get('/oauth/upload-media', async (ctx, next) => {
  const mediaId = ctx.query.mediaId
  console.log(`mediaId: ${mediaId}`)

  const buffer = await wechatHelper.getBuffer(mediaId)

  const result = await uploadCos(buffer)
  ctx.body = result
})
// 互动公众号上传微信media
router.get('/oauth/upload-media-hudong', async (ctx, next) => {
  const mediaId = ctx.query.mediaId
  console.log(`mediaId: ${mediaId}`)

  const buffer = await wechatHelper.getBuffer(mediaId, PublicPlatforms.HUDONG)

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
