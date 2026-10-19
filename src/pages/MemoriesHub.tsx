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
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";

// ==========================================
// 1. BOTTOLA FOOD METER DATA
// ==========================================
const BOTTOLA_ITEMS = [
  { id: "bf_1", title: "খিচুড়ি ও ২০ পদের ভর্তা", desc: "বটতলার সিগনেচার স্পেশাল মিল", votes: 412, icon: "🍛" },
  { id: "bf_2", title: "কড়াইয়ের হাঁসের মাংস", desc: "শীতের রাতে বটতলার সেরা আকর্ষণ", votes: 389, icon: "🍲" },
  { id: "bf_3", title: "ইলিশ ভুনা ও বেগুন ভাজা", desc: "গরম ভাতের সাথে অতুলনীয় তৃপ্তি", votes: 310, icon: "🐟" },
  { id: "bf_4", title: "মুরাদ চত্বরের মালাই চা ও পিঁয়াজু", desc: "সন্ধ্যার চিরকালীন ক্লাসিক আড্ডা", votes: 456, icon: "☕" },
  { id: "bf_5", title: "টারজান পয়েন্টের চিকেন শর্মা", desc: "ক্লাস বাঙ্কের পর প্রিয় স্ট্রিট ফুড", votes: 278, icon: "🌯" },
  { id: "bf_6", title: "ক্যাফেটেরিয়ার গরম শিঙাড়া", desc: "সকালে ক্লাসের ফাঁকে এক কাপ চায়ের সাথে", votes: 395, icon: "🥟" },
  { id: "bf_7", title: "প্রান্তিক গেটের ঝাল ফুচকা", desc: "লেকের পাড়ে বসে ফুচকার ঝাল", votes: 340, icon: "🌶️" },
  { id: "bf_8", title: "ডেইরি গেটের মিষ্টি দই", desc: "পরীক্ষা শেষে মিষ্টি মুখের আনন্দ", votes: 285, icon: "🍧" },
];

const VORTA_LIST = [
  "কালিজিরা ভর্তা",
  "শুঁটকি ভর্তা",
  "সরিষা ইলিশ ভর্তা",
  "টাকি মাছ ভর্তা",
  "ডাল ভর্তা",
  "আলু ভর্তা",
  "বেগুন পোড়া ভর্তা",
  "মরিচ পোড়া ভর্তা",
  "বাদাম ভর্তা",
  "পেঁপে ভর্তা",
  "বরবটি ভর্তা",
  "ডিম ভর্তা",
];

// ==========================================
// 2. BUCKET LIST DATA
// ==========================================
const INITIAL_BUCKET_ITEMS = [
  { id: "bk_1", text: "শীতের কুয়াশাচ্ছন্ন ভোরে লেকে অতিথি পাখি দেখা", doneCount: 421, category: "প্রকৃতি" },
  { id: "bk_2", text: "বটতলায় টানা ১০ রকমের ভর্তা একসাথে টেস্ট করা", doneCount: 385, category: "খাবার" },
  { id: "bk_3", text: "মুক্তমঞ্চে শীতের রাতে খোলা আকাশের নিচে নাটক দেখা", doneCount: 442, category: "কালচার" },
  { id: "bk_4", text: "ট্রান্সপোর্টের শেষ বাসে চড়ে গান গেয়ে শহরে ফেরা", doneCount: 367, category: "ভ্রমণ" },
  { id: "bk_5", text: "শহীদ মিনারের সিঁড়িতে বসে মধ্যরাতে গিটার বাজানো", doneCount: 410, category: "আড্ডা" },
  { id: "bk_6", text: "টারজান পয়েন্টে ক্লাস বাংক করে বন্ধুদের নিয়ে মালাই চা খাওয়া", doneCount: 489, category: "আড্ডা" },
  { id: "bk_7", text: "কেন্দ্রীয় লাইব্রেরিতে পড়াশোনার ভান করে গভীর ঘুমে ঢলে পড়া", doneCount: 398, category: "একাডেমিক" },
  { id: "bk_8", text: "ক্যাফেটেরিয়ার ছাদে বা মাঠে বসে লাল রক্তিম সূর্যাস্ত দেখা", doneCount: 430, category: "স্মৃতি" },
  { id: "bk_9", text: "পুরো ক্যাম্পাস এক রিকশায় চড়ে টুংটাং বেল বাজিয়ে চক্কর দেওয়া", doneCount: 356, category: "রোমাঞ্চ" },
  { id: "bk_10", text: "অমর একুশে ও জয় বাংলার সামনে ব্যাচমেটদের সাথে ছবি তোলা", doneCount: 478, category: "ছবি" },
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
  nominees: Nominee[];
}

