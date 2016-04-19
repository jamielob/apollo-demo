import React from 'react';
import { render } from 'react-dom';
import injectTapEventPlugin from 'react-tap-event-plugin';
import { Provider } from 'react-apollo';
import ApolloClient from 'apollo-client';

import { createStore, combineReducers, applyMiddleware, compose } from 'redux';

const client = new ApolloClient();

function loginToken(previousState = 'cf2761aaa6ca305144aecdd0a323dac6', action) {
  if (action.type === 'SET_LOGIN_TOKEN') {
    return action.loginToken;
  }

  return previousState;
}

const store = createStore(
  combineReducers({
    apollo: client.reducer(),
    loginToken,
  }),
  compose(
    applyMiddleware(client.middleware()),
    window.devToolsExtension ? window.devToolsExtension() : f => f
  )
);

injectTapEventPlugin();

import {
  Router,
  Route,
  Link,
  browserHistory,
  IndexRedirect,
} from 'react-router';

import App from './App';
import Feed from './Feed';
import Topic from './Topic';

render((
  <Provider store={store} client={client}>
    <Router history={browserHistory}>
      <Route path="/" component={App}>
        <IndexRedirect to="/feed/latest" />
        <Route path="/feed/:type" component={Feed}/>
        <Route path="/topic/:id" component={Topic}/>
      </Route>
    </Router>
  </Provider>
), document.getElementById('react-root'));
