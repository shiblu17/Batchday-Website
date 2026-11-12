import { useState, useCallback, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CheckCircle, XCircle, ScanLine, Loader2, RefreshCw, X, Shirt, Utensils } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ScanResult {
  found: boolean;
  name?: string;
  roll?: string;
  dept?: string;
  hall?: string;
  tshirtSize?: string;
  tshirtClaimed?: boolean;
  foodClaimed?: boolean;
  status?: string;
}

export default function AdminScanner() {
  const { toast } = useToast();
  const [manualInput, setManualInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingToken, setUpdatingToken] = useState<"tshirt" | "food" | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);

  const lookupQR = useCallback(async (code: string) => {
    const roll = code.replace("JU52-", "").trim();
    setLoading(true);

    const { data: reg, error } = await supabase
      .from("registrations")
      .select("name, roll, department, hall, tshirt_size, tshirt_claimed, food_claimed, status, attended")
      .eq("roll", roll)
      .maybeSingle();

    if (error) {
      toast({ title: "ডেটাবেস এরর", variant: "destructive" });
      setLoading(false);
      return;
    }

    setLoading(false);

    if (reg && (reg.status === "verified" || reg.status === "approved")) {
      const scanStatus = reg.attended ? "already" : "success";
      setResult({
        found: true,
        name: reg.name,
        roll: reg.roll,
        dept: reg.department,
        hall: reg.hall,
        tshirtSize: reg.tshirt_size,
        tshirtClaimed: Boolean(reg.tshirt_claimed),
        foodClaimed: Boolean(reg.food_claimed),
        status: scanStatus,
      });
      if (!reg.attended) {
        await supabase.from("registrations").update({ attended: true }).eq("roll", roll);
        setScanCount((c) => c + 1);
      }
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(reg.attended ? [60, 40, 60] : 120);
      }
      toast({ title: `✅ ${reg.name} — এন্ট্রি কনফার্মড!` });
    } else if (reg) {
      setResult({
        found: true,
        name: reg.name,
        roll: reg.roll,
        dept: reg.department,
        hall: reg.hall,
        tshirtSize: reg.tshirt_size,
        tshirtClaimed: Boolean(reg.tshirt_claimed),
        foodClaimed: Boolean(reg.food_claimed),
        status: "not_verified",
      });
      toast({ title: "❌ পেমেন্ট ভেরিফাই হয়নি", variant: "destructive" });
    } else {
      setResult({ found: false });
      toast({ title: "❌ রেজিস্ট্রেশন পাওয়া যায়নি", variant: "destructive" });
    }
  }, [toast]);

  const toggleClaimToken = async (field: "tshirt" | "food") => {
    if (!result?.roll || (result.status !== "success" && result.status !== "already")) return;
    const isTshirt = field === "tshirt";
    const nextValue = !(isTshirt ? result.tshirtClaimed : result.foodClaimed);

    setUpdatingToken(field);
    const updatePayload = isTshirt ? { tshirt_claimed: nextValue } : { food_claimed: nextValue };
    const { error } = await supabase
      .from("registrations")
      .update(updatePayload)
      .eq("roll", result.roll);
    setUpdatingToken(null);

    if (error) {
      toast({ title: "টোকেন আপডেট ব্যর্থ হয়েছে", variant: "destructive" });
      return;
    }

    setResult((prev) =>
      prev
        ? {
            ...prev,
            tshirtClaimed: isTshirt ? nextValue : prev.tshirtClaimed,
            foodClaimed: !isTshirt ? nextValue : prev.foodClaimed,
          }
        : null
    );
    toast({
      title: isTshirt
        ? nextValue
          ? `টি-শার্ট (${result.tshirtSize}) দেওয়া হয়েছে ✅`
          : "টি-শার্ট টোকেন আনমার্ক করা হয়েছে"
        : nextValue
          ? "খাবার টোকেন দেওয়া হয়েছে ✅"
          : "খাবার টোকেন আনমার্ক করা হয়েছে",
    });
  };

  const stopScanner = useCallback(async () => {
    const instance = scannerRef.current;
    if (instance) {
      scannerRef.current = null;
      try {
        await instance.stop();
        await instance.clear();
      } catch {
        // Ignore stop errors if camera was not active
      }
      setIsScanning(false);
    }
  }, []);

  const startScanner = useCallback(async () => {
    try {
      await stopScanner();
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          if (decodedText.startsWith("JU52-")) {
            html5QrCode.pause();
            lookupQR(decodedText);
            setTimeout(() => {
              try {
                html5QrCode.resume();
              } catch {
                // Ignore if unmounted
              }
            }, 3000);
          }
        },
        () => {}
      );
      setIsScanning(true);
    } catch (err) {
      console.error("Scanner failed:", err);
      toast({ title: "ক্যামেরা চালু করা যায়নি", description: "পারমিশন চেক করুন", variant: "destructive" });
    }
  }, [lookupQR, stopScanner, toast]);

  useEffect(() => {
    startScanner();
    return () => {
      void stopScanner();
    };
  }, [startScanner, stopScanner]);

  const handleManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      lookupQR(`JU52-${manualInput.trim()}`);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">QR স্ক্যানার</h1>
          {scanCount > 0 && (
            <p className="text-xs font-semibold text-emerald-700 mt-1">
              এই সেশনে এন্ট্রি সম্পন্ন: {scanCount} জন
            </p>
          )}
        </div>
        <button 
          onClick={() => { void startScanner(); }}
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
                  <p className="font-display font-black text-xl text-slate-900">{result.name || "অজানা"}</p>
                  {result.found ? (
                    <>
                      <p className="text-sm font-bold text-slate-600">Roll: {result.roll} — {result.dept}</p>
                      {(result.hall || result.tshirtSize) && (
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">
                          {result.hall ? `হল: ${result.hall}` : ""}{result.hall && result.tshirtSize ? " • " : ""}{result.tshirtSize ? `টি-শার্ট: ${result.tshirtSize}` : ""}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm font-semibold text-red-700">এই রোল নম্বরে কোনো রেজিস্ট্রেশন নেই</p>
                  )}
                  <p className={`mt-2 font-bold inline-block px-3 py-1 rounded-lg text-sm ${
                    result.status === "success" ? "bg-green-600 text-white" :
                    result.status === "already" ? "bg-amber-500 text-white" :
                    "bg-red-600 text-white"
                  }`}>
                    {result.status === "success" && "এন্ট্রি অনুমোদিত ✅"}
                    {result.status === "already" && "ইতিমধ্যে উপস্থিত ⚠️"}
                    {result.status === "not_verified" && "পেমেন্ট পেন্ডিং ❌"}
                    {!result.found && "তথ্য পাওয়া যায়নি ❌"}
                  </p>
                </div>
              </div>

              {(result.status === "success" || result.status === "already") && (
                <div className="mt-4 pt-4 border-t border-black/10 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={updatingToken === "tshirt"}
                    onClick={() => void toggleClaimToken("tshirt")}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-60 ${
                      result.tshirtClaimed
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-white text-slate-800 border border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <Shirt className="h-4 w-4" />
                    <span>{result.tshirtClaimed ? `টি-শার্ট দেওয়া ✓ (${result.tshirtSize})` : `টি-শার্ট দিন (${result.tshirtSize})`}</span>
                  </button>
                  <button
                    type="button"
                    disabled={updatingToken === "food"}
                    onClick={() => void toggleClaimToken("food")}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-60 ${
                      result.foodClaimed
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-white text-slate-800 border border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <Utensils className="h-4 w-4" />
                    <span>{result.foodClaimed ? "খাবার টোকেন দেওয়া ✓" : "খাবার টোকেন দিন"}</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
