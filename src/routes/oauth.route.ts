import * as Router from 'koa-router'
import * as jwt from 'jsonwebtoken'

import config from '../../config/config'
import wechatHelper from '../helpers/wechat'

const router = new Router()

export interface OauthQueryOptions {
  redirect_uri: string
  response_type: string
}

let hasSave = false

function fakeCheckOpenID(
  openid: string
): Promise<{ hasSave: boolean; user?: Object }> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(hasSave ? { hasSave, user: {} } : { hasSave })
    }, 100)
  })
}

function fakeSaveUserInfo(user: any) {
  return new Promise(resolve => {
    setTimeout(() => {
      hasSave = true
      resolve()
    }, 2e2)
  })
}

function createStateForBaseScope(query: OauthQueryOptions): string {
  return config.environment.production
    ? jwt.sign(
        {
          redirect_uri: query.redirect_uri,
          response_type: query.response_type
        },
        config.jwtSecret,
        {
          expiresIn: '30s'
        }
      )
    : query.redirect_uri
}

function createStateForAutoRedirect(state: string): string {
  if (config.environment.production) {
    const decoded: any = jwt.verify(state, config.jwtSecret)
    return jwt.sign(
      {
        redirect_uri: decoded.redirect_uri,
        response_type: decoded.response_type,
        auto_redirect: true
      },
      config.jwtSecret,
      { expiresIn: '30s' }
    )
  }
  return state
}

function extractRedirectUri(state: string): string {
  if (config.environment.production) {
    const decoded: any = jwt.verify(state, config.jwtSecret)
    return decoded.redirect_uri
  }
  return state
}

function hasBeenAutoRedirect(state: string): boolean {
  if (config.environment.production) {
    const decoded: any = jwt.verify(state, config.jwtSecret)
    return decoded.auto_redirect
  }
  return false
}

router.get('/oauth/authorize', (ctx, next) => {
  const query = ctx.query
  console.log(`/oauth/authorize`)
  if (!ctx.query.redirect_uri) {
    return ctx.throw('redirect_uri required', 400)
  }

  // 开发环境 微信网页授权state有长度限制 故不用token
  const state = createStateForBaseScope(ctx.query)
  const url = wechatHelper.getAuthorizeURL(state)

  ctx.redirect(url)
})

router.get('/oauth/wechat-web-oauth', async (ctx, next) => {
  const openid = await wechatHelper.getOpenID(ctx.query.code)
  const state = ctx.query.state
  console.log(`/oauth/wechat-web-oauth`)

  // 如果 openid 已被保存 从后台获取 userInfo
  // 如果未被保存 则 用 snsapi_userinfo 重新授权 获取 userInfo

  const checkUser = await fakeCheckOpenID(openid)
  if (!checkUser.hasSave) {
    console.log(`has not save`)
    if (hasBeenAutoRedirect(state)) {
      console.log(`has been auto redirect`)
      const userInfo = await wechatHelper.getUser(openid)
      const saveUserResult = await fakeSaveUserInfo(userInfo)
    } else {
      console.log(`has not been auto redirect`)
      const redirectUrlForFetchUserInfo = wechatHelper.getAuthorizeURL({
        state: createStateForAutoRedirect(state),
        scope: 'snsapi_userinfo'
      })
      return ctx.redirect(redirectUrlForFetchUserInfo)
    }
  }

  console.log(`finally saved user info`)

  const token = jwt.sign(
    {
      openid: openid
    },
    config.jwtSecret,
    {
      expiresIn: '12h'
    }
  )
  const redirect_uri = extractRedirectUri(state)
  ctx.redirect(
    redirect_uri +
      `?access_token=${token}&openid=${openid}&expires_in=${12 * 60 * 60}`
  )
})

// 测试授权回调是否成功
router.get('/oauth/test', async (ctx, next) => {
  ctx.body = ctx.query
})

export default router
