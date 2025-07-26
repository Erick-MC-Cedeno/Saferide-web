"use client"

import { useState, useEffect, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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
  Shield,
  CheckCircle,
  Home,
  ChevronRight,
  TrendingUp,
  Award,
  Target,
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

// Funciones de cálculo movidas fuera del componente
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

// Componentes de contenido móvil movidos fuera del componente principal
const MobileHomeContent = memo(
  ({
    userData,
    passengerStats,
    canRequestNewRide,
    quickDestinations,
    handleAddNewDestination,
    handleQuickDestinationClick,
    setActiveMobileTab,
    currentRide,
    handleCancelRide,
    setShowChatDialog,
  }) => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">¡Hola, {userData?.name?.split(" ")[0]}! 👋</h2>
            <p className="text-blue-100 text-sm font-medium">¿A dónde te llevamos hoy?</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <Car className="h-8 w-8 text-white" />
          </div>
        </div>
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{passengerStats.totalTrips}</p>
            <p className="text-xs text-blue-100 font-medium">Viajes</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{passengerStats.averageRating.toFixed(1)}</p>
            <p className="text-xs text-blue-100 font-medium">Rating</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-lg font-bold">${passengerStats.totalSpent}</p>
            <p className="text-xs text-blue-100 font-medium">Gastado</p>
          </div>
        </div>
      </div>
      {/* Current Ride Status */}
      {currentRide && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-orange-500 rounded-full animate-pulse">
                  <Car className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-gray-800">Viaje Activo</span>
              </div>
              <Badge
                variant={currentRide.status === "pending" ? "secondary" : "default"}
                className={`px-3 py-1 text-xs font-bold ${
                  currentRide.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : currentRide.status === "accepted"
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                }`}
              >
                {currentRide.status === "pending" && "⏳ Esperando"}
                {currentRide.status === "accepted" && "✅ Confirmado"}
                {currentRide.status === "in-progress" && "🚗 En camino"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Route Info */}
              <div className="bg-white/80 rounded-xl p-4 space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex flex-col items-center space-y-2 mt-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="w-0.5 h-8 bg-gray-300"></div>
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">ORIGEN</p>
                      <p className="text-sm font-medium text-gray-900 leading-tight">{currentRide.pickup_address}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">DESTINO</p>
                      <p className="text-sm font-medium text-gray-900 leading-tight">
                        {currentRide.destination_address}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Driver & Fare Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/80 rounded-xl p-3 text-center">
                  <p className="text-xs font-semibold text-gray-500 mb-1">TARIFA</p>
                  <p className="text-xl font-bold text-green-600">${currentRide.estimated_fare}</p>
                </div>
                {currentRide.driver_name && (
                  <div className="bg-white/80 rounded-xl p-3 text-center">
                    <p className="text-xs font-semibold text-gray-500 mb-1">CONDUCTOR</p>
                    <p className="text-sm font-bold text-blue-600 truncate">{currentRide.driver_name}</p>
                  </div>
                )}
              </div>
              {/* Action Buttons */}
              <div className="flex space-x-2">
                {currentRide.status === "in-progress" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowChatDialog(true)}
                    className="flex-1 bg-white/90 border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold h-11"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleCancelRide(currentRide.id)}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 font-semibold h-11"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Quick Destinations */}
      {canRequestNewRide && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Destinos Rápidos</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddNewDestination}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold"
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {quickDestinations.slice(0, 4).map((dest, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 bg-white/80 hover:bg-blue-50 hover:border-blue-300 border-gray-200 transition-all duration-200"
                onClick={() => handleQuickDestinationClick(dest, index)}
              >
                <div className="text-center w-full">
                  <div className="text-2xl mb-2">{dest.icon}</div>
                  <p className="font-bold text-gray-800 text-sm mb-1">{dest.name}</p>
                  <p className="text-xs text-gray-500 truncate">{dest.address}</p>
                </div>
              </Button>
            ))}
          </div>
          {quickDestinations.length > 4 && (
            <Button
              variant="ghost"
              className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold"
              onClick={() => setActiveMobileTab("destinations")}
            >
              Ver todos los destinos
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      )}
      {/* Request Ride Button */}
      {canRequestNewRide && (
        <Button
          className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg font-bold text-lg rounded-2xl"
          onClick={() => setActiveMobileTab("ride")}
        >
          <Car className="mr-3 h-6 w-6" />
          Solicitar Viaje
        </Button>
      )}
    </div>
  ),
)

