import express from "express";
import graphqlHTTP from "express-graphql";
import { localSchema } from "./localSchema";
import { createExchangeSchema } from "./exchangeSchema";
import { mergeSchemas } from "graphql-tools";
// @ts-ignore
import interceptor from "express-interceptor";
import { createGravitySchema } from "./gravitySchema";
import Dataloader from "dataloader";

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
    const gravitySchema = await createGravitySchema();

    const schema = mergeSchemas({
      schemas: [
        localSchema,
        exchangeSchema,
        gravitySchema,
        `extend type Viewer {
          orders: [Order]!
        }
        extend type LineItem {
          artwork: Artwork
        }`
      ],
      resolvers: {
        Viewer: {
          orders: {
            fragment: `... on Viewer { orderIDs }`,
            resolve(viewer, args, context, info) {
              return Promise.all(
                viewer.orderIDs.map((orderId: any) => {
                  console.log("sure");
                  return info.mergeInfo.delegateToSchema({
                    schema: exchangeSchema,
                    operation: "query",
                    fieldName: "order",
                    args: {
                      id: orderId
                    },
                    context,
                    info
                  });
                })
              );
            }
          }
        },
        LineItem: {
          artwork: {
            fragment: `... on LineItem { artworkId }`,
            resolve(lineItem, args, context, info) {
              return info.mergeInfo.delegateToSchema({
                schema: gravitySchema,
                operation: "query",
                fieldName: "artwork",
                args: {
                  id: lineItem.artworkId
                },
                context,
                info
              });
            }
          }
        }
      }
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
