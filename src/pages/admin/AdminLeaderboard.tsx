import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Save, Trophy, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminLeaderboard() {
  const { toast } = useToast();
  const [deptData, setDeptData] = useState<any[]>([]);
  const [hallData, setHallData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: depts } = await supabase.from("departments").select("*").order("name");
    const { data: hl } = await supabase.from("halls").select("*").order("name");
    
    // For now, we use a static total of 60 if not in DB
    if (depts) setDeptData(depts.map(d => ({ ...d, total: 60 })));
    if (hl) setHallData(hl.map(h => ({ ...h, total: 200 })));
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      // Update capacities in DB
      for (const d of deptData) {
        await supabase.from("departments").update({ capacity: d.total }).eq("id", d.id);
      }
      for (const h of hallData) {
        await supabase.from("halls").update({ capacity: h.total }).eq("id", h.id);
      }
      
      toast({
        title: "লিডারবোর্ড কন্ট্রোল আপডেট সম্পন্ন",
        description: "নতুন লিমিটগুলো সেভ করা হয়েছে!",
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "সেভ করতে ব্যর্থ",
      });
    }
  };

  const handleChange = (type: 'dept' | 'hall', index: number, field: 'registered' | 'total', value: string) => {
    if (type === 'dept') {
      const updated = [...deptData];
      updated[index][field] = Number(value) || 0;
      setDeptData(updated);
    } else {
      const updated = [...hallData];
      updated[index][field] = Number(value) || 0;
      setHallData(updated);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            লিডারবোর্ড কন্ট্রোল
          </h1>
          <p className="text-muted-foreground mt-1">ডিপার্টমেন্ট এবং হলের রেজিস্ট্রেশন লিমিট পরিবর্তন করুন</p>
        </div>
        <button
          onClick={handleSave}
          className="bg-primary hover:bg-[#600000] text-primary-foreground font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
        >
          <Save className="h-5 w-5" />
          সেভ করুন
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Departments */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="bg-muted px-6 py-4 border-b border-border">
            <h2 className="font-display font-semibold text-lg text-foreground">ডিপার্টমেন্ট লিমিট</h2>
          </div>
          <div className="p-6 space-y-4">
            {deptData.map((d, i) => (
              <div key={d.id} className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between p-3 rounded-xl border border-border bg-surface">
                <span className="font-semibold text-sm w-full sm:w-1/2">{d.name}</span>
                <div className="flex gap-2 w-full sm:w-1/2">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Total Limit</label>
                    <input
                      type="number"
                      value={d.total}
                      onChange={(e) => handleChange('dept', i, 'total', e.target.value)}
                      className="w-full bg-card border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Halls */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="bg-muted px-6 py-4 border-b border-border">
            <h2 className="font-display font-semibold text-lg text-foreground">হল লিমিট</h2>
          </div>
          <div className="p-6 space-y-4">
            {hallData.map((h, i) => (
              <div key={h.id} className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between p-3 rounded-xl border border-border bg-surface">
                <span className="font-semibold text-sm w-full sm:w-1/2">{h.name}</span>
                <div className="flex gap-2 w-full sm:w-1/2">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Total Limit</label>
                    <input
                      type="number"
                      value={h.total}
                      onChange={(e) => handleChange('hall', i, 'total', e.target.value)}
                      className="w-full bg-card border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
