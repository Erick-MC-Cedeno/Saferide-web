"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, X, AlertCircle, Loader2, MessageCircle, Phone, User } from 'lucide-react'
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
  driverName: string
  passengerName: string
  onClose?: () => void
}

export function RideChat({ rideId, driverName, passengerName, onClose }: RideChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const mountedRef = useRef(true)
  const retryCountRef = useRef(0)
  const maxRetries = 3
  const { user, userType } = useAuth()
  const [realtimeOK, setRealtimeOK] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const simulateTyping = useCallback(() => {
    setIsTyping(true)
    setTimeout(() => setIsTyping(false), 2000)
  }, [])

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
        // Supabase returns a loosely-typed array (unknown[]). Cast to Message[] after null check.
        setMessages((data ?? []) as unknown as Message[])
      }
    } catch (err: unknown) {
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
      } catch (err: unknown) {
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

            if (payload.new.sender_id !== user?.uid) {
              simulateTyping()
            }

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
    } catch (error: unknown) {
      console.error("Error setting up realtime subscription:", error)
      setRealtimeOK(false)
    }
  }, [rideId, cleanupChannel, simulateTyping, user?.uid])

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
    } catch (err: unknown) {
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
      <Card className="w-full max-w-md mx-auto border-0 shadow-2xl">
        <CardContent className="p-8 flex justify-center items-center h-80">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <Loader2 className="h-6 w-6 animate-spin text-blue-600 absolute -bottom-1 -right-1 bg-white rounded-full" />
            </div>
            <div className="text-center">
              <p className="text-gray-700 font-medium">Cargando chat...</p>
              <p className="text-gray-500 text-sm">Conectando con el conductor</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="h-10 w-10 ring-2 ring-white/30">
                <AvatarFallback className="bg-white/20 text-white font-bold">
                  {userType === "driver" ? passengerName.charAt(0) : driverName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <CardTitle className="text-lg font-bold">{userType === "driver" ? passengerName : driverName}</CardTitle>
              <p className="text-blue-100 text-sm flex items-center">
                <User className="h-3 w-3 mr-1" />
                {userType === "driver" ? "Pasajero" : "Conductor"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {error && (
              <div className="bg-yellow-400/20 p-2 rounded-full">
                <AlertCircle className="h-4 w-4 text-yellow-200" />
              </div>
            )}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full">
              <Phone className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 bg-gray-50">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 m-4 rounded-r-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-3 text-red-400" />
              <div>
                <p className="font-medium">Error de conexión</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="h-80 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-gray-600 font-medium mb-2">¡Inicia la conversación!</p>
              <p className="text-gray-500 text-sm">Envía un mensaje para comunicarte durante el viaje</p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => {
                const { isCurrentUser, name, initial } = getSenderInfo(msg.sender_id, msg.sender_type)
                const isFirstInGroup = index === 0 || messages[index - 1].sender_id !== msg.sender_id
                const isLastInGroup = index === messages.length - 1 || messages[index + 1].sender_id !== msg.sender_id

                return (
                  <div key={msg.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} group`}>
                    <div className={`flex max-w-[85%] ${isCurrentUser ? "flex-row-reverse" : "flex-row"} items-end`}>
                      {!isCurrentUser && isLastInGroup && (
                        <Avatar className="h-8 w-8 mr-2 ring-2 ring-gray-200">
                          <AvatarFallback className="bg-gradient-to-r from-gray-500 to-gray-600 text-white text-sm font-bold">
                            {initial}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {!isCurrentUser && !isLastInGroup && <div className="w-8 mr-2" />}

                      <div className="flex flex-col">
                        {isFirstInGroup && (
                          <div
                            className={`text-xs text-gray-500 mb-1 px-1 ${isCurrentUser ? "text-right" : "text-left"}`}
                          >
                            <span className="font-medium">{name}</span>
                            <span className="mx-1">•</span>
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        )}

                        <div
                          className={`p-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                            isCurrentUser
                              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-2"
                              : "bg-white text-gray-800 border border-gray-200 mr-2"
                          } ${
                            isFirstInGroup && isLastInGroup
                              ? "rounded-2xl"
                              : isFirstInGroup
                                ? isCurrentUser
                                  ? "rounded-tr-md"
                                  : "rounded-tl-md"
                                : isLastInGroup
                                  ? isCurrentUser
                                    ? "rounded-br-md"
                                    : "rounded-bl-md"
                                  : isCurrentUser
                                    ? "rounded-r-md"
                                    : "rounded-l-md"
                          } animate-in slide-in-from-bottom-2 duration-300`}
                        >
                          <p className="text-sm leading-relaxed">{msg.message}</p>
                        </div>
                      </div>

                      {isCurrentUser && isLastInGroup && (
                        <Avatar className="h-8 w-8 ml-2 ring-2 ring-blue-200">
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-bold">
                            {initial}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {isCurrentUser && !isLastInGroup && <div className="w-8 ml-2" />}
                    </div>
                  </div>
                )
              })}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-center space-x-2 bg-gray-200 rounded-full px-4 py-2 animate-pulse">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">escribiendo...</span>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>

      <CardFooter className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSendMessage} className="flex w-full">
          {/* Integrated send button inside input field */}
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="pr-14 py-3 border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
              disabled={sending}
            />
            {/* Send button now positioned inside the input */}
            <Button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
            {/* Typing indicator moved to bottom left of input */}
            {newMessage.trim() && !sending && (
              <div className="absolute left-3 bottom-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
        </form>
      </CardFooter>
    </Card>
  )
}
