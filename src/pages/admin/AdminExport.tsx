import { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileSpreadsheet, FileText, Loader2, Shirt, Utensils } from "lucide-react";
import { useRegistrations } from "@/hooks/useRegistrations";
import { useToast } from "@/hooks/use-toast";

export default function AdminExport() {
  const { toast } = useToast();
  const { data: registrations = [], isLoading } = useRegistrations();
  const [filter, setFilter] = useState<"all" | "verified" | "pending">("all");

  const filtered = filter === "all" ? registrations : registrations.filter((r) => r.status === filter);

  const exportCSV = () => {
    const headers = ["নাম", "রোল", "ফোন", "ডিপার্টমেন্ট", "হল", "টি-শার্ট", "পেমেন্ট মেথড", "TxID", "সেন্ডার নম্বর", "স্ট্যাটাস", "তারিখ"];
    const rows = filtered.map((r) => [
      r.name, r.roll, r.phone, r.department, r.hall, r.tshirt_size,
      r.payment_method, r.tx_id, r.sender_number, r.status, r.created_at,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ju52-registrations-${filter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV ডাউনলোড হচ্ছে 📥" });
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ju52-registrations-${filter}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "JSON ডাউনলোড হচ্ছে 📥" });
  };

  const exportTshirtReport = () => {
    const counts: Record<string, number> = {};
    filtered.forEach(r => counts[r.tshirt_size] = (counts[r.tshirt_size] || 0) + 1);
    const csv = "Size,Count\n" + Object.entries(counts).map(([size, count]) => `${size},${count}`).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ju52-tshirt-report-${filter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "টি-শার্ট রিপোর্ট ডাউনলোড হচ্ছে 📥" });
  };

  const exportFoodReport = () => {
    const deptCounts: Record<string, number> = {};
    const hallCounts: Record<string, number> = {};
    filtered.forEach(r => {
      deptCounts[r.department] = (deptCounts[r.department] || 0) + 1;
      hallCounts[r.hall] = (hallCounts[r.hall] || 0) + 1;
    });
    
    let csv = "Department,Count\n" + Object.entries(deptCounts).map(([k, v]) => `"${k}",${v}`).join("\n");
    csv += "\n\nHall,Count\n" + Object.entries(hallCounts).map(([k, v]) => `"${k}",${v}`).join("\n");
    
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ju52-food-report-${filter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "খাবার রিপোর্ট ডাউনলোড হচ্ছে 📥" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-1">ডেটা এক্সপোর্ট</h1>
      <p className="text-sm text-muted-foreground mb-6">রেজিস্ট্রেশন ডেটা ডাউনলোড করো</p>

      <div className="flex gap-2 mb-6">
        {(["all", "verified", "pending"] as const).map((f) => {
          const labels: Record<string, string> = { all: "সব", verified: "ভেরিফাইড", pending: "পেন্ডিং" };
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {labels[f]}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground mb-4">{filtered.length}টি রেকর্ড সিলেক্টেড</p>

      <div className="grid sm:grid-cols-2 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={exportCSV}
          className="flex items-center gap-4 p-6 rounded-2xl bg-card shadow-card hover:shadow-card-hover transition-shadow text-left"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/10">
            <FileSpreadsheet className="h-7 w-7 text-secondary" />
          </div>
          <div>
            <p className="font-display font-bold text-base">CSV / Excel</p>
            <p className="text-xs text-muted-foreground mt-0.5">স্প্রেডশীটে ওপেন করা যাবে</p>
          </div>
          <Download className="h-5 w-5 text-muted-foreground ml-auto" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={exportJSON}
          className="flex items-center gap-4 p-6 rounded-2xl bg-card shadow-card hover:shadow-card-hover transition-shadow text-left"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="font-display font-bold text-base">JSON</p>
            <p className="text-xs text-muted-foreground mt-0.5">ডেভেলপার ফ্রেন্ডলি ফরম্যাট</p>
          </div>
          <Download className="h-5 w-5 text-muted-foreground ml-auto" />
        </motion.button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={exportTshirtReport}
          className="flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 shadow-card hover:shadow-card-hover transition-shadow text-left border border-indigo-100 dark:border-indigo-900/50"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-500/10">
            <Shirt className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="font-display font-bold text-base text-indigo-950 dark:text-indigo-100">টি-শার্ট রিপোর্ট</p>
            <p className="text-xs text-indigo-700/70 dark:text-indigo-300/70 mt-0.5">সাইজ ভিত্তিক হিসাব</p>
          </div>
          <Download className="h-5 w-5 text-indigo-400 ml-auto" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={exportFoodReport}
          className="flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 shadow-card hover:shadow-card-hover transition-shadow text-left border border-orange-100 dark:border-orange-900/50"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-500/10">
            <Utensils className="h-7 w-7 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="font-display font-bold text-base text-orange-950 dark:text-orange-100">খাবার রিপোর্ট</p>
            <p className="text-xs text-orange-700/70 dark:text-orange-300/70 mt-0.5">ডিপার্টমেন্ট ও হল ভিত্তিক</p>
          </div>
          <Download className="h-5 w-5 text-orange-400 ml-auto" />
        </motion.button>
      </div>

      <div className="mt-6 rounded-xl bg-card shadow-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-display font-semibold text-sm">প্রিভিউ</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left p-2.5 font-semibold">নাম</th>
                <th className="text-left p-2.5 font-semibold">রোল</th>
                <th className="text-left p-2.5 font-semibold hidden sm:table-cell">ডিপার্টমেন্ট</th>
                <th className="text-left p-2.5 font-semibold">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="p-2.5">{r.name}</td>
                  <td className="p-2.5">{r.roll}</td>
                  <td className="p-2.5 hidden sm:table-cell truncate max-w-[150px]">{r.department}</td>
                  <td className="p-2.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      r.status === "verified" ? "bg-secondary/10 text-secondary" : r.status === "pending" ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"
                    }`}>{r.status}</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">কোনো রেকর্ড নেই</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
