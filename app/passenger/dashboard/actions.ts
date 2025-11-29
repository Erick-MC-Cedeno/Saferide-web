"use client"

import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/supabase"
import type { NewRidePayload, DriverApi } from "./types"
import { calculateEstimatedFare, calculateEstimatedDuration } from "./utils"
import type { ToastOptions, ToastFn } from "@/hooks/use-toast"

export async function solicitarViaje(
  user: { uid: string; email?: string },
  userData: unknown,
  pickup: string,
  pickupCoords: { lat: number; lng: number },
  destination: string,
  destinationCoords: { lat: number; lng: number },
  selectedDriver: string,
  availableDrivers: DriverApi[],
  toast: (options: ToastOptions) => void,
  refreshRides: () => void,
) {
  try {
    const rideData: NewRidePayload = {
      passenger_id: user.uid,
      passenger_name: String(((userData as { name?: string } | null) ?? {})?.name ?? user?.email ?? ""),
      pickup_address: pickup,
      pickup_coordinates: [pickupCoords.lng, pickupCoords.lat],
      destination_address: destination,
      destination_coordinates: [destinationCoords.lng, destinationCoords.lat],
      status: "pending",
      estimated_fare: calculateEstimatedFare(pickupCoords, destinationCoords),
      estimated_duration: calculateEstimatedDuration(pickupCoords, destinationCoords),
    }

    if (selectedDriver) {
      const driver = availableDrivers.find((d) => d.uid === selectedDriver)
      if (driver) {
        rideData.driver_id = selectedDriver
        rideData.driver_name = driver.name
      }
    }

    const { error } = await (supabase.from("rides") as any)
      .insert([rideData as Database["public"]["Tables"]["rides"]["Insert"]])
      .select()

    if (error) {
      console.error("Error creando viaje:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el viaje. Intenta de nuevo.",
        variant: "destructive",
      })
      return { success: false }
    }

    try {
      if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    } catch {}

    toast({
      title: "Viaje solicitado",
      description: selectedDriver
        ? "Tu viaje ha sido asignado al conductor seleccionado"
        : "Tu viaje ha sido solicitado. Esperando confirmación del conductor.",
    })

    refreshRides()
    return { success: true }
  } catch (error) {
    console.error("Error en solicitarViaje:", error)
    toast({
      title: "Error",
      description: "Ocurrió un error al solicitar el viaje.",
      variant: "destructive",
    })
    return { success: false }
  }
}

export async function handleCancelRide(
  rideId: string,
  rides: any[],
  cancelRide: (rideId: string, reason: string) => Promise<{ success: boolean; error?: string }>,
  toast: (options: ToastOptions) => void,
  refreshRides: () => void,
  reason?: string,
) {
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
      return { success: false }
    }

    console.log("Ride cancelled successfully")

    toast({
      title: "Viaje cancelado",
      description: "Tu viaje ha sido cancelado exitosamente.",
    })

    refreshRides()
    return { success: true }
  } catch (error) {
    console.error("Error in handleCancelRide:", error)
    toast({
      title: "Error",
      description: "Ocurrió un error al cancelar el viaje.",
      variant: "destructive",
    })
    return { success: false }
  }
}

export async function handleRateDriver(
  completedRide: any,
  rating: number,
  comment: string,
  toast: (options: ToastOptions) => void,
) {
  if (!completedRide) return { success: false }

  if (rating === 0 && comment.trim() === "") return { success: false }

  try {
    const payload: { passenger_comment?: string | null; passenger_rating?: number } = {
      passenger_comment: comment.trim() || null,
    }

    if (rating > 0) {
      payload.passenger_rating = rating
    }

    const { error } = await (supabase.from("rides") as any)
      .update(payload as Partial<Database["public"]["Tables"]["rides"]["Update"]>)
      .eq("id", completedRide.id)

    if (error) {
      console.error("Error rating driver:", error)
      return { success: false }
    }

    if (rating > 0) {
      const { data: driverRides } = await supabase
        .from("rides")
        .select("passenger_rating")
        .eq("driver_id", completedRide.driver_id)
        .not("passenger_rating", "is", null)

      if (driverRides && driverRides.length > 0) {
        const avgRating =
          (driverRides as Array<{ passenger_rating?: number }>).reduce(
            (sum, ride) => sum + Number(ride.passenger_rating ?? 0),
            0,
          ) / driverRides.length
        await (supabase.from("drivers") as any)
          .update({ rating: avgRating } as Partial<Database["public"]["Tables"]["drivers"]["Update"]>)
          .eq("uid", completedRide.driver_id)
      }
    }

    toast({
      title: "Calificación enviada",
      description: "Gracias por compartir tu experiencia.",
    })
    return { success: true }
  } catch (err: unknown) {
    console.error("Error submitting rating:", err)
    toast({
      title: "Error",
      description: "No se pudo enviar la calificación.",
      variant: "destructive",
    })
    return { success: false }
  }
}

