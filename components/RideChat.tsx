"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, X, AlertCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"

interface Message {
  id: string
  ride_id: string
  sender_id: string
  sender_name: string
  sender_type: "passenger" | "driver"
  message: string
  created_at: string
}

interface RideChatProps {
  rideId: string
  driverId: string
  driverName: string
  passengerId: string
  passengerName: string
  onClose?: () => void
}

export function RideChat({ rideId, driverId, driverName, passengerId, passengerName, onClose }: RideChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const mountedRef = useRef(true)
  const retryCountRef = useRef(0)
  const maxRetries = 3
  const { user, userType } = useAuth()
  const [realtimeOK, setRealtimeOK] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Función para cargar mensajes iniciales
  const loadMessages = useCallback(async () => {
    if (!mountedRef.current) return

    try {
      setError(null)
      const { data, error } = await supabase
        .from("ride_messages")
        .select("*")
        .eq("ride_id", rideId)
        .order("created_at", { ascending: true })

      if (error) throw error

      if (mountedRef.current) {
        setMessages(data || [])
      }
    } catch (err: any) {
      console.error("Error loading messages:", err)
      if (mountedRef.current) {
        setError("No se pudieron cargar los mensajes. Intenta de nuevo.")
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [rideId])

  // Función para limpiar canal
  const cleanupChannel = useCallback(async () => {
    if (channelRef.current) {
      try {
        console.log("Cleaning up realtime channel")
        const status = await supabase.removeChannel(channelRef.current)
        console.log("Channel cleanup status:", status)
        channelRef.current = null
      } catch (err: any) {
        console.error("Error removing channel:", err)
      }
    }
  }, [])

  // Función para configurar suscripción en tiempo real
  const setupRealtimeSubscription = useCallback(async () => {
    if (!mountedRef.current) return

    await cleanupChannel()

    try {
      // Usar un nombre de canal más simple y único por ride
      const channelName = `ride-chat-${rideId}`

      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "ride_messages",
            filter: `ride_id=eq.${rideId}`,
          },
          (payload) => {
            if (!mountedRef.current) return

            setMessages((prev) => {
              // Evitar duplicados
              if (prev.some((m) => m.id === payload.new.id)) {
                return prev
              }
              return [...prev, payload.new as Message]
            })
          },
        )
        .subscribe((status, err) => {
          if (!mountedRef.current) return

          console.log(`Realtime subscription status: ${status}`)

          if (status === "SUBSCRIBED") {
            setRealtimeOK(true)
            setError(null)
            retryCountRef.current = 0
            console.log("Successfully subscribed to ride chat")
          } else if (status === "CHANNEL_ERROR") {
            console.error("Channel error:", err)
            setRealtimeOK(false)
            if (retryCountRef.current < maxRetries) {
              retryCountRef.current++
              console.log(`Retrying connection (${retryCountRef.current}/${maxRetries})`)
              setTimeout(() => {
                if (mountedRef.current) {
                  setupRealtimeSubscription()
                }
              }, 2000 * retryCountRef.current)
            }
          } else if (status === "TIMED_OUT") {
            console.warn("Realtime connection timed out")
            setRealtimeOK(false)
          } else if (status === "CLOSED") {
            console.warn("Realtime connection closed")
            setRealtimeOK(false)
          }
        })

      channelRef.current = channel
    } catch (error) {
      console.error("Error setting up realtime subscription:", error)
      setRealtimeOK(false)
    }
  }, [rideId, cleanupChannel])

  // Efecto principal
  useEffect(() => {
    mountedRef.current = true

    const initializeChat = async () => {
      await loadMessages()
      await setupRealtimeSubscription()
    }

    initializeChat()

    return () => {
      mountedRef.current = false
      cleanupChannel()
    }
  }, [loadMessages, setupRealtimeSubscription, cleanupChannel])

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || sending) return

    const messageText = newMessage.trim()
    setNewMessage("")
    setSending(true)

    try {
      const messageData = {
        ride_id: rideId,
        sender_id: user.uid,
        sender_name: userType === "driver" ? driverName : passengerName,
        sender_type: userType,
        message: messageText,
      }

      console.log("Enviando mensaje:", messageData)

      const { data, error } = await supabase.from("ride_messages").insert(messageData).select()

      if (error) throw error

      console.log("Mensaje enviado exitosamente:", data)
      setError(null)
    } catch (err: any) {
      console.error("Error sending message:", err)
      setError("No se pudo enviar el mensaje. Intenta de nuevo.")
      setNewMessage(messageText) // Restaurar mensaje si falló
    } finally {
      setSending(false)
    }
  }

  const getSenderInfo = (senderId: string, senderType: "passenger" | "driver") => {
    const isCurrentUser = user?.uid === senderId
    const name = senderType === "driver" ? driverName : passengerName
    const initial = name.charAt(0).toUpperCase()

    return { isCurrentUser, name, initial }
  }

  useEffect(() => {
    if (!realtimeOK) {
      intervalRef.current = setInterval(loadMessages, 4000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [realtimeOK, loadMessages])

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-4 flex justify-center items-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Cargando chat...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            Chat del Viaje
            {error && <AlertCircle className="h-4 w-4 ml-2 text-yellow-300" />}
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 text-white hover:bg-blue-700">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="h-64 overflow-y-auto mb-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No hay mensajes aún.</p>
              <p className="text-sm">Envía el primer mensaje para comunicarte.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const { isCurrentUser, name, initial } = getSenderInfo(msg.sender_id, msg.sender_type)

              return (
                <div key={msg.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                  <div className={`flex max-w-[80%] ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
                    <Avatar className={`h-8 w-8 ${isCurrentUser ? "ml-2" : "mr-2"}`}>
                      <AvatarImage src="/placeholder.svg?height=32&width=32" />
                      <AvatarFallback
                        className={isCurrentUser ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}
                      >
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className={`text-xs text-gray-500 mb-1 ${isCurrentUser ? "text-right" : "text-left"}`}>
                        {name} •{" "}
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div
                        className={`p-3 rounded-lg ${
                          isCurrentUser
                            ? "bg-blue-600 text-white rounded-tr-none"
                            : "bg-gray-100 text-gray-800 rounded-tl-none"
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <form onSubmit={handleSendMessage} className="flex w-full space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1"
            disabled={sending}
          />
          <Button type="submit" disabled={!newMessage.trim() || sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
