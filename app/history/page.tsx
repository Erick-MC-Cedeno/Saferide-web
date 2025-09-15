"use client"

import { useState, useEffect, useCallback } from "react"
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
import {
  History,
  Search,
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
  Eye,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"

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
  const { user, userType } = useAuth()
  const { toast } = useToast()
  const [rides, setRides] = useState<Ride[]>([])
  const [filteredRides, setFilteredRides] = useState<Ride[]>([])
  const [stats, setStats] = useState<HistoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null)

  const calculateStats = useCallback((ridesData: Ride[]) => {
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
  }, [userType])

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

      setRides(data || [])
      calculateStats(data || [])
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

  const loadRideHistory = async () => {
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

      setRides(data || [])
      calculateStats(data || [])
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
  }

  const calculateStats = (ridesData: Ride[]) => {
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
  }

  const filterRides = () => {
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
  }

  const exportToCSV = () => {
    const headers = [
      "Fecha",
      "Origen",
      "Destino",
      "Estado",
      "Tarifa",
      "Calificación",
      userType === "driver" ? "Pasajero" : "Conductor",
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

  const calculateDistance = (pickup: string, destination: string) => {
    // Deterministic mock distance calculation based on input strings.
    // This avoids unused-parameter lint warnings and gives repeatable results
    // without requiring coordinates or external APIs.
    const hash = (s: string) =>
      s.split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0)
    const base = Math.abs(hash(pickup) - hash(destination))
    // Map hash difference into a reasonable distance range 2-25 km
    return (base % 24) + 2
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando historial...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Historial de Viajes</h1>
          <p className="text-gray-600">Revisa todos tus viajes y estadísticas</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
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
                <div className="text-lg font-bold text-green-600">{formatCurrency(stats.totalSpent)}</div>
                <div className="text-sm text-gray-600">Total gastado</div>
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
                <Route className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">{stats.totalDistance.toFixed(0)}</div>
                <div className="text-sm text-gray-600">km recorridos</div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-indigo-600">{formatCurrency(stats.averageFare)}</div>
                <div className="text-sm text-gray-600">Tarifa promedio</div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">{stats.completedTrips}</div>
                <div className="text-sm text-gray-600">Completados</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="shadow-lg mb-6">
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
                    placeholder="Buscar por dirección o nombre..."
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

        {/* Rides List */}
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
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium">Origen:</span>
                            </div>
                            <p className="text-sm text-gray-600 ml-6">{ride.pickup_address}</p>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-red-600" />
                              <span className="text-sm font-medium">Destino:</span>
                            </div>
                            <p className="text-sm text-gray-600 ml-6">{ride.destination_address}</p>
                          </div>
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

                          {ride.status === "completed" && (
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-600" />
                              <span>
                                {userType === "driver" ? ride.driver_rating || "N/A" : ride.passenger_rating || "N/A"}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4 text-gray-600" />
                            <span>
                              {userType === "driver" ? ride.passenger_name : ride.driver_name || "Sin asignar"}
                            </span>
                          </div>
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
                                      <span className="text-gray-600">Fecha solicitado:</span>
                                      <span>
                                        {format(new Date(selectedRide.requested_at), "dd/MM/yyyy HH:mm", {
                                          locale: es,
                                        })}
                                      </span>
                                    </div>
                                    {selectedRide.completed_at && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Fecha completado:</span>
                                        <span>
                                          {format(new Date(selectedRide.completed_at), "dd/MM/yyyy HH:mm", {
                                            locale: es,
                                          })}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Duración estimada:</span>
                                      <span>{selectedRide.estimated_duration} minutos</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <h4 className="font-semibold text-gray-900">Información de Pago</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Tarifa estimada:</span>
                                      <span>{formatCurrency(selectedRide.estimated_fare)}</span>
                                    </div>
                                    {selectedRide.actual_fare && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Tarifa final:</span>
                                        <span className="font-semibold">
                                          {formatCurrency(selectedRide.actual_fare)}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Distancia:</span>
                                      <span>
                                        {calculateDistance(
                                          selectedRide.pickup_address,
                                          selectedRide.destination_address,
                                        )}{" "}
                                        km
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h4 className="font-semibold text-gray-900">Ubicaciones</h4>
                                <div className="space-y-3">
                                  <div className="flex items-start space-x-3">
                                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
                                    <div>
                                      <p className="font-medium text-sm">Origen</p>
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

                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-gray-900">Pasajero</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Nombre:</span>
                                      <span>{selectedRide.passenger_name}</span>
                                    </div>
                                    {selectedRide.passenger_rating && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Calificación dada:</span>
                                        <div className="flex items-center space-x-1">
                                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                          <span>{selectedRide.passenger_rating}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <h4 className="font-semibold text-gray-900">Conductor</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Nombre:</span>
                                      <span>{selectedRide.driver_name || "Sin asignar"}</span>
                                    </div>
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
                              </div>

                              {selectedRide.passenger_comment && (
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-gray-900">Comentario del pasajero</h4>
                                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                    {selectedRide.passenger_comment}
                                  </p>
                                </div>
                              )}
                              {selectedRide.driver_comment && (
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-gray-900">Comentario del conductor</h4>
                                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                    {selectedRide.driver_comment}
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
      </div>
    </div>
  )
}

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <HistoryContent />
    </ProtectedRoute>
  )
}
