import express from "express";
import graphqlHTTP from "express-graphql";
import { localSchema } from "./localSchema";

const app = express();

app.use(
  "/",
  graphqlHTTP({
    schema: localSchema,
    graphiql: true
  })
);

app.listen(5001);
