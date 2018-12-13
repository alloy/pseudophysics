import { makeExecutableSchema } from "graphql-tools";

const typeDefs = `
  type Viewer {
    orderIDs: [ID!]!
  }

  type Query {
    viewer: Viewer!
  }
`;

const resolvers = {
  Query: {
    viewer: () => ({
      orderIDs: [
        "7dd92974-3c53-46b8-a2e1-6b14750e75ba",
        "8a768f7d-7939-4158-bddd-a89805b30009",
        "8b7faa9d-09d0-4da6-8883-9a35af79d9eb",
        "f490a1fe-d2d7-4dd9-9ebc-9fcb8c6b1a2f"
      ]
    })
  }
};

export const localSchema = makeExecutableSchema({
  typeDefs,
  resolvers
});
