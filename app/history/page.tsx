"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// Dialog removed: details view removed per request
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  History,
  Filter,
  Download,
  MapPin,
  Clock,
  DollarSign,
  Star,
  CalendarIcon,
  Car,
  User,
  Route,
  TrendingUp,
  Menu,
  Settings,
  LogOut,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "react-i18next"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useRouter } from "next/navigation"
import ProtectedRoute from "@/components/ProtectedRoute"
import Loading from "./loading"

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
  passenger_comment: string | null
  driver_comment: string | null
  estimated_duration: number
}

interface HistoryStats {
  totalTrips: number
  totalSpent: number
  averageRating: number
  totalDistance: number
  averageFare: number
  completedTrips: number
}

function HistoryContent() {
  const { user, userType, signOut, userData } = useAuth()
  // Narrow userData and safely extract email without using `any`
  const userInfo = userData as { name?: string; full_name?: string } | null
  const getUserEmail = (u: ({ uid: string } & Record<string, unknown>) | null): string | null => {
    if (!u) return null
    const maybe = (u as Record<string, unknown>).email
    return typeof maybe === "string" ? maybe : null
  }
  const fallbackName = (() => {
    const email = getUserEmail(user)
    return email ? email.split("@")[0] : ""
  })()
  const { toast } = useToast()
  const { t } = useTranslation()
  const router = useRouter()
  const [rides, setRides] = useState<Ride[]>([])
  const [filteredRides, setFilteredRides] = useState<Ride[]>([])
  const [stats, setStats] = useState<HistoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  // details view removed; no selectedRide state needed
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      if (typeof window === "undefined") return true
      const v = window.localStorage.getItem("saferide:sidebar-collapsed")
      return v === null ? true : v === "true"
    } catch (e) {
      return true
    }
  })
  const [currentView, setCurrentView] = useState<string>("history")

  const calculateStats = useCallback(
    (ridesData: Ride[]) => {
      const completedRides = ridesData.filter((ride) => ride.status === "completed")
      const totalTrips = ridesData.length
      const completedTrips = completedRides.length
      const totalSpent = completedRides.reduce((sum, ride) => sum + (ride.actual_fare || ride.estimated_fare), 0)
      const averageFare = completedTrips > 0 ? totalSpent / completedTrips : 0

      // Calculate average rating
      const ratingsField = userType === "driver" ? "driver_rating" : "passenger_rating"
      const ratings = completedRides.filter((ride) => ride[ratingsField] !== null).map((ride) => ride[ratingsField]!)
      const averageRating = ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0

      // Estimate total distance (mock calculation based on average trip distance)
      const totalDistance = completedTrips * 8.5 // Average 8.5 km per trip

      setStats({
        totalTrips,
        totalSpent,
        averageRating,
        totalDistance,
        averageFare,
        completedTrips,
      })
    },
    [userType],
  )

  const loadRideHistory = useCallback(async () => {
    if (!user?.uid || !supabase) {
      setLoading(false)
      return
    }

    try {
      const column = userType === "driver" ? "driver_id" : "passenger_id"
      const { data, error } = await supabase
        .from("rides")
        .select("*")
        .eq(column, user.uid)
        .order("requested_at", { ascending: false })

      if (error) throw error

      const ridesData = (data || []) as unknown as Ride[]
      setRides(ridesData)
      calculateStats(ridesData)
    } catch (error) {
      console.error("Error loading ride history:", error)
      toast({
        title: t("ui.error"),
        description: t("history.load_error"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [user?.uid, userType, toast, calculateStats])

  const filterRides = useCallback(() => {
    let filtered = rides

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (ride) =>
          ride.pickup_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ride.destination_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ride.passenger_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (ride.driver_name && ride.driver_name.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((ride) => ride.status === statusFilter)
    }

    // Date range filter
    if (dateRange.from) {
      filtered = filtered.filter((ride) => {
        const rideDate = new Date(ride.requested_at)
        const fromDate = dateRange.from!
        const toDate = dateRange.to || new Date()
        return rideDate >= fromDate && rideDate <= toDate
      })
    }

    setFilteredRides(filtered)
  }, [rides, searchTerm, statusFilter, dateRange])

  useEffect(() => {
    loadRideHistory()
  }, [loadRideHistory])

  useEffect(() => {
    filterRides()
  }, [filterRides])

  const exportToCSV = () => {
    const headers = [
      t("ui.table.date"),
      t("ui.table.origin"),
      t("ui.table.destination"),
      t("ui.table.status"),
      t("ui.table.fare"),
      t("ui.table.rating"),
      userType === "driver" ? t("ui.table.passenger") : t("ui.table.driver"),
    ]

    const csvData = filteredRides.map((ride) => [
      format(new Date(ride.requested_at), "dd/MM/yyyy HH:mm", { locale: es }),
      ride.pickup_address,
      ride.destination_address,
      getStatusText(ride.status),
      ride.actual_fare || ride.estimated_fare,
      userType === "driver" ? ride.driver_rating || "N/A" : ride.passenger_rating || "N/A",
      userType === "driver" ? ride.passenger_name : ride.driver_name || "N/A",
    ])

    const csvContent = [headers, ...csvData].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `historial-viajes-${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: t("history.exported_title"),
      description: t("history.exported_description"),
    })
  }

  const getStatusText = (status: string) => {
    const statusKeyMap: Record<string, string> = {
      pending: "pending",
      accepted: "accepted",
      "in-progress": "in_progress",
      completed: "completed",
      cancelled: "canceled",
    }
    const key = statusKeyMap[status] || status
    return t(`ui.status.${key}`) || status
  }

  const getStatusColor = (status: string) => {
    const colorMap = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-blue-100 text-blue-800",
      "in-progress": "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    }
    return colorMap[status as keyof typeof colorMap] || "bg-gray-100 text-gray-800"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const calculateDistance = (pickup: string, destination: string) => {
    // Deterministic mock distance calculation based on input strings.
    // This avoids unused-parameter lint warnings and gives repeatable results
    // without requiring coordinates or external APIs.
    const hash = (s: string) => s.split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0)
    const base = Math.abs(hash(pickup) - hash(destination))
    // Map hash difference into a reasonable distance range 2-25 km
    return (base % 24) + 2
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

 

  if (loading) return <Loading />

  return (
    <div className="flex h-screen bg-white">
      <div
        className={`${sidebarCollapsed ? "w-16" : "w-64"} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}
      >
        {/* Toggle Button */}
        <div className="p-4 border-b border-gray-200">
          <button
            aria-label={sidebarCollapsed ? t("ui.open_sidebar") : t("ui.close_sidebar")}
            onClick={() => {
              const next = !sidebarCollapsed
              setSidebarCollapsed(next)
              try {
                window.localStorage.setItem("saferide:sidebar-collapsed", String(next))
              } catch (e) {
                /* ignore */
              }
            }}
            className="w-full flex items-center justify-center p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* User Profile - Expanded */}
        {!sidebarCollapsed && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={(userData as Record<string, unknown> | null)?.profile_image as string | undefined} alt={t("ui.profile_photo")} />
                <AvatarFallback className="bg-blue-600 text-white font-semibold text-lg">
                  {String(((userInfo ?? {})?.name ?? (userInfo?.full_name ?? fallbackName))).charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {String(((userInfo ?? {})?.name ?? (userInfo?.full_name ?? fallbackName))) || t("ui.user")}
                </h3>
                <p className="text-sm text-gray-500 hover:text-blue-600 cursor-pointer">{t("ui.view_profile")}</p>
              </div>
            </div>
          </div>
        )}

        {/* User Profile - Collapsed */}
        {sidebarCollapsed && (
          <div className="p-3 border-b border-gray-200 flex justify-center">
            <Avatar className="w-10 h-10">
              <AvatarImage src={(userData as Record<string, unknown> | null)?.profile_image as string | undefined} alt={t("ui.profile_photo")} />
              <AvatarFallback className="bg-blue-600 text-white font-semibold text-sm">
                {String(((userInfo ?? {})?.name ?? (userInfo?.full_name ?? fallbackName))).charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {userType === "driver" ? (
              <>
                <button
                  onClick={() => {
                    setCurrentView("dashboard")
                    handleNavigation("/driver/dashboard")
                  }}
                  className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                    currentView === "dashboard" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Car
                    className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "dashboard" ? "text-white stroke-current" : "!text-gray-700 !stroke-current"}`}
                  />
                  {!sidebarCollapsed && <span className="font-medium">{t("ui.dashboard")}</span>}
                </button>

                <button
                  onClick={() => {
                    setCurrentView("history")
                    handleNavigation("/driver/history")
                  }}
                  className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                    currentView === "history" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <History
                    className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "history" ? "text-white stroke-current" : "!text-gray-700 !stroke-current"}`}
                  />
                  {!sidebarCollapsed && <span className="font-medium">{t("ui.history")}</span>}
                </button>
              </>
              ) : (
              <>
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
                  {!sidebarCollapsed && <span className="font-medium">{t("ui.rides")}</span>}
                </button>

                <button
                  onClick={() => {
                    setCurrentView("activity")
                    handleNavigation("/passenger/activity")
                  }}
                  className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                    currentView === "activity" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Clock
                    className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "activity" ? "text-white stroke-current" : "!text-gray-700 !stroke-current"}`}
                  />
                  {!sidebarCollapsed && <span className="font-medium">{t("ui.activity")}</span>}
                </button>

                <button
                  onClick={() => {
                    setCurrentView("settings")
                    handleNavigation("/settings")
                  }}
                  className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                    currentView === "settings" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Settings
                    className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "settings" ? "text-white stroke-current" : "!text-gray-700 !stroke-current"}`}
                  />
                  {!sidebarCollapsed && <span className="font-medium">{t("ui.settings")}</span>}
                </button>

                <button
                  onClick={() => {
                    setCurrentView("history")
                    // Already on history page, no navigation needed
                  }}
                  className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                    currentView === "history" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <History
                    className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "history" ? "text-white stroke-current" : "!text-gray-700 !stroke-current"}`}
                  />
                  {!sidebarCollapsed && <span className="font-medium">{t("ui.history")}</span>}
                </button>
              </>
            )}
          </div>
        </nav>

        

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            aria-label={sidebarCollapsed ? t("ui.logout") : undefined}
            className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : "space-x-3"} px-3 py-3 rounded-lg text-left text-gray-700 hover:bg-gray-100 transition-colors`}
          >
            <LogOut className={`${sidebarCollapsed ? "h-6 w-6 text-gray-700" : "h-5 w-5 text-gray-700"}`} />
            {!sidebarCollapsed && <span className="font-medium">{t("ui.logout")}</span>}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("history.title")}</h1>
                <p className="text-gray-600">{t("history.subtitle")}</p>
              </div>

            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <Card className="shadow-lg">
                  <CardContent className="p-4 text-center">
                    <Car className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{stats.totalTrips}</div>
                    <div className="text-sm text-gray-600">{t("ui.total_trips")}</div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardContent className="p-4 text-center">
                    <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-lg font-bold text-green-600">{formatCurrency(stats.totalSpent)}</div>
                    <div className="text-sm text-gray-600">{t("ui.total_spent")}</div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardContent className="p-4 text-center">
                    <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-600">{stats.averageRating.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">{t("ui.average_rating")}</div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardContent className="p-4 text-center">
                    <Route className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">{stats.totalDistance.toFixed(0)}</div>
                    <div className="text-sm text-gray-600">{t("ui.total_distance")}</div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                    <div className="text-lg font-bold text-indigo-600">{formatCurrency(stats.averageFare)}</div>
                    <div className="text-sm text-gray-600">{t("ui.average_fare")}</div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardContent className="p-4 text-center">
                    <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-600">{stats.completedTrips}</div>
                    <div className="text-sm text-gray-600">{t("ui.completed")}</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filters */}
            <Card className="shadow-lg mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-blue-600" />
                  <span>{t("ui.filters")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  {/* Search input removed per request */}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("ui.state")}</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("ui.all_states")}</SelectItem>
                        <SelectItem value="completed">{t("ui.status.completed")}</SelectItem>
                        <SelectItem value="cancelled">{t("ui.status.canceled")}</SelectItem>
                        <SelectItem value="pending">{t("ui.status.pending")}</SelectItem>
                        <SelectItem value="in-progress">{t("ui.status.in_progress")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("ui.date_from")}</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? format(dateRange.from, "dd/MM/yyyy", { locale: es }) : t("ui.select_date")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.from}
                          onSelect={(date) => setDateRange((prev) => ({ ...prev, from: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("ui.actions")}</label>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm" onClick={exportToCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        {t("ui.export_csv")}
                      </Button>
                      {/* Clear button removed as requested */}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rides List - Scrollable Container */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <History className="h-5 w-5 text-blue-600" />
                      <span>{t("ui.trips_label")} ({filteredRides.length})</span>
                    </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto">
                {filteredRides.length === 0 ? (
                  <div className="text-center py-8">
                    <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No se encontraron viajes con los filtros aplicados.</p>
                  </div>
                ) : (
                  <>
                    {/* Desktop table */}
                    <div className="hidden sm:block">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">{t("ui.table.status")}</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">{t("ui.table.date")}</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">{t("ui.table.origin")}</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">{t("ui.table.destination")}</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">{t("ui.table.driver")}</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">{t("ui.table.fare")}</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">{t("ui.table.duration")}</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">{t("ui.table.rating")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredRides.map((ride) => (
                            <tr key={ride.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-700"> <Badge className={getStatusColor(ride.status)}>{getStatusText(ride.status)}</Badge> </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{format(new Date(ride.requested_at), "dd/MM/yyyy HH:mm", { locale: es })}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{ride.pickup_address}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{ride.destination_address}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{userType === "driver" ? ride.passenger_name : ride.driver_name || "Sin asignar"}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(ride.actual_fare || ride.estimated_fare)}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{ride.estimated_duration} min</td>
                              <td className="px-4 py-3 text-sm">{ride.passenger_rating != null ? <div className="flex items-center space-x-1"><span className="text-sm text-gray-900">{Number.isFinite(Number(ride.passenger_rating)) ? Number(ride.passenger_rating).toFixed(1) : String(ride.passenger_rating)}</span><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /></div> : <span className="text-sm text-gray-400">-</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="sm:hidden space-y-4">
                      {filteredRides.map((ride) => (
                        <div key={ride.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-2">
                                <Badge className={getStatusColor(ride.status)}>{getStatusText(ride.status)}</Badge>
                                <span className="text-sm text-gray-600">
                                  {format(new Date(ride.requested_at), "dd/MM/yyyy HH:mm", { locale: es })}
                                </span>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <MapPin className="h-4 w-4 text-green-600" />
                                  <span className="text-sm font-medium truncate">{t("ui.table.origin") + ":"}</span>
                                </div>
                                <p className="text-sm text-gray-600 ml-6 truncate">{ride.pickup_address}</p>
                                <div className="flex items-center space-x-2 mt-2">
                                  <MapPin className="h-4 w-4 text-red-600" />
                                  <span className="text-sm font-medium truncate">{t("ui.table.destination") + ":"}</span>
                                </div>
                                <p className="text-sm text-gray-600 ml-6 truncate">{ride.destination_address}</p>
                              </div>

                              <div className="flex items-center space-x-4 text-sm">
                                <div className="flex items-center space-x-1">
                                  <DollarSign className="h-4 w-4 text-green-600" />
                                  <span>{formatCurrency(ride.actual_fare || ride.estimated_fare)}</span>
                                </div>

                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4 text-blue-600" />
                                  <span>{ride.estimated_duration} min</span>
                                </div>

                                <div className="flex items-center space-x-1">
                                  <Route className="h-4 w-4 text-purple-600" />
                                  <span>{calculateDistance(ride.pickup_address, ride.destination_address)} km</span>
                                </div>

                                <div className="flex items-center space-x-1">
                                  <User className="h-4 w-4 text-gray-600" />
                                  <span className="truncate">{userType === "driver" ? ride.passenger_name : ride.driver_name || "Sin asignar"}</span>
                                </div>
                              </div>
                            </div>

                            {/* Details removed */}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HistoryPageWithAuth() {
  return (
    <ProtectedRoute>
      <HistoryContent />
    </ProtectedRoute>
  )
}
