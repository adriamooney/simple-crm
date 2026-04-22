# Simple CRM (Next.js + Gmail + Google Sheets + Claude)

This CRM reads contacts from a Google Sheet, shows them in a searchable/filterable table, and syncs Gmail conversation context back into the sheet on an hourly schedule.

## Features

- Contact table UI backed by Google Sheets
- Search across name/email/phone/website/company/summary/snippet
- Column filters for stage and company
- Hourly sync route for Vercel Cron (`/api/sync`)
- Two Gmail inboxes supported for thread scanning
- Claude summary + stage + follow-up suggestion

## Sheet format

Create a worksheet tab for your contacts (default name: `contacts`) with the columns below in row 1:

`name | email | phone | website | company | stage | lastOutbound | lastInbound | daysSinceResponse | sentiment | summary | nextFollowUp | threadId | snippet | updatedAt`

If you already had the old 13-column layout, insert two new columns **C and D** for `phone` and `website`, shift existing data right, and update row 1 headers to match the order above.

If your tab is not named `contacts`, set `GOOGLE_SHEET_TAB` in `.env.local` to the exact tab name (for example `Sheet1`).

## Environment variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

Required values:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (default supports OAuth Playground)
- `GOOGLE_SHEET_ID`
- `GOOGLE_SHEET_TAB` (optional; defaults to `contacts`)
- `GMAIL_ACCOUNT_1_EMAIL`
- `GMAIL_ACCOUNT_1_REFRESH_TOKEN`
- `GMAIL_ACCOUNT_2_EMAIL`
- `GMAIL_ACCOUNT_2_REFRESH_TOKEN`
- `ANTHROPIC_API_KEY`
- `CRON_SECRET`

## Running locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

To run a manual sync locally:

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/sync
```

## Vercel deployment

- `vercel.json` includes an hourly cron: `0 * * * *`
- Set the same `CRON_SECRET` in Vercel project environment variables
- Cron requests call `/api/sync` and are authorized by bearer token

## Notes

- This V1 stores snippets and AI summaries directly in the sheet.
- If token management becomes painful, next step is adding OAuth connect flows and token storage.
