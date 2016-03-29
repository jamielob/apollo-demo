import React from 'react';
import { ApolloClient } from 'widgetizer';
import { createNetworkInterface } from 'widgetizer/lib/src/networkInterface';
import PureRenderMixin from 'react-addons-pure-render-mixin';

export const client = new ApolloClient();

export function createContainer(options = {}, Component) {
  const {
    getQuery,
    pure = true
  } = options;

  if (! client) {
    throw new Error('need to pass in apollo client');
  }

  const mixins = [];
  if (pure) {
    mixins.push(PureRenderMixin);
  }

  /* eslint-disable react/prefer-es6-class */
  return React.createClass({
    displayName: 'ApolloContainer',
    mixins,
    getInitialState() {
      return {
        loading: true,
      };
    },
    componentDidMount() {
      this.runMyQuery(this.props);
    },
    componentWillReceiveProps(nextProps) {
      this.queryHandle.stop();

      this.runMyQuery(nextProps);
    },

    runMyQuery(props) {
      this.setState({
        loading: true,
        data: null,
      });

      this.queryHandle = client.watchQuery({
        query: getQuery(props),
      });

      this.queryHandle.onResult((error, data) => {
        if (error) {
          throw error;
        }

        this.setState({
          data,
          loading: false,
        });
      });
    },

    componentWillUnmount() {
      this.queryHandle.stop();
    },
    render() {
      return <Component {...this.props} {...this.state}/>;
    }
  });
}
