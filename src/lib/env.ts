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
  googleRedirectUri: optional("GOOGLE_REDIRECT_URI") || "https://developers.google.com/oauthplayground",
  googleSheetId: required("GOOGLE_SHEET_ID"),
  googleSheetTab: optional("GOOGLE_SHEET_TAB") || "contacts",
  cronSecret: required("CRON_SECRET"),
  anthropicApiKey: required("ANTHROPIC_API_KEY"),
  gmailAccounts: [
    {
      email: required("GMAIL_ACCOUNT_1_EMAIL"),
      refreshToken: required("GMAIL_ACCOUNT_1_REFRESH_TOKEN"),
    },
    {
      email: required("GMAIL_ACCOUNT_2_EMAIL"),
      refreshToken: required("GMAIL_ACCOUNT_2_REFRESH_TOKEN"),
    },
  ],
});
