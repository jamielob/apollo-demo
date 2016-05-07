import rp from 'request-promise';
import DataLoader from 'dataloader';

import {
  identity,
  range,
  forOwn,
  isArray,
} from 'lodash';

const API_ROOT = 'https://try.discourse.org';

// Encapsulates session management, dataloader caching, and pagination
class DiscourseContext {

  // loginToken comes from context
  constructor({ loginToken }) {
    this.COOKIE_KEY = '_forum_session';
    this.TOKEN_KEY = '_t';
    this.apiRoot = API_ROOT;
    this.loginToken = loginToken;

    this.urlDataLoader = new DataLoader((urls) => {
      // XXX we probably shouldn't batch requests to the backend for REST.

      const options = {
        json: true,
      };

      if (this.loginToken) {
        options.headers = {
          Cookie: `${this.TOKEN_KEY}=${this.loginToken}`,
        };
      }

      return Promise.all(urls.map((url) => {
        return rp({
          uri: url,
          ...options,
        }).catch((err) => {
          throw err;
        });
      }));
    });
  }

  getPagesWithParams(url, { page = 0, numPages = 1 }, params = {}) {
    const pageNumbers = range(page, page + numPages);

    const urls = pageNumbers.map((pageNumber) => {
      const myParams = {
        page: pageNumber,
        ...params,
      };

      return `${url}?${serializeParamsForRails(myParams)}`;
    });
    const requestPromises = urls.map(myUrl => this.get(myUrl));
    return Promise.all(requestPromises).then((results) => {
      return {
        pages: results.map((result) => {
          return result.topic_list;
        }),
      };
    });
  }

  // XXX if I ask for 100 pages but there are only 50, should I still get 100?
  getPaginatedPosts(posts, { page = 0, numPages = 1 }, topicId) {
    const pages = [];
    const PPP = 10; // Posts Per Page
    let postsOnPage = [];
    let offset = 0;
    for (let i = 0; i < numPages; i++) {
      offset = page * PPP + i * PPP;
      postsOnPage = posts.slice(offset, offset + PPP);
      pages.push(this.getPostList(postsOnPage, topicId));
    }
    return pages;
  }

  // XXX could also just use the onePost endpoint to fetch each individual post,
  // in that case we don't need the topicId
  getPostList(postIDs, topicId) {
    if (postIDs.length === 0) {
      return { posts: [] };
    }
    const params = {};
    params['post_ids'] = postIDs;
    const path = `/t/${topicId}/posts.json`;
    const url = `${path}?${serializeParamsForRails(params)}`;
    return this.get(url).then((result) => {
      return { posts: result.post_stream.posts };
    }).catch((err) => {
      return null;
    });
  }

  _fetchEndpoint(endpoint, args) {
    if (endpoint.fetch) {
      return endpoint.fetch(args, this);
    }

    if (typeof endpoint.url === 'function') {
      return this.urlDataLoader.load(this.apiRoot +  endpoint.url(args))
        .then(endpoint.map || identity);
    } else {
      return this.urlDataLoader.load(this.apiRoot +  endpoint.url)
        .then(endpoint.map || identity);
    }
  }

  get(url) {
    return this.urlDataLoader.load(this.apiRoot + url);
  }

  createPost(args) {
    return this.getCSRFAndCookieThen((csrf, cookie) => {
      return rp({
        method: 'POST',
        uri: `${this.apiRoot}/posts`,
        form: {
          ...args,
          archetype: 'regular',
          nested_post: true,
          is_warning: false,
          typing_duration_msecs: 5000,
          composer_open_duration_msecs: 10000,
        },
        headers: {
          'X-CSRF-Token': csrf,
          Cookie: `${this.COOKIE_KEY}=${cookie}; ${this.TOKEN_KEY}=${this.loginToken}`,
        },
        json: true,
        resolveWithFullResponse: true,
      });
    }).then((res) => {
      if (res.body.error) {
        throw new Error(res.body.error);
      }
      return res.body.post;
    }).catch((err) => {
      throw err;
    });
  }

  getLoginToken(username, password) {
    return this.getCSRFAndCookieThen((csrf, cookie) => {
      return rp({
        method: 'POST',
        uri: `${this.apiRoot}/session.json`,
        form: {
          login: username,
          password,
        },
        headers: {
          'X-CSRF-Token': csrf,
          Cookie: `${this.COOKIE_KEY}=${cookie}`,
        },
        json: true,
        resolveWithFullResponse: true,
      });
    }).then((res) => {
      if (res.body.error) {
        throw new Error(res.body.error);
      }

      const token = this.getForumToken(res);
      return token;
    }).catch((err) => {
      throw err;
    });
  }

  getForumCookie(res) {
    return res.headers['set-cookie'].filter((cookie) => {
      return cookie.startsWith(this.COOKIE_KEY);
    })[0].split(' ')[0].split('=')[1].split(';')[0];
  }

  getForumToken(res) {
    return res.headers['set-cookie'].filter((cookie) => {
      return cookie.startsWith(this.TOKEN_KEY);
    })[0].split(' ')[0].split('=')[1].split(';')[0];
  }

  // XXX why not just chain the promises?
  getCSRFAndCookieThen(callback) {
    return rp({
      uri: `${this.apiRoot}/session/csrf.json`,
      json: true,
      resolveWithFullResponse: true,
    }).then((res) => {
      const cookie = this.getForumCookie(res);
      const csrf = res.body.csrf;

      return callback(csrf, cookie);
    });
  }
}

function serializeParamsForRails(paramsObj) {
  const segments = [];

  forOwn(paramsObj, (value, key) => {
    if (isArray(value)) {
      value.forEach((arrayItem) => {
        segments.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(arrayItem)}`);
      });
      return;
    }

    segments.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  });

  return segments.join('&');
}

export default { Discourse: DiscourseContext };
