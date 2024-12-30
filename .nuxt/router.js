import Vue from 'vue'
import Router from 'vue-router'
import { normalizeURL, decode } from 'ufo'
import { interopDefault } from './utils'
import scrollBehavior from './router.scrollBehavior.js'

const _04da44d5 = () => interopDefault(import('..\\pages\\no-access.vue' /* webpackChunkName: "pages/no-access" */))
const _ccf58ccc = () => interopDefault(import('..\\pages\\admin\\accounts.vue' /* webpackChunkName: "pages/admin/accounts" */))
const _70d3eeb2 = () => interopDefault(import('..\\pages\\admin\\category.vue' /* webpackChunkName: "pages/admin/category" */))
const _6e6ac890 = () => interopDefault(import('..\\pages\\admin\\dashboard.vue' /* webpackChunkName: "pages/admin/dashboard" */))
const _3d2b5358 = () => interopDefault(import('..\\pages\\admin\\inventory.vue' /* webpackChunkName: "pages/admin/inventory" */))
const _57fa2019 = () => interopDefault(import('..\\pages\\admin\\orders.vue' /* webpackChunkName: "pages/admin/orders" */))
const _3ad89161 = () => interopDefault(import('..\\pages\\admin\\payments.vue' /* webpackChunkName: "pages/admin/payments" */))
const _34a50276 = () => interopDefault(import('..\\pages\\admin\\price.vue' /* webpackChunkName: "pages/admin/price" */))
const _d61f3fd0 = () => interopDefault(import('..\\pages\\admin\\products.vue' /* webpackChunkName: "pages/admin/products" */))
const _32dedb8e = () => interopDefault(import('..\\pages\\admin\\qrscanner.vue' /* webpackChunkName: "pages/admin/qrscanner" */))
const _01565a0a = () => interopDefault(import('..\\pages\\dispatch\\dmodule.vue' /* webpackChunkName: "pages/dispatch/dmodule" */))
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
    path: "/admin/accounts",
    component: _ccf58ccc,
    name: "admin-accounts"
  }, {
    path: "/admin/category",
    component: _70d3eeb2,
    name: "admin-category"
  }, {
    path: "/admin/dashboard",
    component: _6e6ac890,
    name: "admin-dashboard"
  }, {
    path: "/admin/inventory",
    component: _3d2b5358,
    name: "admin-inventory"
  }, {
    path: "/admin/orders",
    component: _57fa2019,
    name: "admin-orders"
  }, {
    path: "/admin/payments",
    component: _3ad89161,
    name: "admin-payments"
  }, {
    path: "/admin/price",
    component: _34a50276,
    name: "admin-price"
  }, {
    path: "/admin/products",
    component: _d61f3fd0,
    name: "admin-products"
  }, {
    path: "/admin/qrscanner",
    component: _32dedb8e,
    name: "admin-qrscanner"
  }, {
    path: "/dispatch/dmodule",
    component: _01565a0a,
    name: "dispatch-dmodule"
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
