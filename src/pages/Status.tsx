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
  const [status, setStatus] = useState<Status>("idle");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roll.trim()) return;
    setStatus("loading");

    const { data, error } = await supabase
      .from("registrations")
      .select("name, department, hall, status, tshirt_size")
      .eq("roll", roll.trim())
      .maybeSingle();

    if (error || !data) {
      setUserData(null);
      setStatus("not_found");
      setPreviewUrl('');
    } else {
      setUserData(data);
      setStatus(data.status as Status);
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
      ctx.fillText('BATCH DAY 2024 • OFFICIAL ID', 300, 150);
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
    <div className="min-h-screen bg-[#fafafa] py-12 px-4 pb-12 flex flex-col">
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
          <p className="text-slate-500 font-medium">আপনার রোল নম্বর দিয়ে রেজিস্ট্রেশন যাচাই করুন</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-1 p-1.5 bg-white border border-slate-200 rounded-full shadow-xl focus-within:ring-4 focus-within:ring-primary/10 transition-all max-w-full overflow-hidden">
          <input
            className="flex-1 min-w-0 bg-transparent border-none focus:ring-0 outline-none px-4 md:px-6 py-2.5 md:py-3 font-bold text-slate-700 placeholder:text-slate-300 text-sm md:text-base"
            placeholder="রোল নম্বর (যেমন: 89)"
            value={roll}
            onChange={(e) => setRoll(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="shrink-0 bg-primary hover:bg-[#600000] text-white px-5 md:px-8 py-2.5 md:py-3 rounded-full font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 text-sm md:text-base"
          >
            {status === "loading" ? <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" /> : <Search className="h-4 w-4 md:h-5 md:w-5" />}
            খুঁজুন
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
