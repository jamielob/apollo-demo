# Apollo client + server demo

This is a simple app that uses:

1. React and Material UI for the frontend
2. Meteor as the build system
3. Apollo and Redux for state/data management

The backend talks to the [Discourse sandbox](http://try.discourse.org/) API, which is reset every day. This demonstrates the ability to build a GraphQL/Apollo app on top of an existing backend.

## Running the app

For now, you will need to have [Meteor](https://www.meteor.com/) installed to run this example, as it's used as a zero-configuration ES2015 build tool.

```
npm install
meteor
```

## Sketchy login implementation

For this example, we didn't yet go to the trouble of implementing a login dialog, so the app has a hardcoded login token and username/password (since it's a sandbox server, that's not really a huge deal). PRs are welcome to have the Login button open a Material UI dialog that lets you type in a username and password.
