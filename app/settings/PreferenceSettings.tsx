"use client"

import { useTranslation } from "react-i18next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Settings,
  Globe,
  CreditCard,
  Moon,
} from "lucide-react"
import { UserSettings } from "./types/settings"
import { useAuth } from "@/lib/auth-context"

interface PreferenceSettingsProps {
  settings: UserSettings
  updatePreferenceSetting: (key: keyof UserSettings["preferences"], value: string | boolean) => void
}

export function PreferenceSettings({ settings, updatePreferenceSetting }: PreferenceSettingsProps) {
  const { t } = useTranslation()
  const { userType } = useAuth()

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5 text-purple-600" />
          <span>{t("ui.preferences")}</span>
        </CardTitle>
        <CardDescription>{t("ui.preferences_description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span>{t("settings.language_label")}</span>
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
                <span>{t("ui.currency")}</span>
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
                <span>{t("ui.theme")}</span>
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
            {userType === "driver" && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("ui.auto_accept")}</Label>
                  <p className="text-sm text-gray-600">{t("ui.auto_accept_description")}</p>
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
  )
}