import { useEffect, useRef, useState } from 'react'

// Fetches a real, relevant photo for each seeded Expedia experience via Google
// Places (a text lookup by name), so itinerary cards show the actual place
// instead of a random stock image. Generic discovered places (type 'place')
// already carry their own Google photo, so they're skipped.
//
// Returns a map of locationId -> photo URL. Runs once per place id; photos are
// kept in memory (not persisted), avoiding stale signed URLs across reloads.
export function usePlacePhotos(places, ready, cityHint = '') {
  const [photos, setPhotos] = useState({})
  const done = useRef(new Set())

  useEffect(() => {
    if (!ready || !window.google?.maps?.places) return
    const svc = new window.google.maps.places.PlacesService(document.createElement('div'))
    for (const p of places) {
      if (!p?.name || p.type === 'place' || done.current.has(p.locationId)) continue
      done.current.add(p.locationId)
      svc.findPlaceFromQuery(
        { query: `${p.name} ${cityHint}`.trim(), fields: ['photos'] },
        (res, status) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            res?.[0]?.photos?.[0]
          ) {
            try {
              const url = res[0].photos[0].getUrl({ maxWidth: 480, maxHeight: 360 })
              setPhotos((prev) => ({ ...prev, [p.locationId]: url }))
            } catch {
              /* ignore */
            }
          }
        }
      )
    }
  }, [ready, places, cityHint])

  return photos
}
