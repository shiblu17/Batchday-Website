import { useState, useCallback, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CheckCircle, XCircle, ScanLine, Loader2, RefreshCw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AdminScanner() {
  const { toast } = useToast();
  const [manualInput, setManualInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerInstance, setScannerInstance] = useState<Html5Qrcode | null>(null);
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
      toast({ title: "ডেটাবেস এরর", variant: "destructive" });
      setLoading(false);
      return;
    }

    setLoading(false);

    if (reg && (reg.status === "verified" || reg.status === "approved")) {
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

  const startScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode("reader");
      setScannerInstance(html5QrCode);
      
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      
      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          if (decodedText.startsWith("JU52-")) {
            html5QrCode.pause();
            lookupQR(decodedText);
            // Resume after 3 seconds
            setTimeout(() => html5QrCode.resume(), 3000);
          }
        },
        () => {} // Silent error for non-matches
      );
      setIsScanning(true);
    } catch (err) {
      console.error("Scanner failed:", err);
      toast({ title: "ক্যামেরা চালু করা যায়নি", description: "পারমিশন চেক করুন", variant: "destructive" });
    }
  };

  const stopScanner = async () => {
    if (scannerInstance) {
      await scannerInstance.stop();
      await scannerInstance.clear();
      setScannerInstance(null);
      setIsScanning(false);
    }
  };

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, [lookupQR]);

  const handleManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      lookupQR(`JU52-${manualInput.trim()}`);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display text-3xl font-bold text-primary">QR স্ক্যানার</h1>
        <button 
          onClick={() => { stopScanner().then(() => startScanner()) }}
          className="p-3 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* bKash Style Custom Scanner UI */}
      <div className="relative aspect-square w-full rounded-[2rem] overflow-hidden bg-black shadow-2xl mb-8 border-4 border-white">
        <div id="reader" className="w-full h-full object-cover"></div>
        
        {/* Overlay with scanning square */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-64 h-64 border-2 border-white/50 rounded-2xl shadow-[0_0_0_100vmax_rgba(0,0,0,0.6)]">
            {/* Corners */}
            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl"></div>
            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl"></div>
            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl"></div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl"></div>
            
            {/* Animated Laser Line */}
            <motion.div 
              animate={{ top: ['10%', '90%', '10%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute left-4 right-4 h-1 bg-primary/80 shadow-[0_0_15px_rgba(128,0,0,0.8)] z-10"
            />
          </div>
        </div>

        {!isScanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
            <button 
              onClick={startScanner}
              className="bg-primary text-secondary px-8 py-3 rounded-xl font-bold flex items-center gap-2"
            >
              <Camera className="h-5 w-5" /> ক্যামেরা চালু করুন
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleManual} className="flex gap-2 mb-8">
        <div className="relative flex-1">
          <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            className="w-full rounded-2xl border-2 border-border bg-card pl-12 pr-4 py-4 text-sm font-semibold focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm"
            placeholder="রোল নম্বর দিয়ে চেক করুন"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-8 rounded-2xl bg-primary text-secondary font-display font-bold text-sm hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 shadow-lg shadow-primary/20"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "চেক"}
        </button>
      </form>

      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-4 bottom-8 md:relative md:inset-auto z-50"
          >
            <div className={`relative rounded-3xl p-6 shadow-2xl border-2 ${
              result.status === 'success' ? 'bg-green-50 border-green-200' : 
              result.status === 'already' ? 'bg-amber-50 border-amber-200' :
              'bg-red-50 border-red-200'
            }`}>
              <button 
                onClick={() => setResult(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-5">
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 ${
                  result.status === 'success' ? 'bg-green-100 text-green-600' : 
                  result.status === 'already' ? 'bg-amber-100 text-amber-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  {result.status === 'success' || result.status === 'already' ? <CheckCircle className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
                </div>
                <div>
                  <p className="font-display font-black text-xl text-slate-900">{result.name}</p>
                  <p className="text-sm font-bold text-slate-500">Roll: {result.roll} — {result.dept}</p>
                  <p className={`mt-2 font-bold inline-block px-3 py-1 rounded-lg text-sm ${
                    result.status === "success" ? "bg-green-600 text-white" :
                    result.status === "already" ? "bg-amber-500 text-white" :
                    "bg-red-600 text-white"
                  }`}>
                    {result.status === "success" && "এন্ট্রি অনুমোদিত ✅"}
                    {result.status === "already" && "ইতিমধ্যে উপস্থিত ⚠️"}
                    {result.status === "not_verified" && "পেমেন্ট পেন্ডিং ❌"}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
