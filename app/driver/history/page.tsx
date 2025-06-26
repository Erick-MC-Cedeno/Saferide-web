"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  History,
  Search,
  Filter,
  Download,
  Clock,
  DollarSign,
  Star,
  CalendarIcon,
  Car,
  User,
  Route,
  TrendingUp,
  Eye,
  BarChart3,
  Target,
  Award,
  Timer,
  Navigation,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface DriverRide {
  id: string
  passenger_name: string
  pickup_address: string
  destination_address: string
  status: "pending" | "accepted" | "in-progress" | "completed" | "cancelled"
  estimated_fare: number
  actual_fare: number | null
  requested_at: string
  accepted_at: string | null
  completed_at: string | null
  passenger_rating: number | null
  driver_rating: number | null
  passenger_comment: string | null
  estimated_duration: number
  cancellation_reason: string | null
}

interface DriverStats {
  totalTrips: number
  completedTrips: number
  cancelledTrips: number
  totalEarnings: number
  averageRating: number
  averageEarningsPerTrip: number
  totalHours: number
  averageRideTime: number
  acceptanceRate: number
  completionRate: number
  bestDay: { date: string; earnings: number; trips: number }
  topRatedTrips: number
}

interface MonthlyData {
  month: string
  trips: number
  earnings: number
  hours: number
  rating: number
}

