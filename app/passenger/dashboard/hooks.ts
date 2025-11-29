"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { DriverApi, DriverDataResult, RideRow } from "./types"

export function usePassengerData() {
  const { user } = useAuth()
  const [recentTrips, setRecentTrips] = useState<unknown[]>([])
  const [passengerStats, setPassengerStats] = useState<{ totalTrips: number; totalSpent: number; averageRating: number }>({
    totalTrips: 0,
    totalSpent: 0,
    averageRating: 0,
  })

  useEffect(() => {
    const loadPassengerData = async () => {
      if (!supabase || !user?.uid) return
      try {
        const { data: passengerRow } = await supabase
          .from("passengers")
          .select("total_trips, rating")
          .eq("uid", user.uid)
          .single()
        const passengerInfo = (passengerRow ?? null) as unknown as { total_trips?: number; rating?: number } | null

        const { data: completedRides } = await supabase
          .from("rides")
          .select(
            "id, driver_name, passenger_rating, driver_rating, actual_fare, estimated_fare, estimated_duration, completed_at, pickup_address, destination_address",
          )
          .eq("passenger_id", user.uid)
          .eq("status", "completed")
          .order("completed_at", { ascending: false })

        if (completedRides) {
          type RideRow = {
            actual_fare?: number | string | null
            estimated_fare?: number | string | null
            driver_rating?: number | null
            passenger_rating?: number | null
            completed_at?: string | null
            id?: string
            driver_name?: string | null
            estimated_duration?: number | null
            pickup_address?: string | null
            destination_address?: string | null
          }

          const completed = (completedRides ?? []) as unknown as RideRow[]
          const totalSpent = completed.reduce(
            (sum, ride) => sum + Number(ride.actual_fare ?? ride.estimated_fare ?? 0),
            0,
          )
          const ratedRides = completed.filter((ride) => ride.driver_rating != null)
          let averageRating =
            ratedRides.length > 0
              ? ratedRides.reduce((sum, ride) => sum + Number(ride.driver_rating ?? 0), 0) / ratedRides.length
              : 0

          if (!averageRating && passengerInfo && passengerInfo.rating) {
            averageRating = Number(passengerInfo.rating)
          }

          setPassengerStats({
            totalTrips: completed.length,
            totalSpent,
            averageRating,
          })
          setRecentTrips(completed.slice(0, 5))
        }
      } catch (error) {
        console.error("Error loading passenger data:", error)
      }
    }
    loadPassengerData()
  }, [user?.uid])

  return { recentTrips, passengerStats }
}

