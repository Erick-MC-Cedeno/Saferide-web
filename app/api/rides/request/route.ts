import { type NextRequest, NextResponse } from "next/server"
import { createRideRequest } from "@/lib/rides"


// HANDLER PARA LA SOLICITUD POST - CREAR UNA NUEVA SOLICITUD DE VIAJE
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

    // VERIFICAR QUE SEAN TODOS LOS CAMPOS PRESENTES
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
      // allow caller to pass driver assignment (will be optional)
      driver_id: body.driver_id,
      driver_name: body.driver_name,
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
