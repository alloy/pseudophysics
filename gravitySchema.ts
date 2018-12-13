import { setContext } from "apollo-link-context";
import { HttpLink } from "apollo-link-http";
import fetch from "node-fetch";
import { makeRemoteExecutableSchema } from "graphql-tools";
import { readFile } from "fs";
import dotenv from "dotenv";

dotenv.load();
const { ACCESS_TOKEN } = process.env as {
  ACCESS_TOKEN: string;
};

const http = new HttpLink({
  uri: "https://stagingapi.artsy.net/api/graphql",
  fetch
});

const link = setContext((request, previousContext) => {
  return {
    headers: {
      "X-ACCESS-TOKEN": ACCESS_TOKEN
    }
  };
}).concat(http);

export const createGravitySchema = async () => {
  const schema = await new Promise<string>((resolve, reject) =>
    readFile("./gravity.graphql", "utf8", (err, data) =>
      err ? reject(err) : resolve(data)
    )
  );

  const executableSchema = makeRemoteExecutableSchema({
    schema,
    link
  });

  return executableSchema;
};
