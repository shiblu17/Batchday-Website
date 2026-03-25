import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, FileText } from 'lucide-react';

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
  } | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Find registration by user's email or phone (using metadata if possible)
      // Usually linked by user_id if we have it in schema
      const { data: reg, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('roll', user.user_metadata?.roll || '') // Assuming roll is in metadata
        .maybeSingle();

      if (reg) {
        setParticipant({
          name: reg.name,
          roll: reg.roll,
          department: reg.department,
          hall: reg.hall || 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয়',
        });
      } else {
        // Fallback for demo if no real reg found yet
        setParticipant({
          name: 'রেজিস্টার্ড স্টুডেন্ট',
          roll: '৫২০০০০',
          department: 'আপনার বিভাগ',
          hall: 'আপনার হল',
        });
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (!participant || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 900;

    // Draw Background
    const gradient = ctx.createLinearGradient(0, 0, 0, 900);
    gradient.addColorStop(0, '#800000'); // Deep Maroon
    gradient.addColorStop(1, '#4a0000'); 
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 900);

    // Header Text
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('JU 52nd BATCH', 300, 100);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '30px sans-serif';
    ctx.fillText('BATCH DAY REGISTRATION', 300, 150);

    // Profile Placeholder
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(200, 220, 200, 250);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 4;
    ctx.strokeRect(198, 218, 204, 254);
    
    // Details
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px sans-serif';
    ctx.fillText(participant.name.toUpperCase(), 300, 560);

    ctx.fillStyle = '#FFD700';
    ctx.font = '32px sans-serif';
    ctx.fillText(`Roll: ${participant.roll}`, 300, 620);

    ctx.fillStyle = '#ffffff';
    ctx.font = '28px sans-serif';
    ctx.fillText(participant.department, 300, 680);

    ctx.fillStyle = '#cccccc';
    ctx.font = '24px sans-serif';
    ctx.fillText(participant.hall, 300, 730);

    setDownloadUrl(canvas.toDataURL('image/png'));
  }, [participant]);

  const downloadPDF = () => {
    if (!canvasRef.current || !participant) return;
    const pdf = new jsPDF('p', 'px', [400, 600]);
    const imgData = canvasRef.current.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, 400, 600);
    pdf.save(`JU52_ID_${participant.roll}.pdf`);
    toast({ title: "PDF ডাউনলোড শুরু হয়েছে" });
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen py-16 px-4 bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-[2.5rem] shadow-card border border-gray-100 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">Your Digital ID Card</h2>
        <p className="text-slate-500 font-medium mb-12">আপনার ভেরিফাইড আইডি কার্ডটি ডাউনলোড করুন।</p>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-12">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <canvas ref={canvasRef} className="hidden" />
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white w-[300px] h-[450px]">
              {downloadUrl && <img src={downloadUrl} alt="ID Card" className="w-full h-full object-cover" />}
            </div>
          </motion.div>

          <div className="flex flex-col space-y-4 w-full max-w-xs">
            <a href={downloadUrl} download={`JU52_ID_${participant?.roll}.png`} className="w-full bg-primary text-secondary font-bold py-4 rounded-xl flex items-center justify-center">
              <Download className="mr-2 h-5 w-5" /> Image Download
            </a>
            <button onClick={downloadPDF} className="w-full bg-secondary text-primary font-bold py-4 rounded-xl border-2 border-primary/20 flex items-center justify-center">
              <FileText className="mr-2 h-5 w-5" /> PDF Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
