"use client"

import { useEffect, useState, useRef } from "react"
import { supabase, type Database } from "@/lib/supabase"

type Ride = Database["public"]["Tables"]["rides"]["Row"]

export function useRealTimeRides(driverId?: string, passengerId?: string) {
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 5
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const isConnectingRef = useRef(false)

  useEffect(() => {
    if (!supabase) {
      console.warn("Supabase not available, using mock data")
      setRides([])
      setLoading(false)
      return
    }

    const loadInitialRides = async () => {
      try {
        let query = supabase?.from("rides").select("*") ?? null

        if (driverId) {
          // For drivers: show pending rides (available to accept) + their own rides
          query = query.or(`status.eq.pending,and(driver_id.eq.${driverId})`)
        } else if (passengerId) {
          // For passengers: show only their own rides
          query = query.eq("passenger_id", passengerId)
        }

        const { data, error } = await query.order("requested_at", { ascending: false })

        if (error) throw error
        setRides(data || [])
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        console.error("Error loading rides:", errorMessage)
      } finally {
        setLoading(false)
      }
    }

    const cleanupChannel = async () => {
      if (channelRef.current) {
        try {
          await supabase.removeChannel(channelRef.current)
          channelRef.current = null
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : "Unknown error"
          console.error("Error removing channel:", errorMessage)
        }
      }
    }

    const setupRealtimeSubscription = async () => {
      if (isConnectingRef.current) return
      isConnectingRef.current = true

      try {
        // Limpiar canal anterior
        await cleanupChannel()

        // Limpiar timeout anterior si existe
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = undefined
        }

        // Configurar nuevo canal
        channelRef.current = supabase
          .channel("rides-changes", {
            config: {
              broadcast: { ack: true },
              presence: { key: "" },
            },
          })
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "rides",
            },
            (payload) => {
              console.log("Real-time update:", payload)

              if (payload.eventType === "INSERT") {
                const newRide = payload.new as Ride

                // Add ride if it's relevant to current user
                if (driverId && newRide.status === "pending") {
                  // Show new pending rides to drivers
                  setRides((prev) => [newRide, ...prev])
                } else if (passengerId && newRide.passenger_id === passengerId) {
                  // Show passenger's own rides
                  setRides((prev) => [newRide, ...prev])
                }
              } else if (payload.eventType === "UPDATE") {
                const updatedRide = payload.new as Ride

                setRides((prev) => {
                  const existingRideIndex = prev.findIndex((ride) => ride.id === updatedRide.id)

                  if (existingRideIndex !== -1) {
                    // Update existing ride
                    const newRides = [...prev]
                    newRides[existingRideIndex] = updatedRide
                    return newRides
                  } else {
                    // Check if this updated ride should be shown to current user
                    if (driverId) {
                      // For drivers: show if it's pending or assigned to them
                      if (updatedRide.status === "pending" || updatedRide.driver_id === driverId) {
                        return [updatedRide, ...prev]
                      }
                    } else if (passengerId && updatedRide.passenger_id === passengerId) {
                      // For passengers: show if it's their ride
                      return [updatedRide, ...prev]
                    }
                    return prev
                  }
                })
              } else if (payload.eventType === "DELETE") {
                const deletedRide = payload.old as Ride
                setRides((prev) => prev.filter((ride) => ride.id !== deletedRide.id))
              }
            },
          )
          .subscribe(async (status) => {
            isConnectingRef.current = false

            if (status === "SUBSCRIBED") {
              console.log("✅ Real-time subscription active for rides")
              retryCountRef.current = 0
            } else if (status === "CHANNEL_ERROR" || status === "CLOSED" || status === "TIMED_OUT") {
              console.error(`❌ Channel error occurred: ${status}`)

              if (retryCountRef.current < maxRetries) {
                retryCountRef.current++
                const delay = Math.min(1000 * 2 ** retryCountRef.current, 30000)
                console.log(`🔄 Retrying connection in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`)

                reconnectTimeoutRef.current = setTimeout(() => {
                  setupRealtimeSubscription()
                }, delay)
              } else {
                console.error("💥 Max retries reached, giving up on realtime connection")
              }
            }
          })
      } catch (err: unknown) {
        isConnectingRef.current = false
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        console.error("Error setting up realtime subscription:", errorMessage)

        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++
          const delay = Math.min(1000 * 2 ** retryCountRef.current, 30000)
          reconnectTimeoutRef.current = setTimeout(() => {
            setupRealtimeSubscription()
          }, delay)
        }
      }
    }

    loadInitialRides()
    setupRealtimeSubscription()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      cleanupChannel()
    }
  }, [driverId, passengerId])

  // Helper functions for filtering rides
  const getPendingRides = () => rides.filter((ride) => ride.status === "pending")

  const getActiveRide = () =>
    rides.find(
      (ride) =>
        (driverId && ride.driver_id === driverId && ["accepted", "in-progress"].includes(ride.status)) ||
        (passengerId &&
          ride.passenger_id === passengerId &&
          ["pending", "accepted", "in-progress"].includes(ride.status)),
    )

  const getCompletedRides = () => rides.filter((ride) => ride.status === "completed")

  const getRecentRides = (limit = 5) =>
    rides
      .filter((ride) => ride.status === "completed")
      .sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime())
      .slice(0, limit)

  // Helper function to get rides that need rating
  const getRidesNeedingRating = () => {
    if (driverId) {
      // Driver needs to rate passengers
      return rides.filter((ride) => ride.status === "completed" && ride.driver_id === driverId && !ride.driver_rating)
    } else if (passengerId) {
      // Passenger needs to rate drivers
      return rides.filter(
        (ride) => ride.status === "completed" && ride.passenger_id === passengerId && !ride.passenger_rating,
      )
    }
    return []
  }

  return {
    rides,
    loading,
    // Helper functions
    getPendingRides,
    getActiveRide,
    getCompletedRides,
    getRecentRides,
    getRidesNeedingRating,
  }
}
