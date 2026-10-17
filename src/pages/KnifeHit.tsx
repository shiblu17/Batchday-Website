import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import GameLeaderboard from "@/components/GameLeaderboard";
import GameLoginModal from "@/components/GameLoginModal";
import { triggerConfetti } from "@/utils/confetti";
import { ArrowLeft, RotateCcw, Trophy, Volume2, VolumeX, Maximize, Minimize, Sparkles } from "lucide-react";

// Web Audio API Sound Controller
class SoundController {
  ctx: AudioContext | null = null;
  enabled: boolean = true;

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playThrow() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  playHit() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;

      // Wood thud
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);

      // Wood snap click noise
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25, now);
      noise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
    } catch (e) {}
  }

  playClash() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const freqs = [1200, 1850, 2600, 3400];
      freqs.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      });
    } catch (e) {}
  }

  playApple() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.18);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {}
  }

  playBreak() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.35);

      gain.gain.setValueAtTime(0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  playGameOver() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.5);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {}
  }
}

// Particle System
class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  initialLife: number;
  life: number;
  type: string;
  rotation: number;
  rotSpeed: number;

  constructor(x: number, y: number, vx: number, vy: number, color: string, size: number, life: number, type = "square") {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.initialLife = life;
    this.life = life;
    this.type = type;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 10;
  }

  update(dt: number) {
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.vy += 0.35 * dt * 60;
    this.rotation += this.rotSpeed * dt;
    this.life -= dt;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.life <= 0) return;
    const alpha = Math.max(0, this.life / this.initialLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;

    if (this.type === "circle") {
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    }
    ctx.restore();
  }
}

// Broken Log Chunk (for stage completion explosion)
class LogChunk {
  x: number;
  y: number;
  radius: number;
  startAngle: number;
  endAngle: number;
  color: string;
  boss: boolean;
  vx: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
  life: number;
  initialLife: number;

  constructor(x: number, y: number, radius: number, startAngle: number, endAngle: number, color: string, boss = false) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    this.color = color;
    this.boss = boss;

    const midAngle = (startAngle + endAngle) / 2;
    const speed = 4 + Math.random() * 4;
    this.vx = Math.cos(midAngle) * speed;
    this.vy = Math.sin(midAngle) * speed - 3;
    this.rotation = 0;
    this.rotSpeed = (Math.random() - 0.5) * 8;
    this.life = 1.2;
    this.initialLife = 1.2;
  }

  update(dt: number) {
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.vy += 0.5 * dt * 60;
    this.rotation += this.rotSpeed * dt;
    this.life -= dt;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life / this.initialLife);
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, this.radius, this.startAngle, this.endAngle);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#2b1d0c";
    ctx.stroke();

    ctx.restore();
  }
}

// Falling Sliced Apple Halves
class SlicedApplePiece {
  x: number;
  y: number;
  side: number;
  vx: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
  life: number;

  constructor(x: number, y: number, side: number) {
    this.x = x;
    this.y = y;
    this.side = side;
    this.vx = side * (2 + Math.random() * 2);
    this.vy = -3 - Math.random() * 2;
    this.rotation = 0;
    this.rotSpeed = side * (5 + Math.random() * 5);
    this.life = 1.0;
  }

  update(dt: number) {
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.vy += 0.45 * dt * 60;
    this.rotation += this.rotSpeed * dt;
    this.life -= dt;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    ctx.beginPath();
    ctx.arc(
      0,
      0,
      14,
      this.side === -1 ? Math.PI / 2 : -Math.PI / 2,
      this.side === -1 ? (3 * Math.PI) / 2 : Math.PI / 2
    );
    ctx.fillStyle = "#ff3838";
    ctx.fill();

    ctx.fillStyle = "#fff9d2";
    ctx.fillRect(this.side === -1 ? 0 : -3, -12, 3, 24);

    ctx.restore();
  }
}

// Deflected Knife on Clash
class DeflectedKnife {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotSpeed: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 8;
    this.vy = 4 + Math.random() * 3;
    this.rotation = 0;
    this.rotSpeed = (Math.random() > 0.5 ? 1 : -1) * 12;
  }

  update(dt: number) {
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.vy += 0.55 * dt * 60;
    this.rotation += this.rotSpeed * dt;
  }

  draw(ctx: CanvasRenderingContext2D, length: number, width: number) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    drawKnifeGraphic(ctx, 0, 0, length, width);
    ctx.restore();
  }
}

