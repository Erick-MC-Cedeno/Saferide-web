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
    // Si ya está cargado, no hacer nada
    if (typeof window !== "undefined" && window.google?.maps) {
      setState({ isLoaded: true, isLoading: false, error: null })
      return
    }

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

        const loader = new Loader({
          apiKey: apiKey,
          version: "weekly",
          libraries: ["places", "geometry"],
        })

        await loader.load()

        // Esperar hasta que `window.google.maps` esté disponible realmente
        const waitForGoogleMaps = () => {
          return new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Timeout esperando Google Maps")), 5000)

            const check = () => {
              if (window.google?.maps?.Map) {
                clearTimeout(timeout)
                resolve()
              } else {
                requestAnimationFrame(check)
              }
            }

            check()
          })
        }

        await waitForGoogleMaps()

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
    setState({ isLoaded: false, isLoading: true, error: null })
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
