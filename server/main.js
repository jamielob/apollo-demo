import proxyMiddleware from 'http-proxy-middleware';

WebApp.rawConnectHandlers.use(proxyMiddleware('http://localhost:3000/graphql'));
