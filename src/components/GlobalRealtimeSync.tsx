import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Global Realtime Sync Engine
 * Ensures EVERY connected user device (phone, laptop, tablet) automatically
 * receives instant WebSocket updates whenever an Admin updates ANY section
 * in the Admin Panel or Database.
 */
export default function GlobalRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("global-app-realtime-sync")
      // 1. Site Settings (Dates, Bkash/Nagad Numbers, Fees, Location, Hero)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["site-settings"] });
        }
      )
      // 2. Registrations & Leaderboard Counts (Approvals, Status, Edits)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "registrations" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["registrations"] });
          queryClient.invalidateQueries({ queryKey: ["verified-registrations-count"] });
        }
      )
      // 3. Batch 52 Students Master Database (Corrections, Additions, Deletions)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "batch52_students" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["batch52_students"] });
          queryClient.invalidateQueries({ queryKey: ["students"] });
        }
      )
      // 4. Departments & Capacity
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "departments" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["departments"] });
        }
      )
      // 5. Halls & Capacity
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "halls" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["halls"] });
        }
      )
      // 6. Event Timeline
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_timeline" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["event_timeline"] });
          queryClient.invalidateQueries({ queryKey: ["timeline"] });
        }
      )
      // 7. Confessions (Approvals & Removals)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "confessions" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["confessions"] });
        }
      )
      // 8. Gallery Photos
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gallery_photos" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["gallery_photos"] });
          queryClient.invalidateQueries({ queryKey: ["gallery"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return null;
}
