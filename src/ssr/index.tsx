import path from 'path';
import React from 'react';
import { StaticRouter } from 'react-router-dom';
import ReactDOMServer from 'react-dom/server';
import { ChunkExtractor } from '@loadable/server';
import { Provider } from 'react-redux';
import * as manifest from '../../build/app/manifest.json';
import StyleContext from 'isomorphic-style-loader/StyleContext';
import { matchRoutes } from 'react-router-config';
import { routes } from '../route';
import serverStore from '../store/serviceStore';

import AppRoutes from 'src/AppRoutes';

const SOURCE_TYPE:any = {
  STYLE: {
    name: 'styles',
    test: /\.css$/,
  },
  SCRIPT: {
    name: 'scripts',
    test: /\.js$/,
  },
  SOURCE_MAP: {
    name: 'sourceMap',
    test: /\.map$/,
  },
  IMAGE: {
    name: 'images',
    test: /\.(png|jpe?g|gif|svg)$/,
  },
};
const typeKeys = Object.keys(SOURCE_TYPE);

const groupedManifest:any = {
  manifest,
};

const manifestKeys = Object.keys(manifest);
// manifest分类
manifestKeys.forEach((key: string) => {
  const type = checkSourceType(key) || {};
  if (!groupedManifest.hasOwnProperty(type.name)) {
    groupedManifest[type.name] = [];
  }
  groupedManifest[type.name].push((manifest as any)[key]);
});

// 判断类型
function checkSourceType(sourceKey:string) {
  let type;
  const matchedKey = typeKeys.find((t) => {
    const temp = SOURCE_TYPE[t];
    return temp.test.test(sourceKey);
  });
  if (matchedKey) {
    type = SOURCE_TYPE[matchedKey];
  }
  return type;
}

const defaultContext = {
  userName: 'ssr-jason',
};

class SSR {
  public statsFile = '';
  constructor() {
    this.statsFile = path.resolve('build/loadable-stats.json');
  }
  initData(url:string) {
    // 用matchRoutes方法获取匹配到的路由对应的组件数组
    const matchedRoutes = matchRoutes(routes, url);
    const promises = [];
    for (const item of matchedRoutes) {
      if (item.route.init) {
        const promise = new Promise((resolve, reject) => {
          item.route.init(serverStore).then(resolve).catch(resolve);
        });
        promises.push(promise);
      }
    }
    return Promise.all(promises);
  }
  render(url:string, data:any, routerContext = {}) {
    // let modules = [];
    // 所有请求响应完毕，将被HTML内容发送给浏览器
    const css = new Set(); // CSS for all rendered React components
    const insertCss = (...styles :any) => {
      return styles.forEach((style:any) => css.add(style._getCss()));
    };
    const extractor = new ChunkExtractor({ statsFile: this.statsFile });
    const jsx = extractor.collectChunks(
      <StyleContext.Provider value={{ insertCss }}>
        <Provider store={serverStore}>
            <StaticRouter location={url} context={routerContext}>
              <AppRoutes context={defaultContext} initialData={data} />
            </StaticRouter>
        </Provider>
      </StyleContext.Provider>
    );
    const html = ReactDOMServer.renderToString(jsx);
    const cssString = Array.from(css).join('');
      // You can now collect your script tags
    const renderedScriptTags = extractor.getScriptTags(); // or extractor.getScriptElements();
      // You can also collect your "preload/prefetch" links
    const renderedLinkTags = extractor.getLinkTags(); // or extractor.getLinkElements();
      // And you can even collect your style tags (if you use "mini-css-extract-plugin")
    const renderedStyleTags = extractor.getStyleTags(); // or extractor.getStyleElements();
      /*console.log('html: ', html);
      console.log('renderedScriptTags: \n', renderedScriptTags);
      console.log('renderedLinkTags: \n', renderedLinkTags);
      console.log('renderedStyleTags: \n', renderedStyleTags);*/
    return {
        html,
        extractor,
        cssString,
        initialStore: serverStore.getState(),
        scriptTags: renderedScriptTags,
        linkTags: renderedLinkTags,
        styleTags: renderedStyleTags,
      };
  }

  renderWithStream(url: string, data = {}, routerContext = {}, store:any) {
      // let modules = [];
      const extractor = new ChunkExtractor({ statsFile: this.statsFile });
      const jsx = extractor.collectChunks(
        <Provider store={store}>
          <StaticRouter location={url} context={routerContext}>
            <AppRoutes context={defaultContext} initialData={data} />
          </StaticRouter>
        </Provider>
      );
      const htmlStream = ReactDOMServer.renderToNodeStream(jsx);
      const renderedScriptTags = extractor.getScriptTags();
      const renderedLinkTags = extractor.getLinkTags();
      const renderedStyleTags = extractor.getStyleTags();
      /*console.log('renderedScriptTags: \n', renderedScriptTags);
      console.log('renderedLinkTags: \n', renderedLinkTags);
      console.log('renderedStyleTags: \n', renderedStyleTags);*/
      return {
        htmlStream,
        extractor,
        scriptTags: renderedScriptTags,
        linkTags: renderedLinkTags,
        styleTags: renderedStyleTags,
      };
    }
  }

export default SSR;
