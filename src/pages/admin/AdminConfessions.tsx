import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, Trash2, X, MessageCircleHeart, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminConfessions() {
  const [confessions, setConfessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50;

  useEffect(() => {
    fetchConfessions(0);
  }, []);

  const fetchConfessions = async (pageNumber: number) => {
    if (pageNumber === 0) setLoading(true);
    
    const from = pageNumber * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data } = await supabase
      .from("confessions")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);
      
    if (data) {
      if (pageNumber === 0) {
        setConfessions(data);
      } else {
        setConfessions(prev => [...prev, ...data]);
      }
      setHasMore(data.length === PAGE_SIZE);
      setPage(pageNumber);
    }
    setLoading(false);
  };

  const toggleApproval = async (id: string, currentStatus: boolean) => {
    const { error } = await (supabase
      .from("confessions") as any)
      .update({ is_approved: !currentStatus })
      .eq("id", id);

    if (error) {
      toast.error("আপডেট ফেইল হয়েছে!");
    } else {
      toast.success(currentStatus ? "হাইড করা হয়েছে" : "পাবলিক করা হয়েছে");
      setConfessions(confessions.map(c => c.id === id ? { ...c, is_approved: !currentStatus } : c));
    }
  };

  const deleteConfession = async (id: string) => {
    if (!window.confirm("সত্যিই ডিলিট করতে চান?")) return;
    const { error } = await supabase.from("confessions").delete().eq("id", id);
    if (!error) {
      toast.success("ডিলিট হয়েছে");
      setConfessions(confessions.filter(c => c.id !== id));
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <MessageCircleHeart className="w-8 h-8 text-rose-500" />
        <h1 className="font-display text-3xl font-bold">কনফেশন মডারেশন</h1>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground uppercase font-semibold text-xs border-b border-border">
              <tr>
                <th className="px-6 py-4">লেখক</th>
                <th className="px-6 py-4">কার জন্য (To)</th>
                <th className="px-6 py-4">গান (Song)</th>
                <th className="px-6 py-4">কনফেশন</th>
                <th className="px-6 py-4">তারিখ</th>
                <th className="px-6 py-4">স্ট্যাটাস</th>
                <th className="px-6 py-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {confessions.map((c) => (
                <tr key={c.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-rose-500 whitespace-nowrap">{c.author_nickname}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-600 font-medium">{c.to_name || "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {c.song_info ? (
                      <div className="flex items-center gap-2">
                        <img src={c.song_info.artwork} className="w-8 h-8 rounded shadow-sm" alt="" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold truncate max-w-[100px]">{c.song_info.name}</span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{c.song_info.artist}</span>
                        </div>
                      </div>
                    ) : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <p className="line-clamp-2 max-w-sm font-medium" title={c.content}>{c.content}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {c.is_approved ? (
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-500/20">Approved</span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 rounded-lg text-xs font-bold border border-amber-500/20">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button
                         onClick={() => toggleApproval(c.id, c.is_approved)}
                         className={`p-2 rounded-xl border ${c.is_approved ? 'bg-amber-100/50 border-amber-200 text-amber-700 hover:bg-amber-100' : 'bg-emerald-100/50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'} transition-all shadow-sm`}
                         title={c.is_approved ? "Unpublish" : "Approve & Publish"}
                       >
                         {c.is_approved ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                       </button>
                       <button
                         onClick={() => deleteConfession(c.id)}
                         className="p-2 rounded-xl bg-red-100/50 border border-red-200 text-red-700 hover:bg-red-100 transition-all shadow-sm"
                         title="Delete permanently"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {confessions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground text-base">
                    এখনো কোনো কনফেশন ডাটাবেজে জমা পড়েনি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {hasMore && confessions.length > 0 && (
          <div className="p-4 flex justify-center border-t border-border bg-muted/20">
            <button
              onClick={() => fetchConfessions(page + 1)}
              className="px-6 py-2 bg-white border border-border text-foreground font-semibold rounded-lg shadow-sm hover:bg-muted transition-all text-sm flex items-center gap-2"
            >
              আরো লোড করুন
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
