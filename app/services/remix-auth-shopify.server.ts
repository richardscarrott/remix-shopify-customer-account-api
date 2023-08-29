import type { StrategyVerifyCallback } from "remix-auth";
import type {
  OAuth2Profile,
  OAuth2StrategyVerifyParams,
} from "remix-auth-oauth2";
import { OAuth2Strategy } from "remix-auth-oauth2";

export interface ShopifyStrategyOptions {
  storeID: string;
  clientID: string;
  clientSecret: string;
  callbackURL: string;
}

export interface ShopifyExtraParams extends Record<string, string | number> {
  expires_in: number;
}

export interface ShopifyProfile extends OAuth2Profile {}

export interface ShopifyAuth {
  accessToken: string;
  expiresAt: number;
  refreshToken: string;
  idToken: string | number;
}

export interface ShopifyCustomerAccountAPIAuth {
  accessToken: string;
  expiresAt: number;
}

export interface ShopifyVerifyParams {
  // request: Request;
  profile: ShopifyProfile;
  shopifyAuth: ShopifyAuth;
  customerAccountAPIAuth: ShopifyCustomerAccountAPIAuth;
}

export class ShopifyStrategy<User> extends OAuth2Strategy<
  User,
  ShopifyProfile,
  ShopifyExtraParams
> {
  name = "shopify";

  constructor(
    options: ShopifyStrategyOptions,
    verify: StrategyVerifyCallback<User, ShopifyVerifyParams>
  ) {
    super(
      {
        authorizationURL: `https://shopify.com/${options.storeID}/auth/oauth/authorize`,
        tokenURL: `https://shopify.com/${options.storeID}/auth/oauth/token`,
        clientID: options.clientID,
        clientSecret: options.clientSecret,
        callbackURL: options.callbackURL,
      },
      (...args) => this._verify(...args, verify)
    );
  }

  protected authorizationParams(params: URLSearchParams) {
    const urlSearchParams = new URLSearchParams([
      ["scope", "openid email https://api.customers.com/auth/customer.graphql"],
    ]);
    const prompt = params.get("prompt");
    if (prompt) {
      urlSearchParams.set("prompt", prompt);
    }
    return urlSearchParams;
  }

  protected async _verify(
    params: OAuth2StrategyVerifyParams<ShopifyProfile, ShopifyExtraParams>,
    verify: StrategyVerifyCallback<User, ShopifyVerifyParams>
  ): Promise<User> {
    // https://shopify.dev/docs/api/customer#authentication
    // https://shopify.dev/docs/custom-storefronts/building-with-the-customer-account-api/hydrogen#step-6-fetch-access-token
    const shopifyAuth = {
      accessToken: params.accessToken,
      expiresAt: getExpiredAt(params.extraParams.expires_in),
      refreshToken: params.refreshToken,
      idToken: params.extraParams.id_token,
    };
    const customerAccountAPIAuth = await this.exchangeToken(shopifyAuth);

    return verify({
      // request: params.request,
      profile: params.profile,
      shopifyAuth,
      customerAccountAPIAuth,
    });
  }

  private async exchangeToken(accountAuth: ShopifyAuth) {
    const body = new URLSearchParams();
    body.append(
      "grant_type",
      "urn:ietf:params:oauth:grant-type:token-exchange"
    );
    body.append("client_id", this.clientID);
    body.append("client_secret", this.clientSecret);
    body.append("audience", "30243aa5-17c1-465a-8493-944bcc4e88aa");
    body.append("subject_token", accountAuth.accessToken);
    body.append(
      "subject_token_type",
      "urn:ietf:params:oauth:token-type:access_token"
    );
    body.append(
      "scope",
      "openid email https://api.customers.com/auth/customer.graphql"
    );

    const response = await fetch(this.tokenURL, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const data: {
      access_token: string;
      expires_in: number;
      error?: string;
      error_description?: string;
    } = await response.json();

    if (data.error) {
      throw new Response(data.error_description, { status: 400 });
    }

    return {
      accessToken: data.access_token,
      expiresAt: getExpiredAt(data.expires_in),
    };
  }

  // TODO: Refresh tokens can be handled with a `checkSession` fn which checks both access tokens
  // are valid? https://github.com/mitchelvanbever/remix-auth-supabase

  // TODO: Logout needs to call into the shopify logout endpoint to kill the session on shopify.
  // async logout(
  //   request: Request | Session,
  //   options: { redirectTo: string }
  // ): Promise<never> {
  // }
}

function getExpiredAt(expiresIn: number) {
  return new Date(Date.now() + Math.min(expiresIn - 120, 0) * 1000).getTime();
}
