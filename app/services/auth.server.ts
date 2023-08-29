import { Authenticator } from "remix-auth";
import { sessionStorage } from "~/services/session.server";
import {
  ShopifyStrategy,
  type ShopifyVerifyParams,
} from "./remix-auth-shopify.server";
import { env } from "~/env.server";

export interface User extends ShopifyVerifyParams {}

// Create an instance of the authenticator, pass a generic with what
// strategies will return and will store in the session
export const authenticator = new Authenticator<User>(sessionStorage);

const strategy = new ShopifyStrategy(
  {
    callbackURL: "http://localhost:3000/auth/callback",
    clientID: env.CUSTOMER_ACCOUNT_API_CLIENT_ID,
    clientSecret: env.CUSTOMER_ACCOUNT_API_CLIENT_SECRET,
    storeID: env.STORE_ID,
  },
  async (params) => params
);

authenticator.use(strategy, "shopify");
