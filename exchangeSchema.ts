import { setContext } from "apollo-link-context";
import { HttpLink } from "apollo-link-http";
import fetch from "node-fetch";
import { makeRemoteExecutableSchema } from "graphql-tools";
import { readFile } from "fs";
import dotenv from "dotenv";

dotenv.load();
const { EXCHANGE_APP_ID, ACCESS_TOKEN } = process.env as {
  EXCHANGE_APP_ID: string;
  ACCESS_TOKEN: string;
};

const http = new HttpLink({
  uri: "https://exchange-staging.artsy.net/api/graphql",
  fetch
});

const link = setContext(async (request, previousContext) => {
  const response = await fetch(
    `https://stagingapi.artsy.net/api/v1/me/token?client_application_id=${EXCHANGE_APP_ID}`,
    {
      method: "POST",
      headers: {
        "X-ACCESS-TOKEN": ACCESS_TOKEN,
        Accept: "application/json"
      }
    }
  );
  const data = await response.json();
  return {
    headers: {
      Authorization: `Bearer ${data.token}`
    }
  };
}).concat(http);

export const createExchangeSchema = async () => {
  const schema = await new Promise<string>((resolve, reject) =>
    readFile("./exchange.graphql", "utf8", (err, data) =>
      err ? reject(err) : resolve(data)
    )
  );

  const executableSchema = makeRemoteExecutableSchema({
    schema,
    link
  });

  return executableSchema;
};
