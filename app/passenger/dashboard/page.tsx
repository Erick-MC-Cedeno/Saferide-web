"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
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
  Zap,
  MessageCircle,
  Edit3,
  Save,
  Plus,
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

function PassengerDashboardContent() {
  const { user, userData } = useAuth()
  const { toast } = useToast()
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
  const [showChatDialog, setShowChatDialog] = useState(false)

  // Quick destinations state
  const [showQuickDestDialog, setShowQuickDestDialog] = useState(false)
  const [editingDestIndex, setEditingDestIndex] = useState<number | null>(null)
  const [quickDestinations, setQuickDestinations] = useState([
    { name: "Casa", address: "Tu domicilio", coords: { lat: 19.4326, lng: -99.1332 }, icon: "🏠" },
    { name: "Trabajo", address: "Tu oficina", coords: { lat: 19.4285, lng: -99.1277 }, icon: "🏢" },
    { name: "Aeropuerto", address: "Aeropuerto Internacional", coords: { lat: 19.4363, lng: -99.0721 }, icon: "✈️" },
    { name: "Centro", address: "Centro Histórico", coords: { lat: 19.4326, lng: -99.1332 }, icon: "🏛️" },
  ])
  const [newDestination, setNewDestination] = useState({
    name: "",
    address: "",
    coords: { lat: 0, lng: 0 },
    icon: "📍",
  })

  const { rides, loading, cancelRide, refreshRides } = useRealTimeRides(undefined, user?.uid)
  const currentRide = rides.find((ride) => ["pending", "accepted", "in-progress"].includes(ride.status))

  // Reset ride status when no current ride
  useEffect(() => {
    if (!currentRide && rideStatus !== "idle") {
      setRideStatus("idle")
    }
  }, [currentRide, rideStatus])

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
            totalTrips: completedRides.length,
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
        toast({
          title: "Error",
          description: "No se pudo crear el viaje. Intenta de nuevo.",
          variant: "destructive",
        })
        return
      }

      console.log("Ride created:", data)
      setShowDriverSelection(false)
      setSelectedDriver("")
      setRideStatus("pending")

      toast({
        title: "Viaje solicitado",
        description: "Tu viaje ha sido solicitado. Esperando confirmación del conductor.",
      })

      // Refresh rides to get the latest data
      refreshRides()
    } catch (error) {
      console.error("Error requesting ride:", error)
      setRideStatus("idle")
      toast({
        title: "Error",
        description: "Ocurrió un error al solicitar el viaje.",
        variant: "destructive",
      })
    }
  }

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

      toast({
        title: "Calificación enviada",
        description: "Gracias por calificar tu viaje.",
      })
    } catch (err) {
      console.error("Error submitting rating:", err)
      toast({
        title: "Error",
        description: "No se pudo enviar la calificación.",
        variant: "destructive",
      })
    }
  }

  const resetRideForm = () => {
    setPickup("")
    setDestination("")
    setPickupCoords(null)
    setDestinationCoords(null)
    setSelectedDriver("")
    setShowDriverSelection(false)
    setRideStatus("idle")
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

  // Quick destinations functions
  const handleQuickDestinationClick = (dest, index) => {
    if (editingDestIndex === index) {
      // If already editing, save the destination
      setDestination(dest.address)
      setDestinationCoords(dest.coords)
      setEditingDestIndex(null)
    } else {
      // If not editing, use the destination
      setDestination(dest.address)
      setDestinationCoords(dest.coords)
    }
  }

  const handleEditDestination = (index) => {
    setEditingDestIndex(index)
    setNewDestination(quickDestinations[index])
    setShowQuickDestDialog(true)
  }

  const handleAddNewDestination = () => {
    setEditingDestIndex(null)
    setNewDestination({
      name: "",
      address: "",
      coords: { lat: 0, lng: 0 },
      icon: "📍",
    })
    setShowQuickDestDialog(true)
  }

  const handleSaveDestination = () => {
    if (!newDestination.name || !newDestination.address) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      })
      return
    }

    const updatedDestinations = [...quickDestinations]

    if (editingDestIndex !== null) {
      // Edit existing destination
      updatedDestinations[editingDestIndex] = newDestination
      toast({
        title: "Destino actualizado",
        description: `${newDestination.name} ha sido actualizado exitosamente`,
      })
    } else {
      // Add new destination
      if (updatedDestinations.length >= 6) {
        toast({
          title: "Límite alcanzado",
          description: "Solo puedes tener máximo 6 destinos rápidos",
          variant: "destructive",
        })
        return
      }
      updatedDestinations.push(newDestination)
      toast({
        title: "Destino agregado",
        description: `${newDestination.name} ha sido agregado a tus destinos rápidos`,
      })
    }

    setQuickDestinations(updatedDestinations)
    setShowQuickDestDialog(false)
    setEditingDestIndex(null)
  }

  const handleDeleteDestination = (index) => {
    const updatedDestinations = quickDestinations.filter((_, i) => i !== index)
    setQuickDestinations(updatedDestinations)
    toast({
      title: "Destino eliminado",
      description: "El destino ha sido eliminado de tus favoritos",
    })
  }

  const availableIcons = ["🏠", "🏢", "✈️", "🏛️", "🏥", "🏫", "🛒", "🍽️", "⛽", "🏋️", "📍", "🎯"]

  const canRequestNewRide = !currentRide && rideStatus === "idle"
  const hasActiveRide = currentRide && ["pending", "accepted", "in-progress"].includes(currentRide.status)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  ¡Hola, {userData?.name?.split(" ")[0] || "Usuario"}! 👋
                </h1>
                <p className="text-gray-600 font-medium">
                  {hasActiveRide ? "Tienes un viaje activo" : "¿A dónde quieres ir hoy?"}
                </p>
              </div>
            </div>
            {hasActiveRide && (
              <Button
                variant="outline"
                onClick={resetRideForm}
                className="flex items-center space-x-2 bg-white/60 border-blue-200 hover:bg-blue-50"
              >
                <X className="h-4 w-4" />
                <span>Nuevo Viaje</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Enhanced Map Component */}
            <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-6 w-6" />
                  <span>Mapa Interactivo</span>
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Selecciona tu ubicación y destino en el mapa
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
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
                      <div className="flex space-x-3">
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
                        <div className="grid grid-cols-2 gap-4">
                          <Button
                            variant="outline"
                            className="bg-white/80 border-orange-300 text-orange-700 hover:bg-orange-100 font-semibold py-3"
                            onClick={() => setShowChatDialog(true)}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Chat con Conductor
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

            {/* Enhanced Recent Trips - Made Larger */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-6 w-6" />
                  <span>Viajes Recientes</span>
                </CardTitle>
                <CardDescription className="text-blue-100">Historial de tus últimos viajes completados</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-96 px-6 py-6">
                  <div className="space-y-6">
                    {recentTrips.length > 0 ? (
                      recentTrips.map((trip) => (
                        <div
                          key={trip.id}
                          className="p-8 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4 mb-4">
                                <Avatar className="h-16 w-16 ring-2 ring-blue-200">
                                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-xl">
                                    {trip.driver_name?.charAt(0) || "D"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-bold text-xl text-gray-800">{trip.driver_name}</p>
                                  <p className="text-base text-gray-600 font-medium">
                                    {new Date(trip.completed_at).toLocaleDateString()} • {trip.estimated_duration} min
                                  </p>
                                </div>
                              </div>
                              <div className="bg-white/80 p-4 rounded-lg mb-4 border border-gray-200">
                                <div className="flex items-center space-x-3 mb-2">
                                  <Navigation className="h-5 w-5 text-gray-500" />
                                  <p className="font-semibold text-gray-900 text-base">
                                    {trip.pickup_address} → {trip.destination_address}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-5 w-5 ${
                                      i < (trip.passenger_rating || 0)
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                                <span className="text-base text-gray-600 ml-3 font-medium">
                                  ({trip.passenger_rating || 0}/5)
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 text-xl font-bold mb-3">
                                ${trip.actual_fare || trip.estimated_fare}
                              </Badge>
                              <p className="text-base text-green-600 font-bold">✅ Completado</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16">
                        <div className="p-6 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full w-32 h-32 mx-auto mb-8 flex items-center justify-center">
                          <Calendar className="h-16 w-16 text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-700 mb-3">No hay viajes recientes</p>
                        <p className="text-gray-500 text-lg">Tus viajes aparecerán aquí una vez completados</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-6">
            {/* Enhanced Request Ride Form */}
            {canRequestNewRide && (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <Car className="h-6 w-6" />
                    <span>Solicitar Viaje</span>
                  </CardTitle>
                  <CardDescription className="text-blue-100 font-medium">
                    Ingresa tu destino y encuentra un conductor
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="pickup" className="text-sm font-semibold text-gray-700">
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

                  <div className="space-y-3">
                    <Label htmlFor="destination" className="text-sm font-semibold text-gray-700">
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

                  <Button
                    className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl font-bold text-lg"
                    onClick={handleRequestRide}
                    disabled={
                      !pickup || !destination || !pickupCoords || !destinationCoords || rideStatus === "searching"
                    }
                  >
                    {rideStatus === "searching" ? (
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
            )}

            {/* Enhanced Quick Destinations with Edit Functionality */}
            {canRequestNewRide && (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-5 w-5" />
                      <span>Destinos Rápidos</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAddNewDestination}
                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {quickDestinations.map((dest, index) => (
                    <div key={index} className="relative group">
                      <Button
                        variant="outline"
                        className="w-full justify-start h-auto p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 transition-all duration-300 bg-white/60"
                        onClick={() => handleQuickDestinationClick(dest, index)}
                      >
                        <div className="flex items-center space-x-4 w-full">
                          <div className="text-3xl p-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg">
                            {dest.icon}
                          </div>
                          <div className="text-left flex-1">
                            <p className="font-bold text-gray-800">{dest.name}</p>
                            <p className="text-sm text-gray-600 truncate">{dest.address}</p>
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditDestination(index)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 bg-white/80 hover:bg-white"
                      >
                        <Edit3 className="h-3 w-3 text-gray-600" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Enhanced User Stats */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Tu Actividad</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8" />
                    <div className="relative z-10">
                      <p className="text-3xl font-bold">{passengerStats.totalTrips}</p>
                      <p className="text-blue-100 font-medium">Viajes</p>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-xl shadow-lg overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8" />
                    <div className="relative z-10">
                      <p className="text-3xl font-bold">{passengerStats.averageRating.toFixed(1)}</p>
                      <p className="text-yellow-100 font-medium">Rating</p>
                    </div>
                  </div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl shadow-lg overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
                  <div className="relative z-10">
                    <p className="text-4xl font-bold">${passengerStats.totalSpent}</p>
                    <p className="text-purple-100 font-semibold text-lg">Total gastado</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Quick Destination Edit/Add Dialog */}
      <Dialog open={showQuickDestDialog} onOpenChange={setShowQuickDestDialog}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span>{editingDestIndex !== null ? "Editar Destino" : "Agregar Destino"}</span>
            </DialogTitle>
            <DialogDescription className="text-base">
              {editingDestIndex !== null
                ? "Modifica la información de tu destino favorito"
                : "Agrega un nuevo destino a tus favoritos"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dest-name" className="text-sm font-semibold">
                  Nombre del destino
                </Label>
                <Input
                  id="dest-name"
                  placeholder="Ej: Casa, Trabajo, Gimnasio..."
                  value={newDestination.name}
                  onChange={(e) => setNewDestination({ ...newDestination, name: e.target.value })}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dest-address" className="text-sm font-semibold">
                  Dirección
                </Label>
                <AddressAutocomplete
                  placeholder="Ingresa la dirección completa"
                  value={newDestination.address}
                  onChange={(address) => setNewDestination({ ...newDestination, address })}
                  onAddressSelect={(address, coords) => {
                    setNewDestination({
                      ...newDestination,
                      address,
                      coords,
                    })
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Icono</Label>
                <div className="grid grid-cols-6 gap-2">
                  {availableIcons.map((icon) => (
                    <Button
                      key={icon}
                      variant="outline"
                      className={`h-12 w-12 text-2xl p-0 ${
                        newDestination.icon === icon
                          ? "bg-blue-100 border-blue-500 ring-2 ring-blue-200"
                          : "hover:bg-blue-50"
                      }`}
                      onClick={() => setNewDestination({ ...newDestination, icon })}
                    >
                      {icon}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 font-semibold"
                onClick={handleSaveDestination}
              >
                <Save className="h-4 w-4 mr-2" />
                {editingDestIndex !== null ? "Actualizar" : "Agregar"}
              </Button>
              {editingDestIndex !== null && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDeleteDestination(editingDestIndex)
                    setShowQuickDestDialog(false)
                  }}
                  className="px-4"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowQuickDestDialog(false)} className="px-4">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              driverId={currentRide.driver_id}
              driverName={currentRide.driver_name || "Conductor"}
              passengerId={currentRide.passenger_id}
              passengerName={currentRide.passenger_name}
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
            <DialogDescription className="text-base">Conductores disponibles en tu área</DialogDescription>
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
                        <p className="font-semibold text-gray-800">{driver.name}</p>
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
            <div className="grid grid-cols-2 gap-3">
              <Button
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 font-semibold"
                onClick={handleRequestRide}
                disabled={!selectedDriver}
              >
                ✅ Confirmar Selección
              </Button>
              <Button
                variant="outline"
                className="font-semibold bg-white/60 hover:bg-blue-50"
                onClick={() => {
                  setSelectedDriver("")
                  handleRequestRide()
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

            <div className="grid grid-cols-2 gap-4">
              <Button
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 font-semibold"
                onClick={handleRateDriver}
                disabled={rating === 0}
              >
                ✨ Enviar Calificación
              </Button>
              <Button
                variant="outline"
                className="font-semibold bg-white/60"
                onClick={() => setShowRatingDialog(false)}
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