// Procedural Realistic Knife Graphic
function drawKnifeGraphic(ctx: CanvasRenderingContext2D, x: number, y: number, length: number, width: number) {
  ctx.save();
  ctx.translate(x, y);

  const halfW = width / 2;
  const hiltL = length * 0.38;

  // Blade Shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.moveTo(3, -length);
  ctx.lineTo(halfW + 3, -hiltL);
  ctx.lineTo(-halfW + 3, -hiltL);
  ctx.closePath();
  ctx.fill();

  // Blade
  const bladeGrad = ctx.createLinearGradient(-halfW, 0, halfW, 0);
  bladeGrad.addColorStop(0, "#e6e9f0");
  bladeGrad.addColorStop(0.48, "#ffffff");
  bladeGrad.addColorStop(0.52, "#bcc5cf");
  bladeGrad.addColorStop(1, "#8b97a5");

  ctx.fillStyle = bladeGrad;
  ctx.beginPath();
  ctx.moveTo(0, -length);
  ctx.lineTo(halfW, -hiltL);
  ctx.lineTo(-halfW, -hiltL);
  ctx.closePath();
  ctx.fill();

  // Blade Center Bevel Line
  ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -length);
  ctx.lineTo(0, -hiltL);
  ctx.stroke();

  // Crossguard
  ctx.fillStyle = "#4a5568";
  ctx.beginPath();
  ctx.roundRect(-halfW * 1.3, -hiltL - 3, width * 1.3, 6, 2);
  ctx.fill();

  // Handle
  const handleGrad = ctx.createLinearGradient(-halfW * 0.7, 0, halfW * 0.7, 0);
  handleGrad.addColorStop(0, "#5a3825");
  handleGrad.addColorStop(0.5, "#8c502b");
  handleGrad.addColorStop(1, "#3e2417");

  ctx.fillStyle = handleGrad;
  ctx.beginPath();
  ctx.roundRect(-halfW * 0.75, -hiltL + 3, width * 0.75, hiltL - 5, 3);
  ctx.fill();

  // Handle Rivets (Brass Dots)
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.arc(0, -hiltL + 12, 1.8, 0, Math.PI * 2);
  ctx.arc(0, -hiltL + 24, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Pommel
  ctx.fillStyle = "#4a5568";
  ctx.beginPath();
  ctx.roundRect(-halfW * 0.9, -2, width * 0.9, 5, 2);
  ctx.fill();

  ctx.restore();
}

