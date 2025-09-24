"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Send,
  X,
  AlertCircle,
  Loader2,
  MessageCircle,
  Phone,
  User,
  Mic,
  Play,
  Pause,
  Square,
  MapPin,
  Navigation,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"

interface Message {
  id: string
  ride_id: string
  sender_id: string
  sender_name: string
  sender_type: "passenger" | "driver"
  message: string
  message_type?: "text" | "audio" | "location"
  audio_url?: string
  audio_duration?: number
  latitude?: number
  longitude?: number
  location_name?: string
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
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [sharingLocation, setSharingLocation] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const mountedRef = useRef(true)
  const retryCountRef = useRef(0)
  const maxRetries = 3
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { user, userType, userData } = useAuth()
  const [driverProfileImage, setDriverProfileImage] = useState<string | null>(null)
  const [passengerProfileImage, setPassengerProfileImage] = useState<string | null>(null)

  const simulateTyping = useCallback(() => {
    setIsTyping(true)
    setTimeout(() => setIsTyping(false), 2000)
  }, [])

  const shareLocation = async () => {
    if (!user || sharingLocation) return

    setSharingLocation(true)
    setError(null)

    try {
      if (!navigator.geolocation) {
        throw new Error("La geolocalización no está disponible en este dispositivo")
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        })
      })

      const { latitude, longitude } = position.coords

      // Get location name using reverse geocoding (optional)
      let locationName = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`

      try {
        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`,
        )
        if (response.ok) {
          const data = await response.json()
          if (data.features && data.features[0]) {
            locationName = data.features[0].properties.formatted || locationName
          }
        }
      } catch (geocodeError) {
        console.log("Could not get location name:", geocodeError)
      }

      const messageData = {
        ride_id: rideId,
        sender_id: user.uid,
        sender_name: userType === "driver" ? driverName : passengerName,
        sender_type: userType,
        message: `📍 Ubicación compartida`,
        message_type: "location" as const,
        latitude,
        longitude,
        location_name: locationName,
      }

      const { data, error } = await supabase.from("ride_messages").insert(messageData).select()

      if (error) throw error

      console.log("Location shared successfully:", data)
      setError(null)
    } catch (err: unknown) {
      console.error("Error sharing location:", err)
      let errorMessage = "No se pudo compartir la ubicación"

      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = "Permisos de ubicación denegados. Habilita la ubicación en tu navegador."
            break
          case err.POSITION_UNAVAILABLE:
            errorMessage = "No se pudo obtener tu ubicación. Intenta de nuevo."
            break
          case err.TIMEOUT:
            errorMessage = "Tiempo de espera agotado. Intenta de nuevo."
            break
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }

      setError(errorMessage)
    } finally {
      setSharingLocation(false)
    }
  }

  const openLocationInMaps = (latitude: number, longitude: number, locationName?: string) => {
    const query = locationName || `${latitude},${longitude}`
    const encodedQuery = encodeURIComponent(query)

    // Try to open in Google Maps app first, fallback to web
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    window.open(googleMapsUrl, "_blank")
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks((prev) => [...prev, event.data])
        }
      }

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
      }

      setMediaRecorder(recorder)
      setAudioChunks([])
      recorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error starting recording:", error)
      setError("No se pudo acceder al micrófono. Verifica los permisos.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  const cancelRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      setAudioChunks([])
      setRecordingTime(0)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  const sendAudioMessage = async () => {
    if (audioChunks.length === 0 || !user) return

    setSending(true)

    try {
      console.log("[v0] Starting audio upload process...")

      const audioBlob = new Blob(audioChunks, { type: "audio/webm" })
      const fileName = `audio_${Date.now()}_${user.uid}.webm`

      console.log("[v0] Audio blob size:", audioBlob.size, "bytes")
      console.log("[v0] Uploading to bucket: ride-audio-messages")

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("ride-audio-messages")
        .upload(fileName, audioBlob, {
          contentType: "audio/webm",
          upsert: false,
        })

      if (uploadError) {
        console.error("[v0] Upload error:", uploadError)
        throw new Error(`Error subiendo audio: ${uploadError.message}`)
      }

      console.log("[v0] Upload successful:", uploadData)

      const { data: urlData } = supabase.storage.from("ride-audio-messages").getPublicUrl(fileName)

      console.log("[v0] Public URL generated:", urlData.publicUrl)

      const messageData = {
        ride_id: rideId,
        sender_id: user.uid,
        sender_name: userType === "driver" ? driverName : passengerName,
        sender_type: userType,
        message: "🎵 Mensaje de voz",
        message_type: "audio" as const,
        audio_url: urlData.publicUrl,
        audio_duration: recordingTime,
      }

      console.log("[v0] Inserting message data:", messageData)

      const { data, error } = await supabase.from("ride_messages").insert(messageData).select()

      if (error) {
        console.error("[v0] Database insert error:", error)
        throw new Error(`Error guardando mensaje: ${error.message}`)
      }

      console.log("[v0] Audio message sent successfully:", data)
      setError(null)
      setAudioChunks([])
      setRecordingTime(0)
    } catch (err: unknown) {
      console.error("[v0] Error sending audio message:", err)
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      setError(`No se pudo enviar el mensaje de voz: ${errorMessage}`)
    } finally {
      setSending(false)
    }
  }

  const playAudio = (audioUrl: string, messageId: string) => {
    if (playingAudio === messageId) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      setPlayingAudio(null)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }

      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.onended = () => {
        setPlayingAudio(null)
      }

      audio.onerror = () => {
        setError("No se pudo reproducir el mensaje de voz.")
        setPlayingAudio(null)
      }

      audio.play()
      setPlayingAudio(messageId)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

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

  const setupRealtimeSubscription = useCallback(async () => {
    if (!mountedRef.current) return

    await cleanupChannel()

    try {
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
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [loadMessages, setupRealtimeSubscription, cleanupChannel])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const loadProfileImages = async () => {
      if (!supabase) return

      try {
        const { data: driverData } = await supabase
          .from("drivers")
          .select("profile_image")
          .eq("name", driverName)
          .single()

        if (driverData?.profile_image) {
          setDriverProfileImage(driverData.profile_image)
        }

        const { data: passengerData } = await supabase
          .from("passengers")
          .select("profile_image")
          .eq("name", passengerName)
          .single()

        if (passengerData?.profile_image) {
          setPassengerProfileImage(passengerData.profile_image)
        }
      } catch (error) {
        console.log("Could not load profile images:", error)
      }
    }

    loadProfileImages()
  }, [driverName, passengerName])

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
        message_type: "text" as const,
      }

      console.log("Enviando mensaje:", messageData)

      const { data, error } = await supabase.from("ride_messages").insert(messageData).select()

      if (error) throw error

      console.log("Mensaje enviado exitosamente:", data)
      setError(null)
    } catch (err: unknown) {
      console.error("Error sending message:", err)
      setError("No se pudo enviar el mensaje. Intenta de nuevo.")
      setNewMessage(messageText)
    } finally {
      setSending(false)
    }
  }

  const getSenderInfo = (senderId: string, senderType: "passenger" | "driver") => {
    const isCurrentUser = user?.uid === senderId
    const name = senderType === "driver" ? driverName : passengerName
    const initial = name.charAt(0).toUpperCase()
    const profileImage = senderType === "driver" ? driverProfileImage : passengerProfileImage

    return { isCurrentUser, name, initial, profileImage }
  }

  const [realtimeOK, setRealtimeOK] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

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
                <AvatarImage
                  src={userType === "driver" ? passengerProfileImage || undefined : driverProfileImage || undefined}
                  alt="Profile"
                  className="object-cover"
                />
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
                const { isCurrentUser, name, initial, profileImage } = getSenderInfo(msg.sender_id, msg.sender_type)
                const isFirstInGroup = index === 0 || messages[index - 1].sender_id !== msg.sender_id
                const isLastInGroup = index === messages.length - 1 || messages[index + 1].sender_id !== msg.sender_id

                return (
                  <div key={msg.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} group`}>
                    <div className={`flex max-w-[85%] ${isCurrentUser ? "flex-row-reverse" : "flex-row"} items-end`}>
                      {!isCurrentUser && isLastInGroup && (
                        <Avatar className="h-8 w-8 mr-2 ring-2 ring-gray-200">
                          <AvatarImage src={profileImage || undefined} alt="Profile" className="object-cover" />
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
                          {msg.message_type === "audio" && msg.audio_url ? (
                            <div className="flex items-center space-x-3">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => playAudio(msg.audio_url!, msg.id)}
                                className={`h-8 w-8 rounded-full ${
                                  isCurrentUser ? "hover:bg-white/20 text-white" : "hover:bg-blue-50 text-blue-600"
                                }`}
                              >
                                {playingAudio === msg.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                              </Button>
                              <div className="flex-1">
                                <div className={`text-sm ${isCurrentUser ? "text-white" : "text-gray-800"}`}>
                                  🎵 Mensaje de voz
                                </div>
                                <div className={`text-xs ${isCurrentUser ? "text-blue-100" : "text-gray-500"}`}>
                                  {formatTime(msg.audio_duration || 0)}
                                </div>
                              </div>
                            </div>
                          ) : msg.message_type === "location" && msg.latitude && msg.longitude ? (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <MapPin className={`h-4 w-4 ${isCurrentUser ? "text-white" : "text-red-500"}`} />
                                <span
                                  className={`text-sm font-medium ${isCurrentUser ? "text-white" : "text-gray-800"}`}
                                >
                                  Ubicación compartida
                                </span>
                              </div>
                              <div className={`text-xs ${isCurrentUser ? "text-blue-100" : "text-gray-600"} mb-2`}>
                                {msg.location_name || `${msg.latitude.toFixed(6)}, ${msg.longitude.toFixed(6)}`}
                              </div>
                              <div className="bg-gray-200 rounded-lg p-2 relative overflow-hidden">
                                <div className="h-24 bg-gradient-to-br from-green-100 to-blue-100 rounded flex items-center justify-center">
                                  <MapPin className="h-8 w-8 text-red-500" />
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => openLocationInMaps(msg.latitude!, msg.longitude!, msg.location_name)}
                                  className="w-full mt-2 h-8 bg-green-500 hover:bg-green-600 text-white text-xs"
                                >
                                  <Navigation className="h-3 w-3 mr-1" />
                                  Ver en Maps
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed">{msg.message}</p>
                          )}
                        </div>
                      </div>

                      {isCurrentUser && isLastInGroup && (
                        <Avatar className="h-8 w-8 ml-2 ring-2 ring-blue-200">
                          <AvatarImage src={profileImage || undefined} alt="Profile" className="object-cover" />
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
        {isRecording ? (
          <div className="flex w-full items-center space-x-3 bg-red-50 p-3 rounded-xl border border-red-200">
            <div className="flex items-center space-x-2 flex-1">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-700 font-medium">Grabando...</span>
              <span className="text-red-600 text-sm">{formatTime(recordingTime)}</span>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={cancelRecording}
                className="h-8 px-3 border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={stopRecording} className="h-8 px-3 bg-red-500 hover:bg-red-600 text-white">
                <Square className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : audioChunks.length > 0 ? (
          <div className="flex w-full items-center space-x-3 bg-green-50 p-3 rounded-xl border border-green-200">
            <div className="flex items-center space-x-2 flex-1">
              <Mic className="h-4 w-4 text-green-600" />
              <span className="text-green-700 font-medium">Audio grabado</span>
              <span className="text-green-600 text-sm">{formatTime(recordingTime)}</span>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setAudioChunks([])
                  setRecordingTime(0)
                }}
                className="h-8 px-3 border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={sendAudioMessage}
                disabled={sending}
                className="h-8 px-3 bg-green-500 hover:bg-green-600 text-white"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex w-full space-x-2">
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="pr-14 py-3 border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                disabled={sending}
              />
              <Button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
              {newMessage.trim() && !sending && (
                <div className="absolute left-3 bottom-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
            <Button
              type="button"
              onClick={shareLocation}
              disabled={sending || sharingLocation}
              className="h-12 w-12 rounded-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              {sharingLocation ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <MapPin className="h-5 w-5 text-white" />
              )}
            </Button>
            <Button
              type="button"
              onClick={startRecording}
              disabled={sending}
              className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              <Mic className="h-5 w-5 text-white" />
            </Button>
          </form>
        )}
      </CardFooter>
    </Card>
  )
}
