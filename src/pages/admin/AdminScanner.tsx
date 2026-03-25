import { useState, useCallback, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { motion } from "framer-motion";
import { Camera, CheckCircle, XCircle, ScanLine, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AdminScanner() {
  const { toast } = useToast();
  const [manualInput, setManualInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scannerKey, setScannerKey] = useState(0); 
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

    const { data: reg, error } = await supabase
      .from("registrations")
      .select("name, roll, department, status, attended")
      .eq("roll", roll)
      .maybeSingle();

    if (error) {
      toast({ title: "ড্যাটাবেস এরর", variant: "destructive" });
      setLoading(false);
      return;
    }

    setLoading(false);

    if (reg && reg.status === "verified") {
      setResult({ found: true, name: reg.name, roll: reg.roll, dept: reg.department, status: reg.attended ? "already" : "success" });
      if (!reg.attended) {
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
    
    const initScanner = () => {
      try {
        const qrReader = document.getElementById("qr-reader");
        if (!qrReader) return;

        scanner = new Html5QrcodeScanner(
          "qr-reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true
          },
          false
        );

        const onScanSuccess = (decodedText: string) => {
          if (decodedText.startsWith("JU52-")) {
            lookupQR(decodedText);
          } else {
            toast({ title: "ভুল QR কোড", variant: "destructive" });
          }
        };

        scanner.render(onScanSuccess, () => {});
      } catch (err) {
        console.error("Scanner Init Error:", err);
      }
    };

    const timer = setTimeout(initScanner, 500);

    return () => {
      clearTimeout(timer);
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [lookupQR, toast, scannerKey]);

  const handleManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      lookupQR(`JU52-${manualInput.trim()}`);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">QR স্ক্যানার</h1>
          <p className="text-sm text-muted-foreground">ইভেন্টের দিন এন্ট্রি নিশ্চিত করো</p>
        </div>
        <button 
          onClick={() => setScannerKey(k => k + 1)}
          className="p-2 rounded-lg bg-card border border-border hover:bg-muted transition-colors"
          title="রিলোড ক্যামেরা"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-border p-4 text-center mb-6 overflow-hidden bg-card relative">
        <div id="qr-reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-xl border-none"></div>
        <div className="mt-4">
          <p className="font-display font-semibold mb-1">ক্যামেরা স্ক্যানার</p>
          <p className="text-xs text-muted-foreground">
            ক্যামেরা অন না হলে বাটন দিয়ে রিলোড দিন।
          </p>
        </div>
      </div>

      <form onSubmit={handleManual} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full rounded-xl border border-input bg-card pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
            placeholder="রোল নম্বর দাও"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "চেক"}
        </button>
      </form>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl overflow-hidden shadow-card border border-border">
          {result.found ? (
            <div className={`p-5 ${result.status === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${result.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {result.status?.includes('success') ? <CheckCircle /> : <XCircle />}
                </div>
                <div>
                  <p className="font-bold text-lg">{result.name}</p>
                  <p className="text-sm opacity-80">Roll: {result.roll} | {result.dept}</p>
                  <p className="font-semibold mt-1">
                    {result.status === "success" && "✅ এন্ট্রি অনুমোদিত"}
                    {result.status === "already" && "⚠️ ইতিমধ্যে উপস্থিত"}
                    {result.status === "not_verified" && "❌ পেমেন্ট পেন্ডিং"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-red-50 text-center text-red-600 font-bold">
              রেজিস্ট্রেশন পাওয়া যায়নি
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
