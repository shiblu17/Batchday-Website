let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx || ctx.state === 'closed') {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

export function playPop() {
  try {
    const c = getCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g);
    g.connect(c.destination);
    o.type = 'sine';
    o.frequency.value = 800;
    g.gain.setValueAtTime(0.15, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
    o.start(c.currentTime);
    o.stop(c.currentTime + 0.08);
  } catch (e) {
    console.warn("Audio play failed:", e);
  }
}

export function playCapture() {
  try {
    const c = getCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g);
    g.connect(c.destination);
    o.type = 'sawtooth';
    o.frequency.value = 400;
    g.gain.setValueAtTime(0.12, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.25);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
    o.start(c.currentTime);
    o.stop(c.currentTime + 0.25);
  } catch (e) {
    console.warn("Audio play failed:", e);
  }
}

export function playFanfare() {
  try {
    const c = getCtx();
    [523, 659, 784, 1047].forEach((freq, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g);
      g.connect(c.destination);
      o.type = 'triangle';
      o.frequency.value = freq;
      const t = c.currentTime + i * 0.15;
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.start(t);
      o.stop(t + 0.3);
    });
  } catch (e) {
    console.warn("Audio play failed:", e);
  }
}
