import React from 'react'
import { CURRENT_USER } from '../lib/currentUser.js'

export default function Header({ destination, count, cap }) {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark" aria-hidden />
        Expedia
        <span className="brand-sub">Trip Hub</span>
      </div>
      <div className="header-trip-meta">
        {destination ? (
          <span className="pill">
            Trip to <strong style={{ marginLeft: 4 }}>{destination.name}</strong>
          </span>
        ) : (
          <span className="pill" style={{ opacity: 0.7 }}>No destination yet</span>
        )}
        <span className="pill">{count}/{cap} on itinerary</span>
        <span className="user">Signed in as {CURRENT_USER.name}</span>
      </div>
    </header>
  )
}
