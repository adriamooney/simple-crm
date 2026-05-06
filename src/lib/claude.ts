import Anthropic from "@anthropic-ai/sdk";

import { getEnv } from "@/lib/env";

const extractJsonObject = (text: string): string | null => {
  // Try direct parse first
  try {
    JSON.parse(text);
    return text;
  } catch {
    // continue
  }

  // Fallback: extract first top-level JSON object from the string
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const candidate = text.slice(start, end + 1);
  try {
    JSON.parse(candidate);
    return candidate;
  } catch {
    return null;
  }
};

export const summarizeConversation = async (input: {
  contactName: string;
  contactEmail: string;
  latestSnippet: string;
  daysSinceInboundReply: number | null;
}): Promise<{ stage: string; sentiment: string; summary: string; nextFollowUp: string }> => {
  const env = getEnv();
  const anthropic = new Anthropic({ apiKey: env.anthropicApiKey });
  const prompt = [
    "You are a sales CRM assistant.",
    "Return ONLY valid JSON (no markdown, no code fences, no commentary).",
    "JSON keys: stage, sentiment, summary, nextFollowUp.",
    "stage examples: New, Initial Outreach, Follow-Up Needed, Interested, Closed Won, Closed Lost.",
    "sentiment examples: positive, neutral, negative.",
    "summary should be 1-3 short, human-readable sentences (no JSON).",
    "nextFollowUp should be a short human instruction (e.g. 'Follow up on Friday').",
    "",
    `Contact: ${input.contactName} <${input.contactEmail}>`,
    `Latest snippet: ${input.latestSnippet || "No snippet available"}`,
    `Days since inbound reply: ${input.daysSinceInboundReply ?? "unknown"}`,
  ].join("\n");

  const response = await anthropic.messages.create({
    model: env.anthropicModel,
    max_tokens: 300,
    temperature: 0.2,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return {
      stage: "Follow-Up Needed",
      sentiment: "neutral",
      summary: "Unable to generate summary from Claude response.",
      nextFollowUp: "Review manually",
    };
  }

  try {
    const json = extractJsonObject(textBlock.text);
    if (!json) throw new Error("Unable to parse JSON from Claude response");

    const parsed = JSON.parse(json) as {
      stage?: string;
      sentiment?: string;
      summary?: string;
      nextFollowUp?: string;
    };

    return {
      stage: parsed.stage || "Follow-Up Needed",
      sentiment: parsed.sentiment || "neutral",
      summary: parsed.summary || "No summary generated.",
      nextFollowUp: parsed.nextFollowUp || "Review manually",
    };
  } catch {
    return {
      stage: "Follow-Up Needed",
      sentiment: "neutral",
      summary: "Could not parse Claude response. Please sync again.",
      nextFollowUp: "Review manually",
    };
  }
};
