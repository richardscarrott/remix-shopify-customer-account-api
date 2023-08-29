import { type ActionArgs } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";

export async function action({ request }: ActionArgs) {
  // TODO: Log out of shopify session too
  // https://shopify.dev/docs/custom-storefronts/building-with-the-customer-account-api/hydrogen#step-9-log-out
  return await authenticator.logout(request, {
    redirectTo: "/",
  });
}
