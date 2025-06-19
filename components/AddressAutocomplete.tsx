"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { MapPin } from "lucide-react"

interface AddressAutocompleteProps {
  placeholder: string
  onAddressSelect: (address: string, coordinates: { lat: number; lng: number }) => void
  value: string
  onChange: (value: string) => void
}

interface Suggestion {
  formatted: string
  lat: number
  lon: number
}

declare global {
  interface Window {
    google: any
  }
}

export function AddressAutocomplete({ placeholder, onAddressSelect, value, onChange }: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesService = useRef<google.maps.places.PlacesService | null>(null)

  // Initialize Google Places services
  useEffect(() => {
    if (typeof window !== "undefined" && window.google && window.google.maps && window.google.maps.places) {
      autocompleteService.current = new google.maps.places.AutocompleteService()

      // Create a dummy div for PlacesService (required by Google Maps API)
      const dummyDiv = document.createElement("div")
      placesService.current = new google.maps.places.PlacesService(dummyDiv)
    }
  }, [])

  useEffect(() => {
    if (value.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    // Debounce the search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        // Try Google Places first
        if (autocompleteService.current && placesService.current) {
          await searchWithGooglePlaces(value)
        } else {
          // Fallback to Geoapify
          await searchWithGeoapify(value)
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error)
        // Try Geoapify as fallback
        await searchWithGeoapify(value)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [value])

  const searchWithGooglePlaces = async (query: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!autocompleteService.current || !placesService.current) {
        reject(new Error("Google Places not available"))
        return
      }

      autocompleteService.current.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: "mx" },
          types: ["establishment", "geocode"],
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            const newSuggestions: Suggestion[] = []
            let completed = 0

            predictions.slice(0, 5).forEach((prediction) => {
              placesService.current!.getDetails(
                {
                  placeId: prediction.place_id,
                  fields: ["formatted_address", "geometry"],
                },
                (place, detailStatus) => {
                  completed++

                  if (detailStatus === google.maps.places.PlacesServiceStatus.OK && place && place.geometry?.location) {
                    newSuggestions.push({
                      formatted: place.formatted_address || prediction.description,
                      lat: place.geometry.location.lat(),
                      lon: place.geometry.location.lng(),
                    })
                  }

                  if (completed === predictions.length || completed === 5) {
                    setSuggestions(newSuggestions)
                    setShowSuggestions(true)
                    resolve()
                  }
                },
              )
            })
          } else {
            reject(new Error("Google Places request failed"))
          }
        },
      )
    })
  }

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
        )}&apiKey=${apiKey}&limit=5&filter=countrycode:mx`,
      )

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.features) {
        const newSuggestions = data.features.map((feature: any) => ({
          formatted: feature.properties.formatted,
          lat: feature.geometry.coordinates[1],
          lon: feature.geometry.coordinates[0],
        }))
        setSuggestions(newSuggestions)
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error("Error fetching suggestions from Geoapify:", error)
      // Don't show error to user, just don't show suggestions
    }
  }

  const handleSuggestionClick = (suggestion: Suggestion) => {
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
          className="pl-10"
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
