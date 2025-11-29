"use client"

import type { Database } from "@/lib/supabase"

// Helper type for ride rows
export type RideRow = Database["public"]["Tables"]["rides"]["Row"]

export type DriverApi = {
  id?: string | number
  uid?: string
  name?: string
  full_name?: string
  driver_name?: string
  current_location?: { coordinates?: number[] }
  location?: { coordinates?: number[] }
  coordinates?: number[] | null
  lat?: number | string
  lng?: number | string
  is_online?: boolean
  is_verified?: boolean
  rating?: number
  vehicle_model?: string
}

export type DriverDataResult = {
  success: boolean
  data?: DriverApi[]
  error?: string
  noRangesConfigured?: boolean
}

export type NewRidePayload = {
  passenger_id: string
  passenger_name?: string
  pickup_address: string
  pickup_coordinates: [number, number]
  destination_address: string
  destination_coordinates: [number, number]
  status: string
  estimated_fare?: number
  estimated_duration?: number
  driver_id?: string
  driver_name?: string
  accepted_at?: string
}

export type RideStatus = "idle" | "searching" | "pending" | "accepted" | "in-progress"

// Extend window for webkitAudioContext and audioContext storage used by unlock logic
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
    audioContext?: AudioContext
  }
}