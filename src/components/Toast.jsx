import React from 'react'

export default function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className="toast-wrap">
      <div className={`toast ${toast.tone === 'danger' ? 'danger' : ''} ${toast.tone === 'warning' ? 'warning' : ''}`}>
        {toast.msg}
      </div>
    </div>
  )
}
