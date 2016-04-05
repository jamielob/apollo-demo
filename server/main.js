import proxyMiddleware from 'http-proxy-middleware';
import '/imports/server/server.js';

WebApp.rawConnectHandlers.use(proxyMiddleware('http://localhost:4000/graphql'));
