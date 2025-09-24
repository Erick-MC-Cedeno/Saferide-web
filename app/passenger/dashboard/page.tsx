"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  MapPin,
  Star,
  Car,
  Activity,
  MessageCircle,
  Settings,
  LogOut,
  Plus,
  Minus,
  Share,
  Menu,
  History,
  X,
} from "lucide-react"
import { useRealTimeRides } from "@/hooks/useRealTimeRides"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { MapComponent } from "@/components/MapComponent"
import { AddressAutocomplete } from "@/components/AddressAutocomplete"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useToast } from "@/hooks/use-toast"
import { RideChat } from "@/components/RideChat"
import { useRouter } from "next/navigation" // Import useRouter

// DASHBOARD PASSENGER CONTENT
function PassengerDashboardContent() {
  const router = useRouter() // Initialize useRouter
  const { user, userData } = useAuth()
  const { toast } = useToast()
  // Types
  type DriverApi = {
    id?: string | number
    uid?: string
    name?: string
    full_name?: string
    driver_name?: string
    current_location?: { coordinates?: number[] }
    location?: { coordinates?: number[] }
    coordinates?: number[] | null
    lat?: number | string
    lng?: number | string
    is_online?: boolean
    is_verified?: boolean
    rating?: number
    vehicle_model?: string
  }

  type NewRidePayload = {
    passenger_id: string
    passenger_name?: string
    pickup_address: string
    pickup_coordinates: [number, number]
    destination_address: string
    destination_coordinates: [number, number]
    status: string
    estimated_fare?: number
    estimated_duration?: number
    driver_id?: string
    driver_name?: string
    accepted_at?: string
  }
  const [pickup, setPickup] = useState("")
  const [destination, setDestination] = useState("")
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null)
  type RideStatus = "idle" | "searching" | "pending" | "accepted" | "in-progress"
  const [rideStatus, setRideStatus] = useState<RideStatus>("idle")
  const [availableDrivers, setAvailableDrivers] = useState([])
  const [selectedDriver, setSelectedDriver] = useState("")
  // Mensaje visible cuando no hay conductores en el área
  const [noDriversNearby, setNoDriversNearby] = useState("")
  const [showDriverSelection, setShowDriverSelection] = useState(false)
  const [showRatingDialog, setShowRatingDialog] = useState(false)
  const [completedRide, setCompletedRide] = useState(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [recentTrips, setRecentTrips] = useState([])
  const [passengerStats, setPassengerStats] = useState({
    totalTrips: 0,
    totalSpent: 0,
    averageRating: 0,
  })

  // QUIK DESTINATIONS REMOVED
  const [showChatDialog, setShowChatDialog] = useState(false)
  const [chatUnread, setChatUnread] = useState(0)
  const [chatLastMessage, setChatLastMessage] = useState<string | null>(null)
  const chatChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const audioChatRef = useRef<HTMLAudioElement | null>(null)
  const playChatUnlockAttachedRef = useRef<boolean>(false)
  const [chatNotificationEnabled, setChatNotificationEnabled] = useState<boolean | null>(null)
  const { rides, cancelRide, refreshRides } = useRealTimeRides(undefined, user?.uid)
  const currentRide = rides.find((ride) => ["pending", "accepted", "in-progress"].includes(ride.status))
  const [driversForMap, setDriversForMap] = useState<
    Array<{ id: string; uid?: string; name: string; lat: number; lng: number }>
  >([])

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
  const [drawerHeight, setDrawerHeight] = useState(50) // Percentage of screen height

  // RESET RIDE STATUS WHEN NO CURRENT RIDE
  useEffect(() => {
    if (!currentRide && rideStatus !== "idle") {
      setRideStatus("idle")
    }
    // rideStatus intentionally included
  }, [!!currentRide, rideStatus])

  // Chat notifications (passenger listens for messages from driver)
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
              const msg = payload.new as any
              setChatLastMessage(String(msg.message ?? ""))
              // if message comes from driver, increment unread for passenger
              if (msg.sender_type === "driver") {
                setChatUnread((c) => c + 1)
                // Use in-memory state which is kept in sync via storage events and the toggle
                if (chatNotificationEnabled === null || chatNotificationEnabled === true) {
                  playChatAudioWithUnlock().catch(() => {})
                }
              }
            },
          )
          .subscribe()
        chatChannelRef.current = channel
      } catch (err) {
        console.error("Error subscribing to chat notifications (passenger):", err)
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
  }, [currentRide, chatNotificationEnabled]) // Changed dependency from currentRide.id to currentRide

  // PRELOAD CHAT AUDIO AND HELPER TO UNLOCK/PLAY ON INTERACTION
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

  // LOAD CHAT NOTIFICATION PREFERENCE FROM LOCAL STORAGE
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
          } catch (err) {
            console.warn("Error parsing storage event for chat toggle (passenger)", err)
          }
        }
      } catch (err) {
        // ignore
      }
    }

    // LOAD CHAT NOTIFICATION SETTINGS FROM LOCAL STORAGE
    const onPrefChanged = (ev: Event) => {
      try {
        if (!user?.uid) return
        // @ts-ignore
        const detail = (ev as CustomEvent).detail
        const key: string = detail?.key
        const value: string = detail?.value
        const chatKey = `saferide_chat_notification_${user.uid}`
        if (key === chatKey) {
          try {
            setChatNotificationEnabled(value ? JSON.parse(value) : null)
          } catch (err) {
            console.warn("Error parsing pref-changed value for chat toggle (passenger)", err)
          }
        }
      } catch (err) {
        // ignore
      }
    }
    window.addEventListener("storage", onStorage)
    window.addEventListener("saferide:pref-changed", onPrefChanged)
    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("saferide:pref-changed", onPrefChanged)
    }
  }, [user?.uid])

  // HELPER: TRY TO PLAY AUDIO IMMEDIATELY; IF BLOCKED BY AUTOPLAY POLICY,
  const playChatAudioWithUnlock = async () => {
    if (!audioChatRef.current) return
    try {
      await audioChatRef.current.play()
      return
    } catch (err: any) {
      const isNotAllowed = err && (err.name === "NotAllowedError" || String(err.message).includes("didn't interact"))
      if (!isNotAllowed) {
        console.warn("Chat audio play failed:", err)
        return
      }
      if (playChatUnlockAttachedRef.current) return
      playChatUnlockAttachedRef.current = true
      const tryUnlock = async () => {
        try {
          // @ts-ignore
          const ctx = (window as any).audioContext || new (window.AudioContext || (window as any).webkitAudioContext)()
          if (ctx && typeof ctx.resume === "function") {
            await ctx.resume()
            ;(window as any).audioContext = ctx
          }
        } catch (e) {
          // ignore
        }
        try {
          await audioChatRef.current!.play()
        } catch (e: any) {
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

  // LOAD PASSENGER STATISTICS AND RECENT TRIPS
  useEffect(() => {
    const loadPassengerData = async () => {
      if (!supabase || !user?.uid) return
      try {
        // Get passenger stats
        const { data: passengerRow } = await supabase
          .from("passengers")
          .select("total_trips, rating")
          .eq("uid", user.uid)
          .single()
        const passengerInfo = (passengerRow ?? null) as unknown as { total_trips?: number; rating?: number } | null

        // GET COMPLETED RIDES FOR SPENDING CALCULATION
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
          // Calculate average rating from driver ratings
          const ratedRides = completed.filter((ride) => ride.driver_rating != null)
          let averageRating =
            ratedRides.length > 0
              ? ratedRides.reduce((sum, ride) => sum + Number(ride.driver_rating ?? 0), 0) / ratedRides.length
              : 0

          // Fallback: if DB has passenger rating stored separately use it
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

  // DEFAULT RADIUS (KM) READ FROM ENV FOR CLIENT SIDE
  const DEFAULT_RADIUS_KM = useMemo(() => {
    try {
      const v = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_RADIO : undefined
      const parsed = v ? Number.parseFloat(v) : 1
      return isNaN(parsed) ? 1 : parsed
    } catch {
      return 1
    }
  }, [])

  // FUNCION PARA OPTENER LOS DATOS DE EL DRIVER
  const driverData = useCallback(
    async (lat?: number | null, lng?: number | null, radiusKm?: number) => {
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

        // Manejo especial: si el servidor responde que no hay rangos configurados,
        // devolver un objeto con flag para que el UI lo maneje sin lanzar excepción.
        if (!result.success) {
          console.error("Error en driverData:", result.error)
          if (result.error === "Aún no hay rangos configurados") {
            return { success: false, noRangesConfigured: true, error: result.error }
          }
          throw new Error(result.error || "Error al obtener conductores")
        }

        return { success: true, ...result }
      } catch (error) {
        console.error("Error en driverData:", error)
        throw error
      }
    },
    [DEFAULT_RADIUS_KM],
  )

  // HAVERSINE DISTANCE FUNCTION
  const haversineDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number) => {
    const toRad = (v: number) => (v * Math.PI) / 180
    const R = 6371 // km
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }, [])
  // SHOW NEARBY DRIVERS CALLS  /api/drivers/all, maps coordinates, filters by configured radius
  const showNearbyDriversInMap = useCallback(
    async (userLat?: number | null, userLng?: number | null) => {
      try {
        // If we have user coords, prefer server-side filtering for robustness
        const res =
          typeof userLat === "number" && typeof userLng === "number"
            ? await driverData(userLat, userLng, DEFAULT_RADIUS_KM)
            : await driverData()
        // Manejo cuando el servidor indica que no hay rangos configurados
        if (res && res.noRangesConfigured) {
          toast({
            title: "Rangos no configurados",
            description: "Aún no hay rangos configurados en el servidor",
            variant: "destructive",
          })
          setDriversForMap([])
          setNoDriversNearby("Aún no hay rangos configurados")
          return []
        }

        const mapped = (res.data || []).map((d: DriverApi) => {
          // assumption: driver current_location.coordinates = [lng, lat]
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
          // If server already filtered, this is redundant but harmless. Keep for safety.
          nearby = mapped.filter((d: DriverApi & { lat: number; lng: number }) => {
            if (!d || isNaN(d.lat) || isNaN(d.lng)) return false
            const dist = haversineDistance(userLat, userLng, d.lat, d.lng)
            return dist <= DEFAULT_RADIUS_KM
          })
        }

        // ONLY INCLUDE DRIVERS THAT ARE CURRENTLY ONLINE
        nearby = nearby.filter((d: DriverApi) => Boolean(d.is_online))

        // normalize for map: id/uid, name, lat, lng
        const driversForMapNormalized = nearby.map((d: DriverApi & { lat: number; lng: number }, idx: number) => ({
          id: String(d.id ?? d.uid ?? idx),
          uid: d.uid,
          name: String(d.name || d.full_name || d.driver_name || ""),
          lat: d.lat,
          lng: d.lng,
        }))
        // Cast to the expected driversForMap shape
        setDriversForMap(
          driversForMapNormalized as Array<{ id: string; uid?: string; name: string; lat: number; lng: number }>,
        )
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
        setDriversForMap([])
        return []
      }
    },
    [driverData, DEFAULT_RADIUS_KM, haversineDistance, toast],
  )

  // AUTO LOAD NEARBY DRIVERS WHEN USER AUTHENTICATES
  useEffect(() => {
    if (!user) return

    const loadOnAuth = async () => {
      try {
        let lat: number | null = null
        let lng: number | null = null

        if (pickupCoords) {
          lat = pickupCoords.lat
          lng = pickupCoords.lng
        } else if (typeof window !== "undefined" && navigator.geolocation) {
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
            })
            lat = pos.coords.latitude
            lng = pos.coords.longitude
            setPickupCoords({ lat, lng })
          } catch (err) {
            console.warn("No se pudo obtener geolocalización al autenticar:", err)
          }
        }

        if (typeof lat === "number" && typeof lng === "number") {
          await showNearbyDriversInMap(lat, lng)
        } else {
          // fallback: fetch all drivers (server-side no coords)
          await showNearbyDriversInMap()
        }
      } catch (err) {
        console.error("Error cargando conductores al autenticar:", err)
      }
    }

    loadOnAuth()
  }, [user, pickupCoords, showNearbyDriversInMap])

  // LOAD AVAILABLE DRIVERS WHEN COORDINATES ARE SET - MODIFICADO PARA USAR DRIVERDATA
  useEffect(() => {
    const loadAvailableDrivers = async () => {
      if (!pickupCoords || !destinationCoords) return

      // debug log removed

      try {
        // Usar la función driverData pasando coordenadas para filtrar por 1km
        const driverResult = await driverData(pickupCoords?.lat, pickupCoords?.lng, DEFAULT_RADIUS_KM)

        if (driverResult && driverResult.noRangesConfigured) {
          // Mostrar mensaje persistente en la UI además del toast
          setNoDriversNearby("Aún no hay rangos configurados")
          toast({
            title: "Rangos no configurados",
            description: "Aún no hay rangos configurados en el servidor",
            variant: "destructive",
          })
          setAvailableDrivers([])
          return
        }

        // Filtrar conductores verificados o en línea
        const verifiedDrivers = driverResult.data.filter((driver) => driver.is_verified)
        const onlineDrivers = driverResult.data.filter((driver) => driver.is_online)
        const availableDriversToShow = verifiedDrivers.length > 0 ? verifiedDrivers : onlineDrivers

        setAvailableDrivers(availableDriversToShow)

        if (availableDriversToShow.length === 0) {
          // Mostrar mensaje persistente en la UI además del toast
          setNoDriversNearby("No hay conductores disponibles en tu área")
          toast({
            title: "Sin conductores",
            description: "No hay conductores disponibles en este momento",
            variant: "destructive",
          })
        } else {
          // Limpiar mensaje si ahora hay conductores
          setNoDriversNearby("")
        }
      } catch (error) {
        console.error("Error de red al cargar conductores:", error)
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar con el servidor",
          variant: "destructive",
        })
        setAvailableDrivers([])
      }
    }

    if (pickupCoords && destinationCoords) {
      loadAvailableDrivers()
    }
  }, [pickupCoords, destinationCoords, driverData, DEFAULT_RADIUS_KM, toast])

  // CHECK FOR COMPLETED RIDES TO SHOW RATING DIALOG
  // SHOW DIALOG ONLY WHEN THE RIDE HAS NO PASSENGER RATING AND NO COMMENT (BOTH EMPTY/NULL)
  useEffect(() => {
    const completedRide = rides.find((ride) => {
      return (
        ride.status === "completed" &&
        ride.passenger_id === user?.uid &&
        // only show if passenger_rating is truly null/undefined and there's no comment
        ride.passenger_rating == null &&
        !ride.passenger_comment
      )
    })

    if (completedRide) {
      setCompletedRide(completedRide)
      setShowRatingDialog(true)
    }
  }, [rides, user?.uid])

  // FUNCTION SOLICITARVIAJE
  const solicitarViaje = async () => {
    // debug log removed

    try {
      const rideData: NewRidePayload = {
        passenger_id: user.uid,
        passenger_name: String(((userData as { name?: string } | null) ?? {})?.name ?? user?.email ?? ""),
        pickup_address: pickup,
        pickup_coordinates: [pickupCoords.lng, pickupCoords.lat],
        destination_address: destination,
        destination_coordinates: [destinationCoords.lng, destinationCoords.lat],
        status: "pending",
        estimated_fare: calculateEstimatedFare(pickupCoords, destinationCoords),
        estimated_duration: calculateEstimatedDuration(pickupCoords, destinationCoords),
      }

      // Si hay conductor específico seleccionado, asignar directamente
      if (selectedDriver) {
        const driver = availableDrivers.find((d) => d.uid === selectedDriver)
        if (driver) {
          // Assign the driver_id/driver_name but keep status as 'pending'
          // so the driver receives a pending request and must accept it.
          rideData.driver_id = selectedDriver
          rideData.driver_name = driver.name
          // do NOT mark accepted here; driver should accept the request.
        }
      }

      const { error } = await supabase.from("rides").insert(rideData).select()

      if (error) {
        console.error("Error creando viaje:", error)
        setRideStatus("idle")
        toast({
          title: "Error",
          description: "No se pudo crear el viaje. Intenta de nuevo.",
          variant: "destructive",
        })
        return
      }

      // Remove focus from any element inside the dialog before closing it so
      // assistive technology doesn't get a focused element hidden by aria-hidden.
      try {
        if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
      } catch {
        // suppressed debug
      }

      setShowDriverSelection(false)
      setSelectedDriver("")
      // Limpiar mensaje de ausencia de conductores al crear viaje
      setNoDriversNearby("")
      setRideStatus("pending")

      toast({
        title: "Viaje solicitado",
        description: selectedDriver
          ? "Tu viaje ha sido asignado al conductor seleccionado"
          : "Tu viaje ha sido solicitado. Esperando confirmación del conductor.",
      })

      refreshRides()
    } catch (error) {
      console.error("Error en solicitarViaje:", error)
      setRideStatus("idle")
      toast({
        title: "Error",
        description: "Ocurrió un error al solicitar el viaje.",
        variant: "destructive",
      })
    }
  }

  // HANDLE REQUEST RIDE MODIFICADO SEGÚN EL FLUJO ESPECIFICADO
  const handleRequestRide = async () => {
    if (!pickup || !destination || !pickupCoords || !destinationCoords || !user || !userData) return

    // debug log removed

    // Paso 1: Obtener datos de conductores usando driverData
    setRideStatus("searching")

    try {
      // debug log removed
      const driverResult = await driverData(pickupCoords?.lat, pickupCoords?.lng, DEFAULT_RADIUS_KM)

      if (!driverResult.success) {
        console.error("Error en driverData:", driverResult.error)
        setRideStatus("idle")
        toast({
          title: "Error",
          description: "No se pudieron obtener los conductores disponibles",
          variant: "destructive",
        })
        return
      }

      // Filtrar conductores verificados
      const verifiedDrivers = driverResult.data.filter((driver) => driver.is_verified)
      const onlineDrivers = driverResult.data.filter((driver) => driver.is_online)

      // Si no hay conductores verificados, usar conductores en línea
      const availableDriversToShow = verifiedDrivers.length > 0 ? verifiedDrivers : onlineDrivers

      setAvailableDrivers(availableDriversToShow)

      if (availableDriversToShow.length === 0) {
        setRideStatus("idle")
        // Mostrar mensaje persistente en la UI además del toast
        setNoDriversNearby("No hay conductores disponibles en tu área")
        toast({
          title: "Sin conductores",
          description: "No hay conductores disponibles en este momento",
          variant: "destructive",
        })
        return
      }

      // Paso 2: Mostrar diálogo de selección si no hay conductor preseleccionado
      if (!selectedDriver) {
        setShowDriverSelection(true)
        setRideStatus("idle") // Reset status while user selects
        return
      }

      // Paso 3: Proceder con la solicitud de viaje
      await solicitarViaje()
    } catch (error) {
      console.error("Error en handleRequestRide:", error)
      setRideStatus("idle")
      toast({
        title: "Error",
        description: "Ocurrió un error al procesar la solicitud",
        variant: "destructive",
      })
    }
  }

  // HANDLE CANCEL RIDE MODIFICADO SEGÚN EL FLUJO ESPECIFICADO
  const handleCancelRide = async (rideId: string, reason?: string) => {
    try {
      const ride = rides.find((r) => r.id === rideId)
      const cancellationReason =
        reason ||
        (ride?.status === "in-progress" ? "Cancelado por el pasajero durante el viaje" : "Cancelado por el pasajero")

      const result = await cancelRide(rideId, cancellationReason)
      if (!result.success) {
        console.error("Error cancelling ride:", result.error)
        toast({
          title: "Error",
          description: "No se pudo cancelar el viaje. Intenta de nuevo.",
          variant: "destructive",
        })
        return
      }

      console.log("Ride cancelled successfully")
      // Reset all states to allow new ride request
      setRideStatus("idle")
      setPickup("")
      setDestination("")
      setPickupCoords(null)
      setDestinationCoords(null)
      setSelectedDriver("")
      setShowDriverSelection(false)
      setShowChatDialog(false) // Close chat if open
      setNoDriversNearby("")

      toast({
        title: "Viaje cancelado",
        description: "Tu viaje ha sido cancelado exitosamente.",
      })

      // Refresh rides to get updated data
      refreshRides()
    } catch (error) {
      console.error("Error in handleCancelRide:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al cancelar el viaje.",
        variant: "destructive",
      })
    }
  }

  // HANDLE RATE DRIVER MODIFICADO SEGÚN EL FLUJO ESPECIFICADO
  const handleRateDriver = async () => {
    if (!completedRide) return

    // Only allow submit if there is a rating or a comment
    if (rating === 0 && comment.trim() === "") return

    try {
      // Prepare payload: include passenger_comment and passenger_rating (nullable)
      const payload: { passenger_comment?: string | null; passenger_rating?: number } = {
        passenger_comment: comment.trim() || null,
      }

      if (rating > 0) {
        payload.passenger_rating = rating
      }

      const { error } = await supabase.from("rides").update(payload).eq("id", completedRide.id)

      if (error) {
        console.error("Error rating driver:", error)
        return
      }

      // Recalculate driver's average rating only if a numeric rating was provided
      if (rating > 0) {
        const { data: driverRides } = await supabase
          .from("rides")
          .select("passenger_rating")
          .eq("driver_id", completedRide.driver_id)
          .not("passenger_rating", "is", null)

        if (driverRides && driverRides.length > 0) {
          const avgRating =
            (driverRides as Array<{ passenger_rating?: number }>).reduce(
              (sum, ride) => sum + Number(ride.passenger_rating ?? 0),
              0,
            ) / driverRides.length
          await supabase.from("drivers").update({ rating: avgRating }).eq("uid", completedRide.driver_id)
        }
      }

      // Close dialog and reset state
      setShowRatingDialog(false)
      setRating(0)
      setComment("")
      setCompletedRide(null)

      toast({
        title: "Calificación enviada",
        description: "Gracias por compartir tu experiencia.",
      })
    } catch (err: unknown) {
      console.error("Error submitting rating:", err)
      toast({
        title: "Error",
        description: "No se pudo enviar la calificación.",
        variant: "destructive",
      })
    }
  }

  // ALLOW SKIPPING THE RATING; IF A COMMENT EXISTS, SAVE IT. IF NOT, MARK HANDLED BY SAVING AN EMPTY STRING
  const handleSkipRating = async () => {
    if (!completedRide) return
    try {
      const payload = {
        passenger_comment: comment.trim() || "Omitido por el pasajero",
        // leave passenger_rating as null to indicate no numeric rating provided
      }
      const { error } = await supabase.from("rides").update(payload).eq("id", completedRide.id)
      if (error) {
        console.error("Error skipping rating:", error)
        toast({ title: "Error", description: "No se pudo omitir la calificación.", variant: "destructive" })
        return
      }

      setShowRatingDialog(false)
      setRating(0)
      setComment("")
      setCompletedRide(null)

      toast({ title: "Omitido", description: "Gracias por tu respuesta." })
    } catch (err) {
      console.error("Error in handleSkipRating:", err)
      toast({ title: "Error", description: "Ocurrió un error.", variant: "destructive" })
    }
  }

  // CALCULATE ESTIMATED FARE
  const calculateEstimatedFare = (pickup: { lat: number; lng: number }, destination: { lat: number; lng: number }) => {
    const distance = calculateDistance(pickup.lat, pickup.lng, destination.lat, destination.lng)
    const baseFare = 50
    const perKmRate = 12
    return Math.round(baseFare + distance * perKmRate)
  }

  // CALCULATE ESTIMATED DURATION
  const calculateEstimatedDuration = (
    pickup: { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ) => {
    const distance = calculateDistance(pickup.lat, pickup.lng, destination.lat, destination.lng)
    const avgSpeed = 25
    return Math.round((distance / avgSpeed) * 60)
  }

  // CALCULATE DISTANCE
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // HANDLE USE MY LOCATION
  const handleUseMyLocation = async () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast({
        title: "No disponible",
        description: "Geolocalización no soportada en este dispositivo",
        variant: "destructive",
      })
      return
    }

    toast({ title: "Obteniendo ubicación", description: "Esperando permiso del navegador..." })

    const getPosition = () =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
      })

    try {
      const pos = await getPosition()
      const lat = pos.coords.latitude
      const lon = pos.coords.longitude

      const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY
      let address = "Ubicación actual"
      if (apiKey) {
        try {
          const res = await fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${apiKey}`)
          if (res.ok) {
            const data = await res.json()
            if (data?.features && data.features.length > 0) {
              address = data.features[0].properties.formatted || address
            }
          }
        } catch (err) {
          console.warn("Geoapify reverse geocode failed:", err)
        }
      }

      setPickup(address)
      setPickupCoords({ lat, lng: lon })
      toast({ title: "Ubicación usada", description: address })
    } catch (err: unknown) {
      console.error("Error obteniendo ubicación:", err)
      toast({ title: "Error", description: "No fue posible obtener tu ubicación", variant: "destructive" })
    }
  }

  // NAVIGATION HANDLERS FOR SIDEBAR BUTTONS
  const handleNavigation = (section: string) => {
    switch (section) {
      case "activity":
        router.push("/passenger/activity")
        break
      case "settings":
        router.push("/settings")
        break
      case "history":
        router.push("/history")
        break
      case "profile": // Added profile navigation
        router.push("/profile")
        break
      case "logout":
        handleLogout()
        break
      default:
        break
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/auth/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  //RENDERING LOGIC
  const canRequestNewRide = !currentRide && rideStatus === "idle"

  // Sidebar must always be collapsed for passenger dashboard
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [currentView, setCurrentView] = useState<string>("rides")

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar - unchanged */}
      <div
        className={`${sidebarCollapsed ? "w-16 !text-gray-700" : "w-64"} bg-white shadow-lg flex flex-col transition-all duration-300 md:flex hidden`}
      >
        {/* Toggle Button (starts collapsed but can be opened) */}
        <div className="p-4 border-b border-gray-200">
          <button
            aria-label={sidebarCollapsed ? "Abrir sidebar" : "Cerrar sidebar"}
            onClick={() => setSidebarCollapsed((s) => !s)}
            className="w-full flex items-center justify-center p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* User Profile Section */}
        {!sidebarCollapsed && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold">
                  {String(
                    ((userData as { name?: string; full_name?: string } | null) ?? {})?.name ??
                      ((userData as any)?.full_name ?? user?.email ?? "").split("@")[0],
                  ).charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-gray-900">
                  {String(
                    ((userData as { name?: string; full_name?: string } | null) ?? {})?.name ??
                      ((userData as any)?.full_name ?? user?.email ?? "").split("@")[0],
                  ) || "Usuario"}
                </h2>
                <button
                  onClick={() => handleNavigation("profile")}
                  className="text-sm text-gray-500 cursor-pointer hover:text-blue-600 transition-colors"
                >
                  Ver perfil
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Collapsed User Profile */}
        {sidebarCollapsed && (
          <div className="p-3 border-b border-gray-200 flex justify-center">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-sm">
                {String(
                  ((userData as { name?: string; full_name?: string } | null) ?? {})?.name ??
                    ((userData as any)?.full_name ?? user?.email ?? "").split("@")[0],
                ).charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Navigation (matched to driver style) */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <button
              onClick={() => {
                setCurrentView("rides")
              }}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                currentView === "rides" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Car
                className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "rides" ? "text-white stroke-current" : "!text-gray-700 !stroke-current"}`}
              />
              {!sidebarCollapsed && <span className="font-medium">Rides</span>}
            </button>

            <button
              onClick={() => {
                setCurrentView("activity")
                handleNavigation("activity")
              }}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                currentView === "activity" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Activity
                className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "activity" ? "text-white stroke-current" : "!text-gray-700 !stroke-current"}`}
              />
              {!sidebarCollapsed && <span className="font-medium">Activity</span>}
            </button>

            <button
              onClick={() => {
                setCurrentView("settings")
                handleNavigation("settings")
              }}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                currentView === "settings" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Settings
                className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "settings" ? "text-white stroke-current" : "!text-gray-700 !stroke-current"}`}
              />
              {!sidebarCollapsed && <span className="font-medium">Configuración</span>}
            </button>

            <button
              onClick={() => {
                setCurrentView("history")
                handleNavigation("history")
              }}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                currentView === "history" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <History
                className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "history" ? "text-white stroke-current" : "!text-gray-700 !stroke-current"}`}
              />
              {!sidebarCollapsed && <span className="font-medium">Historial</span>}
            </button>
          </div>
        </nav>

        <div className="mt-auto p-4 border-t border-gray-200">
          <button
            onClick={() => {
              setCurrentView("logout")
              handleNavigation("logout")
            }}
            className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : "space-x-3"} px-4 py-3 rounded-lg text-left text-gray-700 hover:bg-gray-100 transition-colors`}
          >
            <LogOut className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${sidebarCollapsed ? "" : ""}`} />
            {!sidebarCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      <div
        className={`fixed left-0 top-0 h-full bg-white shadow-lg flex flex-col transition-all duration-300 z-50 md:hidden ${
          sidebarCollapsed ? "-translate-x-full w-16" : "translate-x-0 w-64"
        }`}
      >
        {/* Toggle Button (starts collapsed but can be opened) */}
        <div className="p-4 border-b border-gray-200">
          <button
            aria-label={sidebarCollapsed ? "Abrir sidebar" : "Cerrar sidebar"}
            onClick={() => setSidebarCollapsed((s) => !s)}
            className="w-full flex items-center justify-center p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* User Profile Section */}
        {!sidebarCollapsed && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold">
                  {String(
                    ((userData as { name?: string; full_name?: string } | null) ?? {})?.name ??
                      ((userData as any)?.full_name ?? user?.email ?? "").split("@")[0],
                  ).charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-gray-900">
                  {String(
                    ((userData as { name?: string; full_name?: string } | null) ?? {})?.name ??
                      ((userData as any)?.full_name ?? user?.email ?? "").split("@")[0],
                  ) || "Usuario"}
                </h2>
                <button
                  onClick={() => {
                    handleNavigation("profile")
                    setSidebarCollapsed(true) // Close mobile sidebar
                  }}
                  className="text-sm text-gray-500 cursor-pointer hover:text-blue-600 transition-colors"
                >
                  Ver perfil
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Collapsed User Profile */}
        {sidebarCollapsed && (
          <div className="p-3 border-b border-gray-200 flex justify-center">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-sm">
                {String(
                  ((userData as { name?: string; full_name?: string } | null) ?? {})?.name ??
                    ((userData as any)?.full_name ?? user?.email ?? "").split("@")[0],
                ).charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Navigation (matched to driver style) */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <button
              onClick={() => {
                setCurrentView("rides")
              }}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                currentView === "rides" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Car
                className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "rides" ? "text-white stroke-current" : "!text-gray-700 !stroke-current"}`}
              />
              {!sidebarCollapsed && <span className="font-medium">Rides</span>}
            </button>

            <button
              onClick={() => {
                setCurrentView("activity")
                handleNavigation("activity")
              }}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                currentView === "activity" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Activity
                className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "activity" ? "text-white stroke-current" : "!text-gray-700 !stroke-current"}`}
              />
              {!sidebarCollapsed && <span className="font-medium">Activity</span>}
            </button>

            <button
              onClick={() => {
                setCurrentView("settings")
                handleNavigation("settings")
              }}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                currentView === "settings" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Settings
                className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "settings" ? "text-white stroke-current" : "!text-gray-700 !stroke-current"}`}
              />
              {!sidebarCollapsed && <span className="font-medium">Configuración</span>}
            </button>

            <button
              onClick={() => {
                setCurrentView("history")
                handleNavigation("history")
              }}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                currentView === "history" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <History
                className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "history" ? "text-white stroke-current" : "!text-gray-700 !stroke-current"}`}
              />
              {!sidebarCollapsed && <span className="font-medium">Historial</span>}
            </button>
          </div>
        </nav>

        <div className="mt-auto p-4 border-t border-gray-200">
          <button
            onClick={() => {
              setCurrentView("logout")
              handleNavigation("logout")
            }}
            className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : "space-x-3"} px-4 py-3 rounded-lg text-left text-gray-700 hover:bg-gray-100 transition-colors`}
          >
            <LogOut className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${sidebarCollapsed ? "" : ""}`} />
            {!sidebarCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex h-full md:ml-0">
        <button
          className="fixed top-4 left-4 z-30 bg-white rounded-full p-3 shadow-lg md:hidden"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>

        {/* Map Section - Now full width on mobile */}
        <div className="flex-1 relative h-full">
          <MapComponent
            userType="passenger"
            pickupLocation={pickupCoords ?? undefined}
            destinationLocation={destinationCoords ?? undefined}
            driverLocations={driversForMap}
            onMapReady={(userLoc) => {
              if (userLoc) {
                showNearbyDriversInMap(userLoc.lat, userLoc.lng)
              }
            }}
          />

          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            <button className="bg-white w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center">
              <Plus className="h-5 w-5 text-gray-600" />
            </button>
            <button className="bg-white w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center">
              <Minus className="h-5 w-5 text-gray-600" />
            </button>
            <button className="bg-white w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center">
              <MapPin className="h-5 w-5 text-gray-600" />
            </button>
            <button className="bg-white w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center">
              <Share className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Driver Arrival Notification */}
          {currentRide && currentRide.status === "accepted" && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-white rounded-lg shadow-lg p-4 flex items-center space-x-3 min-w-[280px]">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold">
                    {String(currentRide.driver_name ?? "").charAt(0) || "D"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-600">Arriving in 3 minutes</p>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">{currentRide.driver_name}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600">4.98</span>
                    </div>
                    <span className="text-sm text-gray-500">• Toyota Camry</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentRide && (
            <div
              className={`absolute left-4 right-4 bg-white rounded-lg shadow-xl p-6 ${
                // Position higher on mobile to avoid button overlap, normal on desktop
                "bottom-20 md:bottom-4"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Ride Details</h3>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Estimated Fare</p>
                  <p className="text-2xl font-bold text-gray-900">${currentRide.estimated_fare}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <span className="text-sm font-medium text-gray-600">ID: #{currentRide.id?.toString().slice(-6)}</span>
                <Badge
                  className={`${
                    currentRide.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : currentRide.status === "accepted"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {currentRide.status === "pending" && "Pending"}
                  {currentRide.status === "accepted" && "Accepted"}
                  {currentRide.status === "in-progress" && "In-progress"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">From</p>
                  <p className="text-sm text-gray-900">{currentRide.pickup_address}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">To</p>
                  <p className="text-sm text-gray-900">{currentRide.destination_address}</p>
                </div>
              </div>

              <div className="flex space-x-3">
                {currentRide.status === "in-progress" && (
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setShowChatDialog(true)
                      setChatUnread(0)
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact Driver
                    {chatUnread > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{chatUnread}</span>
                    )}
                  </Button>
                )}
                {["pending", "accepted", "in-progress"].includes(currentRide.status) && (
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() =>
                      handleCancelRide(
                        currentRide.id,
                        currentRide.status === "in-progress" ? "Cancelado durante el viaje" : undefined,
                      )
                    }
                  >
                    Cancel Ride
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {isMobileDrawerOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setIsMobileDrawerOpen(false)}
            />

            {/* Drawer */}
            <div
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 md:hidden transition-transform duration-300 ease-out"
              style={{ height: `${drawerHeight}%` }}
            >
              {/* Drag Handle */}
              <div className="flex justify-center py-3">
                <div
                  className="w-12 h-1 bg-gray-300 rounded-full cursor-pointer"
                  onTouchStart={(e) => {
                    const startY = e.touches[0].clientY
                    const startHeight = drawerHeight

                    const handleTouchMove = (e: TouchEvent) => {
                      const currentY = e.touches[0].clientY
                      const deltaY = startY - currentY
                      const newHeight = Math.min(90, Math.max(30, startHeight + (deltaY / window.innerHeight) * 100))
                      setDrawerHeight(newHeight)
                    }

                    const handleTouchEnd = () => {
                      document.removeEventListener("touchmove", handleTouchMove)
                      document.removeEventListener("touchend", handleTouchEnd)

                      // Snap to positions
                      if (drawerHeight < 40) {
                        setIsMobileDrawerOpen(false)
                      } else if (drawerHeight < 65) {
                        setDrawerHeight(50)
                      } else {
                        setDrawerHeight(80)
                      }
                    }

                    document.addEventListener("touchmove", handleTouchMove)
                    document.addEventListener("touchend", handleTouchEnd)
                  }}
                />
              </div>

              {/* Close Button */}
              <button
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
                onClick={() => setIsMobileDrawerOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>

              {/* Drawer Content */}
              <div className="px-6 pb-6 h-full overflow-y-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Request a ride</h1>

                <div className="space-y-4 mb-6">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
                    onClick={handleUseMyLocation}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Use My Location
                  </Button>

                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    </div>
                    <AddressAutocomplete
                      placeholder="Enter pickup location"
                      value={pickup}
                      onChange={setPickup}
                      onAddressSelect={(address, coords) => {
                        setPickup(address)
                        setPickupCoords(coords)
                      }}
                      className="pl-10 py-3 border-gray-300 rounded-lg text-gray-500"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
                    </div>
                    <AddressAutocomplete
                      placeholder="Enter destination"
                      value={destination}
                      onChange={setDestination}
                      onAddressSelect={(address, coords) => {
                        setDestination(address)
                        setDestinationCoords(coords)
                      }}
                      className="pl-10 py-3 border-gray-300 rounded-lg text-gray-500"
                    />
                  </div>
                </div>

                {pickupCoords && destinationCoords && (
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Estimated Fare</span>
                      <span className="text-lg font-semibold text-gray-900">
                        ${calculateEstimatedFare(pickupCoords, destinationCoords)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Estimated Duration</span>
                      <span className="text-gray-900 font-medium">
                        {calculateEstimatedDuration(pickupCoords, destinationCoords)} minutes
                      </span>
                    </div>
                  </div>
                )}

                {noDriversNearby && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-700 text-center">{noDriversNearby}</p>
                  </div>
                )}

                <Button
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                  onClick={() => {
                    handleRequestRide()
                    setIsMobileDrawerOpen(false)
                  }}
                  disabled={
                    !pickup || !destination || !pickupCoords || !destinationCoords || rideStatus === "searching"
                  }
                >
                  {rideStatus === "searching" ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Searching for driver...
                    </>
                  ) : (
                    "Request Ride"
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        <div className="w-96 bg-white shadow-lg p-6 flex-col h-full hidden md:flex">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Request a ride</h1>

            <div className="space-y-4 mb-6">
              <Button
                variant="outline"
                className="w-full justify-start text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
                onClick={handleUseMyLocation}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Use My Location
              </Button>

              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                </div>
                <AddressAutocomplete
                  placeholder="Enter pickup location"
                  value={pickup}
                  onChange={setPickup}
                  onAddressSelect={(address, coords) => {
                    setPickup(address)
                    setPickupCoords(coords)
                  }}
                  className="pl-10 py-3 border-gray-300 rounded-lg text-gray-500"
                />
              </div>

              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
                </div>
                <AddressAutocomplete
                  placeholder="Enter destination"
                  value={destination}
                  onChange={setDestination}
                  onAddressSelect={(address, coords) => {
                    setDestination(address)
                    setDestinationCoords(coords)
                  }}
                  className="pl-10 py-3 border-gray-300 rounded-lg text-gray-500"
                />
              </div>
            </div>

            {pickupCoords && destinationCoords && (
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Estimated Fare</span>
                  <span className="text-lg font-semibold text-gray-900">
                    ${calculateEstimatedFare(pickupCoords, destinationCoords)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Estimated Duration</span>
                  <span className="text-gray-900 font-medium">
                    {calculateEstimatedDuration(pickupCoords, destinationCoords)} minutes
                  </span>
                </div>
              </div>
            )}

            {noDriversNearby && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-700 text-center">{noDriversNearby}</p>
              </div>
            )}
          </div>

          <Button
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
            onClick={handleRequestRide}
            disabled={!pickup || !destination || !pickupCoords || !destinationCoords || rideStatus === "searching"}
          >
            {rideStatus === "searching" ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Searching for driver...
              </>
            ) : (
              "Request Ride"
            )}
          </Button>
        </div>
      </div>

      {!currentRide && (
        <button
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full shadow-lg md:hidden z-20 font-semibold text-lg transition-all duration-200 hover:scale-105"
          onClick={() => setIsMobileDrawerOpen(true)}
        >
          <Car className="h-5 w-5 mr-2 inline" />
          Request a Ride
        </button>
      )}

      {/* ... existing driver arrival notification and ride details panel ... */}

      {/* Quick Destination Dialog removed */}
      {/* Enhanced Chat Dialog */}
      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent className="sm:max-w-lg border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <span>Chat con Conductor</span>
            </DialogTitle>
          </DialogHeader>
          {currentRide && currentRide.driver_id && (
            <RideChat
              rideId={currentRide.id}
              driverName={String(currentRide.driver_name ?? "Conductor")}
              passengerName={String(currentRide.passenger_name ?? "")}
              onClose={() => setShowChatDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      {/* Enhanced Driver Selection Dialog */}
      <Dialog open={showDriverSelection} onOpenChange={setShowDriverSelection}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Seleccionar Conductor</DialogTitle>
            <DialogDescription className="text-base">
              {availableDrivers.length} conductores disponibles
              {availableDrivers.some((d) => d.is_verified)
                ? `(${availableDrivers.filter((d) => d.is_verified).length} verificados)`
                : "(conductores en línea)"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 font-medium">
                💡 Puedes elegir un conductor específico o dejar que el sistema asigne automáticamente
              </p>
            </div>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecciona un conductor" />
              </SelectTrigger>
              <SelectContent>
                {availableDrivers.map((driver) => (
                  <SelectItem key={driver.uid} value={driver.uid}>
                    <div className="flex items-center space-x-3 py-2">
                      <Avatar className="h-10 w-10 ring-2 ring-blue-200">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold">
                          {String(driver.name ?? "").charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold text-gray-800">{driver.name}</p>
                          {driver.is_verified ? (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              ✓ Verificado
                            </span>
                          ) : (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              En línea
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{driver.rating?.toFixed(1) || "N/A"}</span>
                          <span>•</span>
                          <span>{driver.vehicle_model}</span>
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 font-semibold"
                onClick={solicitarViaje}
                disabled={!selectedDriver}
              >
                ✅ Confirmar Selección
              </Button>
              <Button
                variant="outline"
                className="font-semibold bg-white/60 hover:bg-blue-50"
                onClick={() => {
                  setSelectedDriver("")
                  solicitarViaje()
                }}
              >
                🎲 Cualquier Conductor
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Enhanced Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">⭐ Califica tu viaje</DialogTitle>
            <DialogDescription className="text-base">
              Ayuda a otros pasajeros compartiendo tu experiencia con este conductor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-center">
              <Avatar className="h-20 w-20 mx-auto mb-4 ring-4 ring-blue-200">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-2xl font-bold">
                  {String(completedRide?.driver_name ?? "").charAt(0) || "D"}
                </AvatarFallback>
              </Avatar>
              <p className="font-bold text-lg text-gray-800">{completedRide?.driver_name}</p>
              <p className="text-gray-600 font-medium">¿Cómo fue tu experiencia?</p>
            </div>
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="p-2 hover:scale-110 transition-transform">
                  <Star
                    className={`h-10 w-10 ${
                      star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <Label htmlFor="comment" className="text-base font-semibold">
                Comentario (opcional)
              </Label>
              <Textarea
                id="comment"
                placeholder="Comparte tu experiencia..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="border-gray-200 focus:border-blue-400"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 font-semibold"
                onClick={handleRateDriver}
                disabled={rating === 0 && comment.trim() === ""}
              >
                ✨ Enviar Calificación
              </Button>
              <Button variant="outline" className="font-semibold bg-white/60" onClick={handleSkipRating}>
                Omitir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function PassengerDashboard() {
  return (
    <ProtectedRoute requiredUserType="passenger">
      <PassengerDashboardContent />
    </ProtectedRoute>
  )
}
