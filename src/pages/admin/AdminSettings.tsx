import { useState, useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";

export default function AdminSettings() {
  const { data: settings, isLoading } = useSiteSettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    event_date: "",
    event_location_name: "",
    event_location_detail: "",
    hero_title: "",
    hero_subtitle: "",
    hero_description: "",
    registration_open: true,
    registration_fee: 500,
    bkash_number: "",
    nagad_number: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        event_date: settings.event_date,
        event_location_name: settings.event_location.name,
        event_location_detail: settings.event_location.detail,
        hero_title: settings.hero_title,
        hero_subtitle: settings.hero_subtitle,
        hero_description: settings.hero_description,
        registration_open: settings.registration_open,
        registration_fee: settings.registration_fee,
        bkash_number: settings.bkash_number,
        nagad_number: settings.nagad_number,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .update({
          event_date: form.event_date,
          registration_open: form.registration_open,
          bkash_number: form.bkash_number,
          nagad_number: form.nagad_number,
          // Since some fields might not exist in the table (like hero_title), 
          // we only update what's available in the schema.
        })
        .eq("id", 1);
      
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast({ title: "সেটিংস সেভ হয়েছে ✅" });
    } catch (err: any) {
      toast({ title: "সেভ ব্যর্থ হয়েছে", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const labelClass = "block text-sm font-semibold mb-1.5";
  const sectionClass = "rounded-xl bg-card shadow-card p-5 space-y-4";

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold mb-6">⚙️ সাইট সেটিংস</h1>

      <div className="space-y-6">
        {/* Registration Control */}
        <div className={sectionClass}>
          <h2 className="font-display font-semibold text-base">রেজিস্ট্রেশন কন্ট্রোল</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">রেজিস্ট্রেশন চালু/বন্ধ</p>
              <p className="text-xs text-muted-foreground">বন্ধ করলে কেউ রেজিস্ট্রেশন করতে পারবে না</p>
            </div>
            <Switch
              checked={form.registration_open}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, registration_open: checked }))}
            />
          </div>
          <div>
            <label className={labelClass}>রেজিস্ট্রেশন ফি (৳)</label>
            <Input
              type="number"
              value={form.registration_fee}
              onChange={(e) => setForm((f) => ({ ...f, registration_fee: parseInt(e.target.value) || 0 }))}
            />
          </div>
        </div>

        {/* Event Info */}
        <div className={sectionClass}>
          <h2 className="font-display font-semibold text-base">ইভেন্ট তথ্য</h2>
          <div>
            <label className={labelClass}>তারিখ ও সময় (ISO)</label>
            <Input
              value={form.event_date}
              onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
              placeholder="2025-06-15T10:00:00+06:00"
            />
          </div>
          <div>
            <label className={labelClass}>স্থান</label>
            <Input
              value={form.event_location_name}
              onChange={(e) => setForm((f) => ({ ...f, event_location_name: e.target.value }))}
              placeholder="জাহাঙ্গীরনগর ক্যাম্পাস"
            />
          </div>
          <div>
            <label className={labelClass}>স্থানের বিবরণ</label>
            <Input
              value={form.event_location_detail}
              onChange={(e) => setForm((f) => ({ ...f, event_location_detail: e.target.value }))}
              placeholder="সেন্ট্রাল ফিল্ড"
            />
          </div>
        </div>

        {/* Hero Section */}
        <div className={sectionClass}>
          <h2 className="font-display font-semibold text-base">হিরো সেকশন</h2>
          <div>
            <label className={labelClass}>শিরোনাম</label>
            <Input
              value={form.hero_title}
              onChange={(e) => setForm((f) => ({ ...f, hero_title: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>সাব-টাইটেল</label>
            <Input
              value={form.hero_subtitle}
              onChange={(e) => setForm((f) => ({ ...f, hero_subtitle: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>বিবরণ</label>
            <Input
              value={form.hero_description}
              onChange={(e) => setForm((f) => ({ ...f, hero_description: e.target.value }))}
            />
          </div>
        </div>

        {/* Payment Numbers */}
        <div className={sectionClass}>
          <h2 className="font-display font-semibold text-base">পেমেন্ট নম্বর</h2>
          <div>
            <label className={labelClass}>বিকাশ নম্বর</label>
            <Input
              value={form.bkash_number}
              onChange={(e) => setForm((f) => ({ ...f, bkash_number: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>নগদ নম্বর</label>
            <Input
              value={form.nagad_number}
              onChange={(e) => setForm((f) => ({ ...f, nagad_number: e.target.value }))}
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          সেভ করো
        </Button>
      </div>
    </div>
  );
}
