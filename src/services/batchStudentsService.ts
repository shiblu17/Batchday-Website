import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import initialVoters from "@/data/voters.json";

export interface BatchStudent {
  id: string;
  name: string;
  dept: string;
  hall: string;
  regNo?: string;
  rollNo?: string;
  session?: string;
}

// In-memory student registry (starts with static bundle for 0ms load)
let currentStudents: BatchStudent[] = (initialVoters as BatchStudent[]).map((s, idx) => ({
  id: s.id || `voter_${idx}`,
  name: s.name,
  dept: s.dept,
  hall: s.hall,
  regNo: s.regNo || "",
  rollNo: s.rollNo || "",
  session: s.session || "2022-2023",
}));

type Listener = (students: BatchStudent[]) => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  const snapshot = [...currentStudents];
  listeners.forEach((fn) => {
    try {
      fn(snapshot);
    } catch (e) {
      console.error("Error in batch student listener:", e);
    }
  });
}

// Sync Channel Setup
let isInitialized = false;

export function initBatchStudentsSync() {
  if (isInitialized) return;
  isInitialized = true;

  // 1. Listen to Realtime Broadcast channel 'ju52_data_sync'
  const broadcastChannel = supabase.channel("ju52_data_sync");

  broadcastChannel
    .on("broadcast", { event: "student_change" }, (payload: any) => {
      console.log("⚡ [Realtime Sync] Received student change event:", payload);
      const data = payload?.payload || payload;
      if (!data || !data.action) return;

      switch (data.action) {
        case "add": {
          if (data.student) {
            const newStudent: BatchStudent = {
              id: data.student.id || `CUSTOM_${Date.now()}`,
              name: (data.student.name || "").toUpperCase().trim(),
              dept: data.student.department || data.student.dept || "",
              hall: data.student.hall || "",
              regNo: data.student.regNo || "",
              rollNo: data.student.rollNo || "",
              session: data.student.session || "2022-2023",
            };
            // Prevent duplicates
            currentStudents = [newStudent, ...currentStudents.filter((s) => s.id !== newStudent.id)];
            notifyListeners();
          }
          break;
        }

        case "edit": {
          if (data.student && data.student.id) {
            currentStudents = currentStudents.map((s) => {
              if (s.id === data.student.id) {
                return {
                  ...s,
                  name: (data.student.name || s.name).toUpperCase().trim(),
                  dept: data.student.department || data.student.dept || s.dept,
                  hall: data.student.hall || s.hall,
                  regNo: data.student.regNo !== undefined ? data.student.regNo : s.regNo,
                  rollNo: data.student.rollNo !== undefined ? data.student.rollNo : s.rollNo,
                };
              }
              return s;
            });
            notifyListeners();
          }
          break;
        }

        case "delete": {
          if (data.studentId) {
            currentStudents = currentStudents.filter((s) => s.id !== data.studentId);
            notifyListeners();
          }
          break;
        }

        case "batch_delete": {
          if (Array.isArray(data.studentIds) && data.studentIds.length > 0) {
            const idSet = new Set(data.studentIds);
            currentStudents = currentStudents.filter((s) => !idSet.has(s.id));
            notifyListeners();
          }
          break;
        }

        case "reset": {
          currentStudents = (initialVoters as BatchStudent[]).map((s, idx) => ({
            id: s.id || `voter_${idx}`,
            name: s.name,
            dept: s.dept,
            hall: s.hall,
            regNo: s.regNo || "",
            rollNo: s.rollNo || "",
            session: s.session || "2022-2023",
          }));
          notifyListeners();
          break;
        }
      }
    })
    .subscribe((status) => {
      console.log("⚡ [Realtime Sync] Broadcast channel status:", status);
    });

  // 2. Also listen to PostgreSQL table changes if batch52_students table exists in Supabase
  const dbChannel = supabase
    .channel("batch52_students_db_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "batch52_students" },
      (payload) => {
        console.log("⚡ [Postgres Changes] Event received:", payload.eventType);
        if (payload.eventType === "INSERT" && payload.new) {
          const row: any = payload.new;
          const newStudent: BatchStudent = {
            id: row.id,
            name: row.name,
            dept: row.department,
            hall: row.hall,
            regNo: row.reg_no,
            rollNo: row.roll_no,
            session: row.session || "2022-2023",
          };
          currentStudents = [newStudent, ...currentStudents.filter((s) => s.id !== newStudent.id)];
          notifyListeners();
        } else if (payload.eventType === "UPDATE" && payload.new) {
          const row: any = payload.new;
          currentStudents = currentStudents.map((s) => {
            if (s.id === row.id) {
              return {
                ...s,
                name: row.name,
                dept: row.department,
                hall: row.hall,
                regNo: row.reg_no,
                rollNo: row.roll_no,
              };
            }
            return s;
          });
          notifyListeners();
        } else if (payload.eventType === "DELETE" && payload.old) {
          const oldId = (payload.old as any).id;
          currentStudents = currentStudents.filter((s) => s.id !== oldId);
          notifyListeners();
        }
      }
    )
    .subscribe();

  // 3. Background fetch from Supabase table if it exists
  (async () => {
    try {
      const { data, error } = await supabase
        .from("batch52_students" as any)
        .select("*")
        .limit(3000);

      if (!error && data && data.length > 0) {
        console.log(`⚡ [Supabase Sync] Loaded ${data.length} records from batch52_students table.`);
        currentStudents = data.map((row: any) => ({
          id: row.id,
          name: row.name,
          dept: row.department,
          hall: row.hall,
          regNo: row.reg_no,
          rollNo: row.roll_no,
          session: row.session || "2022-2023",
        }));
        notifyListeners();
      }
    } catch {
      // Table doesn't exist yet; baseline initialVoters continues smoothly
    }
  })();
}

// React Hook for Components
export function useBatchStudents() {
  const [students, setStudents] = useState<BatchStudent[]>(currentStudents);

  useEffect(() => {
    initBatchStudentsSync();

    const listener = (updated: BatchStudent[]) => {
      setStudents(updated);
    };

    listeners.add(listener);
    // Initial sync
    setStudents([...currentStudents]);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  return students;
}

// Synchronous getters
export function getAllStudents(): BatchStudent[] {
  return [...currentStudents];
}
