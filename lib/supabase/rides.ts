// Ride management utilities with Supabase
import { supabase } from "./supabase"

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
  } catch (error: any) {
    console.error("Create ride request error:", error)
    return { success: false, error: error.message }
  }
}

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
  } catch (error: any) {
    console.error("Accept ride request error:", error)
    return { success: false, error: error.message }
  }
}
