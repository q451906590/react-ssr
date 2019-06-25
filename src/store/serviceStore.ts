// import { applyMiddleware, createStore } from 'redux';
import { init } from '@rematch/core';
import models from './models';

const store = init({
  models: {...models}
});

export default store;
