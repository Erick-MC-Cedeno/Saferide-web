import { type NextRequest, NextResponse } from "next/server"
import { updateDriverLocation } from "@/lib/rides"


// HANDLER PARA LA SOLICITUD POST - ACTUALIZAR LA UBICACIÓN DEL CONDUCTOR
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { driverId, location } = body as { driverId?: unknown; location?: unknown }

    if (typeof driverId !== "string") {
      return NextResponse.json({ error: "Missing or invalid driverId" }, { status: 400 })
    }

    if (!location || !Array.isArray(location) || location.length !== 2) {
      return NextResponse.json({ error: "Missing required fields or invalid location" }, { status: 400 })
    }

    // Convert and validate each coordinate to number
    const lon = Number(location[0])
    const lat = Number(location[1])
    if (!isFinite(lon) || !isFinite(lat)) {
      return NextResponse.json({ error: "Location values must be valid numbers" }, { status: 400 })
    }

    const locTuple: [number, number] = [lon, lat]

    const result = await updateDriverLocation(driverId, locTuple)

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
