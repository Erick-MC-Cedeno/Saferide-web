// EXPRESIÓN REGULAR PARA VALIDAR CONTRASEÑAS FUERTES: AL MENOS 8 CARACTERES, UNA MAYÚSCULA, UN NÚMERO Y UN CARÁCTER ESPECIAL
const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

// UTILIDADES DE AUTENTICACIÓN: FUNCIONES QUE INTERACTÚAN CON SUPABASE PARA AUTH Y GESTIÓN DE PERFILES EN LA BD
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

// REGISTRA UN NUEVO USUARIO: VALIDA CAMPOS (EMAIL, NOMBRE, CONTRASEÑA FUERTE), CREA LA CUENTA EN SUPABASE
// Y GUARDA LOS CAMPOS ADICIONALES EN LA TABLA CORRESPONDIENTE ('drivers' O 'passengers').
export const registerUser = async (userData: Omit<UserData, "uid">, password: string) => {
  try {
    if (!supabase) {
      return { success: false, error: "Servicios de autenticación no están disponibles." }
    }

    if (!strongPasswordRegex.test(password)) {
      return {
        success: false,
        error:
          "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial."
      }
    }

    if (!userData.phone || typeof userData.phone !== "string" || userData.phone.trim().length === 0) {
      console.warn("Registro sin teléfono o teléfono inválido:", userData.phone)
    }

    if (!userData.email || typeof userData.email !== "string" || !userData.email.includes("@")) {
      return { success: false, error: "El correo electrónico no es válido." }
    }

    if (!userData.name || typeof userData.name !== "string" || userData.name.trim().length < 2) {
      return { success: false, error: "El nombre es obligatorio y debe tener al menos 2 caracteres." }
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: userData.email,
      password,
      options: { data: { name: userData.name, phone: userData.phone, userType: userData.userType } },
    })

    if (signUpError) {
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
  } catch (error: unknown) {
    console.error("Registration error:", error)

    let errorMessage = "Error al crear la cuenta. "

    const err = error as { code?: string; message?: string } | undefined

    if (err?.code === "auth/email-already-in-use" || err?.message?.includes("duplicate")) {
      errorMessage = "Este correo electrónico ya está registrado."
    } else if (err?.code === "auth/weak-password") {
      errorMessage = "La contraseña debe tener al menos 6 caracteres."
    } else if (err?.code === "auth/invalid-email") {
      errorMessage = "El correo electrónico no es válido."
    } else {
      errorMessage += err?.message ?? String(error)
    }

    return { success: false, error: errorMessage }
  }
}

// INICIA SESIÓN CON EMAIL Y CONTRASEÑA USANDO SUPABASE; MAPEADO DE ERRORES A MENSAJES AMIGABLES EN ESPAÑOL
export const loginUser = async (email: string, password: string) => {
  try {
    if (!supabase) {
      return { success: false, error: "Servicios de autenticación no están disponibles." }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      let message = "Error al iniciar sesión. " + error.message

      if (error.message?.toLowerCase().includes("email not confirmed") || error.message?.toLowerCase().includes("not confirmed")) {
        message = "Tu correo electrónico no ha sido confirmado. Revisa tu bandeja de entrada (y la carpeta de spam) y confirma tu cuenta."
      } else if (error.message?.toLowerCase().includes("invalid")) {
        message = "Credenciales inválidas. Verifica tu correo y contraseña."
      }

      return { success: false, error: message }
    }

    return { success: true, user: data.user }
  } catch (error: unknown) {
    console.error("Login error:", error)

    let errorMessage = "Error al iniciar sesión. "
    const err = error as { code?: string; message?: string } | undefined

    if (err?.code === "auth/user-not-found" || err?.message?.toLowerCase().includes("not found")) {
      errorMessage = "No existe una cuenta con este correo electrónico."
    } else if (err?.code === "auth/wrong-password" || err?.message?.toLowerCase().includes("invalid password")) {
      errorMessage = "Contraseña incorrecta."
    } else if (err?.code === "auth/invalid-email") {
      errorMessage = "El correo electrónico no es válido."
    } else if (err?.code === "auth/too-many-requests") {
      errorMessage = "Demasiados intentos fallidos. Intenta más tarde."
    } else if (err?.code === "auth/invalid-credential") {
      errorMessage = "Credenciales inválidas. Verifica tu correo y contraseña."
    } else {
      errorMessage += err?.message ?? String(error)
    }

    return { success: false, error: errorMessage }
  }
}

// CIERRA LA SESIÓN ACTUAL EN SUPABASE Y RETORNA UN RESULTADO AMIGABLE
export const logoutUser = async () => {
  try {
    if (!supabase) return { success: false, error: "Servicios de autenticación no están disponibles." }

    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Error en Supabase signOut:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: unknown) {
    console.error("Logout error:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// OBTIENE LOS DATOS DEL USUARIO DESDE LA TABLA CORRESPONDIENTE ('drivers' O 'passengers'). DEVUELVE NULL SI NO HAY REGISTRO
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

    return data || null
  } catch (error: unknown) {
    console.error("Get user data error:", error)
    return null
  }
}
