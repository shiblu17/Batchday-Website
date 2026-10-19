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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";

// ==========================================
// 1. BOTTOLA FOOD DATA
// ==========================================
const BOTTOLA_ITEMS = [
  { id: "bf_1", title: "খিচুড়ি ও ২০ পদের ভর্তা", desc: "বটতলার সিগনেচার স্পেশাল মিল। দুপুর আর রাতের চিরকালীন আড্ডা।", votes: 412, icon: "🍛", tag: "সিগনেচার" },
  { id: "bf_2", title: "কড়াইয়ের হাঁসের মাংস", desc: "শীতের রাতে বটতলার সেরা আকর্ষণ। সাথে ভুনা খিচুড়ির ধোঁয়া।", votes: 389, icon: "🍲", tag: "শীতের স্পেশাল" },
  { id: "bf_3", title: "ইলিশ ভুনা ও বেগুন ভাজা", desc: "কড়কড়ে বেগুন ভাজা আর পদ্মার ইলিশের খাঁটি স্বাদ।", votes: 310, icon: "🐟", tag: "জনপ্রিয়" },
  { id: "bf_4", title: "মুরাদ চত্বরের মালাই চা ও পিঁয়াজু", desc: "সন্ধ্যার চিরকালীন ক্লাসিক আড্ডার নির্ভরযোগ্য ঠিকানা।", votes: 456, icon: "☕", tag: "আড্ডা স্পেশাল" },
  { id: "bf_5", title: "টারজান পয়েন্টের চিকেন শর্মা", desc: "ক্লাস বাঙ্কের পর লেকের বাতাসে বসে প্রিয় রোল ও শর্মা।", votes: 278, icon: "🌯", tag: "স্ট্রিট বাইটস" },
  { id: "bf_6", title: "ক্যাফেটেরিয়ার গরম শিঙাড়া", desc: "সকালে ক্লাসের ফাঁকে লাল চা আর কুড়মুড়ে শিঙাড়া।", votes: 395, icon: "🥟", tag: "বাজেট ফেভারিট" },
  { id: "bf_7", title: "প্রান্তিক গেটের ঝাল ফুচকা", desc: "লেকের পাড়ে বসে বন্ধুদের সাথে ঝাল তেঁতুল জলের ফুচকা।", votes: 340, icon: "🌶️", tag: "সন্ধ্যা স্পেশাল" },
  { id: "bf_8", title: "ডেইরি গেটের মিষ্টি দই", desc: "পরীক্ষা শেষে কিংবা ব্যাচ ডে-র মিষ্টি মুখের চিরকালীন মিষ্টি।", votes: 285, icon: "🍧", tag: "ডেজার্ট" },
];

const VORTA_LIST = [
  { name: "কালিজিরা ভর্তা", icon: "🌱", color: "#18181b" },
  { name: "শুঁটকি ভর্তা", icon: "🐟", color: "#b91c1c" },
  { name: "সরিষা ইলিশ ভর্তা", icon: "✨", color: "#ca8a04" },
  { name: "টাকি মাছ ভর্তা", icon: "🐠", color: "#047857" },
  { name: "ডাল ভর্তা", icon: "🥣", color: "#ea580c" },
  { name: "আলু ভর্তা", icon: "🥔", color: "#d97706" },
  { name: "বেগুন পোড়া ভর্তা", icon: "🍆", color: "#6b21a8" },
  { name: "মরিচ পোড়া ভর্তা", icon: "🌶️", color: "#dc2626" },
  { name: "বাদাম ভর্তা", icon: "🥜", color: "#9a3412" },
  { name: "পেঁপে ভর্তা", icon: "🍈", color: "#16a34a" },
  { name: "বরবটি ভর্তা", icon: "🥬", color: "#059669" },
  { name: "ডিম ভর্তা", icon: "🥚", color: "#c2410c" },
];

