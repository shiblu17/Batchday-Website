import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Users, CalendarDays, MapPin, ShieldCheck,
  Settings, Clock, ChevronRight, Music, Laptop, ArrowRight, Sparkles, Share2, Loader2,
  Compass, BookOpen, Hourglass, Zap, Headphones
} from "lucide-react";
import EventTimeline from "@/components/EventTimeline";
import LeaderboardCard from "@/components/LeaderboardCard";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useQuery } from "@tanstack/react-query";
import { CountdownTimer } from "@/components/CountdownTimer";
import { juAmbientEngine } from "@/utils/juAmbientAudio";

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
  const { data: verifiedCount = 0 } = useQuery({
    queryKey: ["verified-registrations-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("registrations")
        .select("*", { count: "exact", head: true })
        .eq("status", "verified");
      if (error) throw error;
      return count || 0;
    },
    staleTime: 30_000,
  });

  const eventDate = new Date(settings?.event_date || "2025-06-15T10:00:00+06:00");
  const countdown = useCountdown(eventDate);

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
      <section className="relative overflow-hidden bg-gradient-to-b from-[#3a0412] via-[#52071a] to-[#2c030d]">
        {/* Dramatic Top Spotlight Beam */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.22),rgba(255,255,255,0))] pointer-events-none" />

        {/* Ambient Glowing Orbs */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-gradient-to-tr from-amber-500/25 via-rose-500/20 to-primary/20 blur-[130px] pointer-events-none rounded-full" />
        <div className="absolute top-24 left-10 w-72 h-72 bg-emerald-500/15 blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute top-24 right-10 w-72 h-72 bg-amber-400/20 blur-[100px] pointer-events-none rounded-full" />

        {/* Floating Campus Badge 1 (Left Top) */}
        <div className="hidden lg:flex absolute left-8 xl:left-14 top-28 items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-2xl animate-float">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-lg shadow-inner">
            📍
          </div>
          <div className="text-left">
            <div className="text-xs font-bold leading-tight font-display">৭০০ একর</div>
            <div className="text-[10px] text-white/75">সবুজ ক্যাম্পাসের আবেগ</div>
          </div>
        </div>

        {/* Floating Campus Badge 2 (Left Bottom) */}
        <div className="hidden lg:flex absolute left-10 xl:left-16 bottom-44 items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-2xl animate-float [animation-delay:1.6s]">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-lg shadow-inner">
            ☕
          </div>
          <div className="text-left">
            <div className="text-xs font-bold leading-tight font-display">বটতলার আড্ডা</div>
            <div className="text-[10px] text-white/75">৫০ রকমের স্পেশাল ভর্তা</div>
          </div>
        </div>

        {/* Floating Campus Badge 3 (Right Top) */}
        <div className="hidden lg:flex absolute right-8 xl:left-auto xl:right-14 top-28 items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-2xl animate-float [animation-delay:0.9s]">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 flex items-center justify-center text-lg shadow-inner">
            🎓
          </div>
          <div className="text-left">
            <div className="text-xs font-bold leading-tight font-display">৫২তম ব্যাচ</div>
            <div className="text-[10px] text-white/75">সাতশ একরে পদচিহ্ন</div>
          </div>
        </div>

        {/* Floating Campus Badge 4 (Right Bottom) */}
        <div className="hidden lg:flex absolute right-10 xl:left-auto xl:right-16 bottom-44 items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-2xl animate-float [animation-delay:2.3s]">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-lg shadow-inner">
            🎶
          </div>
          <div className="text-left">
            <div className="text-xs font-bold leading-tight font-display">মুক্তমঞ্চের সুর</div>
            <div className="text-[10px] text-white/75">রাতজাগা কনসার্ট ও গান</div>
          </div>
        </div>

        {/* Campus Silhouette in Background */}
        <div className="absolute bottom-8 left-0 right-0 h-48 pointer-events-none opacity-20 overflow-hidden flex items-end justify-center">
          <svg viewBox="0 0 1200 200" className="w-full h-full preserve-3d" fill="currentColor">
            {/* Birds */}
            <path d="M200,40 Q215,30 225,40 Q235,30 250,40 Q235,45 225,37 Q215,45 200,40 Z" fill="white" />
            <path d="M280,60 Q292,52 300,60 Q308,52 320,60 Q308,64 300,58 Q292,64 280,60 Z" fill="white" />
            <path d="M850,30 Q862,22 870,30 Q878,22 890,30 Q878,34 870,28 Q862,34 850,30 Z" fill="white" />
            {/* Trees & Campus Outline */}
            <path d="M0,200 L0,170 Q40,150 80,175 Q120,140 160,170 Q200,130 240,175 Q300,145 360,180 L420,180 L440,120 L450,200 L460,80 L470,200 L480,140 L500,180 Q560,140 620,175 Q680,135 740,170 Q800,140 860,175 Q920,130 980,180 Q1040,145 1100,170 Q1150,155 1200,175 L1200,200 Z" fill="white" />
          </svg>
        </div>

        <div className="container relative pt-12 pb-20 md:pt-20 md:pb-28 text-center max-w-4xl mx-auto">
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
            {/* Festival Top Pill */}
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-display text-xs sm:text-sm font-semibold tracking-wide">
                জাহাঙ্গীরনগর বিশ্ববিদ্যালয় · ৫২তম ব্যাচ পুনর্মিলনী উৎসব
              </span>
            </motion.div>

            {/* Giant JU-52 Metallic Title */}
            <div className="relative py-2">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-96 sm:h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
              <motion.h1 variants={fadeUp} className="relative font-display text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] font-black leading-none tracking-tight flex items-center justify-center">
                <span className="bg-gradient-to-b from-white via-amber-100 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)]">
                  JU
                </span>
                <span className="inline-flex items-center justify-center mx-2 sm:mx-4 px-3 sm:px-6 py-1 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-2xl shadow-orange-500/50 text-4xl sm:text-6xl md:text-7xl font-black align-middle border border-white/20">
                  -
                </span>
                <span className="bg-gradient-to-b from-white via-amber-100 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)]">
                  52
                </span>
              </motion.h1>
            </div>

            {/* Radiant Sunset Gold Subtitle */}
            <motion.p variants={fadeUp} className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-400 bg-clip-text text-transparent whitespace-pre-line leading-relaxed sm:leading-relaxed drop-shadow-md">
              {s.hero_subtitle.includes("এই নগরীর ভিড়ে") 
                ? s.hero_subtitle.replace("বায়ান্নর", "\nবায়ান্নর") 
                : s.hero_subtitle}
            </motion.p>

            <motion.p variants={fadeUp} className="text-white/80 max-w-xl mx-auto text-sm md:text-base leading-relaxed font-body">
              {s.hero_description}
            </motion.p>

            {/* Ambient Sound Audio Quick Pill */}
            <motion.div variants={fadeUp} className="flex items-center justify-center pt-1 pb-1">
              <button
                onClick={() => juAmbientEngine.play("tea")}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs font-semibold backdrop-blur-md transition-all hover:scale-105 active:scale-95 shadow-lg group cursor-pointer"
              >
                <Headphones className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
                <span>বটতলার আড্ডার সুর শুনুন ☕</span>
              </button>
            </motion.div>

            {/* Timeline Section */}
            <EventTimeline />

            {/* Countdown */}
            <motion.div variants={fadeUp}>
               <CountdownTimer days={countdown.days} hours={countdown.hours} minutes={countdown.minutes} seconds={countdown.seconds} />
            </motion.div>

            {/* CTA Buttons */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              {s.registration_open ?
              <Link
                to="/register"
                className="inline-flex items-center justify-center w-full sm:w-auto gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-accent via-orange-500 to-amber-500 text-white font-display font-black text-base transition-all hover:scale-105 hover:shadow-2xl hover:shadow-accent/40 active:scale-[0.98] shadow-xl border border-white/20">
                  Register Now
                  <ArrowRight className="h-5 w-5" />
                </Link> :

              <span className="inline-flex items-center justify-center w-full sm:w-auto gap-2 px-8 py-3.5 rounded-xl bg-muted text-muted-foreground font-display font-bold text-base cursor-not-allowed">
                  রেজিস্ট্রেশন বন্ধ
                </span>
              }
              <Link
                to="/status"
                className="inline-flex items-center justify-center w-full sm:w-auto gap-2 px-8 py-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/30 text-white font-display font-bold text-base hover:bg-white/20 active:scale-[0.98] transition-all shadow-lg hover:border-white/50">
                Check Status
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Organic Wave Transition into next section */}
        <div className="absolute bottom-0 left-0 right-0 leading-none pointer-events-none">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-8 sm:h-14 text-surface fill-current">
            <path d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,50 L1200,120 L0,120 Z" />
          </svg>
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
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-5">
            
            {[
            { icon: CalendarDays, label: "তারিখ", value: dateStr, sub: timeStr, color: "text-amber-500 bg-amber-500/10" },
            { icon: MapPin, label: "স্থান", value: s.event_location.name, sub: s.event_location.detail, color: "text-rose-500 bg-rose-500/10" },
            { icon: Users, label: "রেজিস্টার্ড", value: `${verifiedCount}+`, sub: "শিক্ষার্থী", color: "text-emerald-500 bg-emerald-500/10" }].
            map((item) =>
            <motion.div
              key={item.label}
              variants={fadeUp}
              className="flex items-center gap-4 rounded-2xl bg-card border border-border/80 p-4 md:p-5 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
              
                <div className={`flex h-12 w-12 md:h-14 md:w-14 shrink-0 items-center justify-center rounded-2xl ${item.color} shadow-sm`}>
                  <item.icon className="h-6 w-6 md:h-7 md:w-7" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                  <p className="font-display font-black text-base md:text-lg truncate text-foreground">{item.value}</p>
                  <p className="text-[11px] text-muted-foreground font-medium">{item.sub}</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

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
              <motion.div key={idx} variants={fadeUp} whileHover={{ y: -6 }} className="rounded-2xl bg-card border border-border/80 p-5 shadow-sm hover:shadow-xl hover:border-primary/40 transition-all text-center group">
                <span className="text-4xl block mb-2.5 group-hover:scale-110 transition-transform duration-200">{item.emoji}</span>
                <p className="font-display font-black text-sm md:text-base text-foreground">{item.title}</p>
                <p className="text-[11px] md:text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Special Memory & Interactive Features */}
      <section className="py-12 md:py-16 bg-muted/20 border-y border-border/60">
        <div className="container space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              স্মৃতি ও উৎসবের বিশেষ ফিচারসমূহ
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-black text-foreground">
              ক্যাম্পাস জীবনকে চিরস্থায়ী করো
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground max-w-xl mx-auto">
              বন্ধুদের চিরকুট, ক্যাম্পাসের প্রিয় স্পট আর ১০ বছর পরের নিজের জন্য স্মৃতি জমা রাখার দারুণ সব আয়োজন।
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "ক্যাম্পাস মেমোরি ম্যাপ",
                desc: "৭০০ একরের প্রিয় স্থানগুলোতে বন্ধুদের সঙ্গে কাটানো সেরা স্মৃতি পিন করো।",
                to: "/campus-map",
                icon: Compass,
                badge: "ইন্টারেক্টিভ ম্যাপ",
                color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
              },
              {
                title: "ফ্রেন্ডশিপ স্ল্যাম বুক",
                desc: "বন্ধুদের নিজস্ব ডায়েরির পাতায় ডাকনাম, মজার স্মৃতি আর চিরকুট লিখে এসো।",
                to: "/slambook",
                icon: BookOpen,
                badge: "ডিজিটাল চিরকুট",
                color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
              },
              {
                title: "টাইম ক্যাপসুল ২০৩৬",
                desc: "১০ বছর পরের নিজের উদ্দেশ্যে চিঠি লেখো। ডিজিটাল সিলমোহরে লক থাকবে ২০৩৬ পর্যন্ত।",
                to: "/time-capsule",
                icon: Hourglass,
                badge: "লকড ইন ২০৩৬",
                color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
              },
              {
                title: "মুক্তমঞ্চ লাইভ পালস",
                desc: "কনসার্ট ও ইভেন্টে ফোন থেকে ট্যাপ করে মঞ্চের প্রজেক্টরে রিয়েল-টাইম শক্তি পাঠাও!",
                to: "/stage-pulse",
                icon: Zap,
                badge: "লাইভ স্টেজ",
                color: "text-primary bg-primary/10 border-primary/20",
              },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <Link
                  key={f.to}
                  to={f.to}
                  className="group relative flex flex-col justify-between p-5 rounded-2xl bg-card border border-border shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wide">
                        {f.badge}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-foreground group-hover:text-primary transition-colors">
                        {f.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-primary">
                    <span>এক্সপ্লোর করুন</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
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