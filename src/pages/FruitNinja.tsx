import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { supabase } from "@/integrations/supabase/client";
import GameLeaderboard from "@/components/GameLeaderboard";
import GameLoginModal from "@/components/GameLoginModal";
import { triggerConfetti } from "@/utils/confetti";
import { ArrowLeft, RotateCcw, Trophy, Volume2, VolumeX, Maximize, Minimize } from "lucide-react";

// ==========================================
// 1. Web Audio Sound Synthesizer (Zero Crash)
// ==========================================
class SoundSynth {
  ctx: AudioContext | null = null;
  enabled: boolean = true;

  init() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
    } catch (e) {
      console.warn("AudioContext init error:", e);
    }
  }

  playWhoosh() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(550, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.14);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1600, now);
      filter.frequency.exponentialRampToValueAtTime(250, now + 0.14);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch (e) {}
  }

  playToss() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.22);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {}
  }

  playSlice() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;

      // Katana metallic slice transient
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.09);
      oscGain.gain.setValueAtTime(0.3, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);

      // Wet juicy squelch
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.1);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.22));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(950, now);
      filter.Q.setValueAtTime(2.5, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
    } catch (e) {}
  }

  playCombo(count: number) {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const baseFreq = 440;
      const notes = [1, 1.25, 1.5, 1.75, 2.0];

      for (let i = 0; i < Math.min(count, notes.length); i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const timeOffset = now + i * 0.06;

        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq * notes[i], timeOffset);
        gain.gain.setValueAtTime(0.22, timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, timeOffset + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(timeOffset);
        osc.stop(timeOffset + 0.28);
      }
    } catch (e) {}
  }

  playBombExplosion() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;

      // Heavy bass shockwave
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(18, now + 0.7);

      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.7);

      // Noise blast
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.5);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.65, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      noise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
    } catch (e) {}
  }

  playMiss() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(170, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.25);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }
}

