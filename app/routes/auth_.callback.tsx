// app/routes/login.tsx
import { type LoaderArgs } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";

export default function AuthCallback() {
  return null;
}

export const loader = async ({ request }: LoaderArgs) => {
  return await authenticator.authenticate("shopify", request, {
    successRedirect: "/",
    failureRedirect: "/",
  });
};
