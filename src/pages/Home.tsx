import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, MapPin, Users, Sparkles, Clock, Share2, Loader2 } from "lucide-react";
import LeaderboardCard from "../components/LeaderboardCard";
import Sponsors from "../components/Sponsors";
import { getLeaderboardData } from "../lib/constants";
import { useSiteSettings } from "../hooks/useSiteSettings";
import { useRegistrations } from "../hooks/useRegistrations";

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

export default function HomePage() {
  const { data: settings, isLoading: settingsLoading } = useSiteSettings();
  const [deptData, setDeptData] = useState<any[]>([]);
  const [hallData, setHallData] = useState<any[]>([]);

  useEffect(() => {
    setDeptData(getLeaderboardData('dept'));
    setHallData(getLeaderboardData('hall'));
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
    <div className="pb-20 md:pb-0">
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary">
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(circle at 20% 80%, hsl(37 90% 43% / 0.15) 0%, transparent 50%), radial-gradient(circle at 85% 20%, hsl(160 84% 30% / 0.12) 0%, transparent 50%)"
        }} />

        <div className="container mx-auto px-4 relative py-14 md:py-24 text-center">
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
            <motion.p variants={fadeUp} className="font-body text-xs sm:text-sm font-medium tracking-[0.2em] uppercase text-primary-foreground/60">জাহাঙ্গীরনগর বিশ্ববিদ্যালয় · ৫২তম ব্যাচ

            </motion.p>
            <motion.h1 variants={fadeUp} className="font-display text-6xl sm:text-7xl md:text-8xl font-extrabold text-primary-foreground leading-none">
              {s.hero_title.includes("-") ?
              <>{s.hero_title.split("-")[0]}<span className="text-accent">-</span>{s.hero_title.split("-")[1]}</> :
              s.hero_title}
            </motion.h1>
            <motion.p variants={fadeUp} className="font-display text-lg sm:text-xl md:text-2xl font-bold text-accent">
              {s.hero_subtitle}
            </motion.p>
            <motion.p variants={fadeUp} className="text-primary-foreground/70 max-w-md mx-auto text-sm md:text-base leading-relaxed">
              {s.hero_description}
            </motion.p>

            {/* Countdown */}
            <motion.div variants={fadeUp} className="flex justify-center gap-3 sm:gap-4 pt-2">
              {[
              { val: countdown.days, label: "দিন" },
              { val: countdown.hours, label: "ঘণ্টা" },
              { val: countdown.minutes, label: "মিনিট" },
              { val: countdown.seconds, label: "সেকেন্ড" }].
              map((t) =>
              <div key={t.label} className="flex flex-col items-center">
                  <span className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold text-primary-foreground tabular-nums w-16 sm:w-20 text-center drop-shadow-sm">
                    {String(t.val).padStart(2, "0")}
                  </span>
                  <span className="text-xs sm:text-sm text-primary-foreground/70 uppercase tracking-wider mt-1">{t.label}</span>
                </div>
              )}
            </motion.div>

            {/* CTA */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center pt-8">
              {s.registration_open ?
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-accent text-accent-foreground font-display font-bold text-base transition-all hover:scale-105 hover:shadow-lg active:scale-[0.98] shadow-md">
                
                  Register Now
                  <ArrowRight className="h-5 w-5" />
                </Link> :

              <span className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-muted text-muted-foreground font-display font-bold text-base cursor-not-allowed">
                  রেজিস্ট্রেশন বন্ধ
                </span>
              }
              <Link
                to="/status"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border-2 border-primary-foreground/20 text-primary-foreground font-display font-semibold text-base hover:bg-primary-foreground/10 active:scale-[0.98] transition-all">
                
                Check Status
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Event Info Cards */}
      <section className="bg-surface py-10 md:py-14">
        <div className="container mx-auto px-4 max-w-4xl -mt-20 relative z-10">
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
              className="flex items-center gap-4 rounded-3xl bg-card p-6 md:p-8 shadow-card hover:shadow-card-hover transition-shadow border border-gray-50">
              
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <item.icon className="h-8 w-8" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="font-display font-bold text-lg md:text-xl truncate text-gray-800">{item.value}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{item.sub}</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Sponsors Section */}
      <Sponsors />

      {/* Highlights */}
      <section className="py-16 md:py-24 max-w-6xl mx-auto px-4">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold flex items-center justify-center text-gray-800">
              <Sparkles className="inline h-8 w-8 text-accent mr-3" />
              কেন যোগ দেবে?
            </h2>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
            { emoji: "🎶", title: "লাইভ কনসার্ট", desc: "মিউজিক ও পারফরম্যান্স" },
            { emoji: "🍽️", title: "ফুড ফেস্ট", desc: "ক্যাম্পাসের বিখ্যাত খাবার" },
            { emoji: "📸", title: "ফটো জোন", desc: "স্মৃতি ধরে রাখো" },
            { emoji: "🏆", title: "প্রতিযোগিতা", desc: "হল vs হল চ্যালেঞ্জ" }].
            map((item) =>
            <motion.div key={item.title} variants={fadeUp} whileHover={{ y: -8 }} className="rounded-[2rem] border border-gray-100 bg-card p-8 md:p-10 shadow-card text-center hover:shadow-card-hover transition-all">
                <span className="text-5xl block mb-4">{item.emoji}</span>
                <h3 className="font-display font-bold text-xl md:text-2xl text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground font-medium">{item.desc}</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="py-16 md:py-24 bg-surface border-t border-gray-200">
        <div className="container max-w-5xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col text-center md:text-left md:flex-row items-center justify-between mb-10 gap-4">
            <h2 className="font-display text-3xl md:text-4xl font-black text-primary">🏆 রিয়েল-টাইম লিডারবোর্ড</h2>
            <Link to="/" className="text-base font-bold text-accent hover:underline flex items-center gap-2">
              সব দেখুন <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-8 md:gap-10">
            {[
            { label: "ডিপার্টমেন্ট", data: deptData },
            { label: "হল", data: hallData }].
            map((section) =>
            <motion.div key={section.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-display font-bold text-sm text-gray-400 mb-5 uppercase tracking-widest">{section.label}</h3>
                <div className="space-y-4">
                  {section.data.slice(0, 3).map((d, i) =>
                <LeaderboardCard key={d.name} rank={i + 1} {...d} />
                )}
                </div>
              </motion.div>
            )}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-12 rounded-[2rem] bg-card p-8 md:p-10 shadow-card text-center border border-primary/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl" />
            <h3 className="font-display font-bold text-2xl md:text-3xl text-gray-800 mb-3 relative z-10">তোমার হল কি এগিয়ে আছে? 🤔</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto relative z-10">শেয়ার করে বন্ধুদের রেজিস্ট্রেশন করতে বলো এবং নিজের ডিপার্টমেন্ট বা হলকে লিডারবোর্ডের শীর্ষে নিয়ে যাও!</p>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: "JU-52 ব্যাচ ডে", text: "আমাদের ব্যাচ ডে-তে যোগ দাও! রেজিস্ট্রেশন চলছে।", url: window.location.origin });
                }
              }}
              className="relative z-10 mx-auto inline-flex items-center gap-3 px-8 py-4 rounded-full bg-primary text-primary-foreground font-display font-bold text-lg transition-all hover:scale-105 active:scale-[0.98] shadow-xl shadow-primary/20">
              <Share2 className="h-5 w-5" />
              শেয়ার করো
            </button>
          </motion.div>
        </div>
      </section>
    </div>);

}
