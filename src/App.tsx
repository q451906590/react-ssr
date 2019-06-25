import React, { Component } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { Provider } from 'react-redux';
import store from './store/index';
interface State {
  appName: string,
  context: object,
}
class App extends Component<any, Readonly<State>> {
  public readonly state: Readonly<State> = {
    appName: 'React-v16',
    context: {
      userName: 'jason-in-app',
    },
  };
  public initialData: object | undefined = window.__INITIAL_DATA__ || {};
  constructor(props:any) {
    super(props);
    // 服务端
  }
  render() {
    const {
      context,
    } = this.state;
    return (
      <Provider store = {store}>
        <Router>
          <AppRoutes
            context={context}
            initialData={this.initialData}
          />
        </Router>
      </Provider>
    );
  }
}
export default App;
