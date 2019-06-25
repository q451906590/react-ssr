
import {ModelConfig} from '@rematch/core';
const Hello: ModelConfig= {
  state: {
    count: 1
  }, // initial state
  reducers: {
    // handle state changes with pure functions
    increment(state, payload) {
      return {
        count: payload
      };
    }
  },
  effects: {
    // handle state changes with impure functions.
    // use async/await for async actions
    async incrementAsync(payload, rootState) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.increment(payload);
    }
  }
};
export default Hello;
