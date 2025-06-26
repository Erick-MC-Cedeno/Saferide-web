"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useToast } from "@/hooks/use-toast"

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
  const { user, userData, userType } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
  })

  useEffect(() => {
    loadUserProfile()
    loadUserStats()
  }, [user?.uid, userType])

  const loadUserProfile = async () => {
    if (!user?.uid || !supabase) return

    try {
      const table = userType === "driver" ? "drivers" : "passengers"
      const { data, error } = await supabase.from(table).select("*").eq("uid", user.uid).single()

      if (data) {
        const profileData: UserProfile = {
          name: data.name || "Usuario",
          email: data.email || user.email || "",
          phone: data.phone || "",
          rating: data.rating || 0,
          totalTrips: data.total_trips || 0,
          memberSince: data.created_at || "",
          profileImage: data.profile_image || "",
        }
        setProfile(profileData)
        setEditForm({
          name: profileData.name,
          phone: profileData.phone,
        })
      }
    } catch (error) {
      console.error("Error loading profile:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil.",
        variant: "destructive",
      })
    }
  }

  const loadUserStats = async () => {
    if (!user?.uid || !supabase) {
      setLoading(false)
      return
    }

    try {
      const column = userType === "driver" ? "driver_id" : "passenger_id"
      const { data: rides, error } = await supabase
        .from("rides")
        .select("*")
        .eq(column, user.uid)
        .eq("status", "completed")

      if (rides) {
        const totalSpent = rides.reduce((sum, ride) => sum + (ride.actual_fare || ride.estimated_fare || 0), 0)
        const totalTrips = rides.length
        const averageRating =
          rides.reduce((sum, ride) => {
            const rating = userType === "driver" ? ride.driver_rating : ride.passenger_rating
            return sum + (rating || 0)
          }, 0) / (totalTrips || 1)

        // Calculate favorite destination
        const destinations = rides.map((ride) => ride.destination_address)
        const destinationCounts = destinations.reduce((acc: Record<string, number>, dest) => {
          acc[dest] = (acc[dest] || 0) + 1
          return acc
        }, {})
        const favoriteDestination = Object.keys(destinationCounts).reduce(
          (a, b) => (destinationCounts[a] > destinationCounts[b] ? a : b),
          "No disponible",
        )

        // Calculate average trip time (mock data for now)
        const averageTripTime = 25 // minutes

        // Calculate monthly trips
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        const monthlyTrips = rides.filter((ride) => {
          const rideDate = new Date(ride.created_at)
          return rideDate.getMonth() === currentMonth && rideDate.getFullYear() === currentYear
        }).length

        const completionRate = totalTrips > 0 ? (rides.length / totalTrips) * 100 : 100

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
    } catch (error) {
      console.error("Error loading stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    if (!user?.uid || !supabase) return

    setSaving(true)
    try {
      const table = userType === "driver" ? "drivers" : "passengers"
      const { error } = await supabase
        .from(table)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>No se pudo cargar la información del perfil. Por favor, intenta de nuevo.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
          <p className="text-gray-600">Gestiona tu información personal y revisa tus estadísticas</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg">
              <CardHeader className="text-center">
                <div className="relative mx-auto mb-4">
                  <Avatar className="h-24 w-24 mx-auto">
                    <AvatarImage src={profile.profileImage || "/placeholder.svg"} />
                    <AvatarFallback className="text-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      {getInitials(profile.name)}
                    </AvatarFallback>
                  </Avatar>
                  <Button size="sm" variant="outline" className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-xl">{profile.name}</CardTitle>
                <CardDescription className="flex items-center justify-center space-x-1">
                  <Badge variant={userType === "driver" ? "default" : "secondary"}>
                    {userType === "driver" ? "Conductor" : "Pasajero"}
                  </Badge>
                </CardDescription>
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

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
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

            {/* Statistics */}
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
