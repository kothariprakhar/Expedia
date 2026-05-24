import React from 'react'

// Trip-level tabs (Itinerary / Bookings / Saves) matching the live product.
// `counts` is a map of tab key -> number shown in parentheses.
const TABS = [
  { key: 'itinerary', label: 'Itinerary' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'saves', label: 'Saves' }
]

export default function TripTabs({ active, counts = {}, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {TABS.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={active === t.key}
          className={`tab ${active === t.key ? 'active' : ''}`}
          onClick={() => onChange?.(t.key)}
        >
          {t.label}
          {counts[t.key] != null && <span className="tab-count">({counts[t.key]})</span>}
        </button>
      ))}
    </div>
  )
}

export { TABS }
