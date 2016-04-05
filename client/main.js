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
          login(username: "graphql", password: "verysecure")
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

const Feed = ({ params, data, loading, loginToken }) => {
  const needsLogin = !loginToken && _.includes(['new', 'unread'], params.type);

  return (
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
      { needsLogin && <div className="needs-login">Please log in to see this page.</div> }
      { !loading && !needsLogin &&
        data.root[params.type].pages.map((page) => <FeedPage page={page} />) }
    </div>
  );
}

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
  <div className="post">
    <h3>{post.username}</h3>
    <div className="post-content" dangerouslySetInnerHTML={postHTML(post)} />
  </div>
);

const PostsPage = ({ page }) => (
  <div>
    { page.posts && page.posts.map((post) => <Post post={post} />) }
  </div>
);

class TopicLoaded extends React.Component {
  submitReply() {
    const value = this._input.getValue();

    client.queryManager.mutate({
      mutation: `
        mutation postReply($token: String!, $topic_id: ID!, $category_id: ID!, $raw: String!) {
          createPost(
            token: $token
            topic_id: $topic_id
            category: $category_id
            raw: $raw
          ) {
            id
            cooked
          }
        }
      `,
      variables: {
        token: this.props.loginToken,
        topic_id: this.props.data.root.oneTopic.id,
        category_id: this.props.data.root.oneTopic.category_id,
        raw: value,
      }
    }).then((response) => {
      console.log(response);
    });
  }

  renderReplyBox() {
    if (this.props.loginToken) {
      return (
        <div>
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
    } else {
      return (
        <div>Please log in to post a reply.</div>
      )
    }
  }

  render() {
    const { data } = this.props;

    return (
      <div>
        <h1>{data.root.oneTopic.title}</h1>
        { data.root.oneTopic.posts.pages.map((page) => <PostsPage page={page} />) }
        { this.renderReplyBox() }
      </div>
    );
  }
}

const Topic = ({ data, loading, loginToken }) => (
  <div>
    { loading ? 'Loading...' : <TopicLoaded data={data} loginToken={loginToken} /> }
  </div>
)

const TopicWithData = createContainer({
  getQuery: ({ params, loginToken }) => {
    const maybeLoginToken = loginToken ? `(token: "${loginToken}")` : '';

    return `
      {
        root${maybeLoginToken} {
          oneTopic(id: "${params.id}") {
            id
            category_id
            title
            posts {
              pages {
                posts {
                  username
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
