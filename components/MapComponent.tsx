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

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (!isLoaded || !mapRef.current || isInitialized) return

    const initMap = async () => {
      try {
        // Default location (Mexico City)
        const defaultLocation = { lat: 19.4326, lng: -99.1332 }

        // Create map instance
        const mapInstance = new google.maps.Map(mapRef.current!, {
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

        // Get user location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const userPos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              }
              setUserLocation(userPos)
              mapInstance.setCenter(userPos)

              // Add user location marker
              const userMarker = new google.maps.Marker({
                position: userPos,
                map: mapInstance,
                title: "Tu ubicación",
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: "#3B82F6",
                  fillOpacity: 1,
                  strokeColor: "#FFFFFF",
                  strokeWeight: 2,
                },
              })

              markersRef.current.push(userMarker)
            },
            (error) => {
              console.error("Geolocation error:", error);
              let errorMessage = "No se pudo obtener tu ubicación actual.";
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  errorMessage = "Permiso denegado para acceder a la ubicación. Por favor, habilita los servicios de ubicación en tu navegador.";
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMessage = "Información de ubicación no disponible.";
                  break;
                case error.TIMEOUT:
                  errorMessage = "La solicitud para obtener la ubicación ha caducado.";
                  break;
              }
              // You might want to display this message to the user, e.g., using a toast notification.
              console.error(errorMessage);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000, // 5 minutes
            },
          )
        }

        // Add click listener for passengers
        if (userType === "passenger" && onLocationSelect) {
          mapInstance.addListener("click", async (event: google.maps.MapMouseEvent) => {
            if (event.latLng) {
              const lat = event.latLng.lat()
              const lng = event.latLng.lng()

              try {
                const address = await reverseGeocode(lat, lng)
                onLocationSelect({ lat, lng, address })
              } catch (error) {
                console.error("Reverse geocoding error:", error)
                onLocationSelect({ lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` })
              }
            }
          })
        }
      } catch (error: any) {
        console.error("Map initialization error:", error)
      }
    }

    initMap()
  }, [isLoaded, userType, onLocationSelect, isInitialized])

  // Reverse geocoding function using Google Maps Geocoding API
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      if (typeof window === "undefined" || !window.google || !window.google.maps) {
        throw new Error("Google Maps not loaded")
      }

      const geocoder = new google.maps.Geocoder()
      const response = await geocoder.geocode({
        location: { lat, lng },
      })

      if (response.results && response.results.length > 0) {
        return response.results[0].formatted_address
      }

      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    } catch (error) {
      console.error("Google Maps geocoding error, falling back to Geoapify:", error)

      // Fallback to Geoapify
      try {
        const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY
        if (!apiKey) {
          return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        }

        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${apiKey}`,
        )

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()

        if (data.features && data.features.length > 0) {
          return data.features[0].properties.formatted || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        }

        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      } catch (fallbackError) {
        console.error("Geoapify fallback error:", fallbackError)
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      }
    }
  }

  // Clear all markers
  const clearMarkers = () => {
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null)
      directionsRendererRef.current = null
    }
  }

  // Add markers when locations change
  useEffect(() => {
    if (!map || !isLoaded) return

    // Clear existing markers except user location
    const userLocationMarker = markersRef.current.find((marker) => marker.getTitle() === "Tu ubicación")

    clearMarkers()

    // Re-add user location marker if it exists
    if (userLocationMarker) {
      markersRef.current.push(userLocationMarker)
    }

    // Pickup marker
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

    // Destination marker
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

    // Driver markers (for passengers)
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

    // Draw route if both pickup and destination exist
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
          avoidHighways: false,
          avoidTolls: false,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            directionsRenderer.setDirections(result)

            // Fit map to show the entire route
            const bounds = new google.maps.LatLngBounds()
            bounds.extend(pickupLocation)
            bounds.extend(destinationLocation)
            map.fitBounds(bounds, { padding: 50 })
          } else {
            console.error("Directions request failed:", status)
          }
        },
      )
    }
  }, [map, pickupLocation, destinationLocation, driverLocations, userType, isLoaded])

  const centerOnUser = () => {
    if (map && userLocation) {
      map.setCenter(userLocation)
      map.setZoom(15)
    }
  }

  // Show fallback if there's an error or still loading
  if (error) {
    return <MapFallback error={error} userType={userType} onRetry={retry} />
  }

  if (isLoading || !isLoaded) {
    return <MapFallback userType={userType} />
  }

  return (
    <div className="relative">
      <div ref={mapRef} className="h-96 w-full rounded-lg" />

      {/* Center on user button */}
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

      {/* Instructions for passengers */}
      {userType === "passenger" && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg text-sm">
          <p className="text-gray-600">Toca en el mapa para seleccionar ubicación</p>
        </div>
      )}

      {/* Map controls info */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg text-xs text-gray-500">
        <p>Google Maps cargado ✓</p>
      </div>
    </div>
  )
}
