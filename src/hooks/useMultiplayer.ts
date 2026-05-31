import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type GameState = {
  tokens?: any;
  currentPlayer?: string;
  diceValue?: number | null;
  diceRolled?: boolean;
  consecutiveSixes?: number;
  winner?: string | null;
  [key: string]: any;
};

export function useMultiplayer(gameName: string, onStateReceived?: (state: GameState) => void) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [channel, setChannel] = useState<any>(null);
  const [playersCount, setPlayersCount] = useState(0);

  // Generate a random 4 letter room code
  const generateRoomId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let id = '';
    for (let i = 0; i < 4; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  };

  const joinRoom = useCallback((id: string) => {
    if (channel) {
      supabase.removeChannel(channel);
    }

    const newChannel = supabase.channel(`game:${gameName}:${id}`, {
      config: {
        presence: { key: 'player' },
      },
    });

    newChannel
      .on('presence', { event: 'sync' }, () => {
        const state = newChannel.presenceState();
        setPlayersCount(Object.keys(state).length);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Player joined', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Player left', leftPresences);
      })
      .on('broadcast', { event: 'game_state' }, ({ payload }) => {
        if (onStateReceived) {
          onStateReceived(payload);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setRoomId(id);
          await newChannel.track({ online_at: new Date().toISOString() });
        } else {
          setIsConnected(false);
        }
      });

    setChannel(newChannel);
  }, [channel, gameName, onStateReceived]);

  const createRoom = useCallback(() => {
    const id = generateRoomId();
    joinRoom(id);
    return id;
  }, [joinRoom]);

  const leaveRoom = useCallback(() => {
    if (channel) {
      supabase.removeChannel(channel);
      setChannel(null);
      setIsConnected(false);
      setRoomId(null);
      setPlayersCount(0);
    }
  }, [channel]);

  const broadcastState = useCallback((state: GameState) => {
    if (channel && isConnected) {
      channel.send({
        type: 'broadcast',
        event: 'game_state',
        payload: state,
      });
    }
  }, [channel, isConnected]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [channel]);

  return {
    roomId,
    isConnected,
    playersCount,
    createRoom,
    joinRoom,
    leaveRoom,
    broadcastState,
  };
}
