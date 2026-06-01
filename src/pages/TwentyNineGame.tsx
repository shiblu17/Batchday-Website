import React from 'react';
import Navbar from '@/components/Navbar';
import { TwentyNineBoard } from '@/features/twenty-nine/TwentyNineBoard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TwentyNineGame() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/games')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-bold border border-primary/20">
              Beta
            </span>
          </div>
        </div>

        <TwentyNineBoard />
        
        {/* Game Rules / Instructions Drawer could go here */}
        <div className="mt-8 p-6 bg-card rounded-2xl border border-border shadow-sm">
          <h3 className="font-bold text-lg mb-2 text-foreground">How to Play</h3>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>29 is a trick-taking card game played by 4 players in fixed partnerships.</li>
            <li>The deck consists of 32 cards: J, 9, A, 10, K, Q, 8, 7 of each suit.</li>
            <li>J = 3 pts, 9 = 2 pts, A = 1 pt, 10 = 1 pt. Total points = 28. Last trick winner gets +1 pt.</li>
            <li>Bidding starts from 15 (or 16). The highest bidder sets the Trump card face down.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
