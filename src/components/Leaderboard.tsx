import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import LeaderboardCard from './LeaderboardCard';

interface LeaderboardItem {
  id: string;
  name: string;
  registered: number;
  total: number;
}

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<'departments' | 'halls'>('departments');
  const [departments, setDepartments] = useState<LeaderboardItem[]>([]);
  const [halls, setHalls] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('leaderboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data: regs } = await supabase.from("registrations").select("department, hall, status");
      const { data: depts } = await supabase.from("departments").select("*");
      const { data: hl } = await supabase.from("halls").select("*");

      if (!depts || !hl) return;

      const deptCounts: Record<string, number> = {};
      const hallCounts: Record<string, number> = {};

      regs?.forEach(r => {
        if (r.status === 'verified' || r.status === 'pending') {
          deptCounts[r.department] = (deptCounts[r.department] || 0) + 1;
          hallCounts[r.hall] = (hallCounts[r.hall] || 0) + 1;
        }
      });

      setDepartments(depts.map(d => ({
        id: d.id,
        name: d.name,
        registered: deptCounts[d.name] || 0,
        total: d.capacity || 60
      })).sort((a,b) => b.registered - a.registered));

      setHalls(hl.map(h => ({
        id: h.id,
        name: h.name,
        registered: hallCounts[h.name] || 0,
        total: h.capacity || 200
      })).sort((a,b) => b.registered - a.registered));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-center p-1.5 bg-gray-100 rounded-2xl w-full max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('departments')}
          className={`flex-1 py-2.5 px-6 rounded-xl font-display font-bold text-sm transition-all ${
            activeTab === 'departments' 
              ? 'bg-white text-primary shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          ডিপার্টমেন্ট
        </button>
        <button
          onClick={() => setActiveTab('halls')}
          className={`flex-1 py-2.5 px-6 rounded-xl font-display font-bold text-sm transition-all ${
            activeTab === 'halls' 
              ? 'bg-white text-primary shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          হল
        </button>
      </div>

      <div className="min-h-[400px]">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse flex flex-col gap-3 p-5">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-xl bg-gray-200" />
                  <div className="h-6 w-48 bg-gray-200 rounded-lg" />
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex-1 h-3 bg-gray-200 rounded-full" />
                  <div className="w-10 h-6 bg-gray-200 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              { (activeTab === 'departments' ? departments : halls).length === 0 ? (
                <div className="text-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 mt-4">
                  <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-2xl">
                    📊
                  </div>
                  <h3 className="font-display text-xl font-bold text-gray-400">এখনো কোনো ডেটা নেই!</h3>
                  <p className="text-gray-400 text-sm mt-2">রেজিস্ট্রেশন শুরু হলেই এখানে বিস্তারিত রেশিও দেখা যাবে।</p>
                </div>
              ) : (
                (activeTab === 'departments' ? departments : halls).map((item, index) => (
                  <LeaderboardCard
                    key={item.id}
                    rank={index + 1}
                    name={item.name}
                    registered={item.registered}
                    total={item.total}
                  />
                ))
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
