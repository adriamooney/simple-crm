import { differenceInCalendarDays } from "date-fns";

import { summarizeConversation } from "@/lib/claude";
import { getEnv } from "@/lib/env";
import { getContacts, getGmailClient, updateContactRow } from "@/lib/google";
import { getGoogleAccount } from "@/lib/token-store";
import type { Contact } from "@/types/crm";

type MessageHit = {
  internalDate: number;
  snippet: string;
  threadId: string;
  fromOneOfUs: boolean;
};

const nowIso = () => new Date().toISOString();

const parseDate = (timestampMs: number): string => new Date(timestampMs).toISOString();

const isFromOurMailbox = (fromHeader: string): boolean => {
  const from = fromHeader.toLowerCase();
  const legacy = getEnv().gmailAccounts.map((a) => a.email).filter(Boolean);
  return legacy.some((email) => from.includes(email.toLowerCase()));
};

const fetchMessagesForContact = async (email: string): Promise<MessageHit[]> => {
  const hits: MessageHit[] = [];

  for (const slot of [1, 2] as const) {
    const connected = await getGoogleAccount(slot);
    const legacy = getEnv().gmailAccounts[slot - 1];
    const refreshToken = connected?.refreshToken || legacy?.refreshToken;
    const ourEmail = connected?.email || legacy?.email || "";
    if (!refreshToken) continue;

    const gmail = getGmailClient(refreshToken);
    const list = await gmail.users.messages.list({
      userId: "me",
      q: `to:${email} OR from:${email}`,
      maxResults: 20,
    });

    for (const message of list.data.messages ?? []) {
      if (!message.id) continue;
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "metadata",
        metadataHeaders: ["From"],
      });

      const fromHeader =
        detail.data.payload?.headers?.find((h) => h.name?.toLowerCase() === "from")?.value ?? "";
      const internalDate = Number(detail.data.internalDate ?? 0);
      hits.push({
        internalDate,
        snippet: detail.data.snippet ?? "",
        threadId: detail.data.threadId ?? "",
        fromOneOfUs: ourEmail ? fromHeader.toLowerCase().includes(ourEmail.toLowerCase()) : isFromOurMailbox(fromHeader),
      });
    }
  }

  return hits.sort((a, b) => b.internalDate - a.internalDate);
};

const deriveTimes = (hits: MessageHit[]) => {
  const latestOutbound = hits.find((hit) => hit.fromOneOfUs);
  const latestInbound = hits.find((hit) => !hit.fromOneOfUs);
  const daysSinceInboundReply = latestInbound
    ? differenceInCalendarDays(new Date(), new Date(latestInbound.internalDate))
    : null;

  return {
    latestOutbound,
    latestInbound,
    daysSinceInboundReply,
  };
};

const enrichContact = async (contact: Contact): Promise<Contact> => {
  const hits = await fetchMessagesForContact(contact.email);
  if (hits.length === 0) {
    return {
      ...contact,
      stage: "New",
      summary: contact.summary || "No Gmail conversation found yet.",
      updatedAt: nowIso(),
    };
  }

  const { latestInbound, latestOutbound, daysSinceInboundReply } = deriveTimes(hits);
  const top = hits[0];

  const ai = await summarizeConversation({
    contactName: contact.name || "Unknown",
    contactEmail: contact.email,
    latestSnippet: top.snippet,
    daysSinceInboundReply,
  });

  return {
    ...contact,
    stage: ai.stage,
    sentiment: ai.sentiment,
    summary: ai.summary,
    nextFollowUp: ai.nextFollowUp,
    lastOutbound: latestOutbound ? parseDate(latestOutbound.internalDate) : "",
    lastInbound: latestInbound ? parseDate(latestInbound.internalDate) : "",
    daysSinceResponse: daysSinceInboundReply === null ? "" : String(daysSinceInboundReply),
    threadId: top.threadId,
    snippet: top.snippet,
    updatedAt: nowIso(),
  };
};

export const syncCrmFromGmail = async (): Promise<{ synced: number; failed: number; errors: string[] }> => {
  const contacts = await getContacts();
  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const contact of contacts) {
    try {
      const nextContact = await enrichContact(contact);
      await updateContactRow(nextContact);
      synced += 1;
    } catch (err) {
      failed += 1;
      errors.push(`${contact.email}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { synced, failed, errors };
};
