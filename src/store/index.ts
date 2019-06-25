
import { init } from '@rematch/core';
import models from './models';
const defaultStore = window.__INITIAL_STORE__ || {};
const store = init({
  models,
  redux: {
    initialState: defaultStore
  }
});

export default store;
