"use client"

import { useEffect, useState } from "react"

export function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Verificar si Google Maps ya está cargado
    if (typeof window !== "undefined" && window.google && window.google.maps) {
      setIsLoaded(true)
      return
    }

    // Verificar si el script está cargando
    if (typeof window !== "undefined" && window.googleMapsLoaded) {
      setIsLoaded(true)
      return
    }

    // Esperar a que se cargue Google Maps
    const checkGoogleMaps = () => {
      if (typeof window !== "undefined" && window.google && window.google.maps) {
        setIsLoaded(true)
        return
      }

      if (typeof window !== "undefined" && window.googleMapsLoaded) {
        setIsLoaded(true)
        return
      }

      // Si no se carga después de 10 segundos, mostrar error
      setTimeout(() => {
        if (!isLoaded) {
          setError("No se pudo cargar Google Maps. Verifica tu conexión a internet.")
        }
      }, 10000)
    }

    // Verificar cada 500ms si Google Maps está disponible
    const interval = setInterval(() => {
      if (typeof window !== "undefined" && window.google && window.google.maps) {
        setIsLoaded(true)
        clearInterval(interval)
      }
    }, 500)

    checkGoogleMaps()

    return () => clearInterval(interval)
  }, [isLoaded])

  return { isLoaded, error }
}

// Extender el tipo Window para incluir nuestras propiedades
declare global {
  interface Window {
    google: any
    googleMapsLoaded: boolean
    initGoogleMaps: () => void
  }
}
