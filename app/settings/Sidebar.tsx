"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Settings,
  Menu,
  Car,
  Clock,
  LogOut,
  History,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface SidebarProps {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  currentView: string
  setCurrentView: (view: string) => void
}

export function Sidebar({ sidebarCollapsed, setSidebarCollapsed, currentView, setCurrentView }: SidebarProps) {
  const { user, userType, signOut, userData } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const { t } = useTranslation()

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

  return (
    <div
      className={`${sidebarCollapsed ? "w-16 !text-gray-700" : "w-64"} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}
    >
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

      {!sidebarCollapsed && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={(userData as Record<string, unknown> | null)?.profile_image as string | undefined} alt={t("ui.profile_photo")} />
              <AvatarFallback className="bg-blue-600 text-white font-semibold text-lg">
                {String(((userData as { name?: string; full_name?: string } | null) ?? {})?.name ?? String(((userData as { full_name?: string } | null)?.full_name ?? user?.email ?? "")).split("@")[0]).charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">
                {String(((userData as { name?: string; full_name?: string } | null) ?? {})?.name ?? String(((userData as { full_name?: string } | null)?.full_name ?? user?.email ?? "")).split("@")[0]) || t("ui.user")}
              </h3>
              <p className="text-sm text-gray-500 hover:text-blue-600 cursor-pointer">{t("ui.view_profile")}</p>
            </div>
          </div>
        </div>
      )}

      {sidebarCollapsed && (
        <div className="p-3 border-b border-gray-200 flex justify-center">
          <Avatar className="w-10 h-10">
            <AvatarImage src={(userData as Record<string, unknown> | null)?.profile_image as string | undefined} alt="Foto de perfil" />
            <AvatarFallback className="bg-blue-600 text-white font-semibold text-sm">
              {String(((userData as { name?: string; full_name?: string } | null) ?? {})?.name ?? String(((userData as { full_name?: string } | null)?.full_name ?? user?.email ?? "")).split("@")[0]).charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

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
                <Clock
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
                  handleNavigation("/history")
                }}
                className={`w-full flex items-center ${sidebarCollapsed ? "justify-center relative" : "space-x-3"} ${sidebarCollapsed ? "px-2" : "px-4"} py-3 rounded-lg text-left transition-colors ${
                  currentView === "history" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <History className={`${sidebarCollapsed ? "h-6 w-6" : "h-5 w-5"} ${currentView === "history" ? "text-white stroke-current" : "!text-gray-700 !stroke-current"}`} />
                {!sidebarCollapsed && <span className="font-medium">{t("ui.history")}</span>}
              </button>
            </>
          )}
        </div>
      </nav>

      <div className="mt-auto p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          aria-label={sidebarCollapsed ? "Cerrar sesión" : undefined}
          className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : "space-x-3"} px-3 py-3 rounded-lg text-left text-gray-700 hover:bg-gray-100 transition-colors`}
        >
          <LogOut className={`${sidebarCollapsed ? "h-6 w-6 text-gray-700" : "h-5 w-5 text-gray-700"}`} />
          {!sidebarCollapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </div>
  )
}