"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, Clock, Phone, MessageCircle, Star, AlertTriangle, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RideChat } from "@/components/RideChat"
import { useAuth } from "@/lib/auth-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface RideTrackerProps {
  ride: any
  userType: "passenger" | "driver"
  onStatusUpdate?: (rideId: string, status: string) => void
}

export function RideTracker({ ride, userType, onStatusUpdate }: RideTrackerProps) {
  const [currentStatus, setCurrentStatus] = useState(ride?.status || "pending")
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (ride?.status) {
      setCurrentStatus(ride.status)
    }
  }, [ride?.status])

  if (!ride) return null

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const response = await fetch("/api/rides/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rideId: ride.id,
          status: newStatus,
        }),
      })

      if (response.ok) {
        setCurrentStatus(newStatus)
        onStatusUpdate?.(ride.id, newStatus)
      }
    } catch (error) {
      console.error("Error updating ride status:", error)
    }
  }

  const handleCancelRide = async () => {
    await handleStatusUpdate("cancelled")
    setIsCancelDialogOpen(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "accepted":
        return "bg-blue-100 text-blue-800"
      case "in-progress":
        return "bg-orange-100 text-orange-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Buscando conductor"
      case "accepted":
        return "Conductor asignado"
      case "in-progress":
        return "En camino"
      case "completed":
        return "Completado"
      case "cancelled":
        return "Cancelado"
      default:
        return status
    }
  }

  const canCancel = ["pending", "accepted"].includes(currentStatus)
  const canChat = ["accepted", "in-progress"].includes(currentStatus) && ride.driver_id

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Estado del Viaje</CardTitle>
          <Badge className={getStatusColor(currentStatus)}>{getStatusText(currentStatus)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Route Information */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-green-600" />
            <span className="text-sm">Origen: {ride.pickup_address}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Navigation className="h-4 w-4 text-red-600" />
            <span className="text-sm">Destino: {ride.destination_address}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm">Duración estimada: {ride.estimated_duration} min</span>
          </div>
        </div>

        {/* Driver/Passenger Information */}
        {currentStatus !== "pending" && ride.driver_id && (
          <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/placeholder.svg?height=40&width=40" />
              <AvatarFallback>
                {userType === "passenger" ? ride.driver_name?.charAt(0) || "D" : ride.passenger_name?.charAt(0) || "P"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="font-semibold">{userType === "passenger" ? ride.driver_name : ride.passenger_name}</h4>
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs">4.9</span>
              </div>
            </div>
            <div className="flex space-x-2">
              {canChat && (
                <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Chat del Viaje</DialogTitle>
                    </DialogHeader>
                    <RideChat
                      rideId={ride.id}
                      driverId={ride.driver_id}
                      driverName={ride.driver_name}
                      passengerId={ride.passenger_id}
                      passengerName={ride.passenger_name}
                      onClose={() => setIsChatOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              )}
              <Button size="sm" variant="outline">
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons for Driver */}
        {userType === "driver" && (
          <div className="space-y-2">
            {currentStatus === "accepted" && (
              <Button className="w-full" onClick={() => handleStatusUpdate("in-progress")}>
                Iniciar Viaje
              </Button>
            )}
            {currentStatus === "in-progress" && (
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => handleStatusUpdate("completed")}
              >
                Completar Viaje
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                className="w-full text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setIsCancelDialogOpen(true)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar Viaje
              </Button>
            )}
          </div>
        )}

        {/* Action Buttons for Passenger */}
        {userType === "passenger" && canCancel && (
          <Button
            variant="outline"
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => setIsCancelDialogOpen(true)}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar Viaje
          </Button>
        )}

        {/* Fare Information */}
        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
          <span className="font-medium">Tarifa estimada:</span>
          <span className="text-lg font-bold text-blue-600">${ride.estimated_fare}</span>
        </div>
      </CardContent>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              Cancelar Viaje
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas cancelar este viaje? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelRide} className="bg-red-600 hover:bg-red-700 text-white">
              Sí, cancelar viaje
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
