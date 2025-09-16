"use client"

import React from 'react'

// COMPONENTE DE INSTALACIÓN PWA
// MUESTRA UN BANNER PARA SUGERIR LA INSTALACIÓN DE LA PWA.
// - SOPORTA ANDROID (beforeinstallprompt) Y MUESTRA INSTRUCCIONES PARA IOS.
// - DISEÑADO PARA SER RESPONSIVE Y OPTIMIZADO PARA DISPOSITIVOS MÓVILES.

const STORAGE_KEY = 'pwa_install_rejected_v1'

// FUNCIÓN AUXILIAR: DETERMINA SI EL DISPOSITIVO ES MÓVIL (INCLUYE IPADOS)
function isMobileDevice() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  // LOS NAVEGADORES MODERNOS PUEDEN EXPONER userAgentData.mobile (CHROMIUM)
  const uaDataMobile = (navigator as any).userAgentData && (navigator as any).userAgentData.mobile
  // DETECCIÓN BÁSICA DE MÓVILES: TELÉFONOS, TABLETS E INCLUIR ANDROID
  // DETECTAR IPADOS QUE REPORTA MacIntel PERO TIENE PUNTOS TÁCTILES
  const platform = (navigator as any).userAgentData?.platform || navigator.platform || ''
  const isIpadOs = platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1
  return Boolean(
    uaDataMobile ||
      /Mobi|Android|iPhone|iPad|iPod|Silk|Mobile|Tablet/i.test(ua) ||
      /Android/i.test(platform) ||
      isIpadOs
  )
}

