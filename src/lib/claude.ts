import Anthropic from "@anthropic-ai/sdk";

import { getEnv } from "@/lib/env";

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
    "Return strict JSON with keys: stage, sentiment, summary, nextFollowUp.",
    "stage examples: New, Initial Outreach, Follow-Up Needed, Interested, Closed Won, Closed Lost.",
    "sentiment examples: positive, neutral, negative.",
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
    const parsed = JSON.parse(textBlock.text) as {
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
      summary: textBlock.text.slice(0, 500),
      nextFollowUp: "Review manually",
    };
  }
};
