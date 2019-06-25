import React from 'react';
import ReactDOM from 'react-dom';
import { loadableReady } from '@loadable/component';
import App from './App';
import AppError from './components/AppError/AppError';
import StyleContext from 'isomorphic-style-loader/StyleContext';
const elRoot = document.getElementById('app');

const insertCss = (...styles:any) => {
  const removeCss = styles.map((style:any) => style._insertCss());
  return () => removeCss.forEach((dispose:any) => dispose());
};

const render = (Component:any)  => {
  if (__SSR__) {
    loadableReady(() => {
      ReactDOM.hydrate(
        <StyleContext.Provider value={{ insertCss }}>
          <AppError>
            <Component />
          </AppError>
        </StyleContext.Provider>,
        elRoot
      );
    });
    return;
  }
  ReactDOM.hydrate(
    <StyleContext.Provider value={{ insertCss }}>
        <AppError>
          <Component />
        </AppError>
    </StyleContext.Provider>,
    elRoot
  );
};

render(App);

// Webpack Hot Module Replacement API
if (module.hot) {
  module.hot.accept('./App', () => {
    render(require('./App').default);
  });
  // module.hot.check().then(modules => {
  //   console.log('modules: ', modules);
  // });
  // module.hot.addStatusHandler((status) => {
  //   console.log('status: ', status);
  //   if (status === 'idle') {
  //     // window.location.reload()
  //   }
  // })
}
