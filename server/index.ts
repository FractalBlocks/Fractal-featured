const Koa = require('koa')
const serve = require('koa-static')
const Router = require('koa-router')
const app = new Koa()

app.use(serve('./dist/public'))

const root = new Router()

root.get('/', function (ctx, next) {

})

app
  .use(root.routes())
  .use(root.allowedMethods())

app.listen(3000)
