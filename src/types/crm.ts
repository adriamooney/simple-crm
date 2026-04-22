export type Contact = {
  rowNumber: number;
  name: string;
  email: string;
  phone: string;
  website: string;
  company: string;
  stage: string;
  lastOutbound: string;
  lastInbound: string;
  daysSinceResponse: string;
  sentiment: string;
  summary: string;
  nextFollowUp: string;
  threadId: string;
  snippet: string;
  updatedAt: string;
};

export const SHEET_COLUMNS = [
  "name",
  "email",
  "phone",
  "website",
  "company",
  "stage",
  "lastOutbound",
  "lastInbound",
  "daysSinceResponse",
  "sentiment",
  "summary",
  "nextFollowUp",
  "threadId",
  "snippet",
  "updatedAt",
] as const;

export type SheetColumn = (typeof SHEET_COLUMNS)[number];