const INITIAL_YEARBOOK: YearbookCategory[] = [
  {
    id: "yb_night_owl",
    title: "রাতজাগা আড্ডাবাজ",
    emoji: "🌙",
    description: "রাত ৩টায় যাকে সবসময় শহীদ মিনার বা বটতলায় পাওয়া যায়",
    nominees: [
      { id: "nom_1", name: "তানভীর আহমেদ", dept: "সিএসই", votes: 48 },
      { id: "nom_2", name: "রাকিব হাসান", dept: "ইংরেজি", votes: 36 },
      { id: "nom_3", name: "আসিফ ইকবাল", dept: "পদার্থবিজ্ঞান", votes: 29 },
    ],
  },
  {
    id: "yb_note_savior",
    title: "পরীক্ষার আগের রাতের ত্রাতা (নোট কিং)",
    emoji: "📚",
    description: "যার নোট ছাড়া ক্লাসের অর্ধেক মানুষের পাস করা অসম্ভব ছিল",
    nominees: [
      { id: "nom_4", name: "সাদিয়া ইসলাম", dept: "ফার্মেসি", votes: 62 },
      { id: "nom_5", name: "আফরিন সুলতানা", dept: "অর্থনীতি", votes: 41 },
    ],
  },
  {
    id: "yb_rockstar",
    title: "ক্যাম্পাস রকস্টার",
    emoji: "🎸",
    description: "মুক্তমঞ্চে গিটার হাতে উঠলেই যার জন্য দর্শক গর্জে উঠত",
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
    nominees: [
      { id: "nom_8", name: "মেহেদী হাসান", dept: "ভূগোল", votes: 51 },
      { id: "nom_9", name: "নাবিল আহমেদ", dept: "গণিত", votes: 38 },
    ],
  },
  {
    id: "yb_sleeper",
    title: "চিরন্তন ঘুমকাতুরে",
    emoji: "😴",
    description: "ক্লাস শুরু হলে যার চোখ অটোমেটিক বন্ধ হয়ে যেত",
    nominees: [
      { id: "nom_10", name: "জুবায়ের আল মামুন", dept: "রসায়ন", votes: 45 },
      { id: "nom_11", name: "ফারহান সাজিদ", dept: "প্রাণিবিদ্যা", votes: 39 },
    ],
  },
  {
    id: "yb_bcs",
    title: "আগামীর বিসিএস বস",
    emoji: "💼",
    description: "প্রথম বর্ষ থেকেই যার টেবিলে ছিল এমপিথ্রি আর ডাইজেস্টের স্তূপ",
    nominees: [
      { id: "nom_12", name: "সাইফুল ইসলাম", dept: "সরকার ও রাজনীতি", votes: 58 },
      { id: "nom_13", name: "কামরুল হাসান", dept: "আন্তর্জাতিক সম্পর্ক", votes: 44 },
    ],
  },
];

// ==========================================
// 4. AUDIO SOUNDSCAPES (WEB AUDIO API SYNTH)
// ==========================================
const SOUNDSCAPES = [
  { id: "birds", name: "শীতের অতিথি পাখির কলতান", icon: "🦆", type: "chirp" },
  { id: "rickshaw", name: "প্রান্তিক গেটের রিকশার টুংটাং", icon: "🚲", type: "bell" },
  { id: "drums", name: "মুক্তমঞ্চের নাটকের রিদম", icon: "🥁", type: "drum" },
  { id: "guitar", name: "শহীদ মিনারের মধ্যরাতের কর্ড", icon: "🎸", type: "guitar" },
];

