// Maps a place's category (ours or Google's) to a compact icon for map pins.
// Keyword-matched so it works for both seeded experiences and live Google types.

const RULES = [
  [/restaurant|food|dining|meal/i, '🍴'],
  [/cafe|coffee/i, '☕'],
  [/bakery|pastry/i, '🥐'],
  [/bar|pub|wine|tapas/i, '🍸'],
  [/club|night/i, '🎶'],
  [/museum/i, '🏛️'],
  [/gallery|art/i, '🖼️'],
  [/park|garden/i, '🌳'],
  [/zoo/i, '🦁'],
  [/aquarium/i, '🐟'],
  [/theme|amusement/i, '🎢'],
  [/show|theat|flamenco|concert|music/i, '🎭'],
  [/shop|mall|store|market/i, '🛍️'],
  [/cable|sightsee|view|lookout/i, '🚠'],
  [/landmark|attraction|sight|tourist|monument|church|basilica|point/i, '📸'],
  [/activity|tour|experience|stadium/i, '🎟️'],
  [/lodging|hotel|stay/i, '🛏️']
]

export function categoryEmoji(category = '') {
  for (const [re, emoji] of RULES) if (re.test(category)) return emoji
  return '📍'
}

// Rating label: experiences use a /10 scale, generic places use Google's /5 (★).
export function ratingLabel(place) {
  if (place.rating == null) return null
  return place.type === 'place' ? `★ ${place.rating.toFixed(1)}` : place.rating.toFixed(1)
}
