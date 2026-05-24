import { useCallback, useEffect, useMemo, useState } from 'react'
import { CURRENT_USER } from '../lib/currentUser.js'
import { ITINERARY_CAP, loadTrip, saveTrip, resetTrip } from '../lib/mockApi.js'

// Single source of truth for the trip. Every place is one object with a
// `status` of 'saved' (in the shelf) or 'scheduled' (placed on a day at a
// time). The hook persists to localStorage on every change.
//
// Place shape:
//   { locationId, name, category, rating, reviews, image, coordinates, tags,
//     status, dayId?, timeMins?, order? }

const DEFAULT_START = 10 * 60 // 10:00am for the first stop of a day
const STEP = 120 // space new stops ~2h apart
const LATEST = 22 * 60 // don't auto-schedule past 10:00pm

export function useTrip() {
  const userId = CURRENT_USER.userId
  const [items, setItems] = useState(() =>
    typeof window === 'undefined' ? [] : loadTrip(userId)
  )
  const [toast, setToast] = useState(null)

  useEffect(() => {
    saveTrip(userId, items)
  }, [userId, items])

  const pushToast = useCallback((msg, tone = 'default') => {
    setToast({ msg, tone, id: Date.now() })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  // ---- Derived views ----
  const saved = useMemo(() => items.filter((i) => i.status === 'saved'), [items])
  const scheduled = useMemo(
    () => items.filter((i) => i.status === 'scheduled'),
    [items]
  )

  const itemsByDay = useMemo(() => {
    const map = {}
    for (const it of scheduled) (map[it.dayId] ||= []).push(it)
    for (const dayId of Object.keys(map)) {
      map[dayId].sort(
        (a, b) =>
          (a.timeMins ?? 0) - (b.timeMins ?? 0) || (a.order ?? 0) - (b.order ?? 0)
      )
    }
    return map
  }, [scheduled])

  const nextTimeForDay = useCallback(
    (dayId) => {
      const day = items.filter((i) => i.status === 'scheduled' && i.dayId === dayId)
      if (day.length === 0) return DEFAULT_START
      const last = Math.max(...day.map((i) => i.timeMins ?? DEFAULT_START))
      return Math.min(last + STEP, LATEST)
    },
    [items]
  )

  // ---- Actions ----
  const savePlace = useCallback(
    (place) => {
      setItems((prev) => {
        if (prev.some((i) => i.locationId === place.locationId)) {
          pushToast('Already in your trip')
          return prev
        }
        if (prev.length >= ITINERARY_CAP) {
          pushToast('Your trip is full. Remove something first.', 'warning')
          return prev
        }
        pushToast('Saved to your trip')
        return [...prev, { ...place, status: 'saved' }]
      })
    },
    [pushToast]
  )

  const removePlace = useCallback(
    (locationId) => {
      setItems((prev) => prev.filter((i) => i.locationId !== locationId))
      pushToast('Removed from your trip')
    },
    [pushToast]
  )

  const schedulePlace = useCallback(
    (locationId, dayId, timeMins) => {
      const t = timeMins ?? nextTimeForDay(dayId)
      setItems((prev) =>
        prev.map((i) =>
          i.locationId === locationId
            ? { ...i, status: 'scheduled', dayId, timeMins: t, order: Date.now() }
            : i
        )
      )
      pushToast('Added to your itinerary')
    },
    [nextTimeForDay, pushToast]
  )

  const unschedulePlace = useCallback(
    (locationId) => {
      setItems((prev) =>
        prev.map((i) =>
          i.locationId === locationId
            ? { ...i, status: 'saved', dayId: undefined, timeMins: undefined, order: undefined }
            : i
        )
      )
      pushToast('Moved back to saved')
    },
    [pushToast]
  )

  const setTime = useCallback((locationId, timeMins) => {
    setItems((prev) =>
      prev.map((i) => (i.locationId === locationId ? { ...i, timeMins } : i))
    )
  }, [])

  // Reorder one day to a new sequence of locationIds (drag & drop).
  // Stops render in clock-time order, so we keep the day's existing set of time
  // slots and reassign them to the items in their new order — i.e. dragging a
  // stop swaps which activity occupies which time slot.
  const reorderDay = useCallback((dayId, orderedIds) => {
    setItems((prev) => {
      const dayItems = prev.filter(
        (i) => i.status === 'scheduled' && i.dayId === dayId
      )
      const slots = dayItems
        .map((i) => i.timeMins ?? DEFAULT_START)
        .sort((a, b) => a - b)
      const timeFor = {}
      orderedIds.forEach((id, idx) => {
        timeFor[id] = slots[idx] ?? slots[slots.length - 1]
      })
      return prev.map((i) => {
        if (i.dayId !== dayId || i.status !== 'scheduled') return i
        const idx = orderedIds.indexOf(i.locationId)
        return idx === -1 ? i : { ...i, order: idx, timeMins: timeFor[i.locationId] }
      })
    })
  }, [])

  const reset = useCallback(() => {
    resetTrip(userId)
    setItems(loadTrip(userId))
    pushToast('Trip reset')
  }, [userId, pushToast])

  return {
    items,
    saved,
    scheduled,
    itemsByDay,
    nextTimeForDay,
    savePlace,
    removePlace,
    schedulePlace,
    unschedulePlace,
    setTime,
    reorderDay,
    reset,
    toast,
    cap: ITINERARY_CAP,
    count: items.length,
    full: items.length >= ITINERARY_CAP
  }
}
