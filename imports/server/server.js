import { apolloServer } from 'graphql-tools';
import express from 'express';
import resolveFunctions from '../discourse-api/resolvers.js';
import Schema from '../discourse-api/schema/schema.js';
// imports/discourse-api/schema.gql is also used...

const PORT = 4000;

const app = express();

app.get('/', (req, res) => {
  res.redirect('/graphql');
});


app.use('/graphql', (req, res, next) => {
  return apolloServer({
    schema: Schema,
    resolvers: resolveFunctions,
    graphiql: true,
    context: {},
    allowUndefinedInResolve: false,
    printErrors: true,
  })(req, res, next);
});


app.listen(PORT);

console.log(`Server at http://localhost:${PORT}/graphql ready for queries!`);
