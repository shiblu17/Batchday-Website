import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import * as THREE from "three";
import { supabase } from "@/integrations/supabase/client";
import GameLeaderboard from "@/components/GameLeaderboard";
import GameLoginModal from "@/components/GameLoginModal";
import { triggerConfetti } from "@/utils/confetti";
import {
  ArrowLeft,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  Sparkles,
  Layers,
  Maximize,
  Minimize,
  Play,
  Share2,
} from "lucide-react";

// ============================================================================
// KETCHAPP STACK 3D CONSTANTS
// ============================================================================

const CONFIG = {
  blockHeight: 0.55,
  initialWidth: 3.2,
  initialDepth: 3.2,
  swingAmplitude: 4.6,
  baseSpeed: 3.8,
  speedIncrement: 0.04,
  maxSpeed: 7.2,
  snapTolerance: 0.14,
  gravity: -28.0,
  pushSpeed: 2.2,
  tumbleSpeed: 3.8,
};

// Web Audio API Synthesizer Engine
class StackSoundEngine {
  ctx: AudioContext | null = null;
  isMuted = false;
  pentatonic = [
    261.63, 293.66, 329.63, 392.00, 440.00, // C4, D4, E4, G4, A4
    523.25, 587.33, 659.25, 783.99, 880.00, // C5, D5, E5, G5, A5
    1046.50, 1174.66, 1318.51, 1567.98, 1760.00, // C6, D6, E6, G6, A6
  ];

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playSlice() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.08);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  playCombo(streak: number) {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const noteIdx = Math.min(streak - 1, this.pentatonic.length - 1);
    const freq = this.pentatonic[noteIdx];

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(freq, now);

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(freq * 2, now);

    gain.gain.setValueAtTime(0.38, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.52);
    osc2.stop(now + 0.52);
  }

  playExpand() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    [659.25, 1046.50].forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0.3, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.36);
    });
  }

  playGameOver() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [220, 174.61, 130.81];
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.25, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.6);

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(450, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.62);
    });
  }
}

