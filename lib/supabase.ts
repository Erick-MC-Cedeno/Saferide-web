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
          // Configuración de cookies seguras
          storageKey: 'supabase-auth-token',
          storage: {
            getItem: (key) => {
              if (typeof window === 'undefined') return null
              return window.localStorage.getItem(key)
            },
            setItem: (key, value) => {
              if (typeof window === 'undefined') return
              window.localStorage.setItem(key, value)
              // Establecer una cookie segura para el token
              if (key === 'supabase-auth-token' && typeof document !== 'undefined') {
                try {
                  const data = JSON.parse(value)
                  if (data?.access_token) {
                    // Configurar cookie segura (HttpOnly se maneja en el servidor)
                    const isProduction = process.env.NODE_ENV === 'production'
                    document.cookie = `sb-access-token=${data.access_token}; Path=/; Max-Age=3600; ${isProduction ? 'Secure; ' : ''}SameSite=Lax`
                  }
                } catch (e) {
                  console.error('Error al procesar token para cookie:', e)
                }
              }
            },
            removeItem: (key) => {
              if (typeof window === 'undefined') return
              window.localStorage.removeItem(key)
              // Eliminar cookie si existe
              if (key === 'supabase-auth-token' && typeof document !== 'undefined') {
                document.cookie = `sb-access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}SameSite=Lax`
              }
            }
          }
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
