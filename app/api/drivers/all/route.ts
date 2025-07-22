import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  console.log(`[driverData] ${new Date().toISOString()} - Iniciando consulta de conductores`)

  try {
    // Verificar que supabase esté disponible
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

    // Consulta todos los conductores con las columnas exactas de tu esquema
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
    console.log(`[driverData] Consulta completada en ${queryTime}ms - ${rawDrivers?.length || 0} registros obtenidos`)

    // Validación y limpieza de datos
    const processStartTime = Date.now()
    const validDrivers = []
    let duplicatesRemoved = 0
    let nullsRemoved = 0
    let malformedRemoved = 0
    const seenUids = new Set()

    if (rawDrivers && Array.isArray(rawDrivers)) {
      for (const driver of rawDrivers) {
        // Eliminar nulos o sin datos esenciales
        if (!driver || !driver.uid || !driver.name) {
          nullsRemoved++
          continue
        }

        // Eliminar duplicados por UID
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

        // Limpiar y normalizar datos según tu esquema de base de datos
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

    // Logs detallados para auditoría
    console.log(`[driverData] Procesamiento completado en ${processTime}ms`)
    console.log(`[driverData] Registros procesados:`)
    console.log(`  - Válidos: ${validDrivers.length}`)
    console.log(`  - Duplicados eliminados: ${duplicatesRemoved}`)
    console.log(`  - Nulos eliminados: ${nullsRemoved}`)
    console.log(`  - Malformados eliminados: ${malformedRemoved}`)
    console.log(`[driverData] Estadísticas:`)
    console.log(`  - Total: ${stats.total}`)
    console.log(`  - Verificados: ${stats.verificados}`)
    console.log(`  - En línea: ${stats.enLinea}`)
    console.log(`  - Con vehículo: ${stats.conVehiculo}`)
    console.log(`  - Rating promedio: ${stats.ratingPromedio}`)
    console.log(`[driverData] Tiempo total de procesamiento: ${totalTime}ms`)

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
