import { type NextRequest, NextResponse } from "next/server"
import { acceptRideRequest } from "@/lib/rides"


// HANDLER PARA LA SOLICITUD POST - ACEPTAR UNA SOLICITUD DE VIAJE
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { rideId, driverId, driverName } = body

    if (!rideId || !driverId || !driverName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await acceptRideRequest(rideId, driverId, driverName)

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to accept ride" }, { status: 500 })
    }
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
