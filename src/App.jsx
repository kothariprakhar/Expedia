import React, { useMemo, useRef, useState } from 'react'
import { useJsApiLoader } from '@react-google-maps/api'
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import TopNav from './components/TopNav.jsx'
import TripHeader from './components/TripHeader.jsx'
import TripTabs from './components/TripTabs.jsx'
import DayGroup from './components/DayGroup.jsx'
import SavedShelf from './components/SavedShelf.jsx'
import ActivityCard from './components/ActivityCard.jsx'
import TripHubMap from './components/TripHubMap.jsx'
import Toast from './components/Toast.jsx'
import { useTrip } from './hooks/useTrip.js'
import { BOOKING, getTripDays, formatDateRange } from './lib/booking.js'

const GOOGLE_LIBRARIES = ['places']

export default function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const { isLoaded: mapsReady, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    libraries: GOOGLE_LIBRARIES
  })

  const [tab, setTab] = useState('itinerary')
  const [focusedDay, setFocusedDay] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [leftWidth, setLeftWidth] = useState(540)

  const days = useMemo(() => getTripDays(), [])
  const trip = useTrip()

  // Drag-to-resize the planning column / map split.
  const bodyRef = useRef(null)
  const resizingRef = useRef(false)
  const onResizeDown = (e) => {
    resizingRef.current = true
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onResizeMove = (e) => {
    if (!resizingRef.current || !bodyRef.current) return
    const rect = bodyRef.current.getBoundingClientRect()
    const w = Math.min(Math.max(e.clientX - rect.left, 380), rect.width - 360)
    setLeftWidth(w)
    window.dispatchEvent(new Event('resize')) // keep the map filling its pane
  }
  const onResizeUp = (e) => {
    resizingRef.current = false
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    window.dispatchEvent(new Event('resize'))
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  )

  const counts = {
    itinerary: trip.scheduled.length,
    bookings: 1,
    saves: trip.saved.length
  }

  const handleAddToDay = (place, dayId) => {
    trip.addToDay(place, dayId)
    setFocusedDay(dayId)
  }

  const activeItem = useMemo(
    () => trip.items.find((i) => i.locationId === activeId) || null,
    [trip.items, activeId]
  )

  const handleDragEnd = (event) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const a = active.data.current || {}
    const o = over.data.current || {}

    if (a.type === 'saved') {
      // Drop a saved place onto a day (or any stop within it) → schedule it.
      if (o.dayId) {
        trip.schedulePlace(active.id, o.dayId)
        if (focusedDay) setFocusedDay(o.dayId)
      }
    } else if (a.type === 'stop') {
      // Reorder within the same day.
      if (o.dayId === a.dayId && o.type === 'stop' && active.id !== over.id) {
        const ids = (trip.itemsByDay[a.dayId] || []).map((i) => i.locationId)
        const oldIndex = ids.indexOf(active.id)
        const newIndex = ids.indexOf(over.id)
        if (oldIndex !== -1 && newIndex !== -1) {
          trip.reorderDay(a.dayId, arrayMove(ids, oldIndex, newIndex))
        }
      }
    }
  }

  const mapPlaces = useMemo(
    () => [...trip.scheduled, ...trip.saved],
    [trip.scheduled, trip.saved]
  )

  if (!apiKey) return <MissingKeyScreen />

  return (
    <div className="app">
      <TopNav />
      <div className="body" ref={bodyRef} style={{ '--plan-w': `${leftWidth}px` }}>
        <div className="plan-col">
          <TripHeader onReset={trip.reset} />
          <TripTabs active={tab} counts={counts} onChange={setTab} />
          <div className="plan-scroll">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
              onDragStart={(e) => setActiveId(e.active.id)}
              onDragEnd={handleDragEnd}
              onDragCancel={() => setActiveId(null)}
            >
              {tab === 'itinerary' && (
                <>
                  {days.map((d, i) => (
                    <DayGroup
                      key={d.id}
                      day={d}
                      items={trip.itemsByDay[d.id] || []}
                      focused={focusedDay === d.id}
                      onFocus={(id) => setFocusedDay((cur) => (cur === id ? null : id))}
                      onRemove={trip.removePlace}
                      onSetTime={trip.setTime}
                      checkIn={i === 0}
                      checkOut={i === days.length - 1}
                      hotelName={BOOKING.hotelName}
                    />
                  ))}
                  <SavedShelf items={trip.saved} days={days} onAddToDay={handleAddToDay} />
                </>
              )}
              {tab === 'saves' && (
                <SavedShelf items={trip.saved} days={days} onAddToDay={handleAddToDay} />
              )}}
              {tab === 'bookings' && <BookingsTab />}

              <DragOverlay>
                {activeItem ? (
                  <div className="drag-overlay">
                    <ActivityCard
                      place={activeItem}
                      variant={activeItem.status === 'saved' ? 'saved' : 'plan'}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>

        <div className="map-wrap">
          <div
            className="col-resizer"
            onPointerDown={onResizeDown}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeUp}
            role="separator"
            aria-label="Resize map"
          />
          {loadError ? (
            <div className="map-pane">
              <div className="map-empty">
                <div className="big">Map failed to load</div>
                <div>Check your API key and reload.</div>
              </div>
            </div>
          ) : !mapsReady ? (
            <div className="map-pane">
              <div className="map-empty"><div className="big">Loading map…</div></div>
            </div>
          ) : (
            <TripHubMap
              center={BOOKING.cityCoords}
              hotel={{ name: BOOKING.hotelName, coordinates: BOOKING.hotelCoords }}
              places={mapPlaces}
              days={days}
              focusedDay={focusedDay}
              onAddToDay={handleAddToDay}
              onSaveForLater={trip.savePlace}
            />
          )}
        </div>
      </div>
      <Toast toast={trip.toast} />
    </div>
  )
}

function BookingsTab() {
  return (
    <div className="bookings-tab">
      <div className="booking-card">
        <span className="b-icon" aria-hidden>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 10h18M5 10V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3M4 10v8M20 10v8M4 18h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div>
          <h4>{BOOKING.hotelName}</h4>
          <p>{formatDateRange(BOOKING)}</p>
          <p>{BOOKING.travelers} travelers · {BOOKING.rooms} room</p>
        </div>
      </div>
    </div>
  )
}

function MissingKeyScreen() {
  return (
    <div className="app">
      <TopNav />
      <div className="body" style={{ gridTemplateColumns: '1fr' }}>
        <div className="map-pane">
          <div className="map-empty">
            <div className="big">Google Maps API key missing</div>
            <div>
              Copy <code>.env.example</code> to <code>.env</code> and set{' '}
              <code>VITE_GOOGLE_MAPS_API_KEY</code>, then restart the dev server.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
