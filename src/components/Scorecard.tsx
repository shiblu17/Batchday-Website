import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Download, Share2, Award, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScorecardProps {
  gameName: string;
  scoreOrStatus: string;
  avatarUrl?: string;
  playerName?: string;
}

export default function Scorecard({ gameName, scoreOrStatus, avatarUrl = 'https://api.dicebear.com/7.x/avataaars/svg?seed=JU', playerName = 'Player' }: ScorecardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const downloadCard = async () => {
    if (!cardRef.current) return;
    setIsCapturing(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: null,
      });
      const image = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = image;
      a.download = `JU_Batchday_${gameName.replace(/\s+/g, '_')}_Score.png`;
      a.click();
    } catch (err) {
      console.error("Error generating scorecard", err);
    } finally {
      setIsCapturing(false);
    }
  };

  const shareCard = async () => {
    if (!cardRef.current) return;
    setIsCapturing(true);
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: null });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'scorecard.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'My JU Game Zone Score!',
            text: `I just played ${gameName} at JU Batchday Game Zone! Check out my result.`,
            files: [file],
          });
        } else {
          alert("Your browser doesn't support native sharing of files. Please use the download button instead.");
        }
      });
    } catch (err) {
      console.error("Error sharing scorecard", err);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        ref={cardRef} 
        className="relative w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl p-8 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 text-white"
        style={{ aspectRatio: '3/4' }}
      >
        {/* Watermarks */}
        <div className="absolute top-4 left-4 opacity-10">
          <ShieldCheck className="w-32 h-32" />
        </div>
        <div className="absolute -bottom-10 -right-10 opacity-10">
          <Award className="w-48 h-48" />
        </div>

        {/* Header */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full gap-6 text-center">
          <div className="bg-white/10 p-2 rounded-2xl backdrop-blur-md">
            <h3 className="text-xl font-bold text-amber-400 uppercase tracking-widest">JU BATCHDAY 51</h3>
          </div>
          
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)] bg-white">
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" crossOrigin="anonymous" />
          </div>

          <div>
            <h2 className="text-3xl font-black">{playerName}</h2>
            <p className="text-indigo-200 font-medium">{gameName}</p>
          </div>

          <div className="bg-gradient-to-r from-amber-500 to-orange-500 w-full py-4 rounded-2xl shadow-lg mt-4">
            <p className="text-sm font-bold text-amber-100 uppercase mb-1">Result</p>
            <h1 className="text-4xl font-black text-white drop-shadow-md">{scoreOrStatus}</h1>
          </div>

          <p className="text-sm text-indigo-300 mt-auto pt-4">batchday.com/game-hub</p>
        </div>
      </div>

      <div className="flex gap-4 w-full max-w-sm">
        <Button 
          onClick={downloadCard} 
          disabled={isCapturing}
          className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold"
        >
          {isCapturing ? 'Generating...' : <><Download className="w-4 h-4 mr-2" /> Download</>}
        </Button>
        <Button 
          onClick={shareCard}
          disabled={isCapturing}
          variant="secondary"
          className="flex-1 bg-white hover:bg-gray-100 text-indigo-900 font-bold"
        >
          <Share2 className="w-4 h-4 mr-2" /> Share
        </Button>
      </div>
    </div>
  );
}
