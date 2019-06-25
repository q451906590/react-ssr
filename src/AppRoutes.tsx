import React from 'react';
import { Route, Switch, RouteProps } from 'react-router-dom';
// import loadable from '@loadable/component';
import resize from './common/resize.css';
import antdCss from 'antd/dist/antd.css';
import {routes} from './route';
import withStyles from 'isomorphic-style-loader/withStyles';
import Home from './components/Home/Home';

interface InitRoute extends RouteProps {
  init?: any
}
function AppRoutes({ context, initialData }: any) {
  return (
    <Switch>
      {
        routes.map((d: any) => (
          <Route<InitRoute>
            key={d.path}
            exact={d.exact}
            path={d.path}
            init={d.init || ''}
            // render={(props) => <Home branches={initialData.github} {...props} />}
            component={d.component}
          />
        ))
      }
    </Switch>
  );
}

export default withStyles(resize, antdCss)(AppRoutes);
