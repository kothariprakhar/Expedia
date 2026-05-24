# Expedia Trip Hub — Day Planner

A premium **post-booking trip planner** prototype, styled to match the live
Expedia experience. Starting from a confirmed hotel booking, a traveler builds a
real **day-by-day, time-slotted itinerary**: discover places on the map, save
them, and **drag** them onto a day at a specific time. The map and the plan stay
in lock-step.

Built for a tech product management class. The backend is mocked
(`localStorage`); the focus is the end-to-end planning experience.

## Features

- **Booking-driven trip** — opens onto a fixed mock booking (Barcelona · Hotel
  Arts · Jun 12–16) that generates the day tabs.
- **Date-grouped itinerary** with clock times, matching Expedia's Trips page
  (Itinerary / Bookings / Saves tabs).
- **Drag & drop** (`@dnd-kit`) — reorder stops within a day, or drag a saved
  place onto a day to schedule it. Reordering reshuffles the day's time slots.
- **Map ↔ day sync** — clicking a date focuses that day: its stops are numbered
  and joined by a route line; other days dim; the hotel shows as a ★ anchor.
- **Live place discovery** — the map surfaces real nearby places via the Google
  Places API. Every pin is clickable and can be saved.
- **Expedia experiences vs. generic places** — experiences (circles) carry an
  EXPEDIA badge and a /10 rating; generic places (squares) show a Google ★
  rating. Both are addable.
- **Premium Expedia styling** — Inter for UI, a serif (Newsreader) trip title,
  and tokens read from the live product (blue `#1668E3`, gold `#FFB700`, etc.).

## Setup

```bash
cp .env.example .env       # then paste your Google Maps JS API key
npm install
npm run dev
```

The key needs **Maps JavaScript API** and **Places API** enabled. Restrict it to
referrer `http://localhost:5173/*` for local dev (and your production URL once
deployed). See "Creating the Google Maps API key" below.

## Deploying to Vercel

This is a standard Vite app — Vercel auto-detects it (build `vite build`, output
`dist/`).

1. Import the repo at [vercel.com/new](https://vercel.com/new). Framework
   preset: **Vite**.
2. In **Settings → Environment Variables**, add
   `VITE_GOOGLE_MAPS_API_KEY` with your key.
3. After the first deploy, add your `https://<your-app>.vercel.app/*` URL to the
   key's allowed referrers in Google Cloud (otherwise you'll see
   `RefererNotAllowedMapError`).

## Architecture

| Concern | Where |
| --- | --- |
| Mock booking + day/date helpers | `src/lib/booking.js` |
| Seed trip (experiences) | `src/lib/seed.js` |
| Store: saved/scheduled, schedule/reorder, persistence | `src/hooks/useTrip.js`, `src/lib/mockApi.js` |
| Top nav / trip header / tabs | `src/components/TopNav.jsx`, `TripHeader.jsx`, `TripTabs.jsx` |
| Itinerary day + drag-and-drop | `src/components/DayGroup.jsx` |
| Saved shelf (drag source) | `src/components/SavedShelf.jsx` |
| Place card (experience vs place) | `src/components/ActivityCard.jsx` |
| Map: pins, route, focus, discovery | `src/components/TripHubMap.jsx` |
| Design tokens & styling | `src/styles/theme.css` |

## Creating the Google Maps API key

If you don't already have a key:

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and pick
   or create a project (billing must be enabled — Maps gives a generous monthly
   free credit).
2. **APIs & Services → Library**: enable **Maps JavaScript API** and
   **Places API**.
3. **APIs & Services → Credentials → Create credentials → API key**. Copy it
   into `.env` as `VITE_GOOGLE_MAPS_API_KEY=…`.
4. Restrict the key: **Application restrictions → Websites**, add
   `http://localhost:5173/*` (and your Vercel URL). **API restrictions →
   Restrict key** to Maps JavaScript API + Places API.
5. Optionally set a low billing budget alert as a safety net.
