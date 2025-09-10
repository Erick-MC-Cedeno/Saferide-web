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
  const markersRef = useRef<Array<google.maps.marker.AdvancedMarkerElement | google.maps.Marker>>([])
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

  // Referencia para el ID del seguimiento de ubicación
  const watchIdRef = useRef<number | null>(null)

  // Inicializa el mapa una vez que Google Maps esté cargado
  useEffect(() => {
    if (!isLoaded || !mapRef.current || isInitialized) {
      if (isLoading) {
        
      }
      return
    }

    const initMap = async () => {
      try {
        
        const defaultLocation = { lat: 19.4326, lng: -99.1332 }
        
        // Verificación adicional de seguridad
        if (!window.google?.maps?.Map) {
          
          return
        }

        
        const mapInstance = new window.google.maps.Map(mapRef.current!, {
          center: defaultLocation,
          zoom: 13,
          mapId: "DEMO_MAP_ID", // Requerido para marcadores avanzados
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })

        setMap(mapInstance)
        setIsInitialized(true)
        

        // Obtener ubicación del usuario
        if (navigator.geolocation) {
          // Obtener la posición inicial
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
          
          // Configurar seguimiento en tiempo real de la ubicación
          watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
              const userLoc = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              }
              setUserLocation(userLoc)
            },
            (error) => {
              console.error("Error en seguimiento de ubicación:", error)
            },
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
          )
        }
      } catch (error) {
        console.error("Error inicializando el mapa:", error)
      }
    }

    initMap()

    // Limpiar el seguimiento cuando el componente se desmonte
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
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
    markersRef.current.forEach((marker) => {
      if (marker instanceof google.maps.Marker) {
        marker.setMap(null)
      } else if (marker instanceof google.maps.marker.AdvancedMarkerElement) {
        marker.map = null
      }
    })
    markersRef.current = []
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null)
      directionsRendererRef.current = null
    }
  }

  // Referencia para el marcador de ubicación del usuario
  const userLocationMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)

  useEffect(() => {
    if (!map || !isLoaded) return

    clearMarkers()

    // Crear o actualizar el marcador de ubicación del usuario
    if (userLocation) {
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.position = userLocation
      } else {
        // Crear un pin personalizado para la ubicación del usuario
        const pinElement = new google.maps.marker.PinElement({
          background: "#3B82F6", // Azul
          borderColor: "#FFFFFF",
          glyphColor: "#FFFFFF",
          scale: 1.2,
        });
        
        userLocationMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
          position: userLocation,
          map,
          title: "Tu ubicación",
          content: pinElement.element,
          zIndex: 999, // Para que aparezca por encima de otros marcadores
        })
      }
    }

    if (pickupLocation) {
      // Crear un pin personalizado para el punto de recogida
      const pickupPinElement = new google.maps.marker.PinElement({
        background: "#10B981", // Verde
        borderColor: "#FFFFFF",
        glyphColor: "#FFFFFF",
        glyph: "P",
        scale: 1.2,
      });
      
      const pickupMarker = new google.maps.marker.AdvancedMarkerElement({
        position: pickupLocation,
        map,
        title: "Punto de recogida",
        content: pickupPinElement.element,
      })
      markersRef.current.push(pickupMarker)
    }

    if (destinationLocation) {
      // Crear un pin personalizado para el destino
      const destinationPinElement = new google.maps.marker.PinElement({
        background: "#EF4444", // Rojo
        borderColor: "#FFFFFF",
        glyphColor: "#FFFFFF",
        glyph: "D",
        scale: 1.2,
      });
      
      const destinationMarker = new google.maps.marker.AdvancedMarkerElement({
        position: destinationLocation,
        map,
        title: "Destino",
        content: destinationPinElement.element,
      })
      markersRef.current.push(destinationMarker)
    }

    if (userType === "passenger" && driverLocations.length > 0) {
      driverLocations.forEach((driver) => {
        // Crear un pin personalizado para cada conductor
        const driverPinElement = new google.maps.marker.PinElement({
          background: "#F59E0B", // Naranja
          borderColor: "#FFFFFF",
          glyphColor: "#FFFFFF",
          glyph: "C",
          scale: 1.2,
        });
        
        const driverMarker = new google.maps.marker.AdvancedMarkerElement({
          position: { lat: driver.lat, lng: driver.lng },
          map,
          title: `Conductor: ${driver.name}`,
          content: driverPinElement.element,
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
  className="rounded-lg w-full h-60 sm:h-72 md:h-96 bg-gray-200 relative overflow-hidden"
      />

      {userLocation && (
        <Button
          onClick={centerOnUser}
          size="sm"
          className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-white text-gray-700 hover:bg-gray-50 shadow-lg"
          variant="outline"
        >
          <Crosshair className="h-4 w-4" />
        </Button>
      )}

      {userType === "passenger" && (
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-white/90 backdrop-blur-sm p-1.5 sm:p-2 rounded-lg shadow-lg text-xs sm:text-sm">
          <p className="text-gray-600">Toca en el mapa para seleccionar ubicación</p>
        </div>
      )}

      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/90 backdrop-blur-sm p-1.5 sm:p-2 rounded-lg shadow-lg text-xs text-gray-500">
        <p>Google Maps cargado ✓</p>
      </div>
    </div>
  )
}