import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Registration {
  id: string;
  name: string;
  roll: string;
  phone: string;
  department: string;
  hall: string;
  tshirt_size: string;
  payment_method: string;
  tx_id: string;
  sender_number: string;
  photo_url: string | null;
  status: string;
  attended: boolean;
  created_at: string;
  updated_at: string;
}

export function useRegistrations() {
  return useQuery({
    queryKey: ["registrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Registration[];
    },
    staleTime: 30_000,
  });
}