export function PWAInstallPrompt() {
  // ESTADOS LOCALES
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null) // EVENTO beforeinstallprompt ALMACENADO
  const [visible, setVisible] = React.useState(false) // SI EL BANNER ESTÁ VISIBLE
  const [isIos, setIsIos] = React.useState(false) // FLAG: SE DETECTÓ iOS / iPadOS
  const [isAndroid, setIsAndroid] = React.useState(false) // FLAG: SE DETECTÓ ANDROID
  const [showInstructions, setShowInstructions] = React.useState(false) // SI SE MUESTRAN LAS INSTRUCCIONES MANUALES
  const [showDebug, setShowDebug] = React.useState(false) // PANEL DE DEPURACIÓN (ACTIVABLE POR QUERY PARAM)

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    // BLOQUE: DETECCIÓN DE PLATAFORMA
    // UTILIZA userAgent, userAgentData.platform Y navigator.platform PARA DETERMINAR IOS/ANDROID/DESKTOP
    const detectPlatform = () => {
      const ua = navigator.userAgent || ''
      const uaData = (navigator as any).userAgentData || {}
      const platform = uaData.platform || navigator.platform || ''

      // SUBBLOQUE: DETECCIÓN iOS / IPADOS
      const isiOSUA = /iPhone|iPad|iPod/i.test(ua)
      const isiPadOS = platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1
      const isiOS = isiOSUA || isiPadOS || /iPad|iPhone|iPod/i.test(platform)

      // SUBBLOQUE: DETECCIÓN ANDROID
      const isAndroid = /Android/i.test(ua) || /Android/i.test(platform) || (uaData.platform && /Android/i.test(uaData.platform))

      // SUBBLOQUE: HEURÍSTICA MÓVIL GENERAL (CASO GENÉRICO)
      const isMobileGeneric = /Mobi|Mobile|Tablet|Silk/i.test(ua) || (navigator as any).maxTouchPoints > 0 && (isiOS || isAndroid)

      // DETERMINAR SI ES DESKTOP (NO IOS, NO ANDROID, NO MÓVIL GENÉRICO)
      const isDesktop = !isiOS && !isAndroid && !isMobileGeneric

      return { isiOS, isAndroid, isDesktop }
    }

    const { isiOS, isAndroid, isDesktop } = detectPlatform()
    setIsIos(!!isiOS)
    setIsAndroid(!!isAndroid)
    // if it's desktop, ensure android flag is false
    if (isDesktop) setIsAndroid(false)

    // BLOQUE: MANEJO DEL EVENTO `beforeinstallprompt`
    // CAPTURAMOS EL EVENTO, LLAMAMOS A preventDefault() Y LO ALMACENAMOS EN `deferredPrompt`
    // ASÍ EL BOTÓN 'INSTALAR' PUEDE LLAMAR A prompt() EN RESPUESTA AL GESTO DEL USUARIO.
    const onBeforeInstallPrompt = (e: any) => {
      try {
        e.preventDefault()
      } catch (err) {
        // IGNORAR SI preventDefault NO ESTÁ DISPONIBLE
      }
      if ((typeof window !== 'undefined') && new URLSearchParams(window.location.search).get('pwa_debug') === '1') {
        console.info('PWAInstallPrompt: beforeinstallprompt recibido; SE ALMACENA PARA USO POSTERIOR')
      }
      setDeferredPrompt(e)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener)

    // BLOQUE: LÓGICA PARA MOSTRAR SUGERENCIA EN IOS/DESKTOP DESPUÉS DE PEQUEÑO RETRASO
    let iosTimer: number | undefined
    if (isiOS) {
      iosTimer = window.setTimeout(() => {
        if ((typeof window !== 'undefined') && new URLSearchParams(window.location.search).get('pwa_debug') === '1') {
          console.info('PWAInstallPrompt: MOSTRANDO SUGERENCIA DE INSTALACIÓN EN IOS')
        }
        setVisible(true)
      }, 1500)
    }
    // Show for desktop early so users see the hint
    if (isDesktop) {
      iosTimer = window.setTimeout(() => {
        if ((typeof window !== 'undefined') && new URLSearchParams(window.location.search).get('pwa_debug') === '1') {
          console.info('PWAInstallPrompt: MOSTRANDO SUGERENCIA DE INSTALACIÓN EN DESKTOP')
        }
        setVisible(true)
      }, 800)
    }

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener)
      if (iosTimer) window.clearTimeout(iosTimer)
    }
  }, [])

  // BLOQUE: ACTIVACIÓN DEL PANEL DE DEPURACIÓN MEDIANTE EL PARAMETRO ?pwa_debug=1
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.get('pwa_debug') === '1') setShowDebug(true)
    } catch (e) {
      // IGNORAR ERRORES AL PARSEAR LA URL
    }
  }, [])

  // HANDLER: AL HACER CLICK EN EL BOTÓN 'INSTALAR' O 'CÓMO INSTALAR'
  // SI TENEMOS `deferredPrompt` LLAMAMOS A prompt(), SI NO MOSTRAMOS INSTRUCCIONES SEGÚN PLATAFORMA
  const handleInstallClick = async () => {
    if (deferredPrompt && (deferredPrompt as any).prompt) {
      try {
        ;(deferredPrompt as any).prompt()
        const choiceResult = await (deferredPrompt as any).userChoice
        // EL RESULTADO userChoice PUEDE SER 'accepted' O 'dismissed'
        if (choiceResult && choiceResult.outcome === 'accepted') {
          setVisible(false)
        } else {
          // user dismissed the native install dialog
          setVisible(false)
        }
      } catch (err) {
        console.error('PWA install prompt error', err)
      } finally {
        setDeferredPrompt(null)
      }
    } else if (isIos) {
      // EN IOS NO HAY beforeinstallprompt: MOSTRAR INSTRUCCIONES MANUALES
      setVisible(false)
    } else if (isAndroid) {
      // ANDROID: SI NO HAY deferredPrompt MOSTRAR LOS PASOS MANUALES
      setShowInstructions(true)
    } else {
      // DESKTOP: FLUJO DE RESPALDO - MOSTRAR INSTRUCCIONES GENERALES
      setShowInstructions(true)
    }
  }

  // HANDLER: CERRAR/OCULTAR EL BANNER
  const handleDismiss = () => {
    setVisible(false)
  }

  if (!visible && !showDebug) return null

  // Render banner (when visible) and optional debug panel (when ?pwa_debug=1)
  return (
    <>
      {visible && (
        <div className="fixed inset-x-4 bottom-6 z-50 mx-auto max-w-3xl">
          <div className="rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border border-slate-200 dark:border-slate-800 shadow-lg px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex-shrink-0">
                  <img src="/placeholder-logo.png" alt="app" className="h-12 w-12 rounded-lg shadow-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">Instalar Saferide</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 truncate">Añade la app a la pantalla principal para una experiencia optimizada.</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              {showInstructions ? (
                  <div className="text-xs text-slate-600 dark:text-slate-300 max-w-sm">
                  {isIos ? (
                    <div>
                      <div className="font-medium">Instalación en iOS</div>
                      <div className="mt-1">1. Pulsa el botón Compartir (ícono ⬆︎). 2. Selecciona "Añadir a pantalla de inicio". 3. Confirma.</div>
                    </div>
                  ) : isAndroid ? (
                    <div>
                      <div className="font-medium">Instalación en Android</div>
                      <div className="mt-1">1. Abre el menú del navegador (⋮) en la esquina superior. 2. Selecciona "Añadir a la pantalla de inicio" o "Instalar app". 3. Sigue las indicaciones.</div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium">Instalación en Desktop</div>
                      <div className="mt-1">En navegadores compatibles (Chrome/Edge) puedes encontrar "Instalar" en el menú de la barra de direcciones o en las opciones del navegador.</div>
                    </div>
                  )}
                  <div className="mt-3 flex gap-2 flex-col sm:flex-row">
                    <button onClick={() => setShowInstructions(false)} className="w-full sm:w-auto px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-700">Atrás</button>
                    <button onClick={handleDismiss} className="w-full sm:w-auto px-3 py-2 text-sm text-slate-500">Cerrar</button>
                  </div>
                </div>
              ) : (
                <>
                  {isIos ? (
                    <button onClick={handleInstallClick} className="inline-flex items-center gap-2 justify-center px-4 py-3 rounded-md text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-md hover:from-cyan-600 hover:to-emerald-500 w-full sm:w-auto">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3v12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 12l7-7 7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Cómo instalar
                    </button>
                  ) : (
                    (deferredPrompt && (deferredPrompt as any).prompt) ? (
                      <button onClick={handleInstallClick} className="inline-flex items-center gap-2 justify-center px-4 py-3 rounded-md text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-md hover:from-cyan-600 hover:to-emerald-500 w-full sm:w-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3v12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 12l7-7 7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Instalar
                      </button>
                    ) : (
                      <button onClick={handleInstallClick} className="inline-flex items-center gap-2 justify-center px-4 py-3 rounded-md text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-md hover:from-cyan-600 hover:to-emerald-500 w-full sm:w-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3v12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 12l7-7 7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Cómo instalar
                      </button>
                    )
                  )}
                  <button onClick={handleDismiss} className="px-3 py-3 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 w-full sm:w-auto">Cerrar</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showDebug && (
        <div className="fixed left-4 bottom-20 z-50 w-72 max-w-full rounded-md bg-white/95 p-3 shadow-lg text-xs text-slate-800 dark:bg-slate-900/95 dark:text-slate-200">
          <div className="flex items-center justify-between mb-2">
            <strong>PWA debug</strong>
            <div className="flex items-center gap-2">
              <button onClick={() => setVisible(true)} className="btn btn-ghost btn-sm">Forzar banner</button>
              <button onClick={() => { setVisible(false); setShowDebug(false) }} className="text-xs text-slate-500">Cerrar</button>
            </div>
          </div>
          <div className="space-y-1">
            <div>Ruta: <code>{typeof window !== 'undefined' ? window.location.pathname : 'unknown'}</code></div>
            <div>Visible: <strong>{String(visible)}</strong></div>
            <div>isIos: <strong>{String(isIos)}</strong></div>
            <div>isAndroid: <strong>{String(isAndroid)}</strong></div>
            <div>isDesktop: <strong>{String(!isAndroid && !isIos)}</strong></div>
            <div className="break-words">UA: <small>{typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'}</small></div>
            <div>Deferred prompt: <strong>{deferredPrompt ? 'sí' : 'no'}</strong></div>
            <div>Show instructions: <strong>{String(showInstructions)}</strong></div>
          </div>
        </div>
      )}
    </>
  )
}