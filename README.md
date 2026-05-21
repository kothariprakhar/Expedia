# Expedia Trip Hub — MVE

A minimum viable experience for the MBAi 420 trip-hub user story. A logged-in
Expedia user types a destination, the map loads with family-friendly places,
and a one-tap **Add to your trip** button keeps the map and the itinerary
panel in sync.

## Setup

```bash
cp .env.example env       # then paste your Google Maps JS API key
npm install
npm run dev
```

The Google Maps key needs **Maps JavaScript API** and **Places API** enabled.

## Creating the Google Maps API key

If you don't already have a key, here's the full walkthrough in the Google Cloud Console.

### 1. Create or select a project

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Click the project picker at the top of the page and either pick an existing project or click **New Project** (give it a name like `expedia-post-booking`).
3. Make sure billing is enabled on the project (**Billing** in the left nav). Google requires a billing account on file even for free-tier usage — Maps gives a $200/month credit which is more than enough for a class demo.

### 2. Enable the two APIs the app needs

1. Left nav → **APIs & Services → Library**.
2. Search for **Maps JavaScript API**, open it, click **Enable**.
3. Search for **Places API**, open it, click **Enable**.

These two are the only APIs this app calls.

### 3. Create the API key

1. Left nav → **APIs & Services → Credentials**.
2. Click **+ Create credentials → API key**.
3. Google generates a key and shows it in a dialog. Copy it.
4. Paste it into your local `.env` file as `VITE_GOOGLE_MAPS_API_KEY=…` and save.

### 4. Restrict the key (do this immediately — the key ships to the browser)

In **Credentials**, click your new key to edit it.

**Application restrictions:**

1. Pick **Websites**.
2. Click **Add** and enter these patterns one at a time:
   ```
   http://localhost:5173/*
   http://localhost/*
   ```
3. If you deploy the app later, add the production URL the same way (e.g. `https://yourapp.vercel.app/*`).

**API restrictions:**

4. Switch from "Don't restrict key" to **Restrict key**.
5. In the dropdown, check only:
   - **Maps JavaScript API**
   - **Places API**
6. Uncheck everything else.

Click **Save**. Restrictions can take up to 5 minutes to propagate — if you see `RefererNotAllowedMapError` right after saving, wait a few minutes and reload.

### 5. Set a billing alert (safety net)

1. Left nav → **Billing → Budgets & alerts → Create budget**.
2. Scope it to the project, set a low monthly cap (e.g. $10), and add your email to the alert thresholds (50%, 90%, 100%).

For a class MVE on localhost you should stay well inside the free tier, but the alert is your tripwire if something goes wrong.

## How the user story maps to the code

| Acceptance criterion | Where it lives |
| --- | --- |
| Logged-in users can add a map location in one tap | `components/LocationCard.jsx` "Add to your trip" button |
| Same location can be removed in one tap | Same button toggles to "Tap to remove" once added |
| Tapping an empty map area does nothing | `clickableIcons: false` + Marker-only clicks in `TripHubMap.jsx` |
| Only one saved state per location | Dedup by `place_id` in `mockApi.addLocation` |
| Saved state persists across map + list | Single `useItinerary` store renders both surfaces |
| Family-unfriendly locations do not surface the add button | `lib/familyFilter.js` + early return in `LocationCard.jsx` |
| Cannot add to another user's itinerary | `mockApi` rejects writes where `requestingUserId !== userId` |
| 25-item cap with messaging | Enforced in `mockApi` (server) and `useItinerary` (client) |
| Loading / save-failed / offline / itinerary-load-failed states | All handled in `useItinerary.js`, `LocationCard.jsx`, `App.jsx` |
| Add does not block map browsing / zooming | All saves are optimistic and non-blocking |

## Edge case coverage

- **Booked stay** — first lodging POI for the destination auto-adds with a "Booked stay" badge; removing soft-hides it instead of deleting.
- **Permanently closed** — POIs with `business_status: CLOSED_PERMANENTLY` show a tag but stay addable.
- **Far from your stay** — POIs more than 25 km from the destination get a tag.
- **Duplicate adds** — keyed by `place_id`; second tap is a no-op.
- **Optimistic update + rollback** — UI updates immediately; rollback + retry button on failure.
- **Offline** — banner appears; add button is no-op until reconnected.
- **Itinerary load failed** — add surface is hidden entirely (not defaulted to "not added").
- **Cap reached** — both the server (`mockApi`) and the hook reject the write with a toast.

## Notes on scope

- The "logged in user" is hardcoded in `lib/currentUser.js`. The ownership rule is real even though there is only one user: the mock API rejects any write whose `requestingUserId` doesn't match.
- The mock backend lives in `localStorage`. To simulate save failures for demo purposes, set `FAILURE_RATE > 0` in `lib/mockApi.js`.
- The itinerary is a flat list sorted by add time, descending. No day/time scheduling yet.
