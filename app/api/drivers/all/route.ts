import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Tipos locales para mejorar seguridad de tipos
type RawDriver = Record<string, unknown>

type CleanDriver = {
  id: unknown
  uid: string
  email: string | null
  name: string
  phone: string | null
  license_number: string | null
  vehicle_plate: string
  vehicle_model: string
  vehicle_year: unknown
  is_verified: boolean
  rating: number
  total_trips: number
  is_online: boolean
  current_location: unknown | null
  distance_km: number | null
  created_at: unknown
  updated_at: unknown
}


// HANDLER PARA LA SOLICITUD GET - OBTENER TODOS LOS CONDUCTORES EN UN RADIO
export async function GET(request: NextRequest) {
  const startTime = Date.now() // TIEMPO DE INICIO PARA MEDIR EL TIEMPO DE RESPUESTA

  // debug log removed

  try {
    // VERIFICAR QUE EL CLIENTE SUPABASE ESTE DISPONIBLE
    if (!supabase) {
      console.error(`[driverData] Supabase client no está disponible`)
      return NextResponse.json(
        {
          success: false,
          error: "Error de configuración del servidor",
          details: "Cliente de base de datos no disponible",
        },
        { status: 500 },
      )
    }

    // LEER PARAMETROS DE BUSQUEDA OPCIONALES PARA LA URL: LATITUD, LONGITUD Y RADIO EN KM (lat, lng, radiusKm)
    const latParam = request.nextUrl.searchParams.get("lat")
    const lngParam = request.nextUrl.searchParams.get("lng")
    const radiusParam = request.nextUrl.searchParams.get("radiusKm")
    const pickupLat = latParam ? parseFloat(latParam) : null
    const pickupLng = lngParam ? parseFloat(lngParam) : null


    // LEER EL VALOR POR DEFECTO DEL RADIO DESDE VARIABLES DE ENTORNO (server primero, luego public)
    const serverVal = process.env.RADIO
    const publicVal = process.env.NEXT_PUBLIC_RADIO


    // LEER PARAMETROS DE BUSQUEDA OPCIONALES PARA LA URL: RADIO EN KM (radiusKm)
    let maxDistanceKm: number | null = null
    if (radiusParam) {
      const parsed = parseFloat(radiusParam)
      if (isNaN(parsed)) {
        return NextResponse.json(
          { success: false, error: "Parámetro radiusKm inválido" },
          { status: 400 },
        )
      }
      maxDistanceKm = parsed
    } else {
      const serverParsed = serverVal ? parseFloat(serverVal) : NaN
      const publicParsed = publicVal ? parseFloat(publicVal) : NaN
      const chosen = !isNaN(serverParsed) ? serverParsed : !isNaN(publicParsed) ? publicParsed : NaN
      if (isNaN(chosen)) {
        return NextResponse.json(
          { success: false, error: "Aún no hay rangos configurados" },
          { status: 400 },
        )
      }
      maxDistanceKm = chosen
    }



    // HELPER: FUNCIÓN HAVERSINE PARA CALCULAR LA DISTANCIA EN KM ENTRE DOS PUNTOS {lat, lon}
    const haversineDistance = (loc1: { lat: number; lon: number }, loc2: { lat: number; lon: number }) => {
      const R = 6371 // km
      const toRad = (deg: number) => (deg * Math.PI) / 180
      const dLat = toRad(loc2.lat - loc1.lat)
      const dLon = toRad(loc2.lon - loc1.lon)
      const lat1 = toRad(loc1.lat)
      const lat2 = toRad(loc2.lat)
      const a = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    }

    // CONSULTAR TODOS LOS CONDUCTORES DESDE LA BASE DE DATOS
    const { data: rawDrivers, error } = await supabase
      .from("drivers")
      .select(`
        id,
        uid,
        email,
        name,
        phone,
        license_number,
        vehicle_plate,
        vehicle_model,
        vehicle_year,
        is_verified,
        rating,
        total_trips,
        is_online,
        current_location,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error(`[driverData] Error en consulta Supabase:`, error)
      return NextResponse.json(
        {
          success: false,
          error: "Error al consultar la base de datos",
          details: error.message,
        },
        { status: 500 },
      )
    }

  const queryTime = Date.now() - startTime

    // PROCESAR Y LIMPIAR LOS DATOS OBTENIDOS
  const processStartTime = Date.now()
  const validDrivers: CleanDriver[] = []
    let duplicatesRemoved = 0
    let nullsRemoved = 0
    let malformedRemoved = 0
    const seenUids = new Set()
  // Trabajar con datos genéricos y validar propiedades explícitamente
  const driversArray = (rawDrivers as RawDriver[]) || []

    if (driversArray && Array.isArray(driversArray)) {
      for (const driver of driversArray) {
        // Eliminar nulos o sin datos esenciales
        if (!driver || driver == null) {
          nullsRemoved++
          continue
        }

        // Normalizar y validar UID
        const rawUid = (driver as Record<string, unknown>)?.uid
        const uid = rawUid == null ? "" : String(rawUid)
        if (!uid) {
          nullsRemoved++
          continue
        }

        // ELIMINAR DUPLICADOS POR UID
        if (seenUids.has(uid)) {
          duplicatesRemoved++
          continue
        }
        seenUids.add(uid)

        // Validar estructura de datos: nombre
        const nameVal = (driver as Record<string, unknown>)?.name
        if (typeof nameVal !== "string" || nameVal.trim().length === 0) {
          malformedRemoved++
          continue
        }
        const name = nameVal.trim()

        // SI SE ENVIARON COORDENADAS DE BUSQUEDA, FILTRAR POR DISTANCIA (SI EL DRIVER TIENE current_location VALIDO)
        if (pickupLat !== null && pickupLng !== null) {
          const rawCurrent = (driver as Record<string, unknown>)?.current_location
          const coords = rawCurrent && typeof rawCurrent === "object" && Object.prototype.hasOwnProperty.call(rawCurrent, "coordinates") ? (rawCurrent as Record<string, unknown>)["coordinates"] : null
          if (!coords || !Array.isArray(coords) || coords.length < 2) {
            // no location -> no incluir cuando se pide filtro por distancia
            nullsRemoved++
            continue
          }

          const driverLng = Number(coords[0])
          const driverLat = Number(coords[1])
          if (Number.isNaN(driverLng) || Number.isNaN(driverLat)) {
            malformedRemoved++
            continue
          }

          const distanceKm = haversineDistance({ lat: pickupLat, lon: pickupLng }, { lat: driverLat, lon: driverLng })
          // Si está fuera del radio solicitado, omitir
          if (distanceKm > maxDistanceKm) {
            continue
          }
        }

        // LIMPIAR Y NORMALIZAR LOS DATOS SEGÚN EL ESQUEMA DE LA BASE DE DATOS

        // Calcular distancia (si aplica) de forma segura sin usar `any`
        let computedDistance: number | null = null
        if (
          pickupLat !== null &&
          pickupLng !== null &&
          driver &&
          driver.current_location &&
          typeof driver.current_location === "object" &&
          Object.prototype.hasOwnProperty.call(driver.current_location, "coordinates")
        ) {
          const coords = (driver.current_location as Record<string, unknown>)["coordinates"]
          if (Array.isArray(coords) && coords.length >= 2) {
            const dLat = Number(coords[1])
            const dLng = Number(coords[0])
            if (!Number.isNaN(dLat) && !Number.isNaN(dLng)) {
              try {
                computedDistance = haversineDistance({ lat: pickupLat, lon: pickupLng }, { lat: dLat, lon: dLng })
              } catch {
                computedDistance = null
              }
            }
          }
        }

        const cleanDriver: CleanDriver = {
          id: (driver as Record<string, unknown>)?.id,
          uid,
          email: typeof (driver as Record<string, unknown>)?.email === "string" ? ((driver as Record<string, unknown>)?.email as string) : null,
          name,
          phone: typeof (driver as Record<string, unknown>)?.phone === "string" ? ((driver as Record<string, unknown>)?.phone as string) : null,
          license_number:
            typeof (driver as Record<string, unknown>)?.license_number === "string"
              ? ((driver as Record<string, unknown>)?.license_number as string)
              : null,
          vehicle_plate:
            typeof (driver as Record<string, unknown>)?.vehicle_plate === "string"
              ? (((driver as Record<string, unknown>)?.vehicle_plate as string).trim() || "No especificado")
              : "No especificado",
          vehicle_model:
            typeof (driver as Record<string, unknown>)?.vehicle_model === "string"
              ? (((driver as Record<string, unknown>)?.vehicle_model as string).trim() || "No especificado")
              : "No especificado",
          vehicle_year: typeof (driver as Record<string, unknown>)?.vehicle_year === "number" ? ((driver as Record<string, unknown>)?.vehicle_year as number) : null,
          is_verified: Boolean((driver as Record<string, unknown>)?.is_verified),
          rating: typeof (driver as Record<string, unknown>)?.rating === "number" ? Math.round(((driver as Record<string, unknown>)?.rating as number) * 10) / 10 : 0,
          total_trips: typeof (driver as Record<string, unknown>)?.total_trips === "number" ? ((driver as Record<string, unknown>)?.total_trips as number) : 0,
          is_online: Boolean((driver as Record<string, unknown>)?.is_online),
          current_location: (driver as Record<string, unknown>)?.current_location || null,
          // opcional: incluir distancia si se solicitó búsqueda por ubicación
          distance_km: computedDistance,
          created_at: (driver as Record<string, unknown>)?.created_at,
          updated_at: (driver as Record<string, unknown>)?.updated_at,
        }

        validDrivers.push(cleanDriver)
      }
    }

    const processTime = Date.now() - processStartTime
    const totalTime = Date.now() - startTime

    // Calcular estadísticas
    const stats = {
      total: validDrivers.length,
      verificados: validDrivers.filter((d) => d.is_verified).length,
      enLinea: validDrivers.filter((d) => d.is_online).length,
      conVehiculo: validDrivers.filter((d) => d.vehicle_model !== "No especificado").length,
      ratingPromedio:
        validDrivers.length > 0
          ? (validDrivers.reduce((sum, d) => sum + d.rating, 0) / validDrivers.length).toFixed(2)
          : "0.00",
    }

    // Si se buscó por ubicación, ordenar por distancia (si está disponible) y redondear
    if (pickupLat !== null && pickupLng !== null) {
      validDrivers.forEach((d) => {
        if (typeof d.distance_km === "number") {
          d.distance_km = Math.round(d.distance_km * 100) / 100
        }
      })

      validDrivers.sort((a, b) => {
        const da = typeof a.distance_km === "number" ? a.distance_km : Infinity
        const db = typeof b.distance_km === "number" ? b.distance_km : Infinity
        return da - db
      })
    }

  // verbose debug logs removed

    return NextResponse.json({
      success: true,
      data: validDrivers,
      count: validDrivers.length,
      stats,
      processing: {
        queryTime: `${queryTime}ms`,
        processTime: `${processTime}ms`,
        totalTime: `${totalTime}ms`,
        duplicatesRemoved,
        nullsRemoved,
        malformedRemoved,
      },
      message: `${validDrivers.length} conductores obtenidos exitosamente`,
    })
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`[driverData] Error inesperado después de ${totalTime}ms:`, error)

    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
        processing: {
          totalTime: `${totalTime}ms`,
        },
      },
      { status: 500 },
    )
  }
}