export function useDriverData() {
  const { toast } = useToast()
  
  const DEFAULT_RADIUS_KM = useMemo(() => {
    try {
      const v = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_RADIO : undefined
      const parsed = v ? Number.parseFloat(v) : 1
      return isNaN(parsed) ? 1 : parsed
    } catch {
      return 1
    }
  }, [])

  const driverData = useCallback(
    async (lat?: number | null, lng?: number | null, radiusKm?: number): Promise<DriverDataResult> => {
      try {
        const params = new URLSearchParams()
        const rad = typeof radiusKm === "number" ? radiusKm : DEFAULT_RADIUS_KM
        if (typeof lat === "number" && typeof lng === "number") {
          params.set("lat", String(lat))
          params.set("lng", String(lng))
          params.set("radiusKm", String(rad))
        }

        const url = "/api/drivers/all" + (params.toString() ? `?${params.toString()}` : "")
        const response = await fetch(url)
        const result = await response.json()

        if (!result.success) {
          console.error("Error en driverData:", result.error)
          if (result.error === "Aún no hay rangos configurados") {
            return { success: false, noRangesConfigured: true, error: result.error }
          }
          throw new Error(result.error || "Error al obtener conductores")
        }

        const data = Array.isArray(result?.data) ? (result.data as DriverApi[]) : []
        return { success: true, data }
      } catch (error) {
        console.error("Error en driverData:", error)
        throw error
      }
    },
    [DEFAULT_RADIUS_KM],
  )

  const haversineDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number) => {
    const toRad = (v: number) => (v * Math.PI) / 180
    const R = 6371
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }, [])

  const showNearbyDriversInMap = useCallback(
    async (userLat?: number | null, userLng?: number | null) => {
      try {
        const res =
          typeof userLat === "number" && typeof userLng === "number"
            ? await driverData(userLat, userLng, DEFAULT_RADIUS_KM)
            : await driverData()

        if (res && res.noRangesConfigured) {
          toast({
            title: "Rangos no configurados",
            description: "Aún no hay rangos configurados en el servidor",
            variant: "destructive",
          })
          return []
        }

        const mapped = (res.data ?? []).map((d: DriverApi) => {
          const coords = d?.current_location?.coordinates || d?.location?.coordinates || d?.coordinates
          let lat = 0
          let lng = 0
          if (Array.isArray(coords) && coords.length >= 2) {
            lng = Number(coords[0])
            lat = Number(coords[1])
          } else if (d?.lat && d?.lng) {
            lat = Number(d.lat)
            lng = Number(d.lng)
          }
          return { ...d, lat, lng }
        })

        let nearby = mapped
        if (typeof userLat === "number" && typeof userLng === "number") {
          nearby = mapped.filter((d: DriverApi & { lat: number; lng: number }) => {
            if (!d || isNaN(d.lat) || isNaN(d.lng)) return false
            const dist = haversineDistance(userLat, userLng, d.lat, d.lng)
            return dist <= DEFAULT_RADIUS_KM
          })
        }

        nearby = nearby.filter((d: DriverApi) => Boolean(d.is_online))

        const driversForMapNormalized = nearby.map((d: DriverApi & { lat: number; lng: number }, idx: number) => ({
          id: String(d.id ?? d.uid ?? idx),
          uid: d.uid,
          name: String(d.name || d.full_name || d.driver_name || ""),
          lat: d.lat,
          lng: d.lng,
        }))

        if ((driversForMapNormalized || []).length === 0) {
          toast({
            title: "Sin conductores cercanos",
            description: `No se encontraron conductores a ≤ ${DEFAULT_RADIUS_KM} km`,
            variant: "default",
          })
        }
        return driversForMapNormalized
      } catch (err) {
        console.error("Error loading nearby drivers:", err)
        return []
      }
    },
    [driverData, DEFAULT_RADIUS_KM, haversineDistance, toast],
  )

  return { driverData, haversineDistance, showNearbyDriversInMap, DEFAULT_RADIUS_KM }
}

