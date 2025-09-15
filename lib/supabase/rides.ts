// UTILIDADES PARA GESTIÓN DE VIAJES (RIDES) USANDO SUPABASE: CREAR, ACEPTAR, ACTUALIZAR Y CONSULTAR
import { supabase } from "../../lib/supabase"

export interface RideRequest {
  id?: string
  passenger_id: string
  passenger_name: string
  pickup_address: string
  pickup_coordinates: [number, number] // [longitude, latitude]
  destination_address: string
  destination_coordinates: [number, number]
  status: "pending" | "accepted" | "in-progress" | "completed" | "cancelled"
  driver_id?: string
  driver_name?: string
  estimated_fare: number
  actual_fare?: number
  estimated_duration: number
  requested_at?: string
  accepted_at?: string
  completed_at?: string
  passenger_rating?: number
  driver_rating?: number
}

// CREA UNA SOLICITUD DE VIAJE Y RETORNA EL ID DEL NUEVO VIAJE
export const createRideRequest = async (rideData: Omit<RideRequest, "id" | "requested_at">) => {
  try {
    const { data, error } = await supabase
      .from("rides")
      .insert({
        passenger_id: rideData.passenger_id,
        passenger_name: rideData.passenger_name,
        pickup_address: rideData.pickup_address,
        pickup_coordinates: rideData.pickup_coordinates,
        destination_address: rideData.destination_address,
        destination_coordinates: rideData.destination_coordinates,
        status: rideData.status,
        estimated_fare: rideData.estimated_fare,
        estimated_duration: rideData.estimated_duration,
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, rideId: data.id }
  } catch (error: unknown) {
    console.error("Create ride request error:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// ACEPTA UNA SOLICITUD DE VIAJE: ASIGNA DRIVER, CAMBIA ESTADO A 'accepted' Y REGISTRA accepted_at
export const acceptRideRequest = async (rideId: string, driverId: string, driverName: string) => {
  try {
    const { error } = await supabase
      .from("rides")
      .update({
        driver_id: driverId,
        driver_name: driverName,
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", rideId)
      .eq("status", "pending")

    if (error) throw error

    return { success: true }
  } catch (error: unknown) {
    console.error("Accept ride request error:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// ACTUALIZA EL ESTADO DE UN VIAJE; SI SE MARCA COMO 'completed' SE REGISTRA completed_at
export const updateRideStatus = async (rideId: string, status: RideRequest["status"]) => {
  try {
  const updateData: { status: RideRequest["status"]; completed_at?: string } = { status }
    if (status === "completed") {
      updateData.completed_at = new Date().toISOString()
    }

    const { error } = await supabase.from("rides").update(updateData).eq("id", rideId)

    if (error) throw error

    return { success: true }
  } catch (error: unknown) {
    console.error("Update ride status error:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// OBTIENE EL HISTORIAL DE VIAJES PARA UN USUARIO (PASAJERO O CONDUCTOR)
export const getRideHistory = async (userId: string, userType: "passenger" | "driver") => {
  try {
    const column = userType === "passenger" ? "passenger_id" : "driver_id"

    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .eq(column, userId)
      .order("requested_at", { ascending: false })
      .limit(20)

    if (error) throw error

    return data || []
  } catch (error: unknown) {
    console.error("Get ride history error:", error)
    return []
  }
}

// OBTIENE VIAJES PENDIENTES (BÚSQUEDA SIMPLE; EN PRODUCCIÓN USAR QUERIES GEOSPACIALES)
export const getPendingRides = async (driverLocation?: [number, number]) => {
  // driverLocation is an optional hint for future geospatial filtering; reference it to avoid lint warnings
  void driverLocation
  try {
    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .eq("status", "pending")
      .order("requested_at", { ascending: true })
      .limit(10)

    if (error) throw error

    return data || []
  } catch (error: unknown) {
    console.error("Get pending rides error:", error)
    return []
  }
}

// ACTUALIZA LA UBICACIÓN DEL CONDUCTOR (GUARDADA COMO GEOJSON POINT EN current_location)
export const updateDriverLocation = async (driverId: string, location: [number, number]) => {
  try {
    const { error } = await supabase
      .from("drivers")
      .update({
        current_location: {
          type: "Point",
          coordinates: location,
        },
      })
      .eq("uid", driverId)

    if (error) throw error

    return { success: true }
  } catch (error: unknown) {
    console.error("Update driver location error:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// ACTUALIZA EL ESTADO ONLINE DEL CONDUCTOR
export const updateDriverOnlineStatus = async (driverId: string, isOnline: boolean) => {
  try {
    const { error } = await supabase.from("drivers").update({ is_online: isOnline }).eq("uid", driverId)

    if (error) throw error

    return { success: true }
  } catch (error: unknown) {
    console.error("Update driver online status error:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}