import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, CheckCircle, XCircle, Download, Loader2, CreditCard, ShieldCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { jsPDF } from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Sponsors from "@/components/Sponsors";

type Status = "idle" | "pending" | "verified" | "rejected" | "not_found" | "loading";

const statusConfig: Record<string, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  pending: { icon: Clock, label: "পেমেন্ট পেন্ডিং", color: "text-amber-500", bg: "bg-amber-50" },
  verified: { icon: CheckCircle, label: "পেমেন্ট ভেরিফাইড ✅", color: "text-emerald-500", bg: "bg-emerald-50" },
  rejected: { icon: XCircle, label: "পেমেন্ট রিজেক্টেড", color: "text-red-500", bg: "bg-red-50" },
  not_found: { icon: Search, label: "এই রোলে কোনো তথ্য পাওয়া যায়নি", color: "text-slate-400", bg: "bg-slate-50" },
};

interface UserData {
  name: string;
  department: string;
  hall: string;
  status: string;
  tshirt_size: string;
}

export default function StatusPage() {
  const { toast } = useToast();
  const [roll, setRoll] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRoll = roll.trim();
    const cleanPhone = phone.trim();

    if (!cleanRoll) {
      toast({ title: "রোল নম্বর লিখুন", variant: "destructive" });
      return;
    }
    if (!cleanPhone) {
      toast({ title: "নিরাপত্তার স্বার্থে ফোন নম্বর দিন", variant: "destructive" });
      return;
    }

    setStatus("loading");

    try {
      let query = supabase
        .from("registrations")
        .select("id, name, department, hall, status, tshirt_size")
        .eq("roll", cleanRoll);

      if (cleanPhone.length === 11) {
        query = query.eq("phone", cleanPhone);
      } else if (cleanPhone.length >= 4) {
        query = query.ilike("phone", `%${cleanPhone}`);
      } else {
        toast({
          title: "ফোন নম্বর লিখুন",
          description: "নিরাপত্তার স্বার্থে রেজিস্ট্রেশনের সময় দেওয়া সঠিক ফোন নম্বর লিখুন (কমপক্ষে শেষ ৪ ডিজিট)।",
          variant: "destructive",
        });
        setStatus("idle");
        return;
      }

      const { data, error } = await query.maybeSingle();

      if (error || !data) {
        setUserData(null);
        setStatus("not_found");
        setPreviewUrl('');
        toast({
          title: "তথ্য পাওয়া যায়নি",
          description: "দেওয়া রোল ও ফোন নম্বরের সাথে কোনো রেজিস্ট্রেশন মেলেনি। অনুগ্রহ করে সঠিক তথ্য দিন।",
          variant: "destructive",
        });
        return;
      }

      setUserData(data);
      setStatus(data.status as Status);
    } catch (err: any) {
      console.error("Status search error:", err);
      setStatus("not_found");
    }
  };

  useEffect(() => {
    if (status === "verified" && userData && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Card Dimensions (Ratio 2:3)
      canvas.width = 600;
      canvas.height = 900;

      // 1. Premium Maroon Background with Gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, 900);
      gradient.addColorStop(0, '#800000'); 
      gradient.addColorStop(0.5, '#600000');
      gradient.addColorStop(1, '#400000'); 
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 600, 900);

      // 2. Complex Premium Background elements
      ctx.fillStyle = 'rgba(255, 215, 0, 0.03)';
      
      // Top Right Circle
      ctx.beginPath();
      ctx.arc(600, 0, 350, 0, Math.PI * 2);
      ctx.fill();
      
      // Bottom Left Circle
      ctx.beginPath();
      ctx.arc(0, 900, 250, 0, Math.PI * 2);
      ctx.fill();
      
      // Decorative center band
      const bgGradient = ctx.createLinearGradient(0, 400, 600, 400);
      bgGradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
      bgGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.05)');
      bgGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 400, 600, 100);

      // 3. Luxurious Gold Borders
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, 540, 840);
      ctx.lineWidth = 1;
      ctx.strokeRect(40, 40, 520, 820);
      
      // Corner accents
      ctx.fillStyle = '#FFD700';
      const corners = [[30,30], [570,30], [30,870], [570,870]];
      corners.forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Header Section
      ctx.fillStyle = '#FFD700';
      ctx.font = '900 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('JU 52nd BATCH', 300, 110);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'italic 20px sans-serif';
      ctx.letterSpacing = "2px";
      ctx.fillText('BATCH DAY 2026 • OFFICIAL ID', 300, 150);
      ctx.letterSpacing = "0px";

      // 5. User Details (Premium Typography)
      ctx.fillStyle = '#ffffff';
      
      // Auto-shrink name to prevent border overflow
      let fontSize = 56;
      ctx.font = `900 ${fontSize}px sans-serif`;
      const nameText = userData.name.toUpperCase();
      while (ctx.measureText(nameText).width > 480 && fontSize > 24) {
        fontSize -= 2;
        ctx.font = `900 ${fontSize}px sans-serif`;
      }
      ctx.fillText(nameText, 300, 600);

      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(`ID: JU52-${roll}`, 300, 660);

      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(userData.department, 300, 720);

      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '24px sans-serif';
      ctx.fillText(`Hall: ${userData.hall}`, 300, 765);
      
      // T-Shirt Size Badge
      ctx.fillStyle = '#FFAE00';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`T-SHIRT: ${userData.tshirt_size}`, 300, 820);

      // 6. QR Code Area (Real QR from API)
      const qrImage = new Image();
      qrImage.crossOrigin = "anonymous";
      qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=JU52-${roll}&margin=1`;
      qrImage.onload = () => {
        // Draw white background for QR
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 20;
        ctx.fillRect(200, 260, 200, 200);
        ctx.shadowBlur = 0; // reset shadow
        
        ctx.drawImage(qrImage, 210, 270, 180, 180);
        
        // Update Preview
        setPreviewUrl(canvas.toDataURL('image/png', 0.8));
      };

      qrImage.onerror = () => {
        // Offline / Error fallback: draw clean badge on card so preview & download are never blocked
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(200, 260, 200, 200);
        ctx.fillStyle = '#600000';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('JU 52ND BATCH', 300, 350);
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = '#111827';
        ctx.fillText(`JU52-${roll}`, 300, 380);
        setPreviewUrl(canvas.toDataURL('image/png', 0.8));
      };
    }
  }, [status, userData, roll]);

  const downloadPDF = async () => {
    if (!canvasRef.current || !userData) return;
    
    try {
      setDownloadLoading(true);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvasRef.current.toDataURL('image/jpeg', 0.8);
      
      // A4 is 210 x 297 mm, we want to center 100x150mm ID card
      const imgW = 100;
      const imgH = 150;
      const x = (210 - imgW) / 2;
      const y = (297 - imgH) / 2;

      pdf.addImage(imgData, 'JPEG', x, y, imgW, imgH);
      pdf.save(`JU52_ID_${roll}.pdf`);
      
      toast({ title: "PDF ডাউনলোড শুরু হয়েছে ✅" });
    } catch (err) {
      console.error("PDF error:", err);
      toast({ title: "ডাউনলোড ব্যর্থ হয়েছে", variant: "destructive" });
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] py-12 px-4 pb-32 md:pb-12 flex flex-col">
      <div className="max-w-xl mx-auto space-y-10 w-full flex-grow">
        
        {/* Header Section */}
        <div className="text-center space-y-2">
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            className="w-16 h-16 bg-primary rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-primary/20 mb-4"
          >
            <ShieldCheck className="text-white w-8 h-8" />
          </motion.div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">স্ট্যাটাস চেক</h1>
          <p className="text-slate-500 font-medium">নিরাপত্তার স্বার্থে রোল ও নিবন্ধিত ফোন নম্বর দিয়ে যাচাই করুন</p>
        </div>

        {/* Secure Search Bar */}
        <form onSubmit={handleSearch} className="bg-white p-3 sm:p-4 rounded-3xl border border-slate-200/90 shadow-xl space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="relative">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block px-1">রোল নম্বর *</label>
              <input
                className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl outline-none px-4 py-2.5 sm:py-3 font-bold text-slate-800 placeholder:text-slate-400 text-sm transition-all"
                placeholder="যেমন: 89"
                value={roll}
                onChange={(e) => setRoll(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block px-1">নিবন্ধিত ফোন নম্বর *</label>
              <input
                type="tel"
                className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl outline-none px-4 py-2.5 sm:py-3 font-bold text-slate-800 placeholder:text-slate-400 text-sm transition-all"
                placeholder="যেমন: 017XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-primary hover:bg-[#600000] text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 text-sm sm:text-base shadow-lg shadow-primary/20 cursor-pointer"
          >
            {status === "loading" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            টিকিট ও স্ট্যাটাস যাচাই করুন
          </button>
        </form>

        <AnimatePresence mode="wait">
          {status !== "idle" && status !== "loading" && (
            <motion.div
              key={status + roll}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              {status !== "not_found" && userData ? (
                <div className="space-y-6">
                  
                  {/* Status Badge */}
                  <div className={`flex items-center justify-center gap-3 p-4 rounded-2xl border ${statusConfig[status]?.bg} ${statusConfig[status]?.color} border-current/20 shadow-sm`}>
                    {(() => {
                      const Icon = statusConfig[status]?.icon;
                      return Icon ? <Icon className="h-6 w-6 stroke-[3px]" /> : null;
                    })()}
                    <span className="font-black text-lg tracking-wide">
                      {statusConfig[status]?.label}
                    </span>
                  </div>

                  {/* ID Card Result (Verified Only) */}
                  {status === "verified" ? (
                    <motion.div 
                      layoutId="id-card"
                      className="relative flex flex-col items-center bg-white p-6 rounded-[2.5rem] shadow-2xl border border-slate-100"
                    >
                      <canvas ref={canvasRef} className="hidden" />
                      
                      {/* Premium Card Image Preview */}
                      <div className="relative group w-full max-w-[320px] aspect-[2/3] rounded-[1.5rem] overflow-hidden shadow-[0_20px_50px_-10px_rgba(128,0,0,0.5)] border-4 border-white mb-8">
                        {previewUrl ? (
                          <img src={previewUrl} alt="ID card preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center">
                            <CreditCard className="w-12 h-12 text-slate-300" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                      </div>

                      <div className="w-full space-y-4">
                        <button 
                          onClick={downloadPDF}
                          disabled={downloadLoading}
                          className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95 disabled:opacity-75"
                        >
                          {downloadLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Download className="h-6 w-6" />}
                          DOWNLOAD OFFICIAL PDF
                        </button>
                        
                        <a 
                          href={previewUrl}
                          download={`JU52_ID_${roll}.png`}
                          className="w-full bg-primary/5 hover:bg-primary/10 text-primary py-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all active:scale-95"
                        >
                          <CreditCard className="h-6 w-6" />
                          DOWNLOAD AS IMAGE
                        </a>
                      </div>
                    </motion.div>
                  ) : (
                    /* Non-verified Info */
                    <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 text-center">
                      <p className="text-slate-500 font-medium mb-2">আপনার রেজিস্ট্রেশন তথ্য পাওয়া গেছে কিন্তু পেমেন্ট এখনো ভেরিফাই করা হয়নি।</p>
                      <p className="font-bold text-slate-800">নাম: {userData.name}</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Not Found Box */
                <div className="bg-red-50 p-12 rounded-[2rem] border border-red-100 text-center space-y-4">
                  <XCircle className="w-16 h-16 text-red-400 mx-auto" />
                  <div>
                    <h3 className="text-xl font-bold text-red-900">রেজিস্ট্রেশন পাওয়া যায়নি</h3>
                    <p className="text-red-600 font-medium opacity-70 italic">দয়া করে সঠিক রোল নম্বরটি পুনরায় পরীক্ষা করুন</p>
                  </div>
                  <button onClick={() => setStatus("idle")} className="text-red-700 font-black underline underline-offset-4">আবার চেষ্টা করুন</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Sponsor Banner */}
      <div className="max-w-xl mx-auto w-full mt-12 pt-8">
        <div className="-mx-4 sm:mx-0">
          <Sponsors type="status" mobileAspect="aspect-[16/9]" />
        </div>
      </div>
    </div>
  );
}
