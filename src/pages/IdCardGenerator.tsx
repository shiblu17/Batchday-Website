import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, FileText, Share2, Mail, CheckCircle } from 'lucide-react';

export default function IdCardGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchRoll, setSearchRoll] = useState('');
  const [debugStatus, setDebugStatus] = useState('পছন্দমতো রোল দিয়ে সার্চ দিন...');
  const { toast } = useToast();
  const [participant, setParticipant] = useState<{
    name: string;
    roll: string;
    department: string;
    hall: string;
  } | null>(null);

  const handleSearch = async (manualRoll?: string) => {
    const rollToSearch = manualRoll || searchRoll;
    if (!rollToSearch) return;

    try {
      setLoading(true);
      setDebugStatus('ডেটা খোঁজা হচ্ছে...');
      
      const { data: reg, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('roll', rollToSearch.trim())
        .maybeSingle();

      if (reg) {
        setDebugStatus('ইউজার ডেটা পাওয়া গেছে');
        setParticipant({
          name: reg.name,
          roll: reg.roll,
          department: reg.department,
          hall: reg.hall || 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয়'
        });
      } else {
        setDebugStatus('এই রোলে কোনো তথ্য পাওয়া যায়নি');
        toast({ title: "ভুল রোল নম্বর", description: "আবার চেষ্টা করুন", variant: "destructive" });
      }
    } catch (err) {
      setDebugStatus('এরর: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchAutoData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.user_metadata?.roll) {
          handleSearch(user.user_metadata.roll);
        } else {
          // Default demo data
          setParticipant({
            name: 'DEMO NAME',
            roll: '89',
            department: 'DEPARTMENT NAME',
            hall: 'YOUR HALL NAME',
          });
        }
      } catch (err) {}
    };
    fetchAutoData();
  }, []);

  useEffect(() => {
    if (!participant || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Optimized resolution for memory (600x900)
    canvas.width = 600;
    canvas.height = 900;

    // Draw Background
    const gradient = ctx.createLinearGradient(0, 0, 0, 900);
    gradient.addColorStop(0, '#800000'); 
    gradient.addColorStop(1, '#4a0000'); 
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 900);

    // Decorative Shapes
    ctx.fillStyle = 'rgba(255, 215, 0, 0.05)';
    ctx.beginPath();
    ctx.arc(600, 0, 300, 0, Math.PI * 2);
    ctx.fill();

    // Top Header
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('JU 52nd BATCH', 300, 100);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '28px sans-serif';
    ctx.fillText('BATCH DAY REGISTRATION', 300, 150);

    // Photo Box
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(200, 220, 200, 260);
    
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 4;
    ctx.strokeRect(198, 218, 204, 264);

    ctx.fillStyle = '#800000';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('PHOTOGRAPH', 300, 350);
    
    // Details Section
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText(participant.name.toUpperCase(), 300, 600);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(`ID: JU52-${participant.roll}`, 300, 660);

    ctx.fillStyle = '#ffffff';
    ctx.font = '28px sans-serif';
    ctx.fillText(participant.department, 300, 720);

    ctx.fillStyle = '#cccccc';
    ctx.font = '24px sans-serif';
    ctx.fillText(participant.hall, 300, 770);

    // QR Area
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(250, 800, 100, 100);
    ctx.fillStyle = '#800000';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('VERIFIED', 300, 855);

    setDebugStatus('কার্ড তৈরি সম্পন্ন');
    setDownloadUrl(canvas.toDataURL('image/png', 0.8));
  }, [participant]);

  const downloadPDF = async () => {
    if (!canvasRef.current || !participant) {
      alert("ডেটা লোড হচ্ছে, দয়া করে অপেক্ষা করুন।");
      return;
    }
    
    try {
      setLoading(true);
      setDebugStatus('PDF জেনারেট হচ্ছে...');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const canvas = canvasRef.current;
      const imgData = canvas.toDataURL('image/jpeg', 0.7);
      
      const imgW = 100;
      const imgH = 150;
      const x = (210 - imgW) / 2;
      const y = (297 - imgH) / 2;

      pdf.addImage(imgData, 'JPEG', x, y, imgW, imgH);
      
      const fileName = `JU52_ID_${participant.roll}.pdf`;
      pdf.save(fileName);
      
      setDebugStatus('PDF ডাউনলোড শুরু হয়েছে');
      toast({ title: "PDF ডাউনলোড শুরু হয়েছে ✅" });
    } catch (err) {
      console.error("PDF Export error:", err);
      setDebugStatus('PDF এরর: ' + (err as Error).message);
      alert("PDF ডাউনলোড কাজ করছে না। দয়া করে IMAGE বাটনটি ব্যবহার করুন।");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !participant) return (
    <div className="flex flex-col items-center justify-center py-40">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="font-display font-medium text-slate-500">আইডি কার্ড তৈরি হচ্ছে...</p>
    </div>
  );

  return (
    <div className="min-h-screen py-20 px-4 bg-[#f8f9fa]">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          
          {/* Card Preview */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex justify-center"
          >
            <div className="relative group">
              <canvas ref={canvasRef} className="hidden" />
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-[0_30px_70px_-15px_rgba(128,0,0,0.4)] border-[6px] border-white transform transition-transform group-hover:scale-[1.02] duration-500 w-[320px] h-[480px]">
                {downloadUrl && <img src={downloadUrl} alt="ID Card Preview" className="w-full h-full object-cover" />}
              </div>
              <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-primary rounded-3xl flex items-center justify-center shadow-xl border-4 border-white rotate-12">
                <CheckCircle className="h-12 w-12 text-secondary" />
              </div>
            </div>
          </motion.div>

          {/* Controls */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="text-left">
              <div className="flex justify-between items-center mb-4">
                <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider">PREMIUM ID CARD</span>
                <span className="text-[10px] text-slate-400 font-mono">{debugStatus}</span>
              </div>
              <h2 className="text-5xl font-black text-slate-900 mb-6 leading-tight">আপনার ডিজিটাল আইডি কার্ড জেনারেট করুন।</h2>
              
              {/* Search Bar */}
              <div className="flex gap-2 mb-8 p-1 bg-white rounded-2xl shadow-lg border border-slate-100">
                <input 
                  type="text" 
                  placeholder="রোল নম্বর দিন (যেমন: 89)" 
                  value={searchRoll}
                  onChange={(e) => setSearchRoll(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:ring-0 px-6 font-bold text-lg"
                />
                <button 
                  onClick={() => handleSearch()}
                  disabled={loading}
                  className="bg-primary text-secondary px-8 py-4 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  সার্চ দিন
                </button>
              </div>

              <p className="text-lg text-slate-600 font-medium">এটি আপনার অফিশিয়াল রেজিস্ট্রেশন কার্ড। ইভেন্টের দিন এন্ট্রির সময় এটি ফোনে অথবা প্রিন্ট করে সাথে রাখুন।</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={downloadPDF}
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl flex items-center justify-center transition-all shadow-xl hover:shadow-2xl active:scale-95 disabled:opacity-75"
              >
                {loading ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <FileText className="h-6 w-6 mr-3" />}
                DOWNLOAD PDF (OFFICIAL)
              </button>
              
              <a 
                href={downloadUrl} 
                download={`JU52_ID_${participant?.roll}.png`}
                className="w-full bg-primary hover:bg-[#6a0000] text-secondary font-black py-5 rounded-2xl flex items-center justify-center transition-all shadow-xl hover:shadow-2xl active:scale-95"
              >
                <Download className="h-6 w-6 mr-3" />
                DOWNLOAD IMAGE (SOCIAL)
              </a>
            </div>

            <div className="pt-6 border-t border-slate-200">
              <p className="text-sm font-bold text-slate-400 mb-4">SHARE WITH FRIENDS</p>
              <div className="flex gap-4">
                <button className="h-12 w-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"><Share2 className="h-5 w-5" /></button>
                <button className="h-12 w-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"><Mail className="h-5 w-5" /></button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
