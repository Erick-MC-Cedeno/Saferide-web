// Firebase configuration with bulletproof initialization
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Singleton instances
let firebaseApp: FirebaseApp | null = null
let firebaseAuth: Auth | null = null
let firebaseDb: Firestore | null = null
let isInitialized = false
let isInitializing = false

// Check if configuration is valid
const isConfigValid = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  )
}

// Initialize Firebase synchronously
const initializeFirebaseSync = () => {
  // Only run on client side
  if (typeof window === "undefined") {
    return { app: null, auth: null, db: null }
  }

  // Check if already initialized
  if (isInitialized && firebaseApp && firebaseAuth && firebaseDb) {
    return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb }
  }

  // Prevent multiple initialization attempts
  if (isInitializing) {
    return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb }
  }

  // Check configuration
  if (!isConfigValid()) {
    console.warn("Firebase configuration is incomplete")
    return { app: null, auth: null, db: null }
  }

  try {
    isInitializing = true

    // Initialize Firebase App
    if (getApps().length === 0) {
      firebaseApp = initializeApp(firebaseConfig)
      
    } else {
      firebaseApp = getApp()
      
    }

    // Initialize Auth immediately after app
    if (firebaseApp) {
      firebaseAuth = getAuth(firebaseApp)
      
    }

    // Initialize Firestore
    if (firebaseApp) {
      firebaseDb = getFirestore(firebaseApp)
      
    }

    isInitialized = true
    

    return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb }
  } catch (error) {
    console.error("❌ Firebase initialization error:", error)

    // Reset everything on error
    firebaseApp = null
    firebaseAuth = null
    firebaseDb = null
    isInitialized = false

    return { app: null, auth: null, db: null }
  } finally {
    isInitializing = false
  }
}

// Initialize immediately if on client side
if (typeof window !== "undefined") {
  initializeFirebaseSync()
}

// Export getter functions
export const getFirebaseApp = (): FirebaseApp | null => {
  if (typeof window === "undefined") return null

  if (!isInitialized) {
    const { app } = initializeFirebaseSync()
    return app
  }

  return firebaseApp
}

export const getFirebaseAuth = (): Auth | null => {
  if (typeof window === "undefined") return null

  if (!isInitialized) {
    const { auth } = initializeFirebaseSync()
    return auth
  }

  return firebaseAuth
}

export const getFirebaseDb = (): Firestore | null => {
  if (typeof window === "undefined") return null

  if (!isInitialized) {
    const { db } = initializeFirebaseSync()
    return db
  }

  return firebaseDb
}

// Check if Firebase is ready
export const isFirebaseReady = (): boolean => {
  return isInitialized && !!(firebaseApp && firebaseAuth && firebaseDb)
}

// Force re-initialization (for error recovery)
export const reinitializeFirebase = () => {
  isInitialized = false
  isInitializing = false
  firebaseApp = null
  firebaseAuth = null
  firebaseDb = null

  return initializeFirebaseSync()
}

// Export instances for backward compatibility
export const auth = firebaseAuth
export const db = firebaseDb
export default firebaseApp
