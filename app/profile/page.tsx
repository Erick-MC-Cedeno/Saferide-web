"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  User,
  Mail,
  Phone,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Car,
  Shield,
  Edit3,
  Save,
  X,
  Camera,
  Award,
  TrendingUp,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Menu,
  Settings,
  LogOut,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useToast } from "@/hooks/use-toast"
import { ImageCropModal } from "@/components/ImageCropModal"
import { useRouter } from "next/navigation"

interface UserProfile {
  name: string
  email: string
  phone: string
  rating: number
  totalTrips: number
  memberSince: string
  favoriteDestination?: string
  averageTripTime?: number
  totalSpent?: number
  profileImage?: string
}

interface UserStats {
  totalTrips: number
  totalSpent: number
  averageRating: number
  favoriteDestination: string
  averageTripTime: number
  completionRate: number
  monthlyTrips: number
}

function ProfileContent() {
  const { user, userType, refreshUserData, loading: authLoading, signOut, userData } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
  })

  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)

  // Prevent duplicate loads
  const isLoadingProfile = useRef(false)
  const hasLoadedProfile = useRef(false)
  const isLoadingAll = useRef(false)

  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [currentView, setCurrentView] = useState<string>("profile")

  const loadUserProfile = useCallback(
    async (showRetryToast = false) => {
      // Don't try to load if auth is still loading or no user
      if (authLoading || !user?.uid || !userType || !supabase) {
        return
      }

      // Prevent duplicate loads unless it's a manual retry
      if (isLoadingProfile.current && !showRetryToast) {
        return
      }

      // If already loaded and not a retry, skip
      if (hasLoadedProfile.current && !showRetryToast) {
        return
      }

      isLoadingProfile.current = true

      try {
        setProfileError(null)
        const table = userType === "driver" ? "drivers" : "passengers"

        const { data, error } = await supabase.from(table).select("*").eq("uid", user.uid).single()

        if (error) {
          throw error
        }

        if (data) {
          // sanitize unknown-typed data from Supabase
          const d = data as Record<string, any>
          const toNumber = (v: any) => {
            if (typeof v === "number") return v
            if (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))) return Number(v)
            return 0
          }

          const profileData: UserProfile = {
            name: typeof d.name === "string" ? d.name : "Usuario",
            email: typeof d.email === "string" ? d.email : typeof user?.email === "string" ? user.email : "",
            phone: typeof d.phone === "string" ? d.phone : "",
            rating: toNumber(d.rating),
            totalTrips: toNumber(d.total_trips),
            memberSince: typeof d.created_at === "string" ? d.created_at : "",
            profileImage: typeof d.profile_image === "string" ? d.profile_image : "",
          }
          setProfile(profileData)
          setEditForm({
            name: profileData.name,
            phone: profileData.phone,
          })
          setRetryCount(0) // Reset retry count on success
          hasLoadedProfile.current = true

          if (showRetryToast) {
            toast({
              title: "Perfil cargado",
              description: "La información del perfil se ha cargado correctamente.",
            })
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error)
        setProfileError("No se pudo cargar la información del perfil.")
        hasLoadedProfile.current = false

        // Don't show toast on first attempt, only on retries
        if (showRetryToast) {
          toast({
            title: "Error",
            description: "No se pudo cargar el perfil. Intenta de nuevo.",
            variant: "destructive",
          })
        }
      } finally {
        isLoadingProfile.current = false
      }
    },
    [authLoading, user?.uid, user?.email, userType, toast],
  )

  const loadUserStats = useCallback(async () => {
    if (authLoading || !user?.uid || !userType || !supabase) {
      return
    }

    try {
      const column = userType === "driver" ? "driver_id" : "passenger_id"
      const { data: rides } = await supabase.from("rides").select("*").eq(column, user.uid).eq("status", "completed")

      if (rides) {
        const rr = rides as Array<Record<string, any>>
        const toNumber = (v: any) => {
          if (typeof v === "number") return v
          if (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))) return Number(v)
          return 0
        }

        const totalSpent = rr.reduce((sum, ride) => {
          return sum + toNumber(ride.actual_fare ?? ride.estimated_fare ?? 0)
        }, 0)

        const totalTrips = rr.length

        const averageRating =
          rr.reduce((sum, ride) => {
            const rating = userType === "driver" ? ride.driver_rating : ride.passenger_rating
            return sum + toNumber(rating)
          }, 0) / (totalTrips || 1)

        const destinations = rr.map((ride) => String(ride.destination_address ?? "No disponible"))
        const destinationCounts = destinations.reduce(
          (acc: Record<string, number>, dest) => {
            acc[dest] = (acc[dest] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        )
        const favoriteDestination = Object.keys(destinationCounts).reduce(
          (a, b) => (destinationCounts[a] > destinationCounts[b] ? a : b),
          "No disponible",
        )

        const averageTripTime = 25 // minutes

        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        const monthlyTrips = rr.filter((ride) => {
          const createdAt = ride.created_at
          if (typeof createdAt === "string" || typeof createdAt === "number" || createdAt instanceof Date) {
            const rideDate = new Date(createdAt as any)
            return rideDate.getMonth() === currentMonth && rideDate.getFullYear() === currentYear
          }
          return false
        }).length

        const completionRate = totalTrips > 0 ? (rr.length / totalTrips) * 100 : 100

        setStats({
          totalTrips,
          totalSpent,
          averageRating,
          favoriteDestination,
          averageTripTime,
          completionRate,
          monthlyTrips,
        })
      }
    } catch (err) {
      console.error("Error loading stats:", err)
    }
  }, [authLoading, user?.uid, userType])

  const loadAllData = useCallback(
    async (showRetryToast = false) => {
      if (isLoadingAll.current && !showRetryToast) {
        return
      }

      if (!authLoading && user?.uid && userType && supabase) {
        isLoadingAll.current = true
        try {
          await Promise.all([loadUserProfile(showRetryToast), loadUserStats()])
        } catch (error) {
          console.error("Error in loadAllData:", error)
        } finally {
          setLoading(false)
          isLoadingAll.current = false
        }
      } else if (!authLoading) {
        setLoading(false)
        isLoadingAll.current = false
      }
    },
    [authLoading, user?.uid, userType, loadUserProfile, loadUserStats],
  )

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  const emitPrefChanged = (key: string, value: string) => {
    try {
      window.dispatchEvent(new CustomEvent("saferide:pref-changed", { detail: { key, value } }))
    } catch (e) {
      // ignore
    }
  }

  const handleRetry = async () => {
    setRetryCount((prev) => prev + 1)
    setLoading(true)
    hasLoadedProfile.current = false
    isLoadingAll.current = false
    await loadAllData(true)
  }

  const saveProfile = async () => {
    if (!user?.uid || !supabase) return

    setSaving(true)
    try {
      const table = userType === "driver" ? "drivers" : "passengers"
      const { error } = await (supabase.from(table) as any)
        .update({
          name: editForm.name,
          phone: editForm.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("uid", user.uid)

      if (error) throw error

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              name: editForm.name,
              phone: editForm.phone,
            }
          : null,
      )

      setEditing(false)
      toast({
        title: "Perfil actualizado",
        description: "Tu información ha sido guardada exitosamente.",
      })
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    if (profile) {
      setEditForm({
        name: profile.name,
        phone: profile.phone,
      })
    }
    setEditing(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
    })
  }

  const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"]
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return {
        isValid: false,
        error: "Solo se permiten archivos PNG y JPG/JPEG.",
      }
    }

    const fileName = file.name.toLowerCase()
    const validExtensions = [".png", ".jpg", ".jpeg"]
    const hasValidExtension = validExtensions.some((ext) => fileName.endsWith(ext))

    if (!hasValidExtension) {
      return {
        isValid: false,
        error: "El archivo debe tener una extensión válida (.png, .jpg, .jpeg).",
      }
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: "El archivo debe ser menor a 5MB.",
      }
    }

    return { isValid: true }
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.uid) {
      return
    }

    const validation = validateImageFile(file)
    if (!validation.isValid) {
      toast({
        title: "Archivo inválido",
        description: validation.error,
        variant: "destructive",
      })
      event.target.value = ""
      return
    }

    setSelectedImageFile(file)
    setCropModalOpen(true)
    event.target.value = ""
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user?.uid) {
      return
    }

    setUploading(true)
    setCropModalOpen(false)

    try {
      const previewUrl = URL.createObjectURL(croppedBlob)
      setImagePreview(previewUrl)

      const croppedFile = new File([croppedBlob], "profile-image.jpg", {
        type: "image/jpeg",
      })

      const formData = new FormData()
      formData.append("file", croppedFile)
      formData.append("userId", user.uid)
      formData.append("userType", userType || "passenger")

      const response = await fetch("/api/upload/profile-image", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (response.ok && result.success) {
        hasLoadedProfile.current = false
        await loadUserProfile()

        if (refreshUserData) {
          await refreshUserData()
        }

        toast({
          title: "¡Foto actualizada!",
          description: "Tu foto de perfil ha sido actualizada exitosamente.",
        })

        URL.revokeObjectURL(previewUrl)
        setImagePreview(null)
      } else {
        throw new Error(result.error || "Upload failed")
      }
    } catch (error) {
      console.error("Upload error:", error)

      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
        setImagePreview(null)
      }

      let errorMessage = "No se pudo subir la imagen. Intenta de nuevo."

      if (error instanceof Error) {
        const errorText = error.message.toLowerCase()
        if (errorText.includes("invalid_format") || errorText.includes("format")) {
          errorMessage = "Solo se permiten archivos PNG y JPG/JPEG."
        } else if (errorText.includes("file_too_large") || errorText.includes("large")) {
          errorMessage = "El archivo es demasiado grande. Máximo 5MB."
        } else if (errorText.includes("invalid_extension") || errorText.includes("extension")) {
          errorMessage = "El archivo debe tener una extensión válida (.png, .jpg, .jpeg)."
        } else if (errorText.includes("user_not_found")) {
          errorMessage = "Usuario no encontrado. Intenta cerrar sesión e iniciar de nuevo."
        } else if (errorText.includes("database")) {
          errorMessage = "Error de base de datos. Intenta de nuevo en unos momentos."
        }
      }

      toast({
        title: "Error al subir imagen",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleCropCancel = () => {
    setCropModalOpen(false)
    setSelectedImageFile(null)
  }

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  const handleLogout = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("Error logging out:", error)
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión.",
        variant: "destructive",
      })
    }
  }

  if (authLoading || (loading && !profile)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (profileError && !profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 mb-4">
              {profileError} Por favor, intenta de nuevo.
            </AlertDescription>
            <Button
              onClick={handleRetry}
              variant="outline"
              size="sm"
              className="border-red-300 text-red-700 hover:bg-red-100 bg-transparent"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar {retryCount > 0 && `(${retryCount})`}
            </Button>
          </Alert>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>No se pudo cargar la información del perfil. Por favor, intenta de nuevo.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white">
      <div
        className={`${sidebarCollapsed ? "w-16 !text-gray-700" : "w-64"} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}
      >
        <div className="p-4 border-b border-gray-200">
          <button
            aria-label={sidebarCollapsed ? "Abrir sidebar" : "Cerrar sidebar"}
            onClick={() => setSidebarCollapsed((s) => !s)}
            className="w-full flex items-center justify-center p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {!sidebarCollapsed && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={profile.profileImage || "/placeholder.svg"} />
                <AvatarFallback className="bg-blue-600 text-white font-semibold text-lg">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-gray-900">{profile.name}</h3>
                <span className="text-sm text-gray-500">Ver perfil</span>
              </div>
            </div>
          </div>
        )}

        {sidebarCollapsed && (
          <div className="p-3 border-b border-gray-200 flex justify-center">
            <Avatar className="w-10 h-10">
              <AvatarImage src={profile.profileImage || "/placeholder.svg"} />
              <AvatarFallback className="bg-blue-600 text-white font-semibold text-sm">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <button
              onClick={() => {
                handleNavigation("/passenger/dashboard")
              }}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors text-gray-700 hover:bg-gray-100`}
            >
              <Car className={`${sidebarCollapsed ? "h-6 w-6 !text-gray-700 !stroke-current" : "h-5 w-5"}`} />
              {!sidebarCollapsed && <span className="font-medium">Rides</span>}
            </button>

            <button
              onClick={() => {
                handleNavigation("/passenger/activity")
              }}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors text-gray-700 hover:bg-gray-100`}
            >
              <Clock className={`${sidebarCollapsed ? "h-6 w-6 !text-gray-700 !stroke-current" : "h-5 w-5"}`} />
              {!sidebarCollapsed && <span className="font-medium">Activity</span>}
            </button>

            <button
              onClick={() => setCurrentView("profile")}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                currentView === "profile" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <User
                className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "profile" ? "text-white stroke-current" : "!text-gray-700 !stroke-current"}`}
              />
              {!sidebarCollapsed && <span className="font-medium">Profile</span>}
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={() => {
              handleNavigation("/settings")
            }}
            className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : "space-x-3"} px-4 py-3 rounded-lg text-left text-gray-700 hover:bg-gray-100 transition-colors`}
          >
            <Settings className={`${sidebarCollapsed ? "h-6 w-6 !text-gray-700 !stroke-current" : "h-5 w-5"}`} />
            {!sidebarCollapsed && <span className="font-medium">Settings</span>}
          </button>
        </div>

        <div className="mt-auto p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : "space-x-3"} px-4 py-3 rounded-lg text-left text-gray-700 hover:bg-gray-100 transition-colors`}
          >
            <LogOut className={`${sidebarCollapsed ? "h-6 w-6 !text-gray-700 !stroke-current" : "h-5 w-5"}`} />
            {!sidebarCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
            <p className="text-gray-600">Gestiona tu información personal y revisa tus estadísticas</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="shadow-lg">
                <CardHeader className="text-center">
                  <div className="relative mx-auto mb-4">
                    <Avatar className="h-24 w-24 mx-auto">
                      <AvatarImage src={imagePreview || profile.profileImage || "/placeholder.svg"} />
                      <AvatarFallback className="text-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        {getInitials(profile.name)}
                      </AvatarFallback>
                    </Avatar>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="profile-image-upload"
                      disabled={uploading}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0 bg-transparent"
                      onClick={() => {
                        document.getElementById("profile-image-upload")?.click()
                      }}
                      disabled={uploading}
                      title="Subir foto (PNG o JPG, máx 5MB)"
                    >
                      {uploading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <CardTitle className="text-xl">{profile.name}</CardTitle>
                  <CardDescription className="flex items-center justify-center space-x-1">
                    <Badge variant={userType === "driver" ? "default" : "secondary"}>
                      {userType === "driver" ? "Conductor" : "Pasajero"}
                    </Badge>
                  </CardDescription>

                  <div className="text-xs text-gray-500 mt-2">Solo PNG y JPG • Máx 5MB</div>

                  {uploading && (
                    <div className="text-xs text-blue-600 mt-1 flex items-center justify-center space-x-1">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      <span>Subiendo imagen...</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center space-x-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-lg">{profile.rating.toFixed(1)}</span>
                    <span className="text-gray-600">({profile.totalTrips} viajes)</span>
                  </div>

                  <Separator />

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>Miembro desde {formatDate(profile.memberSince)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-green-500" />
                      <span>Cuenta verificada</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5 text-blue-600" />
                      <span>Información Personal</span>
                    </CardTitle>
                    <CardDescription>Tu información básica de contacto</CardDescription>
                  </div>
                  {!editing ? (
                    <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  ) : (
                    <div className="space-x-2">
                      <Button variant="outline" size="sm" onClick={cancelEdit}>
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={saveProfile} disabled={saving}>
                        {saving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Guardar
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre completo</Label>
                      {editing ? (
                        <Input
                          id="name"
                          value={editForm.name}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                        />
                      ) : (
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <User className="h-4 w-4 text-gray-500" />
                          <span>{profile.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico</Label>
                      <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{profile.email}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      {editing ? (
                        <Input
                          id="phone"
                          value={editForm.phone}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="Ingresa tu número de teléfono"
                        />
                      ) : (
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span>{profile.phone || "No especificado"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {stats && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span>Estadísticas</span>
                    </CardTitle>
                    <CardDescription>Tu actividad en SafeRide</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <Car className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-600">{stats.totalTrips}</div>
                        <div className="text-sm text-gray-600">Viajes totales</div>
                      </div>

                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalSpent)}</div>
                        <div className="text-sm text-gray-600">Total gastado</div>
                      </div>

                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-yellow-600">{stats.averageRating.toFixed(1)}</div>
                        <div className="text-sm text-gray-600">Rating promedio</div>
                      </div>

                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <MapPin className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <div className="text-sm font-bold text-purple-600 truncate">{stats.favoriteDestination}</div>
                        <div className="text-sm text-gray-600">Destino favorito</div>
                      </div>

                      <div className="text-center p-4 bg-indigo-50 rounded-lg">
                        <Clock className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-indigo-600">{stats.averageTripTime}min</div>
                        <div className="text-sm text-gray-600">Tiempo promedio</div>
                      </div>

                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <Award className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-orange-600">{stats.monthlyTrips}</div>
                        <div className="text-sm text-gray-600">Viajes este mes</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <ImageCropModal
            isOpen={cropModalOpen}
            onClose={handleCropCancel}
            onCrop={handleCropComplete}
            imageFile={selectedImageFile}
            uploading={uploading}
          />
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  )
}
