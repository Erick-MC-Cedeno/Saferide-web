import i18n from "i18next"
import { initReactI18next } from "react-i18next"

async function loadLocale(locale: string) {
  try {
    const res = await fetch(`/locales/${locale}/common.json`)
    if (!res.ok) throw new Error("Failed to load locale")
    return await res.json()
  } catch (e) {
    return null
  }
}

export async function initI18n() {
  if (i18n.isInitialized) return i18n

  const defaultLocale = typeof window !== "undefined" ? localStorage.getItem("saferide:lang") || "es" : "es"

  const [en, es] = await Promise.all([loadLocale("en"), loadLocale("es")])

  const resources: Record<string, any> = {}
  if (en) resources.en = { common: en }
  if (es) resources.es = { common: es }

  await i18n.use(initReactI18next).init({
    resources,
    lng: defaultLocale,
    fallbackLng: "es",
    ns: ["common"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
  })

  return i18n
}

export default i18n
