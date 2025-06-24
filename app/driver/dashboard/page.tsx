"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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
} from "lucide-react"
import { useRealTimeRides } from "@/hooks/useRealTimeRides"
import { useDriverStatus } from "@/hooks/useDriverStatus"
import { supabase } from "@/lib/supabase"
import { MapComponent } from "@/components/MapComponent"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { RideTracker } from "@/components/RideTracker"
import { RealtimeStatus } from "@/components/RealtimeStatus"
import { useToast } from "@/hooks/use-toast"
import { RideChat } from "@/components/RideChat"

function DriverDashboardContent() {
  const { user } = useAuth()
  const { toast } = useToast()
  const driverId = user?.uid || "current-driver-id"
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
  const [passengerRating, setPassengerRating] = useState(0)
  const [ratingComment, setRatingComment] = useState("")
  const [showChatDialog, setShowChatDialog] = useState(false)

  const pendingRides = rides.filter((ride) => ride.status === "pending")
  const activeRide = rides.find(
    (ride) => ride.driver_id === driverId && ["accepted", "in-progress"].includes(ride.status),
  )

  // Load driver statistics
  useEffect(() => {
    const loadDriverStats = async () => {
      if (!supabase || !driverId) return

      try {
        // Get driver info (only rating, we'll calculate total_trips from rides)
        const { data: driverData } = await supabase.from("drivers").select("rating").eq("uid", driverId).single()

        // Get ALL completed rides for this driver (not just recent ones)
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

          // Calculate total earnings from all completed rides
          // const totalEarnings = allCompletedRides.reduce(
          //   (sum, ride) => sum + (ride.actual_fare || ride.estimated_fare),
          //   0,
          // )

          setDriverStats({
            todayTrips: todayRides.length,
            todayEarnings: todayRides.reduce((sum, ride) => sum + (ride.actual_fare || ride.estimated_fare), 0),
            todayHours: todayRides.length * 0.5, // Estimate 30 min per ride
            weeklyEarnings: weeklyRides.reduce((sum, ride) => sum + (ride.actual_fare || ride.estimated_fare), 0),
            monthlyEarnings: monthlyRides.reduce((sum, ride) => sum + (ride.actual_fare || ride.estimated_fare), 0),
            totalTrips: allCompletedRides.length, // Calculate from actual completed rides
            rating: driverData?.rating || 0,
          })

          // Update the drivers table with the correct total_trips count
          await supabase
            .from("drivers")
            .update({
              total_trips: allCompletedRides.length,
            })
            .eq("uid", driverId)
        } else {
          // No completed rides found
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

        // Get recent trips for display
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

  // Check for completed rides to show rating dialog
  useEffect(() => {
    const completedRide = rides.find(
      (ride) => ride.status === "completed" && ride.driver_id === driverId && !ride.driver_rating,
    )

    if (completedRide) {
      setCompletedRide(completedRide)
      setShowRatingDialog(true)
    }
  }, [rides, driverId])

  const handleAcceptRide = async (rideId: string) => {
    try {
      // Get driver name
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

      const statusMessages = {
        "in-progress": "Viaje iniciado",
        completed: "Viaje completado",
      }

      toast({
        title: "Estado Actualizado",
        description: statusMessages[status] || `Estado cambiado a ${status}`,
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

  const handleRatePassenger = async () => {
    if (!completedRide || passengerRating === 0) return

    try {
      // 1. Guardar la calificación del conductor al pasajero
      const { error } = await supabase
        .from("rides")
        .update({
          driver_rating: passengerRating,
        })
        .eq("id", completedRide.id)

      if (error) {
        console.error("Error rating passenger:", error)
        return
      }

      // 2. Recalcular rating promedio del pasajero
      const { data: passengerRides } = await supabase
        .from("rides")
        .select("driver_rating")
        .eq("passenger_id", completedRide.passenger_id)
        .not("driver_rating", "is", null)

      if (passengerRides && passengerRides.length > 0) {
        const avgRating =
          passengerRides.reduce((sum, ride) => sum + (ride.driver_rating ?? 0), 0) / passengerRides.length

        await supabase.from("passengers").update({ rating: avgRating }).eq("uid", completedRide.passenger_id)
      }

      // 3. Cerrar diálogo y resetear estado
      setShowRatingDialog(false)
      setPassengerRating(0)
      setRatingComment("")
      setCompletedRide(null)

      toast({
        title: "Calificación Enviada",
        description: "Has calificado al pasajero exitosamente",
      })

      console.log("Passenger rated successfully")
    } catch (err) {
      console.error("Error submitting passenger rating:", err)
      toast({
        title: "Error",
        description: "No se pudo enviar la calificación",
        variant: "destructive",
      })
    }
  }

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

  // Convert pending rides to map format
  const rideLocations = pendingRides.map((ride) => ({
    id: ride.id,
    lat: ride.pickup_coordinates[1],
    lng: ride.pickup_coordinates[0],
    name: ride.passenger_name,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">SafeRide</span>
              <Badge variant="secondary">Conductor</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <RealtimeStatus lastUpdate={lastUpdate} onRefresh={refreshRides} isLoading={ridesLoading} />
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Estado:</span>
                <Switch checked={isOnline} onCheckedChange={updateOnlineStatus} disabled={statusLoading} />
                <span className={`text-sm font-medium ${isOnline ? "text-green-600" : "text-gray-600"}`}>
                  {isOnline ? "En línea" : "Desconectado"}
                </span>
              </div>
              <Avatar>
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback>CM</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="requests">Solicitudes</TabsTrigger>
            <TabsTrigger value="trips">Viajes</TabsTrigger>
            <TabsTrigger value="earnings">Ganancias</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Map Component */}
                <Card>
                  <CardContent className="p-0">
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Mapa:</strong> Ubicaciones de clientes
                      </p>
                    </div>
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

                {/* Active Ride */}
                {activeRide && (
                  <div className="space-y-4">
                    <RideTracker ride={activeRide} userType="driver" onStatusUpdate={handleStatusUpdate} />

                    {/* Chat and Cancel Options for In-Progress Rides */}
                    {activeRide.status === "in-progress" && (
                      <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-orange-800">Viaje en Progreso</h4>
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                              En camino
                            </Badge>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" className="flex-1" onClick={() => setShowChatDialog(true)}>
                              💬 Chat con Pasajero
                            </Button>
                            <Button
                              variant="destructive"
                              className="flex-1"
                              onClick={() => handleCancelActiveRide(activeRide.id)}
                            >
                              ❌ Cancelar Viaje
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Today's Stats */}
                <div className="grid md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-2xl font-bold">{driverStats.todayTrips}</p>
                          <p className="text-sm text-gray-600">Viajes Hoy</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-2xl font-bold">${driverStats.todayEarnings}</p>
                          <p className="text-sm text-gray-600">Ganancias Hoy</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="text-2xl font-bold">{driverStats.todayHours.toFixed(1)}h</p>
                          <p className="text-sm text-gray-600">Horas Hoy</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Star className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="text-2xl font-bold">{driverStats.rating.toFixed(1)}</p>
                          <p className="text-sm text-gray-600">Rating</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Status Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Estado del Conductor</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Disponibilidad</span>
                      <Badge variant={isOnline ? "default" : "secondary"}>
                        {isOnline ? "En línea" : "Desconectado"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Viajes Totales</span>
                      <Badge variant="outline">{driverStats.totalTrips}</Badge>
                    </div>
                    {!isOnline && (
                      <Button className="w-full" onClick={() => updateOnlineStatus(true)}>
                        Conectarse
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Earnings Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>Resumen de Ganancias</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hoy</span>
                      <span className="font-semibold">${driverStats.todayEarnings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Esta semana</span>
                      <span className="font-semibold">${driverStats.weeklyEarnings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Este mes</span>
                      <span className="font-semibold">${driverStats.monthlyEarnings}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Solicitudes de Viaje</CardTitle>
              </CardHeader>
              <CardContent>
                {isOnline && pendingRides.length > 0 ? (
                  <div className="space-y-4">
                    {pendingRides.map((ride) => (
                      <Card key={ride.id} className="border-blue-200 bg-blue-50">
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src="/placeholder.svg?height=48&width=48" />
                                  <AvatarFallback>{ride.passenger_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-semibold">{ride.passenger_name}</h3>
                                  <div className="flex items-center space-x-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm">4.8</span>
                                  </div>
                                </div>
                              </div>
                              <Badge className="bg-green-600">${ride.estimated_fare}</Badge>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-green-600" />
                                <span className="text-sm">Recogida: {ride.pickup_address}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Navigation className="h-4 w-4 text-red-600" />
                                <span className="text-sm">Destino: {ride.destination_address}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span className="text-sm">{ride.estimated_duration} min</span>
                              </div>
                            </div>

                            <div className="flex space-x-2">
                              <Button
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => handleAcceptRide(ride.id)}
                              >
                                Aceptar Viaje
                              </Button>
                              <Button variant="outline" className="flex-1" onClick={() => handleRejectRide(ride.id)}>
                                Rechazar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-600">
                      {isOnline ? "No hay solicitudes disponibles" : "Conéctate para recibir solicitudes"}
                    </p>
                    <p className="text-gray-500">
                      {isOnline ? "Te notificaremos cuando haya viajes disponibles" : "Activa tu estado en línea"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trips" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Viajes Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {recentTrips.length > 0 ? (
                  <div className="space-y-4">
                    {recentTrips.map((trip) => (
                      <div key={trip.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{trip.passenger_name}</p>
                            <p className="text-sm text-gray-600">
                              {trip.pickup_address} → {trip.destination_address}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(trip.completed_at).toLocaleDateString()} - {trip.estimated_duration} min
                            </p>
                            <div className="flex items-center space-x-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < (trip.passenger_rating || 0)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <Badge variant="secondary">${trip.actual_fare || trip.estimated_fare}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-600">No hay viajes recientes</p>
                    <p className="text-gray-500">Tus viajes completados aparecerán aquí</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span>Ganancias Diarias</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">${driverStats.todayEarnings}</p>
                  <p className="text-sm text-gray-600">{driverStats.todayTrips} viajes completados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span>Ganancias Semanales</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600">${driverStats.weeklyEarnings}</p>
                  <p className="text-sm text-gray-600">Últimos 7 días</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span>Ganancias Mensuales</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-600">${driverStats.monthlyEarnings}</p>
                  <p className="text-sm text-gray-600">Últimos 30 días</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Estadísticas Generales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total de viajes:</span>
                      <span className="font-semibold">{driverStats.totalTrips}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rating promedio:</span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{driverStats.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Horas trabajadas hoy:</span>
                      <span className="font-semibold">{driverStats.todayHours.toFixed(1)}h</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ganancia promedio por viaje:</span>
                      <span className="font-semibold">
                        $
                        {driverStats.totalTrips > 0
                          ? (
                              (driverStats.todayEarnings + driverStats.weeklyEarnings + driverStats.monthlyEarnings) /
                              driverStats.totalTrips
                            ).toFixed(0)
                          : 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estado:</span>
                      <Badge variant={isOnline ? "default" : "secondary"}>
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

      {/* Chat Dialog */}
      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Chat con Pasajero</DialogTitle>
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

      {/* Rating Dialog for Driver to Rate Passenger */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Califica al pasajero</DialogTitle>
            <DialogDescription>
              Ayuda a otros conductores compartiendo tu experiencia con este pasajero
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <Avatar className="h-16 w-16 mx-auto mb-2">
                <AvatarFallback>{completedRide?.passenger_name?.charAt(0) || "P"}</AvatarFallback>
              </Avatar>
              <p className="font-medium">{completedRide?.passenger_name}</p>
              <p className="text-sm text-gray-600">¿Cómo fue tu experiencia con este pasajero?</p>
            </div>

            <div className="flex justify-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setPassengerRating(star)} className="p-1">
                  <Star
                    className={`h-8 w-8 ${star <= passengerRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                  />
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating-comment">Comentario (opcional)</Label>
              <Textarea
                id="rating-comment"
                placeholder="Comparte tu experiencia..."
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex space-x-2">
              <Button className="flex-1" onClick={handleRatePassenger} disabled={passengerRating === 0}>
                Enviar Calificación
              </Button>
              <Button variant="outline" onClick={() => setShowRatingDialog(false)}>
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
