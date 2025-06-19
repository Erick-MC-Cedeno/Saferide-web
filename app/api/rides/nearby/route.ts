import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get("driverId")
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")
    const radius = searchParams.get("radius") || "10" // km

    if (!driverId) {
      return NextResponse.json({ error: "Driver ID is required" }, { status: 400 })
    }

    // Get pending rides
    // In a real app, you would use PostGIS functions for geospatial queries
    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .eq("status", "pending")
      .order("requested_at", { ascending: true })
      .limit(10)

    if (error) throw error

    return NextResponse.json({ rides: data || [] })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
