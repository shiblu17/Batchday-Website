import React, { useState, useEffect } from "react";
import { MapPin, Sparkles, Plus, Heart, MessageSquare, Coffee, Compass, Trees, Music, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CampusSpot {
  id: string;
  name: string;
  category: "culture" | "food" | "nature" | "adda";
  coords: { x: number; y: number }; // Percentage position on map
  emoji: string;
  lore: string;
  funFact: string;
}

interface SpotMemory {
  id: string;
  spotId: string;
  authorName: string;
  dept: string;
  text: string;
  created_at: string;
}

const SPOTS: CampusSpot[] = [
  {
    id: "shahid-minar",
    name: "কেন্দ্রীয় শহীদ মিনার",
    category: "culture",
    coords: { x: 45, y: 35 },
    emoji: "🏛️",
    lore: "দেশের অন্যতম দৃষ্টিনন্দন ও সুউচ্চ শহীদ মিনার। ভোরবেলা বা গোধূলির আলোয় ক্যাম্পাসের সবচেয়ে শান্ত জায়গা।",
    funFact: "একুশে ফেব্রুয়ারি ও বিশেষ রাতে এখানে হাজারো মোমের আলো এক অপার্থিব রূপ সৃষ্টি করে।",
  },
  {
    id: "muktamancha",
    name: "মুক্তমঞ্চ",
    category: "culture",
    coords: { x: 52, y: 45 },
    emoji: "🎭",
    lore: "সাংস্কৃতিক রাজধানী জাহাঙ্গীরনগরের প্রাণকেন্দ্র। নাটক, কনসার্ট আর বন্ধুদের গোল হয়ে গান গাওয়ার স্বর্গরাজ্য।",
    funFact: "সেলিম আল দীনের অমর নাটকের বহু ঐতিহাসিক মুহূর্তের সাক্ষী এই উন্মুক্ত মঞ্চ।",
  },
  {
    id: "bottola",
    name: "বটতলা",
    category: "food",
    coords: { x: 40, y: 58 },
    emoji: "🍲",
    lore: "ক্যাম্পাসের অবিচ্ছেদ্য অংশ। ৫০ রকমের স্পেশাল ভর্তা, ভাত আর বন্ধুদের চিরচেনা হাসিমুখের আড্ডা।",
    funFact: "ক্যাম্পাস জীবনের অর্ধেক গল্পই বটতলার টেবিল আর চায়ের কাপে লেখা হয়েছে।",
  },
  {
    id: "tarzan-point",
    name: "টারজান পয়েন্ট",
    category: "nature",
    coords: { x: 30, y: 40 },
    emoji: "🌿",
    lore: "গাছের ডালপালা আর সবুজ অরণ্যে ঘেরা একটি রোমাঞ্চকর আড্ডা জোন।",
    funFact: "এখানে আড্ডা না দিলে জাহাঙ্গীরনগরের ছাত্রত্বই পূর্ণতা পায় না!",
  },
  {
    id: "transport",
    name: "ট্রান্সপোর্ট চত্বর",
    category: "adda",
    coords: { x: 55, y: 65 },
    emoji: "🚌",
    lore: "লাল বাসের মিলনমেলা। ঢাকা যাওয়া-আসার অনুভূতি, রাত ৯টার আড্ডা আর কেটলির গরম চা।",
    funFact: "ক্যাম্পাসের বহু প্রেম আর বন্ধুত্বের প্রথম সূচনা হয়েছে এই ট্রান্সপোর্টের বাসস্ট্যান্ডেই।",
  },
  {
    id: "lotus-lake",
    name: "লাল পদ্ম লেক ও অতিথি পাখি",
    category: "nature",
    coords: { x: 62, y: 30 },
    emoji: "🪷",
    lore: "শীতকালে হাজার হাজার অতিথি পাখির কলতান আর ফোটা পদ্মের স্নিগ্ধতা।",
    funFact: "শীতের সকালে লেকের পাড়ে কুয়াশা ভেদ করে সূর্য ওঠার দৃশ্য জাহাঙ্গীরনগরের পরম উপহার।",
  },
  {
    id: "zahir-raihan",
    name: "জহির রায়হান অডিটোরিয়াম ও ক্যাফেটেরিয়া",
    category: "culture",
    coords: { x: 48, y: 50 },
    emoji: "🎬",
    lore: "ফিল্ম ফেস্টিভ্যাল, কনভোকেশন রিহার্সাল আর কেন্দ্রীয় ক্যাফেটেরিয়ার গরম সিঙ্গাড়া।",
    funFact: "ক্লাস ফাঁকি দিয়ে ক্যাফেটেরিয়ার লম্বা বারান্দায় আড্ডা দেওয়া ছিল নিত্যদিনের রুটিন।",
  },
  {
    id: "prantik",
    name: "প্রান্তিক গেট",
    category: "adda",
    coords: { x: 22, y: 70 },
    emoji: "🚪",
    lore: "ক্যাম্পাস থেকে বাইরে বের হওয়া কিংবা দূর থেকে প্রিয় ক্যাম্পাসে ফিরে আসার চিরচেনা প্রবেশদ্বার।",
    funFact: "মধ্যরাতের নাশতা আর খিচুড়ির লোভনীয় গন্তব্য।",
  },
];

const LOCAL_STORAGE_MEMORIES = "ju52_campus_spot_memories";

export default function CampusMap() {
  const [selectedSpot, setSelectedSpot] = useState<CampusSpot>(SPOTS[0]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [memories, setMemories] = useState<SpotMemory[]>([]);
  const [isAddingMemory, setIsAddingMemory] = useState(false);

  // Form State
  const [authorName, setAuthorName] = useState("");
  const [authorDept, setAuthorDept] = useState("");
  const [memoryText, setMemoryText] = useState("");

  useEffect(() => {
    loadSpotMemories(selectedSpot.id);
  }, [selectedSpot]);

  const loadSpotMemories = (spotId: string) => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_MEMORIES);
      if (stored) {
        const all: SpotMemory[] = JSON.parse(stored);
        setMemories(all.filter((m) => m.spotId === spotId));
      } else {
        // Default seed memories for nostalgia
        setMemories([
          {
            id: "seed-1",
            spotId: "bottola",
            authorName: "রাকিব ও বন্ধুরা",
            dept: "অর্থনীতি",
            text: "বৃষ্টির দিনে ক্লাস শেষে বটতলায় ডিমভর্তা আর গরম খিচুড়ির সেই স্বাদ কোনোদিন ভুলব না!",
            created_at: new Date().toISOString(),
          },
          {
            id: "seed-2",
            spotId: "muktamancha",
            authorName: "তানভীর",
            dept: "সিএসই",
            text: "কনসার্টের রাতে সবার সাথে হাত তুলে একসঙ্গে গান গাওয়ার সেই উন্মাদনা আজও হৃদয়ে বাজে।",
            created_at: new Date().toISOString(),
          },
        ].filter((m) => m.spotId === spotId));
      }
    } catch {
      setMemories([]);
    }
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !memoryText.trim()) {
      toast({ title: "নাম এবং স্মৃতি লিখুন", variant: "destructive" });
      return;
    }

    const newMem: SpotMemory = {
      id: Math.random().toString(36).substring(2, 9),
      spotId: selectedSpot.id,
      authorName: authorName.trim(),
      dept: authorDept.trim() || "JU-52",
      text: memoryText.trim(),
      created_at: new Date().toISOString(),
    };

    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_MEMORIES);
      const all: SpotMemory[] = stored ? JSON.parse(stored) : [];
      all.unshift(newMem);
      localStorage.setItem(LOCAL_STORAGE_MEMORIES, JSON.stringify(all));
    } catch (err) {
      console.warn("Storage err:", err);
    }

    setMemories((prev) => [newMem, ...prev]);
    setIsAddingMemory(false);
    setAuthorName("");
    setAuthorDept("");
    setMemoryText("");

    toast({
      title: "স্মৃতি পিন করা হয়েছে! 📍",
      description: `${selectedSpot.name}-এ আপনার স্মৃতি স্থায়ীভাবে যুক্ত হলো।`,
    });
  };

  const filteredSpots = activeCategory === "all"
    ? SPOTS
    : SPOTS.filter((s) => s.category === activeCategory);

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <Compass className="w-4 h-4" />
            ৭০০ একরের ইন্টারঅ্যাক্টিভ মেমোরি ম্যাপ
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-foreground">
            ক্যাম্পাস মেমোরি ম্যাপ
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            ক্যাম্পাসের প্রিয় জায়গাগুলোতে ঘুরে আসুন এবং আপনার ব্যাচের সোনালী স্মৃতিগুলো সেই স্পটে পিন করে রেখে যান।
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            { id: "all", label: "সব স্পট", icon: Compass },
            { id: "culture", label: "ঐতিহ্য ও সংস্কৃতি", icon: Music },
            { id: "food", label: "খাবারের আড্ডা", icon: Coffee },
            { id: "nature", label: "লেক ও প্রকৃতি", icon: Trees },
            { id: "adda", label: "আড্ডা জোন", icon: MessageSquare },
          ].map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Map Layout & Spot Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Interactive Illustrated Map Canvas (Left 7 cols) */}
          <div className="lg:col-span-7">
            <Card className="border border-border/80 shadow-xl overflow-hidden bg-gradient-to-br from-emerald-950/20 via-background to-primary/5">
              <div className="relative aspect-[4/3] w-full bg-emerald-950/10 dark:bg-emerald-950/40 border-b border-border overflow-hidden rounded-t-xl flex items-center justify-center p-4">
                {/* Stylized 700 Acres Greenery & Lakes Illustration */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  {/* Lakes */}
                  <div className="absolute top-[20%] right-[15%] w-36 h-24 bg-sky-500 rounded-full blur-xl" />
                  <div className="absolute bottom-[25%] left-[20%] w-44 h-28 bg-emerald-600 rounded-full blur-xl" />
                </div>

                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-background/80 backdrop-blur-md text-[11px] font-bold text-foreground border border-border">
                  🗺️ ৭০০ একর ক্যাম্পাস মানচিত্র (ক্লিক করে নির্বাচন করুন)
                </div>

                {/* Spot Markers placed across the canvas */}
                {filteredSpots.map((spot) => {
                  const isSelected = selectedSpot.id === spot.id;
                  return (
                    <button
                      key={spot.id}
                      onClick={() => setSelectedSpot(spot)}
                      style={{
                        left: `${spot.coords.x}%`,
                        top: `${spot.coords.y}%`,
                      }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 group flex flex-col items-center transition-all duration-300 z-20 ${
                        isSelected ? "scale-125 z-30" : "hover:scale-110"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full shadow-xl transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground ring-4 ring-primary/40 scale-110"
                            : "bg-card/90 text-foreground border-2 border-primary/50 group-hover:border-primary"
                        }`}
                      >
                        <span className="text-base sm:text-lg">{spot.emoji}</span>
                      </div>
                      <span
                        className={`mt-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold shadow-md whitespace-nowrap transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-background/90 text-foreground border border-border"
                        }`}
                      >
                        {spot.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Spot Quick Selector Pills */}
              <div className="p-3 bg-muted/20 flex flex-wrap gap-1.5 overflow-x-auto">
                {SPOTS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSpot(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      selectedSpot.id === s.id
                        ? "bg-primary text-primary-foreground font-bold shadow-sm"
                        : "bg-card hover:bg-muted text-foreground border border-border/60"
                    }`}
                  >
                    {s.emoji} {s.name}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Selected Spot Details & Memories (Right 5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <Card className="border border-primary/20 shadow-xl bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedSpot.emoji}</span>
                    <CardTitle className="text-xl font-display font-black text-foreground">
                      {selectedSpot.name}
                    </CardTitle>
                  </div>
                  <Button
                    size="sm"
                    variant={isAddingMemory ? "secondary" : "default"}
                    onClick={() => setIsAddingMemory(!isAddingMemory)}
                    className="gap-1.5 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {isAddingMemory ? "বাতিল" : "স্মৃতি পিন করুন"}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                  {selectedSpot.lore}
                </p>

                <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground">
                  <strong className="text-primary font-bold">ক্যাম্পাস ঐতিহ্য: </strong>
                  {selectedSpot.funFact}
                </div>

                {/* Add Memory Form */}
                {isAddingMemory && (
                  <form onSubmit={handleAddMemory} className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-3 animate-in fade-in duration-200">
                    <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      {selectedSpot.name}-এ আপনার স্মৃতি যুক্ত করুন
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        placeholder="আপনার নাম *"
                        className="text-xs h-8"
                        required
                      />
                      <Input
                        value={authorDept}
                        onChange={(e) => setAuthorDept(e.target.value)}
                        placeholder="বিভাগ"
                        className="text-xs h-8"
                      />
                    </div>

                    <Textarea
                      value={memoryText}
                      onChange={(e) => setMemoryText(e.target.value)}
                      placeholder="এই জায়গায় কাটানো আপনার সেরা স্মৃতি..."
                      className="text-xs"
                      rows={2}
                      required
                    />

                    <Button type="submit" size="sm" className="w-full text-xs">
                      পিন সম্পন্ন করুন 📍
                    </Button>
                  </form>
                )}

                {/* Memories Pinned at this spot */}
                <div className="space-y-2.5 pt-2">
                  <div className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>পিন করা স্মৃতিসমূহ ({memories.length})</span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {memories.length === 0 ? (
                      <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-lg">
                        এখনো কোনো স্মৃতি পিন করা হয়নি। প্রথম স্মৃতিটি আপনিই যোগ করুন!
                      </div>
                    ) : (
                      memories.map((m) => (
                        <div
                          key={m.id}
                          className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between font-semibold text-foreground">
                            <span>{m.authorName} ({m.dept})</span>
                            <span className="text-[10px] text-muted-foreground font-normal">
                              {new Date(m.created_at).toLocaleDateString("bn-BD")}
                            </span>
                          </div>
                          <p className="text-muted-foreground italic">
                            &ldquo;{m.text}&rdquo;
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
