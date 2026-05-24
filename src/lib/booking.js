// The fixed mock booking that drives the whole post-booking experience.
// In a real Expedia flow this would come from the user's confirmed reservation;
// here it's hardcoded so the prototype always opens onto a concrete trip.

export const BOOKING = {
  tripId: 'trip_bcn_2026',
  city: 'Barcelona',
  country: 'Spain',
  hotelName: 'Hotel Arts Barcelona',
  // City + hotel coordinates (hotel is the "home base" anchor on the map).
  cityCoords: { lat: 41.3874, lng: 2.1686 },
  hotelCoords: { lat: 41.3859, lng: 2.1969 },
  checkIn: '2026-06-12', // Friday
  checkOut: '2026-06-16', // Tuesday (4 nights)
  travelers: 2,
  rooms: 1
}

// Derive the list of planning days from check-in up to (not including) check-out.
// Each day is an object with an ISO id and pre-formatted labels for the UI.
export function getTripDays(booking = BOOKING) {
  const days = []
  const start = new Date(booking.checkIn + 'T00:00:00')
  const end = new Date(booking.checkOut + 'T00:00:00')
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    days.push(formatDay(new Date(d)))
  }
  return days
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

export function formatDay(date) {
  const id = toISODate(date)
  return {
    id, // 'YYYY-MM-DD'
    weekday: WEEKDAYS[date.getDay()], // 'Fri'
    month: MONTHS[date.getMonth()], // 'Jun'
    dayNum: date.getDate(), // 12
    // 'Fri, Jun 12' — matches Expedia's date-header style.
    label: `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`
  }
}

export function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 'Jun 12 – Jun 16, 2026 · 4 nights' for the trip summary line.
export function formatDateRange(booking = BOOKING) {
  const inD = new Date(booking.checkIn + 'T00:00:00')
  const outD = new Date(booking.checkOut + 'T00:00:00')
  const nights = Math.round((outD - inD) / 86400000)
  const left = `${MONTHS[inD.getMonth()]} ${inD.getDate()}`
  const right = `${MONTHS[outD.getMonth()]} ${outD.getDate()}, ${outD.getFullYear()}`
  return `${left} – ${right} · ${nights} nights`
}
