import React from 'react';
import { TwentyNineBoard } from '@/features/twenty-nine/TwentyNineBoard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TwentyNineGame() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-[#2d1b11] z-[100] overflow-hidden flex flex-col items-center justify-center">
      {/* Floating Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate('/game')}
        className="absolute top-4 left-4 z-[110] text-white hover:bg-white/20 hover:text-white rounded-full bg-black/20 backdrop-blur-sm"
        size="icon"
      >
        <ArrowLeft className="w-6 h-6" />
      </Button>

      <TwentyNineBoard />
    </div>
  );
}
