import ApolloClient, { createNetworkInterface } from 'apollo-client';
import { createStore, combineReducers, applyMiddleware, compose } from 'redux';

const networkInterface = createNetworkInterface('/graphql');

export const client = new ApolloClient({
  networkInterface,
});

function loginToken(previousState = 'cf2761aaa6ca305144aecdd0a323dac6', action) {
  if (action.type === 'SET_LOGIN_TOKEN') {
    return action.loginToken;
  }

  return previousState;
}

export const store = createStore(
  combineReducers({
    apollo: client.reducer(),
    loginToken,
  }),
  compose(
    applyMiddleware(client.middleware()),
    window.devToolsExtension ? window.devToolsExtension() : f => f
  )
);

networkInterface.use([{
  applyMiddleware(request, next) {
    const currentUserToken = store.getState().loginToken;
    console.log(store.getState());

    if (!currentUserToken) {
      next();
      return;
    }

    if (!request.options.headers) {
      request.options.headers = new Headers();
    }

    request.options.headers.Authorization = currentUserToken;

    next();
  }
}]);