// ==========================================
// 2. BUCKET LIST DATA
// ==========================================
const INITIAL_BUCKET_ITEMS = [
  { id: "bk_1", text: "শীতের কুয়াশাচ্ছন্ন ভোরে লেকে অতিথি পাখি দেখা", doneCount: 421, category: "প্রকৃতি", color: "bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800" },
  { id: "bk_2", text: "বটতলায় টানা ১০ রকমের ভর্তা একসাথে টেস্ট করা", doneCount: 385, category: "খাবার", color: "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800" },
  { id: "bk_3", text: "মুক্তমঞ্চে শীতের রাতে খোলা আকাশের নিচে নাটক দেখা", doneCount: 442, category: "কালচার", color: "bg-rose-100 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800" },
  { id: "bk_4", text: "ট্রান্সপোর্টের শেষ বাসে চড়ে গান গেয়ে শহরে ফেরা", doneCount: 367, category: "ভ্রমণ", color: "bg-sky-100 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800" },
  { id: "bk_5", text: "শহীদ মিনারের সিঁড়িতে বসে মধ্যরাতে গিটার বাজানো", doneCount: 410, category: "আড্ডা", color: "bg-purple-100 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800" },
  { id: "bk_6", text: "টারজান পয়েন্টে ক্লাস বাংক করে বন্ধুদের নিয়ে মালাই চা খাওয়া", doneCount: 489, category: "আড্ডা", color: "bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800" },
  { id: "bk_7", text: "কেন্দ্রীয় লাইব্রেরিতে পড়াশোনার ভান করে গভীর ঘুমে ঢলে পড়া", doneCount: 398, category: "একাডেমিক", color: "bg-teal-100 dark:bg-teal-950/40 border-teal-300 dark:border-teal-800" },
  { id: "bk_8", text: "ক্যাফেটেরিয়ার ছাদে বা মাঠে বসে লাল রক্তিম সূর্যাস্ত দেখা", doneCount: 430, category: "স্মৃতি", color: "bg-orange-100 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800" },
  { id: "bk_9", text: "পুরো ক্যাম্পাস এক রিকশায় চড়ে টুংটাং বেল বাজিয়ে চক্কর দেওয়া", doneCount: 356, category: "রোমাঞ্চ", color: "bg-lime-100 dark:bg-lime-950/40 border-lime-300 dark:border-lime-800" },
  { id: "bk_10", text: "অমর একুশে ও জয় বাংলার সামনে ব্যাচমেটদের সাথে ছবি তোলা", doneCount: 478, category: "ছবি", color: "bg-pink-100 dark:bg-pink-950/40 border-pink-300 dark:border-pink-800" },
];

// ==========================================
// 3. YEARBOOK CATEGORIES
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
  nominees: Nominee[];
}

const INITIAL_YEARBOOK: YearbookCategory[] = [
  {
    id: "yb_night_owl",
    title: "রাতজাগা আড্ডাবাজ",
    emoji: "🌙",
    description: "রাত ৩টায় যাকে সবসময় শহীদ মিনার বা বটতলায় পাওয়া যায়",
    tapeColor: "#3b82f6",
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
    nominees: [
      { id: "nom_12", name: "সাইফুল ইসলাম", dept: "সরকার ও রাজনীতি", votes: 58 },
      { id: "nom_13", name: "কামরুল হাসান", dept: "আন্তর্জাতিক সম্পর্ক", votes: 44 },
    ],
  },
];

