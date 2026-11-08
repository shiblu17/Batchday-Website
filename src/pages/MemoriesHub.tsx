import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Utensils,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  CheckCircle2,
  Circle,
  Award,
  Trophy,
  Users,
  Plus,
  Heart,
  Share2,
  Download,
  Loader2,
  Radio,
  Music,
  Compass,
  Flame,
  Send,
  Coffee,
  Check,
  Disc,
  Bookmark,
  Pin,
  Tag,
  ThumbsUp,
  FileText,
  RotateCcw,
  Sliders,
  Camera,
  Layers,
  Sparkle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";

// ==========================================
// 1. TRADITIONAL ALPONA BORDER PATTERN
// ==========================================
const AlponaBorderPattern = ({ side }: { side: "left" | "right" }) => (
  <div
    className={`absolute top-0 bottom-0 ${
      side === "left" ? "left-0" : "right-0"
    } w-4 sm:w-6 opacity-40 dark:opacity-20 pointer-events-none overflow-hidden select-none z-10`}
  >
    <svg className="w-full h-full" viewBox="0 0 24 600" preserveAspectRatio="none" fill="none">
      <defs>
        <pattern id={`alpona-${side}`} width="24" height="40" patternUnits="userSpaceOnUse">
          <path d="M0 0 L12 20 L0 40 Z" fill="#8B1538" opacity="0.65" />
          <path d="M24 0 L12 20 L24 40 Z" fill="#8B1538" opacity="0.65" />
          <polygon points="12,12 18,20 12,28 6,20" fill="#D97706" opacity="0.85" />
          <circle cx="12" cy="20" r="2" fill="#ffffff" />
        </pattern>
      </defs>
      <rect width="24" height="100%" fill={`url(#alpona-${side})`} />
    </svg>
  </div>
);

// ==========================================
// 2. 12 VORTA LIST (MATCHING USER'S IMAGE)
// ==========================================
const VORTA_LIST = [
  { name: "কালিজিরা ভর্তা", icon: "🌱", color: "#18181b" },
  { name: "শুঁটকি ভর্তা", icon: "🐟", color: "#b91c1c" },
  { name: "সরিষা ইলিশ ভর্তা", icon: "✨", color: "#ca8a04" },
  { name: "টাকি মাছ ভর্তা", icon: "🐠", color: "#047857" },
  { name: "ডাল ভর্তা", icon: "🥣", color: "#ea580c" },
  { name: "আলু ভর্তা", icon: "🥔", color: "#d97706" },
  { name: "বেগুন পোড়া ভর্তা", icon: "🍆", color: "#6b21a8" },
  { name: "মরিচ পোড়া ভর্তা", icon: "🌶️", color: "#dc2626" },
  { name: "চীনাবাদাম ভর্তা", icon: "🥜", color: "#9a3412" },
  { name: "পেঁপের ভর্তা", icon: "🍈", color: "#16a34a" },
  { name: "বরবটি ভর্তা", icon: "🥬", color: "#059669" },
  { name: "ডিম ভর্তা", icon: "🥚", color: "#c2410c" },
];

// ==========================================
// 3. BOTTOLA ICONIC MEALS (POLAROIDS)
// ==========================================
const BOTTOLA_ITEMS = [
  {
    id: "bf_1",
    title: "খিচুড়ি ও ২০ পদের ভর্তা",
    desc: "বটতলার সিগনেচার স্পেশাল মিল। দুপুর আর রাতের চিরকালীন আড্ডা।",
    votes: 412,
    icon: "🍛",
    tag: "সিগনেচার",
    tapeColor: "#f59e0b",
    rotation: "-rotate-2",
  },
  {
    id: "bf_2",
    title: "কড়াইয়ের হাঁসের মাংস",
    desc: "শীতের রাতে বটতলার সেরা আকর্ষণ। সাথে ভুনা খিচুড়ির ধোঁয়া।",
    votes: 389,
    icon: "🍲",
    tag: "শীতের স্পেশাল",
    tapeColor: "#ef4444",
    rotation: "rotate-1",
  },
  {
    id: "bf_3",
    title: "ইলিশ ভুনা ও বেগুন ভাজা",
    desc: "কড়কড়ে বেগুন ভাজা আর পদ্মার ইলিশের খাঁটি স্বাদ।",
    votes: 310,
    icon: "🐟",
    tag: "জনপ্রিয়",
    tapeColor: "#3b82f6",
    rotation: "-rotate-1",
  },
  {
    id: "bf_4",
    title: "মুরাদ চত্বরের মালাই চা ও পিঁয়াজু",
    desc: "সন্ধ্যার চিরকালীন ক্লাসিক আড্ডার নির্ভরযোগ্য ঠিকানা।",
    votes: 456,
    icon: "☕",
    tag: "আড্ডা স্পেশাল",
    tapeColor: "#10b981",
    rotation: "rotate-2",
  },
  {
    id: "bf_5",
    title: "টারজান পয়েন্টের চিকেন শর্মা",
    desc: "ক্লাস বাঙ্কের পর লেকের বাতাসে বসে প্রিয় রোল ও শর্মা।",
    votes: 278,
    icon: "🌯",
    tag: "স্ট্রিট বাইটস",
    tapeColor: "#f97316",
    rotation: "-rotate-2",
  },
  {
    id: "bf_6",
    title: "ক্যাফেটেরিয়ার গরম শিঙাড়া",
    desc: "সকালে ক্লাসের ফাঁকে লাল চা আর কুড়মুড়ে শিঙাড়া।",
    votes: 395,
    icon: "🥟",
    tag: "বাজেট ফেভারিট",
    tapeColor: "#eab308",
    rotation: "rotate-1",
  },
  {
    id: "bf_7",
    title: "প্রান্তিক গেটের ঝাল ফুচকা",
    desc: "লেকের পাড়ে বসে বন্ধুদের সাথে ঝাল তেঁতুল জলের ফুচকা।",
    votes: 340,
    icon: "🌶️",
    tag: "সন্ধ্যা স্পেশাল",
    tapeColor: "#dc2626",
    rotation: "-rotate-1",
  },
  {
    id: "bf_8",
    title: "ডেইরি গেটের মিষ্টি দই",
    desc: "পরীক্ষা শেষে কিংবা ব্যাচ ডে-র মিষ্টি মুখের চিরকালীন মিষ্টি।",
    votes: 285,
    icon: "🍧",
    tag: "ডেজার্ট",
    tapeColor: "#a855f7",
    rotation: "rotate-2",
  },
];

