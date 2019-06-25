'use strict';

const config = require('./config/env');

const path = require('path');
const Koa = require('koa');
// 将其他Koa应用程序挂载为中间件。将path传递到mount()从URL中剥离暂时直到堆栈解开
const mount = require('koa-mount');
// 当响应体比较大时，我们一般会启用类似Gzip的压缩技术减少传输内容，koa-compress提供了这样的功能，可根据需要进行灵活的配置
const compress = require('koa-compress');
// HTTP是无状态协议，为了保持用户状态，我们一般使用Session会话，koa-session提供了这样的功能，既支持将会话信息存储在本地Cookie，也支持存储在如Redis, MongoDB这样的外部存储设备
const session = require('koa-session');
// Node.js除了处理动态请求，也可以用作类似Nginx的静态文件服务，在本地开发时特别方便，可用于加载前端文件或后端Fake数据，可结合 koa-compress 和 koa-mount 使用。
const serveStatic = require('koa-static');
// 对于比较老的使用Generate函数的koa中间件(< koa2)，官方提供了一个灵活的工具可以将他们转为基于Promise的中间件供Koa2使用，同样也可以将新的基于Promise的中间件转为旧式的Generate中间件。
const convert = require('koa-convert');
// 网络安全得到越来越多的重视，helmet 通过增加如Strict-Transport-Security, X-Frame-Options, X-Frame-Options等HTTP头提高Express应用程序的安全性，koa-helmet为koa程序提供了类似的功能，参考Node.js安全清单
const helmet = require('koa-helmet');
// logo加载
const favicon = require('koa-favicon');
const isEmpty = require('lodash.isempty');

const { logger, Logger } = require('./services/logger');
const index = require('./routes/index');
const { handleApiRequests } = require('./routes/proxy');
const sysUtils = require('./config/utils');
// const isSSREnabled = config.isSSREnabled();

const PORT = config.getListeningPort();
const DEV_MODE = config.isDevMode();
const DEFAULT_PREFIX_KEY = 'defaultPrefix';
const API_ENDPOINTS = config.getApiEndPoints();
const isHMREnabled = config.isHMREnabled();

function initAppCommon() {
  const app = new Koa();
  app.env = config.getNodeEnv() || 'development';
  app.keys = ['koa-web-kit'];
  app.proxy = true;

  app.use(Logger.createMorganLogger());
  app.use(logger.createRequestsLogger());
  app.use(helmet());
  return app;
}

function initApp(app) {
  if (!DEV_MODE) {
    app.use(compress());
  }

  app.use(favicon(__dirname + 'build/app/favicon.ico'));

  let staticPrefix = path.join(
    config.getAppPrefix(),
    config.getStaticPrefix() || '/'
  );
  if (sysUtils.isWindows()) {
    staticPrefix = sysUtils.replaceBackwardSlash(staticPrefix);
  }
  // 挂载静态资源
  app.use(
    // mount(
    //   staticPrefix,
    //   serveStatic(path.join(__dirname, 'build/app'), {
    //     // one month cache for prod
    //     maxage: DEV_MODE ? 0 : 2592000000,
    //     gzip: false,
    //   })
    // )
      serveStatic(path.join(__dirname, 'build/app'), {
        // one month cache for prod
        maxage: DEV_MODE ? 0 : 2592000000,
        gzip: false,
      })
  );

  app.use(session(app));

  app.use(index.routes());

  app.on('error', err => {
    logger.error(err.stack);
  });

  return app;
}

function listen(app, port = PORT) {
  const server = app.listen(port, '0.0.0.0');
  logger.info(`Koa listening on port ${port}`);
  if (DEV_MODE) {
    logger.info(`visit: http://localhost:${port}`);
  }
  return server;
}

//React SSR
async function initSSR() {}

async function initHMR(app) {
  if (!isHMREnabled) return;
  let HMRInitialized = false;
  logger.info('HMR enabled, initializing HMR...');
  // 该模块封装和组成 webpack-dev-middleware，并 webpack-hot-client 成一个单一的中间件模块，允许快速而简洁的方式
  const koaWebpack = require('koa-webpack');
  const historyApiFallback = require('koa-history-api-fallback');
  const webpack = require('webpack');
  const webpackConfig = require('./config/webpack.config.dev');
  const compiler = webpack(
    Object.assign({}, webpackConfig, {
      stats: {
        modules: false,
        colors: true,
      },
    })
  );
  return new Promise((resolve, reject) => {
    koaWebpack({
      compiler,
      hotClient: {
        port: 0,
        logLevel: 'error',
        hmr: true,
        reload: true,
      },
      devMiddleware: {
        index: 'index.html',
        publicPath: webpackConfig.output.publicPath,
        watchOptions: {
          aggregateTimeout: 0,
        },
        writeToDisk: true,
        stats: {
          modules: false,
          colors: true,
          children: false,
        },
      },
    })
      .then(middleware => {
        if (!HMRInitialized) {
          HMRInitialized = true;
          app.use(convert(historyApiFallback()));
          app.use(middleware);
          middleware.devMiddleware.waitUntilValid(resolve);
        }
      })
      .catch(err => {
        logger.error('[koa-webpack]:', err);
        reject();
      });
  });
}

function initProxy(app) {
  //api proxy
  if (config.isNodeProxyEnabled() && !isEmpty(API_ENDPOINTS)) {
    for (const prefix in API_ENDPOINTS) {
      if (
        API_ENDPOINTS.hasOwnProperty(prefix) &&
        prefix !== DEFAULT_PREFIX_KEY
      ) {
        let endPoint = API_ENDPOINTS[prefix];
        if ('string' !== typeof endPoint) {
          endPoint = endPoint.endpoint;
        }
        app.use(handleApiRequests(prefix, endPoint));
        logger.info('Node proxy[' + endPoint + '] enabled for path: ' + prefix);
      }
    }
  }
}

module.exports = {
  listen,
  /**
   *
   * @return {Promise<Koa>}
   */
  create: async function() {
    const app = initAppCommon();
    initProxy(app);
    await initSSR();
    await initHMR(app);
    initApp(app);
    return Promise.resolve(app);
    // logger.info(`${isHMREnabled ? 'HMR & ' : ''}Koa App initialized!`);
  },
};
