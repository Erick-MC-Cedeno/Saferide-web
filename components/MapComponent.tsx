/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useRef, useState } from "react"
// UI button and crosshair icon removed to keep map UI clean
import { useGoogleMapsLoader } from "@/hooks/useGoogleMapsLoader"
import { MapFallback } from "./MapFallback"

// Lightweight declaration to avoid TS errors in editor about global `google` in runtime.
declare global {
  interface Window {
    google?: any
    googleMapsLoaded?: boolean
    initGoogleMaps?: () => void
  }
}

interface MapComponentProps {
  userType: "passenger" | "driver"
  // onLocationSelect removed (not used)
  pickupLocation?: { lat: number; lng: number }
  destinationLocation?: { lat: number; lng: number }
  driverLocations?: Array<{ id: string; lat: number; lng: number; name: string }>
  onMarkerClick?: (id: string) => void
  onMapReady?: (userLocation?: { lat: number; lng: number } | null) => void
}

export function MapComponent({
  userType,
  pickupLocation,
  destinationLocation,
  driverLocations = [],
  onMarkerClick,
  onMapReady,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const { isLoaded, isLoading, error, retry } = useGoogleMapsLoader()
  const [isInitialized, setIsInitialized] = useState(false)
  const markersRef = useRef<Array<any>>([])
  const directionsRendererRef = useRef<any | null>(null)

  // helper removed: waitForGoogleMapsReady (not used)

  // Referencia para el ID del seguimiento de ubicación
  const watchIdRef = useRef<number | null>(null)

  // Inicializa el mapa una vez que Google Maps esté cargado
  useEffect(() => {
    if (!isLoaded || !mapRef.current || isInitialized) {
      if (isLoading) {
        // still loading
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
          // Hide default UI controls to remove + / - zoom buttons and other default icons
          disableDefaultUI: true,
          zoomControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          keyboardShortcuts: false,
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
              // notify parent that map is ready with user location
              try {
                onMapReady?.(userLoc)
              } catch (err: unknown) {
                console.debug("onMapReady callback failed:", err)
              }
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
              try {
                onMapReady?.(userLoc)
              } catch (err: unknown) {
                console.debug("onMapReady callback failed (watch):", err)
              }
            },
            (error) => {
                console.error("Error en seguimiento de ubicación:", error)
              },
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
          )
        }
      } catch (error: unknown) {
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
  }, [isLoaded, isInitialized, isLoading, onMapReady])

  // reverseGeocode removed (not used in this component)

  const clearMarkers = () => {
    markersRef.current.forEach((marker) => {
      if (marker && typeof (marker as any).setMap === "function") {
        try {
          ;(marker as any).setMap(null)
        } catch {
          // ignore
        }
      } else if (marker && typeof (marker as any).map !== "undefined") {
        try {
          ;(marker as any).map = null
        } catch {
          // ignore
        }
      }
    })
    markersRef.current = []
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null)
      directionsRendererRef.current = null
    }
  }

  // Referencia para el marcador de ubicación del usuario
  const userLocationMarkerRef = useRef<any | null>(null)

  useEffect(() => {
    if (!map || !isLoaded) return

    clearMarkers()

    // Crear o actualizar el marcador de ubicación del usuario
  if (userLocation) {
      if (userLocationMarkerRef.current) {
        try {
          ;(userLocationMarkerRef.current as any).position = userLocation
        } catch {
          // ignore
        }
      } else {
        // Crear un pin personalizado para la ubicación del usuario
        const pinElement = new (window as any).google.maps.marker.PinElement({
          background: "#3B82F6", // Azul
          borderColor: "#FFFFFF",
          glyphColor: "#FFFFFF",
          scale: 1.2,
        });
        
        userLocationMarkerRef.current = new (window as any).google.maps.marker.AdvancedMarkerElement({
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
      const pickupPinElement = new (window as any).google.maps.marker.PinElement({
        background: "#10B981", // Verde
        borderColor: "#FFFFFF",
        glyphColor: "#FFFFFF",
        glyphText: "P",
        scale: 1.2,
      });
      
      const pickupMarker = new (window as any).google.maps.marker.AdvancedMarkerElement({
        position: pickupLocation,
        map,
        title: "Punto de recogida",
        content: pickupPinElement.element,
      })
      markersRef.current.push(pickupMarker)
    }

    if (destinationLocation) {
      // Crear un pin personalizado para el destino
      const destinationPinElement = new (window as any).google.maps.marker.PinElement({
        background: "#EF4444", // Rojo
        borderColor: "#FFFFFF",
        glyphColor: "#FFFFFF",
        glyphText: "D",
        scale: 1.2,
      });
      
      const destinationMarker = new (window as any).google.maps.marker.AdvancedMarkerElement({
        position: destinationLocation,
        map,
        title: "Destino",
        content: destinationPinElement.element,
      })
      markersRef.current.push(destinationMarker)
    }

  // Show driver markers for passengers AND drivers when driverLocations provided.
  // For passengers it represents nearby drivers; for drivers it represents assigned rides
  // (i.e., passenger-selected driver or accepted rides) passed via driverLocations.
  if (driverLocations.length > 0) {
      // To ensure visibility across browsers/environments use classic google.maps.Marker
      // Also apply a tiny jitter when multiple drivers are very close so pins don't overlap.
      const seen: Record<string, number> = {}
  driverLocations.forEach((driver, idx) => {
        try {
          const key = `${driver.lat.toFixed(6)}:${driver.lng.toFixed(6)}`
          const count = (seen[key] || 0) + 1
          seen[key] = count

          // small jitter in degrees (~5-10 meters) when multiple markers collide
          const jitterFactor = 0.00003
          const jitterLat = (count - 1) * jitterFactor * (idx % 2 === 0 ? 1 : -1)
          const jitterLng = (count - 1) * jitterFactor * (idx % 3 === 0 ? 1 : -1)

          const markerPos = { lat: driver.lat + jitterLat, lng: driver.lng + jitterLng }

          const svgIcon = {
            url: 'data:image/svg+xml;charset=UTF-8,' +
              encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
                  <circle cx="12" cy="10" r="6" fill="#ef4444" stroke="#fff" stroke-width="1.5" />
                  <path d="M12 15c-1.5 0-4 2-4 4h8c0-2-2.5-4-4-4z" fill="#ef4444" />
                </svg>
              `),
            scaledSize: new (window as any).google.maps.Size(48, 48),
            anchor: new (window as any).google.maps.Point(16, 48),
          }

          // Prefer AdvancedMarkerElement if available; fallback to classic Marker for environments
          // that don't support advanced markers yet.
          if (window.google?.maps?.marker?.AdvancedMarkerElement) {
            const el = document.createElement("div")
            // inline the same SVG used previously so appearance stays consistent
            el.innerHTML = `
              <svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24'>
                <circle cx='12' cy='10' r='6' fill='#ef4444' stroke='#fff' stroke-width='1.5' />
                <path d='M12 15c-1.5 0-4 2-4 4h8c0-2-2.5-4-4-4z' fill='#ef4444' />
              </svg>
            `
            const advMarker = new (window as any).google.maps.marker.AdvancedMarkerElement({
              position: markerPos,
              map,
              title: `Conductor: ${driver.name}`,
              content: el,
              zIndex: 500,
            })

            // attach click listener to the rendered element if caller provided handler
            try {
              if (el && typeof el.addEventListener === "function" && typeof onMarkerClick === "function") {
                el.addEventListener("click", () => {
                  try {
                    onMarkerClick(driver.id)
                  } catch (e) {
                    console.warn("onMarkerClick handler failed:", e)
                  }
                })
              }
            } catch {
              // ignore
            }

            markersRef.current.push(advMarker)
            console.debug("Driver advanced marker created:", driver.id || driver.name, markerPos)
          } else {
            const marker = new (window as any).google.maps.Marker({
              position: markerPos,
              map,
              title: `Conductor: ${driver.name}`,
              icon: svgIcon,
              zIndex: 500,
            })

            // attach click listener to classic marker
            try {
              if (typeof marker.addListener === "function" && typeof onMarkerClick === "function") {
                marker.addListener("click", () => {
                  try {
                    onMarkerClick(driver.id)
                  } catch (e) {
                    console.warn("onMarkerClick handler failed:", e)
                  }
                })
              }
            } catch {
              // ignore
            }

            markersRef.current.push(marker)
            console.debug("Driver marker created (fallback):", driver.id || driver.name, markerPos)
          }
        } catch (err) {
          console.warn("Error creando marcador de conductor:", err, driver)
        }
      })
  }

    if (pickupLocation && destinationLocation) {
      const directionsService = new (window as any).google.maps.DirectionsService()
      const directionsRenderer = new (window as any).google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#3B82F6",
          strokeWeight: 4,
          strokeOpacity: 0.8,
        },
      })

  directionsRenderer.setMap(map as any)
      directionsRendererRef.current = directionsRenderer

      directionsService.route(
        {
          origin: pickupLocation,
          destination: destinationLocation,
    travelMode: (window as any).google.maps.TravelMode.DRIVING,
        },
        (result: any, status: any) => {
          if (status === (window as any).google.maps.DirectionsStatus.OK && result) {
            directionsRenderer.setDirections(result)
            const bounds = new (window as any).google.maps.LatLngBounds()
            bounds.extend(pickupLocation)
            bounds.extend(destinationLocation)
            ;(map as any).fitBounds(bounds, { padding: 50 })
          } else {
            console.error("Falló solicitud de direcciones:", status)
          }
        }
      )
    }
  }, [map, pickupLocation, destinationLocation, driverLocations, userType, isLoaded, userLocation, onMarkerClick])

  // centerOnUser removed (not used)

  if (error) return <MapFallback error={error} userType={userType} onRetry={retry} />
  if (isLoading || !isLoaded) return <MapFallback userType={userType} />

  return (
    <div className="relative h-full">
      <div
        ref={mapRef}
        className="rounded-lg w-full h-full bg-gray-200 relative overflow-hidden"
      />

      {/* Overlays intentionally removed for a clean map UI; map functionality remains unchanged */}
    </div>
  )
}