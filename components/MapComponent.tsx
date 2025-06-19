"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Crosshair } from "lucide-react"
import { useGoogleMapsLoader } from "@/hooks/useGoogleMapsLoader"
import { MapFallback } from "./MapFallback"

interface MapComponentProps {
  userType: "passenger" | "driver"
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void
  pickupLocation?: { lat: number; lng: number }
  destinationLocation?: { lat: number; lng: number }
  driverLocations?: Array<{ id: string; lat: number; lng: number; name: string }>
}

export function MapComponent({
  userType,
  onLocationSelect,
  pickupLocation,
  destinationLocation,
  driverLocations = [],
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const { isLoaded, isLoading, error, retry } = useGoogleMapsLoader()
  const [isInitialized, setIsInitialized] = useState(false)
  const markersRef = useRef<google.maps.Marker[]>([])
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null)

  // Espera activa hasta que google.maps.Map esté disponible
  const waitForGoogleMapsReady = (): Promise<void> => {
    return new Promise((resolve, reject) => {
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

  // Inicializa el mapa una vez que Google Maps esté cargado
  useEffect(() => {
    if (!isLoaded || !mapRef.current || isInitialized) {
      if (isLoading) {
        console.log("🔄 Cargando Google Maps...")
      }
      return
    }

    const initMap = async () => {
      try {
        console.log("🚀 Iniciando configuración del mapa...")
        const defaultLocation = { lat: 19.4326, lng: -99.1332 }
        
        // Verificación adicional de seguridad
        if (!window.google?.maps?.Map) {
          console.error("❌ Google Maps no está disponible todavía")
          return
        }

        console.log("✨ Creando instancia del mapa...")
        const mapInstance = new window.google.maps.Map(mapRef.current!, {
          center: defaultLocation,
          zoom: 13,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })

        setMap(mapInstance)
        setIsInitialized(true)
        console.log("✅ Mapa inicializado correctamente")

        // Obtener ubicación del usuario
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const userLoc = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              }
              setUserLocation(userLoc)
              mapInstance.setCenter(userLoc)
            },
            (error) => {
              console.error("Error obteniendo ubicación del usuario:", error)
              mapInstance.setCenter(defaultLocation)
            }
          )
        }
      } catch (error) {
        console.error("Error inicializando el mapa:", error)
      }
    }

    initMap()
  }, [isLoaded, isInitialized])

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const geocoder = new google.maps.Geocoder()
      const response = await geocoder.geocode({ location: { lat, lng } })
      if (response.results?.length > 0) {
        return response.results[0].formatted_address
      }
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    } catch (error) {
      console.error("Error en geocoding, usando Geoapify como fallback:", error)
      try {
        const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY
        if (!apiKey) return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${apiKey}`
        )
        const data = await response.json()
        return data.features?.[0]?.properties?.formatted || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      } catch (e) {
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      }
    }
  }

  const clearMarkers = () => {
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null)
      directionsRendererRef.current = null
    }
  }

  useEffect(() => {
    if (!map || !isLoaded) return

    const userLocationMarker = markersRef.current.find((m) => m.getTitle() === "Tu ubicación")
    clearMarkers()

    if (userLocationMarker) markersRef.current.push(userLocationMarker)

    if (pickupLocation) {
      const pickupMarker = new google.maps.Marker({
        position: pickupLocation,
        map,
        title: "Punto de recogida",
        icon: {
          path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: "#10B981",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 2,
        },
      })
      markersRef.current.push(pickupMarker)
    }

    if (destinationLocation) {
      const destinationMarker = new google.maps.Marker({
        position: destinationLocation,
        map,
        title: "Destino",
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: "#EF4444",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 2,
        },
      })
      markersRef.current.push(destinationMarker)
    }

    if (userType === "passenger" && driverLocations.length > 0) {
      driverLocations.forEach((driver) => {
        const driverMarker = new google.maps.Marker({
          position: { lat: driver.lat, lng: driver.lng },
          map,
          title: `Conductor: ${driver.name}`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#F59E0B",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
          },
        })
        markersRef.current.push(driverMarker)
      })
    }

    if (pickupLocation && destinationLocation) {
      const directionsService = new google.maps.DirectionsService()
      const directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#3B82F6",
          strokeWeight: 4,
          strokeOpacity: 0.8,
        },
      })

      directionsRenderer.setMap(map)
      directionsRendererRef.current = directionsRenderer

      directionsService.route(
        {
          origin: pickupLocation,
          destination: destinationLocation,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            directionsRenderer.setDirections(result)
            const bounds = new google.maps.LatLngBounds()
            bounds.extend(pickupLocation)
            bounds.extend(destinationLocation)
            map.fitBounds(bounds, { padding: 50 })
          } else {
            console.error("Falló solicitud de direcciones:", status)
          }
        }
      )
    }
  }, [map, pickupLocation, destinationLocation, driverLocations, userType, isLoaded])

  const centerOnUser = () => {
    if (map && userLocation) {
      map.setCenter(userLocation)
      map.setZoom(15)
    }
  }

  if (error) return <MapFallback error={error} userType={userType} onRetry={retry} />
  if (isLoading || !isLoaded) return <MapFallback userType={userType} />

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className="rounded-lg"
        style={{
          width: "100%",
          height: "400px",
          backgroundColor: "#e5e7eb",
          position: "relative", // <-- clave para que se muestre el mapa
          overflow: "hidden",   // <-- clave también
        }}
      />

      {userLocation && (
        <Button
          onClick={centerOnUser}
          size="sm"
          className="absolute bottom-4 right-4 bg-white text-gray-700 hover:bg-gray-50 shadow-lg"
          variant="outline"
        >
          <Crosshair className="h-4 w-4" />
        </Button>
      )}

      {userType === "passenger" && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg text-sm">
          <p className="text-gray-600">Toca en el mapa para seleccionar ubicación</p>
        </div>
      )}

      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg text-xs text-gray-500">
        <p>Google Maps cargado ✓</p>
      </div>
    </div>
  )
}