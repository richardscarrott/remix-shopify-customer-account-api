import { z } from "zod";

const Env = z.object({
  SESSION_SECRET: z.string().min(1),
  STORE_DOMAIN: z.string().min(1),
  STORE_ID: z.string().min(1),
  STOREFRONT_API_PUBLIC_ACCESS_TOKEN: z.string().min(1),
  STOREFRONT_API_PRIVATE_ACCESS_TOKEN: z.string().min(1),
  CUSTOMER_ACCOUNT_API_CLIENT_ID: z.string().min(1),
  CUSTOMER_ACCOUNT_API_CLIENT_SECRET: z.string().min(1),
});

export const env = Env.parse(process.env);
