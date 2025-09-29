"use client"

import React, { useEffect, useState } from "react"
import { Car } from "lucide-react"

const UNREAD_KEY = "saferide:devchat-unread"

export default function DevChatButton({ className = "" }: { className?: string }) {
  const [unread, setUnread] = useState<number>(0)
  const [visible, setVisible] = useState<boolean>(true)

  useEffect(() => {
    if (typeof window === "undefined") return
    const raw = window.localStorage.getItem(UNREAD_KEY)
    const initial = raw ? parseInt(raw, 10) || 0 : 0

    // If there's no key or it's 0, initialize with 1 so the badge shows (visual indicator)
    // Opening the chat will clear it.
    if (!raw || initial === 0) {
      try {
        window.localStorage.setItem(UNREAD_KEY, "1")
      } catch (_) {}
      setUnread(1)
      // notify others
      window.dispatchEvent(new CustomEvent("saferide:devchat-unread", { detail: 1 }))
    } else {
      setUnread(initial)
    }

    const onUnread = (e: Event) => {
      // custom event may include detail or just read localStorage
      const detail = (e as CustomEvent).detail
      if (typeof detail === "number") {
        setUnread(detail)
      } else {
        const r = window.localStorage.getItem(UNREAD_KEY)
        setUnread(r ? parseInt(r, 10) || 0 : 0)
      }
    }

  const onRead = () => setUnread(0)
  const onOpened = () => setVisible(false)
  const onClosed = () => setVisible(true)

  window.addEventListener("saferide:devchat-unread", onUnread as EventListener)
  window.addEventListener("saferide:devchat-read", onRead as EventListener)
  window.addEventListener("saferide:devchat-opened", onOpened as EventListener)
  window.addEventListener("saferide:devchat-closed", onClosed as EventListener)

    // storage event for other tabs
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === UNREAD_KEY) {
        const v = ev.newValue
        setUnread(v ? parseInt(v, 10) || 0 : 0)
      }
    }
    window.addEventListener("storage", onStorage)

    return () => {
      window.removeEventListener("saferide:devchat-unread", onUnread as EventListener)
      window.removeEventListener("saferide:devchat-read", onRead as EventListener)
      window.removeEventListener("saferide:devchat-opened", onOpened as EventListener)
      window.removeEventListener("saferide:devchat-closed", onClosed as EventListener)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  const open = () => {
    if (typeof window === "undefined") return
    // clear unread immediately so badge disappears
    try {
      window.localStorage.setItem(UNREAD_KEY, "0")
    } catch (_) {}
    window.dispatchEvent(new CustomEvent("saferide:devchat-read"))

    try {
      if ((window as any).openDevChat) {
        ;(window as any).openDevChat()
        return
      }
    } catch (_) {}
    window.dispatchEvent(new Event("saferide:open-dev-chat"))
  }

  return (
    // hide button when chat is open
    visible ? (
      <button
        onClick={open}
        aria-label="Abrir saferide AI"
        className={`relative w-16 h-16 rounded-full shadow-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center transform hover:scale-105 transition-all duration-200 ${className}`}
      >
        <Car className="h-8 w-8" />

        {unread > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold leading-none text-white bg-rose-500 rounded-full shadow-lg">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    ) : null
  )
}