// ==========================================
// 4. BUCKET LIST DATA
// ==========================================
const INITIAL_BUCKET_ITEMS = [
  {
    id: "bk_1",
    text: "শীতের কুয়াশাচ্ছন্ন ভোরে লেকে অতিথি পাখি দেখা",
    doneCount: 421,
    category: "প্রকৃতি",
    color: "bg-[#fff9db] text-amber-950 border-amber-300",
    pinColor: "bg-red-500",
    tapeColor: "#f59e0b",
  },
  {
    id: "bk_2",
    text: "বটতলায় টানা ১০ রকমের ভর্তা একসাথে টেস্ট করা",
    doneCount: 385,
    category: "খাবার",
    color: "bg-[#eefbee] text-emerald-950 border-emerald-300",
    pinColor: "bg-emerald-600",
    tapeColor: "#10b981",
  },
  {
    id: "bk_3",
    text: "মুক্তমঞ্চে শীতের রাতে খোলা আকাশের নিচে নাটক দেখা",
    doneCount: 442,
    category: "কালচার",
    color: "bg-[#fff0f3] text-rose-950 border-rose-300",
    pinColor: "bg-purple-600",
    tapeColor: "#f43f5e",
  },
  {
    id: "bk_4",
    text: "ট্রান্সপোর্টের শেষ বাসে চড়ে গান গেয়ে শহরে ফেরা",
    doneCount: 367,
    category: "ভ্রমণ",
    color: "bg-[#edf7ff] text-sky-950 border-sky-300",
    pinColor: "bg-blue-600",
    tapeColor: "#0ea5e9",
  },
  {
    id: "bk_5",
    text: "শহীদ মিনারের সিঁড়িতে বসে মধ্যরাতে গিটার বাজানো",
    doneCount: 410,
    category: "আড্ডা",
    color: "bg-[#f5eeff] text-purple-950 border-purple-300",
    pinColor: "bg-rose-500",
    tapeColor: "#8b5cf6",
  },
  {
    id: "bk_6",
    text: "টারজান পয়েন্টে ক্লাস বাংক করে বন্ধুদের নিয়ে মালাই চা খাওয়া",
    doneCount: 489,
    category: "আড্ডা",
    color: "bg-[#fff8ea] text-amber-950 border-amber-300",
    pinColor: "bg-amber-600",
    tapeColor: "#d97706",
  },
  {
    id: "bk_7",
    text: "কেন্দ্রীয় লাইব্রেরিতে পড়াশোনার ভান করে গভীর ঘুমে ঢলে পড়া",
    doneCount: 398,
    category: "একাডেমিক",
    color: "bg-[#f0fbfb] text-teal-950 border-teal-300",
    pinColor: "bg-teal-600",
    tapeColor: "#14b8a6",
  },
  {
    id: "bk_8",
    text: "ক্যাফেটেরিয়ার ছাদে বা মাঠে বসে লাল রক্তিম সূর্যাস্ত দেখা",
    doneCount: 430,
    category: "স্মৃতি",
    color: "bg-[#fff3eb] text-orange-950 border-orange-300",
    pinColor: "bg-orange-600",
    tapeColor: "#f97316",
  },
  {
    id: "bk_9",
    text: "পুরো ক্যাম্পাস এক রিকশায় চড়ে টুংটাং বেল বাজিয়ে চক্কর দেওয়া",
    doneCount: 356,
    category: "রোমাঞ্চ",
    color: "bg-[#f4fce8] text-lime-950 border-lime-300",
    pinColor: "bg-lime-600",
    tapeColor: "#84cc16",
  },
  {
    id: "bk_10",
    text: "অমর একুশে ও জয় বাংলার সামনে ব্যাচমেটদের সাথে ছবি তোলা",
    doneCount: 478,
    category: "ছবি",
    color: "bg-[#fff0f6] text-pink-950 border-pink-300",
    pinColor: "bg-red-600",
    tapeColor: "#ec4899",
  },
];

// ==========================================
// 5. YEARBOOK CATEGORIES
// ==========================================
interface Nominee {
  id: string;
  name: string;
  dept: string;
  votes: number;
}

interface YearbookCategory {
  id: string;
  title: string;
  emoji: string;
  description: string;
  tapeColor: string;
  rotation: string;
  nominees: Nominee[];
}

