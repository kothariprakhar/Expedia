import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { GoogleMap, InfoWindow, Marker } from '@react-google-maps/api'
import LocationCard from './LocationCard.jsx'
import { isFamilyFriendly, pickCategory } from '../lib/familyFilter.js'
import {
  ADDED_COLOR,
  BLOCKED_COLOR,
  CLOSED_COLOR,
  FAILED_COLOR,
  SAVING_COLOR,
  categoryColor
} from '../lib/categoryColors.js'

const DEFAULT_CENTER = { lat: 41.8781, lng: -87.6298 } // Chicago, just for the empty state
const FAR_FROM_STAY_KM = 25
const NEARBY_RADIUS_M = 8000

// Categories we fan out queries for. Each is a separate billable Places call,
// so keep the list focused — restaurants, sights, and a few activity types.
export const SEARCH_TYPES = [
  'restaurant',
  'cafe',
  'bakery',
  'bar',
  'night_club',
  'tourist_attraction',
  'museum',
  'art_gallery',
  'park',
  'amusement_park',
  'zoo',
  'aquarium',
  'shopping_mall',
  'lodging'
]

// Pin appearance rules:
//   - Default: color by category (so users can scan the map by type)
//   - Added to itinerary: bright green + slightly larger so the saved set
//     is unambiguous against the colorful category baseline
//   - Saving / failed / closed / family-blocked: state colors override category
function pinIconFor({ added, pending, familyBlocked, closed, searchType }) {
  if (!window.google) return undefined
  const g = window.google.maps
  let fill = categoryColor(searchType)
  let scale = 8
  let strokeWeight = 2
  if (added) {
    fill = ADDED_COLOR
    scale = 11
    strokeWeight = 3
  } else if (pending === 'saving') fill = SAVING_COLOR
  else if (pending === 'failed') fill = FAILED_COLOR
  else if (familyBlocked) fill = BLOCKED_COLOR
  else if (closed) fill = CLOSED_COLOR
  return {
    path: g.SymbolPath.CIRCLE,
    scale,
    fillColor: fill,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight
  }
}

