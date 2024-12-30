import Vue from 'vue'
import Router from 'vue-router'
import { normalizeURL, decode } from 'ufo'
import { interopDefault } from './utils'
import scrollBehavior from './router.scrollBehavior.js'

const _04da44d5 = () => interopDefault(import('..\\pages\\no-access.vue' /* webpackChunkName: "pages/no-access" */))
const _35e53920 = () => interopDefault(import('..\\pages\\dispatch\\order_dispatch.vue' /* webpackChunkName: "pages/dispatch/order_dispatch" */))
const _0d54893f = () => interopDefault(import('..\\pages\\driver\\ddmodule.vue' /* webpackChunkName: "pages/driver/ddmodule" */))
const _595b1437 = () => interopDefault(import('..\\pages\\index.vue' /* webpackChunkName: "pages/index" */))

const emptyFn = () => {}

Vue.use(Router)

export const routerOptions = {
  mode: 'history',
  base: '/',
  linkActiveClass: 'nuxt-link-active',
  linkExactActiveClass: 'nuxt-link-exact-active',
  scrollBehavior,

  routes: [{
    path: "/no-access",
    component: _04da44d5,
    name: "no-access"
  }, {
    path: "/dispatch/order_dispatch",
    component: _35e53920,
    name: "dispatch-order_dispatch"
  }, {
    path: "/driver/ddmodule",
    component: _0d54893f,
    name: "driver-ddmodule"
  }, {
    path: "/",
    component: _595b1437,
    name: "index"
  }],

  fallback: false
}

export function createRouter (ssrContext, config) {
  const base = (config._app && config._app.basePath) || routerOptions.base
  const router = new Router({ ...routerOptions, base  })

  // TODO: remove in Nuxt 3
  const originalPush = router.push
  router.push = function push (location, onComplete = emptyFn, onAbort) {
    return originalPush.call(this, location, onComplete, onAbort)
  }

  const resolve = router.resolve.bind(router)
  router.resolve = (to, current, append) => {
    if (typeof to === 'string') {
      to = normalizeURL(to)
    }
    return resolve(to, current, append)
  }

  return router
}
