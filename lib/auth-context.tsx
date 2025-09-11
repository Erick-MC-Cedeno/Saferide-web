"use client"

import React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import { getUserData } from "./auth"
import { supabase } from "./supabase"

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

    const initializeAuth = () => {
      try {
        // Supabase readiness
        setSupabaseReady(!!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))

        // Set up supabase auth state listener
        const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
          try {
            const sbUser = session?.user ?? null
            if (sbUser) {
              // For compatibility with existing code that expects `user.uid`, expose uid mapping
              // while still keeping the original Supabase user fields.
              const userWithUid = { uid: sbUser.id, ...sbUser }
              setUser(userWithUid)
              await loadUserData(sbUser.id, "auth-state-change")

              if (typeof document !== "undefined") {
                document.cookie = `auth-token=${sbUser.id}; path=/; max-age=86400`
              }
            } else {
              setUser(null)
              setUserData(null)
              setUserType(null)
              isLoadingUserData.current = false

              if (typeof document !== "undefined") {
                document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT"
                document.cookie = "user-type=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT"
              }
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
    if (userType && typeof document !== "undefined") {
      document.cookie = `user-type=${userType}; path=/; max-age=86400`
    }
  }, [userType])

  const signOut = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut()
      }
    } catch (error) {
      console.error("Error signing out:", error)
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
