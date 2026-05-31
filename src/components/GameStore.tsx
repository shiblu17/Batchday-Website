import { useGameEconomy } from '@/hooks/useGameEconomy';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Coins, Lock, CheckCircle2 } from 'lucide-react';

export default function GameStore() {
  const { coins, skins, unlockSkin, equipSkin, activeSkin } = useGameEconomy();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors">
          <Coins className="w-4 h-4 text-amber-500" />
          <span className="font-bold">{coins} Coins</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-white/95 backdrop-blur-xl border-amber-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-amber-600">
            <Coins className="w-6 h-6" />
            Game Store
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-between items-center bg-amber-50 p-4 rounded-xl mb-4 border border-amber-100">
          <span className="font-semibold text-gray-700">Your Balance:</span>
          <span className="text-xl font-bold text-amber-500 flex items-center gap-1">
            <Coins className="w-5 h-5" /> {coins}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
          {skins.map(skin => {
            const isActive = activeSkin.id === skin.id;
            const canAfford = coins >= skin.price;

            return (
              <div 
                key={skin.id}
                className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 p-4 flex flex-col items-center gap-3
                  ${isActive ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'border-gray-200 hover:border-amber-200'}
                  ${!skin.isOwned && !canAfford ? 'opacity-70' : ''}
                `}
              >
                {/* Preview Circle */}
                <div 
                  className="w-16 h-16 rounded-full shadow-inner mb-2"
                  style={{ backgroundColor: skin.previewColor }}
                />
                
                <h3 className="font-bold text-lg text-gray-800">{skin.name}</h3>
                
                {skin.isOwned ? (
                  <Button 
                    variant={isActive ? "default" : "outline"}
                    className={`w-full ${isActive ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                    onClick={() => equipSkin(skin.id)}
                    disabled={isActive}
                  >
                    {isActive ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Equipped</> : 'Equip'}
                  </Button>
                ) : (
                  <Button 
                    variant="default"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    disabled={!canAfford}
                    onClick={() => unlockSkin(skin.id)}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    {skin.price} Coins
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
