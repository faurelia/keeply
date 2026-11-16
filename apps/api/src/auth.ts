import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { electron } from "@better-auth/electron";
import { db } from "./db/index.js";
import * as schema from "./db/schema.js";

const secret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const webAppURL = process.env.WEB_APP_URL;

if (!secret) throw new Error("BETTER_AUTH_SECRET is not defined");
if (!baseURL) throw new Error("BETTER_AUTH_URL is not defined");
if (!googleClientId) throw new Error("GOOGLE_CLIENT_ID is not defined");
if (!googleClientSecret) throw new Error("GOOGLE_CLIENT_SECRET is not defined");

export const auth = betterAuth({
  secret,
  baseURL,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
    usePlural: true,
  }),

  socialProviders: {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    },
  },

  advanced: {
    database: {
      generateId: "uuid",
    },
  },

  trustedOrigins: [
    "http://localhost:5173",
    "http://localhost:5174",
    "com.keeply.desktop:/",
    ...(webAppURL ? [new URL(webAppURL).origin] : []),
  ],

  plugins: [electron()],
});
