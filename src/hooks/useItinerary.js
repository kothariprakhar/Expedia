import { useCallback, useEffect, useRef, useState } from 'react'
import { CURRENT_USER } from '../lib/currentUser.js'
import {
  ITINERARY_CAP,
  addLocation,
  loadItinerary,
  removeLocation
} from '../lib/mockApi.js'

// Per-location transient states beyond just present/absent:
//   'saving' — optimistic add in flight
//   'failed' — last save attempt rejected; user can retry
// Removed entries simply disappear; we don't track a "removing" state because
// removes resolve fast and rollback is rare for that direction.

export function useItinerary() {
  const [items, setItems] = useState([])
  const [loadState, setLoadState] = useState('loading') // loading | ready | error
  const [pending, setPending] = useState({}) // locationId -> 'saving' | 'failed'
  const [toast, setToast] = useState(null) // { msg, tone }

  const userId = CURRENT_USER.userId
  // Sequence guard so a slow add doesn't clobber a newer remove. The spec
  // says "most recent user action wins."
  const seqRef = useRef(0)

  // Initial load
  useEffect(() => {
    let cancelled = false
    setLoadState('loading')
    loadItinerary(userId)
      .then((data) => {
        if (cancelled) return
        setItems(data)
        setLoadState('ready')
      })
      .catch(() => {
        if (cancelled) return
        setLoadState('error')
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  const pushToast = useCallback((msg, tone = 'default') => {
    setToast({ msg, tone, id: Date.now() })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(t)
  }, [toast])

  const isAdded = useCallback(
    (locationId) => items.some((i) => i.locationId === locationId),
    [items]
  )

  const add = useCallback(
    async (loc) => {
      if (loadState !== 'ready') return // hide-button behavior is handled by callers
      if (isAdded(loc.locationId)) return
      if (items.length >= ITINERARY_CAP) {
        pushToast('Your itinerary is full. Remove something to add more.', 'warning')
        return
      }
      const mySeq = ++seqRef.current

      // Optimistic insert
      const optimistic = { ...loc, addedAt: Date.now() }
      setItems((prev) => [optimistic, ...prev])
      setPending((p) => ({ ...p, [loc.locationId]: 'saving' }))

      try {
        const next = await addLocation(userId, loc, userId)
        if (mySeq !== seqRef.current) return // newer action superseded this one
        setItems(next)
        setPending((p) => {
          const { [loc.locationId]: _, ...rest } = p
          return rest
        })
        pushToast('Added to your trip', 'default')
      } catch (err) {
        if (mySeq !== seqRef.current) return
        // Roll back
        setItems((prev) => prev.filter((i) => i.locationId !== loc.locationId))
        setPending((p) => ({ ...p, [loc.locationId]: 'failed' }))
        if (err.code === 'CAP_REACHED') {
          pushToast('Your itinerary is full. Remove something to add more.', 'warning')
        } else if (err.code === 'FORBIDDEN') {
          pushToast(err.message, 'danger')
        } else {
          pushToast("Couldn't save that. Try again?", 'danger')
        }
      }
    },
    [loadState, isAdded, items.length, userId, pushToast]
  )

  const remove = useCallback(
    async (locationId, { silent = false } = {}) => {
      if (loadState !== 'ready') return
      const target = items.find((i) => i.locationId === locationId)
      const mySeq = ++seqRef.current

      // Optimistic remove
      setItems((prev) => prev.filter((i) => i.locationId !== locationId))
      setPending((p) => {
        const { [locationId]: _, ...rest } = p
        return rest
      })

      try {
        const next = await removeLocation(userId, locationId, userId)
        if (mySeq !== seqRef.current) return
        setItems(next)
        if (!silent) pushToast('Removed from your trip', 'default')
      } catch (err) {
        if (mySeq !== seqRef.current) return
        if (target) setItems((prev) => [target, ...prev]) // rollback
        pushToast("Couldn't remove that. Try again?", 'danger')
      }
    },
    [loadState, items, userId, pushToast]
  )

  const retry = useCallback(
    (loc) => {
      setPending((p) => {
        const { [loc.locationId]: _, ...rest } = p
        return rest
      })
      add(loc)
    },
    [add]
  )

  return {
    items,
    loadState,
    pending,
    isAdded,
    add,
    remove,
    retry,
    toast,
    dismissToast: () => setToast(null),
    cap: ITINERARY_CAP,
    full: items.length >= ITINERARY_CAP
  }
}