// ==========================================
// 4. CASSETTE SOUNDSCAPES (WEB AUDIO API)
// ==========================================
const SOUNDSCAPES = [
  { id: "birds", name: "শীতের অতিথি পাখির কলতান", icon: "🦆", track: "Track 01", type: "chirp" },
  { id: "rickshaw", name: "প্রান্তিক গেটের রিকশার টুংটাং", icon: "🚲", track: "Track 02", type: "bell" },
  { id: "drums", name: "মুক্তমঞ্চের নাটকের ড্রাম ও খোল", icon: "🥁", track: "Track 03", type: "drum" },
  { id: "guitar", name: "শহীদ মিনারের মধ্যরাতের কর্ড", icon: "🎸", track: "Track 04", type: "guitar" },
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
    },
    {
      id: "vn_2",
      author: "মৌসুমী (ইংরেজি)",
      title: "বটতলার খিচুড়ি আর আড্ডার বন্ধুদের মিস করব",
      duration: "0:18",
      timeAgo: "৫ ঘণ্টা আগে",
      likes: 24,
    },
    {
      id: "vn_3",
      author: "ফারহান (আইবিএ)",
      title: "ট্রান্সপোর্টের শেষ বাসের গানগুলো!",
      duration: "0:30",
      timeAgo: "১ দিন আগে",
      likes: 31,
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
        // Rickshaw bell sound (double ring metallic ping)
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
        // Bird tweet/chirp sound
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
        // Acoustic guitar resonant warm chord (Em: E, G, B, E)
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
        // Muktamancha dramatic deep drum beats
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
    };

    setVoiceNotes([newNote, ...voiceNotes]);
    setRecordedAudioUrl(null);
    setAudioNoteTitle("");
    setRecordingSeconds(0);

    confetti({ particleCount: 60, spread: 60 });
    toast({
      title: "ক্যাসেটে সংরক্ষিত হয়েছে! 📼",
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

  // Vorta Scorecard Certificate Title
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
      color: "bg-yellow-100 dark:bg-yellow-950/40 border-yellow-300 dark:border-yellow-800",
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
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#0e0f12] text-foreground pb-28 pt-4 md:pt-8 transition-colors select-none font-body">
      
      {/* ===== VINTAGE SCRAPBOOK COVER BANNER ===== */}
      <div className="container max-w-5xl mx-auto px-4 mb-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#800020] via-[#5c0218] to-[#38010f] p-6 sm:p-8 text-white shadow-xl border border-amber-500/20">
          
          {/* Subtle Decorative Paper/Parchment Texture Overlay */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, #ffffff 1px, transparent 1px)`,
              backgroundSize: "16px 16px",
            }}
          />

          {/* Washi Tape Accent Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-sm bg-amber-200/90 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 text-xs font-black shadow-sm transform -rotate-1 border-dashed border-amber-400 mb-3">
            <Bookmark className="w-3.5 h-3.5 fill-current" />
            <span className="font-display tracking-wide uppercase">JU-52 Campus Scrapbook & Nostalgia Hub</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <h1 className="text-2xl sm:text-4xl font-black font-display tracking-tight flex items-center gap-2.5">
                <span>জাবি ভাইবস ও স্মৃতি চত্বর</span>
                <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
              </h1>
              <p className="text-xs sm:text-sm text-amber-100/80 mt-1 max-w-xl font-body">
                বটতলার স্বাদ, বন্ধুদের কণ্ঠস্বর, অসমাপ্ত বাকেট লিস্ট আর ইয়ারবুকের স্মরণীয় সব আড্ডা।
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-2 bg-black/25 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shrink-0">
              <span className="text-xs font-bold text-amber-200">
                ৫২তম ব্যাচ ডায়েরি
              </span>
              <span className="text-white/40">•</span>
              <span className="text-xs font-semibold text-white/90">
                স্মৃতি চির অম্লান
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== HORIZONTAL SLIDING VINTAGE SCRAPBOOK TABS ===== */}
      <div className="container max-w-5xl mx-auto px-4 mb-8">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {[
            { id: "bottola", label: "বটতলা খাদ্য বিলাস", icon: Utensils, badge: "ভর্তা মিটার" },
            { id: "audio", label: "রেট্রো ক্যাসেট ও চিরকুট", icon: Disc, badge: "কণ্ঠস্বর" },
            { id: "bucket", label: "ব্যাচ বাকেট ডায়েরি", icon: Pin, badge: "চেকলিস্ট" },
            { id: "yearbook", label: "ইয়ারবুক হল অব ফেম", icon: Trophy, badge: "লিজেন্ডস" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-[#800020] text-white shadow-lg shadow-[#800020]/25 scale-102 ring-2 ring-amber-400/50"
                    : "bg-card border border-border/70 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-amber-300" : "text-muted-foreground"}`} />
                <span className="font-display">{tab.label}</span>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== TAB CONTENT CONTAINER ===== */}
      <div className="container max-w-5xl mx-auto px-4">
        
        {/* ========================================================
            TAB 1: BOTTOLA VINTAGE PLATTER & RUBBER STAMP BOARD
           ======================================================== */}
        {activeTab === "bottola" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* 1.1 VINTAGE ENGRAVED VORTA CERTIFICATE */}
            <div className="relative rounded-3xl bg-[#fffefb] dark:bg-[#18191f] border-2 border-amber-300/80 dark:border-amber-900/50 p-6 sm:p-8 shadow-md overflow-hidden">
              {/* Corner Ornaments */}
              <div className="absolute top-2 left-2 text-amber-500/30 text-xl font-serif">❖</div>
              <div className="absolute top-2 right-2 text-amber-500/30 text-xl font-serif">❖</div>
              <div className="absolute bottom-2 left-2 text-amber-500/30 text-xl font-serif">❖</div>
              <div className="absolute bottom-2 right-2 text-amber-500/30 text-xl font-serif">❖</div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-dashed border-amber-300/60 dark:border-amber-900/60 pb-6 mb-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-bold uppercase tracking-wider mb-2">
                    <span>জাহাঙ্গীরনগর বিশ্ববিদ্যালয় বটতলা খাদ্যবিলাস সনদপত্র</span>
                  </div>
                  <h2 className="text-xl sm:text-3xl font-black font-display text-foreground flex items-center gap-2">
                    <span>{vortaTitle}</span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    ১২টি ক্লাসিক ভর্তার মধ্যে আপনি <strong className="text-foreground font-bold">{vortaCount}</strong>টি টেস্ট করেছেন (স্ট্যাটাস: <span className="text-primary font-bold">{certificateRank}</span>)
                  </p>
                </div>

                {/* Wax Seal Badge Visual */}
                <div className="relative flex items-center justify-center shrink-0">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#800020] to-[#500000] border-4 border-amber-400 flex flex-col items-center justify-center text-white shadow-xl rotate-[-3deg]">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300">JU-52</span>
                    <span className="text-xl font-black font-display leading-tight">{vortaCount}/12</span>
                    <span className="text-[9px] font-bold text-amber-200">ভর্তা টেস্টেড</span>
                  </div>
                </div>
              </div>

              {/* 1.2 12 VORTA RUBBER STAMP DISHES */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs sm:text-sm font-bold text-foreground font-display flex items-center gap-1.5">
                    <span>🍽️ ভর্তার থালা (ক্লিক করে "টেস্টেড!" রাবার স্ট্যাম্প দিন):</span>
                  </h3>
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    স্কোর: {Math.round((vortaCount / 12) * 100)}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {VORTA_LIST.map((vorta) => {
                    const isChecked = checkedVortas.includes(vorta.name);
                    return (
                      <button
                        key={vorta.name}
                        type="button"
                        onClick={() => toggleVorta(vorta.name)}
                        className={`relative group p-3.5 rounded-2xl border text-left transition-all overflow-hidden flex flex-col justify-between min-h-[92px] ${
                          isChecked
                            ? "bg-amber-50/70 dark:bg-amber-950/20 border-red-500/60 shadow-md scale-[1.02]"
                            : "bg-card border-border/70 hover:border-amber-400 hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-2xl">{vorta.icon}</span>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: vorta.color }} />
                        </div>

                        <span className="text-xs sm:text-sm font-bold text-foreground mt-2 truncate font-display">
                          {vorta.name}
                        </span>

                        {/* AUTHENTIC DISTRESSED RUBBER STAMP OVERLAY */}
                        {isChecked && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-red-500/5 backdrop-blur-[0.5px]">
                            <div className="border-2 border-red-600 dark:border-red-500 text-red-600 dark:text-red-500 font-black text-xs px-2 py-0.5 rounded tracking-widest uppercase transform rotate-[-12deg] shadow-sm animate-in zoom-in-75 duration-150">
                              টেস্টেড! ✓
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 1.3 BOTTOLA ICONIC MEALS (Vintage Cafe Menu Board) */}
            <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-display flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-500" />
                    <span>বটতলা ও ক্যাম্পাসের জনপ্রিয় খাবার রেটিং</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    আপনার প্রিয় জাবি খাবারে ভোট দিয়ে ব্যাচের শীর্ষ স্বাদ নির্বাচন করুন
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {foodItems.map((item) => (
                  <div
                    key={item.id}
                    className="relative bg-muted/20 border border-border/70 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-3xl">{item.icon}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300">
                          {item.tag}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold font-display leading-snug">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.desc}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                      <span className="text-xs font-bold text-primary flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 fill-primary" />
                        {item.votes} ভোট
                      </span>

                      <Button
                        size="sm"
                        variant={foodVoted[item.id] ? "secondary" : "outline"}
                        onClick={() => handleVoteFood(item.id)}
                        disabled={foodVoted[item.id]}
                        className="h-8 text-xs font-bold rounded-xl"
                      >
                        {foodVoted[item.id] ? "ভোট সম্পন্ন" : "ভোট দিন"}
                      </Button>
                    </div>
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
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* 2.1 REALISTIC RETRO CASSETTE TAPE SHELL */}
            <div className="relative rounded-3xl bg-gradient-to-b from-[#22242b] via-[#1a1b21] to-[#111216] border-2 border-amber-600/40 p-6 sm:p-8 text-white shadow-2xl overflow-hidden">
              
              {/* Cassette Top Header Bar */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
                    JU-52 CAMPUS CASSETTE DECK
                  </span>
                </div>
                <span className="text-[10px] font-mono text-white/50">STEREO / 60 MIN</span>
              </div>

              {/* CASSETTE BODY VISUAL */}
              <div className="relative max-w-md mx-auto aspect-[16/10] bg-[#2b2d38] rounded-2xl border-2 border-white/10 p-4 shadow-inner flex flex-col justify-between mb-6">
                
                {/* Cassette Label Strip */}
                <div className="bg-[#fffdf7] text-slate-900 rounded-lg p-2.5 shadow-sm text-center border-t-4 border-amber-500">
                  <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                    JAHANGIRNAGAR UNIVERSITY 52ND BATCH
                  </div>
                  <div className="text-base font-black font-cursive text-[#800020] tracking-wide mt-0.5">
                    "স্মৃতির মুক্তমঞ্চ ও লেকের গান • সাইড এ"
                  </div>
                </div>

                {/* Cassette Tape Spools Window */}
                <div className="flex items-center justify-around bg-[#14151a] rounded-xl py-3 px-6 border border-white/10 shadow-inner">
                  {/* Left Spool */}
                  <div className={`w-12 h-12 rounded-full border-4 border-amber-400/80 bg-[#1e2029] flex items-center justify-center ${playingTrackId ? "animate-spin [animation-duration:2s]" : ""}`}>
                    <div className="w-4 h-4 rounded-full bg-white/20" />
                  </div>

                  {/* Tape Reel Indicator Line */}
                  <div className="h-2 flex-1 mx-4 bg-amber-950/60 rounded-full overflow-hidden border border-amber-500/20">
                    <div className="h-full bg-amber-500 w-3/4" />
                  </div>

                  {/* Right Spool */}
                  <div className={`w-12 h-12 rounded-full border-4 border-amber-400/80 bg-[#1e2029] flex items-center justify-center ${playingTrackId ? "animate-spin [animation-duration:2s]" : ""}`}>
                    <div className="w-4 h-4 rounded-full bg-white/20" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono text-white/40 px-2">
                  <span>SIDE A [NORMAL BIAS]</span>
                  <span>1970 - 2026</span>
                </div>
              </div>

              {/* 2.2 CASSETTE TRACK SOUNDSCAPES BUTTONS */}
              <div className="mb-2">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block mb-3">
                  ক্যাম্পাস সাউন্ড ট্র‍্যাক নির্বাচন করুন (শব্দ শুনতে ক্লিক করুন):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {SOUNDSCAPES.map((sound) => {
                    const isPlaying = playingTrackId === sound.id;
                    return (
                      <button
                        key={sound.id}
                        type="button"
                        onClick={() => handlePlaySoundscape(sound.id, sound.type)}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left cursor-pointer ${
                          isPlaying
                            ? "bg-amber-500/20 border-amber-400 text-white shadow-lg ring-2 ring-amber-400/30 scale-102"
                            : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center text-xl shrink-0">
                          {isPlaying ? <Volume2 className="w-5 h-5 text-amber-300 animate-bounce" /> : sound.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-mono text-amber-400">{sound.track}</div>
                          <div className="text-xs font-bold truncate mt-0.5">{sound.name}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2.3 RETRO VOICE RECORDER & COMMUNITY TAPES */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Voice Note Recorder (Span 5) */}
              <div className="lg:col-span-5 bg-card border border-border/80 rounded-3xl p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-base font-bold font-display flex items-center gap-2">
                    <Mic className="w-4 h-4 text-primary" />
                    <span>কণ্ঠ চিরকুট রেকর্ড করুন</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    বন্ধুদের উদ্দেশ্যে কোনো স্মৃতি, গান বা বিদায়ী চিরকুট রেকর্ড করুন
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center py-6 bg-muted/30 rounded-2xl border-2 border-dashed border-border/80 mb-4">
                  <div className="relative mb-3">
                    {isRecording && (
                      <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-75" />
                    )}
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg cursor-pointer ${
                        isRecording
                          ? "bg-rose-600 text-white hover:bg-rose-700"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {isRecording ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                    </button>
                  </div>

                  <div className="text-center">
                    <span className="text-base font-black font-display text-foreground">
                      0:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} / 0:45
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {isRecording ? "রেকর্ডিং চলছে... থামাতে চাপুন" : "রেকর্ড করতে মাইক্রোফোনে চাপুন"}
                    </p>
                  </div>
                </div>

                {recordedAudioUrl && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <audio src={recordedAudioUrl} controls className="w-full h-10 rounded-xl" />

                    <div>
                      <label className="text-xs font-bold text-muted-foreground block mb-1">
                        আপনার নাম ও বিভাগ *
                      </label>
                      <Input
                        placeholder="যেমন: রাশেদ (ইংরেজি)"
                        value={audioNoteAuthor}
                        onChange={(e) => setAudioNoteAuthor(e.target.value)}
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-muted-foreground block mb-1">
                        চিরকুটের শিরোনাম *
                      </label>
                      <Input
                        placeholder="যেমন: ক্যাফেটেরিয়ার সকালের আড্ডা..."
                        value={audioNoteTitle}
                        onChange={(e) => setAudioNoteTitle(e.target.value)}
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>

                    <Button
                      onClick={handleSaveVoiceNote}
                      className="w-full h-10 rounded-xl font-bold text-xs bg-primary text-primary-foreground gap-1.5 shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" />
                      ক্যাসেট ফিতায় সেভ করুন
                    </Button>
                  </div>
                )}
              </div>

              {/* Community Mixtape Feed (Span 7) */}
              <div className="lg:col-span-7 bg-card border border-border/80 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold font-display flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-primary" />
                    <span>ব্যাচমেটদের কণ্ঠ চিরকুট সংগ্রহশালা</span>
                  </h3>
                  <span className="text-xs font-bold text-muted-foreground">
                    {voiceNotes.length} টি চিরকুট
                  </span>
                </div>

                <div className="space-y-3">
                  {voiceNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3.5 rounded-2xl border border-border/70 bg-[#fffdfa] dark:bg-[#1a1b22] hover:shadow-md transition-all flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Disc className="w-5 h-5 animate-spin [animation-duration:8s]" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-foreground font-display">{note.title}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            কণ্ঠ: <strong className="text-foreground">{note.author}</strong> • {note.timeAgo}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold bg-muted px-2 py-0.5 rounded-md">
                          {note.duration}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                        >
                          <Heart className="w-4 h-4 fill-rose-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================
            TAB 3: BATCH BUCKET LIST & PINNED STICKY NOTES
           ======================================================== */}
        {activeTab === "bucket" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Scrapbook Milestone Progress Banner */}
            <div className="rounded-3xl bg-[#fffefb] dark:bg-[#18191f] border-2 border-amber-300 dark:border-amber-900/60 p-6 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-sm bg-amber-200 text-amber-900 text-[10px] font-bold uppercase transform -rotate-1 mb-2">
                    <Pin className="w-3 h-3 fill-current" />
                    <span>৫২তম ব্যাচ ক্যাম্পাস বাকেট ডায়েরি</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black font-display text-foreground">
                    ক্যাম্পাস ছাড়ার আগে অন্তত একবার করতেই হবে!
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    আপনার সম্পন্ন হয়েছে: <strong className="text-foreground">{completedBucketCount}</strong> / {bucketItems.length} টি স্মৃতি
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-3xl font-black text-[#800020] dark:text-amber-400 font-display">
                    {Math.round((completedBucketCount / Math.max(1, bucketItems.length)) * 100)}%
                  </span>
                  <div className="text-[10px] text-muted-foreground font-semibold">সম্পন্ন স্কোর</div>
                </div>
              </div>

              {/* Vintage Ruler Progress Track */}
              <div className="w-full bg-muted/60 h-3 rounded-full overflow-hidden p-0.5 border border-border">
                <div
                  className="bg-gradient-to-r from-amber-500 to-[#800020] h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round((completedBucketCount / Math.max(1, bucketItems.length)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Add Custom Sticky Note Form */}
            <form
              onSubmit={handleAddCustomBucket}
              className="flex items-center gap-2 bg-[#fffdf8] dark:bg-[#1c1d24] p-2.5 rounded-2xl border-2 border-dashed border-amber-400/80 shadow-sm"
            >
              <Input
                placeholder="নতুন কোনো জাবি বাকেট স্মৃতি ডায়েরিতে যোগ করতে চান? লিখুন..."
                value={newBucketText}
                onChange={(e) => setNewBucketText(e.target.value)}
                className="h-10 text-xs border-0 focus-visible:ring-0 shadow-none bg-transparent"
              />
              <Button type="submit" size="sm" className="h-9 font-bold text-xs rounded-xl gap-1 shrink-0 bg-[#800020] text-white hover:bg-[#68001a]">
                <Plus className="w-3.5 h-3.5" />
                পিন করুন
              </Button>
            </form>

            {/* PINNED STICKY NOTES GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
              {bucketItems.map((item) => {
                const isDone = !!userCheckedBuckets[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleBucketItem(item.id)}
                    className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3 text-left shadow-sm hover:shadow-md ${
                      item.color
                    } ${
                      isDone
                        ? "opacity-85 shadow-none"
                        : "hover:scale-[1.01]"
                    }`}
                  >
                    {/* Pushpin at Top Center */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-red-600 shadow-md border-2 border-white flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
                    </div>

                    <div className="flex items-start gap-3 mt-1 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        {isDone ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                            ✓
                          </div>
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground/60" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div
                          className={`text-xs sm:text-sm font-bold font-display leading-snug ${
                            isDone ? "line-through text-muted-foreground" : "text-foreground"
                          }`}
                        >
                          {item.text}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/10 text-foreground/80">
                            {item.category}
                          </span>
                          {isDone && (
                            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400">
                              সম্পন্ন হয়েছে!
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 text-[10px] font-mono font-bold text-muted-foreground">
                      {item.doneCount} জন
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ========================================================
            TAB 4: POLAROID WALL & YEARBOOK HALL OF FAME
           ======================================================== */}
        {activeTab === "yearbook" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold font-display flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>পোলারয়েড ওয়াল ও ব্যাচ হল অব ফেম</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ব্যাচের কে কেমন? বন্ধুদের মজার সব খেতাবে ভোট দিন ও নতুন নাম নমিনেট করুন
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  setSelectedCatId(yearbook[0]?.id || "");
                  setNominateModalOpen(true);
                }}
                className="text-xs font-bold rounded-xl gap-1.5 shadow-sm bg-[#800020] text-white hover:bg-[#68001a]"
              >
                <Plus className="w-3.5 h-3.5" />
                বন্ধু নমিনেট করুন
              </Button>
            </div>

            {/* POLAROID STYLE CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {yearbook.map((cat) => (
                <div
                  key={cat.id}
                  className="relative bg-[#fffefb] dark:bg-[#18191f] border-2 border-border/80 rounded-3xl p-5 shadow-md flex flex-col justify-between group hover:shadow-xl transition-all"
                >
                  {/* Tape Accent */}
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-0.5 rounded text-[10px] font-bold text-white shadow-sm transform -rotate-2"
                    style={{ backgroundColor: cat.tapeColor }}
                  >
                    JU-52 খেতাব
                  </div>

                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl">{cat.emoji}</span>
                      <h3 className="text-sm font-bold font-display">{cat.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">{cat.description}</p>

                    {/* Nominees List */}
                    <div className="space-y-2">
                      {cat.nominees.map((nom, idx) => {
                        const voteKey = `${cat.id}_${nom.id}`;
                        const isVoted = !!votedNominees[voteKey];
                        return (
                          <div
                            key={nom.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                              idx === 0
                                ? "bg-amber-100/60 dark:bg-amber-950/30 border-amber-400"
                                : "bg-muted/30 border-border/60"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-black text-muted-foreground w-4">
                                {idx === 0 ? "👑" : `#${idx + 1}`}
                              </span>
                              <div className="truncate">
                                <div className="text-xs font-bold text-foreground truncate font-display">
                                  {nom.name}
                                </div>
                                <div className="text-[9px] text-muted-foreground truncate">
                                  {nom.dept}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleVoteNominee(cat.id, nom.id)}
                              disabled={isVoted}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                isVoted
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "bg-card border border-border hover:bg-muted"
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

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCatId(cat.id);
                      setNominateModalOpen(true);
                    }}
                    className="mt-4 pt-3 border-t border-border/50 text-[11px] font-bold text-primary hover:underline text-center w-full"
                  >
                    + এই খেতাবে অন্য বন্ধুকে যোগ করুন
                  </button>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>

      {/* Nominate Friend Modal */}
      {nominateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
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
                <Button type="submit" className="bg-[#800020] text-white font-bold hover:bg-[#68001a]">
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
