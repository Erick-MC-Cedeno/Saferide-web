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

  // Don't render children until i18n is initialized. Rendering children
  // before the provider is ready causes react-i18next to complain with
  // NO_I18NEXT_INSTANCE when components call `useTranslation`.
  if (!ready) return null

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
