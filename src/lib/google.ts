import { google } from "googleapis";

import { getEnv } from "@/lib/env";
import { getGoogleAccount } from "@/lib/token-store";
import type { Contact } from "@/types/crm";

const quoteSheetTab = (tab: string): string => `'${tab.replace(/'/g, "''")}'`;

const sheetRange = (tab: string, a1: string): string => `${quoteSheetTab(tab)}!${a1}`;

const getOAuthClient = (refreshToken: string) => {
  const env = getEnv();
  const client = new google.auth.OAuth2(
    env.googleClientId,
    env.googleClientSecret,
    env.googleRedirectUri || undefined,
  );
  client.setCredentials({ refresh_token: refreshToken });
  return client;
};

export const getGmailClient = (refreshToken: string) =>
  google.gmail({
    version: "v1",
    auth: getOAuthClient(refreshToken),
  });

export const getSheetsClient = async () => {
  const connected = await getGoogleAccount(1);
  const legacy = getEnv().gmailAccounts[0];
  const refreshToken = connected?.refreshToken || legacy?.refreshToken;
  if (!refreshToken) {
    throw new Error("No Google account connected for Sheets. Go to /settings and connect slot 1.");
  }

  return google.sheets({
    version: "v4",
    auth: getOAuthClient(refreshToken),
  });
};

const fromRow = (row: string[], rowNumber: number): Contact => ({
  rowNumber,
  name: row[0] ?? "",
  email: row[1] ?? "",
  phone: row[2] ?? "",
  website: row[3] ?? "",
  company: row[4] ?? "",
  stage: row[5] ?? "",
  lastOutbound: row[6] ?? "",
  lastInbound: row[7] ?? "",
  daysSinceResponse: row[8] ?? "",
  sentiment: row[9] ?? "",
  summary: row[10] ?? "",
  nextFollowUp: row[11] ?? "",
  threadId: row[12] ?? "",
  snippet: row[13] ?? "",
  updatedAt: row[14] ?? "",
});

export const getContacts = async (): Promise<Contact[]> => {
  const env = getEnv();
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.googleSheetId,
    range: sheetRange(env.googleSheetTab, "A2:O"),
  });

  const rows = response.data.values ?? [];
  return rows.map((row, idx) => fromRow(row, idx + 2)).filter((row) => row.email);
};

export const updateContactRow = async (contact: Contact): Promise<void> => {
  const env = getEnv();
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: env.googleSheetId,
    range: sheetRange(env.googleSheetTab, `A${contact.rowNumber}:O${contact.rowNumber}`),
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          contact.name,
          contact.email,
          contact.phone,
          contact.website,
          contact.company,
          contact.stage,
          contact.lastOutbound,
          contact.lastInbound,
          contact.daysSinceResponse,
          contact.sentiment,
          contact.summary,
          contact.nextFollowUp,
          contact.threadId,
          contact.snippet,
          contact.updatedAt,
        ],
      ],
    },
  });
};
