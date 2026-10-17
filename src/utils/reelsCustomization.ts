/**
 * JU 52nd Batch Day - Reels Customization Engine
 * Instagram-style Visual Filters, Audio Mixing & Metadata
 */

export interface ReelFilter {
  id: string;
  name: string;
  badge: string;
  cssFilter: string;
  previewBg: string;
  description: string;
  icon: string;
}

export const REEL_FILTERS: ReelFilter[] = [
  {
    id: "normal",
    name: "Normal",
    badge: "স্বাভাবিক",
    cssFilter: "none",
    previewBg: "from-zinc-700 to-zinc-900",
    description: "আসল কালার",
    icon: "✨",
  },
  {
    id: "golden",
    name: "Golden Hour",
    badge: "সোনালী আলো",
    cssFilter: "sepia(0.28) saturate(1.45) contrast(1.1) brightness(1.05)",
    previewBg: "from-amber-500 to-yellow-600",
    description: "বিকালের ক্যাম্পাসের উষ্ণ রোদ",
    icon: "🌅",
  },
  {
    id: "retro90s",
    name: "Retro '90s",
    badge: "ভিন্টেজ",
    cssFilter:
      "contrast(1.2) brightness(0.95) sepia(0.35) hue-rotate(-10deg) saturate(1.25)",
    previewBg: "from-amber-700 to-rose-700",
    description: "পুরোনো নস্টালজিক ক্যামকর্ডার লুক",
    icon: "📼",
  },
  {
    id: "sunset",
    name: "Sunset Glow",
    badge: "সূর্যাস্ত",
    cssFilter: "saturate(1.6) contrast(1.15) brightness(1.05) hue-rotate(8deg)",
    previewBg: "from-rose-500 to-orange-500",
    description: "লেক পাড়ের রক্তিম সন্ধ্যা",
    icon: "🌆",
  },
  {
    id: "noir",
    name: "Campus Noir",
    badge: "সাদা-কালো",
    cssFilter: "grayscale(1) contrast(1.35) brightness(1.05)",
    previewBg: "from-zinc-400 to-black",
    description: "ড্রামাটিক সিনেমাটিক সাদা-কালো",
    icon: "🎬",
  },
  {
    id: "emerald",
    name: "700 Acres",
    badge: "সবুজ ক্যাম্পাস",
    cssFilter: "saturate(1.5) hue-rotate(-15deg) contrast(1.1)",
    previewBg: "from-emerald-500 to-teal-700",
    description: "সবুজ অরণ্য ও ক্যাম্পাসের প্রকৃতি",
    icon: "🍃",
  },
  {
    id: "cyber",
    name: "Cyber Neon",
    badge: "কনসার্ট",
    cssFilter: "saturate(2.2) contrast(1.3) hue-rotate(90deg)",
    previewBg: "from-fuchsia-600 to-cyan-500",
    description: "কালচারাল নাইট ও নিয়ন ভাইব",
    icon: "⚡",
  },
];

export interface ReelAudioTrack {
  id: string;
  title: string;
  artist: string;
  tag: string;
  emoji: string;
  type: "original" | "ambient" | "synth_beat" | "lofi";
  ambientKey?: "rain" | "birds" | "tea" | "night" | "wind";
}

export const REEL_AUDIO_TRACKS: ReelAudioTrack[] = [
  {
    id: "original",
    title: "অরিজিনাল ভিডিও সাউন্ড",
    artist: "ক্যামেরা মাইক্রোফোন",
    tag: "Original Sound",
    emoji: "🎙️",
    type: "original",
  },
  {
    id: "lofi_campus",
    title: "বটতলার আড্ডা (Lo-Fi)",
    artist: "JU 52 Acoustic",
    tag: "Chill Beats",
    emoji: "☕",
    type: "lofi",
  },
  {
    id: "transport_guitar",
    title: "ট্রান্সপোর্টের গিটার",
    artist: "রাতজাগা ক্যাম্পাসের সুর",
    tag: "Acoustic Melody",
    emoji: "🎸",
    type: "ambient",
    ambientKey: "night",
  },
  {
    id: "batch_celebration",
    title: "ব্যাচ-ডে সেলিব্রেশন",
    artist: "JU 52 Party Anthem",
    tag: "Upbeat Beats",
    emoji: "🎉",
    type: "synth_beat",
  },
  {
    id: "monsoon_rain",
    title: "মুক্তমঞ্চে বৃষ্টি",
    artist: "Monsoon Symphony",
    tag: "Nostalgic Rain",
    emoji: "🌧️",
    type: "ambient",
    ambientKey: "rain",
  },
  {
    id: "campus_wind",
    title: "৭০০ একরের বাতাস",
    artist: "Campus Echoes",
    tag: "Peaceful",
    emoji: "🍃",
    type: "ambient",
    ambientKey: "wind",
  },
];

