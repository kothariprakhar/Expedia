import React from 'react'
import { CURRENT_USER } from '../lib/currentUser.js'
import { BOOKING, formatDateRange } from '../lib/booking.js'

// The trip-level header that sits at the top of the left planning column:
// owner avatar + share, the serif trip title, and the booking summary line.
export default function TripHeader({ onReset }) {
  return (
    <div className="trip-head">
      <div className="trip-head-top">
        <span className="trip-owner" aria-hidden>{CURRENT_USER.initials}</span>
        <button className="share-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M8 10V2M8 2 L5 5M8 2 L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 9v4a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Share your trip
        </button>
        {onReset && (
          <button className="reset-btn" onClick={onReset} title="Reset the demo trip">
            Reset
          </button>
        )}
      </div>

      <h1 className="trip-title">{BOOKING.city}</h1>
      <p className="trip-sub">
        <span className="trip-hotel">{BOOKING.hotelName}</span>
        <span className="dot">·</span>
        {formatDateRange(BOOKING)}
      </p>
    </div>
  )
}