export default function StackTower() {
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [comboMessage, setComboMessage] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const soundEngine = useRef<StackSoundEngine>(new StackSoundEngine());
  const hasSubmittedScore = useRef(false);

  // Three.js instances ref
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    renderer: THREE.WebGLRenderer;
    stack: Array<{
      mesh: THREE.Mesh;
      x: number;
      y: number;
      z: number;
      width: number;
      depth: number;
      height: number;
    }>;
    fallingBlocks: Array<{
      mesh: THREE.Mesh;
      vy: number;
      vx: number;
      vz: number;
      rotAxis: "x" | "z";
      rotSpeed: number;
    }>;
    activeParticles: Array<{
      mesh: THREE.Mesh;
      vx: number;
      vy: number;
      vz: number;
      opacity: number;
    }>;
    activeShockwaves: Array<{
      mesh: THREE.LineSegments;
      scale: number;
      opacity: number;
    }>;
    currentBlock: {
      mesh: THREE.Mesh;
      axis: "x" | "z";
      y: number;
      color: THREE.Color;
    } | null;
    currentAxis: "x" | "z";
    moveDirection: number;
    currentSpeed: number;
    currentSize: { x: number; z: number };
    baseHue: number;
    cameraY: number;
    targetCameraY: number;
    lastTime: number;
    animFrameId: number | null;
  } | null>(null);

  // Load Saved Data
  useEffect(() => {
    const savedHigh = localStorage.getItem("ketchapp_stack_highscore") || localStorage.getItem("stack_tower_highscore");
    if (savedHigh) setHighScore(parseInt(savedHigh, 10));

    const savedNick = localStorage.getItem("ju_game_nickname_v2");
    if (savedNick) setNickname(savedNick);

    const savedMuted = localStorage.getItem("ketchapp_stack_muted") === "true";
    setIsMuted(savedMuted);
    soundEngine.current.isMuted = savedMuted;

    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Floor Color Generation (Authentic Ketchapp pastel hues)
  const getFloorColor = (floorIndex: number, baseHue: number) => {
    const hue = (baseHue + floorIndex * 4.4) % 360;
    const color = new THREE.Color();
    color.setHSL(hue / 360, 0.72, 0.58);
    return { color, hue };
  };

  const updateBackground = useCallback((hue: number) => {
    if (!containerRef.current) return;
    const topColor = `hsl(${hue}, 28%, 18%)`;
    const botColor = `hsl(${(hue + 40) % 360}, 38%, 9%)`;
    containerRef.current.style.background = `linear-gradient(180deg, ${topColor} 0%, ${botColor} 100%)`;
  }, []);

  const createBlockMesh = (w: number, h: number, d: number, color: THREE.Color) => {
    const geometry = new THREE.BoxGeometry(w, h, d);
    const material = new THREE.MeshLambertMaterial({
      color: color,
      reflectivity: 0.2,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  // Spawn Next Moving Block
  const spawnNextMovingBlock = useCallback(() => {
    const state = threeRef.current;
    if (!state) return;

    const floorIndex = state.stack.length;
    const { color, hue } = getFloorColor(floorIndex, state.baseHue);
    updateBackground(hue);

    // Alternate Axis: odd floors 'x', even floors 'z'
    state.currentAxis = floorIndex % 2 === 1 ? "x" : "z";

    const prevBlock = state.stack[state.stack.length - 1];
    const y = (floorIndex - 1) * CONFIG.blockHeight + CONFIG.blockHeight / 2;

    const mesh = createBlockMesh(state.currentSize.x, CONFIG.blockHeight, state.currentSize.z, color);
    const startOffset = -CONFIG.swingAmplitude;

    if (state.currentAxis === "x") {
      mesh.position.set(prevBlock.x + startOffset, y, prevBlock.z);
    } else {
      mesh.position.set(prevBlock.x, y, prevBlock.z + startOffset);
    }

    state.moveDirection = 1;
    state.currentSpeed = Math.min(CONFIG.baseSpeed + floorIndex * CONFIG.speedIncrement, CONFIG.maxSpeed);

    state.scene.add(mesh);

    state.currentBlock = {
      mesh,
      axis: state.currentAxis,
      y,
      color,
    };

    if (floorIndex > 2) {
      state.targetCameraY = (floorIndex - 2) * CONFIG.blockHeight;
    } else {
      state.targetCameraY = 0;
    }
  }, [updateBackground]);

  // Init Game Stack
  const initGameStack = useCallback(() => {
    const state = threeRef.current;
    if (!state) return;

    state.stack.forEach((b) => state.scene.remove(b.mesh));
    state.fallingBlocks.forEach((b) => state.scene.remove(b.mesh));
    state.activeParticles.forEach((p) => state.scene.remove(p.mesh));
    state.activeShockwaves.forEach((s) => state.scene.remove(s.mesh));

    if (state.currentBlock) {
      state.scene.remove(state.currentBlock.mesh);
      state.currentBlock = null;
    }

    state.stack = [];
    state.fallingBlocks = [];
    state.activeParticles = [];
    state.activeShockwaves = [];

    state.baseHue = Math.floor(Math.random() * 360);
    updateBackground(state.baseHue);

    state.currentSize = { x: CONFIG.initialWidth, z: CONFIG.initialDepth };
    state.currentAxis = "x";
    state.moveDirection = 1;
    state.currentSpeed = CONFIG.baseSpeed;
    state.cameraY = 0;
    state.targetCameraY = 0;

    // Foundation Base Block
    const baseH = 8.0;
    const { color } = getFloorColor(0, state.baseHue);
    const baseMesh = createBlockMesh(state.currentSize.x, baseH, state.currentSize.z, color);
    baseMesh.position.set(0, -baseH / 2, 0);
    state.scene.add(baseMesh);

    state.stack.push({
      mesh: baseMesh,
      x: 0,
      y: 0,
      z: 0,
      width: state.currentSize.x,
      depth: state.currentSize.z,
      height: baseH,
    });

    setScore(0);
    setCombo(0);
    setComboMessage(null);
    hasSubmittedScore.current = false;

    spawnNextMovingBlock();
  }, [spawnNextMovingBlock, updateBackground]);

  // Visual Effects: Shockwave & Particles
  const triggerSnapEffects = (
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    color: THREE.Color
  ) => {
    const state = threeRef.current;
    if (!state) return;

    // Expanding Shockwave Box
    const ringGeo = new THREE.PlaneGeometry(w, d);
    const ringEdges = new THREE.EdgesGeometry(ringGeo);
    const ringMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      linewidth: 2,
    });
    const shockwave = new THREE.LineSegments(ringEdges, ringMat);
    shockwave.rotation.x = -Math.PI / 2;
    shockwave.position.set(x, y + CONFIG.blockHeight / 2 + 0.02, z);
    state.scene.add(shockwave);

    state.activeShockwaves.push({
      mesh: shockwave,
      scale: 1.0,
      opacity: 0.95,
    });

    // Perimeter Particles
    const particleCount = 18;
    const pGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);

    for (let i = 0; i < particleCount; i++) {
      const pMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xffffff : color,
        transparent: true,
        opacity: 1,
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);

      const isXEdge = Math.random() > 0.5;
      const px = isXEdge ? (Math.random() - 0.5) * w : Math.random() > 0.5 ? w / 2 : -w / 2;
      const pz = !isXEdge ? (Math.random() - 0.5) * d : Math.random() > 0.5 ? d / 2 : -d / 2;

      pMesh.position.set(x + px, y + CONFIG.blockHeight / 2, z + pz);

      const angle = Math.atan2(pz, px);
      const speed = 2.0 + Math.random() * 2.5;

      state.activeParticles.push({
        mesh: pMesh,
        vx: Math.cos(angle) * speed,
        vy: 1.5 + Math.random() * 2.5,
        vz: Math.sin(angle) * speed,
        opacity: 1.0,
      });

      state.scene.add(pMesh);
    }
  };

  // Place Current Block
  const placeBlock = useCallback(() => {
    const state = threeRef.current;
    if (!state || !state.currentBlock || gameState !== "playing") return;

    const prevBlock = state.stack[state.stack.length - 1];
    const axis = state.currentBlock.axis;
    const mesh = state.currentBlock.mesh;

    const diff = mesh.position[axis] - prevBlock[axis];
    const dimensionKey = axis === "x" ? "width" : "depth";
    const currentDim = prevBlock[dimensionKey];

    // 1. COMPLETE MISS (GAME OVER)
    if (Math.abs(diff) >= currentDim) {
      soundEngine.current.playGameOver();
      setGameState("gameover");

      state.fallingBlocks.push({
        mesh: mesh,
        vy: -1.0,
        vx: axis === "x" ? state.moveDirection * 2.2 : 0,
        vz: axis === "z" ? state.moveDirection * 2.2 : 0,
        rotAxis: axis === "x" ? "z" : "x",
        rotSpeed: state.moveDirection * 3.5,
      });
      state.currentBlock = null;
      return;
    }

    // 2. PERFECT SNAP
    if (Math.abs(diff) <= CONFIG.snapTolerance) {
      mesh.position[axis] = prevBlock[axis];
      const newCombo = combo + 1;
      setCombo(newCombo);

      soundEngine.current.playCombo(newCombo);
      triggerSnapEffects(
        mesh.position.x,
        mesh.position.y,
        mesh.position.z,
        state.currentSize.x,
        state.currentSize.z,
        state.currentBlock.color
      );

      // Ketchapp Bonus Expansion (+Size when combo reaches 8, 12, 16...)
      if (newCombo >= 8 && newCombo % 4 === 0) {
        const bonus = 0.35;
        if (axis === "x") {
          state.currentSize.x = Math.min(CONFIG.initialWidth, state.currentSize.x + bonus);
        } else {
          state.currentSize.z = Math.min(CONFIG.initialDepth, state.currentSize.z + bonus);
        }
        mesh.geometry.dispose();
        mesh.geometry = new THREE.BoxGeometry(state.currentSize.x, CONFIG.blockHeight, state.currentSize.z);
        soundEngine.current.playExpand();
        setComboMessage("COMBO +SIZE!");
      } else {
        setComboMessage(`PERFECT +${newCombo}`);
      }

      state.stack.push({
        mesh: mesh,
        x: prevBlock.x,
        y: mesh.position.y,
        z: prevBlock.z,
        width: state.currentSize.x,
        depth: state.currentSize.z,
        height: CONFIG.blockHeight,
      });

      state.currentBlock = null;
      const nextScore = state.stack.length - 1;
      setScore(nextScore);

      spawnNextMovingBlock();
      return;
    }

    // 3. SLICE & DEBRIS
    setCombo(0);
    setComboMessage(null);
    soundEngine.current.playSlice();

    const cutSize = Math.abs(diff);
    const newDim = currentDim - cutSize;
    const newCenter = prevBlock[axis] + diff / 2;

    if (axis === "x") {
      state.currentSize.x = newDim;
    } else {
      state.currentSize.z = newDim;
    }

    state.scene.remove(mesh);
    const placedMesh = createBlockMesh(
      state.currentSize.x,
      CONFIG.blockHeight,
      state.currentSize.z,
      state.currentBlock.color
    );

    if (axis === "x") {
      placedMesh.position.set(newCenter, mesh.position.y, prevBlock.z);
    } else {
      placedMesh.position.set(prevBlock.x, mesh.position.y, newCenter);
    }
    state.scene.add(placedMesh);

    // Falling Debris Overhang
    const overhangCenter =
      diff > 0
        ? newCenter + newDim / 2 + cutSize / 2
        : newCenter - newDim / 2 - cutSize / 2;

    const overhangW = axis === "x" ? cutSize : state.currentSize.x;
    const overhangD = axis === "z" ? cutSize : state.currentSize.z;
    const overhangMesh = createBlockMesh(overhangW, CONFIG.blockHeight, overhangD, state.currentBlock.color);

    if (axis === "x") {
      overhangMesh.position.set(overhangCenter, mesh.position.y, prevBlock.z);
    } else {
      overhangMesh.position.set(prevBlock.x, mesh.position.y, overhangCenter);
    }
    state.scene.add(overhangMesh);

    state.fallingBlocks.push({
      mesh: overhangMesh,
      vy: 0,
      vx: axis === "x" ? (diff > 0 ? CONFIG.pushSpeed : -CONFIG.pushSpeed) : 0,
      vz: axis === "z" ? (diff > 0 ? CONFIG.pushSpeed : -CONFIG.pushSpeed) : 0,
      rotAxis: axis === "x" ? "z" : "x",
      rotSpeed: (diff > 0 ? -1 : 1) * CONFIG.tumbleSpeed,
    });

    state.stack.push({
      mesh: placedMesh,
      x: axis === "x" ? newCenter : prevBlock.x,
      y: mesh.position.y,
      z: axis === "z" ? newCenter : prevBlock.z,
      width: state.currentSize.x,
      depth: state.currentSize.z,
      height: CONFIG.blockHeight,
    });

    state.currentBlock = null;
    const nextScore = state.stack.length - 1;
    setScore(nextScore);

    spawnNextMovingBlock();
  }, [gameState, combo, spawnNextMovingBlock]);

  // Three.js Mount & Animation Loop
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();

    const aspect = window.innerWidth / window.innerHeight;
    const viewSize = 5.4;
    let left = -viewSize;
    let right = viewSize;
    let top = viewSize / aspect;
    let bottom = -viewSize / aspect;

    if (aspect >= 1) {
      left = -viewSize * aspect;
      right = viewSize * aspect;
      top = viewSize;
      bottom = -viewSize;
    }

    const camera = new THREE.OrthographicCamera(left, right, top, bottom, -50, 150);
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.78);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.82);
    dirLight.position.set(12, 28, 14);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 80;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-10, -5, -10);
    scene.add(fillLight);

    threeRef.current = {
      scene,
      camera,
      renderer,
      stack: [],
      fallingBlocks: [],
      activeParticles: [],
      activeShockwaves: [],
      currentBlock: null,
      currentAxis: "x",
      moveDirection: 1,
      currentSpeed: CONFIG.baseSpeed,
      currentSize: { x: CONFIG.initialWidth, z: CONFIG.initialDepth },
      baseHue: Math.floor(Math.random() * 360),
      cameraY: 0,
      targetCameraY: 0,
      lastTime: performance.now(),
      animFrameId: null,
    };

    updateBackground(threeRef.current.baseHue);

    const handleResize = () => {
      const state = threeRef.current;
      if (!state) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const asp = w / h;

      if (asp >= 1) {
        state.camera.left = -viewSize * asp;
        state.camera.right = viewSize * asp;
        state.camera.top = viewSize;
        state.camera.bottom = -viewSize;
      } else {
        state.camera.left = -viewSize;
        state.camera.right = viewSize;
        state.camera.top = viewSize / asp;
        state.camera.bottom = -viewSize / asp;
      }
      state.camera.updateProjectionMatrix();
      state.renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Animation Loop
    const animate = (time: number) => {
      const state = threeRef.current;
      if (!state) return;

      const dt = Math.min((time - state.lastTime) / 1000, 0.1) || 0.016;
      state.lastTime = time;

      // 1. Move Active Block
      if (state.currentBlock) {
        const prevBlock = state.stack[state.stack.length - 1];
        const axis = state.currentBlock.axis;
        const center = prevBlock[axis];

        state.currentBlock.mesh.position[axis] += state.moveDirection * state.currentSpeed * dt;

        if (state.currentBlock.mesh.position[axis] > center + CONFIG.swingAmplitude) {
          state.currentBlock.mesh.position[axis] = center + CONFIG.swingAmplitude;
          state.moveDirection = -1;
        } else if (state.currentBlock.mesh.position[axis] < center - CONFIG.swingAmplitude) {
          state.currentBlock.mesh.position[axis] = center - CONFIG.swingAmplitude;
          state.moveDirection = 1;
        }
      }

      // 2. Physics Debris
      for (let i = state.fallingBlocks.length - 1; i >= 0; i--) {
        const b = state.fallingBlocks[i];
        b.vy += CONFIG.gravity * dt;
        b.mesh.position.y += b.vy * dt;
        b.mesh.position.x += b.vx * dt;
        b.mesh.position.z += b.vz * dt;
        b.mesh.rotation[b.rotAxis] += b.rotSpeed * dt;

        if (b.mesh.position.y < state.cameraY - 14) {
          state.scene.remove(b.mesh);
          state.fallingBlocks.splice(i, 1);
        }
      }

      // 3. Shockwaves
      for (let i = state.activeShockwaves.length - 1; i >= 0; i--) {
        const s = state.activeShockwaves[i];
        s.scale += 2.2 * dt;
        s.opacity -= 2.6 * dt;
        s.mesh.scale.set(s.scale, s.scale, s.scale);
        (s.mesh.material as THREE.LineBasicMaterial).opacity = Math.max(0, s.opacity);

        if (s.opacity <= 0) {
          state.scene.remove(s.mesh);
          state.activeShockwaves.splice(i, 1);
        }
      }

      // 4. Particles
      for (let i = state.activeParticles.length - 1; i >= 0; i--) {
        const p = state.activeParticles[i];
        p.vy += CONFIG.gravity * 0.7 * dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.opacity -= 1.8 * dt;
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, p.opacity);

        if (p.opacity <= 0 || p.mesh.position.y < state.cameraY - 5) {
          state.scene.remove(p.mesh);
          state.activeParticles.splice(i, 1);
        }
      }

      // 5. Smooth Camera Tracking
      state.cameraY += (state.targetCameraY - state.cameraY) * 0.085;
      state.camera.position.set(20, 20 + state.cameraY, 20);
      state.camera.lookAt(0, state.cameraY, 0);

      state.renderer.render(state.scene, state.camera);
      state.animFrameId = requestAnimationFrame(animate);
    };

    threeRef.current.animFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (threeRef.current?.animFrameId) {
        cancelAnimationFrame(threeRef.current.animFrameId);
      }
      renderer.dispose();
    };
  }, [updateBackground]);

  // Start / Tap Action
  const handleAction = () => {
    soundEngine.current.init();

    if (gameState === "start") {
      setGameState("playing");
      initGameStack();
    } else if (gameState === "playing") {
      placeBlock();
    }
  };

  // Keyboard Spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        if (gameState === "gameover") {
          setGameState("playing");
          initGameStack();
        } else {
          handleAction();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, placeBlock, initGameStack]);

  // High Score & Supabase Submit
  useEffect(() => {
    if (gameState === "gameover" && score > 0 && !hasSubmittedScore.current) {
      hasSubmittedScore.current = true;

      const isNew = score > highScore;
      if (isNew) {
        setHighScore(score);
        localStorage.setItem("ketchapp_stack_highscore", score.toString());
        localStorage.setItem("stack_tower_highscore", score.toString());
        triggerConfetti();
      }

      if (nickname.trim()) {
        const submit = async () => {
          try {
            await supabase.from("game_scores").insert({
              nickname: nickname.trim().substring(0, 40),
              game_name: "stack_v1",
              score: score,
            });
          } catch (err) {
            console.error("Score submit error", err);
          }
        };
        submit();
      }
    }
  }, [gameState, score, highScore, nickname]);

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.current.isMuted = next;
    localStorage.setItem("ketchapp_stack_muted", next ? "true" : "false");
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleStartWithNickname = (name: string) => {
    const clean = name.trim().substring(0, 40);
    setNickname(clean);
    localStorage.setItem("ju_game_nickname_v2", clean);
    setGameState("playing");
    initGameStack();
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={(e) => {
        // Prevent action if clicking UI buttons
        if ((e.target as HTMLElement)?.closest(".interactive-ui")) return;
        handleAction();
      }}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none z-50 transition-colors duration-500 touch-none flex flex-col justify-between"
      style={{
        background: "linear-gradient(180deg, #1e2538 0%, #0d111d 100%)",
      }}
    >
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-0" />

      {/* ========================================================
          TOP CONTROLS BAR
         ======================================================== */}
      <div className="relative z-20 w-full px-4 pt-4 flex items-center justify-between interactive-ui pointer-events-auto">
        <Link
          to="/game"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-bold transition-all active:scale-95 shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>গেম জোন</span>
        </Link>

        {/* Live Score Counter (Center) */}
        {gameState === "playing" && (
          <div className="flex flex-col items-center pointer-events-none">
            <span className="text-5xl sm:text-6xl font-black font-mono text-white/90 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              {score}
            </span>
            {comboMessage && (
              <span className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-widest animate-bounce drop-shadow-md">
                {comboMessage}
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSound}
            className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-transform active:scale-90"
            title={isMuted ? "সাউন্ড অন" : "সাউন্ড মিউট"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-transform active:scale-90"
            title="লিডারবোর্ড"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-transform active:scale-90"
            title={isFullscreen ? "ছোট করুন" : "ফুলস্ক্রিন"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ========================================================
          START SCREEN OVERLAY
         ======================================================== */}
      {gameState === "start" && (
        <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 text-center pointer-events-none">
          <div className="space-y-4 max-w-sm">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Ketchapp Official 3D Clone</span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-black font-display text-white tracking-tight drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
              STACK 3D
            </h1>

            <p className="text-xs sm:text-sm text-white/80 max-w-xs mx-auto font-medium leading-relaxed drop-shadow">
              নিখুঁত টাইমিংয়ে ড্রপ করে ব্লক স্লাইস করো এবং আকাশছোঁয়া টাওয়ার বানাও!
            </p>

            <div className="pt-2 flex flex-col items-center gap-3 interactive-ui pointer-events-auto">
              {!nickname ? (
                <GameLoginModal
                  gameName="স্ট্যাক ৩ডি (Stack 3D)"
                  onLogin={handleStartWithNickname}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.current.init();
                    setGameState("playing");
                    initGameStack();
                  }}
                  className="px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-2xl transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>খেলা শুরু করুন</span>
                </button>
              )}

              <div className="flex items-center gap-2 text-xs font-bold text-white/70 bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>সর্বোচ্চ রেকর্ড: {highScore} তলা</span>
              </div>
            </div>

            <p className="text-[11px] text-white/50 tracking-wide pt-4 font-mono">
              স্ক্রিনে ট্যাপ করুন অথবা স্পেসবার চাপুন
            </p>
          </div>
        </div>
      )}

      {/* ========================================================
          GAME OVER SCREEN OVERLAY
         ======================================================== */}
      {gameState === "gameover" && (
        <div className="relative z-30 flex-1 flex flex-col items-center justify-center px-4 text-center interactive-ui pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-xs bg-slate-900/90 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.6)] space-y-4">
            
            {score > highScore ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-black animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                <span>নতুন রেকর্ড! 🎉</span>
              </div>
            ) : (
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                গেম ওভার
              </span>
            )}

            <div className="py-2">
              <div className="text-6xl font-black font-mono text-white tracking-tight">
                {score}
              </div>
              <p className="text-xs text-slate-400 mt-1">টাওয়ার উচ্চতা (তলা)</p>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-2xl border border-white/10 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">খেলোয়াড়</span>
                <strong className="text-white truncate block font-bold">
                  {nickname || "গেস্ট"}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">রেকর্ড</span>
                <strong className="text-amber-400 font-bold font-mono">
                  {Math.max(score, highScore)}
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.current.init();
                setGameState("playing");
                initGameStack();
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>আবার খেলুন</span>
            </button>

            <button
              type="button"
              onClick={() => setShowLeaderboard(true)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-white/10 cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>লিডারবোর্ড দেখুন</span>
            </button>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md interactive-ui pointer-events-auto">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>স্ট্যাক ৩ডি লিডারবোর্ড</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowLeaderboard(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3">
              <GameLeaderboard gameName="stack_v1" />
            </div>
          </div>
        </div>
      )}

      {/* Footer Instructions Hint */}
      <div className="relative z-20 pb-4 text-center pointer-events-none text-[11px] text-white/40 font-mono">
        {gameState === "playing" ? "নিখুঁত টাইমিংয়ে ট্যাপ করুন" : "JU 52nd Batch Day • Official 3D Game"}
      </div>
    </div>
  );
}
