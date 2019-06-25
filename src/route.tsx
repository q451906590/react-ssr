import React from 'react';
import { Route, Switch, RouteProps } from 'react-router-dom';
import loadable from '@loadable/component';
import Home from './components/Home/Home';
import Hello from './components/Hello/Hello';
const Loading = <h3>Loading....</h3>;
// const Hello: any = loadable(
//   () =>
//     import(/* webpackChunkName: "components_Hello" */ './components/Hello/Hello'),
//   {
//     fallback: Loading,
//   }
// );

// const Home: any = loadable(
//   () => import(/* webpackChunkName: "components_Home" */ './components/Home/Home'),
//   {
//     fallback: Loading,
//   }
// );
export const routes = [
  {
    path: '/Home',
    component: Home,
    init: Home.init,
    exact: true,
  },
  {
    path: '/Hello',
    component: Hello,
    init: Hello.init,
    exact: true,
  },
  {
    path: '/',
    component: Home,
    init: Home.init,
    exact: false
  }
];
