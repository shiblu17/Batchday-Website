import { supabase } from "@/integrations/supabase/client";

export interface Batch52StudentRecord {
  id: string;
  sl_no?: number | null;
  name: string;
  department: string;
  hall: string;
  reg_no: string;
  roll_no: string;
  session?: string;
  is_batch52?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetches all Batch 52 students from Supabase using chunked range pagination
 * to bypass PostgREST's default 1,000-row limit.
 */
export async function fetchAllBatch52Students(): Promise<Batch52StudentRecord[]> {
  const CHUNK_SIZE = 1000;
  let allRows: Batch52StudentRecord[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("batch52_students")
      .select("*")
      .order("sl_no", { ascending: true })
      .range(from, from + CHUNK_SIZE - 1);

    if (error) {
      console.error("Error fetching students chunk from Supabase:", error);
      throw error;
    }

    if (data && data.length > 0) {
      allRows = allRows.concat(data as Batch52StudentRecord[]);
      if (data.length < CHUNK_SIZE) {
        hasMore = false;
      } else {
        from += CHUNK_SIZE;
      }
    } else {
      hasMore = false;
    }
  }

  return allRows;
}
