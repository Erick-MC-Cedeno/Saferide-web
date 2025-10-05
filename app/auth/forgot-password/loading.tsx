import { Loader2, Shield } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function ForgotPasswordLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Shield className="h-12 w-12 text-blue-600 mb-4" />
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">SafeRide</h2>
          <p className="text-gray-600 text-center">Cargando...</p>
        </CardContent>
      </Card>
    </div>
  )
}
