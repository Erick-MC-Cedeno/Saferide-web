"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { supabase, type Database } from "@/lib/supabase"

type Ride = Database["public"]["Tables"]["rides"]["Row"]

/* --------- simple in-memory cache to cut DB calls ---------- */
const ridesCache = new Map<string, { data: Ride[]; timestamp: number }>()
const CACHE_DURATION = 3_000 // 3 s

export function useRealTimeRides(driverId?: string, passengerId?: string) {
  /* ------------ state --------------- */
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  /* ------------ refs --------------- */
  const pollingInterval = useRef<number | null>(null)
  const mountedRef = useRef(true)
  const isLoadingRef = useRef(false)

  const cacheKey = `rides-${driverId || passengerId || "global"}`

  /* ------------ fetch helper --------------- */
  const loadRides = useCallback(
    async (forceRefresh = false) => {
      if (!mountedRef.current || isLoadingRef.current) return

      /* honour cache unless forced */
      if (!forceRefresh) {
        const cached = ridesCache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setRides(cached.data)
          setLoading(false)
          return
        }
      }

      isLoadingRef.current = true
      setLoading(true)
      try {
        let q = supabase.from("rides").select("*")
        if (driverId) {
          q = q.or(`status.eq.pending,and(driver_id.eq.${driverId})`)
        } else if (passengerId) {
          q = q.eq("passenger_id", passengerId)
        }

        const { data, error } = await q.order("requested_at", { ascending: false })
        if (error) throw error

        // supabase returns loosely-typed data (unknown[]). Cast explicitly to Ride[]
        const ridesData = (data ?? []) as unknown as Ride[]

        ridesCache.set(cacheKey, { data: ridesData, timestamp: Date.now() })
        if (mountedRef.current) {
          setRides(ridesData)
          setLastUpdate(new Date())
        }
      } catch (e: unknown) {
        if (mountedRef.current) {
          const msg = (e as { message?: string })?.message ?? String(e)
          setError(msg ?? "Error desconocido")
        }
      } finally {
        isLoadingRef.current = false
        mountedRef.current && setLoading(false)
      }
    },
    [driverId, passengerId, cacheKey],
  )

  /* ------------ polling --------------- */
  const startPolling = useCallback(() => {
    if (pollingInterval.current !== null) {
      clearInterval(pollingInterval.current)
    }
    const interval = driverId ? 3_000 : 5_000
    pollingInterval.current = window.setInterval(() => loadRides(), interval)
  }, [loadRides, driverId])

  /* ------------ side-effects --------------- */
  useEffect(() => {
    mountedRef.current = true
    ;(async () => {
      await loadRides(true)
      startPolling()
    })()

    return () => {
      mountedRef.current = false
      if (pollingInterval.current !== null) {
        clearInterval(pollingInterval.current)
        pollingInterval.current = null
      }
      ridesCache.delete(cacheKey)
    }
  }, [cacheKey, loadRides, startPolling])

  /* ------------ ride actions --------------- */
  const cancelRide = useCallback(
    async (id: string, reason = "Cancelado") => {
      const { error } = await supabase
        .from("rides")
        .update({ status: "cancelled", cancellation_reason: reason, cancelled_at: new Date().toISOString() })
        .eq("id", id)
        .in("status", ["pending", "accepted", "in-progress"])
      if (error) return { success: false, error: error.message }
      await loadRides(true)
      return { success: true }
    },
    [loadRides],
  )

  const rejectRide = useCallback(
    async (id: string, reason = "Rechazado") => {
      setRides((r) => r.filter((ride) => ride.id !== id))
      ridesCache.delete(cacheKey)
      console.info(`Ride ${id} rejected: ${reason}`)
      return { success: true }
    },
    [cacheKey],
  )

  const acceptRide = useCallback(
    async (id: string, driverName: string) => {
      const { error } = await supabase
        .from("rides")
        .update({
          driver_id: driverId,
          driver_name: driverName,
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("status", "pending")
      if (error) return { success: false, error: error.message }
      await loadRides(true)
      return { success: true }
    },
    [driverId, loadRides],
  )

  const updateRideStatus = useCallback(
    async (id: string, status: Ride["status"]) => {
      const update: Partial<Ride> = { status }
      if (status === "completed") update.completed_at = new Date().toISOString()
      const { error } = await supabase.from("rides").update(update).eq("id", id)
      if (error) return { success: false, error: error.message }
      await loadRides(true)
      return { success: true }
    },
    [loadRides],
  )

  /* ------------ helpers --------------- */
  const refreshRides = () => loadRides(true) // public alias

  return {
    /* data */
    rides,
    loading,
    error,
    lastUpdate,
    /* helpers */
    cancelRide,
    rejectRide,
    acceptRide,
    updateRideStatus,
    refreshRides,
    /* selectors */
    getPendingRides: () => rides.filter((r) => r.status === "pending"),
    getActiveRide: () =>
      rides.find((r) =>
        driverId
          ? r.driver_id === driverId && ["accepted", "in-progress"].includes(r.status)
          : passengerId
            ? r.passenger_id === passengerId && ["pending", "accepted", "in-progress"].includes(r.status)
            : false,
      ),
    getCompletedRides: () => rides.filter((r) => r.status === "completed"),
  }
}
