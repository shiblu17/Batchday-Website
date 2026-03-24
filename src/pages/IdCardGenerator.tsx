import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function IdCardGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [downloadUrl, setDownloadUrl] = useState('');

  // Mock data that would normally come from Supabase / Auth Context
  const participant = {
    name: 'Rafiqul Islam',
    roll: '520145',
    department: 'Computer Science',
    hall: 'Mir Mosharraf Hossain Hall'
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions (ID Card ratio ~ 2:3)
    canvas.width = 600;
    canvas.height = 900;

    // 1. Draw Background
    const gradient = ctx.createLinearGradient(0, 0, 0, 900);
    gradient.addColorStop(0, '#800000'); // Deep Maroon
    gradient.addColorStop(1, '#4a0000'); 
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 900);

    // 2. Draw Golden Accents
    ctx.fillStyle = '#FFD700'; // Golden
    ctx.fillRect(0, 850, 600, 50);
    
    ctx.beginPath();
    ctx.arc(300, 200, 150, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
    ctx.fill();

    // 3. Draw Header Text
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 48px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('JU 52nd BATCH', 300, 100);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '30px "Hind Siliguri", sans-serif';
    ctx.fillText('BATCH DAY REGISTRATION', 300, 150);

    // 4. Draw Profile Placeholder (Since no cloudinary image yet)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(200, 220, 200, 250);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 4;
    ctx.strokeRect(198, 218, 204, 254);
    
    ctx.fillStyle = '#800000';
    ctx.font = '24px sans-serif';
    ctx.fillText('PHOTO', 300, 350);

    // 5. Draw Participant Details
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px "Hind Siliguri", sans-serif';
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

    // Generate Download URL
    setDownloadUrl(canvas.toDataURL('image/png'));
  }, []);

  return (
    <div className="min-h-screen py-16 px-4 bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4 tracking-tight">Your Digital ID Card</h2>
        <p className="text-slate-500 font-medium mb-12 max-w-lg mx-auto">
          Share your custom verified ID card on Facebook or Instagram to let everyone know you're attending!
        </p>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-12">
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            {/* The actual canvas is hidden, we display the generated image so it scales cleanly */}
            <canvas ref={canvasRef} className="hidden" />
            <div className="relative rounded-3xl overflow-hidden shadow-[0_20px_50px_-10px_rgba(128,0,0,0.3)] border-4 border-white transform transition-transform hover:scale-[1.02] duration-300 w-[300px] h-[450px]">
              {downloadUrl ? (
                <img src={downloadUrl} alt="Digital ID Card" className="w-[300px] h-[450px] object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-500 font-medium">
                  Generating ID...
                </div>
              )}
            </div>
          </motion.div>

          <div className="flex flex-col space-y-4 w-full max-w-xs">
            {downloadUrl && (
              <>
                <a 
                  href={downloadUrl} 
                  download={`JU_52_Batch_${participant.roll}.png`}
                  className="w-full bg-primary hover:bg-[#600000] text-secondary font-bold py-4 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95 flex items-center justify-center"
                >
                  <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download HD Image
                </a>
                
                <button 
                  onClick={() => alert('In a real app, this would trigger the native share API or open a Facebook share modal.')}
                  className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Share to Facebook
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
