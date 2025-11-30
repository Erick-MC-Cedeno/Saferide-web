"use client"

import { useTranslation } from "react-i18next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Bell,
  Smartphone,
  Mail,
  Shield,
  MessageCircle,
} from "lucide-react"
import { UserSettings } from "./types/settings"

interface NotificationSettingsProps {
  settings: UserSettings
  updateNotificationSetting: (key: keyof UserSettings["notifications"], value: boolean) => void
}

export function NotificationSettings({ settings, updateNotificationSetting }: NotificationSettingsProps) {
  const { t } = useTranslation()

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-blue-600" />
          <span>{t("ui.notifications")}</span>
        </CardTitle>
        <CardDescription>{t("ui.notifications_description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center space-x-2">
                  <Smartphone className="h-4 w-4" />
                  <span>{t("ui.push_notifications")}</span>
                </Label>
                <p className="text-sm text-gray-600">{t("ui.push_notifications_description")}</p>
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
                  <span>{t("ui.email_notifications")}</span>
                </Label>
                <p className="text-sm text-gray-600">{t("ui.email_notifications_description")}</p>
              </div>
              <Switch
                checked={settings.notifications.email}
                onCheckedChange={(value) => updateNotificationSetting("email", value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>{t("ui.security_alerts")}</span>
                </Label>
                <p className="text-sm text-gray-600">{t("ui.security_alerts_description")}</p>
              </div>
              <Switch
                checked={settings.notifications.safety}
                onCheckedChange={(value) => updateNotificationSetting("safety", value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>{t("ui.chat_sound")}</span>
                </Label>
                <p className="text-sm text-gray-600">{t("ui.chat_sound_description")}</p>
              </div>
              <Switch
                checked={settings.notifications.chatNotifications}
                onCheckedChange={(value) => updateNotificationSetting("chatNotifications", value)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}