"use client"

import React, { useEffect, useState } from "react"
import { I18nextProvider } from "react-i18next"
import { initI18n } from "@/lib/i18n"
import i18n from "i18next"

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true
    initI18n().then(() => {
      if (mounted) setReady(true)
    })

    return () => {
      mounted = false
    }
  }, [])

  if (!ready) return <>{children}</>

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
