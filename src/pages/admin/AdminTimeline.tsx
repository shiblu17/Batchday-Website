import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Plus, MapPin, Trash2, Edit2, ChevronUp, ChevronDown, Save, X, Loader2, CalendarDays, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useQueryClient } from "@tanstack/react-query";

interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  location: string;
  description: string;
  icon_name: string;
  color_class: string;
  sort_order: number;
}

export default function AdminTimeline() {
  const { data: settings } = useSiteSettings();
  const queryClient = useQueryClient();
  const [isLocked, setIsLocked] = useState(false);
  const [isTogglingLock, setIsTogglingLock] = useState(false);

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    time: "",
    title: "",
    location: "",
    description: "",
    icon_name: "Clock",
    color_class: "bg-primary"
  });

  useEffect(() => {
    if (settings) {
      setIsLocked(Boolean(settings.timeline_locked));
    }
  }, [settings]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleToggleLock = async (checked: boolean) => {
    setIsTogglingLock(true);
    setIsLocked(checked);
    try {
      const token = localStorage.getItem("ju52_admin_session") || "";
      let updateSuccessful = false;

      // 1. Try secure admin RPC
      try {
        const { data: rpcSuccess, error: rpcError } = await supabase.rpc("secure_admin_update_settings", {
          p_settings: { timeline_locked: checked },
          p_auth_token: token,
        });
        if (!rpcError && rpcSuccess) {
          updateSuccessful = true;
        }
      } catch {}

      // 2. Fallback to direct table update
      if (!updateSuccessful) {
        const { error } = await (supabase.from("site_settings") as any)
          .update({ timeline_locked: checked })
          .eq("id", 1);
        if (error) throw error;
      }

      localStorage.setItem("ju52_timeline_locked", String(checked));
      await queryClient.invalidateQueries({ queryKey: ["site-settings"] });

      if (checked) {
        toast.success("🔒 টাইমলাইন লক করা হয়েছে! সাধারণ ভিজিটরদের 'Coming Soon..' দেখানো হবে।");
      } else {
        toast.success("🌐 টাইমলাইন আনলক করা হয়েছে! এখন সবার জন্য দৃশ্যমান।");
      }
    } catch (err: any) {
      console.error("Lock toggle failed:", err);
      setIsLocked(!checked);
      toast.error("স্ট্যাটাস আপডেট ব্যর্থ হয়েছে: " + (err.message || "সমস্যা হয়েছে"));
    } finally {
      setIsTogglingLock(false);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("event_timeline")
      .select("*")
      .order("sort_order", { ascending: true });
    
    if (error) {
      toast.error("Error fetching events");
    } else if (data) {
      setEvents(data);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (isEditing) {
      const { error } = await supabase
        .from("event_timeline")
        .update(formData)
        .eq("id", isEditing);
      
      if (error) toast.error("Update failed");
      else {
        toast.success("Update successful");
        setIsEditing(null);
      }
    } else {
      const nextOrder = events.length > 0 ? Math.max(...events.map(e => e.sort_order)) + 1 : 1;
      const { error } = await supabase
        .from("event_timeline")
        .insert([{ ...formData, sort_order: nextOrder }]);
      
      if (error) toast.error("Failed to add event");
      else toast.success("Added successfully");
    }

    setFormData({ time: "", title: "", location: "", description: "", icon_name: "Clock", color_class: "bg-primary" });
    fetchEvents();
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("আপনি কি এই ইভেন্টটি মুছে ফেলতে চান?")) {
      const { error } = await supabase.from("event_timeline").delete().eq("id", id);
      if (error) toast.error("Delete failed");
      else {
        toast.success("Event deleted");
        fetchEvents();
      }
    }
  };

  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= events.length) return;

    // Swap elements optimistically
    const newEvents = [...events];
    const temp = newEvents[index];
    newEvents[index] = newEvents[newIndex];
    newEvents[newIndex] = temp;
    setEvents(newEvents);

    // Update all sort_orders to strictly sequential 1, 2, 3...
    const updates = newEvents.map((ev, idx) => ({
      ...ev,
      sort_order: idx + 1
    }));

    const { error } = await supabase.from("event_timeline").upsert(updates);

    if (error) {
      toast.error("ক্রমানুসারে সাজাতে সমস্যা হয়েছে!");
      fetchEvents(); // Revert on failure
    }
  };

  const startEdit = (event: TimelineEvent) => {
    setIsEditing(event.id);
    setFormData({
      time: event.time,
      title: event.title,
      location: event.location,
      description: event.description,
      icon_name: event.icon_name,
      color_class: event.color_class
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CalendarDays className="w-8 h-8 text-primary" />
          টাইমলাইন মডারেশন
        </h1>
      </div>

      {/* Top Lock Status Banner / Control Card */}
      <div className={`mb-8 p-5 rounded-2xl border transition-all duration-300 shadow-sm ${
        isLocked 
          ? "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-100" 
          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`p-3 rounded-xl ${isLocked ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"} shadow-sm`}>
              {isLocked ? <Lock className="w-6 h-6 animate-pulse" /> : <Unlock className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold">
                  {isLocked ? "🔒 টাইমলাইন লক করা আছে" : "🌐 টাইমলাইন লাইভ ও আনলকড"}
                </h2>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  isLocked 
                    ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30" 
                    : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                }`}>
                  {isLocked ? "COMING SOON মোড সক্রিয়" : "পাবলিক ভিউ সচল"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isLocked
                  ? "সাধারণ ব্যবহারকারীরা ওয়েবসাইটে টাইমলাইনের জায়গায় অ্যানিমেটেড 'Coming Soon..' দেখতে পাবেন। (লগইন করা অ্যাডমিনরা নিচে প্রিভিউ দেখতে পাবেন)"
                  : "ওয়েবসাইটে সব সাধারণ ভিজিটররা পুরো ইভেন্ট শিডিউল ও স্থান সরাসরি দেখতে পাচ্ছেন।"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center bg-card/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-border shadow-xs">
            <label htmlFor="timeline-lock-toggle" className="text-xs font-semibold cursor-pointer select-none">
              {isLocked ? "লক মোড চালু" : "আনলক মোড"}
            </label>
            <Switch
              id="timeline-lock-toggle"
              checked={isLocked}
              disabled={isTogglingLock}
              onCheckedChange={handleToggleLock}
            />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSave} className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4 sticky top-24">
            <h2 className="text-xl font-semibold mb-4">{isEditing ? "ইভেন্ট এডিট করুন" : "নতুন ইভেন্ট যোগ করুন"}</h2>
            
            <div>
              <label className="text-sm font-medium">সময় (উদা: সকাল ১০:০০)</label>
              <input 
                type="text" 
                className="w-full p-2 bg-muted border border-border rounded-lg mt-1"
                value={formData.time}
                onChange={e => setFormData({...formData, time: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">শিরোনাম</label>
              <input 
                type="text" 
                className="w-full p-2 bg-muted border border-border rounded-lg mt-1"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">স্থান</label>
              <input 
                type="text" 
                className="w-full p-2 bg-muted border border-border rounded-lg mt-1"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">বিবরণ</label>
              <textarea 
                className="w-full p-2 bg-muted border border-border rounded-lg mt-1 h-24"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">আইকন নাম</label>
                <select 
                  className="w-full p-2 bg-muted border border-border rounded-lg mt-1"
                  value={formData.icon_name}
                  onChange={e => setFormData({...formData, icon_name: e.target.value})}
                >
                  <option value="Users">Users</option>
                  <option value="Music">Music</option>
                  <option value="Flare">Flare</option>
                  <option value="Camera">Camera</option>
                  <option value="Clock">Clock</option>
                  <option value="Award">Award</option>
                  <option value="Flag">Flag</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">রঙ</label>
                <select 
                  className="w-full p-2 bg-muted border border-border rounded-lg mt-1"
                  value={formData.color_class}
                  onChange={e => setFormData({...formData, color_class: e.target.value})}
                >
                  <option value="bg-primary">Primary (Maroon)</option>
                  <option value="bg-orange-500">Orange</option>
                  <option value="bg-pink-500">Pink</option>
                  <option value="bg-purple-500">Purple</option>
                  <option value="bg-blue-500">Blue</option>
                  <option value="bg-green-500">Green</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 bg-primary text-white p-2 rounded-lg font-semibold hover:opacity-90 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
                {isEditing ? "আপডেট" : "যোগ করুন"}
              </button>
              {isEditing && (
                <button 
                  type="button" 
                  onClick={() => setIsEditing(null)}
                  className="bg-muted p-2 rounded-lg hover:bg-muted/80"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : events.length === 0 ? (
              <div className="text-center p-12 bg-muted rounded-2xl">কোনো ইভেন্ট খুঁজে পাওয়া যায়নি।</div>
            ) : (
              events.map((event, index) => (
                <div key={event.id} className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center gap-4 group">
                  <div className={`p-3 rounded-lg ${event.color_class} text-white`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground">{event.time}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.location}</span>
                    </div>
                    <h3 className="font-bold">{event.title}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveOrder(index, 'up')} className="p-1.5 hover:bg-muted rounded text-muted-foreground"><ChevronUp className="w-4 h-4" /></button>
                    <button onClick={() => moveOrder(index, 'down')} className="p-1.5 hover:bg-muted rounded text-muted-foreground"><ChevronDown className="w-4 h-4" /></button>
                    <button onClick={() => startEdit(event)} className="p-1.5 hover:bg-blue-100 text-blue-600 rounded ml-2"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(event.id)} className="p-1.5 hover:bg-red-100 text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
