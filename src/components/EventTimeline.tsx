import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { 
  MapPin, Clock, Music, Users, Drumstick, Award, 
  PartyPopper, Camera, Ticket, Coffee, Gamepad2, Trophy, AlertCircle, Loader2
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
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('public:event_timeline')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_timeline' }, () => {
        fetchEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
        <div className="text-center mb-14 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <Clock className="w-3.5 h-3.5" />
            ইভেন্টের পূর্ণাঙ্গ সময়সূচি
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
            কখন, কোথায়, কী হবে বিস্তারিত জেনে নাও! সবার আগে সঠিক জায়গায় উপস্থিত থেকে ব্যাচ ডের প্রতিটি মুহূর্ত উপভোগ করো।
          </motion.p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border-2 border-dashed border-border flex flex-col items-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-bold text-foreground">কোনো ইভেন্ট সিডিউল পাওয়া যায়নি!</h3>
            <p className="text-muted-foreground text-sm">অ্যাডমিন প্যানেল থেকে টাইমলাইন আপডেট করা হলে এখানে দেখা যাবে।</p>
          </div>
        ) : (
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
