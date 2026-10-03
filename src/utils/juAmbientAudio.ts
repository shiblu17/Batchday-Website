// Procedural Web Audio Ambient Sound Generator for JU 700 Acres
// No external MP3 downloads needed - 100% synthesized, offline-ready, zero latency

type AmbientTrack = "rain" | "birds" | "tea" | "night" | "wind";

class JuAmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private currentTrack: AmbientTrack | null = null;
  private activeNodes: { stop?: () => void; disconnect?: () => void }[] = [];
  private timerIds: number[] = [];

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    if (this.masterGain && this.ctx) {
      const clamped = Math.max(0, Math.min(1, val));
      this.masterGain.gain.linearRampToValueAtTime(clamped, this.ctx.currentTime + 0.1);
    }
  }

  public stop() {
    this.timerIds.forEach((id) => window.clearTimeout(id));
    this.timerIds = [];
    this.activeNodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch {
        // ignore cleanup errors
      }
    });
    this.activeNodes = [];
    this.isPlaying = false;
    this.currentTrack = null;
  }

  public play(track: AmbientTrack) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (this.isPlaying && this.currentTrack === track) {
      this.stop();
      return;
    }

    this.stop();
    this.isPlaying = true;
    this.currentTrack = track;

    switch (track) {
      case "rain":
        this.startRainAmbience();
        break;
      case "birds":
        this.startBirdsAmbience();
        break;
      case "tea":
        this.startTeaAmbience();
        break;
      case "night":
        this.startNightMelody();
        break;
      case "wind":
        this.startWindAmbience();
        break;
    }
  }

  public getStatus() {
    return {
      isPlaying: this.isPlaying,
      currentTrack: this.currentTrack,
    };
  }

  // Pink noise generator for soothing rain / wind
  private createNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error("AudioContext not ready");
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  // 1. Rain over Muktamancha
  private startRainAmbience() {
    if (!this.ctx || !this.masterGain) return;
    const noiseBuffer = this.createNoiseBuffer();
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noiseSource.start();
    this.activeNodes.push(noiseSource, filter, gain);

    // Occasional gentle thunder / water droplets
    const scheduleDroplet = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const dropGain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      const freq = 1200 + Math.random() * 600;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);

      dropGain.gain.setValueAtTime(0.04, now);
      dropGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(dropGain);
      dropGain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.15);

      const delay = 400 + Math.random() * 800;
      const tid = window.setTimeout(scheduleDroplet, delay);
      this.timerIds.push(tid);
    };
    scheduleDroplet();
  }

  // 2. Migratory Birds at JU Lake
  private startBirdsAmbience() {
    if (!this.ctx || !this.masterGain) return;

    // Gentle wind backdrop
    const noiseBuffer = this.createNoiseBuffer();
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(350, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    const windGain = this.ctx.createGain();
    windGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(windGain);
    windGain.connect(this.masterGain);
    noiseSource.start();
    this.activeNodes.push(noiseSource, filter, windGain);

    // Chirping birds
    const scheduleBirdChirp = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      const baseFreq = 2200 + Math.random() * 1200;
      const count = Math.floor(2 + Math.random() * 4);

      for (let i = 0; i < count; i++) {
        const osc = this.ctx.createOscillator();
        const chirpGain = this.ctx.createGain();
        const t = now + i * 0.08;

        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.frequency.linearRampToValueAtTime(baseFreq + (Math.random() * 400 - 200), t + 0.04);
        osc.frequency.exponentialRampToValueAtTime(baseFreq - 300, t + 0.07);

        chirpGain.gain.setValueAtTime(0.045, t);
        chirpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

        osc.connect(chirpGain);
        chirpGain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.07);
      }

      const nextDelay = 1200 + Math.random() * 2500;
      const tid = window.setTimeout(scheduleBirdChirp, nextDelay);
      this.timerIds.push(tid);
    };
    scheduleBirdChirp();
  }

  // 3. Bottola Tea Cup & Campus Adda
  private startTeaAmbience() {
    if (!this.ctx || !this.masterGain) return;

    // Warm cafe background murmur filter
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();
    noise.loop = true;

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = "lowpass";
    bpf.frequency.setValueAtTime(450, this.ctx.currentTime);

    const bgGain = this.ctx.createGain();
    bgGain.gain.setValueAtTime(0.14, this.ctx.currentTime);

    noise.connect(bpf);
    bpf.connect(bgGain);
    bgGain.connect(this.masterGain);
    noise.start();
    this.activeNodes.push(noise, bpf, bgGain);

    // Tea cup clinking & spoon sounds
    const scheduleClink = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const clinkGain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(3200 + Math.random() * 800, now);

      clinkGain.gain.setValueAtTime(0.06, now);
      clinkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(clinkGain);
      clinkGain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.18);

      const delay = 1500 + Math.random() * 3000;
      const tid = window.setTimeout(scheduleClink, delay);
      this.timerIds.push(tid);
    };
    scheduleClink();
  }

  // 4. Transport Night Guitar Melody
  private startNightMelody() {
    if (!this.ctx || !this.masterGain) return;

    // Pentatonic scale chords reminiscent of campus guitar addas (A minor / C major)
    const notes = [220, 261.63, 293.66, 329.63, 392.00, 440, 523.25];
    let noteIdx = 0;

    const schedulePluck = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      const freq = notes[noteIdx % notes.length] * (Math.random() > 0.6 ? 2 : 1);
      noteIdx = (noteIdx + 1 + Math.floor(Math.random() * 2)) % notes.length;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.2);

      const delay = 800 + Math.random() * 1200;
      const tid = window.setTimeout(schedulePluck, delay);
      this.timerIds.push(tid);
    };
    schedulePluck();
  }

  // 5. 700 Acres Deep Green Wind
  private startWindAmbience() {
    if (!this.ctx || !this.masterGain) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(250, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    // Gently modulate wind frequency for sweeping gusts
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(100, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start();
    this.activeNodes.push(noise, filter, lfo, lfoGain, gain);
  }
}

export const juAmbientEngine = new JuAmbientAudioEngine();
export type { AmbientTrack };
