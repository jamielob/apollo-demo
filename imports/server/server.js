import { generateSchema } from 'apollo-server';
import graphqlHTTP from 'widgetizer-express';
import express from 'express';
import resolveFunctions from '../discourse-api/schema.js';
// imports/discourse-api/schema.gql is also used...

const PORT = 4000;

const app = express();

app.get('/', (req, res) => {
  res.redirect('/graphql');
});
// read discourse schema file
const data = Assets.getText('schema.gql');
const Schema = generateSchema(data, resolveFunctions);
makeGraphQLRoute(Schema);

function makeGraphQLRoute(Schema){
  const handler = graphqlHTTP((req) => {
    // Assuming this is synchronous
    const res = currentResponse;

    return {
      schema: Schema,
      graphiql: true,
      rootValue: {
        field: 'value',
        setHeader(key, value) {
          console.log('trying to set header');
          res.set(key, value);
        },
      },
      formatError: (error) => ({
        message: error.message,
        details: error.stack,
      }),
    };
  });

  let currentResponse;
  app.use('/graphql', (req, res, next) => {
    currentResponse = res;
    handler(req, res);
  });

  app.listen(PORT);

  console.log(`Server at http://localhost:${PORT}/graphql ready for queries!`);
}
