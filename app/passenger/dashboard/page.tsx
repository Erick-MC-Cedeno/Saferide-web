"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  Clock,
  DollarSign,
  Navigation,
  Calendar,
  X,
  Users,
  Activity,
  MessageCircle,
} from "lucide-react"
import { useRealTimeRides } from "@/hooks/useRealTimeRides"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { MapComponent } from "@/components/MapComponent"
import { AddressAutocomplete } from "@/components/AddressAutocomplete"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { RideChat } from "@/components/RideChat"


// DASHBOARD PASSENGER CONTENT
function PassengerDashboardContent() {
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
  const [driversForMap, setDriversForMap] = useState<Array<{ id: string; uid?: string; name: string; lat: number; lng: number }>>([])

  
  // RESET RIDE STATUS WHEN NO CURRENT RIDE
  useEffect(() => {
    if (!currentRide && rideStatus !== "idle") {
      setRideStatus("idle")
    }
    // rideStatus intentionally included
  }, [currentRide, rideStatus])

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
  }, [currentRide?.id])



  // PRELOAD CHAT AUDIO AND HELPER TO UNLOCK/PLAY ON INTERACTION
  useEffect(() => {
    if (!audioChatRef.current) {
      audioChatRef.current = new Audio()
      audioChatRef.current.preload = "auto"
      fetch('/api/sounds/saferidechattone')
        .then((r) => r.json())
        .then((j) => {
          if (j?.base64) audioChatRef.current!.src = `data:audio/mpeg;base64,${j.base64}`
        })
        .catch((e) => console.warn('Could not load saferidechattone:', e))
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
      console.warn('Could not read saferide_chat_notification from localStorage (passenger):', e)
      setChatNotificationEnabled(true)
    }
    const onStorage = (e: StorageEvent) => {
      try {
        if (!user?.uid) return
        const chatKey = `saferide_chat_notification_${user.uid}`
        if (e.key === chatKey) {
          try { setChatNotificationEnabled(e.newValue ? JSON.parse(e.newValue) : null) } catch (err) { console.warn('Error parsing storage event for chat toggle (passenger)', err) }
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
          try { setChatNotificationEnabled(value ? JSON.parse(value) : null) } catch (err) { console.warn('Error parsing pref-changed value for chat toggle (passenger)', err) }
        }
      } catch (err) {
        // ignore
      }
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('saferide:pref-changed', onPrefChanged)
    return () => window.removeEventListener('storage', onStorage)
  }, [])



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
          try {
            // @ts-ignore
            const ctx = (window as any).audioContext || new (window.AudioContext || (window as any).webkitAudioContext)()
            if (ctx && typeof ctx.resume === "function") {
              await ctx.resume()
              ;(window as any).audioContext = ctx
            }
          } catch (e) {}
          await audioChatRef.current!.play()
        } catch (e) {
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
          .select("*")
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
          const totalSpent = completed.reduce((sum, ride) => sum + Number(ride.actual_fare ?? ride.estimated_fare ?? 0), 0)
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
      const parsed = v ? parseFloat(v) : 1
      return isNaN(parsed) ? 1 : parsed
    } catch {
      return 1
    }
  }, [])



  // FUNCION PARA OPTENER LOS DATOS DE EL DRIVER
  const driverData = useCallback(async (lat?: number | null, lng?: number | null, radiusKm?: number) => {
    try {
      const params = new URLSearchParams()
      const rad = typeof radiusKm === 'number' ? radiusKm : DEFAULT_RADIUS_KM
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
  }, [DEFAULT_RADIUS_KM])



  // HAVERSINE DISTANCE FUNCTION
  const haversineDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number) => {
    const toRad = (v: number) => (v * Math.PI) / 180
    const R = 6371 // km
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lng2 - lng1)
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c

  }, [])
