// Simulated backend for the MVE.
// Persists per-user itineraries in localStorage and adds a small network delay
// so optimistic-update behavior is visible in the demo.
// The 25-item cap is enforced HERE (server-side) as well as in the UI, per the spec.

export const ITINERARY_CAP = 25
const STORAGE_PREFIX = 'triphub:itinerary:'
const LATENCY_MS = 350
// Set >0 to simulate occasional save failures for demoing the "save failed" state.
const FAILURE_RATE = 0

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function storageKey(userId) {
  return STORAGE_PREFIX + userId
}

function readRaw(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeRaw(userId, items) {
  localStorage.setItem(storageKey(userId), JSON.stringify(items))
}

export async function loadItinerary(userId) {
  await sleep(LATENCY_MS)
  return readRaw(userId)
}

// item shape: { locationId, name, category, coordinates: {lat,lng}, address,
//               source, addedAt, isBookedStay, permanentlyClosed, isFarFromStay }
export async function addLocation(userId, item, requestingUserId) {
  if (requestingUserId !== userId) {
    const err = new Error('You can only add to your own itinerary.')
    err.code = 'FORBIDDEN'
    throw err
  }
  await sleep(LATENCY_MS)
  if (Math.random() < FAILURE_RATE) {
    const err = new Error('Network error')
    err.code = 'NETWORK'
    throw err
  }
  const items = readRaw(userId)
  // Dedup — same locationId resolves to existing entry, not a new one.
  const existing = items.find((i) => i.locationId === item.locationId)
  if (existing) return items
  if (items.length >= ITINERARY_CAP) {
    const err = new Error('Your itinerary is full. Remove something to add more.')
    err.code = 'CAP_REACHED'
    throw err
  }
  const next = [{ ...item, addedAt: Date.now() }, ...items]
  writeRaw(userId, next)
  return next
}

export async function removeLocation(userId, locationId, requestingUserId) {
  if (requestingUserId !== userId) {
    const err = new Error('You can only modify your own itinerary.')
    err.code = 'FORBIDDEN'
    throw err
  }
  await sleep(LATENCY_MS)
  const items = readRaw(userId)
  const next = items.filter((i) => i.locationId !== locationId)
  writeRaw(userId, next)
  return next
}
