"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Shield, User, Settings, History, CreditCard, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from "@/lib/auth-context"

export function Navbar() {
  const { user, userData, userType, signOut, refreshUserData } = useAuth()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const hasInitialLoad = useRef(false)

  // Update profile image when userData changes
  useEffect(() => {
    if (userData?.profile_image) {
      setProfileImage(userData.profile_image)
    } else {
      setProfileImage(null)
    }
  }, [userData])

  // Only refresh if we have a user but no userData yet (initial load scenario)
  useEffect(() => {
    if (user?.uid && !userData && !hasInitialLoad.current) {
      hasInitialLoad.current = true
      refreshUserData()
    } else if (!user?.uid) {
      hasInitialLoad.current = false
    }
  }, [user?.uid, userData, refreshUserData])

  const handleSignOut = async () => {
    try {
      hasInitialLoad.current = false // Reset flag on logout
      await signOut()
      
      // Pequeña pausa para asegurar que la operación de cierre de sesión se complete
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Usar window.location.href en lugar de router.push para forzar una recarga completa
      window.location.href = "/"
      setMobileMenuOpen(false); // Close mobile menu on sign out
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      // En caso de error, forzar recarga de la página
      window.location.reload()
    }
  }

  const getUserInitials = () => {
    if (userData?.name) {
      return userData.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return user?.email?.[0].toUpperCase() || "U"
  }

  const navigation = [
    { name: "Inicio", href: "/" },
    { name: "Servicios", href: "/services" },
    { name: "Seguridad", href: "/safety" },
    { name: "Soporte", href: "/support" },
  ]

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 md:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                SafeRide
              </span>
              <div className="text-xs text-gray-500 -mt-1">Transporte Seguro</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* User Menu or Auth Buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              // Hide this div on mobile screens
              <div className="hidden md:flex items-center space-x-3">
                {/* User Type Badge */}
                <Badge
                  variant={userType === "driver" ? "default" : "secondary"}
                  className={userType === "driver" ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {userType === "driver" ? "Conductor" : "Pasajero"}
                </Badge>
                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10 border-2 border-blue-200 hover:border-blue-300 transition-colors">
                        <AvatarImage
                          src={profileImage || "/placeholder.svg?height=40&width=40"}
                          alt="Foto de perfil"
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userData?.name || "Usuario"}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Perfil</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Configuración</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/history" className="flex items-center">
                        <History className="mr-2 h-4 w-4" />
                        <span>Historial</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/payments" className="flex items-center">
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>Pagos</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Button asChild variant="ghost" className="text-gray-700 hover:text-blue-600">
                  <Link href="/auth/login">Iniciar Sesión</Link>
                </Button>
                <Button
                  asChild
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  <Link href="/auth/register">Registrarse</Link>
                </Button>
              </div>
            )}
            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`fixed inset-y-0 left-0 transform ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out z-50 md:hidden`}
        >
          <div className="h-full flex flex-col">
            <div className="px-4 py-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xl font-semibold text-gray-800">Menú</span>
                <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              <div className="flex flex-col space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-700 hover:bg-gray-50 hover:text-blue-600 px-4 py-3 text-sm font-medium transition-colors duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}

                {user ? (
                  <div className="mt-4 px-4 py-3 border-t border-gray-200">
                    <div className="flex flex-col space-y-4">
                      {/* User Info and Badge */}
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10 border-2 border-blue-200">
                          <AvatarImage src={profileImage || "/placeholder.svg?height=40&width=40"} alt="Foto de perfil" className="object-cover" />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{userData?.name || "Usuario"}</p>
                          <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <Badge
                        variant={userType === "driver" ? "default" : "secondary"}
                        className={userType === "driver" ? "bg-green-600 hover:bg-green-700 w-fit" : "w-fit"}
                      >
                        {userType === "driver" ? "Conductor" : "Pasajero"}
                      </Badge>

                      {/* Navigation Links for Authenticated User */}
                      <div className="flex flex-col space-y-1">
                        <Link href="/profile" className="flex items-center text-gray-700 hover:bg-gray-50 hover:text-blue-600 px-4 py-3 text-sm font-medium transition-colors duration-200 -mx-4" onClick={() => setMobileMenuOpen(false)}>
                          <User className="mr-2 h-4 w-4" />
                          <span>Perfil</span>
                        </Link>
                        <Link href="/settings" className="flex items-center text-gray-700 hover:bg-gray-50 hover:text-blue-600 px-4 py-3 text-sm font-medium transition-colors duration-200 -mx-4" onClick={() => setMobileMenuOpen(false)}>
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Configuración</span>
                        </Link>
                        <Link href="/history" className="flex items-center text-gray-700 hover:bg-gray-50 hover:text-blue-600 px-4 py-3 text-sm font-medium transition-colors duration-200 -mx-4" onClick={() => setMobileMenuOpen(false)}>
                          <History className="mr-2 h-4 w-4" />
                          <span>Historial</span>
                        </Link>
                        <Link href="/payments" className="flex items-center text-gray-700 hover:bg-gray-50 hover:text-blue-600 px-4 py-3 text-sm font-medium transition-colors duration-200 -mx-4" onClick={() => setMobileMenuOpen(false)}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          <span>Pagos</span>
                        </Link>
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-200 -mx-4">
                        <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 px-4 py-3 text-sm font-medium transition-colors duration-200" onClick={handleSignOut}>
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Cerrar Sesión</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 px-4 py-3 border-t border-gray-200">
                    <div className="flex flex-col space-y-3">
                      <Button asChild variant="outline" className="w-full justify-center">
                        <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                          Iniciar Sesión
                        </Link>
                      </Button>
                      <Button
                        asChild
                        className="w-full justify-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                      >
                        <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                          Registrarse
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </div>
    </nav>
  )
}