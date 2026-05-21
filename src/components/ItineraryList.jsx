import React from 'react'

export default function ItineraryList({
  items,
  loadState,
  cap,
  full,
  onRemove
}) {
  const visible = items // The mock API/hook already enforces ordering (newest first).

  return (
    <aside className="itinerary-pane">
      <div className="itinerary-head">
        <h2>Your itinerary</h2>
        <div className="sub">
          {loadState === 'loading' && 'Loading your saved places…'}
          {loadState === 'error' && 'We couldn\'t load your itinerary right now.'}
          {loadState === 'ready' && (
            items.length === 0
              ? 'Tap a pin on the map to start building your trip.'
              : `${items.length} ${items.length === 1 ? 'place' : 'places'} saved`
          )}
        </div>
        {loadState === 'ready' && (
          <div className={`cap ${full ? 'full' : ''}`}>
            {items.length}/{cap} {full ? '· Itinerary full' : ''}
          </div>
        )}
      </div>

      <div className="itinerary-list">
        {loadState === 'ready' && visible.length === 0 && (
          <div className="itin-empty">
            Nothing saved yet.
            <div className="hint">Pins on the map have an "Add to your trip" button.</div>
          </div>
        )}

        {visible.map((item, idx) => (
          <div key={item.locationId} className="itin-item">
            <div className="num">{idx + 1}</div>
            <div className="info">
              <h4>{item.name}</h4>
              <div className="cat">{item.category}</div>
              <div className="row">
                {item.permanentlyClosed && (
                  <span className="tag danger">Permanently closed</span>
                )}
                {item.isFarFromDestination && (
                  <span className="tag far">Far from your destination</span>
                )}
              </div>
            </div>
            <div className="actions">
              <button
                onClick={() => onRemove(item.locationId)}
                title="Remove from trip"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
