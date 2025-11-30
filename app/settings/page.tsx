"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import i18n from "i18next"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useToast } from "@/hooks/use-toast"
import { Sidebar } from "./Sidebar"
import { NotificationSettings } from "./NotificationSettings"
import { PreferenceSettings } from "./PreferenceSettings"
import { DataSecuritySettings } from "./DataSecuritySettings"
import { UserSettings, defaultSettings, AudioCtxConstructor } from "./types/settings"

function SettingsContent() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      if (typeof window === "undefined") return true
      const v = window.localStorage.getItem("saferide:sidebar-collapsed")
      return v === null ? true : v === "true"
    } catch (e) {
      return true
    }
  })
  const [currentView, setCurrentView] = useState<string>("settings")
  const { t } = useTranslation()

  const createDefaultSettings = useCallback(async () => {
    if (!user?.uid || !supabase) return

    try {
      const { error } = await supabase.from("user_settings").upsert(
        {
          user_id: user.uid,
          settings: defaultSettings,
        },
        {
          onConflict: "user_id",
        },
      )

      if (error) throw error
    } catch (error) {
      console.error("Error creating default settings:", error)
    }
  }, [user?.uid])

  const emitStorageEvent = (key: string, value: string) => {
    try {
      // Some browsers/environments don't allow constructing StorageEvent.
      // Use a CustomEvent fallback so we never throw during render.
      const detail = { key, newValue: value }
      try {
        window.dispatchEvent(new CustomEvent("saferide:storage", { detail }))
      } catch (e) {
        // as a last resort, try a no-detail Event so other listeners don't crash
        try {
          window.dispatchEvent(new Event("saferide:storage"))
        } catch {}
      }
    } catch (e) {
      console.warn("Could not emit storage fallback event:", e)
    }
  }

  const emitPrefChanged = (key: string, value: string) => {
    try {
      window.dispatchEvent(new CustomEvent("saferide:pref-changed", { detail: { key, value } }))
    } catch {
      // ignore
    }
  }

  const loadUserSettings = useCallback(async () => {
    if (!user?.uid || !supabase) {
      setInitialLoading(false)
      return
    }

    let localOverrideSound: boolean | null = null
    let localOverrideChat: boolean | null = null
    try {
      if (user?.uid) {
        const soundKey = `saferide_sound_enabled_${user.uid}`
        const chatKey = `saferide_chat_notification_${user.uid}`
        const localSound = localStorage.getItem(soundKey)
        if (localSound !== null) {
          const parsed = JSON.parse(localSound)
          localOverrideSound = Boolean(parsed)
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
        const localChat = localStorage.getItem(chatKey)
        if (localChat !== null) {
          const parsed = JSON.parse(localChat)
          localOverrideChat = Boolean(parsed)
          setSettings((prev) => ({
            ...prev,
            notifications: {
              ...prev.notifications,
              chatNotifications: Boolean(parsed),
            },
          }))
        }
      }
    } catch (e) {
      console.warn("Could not read sound/chat settings from localStorage before load:", e)
    }

    try {
      const res = await supabase.from("user_settings")
        .select("settings")
        .eq("user_id", user.uid)
        .single()
      const { data, error } = res as unknown as { data?: { settings?: unknown } | null; error?: unknown }

      if (data && data.settings) {
        const serverSettings = (data.settings ?? {}) as Partial<UserSettings>
        const merged = { ...defaultSettings, ...serverSettings }

        try {
          const localSound =
            localOverrideSound !== null
              ? localOverrideSound
              : (() => {
                  if (!user?.uid) return null
                  const v = localStorage.getItem(`saferide_sound_enabled_${user.uid}`)
                  return v !== null ? JSON.parse(v) : null
                })()
          if (localSound !== null) {
            merged.notifications = { ...merged.notifications, push: Boolean(localSound) }
            merged.preferences = { ...merged.preferences, soundEnabled: Boolean(localSound) }
          } else {
            const pushVal = Boolean(merged.notifications?.push)
            try {
              if (user?.uid) {
                const key = `saferide_sound_enabled_${user.uid}`
                localStorage.setItem(key, JSON.stringify(pushVal))
                emitStorageEvent(key, JSON.stringify(pushVal))
              }
            } catch (e) {
              console.warn("Could not initialize saferide_sound_enabled in localStorage:", e)
            }
          }

          const localChat =
            localOverrideChat !== null
              ? localOverrideChat
              : (() => {
                  if (!user?.uid) return null
                  const v = localStorage.getItem(`saferide_chat_notification_${user.uid}`)
                  return v !== null ? JSON.parse(v) : null
                })()
          if (localChat !== null) {
            merged.notifications = { ...merged.notifications, chatNotifications: Boolean(localChat) }
          } else {
            const chatVal = Boolean(merged.notifications?.chatNotifications)
            try {
              if (user?.uid) {
                const key = `saferide_chat_notification_${user.uid}`
                localStorage.setItem(key, JSON.stringify(chatVal))
                emitStorageEvent(key, JSON.stringify(chatVal))
              }
            } catch (e) {
              console.warn("Could not initialize saferide_chat_notification in localStorage:", e)
            }
          }
        } catch (e) {
          console.warn("Could not read/write sound/chat settings in localStorage on load:", e)
        }

        setSettings(merged)
      } else if (error && (error as unknown as { code?: string }).code === "PGRST116") {
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
          user_id: user.uid,
          settings: settings,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
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

      if (key === "push") {
        try {
          const AudioGlobal = window as unknown as { AudioContext?: unknown; webkitAudioContext?: unknown }
          const AudioCtx = AudioGlobal.AudioContext || AudioGlobal.webkitAudioContext
          if (AudioCtx) {
            try {
              // AudioCtx is an unknown runtime constructor (window provided). Cast to a local constructor type.
              // Safely attempt to construct an AudioContext-like instance.
              let ctx: InstanceType<AudioCtxConstructor> | null = null
              try {
                ctx = new (AudioCtx as AudioCtxConstructor)()
              } catch (err) {
                // Some environments expose an AudioContext-like object that's not constructible.
                ctx = null
              }

              if (ctx) {
                if (typeof ctx.resume === "function") ctx.resume().catch(() => {})
                try {
                  const buffer = ctx.createBuffer(1, 1, 22050)
                  const src = ctx.createBufferSource()
                  src.buffer = buffer
                  src.connect(ctx.destination)
                  src.start(0)
                  src.stop(0)
                } catch {
                  // ignore buffer errors
                }
              }
            } catch {
              // ignore audio init errors
            }
          }
          ;(async () => {
            try {
              const res = await fetch("/api/sounds/saferidetone")
              const j = await res.json()
              if (j?.base64) {
                const audio = new Audio(`data:audio/mpeg;base64,${j.base64}`)
                audio.preload = "auto"
                audio.play().catch(() => {})
              }
            } catch {
              // ignore fetch/play errors
            }
          })()
        } catch (e) {
          console.warn("Audio unlock attempt failed on settings toggle:", e)
        }

        try {
          if (user?.uid) {
            const key = `saferide_sound_enabled_${user.uid}`
            const valStr = JSON.stringify(Boolean(value))
            localStorage.setItem(key, valStr)
            emitStorageEvent(key, valStr)
            emitPrefChanged(key, valStr)
          }
        } catch (e) {
          console.warn("Could not write saferide_sound_enabled to localStorage:", e)
        }
        next.preferences = { ...next.preferences, soundEnabled: Boolean(value) }
      }

      if (key === "chatNotifications") {
        try {
          if (user?.uid) {
            const key = `saferide_chat_notification_${user.uid}`
            const valStr = JSON.stringify(Boolean(value))
            localStorage.setItem(key, valStr)
            emitStorageEvent(key, valStr)
            emitPrefChanged(key, valStr)
          }

          // If enabling chat notifications, play a sample chat tone to demonstrate
          if (value === true) {
            ;(async () => {
              try {
                const res = await fetch("/api/sounds/saferidechattone")
                const j = await res.json()
                if (j?.base64) {
                  const audio = new Audio(`data:audio/mpeg;base64,${j.base64}`)
                  audio.preload = "auto"
                  audio.play().catch(() => {})
                }
              } catch (e) {
                // ignore sample play errors
              }
            })()
          }
        } catch (e) {
          console.warn("Could not write saferide_chat_notification to localStorage:", e)
        }
      }

      return next
    })
  }

  const updatePreferenceSetting = (key: keyof UserSettings["preferences"], value: string | boolean) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        preferences: {
          ...prev.preferences,
          [key]: value,
        },
      }

      if (key === "language") {
        const lang = String(value)
        try {
          i18n.changeLanguage(lang).catch(() => {})
        } catch {}

        try {
          localStorage.setItem("saferide:lang", lang)
        } catch {}

        ;(async () => {
          try {
            if (user?.uid && supabase) {
              await supabase.from("user_settings").upsert(
                {
                  user_id: user.uid,
                  settings: next,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id" },
              )
            }
          } catch (e) {
            console.warn("Could not persist language to DB:", e)
          }
        })()
      }

      return next
    })
  }

  if (initialLoading) {
    return (
      <div className="flex h-screen bg-white">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("settings.title")}</h1>
            <p className="text-gray-600">{t("settings.subtitle")}</p>
          </div>

          <div className="space-y-6">
            <NotificationSettings
              settings={settings}
              updateNotificationSetting={updateNotificationSetting}
            />

            <PreferenceSettings
              settings={settings}
              updatePreferenceSetting={updatePreferenceSetting}
            />

            <DataSecuritySettings settings={settings} />

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
                  t("settings.save")
                )}
              </Button>
            </div>
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