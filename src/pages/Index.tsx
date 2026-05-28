import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Users, CalendarDays, MapPin, ShieldCheck,
  Settings, Clock, ChevronRight, Music, Laptop, ArrowRight, Sparkles, Share2, Loader2
} from "lucide-react";
import EventTimeline from "@/components/EventTimeline";
import LeaderboardCard from "@/components/LeaderboardCard";
import Sponsors from "@/components/Sponsors";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useRegistrations } from "@/hooks/useRegistrations";
import { CountdownTimer } from "@/components/CountdownTimer";

function useCountdown(target: Date) {
  const calc = () => {
    const diff = Math.max(0, target.getTime() - Date.now());
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor(diff % 86400000 / 3600000),
      minutes: Math.floor(diff % 3600000 / 60000),
      seconds: Math.floor(diff % 60000 / 1000)
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc), 1000);
    return () => clearInterval(id);
  }, [target]);
  return time;
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } }
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function Index() {
  const { data: settings, isLoading: settingsLoading } = useSiteSettings();
  const [deptData, setDeptData] = useState<any[]>([]);
  const [hallData, setHallData] = useState<any[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data: regs } = await supabase.from("registrations").select("department, hall, status");
      const { data: depts } = await supabase.from("departments").select("*");
      const { data: hl } = await supabase.from("halls").select("*");

      if (depts && hl) {
        const deptCounts: Record<string, number> = {};
        const hallCounts: Record<string, number> = {};
        regs?.forEach(r => {
          if (r.status === 'verified' || r.status === 'pending') {
            deptCounts[r.department] = (deptCounts[r.department] || 0) + 1;
            hallCounts[r.hall] = (hallCounts[r.hall] || 0) + 1;
          }
        });

        setDeptData(depts.map(d => ({
          name: d.name,
          registered: deptCounts[d.name] || 0,
          total: d.capacity || 60
        })).sort((a,b) => b.registered - a.registered));

        setHallData(hl.map(h => ({
          name: h.name,
          registered: hallCounts[h.name] || 0,
          total: h.capacity || 200
        })).sort((a,b) => b.registered - a.registered));
      }
    };
    fetchLeaderboard();
  }, []);
  const { data: registrations = [] } = useRegistrations();

  const eventDate = new Date(settings?.event_date || "2025-06-15T10:00:00+06:00");
  const countdown = useCountdown(eventDate);

  const verifiedCount = registrations.filter((r) => r.status === "verified").length;

  if (settingsLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>);

  }

  const s = settings!;

  // Format date for display
  const dateObj = new Date(s.event_date);
  const dateStr = dateObj.toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" });
  const timeStr = dateObj.toLocaleTimeString("bn-BD", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="pb-28 md:pb-0">
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary">
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(circle at 20% 80%, hsl(37 90% 43% / 0.15) 0%, transparent 50%), radial-gradient(circle at 85% 20%, hsl(160 84% 30% / 0.12) 0%, transparent 50%)"
        }} />

        <div className="container relative py-14 md:py-24 text-center">
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
            <motion.p variants={fadeUp} className="font-body text-xs sm:text-sm font-medium tracking-[0.2em] uppercase text-primary-foreground/60">জাহাঙ্গীরনগর বিশ্ববিদ্যালয় · ৫২তম ব্যাচ

            </motion.p>
            <motion.h1 variants={fadeUp} className="font-display text-6xl sm:text-7xl md:text-8xl font-extrabold text-primary-foreground leading-none">
              {s.hero_title.includes("-") ?
              <>{s.hero_title.split("-")[0]}<span className="text-accent">-</span>{s.hero_title.split("-")[1]}</> :
              s.hero_title}
            </motion.h1>
            <motion.p variants={fadeUp} className="font-display text-lg sm:text-xl md:text-2xl font-bold text-accent whitespace-pre-line leading-relaxed sm:leading-relaxed">
              {s.hero_subtitle.includes("এই নগরীর ভিড়ে") 
                ? s.hero_subtitle.replace("বায়ান্নর", "\nবায়ান্নর") 
                : s.hero_subtitle}
            </motion.p>
            <motion.p variants={fadeUp} className="text-primary-foreground/70 max-w-md mx-auto text-sm md:text-base leading-relaxed">
              {s.hero_description}
            </motion.p>

            {/* Timeline Section */}
            <EventTimeline />

            {/* Countdown */}
            <motion.div variants={fadeUp}>
               <CountdownTimer days={countdown.days} hours={countdown.hours} minutes={countdown.minutes} seconds={countdown.seconds} />
            </motion.div>

            {/* CTA */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              {s.registration_open ?
              <Link
                to="/register"
                className="inline-flex items-center justify-center w-full sm:w-auto gap-2 px-8 py-3.5 rounded-xl bg-accent text-accent-foreground font-display font-bold text-base transition-all hover:scale-105 hover:shadow-lg active:scale-[0.98] shadow-md">
                
                  Register Now
                  <ArrowRight className="h-5 w-5" />
                </Link> :

              <span className="inline-flex items-center justify-center w-full sm:w-auto gap-2 px-8 py-3.5 rounded-xl bg-muted text-muted-foreground font-display font-bold text-base cursor-not-allowed">
                  রেজিস্ট্রেশন বন্ধ
                </span>
              }
              <Link
                to="/status"
                className="inline-flex items-center justify-center w-full sm:w-auto gap-2 px-8 py-3.5 rounded-xl border-2 border-primary-foreground/20 text-primary-foreground font-display font-semibold text-base hover:bg-primary-foreground/10 active:scale-[0.98] transition-all">
                
                Check Status
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Event Info Cards */}
      <section className="bg-surface py-10 md:py-14">
        <div className="container">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            
            {[
            { icon: CalendarDays, label: "তারিখ", value: dateStr, sub: timeStr },
            { icon: MapPin, label: "স্থান", value: s.event_location.name, sub: s.event_location.detail },
            { icon: Users, label: "রেজিস্টার্ড", value: `${verifiedCount}+`, sub: "শিক্ষার্থী" }].
            map((item) =>
            <motion.div
              key={item.label}
              variants={fadeUp}
              className="flex items-center gap-4 rounded-2xl bg-card p-4 md:p-5 shadow-card hover:shadow-card-hover transition-shadow">
              
                <div className="flex h-11 w-11 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{item.label}</p>
                  <p className="font-display font-bold text-sm md:text-base truncate">{item.value}</p>
                  <p className="text-[11px] text-muted-foreground">{item.sub}</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Sponsors Section */}
      <Sponsors />

      {/* Highlights */}
      <section className="py-10 md:py-14">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
            <h2 className="font-display text-2xl md:text-3xl font-bold">
              <Sparkles className="inline h-6 w-6 text-accent mr-2 -mt-1" />
              কেন যোগ দেবে?
            </h2>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} className="grid grid-cols-2 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 gap-3 md:gap-4">
            {s.features.map((item, idx) =>
              <motion.div key={idx} variants={fadeUp} whileHover={{ y: -4 }} className="rounded-2xl bg-card border border-border/50 p-4 md:p-5 shadow-card text-center hover:shadow-card-hover transition-all">
                <span className="text-3xl md:text-4xl block mb-2">{item.emoji}</span>
                <p className="font-display font-bold text-sm md:text-base">{item.title}</p>
                <p className="text-[11px] md:text-xs text-muted-foreground mt-1">{item.desc}</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="py-10 md:py-14 bg-surface">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl md:text-2xl font-bold">🏆 লিডারবোর্ড</h2>
            <Link to="/leaderboard" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
              সব দেখুন <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {[
            { label: "ডিপার্টমেন্ট", data: deptData },
            { label: "হল", data: hallData }].
            map((section) =>
            <motion.div key={section.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <h3 className="font-display font-semibold text-xs text-muted-foreground mb-3 uppercase tracking-widest">{section.label}</h3>
                <div className="space-y-2.5">
                  {section.data.slice(0, 3).map((d, i) =>
                <LeaderboardCard key={d.name} rank={i + 1} {...d} />
                )}
                </div>
              </motion.div>
            )}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-8 rounded-2xl bg-card p-5 md:p-6 shadow-card text-center">
            <p className="font-display font-bold text-sm md:text-base mb-1">তোমার হল কি এগিয়ে আছে? 🤔</p>
            <p className="text-xs text-muted-foreground mb-4">শেয়ার করো, বন্ধুদের রেজিস্ট্রেশন করতে বলো!</p>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: "JU-52 ব্যাচ ডে", text: "আমাদের ব্যাচ ডে-তে যোগ দাও! রেজিস্ট্রেশন চলছে।", url: window.location.origin });
                }
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm transition-all hover:scale-105 active:scale-[0.98]">
              
              <Share2 className="h-4 w-4" />
              শেয়ার করো
            </button>
          </motion.div>
        </div>
      </section>
    </div>);

}