// SHOW NEARBY DRIVERS CALLS  /api/drivers/all, maps coordinates, filters by configured radius
  const showNearbyDriversInMap = useCallback(async (userLat?: number | null, userLng?: number | null) => {
    try {
      // If we have user coords, prefer server-side filtering for robustness
      const res = typeof userLat === "number" && typeof userLng === "number" ? await driverData(userLat, userLng, DEFAULT_RADIUS_KM) : await driverData()
      // Manejo cuando el servidor indica que no hay rangos configurados
      if (res && res.noRangesConfigured) {
        toast({ title: "Rangos no configurados", description: "Aún no hay rangos configurados en el servidor", variant: "destructive" })
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
      setDriversForMap(driversForMapNormalized as Array<{ id: string; uid?: string; name: string; lat: number; lng: number }>)
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
  }, [driverData, DEFAULT_RADIUS_KM, haversineDistance, toast])



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
          toast({ title: "Rangos no configurados", description: "Aún no hay rangos configurados en el servidor", variant: "destructive" })
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
        (ride.passenger_rating == null) &&
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
          rideData.driver_id = selectedDriver
          rideData.driver_name = driver.name
          rideData.status = "accepted"
          rideData.accepted_at = new Date().toISOString()
          // debug log removed
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
          const avgRating = (driverRides as Array<{ passenger_rating?: number }>).reduce(
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
      toast({ title: "No disponible", description: "Geolocalización no soportada en este dispositivo", variant: "destructive" })
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
          const res = await fetch(
            `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${apiKey}`,
          )
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



  // RENDERING LOGIC
  const canRequestNewRide = !currentRide && rideStatus === "idle"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Enhanced Map Component */}
            <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm max-w-full">
              {/* Header removed to show map only */}
              <CardContent className="p-0">
                <MapComponent
                  userType="passenger"
                  pickupLocation={pickupCoords ?? undefined}
                  destinationLocation={destinationCoords ?? undefined}
                  driverLocations={driversForMap}
                  onMapReady={(userLoc) => {
                    // auto-load nearby drivers when we have a user location
                    if (userLoc) {
                      showNearbyDriversInMap(userLoc.lat, userLoc.lng)
                    }
                  }}
                />
              </CardContent>
            </Card>
            {/* Enhanced Current Ride Status */}
            {currentRide && (
              <div className="space-y-6">
                <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-500 rounded-full">
                          <Car className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-800">Viaje Actual</span>
                      </div>
                      <Badge
                        variant={currentRide.status === "pending" ? "secondary" : "default"}
                        className={`px-4 py-2 text-sm font-semibold ${
                          currentRide.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : currentRide.status === "accepted"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {currentRide.status === "pending" && "⏳ Esperando conductor"}
                        {currentRide.status === "accepted" && "✅ Conductor asignado"}
                        {currentRide.status === "in-progress" && "🚗 En progreso"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-white/60 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <p className="text-sm font-semibold text-gray-600">Origen</p>
                          </div>
                          <p className="text-gray-900 font-medium">{currentRide.pickup_address}</p>
                        </div>
                        <div className="p-4 bg-white/60 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <p className="text-sm font-semibold text-gray-600">Destino</p>
                          </div>
                          <p className="text-gray-900 font-medium">{currentRide.destination_address}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <p className="text-sm font-semibold text-green-700">Tarifa estimada</p>
                          </div>
                          <p className="text-2xl font-bold text-green-800">${currentRide.estimated_fare}</p>
                        </div>
                        {currentRide.driver_name && (
                          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <Users className="h-4 w-4 text-blue-600" />
                              <p className="text-sm font-semibold text-blue-700">Conductor</p>
                            </div>
                            <p className="text-xl font-bold text-blue-800">{currentRide.driver_name}</p>
                          </div>
                        )}
                      </div>
                      {/* Enhanced Action Buttons */}
                      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                        {["pending", "accepted"].includes(currentRide.status) && (
                          <Button
                            variant="destructive"
                            onClick={() => handleCancelRide(currentRide.id)}
                            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 font-semibold py-3"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancelar Viaje
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {/* removed chat summary card as requested; unread counter will appear on the Chat button below */}

                {/* Enhanced Chat and Cancel Options for In-Progress Rides */}
                {currentRide.status === "in-progress" && (
                  <Card className="border-0 shadow-xl bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-l-orange-500">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-3 text-orange-800">
                        <div className="p-2 bg-orange-500 rounded-full animate-pulse">
                          <Car className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold">🚗 Viaje en Progreso</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="p-4 bg-white/60 rounded-lg">
                          <p className="text-orange-700 font-medium">
                            Tu conductor está en camino al destino. Puedes comunicarte con él o cancelar si es
                            necesario.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Button
                            variant="outline"
                            className="bg-white/80 border-orange-300 text-orange-700 hover:bg-orange-100 font-semibold py-3 flex items-center justify-center space-x-2"
                            onClick={() => { setShowChatDialog(true); setChatUnread(0); }}
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span>Chat con Conductor</span>
                            {chatUnread > 0 && (
                              <span className="inline-flex items-center justify-center ml-2 px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                                {chatUnread}
                              </span>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 font-semibold py-3"
                            onClick={() => handleCancelRide(currentRide.id, "Cancelado durante el viaje")}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancelar Viaje
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            {/* Mobile: Solicitar Viaje (shown above recent trips on small screens) */}
            {canRequestNewRide && (
              <div className="block lg:hidden">
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm max-w-full">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg py-2">
                    <CardTitle className="flex items-center space-x-2 text-base">
                      <div className="bg-white/20 p-1.5 rounded-lg">
                        <Car className="h-4 w-4" />
                      </div>
                      <div>
                        <span>Solicitar Viaje</span>
                        <CardDescription className="text-blue-100 text-xs mt-0.5">
                          Ingresa tu destino y encuentra un conductor
                        </CardDescription>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-3">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pickup-main" className="text-sm font-semibold text-gray-700">
                          Punto de Recogida
                        </Label>
                        <button
                          type="button"
                          onClick={handleUseMyLocation}
                          className="inline-flex items-center space-x-2 text-xs px-2 py-1 rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                          title="Ubicación actual"
                        >
                          <MapPin className="h-4 w-4" />
                          <span>Mi ubicación</span>
                        </button>
                      </div>
                      <AddressAutocomplete
                        placeholder="Tu ubicación actual"
                        value={pickup}
                        onChange={setPickup}
                        id="pickup-main"
                        name="pickup-main"
                        onAddressSelect={(address, coords) => {
                          setPickup(address)
                          setPickupCoords(coords)
                        }}
                        suppressSuggestions={showDriverSelection}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="destination-main" className="text-sm font-semibold text-gray-700">
                        Destino
                      </Label>
                      <AddressAutocomplete
                        placeholder="¿A dónde vas?"
                        value={destination}
                        onChange={setDestination}
                        id="destination-main"
                        name="destination-main"
                        onAddressSelect={(address, coords) => {
                          setDestination(address)
                          setDestinationCoords(coords)
                        }}
                        suppressSuggestions={showDriverSelection}
                      />
                    </div>
                    {pickupCoords && destinationCoords && (
                      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                        <h4 className="font-bold text-gray-900 mb-4 text-lg">📋 Resumen del Viaje</h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                            <span className="text-gray-700 font-medium">Distancia:</span>
                            <span className="font-bold text-blue-700">
                              {calculateDistance(
                                pickupCoords.lat,
                                pickupCoords.lng,
                                destinationCoords.lat,
                                destinationCoords.lng,
                              ).toFixed(1)}{' '}
                              km
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                            <span className="text-gray-700 font-medium">Tiempo estimado:</span>
                            <span className="font-bold text-blue-700">
                              {calculateEstimatedDuration(pickupCoords, destinationCoords)} min
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border-2 border-green-200">
                            <span className="text-green-700 font-semibold">Tarifa estimada:</span>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-5 w-5 text-green-600" />
                              <span className="font-bold text-green-800 text-xl">
                                {calculateEstimatedFare(pickupCoords, destinationCoords)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {noDriversNearby && (
                      <div className="p-3 mb-3 rounded-lg bg-red-50 border border-red-200 text-red-800 font-medium">
                        {noDriversNearby}
                      </div>
                    )}
                    <Button
                      className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl font-bold text-lg"
                      onClick={handleRequestRide}
                      disabled={
                        !pickup || !destination || !pickupCoords || !destinationCoords || (rideStatus as string) === "searching"
                      }
                    >
                      {(rideStatus as string) === "searching" ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Buscando conductor...
                        </>
                      ) : (
                        <>
                          <Car className="mr-3 h-6 w-6" />
                          Solicitar Viaje
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Enhanced Recent Trips - Redesigned */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm max-w-full rounded-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <div className="bg-white/20 p-1.5 rounded-lg">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <span>Viajes Recientes</span>
                    <CardDescription className="text-blue-100 text-xs">
                      Historial de tus últimos viajes completados
                    </CardDescription>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="p-2 space-y-2">
                    {recentTrips.length > 0 ? (
                      recentTrips.map((trip) => (
                        <div
                          key={trip.id}
                          className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden"
                        >
                          <div className="p-3">
                            {/* Driver Info & DateTime */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-8 w-8 ring-1 ring-blue-100">
                                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-sm">
                                    {trip.driver_name?.charAt(0) || "D"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold text-sm text-gray-900">{trip.driver_name}</p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(trip.completed_at).toLocaleDateString()} • {trip.estimated_duration} min
                                  </p>
                                </div>
                              </div>
                              <Badge 
                                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold text-sm px-2 py-0.5"
                              >
                                ${trip.actual_fare || trip.estimated_fare}
                              </Badge>
                            </div>

                            {/* Route Info */}
                            <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-md p-2 mb-2">
                              <div className="flex items-start space-x-2">
                                <div className="min-w-[16px] pt-0.5">
                                  <Navigation className="h-3 w-3 text-blue-500" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-xs text-gray-700 leading-snug">
                                    {trip.pickup_address} 
                                    <span className="mx-1 text-blue-500">→</span> 
                                    {trip.destination_address}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Rating & Status */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1">
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3 w-3 ${
                                        i < (trip.passenger_rating || 0)
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-gray-200"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs font-medium text-gray-600">({trip.passenger_rating || 0}/5)</span>
                              </div>
                              <div className="flex items-center space-x-1 text-emerald-600">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                                <span className="text-xs font-medium">Completado</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full w-16 h-16 mx-auto blur-lg opacity-70"></div>
                          <div className="relative p-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                            <Calendar className="h-8 w-8 text-white" />
                          </div>
                        </div>
                        <h3 className="text-base font-bold text-gray-800 mb-1">No hay viajes recientes</h3>
                        <p className="text-sm text-gray-500">Tus viajes aparecerán aquí una vez completados</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          {/* Enhanced Sidebar */}
          <div className="space-y-4">
            {/* Enhanced Request Ride Form (hidden on small screens) */}
            {canRequestNewRide && (
              <Card className="hidden lg:block border-0 shadow-xl bg-white/80 backdrop-blur-sm max-w-full">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg py-2">
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <div className="bg-white/20 p-1.5 rounded-lg">
                      <Car className="h-4 w-4" />
                    </div>
                    <div>
                      <span>Solicitar Viaje</span>
                      <CardDescription className="text-blue-100 text-xs mt-0.5">
                        Ingresa tu destino y encuentra un conductor
                      </CardDescription>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="pickup-dialog" className="text-sm font-semibold text-gray-700">
                        Punto de Recogida
                      </Label>
                      <button
                        type="button"
                        onClick={handleUseMyLocation}
                        className="inline-flex items-center space-x-2 text-xs px-2 py-1 rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                        title="Ubicación actual"
                      >
                        <MapPin className="h-4 w-4" />
                        <span>Mi ubicación</span>
                      </button>
                    </div>
                      <AddressAutocomplete
                      placeholder="Tu ubicación actual"
                      value={pickup}
                      onChange={setPickup}
                        id="pickup-dialog"
                        name="pickup-dialog"
                      onAddressSelect={(address, coords) => {
                        setPickup(address)
                        setPickupCoords(coords)
                      }}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="destination-dialog" className="text-sm font-semibold text-gray-700">
                      Destino
                    </Label>
                    <AddressAutocomplete
                      placeholder="¿A dónde vas?"
                      value={destination}
                      onChange={setDestination}
                      id="destination-dialog"
                      name="destination-dialog"
                      onAddressSelect={(address, coords) => {
                        setDestination(address)
                        setDestinationCoords(coords)
                      }}
                    />
                  </div>
                  {/* Enhanced Trip Summary */}
                  {pickupCoords && destinationCoords && (
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                      <h4 className="font-bold text-gray-900 mb-4 text-lg">📋 Resumen del Viaje</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                          <span className="text-gray-700 font-medium">Distancia:</span>
                          <span className="font-bold text-blue-700">
                            {calculateDistance(
                              pickupCoords.lat,
                              pickupCoords.lng,
                              destinationCoords.lat,
                              destinationCoords.lng,
                            ).toFixed(1)}{" "}
                            km
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                          <span className="text-gray-700 font-medium">Tiempo estimado:</span>
                          <span className="font-bold text-blue-700">
                            {calculateEstimatedDuration(pickupCoords, destinationCoords)} min
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border-2 border-green-200">
                          <span className="text-green-700 font-semibold">Tarifa estimada:</span>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            <span className="font-bold text-green-800 text-xl">
                              {calculateEstimatedFare(pickupCoords, destinationCoords)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Banner visible cuando no hay conductores en el área */}
                  {noDriversNearby && (
                    <div className="p-3 mb-3 rounded-lg bg-red-50 border border-red-200 text-red-800 font-medium">
                      {noDriversNearby}
                    </div>
                  )}
                  <Button
                    className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl font-bold text-lg"
                    onClick={handleRequestRide}
                    disabled={
                      !pickup || !destination || !pickupCoords || !destinationCoords || (rideStatus as string) === "searching"
                    }
                  >
                      {(rideStatus as string) === "searching" ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Buscando conductor...
                      </>
                    ) : (
                      <>
                        <Car className="mr-3 h-6 w-6" />
                        Solicitar Viaje
                      </>
                    )}
                  </Button>
                  <div className="mt-3 flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      onClick={async () => {
                        try {
                          let lat: number | null = null
                          let lng: number | null = null
                          if (pickupCoords) {
                            lat = pickupCoords.lat
                            lng = pickupCoords.lng
                          } else if (typeof window !== "undefined" && navigator.geolocation) {
                            // ask for current position
                            const p = await new Promise<GeolocationPosition>((resolve, reject) => {
                              navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
                            })
                            lat = p.coords.latitude
                            lng = p.coords.longitude
                            // also set pickupCoords for subsequent interactions
                            setPickupCoords({ lat, lng })
                          }

                          if (lat === null || lng === null) {
                            toast({ title: "Ubicación requerida", description: "No fue posible obtener tu ubicación", variant: "destructive" })
                            return
                          }

                          await showNearbyDriversInMap(lat, lng)
                        } catch (err) {
                          console.error("Error obteniendo geolocalización para mostrar conductores:", err)
                          toast({ title: "Error", description: "No fue posible obtener la ubicación", variant: "destructive" })
                        }
                      }}
                    >
                      Mostrar conductores
                    </Button>
                    </div>
                  </CardContent>
                </Card>
            )}
            {/* Quick Destinations section removed */}
            {/* Enhanced User Stats */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm max-w-full">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg py-2">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <div className="bg-white/20 p-1.5 rounded-lg">
                    <Activity className="h-4 w-4" />
                  </div>
                  <span>Tu Actividad</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-white/10 rounded-full -mr-6 -mt-6" />
                    <div className="relative z-10">
                      <p className="text-2xl font-bold">{passengerStats.totalTrips}</p>
                      <p className="text-blue-100 text-sm">Viajes</p>
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-lg shadow overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-white/10 rounded-full -mr-6 -mt-6" />
                    <div className="relative z-10">
                      <p className="text-2xl font-bold">{passengerStats.averageRating.toFixed(1)}</p>
                      <div className="flex items-center justify-center mt-2 space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.round(passengerStats.averageRating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-yellow-100"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-yellow-100 text-sm mt-1">Rating</p>
                    </div>
                  </div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-lg shadow overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-14 h-14 bg-white/10 rounded-full -mr-7 -mt-7" />
                  <div className="relative z-10">
                    <p className="text-2xl font-bold">${passengerStats.totalSpent}</p>
                    <p className="text-purple-100 text-sm">Total gastado</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
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
                          {driver.name.charAt(0)}
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
                  {completedRide?.driver_name?.charAt(0) || "D"}
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
              <Button
                variant="outline"
                className="font-semibold bg-white/60"
                onClick={handleSkipRating}
              >
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