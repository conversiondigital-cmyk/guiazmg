"use client"

import { useEffect, useRef } from "react"
import { loadGoogleMaps } from "@/lib/google-maps-loader"

interface Props {
  apiKey: string
  value: string
  onChange: (value: string) => void
  onPlace: (data: { address: string; lat: number; lng: number }) => void
  placeholder?: string
  className?: string
  id?: string
}

// Input de dirección con autocompletado de Google Places (restringido a México).
// Al elegir una sugerencia, rellena la dirección y devuelve lat/lng para mover el
// pin del mapa. Si no hay API key, se comporta como un input normal.
export function AddressAutocomplete({ apiKey, value, onChange, onPlace, placeholder, className, id }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const onPlaceRef = useRef(onPlace)
  onPlaceRef.current = onPlace

  useEffect(() => {
    if (!apiKey || !inputRef.current) return
    let autocomplete: any
    let cancelled = false

    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !inputRef.current) return
        const g = (window as any).google
        if (!g?.maps?.places) return
        autocomplete = new g.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "mx" },
          fields: ["formatted_address", "geometry"],
          types: ["address"],
        })
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace()
          const loc = place?.geometry?.location
          if (loc) {
            onPlaceRef.current({
              address: place.formatted_address || "",
              lat: loc.lat(),
              lng: loc.lng(),
            })
          }
        })
      })
      .catch(() => {})

    return () => {
      cancelled = true
      const g = (window as any).google
      if (autocomplete && g?.maps?.event) g.maps.event.clearInstanceListeners(autocomplete)
    }
    // El autocompletado solo se inicializa una vez por key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey])

  return (
    <input
      id={id}
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      autoComplete="off"
    />
  )
}
