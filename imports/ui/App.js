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
  FlatButton,
  IconButton,
  RaisedButton,
  TextField,
} from 'material-ui';

import ActionHome from 'material-ui/lib/svg-icons/action/home';

class App extends React.Component {
  handleLoginClick() {
    this.props.mutate({
      mutation: `
        mutation {
          login(username: "graphql", password: "verysecure")
        }
      `,
    }).then((result) => {
      this.props.dispatch({
        type: 'SET_LOGIN_TOKEN',
        loginToken: result.data.login,
      });
    }).catch((err) => {
      alert(err);
    });
  }

  handleLogoutClick() {
    this.props.dispatch({
      type: 'SET_LOGIN_TOKEN',
      loginToken: null,
    });
  }

  renderLoginButton() {
    if (this.props.loginToken) {
      return <FlatButton label="Logout" onClick={this.handleLogoutClick.bind(this)} />;
    } else {
      return <FlatButton label="Login" onClick={this.handleLoginClick.bind(this)} />
    }
  }

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
          iconElementRight={this.renderLoginButton()}
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
