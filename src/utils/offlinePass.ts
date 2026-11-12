export const OFFLINE_PASS_STORAGE_KEY = "ju52_saved_pass";

export interface PassUserData {
  id?: string;
  name: string;
  department: string;
  hall: string;
  status: string;
  tshirt_size: string;
  attended?: boolean;
}

export interface SavedDigitalPass {
  roll: string;
  userData: PassUserData;
  savedAt: string;
}

/** Persist a verified digital pass in localStorage for offline gate access. */
export function saveOfflinePass(roll: string, userData: PassUserData): void {
  if (typeof window === "undefined" || !roll.trim()) return;
  try {
    const payload: SavedDigitalPass = {
      roll: roll.trim(),
      userData,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(OFFLINE_PASS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota or private-mode access errors
  }
}

/** Load the cached verified digital pass if present and structurally valid. */
export function loadOfflinePass(): SavedDigitalPass | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(OFFLINE_PASS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedDigitalPass>;
    if (!parsed?.roll || !parsed.userData?.name) return null;
    return {
      roll: String(parsed.roll),
      userData: parsed.userData,
      savedAt: parsed.savedAt || "",
    };
  } catch {
    return null;
  }
}

/** Remove any locally stored digital pass. */
export function clearOfflinePass(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(OFFLINE_PASS_STORAGE_KEY);
  } catch {
    // Ignore storage access errors
  }
}
