import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquarePlus, MessageCircleHeart, ArrowLeft, Send, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Confession {
  id: string;
  content: string;
  author_nickname: string;
  created_at: string;
  reactions?: {
    love?: number;
    haha?: number;
  };
}

export default function Confessions() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  
  // form state
  const [content, setContent] = useState("");
  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchConfessions();
    
    // Subscribe to new approved confessions
    const channel = supabase
      .channel("public:confessions")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "confessions", filter: "is_approved=eq.true" }, (payload) => {
         setConfessions(prev => [payload.new as Confession, ...prev]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "confessions", filter: "is_approved=eq.true" }, (payload) => {
         fetchConfessions(); // Reload to capture newly approved ones easily without manual sorting logic
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchConfessions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("confessions")
      .select("*")
      .eq("is_approved", true)
      .order("created_at", { ascending: false });
      
    if (data && !error) setConfessions(data as unknown as Confession[]);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setSubmitting(true);
    const { error } = await supabase.from("confessions").insert({
      content: content.trim(),
      author_nickname: nickname.trim() || "অজ্ঞাত",
    });
    
    setSubmitting(false);
    if (error) {
      toast.error(`পাঠাতে সমস্যা হয়েছে! Error: ${error.message}`);
      console.error(error);
    } else {
      toast.success("সফলভাবে পাঠানো হয়েছে! অ্যাডমিন অ্যাপ্রুভ করলে এখানে দেখা যাবে।");
      setOpen(false);
      setContent("");
      setNickname("");
    }
  };

  const handleReaction = async (id: string, type: 'love' | 'haha') => {
    // Optimistic UI update
    setConfessions(prev => prev.map(c => {
      if (c.id === id) {
        const reactions = (c as any).reactions || {};
        return { ...c, reactions: { ...reactions, [type]: (reactions[type] || 0) + 1 } };
      }
      return c;
    }));

    // Actual update - in a real app, we would use a database function (RPC) to increment safely
    // Since I don't have the RPC yet, I'll fetch and update (race-condition prone but works for demo)
    const { data: current } = await (supabase.from("confessions") as any).select("reactions").eq("id", id).single();
    const reactions = current?.reactions || {};
    reactions[type] = (reactions[type] || 0) + 1;
    
    await (supabase.from("confessions") as any).update({ reactions }).eq("id", id);
  };

  return (
    <div className="container max-w-6xl py-8 min-h-[80vh]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 px-2">
        <div>
          <h1 className="font-display text-4xl mt-4 md:mt-0 font-extrabold flex items-center gap-3">
            <MessageCircleHeart className="w-10 h-10 text-rose-500" />
            কনফেশন <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-fuchsia-600">ওয়াল</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-md text-sm md:text-base">
            মনের না বলা কথা, ব্যাচের মজার স্মৃতি বা সিক্রেট শেয়ার করো সবার সাথে! (তোমার পরিচয় সম্পূর্ণ গোপন থাকবে)
          </p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-rose-600 text-white font-bold hover:bg-rose-700 hover:scale-105 active:scale-95 transition-all shadow-md shrink-0">
              <MessageSquarePlus className="w-5 h-5" />
              নতুন কনফেশন
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card rounded-3xl p-6 w-[95vw]">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl font-bold flex items-center justify-center gap-2 text-rose-600 mb-4">
                <Sparkles className="w-6 h-6" />
                মনের কথা শেয়ার করো
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="তোমার কনফেশন বা মজার স্মৃতি এখানে লেখো..."
                  className="w-full h-32 p-4 rounded-xl border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/50 text-foreground"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="নিকনেম (ঐচ্ছিক: ফাঁকা রাখলে 'অজ্ঞাত' দেখাবে)"
                  className="w-full p-4 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-rose-500/50 text-foreground"
                  maxLength={30}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                *পোস্টটি অ্যাডমিন প্যানেল থেকে ভেরিফাই হওয়ার পর পাবলিক ওয়ালে দেখা যাবে।
              </p>
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {submitting ? "পাঠানো হচ্ছে..." : "পোস্ট করে দাও"}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
        </div>
      ) : confessions.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-3xl border border-border mt-8 mx-2">
          <MessageCircleHeart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-display text-2xl font-bold text-foreground mb-2">এখনো কোনো কনফেশন আসেনি!</h3>
          <p className="text-muted-foreground text-sm">তুমিই প্রথম মনের কথা শেয়ার করো।</p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 px-2">
          <AnimatePresence>
            {confessions.map((confession) => (
              <motion.div
                key={confession.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="break-inside-avoid bg-card p-6 rounded-3xl border border-border shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group mb-6"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-rose-500 to-fuchsia-600 opacity-80" />
                <p className="text-foreground text-[17px] leading-relaxed mb-6 whitespace-pre-wrap font-medium">
                  "{confession.content}"
                </p>
                <div className="flex flex-col gap-4 border-t border-border pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-rose-500 flex items-center gap-1.5 bg-rose-500/10 px-2 py-1 rounded-md">
                      <Sparkles className="w-3 h-3" />
                      {confession.author_nickname}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {new Date(confession.created_at).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleReaction(confession.id, 'love')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-sm transition-all active:scale-90"
                    >
                      ❤️ <span className="opacity-70">{(confession as any).reactions?.love || 0}</span>
                    </button>
                    <button 
                       onClick={() => handleReaction(confession.id, 'haha')}
                       className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-50 hover:bg-yellow-100 text-yellow-600 font-bold text-sm transition-all active:scale-90"
                    >
                      😂 <span className="opacity-70">{(confession as any).reactions?.haha || 0}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
