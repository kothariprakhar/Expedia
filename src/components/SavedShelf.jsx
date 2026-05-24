import React, { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import ActivityCard from './ActivityCard.jsx'

// "Saved things to do" — the wishlist / drag source for the day planner.
// Each card can be dragged onto a day, or its "+" opens a day picker to add it
// directly (matching the map popup's frictionless flow).
export default function SavedShelf({ items, days = [], photos = {}, onAddToDay }) {
  return (
    <section className="saved-shelf">
      <div className="saved-head">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 21s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.4-7 10-7 10z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
        <h3>Saved things to do</h3>
      </div>
      {items.length === 0 ? (
        <div className="saved-empty">Tap a pin on the map to save places here.</div>
      ) : (
        <div className="saved-grid">
          {items.map((p) => (
            <DraggableSaved
              key={p.locationId}
              place={p}
              days={days}
              imageOverride={photos[p.locationId]}
              onAddToDay={onAddToDay}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function DraggableSaved({ place, days, imageOverride, onAddToDay }) {
  const [open, setOpen] = useState(false)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: place.locationId,
    data: { type: 'saved' }
  })
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1
  }
  return (
    <div ref={setNodeRef} style={style} className="saved-card">
      <ActivityCard
        place={place}
        variant="saved"
        onAdd={() => setOpen((o) => !o)}
        dragHandle={{ attributes, listeners }}
        imageOverride={imageOverride}
      />
      {open && (
        <div className="day-pop">
          <div className="day-pop-label">Add to a day</div>
          <div className="loc-day-chips">
            {days.map((d) => (
              <button
                key={d.id}
                className="day-chip"
                onClick={() => {
                  onAddToDay?.(place, d.id)
                  setOpen(false)
                }}
              >
                {d.weekday} {d.dayNum}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