function DriverHistoryContent() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [rides, setRides] = useState<DriverRide[]>([])
  const [filteredRides, setFilteredRides] = useState<DriverRide[]>([])
  const [stats, setStats] = useState<DriverStats | null>(null)
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [selectedRide, setSelectedRide] = useState<DriverRide | null>(null)

  useEffect(() => {
    loadDriverHistory()
  }, [user?.uid])

  useEffect(() => {
    filterRides()
  }, [rides, searchTerm, statusFilter, dateRange])

  const loadDriverHistory = async () => {
    if (!user?.uid || !supabase) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("rides")
        .select("*")
        .eq("driver_id", user.uid)
        .order("requested_at", { ascending: false })

      if (error) throw error

      setRides(data || [])
      calculateDriverStats(data || [])
      calculateMonthlyData(data || [])
    } catch (error) {
      console.error("Error loading driver history:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el historial de viajes.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateDriverStats = (ridesData: DriverRide[]) => {
    const totalTrips = ridesData.length
    const completedRides = ridesData.filter((ride) => ride.status === "completed")
    const cancelledRides = ridesData.filter((ride) => ride.status === "cancelled")
    const completedTrips = completedRides.length
    const cancelledTrips = cancelledRides.length

    const totalEarnings = completedRides.reduce((sum, ride) => sum + (ride.actual_fare || ride.estimated_fare), 0)
    const averageEarningsPerTrip = completedTrips > 0 ? totalEarnings / completedTrips : 0

    // Calculate average rating received from passengers
    const ratingsReceived = completedRides.filter((ride) => ride.passenger_rating !== null)
    const averageRating =
      ratingsReceived.length > 0
        ? ratingsReceived.reduce((sum, ride) => sum + ride.passenger_rating!, 0) / ratingsReceived.length
        : 0

    // Calculate total hours (estimate based on ride duration)
    const totalHours = completedRides.reduce((sum, ride) => sum + ride.estimated_duration / 60, 0)
    const averageRideTime =
      completedTrips > 0 ? completedRides.reduce((sum, ride) => sum + ride.estimated_duration, 0) / completedTrips : 0

    // Calculate rates
    const acceptanceRate = totalTrips > 0 ? ((totalTrips - cancelledTrips) / totalTrips) * 100 : 0
    const completionRate = totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0

    // Find best earning day
    const dailyEarnings = completedRides.reduce(
      (acc, ride) => {
        const date = format(new Date(ride.completed_at!), "yyyy-MM-dd")
        if (!acc[date]) {
          acc[date] = { earnings: 0, trips: 0 }
        }
        acc[date].earnings += ride.actual_fare || ride.estimated_fare
        acc[date].trips += 1
        return acc
      },
      {} as Record<string, { earnings: number; trips: number }>,
    )

    const bestDay = Object.entries(dailyEarnings).reduce(
      (best, [date, data]) => {
        return data.earnings > best.earnings ? { date, ...data } : best
      },
      { date: "", earnings: 0, trips: 0 },
    )

    // Count top-rated trips (4+ stars)
    const topRatedTrips = ratingsReceived.filter((ride) => ride.passenger_rating! >= 4).length

    setStats({
      totalTrips,
      completedTrips,
      cancelledTrips,
      totalEarnings,
      averageRating,
      averageEarningsPerTrip,
      totalHours,
      averageRideTime,
      acceptanceRate,
      completionRate,
      bestDay,
      topRatedTrips,
    })
  }

  const calculateMonthlyData = (ridesData: DriverRide[]) => {
    const monthlyStats = ridesData
      .filter((ride) => ride.status === "completed")
      .reduce(
        (acc, ride) => {
          const month = format(new Date(ride.completed_at!), "yyyy-MM")
          if (!acc[month]) {
            acc[month] = { trips: 0, earnings: 0, ratings: [], hours: 0 }
          }
          acc[month].trips += 1
          acc[month].earnings += ride.actual_fare || ride.estimated_fare
          acc[month].hours += ride.estimated_duration / 60
          if (ride.passenger_rating) {
            acc[month].ratings.push(ride.passenger_rating)
          }
          return acc
        },
        {} as Record<string, { trips: number; earnings: number; ratings: number[]; hours: number }>,
      )

    const monthlyArray = Object.entries(monthlyStats)
      .map(([month, data]) => ({
        month: format(new Date(month + "-01"), "MMM yyyy", { locale: es }),
        trips: data.trips,
        earnings: data.earnings,
        hours: data.hours,
        rating:
          data.ratings.length > 0 ? data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length : 0,
      }))
      .sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime())
      .slice(0, 6)

    setMonthlyData(monthlyArray)
  }

  const filterRides = () => {
    let filtered = rides

    if (searchTerm) {
      filtered = filtered.filter(
        (ride) =>
          ride.pickup_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ride.destination_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ride.passenger_name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((ride) => ride.status === statusFilter)
    }

    if (dateRange.from) {
      filtered = filtered.filter((ride) => {
        const rideDate = new Date(ride.requested_at)
        const fromDate = dateRange.from!
        const toDate = dateRange.to || new Date()
        return rideDate >= fromDate && rideDate <= toDate
      })
    }

    setFilteredRides(filtered)
  }

  const exportToCSV = () => {
    const headers = [
      "Fecha",
      "Pasajero",
      "Origen",
      "Destino",
      "Estado",
      "Tarifa",
      "Calificación Recibida",
      "Duración",
      "Ganancias",
    ]

    const csvData = filteredRides.map((ride) => [
      format(new Date(ride.requested_at), "dd/MM/yyyy HH:mm", { locale: es }),
      ride.passenger_name,
      ride.pickup_address,
      ride.destination_address,
      getStatusText(ride.status),
      ride.actual_fare || ride.estimated_fare,
      ride.passenger_rating || "N/A",
      ride.estimated_duration + " min",
      ride.status === "completed" ? ride.actual_fare || ride.estimated_fare : 0,
    ])

    const csvContent = [headers, ...csvData].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `historial-conductor-${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Historial exportado",
      description: "El archivo CSV ha sido descargado exitosamente.",
    })
  }

  const getStatusText = (status: string) => {
    const statusMap = {
      pending: "Pendiente",
      accepted: "Aceptado",
      "in-progress": "En progreso",
      completed: "Completado",
      cancelled: "Cancelado",
    }
    return statusMap[status as keyof typeof statusMap] || status
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando historial del conductor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Historial del Conductor</h1>
          <p className="text-gray-600">Revisa tus viajes, ganancias y estadísticas de rendimiento</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="trips">Viajes</TabsTrigger>
            <TabsTrigger value="earnings">Ganancias</TabsTrigger>
            <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Stats Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                <Card className="shadow-lg">
                  <CardContent className="p-4 text-center">
                    <Car className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{stats.totalTrips}</div>
                    <div className="text-sm text-gray-600">Total viajes</div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardContent className="p-4 text-center">
                    <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-lg font-bold text-green-600">{formatCurrency(stats.totalEarnings)}</div>
                    <div className="text-sm text-gray-600">Total ganado</div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardContent className="p-4 text-center">
                    <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-600">{stats.averageRating.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">Rating promedio</div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardContent className="p-4 text-center">
                    <Timer className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">{stats.totalHours.toFixed(0)}</div>
                    <div className="text-sm text-gray-600">Horas totales</div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardContent className="p-4 text-center">
                    <Target className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-indigo-600">{stats.completionRate.toFixed(0)}%</div>
                    <div className="text-sm text-gray-600">Tasa completado</div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardContent className="p-4 text-center">
                    <Award className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-600">{stats.topRatedTrips}</div>
                    <div className="text-sm text-gray-600">Viajes 4+ ⭐</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Monthly Performance */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span>Rendimiento Mensual</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyData.map((month, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold">{month.month}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{month.trips} viajes</span>
                          <span>{month.hours.toFixed(0)}h trabajadas</span>
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{month.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">{formatCurrency(month.earnings)}</div>
                        <div className="text-sm text-gray-600">
                          {formatCurrency(month.trips > 0 ? month.earnings / month.trips : 0)}/viaje
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Best Performance Day */}
            {stats?.bestDay.earnings > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span>Mejor Día</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold text-green-800">
                          {format(new Date(stats.bestDay.date), "dd 'de' MMMM, yyyy", { locale: es })}
                        </p>
                        <p className="text-sm text-green-600">{stats.bestDay.trips} viajes completados</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.bestDay.earnings)}</p>
                        <p className="text-sm text-green-600">Mejor ganancia diaria</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="trips" className="space-y-6">
            {/* Filters */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-blue-600" />
                  <span>Filtros</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Buscar</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar por pasajero o dirección..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Estado</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="in-progress">En progreso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fecha desde</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? format(dateRange.from, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
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
                    <label className="text-sm font-medium">Acciones</label>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm" onClick={exportToCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        Exportar CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchTerm("")
                          setStatusFilter("all")
                          setDateRange({})
                        }}
                      >
                        Limpiar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trips List */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <History className="h-5 w-5 text-blue-600" />
                    <span>Viajes ({filteredRides.length})</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredRides.length === 0 ? (
                  <div className="text-center py-8">
                    <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No se encontraron viajes con los filtros aplicados.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredRides.map((ride) => (
                      <div key={ride.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(ride.status)}>{getStatusText(ride.status)}</Badge>
                              <span className="text-sm text-gray-600">
                                {format(new Date(ride.requested_at), "dd/MM/yyyy HH:mm", { locale: es })}
                              </span>
                              {ride.status === "completed" && ride.passenger_rating && (
                                <div className="flex items-center space-x-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm font-medium">{ride.passenger_rating}</span>
                                </div>
                              )}
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <User className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm font-medium">Pasajero:</span>
                                </div>
                                <p className="text-sm text-gray-600 ml-6">{ride.passenger_name}</p>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <Route className="h-4 w-4 text-purple-600" />
                                  <span className="text-sm font-medium">Ruta:</span>
                                </div>
                                <p className="text-sm text-gray-600 ml-6">
                                  {ride.pickup_address} → {ride.destination_address}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4 text-sm">
                              <div className="flex items-center space-x-1">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                <span className="font-medium">
                                  {formatCurrency(ride.actual_fare || ride.estimated_fare)}
                                </span>
                                {ride.status === "completed" && (
                                  <span className="text-green-600 font-medium">(Ganado)</span>
                                )}
                              </div>

                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span>{ride.estimated_duration} min</span>
                              </div>

                              {ride.accepted_at && (
                                <div className="flex items-center space-x-1">
                                  <Navigation className="h-4 w-4 text-orange-600" />
                                  <span>Aceptado: {format(new Date(ride.accepted_at), "HH:mm", { locale: es })}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedRide(ride)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalles
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Detalles del Viaje</DialogTitle>
                                <DialogDescription>
                                  Información completa del viaje del{" "}
                                  {format(new Date(ride.requested_at), "dd/MM/yyyy HH:mm", { locale: es })}
                                </DialogDescription>
                              </DialogHeader>

                              {selectedRide && (
                                <div className="space-y-6">
                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                      <h4 className="font-semibold text-gray-900">Información del Viaje</h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Estado:</span>
                                          <Badge className={getStatusColor(selectedRide.status)}>
                                            {getStatusText(selectedRide.status)}
                                          </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Solicitado:</span>
                                          <span>
                                            {format(new Date(selectedRide.requested_at), "dd/MM/yyyy HH:mm", {
                                              locale: es,
                                            })}
                                          </span>
                                        </div>
                                        {selectedRide.accepted_at && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Aceptado:</span>
                                            <span>
                                              {format(new Date(selectedRide.accepted_at), "dd/MM/yyyy HH:mm", {
                                                locale: es,
                                              })}
                                            </span>
                                          </div>
                                        )}
                                        {selectedRide.completed_at && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Completado:</span>
                                            <span>
                                              {format(new Date(selectedRide.completed_at), "dd/MM/yyyy HH:mm", {
                                                locale: es,
                                              })}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="space-y-3">
                                      <h4 className="font-semibold text-gray-900">Información Financiera</h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Tarifa estimada:</span>
                                          <span>{formatCurrency(selectedRide.estimated_fare)}</span>
                                        </div>
                                        {selectedRide.actual_fare && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Tarifa final:</span>
                                            <span className="font-semibold text-green-600">
                                              {formatCurrency(selectedRide.actual_fare)}
                                            </span>
                                          </div>
                                        )}
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Duración:</span>
                                          <span>{selectedRide.estimated_duration} minutos</span>
                                        </div>
                                        {selectedRide.status === "completed" && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Ganancia:</span>
                                            <span className="font-semibold text-green-600">
                                              {formatCurrency(selectedRide.actual_fare || selectedRide.estimated_fare)}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900">Ruta del Viaje</h4>
                                    <div className="space-y-3">
                                      <div className="flex items-start space-x-3">
                                        <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
                                        <div>
                                          <p className="font-medium text-sm">Punto de recogida</p>
                                          <p className="text-sm text-gray-600">{selectedRide.pickup_address}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-start space-x-3">
                                        <div className="w-3 h-3 bg-red-500 rounded-full mt-1"></div>
                                        <div>
                                          <p className="font-medium text-sm">Destino</p>
                                          <p className="text-sm text-gray-600">{selectedRide.destination_address}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900">Información del Pasajero</h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Nombre:</span>
                                        <span>{selectedRide.passenger_name}</span>
                                      </div>
                                      {selectedRide.passenger_rating && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Calificación recibida:</span>
                                          <div className="flex items-center space-x-1">
                                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                            <span>{selectedRide.passenger_rating}</span>
                                          </div>
                                        </div>
                                      )}
                                      {selectedRide.driver_rating && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Calificación dada:</span>
                                          <div className="flex items-center space-x-1">
                                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                            <span>{selectedRide.driver_rating}</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {selectedRide.passenger_comment && (
                                    <div className="space-y-3">
                                      <h4 className="font-semibold text-gray-900">Comentario del Pasajero</h4>
                                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                        {selectedRide.passenger_comment}
                                      </p>
                                    </div>
                                  )}

                                  {selectedRide.cancellation_reason && (
                                    <div className="space-y-3">
                                      <h4 className="font-semibold text-gray-900">Razón de Cancelación</h4>
                                      <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                                        {selectedRide.cancellation_reason}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings" className="space-y-6">
            {stats && (
              <>
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <span>Ganancias Totales</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.totalEarnings)}</p>
                      <p className="text-sm text-gray-600">{stats.completedTrips} viajes completados</p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        <span>Promedio por Viaje</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-blue-600">{formatCurrency(stats.averageEarningsPerTrip)}</p>
                      <p className="text-sm text-gray-600">Ganancia promedio</p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Timer className="h-5 w-5 text-purple-600" />
                        <span>Ganancia por Hora</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-purple-600">
                        {formatCurrency(stats.totalHours > 0 ? stats.totalEarnings / stats.totalHours : 0)}
                      </p>
                      <p className="text-sm text-gray-600">{stats.totalHours.toFixed(1)} horas trabajadas</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Desglose de Ganancias por Mes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {monthlyData.map((month, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-semibold">{month.month}</h4>
                            <p className="text-sm text-gray-600">
                              {month.trips} viajes • {month.hours.toFixed(1)} horas
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-green-600">{formatCurrency(month.earnings)}</p>
                            <p className="text-sm text-gray-600">
                              {formatCurrency(month.trips > 0 ? month.earnings / month.trips : 0)}/viaje
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {stats && (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        <span>Tasa de Aceptación</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-blue-600">{stats.acceptanceRate.toFixed(1)}%</p>
                      <p className="text-sm text-gray-600">Viajes aceptados vs rechazados</p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Award className="h-5 w-5 text-green-600" />
                        <span>Tasa de Finalización</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-green-600">{stats.completionRate.toFixed(1)}%</p>
                      <p className="text-sm text-gray-600">Viajes completados exitosamente</p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Star className="h-5 w-5 text-yellow-600" />
                        <span>Rating Promedio</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-yellow-600">{stats.averageRating.toFixed(1)}</p>
                      <p className="text-sm text-gray-600">Calificación de pasajeros</p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-purple-600" />
                        <span>Tiempo Promedio</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-purple-600">{stats.averageRideTime.toFixed(0)}</p>
                      <p className="text-sm text-gray-600">Minutos por viaje</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle>Distribución de Estados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Completados</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${stats.completionRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{stats.completedTrips}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Cancelados</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-red-600 h-2 rounded-full"
                                style={{
                                  width: `${stats.totalTrips > 0 ? (stats.cancelledTrips / stats.totalTrips) * 100 : 0}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{stats.cancelledTrips}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Total</span>
                          <span className="text-sm font-medium">{stats.totalTrips}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle>Calificaciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-6 w-6 ${
                                  star <= Math.round(stats.averageRating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
                          <p className="text-sm text-gray-600">Rating promedio</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Viajes con 4+ estrellas</span>
                            <span className="font-medium">{stats.topRatedTrips}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>% de excelencia</span>
                            <span className="font-medium">
                              {stats.completedTrips > 0
                                ? ((stats.topRatedTrips / stats.completedTrips) * 100).toFixed(1)
                                : 0}
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function DriverHistoryPage() {
  return (
    <ProtectedRoute requiredUserType="driver">
      <DriverHistoryContent />
    </ProtectedRoute>
  )
}
