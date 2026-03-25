import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, FileText, Share2, Mail, CheckCircle } from 'lucide-react';

export default function IdCardGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [participant, setParticipant] = useState<{
    name: string;
    roll: string;
    department: string;
    hall: string;
    email?: string;
  } | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // 1. Try to find registration by user_id
        // 2. Fallback to roll from metadata or email
        const userRoll = user.user_metadata?.roll || '';
        
        const { data: reg, error } = await supabase
          .from('registrations')
          .select('*')
          .eq('roll', userRoll)
          .maybeSingle();

        if (reg) {
          setParticipant({
            name: reg.name,
            roll: reg.roll,
            department: reg.department,
            hall: reg.hall || 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয়'
          });
        } else {
          // If no registration found, show demo or info
          setParticipant({
            name: user.user_metadata?.full_name || 'JU স্টুডেন্ট',
            roll: user.user_metadata?.roll || '৫২-XXXX',
            department: 'আপনার বিভাগ',
            hall: 'আপনার হল',
          });
        }
      } catch (err) {
        console.error("Error fetching participant:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (!participant || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High resolution canvas (2x)
    canvas.width = 800;
    canvas.height = 1200;

    // Draw Background
    const gradient = ctx.createLinearGradient(0, 0, 0, 1200);
    gradient.addColorStop(0, '#800000'); // Maroon
    gradient.addColorStop(1, '#4a0000'); 
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 1200);

    // Decorative Shapes
    ctx.fillStyle = 'rgba(255, 215, 0, 0.05)';
    ctx.beginPath();
    ctx.arc(800, 0, 400, 0, Math.PI * 2);
    ctx.fill();

    // Top Header
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('JU 52nd BATCH', 400, 120);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '34px sans-serif';
    ctx.fillText('BATCH DAY REGISTRATION', 400, 180);

    // Photo Box
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 30;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.fillRect(250, 260, 300, 380);
    ctx.shadowBlur = 0; // Reset shadow
    
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 6;
    ctx.strokeRect(247, 257, 306, 386);

    ctx.fillStyle = '#800000';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('OFFICIAL PHOTOGRAPH', 400, 450);
    
    // Details Section
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText(participant.name.toUpperCase(), 400, 780);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText(`ID: JU52-${participant.roll}`, 400, 860);

    ctx.fillStyle = '#ffffff';
    ctx.font = '36px sans-serif';
    ctx.fillText(participant.department, 400, 930);

    ctx.fillStyle = '#cccccc';
    ctx.font = '30px sans-serif';
    ctx.fillText(participant.hall, 400, 990);

    // QR Code Placeholder Area
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(325, 1040, 150, 150);
    ctx.fillStyle = '#800000';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('VERIFIED QR', 400, 1125);

    setDownloadUrl(canvas.toDataURL('image/png', 1.0));
  }, [participant]);

  const downloadPDF = async () => {
    if (!canvasRef.current || !participant) return;
    
    try {
      setLoading(true);
      
      // Use standard A4 or custom size that is widely supported
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvasRef.current.toDataURL('image/png', 1.0);
      
      // A4 is 210mm x 297mm. We want ID card to be around 100mm x 150mm centered
      const imgWidth = 100;
      const imgHeight = 150;
      const x = (210 - imgWidth) / 2;
      const y = (297 - imgHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      
      // Create a blob and download it manually for better mobile support
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `JU52_ID_${participant.roll}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({ title: "PDF ডাউনলোড শুরু হয়েছে ✅" });
    } catch (err) {
      console.error("PDF Export error:", err);
      toast({ title: "PDF ডাউনলোড ব্যর্থ হয়েছে", description: "আবার চেষ্টা করুন", variant: "destructive" });
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
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs mb-4">VERIFIED ID CARD</span>
              <h2 className="text-5xl font-black text-slate-900 mb-6 leading-tight">আপনার নিজস্ব ডিজিটাল আইডি কার্ড।</h2>
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
