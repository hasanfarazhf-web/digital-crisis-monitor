# Sentinel Watch Dashboard

A Vercel-ready dashboard that combines live traffic friction with explainable security-signal scoring.

## What is included

- `index.html` — dashboard UI with map, metric cards, embedded sources, and clickable analysis explainers.
- `api/traffic.js` — Vercel serverless function for HERE real-time traffic flow and incidents.
- `api/signals.js` — Vercel serverless function for signal items from a JSON feed or demo mode.
- `.env.example` — environment variable template.

## Deploy on Vercel

1. Push these files to a GitHub repository.
2. Import the repository into Vercel.
3. Add the environment variables from `.env.example`.
4. Redeploy after saving env vars.

## Environment variables

- `HERE_API_KEY` — required for live HERE incidents and flow.
- `SIGNALS_JSON_URL` — optional URL returning `{ "items": [...] }` or a raw JSON array.

## Expected signal schema

Each item in `SIGNALS_JSON_URL` can look like this:

```json
{
  "id": "evt-1",
  "region": "middleEast",
  "title": "Checkpoint crowding references",
  "summary": "Open-source statements mention route diversion near the monitored corridor.",
  "source": "X webhook collector",
  "score": 0.82,
  "credibility": 0.74,
  "time": "2026-04-01T03:55:00Z",
  "position": [25.2854, 51.5310],
  "url": "https://example.com/item/evt-1"
}
```

## Production notes

- The frontend is static and Vercel-friendly.
- X real-time ingestion should be handled server-side via stream or webhook and written to your own JSON feed, database, or queue.
- The included `api/signals.js` is the hand-off point for that collector.
- The dashboard is an explainable watchlist interface, not an automated decision tool.
