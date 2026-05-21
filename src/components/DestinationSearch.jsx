import React, { useEffect, useRef } from 'react'

// Wraps a plain <input> with a Google Places Autocomplete instance.
// Calls onSelect with { name, coordinates, viewport } when the user picks a place.
export default function DestinationSearch({ mapsReady, destination, onSelect }) {
  const inputRef = useRef(null)
  const autoRef = useRef(null)

  useEffect(() => {
    if (!mapsReady || !inputRef.current || autoRef.current) return
    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['(cities)'],
      fields: ['name', 'geometry', 'formatted_address']
    })
    ac.addListener('place_changed', () => {
      const place = ac.getPlace()
      if (!place.geometry) return
      onSelect({
        name: place.name || place.formatted_address,
        coordinates: {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        },
        viewport: place.geometry.viewport || null
      })
    })
    autoRef.current = ac
  }, [mapsReady, onSelect])

  return (
    <div className="destination-bar">
      <div className="destination-input-wrap">
        <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder={mapsReady ? 'Where are you going?' : 'Loading map…'}
          disabled={!mapsReady}
        />
      </div>
      {destination && (
        <div className="destination-current">
          Exploring <strong>{destination.name}</strong>
        </div>
      )}
    </div>
  )
}
