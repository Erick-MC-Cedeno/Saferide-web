import { type NextRequest, NextResponse } from "next/server"
import { updateDriverLocation } from "@/lib/rides"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { driverId, location } = body

    if (!driverId || !location || !Array.isArray(location) || location.length !== 2) {
      return NextResponse.json({ error: "Missing required fields or invalid location" }, { status: 400 })
    }

    const result = await updateDriverLocation(driverId, location)

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