// Procedural Apple Graphic
function drawAppleGraphic(ctx: CanvasRenderingContext2D, x: number, y: number, radius = 13) {
  ctx.save();
  ctx.translate(x, y);

  // Apple Body
  const grad = ctx.createRadialGradient(-3, -3, 2, 0, 0, radius);
  grad.addColorStop(0, "#ff6b6b");
  grad.addColorStop(0.7, "#ee2727");
  grad.addColorStop(1, "#990000");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(-radius * 0.35, 0, radius * 0.75, 0, Math.PI * 2);
  ctx.arc(radius * 0.35, 0, radius * 0.75, 0, Math.PI * 2);
  ctx.fill();

  // Stem
  ctx.strokeStyle = "#4e3629";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -radius * 0.5);
  ctx.quadraticCurveTo(3, -radius * 1.1, 6, -radius * 1.3);
  ctx.stroke();

  // Leaf
  ctx.fillStyle = "#2ecc71";
  ctx.beginPath();
  ctx.ellipse(4, -radius * 1.0, 5, 2.5, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  // Shine Highlight
  ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
  ctx.beginPath();
  ctx.ellipse(-radius * 0.35, -radius * 0.35, 3, 1.8, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function normalizeAngle(a: number) {
  while (a <= -Math.PI) a += Math.PI * 2;
  while (a > Math.PI) a -= Math.PI * 2;
  return a;
}

export default function KnifeHit() {
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [stage, setStage] = useState(1);
  const [apples, setApples] = useState(0);
  const [knivesRemaining, setKnivesRemaining] = useState(7);
  const [knivesTotal, setKnivesTotal] = useState(7);
  const [nickname, setNickname] = useState(() => localStorage.getItem("ju_game_nickname_v2") || "Player");
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameId = useRef<number>();
  const soundRef = useRef<SoundController>(new SoundController());
  const hasSubmittedScore = useRef(false);

  // Engine Refs
  const logRef = useRef({
    x: 200,
    y: 190,
    radius: 65,
    rotation: 0,
    speed: 0.03,
    targetSpeed: 0.03,
    accelTimer: 0,
    joltY: 0,
    isBoss: false,
    name: "WOOD",
  });

  const knifeLength = 62;
  const knifeWidth = 14;
  const readyKnifeRef = useRef<{ x: number; y: number; scale: number } | null>(null);
  const thrownKnivesRef = useRef<{ x: number; y: number; speed: number }[]>([]);
  const embeddedKnivesRef = useRef<{ angle: number }[]>([]);
  const applesOnLogRef = useRef<{ angle: number; sliced: boolean }[]>([]);
  const deflectedKnifeRef = useRef<DeflectedKnife | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const logChunksRef = useRef<LogChunk[]>([]);
  const slicedApplesRef = useRef<SlicedApplePiece[]>([]);
  const screenShakeRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const currentStageRef = useRef(1);
  const knivesRemainingRef = useRef(7);

  // Load Highscore & Apples from local storage
  useEffect(() => {
    const savedBest = parseInt(localStorage.getItem("knifehit_best_score") || "0", 10);
    const savedApples = parseInt(localStorage.getItem("knifehit_apples") || "0", 10);
    const savedNick = localStorage.getItem("ju_game_nickname_v2") || "";
    setHighScore(savedBest);
    setApples(savedApples);
    if (savedNick) setNickname(savedNick);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const toggleSound = () => {
    const sound = soundRef.current;
    sound.init();
    sound.enabled = !sound.enabled;
    setIsMuted(!sound.enabled);
  };

  const updateDimensions = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);

    canvasRef.current.width = w * dpr;
    canvasRef.current.height = h * dpr;
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    logRef.current.x = w / 2;
    logRef.current.y = Math.min(230, h * 0.28);

    if (readyKnifeRef.current) {
      readyKnifeRef.current.x = w / 2;
      readyKnifeRef.current.y = h - 90;
    }
  }, []);

  useEffect(() => {
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [updateDimensions]);

  const initKnife = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    const w = rect ? rect.width : 400;
    const h = rect ? rect.height : 650;
    readyKnifeRef.current = {
      x: w / 2,
      y: h - 90,
      scale: 1,
    };
  }, []);

  const loadStage = useCallback((stageNum: number) => {
    currentStageRef.current = stageNum;
    setStage(stageNum);
    embeddedKnivesRef.current = [];
    applesOnLogRef.current = [];
    thrownKnivesRef.current = [];
    deflectedKnifeRef.current = null;
    initKnife();

    const isBoss = stageNum % 5 === 0;
    const log = logRef.current;
    log.isBoss = isBoss;
    log.rotation = 0;
    log.radius = isBoss ? 75 : 65;

    let total = 7;
    if (isBoss) {
      log.name = "BOSS CHEESE";
      total = 10;
      log.speed = 0.04;
      log.targetSpeed = 0.04;
      embeddedKnivesRef.current.push({ angle: 0 });
      embeddedKnivesRef.current.push({ angle: Math.PI });
    } else {
      log.name = "WOOD";
      const stageInCycle = ((stageNum - 1) % 5) + 1;
      total = 6 + stageInCycle;
      log.speed = 0.025 + stageInCycle * 0.005;
      log.targetSpeed = log.speed;

      const preKnives = Math.min(3, Math.floor((stageInCycle - 1) * 0.8));
      for (let i = 0; i < preKnives; i++) {
        const randAngle = ((Math.PI * 2) / preKnives) * i + (Math.random() - 0.5) * 0.5;
        embeddedKnivesRef.current.push({ angle: randAngle });
      }

      if (Math.random() < 0.65) {
        const appleAngle = Math.random() * Math.PI * 2;
        let safe = true;
        for (const k of embeddedKnivesRef.current) {
          if (Math.abs(normalizeAngle(k.angle - appleAngle)) < 0.4) {
            safe = false;
            break;
          }
        }
        if (safe) {
          applesOnLogRef.current.push({ angle: appleAngle, sliced: false });
        }
      }
    }

    setKnivesTotal(total);
    setKnivesRemaining(total);
    knivesRemainingRef.current = total;
  }, [initKnife]);

  const throwKnife = useCallback(() => {
    if (!readyKnifeRef.current || knivesRemainingRef.current <= 0 || gameState !== "playing") return;

    soundRef.current.playThrow();
    thrownKnivesRef.current.push({
      x: readyKnifeRef.current.x,
      y: readyKnifeRef.current.y,
      speed: 38,
    });

    const remaining = knivesRemainingRef.current - 1;
    knivesRemainingRef.current = remaining;
    setKnivesRemaining(remaining);

    if (remaining > 0) {
      const rect = containerRef.current?.getBoundingClientRect();
      const w = rect ? rect.width : 400;
      const h = rect ? rect.height : 650;
      readyKnifeRef.current = {
        x: w / 2,
        y: h - 90,
        scale: 0.5,
      };
    } else {
      readyKnifeRef.current = null;
    }
  }, [gameState]);

  const triggerClash = useCallback((knife: { x: number; y: number }) => {
    soundRef.current.playClash();
    screenShakeRef.current = 16;
    deflectedKnifeRef.current = new DeflectedKnife(knife.x, knife.y);

    // Sparks
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      particlesRef.current.push(
        new Particle(
          knife.x,
          knife.y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          Math.random() > 0.4 ? "#ffffff" : "#ffd166",
          2.5 + Math.random() * 2,
          0.5 + Math.random() * 0.3,
          "circle"
        )
      );
    }

    soundRef.current.playGameOver();
    setTimeout(() => {
      setGameState("gameover");
    }, 600);
  }, []);

  const triggerStageClear = useCallback(() => {
    soundRef.current.playBreak();
    screenShakeRef.current = 12;

    const log = logRef.current;
    const chunkCount = 8;
    const arc = (Math.PI * 2) / chunkCount;
    for (let i = 0; i < chunkCount; i++) {
      const startAngle = i * arc;
      const endAngle = (i + 1) * arc;
      const chunkColor = log.isBoss ? "#f6b93b" : "#6b4423";
      logChunksRef.current.push(
        new LogChunk(log.x, log.y, log.radius, startAngle, endAngle, chunkColor, log.isBoss)
      );
    }

    for (const k of embeddedKnivesRef.current) {
      const worldAngle = k.angle + log.rotation;
      const kx = log.x + Math.cos(worldAngle) * (log.radius - 10);
      const ky = log.y + Math.sin(worldAngle) * (log.radius - 10);
      const defl = new DeflectedKnife(kx, ky);
      defl.vx = Math.cos(worldAngle) * (6 + Math.random() * 4);
      defl.vy = Math.sin(worldAngle) * (6 + Math.random() * 4) - 2;
      particlesRef.current.push(defl as any);
    }

    embeddedKnivesRef.current = [];

    setTimeout(() => {
      loadStage(currentStageRef.current + 1);
    }, 850);
  }, [loadStage]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isMounted = true;
    lastTimeRef.current = performance.now();

    const drawLogTarget = (x: number, y: number, radius: number, isBoss: boolean) => {
      if (isBoss) {
        // Boss Cheese Wheel Target
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = "#f6b93b";
        ctx.fill();
        ctx.lineWidth = 6;
        ctx.strokeStyle = "#e58e26";
        ctx.stroke();

        const holes = [
          { hx: -25, hy: -18, r: 10 },
          { hx: 22, hy: -28, r: 12 },
          { hx: -15, hy: 26, r: 14 },
          { hx: 32, hy: 15, r: 9 },
          { hx: 2, hy: 0, r: 11 },
        ];
        ctx.fillStyle = "#e58e26";
        holes.forEach((h) => {
          ctx.beginPath();
          ctx.arc(h.hx, h.hy, h.r, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        // Wooden Log Target with bark & concentric rings
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = "#4a2f1b";
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#2d1c0f";
        ctx.stroke();

        const woodGrad = ctx.createRadialGradient(x, y, 4, x, y, radius - 4);
        woodGrad.addColorStop(0, "#be8a56");
        woodGrad.addColorStop(0.5, "#a67240");
        woodGrad.addColorStop(0.85, "#85552b");
        woodGrad.addColorStop(1, "#613b1b");

        ctx.beginPath();
        ctx.arc(x, y, radius - 4, 0, Math.PI * 2);
        ctx.fillStyle = woodGrad;
        ctx.fill();

        ctx.strokeStyle = "rgba(74, 47, 27, 0.35)";
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.arc(x, y, radius * 0.72, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, radius * 0.46, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, radius * 0.22, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#4a2f1b";
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(45, 28, 15, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + radius * 0.8, y + radius * 0.2);
        ctx.stroke();
      }
    };

    const loop = (timestamp: number) => {
      if (!isMounted) return;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      // Update Screen Shake
      if (screenShakeRef.current > 0) {
        screenShakeRef.current = Math.max(0, screenShakeRef.current - dt * 45);
      }

      // Ready Knife Animation
      if (readyKnifeRef.current && readyKnifeRef.current.scale < 1) {
        readyKnifeRef.current.scale = Math.min(1, readyKnifeRef.current.scale + dt * 8);
      }

      // Log Target Dynamics
      const log = logRef.current;
      log.accelTimer += dt;
      if (log.accelTimer > 2.5) {
        log.accelTimer = 0;
        const dir = Math.random() > 0.35 ? 1 : -1;
        const speedMag = 0.02 + Math.random() * 0.045;
        log.targetSpeed = dir * speedMag;
      }
      log.speed += (log.targetSpeed - log.speed) * dt * 4;
      log.rotation += log.speed * dt * 60;

      if (log.joltY < 0) {
        log.joltY = Math.min(0, log.joltY + dt * 40);
      }

      // Update Thrown Knives
      for (let i = thrownKnivesRef.current.length - 1; i >= 0; i--) {
        const knife = thrownKnivesRef.current[i];
        knife.y -= knife.speed * dt * 60;

        const targetEdgeY = log.y + log.joltY + log.radius + knifeLength * 0.42;

        if (knife.y <= targetEdgeY) {
          thrownKnivesRef.current.splice(i, 1);

          const hitWorldAngle = Math.PI / 2;
          const relativeHitAngle = normalizeAngle(hitWorldAngle - log.rotation);

          // Collision Check
          let hasClashed = false;
          const minAngleThreshold = 0.22;

          for (const embedded of embeddedKnivesRef.current) {
            const angleDiff = Math.abs(normalizeAngle(embedded.angle - relativeHitAngle));
            if (angleDiff < minAngleThreshold) {
              hasClashed = true;
              break;
            }
          }

          if (hasClashed) {
            triggerClash(knife);
            break;
          }

          // Hit Success!
          soundRef.current.playHit();
          setScore((s) => s + 1);
          log.joltY = -6;
          screenShakeRef.current = 4;

          embeddedKnivesRef.current.push({ angle: relativeHitAngle });

          // Splinter Particles
          for (let p = 0; p < 12; p++) {
            const vx = (Math.random() - 0.5) * 6;
            const vy = (Math.random() - 0.2) * 5;
            const color = log.isBoss ? "#f6b93b" : "#8d5524";
            particlesRef.current.push(new Particle(log.x, log.y + log.radius, vx, vy, color, 3 + Math.random() * 3, 0.4));
          }

          // Apple Check
          for (let a = applesOnLogRef.current.length - 1; a >= 0; a--) {
            const apple = applesOnLogRef.current[a];
            if (!apple.sliced) {
              const appleAngleDiff = Math.abs(normalizeAngle(apple.angle - relativeHitAngle));
              if (appleAngleDiff < 0.25) {
                apple.sliced = true;
                setApples((ap) => {
                  const nextAp = ap + 2;
                  localStorage.setItem("knifehit_apples", nextAp.toString());
                  return nextAp;
                });
                setScore((s) => s + 2);
                soundRef.current.playApple();

                const worldAngle = apple.angle + log.rotation;
                const ax = log.x + Math.cos(worldAngle) * (log.radius + 12);
                const ay = log.y + Math.sin(worldAngle) * (log.radius + 12);

                slicedApplesRef.current.push(new SlicedApplePiece(ax, ay, -1));
                slicedApplesRef.current.push(new SlicedApplePiece(ax, ay, 1));

                for (let j = 0; j < 14; j++) {
                  const jAngle = Math.random() * Math.PI * 2;
                  const jSpeed = 2 + Math.random() * 5;
                  particlesRef.current.push(
                    new Particle(ax, ay, Math.cos(jAngle) * jSpeed, Math.sin(jAngle) * jSpeed, "#ff3838", 3, 0.45, "circle")
                  );
                }
              }
            }
          }

          // Stage Clear Check
          if (knivesRemainingRef.current === 0) {
            triggerStageClear();
          }
        }
      }

      // Update Deflected Knife
      if (deflectedKnifeRef.current) {
        deflectedKnifeRef.current.update(dt);
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const viewW = canvas.width / dpr;
      const viewH = canvas.height / dpr;

      // Update Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.update(dt);
        if (p.life <= 0 || p.y > viewH + 50) {
          particlesRef.current.splice(i, 1);
        }
      }

      // Update Log Chunks
      for (let i = logChunksRef.current.length - 1; i >= 0; i--) {
        const chunk = logChunksRef.current[i];
        chunk.update(dt);
        if (chunk.life <= 0) {
          logChunksRef.current.splice(i, 1);
        }
      }

      // Update Sliced Apples
      for (let i = slicedApplesRef.current.length - 1; i >= 0; i--) {
        const piece = slicedApplesRef.current[i];
        piece.update(dt);
        if (piece.life <= 0) {
          slicedApplesRef.current.splice(i, 1);
        }
      }

      // === RENDER ===
      ctx.clearRect(0, 0, viewW, viewH);

      ctx.save();
      if (screenShakeRef.current > 0) {
        const shakeX = (Math.random() - 0.5) * screenShakeRef.current;
        const shakeY = (Math.random() - 0.5) * screenShakeRef.current;
        ctx.translate(shakeX, shakeY);
      }

      // 1. Draw Rotating Log & Elements
      if (logChunksRef.current.length === 0) {
        const logCenterY = log.y + log.joltY;
        ctx.save();
        ctx.translate(log.x, logCenterY);
        ctx.rotate(log.rotation);

        // Embedded Knives
        for (const k of embeddedKnivesRef.current) {
          ctx.save();
          ctx.rotate(k.angle - Math.PI / 2);
          drawKnifeGraphic(ctx, 0, log.radius + knifeLength * 0.42, knifeLength, knifeWidth);
          ctx.restore();
        }

        // Apples on Log
        for (const apple of applesOnLogRef.current) {
          if (!apple.sliced) {
            ctx.save();
            ctx.rotate(apple.angle - Math.PI / 2);
            drawAppleGraphic(ctx, 0, log.radius + 12);
            ctx.restore();
          }
        }

        // Target Body
        drawLogTarget(0, 0, log.radius, log.isBoss);
        ctx.restore();
      }

      // 2. Shattered Log Chunks
      for (const chunk of logChunksRef.current) {
        chunk.draw(ctx);
      }

      // 3. Sliced Apple Pieces
      for (const applePiece of slicedApplesRef.current) {
        applePiece.draw(ctx);
      }

      // 4. Particles
      for (const p of particlesRef.current) {
        if ("draw" in p) {
          p.draw(ctx, knifeLength, knifeWidth);
        }
      }

      // 5. Thrown Knives in Flight
      for (const k of thrownKnivesRef.current) {
        drawKnifeGraphic(ctx, k.x, k.y, knifeLength, knifeWidth);
      }

      // 6. Deflected Knife
      if (deflectedKnifeRef.current) {
        deflectedKnifeRef.current.draw(ctx, knifeLength, knifeWidth);
      }

      // 7. Ready Knife at Bottom
      if (readyKnifeRef.current && gameState === "playing") {
        ctx.save();
        ctx.translate(readyKnifeRef.current.x, readyKnifeRef.current.y);
        ctx.scale(readyKnifeRef.current.scale, readyKnifeRef.current.scale);
        drawKnifeGraphic(ctx, 0, 0, knifeLength, knifeWidth);
        ctx.restore();
      }

      ctx.restore();

      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);

    return () => {
      isMounted = false;
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [gameState, triggerClash, triggerStageClear]);

  // Handle Game Over & High Score Submission
  useEffect(() => {
    if (gameState === "gameover" && !hasSubmittedScore.current) {
      hasSubmittedScore.current = true;

      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("knifehit_best_score", score.toString());
        triggerConfetti();
      }

      const submit = async () => {
        try {
          await supabase.from("game_scores").insert({
            nickname: nickname.trim().substring(0, 40) || "Player",
            game_name: "knife_hit_v1",
            score: score,
          });
        } catch (err) {
          console.error("Score submit error", err);
        }
      };
      submit();
    }
  }, [gameState, score, nickname, highScore]);

  const handleStartGame = (name?: string) => {
    soundRef.current.init();
    const finalName = (name || nickname || "Player").trim().substring(0, 40);
    setNickname(finalName);
    localStorage.setItem("ju_game_nickname_v2", finalName);
    setGameState("playing");
    hasSubmittedScore.current = false;
    setScore(0);
    loadStage(1);
  };

  const restartGame = () => {
    soundRef.current.init();
    setGameState("playing");
    hasSubmittedScore.current = false;
    setScore(0);
    loadStage(1);
  };

  // Keyboard Spacebar Controls (matches clone)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        soundRef.current.init();
        if (gameState === "playing") {
          throwKnife();
        } else if (gameState === "start") {
          handleStartGame(nickname);
        } else if (gameState === "gameover") {
          restartGame();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, nickname, throwKnife]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-[#11141a] text-white flex items-center justify-center overflow-hidden select-none z-50">
      {/* Game Container (Fills 100% on mobile, max 440px on desktop) */}
      <div
        ref={containerRef}
        id="game-container"
        className="relative w-full h-full sm:max-w-[440px] sm:max-h-[820px] sm:rounded-3xl sm:border sm:border-white/10 sm:shadow-2xl overflow-hidden bg-[radial-gradient(circle_at_50%_30%,#1e2638_0%,#0d1117_100%)] flex items-center justify-center cursor-pointer"
        onPointerDown={(e) => {
          if (
            (e.target as HTMLElement).closest("button") ||
            (e.target as HTMLElement).closest("a") ||
            (e.target as HTMLElement).closest("[role='dialog']")
          ) {
            return;
          }
          e.preventDefault();
          soundRef.current.init();
          if (gameState === "playing") {
            throwKnife();
          }
        }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* --- IN-SCREEN UI OVERLAYS --- */}

        {/* 1. In-Screen Top Header Bar */}
        <div className="absolute top-4 sm:top-5 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
          {/* Top-Left: Back Arrow & Ketchapp Bold Score */}
          <div className="flex items-center gap-3">
            <Link
              to="/game"
              onClick={(e) => e.stopPropagation()}
              className="w-10 h-10 rounded-2xl bg-black/40 hover:bg-black/70 active:scale-95 backdrop-blur-md border border-white/10 text-white/80 hover:text-white shadow-lg flex items-center justify-center transition-all pointer-events-auto"
              title="গেম জোন"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="text-3xl sm:text-4xl font-black font-mono text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] tracking-tight">
              {score}
            </div>
          </div>

          {/* Top-Center: Stage & Ketchapp Stage Dots */}
          <div className="flex flex-col items-center">
            <span
              className={`text-xs sm:text-sm font-black tracking-widest uppercase mb-1 drop-shadow ${
                stage % 5 === 0 ? "text-[#ff4757]" : "text-[#ff9f43]"
              }`}
            >
              {stage % 5 === 0 ? "BOSS LEVEL" : `STAGE ${stage}`}
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((dot) => {
                const currentInFive = ((stage - 1) % 5) + 1;
                const isBoss = dot === 5;
                const isActive = dot <= currentInFive;
                return (
                  <div
                    key={dot}
                    className={`rounded-full transition-all duration-300 ${
                      isBoss
                        ? "w-2.5 h-2.5 bg-[#ff4757] shadow-[0_0_8px_#ff4757]"
                        : isActive
                        ? "w-2 h-2 bg-[#ff9f43] shadow-[0_0_6px_#ff9f43]"
                        : "w-2 h-2 bg-white/20"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Top-Right: Apple Counter Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-lg pointer-events-auto">
            <span className="text-base leading-none">🍎</span>
            <span className="font-bold text-white text-sm tracking-wide">{apples}</span>
          </div>
        </div>

        {/* 2. Floating Action Column Inside Screen (Right Side) */}
        <div className="absolute top-20 right-4 flex flex-col items-center gap-2.5 pointer-events-none z-20">
          {/* Leaderboard Button with dedicated text label icon as requested */}
          <GameLeaderboard gameName="knife_hit_v1">
            <button
              onClick={(e) => e.stopPropagation()}
              className="group flex flex-col items-center justify-center w-11 h-12 rounded-2xl bg-black/45 hover:bg-black/75 active:scale-95 backdrop-blur-md border border-amber-500/40 hover:border-amber-400 text-amber-400 shadow-xl shadow-amber-500/10 transition-all pointer-events-auto"
              title="লিডারবোর্ড"
            >
              <Trophy className="w-5 h-5 drop-shadow group-hover:scale-110 transition-transform" />
              <span className="text-[8px] font-black text-amber-300 uppercase tracking-tighter leading-none mt-0.5">
                লিডারবোর্ড
              </span>
            </button>
          </GameLeaderboard>

          {/* Sound Toggle Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSound();
            }}
            className="flex items-center justify-center w-11 h-11 rounded-2xl bg-black/45 hover:bg-black/75 active:scale-95 backdrop-blur-md border border-white/10 text-white shadow-xl transition-all pointer-events-auto"
            title={isMuted ? "সাউন্ড অন করুন" : "সাউন্ড মিউট করুন"}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-red-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-emerald-400" />
            )}
          </button>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="flex items-center justify-center w-11 h-11 rounded-2xl bg-black/45 hover:bg-black/75 active:scale-95 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white shadow-xl transition-all pointer-events-auto"
            title="ফুলস্ক্রিন"
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5 text-sky-400" />
            ) : (
              <Maximize className="w-5 h-5 text-sky-400" />
            )}
          </button>
        </div>

        {/* 3. Left Knife Stack Indicator (Ketchapp Bottom-Left) */}
        <div className="absolute left-4 bottom-6 flex flex-col-reverse gap-1 pointer-events-none z-10">
          {[...Array(knivesTotal)].map((_, i) => {
            const isUsed = i >= knivesRemaining;
            return (
              <div
                key={i}
                className={`w-3.5 h-6 transition-all duration-200 ${
                  isUsed
                    ? "opacity-15 grayscale"
                    : "opacity-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                }`}
                style={{
                  background: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 60"><polygon points="10,0 18,12 14,40 10,42 6,40 2,12" fill="%23e0e0e0"/><rect x="7" y="42" width="6" height="18" rx="2" fill="%238d5524"/></svg>') no-repeat center`,
                  backgroundSize: "contain",
                }}
              />
            );
          })}
        </div>

        {/* 4. Start Screen (Ketchapp Authentic Clone) */}
        {gameState === "start" && (
          <div className="absolute inset-0 bg-[#0d1117]/85 backdrop-blur-md flex flex-col items-center justify-center p-6 z-30">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center text-center max-w-xs"
            >
              <h1 className="text-5xl sm:text-6xl font-black text-white tracking-widest leading-none mb-2 drop-shadow-[0_4px_25px_rgba(255,159,67,0.4)]">
                KNIFE<br />
                <span className="text-[#ff9f43]">HIT</span>
              </h1>
              <p className="text-xs sm:text-sm text-white/50 tracking-[0.25em] font-semibold mb-8 uppercase">
                TAP OR SPACE TO THROW
              </p>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartGame(nickname);
                }}
                className="px-14 py-4 rounded-full bg-gradient-to-r from-[#ff9f43] to-[#ff5252] text-white font-black text-lg tracking-widest shadow-[0_6px_25px_rgba(255,82,82,0.5)] hover:scale-105 active:scale-95 transition-all mb-6 pointer-events-auto"
              >
                PLAY
              </button>

              {/* Player Profile Badge */}
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 pointer-events-auto">
                <span>
                  প্লেয়ার: <strong className="text-white">{nickname || "Player"}</strong>
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLoginModal(true);
                  }}
                  className="text-amber-400 hover:text-amber-300 font-bold underline ml-1"
                >
                  পরিবর্তন
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 5. Game Over Screen (Ketchapp Authentic Clone) */}
        {gameState === "gameover" && (
          <div className="absolute inset-0 bg-[#0d1117]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 z-30">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-xs text-center"
            >
              <h2 className="text-3xl sm:text-4xl font-black text-[#ff4757] mb-2 tracking-widest drop-shadow-[0_2px_15px_rgba(255,71,87,0.5)]">
                GAME OVER
              </h2>
              <p className="text-xs text-slate-400 mb-6 font-medium">
                আগের ছুরির ফাঁকা জায়গায় নিখুঁত নিশানা করো
              </p>

              <div className="bg-[#161b26] border border-white/10 rounded-2xl p-5 mb-5 shadow-2xl space-y-3">
                <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    SCORE
                  </span>
                  <span className="text-2xl font-black text-white font-mono">{score}</span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" /> BEST SCORE
                  </span>
                  <span className="text-xl font-black text-amber-400 font-mono">
                    {Math.max(score, highScore)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    STAGE REACHED
                  </span>
                  <span className="text-base font-black text-sky-400 font-mono">
                    STAGE {stage}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pointer-events-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    restartGame();
                  }}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff9f43] to-[#ee5253] text-white font-black text-base shadow-xl shadow-red-500/30 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  RESTART
                </button>

                <GameLeaderboard gameName="knife_hit_v1">
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="w-full py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 text-amber-400 font-bold text-sm shadow flex items-center justify-center gap-2 transition-all"
                  >
                    <Trophy className="w-4 h-4 text-amber-400" />
                    লিডারবোর্ড দেখুন
                  </button>
                </GameLeaderboard>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Login / Change Profile Modal */}
      {showLoginModal && (
        <GameLoginModal
          gameTitle="নাইফ হিট (Knife Hit)"
          onStart={(name) => {
            const finalName = name.trim().substring(0, 40) || "Player";
            setNickname(finalName);
            localStorage.setItem("ju_game_nickname_v2", finalName);
            setShowLoginModal(false);
          }}
        />
      )}
    </div>
  );
}
