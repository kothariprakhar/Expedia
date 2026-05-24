import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  GoogleMap,
  InfoWindow,
  OverlayView,
  OverlayViewF,
  Polyline
} from '@react-google-maps/api'
import { categoryEmoji, ratingLabel } from '../lib/placeMeta.js'

const MAP_STYLE = [
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] }
]
const SCHEDULED_COLOR = '#1668E3'

const DISCOVER_TYPES = ['restaurant', 'cafe', 'tourist_attraction', 'museum', 'bar', 'park']
const PER_TYPE = 4

const PIN_OFFSET = () => ({ x: 0, y: 0 })

// Premium "value pill" map marker: a category icon + rating, styled by status.
function MapPin({ place, className, emoji, rating, number, onClick }) {
  return (
    <OverlayViewF
      position={place.coordinates}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={PIN_OFFSET}
    >
      <button className={`map-pin ${className}`} onClick={onClick} title={place.name}>
        {number != null && <span className="pin-num">{number}</span>}
        <span className="pin-emoji">{emoji}</span>
        {number == null && rating && <span className="pin-rating">{rating}</span>}
      </button>
    </OverlayViewF>
  )
}

export default function TripHubMap({
  center,
  hotel,
  places = [],
  days = [],
  focusedDay = null,
  onAddToDay,
  onSaveForLater
}) {
  const [map, setMap] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [discovered, setDiscovered] = useState([])
  const discoveredOnce = useRef(false)

  const onLoad = useCallback((m) => setMap(m), [])

  useEffect(() => {
    if (!map || !window.google || discoveredOnce.current) return
    discoveredOnce.current = true
    const svc = new window.google.maps.places.PlacesService(map)
    const origin = hotel?.coordinates || center
    const run = (type) =>
      new Promise((resolve) => {
        svc.nearbySearch({ location: origin, radius: 2000, type }, (results, status) => {
          const ok = status === window.google.maps.places.PlacesServiceStatus.OK
          resolve(ok && results ? results.slice(0, PER_TYPE) : [])
        })
      })
    Promise.all(DISCOVER_TYPES.map(run)).then((batches) => {
      const seen = new Set()
      const out = []
      for (const batch of batches) {
        for (const r of batch) {
          if (!r.place_id || seen.has(r.place_id) || !r.geometry?.location) continue
          seen.add(r.place_id)
          let image = null
          try {
            image = r.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 300 }) || null
          } catch {
            image = null
          }
          out.push({
            locationId: r.place_id,
            name: r.name || 'Place',
            category: prettyCategory(r.types),
            type: 'place',
            rating: r.rating ?? null,
            reviews: r.user_ratings_total ?? null,
            address: r.vicinity || '',
            image,
            coordinates: {
              lat: r.geometry.location.lat(),
              lng: r.geometry.location.lng()
            }
          })
        }
      }
      setDiscovered(out)
    })
  }, [map, hotel, center])

  const tripIds = useMemo(() => new Set(places.map((p) => p.locationId)), [places])
  const discoveredVisible = useMemo(
    () => discovered.filter((p) => !tripIds.has(p.locationId)),
    [discovered, tripIds]
  )

  const focusedStops = useMemo(() => {
    if (!focusedDay) return []
    return places
      .filter((p) => p.status === 'scheduled' && p.dayId === focusedDay)
      .sort(
        (a, b) =>
          (a.timeMins ?? 0) - (b.timeMins ?? 0) || (a.order ?? 0) - (b.order ?? 0)
      )
  }, [places, focusedDay])

  const focusedIndex = useMemo(() => {
    const m = new Map()
    focusedStops.forEach((s, i) => m.set(s.locationId, i + 1))
    return m
  }, [focusedStops])

  useEffect(() => {
    if (!map || !window.google) return
    const pts = []
    if (focusedDay && focusedStops.length) {
      focusedStops.forEach((s) => s.coordinates && pts.push(s.coordinates))
      if (hotel?.coordinates) pts.push(hotel.coordinates)
    } else {
      places.forEach((p) => p.coordinates && pts.push(p.coordinates))
      if (hotel?.coordinates) pts.push(hotel.coordinates)
    }
    if (pts.length === 0) {
      map.setCenter(center)
      map.setZoom(13)
      return
    }
    if (pts.length === 1) {
      map.setCenter(pts[0])
      map.setZoom(14)
      return
    }
    const bounds = new window.google.maps.LatLngBounds()
    pts.forEach((pt) => bounds.extend(pt))
    map.fitBounds(bounds, 90)
  }, [map, places, hotel, center, focusedDay, focusedStops])

  const selected = useMemo(() => {
    const all = [...places, ...discovered]
    return all.find((p) => p.locationId === selectedId) || null
  }, [places, discovered, selectedId])

  const routePath = useMemo(
    () => focusedStops.map((s) => s.coordinates).filter(Boolean),
    [focusedStops]
  )

  const selectedInTrip = selected ? tripIds.has(selected.locationId) : false

  return (
    <div className="map-pane">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={13}
        onLoad={onLoad}
        options={{
          clickableIcons: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          styles: MAP_STYLE
        }}
      >
        {routePath.length > 1 && (
          <Polyline
            path={routePath}
            options={{
              strokeColor: SCHEDULED_COLOR,
              strokeOpacity: 0.9,
              strokeWeight: 3,
              icons: [
                {
                  icon: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 2.4 },
                  offset: '100%',
                  repeat: '120px'
                }
              ]
            }}
          />
        )}

        {/* Discovered (non-partner) places */}
        {discoveredVisible.map((p) => (
          <MapPin
            key={p.locationId}
            place={p}
            className={`place discovered ${focusedDay ? 'dim' : ''}`}
            emoji={categoryEmoji(p.category)}
            rating={ratingLabel(p)}
            onClick={() => setSelectedId(p.locationId)}
          />
        ))}

        {/* Trip places */}
        {places.map((p) => {
          if (!p.coordinates) return null
          const isPlace = p.type === 'place'
          const inFocus = focusedDay && focusedIndex.has(p.locationId)
          const dim = focusedDay && !inFocus
          const status = p.status === 'scheduled' ? 'scheduled' : 'saved'
          const cls = [
            isPlace ? 'place' : 'experience',
            status,
            inFocus ? 'focused' : '',
            dim ? 'dim' : ''
          ].join(' ')
          return (
            <MapPin
              key={p.locationId}
              place={p}
              className={cls}
              emoji={categoryEmoji(p.category)}
              rating={ratingLabel(p)}
              number={inFocus ? focusedIndex.get(p.locationId) : null}
              onClick={() => setSelectedId(p.locationId)}
            />
          )
        })}

        {hotel?.coordinates && (
          <MapPin
            place={hotel}
            className="hotel"
            emoji="🛏️"
            rating="Stay"
            onClick={() => setSelectedId('__hotel__')}
          />
        )}

        {selected && (
          <InfoWindow
            position={selected.coordinates}
            onCloseClick={() => setSelectedId(null)}
            options={{ pixelOffset: new window.google.maps.Size(0, -16) }}
          >
            <div className="loc-card">
              <h3>{selected.name}</h3>
              <p className="loc-meta">
                {selected.category}
                {selected.type !== 'place' && <span className="exp-badge">Expedia</span>}
              </p>
              {selected.rating != null && (
                <p className="loc-address">
                  {selected.type === 'place' ? '★ ' : ''}
                  {selected.rating.toFixed(1)}
                  {selected.reviews != null && ` · ${selected.reviews.toLocaleString()} reviews`}
                </p>
              )}
              {selected.status === 'scheduled' ? (
                <span className="tag booked">On your itinerary</span>
              ) : (
                <div className="loc-add">
                  <div className="loc-add-label">Add to a day</div>
                  <div className="loc-day-chips">
                    {days.map((d) => (
                      <button
                        key={d.id}
                        className="day-chip"
                        onClick={() => {
                          onAddToDay?.(selected, d.id)
                          setSelectedId(null)
                        }}
                      >
                        {d.weekday} {d.dayNum}
                      </button>
                    ))}
                  </div>
                  {!selectedInTrip && (
                    <button
                      className="loc-save-later"
                      onClick={() => {
                        onSaveForLater?.(selected)
                        setSelectedId(null)
                      }}
                    >
                      Save for later
                    </button>
                  )}
                </div>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  )
}

function prettyCategory(types = []) {
  const skip = new Set(['point_of_interest', 'establishment', 'food'])
  const t = types.find((x) => !skip.has(x)) || types[0] || 'Place'
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
