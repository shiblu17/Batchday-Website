import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Search, Eye, Loader2, MessageCircle, Edit, Trash2 } from "lucide-react";
import { useRegistrations, type Registration } from "@/hooks/useRegistrations";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminPayments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: registrations = [], isLoading } = useRegistrations();
  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "rejected">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Registration | null>(null);
  const [editing, setEditing] = useState<Registration | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const filtered = registrations.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (search && 
        !r.name.toLowerCase().includes(search.toLowerCase()) && 
        !r.roll.includes(search) && 
        !r.phone.includes(search) &&
        !r.tx_id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const updateStatus = async (id: string, status: "verified" | "rejected") => {
    const { error } = await supabase
      .from("registrations")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({ title: "আপডেট ব্যর্থ হয়েছে", variant: "destructive" });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["registrations"] });
    setSelected(null);
    toast({
      title: status === "verified" ? "পেমেন্ট অ্যাপ্রুভ হয়েছে ✅" : "পেমেন্ট রিজেক্ট হয়েছে ❌",
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    const { error } = await supabase
      .from("registrations")
      .update({
        name: editing.name,
        roll: editing.roll,
        phone: editing.phone,
        department: editing.department,
        hall: editing.hall,
        tshirt_size: editing.tshirt_size,
        tx_id: editing.tx_id,
        sender_number: editing.sender_number,
        status: editing.status,
      })
      .eq("id", editing.id);

    if (error) {
      toast({ title: "সেভ ব্যর্থ হয়েছে", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      setEditing(null);
      toast({ title: "তথ্য আপডেট করা হয়েছে ✅" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই রেজিস্ট্রেশনটি মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা সম্ভব নয়।")) return;
    
    const { error } = await supabase
      .from("registrations")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "মুছে ফেলা ব্যর্থ হয়েছে", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      toast({ title: "রেজিস্ট্রেশন মুছে ফেলা হয়েছে 🗑️" });
    }
  };

  const pendingCount = registrations.filter((r) => r.status === "pending").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">পেমেন্ট ভেরিফিকেশন</h1>
          <p className="text-sm text-muted-foreground">{pendingCount}টি পেন্ডিং পেমেন্ট</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full rounded-xl border border-input bg-card pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="নাম, রোল বা TxID দিয়ে খোঁজো"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "pending", "verified", "rejected"] as const).map((f) => {
            const labels: Record<string, string> = { all: "সব", pending: "পেন্ডিং", verified: "ভেরিফাইড", rejected: "রিজেক্টেড" };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left p-3 font-semibold">নাম</th>
                <th className="text-left p-3 font-semibold">রোল</th>
                <th className="text-left p-3 font-semibold hidden md:table-cell">TxID</th>
                <th className="text-left p-3 font-semibold hidden lg:table-cell">মেথড</th>
                <th className="text-left p-3 font-semibold">স্ট্যাটাস</th>
                <th className="text-right p-3 font-semibold">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3">{r.roll}</td>
                  <td className="p-3 hidden md:table-cell font-mono text-xs">{r.tx_id}</td>
                  <td className="p-3 hidden lg:table-cell">{r.payment_method === "bkash" ? "বিকাশ" : "নগদ"}</td>
                  <td className="p-3"><StatusBadge status={r.status} /></td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSelected(r)} className="p-2 rounded-lg hover:bg-muted transition-colors" title="বিস্তারিত">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => setEditing(r)} className="p-2 rounded-lg hover:bg-muted transition-colors" title="এডিট">
                        <Edit className="h-4 w-4 text-primary" />
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors" title="ডিলিট">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                      {r.status === "pending" && (
                        <>
                          <button onClick={() => updateStatus(r.id, "verified")} className="p-2 rounded-lg hover:bg-secondary/10 transition-colors" title="অ্যাপ্রুভ">
                            <CheckCircle className="h-4 w-4 text-secondary" />
                          </button>
                          <button onClick={() => updateStatus(r.id, "rejected")} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors" title="রিজেক্ট">
                            <XCircle className="h-4 w-4 text-destructive" />
                          </button>
                        </>
                      )}
                      {r.status === "verified" && (
                        <button 
                          onClick={() => {
                            const msg = encodeURIComponent(`অভিনন্দন ${r.name}! তোমার JU 52 Batch Day রেজিস্ট্রেশন সফল হয়েছে। ওয়েবসাইট থেকে তোমার ডিজিটাল আইডি কার্ডটি ডাউনলোড করে নাও।`);
                            window.open(`https://wa.me/88${r.phone}?text=${msg}`, "_blank");
                          }}
                          className="p-2 rounded-lg hover:bg-[#25D366]/10 text-[#25D366] transition-colors" 
                          title="WhatsApp Message"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">কোনো রেজিস্ট্রেশন পাওয়া যায়নি</div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">রেজিস্ট্রেশন বিস্তারিত</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              {selected.photo_url && (
                <div className="rounded-lg overflow-hidden border border-border">
                  <img src={selected.photo_url} alt="পেমেন্ট স্ক্রিনশট" className="w-full max-h-48 object-contain bg-muted" />
                </div>
              )}
              {[
                ["নাম", selected.name],
                ["রোল", selected.roll],
                ["ফোন", selected.phone],
                ["ডিপার্টমেন্ট", selected.department],
                ["হল", selected.hall],
                ["টি-শার্ট", selected.tshirt_size],
                ["পেমেন্ট মেথড", selected.payment_method === "bkash" ? "বিকাশ" : "নগদ"],
                ["TxID", selected.tx_id],
                ["সেন্ডার নম্বর", selected.sender_number],
                ["তারিখ", new Date(selected.created_at).toLocaleDateString("bn-BD")],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-1.5 border-b border-border last:border-0">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-right max-w-[60%] truncate">{value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2">
                <span className="text-muted-foreground">স্ট্যাটাস</span>
                <StatusBadge status={selected.status} />
              </div>
              {selected.status === "pending" && (
                <div className="flex gap-2 pt-3">
                  <button
                    onClick={() => updateStatus(selected.id, "verified")}
                    className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-display font-bold text-sm transition-transform hover:scale-[1.02]"
                  >
                    ✅ অ্যাপ্রুভ
                  </button>
                  <button
                    onClick={() => updateStatus(selected.id, "rejected")}
                    className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-display font-bold text-sm transition-transform hover:scale-[1.02]"
                  >
                    ❌ রিজেক্ট
                  </button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">তথ্য এডিট করুন</DialogTitle>
          </DialogHeader>
          {editing && (
            <form onSubmit={handleEdit} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">নাম</label>
                  <input 
                    className="w-full rounded-lg border p-2 text-sm" 
                    value={editing.name} 
                    onChange={e => setEditing({...editing, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">রোল</label>
                  <input 
                    className="w-full rounded-lg border p-2 text-sm" 
                    value={editing.roll} 
                    onChange={e => setEditing({...editing, roll: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">ফোন</label>
                  <input 
                    className="w-full rounded-lg border p-2 text-sm" 
                    value={editing.phone} 
                    onChange={e => setEditing({...editing, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">ডিপার্টমেন্ট</label>
                  <input 
                    className="w-full rounded-lg border p-2 text-sm" 
                    value={editing.department} 
                    onChange={e => setEditing({...editing, department: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">হল</label>
                  <input 
                    className="w-full rounded-lg border p-2 text-sm" 
                    value={editing.hall} 
                    onChange={e => setEditing({...editing, hall: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">TxID</label>
                  <input 
                    className="w-full rounded-lg border p-2 text-sm" 
                    value={editing.tx_id} 
                    onChange={e => setEditing({...editing, tx_id: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">সেন্ডার নম্বর</label>
                  <input 
                    className="w-full rounded-lg border p-2 text-sm" 
                    value={editing.sender_number} 
                    onChange={e => setEditing({...editing, sender_number: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">স্ট্যাটাস</label>
                  <select 
                    className="w-full rounded-lg border p-2 text-sm"
                    value={editing.status}
                    onChange={e => setEditing({...editing, status: e.target.value})}
                  >
                    <option value="pending">পেনডিং</option>
                    <option value="verified">ভেরিফাইড</option>
                    <option value="rejected">রিজেক্টেড</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={(e) => {
                    handleEdit(e);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm"
                >
                  সেভ করুন
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-6 py-2.5 rounded-xl bg-muted font-display font-bold text-sm"
                >
                  বাতিল
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    pending: "bg-accent/10 text-accent",
    verified: "bg-secondary/10 text-secondary",
    rejected: "bg-destructive/10 text-destructive",
  };
  const labels: Record<string, string> = { pending: "পেন্ডিং", verified: "ভেরিফাইড", rejected: "রিজেক্টেড" };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${config[status]}`}>
      {labels[status]}
    </span>
  );
}
