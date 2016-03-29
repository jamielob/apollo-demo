import React from 'react';
import { render } from 'react-dom';
import injectTapEventPlugin from 'react-tap-event-plugin';

import {
  Router,
  Route,
  Link,
  browserHistory,
  IndexRedirect,
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

import {
  createContainer,
  client,
} from './createContainer';

injectTapEventPlugin();

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      loginToken: null,
    };
  }

  handleLoginClick() {
    client.queryManager.mutate({
      mutation: `
        mutation {
          login(username: "sashko", password: "mydiscoursepassword")
        }
      `,
    }).then((result) => {
      this.setState({
        loginToken: result.login,
      });
    });
  }

  handleLogoutClick() {
    this.setState({
      loginToken: null,
    });
  }

  renderLoginButton() {
    if (this.state.loginToken) {
      return <FlatButton label="Logout" onClick={this.handleLogoutClick.bind(this)} />;
    } else {
      return <FlatButton label="Login" onClick={this.handleLoginClick.bind(this)} />
    }
  }

  renderHomeButton() {
    return <IconButton onClick={handleRouteChange.bind(null, 'latest')}><ActionHome /></IconButton>;
  }

  render() {
    return (
      <div>
        <AppBar
          title="Discourse Meta"
          iconElementRight={this.renderLoginButton()}
          iconElementLeft={this.renderHomeButton()}
        />
        { React.cloneElement(this.props.children, { loginToken: this.state.loginToken }) }
      </div>
    );
  }
};

const TopicListItem = ({ topic }) => (
  <ListItem
    primaryText={topic.title}
    onClick={() => {goToTopicPage(topic.id)}}
  />
);

const FeedPage = ({ page }) => (
  <List>
    { page.topics && page.topics.map((topic) => <TopicListItem topic={topic} />) }
  </List>
);

const Feed = ({ params, data, loading }) => (
  <div>
    <Tabs
      onChange={handleRouteChange}
      value={params.type}
    >
      <Tab label="Latest" value={'latest'} />
      <Tab label="New" value={'new'} />
      <Tab label="Unread" value={'unread'} />
      <Tab label="Top" value={'top'} />
    </Tabs>
    { loading && 'Loading...' }
    { !loading && data.root[params.type].pages.map((page) => <FeedPage page={page} />) }
  </div>
);

const FeedWithData = createContainer({
  getQuery: ({ params, loginToken }) => {
    const maybeLoginToken = loginToken ? `(token: "${loginToken}")` : '';

    return `
      {
        root${maybeLoginToken} {
          ${params.type} {
            pages {
              topics {
                id
                title
              }
            }
          }
        }
      }
    `;
  },
}, Feed);

function postHTML(post) {
  return {
    __html: post.cooked,
  };
}

const Post = ({ post }) => (
  <ListItem
    primaryText={<div dangerouslySetInnerHTML={postHTML(post)} />}
    style={{ borderBottom: '1px solid #ccc' }}
  />
);

const PostsPage = ({ page }) => (
  <List>
    { page.posts && page.posts.map((post) => <Post post={post} />) }
  </List>
);

class TopicLoaded extends React.Component {
  submitReply() {
    const value = this._input.getValue();

    client.queryManager.mutation({
      mutation: `
        mutation postReply($input: Object) {
          createPost(
            token: $input.token
            topic_id: $input.topic_id
            category: $input.category_id
            raw: $input.raw
          ) {
            id
            cooked
          }
        }
      `,
      variables: {
        input: {
          
        }
      }
    })
  }

  render() {
    const { data } = this.props;

    return (
      <div>
        <h1>{data.root.oneTopic.title}</h1>
        { data.root.oneTopic.posts.pages.map((page) => <PostsPage page={page} />) }
        <TextField
          hintText="Reply text..."
          multiLine={true}
          rows={2}
          rowsMax={4}
          fullWidth={true}
          ref={(c) => this._input = c}
        />
        <RaisedButton primary={true} label="Post reply" onClick={this.submitReply.bind(this)}/>
      </div>
    );
  }
}

const Topic = ({ data, loading }) => (
  <div>
    { loading ? 'Loading...' : <TopicLoaded data={data} /> }
  </div>
)

const TopicWithData = createContainer({
  getQuery: ({ params, loginToken }) => {
    const maybeLoginToken = loginToken ? `(token: "${loginToken}")` : '';

    return `
      {
        root${maybeLoginToken} {
          oneTopic(id: "${params.id}") {
            title
            posts {
              pages {
                posts {
                  score
                  cooked
                }
              }
            }
          }
        }
      }
    `;
  },
}, Topic);

function handleRouteChange(value) {
  browserHistory.push(`/feed/${value}`);
}

function goToTopicPage(id) {
  browserHistory.push(`/topic/${id}`);
}

// Declarative route configuration (could also load this config lazily
// instead, all you really need is a single root route, you don't need to
// colocate the entire config).
render((
  <Router history={browserHistory}>
    <Route path="/" component={App}>
      <IndexRedirect to="/feed/latest" />
      <Route path="/feed/:type" component={FeedWithData}/>
      <Route path="/topic/:id" component={TopicWithData}/>
    </Route>
  </Router>
), document.getElementById('react-root'));
