"use client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Database, CheckCircle, Wifi, WifiOff } from "lucide-react"
import { useEffect, useState } from "react"

export function DevelopmentNotice() {
  const [supabaseAvailable, setSupabaseAvailable] = useState<boolean>(!!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))

  useEffect(() => {
    const id = setInterval(() => {
      setSupabaseAvailable(!!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
    }, 2000)
    return () => clearInterval(id)
  }, [])

  const hasSupabase = supabaseAvailable
  const hasMaps = !!(process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY)
  const showNotice = process.env.NODE_ENV === "development" || !hasSupabase

  if (!showNotice) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Alert className="border-blue-200 bg-blue-50">
        <AlertTriangle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="space-y-2">
            <p className="font-medium">Estado de Servicios</p>
            <div className="text-sm space-y-1">
              <div className="flex items-center space-x-2">
                {hasSupabase ? <Wifi className="h-3 w-3 text-green-600" /> : <WifiOff className="h-3 w-3 text-red-600" />}
                <span className={hasSupabase ? "text-green-700" : "text-red-700"}>Supabase {hasSupabase ? "✓ Conectado" : "✗ Desconectado"}</span>
              </div>

              <div className="flex items-center space-x-2">
                {hasMaps ? <CheckCircle className="h-3 w-3 text-green-600" /> : <Database className="h-3 w-3 text-red-600" />}
                <span className={hasMaps ? "text-green-700" : "text-red-700"}>Mapas {hasMaps ? "✓" : "Opcional"}</span>
              </div>
            </div>

            {!hasSupabase && <p className="text-xs">Configura las variables de entorno para funcionalidad completa.</p>}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
