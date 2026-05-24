import React from 'react'
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
export default function DayGroup({ day, items, focused, onFocus, onRemove }) {
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
            <SortableStop key={item.locationId} item={item} index={idx} onRemove={onRemove} />
          ))}
        </SortableContext>
        {items.length === 0 && (
          <div className="day-empty">No plans yet — drag a saved place here.</div>
        )}
      </div>
    </section>
  )
}

function SortableStop({ item, index, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.locationId, data: { type: 'stop', dayId: item.dayId } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
  }

  return (
    <div ref={setNodeRef} style={style} className="plan-row">
      <div className="plan-time">{formatTime(item.timeMins)}</div>
      <ActivityCard
        place={item}
        number={index + 1}
        onRemove={onRemove}
        dragHandle={{ attributes, listeners }}
      />
    </div>
  )
}
