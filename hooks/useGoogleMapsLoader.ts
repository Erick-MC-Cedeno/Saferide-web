"use client"

import { useEffect, useState } from "react"
import { Loader } from "@googlemaps/js-api-loader"

interface GoogleMapsLoaderState {
  isLoaded: boolean
  isLoading: boolean
  error: string | null
}

let globalLoader: Promise<void> | null = null

export function useGoogleMapsLoader() {
  const [state, setState] = useState<GoogleMapsLoaderState>({
    isLoaded: false,
    isLoading: false,
    error: null,
  })

  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        // Si ya está completamente cargado, actualizar el estado
        if (typeof window !== "undefined" && 
            window.google?.maps?.Map && 
            window.google?.maps?.marker?.AdvancedMarkerElement && 
            window.google?.maps?.places) {
          setState({ isLoaded: true, isLoading: false, error: null })
          return
        }

        setState({ isLoaded: false, isLoading: true, error: null })

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY

        if (!apiKey) {
          throw new Error("Google Maps API key no configurada. Verifica NEXT_PUBLIC_GOOGLE_API_KEY en las variables de entorno.")
        }

        // Usar una única instancia del loader para toda la aplicación
        if (!globalLoader) {
          globalLoader = new Loader({
            apiKey,
            version: "weekly",
            libraries: ["places", "geometry", "marker"],
          }).load().then(async () => {
            // Esperar a que todos los componentes estén disponibles
            await new Promise<void>((resolve) => {
              const checkComponents = () => {
                if (
                  window.google?.maps?.Map &&
                  window.google?.maps?.marker?.AdvancedMarkerElement &&
                  window.google?.maps?.places
                ) {
                  resolve()
                } else {
                  setTimeout(checkComponents, 100)
                }
              }
              checkComponents()
            })
          })
        }

        // Esperar a que se complete la carga
        await globalLoader
        
        setState({ isLoaded: true, isLoading: false, error: null })
      } catch (error) {
        console.error("Error cargando Google Maps:", error)
        setState({
          isLoaded: false,
          isLoading: false,
          error: error instanceof Error ? error.message : "Error desconocido al cargar Google Maps",
        })
        globalLoader = null // Resetear el loader global en caso de error
      }
    }

    loadGoogleMaps()
  }, [])

  const retry = async () => {
    setState({ isLoaded: false, isLoading: true, error: null })
    globalLoader = null // Resetear el loader global
    try {
      await loadGoogleMaps()
    } catch (error) {
      console.error("Error en retry:", error)
    }
  }

  return { ...state, retry }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    google: any
  }
}

async function loadGoogleMaps() {
  // Esta función se usa en el retry
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error("Google Maps API key no configurada")
  }

  const loader = new Loader({
    apiKey,
    version: "weekly",
    libraries: ["places", "geometry"],
  })

  await loader.load()
}
