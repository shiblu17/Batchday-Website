import { motion } from "framer-motion";
import { Share2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LeaderboardCard from "@/components/LeaderboardCard";
import { getLeaderboardData } from "@/lib/constants";
import { useState, useEffect } from "react";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function LeaderboardPage() {
  const [deptData, setDeptData] = useState<any[]>([]);
  const [hallData, setHallData] = useState<any[]>([]);

  useEffect(() => {
    setDeptData(getLeaderboardData('dept'));
    setHallData(getLeaderboardData('hall'));
  }, []);

  const handleShare = (name: string, pct: number) => {
    if (navigator.share) {
      navigator.share({
        title: "JU-52 লিডারবোর্ড",
        text: `${name} — ${pct}% রেজিস্ট্রেশন শেষ! তোমরা কোথায়? JU-52 ব্যাচ ডে-তে রেজিস্ট্রেশন করো!`,
        url: window.location.href,
      });
    }
  };

  return (
    <div className="container py-6 md:py-8 pb-24 md:pb-8 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold mb-1">🏆 লিডারবোর্ড</h1>
        <p className="text-muted-foreground text-sm mb-6">কোন হল বা ডিপার্টমেন্ট এগিয়ে আছে দেখো!</p>

        <Tabs defaultValue="department">
          <TabsList className="w-full mb-6 bg-surface">
            <TabsTrigger value="department" className="flex-1 font-display font-semibold">ডিপার্টমেন্ট</TabsTrigger>
            <TabsTrigger value="hall" className="flex-1 font-display font-semibold">হল</TabsTrigger>
          </TabsList>

          <TabsContent value="department">
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2.5">
              {deptData.map((d, i) => (
                <motion.div key={d.name} variants={fadeUp} className="relative group">
                  <LeaderboardCard rank={i + 1} {...d} />
                  <button
                    onClick={() => handleShare(d.name, Math.round((d.registered / d.total) * 100))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-muted"
                    aria-label="Share"
                  >
                    <Share2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          <TabsContent value="hall">
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2.5">
              {hallData.map((h, i) => (
                <motion.div key={h.name} variants={fadeUp} className="relative group">
                  <LeaderboardCard rank={i + 1} {...h} />
                  <button
                    onClick={() => handleShare(h.name, Math.round((h.registered / h.total) * 100))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-muted"
                    aria-label="Share"
                  >
                    <Share2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