export function useChatNotifications(currentRide: RideRow | undefined) {
  const { user } = useAuth()
  const [chatUnread, setChatUnread] = useState(0)
  const [chatLastMessage, setChatLastMessage] = useState<string | null>(null)
  const [chatNotificationEnabled, setChatNotificationEnabled] = useState<boolean | null>(null)
  const chatChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const audioChatRef = useRef<HTMLAudioElement | null>(null)
  const playChatUnlockAttachedRef = useRef<boolean>(false)

  useEffect(() => {
    if (!audioChatRef.current) {
      audioChatRef.current = new Audio()
      audioChatRef.current.preload = "auto"
      fetch("/api/sounds/saferidechattone")
        .then((r) => r.json())
        .then((j) => {
          if (j?.base64) audioChatRef.current!.src = `data:audio/mpeg;base64,${j.base64}`
        })
        .catch((e) => console.warn("Could not load saferidechattone:", e))
    }
  }, [])

  useEffect(() => {
    try {
      if (user?.uid) {
        const chatKey = `saferide_chat_notification_${user.uid}`
        const local = localStorage.getItem(chatKey)
        if (local !== null) setChatNotificationEnabled(JSON.parse(local))
        else setChatNotificationEnabled(true)
      } else {
        setChatNotificationEnabled(true)
      }
    } catch (e) {
      console.warn("Could not read saferide_chat_notification from localStorage (passenger):", e)
      setChatNotificationEnabled(true)
    }
    const onStorage = (e: StorageEvent) => {
      try {
        if (!user?.uid) return
        const chatKey = `saferide_chat_notification_${user.uid}`
        if (e.key === chatKey) {
          try {
            setChatNotificationEnabled(e.newValue ? JSON.parse(e.newValue) : null)
          } catch {}
        }
      } catch {}
    }

    const onPrefChanged = (ev: Event) => {
      try {
        if (!user?.uid) return
        const detail = (ev as CustomEvent & { detail?: Record<string, unknown> }).detail
        const key = String(detail?.key ?? "")
        const value = String(detail?.value ?? "")
        const chatKey = `saferide_chat_notification_${user.uid}`
        if (key === chatKey) {
          try {
            setChatNotificationEnabled(value ? JSON.parse(value) : null)
          } catch {}
        }
      } catch {}
    }
    window.addEventListener("storage", onStorage)
    window.addEventListener("saferide:pref-changed", onPrefChanged)
    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("saferide:pref-changed", onPrefChanged)
    }
  }, [user?.uid])

  const playChatAudioWithUnlock = async () => {
    if (!audioChatRef.current) return
    try {
      await audioChatRef.current.play()
      return
    } catch (errUnknown) {
      const err = errUnknown as { name?: string; message?: string }
      const isNotAllowed = err && (err.name === "NotAllowedError" || String(err.message).includes("didn't interact"))
      if (!isNotAllowed) {
        console.warn("Chat audio play failed:", err)
        return
      }
      if (playChatUnlockAttachedRef.current) return
      playChatUnlockAttachedRef.current = true
      const tryUnlock = async () => {
        try {
          const Ctor = window.AudioContext ?? window.webkitAudioContext
          const ctx = window.audioContext ?? (typeof Ctor === "function" ? new Ctor() : undefined)
          if (ctx && typeof ctx.resume === "function") {
            await ctx.resume()
            ;(window as unknown as { audioContext?: AudioContext }).audioContext = ctx
          }
        } catch {}
        try {
          await audioChatRef.current!.play()
        } catch (eUnknown) {
          const e = eUnknown as Error
          console.warn("Retry chat audio play after user interaction failed:", e)
        } finally {
          window.removeEventListener("pointerdown", tryUnlock)
          window.removeEventListener("keydown", tryUnlock)
          playChatUnlockAttachedRef.current = false
        }
      }
      window.addEventListener("pointerdown", tryUnlock, { once: true })
      window.addEventListener("keydown", tryUnlock, { once: true })
      return
    }
  }

  useEffect(() => {
    let mounted = true
    const setup = async () => {
      if (chatChannelRef.current) {
        try {
          await supabase.removeChannel(chatChannelRef.current)
        } catch {}
        chatChannelRef.current = null
      }
      if (!currentRide) return
      try {
        const channel = supabase
          .channel(`ride-chat-notify-passenger-${currentRide.id}`)
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "ride_messages", filter: `ride_id=eq.${currentRide.id}` },
            (payload) => {
              if (!mounted) return
              const newRecord = (payload as { new?: Record<string, unknown> }).new ?? {}
              const message = typeof newRecord.message === "string" ? newRecord.message : String(newRecord.message ?? "")
              setChatLastMessage(message)
              if (newRecord.sender_type === "driver") {
                setChatUnread((c) => c + 1)
                if (chatNotificationEnabled === null || chatNotificationEnabled === true) {
                  playChatAudioWithUnlock().catch(() => {})
                }
              }
            },
          )
          .subscribe()
        chatChannelRef.current = channel
      } catch (_err) {
        console.error("Error subscribing to chat notifications (passenger):", _err)
      }
    }
    setup()
    return () => {
      mounted = false
      if (chatChannelRef.current) {
        supabase.removeChannel(chatChannelRef.current).catch(() => {})
        chatChannelRef.current = null
      }
    }
  }, [currentRide, chatNotificationEnabled])

  return { chatUnread, setChatUnread, chatLastMessage, chatNotificationEnabled }
}