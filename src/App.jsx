import React, { useCallback, useMemo, useState } from 'react'
import { useJsApiLoader } from '@react-google-maps/api'
import Header from './components/Header.jsx'
import DestinationSearch from './components/DestinationSearch.jsx'
import TripHubMap, { SEARCH_TYPES } from './components/TripHubMap.jsx'
import ItineraryList from './components/ItineraryList.jsx'
import CategoryFilter from './components/CategoryFilter.jsx'
import Toast from './components/Toast.jsx'
import { useItinerary } from './hooks/useItinerary.js'
import { useOnlineStatus } from './hooks/useOnlineStatus.js'

const GOOGLE_LIBRARIES = ['places']

export default function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const { isLoaded: mapsReady, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    libraries: GOOGLE_LIBRARIES
  })

  const [destination, setDestination] = useState(null)
  const [places, setPlaces] = useState([])
  const [activeCategories, setActiveCategories] = useState(
    () => new Set(SEARCH_TYPES)
  )
  const online = useOnlineStatus()
  const itin = useItinerary()

  // Place counts by source category, for the filter chip labels.
  const placeCounts = useMemo(() => {
    const counts = Object.fromEntries(SEARCH_TYPES.map((t) => [t, 0]))
    for (const p of places) {
      if (p.searchType && counts[p.searchType] != null) counts[p.searchType] += 1
    }
    return counts
  }, [places])

  const toggleCategory = useCallback((cat) => {
    setActiveCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }, [])

  const selectAll = useCallback(() => setActiveCategories(new Set(SEARCH_TYPES)), [])
  const selectNone = useCallback(() => setActiveCategories(new Set()), [])

  if (!apiKey) {
    return <MissingKeyScreen />
  }

  return (
    <div className="app">
      <Header destination={destination} count={itin.items.length} cap={itin.cap} />
      {!online && (
        <div className="offline-banner">
          You're offline. Try again when you're connected.
        </div>
      )}
      <DestinationSearch
        mapsReady={mapsReady}
        destination={destination}
        onSelect={setDestination}
      />
      {destination && (
        <CategoryFilter
          counts={placeCounts}
          active={activeCategories}
          onToggle={toggleCategory}
          onSelectAll={selectAll}
          onSelectNone={selectNone}
        />
      )}
      <div className="body">
        {loadError ? (
          <div className="map-pane">
            <div className="map-empty">
              <div className="big">Map failed to load</div>
              <div>Check your API key and reload.</div>
            </div>
          </div>
        ) : !mapsReady ? (
          <div className="map-pane">
            <div className="map-empty">
              <div className="big">Loading map…</div>
            </div>
          </div>
        ) : (
          <TripHubMap
            destination={destination}
            itinerary={itin.items}
            loadState={itin.loadState}
            pending={itin.pending}
            isAdded={itin.isAdded}
            full={itin.full}
            activeCategories={activeCategories}
            onAdd={online ? itin.add : () => {/* offline: noop, banner explains */}}
            onRemove={itin.remove}
            onRetry={itin.retry}
            onPlacesUpdate={setPlaces}
          />
        )}
        <ItineraryList
          items={itin.items}
          loadState={itin.loadState}
          cap={itin.cap}
          full={itin.full}
          onRemove={itin.remove}
        />
      </div>
      <Toast toast={itin.toast} />
    </div>
  )
}

function MissingKeyScreen() {
  return (
    <div className="app">
      <Header destination={null} count={0} cap={25} />
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
