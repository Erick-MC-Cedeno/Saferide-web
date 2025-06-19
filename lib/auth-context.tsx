"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { type User, onAuthStateChanged } from "firebase/auth"
import { getFirebaseAuth, isFirebaseReady } from "./firebase"
import { getUserData } from "./auth"

interface AuthContextType {
  user: User | null
  userData: any | null
  userType: "passenger" | "driver" | null
  loading: boolean
  signOut: () => Promise<void>
  isFirebaseReady: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<any | null>(null)
  const [userType, setUserType] = useState<"passenger" | "driver" | null>(null)
  const [loading, setLoading] = useState(true)
  const [firebaseReady, setFirebaseReady] = useState(false)

  useEffect(() => {
    let unsubscribe: (() => void) | null = null
    let mounted = true

    const initializeAuth = () => {
      try {
        // Check if Firebase is ready
        const ready = isFirebaseReady()
        setFirebaseReady(ready)

        if (!ready) {
          
          setTimeout(() => {
            if (mounted) {
              initializeAuth()
            }
          }, 1000)
          return
        }

        // Get Firebase Auth instance
        const auth = getFirebaseAuth()

        if (!auth) {
          console.warn("Firebase Auth not available")
          setLoading(false)
          return
        }

        

        // Set up auth state listener
        unsubscribe = onAuthStateChanged(auth, async (user) => {
          try {
            if (user) {
              
              setUser(user)

              // Try to get user data from both tables
              let data = await getUserData(user.uid, "passenger")
              let type: "passenger" | "driver" = "passenger"

              if (!data) {
                data = await getUserData(user.uid, "driver")
                type = "driver"
              }

              setUserData(data)
              setUserType(type)

              // Set cookies for middleware
              if (typeof document !== "undefined") {
                document.cookie = `auth-token=${user.uid}; path=/; max-age=86400`
                document.cookie = `user-type=${type}; path=/; max-age=86400`
              }
            } else {
             
              setUser(null)
              setUserData(null)
              setUserType(null)

              // Clear cookies
              if (typeof document !== "undefined") {
                document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT"
                document.cookie = "user-type=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT"
              }
            }
          } catch (error) {
            console.error("Error handling auth state change:", error)
          } finally {
            if (mounted) {
              setLoading(false)
            }
          }
        })

        
      } catch (error) {
        console.error("Error initializing auth:", error)
        setFirebaseReady(false)
        if (mounted) {
          setLoading(false)
        }
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

  const signOut = async () => {
    try {
      const auth = getFirebaseAuth()
      if (auth) {
        await auth.signOut()
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
    isFirebaseReady: firebaseReady,
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
