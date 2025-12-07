"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  MapPin,
  Star,
  Car,
  Activity,
  MessageCircle,
  Settings,
  LogOut,
  Menu,
  History,
  X,
} from "lucide-react"
import { useRealTimeRides } from "@/hooks/useRealTimeRides"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "react-i18next"
import { MapComponent } from "@/components/MapComponent"
import { AddressAutocomplete } from "@/components/AddressAutocomplete"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useToast } from "@/hooks/use-toast"
import { RideChat } from "@/components/RideChat"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

import type { RideStatus, DriverApi } from "./types"
import { usePassengerData, useDriverData, useChatNotifications } from "./hooks"
import { calculateEstimatedFare, calculateEstimatedDuration, getDisplayName, getProfileImage } from "./utils"
import { solicitarViaje, handleCancelRide, handleRateDriver, handleSkipRating, handleUseMyLocation } from "./actions"

function PassengerDashboardContent() {
  const router = useRouter()
  const { user, userData, signOut } = useAuth()
  const { toast } = useToast()
  const { t } = useTranslation()
  // use a loosely-typed wrapper so we can pass this toast to helper actions
  // that expect a more permissive variant type without causing contravariance errors
  const safeToast = (opts: any) => toast(opts as any)
  
  const [pickup, setPickup] = useState("")
  const [destination, setDestination] = useState("")
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [rideStatus, setRideStatus] = useState<RideStatus>("idle")
  const [availableDrivers, setAvailableDrivers] = useState<DriverApi[]>([])
  const [selectedDriver, setSelectedDriver] = useState("")
  const [noDriversNearby, setNoDriversNearby] = useState("")
  const [showDriverSelection, setShowDriverSelection] = useState(false)
  const [showRatingDialog, setShowRatingDialog] = useState(false)
  const [completedRide, setCompletedRide] = useState<any>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      if (typeof window === "undefined") return true
      const v = window.localStorage.getItem("saferide:sidebar-collapsed")
      return v === null ? true : v === "true"
    } catch (e) {
      return true
    }
  })
  const [currentView, setCurrentView] = useState<string>("rides")
  const [showChatDialog, setShowChatDialog] = useState(false)
  const [driversForMap, setDriversForMap] = useState<Array<{ id: string; uid?: string; name: string; lat: number; lng: number }>>([])
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
  const [drawerHeight, setDrawerHeight] = useState(50)

  usePassengerData()
  const { driverData, showNearbyDriversInMap, DEFAULT_RADIUS_KM } = useDriverData()
  const { rides, cancelRide, refreshRides } = useRealTimeRides(undefined, user?.uid)
  const currentRide = rides.find((ride) => ["pending", "accepted", "in-progress"].includes(ride.status))
  const { chatUnread, setChatUnread } = useChatNotifications(currentRide)

  useEffect(() => {
    if (!currentRide && rideStatus !== "idle") {
      setRideStatus("idle")
    }
  }, [currentRide, rideStatus])

  useEffect(() => {
    if (!user) return

    const loadOnAuth = async () => {
      try {
        let lat: number | null = null
        let lng: number | null = null

        if (pickupCoords) {
          lat = pickupCoords.lat
          lng = pickupCoords.lng
        } else if (typeof window !== "undefined" && navigator.geolocation) {
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
            })
            lat = pos.coords.latitude
            lng = pos.coords.longitude
            setPickupCoords({ lat, lng })
          } catch (err) {
            console.warn("No se pudo obtener geolocalización al autenticar:", err)
          }
        }

        if (typeof lat === "number" && typeof lng === "number") {
          const drivers = await showNearbyDriversInMap(lat, lng)
          setDriversForMap(drivers)
        } else {
          const drivers = await showNearbyDriversInMap()
          setDriversForMap(drivers)
        }
      } catch (err) {
        console.error("Error cargando conductores al autenticar:", err)
      }
    }

    loadOnAuth()
  }, [user, pickupCoords, showNearbyDriversInMap])

  useEffect(() => {
    const loadAvailableDrivers = async () => {
      if (!pickupCoords || !destinationCoords) return

      try {
        const driverResult = await driverData(pickupCoords?.lat, pickupCoords?.lng, DEFAULT_RADIUS_KM)

        if (driverResult && driverResult.noRangesConfigured) {
          setNoDriversNearby(t("ui.no_ranges_configured"))
          safeToast({
            title: t("ui.ranges_not_configured_title"),
            description: t("ui.ranges_not_configured_description"),
            variant: "destructive",
          })
          setAvailableDrivers([])
          return
        }

        const verifiedDrivers = (driverResult.data ?? []).filter((driver) => driver.is_verified)
        const onlineDrivers = (driverResult.data ?? []).filter((driver) => driver.is_online)
        const availableDriversToShow = verifiedDrivers.length > 0 ? verifiedDrivers : onlineDrivers

        setAvailableDrivers(availableDriversToShow)

        if (availableDriversToShow.length === 0) {
          setNoDriversNearby(t("ui.no_drivers_available"))
          safeToast({
            title: t("ui.no_drivers_title"),
            description: t("ui.no_drivers_description"),
            variant: "destructive",
          })
        } else {
          setNoDriversNearby("")
        }
      } catch (error) {
        console.error("Error de red al cargar conductores:", error)
        safeToast({
          title: t("ui.connection_error_title"),
          description: t("ui.connection_error_description"),
          variant: "destructive",
        })
        setAvailableDrivers([])
      }
    }

    if (pickupCoords && destinationCoords) {
      loadAvailableDrivers()
    }
  }, [pickupCoords, destinationCoords, driverData, DEFAULT_RADIUS_KM, toast])

  useEffect(() => {
    const completedRide = rides.find((ride) => {
      return (
        ride.status === "completed" &&
        ride.passenger_id === user?.uid &&
        ride.passenger_rating == null &&
        !ride.passenger_comment
      )
    })

    if (completedRide) {
      setCompletedRide(completedRide)
      setShowRatingDialog(true)
    }
  }, [rides, user?.uid])

  const handleRequestRide = async () => {
    if (!pickup || !destination || !pickupCoords || !destinationCoords || !user || !userData) return

    setRideStatus("searching")

    try {
      const driverResult = await driverData(pickupCoords?.lat, pickupCoords?.lng, DEFAULT_RADIUS_KM)

      if (!driverResult.success) {
        console.error("Error en driverData:", driverResult.error)
        setRideStatus("idle")
        toast({
          title: t("ui.error"),
          description: t("ui.could_not_fetch_drivers"),
          variant: "destructive",
        })
        return
      }

      const verifiedDrivers = driverResult.data.filter((driver) => driver.is_verified)
      const onlineDrivers = driverResult.data.filter((driver) => driver.is_online)
      const availableDriversToShow = verifiedDrivers.length > 0 ? verifiedDrivers : onlineDrivers

      setAvailableDrivers(availableDriversToShow)

      if (availableDriversToShow.length === 0) {
        setRideStatus("idle")
        setNoDriversNearby(t("ui.no_drivers_nearby"))
        toast({
          title: t("ui.no_drivers"),
          description: t("ui.no_drivers_description"),
          variant: "destructive",
        })
        return
      }

      if (!selectedDriver) {
        setShowDriverSelection(true)
        setRideStatus("idle")
        return
      }

      const result = await solicitarViaje(
        user,
        userData,
        pickup,
        pickupCoords,
        destination,
        destinationCoords,
        selectedDriver,
        availableDrivers,
        toast,
        refreshRides
      )

      if (result.success) {
        setShowDriverSelection(false)
        setSelectedDriver("")
        setNoDriversNearby("")
        setRideStatus("pending")
      } else {
        setRideStatus("idle")
      }
    } catch (error) {
      console.error("Error en handleRequestRide:", error)
      setRideStatus("idle")
      toast({
        title: t("ui.error"),
        description: t("ui.error_processing_request"),
        variant: "destructive",
      })
    }
  }

  const handleNavigation = (section: string) => {
    switch (section) {
      case "activity":
        router.push("/passenger/activity")
        break
      case "settings":
        router.push("/settings")
        break
      case "history":
        router.push("/history")
        break
      case "profile":
        router.push("/profile")
        break
      case "logout":
        handleLogout()
        break
      default:
        break
    }
  }

  const handleLogout = async () => {
    try {
      // prefer the centralized signOut implementation from the auth context
      await signOut()
    } catch (error) {
      console.error("Error logging out via auth context:", error)
    } finally {
      // navigate to login regardless to avoid leaving user in a protected area
      try {
        router.push("/auth/login")
      } catch (navErr) {
        console.error("Error redirecting after logout:", navErr)
      }
    }
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar - Desktop */}
      <div className={`${sidebarCollapsed ? "w-16 !text-gray-700" : "w-64"} bg-white shadow-lg transition-all duration-300 hidden md:flex md:flex-col`}>
        <div className="p-4 border-b border-gray-200">
            <button
            aria-label={sidebarCollapsed ? t("ui.open_sidebar") : t("ui.close_sidebar")}
            onClick={() => {
              const next = !sidebarCollapsed
              setSidebarCollapsed(next)
              try { window.localStorage.setItem("saferide:sidebar-collapsed", String(next)) } catch (e) {}
            }}
            className="w-full flex items-center justify-center p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

          {!sidebarCollapsed && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={getProfileImage(userData)} alt={t("ui.profile_photo")} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold">
                  {String(getDisplayName(userData, user)).charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-gray-900">{String(getDisplayName(userData, user)) || t("ui.user")}</h2>
                <button
                  onClick={() => handleNavigation("profile")}
                  className="text-sm text-gray-500 cursor-pointer hover:text-blue-600 transition-colors"
                >
                  {t("ui.view_profile")}
                </button>
              </div>
            </div>
          </div>
        )}

        {sidebarCollapsed && (
          <div className="p-3 border-b border-gray-200 flex justify-center">
            <Avatar className="h-10 w-10">
              <AvatarImage src={getProfileImage(userData)} alt={t("ui.profile_photo")} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-sm">
                {String(getDisplayName(userData, user)).charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <button
              onClick={() => setCurrentView("rides")}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                currentView === "rides" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Car className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "rides" ? "text-white stroke-current" : "!text-gray-700 !stroke-current"}`} />
              {!sidebarCollapsed && <span className="font-medium">{t("ui.rides")}</span>}
            </button>

            <button
              onClick={() => { setCurrentView("activity"); handleNavigation("activity") }}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                currentView === "activity" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Activity className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "activity" ? "text-white stroke-current" : "!text-gray-700 !stroke-current"}`} />
              {!sidebarCollapsed && <span className="font-medium">{t("ui.activity")}</span>}
            </button>

            <button
              onClick={() => { setCurrentView("settings"); handleNavigation("settings") }}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                currentView === "settings" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Settings className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "settings" ? "text-white stroke-current" : "!text-gray-700 !stroke-current"}`} />
              {!sidebarCollapsed && <span className="font-medium">{t("ui.settings")}</span>}
            </button>

            <button
              onClick={() => { setCurrentView("history"); handleNavigation("history") }}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                currentView === "history" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <History className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "history" ? "text-white stroke-current" : "!text-gray-700 !stroke-current"}`} />
              {!sidebarCollapsed && <span className="font-medium">{t("ui.history")}</span>}
            </button>
          </div>
        </nav>

        <div className="mt-auto p-4 border-t border-gray-200 relative z-50">
          <button
            type="button"
            onClick={() => { setCurrentView("logout"); handleNavigation("logout") }}
            aria-label={sidebarCollapsed ? t("ui.logout") : undefined}
            className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : "space-x-3"} px-3 py-3 rounded-lg text-left text-gray-700 hover:bg-gray-100 transition-colors pointer-events-auto`}
          >
            <LogOut className={`${sidebarCollapsed ? "h-6 w-6 text-gray-700" : "h-5 w-5 text-gray-700"}`} />
            {!sidebarCollapsed && <span className="font-medium">{t("ui.logout")}</span>}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {!sidebarCollapsed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setSidebarCollapsed(true)} />
      )}

      <div className={`fixed left-0 top-0 h-full bg-white shadow-lg flex flex-col transition-all duration-300 z-50 md:hidden ${
          sidebarCollapsed ? "-translate-x-full w-16" : "translate-x-0 w-64"
        }`}>
        <div className="p-4 border-b border-gray-200">
          <button
            aria-label={sidebarCollapsed ? t("ui.open_sidebar") : t("ui.close_sidebar")}
            onClick={() => setSidebarCollapsed((s) => !s)}
            className="w-full flex items-center justify-center p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {!sidebarCollapsed && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={getProfileImage(userData)} alt={t("ui.profile_photo")} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold">
                  {String(getDisplayName(userData, user)).charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-gray-900">{String(getDisplayName(userData, user)) || t("ui.user")}</h2>
                <button
                  onClick={() => { handleNavigation("profile"); setSidebarCollapsed(true) }}
                  className="text-sm text-gray-500 cursor-pointer hover:text-blue-600 transition-colors"
                >
                  {t("ui.view_profile")}
                </button>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <button
              onClick={() => setCurrentView("rides")}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                currentView === "rides" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Car className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "rides" ? "text-white stroke-current" : "!text-gray-700 !stroke-current"}`} />
              {!sidebarCollapsed && <span className="font-medium">{t("ui.rides")}</span>}
            </button>

            <button
              onClick={() => { setCurrentView("activity"); handleNavigation("activity") }}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                currentView === "activity" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Activity className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "activity" ? "text-white stroke-current" : "!text-gray-700 !stroke-current"}`} />
              {!sidebarCollapsed && <span className="font-medium">{t("ui.activity")}</span>}
            </button>

            <button
              onClick={() => { setCurrentView("settings"); handleNavigation("settings") }}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                currentView === "settings" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Settings className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "settings" ? "text-white stroke-current" : "!text-gray-700 !stroke-current"}`} />
              {!sidebarCollapsed && <span className="font-medium">{t("ui.settings")}</span>}
            </button>

            <button
              onClick={() => { setCurrentView("history"); handleNavigation("history") }}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                currentView === "history" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <History className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "history" ? "text-white stroke-current" : "!text-gray-700 !stroke-current"}`} />
              {!sidebarCollapsed && <span className="font-medium">{t("ui.history")}</span>}
            </button>
          </div>
        </nav>

        <div className="mt-auto p-4 border-t border-gray-200 relative z-50">
          <button
            type="button"
            onClick={() => { setCurrentView("logout"); handleNavigation("logout") }}
            className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : "space-x-3"} px-3 py-3 rounded-lg text-left text-gray-700 hover:bg-gray-100 transition-colors pointer-events-auto`}
          >
            <LogOut className={`${sidebarCollapsed ? "h-6 w-6 text-gray-700" : "h-5 w-5 text-gray-700"}`} />
            {!sidebarCollapsed && <span className="font-medium">{t("ui.logout")}</span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex h-full md:ml-0">
        <button
          className="fixed top-4 left-4 z-30 bg-white rounded-full p-3 shadow-lg md:hidden"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>

        {/* Map Section */}
        <div className="flex-1 relative h-full">
          <MapComponent
            userType="passenger"
            pickupLocation={pickupCoords ?? undefined}
            destinationLocation={destinationCoords ?? undefined}
            driverLocations={driversForMap}
            onMapReady={(userLoc) => {
              if (userLoc) {
                showNearbyDriversInMap(userLoc.lat, userLoc.lng).then(drivers => setDriversForMap(drivers))
              }
            }}
          />

          {/* Driver Arrival Notification */}
          {currentRide && currentRide.status === "accepted" && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-white rounded-lg shadow-lg p-4 flex items-center space-x-3 min-w-[280px]">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold">
                    {String(currentRide.driver_name ?? "").charAt(0) || "D"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-600">{t("ui.arriving_in", { minutes: 3 })}</p>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">{currentRide.driver_name}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600">{currentRide.driver_rating?.toFixed(2) ?? "N/A"}</span>
                    </div>
                    <span className="text-sm text-gray-500">• {currentRide.vehicle_model ?? t("ui.unknown_vehicle")}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ride Details Panel */}
          {currentRide && (
            <div className={`absolute left-4 right-4 bg-white rounded-lg shadow-xl p-6 ${
                "bottom-20 md:bottom-4"
              }`}>
                <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{t("ui.ride_details")}</h3>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{t("ui.estimated_fare")}</p>
                  <p className="text-2xl font-bold text-gray-900">${currentRide.estimated_fare}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <span className="text-sm font-medium text-gray-600">ID: #{currentRide.id?.toString().slice(-6)}</span>
                  <Badge
                  className={`${
                    currentRide.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : currentRide.status === "accepted"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {currentRide.status === "pending" && t("ui.status.pending")}
                  {currentRide.status === "accepted" && t("ui.status.accepted")}
                  {currentRide.status === "in-progress" && t("ui.status.in_progress")}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{t("ui.from")}</p>
                  <p className="text-sm text-gray-900">{currentRide.pickup_address}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{t("ui.to")}</p>
                  <p className="text-sm text-gray-900">{currentRide.destination_address}</p>
                </div>
              </div>

              <div className="flex space-x-3">
                {currentRide.status === "in-progress" && (
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setShowChatDialog(true)
                      setChatUnread(0)
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {t("ui.contact_driver")}
                    {chatUnread > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{chatUnread}</span>
                    )}
                  </Button>
                )}
                {["pending", "accepted", "in-progress"].includes(currentRide.status) && (
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() =>
                      handleCancelRide(
                        currentRide.id,
                        rides,
                        cancelRide,
                        toast,
                        refreshRides,
                        currentRide.status === "in-progress" ? t("ui.cancelled_during_ride") : undefined,
                      ).then((result) => {
                        if (result.success) {
                          setRideStatus("idle")
                          setPickup("")
                          setDestination("")
                          setPickupCoords(null)
                          setDestinationCoords(null)
                          setSelectedDriver("")
                          setShowDriverSelection(false)
                          setShowChatDialog(false)
                          setNoDriversNearby("")
                        }
                      })
                    }
                  >
                    {t("ui.cancel_ride")}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Drawer */}
        {isMobileDrawerOpen && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setIsMobileDrawerOpen(false)}
            />

            <div
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 md:hidden transition-transform duration-300 ease-out"
              style={{ height: `${drawerHeight}%` }}
            >
              <div className="flex justify-center py-3">
                <div
                  className="w-12 h-1 bg-gray-300 rounded-full cursor-pointer"
                  onTouchStart={(e) => {
                    const startY = e.touches[0].clientY
                    const startHeight = drawerHeight

                    const handleTouchMove = (e: TouchEvent) => {
                      const currentY = e.touches[0].clientY
                      const deltaY = startY - currentY
                      const newHeight = Math.min(90, Math.max(30, startHeight + (deltaY / window.innerHeight) * 100))
                      setDrawerHeight(newHeight)
                    }

                    const handleTouchEnd = () => {
                      document.removeEventListener("touchmove", handleTouchMove)
                      document.removeEventListener("touchend", handleTouchEnd)

                      if (drawerHeight < 40) {
                        setIsMobileDrawerOpen(false)
                      } else if (drawerHeight < 65) {
                        setDrawerHeight(50)
                      } else {
                        setDrawerHeight(80)
                      }
                    }

                    document.addEventListener("touchmove", handleTouchMove)
                    document.addEventListener("touchend", handleTouchEnd)
                  }}
                />
              </div>

              <button
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
                onClick={() => setIsMobileDrawerOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>

              <div className="px-6 pb-6 h-full overflow-y-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("ui.request_a_ride")}</h1>

                <div className="space-y-4 mb-6">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
                    onClick={() => handleUseMyLocation(setPickup, setPickupCoords, showNearbyDriversInMap, safeToast, pickupCoords).then(() => {
                      showNearbyDriversInMap(pickupCoords?.lat, pickupCoords?.lng).then(drivers => setDriversForMap(drivers))
                    })}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    {t("ui.use_my_location")}
                  </Button>

                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    </div>
                    <AddressAutocomplete
                      placeholder={t("ui.enter_pickup_location")}
                      value={pickup}
                      onChange={setPickup}
                      onAddressSelect={(address, coords) => {
                        setPickup(address)
                        setPickupCoords(coords)
                      }}
                      className="pl-10 py-3 border-gray-300 rounded-lg text-gray-500"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
                    </div>
                    <AddressAutocomplete
                      placeholder={t("ui.enter_destination")}
                      value={destination}
                      onChange={setDestination}
                      onAddressSelect={(address, coords) => {
                        setDestination(address)
                        setDestinationCoords(coords)
                      }}
                      className="pl-10 py-3 border-gray-300 rounded-lg text-gray-500"
                    />
                  </div>
                </div>

                {pickupCoords && destinationCoords && (
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{t("ui.estimated_fare")}</span>
                      <span className="text-lg font-semibold text-gray-900">
                        ${calculateEstimatedFare(pickupCoords, destinationCoords)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{t("ui.estimated_duration")}</span>
                      <span className="text-gray-900 font-medium">
                        {calculateEstimatedDuration(pickupCoords, destinationCoords)} {t("ui.minutes")}
                      </span>
                    </div>
                  </div>
                )}

                {noDriversNearby && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-700 text-center">{noDriversNearby}</p>
                  </div>
                )}

                <Button
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                  onClick={() => {
                    handleRequestRide()
                    setIsMobileDrawerOpen(false)
                  }}
                  disabled={
                    !pickup || !destination || !pickupCoords || !destinationCoords || rideStatus === "searching"
                  }
                >
                  {rideStatus === "searching" ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      {t("ui.searching_for_driver")}
                    </>
                  ) : t("ui.request_ride")}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Desktop Request Panel */}
        <div className="w-96 bg-white shadow-lg p-6 flex-col h-full hidden md:flex">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("ui.request_a_ride")}</h1>

            <div className="space-y-4 mb-6">
              <Button
                variant="outline"
                className="w-full justify-start text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
                onClick={() => handleUseMyLocation(setPickup, setPickupCoords, showNearbyDriversInMap, safeToast, pickupCoords).then(() => {
                  showNearbyDriversInMap(pickupCoords?.lat, pickupCoords?.lng).then(drivers => setDriversForMap(drivers))
                })}
              >
                <MapPin className="h-4 w-4 mr-2" />
                {t("ui.use_my_location")}
              </Button>

              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                </div>
                <AddressAutocomplete
                  placeholder={t("ui.enter_pickup_location")}
                  value={pickup}
                  onChange={setPickup}
                  onAddressSelect={(address, coords) => {
                    setPickup(address)
                    setPickupCoords(coords)
                  }}
                  className="pl-10 py-3 border-gray-300 rounded-lg text-gray-500"
                />
              </div>

              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
                </div>
                <AddressAutocomplete
                  placeholder={t("ui.enter_destination")}
                  value={destination}
                  onChange={setDestination}
                  onAddressSelect={(address, coords) => {
                    setDestination(address)
                    setDestinationCoords(coords)
                  }}
                  className="pl-10 py-3 border-gray-300 rounded-lg text-gray-500"
                />
              </div>
            </div>

            {pickupCoords && destinationCoords && (
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t("ui.estimated_fare")}</span>
                  <span className="text-lg font-semibold text-gray-900">
                    ${calculateEstimatedFare(pickupCoords, destinationCoords)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t("ui.estimated_duration")}</span>
                  <span className="text-gray-900 font-medium">
                    {calculateEstimatedDuration(pickupCoords, destinationCoords)} {t("ui.minutes")}
                  </span>
                </div>
              </div>
            )}

            {noDriversNearby && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-700 text-center">{noDriversNearby}</p>
              </div>
            )}
          </div>

          <Button
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
            onClick={handleRequestRide}
            disabled={!pickup || !destination || !pickupCoords || !destinationCoords || rideStatus === "searching"}
          >
            {rideStatus === "searching" ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                {t("ui.searching_for_driver")}
              </>
            ) : t("ui.request_ride")}
          </Button>
        </div>
      </div>

      {/* Mobile viajar Button */}
      {!currentRide && (
        <button
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full shadow-lg md:hidden z-20 font-semibold text-lg transition-all duration-200 hover:scale-105"
          onClick={() => setIsMobileDrawerOpen(true)}
        >
          <Car className="h-5 w-5 mr-2 inline" />
          {t("ui.travel")}
        </button>
      )}

      {/* Chat Dialog */}
      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent className="sm:max-w-lg border-0 shadow-2xl">
              <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <span>{t("ui.chat_with_driver")}</span>
            </DialogTitle>
          </DialogHeader>
          {currentRide && currentRide.driver_id && (
            <RideChat
              rideId={currentRide.id}
              driverName={String(currentRide.driver_name ?? "Conductor")}
              passengerName={String(currentRide.passenger_name ?? "")}
              onClose={() => setShowChatDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Driver Selection Dialog */}
      <Dialog open={showDriverSelection} onOpenChange={setShowDriverSelection}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{t("ui.select_driver")}</DialogTitle>
            <DialogDescription className="text-base">
              {availableDrivers.length} {t("ui.drivers_available")}
              {availableDrivers.some((d) => d.is_verified)
                ? `(${availableDrivers.filter((d) => d.is_verified).length} ${t("ui.verified")})`
                : `(${t("ui.online_drivers")})`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 font-medium">
                {t("ui.choose_driver_tip")}
              </p>
            </div>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                <SelectTrigger className="h-12">
                <SelectValue placeholder={t("ui.select_driver_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {availableDrivers.map((driver) => (
                  <SelectItem key={driver.uid} value={driver.uid}>
                    <div className="flex items-center space-x-3 py-2">
                      <Avatar className="h-10 w-10 ring-2 ring-blue-200">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold">
                          {String(driver.name ?? "").charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold text-gray-800">{driver.name}</p>
                          {driver.is_verified ? (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              {t("ui.verified")}
                            </span>
                          ) : (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              {t("ui.online")}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{driver.rating?.toFixed(1) || "N/A"}</span>
                          <span>•</span>
                          <span>{driver.vehicle_model}</span>
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 font-semibold"
                onClick={async () => {
                  const result = await solicitarViaje(
                    user,
                    userData,
                    pickup,
                    pickupCoords!,
                    destination,
                    destinationCoords!,
                    selectedDriver,
                    availableDrivers,
                    toast,
                    refreshRides
                  )
                  if (result.success) {
                    setShowDriverSelection(false)
                    setSelectedDriver("")
                    setNoDriversNearby("")
                    setRideStatus("pending")
                  }
                }}
                disabled={!selectedDriver}
              >
                {t("ui.confirm_selection")}
              </Button>
              <Button
                variant="outline"
                className="font-semibold bg-white/60 hover:bg-blue-50"
                onClick={async () => {
                  setSelectedDriver("")
                  const result = await solicitarViaje(
                    user,
                    userData,
                    pickup,
                    pickupCoords!,
                    destination,
                    destinationCoords!,
                    "",
                    availableDrivers,
                    toast,
                    refreshRides
                  )
                  if (result.success) {
                    setShowDriverSelection(false)
                    setNoDriversNearby("")
                    setRideStatus("pending")
                  }
                }}
              >
                {t("ui.any_driver")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{t("ui.rate_your_ride")}</DialogTitle>
            <DialogDescription className="text-base">
              {t("ui.rate_description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-center">
              <Avatar className="h-20 w-20 mx-auto mb-4 ring-4 ring-blue-200">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-2xl font-bold">
                  {String(completedRide?.driver_name ?? "").charAt(0) || "D"}
                </AvatarFallback>
              </Avatar>
              <p className="font-bold text-lg text-gray-800">{completedRide?.driver_name}</p>
              <p className="text-gray-600 font-medium">{t("ui.how_was_experience")}</p>
            </div>
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="p-2 hover:scale-110 transition-transform">
                  <Star
                    className={`h-10 w-10 ${
                      star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <Label htmlFor="comment" className="text-base font-semibold">
                {t("ui.comment_optional")}
              </Label>
              <Textarea
                id="comment"
                placeholder={t("ui.share_experience")}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="border-gray-200 focus:border-blue-400"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 font-semibold"
                onClick={async () => {
                  const result = await handleRateDriver(completedRide, rating, comment, safeToast)
                  if (result.success) {
                    setShowRatingDialog(false)
                    setRating(0)
                    setComment("")
                    setCompletedRide(null)
                  }
                }}
                disabled={rating === 0 && comment.trim() === ""}
              >
                {t("ui.submit_rating")}
              </Button>
              <Button 
                variant="outline" 
                className="font-semibold bg-white/60" 
                onClick={async () => {
                  const result = await handleSkipRating(completedRide, comment, safeToast)
                  if (result.success) {
                    setShowRatingDialog(false)
                    setRating(0)
                    setComment("")
                    setCompletedRide(null)
                  }
                }}
              >
                {t("ui.skip")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function PassengerDashboard() {
  return (
    <ProtectedRoute requiredUserType="passenger">
      <PassengerDashboardContent />
    </ProtectedRoute>
  )
}