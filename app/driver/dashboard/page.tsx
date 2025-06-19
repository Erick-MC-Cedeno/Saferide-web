"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { MapPin, Navigation, Clock, Star, Shield, DollarSign, TrendingUp, Users, Car } from "lucide-react"
import { useRealTimeRides } from "@/hooks/useRealTimeRides"
import { useDriverStatus } from "@/hooks/useDriverStatus"
import { supabase } from "@/lib/supabase"
import { MapComponent } from "@/components/MapComponent"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/ProtectedRoute"

function DriverDashboardContent() {
  const { user } = useAuth()
  const driverId = user?.uid || "current-driver-id"
  const { isOnline, loading: statusLoading, updateOnlineStatus } = useDriverStatus(driverId)
  const { rides, loading: ridesLoading } = useRealTimeRides(driverId)

  const pendingRides = rides.filter((ride) => ride.status === "pending")
  const activeRide = rides.find(
    (ride) => ride.driver_id === driverId && ["accepted", "in-progress"].includes(ride.status),
  )

  const todayStats = {
    trips: 8,
    earnings: "$1,240",
    hours: "6.5h",
    rating: 4.9,
  }

  const recentTrips = [
    {
      id: 1,
      passenger: "Ana Martínez",
      from: "Polanco",
      to: "Roma Norte",
      earnings: "$85",
      time: "15 min",
      rating: 5,
    },
    {
      id: 2,
      passenger: "Roberto Silva",
      from: "Condesa",
      to: "Santa Fe",
      earnings: "$180",
      time: "28 min",
      rating: 4,
    },
  ]

  const handleAcceptRide = async (rideId: string) => {
    try {
      const { error } = await supabase
        .from("rides")
        .update({
          driver_id: driverId,
          driver_name: "Carlos Mendoza", // Reemplazar con nombre real
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", rideId)
        .eq("status", "pending")

      if (error) {
        console.error("Error accepting ride:", error)
        return
      }

      console.log("Ride accepted successfully")
    } catch (error) {
      console.error("Error accepting ride:", error)
    }
  }

  const handleRejectRide = async (rideId: string) => {
    console.log("Ride rejected:", rideId)
  }

  // Convertir rides pendientes a formato para el mapa
  const rideLocations = pendingRides.map((ride) => ({
    id: ride.id,
    lat: ride.pickup_coordinates[1], // Geoapify usa [lng, lat]
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
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map Component */}
            <Card>
              <CardContent className="p-0">
                {/* Add this note above the map */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Mapa:</strong> de clientes
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

            {/* Ride Requests */}
            {isOnline && pendingRides.length > 0 && (
              <div className="space-y-4">
                {pendingRides.slice(0, 3).map((ride) => (
                  <Card key={ride.id} className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Nueva Solicitud de Viaje</span>
                        <Badge className="bg-green-600">${ride.estimated_fare}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src="/placeholder.svg?height=48&width=48" />
                            <AvatarFallback>{ride.passenger_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold">{ride.passenger_name}</h3>
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">4.8</span>
                            </div>
                          </div>
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
            )}

            {isOnline && pendingRides.length === 0 && (
              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-600">Esperando solicitudes...</p>
                    <p className="text-gray-500">Te notificaremos cuando haya viajes disponibles</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">{todayStats.trips}</p>
                      <p className="text-sm text-gray-600">Viajes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">{todayStats.earnings}</p>
                      <p className="text-sm text-gray-600">Ganancias</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-2xl font-bold">{todayStats.hours}</p>
                      <p className="text-sm text-gray-600">Horas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-2xl font-bold">{todayStats.rating}</p>
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
                  <Badge variant={isOnline ? "default" : "secondary"}>{isOnline ? "En línea" : "Desconectado"}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Vehículo</span>
                  <Badge variant="outline">Toyota Corolla</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Placa</span>
                  <Badge variant="outline">ABC-123</Badge>
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
                  <span className="font-semibold">$1,240</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Esta semana</span>
                  <span className="font-semibold">$6,850</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Este mes</span>
                  <span className="font-semibold">$28,400</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Trips */}
            <Card>
              <CardHeader>
                <CardTitle>Viajes Recientes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentTrips.map((trip) => (
                  <div key={trip.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{trip.passenger}</p>
                        <p className="text-sm text-gray-600">
                          {trip.from} → {trip.to}
                        </p>
                        <p className="text-sm text-gray-600">{trip.time}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < trip.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <Badge variant="secondary">{trip.earnings}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
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
