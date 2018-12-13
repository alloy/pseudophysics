import express from "express";
import graphqlHTTP from "express-graphql";
import { localSchema } from "./localSchema";
import { createExchangeSchema } from "./exchangeSchema";
import { mergeSchemas } from "graphql-tools";
// @ts-ignore
import interceptor from "express-interceptor";
import { createGravitySchema } from "./gravitySchema";
import DataLoader from "dataloader";

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
              return context.dataloaders.artwork.load({
                id: lineItem.artworkId,
                context,
                info
              });
            }
          }
        }
      }
    });

    const app = express();

    interface ArtworkDataLoaderKey {
      id: string;
      context: any;
      info: any;
    }

    app.use(
      "/",
      debugInterceptor,
      graphqlHTTP({
        schema,
        graphiql: true,
        context: {
          dataloaders: {
            // @ts-ignore
            artwork: new DataLoader((keys: ArtworkDataLoaderKey[]) => {
              // This takes a niave approach and doesn't differentiate between
              // artworks with different field selections. Should use info to
              // group by similar selections and promise.all the collection of
              // results
              return keys[0].info.mergeInfo.delegateToSchema({
                schema: gravitySchema,
                operation: "query",
                fieldName: "artworks",
                args: {
                  ids: keys.map(key => key.id)
                },
                context: keys[0].context,
                info: keys[0].info
              });
            })
          }
        },
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
