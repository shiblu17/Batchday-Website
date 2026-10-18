import { supabase } from "@/integrations/supabase/client";
import { isSuperAdminEmail } from "@/lib/constants";

export type AdminSectionKey =
  | "reels"
  | "confessions"
  | "payments"
  | "scanner"
  | "gallery"
  | "export"
  | "leaderboard"
  | "timeline"
  | "settings"
  | "roles";

export interface AdminSectionMeta {
  key: AdminSectionKey;
  title: string;
  url: string;
  description: string;
  iconName: string;
  isSensitive?: boolean;
}

export const ADMIN_SECTIONS: AdminSectionMeta[] = [
  {
    key: "reels",
    title: "রিলস ও স্ট্রিম",
    url: "/admin/reels",
    description: "রিলস ভিডিও পর্যবেক্ষণ, ডিলিট ও সার্ভার মনিটরিং",
    iconName: "Film",
  },
  {
    key: "confessions",
    title: "কনফেশনস",
    url: "/admin/confessions",
    description: "বেনামী কনফেশন অনুমোদন (Approve) বা বাতিল (Reject)",
    iconName: "MessageCircleHeart",
  },
  {
    key: "payments",
    title: "পেমেন্ট ভেরিফিকেশন",
    url: "/admin/payments",
    description: "রেজিস্ট্রেশন ফি ও ট্রানজেকশন আইডি যাচাই",
    iconName: "CreditCard",
    isSensitive: true,
  },
  {
    key: "scanner",
    title: "QR স্ক্যানার",
    url: "/admin/scanner",
    description: "অনুষ্ঠানের গেটে এন্ট্রি কার্ড QR কোড স্ক্যান",
    iconName: "QrCode",
  },
  {
    key: "gallery",
    title: "গ্যালারি",
    url: "/admin/gallery",
    description: "ক্যাম্পাসের ছবি আপলোড ও ম্যানেজমেন্ট",
    iconName: "ImageIcon",
  },
  {
    key: "leaderboard",
    title: "লিডারবোর্ড",
    url: "/admin/leaderboard",
    description: "গেমস ও হলের পয়েন্ট ম্যানেজমেন্ট",
    iconName: "Trophy",
  },
  {
    key: "timeline",
    title: "টাইমলাইন",
    url: "/admin/timeline",
    description: "ইভেন্টের সময়সূচি ও শিডিউল আপডেট",
    iconName: "CalendarDays",
  },
  {
    key: "export",
    title: "ডেটা এক্সপোর্ট",
    url: "/admin/export",
    description: "রেজিস্ট্রেশন ডেটা ও এক্সেল শিট ডাউনলোড",
    iconName: "Download",
    isSensitive: true,
  },
  {
    key: "settings",
    title: "সাইট সেটিংস",
    url: "/admin/settings",
    description: "ফি, তারিখ, বিকাশ ও নগদ নম্বর পরিবর্তন",
    iconName: "Settings",
    isSensitive: true,
  },
];

export interface ModeratorUser {
  id: string;
  email: string;
  name: string;
  roleTitle: string;
  passwordHash: string;
  allowedSections: AdminSectionKey[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

const STORAGE_CACHE_KEY = "ju52_cached_moderators";
const MODERATOR_SESSION_KEY = "ju52_moderator_session";

/**
 * Hash password with SHA-256 and custom salt
 */
export async function hashModeratorPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`ju52_mod_salt_${password.trim()}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Fetch moderators list from Supabase cloud database with local fallback
 */
export async function fetchModerators(): Promise<ModeratorUser[]> {
  try {
    const { data } = await supabase
      .from("gallery_photos")
      .select("*")
      .eq("url", "system://admin_moderators")
      .maybeSingle();

    if (data?.caption) {
      const parsed = JSON.parse(data.caption);
      if (Array.isArray(parsed)) {
        localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Could not fetch remote moderators from Supabase, fallback to cache:", err);
  }

  try {
    const cached = localStorage.getItem(STORAGE_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}

  return [];
}

/**
 * Save moderators list to Supabase cloud database and local cache
 */
export async function saveModerators(moderators: ModeratorUser[]): Promise<boolean> {
  const jsonStr = JSON.stringify(moderators);
  localStorage.setItem(STORAGE_CACHE_KEY, jsonStr);

  try {
    const { data } = await supabase
      .from("gallery_photos")
      .select("id")
      .eq("url", "system://admin_moderators")
      .maybeSingle();

    if (data?.id) {
      await supabase
        .from("gallery_photos")
        .update({ caption: jsonStr })
        .eq("id", data.id);
    } else {
      await supabase
        .from("gallery_photos")
        .insert({
          url: "system://admin_moderators",
          caption: jsonStr,
        });
    }
    return true;
  } catch (err) {
    console.error("Failed to save moderators to Supabase:", err);
    return false;
  }
}

/**
 * Authenticate moderator with email and password
 */
export async function authenticateModerator(
  email: string,
  password: string
): Promise<ModeratorUser | null> {
  const cleanEmail = email.toLowerCase().trim();
  const passwordHash = await hashModeratorPassword(password);
  const moderators = await fetchModerators();

  const matched = moderators.find(
    (m) => m.email.toLowerCase().trim() === cleanEmail && m.isActive
  );

  if (matched && matched.passwordHash === passwordHash) {
    // Store moderator session
    setModeratorSession(matched);
    return matched;
  }

  return null;
}

export function setModeratorSession(moderator: ModeratorUser) {
  try {
    localStorage.setItem(
      MODERATOR_SESSION_KEY,
      JSON.stringify({
        id: moderator.id,
        email: moderator.email,
        name: moderator.name,
        roleTitle: moderator.roleTitle,
        allowedSections: moderator.allowedSections,
        timestamp: Date.now(),
      })
    );
    localStorage.setItem("ju52_admin_login", "true");
  } catch {}
}

export function getModeratorSession(): ModeratorUser | null {
  try {
    const raw = localStorage.getItem(MODERATOR_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearModeratorSession() {
  try {
    localStorage.removeItem(MODERATOR_SESSION_KEY);
  } catch {}
}

/**
 * Check if user or moderator has access to a specific section
 */
export function checkHasAccess(
  email: string | null | undefined,
  sectionKey: AdminSectionKey,
  moderatorProfile?: ModeratorUser | null
): boolean {
  if (!email) return false;

  // Super admin always has 100% access to everything
  if (isSuperAdminEmail(email)) {
    return true;
  }

  // If section is roles, ONLY super admin can access
  if (sectionKey === "roles") {
    return false;
  }

  if (moderatorProfile?.allowedSections) {
    return moderatorProfile.allowedSections.includes(sectionKey);
  }

  const session = getModeratorSession();
  if (session && session.email.toLowerCase() === email.toLowerCase()) {
    return session.allowedSections.includes(sectionKey);
  }

  return false;
}
