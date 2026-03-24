import { useState, useCallback, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { motion } from "framer-motion";
import { Camera, CheckCircle, XCircle, ScanLine, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AdminScanner() {
  const { toast } = useToast();
  const [manualInput, setManualInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    found: boolean;
    name?: string;
    roll?: string;
    dept?: string;
    status?: string;
  } | null>(null);

  const lookupQR = useCallback(async (code: string) => {
    const roll = code.replace("JU52-", "").trim();
    setLoading(true);

    const { data: reg } = await supabase
      .from("registrations")
      .select("name, roll, department, status, attended")
      .eq("roll", roll)
      .maybeSingle();

    setLoading(false);

    if (reg && reg.status === "verified") {
      setResult({ found: true, name: reg.name, roll: reg.roll, dept: reg.department, status: reg.attended ? "already" : "success" });
      if (!reg.attended) {
        // Mark as attended
        await supabase.from("registrations").update({ attended: true }).eq("roll", roll);
      }
      toast({ title: `✅ ${reg.name} — এন্ট্রি কনফার্মড!` });
    } else if (reg) {
      setResult({ found: true, name: reg.name, roll: reg.roll, dept: reg.department, status: "not_verified" });
      toast({ title: "❌ পেমেন্ট ভেরিফাই হয়নি", variant: "destructive" });
    } else {
      setResult({ found: false });
      toast({ title: "❌ রেজিস্ট্রেশন পাওয়া যায়নি", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    
    // Slight delay to ensure DOM is ready
    const timer = setTimeout(() => {
      scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      const onScanSuccess = (decodedText: string) => {
        scanner?.pause();
        if (decodedText.startsWith("JU52-")) {
          lookupQR(decodedText);
        } else {
          toast({ title: "ভুল QR কোড", variant: "destructive" });
        }
        setTimeout(() => {
          scanner?.resume();
        }, 3500);
      };

      scanner.render(onScanSuccess, () => {});
    }, 500);

    return () => {
      clearTimeout(timer);
      scanner?.clear().catch(console.error);
    };
  }, [lookupQR, toast]);

  const handleManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      lookupQR(`JU52-${manualInput.trim()}`);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-bold mb-1">QR স্ক্যানার</h1>
      <p className="text-sm text-muted-foreground mb-6">ইভেন্টের দিন এন্ট্রি নিশ্চিত করো</p>

      <div className="rounded-2xl border-2 border-dashed border-border p-4 text-center mb-6 overflow-hidden bg-card">
        <div id="qr-reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-xl"></div>
        <p className="font-display font-semibold mt-4 mb-1">ক্যামেরা স্ক্যানার</p>
        <p className="text-xs text-muted-foreground">
          ক্যামেরা দিয়ে আইডি কার্ড স্ক্যান করো অথবা ম্যানুয়ালি রোল নম্বর দাও।
        </p>
      </div>

      <form onSubmit={handleManual} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full rounded-xl border border-input bg-card pl-10 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="রোল নম্বর দাও"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm transition-transform hover:scale-105 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "চেক"}
        </button>
      </form>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden shadow-card"
        >
          {result.found ? (
            <div className={`p-6 ${
              result.status === "success" ? "bg-secondary/10" :
              result.status === "already" ? "bg-accent/10" :
              "bg-destructive/10"
            }`}>
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full shrink-0 ${
                  result.status === "success" ? "bg-secondary/20" :
                  result.status === "already" ? "bg-accent/20" :
                  "bg-destructive/20"
                }`}>
                  {result.status === "success" ? (
                    <CheckCircle className="h-6 w-6 text-secondary" />
                  ) : result.status === "already" ? (
                    <CheckCircle className="h-6 w-6 text-accent" />
                  ) : (
                    <XCircle className="h-6 w-6 text-destructive" />
                  )}
                </div>
                <div>
                  <p className="font-display font-bold text-lg">{result.name}</p>
                  <p className="text-sm text-muted-foreground">Roll: {result.roll}</p>
                  <p className="text-sm text-muted-foreground">{result.dept}</p>
                  <p className={`mt-2 text-sm font-semibold ${
                    result.status === "success" ? "text-secondary" :
                    result.status === "already" ? "text-accent" :
                    "text-destructive"
                  }`}>
                    {result.status === "success" && "✅ এন্ট্রি অনুমোদিত"}
                    {result.status === "already" && "⚠️ ইতিমধ্যে উপস্থিত"}
                    {result.status === "not_verified" && "❌ পেমেন্ট ভেরিফাই হয়নি"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-destructive/10 text-center">
              <XCircle className="h-10 w-10 text-destructive mx-auto mb-2" />
              <p className="font-display font-bold text-destructive">রেজিস্ট্রেশন পাওয়া যায়নি</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
