// Seed content so the trip opens looking full and real.
// (Phase 1 uses this for the visual shell; Phase 2 wires it through the store.)
// Images use picsum's seeded endpoint — stable per slug, no broken thumbnails.

import { getTripDays } from './booking.js'

const img = (slug) => `https://picsum.photos/seed/${slug}/400/300`
const days = getTripDays()

// All seeded entries are bookable Expedia experiences. Generic, non-partner
// places (restaurants, sights) come from live Google discovery on the map and
// are tagged type:'place' when saved.
const EXPERIENCE = 'experience'

// Scheduled stops, keyed loosely to the first two trip days.
const RAW_ITINERARY = [
  {
    locationId: 'p_sagrada',
    name: 'Basílica de la Sagrada Família',
    category: 'Landmark',
    rating: 9.4,
    reviews: 12873,
    image: img('sagrada'),
    coordinates: { lat: 41.4036, lng: 2.1744 },
    dayId: days[0].id,
    timeMins: 10 * 60, // 10:00am
    order: 0,
    tags: {}
  },
  {
    locationId: 'p_boqueria',
    name: 'La Boqueria Market Food Tour',
    category: 'Food & drink',
    rating: 9.0,
    reviews: 2154,
    image: img('boqueria'),
    coordinates: { lat: 41.3817, lng: 2.1716 },
    dayId: days[0].id,
    timeMins: 13 * 60, // 1:00pm
    order: 1,
    tags: {}
  },
  {
    locationId: 'p_tapas',
    name: 'El Born Tapas & Wine Crawl',
    category: 'Nightlife',
    rating: 9.2,
    reviews: 1876,
    image: img('tapas'),
    coordinates: { lat: 41.3853, lng: 2.1819 },
    dayId: days[0].id,
    timeMins: 20 * 60, // 8:00pm
    order: 2,
    tags: {}
  },
  {
    locationId: 'p_parkguell',
    name: 'Park Güell Skip-the-Line Entry',
    category: 'Park',
    rating: 8.8,
    reviews: 9421,
    image: img('parkguell'),
    coordinates: { lat: 41.4145, lng: 2.1527 },
    dayId: days[1].id,
    timeMins: 9 * 60 + 30, // 9:30am
    order: 0,
    tags: { farFromHotel: true }
  },
  {
    locationId: 'p_picasso',
    name: 'Picasso Museum',
    category: 'Museum',
    rating: 9.1,
    reviews: 5230,
    image: img('picasso'),
    coordinates: { lat: 41.3853, lng: 2.1809 },
    dayId: days[1].id,
    timeMins: 15 * 60, // 3:00pm
    order: 1,
    tags: {}
  }
]

// Unscheduled places living in the "Saved things to do" shelf.
const RAW_SAVED = [
  {
    locationId: 's_camp_nou',
    name: 'Spotify Camp Nou Stadium Tour',
    category: 'Activity',
    rating: 9.3,
    reviews: 7740,
    image: img('campnou'),
    coordinates: { lat: 41.3809, lng: 2.1228 },
    status: 'saved',
    tags: { farFromHotel: true }
  },
  {
    locationId: 's_montjuic',
    name: 'Montjuïc Cable Car',
    category: 'Sightseeing',
    rating: 8.6,
    reviews: 3310,
    image: img('montjuic'),
    coordinates: { lat: 41.3641, lng: 2.1657 },
    status: 'saved',
    tags: {}
  },
  {
    locationId: 's_flamenco',
    name: 'Flamenco Show at Palau',
    category: 'Show',
    rating: 9.0,
    reviews: 1442,
    image: img('flamenco'),
    coordinates: { lat: 41.3875, lng: 2.1754 },
    status: 'saved',
    tags: {}
  }
]

export const SEED_ITINERARY = RAW_ITINERARY.map((p) => ({ ...p, type: EXPERIENCE }))
export const SEED_SAVED = RAW_SAVED.map((p) => ({ ...p, type: EXPERIENCE }))
