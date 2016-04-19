// resolver for posts in Topic
// resolvers for pages PaginatedPostsList
// resolver for posts in PostListPage

const resolvers = {
  Post: {
    topic: (root, args, context) => {
      return context.connectors.Discourse._fetchEndpoint({
        url: ({ id }) => `/t/${id}`,
      }, { id: root.topic_id });
    },
  },

  Topic: {
    /* category: reference({
      typeKey: 'categories',
      id: ({ category_id }) => category_id,
    }), */
    category: () => { throw new Error('No endpoint defined to fetch one cat'); },
    posts: (root, args, context) => {
      return context.connectors.Discourse._fetchEndpoint({
        url: ({ id }) => `/t/${id}.json`,
        map: (data) => ({ posts: data.post_stream.stream, topicId: data.id }),
      }, { id: root.id });
    },

  },

  PaginatedPostList: {
    pages: ({ posts, topicId }, args, context) => {
      // XXX I don't like having to pass the topic id through. it's messy
      return context.connectors.Discourse.getPaginatedPosts(posts, args, topicId);
    },
  },

  /* PostListPage: {
    posts: (root) => {
      return root;
    },
  }, */

  Category: {
    latest_topics: (category, args, context) => {
      return context.connectors.Discourse.getPagesWithParams(`/c/${category.id}`, args);
    },
    new_topics: (category, args, context) => {
      return context.connectors.Discourse.getPagesWithParams(
        `/c/${category.id}/l/new`,
        args,
      );
    },
  },

  PaginatedTopicList: {
    pages(list) {
      return list.pages;
    },
  },

  TopicListPage: {
    topics(page) {
      return page.topics;
    },
  },

  PostListPage: {
    posts(list) {
      // XXX I'm not sure I got this right.
      return list.posts;
    },
  },

  RootQuery: {
    feed(_, { type, ...args }, context){
      return context.connectors.Discourse.getPagesWithParams(`/${type.toLowerCase()}`, args);
    },

    // I assume this doesn't actually work. It takes no arguments
    allPosts: (_, args, context) => {
      return context.connectors.Discourse._fetchEndpoint({
        url: '/posts',
        map: (data) => data.latest_posts,
      }, args);
    },
    /* allTopics: (_, args, { context }) => {
      context.connectors.Discourse._fetchEndpoint(info.indexEndpoint, args);
    }, */
    // I assume this doesn't actually work. It takes no arguments ...
    allCategories: (_, args, context) => {
      return context.connectors.Discourse._fetchEndpoint({
        url: '/categories',
        map: (data) => data.category_list.categories,
      }, args);
    },
    allTopics() {
      throw new Error('AuthenticatedQuery.oneCategory not implemented');
    },

    onePost: (_, args, context) => {
      return context.connectors.Discourse._fetchEndpoint({
        url: ({ id }) => `/posts/${id}`,
      }, args);
    },
    oneTopic: (_, args, context) => {
      return context.connectors.Discourse._fetchEndpoint({
        url: ({ id }) => `/t/${id}`,
      }, args);
    },
    oneCategory() {
      throw new Error('AuthenticatedQuery.oneCategory not implemented');
    },
    // oneCategory: null, // this isn't actually defined, I think.
  },

  // TODO this is waaaaay too long.
  RootMutation: {
    login: (_, args, context) => {
      /* context.connectors.Discourse = new DiscourseContext({
        apiRoot: API_ROOT,
      }); */

      return context.connectors.Discourse.getLoginToken(args.username, args.password);
    },

    createPost: (_, args, context) => {
      /* context.connectors.Discourse = new DiscourseContext({
        loginToken: args.token,
        apiRoot: API_ROOT,
      });

      delete args.token; */
      return context.connectors.Discourse.createPost(args);
    },
  },
};

export default resolvers;
