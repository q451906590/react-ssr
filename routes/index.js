'use strict';
const Router = require('koa-router');
// 处理post请求
const koaBody = require('koa-body');
const got = require('got');
const ServerRenderer = require('../services/ServerRenderer');

const renderer = new ServerRenderer({
  streaming: false,
  // flushInterval: 1000 * 30, //flush every 30s
});

const config = require('../config/env');
const utils = require('../config/utils');
const { logger } = require('../services/logger');

const appPrefix = utils.normalizeTailSlash(config.getAppPrefix());

const router = new Router({
  prefix: appPrefix,
});

// 清缓存
router.use(async function(ctx, next) {
  // console.log(`start of index router: ${ctx.path}`);
  ctx.set('Cache-Control', 'no-cache');
  ctx.state = {
    initialData: {},
  };
  await next();
  // console.log(`end of index router: ${ctx.path}`);
});

router.post(
  '/upload',
  koaBody({
    // 拆分主体
    multipart: true,
    // 写入的文件uploadDir将包含原始文件的扩展名
    keepExtensions: true,
  }),
  async function(ctx) {
    const { body, files } = ctx.request;
    ctx.body = { body, files };
  }
);

router.get('/400', async ctx => {
  ctx.status = 400;
  ctx.body = {
    msg: '400',
  };
});

router.post('/400', koaBody(), async ctx => {
  ctx.status = 400;
  ctx.set('cache-control', 'no-store');
  ctx.body = {
    msg: '400',
    data: ctx.request.body,
  };
});

router.get('*', async function(ctx) {
  await renderer.render(ctx);
});

module.exports = router;