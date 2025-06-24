"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, Clock, DollarSign } from "lucide-react"

interface RideTrackerProps {
  ride: any
  userType: "passenger" | "driver"
  onStatusUpdate?: (rideId: string, status: string) => void
  onCancel?: (rideId: string) => void
  onReject?: (rideId: string) => void
}

const RideTracker: React.FC<RideTrackerProps> = ({ ride, userType, onStatusUpdate, onCancel, onReject }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "accepted":
        return "bg-blue-500"
      case "in-progress":
        return "bg-green-500"
      case "completed":
        return "bg-gray-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-400"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente"
      case "accepted":
        return "Aceptado"
      case "in-progress":
        return "En Progreso"
      case "completed":
        return "Completado"
      case "cancelled":
        return "Cancelado"
      default:
        return status
    }
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm w-full">
      <div className="flex flex-col space-y-1.5 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">Detalles del Viaje</h3>
          <Badge className={`text-white ${getStatusColor(ride.status)}`}>{getStatusText(ride.status)}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">Información sobre el viaje actual.</p>
      </div>
      <div className="p-6 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium leading-none">Origen</p>
                <p className="text-sm text-muted-foreground">{ride.pickup_address}</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Navigation className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium leading-none">Destino</p>
                <p className="text-sm text-muted-foreground">{ride.destination_address}</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium leading-none">Duración Estimada</p>
                <p className="text-sm text-muted-foreground">{ride.estimated_duration} min</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium leading-none">Precio</p>
                <p className="text-sm text-muted-foreground">${ride.estimated_fare}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {userType === "driver" && (
            <div>
              <p className="text-sm font-medium leading-none">Pasajero</p>
              <p className="text-sm text-muted-foreground">{ride.passenger_name}</p>
            </div>
          )}
          {userType === "passenger" && ride.driver_name && (
            <div>
              <p className="text-sm font-medium leading-none">Conductor</p>
              <p className="text-sm text-muted-foreground">{ride.driver_name}</p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium leading-none">Solicitado</p>
            <p className="text-sm text-muted-foreground">{new Date(ride.requested_at).toLocaleString()}</p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex space-x-2">
          {userType === "driver" && ride.status === "accepted" && (
            <Button
              onClick={() => onStatusUpdate?.(ride.id, "in-progress")}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Iniciar Viaje
            </Button>
          )}

          {userType === "driver" && ride.status === "in-progress" && (
            <Button
              onClick={() => onStatusUpdate?.(ride.id, "completed")}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Completar Viaje
            </Button>
          )}

          {userType === "passenger" && ["pending", "accepted"].includes(ride.status) && (
            <Button variant="destructive" onClick={() => onCancel?.(ride.id)} className="flex-1">
              Cancelar Viaje
            </Button>
          )}

          {userType === "driver" && ride.status === "pending" && (
            <Button variant="outline" onClick={() => onReject?.(ride.id)} className="flex-1">
              Rechazar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export { RideTracker }
export default RideTracker
