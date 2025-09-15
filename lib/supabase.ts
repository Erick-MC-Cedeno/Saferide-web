import { createClient } from "@supabase/supabase-js"

// LEE LAS VARIABLES DE ENTORNO PARA CONFIGURAR SUPABASE
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// SINGLETON DEL CLIENTE DE SUPABASE PARA EVITAR MÚLTIPLES INSTANCIAS
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const getSupabase = () => {
  if (!supabaseInstance && supabaseUrl && supabaseAnonKey) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        realtime: {
          params: {
            eventsPerSecond: 2,
          },
        },
        auth: {
          // CONFIGURACIÓN DE AUTH: PERSISTENCIA DE SESIONES Y DETECCIÓN AUTOMÁTICA EN URL
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
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

// EXPORTACIÓN DEL CLIENTE DE SUPABASE (FALLBACK MEDIANTE LA FUNCIÓN getSupabase)
export const supabase = getSupabase()

// SI FALTAN VARIABLES DE ENTORNO, SE EMITE UNA ADVERTENCIA (NO LANZAMOS EXCEPCIÓN)
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase configuration is incomplete. Some features may not work. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.",
  )
}

// TIPOS DE BASE DE DATOS (TIPADO EXPLÍCITO DE TABLAS): passengers, drivers, rides, ride_messages
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
          // GeoJSON-like or PostGIS point; use unknown and validate where needed
          current_location: unknown
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
          // GeoJSON-like or PostGIS point; use unknown and validate where needed
          current_location?: unknown
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
          // GeoJSON-like or PostGIS point; use unknown and validate where needed
          current_location?: unknown
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
          // [lng, lat] pair or similar; keep as unknown and validate at usage
          pickup_coordinates: unknown
          destination_address: string
          // [lng, lat] pair or similar; keep as unknown and validate at usage
          destination_coordinates: unknown
          status: "pending" | "accepted" | "in-progress" | "completed" | "cancelled"
          estimated_fare: number
          actual_fare: number | null
          estimated_duration: number
          requested_at: string
          accepted_at: string | null
          completed_at: string | null
          passenger_rating: number | null
          driver_comment: string | null
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
          // [lng, lat] pair or similar; keep as unknown and validate at usage
          pickup_coordinates: unknown
          destination_address: string
          // [lng, lat] pair or similar; keep as unknown and validate at usage
          destination_coordinates: unknown
          status?: "pending" | "accepted" | "in-progress" | "completed" | "cancelled"
          estimated_fare: number
          actual_fare?: number | null
          estimated_duration: number
          requested_at?: string
          accepted_at?: string | null
          completed_at?: string | null
          passenger_rating?: number | null
          driver_comment?: string | null
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
          // [lng, lat] pair or similar; keep as unknown and validate at usage
          pickup_coordinates?: unknown
          destination_address?: string
          // [lng, lat] pair or similar; keep as unknown and validate at usage
          destination_coordinates?: unknown
          status?: "pending" | "accepted" | "in-progress" | "completed" | "cancelled"
          estimated_fare?: number
          actual_fare?: number | null
          estimated_duration?: number
          requested_at?: string
          accepted_at?: string | null
          completed_at?: string | null
          passenger_rating?: number | null
          driver_comment?: string | null
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
