"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Settings,
  Bell,
  Moon,
  Globe,
  Shield,
  CreditCard,
  MapPin,
  Volume2,
  Smartphone,
  Mail,
  MessageSquare,
  Eye,
  Lock,
  Trash2,
  Download,
  AlertTriangle,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useToast } from "@/hooks/use-toast"

interface UserSettings {
  notifications: {
    push: boolean
    email: boolean
    sms: boolean
    rideUpdates: boolean
    promotions: boolean
    safety: boolean
  }
  privacy: {
    shareLocation: boolean
    showProfile: boolean
    allowMessages: boolean
  }
  preferences: {
    language: string
    currency: string
    theme: string
    mapStyle: string
    autoAcceptRides: boolean
    soundEnabled: boolean
  }
}

const defaultSettings: UserSettings = {
  notifications: {
    push: true,
    email: true,
    sms: false,
    rideUpdates: true,
    promotions: false,
    safety: true,
  },
  privacy: {
    shareLocation: true,
    showProfile: true,
    allowMessages: true,
  },
  preferences: {
    language: "es",
    currency: "COP",
    theme: "light",
    mapStyle: "default",
    autoAcceptRides: false,
    soundEnabled: true,
  },
}

function SettingsContent() {
  const { user, userType } = useAuth()
  const { toast } = useToast()
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const createDefaultSettings = useCallback(async () => {
    if (!user?.uid || !supabase) return

    try {
      const { error } = await supabase.from("user_settings").upsert(
        {
          uid: user.uid,
          settings: defaultSettings,
        },
        {
          onConflict: "uid",
        },
      )

      if (error) throw error
    } catch (error) {
      console.error("Error creating default settings:", error)
    }
  }, [user?.uid])

  const loadUserSettings = useCallback(async () => {
    if (!user?.uid || !supabase) {
      setInitialLoading(false)
      return
    }
    // Read localStorage first so UI reflects any explicit user override immediately
    let localOverride: boolean | null = null
    try {
      const local = localStorage.getItem("saferide_sound_enabled")
      if (local !== null) {
        const parsed = JSON.parse(local)
        localOverride = Boolean(parsed)
        // apply a quick optimistic state so the UI doesn't flicker
        setSettings((prev) => ({
          ...prev,
          notifications: {
            ...prev.notifications,
            push: Boolean(parsed),
          },
          preferences: {
            ...prev.preferences,
            soundEnabled: Boolean(parsed),
          },
        }))
      }
    } catch (e) {
      console.warn("Could not read saferide_sound_enabled from localStorage before load:", e)
    }

    try {
      const { data, error } = await supabase.from("user_settings").select("settings").eq("uid", user.uid).single()

      if (data?.settings) {
        const serverSettings = (data.settings ?? {}) as Partial<UserSettings>
        const merged = { ...defaultSettings, ...serverSettings }

        // If a localStorage preference exists, prefer it and do not overwrite it.
        try {
          const local = localOverride !== null ? localOverride : (() => {
            const v = localStorage.getItem("saferide_sound_enabled")
            return v !== null ? JSON.parse(v) : null
          })()
            if (local !== null) {
            // mirror local value into merged settings so UI reflects it and server won't overwrite
            merged.notifications = {
              ...merged.notifications,
              push: Boolean(local),
            }
            merged.preferences = {
              ...merged.preferences,
              soundEnabled: Boolean(local),
            }
          
          } else {
            // no local override -> initialize localStorage from server value
            const pushVal = Boolean(merged.notifications?.push)
            try {
              localStorage.setItem("saferide_sound_enabled", JSON.stringify(pushVal))
            } catch (e) {
              console.warn("Could not initialize saferide_sound_enabled in localStorage:", e)
            }
          }
        } catch (e) {
          console.warn("Could not read/write saferide_sound_enabled in localStorage on load:", e)
        }

        setSettings(merged)
      } else if (error && error.code === "PGRST116") {
        // No settings found, create default ones
        await createDefaultSettings()
      }
    } catch (error) {
      console.error("Error loading settings:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las configuraciones.",
        variant: "destructive",
      })
    } finally {
      setInitialLoading(false)
    }
  }, [user?.uid, createDefaultSettings, toast])

  useEffect(() => {
    loadUserSettings()
  }, [loadUserSettings])


  const saveSettings = async () => {
    if (!user?.uid || !supabase) return

    setLoading(true)
    try {
      const { error } = await supabase.from("user_settings").upsert(
        {
          uid: user.uid,
          settings: settings,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "uid",
        },
      )

      if (error) throw error

      toast({
        title: "¡Guardado!",
        description: "Tu configuración se ha guardado exitosamente.",
        duration: 3000,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateNotificationSetting = (key: keyof UserSettings["notifications"], value: boolean) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        notifications: {
          ...prev.notifications,
          [key]: value,
        },
      }
      // If push notifications toggle changed, use it to control sound as requested
      if (key === "push") {
        // Attempt to unlock audio via user gesture and preload the tone
        try {
          const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext
          if (AudioCtx) {
            try {
              const ctx = new AudioCtx()
              if (typeof ctx.resume === 'function') ctx.resume().catch(() => {})
              try {
                const buffer = ctx.createBuffer(1, 1, 22050)
                const src = ctx.createBufferSource()
                src.buffer = buffer
                src.connect(ctx.destination)
                src.start(0)
                src.stop(0)
              } catch (e) {}
            } catch (e) {}
          }
          // fetch and attempt a short play of the tone to ensure permission
          ;(async () => {
            try {
              const res = await fetch('/api/sounds/saferidetone')
              const j = await res.json()
              if (j?.base64) {
                const audio = new Audio(`data:audio/mpeg;base64,${j.base64}`)
                audio.preload = 'auto'
                audio.play().catch(() => {})
              }
            } catch (e) {
              // ignore
            }
          })()
        } catch (e) {
          console.warn('Audio unlock attempt failed on settings toggle:', e)
        }

        try {
          localStorage.setItem("saferide_sound_enabled", JSON.stringify(Boolean(value)))
        } catch (e) {
          console.warn("Could not write saferide_sound_enabled to localStorage:", e)
        }
        // Mirror the push value into preferences.soundEnabled for consistency
        next.preferences = {
          ...next.preferences,
          soundEnabled: Boolean(value),
        }
      }
      return next
    })
  }

  const updatePrivacySetting = (key: keyof UserSettings["privacy"], value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value,
      },
    }))
  }

  const updatePreferenceSetting = (key: keyof UserSettings["preferences"], value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value,
      },
    }))
  }

  const exportData = async () => {
    if (!user?.uid || !supabase) return

    try {
      // Get user data
      const table = userType === "driver" ? "drivers" : "passengers"
      const { data: userInfo } = await supabase.from(table).select("*").eq("uid", user.uid).single()

      // Get ride history
      const column = userType === "driver" ? "driver_id" : "passenger_id"
      const { data: rides } = await supabase.from("rides").select("*").eq(column, user.uid)

      const exportData = {
        user: userInfo,
        rides: rides,
        settings: settings,
        exportDate: new Date().toISOString(),
      }

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `saferide-data-${user.uid}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Datos exportados",
        description: "Tus datos han sido descargados exitosamente.",
      })
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "Error",
        description: "No se pudieron exportar los datos.",
        variant: "destructive",
      })
    }
  }

  const deleteAccount = async () => {
    if (!user?.uid || !supabase) return

    try {
      // This would typically involve calling a server function
      // For now, we'll just show a message
      toast({
        title: "Función no disponible",
        description: "La eliminación de cuenta debe ser procesada por el administrador.",
        variant: "destructive",
      })
      setShowDeleteDialog(false)
    } catch (error) {
      console.error("Error deleting account:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la cuenta.",
        variant: "destructive",
      })
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración</h1>
          <p className="text-gray-600">Personaliza tu experiencia en SafeRide</p>
        </div>

        <div className="space-y-6">
          {/* Notifications */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-blue-600" />
                <span>Notificaciones</span>
              </CardTitle>
              <CardDescription>Controla cómo y cuándo recibes notificaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4" />
                        <span>Notificaciones push</span>
                      </Label>
                      <p className="text-sm text-gray-600">Recibe notificaciones en tu dispositivo</p>
                    </div>
                    <Switch
                      checked={settings.notifications.push}
                      onCheckedChange={(value) => updateNotificationSetting("push", value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>Notificaciones por email</span>
                      </Label>
                      <p className="text-sm text-gray-600">Recibe actualizaciones por correo</p>
                    </div>
                    <Switch
                      checked={settings.notifications.email}
                      onCheckedChange={(value) => updateNotificationSetting("email", value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>SMS</span>
                      </Label>
                      <p className="text-sm text-gray-600">Recibe mensajes de texto</p>
                    </div>
                    <Switch
                      checked={settings.notifications.sms}
                      onCheckedChange={(value) => updateNotificationSetting("sms", value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Actualizaciones de viajes</Label>
                      <p className="text-sm text-gray-600">Estados de tus viajes</p>
                    </div>
                    <Switch
                      checked={settings.notifications.rideUpdates}
                      onCheckedChange={(value) => updateNotificationSetting("rideUpdates", value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Promociones</Label>
                      <p className="text-sm text-gray-600">Ofertas y descuentos</p>
                    </div>
                    <Switch
                      checked={settings.notifications.promotions}
                      onCheckedChange={(value) => updateNotificationSetting("promotions", value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span>Alertas de seguridad</span>
                      </Label>
                      <p className="text-sm text-gray-600">Notificaciones importantes</p>
                    </div>
                    <Switch
                      checked={settings.notifications.safety}
                      onCheckedChange={(value) => updateNotificationSetting("safety", value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-green-600" />
                <span>Privacidad</span>
              </CardTitle>
              <CardDescription>Controla tu información personal y visibilidad</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>Compartir ubicación</span>
                      </Label>
                      <p className="text-sm text-gray-600">Permite que otros vean tu ubicación</p>
                    </div>
                    <Switch
                      checked={settings.privacy.shareLocation}
                      onCheckedChange={(value) => updatePrivacySetting("shareLocation", value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Mostrar perfil</Label>
                      <p className="text-sm text-gray-600">Tu perfil es visible para otros usuarios</p>
                    </div>
                    <Switch
                      checked={settings.privacy.showProfile}
                      onCheckedChange={(value) => updatePrivacySetting("showProfile", value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Permitir mensajes</Label>
                      <p className="text-sm text-gray-600">Otros usuarios pueden enviarte mensajes</p>
                    </div>
                    <Switch
                      checked={settings.privacy.allowMessages}
                      onCheckedChange={(value) => updatePrivacySetting("allowMessages", value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-purple-600" />
                <span>Preferencias</span>
              </CardTitle>
              <CardDescription>Personaliza la apariencia y comportamiento de la app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <span>Idioma</span>
                    </Label>
                    <Select
                      value={settings.preferences.language}
                      onValueChange={(value) => updatePreferenceSetting("language", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Moneda</span>
                    </Label>
                    <Select
                      value={settings.preferences.currency}
                      onValueChange={(value) => updatePreferenceSetting("currency", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COP">Peso Colombiano (COP)</SelectItem>
                        <SelectItem value="MXN">Peso Mexicano (MXN)</SelectItem>
                        <SelectItem value="USD">Dólar Americano (USD)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <Moon className="h-4 w-4" />
                      <span>Tema</span>
                    </Label>
                    <Select
                      value={settings.preferences.theme}
                      onValueChange={(value) => updatePreferenceSetting("theme", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Oscuro</SelectItem>
                        <SelectItem value="system">Automático</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Estilo de mapa</Label>
                    <Select
                      value={settings.preferences.mapStyle}
                      onValueChange={(value) => updatePreferenceSetting("mapStyle", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Por defecto</SelectItem>
                        <SelectItem value="satellite">Satélite</SelectItem>
                        <SelectItem value="terrain">Terreno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center space-x-2">
                        <Volume2 className="h-4 w-4" />
                        <span>Sonidos</span>
                      </Label>
                      <p className="text-sm text-gray-600">Reproducir sonidos de notificación</p>
                    </div>
                    <Switch
                      checked={settings.preferences.soundEnabled}
                      onCheckedChange={(value) => updatePreferenceSetting("soundEnabled", value)}
                    />
                  </div>

                  {userType === "driver" && (
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-aceptar viajes</Label>
                        <p className="text-sm text-gray-600">Acepta automáticamente viajes cercanos</p>
                      </div>
                      <Switch
                        checked={settings.preferences.autoAcceptRides}
                        onCheckedChange={(value) => updatePreferenceSetting("autoAcceptRides", value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data & Security */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5 text-red-600" />
                <span>Datos y Seguridad</span>
              </CardTitle>
              <CardDescription>Gestiona tus datos personales y configuración de seguridad</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Exportar mis datos</h4>
                  <p className="text-sm text-gray-600">Descarga una copia de toda tu información</p>
                </div>
                <Button variant="outline" size="sm" onClick={exportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Eliminar cuenta</h4>
                  <p className="text-sm text-gray-600">Elimina permanentemente tu cuenta y datos</p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>

              {showDeleteDialog && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>¡Atención!</strong> Esta acción no se puede deshacer. Todos tus datos serán eliminados
                    permanentemente.
                    <div className="mt-2 space-x-2">
                      <Button size="sm" variant="destructive" onClick={deleteAccount}>
                        Confirmar eliminación
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowDeleteDialog(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={saveSettings}
              disabled={loading}
              className={`transition-all duration-300 ${
                saveSuccess
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : saveSuccess ? (
                <>
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  ¡Guardado!
                </>
              ) : (
                "Guardar configuración"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  )
}
