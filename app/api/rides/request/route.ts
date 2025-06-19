import { type NextRequest, NextResponse } from "next/server"
import { createRideRequest } from "@/lib/rides"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      passenger_id,
      passenger_name,
      pickup_address,
      pickup_coordinates,
      destination_address,
      destination_coordinates,
      estimated_fare,
      estimated_duration,
    } = body

    // Validate required fields
    if (!passenger_id || !passenger_name || !pickup_address || !destination_address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await createRideRequest({
      passenger_id,
      passenger_name,
      pickup_address,
      pickup_coordinates: pickup_coordinates || [0, 0],
      destination_address,
      destination_coordinates: destination_coordinates || [0, 0],
      status: "pending",
      estimated_fare: estimated_fare || 0,
      estimated_duration: estimated_duration || 0,
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        rideId: result.rideId,
      })
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
