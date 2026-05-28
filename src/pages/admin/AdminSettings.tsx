import { useState, useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Plus, Trash2, Upload } from "lucide-react";

export default function AdminSettings() {
  const { data: settings, isLoading } = useSiteSettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [features, setFeatures] = useState<{ emoji: string; title: string; desc: string }[]>([]);

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
    sponsor_video_url: "",
  });

  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [halls, setHalls] = useState<{ id: string; name: string }[]>([]);
  const [newDepartment, setNewDepartment] = useState("");
  const [newDeptCapacity, setNewDeptCapacity] = useState("60");
  const [newHall, setNewHall] = useState("");
  const [newHallCapacity, setNewHallCapacity] = useState("200");

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
        sponsor_video_url: settings.sponsor_video_url,
      });
      if (settings.features) {
        setFeatures(settings.features);
      }
    }
    fetchLists();
  }, [settings]);

  const fetchLists = async () => {
    const { data: depts } = await supabase.from("departments").select("*").order("name");
    const { data: hl } = await supabase.from("halls").select("*").order("name");
    if (depts) setDepartments(depts);
    if (hl) setHalls(hl);
  };

  const addDepartment = async () => {
    if (!newDepartment.trim()) return;
    const { error } = await supabase.from("departments").insert([{ name: newDepartment, capacity: Number(newDeptCapacity) || 60 }]);
    if (error) {
      toast({ variant: "destructive", title: "ব্যর্থ হয়েছে", description: error.message });
      return;
    }
    setNewDepartment("");
    setNewDeptCapacity("60");
    fetchLists();
    toast({ title: "বিভাগ যোগ হয়েছে ✅" });
  };

  const deleteDepartment = async (id: string) => {
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) {
      toast({ title: "বর্থ হয়েছে", description: "এটি সম্ভবত কোনো রেজিস্ট্রেশনে ব্যবহৃত হচ্ছে", variant: "destructive" });
    } else {
      fetchLists();
      toast({ title: "বিভাগ মুছে ফেলা হয়েছে 🗑️" });
    }
  };

  const addHall = async () => {
    if (!newHall.trim()) return;
    const { error } = await supabase.from("halls").insert([{ name: newHall, capacity: Number(newHallCapacity) || 200 }]);
    if (error) {
      toast({ variant: "destructive", title: "ব্যর্থ হয়েছে", description: error.message });
      return;
    }
    setNewHall("");
    setNewHallCapacity("200");
    fetchLists();
    toast({ title: "হল যোগ হয়েছে ✅" });
  };

  const deleteHall = async (id: string) => {
    const { error } = await supabase.from("halls").delete().eq("id", id);
    if (error) {
      toast({ title: "বর্থ হয়েছে", description: "এটি সম্ভবত কোনো রেজিস্ট্রেশনে ব্যবহৃত হচ্ছে", variant: "destructive" });
    } else {
      fetchLists();
      toast({ title: "হল মুছে ফেলা হয়েছে 🗑️" });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase.from("site_settings") as any)
        .update({
          event_date: form.event_date,
          event_location_name: form.event_location_name,
          event_location_detail: form.event_location_detail,
          hero_title: form.hero_title,
          hero_subtitle: form.hero_subtitle,
          hero_description: form.hero_description,
          registration_open: form.registration_open,
          registration_fee: form.registration_fee,
          bkash_number: form.bkash_number,
          nagad_number: form.nagad_number,
          sponsor_video_url: form.sponsor_video_url,
          features: features,
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

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.includes("video/mp4")) {
      toast({ title: "শুধুমাত্র .mp4 ফাইল সাপোর্ট করে", variant: "destructive" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "ফাইল সাইজ ২০MB এর বেশি হওয়া যাবে না", variant: "destructive" });
      return;
    }

    setUploadingVideo(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `sponsor_videos/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("photos").getPublicUrl(filePath);
      
      setForm((f) => ({ ...f, sponsor_video_url: urlData.publicUrl }));
      toast({ title: "ভিডিও সফলভাবে আপলোড হয়েছে, এখন সেভ করুন ✅" });
    } catch (err: any) {
      toast({ title: "আপলোড ব্যর্থ", description: err.message, variant: "destructive" });
    } finally {
      setUploadingVideo(false);
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

        {/* Sponsor Settings */}
        <div className={sectionClass}>
          <h2 className="font-display font-semibold text-base">স্পন্সর সেটিংস</h2>
          <div>
            <label className={labelClass}>ভিডিও লিংক (YouTube অথবা MP4)</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={form.sponsor_video_url}
                onChange={(e) => setForm((f) => ({ ...f, sponsor_video_url: e.target.value }))}
                placeholder="https://youtu.be/... অথবা https://.../video.mp4"
                className="flex-1"
              />
              <label className="shrink-0 cursor-pointer">
                <Button disabled={uploadingVideo} asChild variant="secondary">
                  <span>
                    {uploadingVideo ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                    সরাসরি আপলোড
                  </span>
                </Button>
                <input type="file" accept="video/mp4" className="hidden" onChange={handleVideoUpload} disabled={uploadingVideo} />
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ইউটিউব লিংক অথবা সরাসরি .mp4 আপলোড করলে সেটি নিজে থেকেই এডজাস্ট হয়ে যাবে। (সর্বোচ্চ ২০MB)
            </p>
          </div>
        </div>

        {/* Features Management */}
        <div className={sectionClass}>
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-base">ইভেন্টের ফিচার্স (Features)</h2>
            <Button size="sm" variant="outline" onClick={() => setFeatures([...features, { emoji: "✨", title: "নতুন ফিচার", desc: "বিবরণ লিখুন" }])}>
              <Plus className="w-4 h-4 mr-1" /> যোগ করুন
            </Button>
          </div>
          <div className="space-y-3 mt-4">
            {features.map((feature, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-background p-3 rounded-xl border border-border/50 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
                <Input 
                  className="w-full sm:w-16 text-xl text-center bg-transparent border-none shadow-none focus-visible:ring-0"
                  value={feature.emoji}
                  onChange={(e) => {
                    const newF = [...features];
                    newF[i].emoji = e.target.value;
                    setFeatures(newF);
                  }}
                  placeholder="ইমোজি"
                />
                <div className="hidden sm:block w-px h-8 bg-border"></div>
                <Input 
                  className="w-full sm:w-1/3 text-sm font-semibold bg-transparent border-none shadow-none focus-visible:ring-0"
                  value={feature.title}
                  onChange={(e) => {
                    const newF = [...features];
                    newF[i].title = e.target.value;
                    setFeatures(newF);
                  }}
                  placeholder="টাইটেল"
                />
                <div className="hidden sm:block w-px h-8 bg-border"></div>
                <Input 
                  className="w-full sm:flex-1 text-sm text-muted-foreground bg-transparent border-none shadow-none focus-visible:ring-0"
                  value={feature.desc}
                  onChange={(e) => {
                    const newF = [...features];
                    newF[i].desc = e.target.value;
                    setFeatures(newF);
                  }}
                  placeholder="বিবরণ"
                />
                <Button variant="ghost" size="icon" className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                  setFeatures(features.filter((_, idx) => idx !== i));
                }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {features.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">কোনো ফিচার যোগ করা হয়নি।</p>
            )}
          </div>
        </div>

        {/* Manage Departments */}
        <div className={sectionClass}>
          <h2 className="font-display font-semibold text-base">বিভাগ ম্যানেজমেন্ট</h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="নতুন নাম"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                className="flex-1 bg-background border border-input rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="সীমা"
                value={newDeptCapacity}
                onChange={(e) => setNewDeptCapacity(e.target.value)}
                className="w-20 bg-background border border-input rounded-lg px-3 py-2 text-sm"
              />
              <button 
                onClick={addDepartment}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" /> যোগ করুন
              </button>
            </div>
          <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto pr-2">
            {departments.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm group">
                <span className="truncate">{d.name}</span>
                <button onClick={() => deleteDepartment(d.id)} className="opacity-0 group-hover:opacity-100 text-destructive p-1 hover:bg-destructive/10 rounded-md transition-all">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Manage Halls */}
        <div className={sectionClass}>
          <h2 className="font-display font-semibold text-base">হল ম্যানেজমেন্ট</h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="নতুন নাম"
                value={newHall}
                onChange={(e) => setNewHall(e.target.value)}
                className="flex-1 bg-background border border-input rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="সীমা"
                value={newHallCapacity}
                onChange={(e) => setNewHallCapacity(e.target.value)}
                className="w-20 bg-background border border-input rounded-lg px-3 py-2 text-sm"
              />
              <button 
                onClick={addHall}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" /> যোগ করুন
              </button>
            </div>
          <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto pr-2">
            {halls.map((h) => (
              <div key={h.id} className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm group">
                <span className="truncate">{h.name}</span>
                <button onClick={() => deleteHall(h.id)} className="opacity-0 group-hover:opacity-100 text-destructive p-1 hover:bg-destructive/10 rounded-md transition-all">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
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
