import { useState, useEffect } from 'react';

export type Skin = {
  id: string;
  name: string;
  price: number;
  previewColor: string;
  isOwned: boolean;
};

export const DEFAULT_SKINS: Skin[] = [
  { id: 'classic', name: 'Classic Ludo', price: 0, previewColor: '#22c55e', isOwned: true },
  { id: 'cyberpunk', name: 'Cyberpunk Neon', price: 500, previewColor: '#e879f9', isOwned: false },
  { id: 'prantik', name: 'Prantik Sunset', price: 800, previewColor: '#f97316', isOwned: false },
  { id: 'dark_mode', name: 'Midnight Dark', price: 1000, previewColor: '#1e293b', isOwned: false },
];

export function useGameEconomy() {
  const [coins, setCoins] = useState<number>(() => {
    const saved = localStorage.getItem('game_coins');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [skins, setSkins] = useState<Skin[]>(() => {
    const saved = localStorage.getItem('game_skins');
    if (saved) {
      try {
        const ownedIds = JSON.parse(saved) as string[];
        return DEFAULT_SKINS.map(skin => ({
          ...skin,
          isOwned: skin.isOwned || ownedIds.includes(skin.id)
        }));
      } catch (e) {
        return DEFAULT_SKINS;
      }
    }
    return DEFAULT_SKINS;
  });

  const [activeSkinId, setActiveSkinId] = useState<string>(() => {
    return localStorage.getItem('active_skin_id') || 'classic';
  });

  useEffect(() => {
    localStorage.setItem('game_coins', coins.toString());
  }, [coins]);

  useEffect(() => {
    const ownedIds = skins.filter(s => s.isOwned).map(s => s.id);
    localStorage.setItem('game_skins', JSON.stringify(ownedIds));
  }, [skins]);

  useEffect(() => {
    localStorage.setItem('active_skin_id', activeSkinId);
  }, [activeSkinId]);

  const addCoins = (amount: number) => {
    setCoins(prev => prev + amount);
  };

  const deductCoins = (amount: number) => {
    setCoins(prev => Math.max(0, prev - amount));
  };

  const unlockSkin = (skinId: string) => {
    const skin = skins.find(s => s.id === skinId);
    if (!skin || skin.isOwned || coins < skin.price) return false;

    setCoins(prev => prev - skin.price);
    setSkins(prev => prev.map(s => s.id === skinId ? { ...s, isOwned: true } : s));
    return true;
  };

  const equipSkin = (skinId: string) => {
    const skin = skins.find(s => s.id === skinId);
    if (skin && skin.isOwned) {
      setActiveSkinId(skinId);
    }
  };

  const activeSkin = skins.find(s => s.id === activeSkinId) || skins[0];

  return { coins, addCoins, deductCoins, skins, unlockSkin, equipSkin, activeSkin };
}
