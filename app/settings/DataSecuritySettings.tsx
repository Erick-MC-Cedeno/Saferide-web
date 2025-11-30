"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Lock,
  Trash2,
  Download,
  AlertTriangle,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { UserSettings } from "./types/settings"

interface DataSecuritySettingsProps {
  settings: UserSettings
}

export function DataSecuritySettings({ settings }: DataSecuritySettingsProps) {
  const { user, userType } = useAuth()
  const { toast } = useToast()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const exportData = async () => {
    if (!user?.uid || !supabase) return

    setLoading(true)
    try {
      const table = userType === "driver" ? "drivers" : "passengers"
      const { data: userInfo } = await supabase.from(table).select("*").eq("uid", user.uid).single()

      const column = userType === "driver" ? "driver_id" : "passenger_id"
      const { data: rides } = await supabase.from("rides").select("*").eq(column, user.uid)

      const exportData = {
        user: userInfo,
        rides: rides,
        settings: settings,
        exportDate: new Date().toISOString(),
      }

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
    } finally {
      setLoading(false)
    }
  }

  const deleteAccount = async () => {
    if (!user?.uid || !supabase) return

    try {
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

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lock className="h-5 w-5 text-red-600" />
          <span>{t("settings.data_security")}</span>
        </CardTitle>
        <CardDescription>{t("settings.data_security_description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium">{t("ui.export_data")}</h4>
            <p className="text-sm text-gray-600">{t("ui.export_data_description")}</p>
          </div>
          <Button variant="outline" size="sm" onClick={exportData} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            {t("ui.export")}
          </Button>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium">{t("ui.delete_account")}</h4>
            <p className="text-sm text-gray-600">{t("ui.delete_account_description")}</p>
          </div>
          <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            {t("ui.delete")}
          </Button>
        </div>

        {showDeleteDialog && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>{t("ui.delete_warning_title")}</strong> {t("ui.delete_warning_body")}
              <div className="mt-2 space-x-2">
                <Button size="sm" variant="destructive" onClick={deleteAccount}>
                  {t("ui.confirm_delete")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  {t("ui.cancel")}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}