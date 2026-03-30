import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  event_date: string;
  event_location: { name: string; detail: string };
  hero_title: string;
  hero_subtitle: string;
  hero_description: string;
  registration_open: boolean;
  registration_fee: number;
  bkash_number: string;
  nagad_number: string;
};

const DEFAULTS: SiteSettings = {
  event_date: "2025-06-15T10:00:00+06:00",
  event_location: { name: "জাহাঙ্গীরনগর ক্যাম্পাস", detail: "সেন্ট্রাল ফিল্ড" },
  hero_title: "JU-52",
  hero_subtitle: "ব্যাচ ডে ২০২৫",
  hero_description: "সবচেয়ে বড় পুনর্মিলনী। রেজিস্ট্রেশন করো, স্মৃতি শেয়ার করো, একসাথে উদযাপন করো।",
  registration_open: true,
  registration_fee: 500,
  bkash_number: "01XXXXXXXXX",
  nagad_number: "01XXXXXXXXX",
};

async function fetchSettings(): Promise<SiteSettings> {
  const { data: rawData, error } = await supabase
    .from("site_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error || !rawData) return DEFAULTS;
  const data = rawData as any;

  return {
    ...DEFAULTS,
    event_date: data.event_date ?? DEFAULTS.event_date,
    event_location: {
      name: data.event_location_name ?? DEFAULTS.event_location.name,
      detail: data.event_location_detail ?? DEFAULTS.event_location.detail,
    },
    hero_title: data.hero_title ?? DEFAULTS.hero_title,
    hero_subtitle: data.hero_subtitle ?? DEFAULTS.hero_subtitle,
    hero_description: data.hero_description ?? DEFAULTS.hero_description,
    registration_open: data.registration_open ?? DEFAULTS.registration_open,
    registration_fee: data.registration_fee ?? DEFAULTS.registration_fee,
    bkash_number: data.bkash_number ?? DEFAULTS.bkash_number,
    nagad_number: data.nagad_number ?? DEFAULTS.nagad_number,
  };
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: fetchSettings,
    staleTime: 30_000,
  });
}
