import React from 'react'

// Rendered inside the Google Maps InfoWindow. Receives a location object that
// has already been normalized to the shape useItinerary expects.
export default function LocationCard({
  location,
  added,
  pendingState, // 'saving' | 'failed' | undefined
  itineraryLoadState, // 'loading' | 'ready' | 'error'
  full,
  onAdd,
  onRemove,
  onRetry
}) {
  const familyBlocked = !location.familyFriendly
  const hideAddSurface = itineraryLoadState !== 'ready'

  return (
    <div className="loc-card">
      <h3>{location.name}</h3>
      <p className="loc-meta">{location.category}</p>
      {location.address && <p className="loc-address">{location.address}</p>}

      <div className="loc-tags">
        {location.permanentlyClosed && (
          <span className="tag danger">Permanently closed</span>
        )}
        {location.isFarFromDestination && (
          <span className="tag far">Far from your destination</span>
        )}
        {familyBlocked && (
          <span className="tag warning">Not on family-friendly trips</span>
        )}
      </div>

      {/* Add surface rules:
          - hidden while itinerary is loading or errored
          - hidden for non-family-friendly locations */}
      {!hideAddSurface && !familyBlocked && (
        <AddSurface
          added={added}
          pendingState={pendingState}
          full={full}
          location={location}
          onAdd={onAdd}
          onRemove={onRemove}
          onRetry={onRetry}
        />
      )}
    </div>
  )
}

function AddSurface({ added, pendingState, full, location, onAdd, onRemove, onRetry }) {
  if (pendingState === 'saving') {
    return (
      <button className="btn-add saving" disabled>
        <span className="spinner" /> Saving…
      </button>
    )
  }
  if (pendingState === 'failed') {
    return (
      <>
        <button className="btn-add failed" onClick={() => onRetry(location)}>
          Couldn't save. Tap to retry
        </button>
      </>
    )
  }
  if (added) {
    return (
      <>
        <button
          className="btn-add added"
          onClick={() => onRemove(location.locationId)}
          aria-label="Tap to remove from your trip"
        >
          <Check /> Added to your trip
        </button>
        <button
          className="btn-remove-inline"
          onClick={() => onRemove(location.locationId)}
        >
          Tap to remove
        </button>
      </>
    )
  }
  return (
    <button
      className="btn-add not-added"
      onClick={() => onAdd(location)}
      disabled={full}
      title={full ? 'Itinerary is full' : undefined}
    >
      <Plus /> {full ? 'Itinerary full' : 'Add to your trip'}
    </button>
  )
}

function Plus() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M2.5 7.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
