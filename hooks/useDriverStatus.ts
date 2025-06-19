"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export function useDriverStatus(driverId: string) {
  const [isOnline, setIsOnline] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if Supabase is available
    if (!supabase) {
      console.warn("Supabase not available, using default offline status")
      setLoading(false)
      return
    }

    // Cargar estado inicial
    const loadDriverStatus = async () => {
      try {
        const { data, error } = await supabase.from("drivers").select("is_online").eq("uid", driverId).single()

        if (error) throw error
        setIsOnline(data.is_online)
      } catch (error) {
        console.error("Error loading driver status:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDriverStatus()
  }, [driverId])

  const updateOnlineStatus = async (online: boolean) => {
    if (!supabase) {
      console.warn("Supabase not available, cannot update driver status")
      return { success: false, error: "Database not available" }
    }

    try {
      const { error } = await supabase.from("drivers").update({ is_online: online }).eq("uid", driverId)

      if (error) throw error
      setIsOnline(online)
      return { success: true }
    } catch (error: any) {
      console.error("Error updating driver status:", error)
      return { success: false, error: error.message }
    }
  }

  return { isOnline, loading, updateOnlineStatus }
}
