"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  MapPin,
  Navigation,
  Clock,
  Star,
  Shield,
  DollarSign,
  TrendingUp,
  Users,
  Car,
  Calendar,
  BarChart3,
  MessageCircle,
  XCircle,
  CheckCircle,
  Activity,
  Zap,
} from "lucide-react"
import { useRealTimeRides } from "@/hooks/useRealTimeRides"
import { useDriverStatus } from "@/hooks/useDriverStatus"
import { supabase } from "@/lib/supabase"
import { MapComponent } from "@/components/MapComponent"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { RideTracker } from "@/components/RideTracker"
import { useToast } from "@/hooks/use-toast"
import { RideChat } from "@/components/RideChat"



// CONTENIDO Y GESTIÓN DE ESTADO DEL DASHBOARD DEL CONDUCTOR: AGRUPA ESTADO, EFECTOS Y FUNCIONES
function DriverDashboardContent() {
  const { user } = useAuth()
  const { toast } = useToast()
  // PASAR UNDEFINED SI EL USUARIO NO ESTÁ DISPONIBLE PARA EVITAR ENVIAR IDS POR DEFECTO AL API
  const driverId = user?.uid
  const { isOnline, loading: statusLoading, updateOnlineStatus } = useDriverStatus(driverId)
  const {
    rides,
    loading: ridesLoading,
    acceptRide,
    rejectRide,
    updateRideStatus,
    lastUpdate,
    refreshRides,
  } = useRealTimeRides(driverId)
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
  const autoOpenedSelectRef = useRef(false)
  // SI EL USUARIO CIERRA MANUALMENTE EL DIÁLOGO DE SELECCIÓN, EVITAR QUE SE VUELVA A ABRIR AUTOMÁTICAMENTE
  const manualClosedSelectRef = useRef(false)
  // ESTADO PARA MANEJAR LA SELECCIÓN CUANDO HAY MÚLTIPLES VIAJES ACTIVOS
  const [selectedActiveRide, setSelectedActiveRide] = useState<any | null>(null)
  const [showSelectDialog, setShowSelectDialog] = useState(false)
  const suppressAutoOpenRef = useRef(false)

  const pendingRides = rides.filter((ride) => ride.status === "pending")
    // SOPORTE PARA MÚLTIPLES VIAJES ACTIVOS ASIGNADOS A ESTE CONDUCTOR (ACEPTADOS O EN PROGRESO)
  const activeRides = rides.filter(
    (ride) => ride.driver_id === driverId && ["accepted", "in-progress"].includes(ride.status),
  )


  // DETERMINAR QUÉ VIAJE MOSTRAR EN EL RIDE TRACKER:
  // - SI EL CONDUCTOR LO SELECCIONÓ, USAR ESA SELECCIÓN
  // - SI SOLO HAY UN VIAJE ACTIVO, MOSTRAR ESE
  // - EN CASO CONTRARIO, NO MOSTRAR NINGUNO HASTA QUE SE SELECCIONE
  const activeRide = selectedActiveRide ?? (activeRides.length === 1 ? activeRides[0] : null)

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

        if (allCompletedRides) {
          const today = new Date().toDateString()
          const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          const thisMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

          const todayRides = allCompletedRides.filter((ride) => new Date(ride.completed_at).toDateString() === today)
          const weeklyRides = allCompletedRides.filter((ride) => new Date(ride.completed_at) >= thisWeek)
          const monthlyRides = allCompletedRides.filter((ride) => new Date(ride.completed_at) >= thisMonth)

          setDriverStats({
            todayTrips: todayRides.length,
            todayEarnings: todayRides.reduce((sum, ride) => sum + (ride.actual_fare || ride.estimated_fare), 0),
              todayHours: todayRides.length * 0.5, // ESTIMADO: 30 MIN POR VIAJE
            weeklyEarnings: weeklyRides.reduce((sum, ride) => sum + (ride.actual_fare || ride.estimated_fare), 0),
            monthlyEarnings: monthlyRides.reduce((sum, ride) => sum + (ride.actual_fare || ride.estimated_fare), 0),
            totalTrips: allCompletedRides.length, // Calculate from actual completed rides
            totalTrips: allCompletedRides.length, // CALCULADO A PARTIR DE LOS VIAJES COMPLETADOS
          // ACTUALIZAR LA TABLA 'drivers' CON EL RECUENTO CORRECTO DE 'total_trips'
          // NO SE ENCONTRARON VIAJES COMPLETADOS: INICIALIZAR ESTADÍSTICAS A CERO
  // OBTENER VIAJES RECIENTES PARA MOSTRAR EN LA INTERFAZ
            rating: driverData?.rating || 0,
          })


          // ACTUALIZAR LA TABLA 'drivers' CON EL RECUENTO CORRECTO DE 'total_trips'
          await supabase
            .from("drivers")
            .update({
              total_trips: allCompletedRides.length,
            })
            .eq("uid", driverId)
        } else {
          // NO SE ENCONTRARON VIAJES COMPLETADOS: INICIALIZAR ESTADÍSTICAS A CERO
          setDriverStats({
            todayTrips: 0,
            todayEarnings: 0,
            todayHours: 0,
            weeklyEarnings: 0,
            monthlyEarnings: 0,
            totalTrips: 0,
            rating: driverData?.rating || 0,
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
        (ride.driver_rating == null) &&
  // TAMBIÉN ASEGURARSE DE QUE EL CONDUCTOR NO HAYA YA DEJADO UN COMENTARIO O LO HAYA OMITIDO
        !ride.driver_comment
      )
    })
    if (completedRide) {
      setCompletedRide(completedRide)
  // EVITAR APERTURA AUTOMÁTICA DEL DIÁLOGO DE CALIFICACIÓN MÁS DE UNA VEZ DURANTE MOUNT/STRICT RERENDERS
      if (!autoOpenedRatingRef.current) {
        setShowRatingDialog(true)
        autoOpenedRatingRef.current = true
      }
    }
  }, [rides, driverId])



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
      const result = await acceptRide(rideId, driverData?.name || "Conductor")
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
      const result = await updateRideStatus(rideId, status)
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
            setSelectedActiveRide(freshRide)
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
      const payload: any = {
        driver_comment: ratingComment.trim() || null,
      }

      if (passengerRating > 0) payload.driver_rating = passengerRating

      const { error } = await supabase.from("rides").update(payload).eq("id", completedRide.id)
      if (error) {
        console.error("Error rating passenger:", error)
        return
      }

      if (passengerRating > 0) {
        const { data: passengerRides } = await supabase
          .from("rides")
          .select("driver_rating")
          .eq("passenger_id", completedRide.passenger_id)
          .not("driver_rating", "is", null)

        if (passengerRides && passengerRides.length > 0) {
          const avgRating = passengerRides.reduce((sum, ride) => sum + (ride.driver_rating ?? 0), 0) / passengerRides.length
          await supabase.from("passengers").update({ rating: avgRating }).eq("uid", completedRide.passenger_id)
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
      const payload = { driver_comment: ratingComment.trim() || "Omitido por el conductor" }
      const { error } = await supabase.from("rides").update(payload).eq("id", completedRide.id)
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
      const { error } = await supabase
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
  const rideLocations = pendingRides.map((ride) => ({
    id: ride.id,
    lat: ride.pickup_coordinates[1],
    lng: ride.pickup_coordinates[0],
    name: ride.passenger_name,
  }))


  // LÓGICA DE RENDERIZADO (JSX): ESTRUCTURA PRINCIPAL DEL DASHBOARD
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
  {/* ENCABEZADO MEJORADO: ICONO, BADGE Y BLOQUE DE ESTADO */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* IZQUIERDA: LOGO Y BADGE QUE IDENTIFICAN AL USUARIO COMO CONDUCTOR */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-md flex items-center justify-center">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 text-xs py-0.5 px-2">
                Conductor
              </Badge>
            </div>

            {/* DERECHA: BLOQUE COMPACTO DE ESTADO (ONLINE/OFFLINE) */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-white/60 rounded-full px-3 py-1 border border-blue-200">
                <Activity className="h-4 w-4 text-blue-600" />
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-700">Estado</span>
                  <Switch checked={isOnline} onCheckedChange={updateOnlineStatus} disabled={statusLoading} />
                  <span className={`text-xs font-semibold ${isOnline ? "text-green-600" : "text-gray-500"}`}>
                    {isOnline ? "En línea" : "Desconectado"}
                  </span>
                </div>
                {isOnline && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-2" />}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-16">
          {" "}
          {/* AUMENTO DE ESPACIADO VERTICAL PARA MEJOR DISTRIBUCIÓN */}
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-white/60 backdrop-blur-sm border border-blue-200 rounded-xl p-1 gap-6">
            {" "}
            {/* AUMENTO DE GAP ENTRE PESTAÑAS */}
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-lg font-medium"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-lg font-medium"
            >
              <Zap className="h-4 w-4 mr-2" />
              Solicitudes
            </TabsTrigger>
            <TabsTrigger
              value="trips"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-lg font-medium"
            >
              <Car className="h-4 w-4 mr-2" />
              Viajes
            </TabsTrigger>
            <TabsTrigger
              value="earnings"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-lg font-medium"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Ganancias
            </TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* CONTENIDO PRINCIPAL: MAPA, VIAJES ACTIVOS Y ESTADÍSTICAS */}
              <div className="lg:col-span-2 space-y-8">
                {/* DIÁLOGO DE SELECCIÓN CUANDO HAY MÚLTIPLES VIAJES ACTIVOS */}
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
                            <p className="font-semibold">{r.passenger_name} — ${r.estimated_fare}</p>
                            <p className="text-sm text-muted-foreground">{r.pickup_address} → {r.destination_address}</p>
                            <p className="text-xs text-muted-foreground">Solicitado: {new Date(r.requested_at).toLocaleString()}</p>
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
                          <Button variant="outline" className="text-sm">
                            Cerrar
                          </Button>
                        </DialogClose>
                      </DialogFooter>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* COMPONENTE MAPA MEJORADO: MUESTRA UBICACIONES Y PUNTOS DE RECOGIDA */}
                  <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-0">
                    {/* ENCABEZADO E BARRA DE INFORMACIÓN ELIMINADOS (MAPA PERMANECE) */}
                    <MapComponent
                      userType="driver"
                      driverLocations={rideLocations}
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
                  </CardContent>
                </Card>

                  {/* SI HAY VARIOS VIAJES ACTIVOS, MOSTRAR BOTÓN DE SELECCIÓN */}
                  {activeRides.length > 1 && (
                    <div className="flex justify-end mt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          manualClosedSelectRef.current = false
                          setShowSelectDialog(true)
                        }}
                        className="text-sm"
                      >
                        Viajes activos ({activeRides.length})
                      </Button>
                    </div>
                  )}

                {/* VIAJE ACTIVO MEJORADO: TRACKER, CHAT Y OPCIONES */}
                {activeRide && (
                  <div className="space-y-6">
                    {/* BOTÓN DE SELECCIÓN MOVIDO SOBRE EL MAPA PARA VISIBILIDAD */}
                    <RideTracker ride={activeRide} userType="driver" onStatusUpdate={handleStatusUpdate} />
                    {/* OPCIONES DE CHAT Y CANCELACIÓN MEJORADAS PARA VIAJES EN PROGRESO */}
                    {activeRide.status === "in-progress" && (
                      <Card className="border-0 shadow-xl bg-gradient-to-r from-orange-50 to-amber-50">
                        <CardContent className="p-6">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-orange-500 rounded-full">
                                <Car className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-bold text-orange-800 text-lg">Viaje en Progreso</h4>
                                <p className="text-orange-600 text-sm">Mantente en contacto con tu pasajero</p>
                              </div>
                            </div>
                            <Badge className="bg-orange-500 text-white px-3 py-1 text-sm font-semibold">
                              En camino
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Button
                              variant="outline"
                              className="bg-white/80 border-orange-200 hover:bg-orange-100 text-orange-700 font-medium"
                              onClick={() => setShowChatDialog(true)}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Chat con Pasajero
                            </Button>
                            <Button
                              variant="destructive"
                              className="bg-red-500 hover:bg-red-600 font-medium"
                              onClick={() => handleCancelActiveRide(activeRide.id)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancelar Viaje
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* ESTADÍSTICAS DEL DÍA (TARJETAS RESUMEN) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
                    <CardContent className="p-6 relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-3xl font-bold">{driverStats.todayTrips}</p>
                          <p className="text-blue-100 font-medium">Viajes Hoy</p>
                        </div>
                        <Users className="h-8 w-8 text-blue-200" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
                    <CardContent className="p-6 relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-3xl font-bold">${driverStats.todayEarnings}</p>
                          <p className="text-green-100 font-medium">Ganancias Hoy</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-200" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
                    <CardContent className="p-6 relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-3xl font-bold">{driverStats.todayHours.toFixed(1)}h</p>
                          <p className="text-orange-100 font-medium">Horas Hoy</p>
                        </div>
                        <Clock className="h-8 w-8 text-orange-200" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-500 to-yellow-600 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
                    <CardContent className="p-6 relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-3xl font-bold">{driverStats.rating.toFixed(1)}</p>
                          <p className="text-yellow-100 font-medium">Rating</p>
                        </div>
                        <Star className="h-8 w-8 text-yellow-200" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* BARRA LATERAL MEJORADA: ESTADO, GANANCIAS Y RESUMEN */}
              <div className="space-y-6">
                {/* TARJETA DE ESTADO MEJORADA: DISPONIBILIDAD Y NÚMERO DE VIAJES */}
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-t-lg py-2 px-3">
                    <CardTitle className="flex items-center space-x-2 text-sm">
                      <Activity className="h-4 w-4" />
                      <span className="text-sm">Estado del Conductor</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <span className="font-medium text-slate-700">Disponibilidad</span>
                      <Badge
                        variant={isOnline ? "default" : "secondary"}
                        className={isOnline ? "bg-green-500 hover:bg-green-600" : ""}
                      >
                        {isOnline ? "En línea" : "Desconectado"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <span className="font-medium text-slate-700">Viajes Totales</span>
                      <Badge variant="outline" className="border-slate-300 text-slate-700 font-semibold">
                        {driverStats.totalTrips}
                      </Badge>
                    </div>
                    {!isOnline && (
                      <Button
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 font-medium"
                        onClick={() => updateOnlineStatus(true)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Conectarse
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* RESUMEN DE GANANCIAS MEJORADO: HOY, SEMANA, MES */}
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-t-lg py-2 px-3">
                    <CardTitle className="flex items-center space-x-2 text-sm">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm">Resumen de Ganancias</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-green-700 font-medium">Hoy</span>
                      <span className="font-bold text-green-800 text-lg">${driverStats.todayEarnings}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-blue-700 font-medium">Esta semana</span>
                      <span className="font-bold text-blue-800 text-lg">${driverStats.weeklyEarnings}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-purple-700 font-medium">Este mes</span>
                      <span className="font-bold text-purple-800 text-lg">${driverStats.monthlyEarnings}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="requests" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Solicitudes de Viaje</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isOnline && pendingRides.length > 0 ? (
                  <div className="space-y-6">
                    {pendingRides.map((ride) => (
                      <Card key={ride.id} className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                        <CardContent className="p-6">
                          <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                              <div className="flex items-center space-x-4">
                                <Avatar className="h-16 w-16 ring-2 ring-blue-200">
                                  <AvatarImage src="/placeholder.svg?height=64&width=64" />
                                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xl font-bold">
                                    {ride.passenger_name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-bold text-lg text-gray-800">{ride.passenger_name}</h3>
                                  <div className="flex items-center space-x-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm font-medium">4.8</span>
                                  </div>
                                </div>
                              </div>
                              <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 text-lg font-bold">
                                ${ride.estimated_fare}
                              </Badge>
                            </div>
                            <div className="space-y-3 bg-white/60 p-4 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="p-1 bg-green-500 rounded-full">
                                  <MapPin className="h-4 w-4 text-white" />
                                </div>
                                <span className="text-sm font-medium">Recogida: {ride.pickup_address}</span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="p-1 bg-red-500 rounded-full">
                                  <Navigation className="h-4 w-4 text-white" />
                                </div>
                                <span className="text-sm font-medium">Destino: {ride.destination_address}</span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="p-1 bg-blue-500 rounded-full">
                                  <Clock className="h-4 w-4 text-white" />
                                </div>
                                <span className="text-sm font-medium">{ride.estimated_duration} min</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <Button
                                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 font-semibold py-3"
                                onClick={() => handleAcceptRide(ride.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Aceptar Viaje
                              </Button>
                              <Button
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50 font-semibold py-3 bg-transparent"
                                onClick={() => handleRejectRide(ride.id)}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Rechazar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                      <Car className="h-12 w-12 text-blue-600" />
                    </div>
                    <p className="text-xl font-bold text-gray-700 mb-2">
                      {isOnline ? "No hay solicitudes disponibles" : "Conéctate para recibir solicitudes"}
                    </p>
                    <p className="text-gray-500 text-lg">
                      {isOnline ? "Te notificaremos cuando haya viajes disponibles" : "Activa tu estado en línea"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="trips" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <CardTitle className="flex items-center space-x-2">
                  <Car className="h-5 w-5" />
                  <span>Viajes Recientes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {recentTrips.length > 0 ? (
                  <div className="space-y-6">
                    {recentTrips.map((trip) => (
                      <div
                        key={trip.id}
                        className="border-0 bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-xl shadow-md"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                          <div className="flex-1 w-full">
                            <div className="flex items-center space-x-3 mb-3">
                              <Avatar className="h-12 w-12">
                                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold">
                                  {trip.passenger_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-bold text-lg text-gray-800">{trip.passenger_name}</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(trip.completed_at).toLocaleDateString()} - {trip.estimated_duration} min
                                </p>
                              </div>
                            </div>
                            <div className="bg-white/60 p-3 rounded-lg mb-3">
                              <p className="text-sm text-gray-700 font-medium">
                                {trip.pickup_address} → {trip.destination_address}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < (trip.passenger_rating || 0)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 text-lg font-bold mt-4 sm:mt-0">
                            ${trip.actual_fare || trip.estimated_fare}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                      <Calendar className="h-12 w-12 text-purple-600" />
                    </div>
                    <p className="text-xl font-bold text-gray-700 mb-2">No hay viajes recientes</p>
                    <p className="text-gray-500 text-lg">Tus viajes completados aparecerán aquí</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="earnings" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-6 w-6" />
                    <span>Ganancias Diarias</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-4xl font-bold mb-2">${driverStats.todayEarnings}</p>
                  <p className="text-green-100 font-medium">{driverStats.todayTrips} viajes completados</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-6 w-6" />
                    <span>Ganancias Semanales</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-4xl font-bold mb-2">${driverStats.weeklyEarnings}</p>
                  <p className="text-blue-100 font-medium">Últimos 7 días</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-6 w-6" />
                    <span>Ganancias Mensuales</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-4xl font-bold mb-2">${driverStats.monthlyEarnings}</p>
                  <p className="text-purple-100 font-medium">Últimos 30 días</p>
                </CardContent>
              </Card>
            </div>
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-slate-600 to-slate-700 text-white">
                <CardTitle>Estadísticas Generales</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                      <span className="text-gray-700 font-medium">Total de viajes:</span>
                      <span className="font-bold text-xl text-slate-700">{driverStats.totalTrips}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                      <span className="text-gray-700 font-medium">Rating promedio:</span>
                      <div className="flex items-center space-x-2">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-xl text-yellow-600">{driverStats.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                      <span className="text-gray-700 font-medium">Horas trabajadas hoy:</span>
                      <span className="font-bold text-xl text-blue-600">{driverStats.todayHours.toFixed(1)}h</span>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                      <span className="text-gray-700 font-medium">Ganancia promedio por viaje:</span>
                      <span className="font-bold text-xl text-green-600">
                        $
                        {driverStats.totalTrips > 0
                          ? (
                              (driverStats.todayEarnings + driverStats.weeklyEarnings + driverStats.monthlyEarnings) /
                              driverStats.totalTrips
                            ).toFixed(0)
                          : 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                      <span className="text-gray-700 font-medium">Estado:</span>
                      <Badge
                        variant={isOnline ? "default" : "secondary"}
                        className={`px-4 py-2 text-sm font-semibold ${isOnline ? "bg-green-500 hover:bg-green-600" : ""}`}
                      >
                        {isOnline ? "En línea" : "Desconectado"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

  {/* DIÁLOGO DE CHAT: VENTANA PARA COMUNICACIÓN ENTRE CONDUCTOR Y PASAJERO */}
      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent className="sm:max-w-lg border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Chat con Pasajero</DialogTitle>
          </DialogHeader>
          {activeRide && (
            <RideChat
              rideId={activeRide.id}
              driverId={activeRide.driver_id}
              driverName={activeRide.driver_name}
              passengerId={activeRide.passenger_id}
              passengerName={activeRide.passenger_name}
              onClose={() => setShowChatDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

  {/* DIÁLOGO DE CALIFICACIÓN MEJORADO: PIDE RATING Y COMENTARIO AL CONDUCTOR */}
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
              <Button
                variant="outline"
                className="font-semibold bg-transparent"
                onClick={handleSkipPassengerRating}
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

export default function DriverDashboard() {
  return (
    <ProtectedRoute requiredUserType="driver">
      <DriverDashboardContent />
    </ProtectedRoute>
  )
}