// Mock "backend" for the prototype: persists the whole trip (saved + scheduled
// places) in localStorage and seeds a realistic trip on first run. No network,
// no auth — just a storage seam so the UI logic stays backend-agnostic.

import { SEED_ITINERARY, SEED_SAVED } from './seed.js'

export const ITINERARY_CAP = 30
const STORAGE_PREFIX = 'triphub:v2:'

function storageKey(userId) {
  return STORAGE_PREFIX + userId
}

function seedItems() {
  const scheduled = SEED_ITINERARY.map((p) => ({ ...p, status: 'scheduled' }))
  const saved = SEED_SAVED.map((p) => ({ ...p, status: 'saved' }))
  return [...scheduled, ...saved]
}

// Returns the persisted trip, seeding it the first time the user opens the app.
export function loadTrip(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (raw) return JSON.parse(raw)
  } catch {
    /* fall through to seed */
  }
  const seeded = seedItems()
  saveTrip(userId, seeded)
  return seeded
}

export function saveTrip(userId, items) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(items))
  } catch {
    /* storage full / unavailable — non-fatal for a prototype */
  }
}

// Wipe persisted state so the next load re-seeds (used by the demo-reset button).
export function resetTrip(userId) {
  try {
    localStorage.removeItem(storageKey(userId))
  } catch {
    /* ignore */
  }
}