// ==========================================
// 2. High-Res Procedural Fruit Textures
// ==========================================
function createWatermelonPulpTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Texture();

  const radGrad = ctx.createRadialGradient(256, 256, 40, 256, 256, 250);
  radGrad.addColorStop(0, "#ff1744");
  radGrad.addColorStop(0.75, "#f50057");
  radGrad.addColorStop(0.9, "#ff5252");
  radGrad.addColorStop(0.96, "#f1f2f6");
  radGrad.addColorStop(1.0, "#10ac84");

  ctx.fillStyle = radGrad;
  ctx.beginPath();
  ctx.arc(256, 256, 250, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1e272e";
  const seedAngles = [0.35, 0.95, 1.55, 2.15, 2.75, 3.35, 3.95, 4.55, 5.15, 5.75];
  seedAngles.forEach((ang) => {
    const r = 135 + Math.sin(ang * 4) * 20;
    const sx = 256 + Math.cos(ang) * r;
    const sy = 256 + Math.sin(ang) * r;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(ang + Math.PI / 2);
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  return new THREE.CanvasTexture(canvas);
}

function createWatermelonSkinTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Texture();

  ctx.fillStyle = "#10ac84";
  ctx.fillRect(0, 0, 512, 256);

  ctx.fillStyle = "#065241";
  for (let x = 0; x < 512; x += 44) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    for (let y = 0; y <= 256; y += 16) {
      const offsetX = Math.sin(y * 0.08 + x) * 14;
      ctx.lineTo(x + offsetX, y);
    }
    ctx.lineTo(x + 20, 256);
    for (let y = 256; y >= 0; y -= 16) {
      const offsetX = Math.sin(y * 0.08 + x) * 14;
      ctx.lineTo(x + 20 + offsetX, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

function createOrangePulpTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Texture();

  ctx.fillStyle = "#ff793f";
  ctx.beginPath();
  ctx.arc(256, 256, 250, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 18;
  ctx.strokeStyle = "#fff8e7";
  ctx.beginPath();
  ctx.arc(256, 256, 240, 0, Math.PI * 2);
  ctx.stroke();

  const segments = 10;
  for (let i = 0; i < segments; i++) {
    const startAng = (i * Math.PI * 2) / segments + 0.04;
    const endAng = ((i + 1) * Math.PI * 2) / segments - 0.04;

    ctx.fillStyle = "#ff9f1a";
    ctx.beginPath();
    ctx.moveTo(256, 256);
    ctx.arc(256, 256, 228, startAng, endAng);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#e58e26";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.fillStyle = "#fff8e7";
  ctx.beginPath();
  ctx.arc(256, 256, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#fff8e7";
  ctx.lineWidth = 4;
  for (let i = 0; i < segments; i++) {
    const ang = (i * Math.PI * 2) / segments;
    ctx.beginPath();
    ctx.moveTo(256, 256);
    ctx.lineTo(256 + Math.cos(ang) * 235, 256 + Math.sin(ang) * 235);
    ctx.stroke();
  }

  return new THREE.CanvasTexture(canvas);
}

function createApplePulpTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Texture();

  const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 250);
  grad.addColorStop(0, "#fffdf0");
  grad.addColorStop(0.85, "#fff9d6");
  grad.addColorStop(0.96, "#f1f2f6");
  grad.addColorStop(1.0, "#eb2f06");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(256, 256, 250, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ded1b4";
  ctx.beginPath();
  ctx.arc(256, 256, 36, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#4a2810";
  ctx.beginPath();
  ctx.ellipse(242, 256, 6, 11, -0.25, 0, Math.PI * 2);
  ctx.ellipse(270, 256, 6, 11, 0.25, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

function createDojoWallTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Texture();

  ctx.fillStyle = "#2c190f";
  ctx.fillRect(0, 0, 512, 512);

  const plankH = 64;
  for (let y = 0; y < 512; y += plankH) {
    const grad = ctx.createLinearGradient(0, y, 0, y + plankH);
    grad.addColorStop(0, "#4a2f1c");
    grad.addColorStop(0.5, "#5d3b24");
    grad.addColorStop(1, "#3a2113");
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, 512, plankH);

    ctx.fillStyle = "#180c06";
    ctx.fillRect(0, y, 512, 3);
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.07)";
  for (let i = 0; i < 260; i++) {
    const gx = Math.random() * 512;
    const gy = Math.random() * 512;
    ctx.fillRect(gx, gy, Math.random() * 90 + 30, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

// Math Utility: Point to line segment distance
function distToSegment(
  p: { x: number; y: number },
  v: { x: number; y: number },
  w: { x: number; y: number }
) {
  const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

function createDropletOffsets() {
  const drops: { ox: number; oy: number; size: number; speed: number }[] = [];
  const count = 5 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    drops.push({
      ox: (Math.random() - 0.5) * 45,
      oy: (Math.random() - 0.5) * 30,
      size: 2 + Math.random() * 3.5,
      speed: 0.8 + Math.random() * 0.9,
    });
  }
  return drops;
}

interface FruitDef {
  name: string;
  radius: number;
  juiceColor: string;
  points: number;
  outerColor?: string;
  scale?: [number, number, number];
  hasStem?: boolean;
  roughness?: number;
  metalness?: number;
  isBomb?: boolean;
}

const FRUIT_TYPES: Record<string, FruitDef> = {
  WATERMELON: {
    name: "watermelon",
    radius: 1.15,
    juiceColor: "#ff1744",
    points: 1,
    outerColor: "#10ac84",
    scale: [1.12, 0.96, 0.96],
    roughness: 0.35,
    metalness: 0.05,
  },
  ORANGE: {
    name: "orange",
    radius: 0.9,
    juiceColor: "#ff9f1a",
    points: 1,
    outerColor: "#ff793f",
    scale: [1.0, 1.0, 1.0],
    roughness: 0.5,
    metalness: 0.0,
  },
  APPLE: {
    name: "apple",
    radius: 0.85,
    juiceColor: "#ff3838",
    points: 1,
    outerColor: "#eb2f06",
    scale: [0.98, 1.04, 0.98],
    hasStem: true,
    roughness: 0.2,
    metalness: 0.1,
  },
  BOMB: {
    name: "bomb",
    radius: 0.85,
    juiceColor: "#222222",
    points: 0,
    isBomb: true,
  },
};

interface ActiveFruit {
  mesh: THREE.Group;
  meshData: {
    group: THREE.Group;
    halfA?: THREE.Group;
    halfB?: THREE.Group;
    spark?: THREE.Mesh;
  };
  type: FruitDef;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  sliced: boolean;
  delay: number;
}

interface SlicedHalf {
  mesh: THREE.Group;
  vx: number;
  vy: number;
  vz: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  life: number;
}

interface JuiceParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
}

interface WallJuiceDrip {
  x: number;
  y: number;
  color: string;
  radius: number;
  dripY: number;
  alpha: number;
  droplets: { ox: number; oy: number; size: number; speed: number }[];
}

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  initialLife: number;
}

interface EngineCallbacks {
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onSlicedCountChange: (count: number) => void;
  onComboChange: (comboText: string | null) => void;
  onGameOver: (finalScore: number, finalSliced: number, title: string) => void;
  onStateChange: (state: "start" | "playing" | "gameover") => void;
}

// ==========================================
// 3. Isolated High-Performance 60 FPS Game Engine
// ==========================================
class FruitNinjaEngine {
  container: HTMLElement;
  webglContainer: HTMLElement;
  trailCanvas: HTMLCanvasElement;
  trailCtx: CanvasRenderingContext2D | null;
  callbacks: EngineCallbacks;
  sound: SoundSynth;

  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  bgMesh: THREE.Mesh;
  clock: THREE.Clock;

  textures: {
    watermelonPulp: THREE.CanvasTexture;
    watermelonSkin: THREE.CanvasTexture;
    orangePulp: THREE.CanvasTexture;
    applePulp: THREE.CanvasTexture;
    wood: THREE.CanvasTexture;
  };

  fruits: ActiveFruit[] = [];
  slicedHalves: SlicedHalf[] = [];
  juiceParticles: JuiceParticle[] = [];
  wallJuiceDrips: WallJuiceDrip[] = [];
  sparkParticles: SparkParticle[] = [];
  swipePoints: { x: number; y: number; time: number }[] = [];

  state: "start" | "playing" | "gameover" = "start";
  score = 0;
  slicedCount = 0;
  lives = 3;
  spawnTimer = 0.5;
  waveInterval = 2.0;

  isSwiping = false;
  currentSwipeCombo = 0;
  flashAlpha = 0;
  cameraShake = 0;

  animFrameId: number | null = null;
  comboTimeout: NodeJS.Timeout | null = null;
  isDestroyed = false;

  onResize: () => void;
  onMouseDown: (e: MouseEvent) => void;
  onMouseMove: (e: MouseEvent) => void;
  onMouseUp: () => void;
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: () => void;

  constructor(
    container: HTMLElement,
    webglContainer: HTMLElement,
    trailCanvas: HTMLCanvasElement,
    callbacks: EngineCallbacks
  ) {
    this.container = container;
    this.webglContainer = webglContainer;
    this.trailCanvas = trailCanvas;
    this.trailCtx = trailCanvas.getContext("2d");
    this.callbacks = callbacks;
    this.sound = new SoundSynth();

    const rect = container.getBoundingClientRect();
    const width = rect.width || window.innerWidth;
    const height = rect.height || window.innerHeight;

    this.textures = {
      watermelonPulp: createWatermelonPulpTexture(),
      watermelonSkin: createWatermelonSkinTexture(),
      orangePulp: createOrangePulpTexture(),
      applePulp: createApplePulpTexture(),
      wood: createDojoWallTexture(),
    };

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 15);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.webglContainer.innerHTML = "";
    this.webglContainer.appendChild(this.renderer.domElement);

    this.trailCanvas.width = width;
    this.trailCanvas.height = height;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffecd0, 0.95);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.3);
    sunLight.position.set(6, 14, 12);
    this.scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0xffa502, 0.6);
    rimLight.position.set(-8, -6, 5);
    this.scene.add(rimLight);

    // Dojo Wall Plane
    const bgGeo = new THREE.PlaneGeometry(38, 52);
    const bgMat = new THREE.MeshStandardMaterial({
      map: this.textures.wood,
      roughness: 0.8,
      metalness: 0.05,
    });
    this.bgMesh = new THREE.Mesh(bgGeo, bgMat);
    this.bgMesh.position.set(0, 0, -3.5);
    this.scene.add(this.bgMesh);

    this.clock = new THREE.Clock();

    // Resize handler
    this.onResize = () => {
      if (this.isDestroyed) return;
      const r = this.container.getBoundingClientRect();
      const w = r.width || window.innerWidth;
      const h = r.height || window.innerHeight;

      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      this.trailCanvas.width = w;
      this.trailCanvas.height = h;
    };
    window.addEventListener("resize", this.onResize);

    // Touch & Mouse bindings
    const getPos = (e: MouseEvent | Touch) => {
      const r = this.trailCanvas.getBoundingClientRect();
      return {
        x: e.clientX - r.left,
        y: e.clientY - r.top,
      };
    };

    const startSwipe = (pos: { x: number; y: number }) => {
      this.sound.init();
      this.isSwiping = true;
      this.currentSwipeCombo = 0;
      this.swipePoints = [{ x: pos.x, y: pos.y, time: performance.now() }];
    };

    const moveSwipe = (pos: { x: number; y: number }) => {
      if (!this.isSwiping) return;
      const now = performance.now();
      this.swipePoints.push({ x: pos.x, y: pos.y, time: now });
      this.swipePoints = this.swipePoints.filter((p) => now - p.time < 160);

      if (this.swipePoints.length >= 2) {
        const p1 = this.swipePoints[this.swipePoints.length - 2];
        const p2 = this.swipePoints[this.swipePoints.length - 1];
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

        if (dist > 15) {
          this.sound.playWhoosh();
          if (Math.random() < 0.4) {
            this.sparkParticles.push({
              x: p2.x,
              y: p2.y,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              life: 0.35,
              initialLife: 0.35,
            });
          }
        }

        if (this.state === "playing") {
          this.checkSliceIntersection(p1, p2);
        }
      }
    };

    const endSwipe = () => {
      this.isSwiping = false;
      this.finalizeCombo();
    };

    this.onMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("a")) return;
      startSwipe(getPos(e));
    };

    this.onMouseMove = (e: MouseEvent) => {
      moveSwipe(getPos(e));
    };

    this.onMouseUp = () => endSwipe();

    this.onTouchStart = (e: TouchEvent) => {
      if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("a")) return;
      if (e.cancelable) e.preventDefault();
      if (e.touches.length > 0) startSwipe(getPos(e.touches[0]));
    };

    this.onTouchMove = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      if (this.isSwiping && e.touches.length > 0) {
        moveSwipe(getPos(e.touches[0]));
      }
    };

    this.onTouchEnd = () => endSwipe();

    this.container.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("mouseup", this.onMouseUp);

    this.container.addEventListener("touchstart", this.onTouchStart, { passive: false });
    this.container.addEventListener("touchmove", this.onTouchMove, { passive: false });
    window.addEventListener("touchend", this.onTouchEnd);
    window.addEventListener("touchcancel", this.onTouchEnd);

    // Start 60 FPS animation loop
    this.clock.start();
    this.loop();
  }

  create3DFruitMesh(type: FruitDef) {
    if (type.isBomb) {
      const group = new THREE.Group();
      const sphereGeo = new THREE.SphereGeometry(0.85, 24, 20);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: 0x161c22,
        roughness: 0.28,
        metalness: 0.75,
      });
      const body = new THREE.Mesh(sphereGeo, sphereMat);
      group.add(body);

      const collarGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.28, 14);
      const collarMat = new THREE.MeshStandardMaterial({
        color: 0xdcdde1,
        metalness: 0.85,
        roughness: 0.3,
      });
      const collar = new THREE.Mesh(collarGeo, collarMat);
      collar.position.y = 0.9;
      group.add(collar);

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 1.0, 0),
        new THREE.Vector3(0.18, 1.25, 0.08),
        new THREE.Vector3(0.35, 1.45, -0.05),
      ]);
      const ropeGeo = new THREE.TubeGeometry(curve, 12, 0.045, 8, false);
      const ropeMat = new THREE.MeshStandardMaterial({ color: 0xf5f6fa, roughness: 0.9 });
      const rope = new THREE.Mesh(ropeGeo, ropeMat);
      group.add(rope);

      const sparkGeo = new THREE.SphereGeometry(0.1, 8, 8);
      const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffd32a });
      const spark = new THREE.Mesh(sparkGeo, sparkMat);
      spark.position.set(0.35, 1.45, -0.05);
      group.add(spark);

      return { group, spark, halfA: undefined, halfB: undefined };
    }

    const group = new THREE.Group();
    const r = type.radius;

    let outerMat: THREE.Material;
    if (type.name === "watermelon") {
      outerMat = new THREE.MeshStandardMaterial({
        map: this.textures.watermelonSkin,
        roughness: type.roughness,
        metalness: type.metalness,
      });
    } else {
      outerMat = new THREE.MeshStandardMaterial({
        color: type.outerColor,
        roughness: type.roughness,
        metalness: type.metalness,
      });
    }

    let innerMat: THREE.Material;
    if (type.name === "watermelon") {
      innerMat = new THREE.MeshStandardMaterial({ map: this.textures.watermelonPulp, roughness: 0.35 });
    } else if (type.name === "orange") {
      innerMat = new THREE.MeshStandardMaterial({ map: this.textures.orangePulp, roughness: 0.4 });
    } else if (type.name === "apple") {
      innerMat = new THREE.MeshStandardMaterial({ map: this.textures.applePulp, roughness: 0.25 });
    } else {
      innerMat = new THREE.MeshStandardMaterial({ color: type.juiceColor, roughness: 0.4 });
    }

    // Half A
    const halfAGroup = new THREE.Group();
    const hemiGeoA = new THREE.SphereGeometry(r, 26, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const hemiMeshA = new THREE.Mesh(hemiGeoA, outerMat);
    halfAGroup.add(hemiMeshA);

    const capGeoA = new THREE.CircleGeometry(r, 26);
    const capMeshA = new THREE.Mesh(capGeoA, innerMat);
    capMeshA.rotation.x = Math.PI / 2;
    halfAGroup.add(capMeshA);

    // Half B
    const halfBGroup = new THREE.Group();
    const hemiGeoB = new THREE.SphereGeometry(r, 26, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const hemiMeshB = new THREE.Mesh(hemiGeoB, outerMat);
    halfBGroup.add(hemiMeshB);

    const capGeoB = new THREE.CircleGeometry(r, 26);
    const capMeshB = new THREE.Mesh(capGeoB, innerMat);
    capMeshB.rotation.x = Math.PI / 2;
    halfBGroup.add(capMeshB);

    halfBGroup.rotation.x = Math.PI;

    group.add(halfAGroup);
    group.add(halfBGroup);

    if (type.hasStem) {
      const stemGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.35, 8);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x3d2008, roughness: 0.9 });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = r + 0.12;
      stem.rotation.z = 0.2;
      group.add(stem);
    }

    if (type.scale) {
      group.scale.set(type.scale[0], type.scale[1], type.scale[2]);
    }

    return { group, halfA: halfAGroup, halfB: halfBGroup };
  }

  spawnFruit(type: FruitDef, delay = 0) {
    const meshData = this.create3DFruitMesh(type);
    const mesh = meshData.group;

    const startX = (Math.random() - 0.5) * 5.5;
    const startY = -8.2;
    const startZ = (Math.random() - 0.5) * 1.5;

    mesh.position.set(startX, startY, startZ);
    mesh.visible = delay === 0;
    this.scene.add(mesh);

    const targetApexX = (Math.random() - 0.5) * 3.5;
    const vx = (targetApexX - startX) * 0.65;
    const vy = 16.5 + Math.random() * 3.2;
    const vz = (Math.random() - 0.5) * 1.2;

    this.fruits.push({
      mesh,
      meshData,
      type,
      x: startX,
      y: startY,
      z: startZ,
      vx,
      vy,
      vz,
      rotX: (Math.random() - 0.5) * 3.5,
      rotY: (Math.random() - 0.5) * 3.5,
      rotZ: (Math.random() - 0.5) * 3.5,
      sliced: false,
      delay,
    });
  }

  spawnWave() {
    if (this.state !== "playing") return;

    const count = 1 + Math.floor(Math.random() * Math.min(3, 1 + this.score / 10));
    const fruitKeys = Object.keys(FRUIT_TYPES).filter((k) => k !== "BOMB");
    const canSpawnBomb = this.score >= 4 && Math.random() < 0.24;

    for (let i = 0; i < count; i++) {
      const typeKey = fruitKeys[Math.floor(Math.random() * fruitKeys.length)];
      this.spawnFruit(FRUIT_TYPES[typeKey], i * 0.18);
    }

    if (canSpawnBomb) {
      this.spawnFruit(FRUIT_TYPES.BOMB, count * 0.18);
    }

    this.sound.playToss();
    this.waveInterval = Math.max(1.4, 2.3 - this.score * 0.015);
    this.spawnTimer = this.waveInterval;
  }

  showCombo(count: number) {
    if (count < 2) return;
    this.callbacks.onComboChange(`${count}x COMBO! +${count}`);
    if (this.comboTimeout) clearTimeout(this.comboTimeout);
    this.comboTimeout = setTimeout(() => {
      this.callbacks.onComboChange(null);
    }, 1100);
  }

  finalizeCombo() {
    if (this.currentSwipeCombo >= 2) {
      const bonus = this.currentSwipeCombo;
      this.score += bonus;
      this.callbacks.onScoreChange(this.score);
      this.showCombo(this.currentSwipeCombo);
      this.sound.playCombo(this.currentSwipeCombo);
    }
    this.currentSwipeCombo = 0;
  }

  checkSliceIntersection(p1: { x: number; y: number }, p2: { x: number; y: number }) {
    const swipeDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    if (swipeDist < 8) return;

    const sliceAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const fruit = this.fruits[i];
      if (fruit.sliced || fruit.delay > 0) continue;

      const screenPos = fruit.mesh.position.clone().project(this.camera);
      const halfW = this.trailCanvas.width / 2;
      const halfH = this.trailCanvas.height / 2;
      const fx = screenPos.x * halfW + halfW;
      const fy = -screenPos.y * halfH + halfH;

      const camDist = fruit.mesh.position.distanceTo(this.camera.position);
      const screenRadius = (fruit.type.radius / camDist) * this.trailCanvas.height * 0.95;

      const dist = distToSegment({ x: fx, y: fy }, p1, p2);
      if (dist < screenRadius) {
        this.sliceFruit(fruit, i, sliceAngle, fx, fy);
      }
    }
  }

  sliceFruit(fruit: ActiveFruit, index: number, sliceAngle: number, screenX: number, screenY: number) {
    fruit.sliced = true;
    this.fruits.splice(index, 1);

    if (fruit.type.isBomb) {
      if (fruit.mesh && fruit.mesh.parent) {
        this.scene.remove(fruit.mesh);
      }

      for (const f of this.fruits) {
        if (f.mesh && f.mesh.parent) {
          this.scene.remove(f.mesh);
        }
      }
      this.fruits = [];

      this.lives = 0;
      this.callbacks.onLivesChange(0);
      this.flashAlpha = 1.0;
      this.cameraShake = 22;

      this.sound.playBombExplosion();
      this.triggerBombExplosion(fruit.mesh.position);
      this.triggerGameOver("BOMB DETONATED!");
      return;
    }

    this.sound.playSlice();
    this.score += fruit.type.points;
    this.slicedCount++;
    this.currentSwipeCombo++;

    this.callbacks.onScoreChange(this.score);
    this.callbacks.onSlicedCountChange(this.slicedCount);

    this.splitFruitIn3D(fruit, sliceAngle);
    this.spawnJuiceBurst(fruit.mesh.position, fruit.type.juiceColor, sliceAngle);

    this.wallJuiceDrips.push({
      x: screenX,
      y: screenY,
      color: fruit.type.juiceColor,
      radius: 30 + Math.random() * 20,
      dripY: 0,
      alpha: 0.9,
      droplets: createDropletOffsets(),
    });
  }

  splitFruitIn3D(fruit: ActiveFruit, sliceAngle: number) {
    const parentPos = fruit.mesh.position.clone();
    const parentRot = fruit.mesh.rotation.clone();
    this.scene.remove(fruit.mesh);

    const halfA = fruit.meshData.halfA;
    const halfB = fruit.meshData.halfB;
    if (!halfA || !halfB) return;

    const normalAngle = sliceAngle + Math.PI / 2;
    const separationSpeed = 5.2 + Math.random() * 2;

    const setupHalf = (halfGroup: THREE.Group, dir: number) => {
      halfGroup.position.copy(parentPos);
      halfGroup.rotation.copy(parentRot);
      this.scene.add(halfGroup);

      const vx = fruit.vx + Math.cos(normalAngle) * separationSpeed * dir;
      const vy = fruit.vy + Math.sin(normalAngle) * separationSpeed * dir + 1.2;
      const vz = fruit.vz + (Math.random() - 0.5) * 2;

      this.slicedHalves.push({
        mesh: halfGroup,
        vx,
        vy,
        vz,
        rotX: (Math.random() - 0.5) * 14,
        rotY: (Math.random() - 0.5) * 14,
        rotZ: (Math.random() - 0.5) * 14,
        life: 2.2,
      });
    };

    setupHalf(halfA, 1);
    setupHalf(halfB, -1);
  }

  spawnJuiceBurst(pos: THREE.Vector3, colorHex: string, sliceAngle: number) {
    const count = 22;
    const color = new THREE.Color(colorHex);

    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.07 + Math.random() * 0.08, 6, 6);
      const mat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      this.scene.add(mesh);

      const sprayAngle = sliceAngle + (Math.random() - 0.5) * 0.8;
      const spd = 4 + Math.random() * 8;
      const vx = Math.cos(sprayAngle) * spd;
      const vy = Math.sin(sprayAngle) * spd;
      const vz = (Math.random() - 0.5) * 5;

      this.juiceParticles.push({
        mesh,
        vx,
        vy,
        vz,
        life: 0.5 + Math.random() * 0.35,
      });
    }
  }

  triggerBombExplosion(pos: THREE.Vector3) {
    for (let i = 0; i < 45; i++) {
      const geo = new THREE.SphereGeometry(0.14 + Math.random() * 0.18, 6, 6);
      const mat = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.4 ? 0xff4757 : 0xffa502,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      this.scene.add(mesh);

      const ang = Math.random() * Math.PI * 2;
      const spd = 6 + Math.random() * 12;
      this.juiceParticles.push({
        mesh,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        vz: (Math.random() - 0.5) * 8,
        life: 0.95,
      });
    }
  }

  triggerGameOver(title = "GAME OVER") {
    this.state = "gameover";
    this.callbacks.onStateChange("gameover");
    this.callbacks.onGameOver(this.score, this.slicedCount, title);
  }

  loseLife() {
    if (this.state !== "playing") return;
    this.lives--;
    this.sound.playMiss();
    this.callbacks.onLivesChange(this.lives);

    if (this.lives <= 0) {
      this.triggerGameOver("GAME OVER");
    }
  }

  startGame() {
    // Bulletproof scene cleanup: remove all leftover fruits, bombs, halves, particles
    for (let i = this.scene.children.length - 1; i >= 0; i--) {
      const child = this.scene.children[i];
      if (child !== this.camera && child !== this.bgMesh && !(child as any).isLight) {
        this.scene.remove(child);
      }
    }

    this.fruits = [];
    this.slicedHalves = [];
    this.juiceParticles = [];
    this.wallJuiceDrips = [];
    this.sparkParticles = [];
    this.flashAlpha = 0;
    this.cameraShake = 0;

    this.score = 0;
    this.slicedCount = 0;
    this.lives = 3;
    this.spawnTimer = 0.6;
    this.waveInterval = 2.1;

    this.callbacks.onScoreChange(0);
    this.callbacks.onSlicedCountChange(0);
    this.callbacks.onLivesChange(3);
    this.callbacks.onComboChange(null);

    this.state = "playing";
    this.callbacks.onStateChange("playing");
  }

  toggleSound() {
    this.sound.init();
    this.sound.enabled = !this.sound.enabled;
    return this.sound.enabled;
  }

  loop() {
    if (this.isDestroyed) return;
    this.animFrameId = requestAnimationFrame(() => this.loop());

    try {
      const dt = Math.min(this.clock.getDelta(), 0.05);

      // Explosion flash fade
      if (this.flashAlpha > 0) {
        this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2.5);
      }

      // Camera shake rumble
      if (this.cameraShake > 0) {
        this.camera.position.x = (Math.random() - 0.5) * this.cameraShake * 0.04;
        this.camera.position.y = (Math.random() - 0.5) * this.cameraShake * 0.04;
        this.cameraShake = Math.max(0, this.cameraShake - dt * 30);
      } else {
        this.camera.position.x = 0;
        this.camera.position.y = 0;
      }

      // Update Physics
      const gravity = 17.5;

      if (this.state === "playing") {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          this.spawnWave();
        }
      }

      // Active Fruits
      for (let i = this.fruits.length - 1; i >= 0; i--) {
        const f = this.fruits[i];
        if (f.delay > 0) {
          f.delay -= dt;
          if (f.delay <= 0) f.mesh.visible = true;
          continue;
        }

        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.z += f.vz * dt;
        f.vy -= gravity * dt;

        f.mesh.position.set(f.x, f.y, f.z);
        f.mesh.rotation.x += f.rotX * dt;
        f.mesh.rotation.y += f.rotY * dt;
        f.mesh.rotation.z += f.rotZ * dt;

        if (f.type.isBomb && f.meshData && f.meshData.spark) {
          f.meshData.spark.scale.setScalar(0.7 + Math.random() * 0.9);
        }

        if (f.y < -10.0 && f.vy < 0) {
          if (f.mesh.parent) this.scene.remove(f.mesh);
          this.fruits.splice(i, 1);

          if (!f.type.isBomb && !f.sliced && this.state === "playing") {
            this.loseLife();
          }
        }
      }

      // Sliced Halves
      for (let i = this.slicedHalves.length - 1; i >= 0; i--) {
        const h = this.slicedHalves[i];
        h.mesh.position.x += h.vx * dt;
        h.mesh.position.y += h.vy * dt;
        h.mesh.position.z += h.vz * dt;
        h.vy -= gravity * dt;

        h.mesh.rotation.x += h.rotX * dt;
        h.mesh.rotation.y += h.rotY * dt;
        h.mesh.rotation.z += h.rotZ * dt;

        h.life -= dt;
        if (h.mesh.position.y < -12.0 || h.life <= 0) {
          if (h.mesh.parent) this.scene.remove(h.mesh);
          this.slicedHalves.splice(i, 1);
        }
      }

      // 3D Juice Particles
      for (let i = this.juiceParticles.length - 1; i >= 0; i--) {
        const p = this.juiceParticles[i];
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.vy -= gravity * 0.75 * dt;

        p.life -= dt;
        if (p.life <= 0 || p.mesh.position.y < -12) {
          if (p.mesh.parent) this.scene.remove(p.mesh);
          this.juiceParticles.splice(i, 1);
        }
      }

      // Wall Juice Drips
      for (let i = this.wallJuiceDrips.length - 1; i >= 0; i--) {
        const drip = this.wallJuiceDrips[i];
        drip.alpha -= dt * 0.45;
        drip.dripY += dt * 12;
        if (drip.alpha <= 0) {
          this.wallJuiceDrips.splice(i, 1);
        }
      }

      // Katana Sparks
      for (let i = this.sparkParticles.length - 1; i >= 0; i--) {
        const sp = this.sparkParticles[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.life -= dt;
        if (sp.life <= 0) {
          this.sparkParticles.splice(i, 1);
        }
      }

      // 3D Render
      this.renderer.render(this.scene, this.camera);

      // 2D Trail Render
      if (this.trailCtx) {
        this.trailCtx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);

        // Wall Juice Stains
        for (const d of this.wallJuiceDrips) {
          this.trailCtx.save();
          this.trailCtx.globalAlpha = Math.max(0, d.alpha);

          const radGrad = this.trailCtx.createRadialGradient(
            d.x,
            d.y + d.dripY * 0.4,
            2,
            d.x,
            d.y + d.dripY * 0.4,
            d.radius
          );
          radGrad.addColorStop(0, d.color);
          radGrad.addColorStop(0.7, d.color);
          radGrad.addColorStop(1, "rgba(0,0,0,0)");

          this.trailCtx.fillStyle = radGrad;
          this.trailCtx.beginPath();
          this.trailCtx.arc(d.x, d.y + d.dripY * 0.4, d.radius, 0, Math.PI * 2);
          this.trailCtx.fill();

          this.trailCtx.fillStyle = d.color;
          for (const drop of d.droplets) {
            this.trailCtx.beginPath();
            this.trailCtx.arc(d.x + drop.ox, d.y + drop.oy + d.dripY * drop.speed, drop.size, 0, Math.PI * 2);
            this.trailCtx.fill();
          }
          this.trailCtx.restore();
        }

        // Katana Sparks
        for (const sp of this.sparkParticles) {
          this.trailCtx.save();
          this.trailCtx.globalAlpha = Math.max(0, sp.life / sp.initialLife);
          this.trailCtx.fillStyle = "#ffda79";
          this.trailCtx.beginPath();
          this.trailCtx.arc(sp.x, sp.y, 2.5, 0, Math.PI * 2);
          this.trailCtx.fill();
          this.trailCtx.restore();
        }

        // Blade Slash Ribbon
        const now = performance.now();
        this.swipePoints = this.swipePoints.filter((p) => now - p.time < 160);

        if (this.swipePoints.length >= 2) {
          this.trailCtx.save();
          this.trailCtx.lineCap = "round";
          this.trailCtx.lineJoin = "round";

          // Cyan Neon Blade Glow
          this.trailCtx.shadowColor = "#00f2fe";
          this.trailCtx.shadowBlur = 18;
          this.trailCtx.strokeStyle = "rgba(0, 242, 254, 0.75)";

          for (let i = 1; i < this.swipePoints.length; i++) {
            const p1 = this.swipePoints[i - 1];
            const p2 = this.swipePoints[i];
            const progress = i / this.swipePoints.length;

            this.trailCtx.lineWidth = 14 * progress;
            this.trailCtx.beginPath();
            this.trailCtx.moveTo(p1.x, p1.y);
            this.trailCtx.lineTo(p2.x, p2.y);
            this.trailCtx.stroke();
          }

          // Crisp White Hot Katana Core
          this.trailCtx.shadowBlur = 4;
          this.trailCtx.shadowColor = "#ffffff";
          this.trailCtx.strokeStyle = "#ffffff";

          for (let i = 1; i < this.swipePoints.length; i++) {
            const p1 = this.swipePoints[i - 1];
            const p2 = this.swipePoints[i];
            const progress = i / this.swipePoints.length;

            this.trailCtx.lineWidth = 5 * progress;
            this.trailCtx.beginPath();
            this.trailCtx.moveTo(p1.x, p1.y);
            this.trailCtx.lineTo(p2.x, p2.y);
            this.trailCtx.stroke();
          }

          this.trailCtx.restore();
        }

        // Explosion White Flash
        if (this.flashAlpha > 0) {
          this.trailCtx.save();
          this.trailCtx.globalAlpha = Math.min(1.0, this.flashAlpha);
          this.trailCtx.fillStyle = "#ffffff";
          this.trailCtx.fillRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);
          this.trailCtx.restore();
        }
      }
    } catch (e) {
      console.warn("Loop error:", e);
    }
  }

  destroy() {
    this.isDestroyed = true;
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.comboTimeout) clearTimeout(this.comboTimeout);
    window.removeEventListener("resize", this.onResize);

    this.container.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mouseup", this.onMouseUp);

    this.container.removeEventListener("touchstart", this.onTouchStart);
    this.container.removeEventListener("touchmove", this.onTouchMove);
    window.removeEventListener("touchend", this.onTouchEnd);
    window.removeEventListener("touchcancel", this.onTouchEnd);

    this.renderer.dispose();
    this.webglContainer.innerHTML = "";
  }
}

