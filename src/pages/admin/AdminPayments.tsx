import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Search,
  Eye,
  Loader2,
  MessageCircle,
  Edit,
  Trash2,
  Smartphone,
  Radio,
  Copy,
  RefreshCw,
  Sparkles,
  Zap,
  Check,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { useRegistrations, type Registration } from "@/hooks/useRegistrations";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { parsePaymentSMS } from "@/lib/paymentParser";

export default function AdminPayments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: registrations = [], isLoading: isLoadingReg } = useRegistrations();

  const [activeTab, setActiveTab] = useState("registrations");
  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "rejected">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Registration | null>(null);
  const [editing, setEditing] = useState<Registration | null>(null);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  // bKash Transactions Query (Live Feed)
  const {
    data: bkashTransactions = [],
    isLoading: isLoadingTx,
    refetch: refetchTx,
    isRefetching: isRefetchingTx,
  } = useQuery({
    queryKey: ["bkash_transactions"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("bkash_transactions")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) return [];
        return data || [];
      } catch (err) {
        return [];
      }
    },
    refetchInterval: 10000,
  });

  // Simulator state
  const [simulatorSms, setSimulatorSms] = useState(
    "You have received Tk 500.00 from 01712345678. Ref 5201. TrxID 9B7D4K19X2 at 13/10/2026 17:30. Balance Tk 15,200.00. Fee Tk 0.00."
  );
  const [simulating, setSimulating] = useState(false);
  const [simulatorResult, setSimulatorResult] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    toast({ title: "ক্লিপবোর্ডে কপি করা হয়েছে!" });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSimulateSms = async () => {
    if (!simulatorSms.trim()) return;
    setSimulating(true);
    setSimulatorResult(null);

    try {
      // 1. Try Supabase RPC first
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "parse_and_insert_bkash_sms",
        { p_raw_sms: simulatorSms.trim() }
      );

      if (!rpcError && rpcData) {
        setSimulatorResult(rpcData);
        toast({ title: "এসএমএস সফলভাবে পার্স ও সেভ হয়েছে! 🎉" });
      } else {
        // Fallback: Client-side parser + direct table insert
        const parsed = parsePaymentSMS(simulatorSms);
        if (!parsed.trxId) {
          toast({
            title: "এসএমএস থেকে TrxID খুঁজে পাওয়া যায়নি",
            variant: "destructive",
          });
          setSimulating(false);
          return;
        }

        const { data: insertData, error: insertError } = await supabase
          .from("bkash_transactions")
          .upsert({
            trx_id: parsed.trxId,
            amount: parsed.amount || 500,
            sender_number: parsed.senderNumber,
            reference: parsed.reference,
            raw_sms: parsed.raw,
            status: "unclaimed",
          })
          .select()
          .single();

        if (insertError) {
          toast({ title: "সেভ ব্যর্থ", description: insertError.message, variant: "destructive" });
        } else {
          setSimulatorResult({
            success: true,
            trx_id: parsed.trxId,
            amount: parsed.amount,
            sender: parsed.senderNumber,
            status: insertData?.status || "unclaimed",
          });
          toast({ title: "এসএমএস টেস্ট ডাটাবেজে যুক্ত হয়েছে! ✅" });
        }
      }

      refetchTx();
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
    } catch (err: any) {
      toast({ title: "সিমুলেশন ত্রুটি", description: err.message, variant: "destructive" });
    } finally {
      setSimulating(false);
    }
  };

  const filtered = registrations.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (
      search &&
      !r.name.toLowerCase().includes(search.toLowerCase()) &&
      !r.roll.includes(search) &&
      !r.phone.includes(search) &&
      !r.tx_id.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const updateStatus = async (id: string, status: "verified" | "rejected") => {
    const { error } = await supabase.from("registrations").update({ status }).eq("id", id);

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
        tx_id: editing.tx_id.trim().toUpperCase(),
        sender_number: editing.sender_number,
        status: editing.status,
      })
      .eq("id", editing.id);

    if (error) {
      toast({ title: "সেভ ব্যর্থ হয়েছে", variant: "destructive" });
    } else {
      // Sync back to batch52_students master table
      try {
        await supabase
          .from("batch52_students")
          .update({
            name: editing.name.trim().toUpperCase(),
            department: editing.department,
            hall: editing.hall,
            roll_no: editing.roll.trim(),
            updated_at: new Date().toISOString(),
          } as any)
          .eq("roll_no", editing.roll.trim());
      } catch (bErr) {
        console.warn("Sync back to batch52_students failed:", bErr);
      }

      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      setEditing(null);
      toast({ title: "তথ্য আপডেট করা হয়েছে ✅" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই রেজিস্ট্রেশনটি মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা সম্ভব নয়।"))
      return;

    const { error } = await supabase.from("registrations").delete().eq("id", id);

    if (error) {
      toast({ title: "মুছে ফেলা ব্যর্থ হয়েছে", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      toast({ title: "রেজিস্ট্রেশন মুছে ফেলা হয়েছে 🗑️" });
    }
  };

  const pendingCount = registrations.filter((r) => r.status === "pending").length;
  const verifiedCount = registrations.filter((r) => r.status === "verified").length;
  const matchedTxCount = bkashTransactions.filter((t) => t.status === "matched").length;

  if (isLoadingReg) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const webhookEndpoint = `${import.meta.env.VITE_SUPABASE_URL || "https://enebjlvbaipggzswnzme.supabase.co"}/rest/v1/rpc/parse_and_insert_bkash_sms`;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZWJqbHZiYWlwZ2d6c3duem1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODc4NzEsImV4cCI6MjA4OTg2Mzg3MX0.JDWbZ0ce9CfoypVto-ndXRBTKBselqXj1SlQjpWYuk0";

  return (
    <div className="space-y-6">
      {/* Top Header & Stat Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black flex items-center gap-2">
            পেমেন্ট ম্যানেজমেন্ট ও অটোমেশন <Zap className="h-6 w-6 text-amber-500 fill-amber-500" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            বিকাশ মার্চেন্ট এসএমএস লাইভ ট্র্যাকিং এবং স্টুডেন্ট রেজিস্ট্রেশন ভেরিফিকেশন
          </p>
        </div>
      </div>

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground">মোট রেজিস্ট্রেশন</p>
          <p className="text-2xl font-black mt-1">{registrations.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-sm">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">পেন্ডিং পেমেন্ট</p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">ভেরিফাইড পেমেন্ট</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{verifiedCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 shadow-sm">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1">
            <Radio className="h-3 w-3 animate-pulse text-blue-500" /> বিকাশ রিসিভড এসএমএস
          </p>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {bkashTransactions.length}{" "}
            <span className="text-xs font-normal text-muted-foreground">({matchedTxCount} ম্যাচড)</span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted p-1 rounded-2xl h-auto flex flex-wrap sm:flex-nowrap">
          <TabsTrigger value="registrations" className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm">
            📋 রেজিস্ট্রেশন তালিকা ({registrations.length})
          </TabsTrigger>
          <TabsTrigger value="live_feed" className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5">
            <Radio className="h-3.5 w-3.5 text-rose-500" /> বিকাশ লাইভ এসএমএস ({bkashTransactions.length})
          </TabsTrigger>
          <TabsTrigger value="automation_guide" className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5">
            <Smartphone className="h-3.5 w-3.5 text-primary" /> অটোমেশন সেটআপ ও সিমুলেটর
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: REGISTRATIONS */}
        <TabsContent value="registrations" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                className="w-full rounded-xl border border-input bg-card pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="নাম, রোল বা TxID দিয়ে খোঁজো"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(["all", "pending", "verified", "rejected"] as const).map((f) => {
                const labels: Record<string, string> = {
                  all: "সব",
                  pending: "পেন্ডিং",
                  verified: "ভেরিফাইড",
                  rejected: "রিজেক্টেড",
                };
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      filter === f
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {labels[f]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
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
                      <td className="p-3 font-mono text-xs">{r.roll}</td>
                      <td className="p-3 hidden md:table-cell font-mono text-xs font-bold text-primary">{r.tx_id}</td>
                      <td className="p-3 hidden lg:table-cell">{r.payment_method === "bkash" ? "বিকাশ" : "নগদ"}</td>
                      <td className="p-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelected(r)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            title="বিস্তারিত"
                          >
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => setEditing(r)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            title="এডিট"
                          >
                            <Edit className="h-4 w-4 text-primary" />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                            title="ডিলিট"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </button>
                          {r.status === "pending" && (
                            <>
                              <button
                                onClick={() => updateStatus(r.id, "verified")}
                                className="p-2 rounded-lg hover:bg-secondary/10 transition-colors"
                                title="অ্যাপ্রুভ"
                              >
                                <CheckCircle className="h-4 w-4 text-secondary" />
                              </button>
                              <button
                                onClick={() => updateStatus(r.id, "rejected")}
                                className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                                title="রিজেক্ট"
                              >
                                <XCircle className="h-4 w-4 text-destructive" />
                              </button>
                            </>
                          )}
                          {r.status === "verified" && (
                            <button
                              onClick={() => {
                                const msg = encodeURIComponent(
                                  `অভিনন্দন ${r.name}! তোমার JU 52 Batch Day রেজিস্ট্রেশন সফল হয়েছে। ওয়েবসাইট থেকে তোমার ডিজিটাল আইডি কার্ডটি ডাউনলোড করে নাও।`
                                );
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
        </TabsContent>

        {/* TAB 2: LIVE BKASH SMS FEED */}
        <TabsContent value="live_feed" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                মার্চেন্ট সিমে আসা রিয়েল-টাইম এসএমএস
              </h3>
              <p className="text-xs text-muted-foreground">
                ফোন থেকে এসএমএস পৌঁছানো মাত্রই এখানে প্রদর্শিত হবে এবং স্বয়ংক্রিয়ভাবে স্টুডেন্টের সাথে মিলে যাবে।
              </p>
            </div>
            <button
              onClick={() => refetchTx()}
              disabled={isRefetchingTx}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-xs font-bold hover:bg-muted/80 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefetchingTx ? "animate-spin" : ""}`} />
              রিফ্রেশ
            </button>
          </div>

          <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left p-3 font-semibold">TrxID</th>
                    <th className="text-left p-3 font-semibold">টাকা</th>
                    <th className="text-left p-3 font-semibold">প্রেরক নম্বর</th>
                    <th className="text-left p-3 font-semibold hidden md:table-cell">রেফারেন্স</th>
                    <th className="text-left p-3 font-semibold">অটো-ম্যাচ স্ট্যাটাস</th>
                    <th className="text-left p-3 font-semibold hidden sm:table-cell">সময়</th>
                    <th className="text-right p-3 font-semibold">ভিউ</th>
                  </tr>
                </thead>
                <tbody>
                  {bkashTransactions.map((tx: any) => (
                    <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono font-bold text-primary">{tx.trx_id}</td>
                      <td className="p-3 font-bold">৳{tx.amount}</td>
                      <td className="p-3 font-mono text-xs">{tx.sender_number || "অজানা"}</td>
                      <td className="p-3 hidden md:table-cell text-xs">{tx.reference || "-"}</td>
                      <td className="p-3">
                        {tx.status === "matched" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle className="h-3 w-3" /> রোল: {tx.matched_roll || "ম্যাচড"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            ⏳ অপূর্ণ (Unclaimed)
                          </span>
                        )}
                      </td>
                      <td className="p-3 hidden sm:table-cell text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                          title="র এসএমএস দেখুন"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {bkashTransactions.length === 0 && (
              <div className="p-12 text-center text-muted-foreground text-sm">
                <Radio className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                এখনো কোনো বিকাশ এসএমএস পৌঁছায়নি। নিচের "অটোমেশন সেটআপ ও সিমুলেটর" ট্যাব থেকে টেস্ট এসএমএস পাঠিয়ে পরীক্ষা করুন।
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 3: AUTOMATION SETUP GUIDE & TEST SIMULATOR */}
        <TabsContent value="automation_guide" className="space-y-6">
          {/* Step by Step Android Setup Guide */}
          <div className="rounded-2xl bg-card border border-border p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                📱
              </div>
              <div>
                <h3 className="font-display font-bold text-lg">অ্যান্ড্রয়েড ফোন এসএমএস ফরওয়ার্ডার সেটআপ (২ মিনিটে)</h3>
                <p className="text-xs text-muted-foreground">
                  বিকাশ মার্চেন্ট সিমটি যেকোনো সাধারণ অ্যান্ড্রয়েড ফোনে রেখে এই ৩টি সহজ স্টেপ সম্পন্ন করুন।
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
                  ১
                </span>
                <h4 className="font-bold text-sm">অ্যাপ ডাউনলোড করুন</h4>
                <p className="text-xs text-muted-foreground">
                  Google Play Store থেকে <strong>"SMS Forwarder"</strong> (বা <strong>"MacroDroid"</strong>) অ্যাপটি ফ্রি ইন্সটল করুন।
                </p>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
                  ২
                </span>
                <h4 className="font-bold text-sm">ফিল্টার রুল যোগ করুন</h4>
                <p className="text-xs text-muted-foreground">
                  প্রেরক ফিল্টারে <strong>bKash</strong> অথবা <strong>16247</strong> লিখে দিন, যাতে কেবল বিকাশের মেসেজগুলোই ফরোয়ার্ড হয়।
                </p>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
                  ৩
                </span>
                <h4 className="font-bold text-sm">Webhook লিংক সেভ করুন</h4>
                <p className="text-xs text-muted-foreground">
                  টার্গেট মেথড হিসেবে <strong>POST Webhook</strong> নির্বাচন করে নিচের URL ও Headers পেস্ট করে দিন।
                </p>
              </div>
            </div>

            {/* Config Box */}
            <div className="p-4 rounded-xl bg-surface border border-border space-y-3 mt-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-muted-foreground">Webhook Target URL (POST):</label>
                  <button
                    onClick={() => copyToClipboard(webhookEndpoint, "url")}
                    className="text-xs text-primary font-bold flex items-center gap-1 hover:underline"
                  >
                    {copiedKey === "url" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    কপি করুন
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-card border font-mono text-xs break-all select-all">
                  {webhookEndpoint}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-muted-foreground">HTTP Header (apikey):</label>
                  <button
                    onClick={() => copyToClipboard(anonKey, "key")}
                    className="text-xs text-primary font-bold flex items-center gap-1 hover:underline"
                  >
                    {copiedKey === "key" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    কপি করুন
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-card border font-mono text-xs break-all select-all">
                  {anonKey}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">JSON Body Template:</label>
                <pre className="p-2.5 rounded-lg bg-card border font-mono text-xs overflow-x-auto text-emerald-600 dark:text-emerald-400">
{`{
  "p_raw_sms": "%SMS_BODY%",
  "p_sender": "%SMS_FROM%"
}`}
                </pre>
              </div>
            </div>
          </div>

          {/* Live SMS Simulator */}
          <div className="rounded-2xl bg-gradient-to-br from-card to-muted/50 border border-primary/20 p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-display font-bold text-lg">টেস্ট এসএমএস সিমুলেটর</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              ফোনে সিম ঢুকানোর আগেই নিচে যেকোনো বিকাশ মেসেজ পেস্ট করে পরীক্ষা করুন কীভাবে ট্রানজ্যাকশন আইডি পার্স হয়ে অটোমেটিক রেজিস্ট্রেশনের সাথে ম্যাচ করে।
            </p>

            <div className="space-y-2">
              <textarea
                className="w-full rounded-xl border border-input bg-card p-3 font-mono text-xs h-24 focus:ring-2 focus:ring-primary/30 outline-none"
                value={simulatorSms}
                onChange={(e) => setSimulatorSms(e.target.value)}
                placeholder="এখানে বিকাশের এসএমএস পেস্ট করুন..."
              />

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSimulatorSms(
                      "You have received Tk 500.00 from 01711223344. Ref 5202. TrxID 9B7D8899XX at 13/10/2026 17:45. Balance Tk 15,700.00. Fee Tk 0.00."
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-muted text-[11px] font-semibold hover:bg-muted/80"
                >
                  স্যাম্পল ১ (মার্চেন্ট পেমেন্ট)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSimulatorSms(
                      "Payment received Tk 1,000.00 from 01912345678. TrxID BLK992819 at 13/10/2026 18:00. Balance Tk 25,000.00."
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-muted text-[11px] font-semibold hover:bg-muted/80"
                >
                  স্যাম্পল ২ (কাউন্টার পেমেন্ট)
                </button>
              </div>
            </div>

            <button
              onClick={handleSimulateSms}
              disabled={simulating}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {simulating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-current" />}
              টেস্ট সিমুলেট ও সেভ করুন 🚀
            </button>

            {simulatorResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-card border border-emerald-500/40 text-xs space-y-1.5"
              >
                <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4" /> পার্স সফল হয়েছে!
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                  <div>TrxID: <span className="font-bold text-primary">{simulatorResult.trx_id}</span></div>
                  <div>টাকা: <span className="font-bold">৳{simulatorResult.amount}</span></div>
                  <div>প্রেরক: <span>{simulatorResult.sender || "N/A"}</span></div>
                  <div>স্ট্যাটাস: <span className="font-bold uppercase text-emerald-600">{simulatorResult.status}</span></div>
                </div>
                {simulatorResult.matched_roll && (
                  <p className="font-bold text-primary pt-1">
                    🎯 রোল {simulatorResult.matched_roll}-এর পেন্ডিং রেজিস্ট্রেশনের সাথে সাথে সাথে মিলে গেছে!
                  </p>
                )}
              </motion.div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Registration Details Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">রেজিস্ট্রেশন বিস্তারিত</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              {selected.photo_url && (
                <div className="rounded-lg overflow-hidden border border-border">
                  <img
                    src={selected.photo_url}
                    alt="পেমেন্ট ছবি"
                    className="w-full max-h-48 object-contain bg-muted"
                  />
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

      {/* Edit Registration Dialog */}
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
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">রোল</label>
                  <input
                    className="w-full rounded-lg border p-2 text-sm"
                    value={editing.roll}
                    onChange={(e) => setEditing({ ...editing, roll: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">ফোন</label>
                  <input
                    className="w-full rounded-lg border p-2 text-sm"
                    value={editing.phone}
                    onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">ডিপার্টমেন্ট</label>
                  <input
                    className="w-full rounded-lg border p-2 text-sm"
                    value={editing.department}
                    onChange={(e) => setEditing({ ...editing, department: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">হল</label>
                  <input
                    className="w-full rounded-lg border p-2 text-sm"
                    value={editing.hall}
                    onChange={(e) => setEditing({ ...editing, hall: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">TxID</label>
                  <input
                    className="w-full rounded-lg border p-2 text-sm uppercase font-mono"
                    value={editing.tx_id}
                    onChange={(e) => setEditing({ ...editing, tx_id: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">সেন্ডার নম্বর</label>
                  <input
                    className="w-full rounded-lg border p-2 text-sm"
                    value={editing.sender_number}
                    onChange={(e) => setEditing({ ...editing, sender_number: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">স্ট্যাটাস</label>
                  <select
                    className="w-full rounded-lg border p-2 text-sm bg-background"
                    value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value as any })}
                  >
                    <option value="pending">পেন্ডিং</option>
                    <option value="verified">ভেরিফাইড</option>
                    <option value="rejected">রিজেক্টেড</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
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

      {/* Raw SMS View Dialog */}
      <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">বিকাশ র এসএমএস বিস্তারিত</DialogTitle>
          </DialogHeader>
          {selectedTx && (
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-xl bg-muted font-mono text-xs whitespace-pre-wrap break-words border">
                {selectedTx.raw_sms || "কোনো র এসএমএস সংরক্ষণ করা হয়নি"}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>TrxID: <span className="font-bold text-primary">{selectedTx.trx_id}</span></div>
                <div>টাকা: <span className="font-bold">৳{selectedTx.amount}</span></div>
                <div>প্রেরক: <span>{selectedTx.sender_number || "N/A"}</span></div>
                <div>রেফারেন্স: <span>{selectedTx.reference || "N/A"}</span></div>
                <div>স্ট্যাটাস: <span className="font-bold uppercase text-emerald-600">{selectedTx.status}</span></div>
                <div>ম্যাচড রোল: <span className="font-bold">{selectedTx.matched_roll || "নেই"}</span></div>
              </div>
            </div>
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
  const labels: Record<string, string> = {
    pending: "পেন্ডিং",
    verified: "ভেরিফাইড",
    rejected: "রিজেক্টেড",
  };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${config[status]}`}>
      {labels[status]}
    </span>
  );
}
