// Per-category pin colors. Picked to be visually distinct from one another
// and from the "added" green so saved state stays unambiguous.
export const CATEGORY_COLORS = {
  restaurant: '#E0533D',       // warm red
  cafe: '#8B5A2B',             // coffee brown
  bakery: '#D4A574',           // tan
  bar: '#B8860B',              // dark goldenrod (whiskey)
  night_club: '#9C27B0',       // vivid purple
  tourist_attraction: '#1668E3', // Expedia blue
  museum: '#6932C1',           // deep purple
  art_gallery: '#C12B7A',      // magenta
  park: '#6B8E23',             // olive (intentionally NOT the "added" green)
  amusement_park: '#FF6B35',   // vivid orange
  zoo: '#8B6F47',              // earth brown
  aquarium: '#00A6B5',         // teal
  shopping_mall: '#D4318C',    // pink
  lodging: '#00355F'           // Expedia navy
}

// State colors — only applied when overriding the category color.
export const ADDED_COLOR = '#117A3D'   // green = saved to your trip
export const SAVING_COLOR = '#FFC94D'  // mid-save
export const FAILED_COLOR = '#B3261E'  // last save failed
export const CLOSED_COLOR = '#5A6478'  // permanently closed
export const BLOCKED_COLOR = '#8893A7' // family-unfriendly

export function categoryColor(searchType) {
  return CATEGORY_COLORS[searchType] || '#1668E3'
}
