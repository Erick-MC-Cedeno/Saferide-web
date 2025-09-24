"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Star, Clock, Settings, LogOut, Menu, Car } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useRouter } from "next/navigation"

interface Ride {
  id: string
  passenger_name: string
  driver_name: string | null
  pickup_address: string
  destination_address: string
  status: "pending" | "accepted" | "in-progress" | "completed" | "cancelled"
  estimated_fare: number
  actual_fare: number | null
  requested_at: string
  completed_at: string | null
  passenger_rating: number | null
  driver_rating: number | null
  estimated_duration: number
}

interface ActivityStats {
  totalTrips: number
  totalSpent: number
  averageRating: number
}

function ActivityContent() {
  const { user, userType, signOut, userData } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [rides, setRides] = useState<Ride[]>([])
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [loading, setLoading] = useState(true)
  // Always keep sidebar collapsed for passengers
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [currentView, setCurrentView] = useState<string>("activity")

  const calculateStats = useCallback((ridesData: Ride[]) => {
    const completedRides = ridesData.filter((ride) => ride.status === "completed")
    const totalTrips = ridesData.length
    const totalSpent = completedRides.reduce((sum, ride) => sum + (ride.actual_fare || ride.estimated_fare), 0)

    const ratings = completedRides
      .filter((ride) => ride.passenger_rating !== null)
      .map((ride) => ride.passenger_rating!)
    const averageRating = ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0

    setStats({
      totalTrips,
      totalSpent,
      averageRating,
    })
  }, [])

  const loadRideHistory = useCallback(async () => {
    if (!user?.uid || !supabase) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("rides")
        .select("*")
        .eq("passenger_id", user.uid)
        .order("requested_at", { ascending: false })

      if (error) throw error

      const ridesData = (data || []) as unknown as Ride[]
      console.log("[v0] Loaded rides data:", ridesData)
      console.log(
        "[v0] Rides with ratings:",
        ridesData.filter((ride) => ride.passenger_rating !== null),
      )

      setRides(ridesData.slice(0, 5))
      calculateStats(ridesData)
    } catch (error) {
      console.error("Error loading ride history:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el historial de viajes.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [user?.uid, toast, calculateStats])

  useEffect(() => {
    loadRideHistory()
  }, [loadRideHistory])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando actividad...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white">
      <div
        className={`${sidebarCollapsed ? "w-16 !text-gray-700" : "w-64"} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}
      >
        {/* Toggle Button (starts collapsed but can be opened) */}
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
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {String(
                    ((userData as { name?: string; full_name?: string } | null) ?? {})?.name ??
                      ((userData as any)?.full_name ?? user?.email ?? "").split("@")[0],
                  ).charAt(0) || "U"}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {String(
                    ((userData as { name?: string; full_name?: string } | null) ?? {})?.name ??
                      ((userData as any)?.full_name ?? user?.email ?? "").split("@")[0],
                  ) || "Usuario"}
                </h3>
                <button
                  onClick={() => handleNavigation("/profile")}
                  className="text-sm text-gray-500 hover:text-blue-600 cursor-pointer transition-colors"
                >
                  Ver perfil
                </button>
              </div>
            </div>
          </div>
        )}

        {sidebarCollapsed && (
          <div className="p-3 border-b border-gray-200 flex justify-center">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {String(
                  ((userData as { name?: string; full_name?: string } | null) ?? {})?.name ??
                    ((userData as any)?.full_name ?? user?.email ?? "").split("@")[0],
                ).charAt(0) || "U"}
              </span>
            </div>
          </div>
        )}

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <button
              onClick={() => {
                setCurrentView("rides")
                handleNavigation("/passenger/dashboard")
              }}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                currentView === "rides" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Car
                className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "rides" ? "text-white stroke-current" : "!text-gray-700 !stroke-current"}`}
              />
              {!sidebarCollapsed && <span className="font-medium">Rides</span>}
            </button>

            <button
              onClick={() => setCurrentView("activity")}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                currentView === "activity" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Clock
                className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "activity" ? "text-white stroke-current" : "!text-gray-700 !stroke-current"}`}
              />
              {!sidebarCollapsed && <span className="font-medium">Activity</span>}
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={() => {
              setCurrentView("settings")
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Activity</h1>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Overview</h2>

            {stats && (
              <div className="grid grid-cols-3 gap-6 mb-8">
                <Card className="p-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Total trips</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalTrips}</p>
                  </div>
                </Card>

                <Card className="p-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Average rating</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-3xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
                      <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Total spent</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalSpent)}</p>
                  </div>
                </Card>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent trips</h2>

            {rides.length === 0 ? (
              <Card className="p-8">
                <div className="text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recent trips found.</p>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Driver</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Date</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Duration</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Cost</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {rides.map((ride) => (
                        <tr key={ride.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{ride.driver_name || "Sin asignar"}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {format(new Date(ride.requested_at), "MMM d, yyyy", { locale: es })}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{ride.estimated_duration} min</td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {formatCurrency(ride.actual_fare || ride.estimated_fare)}
                          </td>
                          <td className="px-6 py-4">
                            {(() => {
                              console.log("[v0] Ride rating data:", {
                                id: ride.id,
                                passenger_rating: ride.passenger_rating,
                                driver_rating: ride.driver_rating,
                                status: ride.status,
                              })

                              if (ride.passenger_rating != null) {
                                const r = Number(ride.passenger_rating)
                                return (
                                  <div className="flex items-center space-x-1">
                                    <span className="text-sm text-gray-900">
                                      {Number.isFinite(r) ? r.toFixed(1) : String(ride.passenger_rating)}
                                    </span>
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  </div>
                                )
                              } else {
                                return <span className="text-sm text-gray-400">-</span>
                              }
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ActivityPage() {
  return (
    <ProtectedRoute>
      <ActivityContent />
    </ProtectedRoute>
  )
}
