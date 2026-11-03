import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useQueryClient } from "@tanstack/react-query";
import { 
  MapPin, Clock, Music, Users, Drumstick, Award, 
  PartyPopper, Camera, Ticket, Coffee, Gamepad2, Trophy, AlertCircle, Loader2,
  Lock, Sparkles, ShieldCheck
} from "lucide-react";

// Map string names to actual Lucide components
const iconMap: Record<string, any> = {
  MapPin, Clock, Music, Users, Drumstick, Award, 
  PartyPopper, Camera, Ticket, Coffee, Gamepad2, Trophy
};

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

export default function EventTimeline() {
  const { data: settings } = useSiteSettings();
  const queryClient = useQueryClient();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdminSession = typeof window !== "undefined" && Boolean(localStorage.getItem("ju52_admin_session"));
  const isLocked = settings?.timeline_locked ?? (typeof window !== "undefined" && localStorage.getItem("ju52_timeline_locked") === "true");

  useEffect(() => {
    fetchEvents();

    // Subscribe to realtime changes
    const channel1 = supabase
      .channel('public:event_timeline')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_timeline' }, () => {
        fetchEvents();
      })
      .subscribe();

    const channel2 = supabase
      .channel('public:site_settings_timeline_status')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => {
        queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
    };
  }, [queryClient]);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("event_timeline")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("time", { ascending: true }); // Fallback sorting

    if (data && !error) {
      setEvents(data);
    }
    setLoading(false);
  };

  return (
    <section id="event-timeline" className="py-16 md:py-24 px-4 sm:px-6 bg-surface/50 border-t border-border/40 relative z-10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10 md:mb-14 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <Clock className="w-3.5 h-3.5" />
            {isLocked ? "ইভেন্টের সময়সূচি • অতি শীঘ্রই আসছে" : "ইভেন্টের পূর্ণাঙ্গ সময়সূচি"}
          </div>
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl md:text-5xl font-extrabold text-foreground mb-4"
          >
            ইভেন্ট <span className="text-primary">টাইমলাইন</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed"
          >
            {isLocked
              ? "৫২তম ব্যাচ ডের সকল জমকালো আয়োজন, কনসার্ট ও সাংস্কৃতিক উৎসবের আকর্ষণীয় সময়সূচি প্রস্তুত করা হচ্ছে।"
              : "কখন, কোথায়, কী হবে বিস্তারিত জেনে নাও! সবার আগে সঠিক জায়গায় উপস্থিত থেকে ব্যাচ ডের প্রতিটি মুহূর্ত উপভোগ করো।"}
          </motion.p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : isLocked ? (
          /* LOCKED STATE: COMING SOON VIEW */
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative max-w-2xl mx-auto p-8 sm:p-12 rounded-3xl bg-card/85 border border-amber-500/30 dark:border-amber-400/20 backdrop-blur-xl shadow-2xl shadow-black/10 text-center overflow-hidden"
            >
              {/* Ambient radial glows */}
              <div className="absolute -top-24 -left-24 w-52 h-52 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
              
              {/* Animated Lock & Sparkle Badge */}
              <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 via-primary/15 to-rose-500/20 border border-amber-400/40 text-amber-500 shadow-xl shadow-amber-500/15 group">
                <Lock className="w-10 h-10 text-amber-500 animate-pulse drop-shadow-md" />
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-white dark:border-slate-900"></span>
                </span>
              </div>

              {/* Shimmering Coming Soon Title */}
              <h3 className="font-display text-4xl sm:text-5xl font-black tracking-tight mb-3 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 bg-clip-text text-transparent drop-shadow-xs">
                Coming Soon..
              </h3>
              
              <p className="font-display font-bold text-lg sm:text-xl text-foreground mb-3">
                ইভেন্টের চূড়ান্ত সময়সূচি খুব শীঘ্রই আসছে!
              </p>
              
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto mb-6">
                জাহাঙ্গীরনগর বিশ্ববিদ্যালয় ৫২তম ব্যাচ ডের প্রতিটি জমকালো আয়োজন ও উৎসবের পূর্ণাঙ্গ শিডিউল প্রস্তুত হচ্ছে। চূড়ান্ত পর্বগুলো খুব শীঘ্রই এখানে উন্মুক্ত করা হবে।
              </p>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/25 text-xs font-bold text-amber-700 dark:text-amber-300 shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-500 animate-spin [animation-duration:4s]" />
                <span>আমাদের সাথেই থাকুন • চোখ রাখুন এই পেজে</span>
              </div>
            </motion.div>

            {/* If Admin is browsing, show live preview underneath */}
            {isAdminSession && (
              <div className="pt-6 border-t border-dashed border-amber-500/30">
                <div className="max-w-2xl mx-auto mb-8 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 text-center font-bold flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>অ্যাডমিন প্রিভিউ: টাইমলাইন বর্তমানে লকড রয়েছে (ভিজিটররা শুধু উপরের Coming Soon দেখবে)। নিচে আপনার সাজানো ইভেন্টগুলোর প্রিভিউ:</span>
                </div>
                
                {/* Admin Live Timeline Preview */}
                <div className="relative max-w-4xl mx-auto opacity-75 hover:opacity-100 transition-opacity">
                  <div className="absolute left-4 md:left-1/2 md:-ml-0.5 top-0 bottom-8 w-1 bg-gradient-to-b from-primary/40 via-orange-500/40 to-transparent rounded-full" />
                  <div className="space-y-12">
                    {events.map((event, index) => {
                      const isEven = index % 2 === 0;
                      const IconComponent = iconMap[event.icon_name] || Award;
                      return (
                        <div
                          key={event.id}
                          className={`relative flex items-center justify-between md:justify-normal ${
                            isEven ? "md:flex-row-reverse" : ""
                          }`}
                        >
                          <div className="hidden md:block w-5/12" />
                          <div className="absolute left-4 md:left-1/2 -ml-3 md:-ml-4 flex h-6 w-6 md:h-10 md:w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-xl border-4 border-white/10 shadow-lg z-20">
                            <div className={`h-3 w-3 md:h-5 md:w-5 rounded-full ${event.color_class} shadow-inner bg-gradient-to-br from-white/30 to-transparent`} />
                          </div>
                          <div className="w-full pl-9 pr-1 py-2 md:px-0 md:py-0 md:w-5/12 relative z-10">
                            <div className="bg-card p-4 md:p-8 rounded-2xl md:rounded-3xl border border-border shadow-md">
                              <div className="flex items-start gap-3 md:gap-4 mb-3">
                                <div className={`p-2.5 md:p-3.5 rounded-xl md:rounded-2xl ${event.color_class} text-white shadow-md flex-shrink-0`}>
                                  <IconComponent className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-[11px] md:text-xs font-bold text-muted-foreground flex items-center gap-1.5 mb-1 bg-muted/60 w-fit px-2 py-0.5 rounded-full">
                                    <Clock className="w-3 h-3" /> {event.time}
                                  </span>
                                  <h3 className="font-display font-bold text-base md:text-xl text-foreground leading-tight">{event.title}</h3>
                                </div>
                              </div>
                              <p className="text-xs md:text-sm text-muted-foreground mb-4 leading-relaxed whitespace-pre-line">{event.description}</p>
                              <div className="flex items-center gap-2 text-[11px] md:text-xs font-bold text-primary bg-primary/10 w-fit px-3 py-1.5 rounded-full border border-primary/20">
                                <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${event.color_class}`} />
                                {event.location}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border-2 border-dashed border-border flex flex-col items-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-bold text-foreground">কোনো ইভেন্ট সিডিউল পাওয়া যায়নি!</h3>
            <p className="text-muted-foreground text-sm">অ্যাডমিন প্যানেল থেকে টাইমলাইন আপডেট করা হলে এখানে দেখা যাবে।</p>
          </div>
        ) : (
          /* UNLOCKED STATE: FULL TIMELINE VIEW */
          <div className="relative max-w-4xl mx-auto">
            {/* Main vertical line */}
            <div className="absolute left-4 md:left-1/2 md:-ml-0.5 top-0 bottom-8 w-1 bg-gradient-to-b from-primary/40 via-orange-500/40 to-transparent rounded-full" />

            <div className="space-y-12">
              {events.map((event, index) => {
                const isEven = index % 2 === 0;
                const IconComponent = iconMap[event.icon_name] || Award; // Fallback
                
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`relative flex items-center justify-between md:justify-normal ${
                      isEven ? "md:flex-row-reverse" : ""
                    }`}
                  >
                    <div className="hidden md:block w-5/12" />
                    
                    {/* Timeline Node */}
                    <div className="absolute left-4 md:left-1/2 -ml-3 md:-ml-4 flex h-6 w-6 md:h-10 md:w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-xl border-4 border-white/10 shadow-lg z-20">
                      <div className={`h-3 w-3 md:h-5 md:w-5 rounded-full ${event.color_class} shadow-inner bg-gradient-to-br from-white/30 to-transparent`} />
                    </div>

                    {/* Content Card */}
                    <div className="w-full pl-9 pr-1 py-2 md:px-0 md:py-0 md:w-5/12 relative z-10">
                      <div className="bg-card p-4 md:p-8 rounded-2xl md:rounded-3xl border border-border shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group/card overflow-hidden">
                        {/* Subtle inner highlight */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-[60px] opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" />
                        
                        <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                           <div className={`p-2.5 md:p-3.5 rounded-xl md:rounded-2xl ${event.color_class} text-white shadow-md group-hover/card:scale-105 transition-all duration-300 flex-shrink-0`}>
                             <IconComponent className="w-5 h-5 md:w-6 md:h-6" />
                           </div>
                           <div className="min-w-0">
                             <span className="text-[11px] md:text-xs font-bold text-muted-foreground flex items-center gap-1.5 mb-1 bg-muted/60 w-fit px-2 py-0.5 rounded-full">
                               <Clock className="w-3 h-3" /> {event.time}
                             </span>
                             <h3 className="font-display font-bold text-base md:text-xl text-foreground leading-tight">{event.title}</h3>
                           </div>
                        </div>
                        
                        <p className="text-xs md:text-sm text-muted-foreground mb-4 leading-relaxed whitespace-pre-line">{event.description}</p>
                        
                        <div className="flex items-center gap-2 text-[11px] md:text-xs font-bold text-primary bg-primary/10 w-fit px-3 py-1.5 rounded-full border border-primary/20 shadow-sm">
                          <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${event.color_class} animate-pulse`} />
                          {event.location}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
