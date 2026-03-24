import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Score {
  nickname: string;
  score: number;
}

export default function GameLeaderboard({ gameName, ascending = false }: { gameName: string, ascending?: boolean }) {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      const fetchScores = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from("game_scores")
          .select("nickname, score")
          .eq("game_name", gameName)
          .order("score", { ascending })
          .limit(10);
          
        if (data && !error) {
          setScores(data);
        }
        setLoading(false);
      };
      fetchScores();
    }
  }, [open, gameName, ascending]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-100 text-amber-700 font-bold hover:bg-amber-200 transition-colors text-sm shadow-sm">
          <Trophy className="w-4 h-4" />
          লিডারবোর্ড
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card rounded-2xl w-[90vw]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-bold flex items-center justify-center gap-2 text-primary">
            <Trophy className="w-6 h-6 text-amber-500" />
            টপ ১০ স্কোয়ারার
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-2 min-h-[250px] relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : scores.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-medium flex-col gap-2">
              <Trophy className="w-12 h-12 text-muted/30" />
              এখনো কেউ খেলেনি! প্রথম হওয়ার সুযোগ তোমারই।
            </div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1 pb-4">
              {scores.map((s, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-lg border shadow-sm ${i === 0 ? 'bg-amber-50 border-amber-200' : i === 1 ? 'bg-slate-50 border-slate-200' : i === 2 ? 'bg-orange-50 border-orange-200' : 'bg-background border-border'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-6 text-center font-bold ${i === 0 ? 'text-amber-500 text-lg' : i === 1 ? 'text-slate-400 text-lg' : i === 2 ? 'text-orange-400 text-lg' : 'text-muted-foreground'}`}>
                      {i + 1}.
                    </span>
                    <span className="font-semibold text-[15px] clamp-1">{s.nickname}</span>
                  </div>
                  <span className="font-display font-black text-primary text-xl">{s.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
