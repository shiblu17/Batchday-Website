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
    <section className="py-20 px-4 sm:px-6 bg-surface">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-4xl mt-3 md:text-5xl font-extrabold text-foreground mb-4"
          >
            ইভেন্ট <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500">টাইমলাইন</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
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
            <h3 className="text-lg font-bold">কোনো ইভেন্ট সিডিউল পাওয়া যায়নি!</h3>
            <p className="text-muted-foreground text-sm">অ্যাডমিন প্যানেল থেকে টাইমলাইন আপডেট করা হলে এখানে দেখা যাবে।</p>
          </div>
        ) : (
          <div className="relative">
            {/* Main vertical line */}
            <div className="absolute left-6 md:left-1/2 md:-ml-0.5 top-0 bottom-8 w-1 bg-gradient-to-b from-primary/50 via-orange-500/50 to-transparent rounded-full" />

            <div className="space-y-12">
              {events.map((event, index) => {
                const isEven = index % 2 === 0;
                const IconComponent = iconMap[event.icon_name] || Award; // Fallback to Award if not found
                
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`relative flex items-center justify-between md:justify-normal ${
                      isEven ? "md:flex-row-reverse" : ""
                    }`}
                  >
                    <div className="hidden md:block w-5/12" />
                    
                    {/* Timeline Node */}
                    <div className="absolute left-6 md:left-1/2 -ml-3 md:-ml-4 flex h-6 w-6 md:h-10 md:w-10 items-center justify-center rounded-full bg-background border-4 border-background shadow-md z-20">
                      <div className={`h-3 w-3 md:h-5 md:w-5 rounded-full ${event.color_class} shadow-inner bg-gradient-to-br from-white/20 to-transparent`} />
                    </div>

                    {/* Content Card */}
                    <div className="w-full pl-10 md:pl-0 md:w-5/12">
                      <div className="bg-card p-6 md:p-8 rounded-3xl border border-border shadow-card hover:shadow-xl transition-shadow relative group">
                        {/* Mobile Spacer to avoid dot overlap */}
                        <div className="md:hidden h-2" />
                        
                        <div className="flex items-start gap-4 mb-4">
                           <div className={`p-3 rounded-2xl ${event.color_class} text-white shadow-lg group-hover:scale-110 transition-transform flex-shrink-0`}>
                             <IconComponent className="w-6 h-6" />
                           </div>
                           <div>
                             <span className="text-sm font-bold text-muted-foreground flex items-center gap-1.5 mb-1">
                               <Clock className="w-4 h-4" /> {event.time}
                             </span>
                             <h3 className="font-display font-bold text-xl text-foreground">{event.title}</h3>
                           </div>
                        </div>
                        
                        <p className="text-base text-foreground/80 mb-5 leading-relaxed whitespace-pre-line">{event.description}</p>
                        
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-primary/90 bg-primary/10 w-fit px-3 py-1.5 rounded-lg border border-primary/20">
                          <MapPin className="w-4 h-4" />
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