// ==========================================
// 4. React Frontend Wrapper
// ==========================================
export default function FruitNinja() {
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [slicedCount, setSlicedCount] = useState(0);
  const [lives, setLives] = useState(3);
  const [comboText, setComboText] = useState<string | null>(null);
  const [gameOverTitle, setGameOverTitle] = useState("GAME OVER");
  const [nickname, setNickname] = useState(() => localStorage.getItem("ju_game_nickname_v2") || "Player");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const webglContainerRef = useRef<HTMLDivElement>(null);
  const trailCanvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FruitNinjaEngine | null>(null);
  const hasSubmittedScore = useRef(false);

  // Load High Score from local storage
  useEffect(() => {
    const savedBest = parseInt(localStorage.getItem("fruitninja_best") || "0", 10);
    const savedNick = localStorage.getItem("ju_game_nickname_v2") || "";
    setHighScore(savedBest);
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
    if (engineRef.current) {
      const enabled = engineRef.current.toggleSound();
      setIsMuted(!enabled);
    }
  };

  // Mount Fruit Ninja Engine ONCE (Zero React Re-render Lag!)
  useEffect(() => {
    if (!containerRef.current || !webglContainerRef.current || !trailCanvasRef.current) return;

    const engine = new FruitNinjaEngine(
      containerRef.current,
      webglContainerRef.current,
      trailCanvasRef.current,
      {
        onScoreChange: (newScore) => setScore(newScore),
        onLivesChange: (newLives) => setLives(newLives),
        onSlicedCountChange: (newSliced) => setSlicedCount(newSliced),
        onComboChange: (newCombo) => setComboText(newCombo),
        onStateChange: (newState) => setGameState(newState),
        onGameOver: (finalScore, finalSliced, title) => {
          setGameOverTitle(title);
          hasSubmittedScore.current = false;
        },
      }
    );

    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Submit High Score to Supabase
  useEffect(() => {
    if (gameState === "gameover" && !hasSubmittedScore.current) {
      hasSubmittedScore.current = true;

      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("fruitninja_best", score.toString());
        triggerConfetti();
      }

      const submit = async () => {
        try {
          await supabase.from("game_scores").insert({
            nickname: nickname.trim().substring(0, 40) || "Player",
            game_name: "fruit_ninja_v1",
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
    const finalName = (name || nickname || "Player").trim().substring(0, 40);
    setNickname(finalName);
    localStorage.setItem("ju_game_nickname_v2", finalName);
    hasSubmittedScore.current = false;
    engineRef.current?.startGame();
  };

  const restartGame = () => {
    handleStartGame(nickname);
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-[#120b06] text-white flex items-center justify-center overflow-hidden select-none z-50">
      {/* Game Container (Full screen on mobile, max 480px on desktop) */}
      <div
        ref={containerRef}
        id="game-container"
        className="relative w-full h-full sm:max-w-[480px] sm:max-h-[850px] sm:rounded-3xl sm:border sm:border-white/10 sm:shadow-2xl overflow-hidden bg-[#23160e] flex items-center justify-center cursor-crosshair touch-none select-none"
        style={{ touchAction: "none" }}
      >
        {/* Three.js 3D WebGL Canvas */}
        <div ref={webglContainerRef} className="absolute inset-0 z-0 pointer-events-none" />

        {/* 2D Canvas for High-Speed Blade Slash Trail & Splatters */}
        <canvas ref={trailCanvasRef} className="absolute inset-0 z-10 pointer-events-none" />

        {/* UI Overlay Layer */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          {/* Top Header Bar inside the screen */}
          <div className="absolute top-4 sm:top-5 left-4 right-4 flex items-center justify-between pointer-events-none">
            {/* Left: Back Arrow to Game Zone & Score HUD */}
            <div className="flex items-center gap-2.5">
              <Link
                to="/game"
                onClick={(e) => e.stopPropagation()}
                className="w-10 h-10 rounded-2xl bg-[#140a05]/75 hover:bg-[#140a05]/95 active:scale-95 backdrop-blur-md border border-white/10 text-white/80 hover:text-white shadow-lg flex items-center justify-center transition-all pointer-events-auto"
                title="গেম জোন"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>

              <div className="flex items-center gap-2 bg-[#140a05]/80 px-3 py-1.5 rounded-2xl border border-[#ffb830]/30 shadow-lg backdrop-blur-md pointer-events-auto">
                <span className="text-2xl drop-shadow-md leading-none">🍉</span>
                <div className="flex flex-col">
                  <span className="text-[9px] font-extrabold tracking-widest text-[#ffb830] leading-tight">SCORE</span>
                  <span className="text-2xl font-black font-mono text-white leading-none tracking-tight">{score}</span>
                </div>
              </div>
            </div>

            {/* Center: Combo Banner Notification */}
            <div
              className={`transition-all duration-300 font-black text-xl sm:text-2xl text-[#ffda79] drop-shadow-[0_2px_12px_rgba(255,177,66,0.9)] tracking-wider whitespace-nowrap ${
                comboText ? "opacity-100 scale-110" : "opacity-0 scale-75"
              }`}
            >
              {comboText}
            </div>

            {/* Right: 3 Lives Display (✕ ✕ ✕) */}
            <div className="flex items-center gap-1.5 bg-[#140a05]/80 px-3 py-2 rounded-2xl border border-white/10 shadow-lg backdrop-blur-md pointer-events-auto">
              {[0, 1, 2].map((i) => {
                const lost = i >= lives;
                return (
                  <span
                    key={i}
                    className={`text-xl font-black transition-all duration-300 ${
                      lost
                        ? "text-[#ff3838] scale-110 drop-shadow-[0_0_8px_rgba(255,56,56,0.8)]"
                        : "text-white/20"
                    }`}
                  >
                    ✕
                  </span>
                );
              })}
            </div>
          </div>

          {/* Floating Action Column (Right Side of Screen) */}
          <div className="absolute top-20 right-4 flex flex-col items-center gap-2.5 pointer-events-none">
            {/* Leaderboard Button with dedicated 'লিডারবোর্ড' label icon */}
            <GameLeaderboard gameName="fruit_ninja_v1">
              <button
                onClick={(e) => e.stopPropagation()}
                className="group flex flex-col items-center justify-center w-11 h-12 rounded-2xl bg-[#140a05]/80 hover:bg-[#140a05]/95 active:scale-95 backdrop-blur-md border border-amber-500/40 hover:border-amber-400 text-amber-400 shadow-xl shadow-amber-500/10 transition-all pointer-events-auto"
                title="লিডারবোর্ড"
              >
                <Trophy className="w-5 h-5 drop-shadow group-hover:scale-110 transition-transform" />
                <span className="text-[8px] font-black text-amber-300 uppercase tracking-tighter leading-none mt-0.5">
                  লিডারবোর্ড
                </span>
              </button>
            </GameLeaderboard>

            {/* Sound Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSound();
              }}
              className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#140a05]/80 hover:bg-[#140a05]/95 active:scale-95 backdrop-blur-md border border-white/10 text-white shadow-xl transition-all pointer-events-auto"
              title={isMuted ? "সাউন্ড অন করুন" : "সাউন্ড মিউট করুন"}
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#140a05]/80 hover:bg-[#140a05]/95 active:scale-95 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white shadow-xl transition-all pointer-events-auto"
              title="ফুলস্ক্রিন"
            >
              {isFullscreen ? <Minimize className="w-5 h-5 text-sky-400" /> : <Maximize className="w-5 h-5 text-sky-400" />}
            </button>
          </div>

          {/* Start Screen Overlay */}
          {gameState === "start" && (
            <div className="absolute inset-0 bg-[#120b06]/88 backdrop-blur-md flex flex-col items-center justify-center p-6 pointer-events-auto">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center text-center max-w-xs"
              >
                <div className="mb-8">
                  <h1 className="text-5xl sm:text-6xl font-black text-[#f7f1e3] tracking-widest leading-none drop-shadow-[0_4px_25px_rgba(0,0,0,0.9)] mb-2">
                    FRUIT<br />
                    <span className="text-[#ff5252] drop-shadow-[0_4px_25px_rgba(255,82,82,0.6)]">NINJA</span>{" "}
                    <span className="text-base sm:text-lg font-black bg-gradient-to-r from-[#ffb142] to-[#ff5252] text-white px-2.5 py-1 rounded-lg align-middle shadow-md shadow-red-500/40">
                      3D
                    </span>
                  </h1>
                  <p className="text-xs text-amber-200/70 tracking-[0.25em] font-bold uppercase mt-3">
                    SWIPE TO SLICE • AVOID BOMBS
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartGame(nickname);
                  }}
                  className="px-12 py-4 rounded-full bg-gradient-to-r from-[#ff5252] to-[#ff793f] border-2 border-white/25 text-white font-black text-lg tracking-widest shadow-[0_8px_30px_rgba(255,82,82,0.5)] hover:scale-105 active:scale-95 transition-all mb-6"
                >
                  START GAME
                </button>

                {/* Player Profile Badge */}
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
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

          {/* Game Over Screen Overlay */}
          {gameState === "gameover" && (
            <div className="absolute inset-0 bg-[#120b06]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 pointer-events-auto">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-xs text-center"
              >
                <h2 className="text-3xl sm:text-4xl font-black text-[#ff5252] mb-3 tracking-widest drop-shadow-[0_2px_15px_rgba(255,82,82,0.6)]">
                  {gameOverTitle}
                </h2>

                <div className="bg-[#23160e]/85 border border-[#ffb142]/30 rounded-2xl p-5 mb-5 shadow-2xl">
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="flex flex-col items-center bg-black/40 p-2.5 rounded-xl border border-white/5">
                      <span className="text-[10px] font-extrabold text-white/50 tracking-wider mb-1">SCORE</span>
                      <span className="text-2xl font-black font-mono text-[#ffda79]">{score}</span>
                    </div>
                    <div className="flex flex-col items-center bg-black/40 p-2.5 rounded-xl border border-white/5">
                      <span className="text-[10px] font-extrabold text-white/50 tracking-wider mb-1">BEST</span>
                      <span className="text-2xl font-black font-mono text-[#ffda79]">{Math.max(score, highScore)}</span>
                    </div>
                    <div className="flex flex-col items-center bg-black/40 p-2.5 rounded-xl border border-white/5">
                      <span className="text-[10px] font-extrabold text-white/50 tracking-wider mb-1">SLICED</span>
                      <span className="text-2xl font-black font-mono text-[#ffda79]">{slicedCount}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      restartGame();
                    }}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff5252] to-[#ff793f] border border-white/20 text-white font-black text-base shadow-xl shadow-red-500/30 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    PLAY AGAIN
                  </button>

                  <GameLeaderboard gameName="fruit_ninja_v1">
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
            gameTitle="ফ্রুট নিনজা ৩ডি (Fruit Ninja 3D)"
            onStart={(name) => {
              const finalName = name.trim().substring(0, 40) || "Player";
              setNickname(finalName);
              localStorage.setItem("ju_game_nickname_v2", finalName);
              setShowLoginModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
