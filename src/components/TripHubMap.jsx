import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GoogleMap, InfoWindow, Marker, Polyline } from '@react-google-maps/api'

const MAP_STYLE = [
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] }
]

const SCHEDULED_COLOR = '#1668E3'
const SAVED_COLOR = '#FFB700'
const HOTEL_COLOR = '#1A1A2E'
const DISCOVER_COLOR = '#8893A7'
const SQUARE = 'M -1 -1 L 1 -1 L 1 1 L -1 1 Z'

// Live discovery: a few POI categories fanned out around the hotel.
const DISCOVER_TYPES = ['restaurant', 'cafe', 'tourist_attraction', 'museum', 'bar', 'park']
const PER_TYPE = 5

// Circle = Expedia experience, square = generic place. Color encodes status.
function shapeIcon(isPlace, color, { scale = 8, opacity = 1 } = {}) {
  if (!window.google) return undefined
  return {
    path: isPlace ? SQUARE : window.google.maps.SymbolPath.CIRCLE,
    scale: isPlace ? scale * 0.85 : scale,
    fillColor: color,
    fillOpacity: opacity,
    strokeColor: '#ffffff',
    strokeOpacity: opacity,
    strokeWeight: 2
  }
}

function prettyCategory(types = []) {
  const skip = new Set(['point_of_interest', 'establishment', 'food'])
  const t = types.find((x) => !skip.has(x)) || types[0] || 'Place'
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function TripHubMap({ center, hotel, places = [], focusedDay = null, onSave }) {
  const [map, setMap] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [discovered, setDiscovered] = useState([])
  const discoveredOnce = useRef(false)

  const onLoad = useCallback((m) => setMap(m), [])

  // One-time live discovery of nearby non-partner places.
  useEffect(() => {
    if (!map || !window.google || discoveredOnce.current) return
    discoveredOnce.current = true
    const svc = new window.google.maps.places.PlacesService(map)
    const origin = hotel?.coordinates || center
    const run = (type) =>
      new Promise((resolve) => {
        svc.nearbySearch(
          { location: origin, radius: 2200, type },
          (results, status) => {
            const ok = status === window.google.maps.places.PlacesServiceStatus.OK
            resolve(ok && results ? results.slice(0, PER_TYPE) : [])
          }
        )
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
  // Don't double-render discovered places the user already saved.
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
        {discoveredVisible.map((p) => {
          const dim = !!focusedDay
          return (
            <Marker
              key={p.locationId}
              position={p.coordinates}
              icon={shapeIcon(true, DISCOVER_COLOR, { scale: 6, opacity: dim ? 0.4 : 0.95 })}
              opacity={dim ? 0.6 : 1}
              onClick={() => setSelectedId(p.locationId)}
              zIndex={5}
            />
          )
        })}

        {hotel?.coordinates && (
          <Marker
            position={hotel.coordinates}
            icon={shapeIcon(false, HOTEL_COLOR, { scale: 10 })}
            label={{ text: '★', color: SAVED_COLOR, fontSize: '12px', fontWeight: '700' }}
            title={hotel.name}
            zIndex={50}
          />
        )}

        {/* Trip places (experiences = circles, places = squares) */}
        {places.map((p) => {
          if (!p.coordinates) return null
          const isPlace = p.type === 'place'
          const inFocus = focusedDay && focusedIndex.has(p.locationId)
          const dim = focusedDay && !inFocus
          const baseColor = p.status === 'scheduled' ? SCHEDULED_COLOR : SAVED_COLOR

          if (inFocus) {
            return (
              <Marker
                key={p.locationId}
                position={p.coordinates}
                icon={shapeIcon(isPlace, SCHEDULED_COLOR, { scale: isPlace ? 12 : 13 })}
                label={{
                  text: String(focusedIndex.get(p.locationId)),
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: '700'
                }}
                onClick={() => setSelectedId(p.locationId)}
                zIndex={40}
              />
            )
          }
          return (
            <Marker
              key={p.locationId}
              position={p.coordinates}
              icon={shapeIcon(isPlace, baseColor, { opacity: dim ? 0.35 : 1 })}
              opacity={dim ? 0.5 : 1}
              onClick={() => setSelectedId(p.locationId)}
              zIndex={20}
            />
          )
        })}

        {selected && (
          <InfoWindow
            position={selected.coordinates}
            onCloseClick={() => setSelectedId(null)}
            options={{ pixelOffset: new window.google.maps.Size(0, -10) }}
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
              {selectedInTrip ? (
                <span className={`tag ${selected.status === 'scheduled' ? 'booked' : ''}`}>
                  {selected.status === 'scheduled' ? 'On your itinerary' : 'Saved to trip'}
                </span>
              ) : (
                <button
                  className="btn-add not-added"
                  onClick={() => {
                    onSave?.(selected)
                    setSelectedId(null)
                  }}
                >
                  + Save to trip
                </button>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  )
}
