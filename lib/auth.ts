// Authentication utilities with robust Firebase handling
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth"
import { getFirebaseAuth, isFirebaseReady } from "./firebase"
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
    // Check if Firebase is ready
    if (!isFirebaseReady()) {
      return {
        success: false,
        error: "Los servicios de autenticación no están disponibles. Por favor, intenta más tarde.",
      }
    }

    const auth = getFirebaseAuth()

    if (!auth) {
      return {
        success: false,
        error: "Firebase Auth no está disponible. Por favor, verifica tu configuración.",
      }
    }

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password)
    const user = userCredential.user

    // Save additional user data to Supabase (only if Supabase is available)
    if (supabase) {
      if (userData.userType === "driver") {
        const { error } = await supabase.from("drivers").insert({
          uid: user.uid,
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          license_number: userData.licenseNumber!,
          vehicle_plate: userData.vehiclePlate!,
          vehicle_model: userData.vehicleModel!,
          vehicle_year: userData.vehicleYear!,
          is_verified: false,
          rating: 0,
          total_trips: 0,
          is_online: false,
        })

        if (error) throw error
      } else {
        const { error } = await supabase.from("passengers").insert({
          uid: user.uid,
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          rating: 0,
          total_trips: 0,
        })

        if (error) throw error
      }
    } else {
      console.warn("Supabase not available, user data not saved to database")
    }

    return { success: true, user }
  } catch (error: any) {
    console.error("Registration error:", error)

    // Provide more specific error messages
    let errorMessage = "Error al crear la cuenta. "

    if (error.code === "auth/email-already-in-use") {
      errorMessage = "Este correo electrónico ya está registrado."
    } else if (error.code === "auth/weak-password") {
      errorMessage = "La contraseña debe tener al menos 6 caracteres."
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "El correo electrónico no es válido."
    } else {
      errorMessage += error.message
    }

    return { success: false, error: errorMessage }
  }
}

export const loginUser = async (email: string, password: string) => {
  try {
    // Check if Firebase is ready
    if (!isFirebaseReady()) {
      return {
        success: false,
        error: "Los servicios de autenticación no están disponibles. Por favor, intenta más tarde.",
      }
    }

    const auth = getFirebaseAuth()

    if (!auth) {
      return {
        success: false,
        error: "Firebase Auth no está disponible. Por favor, verifica tu configuración.",
      }
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { success: true, user: userCredential.user }
  } catch (error: any) {
    console.error("Login error:", error)

    // Provide more specific error messages
    let errorMessage = "Error al iniciar sesión. "

    if (error.code === "auth/user-not-found") {
      errorMessage = "No existe una cuenta con este correo electrónico."
    } else if (error.code === "auth/wrong-password") {
      errorMessage = "Contraseña incorrecta."
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "El correo electrónico no es válido."
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Demasiados intentos fallidos. Intenta más tarde."
    } else if (error.code === "auth/invalid-credential") {
      errorMessage = "Credenciales inválidas. Verifica tu correo y contraseña."
    } else {
      errorMessage += error.message
    }

    return { success: false, error: errorMessage }
  }
}

export const logoutUser = async () => {
  try {
    const auth = getFirebaseAuth()

    if (!auth) {
      return { success: false, error: "Firebase Auth no está disponible." }
    }

    await signOut(auth)
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
    const { data, error } = await supabase.from(table).select("*").eq("uid", uid).single()

    if (error) {
      // Don't throw error if user not found, just return null
      if (error.code === "PGRST116") {
        return null
      }
      throw error
    }
    return data
  } catch (error) {
    console.error("Get user data error:", error)
    return null
  }
}
