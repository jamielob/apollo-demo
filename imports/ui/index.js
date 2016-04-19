import React from 'react';
import { render } from 'react-dom';
import injectTapEventPlugin from 'react-tap-event-plugin';
import { Provider } from 'react-apollo';
import { client, store } from './apollo';

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
