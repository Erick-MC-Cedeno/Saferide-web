"use client"

import React, { useState, useEffect, useRef } from "react"

type Message = {
  id: string
  from: "user" | "bot" | "system"
  text: string
}

export function DevelopmentNotice(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isMounted, setIsMounted] = useState(false) // for enter animation trigger
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const timeoutsRef = useRef<number[]>([])
  const initialShownRef = useRef(false)
  const messagesRef = useRef<Message[]>([])
  const closeTimeoutRef = useRef<number | null>(null)
  const isClosingRef = useRef(false)

  // Enfocar input al abrir
  useEffect(() => {
    // focus when enter animation completed / mounted
    if (isMounted) {
      inputRef.current?.focus()
    }
  }, [isMounted])

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(t => clearTimeout(t))
      timeoutsRef.current = []
    }
  }, [])

  // Autoscroll
  useEffect(() => {
    if (!isOpen) return
    const el = containerRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages, isOpen])

  // Mantener copia de mensajes
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Abrir chat desde botón externo
  useEffect(() => {
    // open/close helpers allow smooth animations
    const openChat = () => {
      // cancel any pending close
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
      setIsClosing(false)
      isClosingRef.current = false
      setIsOpen(true)
      // trigger enter animation on next tick
      setIsMounted(false)
      // clear unread badge when opening
      try {
        window.localStorage.setItem("saferide:devchat-unread", "0")
      } catch (_) {}
      window.dispatchEvent(new CustomEvent("saferide:devchat-read"))
      // notify UI (like the button) that the chat opened
      try {
        window.dispatchEvent(new CustomEvent("saferide:devchat-opened"))
      } catch (_) {}

      window.setTimeout(() => setIsMounted(true), 20)
    }

    window.addEventListener("saferide:open-dev-chat", openChat)
    ;(window as any).openDevChat = () => window.dispatchEvent(new Event("saferide:open-dev-chat"))

    return () => {
      window.removeEventListener("saferide:open-dev-chat", openChat)
      try {
        delete (window as any).openDevChat
      } catch (_) {}
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
    }
  }, [])

  // Saludo inicial SOLO al abrir manualmente
  useEffect(() => {
    if (isOpen && !initialShownRef.current) {
      initialShownRef.current = true
      const botId = `b-init-${Date.now()}`
      const greeting = "Hola, saludos. Hay algo en lo que pueda ayudarte?"
      pushMessage({ id: botId, from: "bot", text: "" })
      setLoading(true)
      animateTyping(botId, greeting).catch(err => {
        console.error("animateTyping failed", err)
        setLoading(false)
        updateMessageText(botId, greeting)
      })
    }
  }, [isOpen])

  // Close helper that runs animation then unmounts
  function closeChat() {
    // if already closing, ignore (use ref for synchronous guard)
    if (isClosingRef.current) return
    isClosingRef.current = true
    setIsClosing(true)
    setIsMounted(false)

    // clear any previously scheduled close just in case
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }

    // match duration in classes (200ms + small buffer)
    const t = window.setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
      isClosingRef.current = false
      closeTimeoutRef.current = null
      try {
        window.dispatchEvent(new CustomEvent("saferide:devchat-closed"))
      } catch (_) {}
    }, 220)
    closeTimeoutRef.current = t
  }

  function pushMessage(m: Message) {
    setMessages(prev => [...prev, m])
    // if bot message arrives while chat closed, increment unread counter
    if (m.from === "bot" && !isOpen) {
      try {
        const key = "saferide:devchat-unread"
        const raw = window.localStorage.getItem(key)
        const cur = raw ? parseInt(raw, 10) || 0 : 0
        const next = cur + 1
        window.localStorage.setItem(key, String(next))
        window.dispatchEvent(new CustomEvent("saferide:devchat-unread", { detail: next }))
      } catch (e) {
        // ignore storage errors
      }
    }
  }

  function updateMessageText(id: string, text: string) {
    setMessages(prev => prev.map(m => (m.id === id ? { ...m, text } : m)))
  }

  function scheduleTimeout(fn: () => void, ms: number) {
    const wrapped = () => {
      try {
        fn()
      } finally {
        timeoutsRef.current = timeoutsRef.current.filter(id => id !== t)
      }
    }
    const t = window.setTimeout(wrapped, ms)
    timeoutsRef.current.push(t)
    return t
  }

  async function animateTyping(
    id: string,
    fullText: string,
    charDelay = 25,
    initialDelay = 300
  ) {
    let accumulated = initialDelay
    scheduleTimeout(() => updateMessageText(id, ""), accumulated)
    for (let i = 0; i < fullText.length; i++) {
      const ch = fullText[i]
      accumulated += charDelay
      if (".,!?".includes(ch)) accumulated += 80
      scheduleTimeout(() => {
        setMessages(prev =>
          prev.map(m =>
            m.id === id ? { ...m, text: (m.text ?? "") + ch } : m
          )
        )
      }, accumulated)
    }
    scheduleTimeout(() => setLoading(false), accumulated + 50)
  }

  async function handleSend() {
    const text = input.trim()
    if (!text) return
    setInput("")
    const id = `u-${Date.now()}`
    pushMessage({ id, from: "user", text })

    setLoading(true)
    const safetyId = window.setTimeout(() => {
      setLoading(false)
    }, 12000)
    timeoutsRef.current.push(safetyId)
    try {
      const res = await fetch("http://localhost:4000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`Status ${res.status}: ${txt}`)
      }
      const data = await res.json()
      const reply = (
        data.reply ?? data.response ?? data.message ?? ""
      ).toString()
      const botId = `b-${Date.now()}`
      pushMessage({ id: botId, from: "bot", text: "" })
      await animateTyping(botId, reply || "(sin respuesta)")
      timeoutsRef.current = timeoutsRef.current.filter(id => id !== safetyId)
    } catch (err: any) {
      const errId = `b-err-${Date.now()}`
      pushMessage({ id: errId, from: "bot", text: "" })
      await animateTyping(errId, `Error: ${err?.message ?? String(err)}`)
      timeoutsRef.current = timeoutsRef.current.filter(id => id !== safetyId)
    } finally {
      if (!timeoutsRef.current.length) setLoading(false)
    }
  }

  return (
  <div className="fixed inset-x-4 bottom-4 z-50 sm:inset-auto sm:right-5 sm:bottom-5" aria-live="polite">
      {/* keep mounted during closing animation */}
      {(isOpen || isClosing) && (
        <div
          className="w-full max-w-xl sm:w-96 sm:max-w-[calc(100%-40px)] box-border"
          role="dialog"
          aria-label="Chat de desarrollo"
        >
          <div
            className={`relative sm:rounded-lg rounded-t-xl shadow-2xl overflow-hidden border border-white/5 transform transition-all duration-200 ease-out ${
              isMounted && !isClosing ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95"
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-800/90 to-purple-800/85 blur-[0.5px] -z-10"></div>
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 font-semibold text-white">
              <div>saferide AI</div>
              <button
                aria-label="Cerrar chat"
                onClick={() => closeChat()}
                disabled={isClosing}
                className={`bg-transparent border-0 text-slate-400 ${isClosing ? "cursor-default opacity-60" : "cursor-pointer"} text-sm`}
              >
                Cerrar
              </button>
            </div>
            <div
              ref={containerRef}
              className="max-h-[60vh] sm:h-72 overflow-y-auto p-3 bg-gradient-to-tr from-slate-900/60 to-slate-800/50 backdrop-blur-sm"
            >
              {messages.map(m => (
                <div
                  key={m.id}
                  className={`mb-3 flex items-end ${
                    m.from === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Bot avatar on left */}
                  {m.from !== "user" && (
                    <div className="mr-3 flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold text-xs shadow-md">
                        AI
                      </div>
                    </div>
                  )}

                  <div className={`relative max-w-[78%] px-3 py-2 text-sm ${m.from === "user" ? "text-white" : "text-white"}`}>
                    {/* bubble */}
                    <div
                      className={`relative z-10 rounded-xl px-3 py-2 break-words ${
                        m.from === "user"
                          ? "bg-sky-600 shadow-lg"
                          : "bg-gradient-to-r from-slate-800/90 to-slate-700/80 ring-1 ring-white/5 shadow-md"
                      }`}
                    >
                      {/* small sender label for bot */}
                      {m.from !== "user" && (
                        <div className="text-[11px] text-slate-300 font-medium mb-1">saferide AI</div>
                      )}
                      <div>{m.text}</div>
                    </div>

                    {/* tail */}
                    {m.from !== "user" ? (
                      <span className="absolute left-[-6px] bottom-1 w-3 h-3 bg-slate-700/90 transform rotate-45" aria-hidden />
                    ) : (
                      <span className="absolute right-[-6px] bottom-1 w-3 h-3 bg-sky-600 transform rotate-45" aria-hidden />
                    )}
                  </div>

                  {/* spacer for user avatar alignment */}
                  {m.from === "user" && <div className="ml-3 w-8 h-8" />}
                </div>
              ))}
            </div>
            <div className="p-3 sm:p-3 pb-4">
              <div className="relative">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  placeholder={loading ? "Procesando..." : "Escribe un mensaje..."}
                  disabled={loading}
                  aria-label="Mensaje"
                  className="w-full pr-12 pl-3 py-3 rounded-md border border-white/5 bg-slate-800 text-white placeholder-slate-400 box-border"
                />
                <button
                  onClick={handleSend}
                  disabled={loading}
                  aria-label="Enviar mensaje"
                  className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-md font-semibold ${
                    loading
                      ? "bg-slate-500 text-slate-200 cursor-default"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  }`}
                >
                  {loading ? "..." : "Enviar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
