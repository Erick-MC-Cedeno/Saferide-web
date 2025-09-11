"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"

// Keep track of driverIds we've already warned about to avoid spamming the console
const warnedInvalidDriverIds = new Set<string>()

export function useDriverStatus(driverId?: string) {
  const [isOnline, setIsOnline] = useState(false)
  const [loading, setLoading] = useState(true)
  const locationUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Función para obtener la ubicación actual
  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."))
        return
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      })
    })
  }

  // Función para actualizar la ubicación en la base de datos
  const updateDriverLocation = async () => {
    if (!supabase || !isOnline) return

    try {
      const position = await getCurrentLocation()
      const currentLocation = {
        type: "Point",
        coordinates: [position.coords.longitude, position.coords.latitude]
      }

      const { error } = await supabase
        .from("drivers")
        .update({ current_location: currentLocation })
        .eq("uid", driverId)

      if (error) throw error
    } catch (error) {
      console.error("Error updating driver location:", error)
    }
  }

  // Función para iniciar actualizaciones periódicas de ubicación
  const startLocationUpdates = () => {
    // Limpiar cualquier intervalo existente primero
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current)
    }
    
    // Iniciar un nuevo intervalo para actualizar la ubicación cada 30 segundos
    locationUpdateIntervalRef.current = setInterval(() => {
      updateDriverLocation()
    }, 30000) // 30 segundos
  }

  // Función para detener actualizaciones periódicas de ubicación
  const stopLocationUpdates = () => {
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current)
      locationUpdateIntervalRef.current = null
    }
  }

  useEffect(() => {
    // Check if Supabase is available
    if (!supabase) {
      console.warn("Supabase not available, using default offline status")
      setLoading(false)
      return
    }

    // Cargar estado inicial
    const loadDriverStatus = async () => {
      try {
        // Validate driverId - skip when placeholder or empty
        if (!driverId || typeof driverId !== "string" || driverId.trim().length === 0 || driverId === "current-driver-id") {
          // De-duplicate warnings so we don't spam the console repeatedly
          const warnKey = driverId ?? "__undefined__"
          if (!warnedInvalidDriverIds.has(warnKey)) {
            console.warn("Invalid driverId provided to useDriverStatus; skipping load")
            warnedInvalidDriverIds.add(warnKey)
          }
          setLoading(false)
          return
        }

        // Use maybeSingle to avoid errors when 0 rows
        const { data, error } = await supabase.from("drivers").select("is_online").eq("uid", driverId).maybeSingle()

        // Handle PostgREST 'no rows' as offline (some clients may still return PGRST116)
        if (error) {
          // If PostgREST returns PGRST116 (no rows) treat as not found -> offline
          if ((error as any)?.code === "PGRST116") {
            setIsOnline(false)
            setLoading(false)
            return
          }

          // For 406 Not Acceptable or other REST issues, log and set offline
          if ((error as any)?.status === 406 || (error as any)?.message?.toLowerCase?.().includes("not acceptable")) {
            console.warn("Supabase returned 406 Not Acceptable for driver status request; driverId=", driverId)
            setIsOnline(false)
            setLoading(false)
            return
          }

          throw error
        }

        if (!data) {
          // No driver found -> offline
          setIsOnline(false)
          setLoading(false)
          return
        }

        // data comes from PostgREST and may be typed as unknown; guard and coerce safely
        const isOnlineValue = (data as any)?.is_online ?? false
        setIsOnline(!!isOnlineValue)

        // Si el conductor está online, iniciar actualización periódica de ubicación
        if (isOnlineValue) {
          updateDriverLocation()
          startLocationUpdates()
        }
      } catch (error) {
        console.error("Error loading driver status:", error)
        // Ensure we set loading false even on unexpected errors
        setIsOnline(false)
      } finally {
        setLoading(false)
      }
    }

    loadDriverStatus()

    // Limpiar el intervalo cuando el componente se desmonte
    return () => {
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current)
        locationUpdateIntervalRef.current = null
      }
    }
  }, [driverId])

  const updateOnlineStatus = async (online: boolean) => {
    if (!supabase) {
      console.warn("Supabase not available, cannot update driver status")
      return { success: false, error: "Database not available" }
    }

    try {
      // Si el conductor está pasando a estar online, actualizar su ubicación actual
      if (online) {
        try {
          const position = await getCurrentLocation()
          const currentLocation = {
            type: "Point",
            coordinates: [position.coords.longitude, position.coords.latitude]
          }

          // Actualizar el estado online y la ubicación actual
          const { error } = await supabase
            .from("drivers")
            .update({ 
              is_online: online,
              current_location: currentLocation
            })
            .eq("uid", driverId)

          if (error) throw error
          
          // Iniciar actualizaciones periódicas de ubicación
          startLocationUpdates()
        } catch (locationError) {
          console.error("Error getting driver location:", locationError)
          // Si hay un error al obtener la ubicación, solo actualizar el estado online
          const { error } = await supabase.from("drivers").update({ is_online: online }).eq("uid", driverId)
          if (error) throw error
        }
      } else {
        // Si el conductor está pasando a estar offline, detener actualizaciones y actualizar estado
        stopLocationUpdates()
        const { error } = await supabase.from("drivers").update({ is_online: online }).eq("uid", driverId)
        if (error) throw error
      }
      
      setIsOnline(online)
      return { success: true }
    } catch (error: any) {
      console.error("Error updating driver status:", error)
      return { success: false, error: error.message }
    }
  }

  return { 
    isOnline, 
    loading, 
    updateOnlineStatus,
    updateDriverLocation,
    startLocationUpdates,
    stopLocationUpdates
  }
}