export default function MemoriesHub() {
  const [activeTab, setActiveTab] = useState("bottola");

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

  // 4. Voice Notes & Synthesized Soundscape States
  const [isPlayingSound, setIsPlayingSound] = useState<string | null>(null);
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
        [0, 0.15].forEach((delay) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(2400, ctx.currentTime + delay);
          gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.35);
        });
      } else if (type === "chirp") {
        // Bird tweet/chirp sound
        [0, 0.1, 0.22].forEach((delay, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          const baseFreq = 2600 + idx * 300;
          osc.frequency.setValueAtTime(baseFreq, ctx.currentTime + delay);
          osc.frequency.exponentialRampToValueAtTime(baseFreq + 800, ctx.currentTime + delay + 0.08);
          gain.gain.setValueAtTime(0.2, ctx.currentTime + delay);
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
          gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.04 + 1.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.04);
          osc.stop(ctx.currentTime + idx * 0.04 + 1.9);
        });
      } else if (type === "drum") {
        // Muktamancha dramatic deep drum beats
        [0, 0.2, 0.4].forEach((delay) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(140, ctx.currentTime + delay);
          osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + delay + 0.25);
          gain.gain.setValueAtTime(0.4, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.28);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.3);
        });
      }
    } catch (e) {
      console.warn("Audio synth error:", e);
    }
  };

  const handlePlaySoundscape = (id: string, type: string) => {
    setIsPlayingSound(id);
    playSynthesizedSound(type);
    setTimeout(() => {
      setIsPlayingSound(null);
    }, 1500);
  };

  // ========================================================
  // VOICE RECORDING LOGIC
  // ========================================================
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
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
        title: "রেকর্ডিং শুরু হয়েছে 🎙️",
        description: "সর্বোচ্চ ৪৫ সেকেন্ডের কণ্ঠবার্তা রেকর্ড করতে পারবেন।",
      });
    } catch (err) {
      console.error("Microphone access error:", err);
      toast({
        title: "মাইক্রোফোন অনুমতি মেলেনি",
        description: "দয়া করে ব্রাউজারে মাইক্রোফোন ব্যবহারের অনুমতি দিন।",
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
        title: "তথ্য দিন",
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

    confetti({ particleCount: 60, spread: 50 });
    toast({
      title: "অডিও চিরকুট প্রকাশিত হয়েছে! 📻",
      description: "ক্যাম্পাসের বাতাসে আপনার কণ্ঠ চিরকালের জন্য সুর তুলল।",
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
    toast({ title: "ভোট গ্রহণ করা হয়েছে! 🍽️" });
  };

  const toggleVorta = (vorta: string) => {
    let next: string[];
    if (checkedVortas.includes(vorta)) {
      next = checkedVortas.filter((v) => v !== vorta);
    } else {
      next = [...checkedVortas, vorta];
    }
    setCheckedVortas(next);
    localStorage.setItem("ju52_checked_vortas", JSON.stringify(next));
  };

  // Vorta Scorecard title
  const vortaCount = checkedVortas.length;
  let vortaTitle = "বটতলার নবাগত অতিথি 🌿";
  if (vortaCount >= 10) vortaTitle = "বটতলার অপরাজেয় ভোজনরসিক রাজা 👑";
  else if (vortaCount >= 7) vortaTitle = "ভর্তা স্পেশালিস্ট ক্যাম্পাশিয়ান 🎖️";
  else if (vortaCount >= 4) vortaTitle = "নিয়মিত খাদ্যপ্রেমী দোস্ত 😋";

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
      confetti({ particleCount: 50, spread: 50 });
      toast({ title: "চমৎকার! বাকেটলিস্ট পূর্ণ হলো ✨" });
    }
  };

  const handleAddCustomBucket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBucketText.trim()) return;

    const newItem = {
      id: `bk_user_${Date.now()}`,
      text: newBucketText.trim(),
      doneCount: 1,
      category: "কমিউনিটি",
    };

    setBucketItems([newItem, ...bucketItems]);
    setUserCheckedBuckets((prev) => ({ ...prev, [newItem.id]: true }));
    setNewBucketText("");
    confetti({ particleCount: 70, spread: 60 });
    toast({ title: "নতুন বাকেটলিস্ট স্মৃতি যুক্ত হয়েছে! 🎯" });
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
    confetti({ particleCount: 40, spread: 40 });
    toast({ title: "ভোট দেওয়া হয়েছে! 🏆" });
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
    toast({ title: "নমিনেশন সফলভাবে যুক্ত হয়েছে! 🎖️" });
  };

  const completedBucketCount = Object.values(userCheckedBuckets).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0c10] text-foreground pb-28 pt-4 md:pt-8 transition-colors">
      
      {/* Header Banner */}
      <div className="container max-w-6xl mx-auto px-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-2">
              <Compass className="w-3.5 h-3.5" />
              <span>JU-52 Campus Vibes & Nostalgia Hub</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black font-display tracking-tight flex items-center gap-2.5">
              <span>জাবি ভাইবস ও স্মৃতি চত্বর</span>
              <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-body">
              বটতলার স্বাদ, বন্ধুদের কণ্ঠস্বর, অসমাপ্ত বাকেট লিস্ট আর ইয়ারবুকের মজার সব খেতাব।
            </p>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="container max-w-6xl mx-auto px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          
          <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto p-1.5 rounded-2xl bg-card border border-border/80 shadow-sm gap-1 mb-8">
            <TabsTrigger
              value="bottola"
              className="rounded-xl py-2.5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all gap-1.5"
            >
              <Utensils className="w-4 h-4" />
              <span>বটতলা ফুড মিটার</span>
            </TabsTrigger>

            <TabsTrigger
              value="audio"
              className="rounded-xl py-2.5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all gap-1.5"
            >
              <Mic className="w-4 h-4" />
              <span>ক্যাম্পাস অডিও চিরকুট</span>
            </TabsTrigger>

            <TabsTrigger
              value="bucket"
              className="rounded-xl py-2.5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ব্যাচ বাকেট লিস্ট</span>
            </TabsTrigger>

            <TabsTrigger
              value="yearbook"
              className="rounded-xl py-2.5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all gap-1.5"
            >
              <Trophy className="w-4 h-4" />
              <span>ডিজিটাল ইয়ারবুক</span>
            </TabsTrigger>
          </TabsList>

          {/* ========================================================
              TAB 1: BOTTOLA FOOD METER & VORTA SCORECARD
             ======================================================== */}
          <TabsContent value="bottola" className="space-y-8 animate-in fade-in duration-200">
            
            {/* Top Scorecard Widget */}
            <div className="bg-gradient-to-br from-amber-500/10 via-primary/5 to-rose-500/10 border border-amber-500/20 rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                    আমার বটতলা স্কোরকার্ড
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black font-display mt-2 flex items-center gap-2">
                    <span>{vortaTitle}</span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    ১২ টি ক্লাসিক ভর্তার মধ্যে আপনি <strong className="text-foreground">{vortaCount}</strong> টি খেয়েছেন
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-card p-4 rounded-2xl border border-border/80 shadow-sm">
                  <div className="text-center px-4">
                    <div className="text-2xl font-black text-primary font-display">{vortaCount}/12</div>
                    <div className="text-[10px] text-muted-foreground font-semibold">ভর্তা টেস্টেড</div>
                  </div>
                  <div className="w-[1px] h-8 bg-border" />
                  <div className="text-center px-4">
                    <div className="text-2xl font-black text-amber-600 font-display">
                      {Math.round((vortaCount / 12) * 100)}%
                    </div>
                    <div className="text-[10px] text-muted-foreground font-semibold">বটতলা স্কোর</div>
                  </div>
                </div>
              </div>

              {/* Vorta Checkboxes */}
              <div className="mt-6 pt-6 border-t border-border/50">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  কোন কোন ভর্তা আপনার খাওয়া হয়েছে? টিক দিন:
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {VORTA_LIST.map((vorta) => {
                    const isChecked = checkedVortas.includes(vorta);
                    return (
                      <button
                        key={vorta}
                        type="button"
                        onClick={() => toggleVorta(vorta)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                          isChecked
                            ? "bg-primary/10 border-primary text-primary font-bold shadow-sm"
                            : "bg-card border-border/60 text-muted-foreground hover:bg-muted/50"
                        }`}
                      >
                        {isChecked ? (
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 opacity-40 shrink-0" />
                        )}
                        <span className="text-xs truncate">{vorta}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottola Iconic Food Items Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold font-display flex items-center gap-2">
                    <Flame className="w-5 h-5 text-rose-500" />
                    <span>ক্যাম্পাস ফুড মিটার ও রেটিং</span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    আপনার প্রিয় খাবারে ভোট দিয়ে ব্যাচের শীর্ষ খাবার নির্বাচন করুন
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {foodItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-3xl mb-2">{item.icon}</div>
                      <h3 className="text-sm font-bold font-display leading-snug">{item.title}</h3>
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
                        {foodVoted[item.id] ? "ভোট দেওয়া হয়েছে" : "ভোট দিন"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </TabsContent>

          {/* ========================================================
              TAB 2: CAMPUS AUDIO VOICE NOTES & SOUNDSCAPES
             ======================================================== */}
          <TabsContent value="audio" className="space-y-8 animate-in fade-in duration-200">
            
            {/* Audio Soundscapes Player */}
            <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm">
              <div className="mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full">
                  ক্যাম্পাস সাউন্ডস্কেপ
                </span>
                <h2 className="text-lg font-bold font-display mt-2 flex items-center gap-2">
                  <Radio className="w-5 h-5 text-rose-500" />
                  <span>জাহাঙ্গীরনগরের জীবন্ত শব্দমালা</span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  ক্যাম্পাসের মিষ্টি স্মৃতি জাগানো শব্দে এক ক্লিকেই ফিরে যান সেই প্রিয় প্রাঙ্গণে
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {SOUNDSCAPES.map((sound) => {
                  const isPlaying = isPlayingSound === sound.id;
                  return (
                    <button
                      key={sound.id}
                      type="button"
                      onClick={() => handlePlaySoundscape(sound.id, sound.type)}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left ${
                        isPlaying
                          ? "bg-rose-500/10 border-rose-500 shadow-md ring-2 ring-rose-500/30"
                          : "bg-muted/40 border-border/60 hover:bg-muted"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-xl shadow-sm shrink-0">
                        {isPlaying ? <Volume2 className="w-5 h-5 text-rose-500 animate-bounce" /> : sound.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate">{sound.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {isPlaying ? "শব্দ বাজছে..." : "শুনতে ক্লিক করুন"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* In-Browser Voice Note Recorder */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Recorder Box (Span 5) */}
              <div className="lg:col-span-5 bg-card border border-border/80 rounded-3xl p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-sm font-bold font-display flex items-center gap-2">
                    <Mic className="w-4 h-4 text-primary" />
                    <span>আপনার কণ্ঠবার্তা রেকর্ড করুন</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    বন্ধুদের উদ্দেশ্যে কোনো স্মৃতি, গান বা বিদায়ী চিরকুট রেকর্ড করুন
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center py-6 bg-muted/30 rounded-2xl border border-dashed border-border/80 mb-4">
                  <div className="relative mb-3">
                    {isRecording && (
                      <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-75" />
                    )}
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
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
                      {isRecording ? "রেকর্ডিং চলছে... থামাতে আবার চাপুন" : "রেকর্ড শুরু করতে বাটনে চাপুন"}
                    </p>
                  </div>
                </div>

                {/* Recorded Audio Preview & Form */}
                {recordedAudioUrl && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <audio src={recordedAudioUrl} controls className="w-full h-10 rounded-xl" />

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">
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
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">
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
                      চিরকুট প্রকাশ করুন
                    </Button>
                  </div>
                )}
              </div>

              {/* Community Voice Notes Feed (Span 7) */}
              <div className="lg:col-span-7 bg-card border border-border/80 rounded-3xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold font-display flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-primary" />
                    <span>বন্ধুদের অডিও চিরকুট ফিড</span>
                  </h3>
                  <span className="text-xs font-bold text-muted-foreground">
                    {voiceNotes.length} টি চিরকুট
                  </span>
                </div>

                <div className="space-y-3">
                  {voiceNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3.5 rounded-2xl border border-border/70 bg-muted/20 hover:bg-muted/40 transition-all flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Volume2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground">{note.title}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            কণ্ঠ: <strong className="text-foreground/80">{note.author}</strong> • {note.timeAgo}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-lg">
                          {note.duration}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </TabsContent>

          {/* ========================================================
              TAB 3: 52ND BATCH BUCKET LIST & PROMISE BOARD
             ======================================================== */}
          <TabsContent value="bucket" className="space-y-6 animate-in fade-in duration-200">
            
            {/* Bucket List Progress Bar */}
            <div className="bg-gradient-to-r from-primary/10 via-amber-500/10 to-emerald-500/10 border border-primary/20 rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                    ক্যাম্পাস বাকেট লিস্ট
                  </span>
                  <h2 className="text-xl font-black font-display mt-2">
                    ক্যাম্পাস ছাড়ার আগে অন্তত একবার করতেই হবে!
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    আপনার সম্পন্ন হয়েছে: <strong className="text-foreground">{completedBucketCount}</strong> / {bucketItems.length} টি
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-primary font-display">
                    {Math.round((completedBucketCount / Math.max(1, bucketItems.length)) * 100)}%
                  </span>
                </div>
              </div>

              {/* Progress track */}
              <div className="w-full bg-muted/60 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary to-amber-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round((completedBucketCount / Math.max(1, bucketItems.length)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Add Custom Bucket Form */}
            <form
              onSubmit={handleAddCustomBucket}
              className="flex items-center gap-2 bg-card p-2 rounded-2xl border border-border/80 shadow-sm"
            >
              <Input
                placeholder="নতুন কোনো জাবি বাকেট লিস্ট প্রস্তাব করতে চান? লিখুন..."
                value={newBucketText}
                onChange={(e) => setNewBucketText(e.target.value)}
                className="h-10 text-xs border-0 focus-visible:ring-0 shadow-none"
              />
              <Button type="submit" size="sm" className="h-9 font-bold text-xs rounded-xl gap-1 shrink-0">
                <Plus className="w-3.5 h-3.5" />
                যোগ করুন
              </Button>
            </form>

            {/* Bucket Items List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {bucketItems.map((item) => {
                const isDone = !!userCheckedBuckets[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleBucketItem(item.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left ${
                      isDone
                        ? "bg-primary/5 border-primary/40 shadow-sm"
                        : "bg-card border-border/70 hover:border-border hover:bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="shrink-0">
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground/50" />
                        )}
                      </div>
                      <div>
                        <div
                          className={`text-xs sm:text-sm font-semibold leading-snug ${
                            isDone ? "line-through text-muted-foreground" : "text-foreground"
                          }`}
                        >
                          {item.text}
                        </div>
                        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full mt-1.5 inline-block">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {item.doneCount} জন
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

          </TabsContent>

          {/* ========================================================
              TAB 4: DIGITAL YEARBOOK & WHO IS WHO
             ======================================================== */}
          <TabsContent value="yearbook" className="space-y-6 animate-in fade-in duration-200">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold font-display flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>৫২তম ব্যাচ ইয়ারবুক ও সুপারলেটিভস</span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  ব্যাচের কে কেমন? বন্ধুদের মজার সব খেতাবে ভোট দিন ও নমিনেট করুন
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  setSelectedCatId(yearbook[0]?.id || "");
                  setNominateModalOpen(true);
                }}
                className="text-xs font-bold rounded-xl gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                বন্ধু নমিনেট করুন
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {yearbook.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{cat.emoji}</span>
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
                                ? "bg-amber-500/10 border-amber-500/30"
                                : "bg-muted/30 border-border/60"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-black text-muted-foreground w-4">
                                #{idx + 1}
                              </span>
                              <div className="truncate">
                                <div className="text-xs font-bold text-foreground truncate">
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
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                                isVoted
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-card border border-border hover:bg-muted"
                              }`}
                            >
                              <Heart className="w-3 h-3" />
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

          </TabsContent>

        </Tabs>
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
                <Button type="submit" className="bg-primary text-primary-foreground font-bold">
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
