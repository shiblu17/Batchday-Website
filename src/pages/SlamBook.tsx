import React, { useState, useEffect, useRef } from "react";
import { BookOpen, Heart, Sparkles, Send, Search, Download, Share2, PenLine, MessageSquare, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import votersData from "@/data/voters.json";
import html2canvas from "html2canvas";

interface SlamEntry {
  id: string;
  target_roll: string;
  target_name: string;
  author_name: string;
  author_dept: string;
  nickname: string;
  badge: string;
  memory: string;
  wish: string;
  created_at: string;
}

const BADGES = [
  { label: "চা পার্টনার", emoji: "☕" },
  { label: "চিরদিনের দোস্ত", emoji: "❤️" },
  { label: "নোট সাপ্লায়ার", emoji: "📚" },
  { label: "রাতজাগা আড্ডাবাজ", emoji: "🌙" },
  { label: "ক্যাম্পাস রকস্টার", emoji: "🎸" },
  { label: "চিরন্তন ঘুমকাতুরে", emoji: "😴" },
  { label: "বটতলার ভোজনরসিক", emoji: "🍽️" },
  { label: "আগামীর বিসিএস বস", emoji: "💼" },
];

const LOCAL_STORAGE_KEY = "ju52_slambook_entries";

export default function SlamBook() {
  const [searchRoll, setSearchRoll] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<{ name: string; dept: string; hall: string } | null>(null);
  const [entries, setEntries] = useState<SlamEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [authorName, setAuthorName] = useState("");
  const [authorDept, setAuthorDept] = useState("");
  const [nickname, setNickname] = useState("");
  const [selectedBadge, setSelectedBadge] = useState(BADGES[0].label);
  const [memory, setMemory] = useState("");
  const [wish, setWish] = useState("");

  const postcardRef = useRef<HTMLDivElement>(null);

  // Load entries when a student is selected
  useEffect(() => {
    if (!selectedStudent) return;
    loadEntries(selectedStudent.name);
  }, [selectedStudent]);

  const loadEntries = async (targetName: string) => {
    setIsLoading(true);
    try {
      // 1. Try Supabase
      const { data, error } = await supabase
        .from("slam_book_entries" as any)
        .select("*")
        .eq("target_name", targetName)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        setEntries(data as unknown as SlamEntry[]);
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsed: SlamEntry[] = JSON.parse(stored);
          const studentEntries = parsed.filter((e) => e.target_name.toLowerCase() === targetName.toLowerCase());
          setEntries(studentEntries);
        } else {
          setEntries([]);
        }
      }
    } catch {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed: SlamEntry[] = JSON.parse(stored);
        setEntries(parsed.filter((e) => e.target_name.toLowerCase() === targetName.toLowerCase()));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRoll.trim()) return;

    const query = searchRoll.trim().toLowerCase();
    // Search in votersData by name, dept, or match
    const found = votersData.find(
      (v) => v.name.toLowerCase().includes(query) || v.dept.toLowerCase().includes(query)
    );

    if (found) {
      setSelectedStudent(found);
    } else {
      // Allow custom name
      setSelectedStudent({
        name: searchRoll.trim().toUpperCase(),
        dept: "জাহাঙ্গীরনগর বিশ্ববিদ্যালয়",
        hall: "JU-52",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !authorName.trim() || !wish.trim()) {
      toast({ title: "নাম এবং চিরকুট বার্তা দেওয়া আবশ্যক", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const newEntry: SlamEntry = {
      id: Math.random().toString(36).substring(2, 9),
      target_roll: searchRoll || selectedStudent.name,
      target_name: selectedStudent.name,
      author_name: authorName.trim(),
      author_dept: authorDept.trim() || "JU-52",
      nickname: nickname.trim(),
      badge: selectedBadge,
      memory: memory.trim(),
      wish: wish.trim(),
      created_at: new Date().toISOString(),
    };

    // 1. Try Supabase
    try {
      await supabase.from("slam_book_entries" as any).insert([newEntry]);
    } catch {
      // Ignored for offline fallback
    }

    // 2. Local storage persistence
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      const all: SlamEntry[] = stored ? JSON.parse(stored) : [];
      all.unshift(newEntry);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(all));
    } catch (err) {
      console.warn("Storage err:", err);
    }

    setEntries((prev) => [newEntry, ...prev]);
    setIsSubmitting(false);

    // Reset form
    setAuthorName("");
    setAuthorDept("");
    setNickname("");
    setMemory("");
    setWish("");

    toast({
      title: "চিরকুট জমা দেওয়া হয়েছে! 💌",
      description: "বন্ধুর স্ল্যাম বুকে আপনার স্মৃতি চিরস্থায়ী হয়ে রইল।",
    });
  };

  const handleDownloadPostcard = async () => {
    if (!postcardRef.current) return;
    try {
      const canvas = await html2canvas(postcardRef.current, { scale: 2, useCORS: true });
      const link = document.createElement("a");
      link.download = `${selectedStudent?.name || "JU52"}_SlamBook_Memories.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: "স্ল্যাম বুক মেমোরি কার্ড সেভ হয়েছে! 🎉" });
    } catch {
      toast({ title: "ডাউনলোড ব্যর্থ হয়েছে", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
            <BookOpen className="w-4 h-4" />
            JU-52 ডিজিটাল ফ্রেন্ডশিপ ডায়েরি
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-foreground">
            ফ্রেন্ডশিপ স্ল্যাম বুক ও চিরকুট
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            ক্যাম্পাসের শেষ মুহূর্তের চিরকুট আর না-বলা কথাগুলো লিখে রাখো বন্ধুদের ডায়রিতে। আজীবনের জন্য থেকে যাবে এই বন্ধন।
          </p>
        </div>

        {/* Search / Select Student Card */}
        <Card className="border border-border/80 shadow-lg bg-card/60 backdrop-blur-md">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchRoll}
                  onChange={(e) => setSearchRoll(e.target.value)}
                  placeholder="বন্ধুর নাম বা বিভাগ দিয়ে খুঁজুন..."
                  className="pl-10"
                />
              </div>
              <Button type="submit" className="gap-2">
                <Search className="w-4 h-4" />
                ডায়েরি খুলুন
              </Button>
            </form>

            {/* Quick Suggestions from voter sample */}
            {!selectedStudent && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">উদাহরণ:</span>
                {votersData.slice(0, 5).map((v, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedStudent(v);
                      setSearchRoll(v.name);
                    }}
                    className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-primary/15 hover:text-primary transition-colors"
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedStudent && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Post a Note */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="border border-primary/20 shadow-xl bg-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PenLine className="w-5 h-5 text-primary" />
                    {selectedStudent.name}-এর জন্য চিরকুট লিখুন
                  </CardTitle>
                  <CardDescription>
                    {selectedStudent.dept} • {selectedStudent.hall}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold">আপনার নাম *</label>
                        <Input
                          value={authorName}
                          onChange={(e) => setAuthorName(e.target.value)}
                          placeholder="আপনার নাম"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold">আপনার বিভাগ</label>
                        <Input
                          value={authorDept}
                          onChange={(e) => setAuthorDept(e.target.value)}
                          placeholder="বিভাগের নাম"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">তাকে যে গোপন নামে ডাকতেন (ডাকনাম)</label>
                      <Input
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="যেমন: ফিলোসফার, চা-খোর..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">স্পেশাল ফ্রেন্ডশিপ ব্যাজ</label>
                      <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 border rounded-lg bg-muted/20">
                        {BADGES.map((b) => (
                          <button
                            type="button"
                            key={b.label}
                            onClick={() => setSelectedBadge(b.label)}
                            className={`flex items-center gap-1.5 p-2 rounded-lg text-xs text-left transition-all ${
                              selectedBadge === b.label
                                ? "bg-primary text-primary-foreground font-bold shadow-sm"
                                : "hover:bg-muted text-foreground"
                            }`}
                          >
                            <span>{b.emoji}</span>
                            <span className="truncate">{b.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">তার সাথে সেরা ক্যাম্পাসের স্মৃতি</label>
                      <Input
                        value={memory}
                        onChange={(e) => setMemory(e.target.value)}
                        placeholder="বটতলার আড্ডা, কনসার্ট বা বৃষ্টির কোনো মুহূর্ত..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">চিরকুট / শেষ কথা *</label>
                      <Textarea
                        value={wish}
                        onChange={(e) => setWish(e.target.value)}
                        placeholder="ভবিষ্যতের জন্য শুভকামনা বা মনের কোনো কথা..."
                        rows={3}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                      <Send className="w-4 h-4" />
                      {isSubmitting ? "জমা হচ্ছে..." : "ডায়েরিতে জমা দিন"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Slam Book Entries & Visual Postcard */}
            <div className="lg:col-span-7 space-y-6">
              {/* Header with actions */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-xl text-foreground">
                    {selectedStudent.name}-এর ডায়েরির পাতা
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    মোট {entries.length} টি চিরকুট জমা পড়েছে
                  </p>
                </div>
                {entries.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleDownloadPostcard} className="gap-2">
                    <Download className="w-3.5 h-3.5" />
                    মেমোরি কার্ড সেভ
                  </Button>
                )}
              </div>

              {/* Printable / Renderable Postcard Container */}
              <div ref={postcardRef} className="space-y-4 p-2 rounded-2xl bg-muted/10">
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    চিরকুটগুলো লোড হচ্ছে...
                  </div>
                ) : entries.length === 0 ? (
                  <Card className="border border-dashed border-border bg-card/40 text-center py-12">
                    <CardContent className="space-y-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold text-base">এখনো কোনো চিরকুট নেই!</h4>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        প্রথম বন্ধু হিসেবে এখনই {selectedStudent.name}-এর ডায়েরিতে প্রথম চিরকুটটি লিখে ফেলুন!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  entries.map((entry) => {
                    const badgeObj = BADGES.find((b) => b.label === entry.badge) || BADGES[0];
                    return (
                      <Card
                        key={entry.id}
                        className="relative overflow-hidden border border-border/80 shadow-md hover:shadow-lg transition-all bg-card/90"
                      >
                        {/* Stamp ribbon */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                          <span>{badgeObj.emoji}</span>
                          <span>{entry.badge}</span>
                        </div>

                        <CardContent className="p-5 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{entry.author_name}</span>
                            <span className="text-[11px] text-muted-foreground">({entry.author_dept})</span>
                          </div>

                          {entry.nickname && (
                            <div className="text-xs text-primary font-medium flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5" />
                              ডাকনাম: &ldquo;{entry.nickname}&rdquo;
                            </div>
                          )}

                          {entry.memory && (
                            <div className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/50">
                              <strong className="text-foreground">প্রিয় স্মৃতি:</strong> {entry.memory}
                            </div>
                          )}

                          <blockquote className="text-sm text-foreground/90 font-serif italic border-l-2 border-primary pl-3 py-1">
                            &ldquo;{entry.wish}&rdquo;
                          </blockquote>

                          <div className="text-[10px] text-muted-foreground text-right">
                            {new Date(entry.created_at).toLocaleDateString("bn-BD")}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
