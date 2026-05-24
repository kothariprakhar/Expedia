import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import ActivityCard from './ActivityCard.jsx'

// "Saved things to do" — the holding area of unscheduled places and the drag
// source for the day planner. Each card can be dragged onto a day, or added
// with the "+" button (schedules into the focused day / day 1).
export default function SavedShelf({ items, onAdd }) {
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
            <DraggableSaved key={p.locationId} place={p} onAdd={onAdd} />
          ))}
        </div>
      )}
    </section>
  )
}

function DraggableSaved({ place, onAdd }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: place.locationId,
    data: { type: 'saved' }
  })
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1
  }
  return (
    <div ref={setNodeRef} style={style}>
      <ActivityCard
        place={place}
        variant="saved"
        onAdd={onAdd}
        dragHandle={{ attributes, listeners }}
      />
    </div>
  )
}
