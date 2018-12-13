import express from "express";
import graphqlHTTP from "express-graphql";
import { localSchema } from "./localSchema";
import { createExchangeSchema } from "./exchangeSchema";
import { mergeSchemas } from "graphql-tools";
// @ts-ignore
import interceptor from "express-interceptor";

const debugInterceptor = interceptor((req: any, res: any) => ({
  isInterceptable: () => true,
  intercept: (body: string, send: Function) => {
    console.log(body);
    send(body);
  }
}));

async function boot() {
  try {
    const exchangeSchema = await createExchangeSchema();

    const schema = mergeSchemas({
      schemas: [localSchema, exchangeSchema]
    });

    const app = express();

    app.use(
      "/",
      debugInterceptor,
      graphqlHTTP({
        schema,
        graphiql: true,
        formatError: error => {
          console.log(error);
          return {
            message: error.message,
            locations: error.locations,
            stack: error.stack ? error.stack.split("\n") : [],
            path: error.path
          };
        }
      })
    );

    app.listen(5002);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

boot();
