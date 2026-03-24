import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, CheckCircle, XCircle, Download, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";

type Status = "idle" | "pending" | "verified" | "rejected" | "not_found" | "loading";

const statusConfig: Record<string, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  pending: { icon: Clock, label: "পেমেন্ট পেন্ডিং", color: "text-accent", bg: "bg-accent/10" },
  verified: { icon: CheckCircle, label: "পেমেন্ট ভেরিফাইড ✅", color: "text-secondary", bg: "bg-secondary/10" },
  rejected: { icon: XCircle, label: "পেমেন্ট রিজেক্টেড", color: "text-destructive", bg: "bg-destructive/10" },
  not_found: { icon: Search, label: "এই রোলে কোনো রেজিস্ট্রেশন পাওয়া যায়নি", color: "text-muted-foreground", bg: "bg-muted" },
};

interface UserData {
  name: string;
  department: string;
  hall: string;
  status: string;
}

export default function StatusPage() {
  const [roll, setRoll] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [userData, setUserData] = useState<UserData | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    const { data, error } = await supabase
      .from("registrations")
      .select("name, department, hall, status")
      .eq("roll", roll.trim())
      .maybeSingle();

    if (error || !data) {
      setUserData(null);
      setStatus("not_found");
    } else {
      setUserData(data);
      setStatus(data.status as Status);
    }
  };

  return (
    <div className="container max-w-lg py-6 md:py-8 pb-24 md:pb-8 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold mb-1">স্ট্যাটাস চেক</h1>
        <p className="text-muted-foreground text-sm mb-6">তোমার রোল নম্বর দিয়ে রেজিস্ট্রেশন স্ট্যাটাস দেখো</p>

        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="w-full rounded-xl border border-input bg-card pl-10 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              placeholder="রোল নম্বর লিখো"
              value={roll}
              onChange={(e) => setRoll(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-6 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : "খোঁজো"}
          </button>
        </form>

        <AnimatePresence mode="wait">
          {status !== "idle" && status !== "loading" && (
            <motion.div
              key={status + roll}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {status !== "not_found" && userData ? (
                <div className="space-y-4">
                  <div className={`flex items-center gap-3 p-4 rounded-xl ${statusConfig[status]?.bg}`}>
                    {(() => {
                      const Icon = statusConfig[status]?.icon;
                      return Icon ? <Icon className={`h-6 w-6 ${statusConfig[status]?.color}`} /> : null;
                    })()}
                    <span className={`font-display font-bold ${statusConfig[status]?.color}`}>
                      {statusConfig[status]?.label}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-surface p-5 space-y-3">
                    {[
                      { label: "নাম", value: userData.name },
                      { label: "রোল", value: roll },
                      { label: "ডিপার্টমেন্ট", value: userData.department },
                      { label: "হল", value: userData.hall },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between text-sm gap-2">
                        <span className="text-muted-foreground shrink-0">{item.label}</span>
                        <span className="font-semibold text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {status === "verified" && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", delay: 0.15 }}
                      className="rounded-2xl bg-primary p-6 text-primary-foreground text-center space-y-4"
                    >
                      <p className="text-xs uppercase tracking-widest opacity-70">ডিজিটাল আইডি কার্ড</p>
                      <h3 className="font-display text-xl font-extrabold">JU-52 ব্যাচ ডে</h3>
                      <div className="mx-auto w-fit bg-card rounded-xl p-3">
                        <QRCodeSVG value={`JU52-${roll}`} size={120} />
                      </div>
                      <div>
                        <p className="font-display font-bold text-lg">{userData.name}</p>
                        <p className="text-sm opacity-80">{userData.department}</p>
                        <p className="text-xs opacity-60">Roll: {roll}</p>
                      </div>
                      <button className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-accent-foreground font-display font-bold text-sm transition-all hover:scale-105 active:scale-95">
                        <Download className="h-4 w-4" />
                        ডাউনলোড করো
                      </button>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className={`flex items-center gap-3 p-4 rounded-xl ${statusConfig.not_found.bg}`}>
                  <Search className="h-6 w-6 text-muted-foreground" />
                  <span className="font-display font-semibold text-sm text-muted-foreground">
                    {statusConfig.not_found.label}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
