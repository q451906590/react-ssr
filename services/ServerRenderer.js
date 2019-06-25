const fs = require('fs');
const path = require('path');
// const intoStream = require('into-stream');
// Transform - 在读写过程中可以修改和变换数据的 Duplex 流
const { Transform } = require('stream');
const { minify } = require('html-minifier');

const config = require('../config/env');
const { logger } = require('./logger');

const Cache = require('./Cache');

const isSSREnabled = config.isSSREnabled();
const isHMREnabled = config.isHMREnabled();
const DEV_MODE = config.isDevMode();
const isCSSModules = config.isCSSModules();

let indexHtml = '';
let s;

if (isSSREnabled) {
  if (isCSSModules) {
    logger.warn(
      'When SSR is enabled, [CSS_MODULES] should be disabled for now, you can manually add plugin like "isomorphic-style-loader" to enable both SSR and CSS Modules'
    );
  }
  const SSR = require('../build/node/main');
  s = new SSR();
} else if (!isHMREnabled) {
  indexHtml = readIndexHtml();
}

// 读取index.html
function readIndexHtml() {
  let ret = '';
  try {
    ret = fs.readFileSync(path.join(__dirname, `../build/app/index.html`), {
      encoding: 'utf-8',
    });
  } catch (e) {
    logger.warn('failed to read build/app/index.html...');
  }
  return ret;
}

class ServerRenderer {
  constructor(options = {}) {
    this.ssrEnabled = options.hasOwnProperty('ssr')
    ? !!options.ssr
    : isSSREnabled;

    this.cache = null;
    if (options.cache && options.cache instanceof Cache) {
      this.cache = options.cache;
    } else if (this.ssrEnabled && options.cache === true) {
      this.cache = new Cache(options);
    }
    this.cacheDisabled = !this.cache;
    this.streaming = !!options.stream || !!options.streaming;
  }

  isSSREnabled() {
    return this.ssrEnabled;
  }

  render(ctx, data = {}, streaming) {
    if (!this.ssrEnabled) {
      ctx.body = this.genHtml('', {}, ctx);
      return;
    }

    return this.renderSSR(ctx, data, streaming);
  }

  renderFromCache(key, ctx) {
    logger.info('Rendering content from cache...');
    this.setHtmlContentType(ctx);
    ctx.body = this.cache.get(key);
  }

  renderSSR(ctx, data = {}, streaming = this.streaming) {
    this.setHtmlContentType(ctx);

    // 判断cache是否存在
    if (!this.cacheDisabled && this.isCacheMatched(ctx.path)) {
      this.renderFromCache(ctx.path, ctx);
      return;
    }

    if (!streaming) {
      logger.info('-----> Use React SSR Sync API!');
      return s.initData(ctx.url).then(() => {
        const rendered = s.render(ctx.url, data);
        rendered.initialData = data;
        ctx.body = this.genHtml(rendered.html, rendered, ctx);
      })
    }
    logger.info('-----> Use React SSR Streaming API!');
    //use streaming api
    const rendered = s.renderWithStream(ctx.url, data);
    rendered.initialData = data;
    this.genHtmlStream(rendered.htmlStream, rendered, ctx);
  }

  genHtml(html, extra = {}, ctx) {
    // 非服务端
    if (!this.ssrEnabled) {
      if (!indexHtml) {
        indexHtml = readIndexHtml();
      }
      if (!DEV_MODE) {
        return indexHtml;
      }
      indexHtml = readIndexHtml();
      return indexHtml;
    }
    // 服务端
    let ret = `
      <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no">
          <title>${extra.title || 'React App'}</title>
          ${extra.linkTags}
          ${extra.styleTags}
          <style>${extra.cssString}</style>
        </head>
        <body>
          <div id="app">${html}</div>
          <script type="text/javascript">window.__INITIAL_DATA__ = ${JSON.stringify(
            extra.initialData || {}
          )}</script>
          <script type="text/javascript">window.__INITIAL_STORE__ = ${JSON.stringify(
            extra.initialStore || {}
          )}</script>
          ${extra.scriptTags}
        </body>
      </html>
    `;
      ret = this.minifyHtml(ret);
      this.cache && this.cache.set(ctx.path, ret);
      return ret;
  }

  genHtmlStream(nodeStreamFromReact, extra = {}, ctx) {
    const res = ctx.res;
    ctx.status = 200;
    ctx.respond = false;

    let cacheStream = this.createCacheStream(ctx.path);
    cacheStream.pipe(
      res,
      { end: false }
    );

    const before = `
      <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no">
          <title>${extra.title || 'React App'}</title>
          ${extra.styleTags}
        </head>
        <body><div id="app">`;
    cacheStream.write(before);
    // res.write(before);

    nodeStreamFromReact.pipe(
      // res,
      cacheStream,
      { end: false }
    );

    nodeStreamFromReact.on('end', () => {
      logger.info('nodeStreamFromReact end');
      logger.info('start streaming rest html content...');
      const after = `</div>
          <script type="text/javascript">window.__INITIAL_DATA__ = ${JSON.stringify(
            extra.initialData || {}
          )}</script>
            ${extra.extractor.getScriptTags()}
          </body>
        </html>`;
      // res.end(after);

      cacheStream.write(after);
      logger.info('streaming rest html content done!');
      res.end();
      cacheStream.end();
      //in case the initial data and the runtime code is big, also use stream here
      /*const afterStream = intoStream(after);
      afterStream.pipe(
        cacheStream,
        { end: false }
      );
      afterStream.on('end', () => {
        logger.info('streaming rest html content done!');
        cacheStream.end();
      });*/
    });
  }

  /**
   *
   * @param {String} key for now it's ctx.url
   */
  createCacheStream(key) {
    logger.info(`Creating cache stream for ${key}`);
    const bufferedChunks = [];
    const self = this;
    return new Transform({
      // transform() is called with each chunk of data
      transform(data, enc, cb) {
        // We store the chunk of data (which is a Buffer) in memory
        bufferedChunks.push(data);
        // Then pass the data unchanged onwards to the next stream
        cb(null, data);
      },

      // flush() is called when everything is done
      flush(cb) {
        // We concatenate all the buffered chunks of HTML to get the full HTML
        // then cache it at "key"
        if (!self.cacheDisabled && self.cache) {
          self.cache.set(
            key,
            self.minifyHtml(Buffer.concat(bufferedChunks).toString())
          );
          logger.info(`Cache stream for [${key}] finished!`);
        }
        cb();
      },
    });
  }

  isCacheMatched(key) {
    if (this.cache && this.cache.has(key)) {
      logger.info(`Cache for [${key}] matched!`);
      return true;
    }
    return false;
  }

  setHtmlContentType(ctx) {
    ctx.set({
      'Content-Type': 'text/html; charset=UTF-8',
    });
  }

  minifyHtml(html) {
    return minify(html, { collapseWhitespace: true });
  }
}

module.exports = ServerRenderer;