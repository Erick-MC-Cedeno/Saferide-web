import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"


// HANDLER PARA LA SOLICITUD GET - OBTENER TODOS LOS VIAJES EN UN RADIO
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get("driverId")
  // Note: radius-based filtering will be implemented later in this route.
  // The params below were previously parsed but not used; keep driverId for now.

    if (!driverId) {
      return NextResponse.json({ error: "Driver ID is required" }, { status: 400 })
    }

    // IMPLEMENT THE RADIUS SEARCH HERE FOR NOW THIS METHOD ES BEING IMPLEMNENTED IN API/DRIVERS/ALL
    
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
