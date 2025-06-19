"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, X, AlertCircle } from "lucide-react"
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
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user, userType } = useAuth()

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("ride_messages")
          .select("*")
          .eq("ride_id", rideId)
          .order("created_at", { ascending: true })

        if (error) throw error
        setMessages(data || [])
      } catch (err: any) {
        console.error("Error loading messages:", err)
        setError("No se pudieron cargar los mensajes. Intenta de nuevo.")
      } finally {
        setLoading(false)
      }
    }

    loadMessages()

    // Subscribe to new messages - CORREGIDO
    const channel = supabase
      .channel(`ride_messages_${rideId}`) // Nombre único del canal
      .on(
        "postgres_changes",
        {
          event: "*", // Escuchar todos los eventos (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "ride_messages",
          filter: `ride_id=eq.${rideId}`,
        },
        (payload) => {
          console.log("Mensaje recibido en tiempo real:", payload)

          if (payload.eventType === "INSERT") {
            const newMessage = payload.new as Message
            setMessages((prev) => {
              // Evitar duplicados
              const exists = prev.some((msg) => msg.id === newMessage.id)
              if (exists) return prev
              return [...prev, newMessage]
            })
          } else if (payload.eventType === "UPDATE") {
            const updatedMessage = payload.new as Message
            setMessages((prev) => prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg)))
          } else if (payload.eventType === "DELETE") {
            const deletedMessage = payload.old as Message
            setMessages((prev) => prev.filter((msg) => msg.id !== deletedMessage.id))
          }
        },
      )
      .subscribe((status) => {
        console.log("Estado de suscripción:", status)
      })

    return () => {
      console.log("Limpiando suscripción de chat")
      supabase.removeChannel(channel)
    }
  }, [rideId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    const messageText = newMessage.trim()
    setNewMessage("") // Limpiar inmediatamente para mejor UX

    try {
      const messageData = {
        ride_id: rideId,
        sender_id: user.uid,
        sender_name: userType === "driver" ? driverName : passengerName,
        sender_type: userType,
        message: messageText,
      }

      console.log("Enviando mensaje:", messageData)

      const { data, error } = await supabase.from("ride_messages").insert(messageData).select() // IMPORTANTE: Seleccionar el mensaje insertado

      if (error) throw error

      console.log("Mensaje enviado exitosamente:", data)

      // El mensaje se agregará automáticamente via suscripción en tiempo real
      // No necesitamos agregarlo manualmente aquí
    } catch (err: any) {
      console.error("Error sending message:", err)
      setError("No se pudo enviar el mensaje. Intenta de nuevo.")
      setNewMessage(messageText) // Restaurar el mensaje si falló
    }
  }

  const getSenderInfo = (senderId: string, senderType: "passenger" | "driver") => {
    const isCurrentUser = user?.uid === senderId
    const name = senderType === "driver" ? driverName : passengerName
    const initial = name.charAt(0).toUpperCase()

    return { isCurrentUser, name, initial }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-4 flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">Chat del Viaje</CardTitle>
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
          />
          <Button type="submit" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
