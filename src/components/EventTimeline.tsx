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
    <section id="event-timeline" className="py-14 px-4 sm:px-6 bg-transparent relative z-10">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative group"
        >
          {/* Liquid Border Effect */}
          <div className="absolute -inset-[2px] rounded-[3.6rem] md:rounded-[5.1rem] bg-gradient-to-br from-white/30 via-transparent to-white/10 opacity-50 group-hover:opacity-100 blur-sm transition-opacity duration-1000" />
          
          <div className="bg-white/10 backdrop-blur-3xl rounded-[3.5rem] md:rounded-[5rem] border border-white/20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] p-8 md:p-20 relative overflow-hidden">
            {/* Decorative background shapes */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] -mr-48 -mt-48 transition-transform group-hover:scale-110 duration-1000" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-[100px] -ml-48 -mb-48" />

          <div className="text-center mb-16 relative z-10">
            <motion.h2 
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-4xl mt-3 md:text-6xl font-extrabold text-white mb-6"
            >
              ইভেন্ট <span className="text-white">টাইমলাইন</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-white/70 text-lg max-w-2xl mx-auto"
            >
              কখন, কোথায়, কী হবে বিস্তারিত জেনে নাও! সবার আগে সঠিক জায়গায় উপস্থিত থেকে ব্যাচ ডের প্রতিটি মুহূর্ত উপভোগ করো।
            </motion.p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-[2.5rem] border-2 border-dashed border-white/10 flex flex-col items-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-bold">কোনো ইভেন্ট সিডিউল পাওয়া যায়নি!</h3>
              <p className="text-muted-foreground text-sm">অ্যাডমিন প্যানেল থেকে টাইমলাইন আপডেট করা হলে এখানে দেখা যাবে।</p>
            </div>
          ) : (
            <div className="relative max-w-4xl mx-auto">
              {/* Main vertical line */}
              <div className="absolute left-6 md:left-1/2 md:-ml-0.5 top-0 bottom-8 w-1 bg-gradient-to-b from-primary/40 via-orange-500/40 to-transparent rounded-full" />

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
                      <div className="absolute left-6 md:left-1/2 -ml-3 md:-ml-4 flex h-6 w-6 md:h-10 md:w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-xl border-4 border-white/10 shadow-lg z-20">
                        <div className={`h-3 w-3 md:h-5 md:w-5 rounded-full ${event.color_class} shadow-inner bg-gradient-to-br from-white/30 to-transparent`} />
                      </div>
  
                      {/* Content Card */}
                      <div className="w-full pl-10 md:pl-0 md:w-5/12 relative z-10">
                        <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 relative group/card overflow-hidden">
                          {/* Subtle inner highlight */}
                          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-[60px] opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" />
                          {/* Mobile Spacer */}
                          <div className="md:hidden h-2" />
                          
                          <div className="flex items-start gap-4 mb-5">
                             <div className={`p-4 rounded-2xl ${event.color_class} text-white shadow-xl group-hover/card:scale-110 group-hover/card:rotate-6 transition-all duration-300 flex-shrink-0`}>
                               <IconComponent className="w-6 h-6" />
                             </div>
                             <div className="min-w-0">
                               <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 mb-1 bg-muted/30 w-fit px-2 py-0.5 rounded-full">
                                 <Clock className="w-3 h-3" /> {event.time}
                               </span>
                               <h3 className="font-display font-bold text-2xl text-foreground leading-tight">{event.title}</h3>
                             </div>
                          </div>
                          
                          <p className="text-base text-foreground/75 mb-6 leading-relaxed whitespace-pre-line">{event.description}</p>
                          
                          <div className="flex items-center gap-2 text-[13px] font-bold text-primary bg-primary/5 w-fit px-4 py-2 rounded-full border border-primary/10 shadow-sm">
                            <div className={`w-2 h-2 rounded-full ${event.color_class} animate-pulse`} />
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
        </motion.div>
      </div>
    </section>
  );
}
