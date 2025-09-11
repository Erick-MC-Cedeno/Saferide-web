// Authentication utilities using Supabase for auth and Supabase DB for user profiles
import { supabase } from "./supabase"

export interface UserData {
  uid: string
  email: string
  name: string
  phone: string
  userType: "passenger" | "driver"
  // Driver specific fields
  licenseNumber?: string
  vehiclePlate?: string
  vehicleModel?: string
  vehicleYear?: string
  isVerified?: boolean
  rating?: number
  totalTrips?: number
}

export const registerUser = async (userData: Omit<UserData, "uid">, password: string) => {
  try {
    if (!supabase) {
      return { success: false, error: "Servicios de autenticación no están disponibles." }
    }

    // Create user in Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: userData.email,
      password,
      options: { data: { name: userData.name, phone: userData.phone, userType: userData.userType } },
    })

    if (signUpError) {
      // Map common Supabase errors to friendly messages
      let message = "Error al crear la cuenta. " + signUpError.message
      if (signUpError.message?.includes("duplicate")) {
        message = "Este correo electrónico ya está registrado."
      }
      return { success: false, error: message }
    }

    const user = signUpData.user
    if (!user) {
      return { success: false, error: "No se pudo crear el usuario. Revisa la configuración de Supabase." }
    }

    // Save additional user data to Supabase database tables
    if (userData.userType === "driver") {
      const { error } = await supabase.from("drivers").insert({
        uid: user.id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        license_number: userData.licenseNumber || null,
        vehicle_plate: userData.vehiclePlate || null,
        vehicle_model: userData.vehicleModel || null,
        vehicle_year: userData.vehicleYear || null,
        is_verified: false,
        rating: 0,
        total_trips: 0,
        is_online: false,
      })

      if (error) throw error
    } else {
      const { error } = await supabase.from("passengers").insert({
        uid: user.id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        rating: 0,
        total_trips: 0,
      })

      if (error) throw error
    }

    return { success: true, user }
  } catch (error: any) {
    console.error("Registration error:", error)

    // Provide more specific error messages
    let errorMessage = "Error al crear la cuenta. "

    // Map Firebase-specific codes where possible, otherwise fall back to error.message
    if (error?.code === "auth/email-already-in-use" || error?.message?.includes("duplicate")) {
      errorMessage = "Este correo electrónico ya está registrado."
    } else if (error?.code === "auth/weak-password") {
      errorMessage = "La contraseña debe tener al menos 6 caracteres."
    } else if (error?.code === "auth/invalid-email") {
      errorMessage = "El correo electrónico no es válido."
    } else {
      errorMessage += error.message
    }

    return { success: false, error: errorMessage }
  }
}

export const loginUser = async (email: string, password: string) => {
  try {
    if (!supabase) {
      return { success: false, error: "Servicios de autenticación no están disponibles." }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      // Handle common Supabase auth errors with friendly Spanish messages
      let message = "Error al iniciar sesión. " + error.message

      if (error.message?.toLowerCase().includes("email not confirmed") || error.message?.toLowerCase().includes("not confirmed")) {
        message = "Tu correo electrónico no ha sido confirmado. Revisa tu bandeja de entrada (y la carpeta de spam) y confirma tu cuenta."
      } else if (error.message?.toLowerCase().includes("invalid")) {
        message = "Credenciales inválidas. Verifica tu correo y contraseña."
      }

      return { success: false, error: message }
    }

    return { success: true, user: data.user }
  } catch (error: any) {
    console.error("Login error:", error)

    // Provide more specific error messages
    let errorMessage = "Error al iniciar sesión. "

    if (error?.code === "auth/user-not-found" || error?.message?.toLowerCase().includes("not found")) {
      errorMessage = "No existe una cuenta con este correo electrónico."
    } else if (error?.code === "auth/wrong-password" || error?.message?.toLowerCase().includes("invalid password")) {
      errorMessage = "Contraseña incorrecta."
    } else if (error?.code === "auth/invalid-email") {
      errorMessage = "El correo electrónico no es válido."
    } else if (error?.code === "auth/too-many-requests") {
      errorMessage = "Demasiados intentos fallidos. Intenta más tarde."
    } else if (error?.code === "auth/invalid-credential") {
      errorMessage = "Credenciales inválidas. Verifica tu correo y contraseña."
    } else {
      errorMessage += error.message
    }

    return { success: false, error: errorMessage }
  }
}

export const logoutUser = async () => {
  try {
  if (!supabase) return { success: false, error: "Servicios de autenticación no están disponibles." }

  const { error } = await supabase.auth.signOut()
  if (error) return { success: false, error: error.message }

  return { success: true }
  } catch (error: any) {
    console.error("Logout error:", error)
    return { success: false, error: error.message }
  }
}

export const getUserData = async (uid: string, userType: "passenger" | "driver") => {
  try {
    if (!supabase) {
      console.warn("Supabase not available, returning null user data")
      return null
    }

    const table = userType === "driver" ? "drivers" : "passengers"
    const { data, error } = await supabase.from(table).select("*").eq("uid", uid).maybeSingle()

    if (error) {
      console.warn("Error fetching user data:", error)
      return null
    }

    // data may be null when no record exists
    return data || null
  } catch (error) {
    console.error("Get user data error:", error)
    return null
  }
}
