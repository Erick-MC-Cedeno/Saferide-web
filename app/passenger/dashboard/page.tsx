"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Star, Car, Clock, DollarSign, Navigation, Calendar } from "lucide-react"
import { useRealTimeRides } from "@/hooks/useRealTimeRides"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { MapComponent } from "@/components/MapComponent"
import { AddressAutocomplete } from "@/components/AddressAutocomplete"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { RideTracker } from "@/components/RideTracker"
import { ScrollArea } from "@/components/ui/scroll-area"

function PassengerDashboardContent() {
  const { user, userData } = useAuth()
  const [pickup, setPickup] = useState("")
  const [destination, setDestination] = useState("")
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [rideStatus, setRideStatus] = useState("idle")
  const [availableDrivers, setAvailableDrivers] = useState([])
  const [selectedDriver, setSelectedDriver] = useState("")
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

  const { rides, loading } = useRealTimeRides(undefined, user?.uid)
  const currentRide = rides.find((ride) => ["pending", "accepted", "in-progress"].includes(ride.status))

  // Load passenger statistics and recent trips
  useEffect(() => {
    const loadPassengerData = async () => {
      if (!supabase || !user?.uid) return

      try {
        // Get passenger stats
        const { data: passengerData } = await supabase
          .from("passengers")
          .select("total_trips, rating")
          .eq("uid", user.uid)
          .single()

        // Get completed rides for spending calculation
        const { data: completedRides } = await supabase
          .from("rides")
          .select("*")
          .eq("passenger_id", user.uid)
          .eq("status", "completed")
          .order("completed_at", { ascending: false })

        if (completedRides) {
          const totalSpent = completedRides.reduce((sum, ride) => sum + (ride.actual_fare || ride.estimated_fare), 0)

          // Calculate average rating from driver ratings
          const ratedRides = completedRides.filter((ride) => ride.driver_rating !== null)
          const averageRating =
            ratedRides.length > 0
              ? ratedRides.reduce((sum, ride) => sum + (ride.driver_rating || 0), 0) / ratedRides.length
              : 0

          setPassengerStats({
            totalTrips: completedRides.length, // Use actual completed rides count
            totalSpent,
            averageRating,
          })

          setRecentTrips(completedRides.slice(0, 5))
        }
      } catch (error) {
        console.error("Error loading passenger data:", error)
      }
    }

    loadPassengerData()
  }, [user?.uid])

  // Load available drivers when coordinates are set
  useEffect(() => {
    const loadAvailableDrivers = async () => {
      if (!supabase || !pickupCoords) return

      try {
        const { data: drivers } = await supabase
          .from("drivers")
          .select("uid, name, rating, vehicle_model, vehicle_plate, is_online")
          .eq("is_online", true)
          .eq("is_verified", true)

        setAvailableDrivers(drivers || [])
      } catch (error) {
        console.error("Error loading drivers:", error)
      }
    }

    if (pickupCoords && destinationCoords) {
      loadAvailableDrivers()
    }
  }, [pickupCoords, destinationCoords])

  // Check for completed rides to show rating dialog
  useEffect(() => {
    const completedRide = rides.find(
      (ride) => ride.status === "completed" && ride.passenger_id === user?.uid && !ride.passenger_rating,
    )

    if (completedRide) {
      setCompletedRide(completedRide)
      setShowRatingDialog(true)
    }
  }, [rides, user?.uid])

  const handleRequestRide = async () => {
    if (!pickup || !destination || !pickupCoords || !destinationCoords || !user || !userData) return

    if (availableDrivers.length > 0 && !selectedDriver) {
      setShowDriverSelection(true)
      return
    }

    setRideStatus("searching")

    try {
      const rideData = {
        passenger_id: user.uid,
        passenger_name: userData.name,
        pickup_address: pickup,
        pickup_coordinates: [pickupCoords.lng, pickupCoords.lat],
        destination_address: destination,
        destination_coordinates: [destinationCoords.lng, destinationCoords.lat],
        status: "pending",
        estimated_fare: calculateEstimatedFare(pickupCoords, destinationCoords),
        estimated_duration: calculateEstimatedDuration(pickupCoords, destinationCoords),
      }

      // If specific driver selected, assign directly
      if (selectedDriver) {
        const driver = availableDrivers.find((d) => d.uid === selectedDriver)
        rideData.driver_id = selectedDriver
        rideData.driver_name = driver?.name
        rideData.status = "accepted"
        rideData.accepted_at = new Date().toISOString()
      }

      const { data, error } = await supabase.from("rides").insert(rideData).select()

      if (error) {
        console.error("Error creating ride:", error)
        setRideStatus("idle")
        return
      }

      console.log("Ride created:", data)
      setShowDriverSelection(false)
      setSelectedDriver("")
    } catch (error) {
      console.error("Error requesting ride:", error)
      setRideStatus("idle")
    }
  }

  const handleRateDriver = async () => {
    if (!completedRide || rating === 0) return

    try {
      // 1. Guardar sólo la calificación
      const { error } = await supabase
        .from("rides")
        .update({
          passenger_rating: rating,
        })
        .eq("id", completedRide.id)

      if (error) {
        console.error("Error rating driver:", error)
        return
      }

      // 2. Recalcular rating promedio del conductor
      const { data: driverRides } = await supabase
        .from("rides")
        .select("passenger_rating")
        .eq("driver_id", completedRide.driver_id)
        .not("passenger_rating", "is", null)

      if (driverRides) {
        const avgRating = driverRides.reduce((sum, ride) => sum + (ride.passenger_rating ?? 0), 0) / driverRides.length

        await supabase.from("drivers").update({ rating: avgRating }).eq("uid", completedRide.driver_id)
      }

      // 3. Cerrar diálogo y resetear estado
      setShowRatingDialog(false)
      setRating(0)
      setComment("")
      setCompletedRide(null)
    } catch (err) {
      console.error("Error submitting rating:", err)
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
                  onLocationSelect={({ lat, lng, address }) => {
                    if (!pickupCoords) {
                      setPickupCoords({ lat, lng })
                      setPickup(address)
                    } else if (!destinationCoords) {
                      setDestinationCoords({ lat, lng })
                      setDestination(address)
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
              <CardContent className="p-0">
                <ScrollArea className="h-80 px-6 py-4">
                  <div className="space-y-4">
                    {recentTrips.length > 0 ? (
                      recentTrips.map((trip) => (
                        <div
                          key={trip.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <Navigation className="h-4 w-4 text-gray-400" />
                              <p className="font-medium text-gray-900">
                                {trip.pickup_address} → {trip.destination_address}
                              </p>
                            </div>
                            <p className="text-sm text-gray-600">
                              {new Date(trip.completed_at).toLocaleDateString()} • {trip.driver_name}
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
                          <div className="text-right">
                            <Badge variant="secondary" className="mb-2">
                              ${trip.actual_fare || trip.estimated_fare}
                            </Badge>
                            <p className="text-xs text-green-600 font-medium">Completado</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-semibold text-gray-600">No hay viajes recientes</p>
                        <p className="text-gray-500">Tus viajes aparecerán aquí</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
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
                    <p className="text-2xl font-bold text-blue-600">{passengerStats.totalTrips}</p>
                    <p className="text-sm text-gray-600">Viajes</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{passengerStats.averageRating.toFixed(1)}</p>
                    <p className="text-sm text-gray-600">Rating</p>
                  </div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">${passengerStats.totalSpent}</p>
                  <p className="text-sm text-gray-600">Total gastado</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Driver Selection Dialog */}
      <Dialog open={showDriverSelection} onOpenChange={setShowDriverSelection}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Seleccionar Conductor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Conductores disponibles en tu área:</p>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un conductor" />
              </SelectTrigger>
              <SelectContent>
                {availableDrivers.map((driver) => (
                  <SelectItem key={driver.uid} value={driver.uid}>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{driver.name}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
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
            <div className="flex space-x-2">
              <Button className="flex-1" onClick={handleRequestRide} disabled={!selectedDriver}>
                Confirmar Selección
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSelectedDriver("")
                  handleRequestRide()
                }}
              >
                Cualquier Conductor
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Califica tu viaje</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <Avatar className="h-16 w-16 mx-auto mb-2">
                <AvatarFallback>{completedRide?.driver_name?.charAt(0) || "D"}</AvatarFallback>
              </Avatar>
              <p className="font-medium">{completedRide?.driver_name}</p>
              <p className="text-sm text-gray-600">¿Cómo fue tu experiencia?</p>
            </div>

            <div className="flex justify-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="p-1">
                  <Star className={`h-8 w-8 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Comentario (opcional)</Label>
              <Textarea
                id="comment"
                placeholder="Comparte tu experiencia..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex space-x-2">
              <Button className="flex-1" onClick={handleRateDriver} disabled={rating === 0}>
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

export default function PassengerDashboard() {
  return (
    <ProtectedRoute requiredUserType="passenger">
      <PassengerDashboardContent />
    </ProtectedRoute>
  )
}