export function getFilterCss(filterId?: string): string {
  if (!filterId) return "none";
  const found = REEL_FILTERS.find((f) => f.id === filterId);
  return found ? found.cssFilter : "none";
}

export function getAudioTrack(trackId?: string): ReelAudioTrack {
  if (!trackId) return REEL_AUDIO_TRACKS[0];
  const found = REEL_AUDIO_TRACKS.find((t) => t.id === trackId);
  return found || REEL_AUDIO_TRACKS[0];
}

/**
 * Procedural Web Audio Synth for Lo-Fi & Celebration tracks
 * Zero latency, zero external asset downloads, runs 100% in browser
 */
class ReelsProceduralAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private currentTrackId: string | null = null;
  private intervalId: number | null = null;
  private nodes: (AudioNode | { stop: () => void; disconnect: () => void })[] = [];

  private init() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    if (this.masterGain && this.ctx) {
      const clamped = Math.max(0, Math.min(1, val));
      this.masterGain.gain.linearRampToValueAtTime(
        clamped,
        this.ctx.currentTime + 0.1
      );
    }
  }

  public stop() {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.nodes.forEach((n) => {
      try {
        if ("stop" in n && typeof n.stop === "function") n.stop();
        if ("disconnect" in n && typeof n.disconnect === "function")
          n.disconnect();
      } catch {}
    });
    this.nodes = [];
    this.isPlaying = false;
    this.currentTrackId = null;
  }

  public play(trackId: string, volume = 0.5) {
    if (trackId === "original") {
      this.stop();
      return;
    }

    this.init();
    if (!this.ctx || !this.masterGain) return;

    if (this.isPlaying && this.currentTrackId === trackId) {
      this.setVolume(volume);
      return;
    }

    this.stop();
    this.isPlaying = true;
    this.currentTrackId = trackId;
    this.setVolume(volume);

    if (trackId === "lofi_campus") {
      this.playLoFiSequence();
    } else if (trackId === "batch_celebration") {
      this.playCelebrationSequence();
    }
  }

  private playLoFiSequence() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;

    // Soothing Lo-Fi Chords progression (Fmaj7 - Em7 - Dm7 - Cmaj7)
    const chords = [
      [349.23, 440.0, 523.25, 659.25], // Fmaj7
      [329.63, 392.0, 493.88, 587.33], // Em7
      [293.66, 349.23, 440.0, 523.25], // Dm7
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
    ];
    let step = 0;

    const playChord = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;
      const notes = chords[step % chords.length];
      const now = ctx.currentTime;

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.04);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(650, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now + i * 0.04);
        osc.stop(now + 2.0);
        this.nodes.push(osc, gain, filter);
      });

      // Subtle warm sub-bass note
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = "triangle";
      bassOsc.frequency.setValueAtTime(notes[0] / 4, now);
      bassGain.gain.setValueAtTime(0.12, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
      bassOsc.connect(bassGain);
      bassGain.connect(this.masterGain!);
      bassOsc.start(now);
      bassOsc.stop(now + 1.8);
      this.nodes.push(bassOsc, bassGain);

      step++;
    };

    playChord();
    this.intervalId = window.setInterval(playChord, 1900);
  }

  private playCelebrationSequence() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;

    // Upbeat Celebration Dance Synth (124 BPM)
    const notes = [440, 523.25, 587.33, 659.25, 783.99, 659.25];
    let step = 0;

    const playBeat = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;
      const now = ctx.currentTime;
      const freq = notes[step % notes.length];

      // Synth Melody pluck
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + 0.38);
      this.nodes.push(osc, gain);

      // Kick drum pulse on beats 0 & 2
      if (step % 2 === 0) {
        const kick = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kick.frequency.setValueAtTime(140, now);
        kick.frequency.exponentialRampToValueAtTime(45, now + 0.15);
        kickGain.gain.setValueAtTime(0.25, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        kick.connect(kickGain);
        kickGain.connect(this.masterGain!);
        kick.start(now);
        kick.stop(now + 0.22);
        this.nodes.push(kick, kickGain);
      }

      step++;
    };

    playBeat();
    this.intervalId = window.setInterval(playBeat, 240);
  }
}

export const reelsAudioEngine = new ReelsProceduralAudioEngine();
