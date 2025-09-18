"use client"

import React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import { getUserData } from "./auth"
import { supabase } from "./supabase"

interface AuthContextType {
  // user: partial supabase user with uid and any other properties as unknown
  user: ({ uid: string } & Record<string, unknown>) | null
  userData: Record<string, unknown> | null
  userType: "passenger" | "driver" | null
  loading: boolean
  signOut: () => Promise<void>
  isSupabaseReady: boolean
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<({ uid: string } & Record<string, unknown>) | null>(null)
  const [userData, setUserData] = useState<Record<string, unknown> | null>(null)
  const [userType, setUserType] = useState<"passenger" | "driver" | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabaseReady, setSupabaseReady] = useState(!!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
  const isLoadingUserData = useRef(false)

  // CARGA LOS DATOS DEL USUARIO DESDE SUPABASE: INTENTA PRIMERO EN LA TABLA 'PASSENGER' Y LUEGO EN 'DRIVER'.
  // EVITA CARGAS SIMULTÁNEAS USANDO UN FLAG, ACTUALIZA EL ESTADO LOCAL CON LOS DATOS Y EL TIPO DE USUARIO.
  const loadUserData = async (userId: string, source = "unknown") => {
    if (isLoadingUserData.current) {
      return
    }

    isLoadingUserData.current = true
    // use the `source` param in a no-op to satisfy the linter when it's only used for diagnostics
    void source

  try {
      let data = await getUserData(userId, "passenger")
      let type: "passenger" | "driver" = "passenger"

      if (!data) {
        data = await getUserData(userId, "driver")
        type = "driver"
      }

      setUserData(data)
      setUserType(type)
    } catch (error: unknown) {
      console.error("Error loading user data:", error)
    } finally {
      isLoadingUserData.current = false
    }
  }

  // REFRESCA LOS DATOS DEL USUARIO ACTUAL LLAMANDO A loadUserData SI HAY UN USUARIO AUTENTICADO.
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
        // INICIALIZA EL ESTADO DE AUTENTICACIÓN: VERIFICA LA DISPONIBILIDAD DE SUPABASE, CARGA LA SESIÓN ACTIVA SI EXISTE
        // Y CONFIGURA UN LISTENER PARA CAMBIOS EN EL ESTADO DE AUTENTICACIÓN.
        setSupabaseReady(!!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))

        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const sbUser = session.user
          const userWithUid = { uid: sbUser.id, ...sbUser }
          setUser(userWithUid)
          await loadUserData(sbUser.id, "session-init")

          if (mounted) setLoading(false)
        }

        // LISTENER QUE SINCRONIZA EL ESTADO DE AUTH DE SUPABASE CON EL ESTADO LOCAL
        const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
          try {
            const sbUser = session?.user ?? null
            if (sbUser) {
              const userWithUid = { uid: sbUser.id, ...sbUser }
              setUser(userWithUid)
              await loadUserData(sbUser.id, "auth-state-change")
            } else {
              setUser(null)
              setUserData(null)
              setUserType(null)
              isLoadingUserData.current = false
            }
          } catch (error: unknown) {
            console.error("Error handling supabase auth state change:", error)
          } finally {
            if (mounted) setLoading(false)
          }
        })

        unsubscribe = () => {
          listener?.subscription.unsubscribe()
        }

        if (mounted) setLoading(false)
      } catch (error: unknown) {
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
      // Do not write userType to cookies. Keep role in memory/state only.
    }
  }, [userType])

  
  // CIERRA LA SESSION ACTUAL Y LIMPIA EL ESTADO LOCAL
  const signOut = async () => {
    if (!supabase) return

    try {
      // Llamar a Supabase para cerrar la sesión primero
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out from supabase:', error)
        throw error
      }

      // Limpiar estado local sólo después de confirmar el sign out
      setUser(null)
      setUserData(null)
      setUserType(null)
      isLoadingUserData.current = false

      // Limpieza adicional: eliminar keys específicas en storage si se usan (no forzar globalmente)
      try {
        // Por seguridad, sólo limpiar claves conocidas. Añadir aquí si existen:
        // localStorage.removeItem('some_app_key')
      } catch (e) {
        // ignore storage cleanup errors
      }
    } catch (err) {
      console.error('Error during signOut:', err)
      // Re-lanzar para que el componente UI pueda manejarlo (ej. mostrar toast)
      throw err
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
