import React from 'react';

import {
  FlatButton,
  RaisedButton,
  TextField,
  Popover,
} from 'material-ui';

const styles = {
  menuButton: {
    marginTop: 6,
    color: '#FFF'
  },
  loginBox: {
    form: {
      padding: 20
    },
    button: {
      textAlign: 'right',
      marginTop: 5
    },
    validation: {
      color: '#ff4081'
    }
  }
};

class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loginBoxOpen: false,
      showValidation: false,
    };
  }

  handleShowLoginBox(event) {
    this.setState({
      loginBoxOpen: true,
      anchorEl: event.currentTarget,
    });
  }

  handleLogin(event) {
    event.preventDefault();
    const username = this.refs.usernameInput.getValue();
    const password = this.refs.passwordInput.getValue();
    this.props.mutate({
      mutation: `
        mutation {
          login(username: "${username}", password: "${password}")
        }
      `,
    }).then((result) => {
      if (result.errors) {
        this.setState({
          showValidation: true
        });
      } else {
        this.props.dispatch({
          type: 'SET_LOGIN_TOKEN',
          loginToken: result.data.login,
        });
        this.setState({
          loginBoxOpen: false,
          showValidation: false
        });
      }
    }).catch((err) => {
      alert(err);
    });
  };

  handleLogoutClick() {
    this.props.dispatch({
      type: 'SET_LOGIN_TOKEN',
      loginToken: null,
    });
  }

  handleLoginBoxClose() {
    this.setState({
      loginBoxOpen: false,
    });
  }

  render() {
    if (this.props.loginToken) {
      return (
        <div>
          <FlatButton label="Logout"
            onClick={this.handleLogoutClick.bind(this)}
            style={styles.menuButton}
          />
        </div>
      );
    } else {
      return (
        <div>
          <FlatButton label="Login"
            onClick={this.handleShowLoginBox.bind(this)}
            style={styles.menuButton}
          />
          <Popover
            open={this.state.loginBoxOpen}
            anchorEl={this.state.anchorEl}
            anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
            targetOrigin={{horizontal: 'right', vertical: 'top'}}
            onRequestClose={this.handleLoginBoxClose.bind(this)}
          >
            <form style={styles.loginBox.form}
              onSubmit={this.handleLogin.bind(this)}
            >
              {
                this.state.showValidation
                  ? <div style={styles.loginBox.validation}>
                      Invalid username/password (try graphql/verysecure)
                    </div>
                  : null
              }
              <div className="group">
                <TextField
                  hintText='Username (can use "graphql")'
                  ref="usernameInput"
                />
              </div>
              <div className="group">
                <TextField
                  hintText='Password (can use "verysecure")'
                  type="password"
                  ref="passwordInput"
                />
              </div>
              <div style={styles.loginBox.button}>
                <RaisedButton primary={true} label="Login"
                  style={styles.loginBox.button}
                  type="submit"
                />
              </div>
            </form>
          </Popover>
        </div>
      );
    }
  }
}

export default Login;