const MobileRideContent = memo(
  ({
    pickup,
    setPickup,
    pickupCoords,
    setPickupCoords,
    destination,
    setDestination,
    destinationCoords,
    setDestinationCoords,
    handleRequestRide,
    rideStatus,
  }) => (
    <div className="space-y-6">
      {/* Map Component */}
      <Card className="overflow-hidden border-0 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <MapPin className="h-5 w-5" />
            <span>Selecciona tu ruta</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-64">
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
          </div>
        </CardContent>
      </Card>
      {/* Address Inputs */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pickup" className="text-sm font-bold text-gray-700 flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
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
            className="h-12 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="destination" className="text-sm font-bold text-gray-700 flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
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
            className="h-12 text-base"
          />
        </div>
      </div>
      {/* Trip Summary */}
      {pickupCoords && destinationCoords && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
              <Target className="h-5 w-5 mr-2 text-blue-600" />
              Resumen del Viaje
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/80 rounded-xl p-3 text-center">
                  <p className="text-xs font-semibold text-gray-500 mb-1">DISTANCIA</p>
                  <p className="text-lg font-bold text-blue-600">
                    {calculateDistance(
                      pickupCoords.lat,
                      pickupCoords.lng,
                      destinationCoords.lat,
                      destinationCoords.lng,
                    ).toFixed(1)}{" "}
                    km
                  </p>
                </div>
                <div className="bg-white/80 rounded-xl p-3 text-center">
                  <p className="text-xs font-semibold text-gray-500 mb-1">TIEMPO EST.</p>
                  <p className="text-lg font-bold text-blue-600">
                    {calculateEstimatedDuration(pickupCoords, destinationCoords)} min
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-4 border-2 border-green-200">
                <div className="flex items-center justify-center space-x-2">
                  <DollarSign className="h-6 w-6 text-green-600" />
                  <div className="text-center">
                    <p className="text-xs font-semibold text-green-700 mb-1">TARIFA ESTIMADA</p>
                    <p className="text-2xl font-bold text-green-800">
                      ${calculateEstimatedFare(pickupCoords, destinationCoords)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Request Button */}
      <Button
        className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg font-bold text-lg rounded-2xl"
        onClick={handleRequestRide}
        disabled={!pickup || !destination || !pickupCoords || !destinationCoords || rideStatus === "searching"}
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
    </div>
  ),
)

const MobileActivityContent = memo(({ passengerStats }) => (
  <div className="space-y-6">
    {/* Stats Cards */}
    <div className="grid grid-cols-1 gap-4">
      <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-3xl font-bold">{passengerStats.totalTrips}</p>
            <p className="text-blue-100 font-semibold">Viajes Completados</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
          <p className="text-xs text-blue-100 mb-1">Promedio mensual</p>
          <p className="text-lg font-bold">{Math.round(passengerStats.totalTrips / 12)} viajes</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-2xl p-4 shadow-lg">
          <div className="text-center">
            <Award className="h-8 w-8 mx-auto mb-2" />
            <p className="text-2xl font-bold">{passengerStats.averageRating.toFixed(1)}</p>
            <p className="text-yellow-100 font-semibold text-sm">Tu Rating</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl p-4 shadow-lg">
          <div className="text-center">
            <DollarSign className="h-8 w-8 mx-auto mb-2" />
            <p className="text-xl font-bold">${passengerStats.totalSpent}</p>
            <p className="text-purple-100 font-semibold text-sm">Total Gastado</p>
          </div>
        </div>
      </div>
    </div>
    {/* Achievement Section */}
    <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
          <Award className="h-5 w-5 mr-2 text-green-600" />
          Logros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-white/80 rounded-xl">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">Pasajero Verificado</p>
              <p className="text-xs text-gray-600">Cuenta verificada exitosamente</p>
            </div>
          </div>
          {passengerStats.totalTrips >= 5 && (
            <div className="flex items-center space-x-3 p-3 bg-white/80 rounded-xl">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Star className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">Viajero Frecuente</p>
                <p className="text-xs text-gray-600">Más de 5 viajes completados</p>
              </div>
            </div>
          )}
          {passengerStats.averageRating >= 4.5 && (
            <div className="flex items-center space-x-3 p-3 bg-white/80 rounded-xl">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Award className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">Pasajero 5 Estrellas</p>
                <p className="text-xs text-gray-600">Excelente rating promedio</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  </div>
))

const MobileRecentTripsContent = memo(({ recentTrips }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-bold text-gray-900">Viajes Recientes</h3>
      <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-semibold">
        {recentTrips.length} viajes
      </Badge>
    </div>
    <ScrollArea className="h-96">
      <div className="space-y-3">
        {recentTrips.length > 0 ? (
          recentTrips.map((trip) => (
            <Card key={trip.id} className="border-0 shadow-md bg-white/90 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12 ring-2 ring-blue-200">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold">
                      {trip.driver_name?.charAt(0) || "D"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-gray-800 truncate">{trip.driver_name}</p>
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 text-xs font-bold ml-2">
                        ${trip.actual_fare || trip.estimated_fare}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                      <span className="font-medium">
                        {new Date(trip.completed_at).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="font-medium">{trip.estimated_duration} min</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 mb-2">
                      <div className="flex items-start space-x-2">
                        <div className="flex flex-col items-center space-y-1 mt-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="w-0.5 h-4 bg-gray-300"></div>
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-xs text-gray-700 font-medium truncate">{trip.pickup_address}</p>
                          <p className="text-xs text-gray-700 font-medium truncate">{trip.destination_address}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < (trip.passenger_rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="text-xs text-gray-600 ml-1 font-medium">({trip.passenger_rating || 0}/5)</span>
                      </div>
                      <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full">
                        ✅ Completado
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="p-6 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Calendar className="h-10 w-10 text-blue-600" />
            </div>
            <p className="text-lg font-bold text-gray-700 mb-2">No hay viajes recientes</p>
            <p className="text-gray-500 text-sm">Tus viajes aparecerán aquí una vez completados</p>
          </div>
        )}
      </div>
    </ScrollArea>
  </div>
))

const MobileQuickDestinationsContent = memo(
  ({ quickDestinations, handleAddNewDestination, handleQuickDestinationClick, handleEditDestination }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Destinos Rápidos</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddNewDestination}
          className="bg-white/80 hover:bg-blue-50 border-blue-200 text-blue-600 font-semibold"
        >
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </div>
      <ScrollArea className="h-96">
        <div className="space-y-3">
          {quickDestinations.map((dest, index) => (
            <div key={index} className="relative group">
              <Button
                variant="outline"
                className="w-full justify-start h-auto p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 transition-all duration-300 bg-white/80 border-gray-200"
                onClick={() => handleQuickDestinationClick(dest, index)}
              >
                <div className="flex items-center space-x-4 w-full">
                  <div className="text-3xl p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl">
                    {dest.icon}
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-bold text-gray-800 text-base mb-1">{dest.name}</p>
                    <p className="text-sm text-gray-600 truncate">{dest.address}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditDestination(index)}
                className="absolute top-3 right-12 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 bg-white/90 hover:bg-white border border-gray-200"
              >
                <Edit3 className="h-4 w-4 text-gray-600" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  ),
)

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
  // Mobile navigation state
  const [activeMobileTab, setActiveMobileTab] = useState("home")
  const [showMobileMenu, setShowMobileMenu] = useState(false)
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

  // Función driverData integrada
  const driverData = useCallback(async () => {
    console.log("[PassengerDashboard] Ejecutando driverData()...")
    try {
      const response = await fetch("/api/drivers/all")
      const result = await response.json()
      if (!result.success) {
        console.error("Error en driverData:", result.error)
        throw new Error(result.error || "Error al obtener conductores")
      }
      console.log(`[PassengerDashboard] driverData completado: ${result.count} conductores obtenidos`)
      console.log(`[PassengerDashboard] Estadísticas:`, result.stats)
      return result
    } catch (error) {
      console.error("Error en driverData:", error)
      throw error
    }
  }, [])

  // Load available drivers when coordinates are set - MODIFICADO para usar driverData
  useEffect(() => {
    const loadAvailableDrivers = async () => {
      if (!pickupCoords || !destinationCoords) return
      console.log("[PassengerDashboard] Cargando conductores disponibles...")
      try {
        // Usar la función driverData
        const driverResult = await driverData()
        // Filtrar conductores verificados o en línea
        const verifiedDrivers = driverResult.data.filter((driver) => driver.is_verified)
        const onlineDrivers = driverResult.data.filter((driver) => driver.is_online)
        const availableDriversToShow = verifiedDrivers.length > 0 ? verifiedDrivers : onlineDrivers
        setAvailableDrivers(availableDriversToShow)
        if (availableDriversToShow.length === 0) {
          toast({
            title: "Sin conductores",
            description: "No hay conductores disponibles en este momento",
            variant: "destructive",
          })
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
  }, [pickupCoords, destinationCoords, driverData, toast])

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

  // Función solicitarViaje
  const solicitarViaje = useCallback(async () => {
    console.log("[PassengerDashboard] Ejecutando solicitarViaje...")
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
      // Si hay conductor específico seleccionado, asignar directamente
      if (selectedDriver) {
        const driver = availableDrivers.find((d) => d.uid === selectedDriver)
        if (driver) {
          rideData.driver_id = selectedDriver
          rideData.driver_name = driver.name
          rideData.status = "accepted"
          rideData.accepted_at = new Date().toISOString()
          console.log(`[PassengerDashboard] Conductor asignado: ${driver.name}`)
        }
      }
      const { data, error } = await supabase.from("rides").insert(rideData).select()
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
      console.log("Viaje creado exitosamente:", data)
      setShowDriverSelection(false)
      setSelectedDriver("")
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
  }, [
    user,
    userData,
    pickup,
    pickupCoords,
    destination,
    destinationCoords,
    selectedDriver,
    availableDrivers,
    toast,
    refreshRides,
  ])

  // handleRequestRide MODIFICADO según el flujo especificado
  const handleRequestRide = useCallback(async () => {
    if (!pickup || !destination || !pickupCoords || !destinationCoords || !user || !userData) return
    console.log("[PassengerDashboard] Iniciando solicitud de viaje...")
    // Paso 1: Obtener datos de conductores usando driverData
    setRideStatus("searching")
    try {
      console.log("[PassengerDashboard] Llamando a await driverData()...")
      const driverResult = await driverData()
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
      console.log(`[PassengerDashboard] driverData completado: ${driverResult.count} conductores`)
      // Filtrar conductores verificados
      const verifiedDrivers = driverResult.data.filter((driver) => driver.is_verified)
      const onlineDrivers = driverResult.data.filter((driver) => driver.is_online)
      // Si no hay conductores verificados, usar conductores en línea
      const availableDriversToShow = verifiedDrivers.length > 0 ? verifiedDrivers : onlineDrivers
      setAvailableDrivers(availableDriversToShow)
      if (availableDriversToShow.length === 0) {
        setRideStatus("idle")
        toast({
          title: "Sin conductores",
          description: "No hay conductores disponibles en este momento",
          variant: "destructive",
        })
        return
      }
      // Paso 2: Mostrar diálogo de selección si no hay conductor preseleccionado
      if (!selectedDriver) {
        console.log("[PassengerDashboard] Mostrando diálogo de selección de conductor")
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
  }, [
    pickup,
    destination,
    pickupCoords,
    destinationCoords,
    user,
    userData,
    selectedDriver,
    driverData,
    solicitarViaje,
    toast,
  ])

  const handleCancelRide = useCallback(
    async (rideId: string, reason?: string) => {
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
    },
    [rides, cancelRide, toast, refreshRides],
  )

  const handleRateDriver = useCallback(async () => {
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
  }, [completedRide, rating, toast])

  const resetRideForm = useCallback(() => {
    setPickup("")
    setDestination("")
    setPickupCoords(null)
    setDestinationCoords(null)
    setSelectedDriver("")
    setShowDriverSelection(false)
    setRideStatus("idle")
  }, [])

  // Quick destinations functions
  const handleQuickDestinationClick = useCallback(
    (dest, index) => {
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
    },
    [editingDestIndex, setDestination, setDestinationCoords],
  )

  const handleEditDestination = useCallback(
    (index) => {
      setEditingDestIndex(index)
      setNewDestination(quickDestinations[index])
      setShowQuickDestDialog(true)
    },
    [quickDestinations],
  )

  const handleAddNewDestination = useCallback(() => {
    setEditingDestIndex(null)
    setNewDestination({
      name: "",
      address: "",
      coords: { lat: 0, lng: 0 },
      icon: "📍",
    })
    setShowQuickDestDialog(true)
  }, [])

  const handleSaveDestination = useCallback(() => {
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
  }, [newDestination, quickDestinations, editingDestIndex, toast])

  const handleDeleteDestination = useCallback(
    (index) => {
      const updatedDestinations = quickDestinations.filter((_, i) => i !== index)
      setQuickDestinations(updatedDestinations)
      toast({
        title: "Destino eliminado",
        description: "El destino ha sido eliminado de tus favoritos",
      })
    },
    [quickDestinations, toast],
  )

  const availableIcons = ["🏠", "🏢", "✈️", "🏛️", "🏥", "🏫", "🛒", "🍽️", "⛽", "🏋️", "📍", "🎯"]
  const canRequestNewRide = !currentRide && rideStatus === "idle"
  const hasActiveRide = currentRide && ["pending", "accepted", "in-progress"].includes(currentRide.status)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Desktop Layout - Mantener funcionalidad original */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
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
                <ScrollArea className="h-80 px-4 py-4 sm:px-6 sm:py-6">
                  <div className="space-y-4">
                    {recentTrips.length > 0 ? (
                      recentTrips.map((trip) => (
                        <div
                          key={trip.id}
                          className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <Avatar className="h-10 w-10 ring-2 ring-blue-200">
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold">
                                  {trip.driver_name?.charAt(0) || "D"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-bold text-gray-800 truncate">{trip.driver_name}</p>
                                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 text-sm font-bold ml-2">
                                    ${trip.actual_fare || trip.estimated_fare}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                                  <span className="font-medium">
                                    {new Date(trip.completed_at).toLocaleDateString()}
                                  </span>
                                  <span className="font-medium">{trip.estimated_duration} min</span>
                                </div>
                                <div className="bg-white/80 p-2 rounded-md border border-gray-200 mb-2">
                                  <div className="flex items-center space-x-2">
                                    <Navigation className="h-3 w-3 text-gray-500 flex-shrink-0" />
                                    <p className="text-xs text-gray-700 truncate">
                                      {trip.pickup_address} → {trip.destination_address}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-1">
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
                                    <span className="text-xs text-gray-600 ml-1 font-medium">
                                      ({trip.passenger_rating || 0}/5)
                                    </span>
                                  </div>
                                  <span className="text-xs text-green-600 font-bold">✅ Completado</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <div className="p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                          <Calendar className="h-10 w-10 text-blue-600" />
                        </div>
                        <p className="text-lg font-bold text-gray-700 mb-2">No hay viajes recientes</p>
                        <p className="text-gray-500">Tus viajes aparecerán aquí una vez completados</p>
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
      {/* Mobile Layout - Enhanced */}
      <div className="md:hidden min-h-screen">
        {/* Mobile Content Area */}
        <div className="p-4 pb-24">
          {activeMobileTab === "home" && (
            <MobileHomeContent
              userData={userData}
              passengerStats={passengerStats}
              canRequestNewRide={canRequestNewRide}
              quickDestinations={quickDestinations}
              handleAddNewDestination={handleAddNewDestination}
              handleQuickDestinationClick={handleQuickDestinationClick}
              setActiveMobileTab={setActiveMobileTab}
              currentRide={currentRide}
              handleCancelRide={handleCancelRide}
              setShowChatDialog={setShowChatDialog}
            />
          )}
          {activeMobileTab === "ride" && (
            <MobileRideContent
              pickup={pickup}
              setPickup={setPickup}
              pickupCoords={pickupCoords}
              setPickupCoords={setPickupCoords}
              destination={destination}
              setDestination={setDestination}
              destinationCoords={destinationCoords}
              setDestinationCoords={setDestinationCoords}
              handleRequestRide={handleRequestRide}
              rideStatus={rideStatus}
            />
          )}
          {activeMobileTab === "activity" && <MobileActivityContent passengerStats={passengerStats} />}
          {activeMobileTab === "recent" && <MobileRecentTripsContent recentTrips={recentTrips} />}
          {activeMobileTab === "destinations" && (
            <MobileQuickDestinationsContent
              quickDestinations={quickDestinations}
              handleAddNewDestination={handleAddNewDestination}
              handleQuickDestinationClick={handleQuickDestinationClick}
              handleEditDestination={handleEditDestination}
            />
          )}
        </div>
        {/* Enhanced Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl z-40">
          <div className="grid grid-cols-5 px-2 py-2">
            <button
              onClick={() => setActiveMobileTab("home")}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 ${
                activeMobileTab === "home"
                  ? "text-blue-600 bg-blue-50 shadow-sm"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              <Home className="h-5 w-5 mb-1" />
              <span className="text-xs font-semibold">Inicio</span>
            </button>
            <button
              onClick={() => setActiveMobileTab("ride")}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 ${
                activeMobileTab === "ride"
                  ? "text-blue-600 bg-blue-50 shadow-sm"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              <Car className="h-5 w-5 mb-1" />
              <span className="text-xs font-semibold">Viaje</span>
            </button>
            <button
              onClick={() => setActiveMobileTab("activity")}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 ${
                activeMobileTab === "activity"
                  ? "text-blue-600 bg-blue-50 shadow-sm"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              <Activity className="h-5 w-5 mb-1" />
              <span className="text-xs font-semibold">Actividad</span>
            </button>
            <button
              onClick={() => setActiveMobileTab("recent")}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 ${
                activeMobileTab === "recent"
                  ? "text-blue-600 bg-blue-50 shadow-sm"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              <Clock className="h-5 w-5 mb-1" />
              <span className="text-xs font-semibold">Recientes</span>
            </button>
            <button
              onClick={() => setActiveMobileTab("destinations")}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 ${
                activeMobileTab === "destinations"
                  ? "text-blue-600 bg-blue-50 shadow-sm"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              <Zap className="h-5 w-5 mb-1" />
              <span className="text-xs font-semibold">Destinos</span>
            </button>
          </div>
        </div>
      </div>
      {/* Quick Destination Edit/Add Dialog */}
      <Dialog open={showQuickDestDialog} onOpenChange={setShowQuickDestDialog}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl mx-4">
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
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
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
            <div className="flex flex-col space-y-3">
              <Button
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 font-semibold h-12"
                onClick={handleSaveDestination}
              >
                <Save className="h-4 w-4 mr-2" />
                {editingDestIndex !== null ? "Actualizar" : "Agregar"}
              </Button>
              <div className="flex space-x-3">
                {editingDestIndex !== null && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleDeleteDestination(editingDestIndex)
                      setShowQuickDestDialog(false)
                    }}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowQuickDestDialog(false)} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Enhanced Chat Dialog */}
      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent className="sm:max-w-lg border-0 shadow-2xl mx-4">
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
      {/* IMPROVED Driver Selection Dialog */}
      <Dialog open={showDriverSelection} onOpenChange={setShowDriverSelection}>
        <DialogContent className="sm:max-w-2xl border-0 shadow-2xl bg-white mx-4">
          <DialogHeader className="pb-4 border-b border-gray-100">
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <span>Seleccionar Conductor</span>
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              {availableDrivers.length} conductores disponibles
              {availableDrivers.some((d) => d.is_verified)
                ? ` • ${availableDrivers.filter((d) => d.is_verified).length} verificados`
                : " • conductores en línea"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Info Banner */}
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="p-1 bg-blue-500 rounded-full mt-0.5">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">💡 Opciones de selección</p>
                  <p className="text-sm text-blue-700">
                    Puedes elegir un conductor específico o dejar que el sistema asigne automáticamente
                  </p>
                </div>
              </div>
            </div>
            {/* Driver Selection Grid */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">Conductores disponibles:</Label>
              <div className="grid gap-3">
                {availableDrivers.map((driver) => (
                  <div
                    key={driver.uid}
                    className={`relative p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
                      selectedDriver === driver.uid
                        ? "border-blue-500 bg-blue-50 shadow-lg"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedDriver(driver.uid)}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Avatar */}
                      <Avatar className="h-12 w-12 ring-2 ring-gray-200">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-lg">
                          {driver.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {/* Driver Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-bold text-gray-900 text-lg truncate">{driver.name}</h3>
                          {driver.is_verified ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200 text-xs px-2 py-1">
                              <Shield className="h-3 w-3 mr-1" />
                              Verificado
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs px-2 py-1">
                              En línea
                            </Badge>
                          )}
                        </div>
                        {/* Rating and Vehicle */}
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{driver.rating?.toFixed(1) || "N/A"}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Car className="h-4 w-4 text-gray-500" />
                            <span className="font-medium truncate">{driver.vehicle_model || "Vehículo"}</span>
                          </div>
                        </div>
                        {/* Additional Info */}
                        {driver.vehicle_plate && (
                          <div className="mt-2">
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-mono">
                              {driver.vehicle_plate}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Selection Indicator */}
                      {selectedDriver === driver.uid && (
                        <div className="absolute top-3 right-3">
                          <div className="p-1 bg-blue-500 rounded-full">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
              <Button
                className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 font-semibold border border-green-600 shadow-md"
                onClick={solicitarViaje}
                disabled={!selectedDriver}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar Conductor
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 font-semibold bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                onClick={() => {
                  setSelectedDriver("")
                  solicitarViaje()
                }}
              >
                <Zap className="h-4 w-4 mr-2" />
                Asignación Automática
              </Button>
              <Button
                variant="ghost"
                className="w-full h-10 text-gray-600 hover:text-gray-800 hover:bg-gray-100 border border-gray-200"
                onClick={() => setShowDriverSelection(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Enhanced Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl mx-4">
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
            <div className="flex flex-col space-y-3">
              <Button
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 font-semibold h-12"
                onClick={handleRateDriver}
                disabled={rating === 0}
              >
                ✨ Enviar Calificación
              </Button>
              <Button
                variant="outline"
                className="w-full font-semibold bg-white/60"
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