const INITIAL_YEARBOOK: YearbookCategory[] = [
  {
    id: "yb_night_owl",
    title: "রাতজাগা আড্ডাবাজ",
    emoji: "🌙",
    description: "রাত ৩টায় যাকে সবসময় শহীদ মিনার বা বটতলায় পাওয়া যায়",
    tapeColor: "#3b82f6",
    rotation: "-rotate-1",
    nominees: [
      { id: "nom_1", name: "তানভীর আহমেদ", dept: "সিএসই", votes: 48 },
      { id: "nom_2", name: "রাকিব হাসান", dept: "ইংরেজি", votes: 36 },
      { id: "nom_3", name: "আসিফ ইকবাল", dept: "পদার্থবিজ্ঞান", votes: 29 },
    ],
  },
  {
    id: "yb_note_savior",
    title: "নোট কিং ও ত্রাতা",
    emoji: "📚",
    description: "পরীক্ষার আগের রাতে যার খাতা ছাড়া ক্লাসের কারও উপায় ছিল না",
    tapeColor: "#10b981",
    rotation: "rotate-2",
    nominees: [
      { id: "nom_4", name: "সাদিয়া ইসলাম", dept: "ফার্মেসি", votes: 62 },
      { id: "nom_5", name: "আফরিন সুলতানা", dept: "অর্থনীতি", votes: 41 },
    ],
  },
  {
    id: "yb_rockstar",
    title: "ক্যাম্পাস রকস্টার",
    emoji: "🎸",
    description: "মুক্তমঞ্চে গিটার হাতে উঠলেই যার জন্য করতালির বন্যা বয়ে যেত",
    tapeColor: "#8b5cf6",
    rotation: "-rotate-2",
    nominees: [
      { id: "nom_6", name: "আবির রায়হান", dept: "নাট্যকলা", votes: 55 },
      { id: "nom_7", name: "সোহানুর রহমান", dept: "আইবিএ", votes: 34 },
    ],
  },
  {
    id: "yb_tea_addict",
    title: "দিন-রাত চা খোর",
    emoji: "☕",
    description: "রক্তের বদলে যার শরীরে মুরাদ চত্বরের মালাই চা প্রবাহিত হয়",
    tapeColor: "#f59e0b",
    rotation: "rotate-1",
    nominees: [
      { id: "nom_8", name: "মেহেদী হাসান", dept: "ভূগোল", votes: 51 },
      { id: "nom_9", name: "নাবিল আহমেদ", dept: "গণিত", votes: 38 },
    ],
  },
  {
    id: "yb_sleeper",
    title: "চিরন্তন ঘুমকাতুরে",
    emoji: "😴",
    description: "ক্লাস শুরু হলেই যার চোখ দুটি শান্তির ঘুমে ঢলে পড়ত",
    tapeColor: "#64748b",
    rotation: "-rotate-1",
    nominees: [
      { id: "nom_10", name: "জুবায়ের আল মামুন", dept: "রসায়ন", votes: 45 },
      { id: "nom_11", name: "ফারহান সাজিদ", dept: "প্রাণিবিদ্যা", votes: 39 },
    ],
  },
  {
    id: "yb_bcs",
    title: "আগামীর বিসিএস বস",
    emoji: "💼",
    description: "প্রথম বর্ষ থেকেই যার পড়ার টেবিলে এমপিথ্রি আর ডাইজেস্টের স্তূপ",
    tapeColor: "#ef4444",
    rotation: "rotate-2",
    nominees: [
      { id: "nom_12", name: "সাইফুল ইসলাম", dept: "সরকার ও রাজনীতি", votes: 58 },
      { id: "nom_13", name: "কামরুল হাসান", dept: "আন্তর্জাতিক সম্পর্ক", votes: 44 },
    ],
  },
];

// ==========================================
// 6. CASSETTE SOUNDSCAPES
// ==========================================
const SOUNDSCAPES = [
  { id: "birds", name: "শীতের অতিথি পাখির কলতান", icon: "🦆", track: "Side A • 01", type: "chirp" },
  { id: "rickshaw", name: "প্রান্তিক গেটের রিকশার টুংটাং", icon: "🚲", track: "Side A • 02", type: "bell" },
  { id: "drums", name: "মুক্তমঞ্চের নাটকের ড্রাম ও খোল", icon: "🥁", track: "Side B • 01", type: "drum" },
  { id: "guitar", name: "শহীদ মিনারের মধ্যরাতের কর্ড", icon: "🎸", track: "Side B • 02", type: "guitar" },
];

