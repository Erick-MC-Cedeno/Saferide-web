import { type NextRequest, NextResponse } from "next/server"
import { updateDriverOnlineStatus } from "@/lib/rides"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { driverId, isOnline } = body

    if (!driverId || typeof isOnline !== "boolean") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await updateDriverOnlineStatus(driverId, isOnline)

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
