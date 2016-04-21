import React from 'react';
import { connect } from 'react-apollo';

import {
  Link,
  browserHistory,
} from 'react-router';

import {
  Tabs,
  Tab,
  List,
  ListItem,
  AppBar,
  IconButton,
} from 'material-ui';

import ActionHome from 'material-ui/lib/svg-icons/action/home';

import Login from './Login.js';

class App extends React.Component {
  renderHomeButton() {
    return (
      <IconButton onClick={handleRouteChange.bind(null, 'latest')}>
        <ActionHome />
      </IconButton>
    );
  }

  render() {
    return (
      <div>
        <AppBar
          title="Discourse Meta"
          iconElementRight={<Login {...this.props}/>}
          iconElementLeft={this.renderHomeButton()}
        />
        { this.props.children }
      </div>
    );
  }
};

function handleRouteChange(value) {
  browserHistory.push(`/feed/${value}`);
}

const ConnectedApp = connect({
  mapStateToProps({ loginToken }) {
    return {
      loginToken,
    };
  },
})(App);

export default ConnectedApp;
