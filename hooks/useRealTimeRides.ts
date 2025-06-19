"use client"

import { useEffect, useState } from "react"
// Actualizar la importación de supabase
import { supabase, type Database } from "@/lib/supabase"

type Ride = Database["public"]["Tables"]["rides"]["Row"]

export function useRealTimeRides(driverId?: string, passengerId?: string) {
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if Supabase is available
    if (!supabase) {
      console.warn("Supabase not available, using mock data")
      setRides([])
      setLoading(false)
      return
    }

    // Función para cargar rides iniciales
    const loadInitialRides = async () => {
      try {
        let query = supabase?.from("rides").select("*") ?? null

        if (driverId) {
          // Para conductores: mostrar rides pendientes cercanos y sus rides aceptados
          query = query.or(`status.eq.pending,and(driver_id.eq.${driverId})`)
        } else if (passengerId) {
          // Para pasajeros: mostrar solo sus rides
          query = query.eq("passenger_id", passengerId)
        }

        const { data, error } = await query.order("requested_at", { ascending: false })

        if (error) throw error
        setRides(data || [])
      } catch (err: unknown) {
        // Manejo de error con tipado seguro
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error("Error loading rides:", errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadInitialRides()

    // Variable para controlar los intentos de reconexión
    let retryCount = 0;
    const maxRetries = 5;
    let channel;

    // Función para configurar la suscripción en tiempo real
    const setupRealtimeSubscription = () => {
      try {
        // Limpiar canal anterior si existe
        if (channel) {
          supabase.removeChannel(channel);
        }

        // Configurar nuevo canal
        channel = supabase
          .channel("rides-changes")
          .on(
            "postgres_changes",
            {
              event: "*", // Escuchar todos los eventos (INSERT, UPDATE, DELETE)
              schema: "public",
              table: "rides",
            },
            (payload) => {
              console.log("Real-time update:", payload)

              if (payload.eventType === "INSERT") {
                const newRide = payload.new as Ride
                // Solo agregar si es relevante para este usuario
                if ((driverId && newRide.status === "pending") || (passengerId && newRide.passenger_id === passengerId)) {
                  setRides((prev) => [newRide, ...prev])
                }
              } else if (payload.eventType === "UPDATE") {
                const updatedRide = payload.new as Ride
                setRides((prev) => prev.map((ride) => (ride.id === updatedRide.id ? updatedRide : ride)))
              } else if (payload.eventType === "DELETE") {
                const deletedRide = payload.old as Ride
                setRides((prev) => prev.filter((ride) => ride.id !== deletedRide.id))
              }
            },
          )
          .subscribe((status) => {
            console.log("Subscription status:", status);
            
            if (status === "SUBSCRIBED") {
              console.log("Successfully subscribed to realtime updates");
              retryCount = 0; // Reiniciar contador de intentos al conectar exitosamente
            } else if (status === "CHANNEL_ERROR") {
              console.error("Channel error occurred");
              
              // Intentar reconectar si no hemos excedido el máximo de intentos
              if (retryCount < maxRetries) {
                retryCount++;
                const delay = Math.min(1000 * 2 ** retryCount, 30000); // Backoff exponencial con máximo de 30 segundos
                console.log(`Retrying connection in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
              
                setTimeout(() => {
                  setupRealtimeSubscription();
                }, delay);
              } else {
                console.error("Max retries reached, giving up on realtime connection");
              }
            }
          });
      } catch (err: unknown) {
        // Manejo de error con tipado seguro
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error("Error setting up realtime subscription:", errorMessage);
      }
    };

    // Iniciar la suscripción
    setupRealtimeSubscription();

    // Cleanup
    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (err: unknown) {
          // Manejo de error con tipado seguro
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          console.error("Error removing channel:", errorMessage);
        }
      }
    }
  }, [driverId, passengerId])

  return { rides, loading, setRides }
}