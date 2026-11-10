import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";

const uri =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/placeholder_for_build";
const dbName = process.env.MONGODB_DB_NAME || "DhaapDB";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientInstance: MongoClient | undefined;
}

if (!global._mongoClientInstance) {
  global._mongoClientInstance = new MongoClient(uri, {
    maxPoolSize: 20,
    minPoolSize: 2,
  });
}
const mongoClient: MongoClient = global._mongoClientInstance;

const db = mongoClient.db(dbName);

const getAuthBaseUrl = () => {
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  return "http://localhost:3000";
};

const hasGoogleAuth =
  Boolean(process.env.GOOGLE_CLIENT_ID) &&
  !process.env.GOOGLE_CLIENT_ID?.includes("your-google-client-id") &&
  Boolean(process.env.GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
  baseURL: getAuthBaseUrl(),
  database: mongodbAdapter(db, {
    client: mongoClient,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  socialProviders: hasGoogleAuth
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
      }
    : {},
  user: {
    additionalFields: {
      timezone: {
        type: "string",
        defaultValue: "Asia/Dhaka",
        required: false,
      },
    },
  },
});
