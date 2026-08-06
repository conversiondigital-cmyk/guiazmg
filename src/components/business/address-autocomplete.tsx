"use client"

import { useEffect, useRef } from "react"
import { loadGoogleMaps } from "@/lib/google-maps-loader"
import { parseAddressComponents, type ResolvedPlace } from "@/lib/geo/parse-address"

interface Props {
  apiKey: string
  value: string
  onChange: (value: string) => void
  onPlace: (data: ResolvedPlace) => void
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
  const geocoderRef = useRef<any>(null)
  const lastGeocoded = useRef<string>("")

  useEffect(() => {
    if (!apiKey || !inputRef.current) return
    let autocomplete: any
    let cancelled = false

    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !inputRef.current) return
        const g = (window as any).google
        // Geocoder para el respaldo: mueve el mapa aunque NO se elija una sugerencia.
        if (g?.maps?.Geocoder) geocoderRef.current = new g.maps.Geocoder()
        if (!g?.maps?.places) return
        autocomplete = new g.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "mx" },
          fields: ["formatted_address", "geometry", "address_components"],
          types: ["address"],
        })
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace()
          const loc = place?.geometry?.location
          if (loc) {
            lastGeocoded.current = place.formatted_address || inputRef.current?.value || ""
            onPlaceRef.current({
              address: place.formatted_address || "",
              lat: loc.lat(),
              lng: loc.lng(),
              ...parseAddressComponents(place.address_components),
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

  // Respaldo: geocodifica la dirección tecleada (sin depender de elegir sugerencia)
  // para que el mapa se mueva "en automático" al salir del campo o presionar Enter.
  const geocodeTyped = () => {
    const text = (inputRef.current?.value || value).trim()
    if (!text || !geocoderRef.current || text === lastGeocoded.current) return
    lastGeocoded.current = text
    geocoderRef.current.geocode(
      { address: text, componentRestrictions: { country: "MX" } },
      (results: any, status: string) => {
        if (status === "OK" && results?.[0]?.geometry?.location) {
          const loc = results[0].geometry.location
          onPlaceRef.current({
            address: results[0].formatted_address || text,
            lat: loc.lat(),
            lng: loc.lng(),
            ...parseAddressComponents(results[0].address_components),
          })
        }
      },
    )
  }

  return (
    <input
      id={id}
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={geocodeTyped}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          geocodeTyped()
        }
      }}
      placeholder={placeholder}
      className={className}
      autoComplete="off"
    />
  )
}
