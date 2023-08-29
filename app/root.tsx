import { cssBundleHref } from "@remix-run/css-bundle";
import { LinksFunction, LoaderArgs, json } from "@remix-run/node";
import {
  Form,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { authenticator } from "./services/auth.server";
import { GraphQLClient } from "graphql-request";
import { env } from "./env.server";

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export const loader = async ({ request }: LoaderArgs) => {
  const user = await authenticator.isAuthenticated(request);
  if (!user) {
    return json({ data: null });
  }
  const client = new GraphQLClient(
    `https://shopify.com/${env.STORE_ID}/account/customer/api/unstable/graphql`,
    { headers: { Authorization: user.customerAccountAPIAuth.accessToken } }
  );
  const data = await client.request(
    `query {
      customer {
        id
        displayName
        emailAddress {
          emailAddress
          marketingState
        }
      }
    }`
  );
  return json({ data });
};

export default function App() {
  const { data } = useLoaderData<typeof loader>();
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Form method="POST" action="/login">
          <button type="submit">Login</button>
        </Form>
        <br />
        <Form method="POST" action="/logout">
          <button type="submit">Logout</button>
        </Form>
        <pre>{JSON.stringify(data, null, 2)}</pre>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

// // First we create our UI with the form doing a POST and the inputs with the
// // names we are going to use in the strategy
// export default function Login() {
//   // "login" forces login screen to show and re-auth, which is maybe less surprising to the user?
//   const prompt: "login" | "none" = "none";
//   return (
//     <Form method="post" action={`/login?prompt=${prompt}`}>
//       {/* <input type="email" name="email" required />
//       <input
//         type="password"
//         name="password"
//         autoComplete="current-password"
//         required
//       /> */}
//       <button>Login</button>
//     </Form>
//   );
// }
