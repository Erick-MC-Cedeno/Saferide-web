import { createClient } from "@supabase/supabase-js"

// Verify that the environment variables are defined
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a singleton for the client of Supabase
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const getSupabase = () => {
  if (!supabaseInstance && supabaseUrl && supabaseAnonKey) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        realtime: {
          params: {
            eventsPerSecond: 2, // Reducir eventos por segundo
          },
        },
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        global: {
          headers: {
            "x-client-info": "saferide-web@1.0.0",
          },
        },
      })
    } catch (error) {
      console.error("Error initializing Supabase:", error)
    }
  }
  return supabaseInstance
}

// Export the client of Supabase for direct use with fallback
export const supabase = getSupabase()

// If Supabase is not configured, log a warning but don't throw an error
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase configuration is incomplete. Some features may not work. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.",
  )
}

// Database types
export interface Database {
  public: {
    Tables: {
      passengers: {
        Row: {
          id: string
          uid: string
          email: string
          name: string
          phone: string
          rating: number
          total_trips: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          uid: string
          email: string
          name: string
          phone: string
          rating?: number
          total_trips?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          uid?: string
          email?: string
          name?: string
          phone?: string
          rating?: number
          total_trips?: number
          created_at?: string
          updated_at?: string
        }
      }
      drivers: {
        Row: {
          id: string
          uid: string
          email: string
          name: string
          phone: string
          license_number: string
          vehicle_plate: string
          vehicle_model: string
          vehicle_year: string
          is_verified: boolean
          rating: number
          total_trips: number
          is_online: boolean
          current_location: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          uid: string
          email: string
          name: string
          phone: string
          license_number: string
          vehicle_plate: string
          vehicle_model: string
          vehicle_year: string
          is_verified?: boolean
          rating?: number
          total_trips?: number
          is_online?: boolean
          current_location?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          uid?: string
          email?: string
          name?: string
          phone?: string
          license_number?: string
          vehicle_plate?: string
          vehicle_model?: string
          vehicle_year?: string
          is_verified?: boolean
          rating?: number
          total_trips?: number
          is_online?: boolean
          current_location?: any
          created_at?: string
          updated_at?: string
        }
      }
      rides: {
        Row: {
          id: string
          passenger_id: string
          passenger_name: string
          driver_id: string | null
          driver_name: string | null
          pickup_address: string
          pickup_coordinates: any
          destination_address: string
          destination_coordinates: any
          status: "pending" | "accepted" | "in-progress" | "completed" | "cancelled"
          estimated_fare: number
          actual_fare: number | null
          estimated_duration: number
          requested_at: string
          accepted_at: string | null
          completed_at: string | null
          passenger_rating: number | null
          driver_rating: number | null
          passenger_comment: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          passenger_id: string
          passenger_name: string
          driver_id?: string | null
          driver_name?: string | null
          pickup_address: string
          pickup_coordinates: any
          destination_address: string
          destination_coordinates: any
          status?: "pending" | "accepted" | "in-progress" | "completed" | "cancelled"
          estimated_fare: number
          actual_fare?: number | null
          estimated_duration: number
          requested_at?: string
          accepted_at?: string | null
          completed_at?: string | null
          passenger_rating?: number | null
          driver_rating?: number | null
          passenger_comment?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          passenger_id?: string
          passenger_name?: string
          driver_id?: string | null
          driver_name?: string | null
          pickup_address?: string
          pickup_coordinates?: any
          destination_address?: string
          destination_coordinates?: any
          status?: "pending" | "accepted" | "in-progress" | "completed" | "cancelled"
          estimated_fare?: number
          actual_fare?: number | null
          estimated_duration?: number
          requested_at?: string
          accepted_at?: string | null
          completed_at?: string | null
          passenger_rating?: number | null
          driver_rating?: number | null
          passenger_comment?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ride_messages: {
        Row: {
          id: string
          ride_id: string
          sender_id: string
          sender_name: string
          sender_type: "passenger" | "driver"
          message: string
          created_at: string
          read_at: string | null
        }
        Insert: {
          id?: string
          ride_id: string
          sender_id: string
          sender_name: string
          sender_type: "passenger" | "driver"
          message: string
          created_at?: string
          read_at?: string | null
        }
        Update: {
          id?: string
          ride_id?: string
          sender_id?: string
          sender_name?: string
          sender_type?: "passenger" | "driver"
          message?: string
          created_at?: string
          read_at?: string | null
        }
      }
    }
  }
}
