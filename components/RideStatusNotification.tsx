"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Bell, Car, MapPin } from "lucide-react"

interface MinimalRide {
  id?: string
  status?: string
  driver_name?: string
  passenger_name?: string
}

interface RideStatusNotificationProps {
  ride: MinimalRide | null | undefined
  userType: "passenger" | "driver"
}

export function RideStatusNotification({ ride, userType }: RideStatusNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (ride) {
      setIsVisible(true)
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => setIsVisible(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [ride])

  if (!isVisible || !ride) return null

  const getNotificationContent = () => {
    switch (ride.status) {
      case "accepted":
        return userType === "passenger"
          ? {
              title: "¡Conductor encontrado!",
              message: `${ride.driver_name} aceptó tu viaje`,
              icon: <Car className="h-5 w-5 text-green-600" />,
              color: "bg-green-50 border-green-200",
            }
          : {
              title: "Viaje aceptado",
              message: `Recoge a ${ride.passenger_name}`,
              icon: <MapPin className="h-5 w-5 text-blue-600" />,
              color: "bg-blue-50 border-blue-200",
            }
      case "in-progress":
        return {
          title: "Viaje en progreso",
          message: "El viaje ha comenzado",
          icon: <Car className="h-5 w-5 text-orange-600" />,
          color: "bg-orange-50 border-orange-200",
        }
      case "completed":
        return {
          title: "Viaje completado",
          message: "¡Gracias por usar SafeRide!",
          icon: <Bell className="h-5 w-5 text-green-600" />,
          color: "bg-green-50 border-green-200",
        }
      default:
        return null
    }
  }

  const content = getNotificationContent()
  if (!content) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right">
      <Card className={`${content.color} shadow-lg`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            {content.icon}
            <div>
              <h4 className="font-semibold">{content.title}</h4>
              <p className="text-sm text-gray-600">{content.message}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
