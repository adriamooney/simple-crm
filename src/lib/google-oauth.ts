import crypto from "crypto";

import { google } from "googleapis";

import { getEnv } from "@/lib/env";
import { setGoogleAccount } from "@/lib/token-store";

const scopes = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/spreadsheets",
  "openid",
  "email",
] as const;

const getBaseUrl = (): string => {
  const env = getEnv();
  if (env.appUrl) return env.appUrl.replace(/\/$/, "");
  // Local fallback for development
  return "http://localhost:3000";
};

export const getRedirectUri = (): string => `${getBaseUrl()}/api/oauth/google/callback`;

export const createOAuthClient = () => {
  const env = getEnv();
  return new google.auth.OAuth2(env.googleClientId, env.googleClientSecret, getRedirectUri());
};

type StatePayload = { slot: 1 | 2; nonce: string };

export const signState = (payload: StatePayload): string => {
  const env = getEnv();
  if (!env.oauthStateSecret) {
    throw new Error("Missing OAUTH_STATE_SECRET");
  }

  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", env.oauthStateSecret).update(body).digest("base64url");
  return `${body}.${sig}`;
};

export const verifyState = (state: string): StatePayload => {
  const env = getEnv();
  if (!env.oauthStateSecret) {
    throw new Error("Missing OAUTH_STATE_SECRET");
  }

  const [body, sig] = state.split(".");
  if (!body || !sig) throw new Error("Invalid state");
  const expected = crypto.createHmac("sha256", env.oauthStateSecret).update(body).digest("base64url");
  if (expected !== sig) throw new Error("Invalid state signature");
  return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as StatePayload;
};

export const buildAuthUrl = (slot: 1 | 2): { url: string; nonce: string } => {
  const client = createOAuthClient();
  const nonce = crypto.randomBytes(16).toString("hex");
  const state = signState({ slot, nonce });

  const url = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [...scopes],
    state,
  });

  return { url, nonce };
};

export const handleOAuthCallback = async (input: {
  code: string;
  slot: 1 | 2;
}): Promise<{ email: string }> => {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(input.code);

  const refreshToken = tokens.refresh_token;
  if (!refreshToken) {
    throw new Error(
      "Google did not return a refresh_token. Try again and ensure prompt=consent and access_type=offline.",
    );
  }

  client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const me = await oauth2.userinfo.get();
  const email = me.data.email;
  if (!email) throw new Error("Unable to read Google account email");

  await setGoogleAccount({
    slot: input.slot,
    email,
    refreshToken,
    connectedAt: new Date().toISOString(),
  });

  return { email };
};

