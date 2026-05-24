// Time helpers. Scheduled stops store `timeMins` (minutes from midnight);
// the UI renders them as Expedia-style clock labels, e.g. "10:00am".

export function formatTime(mins) {
  if (mins == null) return ''
  const h24 = Math.floor(mins / 60) % 24
  const m = mins % 60
  const period = h24 < 12 ? 'am' : 'pm'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${String(m).padStart(2, '0')}${period}`
}

export const HOUR = 60
