import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"


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
    const validDrivers: any[] = []
    let duplicatesRemoved = 0
    let nullsRemoved = 0
    let malformedRemoved = 0
    const seenUids = new Set()
    // TRABAJAR CON LOS DATOS COMO ANY PARA SIMPLIFICAR LAS VALIDACIONES DE PROPIEDADES
    const driversArray = (rawDrivers as any[]) || []

    if (driversArray && Array.isArray(driversArray)) {
      for (const driver of driversArray) {
        // Eliminar nulos o sin datos esenciales
        if (!driver || !driver.uid || !driver.name) {
          nullsRemoved++
          continue
        }

        // ELIMINAR DUPLICADOS POR UID
        if (seenUids.has(driver.uid)) {
          duplicatesRemoved++
          continue
        }
        seenUids.add(driver.uid)

        // Validar estructura de datos
        if (typeof driver.name !== "string" || driver.name.trim().length === 0) {
          malformedRemoved++
          continue
        }

        // SI SE ENVIARON COORDENADAS DE BUSQUEDA, FILTRAR POR DISTANCIA (SI EL DRIVER TIENE current_location VALIDO)
        if (pickupLat !== null && pickupLng !== null) {
          const coords = driver && driver.current_location && driver.current_location.coordinates
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
        const cleanDriver = {
          id: driver.id,
          uid: driver.uid,
          email: driver.email || null,
          name: driver.name.trim(),
          phone: driver.phone || null,
          license_number: driver.license_number || null,
          vehicle_plate: driver.vehicle_plate?.trim() || "No especificado",
          vehicle_model: driver.vehicle_model?.trim() || "No especificado",
          vehicle_year: driver.vehicle_year || null,
          is_verified: Boolean(driver.is_verified),
          rating: typeof driver.rating === "number" ? Math.round(driver.rating * 10) / 10 : 0,
          total_trips: typeof driver.total_trips === "number" ? driver.total_trips : 0,
          is_online: Boolean(driver.is_online),
          current_location: driver.current_location || null,
          // opcional: incluir distancia si se solicitó búsqueda por ubicación
          distance_km:
            pickupLat !== null && pickupLng !== null && driver && driver.current_location && driver.current_location.coordinates
              ? (function () {
                  try {
                    const c = driver.current_location.coordinates
                    const dLat = Number(c[1])
                    const dLng = Number(c[0])
                    return haversineDistance({ lat: pickupLat, lon: pickupLng }, { lat: dLat, lon: dLng })
                  } catch (e) {
                    return null
                  }
                })()
              : null,
          created_at: driver.created_at,
          updated_at: driver.updated_at,
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
