import React, { useEffect, useRef, useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ActivityCard from './ActivityCard.jsx'
import { formatTime } from '../lib/time.js'

// One date section of the itinerary: a date header and a droppable list of
// time-stamped, reorderable stops. Saved cards can be dropped here to schedule.
export default function DayGroup({ day, items, focused, onFocus, onRemove, onSetTime }) {
  const ids = items.map((i) => i.locationId)
  const { setNodeRef, isOver } = useDroppable({
    id: `day:${day.id}`,
    data: { type: 'day', dayId: day.id }
  })

  return (
    <section className={`day-group ${focused ? 'focused' : ''}`}>
      <button className="day-date" onClick={() => onFocus?.(day.id)}>
        <span className="day-date-label">{day.label}</span>
        <span className="day-date-count">
          {items.length} {items.length === 1 ? 'stop' : 'stops'}
        </span>
      </button>

      <div ref={setNodeRef} className={`day-items ${isOver ? 'drop-over' : ''}`}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {items.map((item, idx) => (
            <SortableStop
              key={item.locationId}
              item={item}
              index={idx}
              onRemove={onRemove}
              onSetTime={onSetTime}
            />
          ))}
        </SortableContext>
        {items.length === 0 && (
          <div className="day-empty">No plans yet — drag a saved place here.</div>
        )}
      </div>
    </section>
  )
}

function SortableStop({ item, index, onRemove, onSetTime }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.locationId, data: { type: 'stop', dayId: item.dayId } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
  }

  return (
    <div ref={setNodeRef} style={style} className="plan-row">
      <TimeEditor
        mins={item.timeMins}
        onChange={(m) => onSetTime?.(item.locationId, m)}
      />
      <ActivityCard
        place={item}
        number={index + 1}
        onRemove={onRemove}
        dragHandle={{ attributes, listeners }}
      />
    </div>
  )
}

// Inline, low-friction time picker: one tap on the time opens quick day-part
// presets plus an exact-time field. No modal, no form.
function TimeEditor({ mins, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDocDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [open])

  const set = (m) => {
    onChange(m)
    setOpen(false)
  }

  return (
    <div className="plan-time" ref={ref}>
      <button className="time-btn" onClick={() => setOpen((o) => !o)} title="Change time">
        {formatTime(mins)}
      </button>
      {open && (
        <div className="time-pop">
          <div className="time-quick">
            <button onClick={() => set(9 * 60)}>☀️ Morning</button>
            <button onClick={() => set(13 * 60)}>⛅ Afternoon</button>
            <button onClick={() => set(19 * 60)}>🌙 Evening</button>
          </div>
          <label className="time-exact">
            Exact time
            <input
              type="time"
              value={minsToInput(mins)}
              onChange={(e) => {
                const m = inputToMins(e.target.value)
                if (m != null) set(m)
              }}
            />
          </label>
        </div>
      )}
    </div>
  )
}

function minsToInput(mins) {
  if (mins == null) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function inputToMins(v) {
  if (!v) return null
  const [h, m] = v.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}