function distanceKm(a, b) {
  if (!a || !b) return 0
  const toRad = (d) => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

export default function TripHubMap({
  destination,
  itinerary,
  loadState,
  pending,
  isAdded,
  full,
  activeCategories,
  onAdd,
  onRemove,
  onRetry,
  onPlacesUpdate
}) {
  // Holding the map as state (not ref) is intentional: the GoogleMap component
  // calls onLoad asynchronously after first mount, AFTER our search effect has
  // already run once with destination set. Using state forces the effect to
  // re-run as soon as the map instance is actually available.
  const [map, setMap] = useState(null)
  const [places, setPlaces] = useState([]) // normalized location objects
  const [selectedId, setSelectedId] = useState(null)
  const [searchError, setSearchError] = useState(null)
  const [searching, setSearching] = useState(false)

  const onMapLoad = useCallback((m) => {
    setMap(m)
  }, [])

  // Pan/zoom to the new destination and fetch nearby POIs.
  // Google Places nearbySearch only accepts ONE type per call, so we fan out
  // a handful of parallel calls — one per category we care about — and merge.
  useEffect(() => {
    if (!destination || !map || !window.google) return
    if (destination.viewport) map.fitBounds(destination.viewport)
    else map.panTo(destination.coordinates)

    setSearchError(null)
    setSearching(true)
    setSelectedId(null)
    const service = new window.google.maps.places.PlacesService(map)

    const runSearch = (type) =>
      new Promise((resolve) => {
        service.nearbySearch(
          { location: destination.coordinates, radius: NEARBY_RADIUS_M, type },
          (results, status) => {
            const ok =
              status === window.google.maps.places.PlacesServiceStatus.OK ||
              status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS
            resolve({ type, ok, results: results || [] })
          }
        )
      })

    Promise.all(SEARCH_TYPES.map(runSearch)).then((batches) => {
      const anySuccess = batches.some((b) => b.ok)
      if (!anySuccess) {
        setSearching(false)
        setSearchError('Places search failed. Try a different destination.')
        // Surface the actual statuses to dev tools so the cause is obvious.
        // eslint-disable-next-line no-console
        console.warn('[trip-hub] all Places nearbySearch calls failed', batches)
        return
      }

      const seen = new Set()
      const normalized = []
      for (const batch of batches) {
        for (const p of batch.results) {
          if (!p.place_id || seen.has(p.place_id)) continue
          if (!p.geometry?.location) continue
          seen.add(p.place_id)
          const coords = {
            lat: p.geometry.location.lat(),
            lng: p.geometry.location.lng()
          }
          normalized.push({
            locationId: p.place_id,
            name: p.name || 'Unnamed place',
            category: pickCategory(p),
            searchType: batch.type, // which fan-out query found this place first
            coordinates: coords,
            address: p.vicinity || '',
            source: 'external',
            familyFriendly: isFamilyFriendly(p),
            permanentlyClosed: p.business_status === 'CLOSED_PERMANENTLY',
            isFarFromDestination:
              distanceKm(destination.coordinates, coords) > FAR_FROM_STAY_KM
          })
        }
      }
      setPlaces(normalized)
      onPlacesUpdate?.(normalized)
      setSearching(false)
    })
  }, [destination, map, onPlacesUpdate])

  // The currently selected place (for the InfoWindow). We always source it
  // from the live places array so the card reflects the latest saved state.
  const selected = useMemo(
    () => places.find((p) => p.locationId === selectedId) || null,
    [places, selectedId]
  )

  // Marker-rendered subset: only categories the user has toggled on.
  const visiblePlaces = useMemo(() => {
    if (!activeCategories) return places
    return places.filter((p) => activeCategories.has(p.searchType))
  }, [places, activeCategories])

  // Map pin click — only opens the card for our managed places.
  // Tapping empty map area does nothing (Google's default click does nothing here).
  const onMarkerClick = (id) => setSelectedId(id)

  return (
    <div className="map-pane">
      {!destination && (
        <div className="map-empty">
          <div className="big">Search a destination to start your trip</div>
          <div>
            Pick a city and we'll show family-friendly places you can add to your itinerary.
          </div>
        </div>
      )}

      {destination && (
        <>
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={destination.coordinates || DEFAULT_CENTER}
            zoom={13}
            onLoad={onMapLoad}
            options={{
              clickableIcons: false, // suppress Google's built-in POI clicks — only OUR pins are addable
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              styles: EXPEDIA_MAP_STYLE
            }}
          >
            {visiblePlaces.map((p) => (
              <Marker
                key={p.locationId}
                position={p.coordinates}
                onClick={() => onMarkerClick(p.locationId)}
                icon={pinIconFor({
                  added: isAdded(p.locationId),
                  pending: pending[p.locationId],
                  familyBlocked: !p.familyFriendly,
                  closed: p.permanentlyClosed,
                  searchType: p.searchType
                })}
              />
            ))}

            {selected && (
              <InfoWindow
                position={selected.coordinates}
                onCloseClick={() => setSelectedId(null)}
                options={{ pixelOffset: new window.google.maps.Size(0, -10) }}
              >
                <LocationCard
                  location={selected}
                  added={isAdded(selected.locationId)}
                  pendingState={pending[selected.locationId]}
                  itineraryLoadState={loadState}
                  full={full}
                  onAdd={onAdd}
                  onRemove={onRemove}
                  onRetry={onRetry}
                />
              </InfoWindow>
            )}
          </GoogleMap>

          {searching && <div className="map-loading-overlay">Finding places nearby…</div>}
          {searchError && <div className="map-error">{searchError}</div>}
        </>
      )}
    </div>
  )
}

// Very light styling so the map reads more like Expedia's flat aesthetic.
const EXPEDIA_MAP_STYLE = [
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] }
]
