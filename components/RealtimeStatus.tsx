"use client"

import { Badge } from "@/components/ui/badge"
import { RefreshCw, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RealtimeStatusProps {
  lastUpdate: Date
  onRefresh?: () => void
  isLoading?: boolean
}

export function RealtimeStatus({ lastUpdate, onRefresh, isLoading }: RealtimeStatusProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const getTimeDiff = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000)
    if (diff < 60) return `${diff}s`
    if (diff < 3600) return `${Math.floor(diff / 60)}m`
    return `${Math.floor(diff / 3600)}h`
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <Clock className="w-3 h-3 mr-1" />
        Actualizado hace {getTimeDiff(lastUpdate)}
      </Badge>

      <div className="text-xs text-gray-500">{formatTime(lastUpdate)}</div>

      {onRefresh && (
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading} className="h-6 px-2">
          <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      )}
    </div>
  )
}
