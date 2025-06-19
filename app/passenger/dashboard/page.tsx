"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, Car, Clock, DollarSign, Navigation } from "lucide-react"
import { useRealTimeRides } from "@/hooks/useRealTimeRides"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { MapComponent } from "@/components/MapComponent"
import { AddressAutocomplete } from "@/components/AddressAutocomplete"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { RideTracker } from "@/components/RideTracker"

function PassengerDashboardContent() {
  const { user, userData } = useAuth()
  const [pickup, setPickup] = useState("")
  const [destination, setDestination] = useState("")
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [rideStatus, setRideStatus] = useState("idle")
  const { rides, loading } = useRealTimeRides(undefined, user?.uid)
  const currentRide = rides.find((ride) => ["pending", "accepted", "in-progress"].includes(ride.status))

  const handleRequestRide = async () => {
    if (!pickup || !destination || !pickupCoords || !destinationCoords || !user || !userData) return

    setRideStatus("searching")

    try {
      const { data, error } = await supabase
        .from("rides")
        .insert({
          passenger_id: user.uid,
          passenger_name: userData.name,
          pickup_address: pickup,
          pickup_coordinates: [pickupCoords.lng, pickupCoords.lat],
          destination_address: destination,
          destination_coordinates: [destinationCoords.lng, destinationCoords.lat],
          status: "pending",
          estimated_fare: calculateEstimatedFare(pickupCoords, destinationCoords),
          estimated_duration: calculateEstimatedDuration(pickupCoords, destinationCoords),
        })
        .select()

      if (error) {
        console.error("Error creating ride:", error)
        setRideStatus("idle")
        return
      }

      console.log("Ride created:", data)
    } catch (error) {
      console.error("Error requesting ride:", error)
      setRideStatus("idle")
    }
  }

  const calculateEstimatedFare = (pickup: { lat: number; lng: number }, destination: { lat: number; lng: number }) => {
    const distance = calculateDistance(pickup.lat, pickup.lng, destination.lat, destination.lng)
    const baseFare = 50
    const perKmRate = 12
    return Math.round(baseFare + distance * perKmRate)
  }

  const calculateEstimatedDuration = (
    pickup: { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ) => {
    const distance = calculateDistance(pickup.lat, pickup.lng, destination.lat, destination.lng)
    const avgSpeed = 25
    return Math.round((distance / avgSpeed) * 60)
  }

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

  const quickDestinations = [
    { name: "Casa", address: "Tu domicilio", coords: { lat: 19.4326, lng: -99.1332 }, icon: "🏠" },
    { name: "Trabajo", address: "Tu oficina", coords: { lat: 19.4285, lng: -99.1277 }, icon: "🏢" },
    { name: "Aeropuerto", address: "Aeropuerto Internacional", coords: { lat: 19.4363, lng: -99.0721 }, icon: "✈️" },
    { name: "Centro", address: "Centro Histórico", coords: { lat: 19.4326, lng: -99.1332 }, icon: "🏛️" },
  ]

  const recentTrips = [
    {
      id: 1,
      from: "Centro Comercial Santa Fe",
      to: "Polanco",
      date: "Hoy, 2:30 PM",
      cost: "$180",
      driver: "Ana García",
      rating: 5,
      status: "completed",
    },
    {
      id: 2,
      from: "Roma Norte",
      to: "Aeropuerto",
      date: "Ayer, 6:00 AM",
      cost: "$350",
      driver: "Miguel Torres",
      rating: 4,
      status: "completed",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                ¡Hola, {userData?.name?.split(" ")[0] || "Usuario"}! 👋
              </h1>
              <p className="text-gray-600 mt-1">¿A dónde quieres ir hoy?</p>
            </div>
            
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map Component */}
            <Card className="overflow-hidden shadow-lg">
              <CardContent className="p-0">
                <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <h3 className="font-semibold flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Mapa
                  </h3>
                </div>
                <MapComponent
                  userType="passenger"
                  pickupLocation={pickupCoords}
                  destinationLocation={destinationCoords}
                  onLocationSelect={({lat, lng, address}) => {
                    // Si no hay punto de recogida seleccionado, establecerlo
                    if (!pickupCoords) {
                      setPickupCoords({lat, lng});
                      setPickup(address);
                    } 
                    // Si ya hay punto de recogida pero no destino, establecer destino
                    else if (!destinationCoords) {
                      setDestinationCoords({lat, lng});
                      setDestination(address);
                    }
                  }}
                />
              </CardContent>
            </Card>

            {/* Current Ride Status */}
            {currentRide && (
              <RideTracker
                ride={currentRide}
                userType="passenger"
                onStatusUpdate={(rideId, status) => {
                  console.log("Ride status updated:", rideId, status)
                }}
              />
            )}

            {/* Recent Trips */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-gray-600" />
                  <span>Viajes Recientes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Navigation className="h-4 w-4 text-gray-400" />
                        <p className="font-medium text-gray-900">
                          {trip.from} → {trip.to}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600">
                        {trip.date} • {trip.driver}
                      </p>
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
                    <div className="text-right">
                      <Badge variant="secondary" className="mb-2">
                        {trip.cost}
                      </Badge>
                      <p className="text-xs text-green-600 font-medium">Completado</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Request Ride Form */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardTitle>Solicitar Viaje</CardTitle>
                <CardDescription className="text-blue-100">Ingresa tu destino y encuentra un conductor</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pickup" className="text-sm font-medium">
                    Punto de Recogida
                  </Label>
                  <AddressAutocomplete
                    placeholder="Tu ubicación actual"
                    value={pickup}
                    onChange={setPickup}
                    onAddressSelect={(address, coords) => {
                      setPickup(address)
                      setPickupCoords(coords)
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination" className="text-sm font-medium">
                    Destino
                  </Label>
                  <AddressAutocomplete
                    placeholder="¿A dónde vas?"
                    value={destination}
                    onChange={setDestination}
                    onAddressSelect={(address, coords) => {
                      setDestination(address)
                      setDestinationCoords(coords)
                    }}
                  />
                </div>

                {/* Trip Summary */}
                {pickupCoords && destinationCoords && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-gray-900 mb-3">Resumen del Viaje</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Distancia:</span>
                        <span className="font-medium">
                          {calculateDistance(
                            pickupCoords.lat,
                            pickupCoords.lng,
                            destinationCoords.lat,
                            destinationCoords.lng,
                          ).toFixed(1)}{" "}
                          km
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tiempo estimado:</span>
                        <span className="font-medium">
                          {calculateEstimatedDuration(pickupCoords, destinationCoords)} min
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                        <span className="text-gray-600">Tarifa estimada:</span>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-bold text-green-600 text-lg">
                            {calculateEstimatedFare(pickupCoords, destinationCoords)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                  onClick={handleRequestRide}
                  disabled={!pickup || !destination || !pickupCoords || !destinationCoords || rideStatus !== "idle"}
                >
                  {rideStatus === "idle" ? (
                    <>
                      <Car className="mr-2 h-5 w-5" />
                      Solicitar Viaje
                    </>
                  ) : (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Buscando...
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Destinations */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Destinos Rápidos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickDestinations.map((dest, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start h-auto p-4 hover:bg-blue-50 hover:border-blue-200"
                    onClick={() => {
                      setDestination(dest.address)
                      setDestinationCoords(dest.coords)
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{dest.icon}</span>
                      <div className="text-left">
                        <p className="font-medium">{dest.name}</p>
                        <p className="text-sm text-gray-500">{dest.address}</p>
                      </div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* User Stats */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Tu Actividad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">24</p>
                    <p className="text-sm text-gray-600">Viajes</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">4.9</p>
                    <p className="text-sm text-gray-600">Rating</p>
                  </div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">$2,450</p>
                  <p className="text-sm text-gray-600">Total gastado</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
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
