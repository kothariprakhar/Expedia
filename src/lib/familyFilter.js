// Google Places "types" that we treat as not family-friendly for the MVE.
// Bars and night clubs are intentionally NOT in this set — they're surfaced as
// first-class addable categories.
const ADULT_ONLY_TYPES = new Set([
  'casino',
  'liquor_store',
  'adult_entertainment_store',
  'strip_club'
])

export function isFamilyFriendly(place) {
  if (!place?.types) return true
  return !place.types.some((t) => ADULT_ONLY_TYPES.has(t))
}

// Pick a primary category label for the card from raw Places types.
const PREFERRED_CATEGORY_ORDER = [
  'lodging',
  'museum',
  'art_gallery',
  'tourist_attraction',
  'amusement_park',
  'aquarium',
  'zoo',
  'park',
  'restaurant',
  'cafe',
  'bakery',
  'bar',
  'night_club',
  'shopping_mall',
  'store',
  'church',
  'hindu_temple',
  'mosque',
  'synagogue',
  'neighborhood',
  'point_of_interest'
]

export function pickCategory(place) {
  if (!place?.types) return 'place'
  const found = PREFERRED_CATEGORY_ORDER.find((c) => place.types.includes(c))
  return (found || place.types[0] || 'place').replace(/_/g, ' ')
}
