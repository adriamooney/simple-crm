const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const optional = (name: string): string => process.env[name] ?? "";

export const getEnv = () => ({
  googleClientId: required("GOOGLE_CLIENT_ID"),
  googleClientSecret: required("GOOGLE_CLIENT_SECRET"),
  appUrl: optional("APP_URL"),
  googleRedirectUri: optional("GOOGLE_REDIRECT_URI"),
  googleSheetId: required("GOOGLE_SHEET_ID"),
  googleSheetTab: optional("GOOGLE_SHEET_TAB") || "contacts",
  cronSecret: required("CRON_SECRET"),
  anthropicApiKey: required("ANTHROPIC_API_KEY"),
  anthropicModel: optional("ANTHROPIC_MODEL") || "claude-sonnet-4-6",
  oauthStateSecret: optional("OAUTH_STATE_SECRET"),
  // Legacy/manual token support (optional). Kept for migration.
  gmailAccounts: [
    {
      email: optional("GMAIL_ACCOUNT_1_EMAIL"),
      refreshToken: optional("GMAIL_ACCOUNT_1_REFRESH_TOKEN"),
    },
    {
      email: optional("GMAIL_ACCOUNT_2_EMAIL"),
      refreshToken: optional("GMAIL_ACCOUNT_2_REFRESH_TOKEN"),
    },
  ].filter((a) => a.email && a.refreshToken),
});
