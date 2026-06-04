// Simple Web Audio API sound synthesizer
const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

const isSoundEnabled = () => {
  return localStorage.getItem('ju_twenty_nine_sound_enabled') !== 'false';
};

const isVoiceEnabled = () => {
  return localStorage.getItem('ju_twenty_nine_voice_enabled') !== 'false';
};

let cachedBengaliVoice: SpeechSynthesisVoice | null = null;

const getBengaliVoice = () => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  if (cachedBengaliVoice) return cachedBengaliVoice;

  const voices = window.speechSynthesis.getVoices();
  const bnVoice = voices.find(v => {
    const l = v.lang.toLowerCase();
    const n = v.name.toLowerCase();
    return l.startsWith('bn') || 
           l.startsWith('ben') || 
           l.includes('bengali') || 
           l.includes('bangla') ||
           n.includes('bengali') ||
           n.includes('bangla');
  });
  if (bnVoice) {
    cachedBengaliVoice = bnVoice;
  }
  return cachedBengaliVoice;
};

if (typeof window !== 'undefined' && window.speechSynthesis) {
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      getBengaliVoice();
    };
  }
}

export const playCardSwoosh = () => {
  if (!isSoundEnabled()) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
  
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.15);
};

export const playDealSound = () => {
  if (!isSoundEnabled()) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  // Play 4 rapid swooshes
  for (let i = 0; i < 4; i++) {
    setTimeout(playCardSwoosh, i * 60);
  }
};

export const playTrickWinSound = () => {
  if (!isSoundEnabled()) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(300, audioCtx.currentTime);
  osc.frequency.linearRampToValueAtTime(500, audioCtx.currentTime + 0.1);
  
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.3);
};

export const speakBengaliVoice = (text: string) => {
  if (!isVoiceEnabled()) return;
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    // Cancel any ongoing speech to avoid overlay queuing delays
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'bn-BD';
    utterance.rate = 1.15; // slightly faster for normal human tempo
    utterance.pitch = 1.0;

    const bnVoice = getBengaliVoice();
    if (bnVoice) {
      utterance.voice = bnVoice;
      console.log(`[SpeechSynthesis] Speaking Bengali with voice: ${bnVoice.name} (${bnVoice.lang})`);
    } else {
      console.warn(`[SpeechSynthesis] No Bengali voice profile found. Falling back to default browser engine. Available voices in this browser:`, 
        window.speechSynthesis.getVoices().map(v => `${v.name} (${v.lang})`).join(', ')
      );
    }
    
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.error('SpeechSynthesis error:', e);
  }
};
