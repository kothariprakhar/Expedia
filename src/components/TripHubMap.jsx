import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GoogleMap, InfoWindow, OverlayView, OverlayViewF } from '@react-google-maps/api'
import { categoryEmoji, ratingLabel, CATEGORIES, categoryGroup } from '../lib/placeMeta.js'

const MAP_STYLE = [
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] }
]

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
  const [discoveryCenter, setDiscoveryCenter] = useState(hotel?.coordinates || center)
  // Category filter: empty = show everything; otherwise show ONLY the selected
  // categories (across discovered places AND itinerary pins).
  const [selectedCats, setSelectedCats] = useState(() => new Set())
  const searchRef = useRef(null)

  const onLoad = useCallback((m) => setMap(m), [])

  // Wire the search box to Google Places Autocomplete → recenter + rediscover.
  useEffect(() => {
    if (!map || !window.google || !searchRef.current) return
    const ac = new window.google.maps.places.Autocomplete(searchRef.current, {
      fields: ['geometry', 'name']
    })
    const listener = ac.addListener('place_changed', () => {
      const place = ac.getPlace()
      if (!place.geometry?.location) return
      const loc = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      }
      setSelectedId(null)
      setDiscoveryCenter(loc)
      map.panTo(loc)
      map.setZoom(14)
    })
    return () => listener.remove()
  }, [map])

  // Discover nearby non-partner places around the current discovery center.
  useEffect(() => {
    if (!map || !window.google || !discoveryCenter) return
    const svc = new window.google.maps.places.PlacesService(map)
    const run = (type) =>
      new Promise((resolve) => {
        svc.nearbySearch(
          { location: discoveryCenter, radius: 2200, type },
          (results, status) => {
            const ok = status === window.google.maps.places.PlacesServiceStatus.OK
            resolve(ok && results ? results.slice(0, PER_TYPE) : [])
          }
        )
      })
    let cancelled = false
    Promise.all(DISCOVER_TYPES.map(run)).then((batches) => {
      if (cancelled) return
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
            coordinates: { lat: r.geometry.location.lat(), lng: r.geometry.location.lng() }
          })
        }
      }
      setDiscovered(out)
    })
    return () => {
      cancelled = true
    }
  }, [map, discoveryCenter])

  const passesFilter = useCallback(
    (category) => selectedCats.size === 0 || selectedCats.has(categoryGroup(category)),
    [selectedCats]
  )

  const tripIds = useMemo(() => new Set(places.map((p) => p.locationId)), [places])
  const discoveredVisible = useMemo(
    () =>
      discovered.filter((p) => !tripIds.has(p.locationId) && passesFilter(p.category)),
    [discovered, tripIds, passesFilter]
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

  // Fit to the focused day's stops, or the whole trip. (Search pans manually.)
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

  const selectedInTrip = selected ? tripIds.has(selected.locationId) : false

  const toggleCat = (key) =>
    setSelectedCats((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  return (
    <div className="map-pane">
      <div className="map-top">
        <div className="map-search">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input ref={searchRef} type="text" placeholder="Search a place or address" />
        </div>
        <div className="map-cats">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              className={`cat-chip ${selectedCats.has(c.key) ? 'on' : ''}`}
              onClick={() => toggleCat(c.key)}
              title={c.label}
            >
              <span className="cat-emoji">{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>
      </div>

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

        {places.map((p) => {
          if (!p.coordinates) return null
          if (!passesFilter(p.category)) return null
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
