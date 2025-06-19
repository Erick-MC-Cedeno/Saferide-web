"use client"

import { useEffect, useState, useRef } from "react"
import { supabase, type Database } from "@/lib/supabase"

type Ride = Database["public"]["Tables"]["rides"]["Row"]

export function useRealTimeRides(driverId?: string, passengerId?: string) {
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const isConnectingRef = useRef(false);

  useEffect(() => {
    if (!supabase) {
      console.warn("Supabase not available, using mock data")
      setRides([])
      setLoading(false)
      return
    }

    const loadInitialRides = async () => {
      try {
        let query = supabase?.from("rides").select("*") ?? null

        if (driverId) {
          query = query.or(`status.eq.pending,and(driver_id.eq.${driverId})`)
        } else if (passengerId) {
          query = query.eq("passenger_id", passengerId)
        }

        const { data, error } = await query.order("requested_at", { ascending: false })

        if (error) throw error
        setRides(data || [])
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error("Error loading rides:", errorMessage)
      } finally {
        setLoading(false)
      }
    }

    const cleanupChannel = async () => {
      if (channelRef.current) {
        try {
          await supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          console.error("Error removing channel:", errorMessage);
        }
      }
    };

    const setupRealtimeSubscription = async () => {
      if (isConnectingRef.current) return;
      isConnectingRef.current = true;

      try {
        // Limpiar canal anterior
        await cleanupChannel();

        // Limpiar timeout anterior si existe
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = undefined;
        }

        // Configurar nuevo canal
        channelRef.current = supabase
          .channel("rides-changes", {
            config: {
              broadcast: { ack: true },
              presence: { key: "" }
            }
          })
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "rides",
            },
            (payload) => {
              console.log("Real-time update:", payload)

              if (payload.eventType === "INSERT") {
                const newRide = payload.new as Ride
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
            }
          )
          .subscribe(async (status) => {
            console.log("Subscription status:", status);
            isConnectingRef.current = false;
            
            if (status === "SUBSCRIBED") {
              console.log("Successfully subscribed to realtime updates");
              retryCountRef.current = 0;
            } else if (status === "CHANNEL_ERROR" || status === "CLOSED" || status === "TIMED_OUT") {
              console.error(`Channel error occurred: ${status}`);
              
              if (retryCountRef.current < maxRetries) {
                retryCountRef.current++;
                const delay = Math.min(1000 * 2 ** retryCountRef.current, 30000);
                console.log(`Retrying connection in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`);
              
                reconnectTimeoutRef.current = setTimeout(() => {
                  setupRealtimeSubscription();
                }, delay);
              } else {
                console.error("Max retries reached, giving up on realtime connection");
              }
            }
          });
      } catch (err: unknown) {
        isConnectingRef.current = false;
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error("Error setting up realtime subscription:", errorMessage);
        
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          const delay = Math.min(1000 * 2 ** retryCountRef.current, 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            setupRealtimeSubscription();
          }, delay);
        }
      }
    };

    loadInitialRides();
    setupRealtimeSubscription();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      cleanupChannel();
    };
  }, [driverId, passengerId]);

  return { rides, loading };
}