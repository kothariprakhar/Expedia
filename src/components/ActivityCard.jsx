import React from 'react'

// Premium place card. Renders an Expedia experience (green /10 rating + Expedia
// badge) or a generic non-partner place (★ /5 Google rating + category).
// Used by the scheduled itinerary (variant="plan") and the Saved shelf
// (variant="saved").
export default function ActivityCard({
  place,
  number, // optional 1-based order badge that matches the map pin
  variant = 'plan',
  onAdd, // saved shelf: schedule this place
  onRemove, // itinerary: remove this stop
  dragHandle // optional { attributes, listeners } from dnd-kit
}) {
  const tags = place.tags || {}
  const isExperience = place.type !== 'place'

  return (
    <article className={`ac ac-${variant}`}>
      {dragHandle && (
        <button
          className="ac-grip"
          aria-label="Drag to reorder"
          {...dragHandle.attributes}
          {...dragHandle.listeners}
        >
          <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor" aria-hidden>
            <circle cx="3" cy="3" r="1.4" /><circle cx="9" cy="3" r="1.4" />
            <circle cx="3" cy="8" r="1.4" /><circle cx="9" cy="8" r="1.4" />
            <circle cx="3" cy="13" r="1.4" /><circle cx="9" cy="13" r="1.4" />
          </svg>
        </button>
      )}
      <div className="ac-img">
        {place.image ? (
          <img
            src={place.image}
            alt=""
            loading="lazy"
            onError={(e) => { e.currentTarget.style.visibility = 'hidden' }}
          />
        ) : (
          <span className="ac-img-ph" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="12" cy="11" r="2" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </span>
        )}
        {number != null && <span className="ac-num">{number}</span>}
        {variant === 'saved' && onAdd && (
          <button className="ac-fab" onClick={() => onAdd(place)} aria-label="Add to a day">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      <div className="ac-body">
        <h4 className="ac-title">{place.name}</h4>

        {isExperience ? (
          place.rating != null && (
            <div className="ac-rating">
              <span className="rating-badge">{place.rating.toFixed(1)}</span>
              <span className="rating-word">{ratingWord(place.rating)}</span>
              {place.reviews != null && (
                <span className="ac-reviews">({place.reviews.toLocaleString()})</span>
              )}
            </div>
          )
        ) : (
          place.rating != null && (
            <div className="ac-rating">
              <span className="place-rating">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2l3 6.9 7.5.6-5.7 4.9 1.8 7.3L12 17.8 5.4 21.7l1.8-7.3L1.5 9.5 9 8.9z" />
                </svg>
                {place.rating.toFixed(1)}
              </span>
              {place.reviews != null && (
                <span className="ac-reviews">({place.reviews.toLocaleString()})</span>
              )}
            </div>
          )
        )}

        <div className="ac-meta">
          <span>{place.category}</span>
          {isExperience && <span className="exp-badge">Expedia</span>}
        </div>

        {(tags.closed || tags.farFromHotel) && (
          <div className="ac-tags">
            {tags.closed && <span className="tag danger">Permanently closed</span>}
            {tags.farFromHotel && <span className="tag far">Far from your hotel</span>}
          </div>
        )}
      </div>

      {onRemove && (
        <button
          className="ac-remove"
          onClick={() => onRemove(place.locationId)}
          aria-label="Remove from trip"
          title="Remove from trip"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </article>
  )
}

function ratingWord(r) {
  if (r >= 9.5) return 'Exceptional'
  if (r >= 9) return 'Wonderful'
  if (r >= 8) return 'Very good'
  if (r >= 7) return 'Good'
  return 'Pleasant'
}
