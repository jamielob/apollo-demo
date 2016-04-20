import { connect } from 'react-apollo';
import React from 'react';

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

    this.props.mutate({
      mutation: `
        mutation postReply($topic_id: ID!, $category_id: ID!, $raw: String!) {
          createPost(
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
        topic_id: this.props.topic.id,
        category_id: this.props.topic.category_id,
        raw: value,
      }
    }).then((response) => {
      this.props.refetch();
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
    const { topic } = this.props;

    return (
      <div>
        <h1>{ topic.title }</h1>
        { topic.posts.pages.map((page) => <PostsPage page={page} />) }
        { this.renderReplyBox() }
      </div>
    );
  }
}

const Topic = ({ topic, loginToken, mutate }) => (
  <div>
    { topic.loading ?
      'Loading...' :
      <TopicLoaded
        topic={topic.result.oneTopic}
        loginToken={loginToken}
        mutate={mutate}
        refetch={topic.refetch} />
    }
  </div>
)

const TopicWithData = connect({
  mapQueriesToProps({ ownProps }) {
    return {
      topic: {
        query: `
          query getTopic ($topicId: ID) {
            oneTopic(id: $topicId) {
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
        `,
        variables: {
          topicId: ownProps.params.id,
        }
      }
    }
  },
  mapStateToProps(state) {
    return {
      loginToken: state.loginToken,
    };
  },
})(Topic);

export default TopicWithData;