export async function handleSkipRating(
  completedRide: any,
  comment: string,
  toast: (options: ToastOptions) => void,
) {
  if (!completedRide) return { success: false }
  try {
    const payload = {
      passenger_comment: comment.trim() || "Omitido por el pasajero",
    }
    const { error } = await (supabase.from("rides") as any)
      .update(payload as Partial<Database["public"]["Tables"]["rides"]["Update"]>)
      .eq("id", completedRide.id)
    if (error) {
      console.error("Error skipping rating:", error)
      toast({ title: "Error", description: "No se pudo omitir la calificación.", variant: "destructive" })
      return { success: false }
    }

    toast({ title: "Omitido", description: "Gracias por tu respuesta." })
    return { success: true }
  } catch (err) {
    console.error("Error in handleSkipRating:", err)
    toast({ title: "Error", description: "Ocurrió un error.", variant: "destructive" })
    return { success: false }
  }
}

export async function handleUseMyLocation(
  setPickup: (value: string) => void,
  setPickupCoords: (coords: { lat: number; lng: number }) => void,
  showNearbyDriversInMap: (lat?: number | null, lng?: number | null) => Promise<any>,
  toast: (options: ToastOptions) => void,
  pickupCoords: { lat: number; lng: number } | null,
) {
  if (typeof window === "undefined" || !navigator.geolocation) {
    toast({
      title: "No disponible",
      description: "Geolocalización no soportada en este dispositivo",
      variant: "destructive",
    })
    return
  }

  toast({ title: "Obteniendo ubicación rápida...", description: "Permitir acceso para mejorar la precisión" })

  const getPosition = (options: PositionOptions) =>
    new Promise<GeolocationPosition>((resolve, reject) => {
      try {
        navigator.geolocation.getCurrentPosition(resolve, reject, options)
      } catch (e) {
        reject(e)
      }
    })

  try {
    let pos: GeolocationPosition | null = null
    try {
      pos = await getPosition({ enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 })
    } catch (quickErr) {
      pos = null
    }

    if (pos) {
      const lat = pos.coords.latitude
      const lon = pos.coords.longitude
      setPickup("Ubicación actual")
      setPickupCoords({ lat, lng: lon })
      showNearbyDriversInMap(lat, lon).catch(() => {})
    }

    ;(async () => {
      try {
        const highPos = await getPosition({ enableHighAccuracy: true, timeout: 10000 })
        const highLat = highPos.coords.latitude
        const highLon = highPos.coords.longitude
        const shouldUpdateCoords = !pos || Math.abs((pos.coords.latitude ?? 0) - highLat) > 0.0005 || Math.abs((pos.coords.longitude ?? 0) - highLon) > 0.0005
        if (shouldUpdateCoords) {
          setPickupCoords({ lat: highLat, lng: highLon })
          showNearbyDriversInMap(highLat, highLon).catch(() => {})
        }
      } catch (highErr) {}
    })()

    ;(async () => {
      try {
        const coordsForReverse = ((): { lat: number; lon: number } | null => {
          const pc = pickupCoords
          if (pc) return { lat: pc.lat, lon: pc.lng }
          if (pos) return { lat: pos.coords.latitude, lon: pos.coords.longitude }
          return null
        })()

        if (!coordsForReverse) return

        const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY
        if (!apiKey) return

        const { lat, lon } = coordsForReverse
        try {
          const res = await fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${apiKey}`)
          if (!res.ok) return
          const data = await res.json()
          if (data?.features && data.features.length > 0) {
            const address = data.features[0].properties.formatted || "Ubicación actual"
            setPickup(address)
            toast({ title: "Ubicación actualizada", description: address })
          }
        } catch (err) {
          console.warn("Geoapify reverse geocode failed:", err)
        }
      } catch (err) {}
    })()

    if (!pos) {
      try {
        const fallback = await getPosition({ enableHighAccuracy: true, timeout: 10000 })
        const lat = fallback.coords.latitude
        const lon = fallback.coords.longitude
        setPickup("Ubicación actual")
        setPickupCoords({ lat, lng: lon })
        showNearbyDriversInMap(lat, lon).catch(() => {})
      } catch (fallbackErr) {
        console.error("Error obteniendo ubicación:", fallbackErr)
        toast({ title: "Error", description: "No fue posible obtener tu ubicación", variant: "destructive" })
      }
    }
  } catch (err: unknown) {
    console.error("Error en handleUseMyLocation:", err)
    toast({ title: "Error", description: "No fue posible obtener tu ubicación", variant: "destructive" })
  }
}