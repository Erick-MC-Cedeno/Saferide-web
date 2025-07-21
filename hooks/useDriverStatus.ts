"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"

export function useDriverStatus(driverId: string) {
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
        const { data, error } = await supabase.from("drivers").select("is_online").eq("uid", driverId).single()

        if (error) throw error
        setIsOnline(data.is_online)

        // Si el conductor está online, iniciar actualización periódica de ubicación
        if (data.is_online) {
          updateDriverLocation()
          startLocationUpdates()
        }
      } catch (error) {
        console.error("Error loading driver status:", error)
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
