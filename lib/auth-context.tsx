"use client"

import React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import { getUserData } from "./auth"
import { supabase } from "./supabase"
import { setSecureCookie, removeSecureCookie, clearAuthData, setAuthInProgressCookie } from "./cookie-utils"

interface AuthContextType {
  user: any | null
  userData: any | null
  userType: "passenger" | "driver" | null
  loading: boolean
  signOut: () => Promise<void>
  isSupabaseReady: boolean
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [userData, setUserData] = useState<any | null>(null)
  const [userType, setUserType] = useState<"passenger" | "driver" | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabaseReady, setSupabaseReady] = useState(!!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
  const isLoadingUserData = useRef(false)

  const loadUserData = async (userId: string, source = "unknown") => {
    // Prevent multiple simultaneous loads
    if (isLoadingUserData.current) {
      return
    }

    isLoadingUserData.current = true

    try {
      // Try to get user data from both tables
      let data = await getUserData(userId, "passenger")
      let type: "passenger" | "driver" = "passenger"

      if (!data) {
        data = await getUserData(userId, "driver")
        type = "driver"
      }

      setUserData(data)
      setUserType(type)
    } catch (error) {
      console.error("Error loading user data:", error)
    } finally {
      isLoadingUserData.current = false
    }
  }

  const refreshUserData = async () => {
    if (!user?.uid) {
      return
    }

    await loadUserData(user.uid, "manual-refresh")
  }

  useEffect(() => {
    let unsubscribe: (() => void) | null = null
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Supabase readiness
        setSupabaseReady(!!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))

        // Verificar si hay una sesión activa primero
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const sbUser = session.user
          const userWithUid = { uid: sbUser.id, ...sbUser }
          setUser(userWithUid)
          await loadUserData(sbUser.id, "session-init")
          
          // Establecer cookie de autenticación con configuración segura y mayor duración
          // Usar httpOnly: false para que el middleware pueda acceder a la cookie
          setSecureCookie('auth-token', sbUser.id, { maxAge: 7 * 24 * 60 * 60, httpOnly: false })
          
          if (mounted) setLoading(false)
        }

        // Set up supabase auth state listener
        const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
          try {
            console.log("Auth state change event:", event)
            const sbUser = session?.user ?? null
            if (sbUser) {
              // For compatibility with existing code that expects `user.uid`, expose uid mapping
              // while still keeping the original Supabase user fields.
              const userWithUid = { uid: sbUser.id, ...sbUser }
              setUser(userWithUid)
              await loadUserData(sbUser.id, "auth-state-change")

              // Establecer cookie de autenticación con configuración segura y mayor duración
              // Usar httpOnly: false para que el middleware pueda acceder a la cookie
              setSecureCookie('auth-token', sbUser.id, { maxAge: 7 * 24 * 60 * 60, httpOnly: false })
            } else {
              setUser(null)
              setUserData(null)
              setUserType(null)
              isLoadingUserData.current = false

              // Eliminar cookies de autenticación de forma segura
              removeSecureCookie('auth-token')
              removeSecureCookie('user-type')
            }
          } catch (error) {
            console.error("Error handling supabase auth state change:", error)
          } finally {
            if (mounted) setLoading(false)
          }
        })

        // Store unsubscribe
        unsubscribe = () => {
          listener?.subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        if (mounted) setLoading(false)
      }
    }

    // Start initialization
    initializeAuth()

    return () => {
      mounted = false
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  // Update cookies when userType changes
  useEffect(() => {
    if (userType) {
      // Usar httpOnly: false para que el middleware pueda acceder a la cookie
      setSecureCookie('user-type', userType, { maxAge: 7 * 24 * 60 * 60, httpOnly: false })
    }
  }, [userType])

  const signOut = async () => {
    try {
      if (supabase) {
        // Primero limpiar el estado local para una respuesta inmediata en la UI
        setUser(null)
        setUserData(null)
        setUserType(null)
        isLoadingUserData.current = false

        // Establecer cookie de autenticación en proceso para permitir acceso a la página de login
        setAuthInProgressCookie()

        // Limpiar todas las cookies y localStorage relacionados con autenticación
        clearAuthData()

        // Luego realizar el cierre de sesión en Supabase
        const { error } = await supabase.auth.signOut()
        if (error) {
          throw error
        }
      }
    } catch (error) {
      console.error("Error signing out:", error)
      // Propagar el error para que pueda ser manejado por el componente que llama a esta función
      throw error
    }
  }


  const value = {
    user,
    userData,
    userType,
    loading,
    signOut,
    isSupabaseReady: supabaseReady,
    refreshUserData,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
