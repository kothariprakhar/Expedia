// Seed content so the trip opens looking full and real.
// Images use picsum's seeded endpoint — stable per slug, no broken thumbnails.

import { getTripDays } from './booking.js'

const img = (slug) => `https://picsum.photos/seed/${slug}/400/300`
const days = getTripDays()

// All seeded entries are bookable Expedia experiences. Generic, non-partner
// places (restaurants, sights) come from live Google discovery on the map and
// are tagged type:'place' when saved.
const EXPERIENCE = 'experience'

// Scheduled stops across the first two trip days (Chicago).
const RAW_ITINERARY = [
  {
    locationId: 'p_artic',
    name: 'Art Institute of Chicago',
    category: 'Museum',
    rating: 9.5,
    reviews: 18420,
    image: img('artic'),
    coordinates: { lat: 41.8796, lng: -87.6237 },
    dayId: days[0].id,
    timeMins: 10 * 60, // 10:00am
    order: 0,
    tags: {}
  },
  {
    locationId: 'p_rivercruise',
    name: 'Chicago Architecture River Cruise',
    category: 'Activity',
    rating: 9.6,
    reviews: 24310,
    image: img('rivercruise'),
    coordinates: { lat: 41.8881, lng: -87.6271 },
    dayId: days[0].id,
    timeMins: 13 * 60, // 1:00pm
    order: 1,
    tags: {}
  },
  {
    locationId: 'p_pizzatour',
    name: 'Chicago Deep-Dish Pizza Walking Tour',
    category: 'Food & drink',
    rating: 9.0,
    reviews: 3120,
    image: img('deepdish'),
    coordinates: { lat: 41.8917, lng: -87.627 },
    dayId: days[0].id,
    timeMins: 19 * 60, // 7:00pm
    order: 2,
    tags: {}
  },
  {
    locationId: 'p_skydeck',
    name: 'Skydeck Chicago at Willis Tower',
    category: 'Sightseeing',
    rating: 9.3,
    reviews: 15290,
    image: img('skydeck'),
    coordinates: { lat: 41.8789, lng: -87.6359 },
    dayId: days[1].id,
    timeMins: 9 * 60 + 30, // 9:30am
    order: 0,
    tags: {}
  },
  {
    locationId: 'p_shedd',
    name: 'Shedd Aquarium',
    category: 'Activity',
    rating: 9.2,
    reviews: 11870,
    image: img('shedd'),
    coordinates: { lat: 41.8676, lng: -87.614 },
    dayId: days[1].id,
    timeMins: 14 * 60, // 2:00pm
    order: 1,
    tags: {}
  }
]

// Unscheduled places living in the "Saved things to do" shelf.
const RAW_SAVED = [
  {
    locationId: 's_navypier',
    name: 'Navy Pier Centennial Wheel',
    category: 'Activity',
    rating: 8.9,
    reviews: 9650,
    image: img('navypier'),
    coordinates: { lat: 41.8917, lng: -87.6086 },
    status: 'saved',
    tags: {}
  },
  {
    locationId: 's_field',
    name: 'The Field Museum',
    category: 'Museum',
    rating: 9.2,
    reviews: 13240,
    image: img('fieldmuseum'),
    coordinates: { lat: 41.8663, lng: -87.617 },
    status: 'saved',
    tags: { farFromHotel: true }
  },
  {
    locationId: 's_secondcity',
    name: 'The Second City Comedy Show',
    category: 'Show',
    rating: 9.1,
    reviews: 5410,
    image: img('secondcity'),
    coordinates: { lat: 41.9119, lng: -87.6347 },
    status: 'saved',
    tags: {}
  }
]

export const SEED_ITINERARY = RAW_ITINERARY.map((p) => ({ ...p, type: EXPERIENCE }))
export const SEED_SAVED = RAW_SAVED.map((p) => ({ ...p, type: EXPERIENCE }))
