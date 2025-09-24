"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  MapPin,
  Clock,
  Star,
  DollarSign,
  TrendingUp,
  Car,
  MessageCircle,
  CheckCircle,
  LogOut,
  History,
  Map,
  FileText,
  Menu,
} from "lucide-react"
import { useRealTimeRides } from "@/hooks/useRealTimeRides"
import { useDriverStatus } from "@/hooks/useDriverStatus"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/supabase"
import { MapComponent } from "@/components/MapComponent"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useToast } from "@/hooks/use-toast"
import { RideChat } from "@/components/RideChat"
import { useRouter } from "next/navigation"

function DriverDashboardContent() {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const driverId = user?.uid
  const { isOnline, loading: statusLoading, updateOnlineStatus } = useDriverStatus(driverId)
  const { rides, acceptRide, rejectRide, updateRideStatus, refreshRides } = useRealTimeRides(driverId)

  const [currentView, setCurrentView] = useState("map")
  const [userData, setUserData] = useState<{ name?: string; email?: string } | null>(null)

  // CONTENIDO Y GESTIÓN DE ESTADO DEL DASHBOARD DEL CONDUCTOR: AGRUPA ESTADO, EFECTOS Y FUNCIONES
  const [driverStats, setDriverStats] = useState({
    todayTrips: 0,
    todayEarnings: 0,
    todayHours: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    totalTrips: 0,
    rating: 0,
  })
  const [recentTrips, setRecentTrips] = useState([])
  const [showRatingDialog, setShowRatingDialog] = useState(false)
  const [completedRide, setCompletedRide] = useState(null)
  // ASEGURAR QUE LOS EFECTOS DE APERTURA AUTOMÁTICA SOLO SE EJECUTEN UNA VEZ POR MONTAJE PARA EVITAR DOBLE APERTURA
  const autoOpenedRatingRef = useRef(false)
  const [passengerRating, setPassengerRating] = useState(0)
  const [ratingComment, setRatingComment] = useState("")
  const [showChatDialog, setShowChatDialog] = useState(false)
  const [chatUnread, setChatUnread] = useState(0)
  const [, setChatLastMessage] = useState<string | null>(null)
  const chatChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  // Sidebar collapse state (drivers can collapse to icons-only)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const autoOpenedSelectRef = useRef(false)
  // SI EL USUARIO CIERRA MANUALMENTE EL DIÁLOGO DE SELECCIÓN, EVITAR QUE SE VUELVA A ABRIR AUTOMÁTICAMENTE
  const manualClosedSelectRef = useRef(false)
  // ESTADO PARA MANEJAR LA SELECCIÓN CUANDO HAY MÚLTIPLES VIAJES ACTIVOS
  type RideRow = Database["public"]["Tables"]["rides"]["Row"]
  const [selectedActiveRide, setSelectedActiveRide] = useState<RideRow | null>(null)
  const [showSelectDialog, setShowSelectDialog] = useState(false)
  const suppressAutoOpenRef = useRef(false)
  // marker click dialog state
  const [selectedMarkerRideId, setSelectedMarkerRideId] = useState<string | null>(null)
  const [showMarkerDialog, setShowMarkerDialog] = useState(false)

  // Pending rides that are NOT assigned to a specific driver (passenger chose any driver)
  const pendingRides = rides.filter((ride) => ride.status === "pending" && !ride.driver_id)
  // Rides specifically assigned to this driver (passenger selected this driver)
  // NOTE: when a passenger selects a driver the passenger flow currently inserts the ride
  // with status 'accepted' and driver_id set. We want to notify the driver in that case
  // as well — so include both 'pending' and 'accepted' statuses for assigned notifications.
  const assignedIncomingRides = rides.filter(
    (ride) => ride.driver_id === driverId && ["pending", "accepted"].includes(ride.status),
  )
  // Assigned pending rides (passenger picked this driver but ride still pending acceptance)
  const assignedPendingRides = assignedIncomingRides.filter((r) => r.status === "pending")
  // Count only broadcast (any-driver) pending rides for the Ride Requests badge.
  const pendingCount = pendingRides.length
  // SOPORTE PARA MÚLTIPLES VIAJES ACTIVOS ASIGNADOS A ESTE CONDUCTOR (ACEPTADOS O EN PROGRESO)
  const activeRides = rides.filter(
    (ride) => ride.driver_id === driverId && ["accepted", "in-progress"].includes(ride.status),
  )

  // DETERMINAR QUÉ VIAJE MOSTRAR EN EL RIDE TRACKER:
  // - SI EL CONDUCTOR LO SELECCIONÓ, USAR ESA SELECCIÓN
  // - SI SOLO HAY UN VIAJE ACTIVO, MOSTRAR ESE
  // - EN CASO CONTRARIO, NO MOSTRAR NINGUNO HASTA QUE SE SELECCIONE
  const activeRide = selectedActiveRide ?? (activeRides.length === 1 ? activeRides[0] : null)

  // ---- Sound notification state ----
  const prevPendingRef = useRef<number>(0)
  const prevAssignedRef = useRef<number>(0)
  const prevAssignedPendingRef = useRef<number>(0)
  const playUnlockAttachedRef = useRef<boolean>(false)
  const audioChatRef = useRef<HTMLAudioElement | null>(null)
  const playChatUnlockAttachedRef = useRef<boolean>(false)
  const [, setShowChatUnlockPrompt] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [soundEnabled, setSoundEnabled] = useState<boolean | null>(null)
  const [chatNotificationEnabled, setChatNotificationEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.uid || !supabase) return
      try {
        const { data } = await supabase.from("drivers").select("name, email, rating").eq("uid", user.uid).single()
        setUserData(data)
      } catch (error) {
        console.error("Error loading user data:", error)
      }
    }
    loadUserData()
  }, [user?.uid])

  // LOAD USER SETTINGS FROM USER_SETTINGS TABLE
  useEffect(() => {
    let mounted = true
    const loadSettings = async () => {
      if (!user?.uid || !supabase) return
      try {
        const { data } = await supabase.from("user_settings").select("settings").eq("uid", user.uid).single()
  const d = data as { settings?: unknown } | null
  const s = d?.settings as unknown
        // prefer localStorage if available (mirrors profile toggle)
        const getPref = (obj: unknown) => {
          try {
            return (obj as Record<string, any>)?.preferences?.soundEnabled
          } catch {
            return undefined
          }
        }
        let enabled = getPref(s) ?? true
        try {
          if (user?.uid) {
            const soundKey = `saferide_sound_enabled_${user.uid}`
            const local = localStorage.getItem(soundKey)
            if (local !== null) {
              enabled = JSON.parse(local)
            }
          }
        } catch (e) {
          console.warn("Could not read sound setting from localStorage:", e)
        }
        if (mounted) setSoundEnabled(Boolean(enabled))
      } catch (err) {
        console.error("Could not load user settings for sound:", err)
        if (mounted) setSoundEnabled(true)
      }
    }
    loadSettings()
    // Listen for changes from other tabs (profile toggle)
    const onStorage = (e: StorageEvent) => {
      try {
        if (!user?.uid) return
        const soundKey = `saferide_sound_enabled_${user.uid}`
        if (e.key === soundKey) {
          try {
            const val = JSON.parse(String(e.newValue))
            console.log(`[dashboard] storage event ${soundKey} changed: ${val}`)
            setSoundEnabled(Boolean(val))
          } catch (_err) {
            console.warn("Error parsing storage event value:", _err)
          }
        }
      } catch (_err) {
        // ignore
      }
    }
    const onPrefChanged = (ev: Event) => {
      try {
        if (!user?.uid) return
        // Try to safely read custom event detail if present
        const detail = (ev as CustomEvent & { detail?: unknown }).detail as
          | undefined
          | { key?: string; value?: string }
        const key: string | undefined = detail?.key
        const value: string | undefined = detail?.value
        const soundKey = `saferide_sound_enabled_${user.uid}`
        if (key === soundKey) {
          try {
            const val = JSON.parse(String(value))
            setSoundEnabled(Boolean(val))
          } catch (_err) {
            console.warn("Error parsing pref-changed value for sound:", _err)
          }
        }
      } catch (_err) {
        // ignore
      }
    }
    window.addEventListener("storage", onStorage)
    window.addEventListener("saferide:pref-changed", onPrefChanged)
    return () => {
      mounted = false
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("saferide:pref-changed", onPrefChanged)
    }
  }, [user?.uid])

  // Initialize audio element once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.preload = "auto"
      // fetch base64 audio and set as data url
      fetch("/api/sounds/saferidetone")
        .then((r) => r.json())
        .then((j) => {
          if (j?.base64) {
            audioRef.current!.src = `data:audio/mpeg;base64,${j.base64}`
          }
        })
        .catch((e) => console.warn("Could not load saferidetone:", e))
    }
    if (!audioChatRef.current) {
      audioChatRef.current = new Audio()
      audioChatRef.current.preload = "auto"
      fetch("/api/sounds/saferidechattone")
        .then((r) => r.json())
        .then((j) => {
          if (j?.base64) {
            audioChatRef.current!.src = `data:audio/mpeg;base64,${j.base64}`
          }
        })
        .catch((e) => console.warn("Could not load saferidechattone:", e))
    }
  }, [user?.uid])

  // LOAD CHAT NOTIFICATION SETTINGS FROM LOCAL STORAGE
  useEffect(() => {
    try {
      if (user?.uid) {
        const chatKey = `saferide_chat_notification_${user.uid}`
        const local = localStorage.getItem(chatKey)
        if (local !== null) {
          setChatNotificationEnabled(JSON.parse(local))
        }
      }
    } catch (e) {
      console.warn("Could not read saferide_chat_notification from localStorage:", e)
    }
    const onStorage = (e: StorageEvent) => {
      try {
        if (!user?.uid) return
        const chatKey = `saferide_chat_notification_${user.uid}`
        if (e.key === chatKey) {
          try {
            setChatNotificationEnabled(e.newValue ? JSON.parse(e.newValue) : null)
          } catch (_err) {
            console.warn("Error parsing storage event for chat toggle", _err)
          }
        }
      } catch (_err) {
        // ignore
      }
    }
    const onPrefChangedChat = (ev: Event) => {
      try {
        if (!user?.uid) return
        const detail = (ev as CustomEvent & { detail?: unknown }).detail as
          | undefined
          | { key?: string; value?: string }
        const key: string | undefined = detail?.key
        const value: string | undefined = detail?.value
        const chatKey = `saferide_chat_notification_${user.uid}`
        if (key === chatKey) {
          try {
            setChatNotificationEnabled(value ? JSON.parse(value) : null)
          } catch (err) {
            console.warn("Error parsing pref-changed value for chat toggle", err)
          }
        }
      } catch (err) {
        // ignore
      }
    }
    window.addEventListener("storage", onStorage)
    window.addEventListener("saferide:pref-changed", onPrefChangedChat)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  // HELPER: TRY TO PLAY AUDIO IMMEDIATELY; IF BLOCKED BY AUTOPLAY POLICY,
  const playAudioWithUnlock = async () => {
    if (!audioRef.current) return
    try {
      await audioRef.current.play()
      return
    } catch (err: unknown) {
      // If play is blocked due to lack of user interaction, attach a one-time listener
      const isNotAllowed =
        !!err && (err instanceof Error ? err.name === "NotAllowedError" || err.message.includes("didn't interact") : String(err).includes("didn't interact"))
      if (!isNotAllowed) {
        console.warn("Audio play failed:", err)
        return
      }

      if (playUnlockAttachedRef.current) return
      playUnlockAttachedRef.current = true

      const tryUnlock = async () => {
        try {
          // Try to resume WebAudio if available in a type-safe way
          try {
            const win = window as unknown as {
              AudioContext?: typeof AudioContext
              webkitAudioContext?: typeof AudioContext
              audioContext?: AudioContext
            }
            const Ctor = win.AudioContext ?? win.webkitAudioContext
            const ctx = win.audioContext ?? (Ctor ? new Ctor() : undefined)
            if (ctx && typeof (ctx as AudioContext).resume === "function") {
              await (ctx as AudioContext).resume()
              win.audioContext = ctx as AudioContext
            }
          } catch (e) {
            // ignore
          }
          // retry play
          await audioRef.current!.play()
        } catch (e) {
          console.warn("Retry audio play after user interaction failed:", e)
        } finally {
          window.removeEventListener("pointerdown", tryUnlock)
          window.removeEventListener("keydown", tryUnlock)
          playUnlockAttachedRef.current = false
        }
      }

      window.addEventListener("pointerdown", tryUnlock, { once: true })
      window.addEventListener("keydown", tryUnlock, { once: true })
      return
    }
  }

  const playChatAudioWithUnlock = async () => {
    if (!audioChatRef.current) return
    try {
      await audioChatRef.current.play()
      return
    } catch (err: unknown) {
      const isNotAllowed =
        !!err && (err instanceof Error ? err.name === "NotAllowedError" || err.message.includes("didn't interact") : String(err).includes("didn't interact"))
      if (!isNotAllowed) {
        console.warn("Chat audio play failed:", err)
        return
      }
      // show small prompt so user can actively enable sounds
      setShowChatUnlockPrompt(true)
      if (playChatUnlockAttachedRef.current) return
      playChatUnlockAttachedRef.current = true
      const tryUnlock = async () => {
        try {
          try {
            const win = window as unknown as {
              AudioContext?: typeof AudioContext
              webkitAudioContext?: typeof AudioContext
              audioContext?: AudioContext
            }
            const Ctor = win.AudioContext ?? win.webkitAudioContext
            const ctx = win.audioContext ?? (Ctor ? new Ctor() : undefined)
            if (ctx && typeof (ctx as AudioContext).resume === "function") {
              await (ctx as AudioContext).resume()
              win.audioContext = ctx as AudioContext
            }
          } catch (_e) {}
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

  // Chat audio unlock is handled inline with user interaction events (see playChatAudioWithUnlock)

  // Play sound when pendingRides increases and user has enabled sound
  useEffect(() => {
    const prev = prevPendingRef.current
    const current = pendingRides.length
    if (current > prev) {
      // pending increased
      if (soundEnabled === null || soundEnabled === true) {
        playAudioWithUnlock()
      }
    }
    prevPendingRef.current = current
  }, [pendingRides.length, soundEnabled])

  // Play sound when a ride assigned specifically to this driver arrives
  useEffect(() => {
    const prev = prevAssignedRef.current
    const current = assignedIncomingRides.length
    if (current > prev) {
      if (soundEnabled === null || soundEnabled === true) {
        playAudioWithUnlock()
      }
    }
    prevAssignedRef.current = current
  }, [assignedIncomingRides.length, soundEnabled])

  // When a new assigned PENDING ride arrives, switch to map and open marker dialog
  useEffect(() => {
    const prev = prevAssignedPendingRef.current
    const current = assignedPendingRides.length
    if (current > prev) {
      // open map and show the dialog for the newest assigned pending ride
      const newest = assignedPendingRides[0]
      if (newest) {
        setCurrentView("map")
        setSelectedMarkerRideId(newest.id)
        setShowMarkerDialog(true)
      }
    }
    prevAssignedPendingRef.current = current
  }, [assignedPendingRides])

  // CARGAR ESTADÍSTICAS DEL CONDUCTOR Y VIAJES RECIENTES (EFECTO DE INICIALIZACIÓN)
  useEffect(() => {
    const loadDriverStats = async () => {
      if (!supabase || !driverId) return
      try {
        // OBTENER DATOS DEL CONDUCTOR (SÓLO RATING; TOTAL_TRIPS SE CALCULA A PARTIR DE LOS VIAJES)
        const { data: driverData } = await supabase.from("drivers").select("rating").eq("uid", driverId).single()

        // OBTENER TODOS LOS VIAJES COMPLETADOS DE ESTE CONDUCTOR (NO SOLO LOS RECIENTES)
        const { data: allCompletedRides } = await supabase
          .from("rides")
          .select("actual_fare, estimated_fare, completed_at")
          .eq("driver_id", driverId)
          .eq("status", "completed")
          .order("completed_at", { ascending: false })

        const completed = (allCompletedRides ?? []) as unknown as RideRow[]

        if (completed.length > 0) {
          const today = new Date().toDateString()
          const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          const thisMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

          const todayRides = completed.filter(
            (ride) => ride.completed_at && new Date(ride.completed_at).toDateString() === today,
          )
          const weeklyRides = completed.filter((ride) => ride.completed_at && new Date(ride.completed_at) >= thisWeek)
          const monthlyRides = completed.filter((ride) => ride.completed_at && new Date(ride.completed_at) >= thisMonth)

          setDriverStats({
            todayTrips: todayRides.length,
            todayEarnings: todayRides.reduce(
              (sum, ride) => sum + Number(ride.actual_fare ?? ride.estimated_fare ?? 0),
              0,
            ),
            todayHours: todayRides.length * 0.5, // ESTIMADO: 30 MIN POR VIAJE
            weeklyEarnings: weeklyRides.reduce(
              (sum, ride) => sum + Number(ride.actual_fare ?? ride.estimated_fare ?? 0),
              0,
            ),
            monthlyEarnings: monthlyRides.reduce(
              (sum, ride) => sum + Number(ride.actual_fare ?? ride.estimated_fare ?? 0),
              0,
            ),
            totalTrips: completed.length,
            rating: (driverData as { rating?: number } | null)?.rating ?? 0,
          })

          // ACTUALIZAR LA TABLA 'drivers' CON EL RECUENTO CORRECTO DE 'total_trips'
          // @ts-ignore -- supabase client generic typing mismatch; narrow types in a later refactor
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from("drivers").update({ total_trips: completed.length }).eq("uid", driverId)
        } else {
          // NO SE ENCONTRARON VIAJES COMPLETADOS: INICIALIZAR ESTADÍSTICAS A CERO
          setDriverStats({
            todayTrips: 0,
            todayEarnings: 0,
            todayHours: 0,
            weeklyEarnings: 0,
            monthlyEarnings: 0,
            totalTrips: 0,
            rating: (driverData as { rating?: number } | null)?.rating ?? 0,
          })
        }

        // OBTENER VIAJES RECIENTES PARA MOSTRAR EN LA INTERFAZ
        const { data: recent } = await supabase
          .from("rides")
          .select("*")
          .eq("driver_id", driverId)
          .eq("status", "completed")
          .order("completed_at", { ascending: false })
          .limit(5)
        setRecentTrips(recent || [])
      } catch (error) {
        console.error("Error loading driver stats:", error)
      }
    }
    loadDriverStats()
  }, [driverId])

  // COMPROBAR SI HAY VIAJES COMPLETADOS PARA MOSTRAR EL DIÁLOGO DE CALIFICACIÓN
  useEffect(() => {
    const completedRide = rides.find((ride) => {
      return (
        ride.status === "completed" &&
        ride.driver_id === driverId &&
        ride.driver_rating == null &&
        // TAMBIÉN ASEGURARSE DE QUE EL CONDUCTOR NO HAYA YA DEJADO UN COMENTARIO O LO HAYA OMITIDO
        !ride.driver_comment
      )
    })
    if (completedRide) {
      setCompletedRide(completedRide)
      // EVITAR APERTURA AUTOMÁTICA DEL DIÁLOGO DE CALIFICACIÓN MÁS DE UNA VEZ DURANTE MONTAJE/STRICT RERENDERS
      if (!autoOpenedRatingRef.current) {
        setShowRatingDialog(true)
        autoOpenedRatingRef.current = true
      }
    }
  }, [rides, driverId])

  // Chat notifications (driver listens for messages from passenger)
  useEffect(() => {
    let mounted = true
    const setup = async () => {
      // cleanup old channel
      if (chatChannelRef.current) {
        try {
          await supabase.removeChannel(chatChannelRef.current)
        } catch {}
        chatChannelRef.current = null
      }
      // The dependency array should include activeRide?.id to ensure the effect re-runs when the active ride changes.
      if (!activeRide) return
      try {
        const channel = supabase
          .channel(`ride-chat-notify-${activeRide.id}`)
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "ride_messages", filter: `ride_id=eq.${activeRide.id}` },
            (payload) => {
              if (!mounted) return
              const msg = payload.new as unknown as { message?: string; sender_type?: string }
              setChatLastMessage(String(msg.message ?? ""))
              // if message comes from passenger, increment unread for driver
              if (msg.sender_type === "passenger") {
                setChatUnread((c) => c + 1)
                // try to play chat audio only if chat notifications enabled
                if (chatNotificationEnabled === null || chatNotificationEnabled === true) {
                  playChatAudioWithUnlock().catch(() => {})
                }
              }
            },
          )
          .subscribe()
        chatChannelRef.current = channel
      } catch (err) {
        console.error("Error subscribing to chat notifications (driver):", err)
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
  }, [activeRide?.id, chatNotificationEnabled]) // Added activeRide?.id to dependency array

  // SI HAY MÚLTIPLES VIAJES ACTIVOS PARA ESTE CONDUCTOR, ABRIR AUTOMÁTICAMENTE EL DIÁLOGO DE SELECCIÓN
  useEffect(() => {
    // ABRIR EL DIÁLOGO DE SELECCIÓN AUTOMÁTICAMENTE SOLO UNA VEZ POR MONTAJE PARA EVITAR RENDERIZADOS DUPLICADOS
    if (
      activeRides.length > 1 &&
      !selectedActiveRide &&
      !suppressAutoOpenRef.current &&
      !autoOpenedSelectRef.current &&
      !manualClosedSelectRef.current
    ) {
      setShowSelectDialog(true)
      autoOpenedSelectRef.current = true
    }
  }, [activeRides, selectedActiveRide])

  // SI LA SELECCIÓN ACTUAL DESAPARECE (CANCELADO/COMPLETADO/ELIMINADO), BORRAR LA SELECCIÓN
  useEffect(() => {
    if (selectedActiveRide && !activeRides.find((r) => r.id === selectedActiveRide.id)) {
      setSelectedActiveRide(null)
    }
  }, [activeRides, selectedActiveRide])

  // ACEPTAR UN VIAJE: EJECUTAR LÓGICA DE ACEPTACIÓN Y NOTIFICAR AL USUARIO
  const handleAcceptRide = async (rideId: string) => {
    try {
      // OBTENER NOMBRE DEL CONDUCTOR PARA REGISTRAR EN LA ACCIÓN DE ACEPTAR
      const { data: driverData } = await supabase.from("drivers").select("name").eq("uid", driverId).single()
      const driverName = (driverData as { name?: string } | null)?.name ?? "Conductor"
      const result = await acceptRide(rideId, driverName)
      if (!result.success) {
        toast({
          title: "Error",
          description: "No se pudo aceptar el viaje: " + result.error,
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Viaje Aceptado",
        description: "Has aceptado el viaje exitosamente",
      })
      console.log("Ride accepted successfully")
    } catch (error) {
      console.error("Error accepting ride:", error)
      toast({
        title: "Error",
        description: "Error inesperado al aceptar el viaje",
        variant: "destructive",
      })
    }
  }

  // RECHAZAR UN VIAJE: ENVIAR MOTIVO Y NOTIFICAR AL USUARIO
  const handleRejectRide = async (rideId: string) => {
    const result = await rejectRide(rideId, "No disponible en este momento")
    if (!result.success) {
      toast({
        title: "Error",
        description: "No se pudo rechazar el viaje",
        variant: "destructive",
      })
      return
    }
    toast({
      title: "Viaje Rechazado",
      description: "Has rechazado el viaje",
    })
    console.log("Ride rejected successfully")
  }

  // ACTUALIZAR EL ESTADO DEL VIAJE: CAMBIOS DE ESTADO Y REFRESCO DE LA LISTA
  const handleStatusUpdate = async (rideId: string, status: string) => {
    try {
      const allowed = ["pending", "accepted", "in-progress", "completed", "cancelled"] as const
      // Tipar allowed como RideRow['status'][] y castear status antes de usarlo
      const allowedStatuses = allowed as ReadonlyArray<RideRow["status"]>
      if (!allowedStatuses.includes(status as RideRow["status"])) throw new Error("Estado inválido")
      const result = await updateRideStatus(rideId, status as RideRow["status"])
      if (!result.success) {
        toast({
          title: "Error",
          description: "No se pudo actualizar el estado del viaje: " + result.error,
          variant: "destructive",
        })
        return
      }
      // ASEGURAR QUE LA UI REFLEJE EL ESTADO MÁS RECIENTE INMEDIATAMENTE.
      // refreshRides RECARGA LA LISTA DE VIAJES DESDE LA BASE DE DATOS.
      try {
        await refreshRides()
        // SI EL USUARIO TENÍA UN VIAJE SELECCIONADO, ACTUALIZAR ESA SELECCIÓN CON LA VERSIÓN MÁS RECIENTE DESDE LA BD
        if (selectedActiveRide && selectedActiveRide.id === rideId) {
          const { data: freshRide, error: rideErr } = await supabase.from("rides").select("*").eq("id", rideId).single()
          if (!rideErr && freshRide) {
            const typed = freshRide as unknown as RideRow
            setSelectedActiveRide(typed)
          }
        }
      } catch (e) {
        // NO FATAL: YA SE ACTUALIZÓ EL REGISTRO EN LA BASE DE DATOS
        console.warn("Could not refresh rides after status update:", e)
      }
      const statusMessages = {
        "in-progress": "Viaje iniciado",
        completed: "Viaje completado",
      }
      toast({
        title: "ESTADO ACTUALIZADO",
        description: statusMessages[status] || `ESTADO CAMBIADO A ${status}`,
      })
      console.log("Ride status updated:", rideId, status)
    } catch (error) {
      console.error("Error updating ride status:", error)
      toast({
        title: "Error",
        description: "Error inesperado al actualizar el estado",
        variant: "destructive",
      })
    }
  }

  // ENVIAR CALIFICACIÓN AL PASAJERO (OPCIONAL) Y COMENTARIO: ACTUALIZA RIDE Y PROMEDIA CALIFICACIONES
  const handleRatePassenger = async () => {
    if (!completedRide) return
    if (passengerRating === 0 && ratingComment.trim() === "") return

    try {
      const payload = {
        driver_comment: ratingComment.trim() || null,
      } as Database["public"]["Tables"]["rides"]["Update"]

      if (passengerRating > 0) (payload.driver_rating = passengerRating)

  // @ts-ignore -- supabase typing mismatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("rides").update(payload).eq("id", completedRide.id)
      if (error) {
        console.error("Error rating passenger:", error)
        return
      }

      if (passengerRating > 0) {
        const { data: passengerRides } = await supabase.from("rides").select("driver_rating")
          .eq("passenger_id", completedRide.passenger_id)
          .not("driver_rating", "is", null)

        const ridesArr = (passengerRides as Array<{ driver_rating?: number | null }> | null) ?? null
        if (ridesArr && ridesArr.length > 0) {
          const avgRating = ridesArr.reduce((sum, ride) => sum + Number(ride.driver_rating ?? 0), 0) / ridesArr.length
          // @ts-ignore -- supabase typing mismatch
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from("passengers").update({ rating: avgRating }).eq("uid", completedRide.passenger_id)
        }
      }

      setShowRatingDialog(false)
      autoOpenedRatingRef.current = false
      setPassengerRating(0)
      setRatingComment("")
      setCompletedRide(null)
      toast({ title: "Calificación Enviada", description: "Gracias por compartir tu experiencia." })
      console.log("Passenger rated successfully")
    } catch (err) {
      console.error("Error submitting passenger rating:", err)
      toast({ title: "Error", description: "No se pudo enviar la calificación", variant: "destructive" })
    }
  }

  // OMITIR CALIFICACIÓN DEL PASAJERO: GUARDAR COMENTARIO POR DEFECTO SI NO HAY TEXTO
  const handleSkipPassengerRating = async () => {
    if (!completedRide) return
    try {
  const payload = { driver_comment: ratingComment.trim() || "Omitido por el conductor" } as Database["public"]["Tables"]["rides"]["Update"]
  // @ts-ignore -- supabase typing mismatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("rides").update(payload).eq("id", completedRide.id)
      if (error) {
        console.error("Error skipping passenger rating:", error)
        toast({ title: "Error", description: "No se pudo omitir la calificación.", variant: "destructive" })
        return
      }

      setShowRatingDialog(false)
      autoOpenedRatingRef.current = false
      setPassengerRating(0)
      setRatingComment("")
      setCompletedRide(null)
      toast({ title: "Omitido", description: "Gracias por tu respuesta." })
    } catch (err) {
      console.error("Error in handleSkipPassengerRating:", err)
      toast({ title: "Error", description: "Ocurrió un error.", variant: "destructive" })
    }
  }

  // CANCELAR VIAJE ACTIVO: MARCAR COMO 'cancelled' Y REGISTRAR FECHA/MOTIVO
  const handleCancelActiveRide = async (rideId: string) => {
    try {
      // @ts-ignore -- supabase typing mismatch
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("rides")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancellation_reason: "Cancelado por el conductor durante el viaje",
        })
        .eq("id", rideId)

      if (error) {
        console.error("Error cancelling ride:", error)
        toast({
          title: "Error",
          description: "No se pudo cancelar el viaje",
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Viaje Cancelado",
        description: "El viaje ha sido cancelado exitosamente",
      })
      refreshRides()
    } catch (error) {
      console.error("Error cancelling active ride:", error)
      toast({
        title: "Error",
        description: "Error inesperado al cancelar el viaje",
        variant: "destructive",
      })
    }
  }

  // CONVERTIR SOLICITUDES PENDIENTES A FORMATO DE UBICACIONES PARA EL MAPA
  // (Nota: mapeo pendiente preservado aquí como referencia; usar "pendingRides" directo cuando sea necesario.)

  // Rides assigned to this driver — these should appear on the map for this driver
  // (passenger selected this specific driver).
  const assignedRideLocations = assignedIncomingRides.map((ride) => ({
    id: ride.id,
    lat: ride.pickup_coordinates[1],
    lng: ride.pickup_coordinates[0],
    name: ride.passenger_name,
  }))

  // selected ride data for marker dialog
  const selectedMarkerRide = selectedMarkerRideId ? rides.find((r) => r.id === selectedMarkerRideId) ?? null : null

  const handleLogout = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("Error logging out:", error)
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? "w-16" : "w-64"} bg-white shadow-lg flex flex-col transition-all duration-300`}>
        {/* Toggle Button */}
        <div className="p-4 border-b border-gray-200">
          <button
            aria-label={sidebarCollapsed ? "Abrir sidebar" : "Cerrar sidebar"}
            onClick={() => setSidebarCollapsed((s) => !s)}
            className="w-full flex items-center justify-center p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Profile Section - full vs collapsed */}
        {!sidebarCollapsed ? (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src="/placeholder.svg?height=48&width=48" />
                <AvatarFallback className="bg-blue-500 text-white font-semibold">
                  {(String(userData?.name || user?.email || "D")).charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-gray-900">{userData?.name || "Driver"}</h3>
                <p className="text-sm text-gray-500">ID: {user?.uid?.slice(0, 9) || "123456789"}</p>
              </div>
            </div>

            {/* Online Status */}
            <div className="mt-4 flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-400"}`} />
              <span className="text-sm font-medium text-gray-700">{isOnline ? "Online" : "Offline"}</span>
            </div>
          </div>
        ) : (
          <div className="p-3 border-b border-gray-200 flex justify-center">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-blue-500 text-white font-semibold text-sm">
                {(String(userData?.name || user?.email || "D")).charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <button
              onClick={() => setCurrentView("map")}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                currentView === "map" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Map className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "map" ? "text-white stroke-current" : "text-gray-700 stroke-current"}`} />
              {!sidebarCollapsed && <span className="font-medium">Map</span>}
              {(pendingCount > 0 || assignedIncomingRides.length > 0) && (
                <Badge variant="destructive" className={`${sidebarCollapsed ? "absolute left-14" : "ml-auto"}`}>1</Badge>
              )}
            </button>

            <button
              onClick={() => setCurrentView("requests")}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                currentView === "requests" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <FileText className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "requests" ? "text-white stroke-current" : "text-gray-700 stroke-current"}`} />
              {!sidebarCollapsed && <span className="font-medium">Ride Requests</span>}
              {pendingCount > 0 && <Badge variant="destructive" className={`${sidebarCollapsed ? "absolute left-14" : "ml-auto"}`}>1</Badge>}
            </button>

            <button
              onClick={() => {
                if (activeRide) {
                  setSelectedActiveRide(activeRide)
                  setShowChatDialog(true)
                } else {
                  toast({ title: "No active chat", description: "No tienes un viaje activo para chatear.", variant: "default" })
                }
              }}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                currentView === "chat" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <MessageCircle className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "chat" ? "text-white stroke-current" : "text-gray-700 stroke-current"}`} />
              {!sidebarCollapsed && <span className="font-medium">Chat</span>}
              {chatUnread > 0 && <Badge variant="destructive" className={`${sidebarCollapsed ? "absolute left-14" : "ml-auto"}`}>1</Badge>}
            </button>

            <button
              onClick={() => setCurrentView("accepted")}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                currentView === "accepted" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <CheckCircle className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "accepted" ? "text-white stroke-current" : "text-gray-700 stroke-current"}`} />
              {!sidebarCollapsed && <span className="font-medium">Accepted Rides</span>}
              {activeRides.length > 0 && <Badge variant="destructive" className={`${sidebarCollapsed ? "absolute left-14" : "ml-auto"}`}>1</Badge>}
            </button>

            <button
              onClick={() => setCurrentView("trips")}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                currentView === "trips" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <History className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "trips" ? "text-white stroke-current" : "text-gray-700 stroke-current"}`} />
              {!sidebarCollapsed && <span className="font-medium">Recent Trips</span>}
            </button>

            <button
              onClick={() => setCurrentView("earnings")}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                currentView === "earnings" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <DollarSign className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "earnings" ? "text-white stroke-current" : "text-gray-700 stroke-current"}`} />
              {!sidebarCollapsed && <span className="font-medium">Earnings</span>}
            </button>
          </div>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : "space-x-3"} px-4 py-3 rounded-lg text-left text-gray-700 hover:bg-gray-100 transition-colors`}
          >
            <LogOut className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"}`} />
            {!sidebarCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Map View */}
        {currentView === "map" && (
          <div className="flex-1 relative">
            {/* Map Component */}
            <div className="absolute inset-0">
              <MapComponent
                userType="driver"
                // Only show rides that were explicitly assigned to this driver on the map.
                // Broadcast (any-driver) requests are handled in the Ride Requests view.
                driverLocations={assignedRideLocations}
                onMarkerClick={(id) => {
                  // set selection and open small dialog to accept/reject/chat
                  setSelectedMarkerRideId(id)
                  setShowMarkerDialog(true)
                }}
                pickupLocation={
                  activeRide
                    ? { lat: activeRide.pickup_coordinates[1], lng: activeRide.pickup_coordinates[0] }
                    : undefined
                }
                destinationLocation={
                  activeRide
                    ? { lat: activeRide.destination_coordinates[1], lng: activeRide.destination_coordinates[0] }
                    : undefined
                }
              />
            </div>

            {/* Floating counts on the map: Requests (broadcast) and Chat unread */}
            <div className="absolute left-4 top-4 flex flex-col space-y-2 z-50">
              <button
                onClick={() => setCurrentView("requests")}
                title="Open Ride Requests"
                className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-md hover:shadow-lg"
              >
                <FileText className="h-4 w-4 text-gray-700" />
                <span className="text-sm font-medium text-gray-800">Requests</span>
                {pendingCount > 0 && <Badge variant="destructive" className="ml-2">{pendingCount}</Badge>}
              </button>

              <button
                onClick={() => {
                  if (activeRide) {
                    setSelectedActiveRide(activeRide)
                    setShowChatDialog(true)
                    setChatUnread(0)
                  } else {
                    toast({ title: "No active chat", description: "No tienes un viaje activo para chatear.", variant: "default" })
                  }
                }}
                title="Open Chat"
                className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-md hover:shadow-lg"
              >
                <MessageCircle className="h-4 w-4 text-gray-700" />
                <span className="text-sm font-medium text-gray-800">Chat</span>
                {chatUnread > 0 && <Badge variant="destructive" className="ml-2">{chatUnread}</Badge>}
              </button>
            </div>

            {/* Accepted rides are no longer shown as overlay on the map. They are visible
                only in the Accepted Rides view to avoid UI duplication. */}

            {/* Broadcast pending rides are intentionally not shown as overlay on the driver map.
                They are available in the Ride Requests view only. */}

            {/* Online/Offline Toggle */}
            <div className="absolute top-4 right-4">
              <Card className="bg-white shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700">{isOnline ? "Online" : "Offline"}</span>
                    <Switch checked={isOnline} onCheckedChange={updateOnlineStatus} disabled={statusLoading} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Ride Requests View */}
        {/* Accepted Rides View */}
        {currentView === "accepted" && (
          <div className="flex-1 p-6">
              <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Accepted Rides</h1>
              <p className="text-gray-600">Viajes que has aceptado o que te han sido asignados.</p>
            </div>

            {activeRides.length > 0 ? (
              <div className="space-y-4">
                {activeRides.map((ride) => (
                  <Card key={ride.id} className="bg-white shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-blue-500 text-white">
                              {ride.passenger_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900">{ride.passenger_name}</h3>
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm text-gray-600">4.9</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">${ride.estimated_fare}</div>
                          <div className="text-sm text-gray-500">~{ride.estimated_duration} min</div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            <span className="text-sm text-gray-600">Pickup</span>
                          </div>
                          <p className="text-sm font-medium text-gray-900">{ride.pickup_address}</p>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                            <span className="text-sm text-gray-600">Destination</span>
                          </div>
                          <p className="text-sm font-medium text-gray-900">{ride.destination_address}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex space-x-3">
                        <Button variant="outline" className="flex-1" onClick={() => {
                          setSelectedActiveRide(ride)
                          setShowChatDialog(true)
                          setChatUnread(0)
                        }}>
                          Chat with Passenger
                        </Button>
                        <Button variant="destructive" className="flex-1" onClick={() => handleCancelActiveRide(ride.id)}>
                          Cancel Ride
                        </Button>
                        <Button
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleStatusUpdate(ride.id, ride.status === "accepted" ? "in-progress" : "completed")}
                        >
                          {ride.status === "accepted" ? "Start Trip" : "Complete Trip"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No accepted rides</h3>
                <p className="text-gray-500">Los viajes que aceptes aparecerán aquí.</p>
              </div>
            )}
          </div>
        )}

        {/* Ride Requests View */}
        {currentView === "requests" && (
          <div className="flex-1 p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Ride Requests</h1>
              <p className="text-gray-600">Manage your incoming ride requests.</p>
            </div>

            {pendingRides.length > 0 ? (
              <div className="space-y-4">
                {pendingRides.map((ride) => (
                  <Card key={ride.id} className="bg-white shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-blue-500 text-white">
                              {ride.passenger_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900">{ride.passenger_name}</h3>
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm text-gray-600">4.9</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">${ride.estimated_fare}</div>
                          <div className="text-sm text-gray-500">~{ride.estimated_duration} min</div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            <span className="text-sm text-gray-600">Pickup</span>
                          </div>
                          <p className="text-sm font-medium text-gray-900">{ride.pickup_address}</p>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                            <span className="text-sm text-gray-600">Destination</span>
                          </div>
                          <p className="text-sm font-medium text-gray-900">{ride.destination_address}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex space-x-3">
                        <Button
                          variant="outline"
                          className="flex-1 bg-transparent"
                          onClick={() => handleRejectRide(ride.id)}
                        >
                          Reject
                        </Button>
                        <Button
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleAcceptRide(ride.id)}
                        >
                          Accept
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No ride requests</h3>
                <p className="text-gray-500">New ride requests will appear here when available.</p>
              </div>
            )}
          </div>
        )}

        {/* Recent Trips View */}
        {currentView === "trips" && (
          <div className="flex-1 p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Recent Trips</h1>
              <p className="text-gray-600">A log of your completed rides.</p>
            </div>

            {recentTrips.length > 0 ? (
              <div className="space-y-4">
                {recentTrips.map((trip) => (
                  <div key={trip.id} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{trip.passenger_name}</h3>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{trip.passenger_rating || "5.0"}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{new Date(trip.completed_at).toLocaleDateString()}</p>

                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-sm text-gray-900">{trip.pickup_address}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                            <span className="text-sm text-gray-900">{trip.destination_address}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 mt-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{trip.estimated_duration} min duration</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">
                          ${trip.actual_fare || trip.estimated_fare}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No recent trips</h3>
                <p className="text-gray-500">Your completed trips will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* Earnings View */}
        {currentView === "earnings" && (
          <div className="flex-1 p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
              <p className="text-gray-600">Track your financial performance.</p>
            </div>

            {/* Today's Earnings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Today&apos;s Earnings</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-1">${driverStats.todayEarnings}</div>
                  <div className="flex items-center text-sm text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    15% vs yesterday
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">This Week&apos;s Earnings</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-1">${driverStats.weeklyEarnings}</div>
                  <div className="flex items-center text-sm text-red-600">
                    <TrendingUp className="h-4 w-4 mr-1 rotate-180" />
                    5% vs last week
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">This Month&apos;s Earnings</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-1">${driverStats.monthlyEarnings}</div>
                  <div className="flex items-center text-sm text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    8% vs last month
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Statistics */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3">
                      <MapPin className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{driverStats.totalTrips}</div>
                    <div className="text-sm text-gray-600">Total Trips</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mx-auto mb-3">
                      <Star className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{driverStats.rating.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">Average Rating</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      $
                      {driverStats.totalTrips > 0
                        ? (driverStats.monthlyEarnings / driverStats.totalTrips).toFixed(0)
                        : 0}
                    </div>
                    <div className="text-sm text-gray-600">Avg. Earnings / Trip</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Dialogs remain the same */}
      <Dialog
        open={showSelectDialog}
        onOpenChange={(open) => {
          // Defer state update to avoid setState during render warnings
          setTimeout(() => {
            setShowSelectDialog(open)
            if (!open) {
              // mark that the user closed the dialog manually so it won't auto re-open
              manualClosedSelectRef.current = true
              // but clear the auto-open flag so a future manual open isn't blocked
              autoOpenedSelectRef.current = false
            }
          }, 0)
        }}
      >
        <DialogContent className="sm:max-w-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Seleccionar Viaje</DialogTitle>
            <DialogDescription>
              Tienes {activeRides.length} viajes activos. Selecciona el que deseas ver e iniciar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-2">
            {activeRides.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-white/60 rounded-md">
                <div>
                  <p className="font-semibold">
                    {r.passenger_name} — ${r.estimated_fare}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {r.pickup_address} → {r.destination_address}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Solicitado: {new Date(r.requested_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <DialogClose asChild>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        setSelectedActiveRide(r)
                        // prevent auto re-open while selection is being processed
                        suppressAutoOpenRef.current = true
                        setShowSelectDialog(false)
                        setTimeout(() => (suppressAutoOpenRef.current = false), 300)
                      }}
                    >
                      Seleccionar
                    </Button>
                  </DialogClose>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" className="text-sm bg-transparent">
                  Cerrar
                </Button>
              </DialogClose>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Marker click dialog for assigned rides shown on map */}
      <Dialog open={showMarkerDialog} onOpenChange={setShowMarkerDialog}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Viaje</DialogTitle>
            <DialogDescription>Este viaje fue asignado para ti. Revisa la información y acepta o rechaza.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedMarkerRide ? (
              <div>
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="bg-blue-500 text-white">{selectedMarkerRide.passenger_name?.charAt(0) ?? "P"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-lg">{selectedMarkerRide.passenger_name}</h3>
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{(selectedMarkerRide.passenger_rating ?? 4.9).toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">Requested: {new Date(selectedMarkerRide.requested_at).toLocaleString()}</div>
                  </div>
                </div>

                <div className="space-y-3 mb-3">
                  <div>
                    <div className="text-xs text-gray-500">Pickup</div>
                    <div className="font-medium text-gray-900">{selectedMarkerRide.pickup_address}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Destination</div>
                    <div className="font-medium text-gray-900">{selectedMarkerRide.destination_address}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs text-gray-500">Tarifa</div>
                    <div className="text-2xl font-bold text-blue-600">${selectedMarkerRide.estimated_fare}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Duración</div>
                    <div className="text-xl font-bold">{selectedMarkerRide.estimated_duration} min</div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      handleAcceptRide(selectedMarkerRide.id)
                      setShowMarkerDialog(false)
                    }}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      handleRejectRide(selectedMarkerRide.id)
                      setShowMarkerDialog(false)
                    }}
                  >
                    Reject
                  </Button>
                </div>

                <div className="mt-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedActiveRide(selectedMarkerRide)
                      setShowChatDialog(true)
                      setChatUnread(0)
                      setShowMarkerDialog(false)
                    }}
                  >
                    Chat with Passenger
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-700">No se encontró información del viaje.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent className="sm:max-w-lg border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Chat con Pasajero</DialogTitle>
          </DialogHeader>
          {activeRide && (
            <RideChat
              rideId={activeRide.id}
              driverName={activeRide.driver_name ?? ""}
              passengerName={activeRide.passenger_name}
              onClose={() => setShowChatDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={showRatingDialog}
        onOpenChange={(open) => {
          // Defer state update to avoid setState during render warnings
          setTimeout(() => {
            setShowRatingDialog(open)
            if (!open) autoOpenedRatingRef.current = false
          }, 0)
        }}
      >
        <DialogContent className="sm:max-w-md border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">⭐ Califica al pasajero</DialogTitle>
            <DialogDescription className="text-base">
              Ayuda a otros conductores compartiendo tu experiencia con este pasajero
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-center">
              <Avatar className="h-20 w-20 mx-auto mb-4 ring-4 ring-blue-200">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-2xl font-bold">
                  {completedRide?.passenger_name?.charAt(0) || "P"}
                </AvatarFallback>
              </Avatar>
              <p className="font-bold text-lg text-gray-800">{completedRide?.passenger_name}</p>
              <p className="text-gray-600">¿Cómo fue tu experiencia con este pasajero?</p>
            </div>
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setPassengerRating(star)}
                  className="p-2 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-10 w-10 ${star <= passengerRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-300"}`}
                  />
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <Label htmlFor="rating-comment" className="text-base font-medium">
                Comentario (opcional)
              </Label>
              <Textarea
                id="rating-comment"
                placeholder="Comparte tu experiencia..."
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                rows={3}
                className="border-gray-200 focus:border-blue-400"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 font-semibold"
                onClick={handleRatePassenger}
                disabled={passengerRating === 0 && ratingComment.trim() === ""}
              >
                Enviar Calificación
              </Button>
              <Button variant="outline" className="font-semibold bg-transparent" onClick={handleSkipPassengerRating}>
                Omitir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function DriverDashboard() {
  return (
    <ProtectedRoute requiredUserType="driver">
      <DriverDashboardContent />
    </ProtectedRoute>
  )
}
