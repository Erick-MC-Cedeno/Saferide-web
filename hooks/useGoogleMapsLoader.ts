"use client"

import { useEffect, useState } from "react"
import { Loader } from "@googlemaps/js-api-loader"

interface GoogleMapsLoaderState {
  isLoaded: boolean
  isLoading: boolean
  error: string | null
}

export function useGoogleMapsLoader() {
  const [state, setState] = useState<GoogleMapsLoaderState>({
    isLoaded: false,
    isLoading: false,
    error: null,
  })

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (typeof window !== "undefined" && window.google && window.google.maps) {
      setState({ isLoaded: true, isLoading: false, error: null })
      return
    }

    // Start loading
    setState({ isLoaded: false, isLoading: true, error: null })

    const loadGoogleMaps = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY

        if (!apiKey) {
          setState({
            isLoaded: false,
            isLoading: false,
            error:
              "Google Maps API key no configurada. Verifica NEXT_PUBLIC_GOOGLE_API_KEY en las variables de entorno.",
          })
          return
        }

        // Use the official Google Maps JS API Loader
        const loader = new Loader({
          apiKey: apiKey,
          version: "weekly",
          libraries: ["places", "geometry"],
        })

        // Load the Google Maps API
        await loader.load()

        setState({ isLoaded: true, isLoading: false, error: null })
      } catch (error: any) {
        console.error("Error loading Google Maps:", error)
        setState({
          isLoaded: false,
          isLoading: false,
          error:
            error.message || "Error al cargar Google Maps. Verifica tu conexión a internet y la validez de la API key.",
        })
      }
    }

    loadGoogleMaps()
  }, [])

  const retry = () => {
    // Reset state and reload
    setState({ isLoaded: false, isLoading: true, error: null })

    // Force reload the page to retry
    window.location.reload()
  }

  return { ...state, retry }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    google: any
  }
}