export default function MemoriesHub() {
  const [activeTab, setActiveTab] = useState<"bottola" | "audio" | "bucket" | "yearbook">("bottola");

  // 1. Food Meter States
  const [foodItems, setFoodItems] = useState(BOTTOLA_ITEMS);
  const [checkedVortas, setCheckedVortas] = useState<string[]>([]);
  const [foodVoted, setFoodVoted] = useState<Record<string, boolean>>({});

  // 2. Bucket List States
  const [bucketItems, setBucketItems] = useState(INITIAL_BUCKET_ITEMS);
  const [userCheckedBuckets, setUserCheckedBuckets] = useState<Record<string, boolean>>({});
  const [newBucketText, setNewBucketText] = useState("");

  // 3. Yearbook States
  const [yearbook, setYearbook] = useState(INITIAL_YEARBOOK);
  const [votedNominees, setVotedNominees] = useState<Record<string, boolean>>({});
  const [nominateModalOpen, setNominateModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState("");
  const [nomineeName, setNomineeName] = useState("");
  const [nomineeDept, setNomineeDept] = useState("");

  // 4. Cassette & Audio Recorder States
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [audioNoteAuthor, setAudioNoteAuthor] = useState("");
  const [audioNoteTitle, setAudioNoteTitle] = useState("");
  const [voiceNotes, setVoiceNotes] = useState([
    {
      id: "vn_1",
      author: "তানভীর (সিএসই)",
      title: "মুক্তমঞ্চের শেষ নাটকের রাতের স্মৃতি",
      duration: "0:24",
      timeAgo: "২ ঘণ্টা আগে",
      likes: 19,
      color: "bg-amber-100/70 border-amber-300",
    },
    {
      id: "vn_2",
      author: "মৌসুমী (ইংরেজি)",
      title: "বটতলার খিচুড়ি আর আড্ডার বন্ধুদের মিস করব",
      duration: "0:18",
      timeAgo: "৫ ঘণ্টা আগে",
      likes: 24,
      color: "bg-rose-100/70 border-rose-300",
    },
    {
      id: "vn_3",
      author: "ফারহান (আইবিএ)",
      title: "ট্রান্সপোর্টের শেষ বাসের গানগুলো!",
      duration: "0:30",
      timeAgo: "১ দিন আগে",
      likes: 31,
      color: "bg-sky-100/70 border-sky-300",
    },
  ]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerIntervalRef = useRef<any>(null);

  // Load saved state from LocalStorage on mount
  useEffect(() => {
    try {
      const savedVortas = localStorage.getItem("ju52_checked_vortas");
      if (savedVortas) setCheckedVortas(JSON.parse(savedVortas));

      const savedBuckets = localStorage.getItem("ju52_user_buckets");
      if (savedBuckets) setUserCheckedBuckets(JSON.parse(savedBuckets));

      const savedFoodVotes = localStorage.getItem("ju52_food_votes");
      if (savedFoodVotes) setFoodVoted(JSON.parse(savedFoodVotes));

      const savedNomineeVotes = localStorage.getItem("ju52_nominee_votes");
      if (savedNomineeVotes) setVotedNominees(JSON.parse(savedNomineeVotes));
    } catch (e) {
      console.warn("Storage sync error:", e);
    }
  }, []);

  // Web Audio Synthesizer for Authentic JU Soundscapes
  const playSynthesizedSound = (type: string) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      if (type === "bell") {
        [0, 0.14].forEach((delay) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(2450, ctx.currentTime + delay);
          gain.gain.setValueAtTime(0.35, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.4);
        });
      } else if (type === "chirp") {
        [0, 0.1, 0.22, 0.35].forEach((delay, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          const baseFreq = 2600 + (idx % 2) * 400;
          osc.frequency.setValueAtTime(baseFreq, ctx.currentTime + delay);
          osc.frequency.exponentialRampToValueAtTime(baseFreq + 900, ctx.currentTime + delay + 0.08);
          gain.gain.setValueAtTime(0.25, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.08);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.09);
        });
      } else if (type === "guitar") {
        const chord = [164.81, 196.0, 246.94, 329.63];
        chord.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.04);
          gain.gain.setValueAtTime(0.3, ctx.currentTime + idx * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.04 + 2.0);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.04);
          osc.stop(ctx.currentTime + idx * 0.04 + 2.1);
        });
      } else if (type === "drum") {
        [0, 0.22, 0.44].forEach((delay) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(150, ctx.currentTime + delay);
          osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + delay + 0.28);
          gain.gain.setValueAtTime(0.45, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.32);
        });
      }
    } catch (e) {
      console.warn("Audio synth error:", e);
    }
  };

  const handlePlaySoundscape = (id: string, type: string) => {
    setPlayingTrackId(id);
    playSynthesizedSound(type);
    setTimeout(() => {
      setPlayingTrackId(null);
    }, 1800);
  };

  // ========================================================
  // VOICE RECORDING
  // ========================================================
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 45) {
            stopRecording();
            return 45;
          }
          return prev + 1;
        });
      }, 1000);

      toast({
        title: "ক্যাসেট রেকর্ডিং শুরু হয়েছে 🎙️",
        description: "সর্বোচ্চ ৪৫ সেকেন্ডের কণ্ঠবার্তা রেকর্ড করতে পারবেন।",
      });
    } catch (err) {
      console.error("Mic error:", err);
      toast({
        title: "মাইক্রোফোন চালু করা যায়নি",
        description: "ব্রাউজারে মাইক্রোফোন ব্যবহারের পারমিশন দিন।",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const handleSaveVoiceNote = () => {
    if (!audioNoteAuthor.trim() || !audioNoteTitle.trim()) {
      toast({
        title: "তথ্য অসম্পূর্ণ",
        description: "আপনার নাম এবং চিরকুটের একটি শিরোনাম লিখুন।",
        variant: "destructive",
      });
      return;
    }

    const newNote = {
      id: `vn_${Date.now()}`,
      author: audioNoteAuthor.trim(),
      title: audioNoteTitle.trim(),
      duration: `0:${recordingSeconds < 10 ? "0" + recordingSeconds : recordingSeconds}`,
      timeAgo: "এইমাত্র",
      likes: 1,
      color: "bg-emerald-100/70 border-emerald-300",
    };

    setVoiceNotes([newNote, ...voiceNotes]);
    setRecordedAudioUrl(null);
    setAudioNoteTitle("");
    setRecordingSeconds(0);

    confetti({ particleCount: 60, spread: 60 });
    toast({
      title: "ক্যাসেট ফিতায় সংরক্ষিত হয়েছে! 📼",
      description: "ক্যাম্পাসের সোনালী স্মৃতিতে আপনার কণ্ঠ চিরস্থায়ী হলো।",
    });
  };

  // ========================================================
  // BOTTOLA HANDLERS
  // ========================================================
  const handleVoteFood = (id: string) => {
    if (foodVoted[id]) return;
    setFoodItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, votes: item.votes + 1 } : item))
    );
    const updated = { ...foodVoted, [id]: true };
    setFoodVoted(updated);
    localStorage.setItem("ju52_food_votes", JSON.stringify(updated));
    confetti({ particleCount: 30, spread: 40 });
    toast({ title: "বটতলার স্বাদে ভোট দেওয়া হয়েছে! 🍽️" });
  };

  const toggleVorta = (vortaName: string) => {
    let next: string[];
    const isAdding = !checkedVortas.includes(vortaName);
    if (isAdding) {
      next = [...checkedVortas, vortaName];
      confetti({ particleCount: 35, spread: 45 });
    } else {
      next = checkedVortas.filter((v) => v !== vortaName);
    }
    setCheckedVortas(next);
    localStorage.setItem("ju52_checked_vortas", JSON.stringify(next));
  };

  // Dynamic Vorta Rank & Title based on user selection
  const vortaCount = checkedVortas.length;
  let vortaTitle = "বটতলার নবাগত অতিথি 🌿";
  let certificateRank = "খাদ্যপ্রেমী শিক্ষানবিস";
  if (vortaCount >= 10) {
    vortaTitle = "বটতলার অপরাজেয় ভোজনরসিক সম্রাট 👑";
    certificateRank = "গ্র্যান্ডমাস্টার খাদক";
  } else if (vortaCount >= 7) {
    vortaTitle = "ভর্তা স্পেশালিস্ট ক্যাম্পাশিয়ান 🎖️";
    certificateRank = "সিনিয়র খাদ্যরসিক";
  } else if (vortaCount >= 4) {
    vortaTitle = "নিয়মিত খাদ্যপ্রেমী দোস্ত 😋";
    certificateRank = "বটতলা রেগুলার";
  }

  // ========================================================
  // BUCKET LIST HANDLERS
  // ========================================================
  const toggleBucketItem = (id: string) => {
    const isDone = !userCheckedBuckets[id];
    setUserCheckedBuckets((prev) => {
      const next = { ...prev, [id]: isDone };
      localStorage.setItem("ju52_user_buckets", JSON.stringify(next));
      return next;
    });

    setBucketItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, doneCount: item.doneCount + (isDone ? 1 : -1) }
          : item
      )
    );

    if (isDone) {
      confetti({ particleCount: 50, spread: 60 });
      toast({ title: "বাকেট লিস্ট স্মৃতি সম্পন্ন! 📌✨" });
    }
  };

  const handleAddCustomBucket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBucketText.trim()) return;

    const newItem = {
      id: `bk_user_${Date.now()}`,
      text: newBucketText.trim(),
      doneCount: 1,
      category: "কমিউনিটি চিরকুট",
      color: "bg-[#fff2d6] text-amber-950 border-amber-300",
      pinColor: "bg-red-500",
      tapeColor: "#f59e0b",
    };

    setBucketItems([newItem, ...bucketItems]);
    setUserCheckedBuckets((prev) => ({ ...prev, [newItem.id]: true }));
    setNewBucketText("");
    confetti({ particleCount: 70, spread: 60 });
    toast({ title: "নতুন বাকেট চিরকুট ডায়েরিতে পিন করা হয়েছে! 📝" });
  };

  // ========================================================
  // YEARBOOK HANDLERS
  // ========================================================
  const handleVoteNominee = (catId: string, nomId: string) => {
    const voteKey = `${catId}_${nomId}`;
    if (votedNominees[voteKey]) return;

    setYearbook((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          nominees: cat.nominees.map((nom) =>
            nom.id === nomId ? { ...nom, votes: nom.votes + 1 } : nom
          ),
        };
      })
    );

    const updated = { ...votedNominees, [voteKey]: true };
    setVotedNominees(updated);
    localStorage.setItem("ju52_nominee_votes", JSON.stringify(updated));
    confetti({ particleCount: 40, spread: 50 });
    toast({ title: "লিজেন্ডকে ভোট দেওয়া হয়েছে! 🏆" });
  };

  const handleNominateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomineeName.trim() || !selectedCatId) return;

    const newNominee: Nominee = {
      id: `nom_${Date.now()}`,
      name: nomineeName.trim(),
      dept: nomineeDept.trim() || "৫২তম ব্যাচ",
      votes: 1,
    };

    setYearbook((prev) =>
      prev.map((cat) =>
        cat.id === selectedCatId
          ? { ...cat, nominees: [...cat.nominees, newNominee] }
          : cat
      )
    );

    setNomineeName("");
    setNomineeDept("");
    setNominateModalOpen(false);
    confetti({ particleCount: 60, spread: 60 });
    toast({ title: "পোলারয়েড ওয়ালে বন্ধু নমিনেট করা হয়েছে! 📸" });
  };

  const completedBucketCount = Object.values(userCheckedBuckets).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#121318] text-[#2c241e] dark:text-[#f0eae1] pb-32 pt-3 md:pt-6 transition-colors select-none font-body relative overflow-x-hidden">
      
      {/* TRADITIONAL BENGALI ALPONA BORDERS ON SIDES (MATCHING USER SCREENSHOT) */}
      <AlponaBorderPattern side="left" />
      <AlponaBorderPattern side="right" />

      {/* MANDALA WATERMARK ACCENTS IN CORNERS */}
      <div className="absolute top-0 right-0 w-56 h-56 opacity-[0.06] pointer-events-none select-none text-[#8B1538]">
        <svg viewBox="0 0 200 200" fill="currentColor">
          <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="100" cy="100" r="50" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
          <circle cx="100" cy="100" r="30" fill="none" stroke="currentColor" strokeWidth="4" />
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <path key={deg} d="M100 15 C108 35, 108 45, 100 55 C92 45, 92 35, 100 15 Z" transform={`rotate(${deg} 100 100)`} />
          ))}
        </svg>
      </div>

      <div className="absolute top-0 left-0 w-56 h-56 opacity-[0.06] pointer-events-none select-none text-[#8B1538]">
        <svg viewBox="0 0 200 200" fill="currentColor">
          <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="100" cy="100" r="50" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
          <circle cx="100" cy="100" r="30" fill="none" stroke="currentColor" strokeWidth="4" />
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <path key={deg} d="M100 15 C108 35, 108 45, 100 55 C92 45, 92 35, 100 15 Z" transform={`rotate(${deg} 100 100)`} />
          ))}
        </svg>
      </div>

      {/* ===== TAB SELECTOR TABS (SUBTLE TRADITIONAL PILLS) ===== */}
      <div className="container max-w-4xl mx-auto px-6 sm:px-10 mb-6 relative z-20">
        <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-2">
          {[
            { id: "bottola", label: "বটতলা খাদ্য বিলাস", icon: Utensils, badge: "ভর্তা মিটার" },
            { id: "audio", label: "রেট্রো ক্যাসেট ও চিরকুট", icon: Disc, badge: "কণ্ঠস্বর" },
            { id: "bucket", label: "স্মৃতির বাকেট ডায়েরি", icon: Pin, badge: "চেকলিস্ট" },
            { id: "yearbook", label: "ইয়ারবুক হল অব ফেম", icon: Trophy, badge: "লিজেন্ডস" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer shadow-xs ${
                  isActive
                    ? "bg-[#8B1538] text-white shadow-md ring-2 ring-[#8B1538]/30 scale-102"
                    : "bg-[#F3ECE2] dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-[#E8DDD0]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-300" : ""}`} />
                <span className="font-display">{tab.label}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? "bg-amber-400 text-stone-950" : "bg-black/10 dark:bg-white/10 text-current"
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== MAIN CONTENT CONTAINER ===== */}
      <div className="container max-w-3xl mx-auto px-6 sm:px-10 relative z-20">
        
        {/* ========================================================
            TAB 1: BOTTOLA VORTA & HERITAGE (PIXEL-PERFECT AS USER SCREENSHOT)
           ======================================================== */}
        {activeTab === "bottola" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* 1.1 TOP SECTION (EXACT REPLICA OF USER UPLOADED SCREENSHOT) */}
            <div className="text-center pt-2">
              
              {/* Curved Maroon Tag */}
              <div className="inline-flex items-center justify-center px-5 py-1.5 rounded-full bg-[#8B1538] text-white text-xs sm:text-sm font-bold shadow-sm tracking-wide">
                <span>জাহাঙ্গীরনগর বিশ্ববিদ্যালয় • বটতলা বাঙালির ঐতিহ্য</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-3xl sm:text-5xl font-black font-display text-[#8B1538] dark:text-[#f87171] flex items-center justify-center gap-2 mt-3 tracking-tight">
                <span>{vortaTitle}</span>
              </h1>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm font-medium text-stone-600 dark:text-stone-400 mt-2 max-w-md mx-auto leading-relaxed">
                ১২টি পদের মধ্যে আপনি <strong className="text-stone-900 dark:text-stone-100 font-bold">{vortaCount}টি ট্রাই করেছেন</strong> (অফিসিয়াল স্ট্যাটাস: <span className="text-[#8B1538] dark:text-amber-400 font-bold">{certificateRank}</span>)
              </p>

              {/* Glowing Concentric Circular Badge */}
              <div className="relative my-7 flex items-center justify-center">
                {/* Outer Golden Glow */}
                <div className="absolute w-36 h-36 rounded-full bg-amber-400/30 blur-2xl pointer-events-none" />

                {/* Outer Golden Halo Border */}
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-tr from-amber-500 via-amber-300 to-amber-500 shadow-xl flex items-center justify-center">
                  
                  {/* Deep Maroon Circle */}
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-[#800020] via-[#650019] to-[#38010f] flex flex-col items-center justify-center text-white border-2 border-amber-300/50 shadow-inner">
                    <span className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white leading-none">
                      {vortaCount}/12
                    </span>
                    <span className="text-[11px] font-bold text-amber-200 mt-1 uppercase tracking-wider">
                      টেস্ট করেছেন
                    </span>
                  </div>
                </div>
              </div>

              {/* Subheader Tan Bar with Score Pill */}
              <div className="rounded-2xl bg-[#EDE4D8] dark:bg-stone-800/80 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-xs mb-5">
                <span className="text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-200 font-display">
                  ভর্তার নাম (ক্লিক করে "টেস্টেড" করতে স্ট্যাম্প দিন):
                </span>
                <span className="bg-[#EA6825] text-white text-xs font-black px-3 py-1 rounded-full shadow-xs">
                  স্কোর: {Math.round((vortaCount / 12) * 100)}%
                </span>
              </div>
            </div>

            {/* 1.2 2-COLUMN VORTA GRID (EXACT SAME AS USER IMAGE) */}
            <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
              {VORTA_LIST.map((vorta) => {
                const isChecked = checkedVortas.includes(vorta.name);
                return (
                  <button
                    key={vorta.name}
                    type="button"
                    onClick={() => toggleVorta(vorta.name)}
                    className={`relative p-4 rounded-2xl border transition-all text-left flex flex-col justify-between min-h-[116px] sm:min-h-[126px] cursor-pointer shadow-sm hover:shadow-md ${
                      isChecked
                        ? "bg-[#FFF9F3] dark:bg-[#201d1a] border-red-500/80 scale-[1.02]"
                        : "bg-white dark:bg-[#1a1b22] border-stone-200/90 dark:border-stone-800 hover:border-amber-400"
                    }`}
                  >
                    {/* Top Row: Food Icon & Circular Check Ring */}
                    <div className="flex items-start justify-between w-full">
                      <div className="text-3xl sm:text-4xl">
                        {vorta.icon}
                      </div>

                      {/* Clean Circular Checkbox Indicator */}
                      <div
                        className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center shrink-0 ${
                          isChecked
                            ? "border-[#8B1538] bg-[#8B1538] text-white shadow-xs"
                            : "border-stone-300 dark:border-stone-600 bg-transparent"
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    {/* Bottom Row: Food Name */}
                    <div className="mt-3">
                      <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 font-display block leading-tight">
                        {vorta.name}
                      </span>
                    </div>

                    {/* Distressed Red Rubber Stamp Overlay when Checked */}
                    {isChecked && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-red-600/5 backdrop-blur-[0.5px] rounded-2xl">
                        <div className="border-3 border-red-600 dark:border-red-500 text-red-600 dark:text-red-500 font-black text-xs sm:text-sm px-3 py-1 rounded-md tracking-widest uppercase transform rotate-[-12deg] shadow-md animate-in zoom-in-75 duration-150 bg-white/95 dark:bg-stone-900/95">
                          টেস্টেড! ✓
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 1.3 BOTTOLA ICONIC MEALS (POLAROIDS SECTION UNDERNEATH) */}
            <div className="mt-12 pt-8 border-t border-dashed border-stone-300 dark:border-stone-800">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg sm:text-xl font-black font-display text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-500" />
                    <span>বটতলার সিগনেচার স্পেশাল মিলস ও আড্ডা</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    আপনার প্রিয় জাবি খাবারে ভোট দিয়ে ব্যাচের শীর্ষ স্বাদ নির্বাচন করুন
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {foodItems.map((item) => (
                  <div
                    key={item.id}
                    className="relative bg-white dark:bg-[#1a1c22] p-4 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{item.icon}</span>
                      <div>
                        <h4 className="text-sm font-bold font-display text-stone-900 dark:text-stone-100">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-stone-500 line-clamp-1">{item.desc}</p>
                        <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-1 font-display">
                          <Heart className="w-3 h-3 fill-rose-500" />
                          {item.votes} ভোট
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={foodVoted[item.id] ? "secondary" : "default"}
                      onClick={() => handleVoteFood(item.id)}
                      disabled={foodVoted[item.id]}
                      className={`h-8 text-xs font-bold rounded-xl shrink-0 ${
                        foodVoted[item.id]
                          ? "bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                          : "bg-[#8B1538] hover:bg-[#68001a] text-white"
                      }`}
                    >
                      {foodVoted[item.id] ? "ভোট সম্পন্ন ✓" : "ভোট দিন"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================
            TAB 2: RETRO AUDIO CASSETTE & CAMPUS SOUNDSCAPES
           ======================================================== */}
        {activeTab === "audio" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            <div className="relative rounded-3xl bg-gradient-to-b from-[#2a2b33] via-[#1e1f26] to-[#121318] border-4 border-amber-600/50 p-6 sm:p-8 text-white shadow-xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shadow-sm shadow-rose-500" />
                  <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
                    JU-52 STEREO CASSETTE RECORDER
                  </span>
                </div>
                <span className="text-xs font-bold text-amber-300 bg-black/40 px-2 py-0.5 rounded border border-white/10">60 MIN</span>
              </div>

              {/* Cassette Tape Shell */}
              <div className="relative max-w-md mx-auto bg-[#323440] rounded-2xl border-2 border-stone-500/40 p-4 shadow-xl flex flex-col justify-between mb-6">
                <div className="bg-[#fbf7eb] text-stone-900 rounded-xl p-3 shadow-md text-center border-t-4 border-amber-500 mb-4">
                  <div className="text-[9px] font-mono font-bold text-stone-500 uppercase tracking-widest">
                    JAHANGIRNAGAR UNIVERSITY 52ND BATCH RECORDING
                  </div>
                  <div className="text-base font-black font-display text-[#800020] tracking-wide mt-0.5">
                    "স্মৃতির মুক্তমঞ্চ ও লেকের গান • সাইড এ"
                  </div>
                </div>

                <div className="relative flex items-center justify-around bg-[#101116] rounded-xl py-3 px-6 border border-white/10 shadow-inner">
                  <div className={`w-12 h-12 rounded-full border-4 border-amber-400/90 bg-[#1f2129] flex items-center justify-center shadow-lg ${playingTrackId ? "animate-spin [animation-duration:1.5s]" : ""}`}>
                    <div className="w-4 h-4 rounded-full bg-stone-300/40 border border-stone-400" />
                  </div>
                  <div className="h-2 w-32 bg-amber-950/80 rounded-full overflow-hidden border border-amber-500/30 p-0.5 mx-3">
                    <div className="h-full bg-amber-400 rounded-full w-2/3" />
                  </div>
                  <div className={`w-12 h-12 rounded-full border-4 border-amber-400/90 bg-[#1f2129] flex items-center justify-center shadow-lg ${playingTrackId ? "animate-spin [animation-duration:1.5s]" : ""}`}>
                    <div className="w-4 h-4 rounded-full bg-stone-300/40 border border-stone-400" />
                  </div>
                </div>
              </div>

              {/* Soundscape Track Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SOUNDSCAPES.map((sound) => {
                  const isPlaying = playingTrackId === sound.id;
                  return (
                    <button
                      key={sound.id}
                      type="button"
                      onClick={() => handlePlaySoundscape(sound.id, sound.type)}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left cursor-pointer ${
                        isPlaying
                          ? "bg-amber-400/20 border-amber-400 text-white shadow-xl ring-2 ring-amber-400/40 scale-102"
                          : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center text-xl shrink-0">
                        {isPlaying ? <Volume2 className="w-5 h-5 text-amber-300 animate-bounce" /> : sound.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono text-amber-400 font-bold">{sound.track}</div>
                        <div className="text-xs font-bold truncate mt-0.5 font-display">{sound.name}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Voice Recorder & Feed */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-[#1a1c22] border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm">
                <h3 className="text-sm font-bold font-display flex items-center gap-2 mb-2">
                  <Mic className="w-4 h-4 text-primary" />
                  <span>কণ্ঠ চিরকুট রেকর্ড করুন</span>
                </h3>
                <div className="flex flex-col items-center justify-center py-6 bg-stone-50 dark:bg-stone-900 rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-700 mb-3">
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer ${
                      isRecording ? "bg-rose-600 text-white" : "bg-[#8B1538] text-white"
                    }`}
                  >
                    {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>
                  <span className="text-sm font-bold font-display text-foreground mt-2">
                    0:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} / 0:45
                  </span>
                </div>

                {recordedAudioUrl && (
                  <div className="space-y-2.5">
                    <audio src={recordedAudioUrl} controls className="w-full h-8" />
                    <Input
                      placeholder="নাম ও বিভাগ *"
                      value={audioNoteAuthor}
                      onChange={(e) => setAudioNoteAuthor(e.target.value)}
                      className="h-8 text-xs rounded-xl"
                    />
                    <Input
                      placeholder="চিরকুটের শিরোনাম *"
                      value={audioNoteTitle}
                      onChange={(e) => setAudioNoteTitle(e.target.value)}
                      className="h-8 text-xs rounded-xl"
                    />
                    <Button onClick={handleSaveVoiceNote} className="w-full h-8 text-xs font-bold bg-[#8B1538] text-white">
                      সংরক্ষণ করুন
                    </Button>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-[#1a1c22] border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm">
                <h3 className="text-sm font-bold font-display flex items-center gap-2 mb-3">
                  <Music className="w-4 h-4 text-primary" />
                  <span>বন্ধুদের ক্যাসেট ফিতা</span>
                </h3>
                <div className="space-y-2.5">
                  {voiceNotes.map((note) => (
                    <div key={note.id} className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold font-display">{note.title}</div>
                        <div className="text-[10px] text-muted-foreground">{note.author} • {note.timeAgo}</div>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                        {note.duration}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================
            TAB 3: BATCH BUCKET LIST & CORKBOARD NOTES
           ======================================================== */}
        {activeTab === "bucket" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            
            <div className="rounded-2xl bg-[#EDE4D8] dark:bg-stone-800/80 p-4 sm:p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                  ৭০০ একর বাকেট ডায়েরি
                </span>
                <h3 className="text-base sm:text-lg font-black font-display text-stone-900 dark:text-stone-100">
                  ক্যাম্পাস ছাড়ার আগে অন্তত একবার করতেই হবে!
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                  সম্পন্ন হয়েছে: <strong className="text-foreground">{completedBucketCount}</strong> / {bucketItems.length} টি
                </p>
              </div>

              <div className="text-right">
                <span className="text-3xl font-black text-[#8B1538] dark:text-amber-400 font-display">
                  {Math.round((completedBucketCount / Math.max(1, bucketItems.length)) * 100)}%
                </span>
              </div>
            </div>

            <form onSubmit={handleAddCustomBucket} className="flex gap-2 bg-white dark:bg-stone-800 p-2 rounded-xl border border-stone-200 dark:border-stone-700">
              <Input
                placeholder="নতুন বাকেট স্মৃতি যোগ করতে লিখুন..."
                value={newBucketText}
                onChange={(e) => setNewBucketText(e.target.value)}
                className="h-9 text-xs border-0 focus-visible:ring-0 shadow-none"
              />
              <Button type="submit" size="sm" className="h-8 font-bold text-xs rounded-lg bg-[#8B1538] text-white">
                যোগ করুন
              </Button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {bucketItems.map((item) => {
                const isDone = !!userCheckedBuckets[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleBucketItem(item.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${item.color} ${
                      isDone ? "opacity-80" : "hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {isDone ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">✓</div>
                        ) : (
                          <Circle className="w-4 h-4 text-stone-400" />
                        )}
                      </div>
                      <div>
                        <div className={`text-xs font-bold font-display ${isDone ? "line-through text-stone-500" : "text-stone-900"}`}>
                          {item.text}
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/10 text-stone-700 mt-1 inline-block">
                          {item.category}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-stone-500 shrink-0">
                      {item.doneCount} জন
                    </span>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ========================================================
            TAB 4: YEARBOOK HALL OF FAME
           ======================================================== */}
        {activeTab === "yearbook" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-display flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>ব্যাচ ইয়ারবুক ও হল অব ফেম</span>
                </h3>
                <p className="text-xs text-muted-foreground">বন্ধুদের মজার সব খেতাবে ভোট দিন</p>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  setSelectedCatId(yearbook[0]?.id || "");
                  setNominateModalOpen(true);
                }}
                className="text-xs font-bold rounded-xl bg-[#8B1538] text-white"
              >
                + বন্ধু নমিনেট
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {yearbook.map((cat) => (
                <div key={cat.id} className="bg-white dark:bg-[#1a1c22] border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-xs">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-2xl">{cat.emoji}</span>
                    <h4 className="text-sm font-bold font-display">{cat.title}</h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-3">{cat.description}</p>

                  <div className="space-y-1.5">
                    {cat.nominees.map((nom, idx) => {
                      const voteKey = `${cat.id}_${nom.id}`;
                      const isVoted = !!votedNominees[voteKey];
                      return (
                        <div key={nom.id} className="p-2 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 flex items-center justify-between">
                          <div className="truncate">
                            <span className="text-xs font-bold text-foreground font-display">{nom.name}</span>
                            <span className="text-[9px] text-muted-foreground ml-1.5">({nom.dept})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleVoteNominee(cat.id, nom.id)}
                            disabled={isVoted}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                              isVoted ? "bg-rose-600 text-white" : "bg-white border text-stone-700"
                            }`}
                          >
                            <Heart className="w-3 h-3 fill-current" />
                            <span>{nom.votes}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>

      {/* Nominate Friend Modal */}
      {nominateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border border-border p-6 rounded-3xl shadow-2xl">
            <h3 className="text-base font-bold font-display mb-1 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>ইয়ারবুকে বন্ধু নমিনেট করুন</span>
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              আপনার বন্ধুর নাম এবং বিভাগ লিখে নমিনেশন তালিকাভুক্ত করুন
            </p>

            <form onSubmit={handleNominateSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold block mb-1">খেতাব ক্যাটাগরি</label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-semibold"
                >
                  {yearbook.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">বন্ধুর পুরো নাম বা ডাকনাম *</label>
                <Input
                  value={nomineeName}
                  onChange={(e) => setNomineeName(e.target.value)}
                  placeholder="যেমন: সাকিব হাসান"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">বিভাগ (Department)</label>
                <Input
                  value={nomineeDept}
                  onChange={(e) => setNomineeDept(e.target.value)}
                  placeholder="যেমন: কম্পিউটার সায়েন্স অ্যান্ড ইঞ্জিনিয়ারিং"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setNominateModalOpen(false)}
                >
                  বাতিল
                </Button>
                <Button type="submit" className="bg-[#8B1538] text-white font-bold hover:bg-[#68001a]">
                  নমিনেট করুন
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
