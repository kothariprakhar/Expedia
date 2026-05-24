import React from 'react'
import { CURRENT_USER } from '../lib/currentUser.js'

// Global Expedia top navigation. Visual match to the live product chrome.
export default function TopNav() {
  return (
    <header className="topnav">
      <div className="topnav-left">
        <a className="brand" href="#" aria-label="Expedia home">
          <span className="brand-mark" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M7 17 L17 7 M17 7 H10 M17 7 V14"
                stroke="#1A1A2E"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="brand-word">Expedia</span>
        </a>
        <button className="topnav-shop">
          Shop travel
          <Chevron />
        </button>
      </div>

      <nav className="topnav-right">
        <button className="nav-link nav-currency">
          USD <span className="flag" aria-hidden>🇺🇸</span>
        </button>
        <a className="nav-link" href="#">List your property</a>
        <a className="nav-link" href="#">Support</a>
        <a className="nav-link" href="#">Trips</a>
        <button className="nav-icon" aria-label="Messages">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 5h16v11H8l-4 4V5z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button className="nav-user">
          <span className="avatar" aria-hidden>{CURRENT_USER.initials}</span>
          <span className="nav-user-meta">
            <span className="nav-user-name">{CURRENT_USER.name}</span>
            <span className="nav-user-tier">{CURRENT_USER.tier}</span>
          </span>
        </button>
      </nav>
    </header>
  )
}

function Chevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M3 4.5 L6 7.5 L9 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
