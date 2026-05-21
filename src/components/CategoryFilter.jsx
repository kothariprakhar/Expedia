import React from 'react'
import { CATEGORY_COLORS } from '../lib/categoryColors.js'

const CATEGORY_META = {
  restaurant: { label: 'Restaurants', icon: '🍽' },
  cafe: { label: 'Cafés', icon: '☕' },
  bakery: { label: 'Bakeries', icon: '🥐' },
  bar: { label: 'Bars', icon: '🍺' },
  night_club: { label: 'Clubs', icon: '🎶' },
  tourist_attraction: { label: 'Sights', icon: '📸' },
  museum: { label: 'Museums', icon: '🏛' },
  art_gallery: { label: 'Galleries', icon: '🎨' },
  park: { label: 'Parks', icon: '🌳' },
  amusement_park: { label: 'Theme parks', icon: '🎢' },
  zoo: { label: 'Zoos', icon: '🦒' },
  aquarium: { label: 'Aquariums', icon: '🐠' },
  shopping_mall: { label: 'Shopping', icon: '🛍' },
  lodging: { label: 'Hotels', icon: '🏨' }
}

export default function CategoryFilter({
  counts,
  active,
  onToggle,
  onSelectAll,
  onSelectNone
}) {
  const keys = Object.keys(CATEGORY_META)
  return (
    <div className="category-bar">
      <div className="category-chips">
        {keys.map((key) => {
          const meta = CATEGORY_META[key]
          const count = counts[key] || 0
          const isActive = active.has(key)
          return (
            <button
              key={key}
              className={`chip ${isActive ? 'on' : 'off'}`}
              onClick={() => onToggle(key)}
              aria-pressed={isActive}
              title={`${meta.label} — ${count} on map`}
            >
              <span
                className="chip-dot"
                style={{ background: CATEGORY_COLORS[key] }}
                aria-hidden
              />
              <span className="chip-icon" aria-hidden>
                {meta.icon}
              </span>
              {meta.label}
              <span className="chip-count">{count}</span>
            </button>
          )
        })}
      </div>
      <div className="category-actions">
        <button onClick={onSelectAll}>All</button>
        <span aria-hidden>·</span>
        <button onClick={onSelectNone}>None</button>
      </div>
    </div>
  )
}
