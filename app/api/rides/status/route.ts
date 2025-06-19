import { type NextRequest, NextResponse } from "next/server"
import { updateRideStatus } from "@/lib/rides"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rideId, status } = body

    if (!rideId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const validStatuses = ["pending", "accepted", "in-progress", "completed", "cancelled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const result = await updateRideStatus(rideId, status)

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
