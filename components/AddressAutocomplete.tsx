"use client";

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { MapPin } from "lucide-react"

interface AddressAutocompleteProps {
  placeholder: string
  onAddressSelect: (address: string, coordinates: { lat: number; lng: number }) => void
  value: string
  onChange: (value: string) => void
  suppressSuggestions?: boolean
  id?: string
  name?: string
  className?: string
}

  interface Suggestion {
  formatted: string
  lat: number
  lon: number
}

declare global {
  interface Window {
    // google maps object is dynamic; treat as unknown and narrow at runtime
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google?: any
    googleMapsLoaded?: boolean
    initGoogleMaps?: () => void
  }
}

export function AddressAutocomplete({ placeholder, onAddressSelect, value, onChange, suppressSuggestions, id, name, className }: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()
  const lastSelectedRef = useRef<string | null>(null)
  

  // If parent requests suggestions be suppressed (for example when a dialog opens), hide them
  useEffect(() => {
    if (suppressSuggestions) {
      setShowSuggestions(false)
    }
  }, [suppressSuggestions])

  // Intentionally use Geoapify-based autocomplete for broader compatibility.
  // Legacy Google Places (AutocompleteService / PlacesService) are not relied upon here.

  useEffect(() => {
    if (value.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    // If the current value was just set by clicking a suggestion,
    // avoid triggering a new search immediately.
    if (lastSelectedRef.current && lastSelectedRef.current === value) {
      // Clear suggestions and hide list — selection already handled by parent
      setSuggestions([])
      setShowSuggestions(false)
      // clear the marker after a short delay to allow future searches
      setTimeout(() => {
        lastSelectedRef.current = null
      }, 500)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        await searchWithGeoapify(value)
      } catch (error) {
        console.error("Error fetching suggestions:", error)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value])

  // Removed Google Places fallback: this component relies on Geoapify autocomplete for compatibility

  const searchWithGeoapify = async (query: string) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY
      if (!apiKey) {
        console.error("Geoapify API key not configured")
        return
      }

      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
          query,
        )}&apiKey=${apiKey}&limit=5`,
      )

      if (!response.ok) throw new Error(`API error: ${response.status}`)
      const data = await response.json()

      if (Array.isArray(data.features)) {
        const newSuggestions = data.features
          .map((feature: unknown) => {
            if (!feature || typeof feature !== "object") return null
            const f = feature as Record<string, unknown>
            const properties = f.properties as Record<string, unknown> | undefined
            const geometry = f.geometry as Record<string, unknown> | undefined
            const formatted = properties && typeof properties.formatted === "string" ? properties.formatted : null
            const coords = geometry && (geometry.coordinates as unknown)
            if (!formatted || !Array.isArray(coords) || coords.length < 2) return null
            const lat = Number(coords[1])
            const lon = Number(coords[0])
            if (Number.isNaN(lat) || Number.isNaN(lon)) return null
            return { formatted, lat, lon } as Suggestion
          })
          .filter(Boolean) as Suggestion[]
        setSuggestions(newSuggestions)
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error("Error fetching suggestions from Geoapify:", error)
    }
  }

  const handleSuggestionClick = (suggestion: Suggestion) => {
  // mark the value as just-selected to avoid immediate re-search
  lastSelectedRef.current = suggestion.formatted
  onChange(suggestion.formatted)
    onAddressSelect(suggestion.formatted, { lat: suggestion.lat, lng: suggestion.lon })
    setShowSuggestions(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          id={id}
          name={name}
          className={`pl-10 ${className ?? ""}`}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{suggestion.formatted}</span>
              </div>
            </div>
          ))}
        </Card>
      )}

      {isLoading && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1">
          <Card className="p-3">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Buscando direcciones...</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
