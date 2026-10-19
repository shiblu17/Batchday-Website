import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Shirt,
  PenTool,
  Download,
  Share2,
  Trash2,
  Sparkles,
  Search,
  Heart,
  Check,
  Copy,
  ChevronRight,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Rotate3d,
  Users,
  User,
  Filter,
  Send,
  Loader2,
  Palette,
  X,
  MessageSquareHeart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";
import html2canvas from "html2canvas";

// Marker color presets
const MARKER_COLORS = [
  { name: "JU Crimson", hex: "#800020", bg: "bg-[#800020]" },
  { name: "Royal Blue", hex: "#1d4ed8", bg: "bg-[#1d4ed8]" },
  { name: "JU Green", hex: "#047857", bg: "bg-[#047857]" },
  { name: "Golden Amber", hex: "#d97706", bg: "bg-[#d97706]" },
  { name: "Marker Black", hex: "#18181b", bg: "bg-[#18181b]" },
  { name: "Wild Violet", hex: "#7c3aed", bg: "bg-[#7c3aed]" },
  { name: "Neon Pink", hex: "#db2777", bg: "bg-[#db2777]" },
];

// Stroke sizes
const BRUSH_SIZES = [
  { label: "ফাইন (2px)", size: 2 },
  { label: "মার্কার (4px)", size: 4 },
  { label: "বোল্ড (8px)", size: 8 },
];

// Jersey color styles
const JERSEY_THEMES = [
  { id: "white", name: "হোয়াইট গ্র্যাজুয়েশন", base: "#ffffff", fabric: "#f8fafc", trim: "#800020", text: "#1e293b" },
  { id: "maroon", name: "মেরুন ঐতিহ্য", base: "#6b0b23", fabric: "#52071a", trim: "#fbbf24", text: "#ffffff" },
  { id: "navy", name: "মিডনাইট নেভি", base: "#0f172a", fabric: "#020617", trim: "#38bdf8", text: "#ffffff" },
];

// Default sample batchmate signatures for rich initial vibe
const INITIAL_SIGNATURES: JerseySignEntry[] = [
  {
    id: "sign_init_1",
    author_name: "আবির হাসান",
    author_dept: "সিএসই",
    message: "৫২তম ব্যাচ অমর হোক! শুভকামনা সবাইকে ❤️",
    type: "stamp",
    color: "#800020",
    side: "front",
    posX: 38,
    posY: 52,
    rotation: -4,
    fontStyle: "cursive",
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "sign_init_2",
    author_name: "সাদিয়া সুলতানা",
    author_dept: "ফার্মেসি",
    message: "ক্যাম্পাসের সোনালী দিনগুলো খুব মিস করব 🌸",
    type: "stamp",
    color: "#1d4ed8",
    side: "front",
    posX: 65,
    posY: 44,
    rotation: 5,
    fontStyle: "cursive",
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: "sign_init_3",
    author_name: "তানভীর আহমেদ",
    author_dept: "পদার্থবিজ্ঞান",
    message: "বটতলার খিচুড়ি আর বন্ধুদের আড্ডা কখনো ভোলার নয়!",
    type: "stamp",
    color: "#047857",
    side: "back",
    posX: 48,
    posY: 68,
    rotation: -2,
    fontStyle: "cursive",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "sign_init_4",
    author_name: "মেহজাবিন",
    author_dept: "অর্থনীতি",
    message: "JU-52 Rocks forever! দেখা হবে বিজয়ে ✌️",
    type: "stamp",
    color: "#db2777",
    side: "back",
    posX: 32,
    posY: 35,
    rotation: 6,
    fontStyle: "cursive",
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  size: number;
  side: "front" | "back";
}

export interface JerseySignEntry {
  id: string;
  author_name: string;
  author_dept: string;
  message: string;
  type: "stamp" | "stroke";
  strokeData?: string; // serialized strokes if freehand
  color: string;
  side: "front" | "back";
  posX: number; // percentage 0-100
  posY: number; // percentage 0-100
  rotation: number;
  fontStyle?: "cursive" | "sans" | "serif";
  created_at: string;
}

const STORAGE_KEY = "ju52_digital_jersey_signatures_v1";

export default function DigitalJersey() {
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");
  const [jerseyTheme, setJerseyTheme] = useState(JERSEY_THEMES[0]);
  const [viewMode, setViewMode] = useState<"community" | "personal">("community");
  const [signatures, setSignatures] = useState<JerseySignEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("all");

  // Drawing Tools State
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentTool, setCurrentTool] = useState<"pen" | "eraser">("pen");
  const [selectedColor, setSelectedColor] = useState(MARKER_COLORS[0].hex);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1].size);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStrokes, setRedoStrokes] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Autograph Modal / Drawer State
  const [isStampModalOpen, setIsStampModalOpen] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [authorDept, setAuthorDept] = useState("");
  const [stampMessage, setStampMessage] = useState("");
  const [stampColor, setStampColor] = useState(MARKER_COLORS[0].hex);
  const [stampFont, setStampFont] = useState<"cursive" | "sans" | "serif">("cursive");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const jerseyContainerRef = useRef<HTMLDivElement | null>(null);

  // Load signatures from Supabase + LocalStorage on mount
  useEffect(() => {
    loadSignatures();
  }, []);

  const loadSignatures = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch from Supabase gallery_photos with [JERSEY_SIGN]: prefix
      const { data, error } = await supabase
        .from("gallery_photos")
        .select("*")
        .ilike("caption", "[JERSEY_SIGN]:%")
        .order("created_at", { ascending: false })
        .limit(200);

      let remoteSigns: JerseySignEntry[] = [];
      if (!error && data && data.length > 0) {
        remoteSigns = data
          .map((row) => {
            try {
              const raw = (row.caption || "").replace("[JERSEY_SIGN]:", "").trim();
              const parsed = JSON.parse(raw);
              return {
                ...parsed,
                id: parsed.id || row.id,
                created_at: parsed.created_at || row.created_at,
              };
            } catch {
              return null;
            }
          })
          .filter((item): item is JerseySignEntry => item !== null);
      }

      // 2. Fetch local storage cached signs
      const localRaw = localStorage.getItem(STORAGE_KEY);
      const localSigns: JerseySignEntry[] = localRaw ? JSON.parse(localRaw) : [];

      // Combine uniqueness
      const map = new Map<string, JerseySignEntry>();
      [...INITIAL_SIGNATURES, ...remoteSigns, ...localSigns].forEach((item) => {
        const key = item.id || `${item.author_name}_${item.message}`;
        if (!map.has(key)) {
          map.set(key, item);
        }
      });

      const combined = Array.from(map.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setSignatures(combined);
    } catch (err) {
      console.warn("Failed to load digital jersey signatures:", err);
      const localRaw = localStorage.getItem(STORAGE_KEY);
      if (localRaw) {
        setSignatures(JSON.parse(localRaw));
      } else {
        setSignatures(INITIAL_SIGNATURES);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Redraw freehand canvas strokes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Filter strokes for current side
    const currentStrokes = strokes.filter((s) => s.side === activeSide);

    currentStrokes.forEach((stroke) => {
      if (stroke.points.length === 0) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (stroke.points.length === 1) {
        ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = stroke.color;
        ctx.fill();
        return;
      }

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length - 1; i++) {
        const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
        const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
        ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
      }
      const last = stroke.points[stroke.points.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
    });
  }, [strokes, activeSide]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Adjust canvas resolution dynamically to match display
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        redrawCanvas();
      }
    }
  }, [redrawCanvas, activeSide]);

  // Canvas Event Coordinates
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  // Drawing Handlers
  const handleStartDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingMode) return;
    if ("touches" in e) {
      // Prevent mobile screen pull/refresh while drawing
      if (e.cancelable) e.preventDefault();
    }
    const pt = getCoordinates(e);
    if (!pt) return;

    setIsDrawing(true);
    const newStroke: Stroke = {
      points: [pt],
      color: currentTool === "eraser" ? jerseyTheme.base : selectedColor,
      size: currentTool === "eraser" ? brushSize * 3 : brushSize,
      side: activeSide,
    };
    setStrokes((prev) => [...prev, newStroke]);
    setRedoStrokes([]);
  };

  const handleMoveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isDrawingMode) return;
    if ("touches" in e) {
      if (e.cancelable) e.preventDefault();
    }
    const pt = getCoordinates(e);
    if (!pt) return;

    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const lastStroke = prev[prev.length - 1];
      const updatedStroke = {
        ...lastStroke,
        points: [...lastStroke.points, pt],
      };
      return [...prev.slice(0, prev.length - 1), updatedStroke];
    });
  };

  const handleEndDraw = () => {
    setIsDrawing(false);
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    setRedoStrokes((prev) => [last, ...prev]);
    setStrokes((prev) => prev.slice(0, prev.length - 1));
  };

  const handleRedo = () => {
    if (redoStrokes.length === 0) return;
    const next = redoStrokes[0];
    setStrokes((prev) => [...prev, next]);
    setRedoStrokes((prev) => prev.slice(1));
  };

  const handleClearStrokes = () => {
    setStrokes((prev) => prev.filter((s) => s.side !== activeSide));
    setRedoStrokes([]);
    toast({ title: "ক্যানভাস ক্লিয়ার করা হয়েছে" });
  };

  // Save Freehand Drawing Signature
  const handleSaveDrawing = async () => {
    const currentSideStrokes = strokes.filter((s) => s.side === activeSide);
    if (currentSideStrokes.length === 0) {
      toast({
        title: "কোনো সাইন আঁকা হয়নি!",
        description: "মার্কার দিয়ে জার্সির উপর আপনার সাইন বা নাম আঁকুন।",
        variant: "destructive",
      });
      return;
    }

    if (!authorName.trim()) {
      setIsStampModalOpen(true);
      toast({
        title: "আপনার পরিচয় দিন",
        description: "সাইনটি জার্সিতে স্থায়ী করতে আপনার নাম ও ডিপার্টমেন্ট লিখুন।",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const newEntry: JerseySignEntry = {
        id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        author_name: authorName.trim(),
        author_dept: authorDept.trim() || "৫২তম ব্যাচ",
        message: "ডিজিটাল অটোগ্রাফ সাইন",
        type: "stroke",
        color: selectedColor,
        side: activeSide,
        posX: 50,
        posY: 50,
        rotation: 0,
        created_at: new Date().toISOString(),
      };

      // Save to Supabase
      await supabase.from("gallery_photos").insert([
        {
          caption: `[JERSEY_SIGN]:${JSON.stringify(newEntry)}`,
          url: "https://batchday52ju.xyz/jersey",
          uploaded_by: authorName.trim(),
        },
      ]);

      // Cache locally
      const updated = [newEntry, ...signatures];
      setSignatures(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });

      toast({
        title: "অটোগ্রাফ যুক্ত হয়েছে! 🎉",
        description: "আপনার সাইনটি জার্সিতে সফলভাবে যুক্ত হয়েছে।",
      });

      setIsDrawingMode(false);
    } catch (err) {
      console.error(err);
      toast({
        title: "সংরক্ষণে সমস্যা হয়েছে",
        description: "তবে আপনার ডিভাইসে সাময়িকভাবে সংরক্ষিত আছে।",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Typed Autograph Stamp
  const handleSubmitStamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !stampMessage.trim()) {
      toast({
        title: "তথ্য অসম্পূর্ণ!",
        description: "দয়া করে আপনার নাম এবং একটি ছোট চিরকুট লিখুন।",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Distribute stamp nicely across the jersey canvas area
      // Avoid center varsity logo (40-60%) if on front
      const randomX = Math.floor(Math.random() * 45) + (Math.random() > 0.5 ? 20 : 35);
      const randomY = Math.floor(Math.random() * 40) + 30;
      const randomRot = Math.floor(Math.random() * 16) - 8;

      const newEntry: JerseySignEntry = {
        id: `stamp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        author_name: authorName.trim(),
        author_dept: authorDept.trim() || "৫২তম ব্যাচ",
        message: stampMessage.trim(),
        type: "stamp",
        color: stampColor,
        side: activeSide,
        posX: randomX,
        posY: randomY,
        rotation: randomRot,
        fontStyle: stampFont,
        created_at: new Date().toISOString(),
      };

      // Save to Supabase
      await supabase.from("gallery_photos").insert([
        {
          caption: `[JERSEY_SIGN]:${JSON.stringify(newEntry)}`,
          url: "https://batchday52ju.xyz/jersey",
          uploaded_by: authorName.trim(),
        },
      ]);

      // Cache locally
      const updated = [newEntry, ...signatures];
      setSignatures(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast({
        title: "অটোগ্রাফ চিরকুট যুক্ত হয়েছে! ✍️",
        description: "জার্সিতে আপনার চিরকুটটি জ্বলজ্বল করছে।",
      });

      setStampMessage("");
      setIsStampModalOpen(false);
    } catch (err) {
      console.error(err);
      toast({
        title: "সংরক্ষণে সমস্যা হয়েছে",
        description: "আপনার চিরকুটটি লোকাল মেমোরিতে রাখা হয়েছে।",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download High-Resolution Jersey Image
  const handleDownloadJersey = async () => {
    if (!jerseyContainerRef.current) return;
    setIsExporting(true);

    try {
      toast({
        title: "জার্সি প্রসেসিং হচ্ছে...",
        description: "হাই-রেজোলিউশন ছবি তৈরি হচ্ছে, কয়েক সেকেন্ড অপেক্ষা করুন।",
      });

      const element = jerseyContainerRef.current;
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `JU52_Digital_Jersey_${activeSide}_${Date.now()}.png`;
      link.click();

      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.5 },
      });

      toast({
        title: "ডাউনলোড সম্পন্ন! 🎓",
        description: "আপনার মেমোরি জার্সি সফলভাবে গ্যালারিতে সেভ হয়েছে।",
      });
    } catch (err) {
      console.error("Export error:", err);
      toast({
        title: "ডাউনলোড ব্যর্থ হয়েছে",
        description: "স্ক্রিনশট নেওয়ার চেষ্টা করুন অথবা আবার ক্লিক করুন।",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Share link
  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast({
        title: "লিংক কপি হয়েছে! 📋",
        description: "বন্ধুদের সাথে ইনবক্সে শেয়ার করে জার্সিতে সাইন করতে বলুন!",
      });
    }
  };

  // Filtered signatures for community feed
  const filteredSignatures = signatures.filter((item) => {
    const matchesSearch =
      item.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author_dept.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept =
      selectedDeptFilter === "all" ||
      item.author_dept.toLowerCase() === selectedDeptFilter.toLowerCase();

    return matchesSearch && matchesDept;
  });

  // Unique departments for filter dropdown
  const uniqueDepts = Array.from(
    new Set(signatures.map((s) => s.author_dept).filter(Boolean))
  );

  // Active stamps on current side of jersey
  const currentSideStamps = signatures.filter(
    (s) => s.side === activeSide && s.type === "stamp"
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0c10] text-foreground pb-28 pt-4 md:pt-8 transition-colors">
      {/* Top Header & Breadcrumb */}
      <div className="container max-w-6xl mx-auto px-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-2">
              <Shirt className="w-3.5 h-3.5" />
              <span>JU-52nd Graduation Keepsake</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black font-display tracking-tight flex items-center gap-2.5">
              <span>ডিজিটাল জার্সি ও অটোগ্রাফ ক্যানভাস</span>
              <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-body">
              বন্ধুদের বিদায়ী অটোগ্রাফ, প্রিয় চিরকুট আর রঙিন স্মৃতির ডিজিটাল ব্যাচ জার্সি।
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-1.5 text-xs font-semibold rounded-xl bg-card border-border/80 shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              ইনভাইট করুন
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleDownloadJersey}
              disabled={isExporting}
              className="gap-1.5 text-xs font-bold rounded-xl shadow-md bg-gradient-to-r from-primary to-[#800020] text-white hover:opacity-95"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              জার্সি ডাউনলোড
            </Button>
          </div>
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Jersey Visual Center (Span 7 or 8) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            
            {/* Control Bar Above Jersey */}
            <div className="w-full max-w-lg flex items-center justify-between bg-card/90 backdrop-blur-md border border-border/80 p-2 rounded-2xl shadow-sm mb-4 gap-2 flex-wrap">
              {/* Front / Back Toggle */}
              <div className="flex items-center bg-muted/60 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveSide("front")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeSide === "front"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  সামনে (Front)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSide("back")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeSide === "back"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  পেছনে (Back)
                </button>
              </div>

              {/* Jersey Color Swatches */}
              <div className="flex items-center gap-1.5 bg-muted/40 px-2.5 py-1 rounded-xl">
                <span className="text-[11px] text-muted-foreground font-medium mr-1 hidden sm:inline">কালার:</span>
                {JERSEY_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setJerseyTheme(theme)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      jerseyTheme.id === theme.id
                        ? "scale-110 border-primary shadow-md ring-2 ring-primary/30"
                        : "border-border hover:scale-105"
                    }`}
                    style={{ backgroundColor: theme.base }}
                    title={theme.name}
                  />
                ))}
              </div>

              {/* Drawing Mode Toggle Button */}
              <Button
                variant={isDrawingMode ? "default" : "secondary"}
                size="sm"
                onClick={() => setIsDrawingMode(!isDrawingMode)}
                className={`text-xs font-bold rounded-xl gap-1.5 transition-all ${
                  isDrawingMode ? "bg-amber-600 hover:bg-amber-700 text-white shadow-sm" : ""
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                {isDrawingMode ? "কলম মোড চালু" : "মার্কার ড্রয়িং"}
              </Button>
            </div>

            {/* Drawing Toolkit Bar (Visible when Drawing Mode is active) */}
            {isDrawingMode && (
              <div className="w-full max-w-lg bg-card border border-amber-500/30 p-3 rounded-2xl shadow-lg mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <PenTool className="w-3.5 h-3.5" />
                      মার্কার প্যালেট:
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant={currentTool === "pen" ? "default" : "outline"}
                      size="icon"
                      className="w-7 h-7 rounded-lg"
                      onClick={() => setCurrentTool("pen")}
                      title="কলম / মার্কার"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant={currentTool === "eraser" ? "default" : "outline"}
                      size="icon"
                      className="w-7 h-7 rounded-lg"
                      onClick={() => setCurrentTool("eraser")}
                      title="ইরেজার (মুছে ফেলা)"
                    >
                      <Eraser className="w-3.5 h-3.5" />
                    </Button>
                    <div className="w-[1px] h-4 bg-border mx-1" />
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-7 h-7 rounded-lg"
                      onClick={handleUndo}
                      disabled={strokes.length === 0}
                      title="আগের অবস্থায় ফিরুন (Undo)"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-7 h-7 rounded-lg"
                      onClick={handleRedo}
                      disabled={redoStrokes.length === 0}
                      title="পুনরায় করুন (Redo)"
                    >
                      <Redo2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-7 h-7 rounded-lg text-rose-500 hover:text-rose-600"
                      onClick={handleClearStrokes}
                      title="সব ক্লিয়ার করুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Colors & Brush Size */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {MARKER_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => {
                          setSelectedColor(c.hex);
                          setCurrentTool("pen");
                        }}
                        className={`w-6 h-6 rounded-full transition-transform ${c.bg} ${
                          selectedColor === c.hex && currentTool === "pen"
                            ? "ring-2 ring-primary ring-offset-2 scale-110"
                            : "hover:scale-105 opacity-80"
                        }`}
                        title={c.name}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1">
                    {BRUSH_SIZES.map((b) => (
                      <button
                        key={b.size}
                        type="button"
                        onClick={() => setBrushSize(b.size)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                          brushSize === b.size
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                        }`}
                      >
                        {b.size}px
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Freehand Sign Bar */}
                <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    আঁকা শেষ হলে সেভ বাটনে ক্লিক করুন
                  </span>
                  <Button
                    size="sm"
                    onClick={handleSaveDrawing}
                    disabled={isSubmitting}
                    className="h-7 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                    সাইন সেভ করুন
                  </Button>
                </div>
              </div>
            )}

            {/* ===== JERSEY CANVAS WRAPPER (Target for html2canvas) ===== */}
            <div
              ref={jerseyContainerRef}
              className="relative w-full max-w-[500px] aspect-[4/4.8] select-none rounded-3xl p-4 flex items-center justify-center overflow-hidden transition-all duration-300"
              style={{
                background: "radial-gradient(circle at 50% 40%, rgba(255,255,255,0.06) 0%, transparent 70%)",
              }}
            >
              {/* Realistic JU Jersey SVG Vector */}
              <div className="relative w-full h-full drop-shadow-[0_20px_35px_rgba(0,0,0,0.18)] flex items-center justify-center">
                <svg
                  viewBox="0 0 500 580"
                  className="w-full h-full overflow-visible transition-colors duration-300"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    {/* Fabric Texture Pattern */}
                    <pattern id="clothWeave" width="4" height="4" patternUnits="userSpaceOnUse">
                      <rect width="4" height="4" fill="transparent" />
                      <path d="M0 2 L4 2 M2 0 L2 4" stroke="rgba(0,0,0,0.025)" strokeWidth="0.5" />
                    </pattern>

                    {/* Shading Gradients */}
                    <linearGradient id="jerseyShadow" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
                      <stop offset="60%" stopColor="transparent" />
                      <stop offset="100%" stopColor="rgba(0,0,0,0.14)" />
                    </linearGradient>

                    {/* Shoulder fold gradient */}
                    <linearGradient id="shoulderFold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>

                  {/* 1. T-Shirt Body & Sleeves Base Path */}
                  <path
                    d="M 170 35 
                       C 195 65 305 65 330 35 
                       L 450 100 
                       L 490 200 
                       L 420 225 
                       L 395 185 
                       L 395 540 
                       L 105 540 
                       L 105 185 
                       L 80 225 
                       L 10 200 
                       L 50 100 
                       Z"
                    fill={jerseyTheme.base}
                    stroke="rgba(0,0,0,0.08)"
                    strokeWidth="2"
                  />

                  {/* 2. Fabric Weave Texture Overlay */}
                  <path
                    d="M 170 35 C 195 65 305 65 330 35 L 450 100 L 490 200 L 420 225 L 395 185 L 395 540 L 105 540 L 105 185 L 80 225 L 10 200 L 50 100 Z"
                    fill="url(#clothWeave)"
                  />

                  {/* 3. Drop Shadow & Fold Depth */}
                  <path
                    d="M 170 35 C 195 65 305 65 330 35 L 450 100 L 490 200 L 420 225 L 395 185 L 395 540 L 105 540 L 105 185 L 80 225 L 10 200 L 50 100 Z"
                    fill="url(#jerseyShadow)"
                  />

                  {/* 4. Left Sleeve Cuff (Crimson / Accent Ribbing) */}
                  <path
                    d="M 10 200 L 80 225 L 75 238 L 5 212 Z"
                    fill={jerseyTheme.trim}
                    stroke="rgba(0,0,0,0.15)"
                    strokeWidth="1"
                  />
                  {/* Sleeve Gold Stripe */}
                  <path
                    d="M 8 206 L 77 231"
                    stroke="#f59e0b"
                    strokeWidth="2"
                  />

                  {/* 5. Right Sleeve Cuff */}
                  <path
                    d="M 420 225 L 490 200 L 495 212 L 425 238 Z"
                    fill={jerseyTheme.trim}
                    stroke="rgba(0,0,0,0.15)"
                    strokeWidth="1"
                  />
                  {/* Right Sleeve Gold Stripe */}
                  <path
                    d="M 423 231 L 492 206"
                    stroke="#f59e0b"
                    strokeWidth="2"
                  />

                  {/* 6. Collar Ribbed Trim */}
                  {activeSide === "front" ? (
                    <>
                      {/* Front V / Crew Collar */}
                      <path
                        d="M 170 35 C 195 72 305 72 330 35 C 310 88 190 88 170 35 Z"
                        fill={jerseyTheme.trim}
                      />
                      <path
                        d="M 180 50 C 215 78 285 78 320 50"
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                        fill="none"
                      />
                      {/* Inner Neck Opening Shadow */}
                      <path
                        d="M 172 35 C 200 62 300 62 328 35 C 300 48 200 48 172 35 Z"
                        fill="rgba(0,0,0,0.25)"
                      />
                    </>
                  ) : (
                    <>
                      {/* Back Collar Arch */}
                      <path
                        d="M 170 35 C 205 45 295 45 330 35 C 315 54 185 54 170 35 Z"
                        fill={jerseyTheme.trim}
                      />
                      <path
                        d="M 180 43 C 215 50 285 50 320 43"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        fill="none"
                      />
                    </>
                  )}

                  {/* 7. Bottom Hem Stitched Border */}
                  <line
                    x1="105"
                    y1="528"
                    x2="395"
                    y2="528"
                    stroke="rgba(0,0,0,0.12)"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />
                  <line
                    x1="105"
                    y1="532"
                    x2="395"
                    y2="532"
                    stroke="rgba(0,0,0,0.08)"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />

                  {/* 8. Side Seams & Folds */}
                  <path
                    d="M 106 186 C 130 280 130 440 106 539"
                    stroke="rgba(0,0,0,0.05)"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d="M 394 186 C 370 280 370 440 394 539"
                    stroke="rgba(0,0,0,0.05)"
                    strokeWidth="2"
                    fill="none"
                  />

                  {/* ========================================================
                      FRONT VIEW ARTWORK (JU Logo, JU 52 Emblem)
                     ======================================================== */}
                  {activeSide === "front" && (
                    <g className="transition-opacity duration-300">
                      {/* Left Chest: Jahangirnagar University Crest / Emblem */}
                      <g transform="translate(145, 125)">
                        <circle cx="22" cy="22" r="21" fill="#800020" stroke="#f59e0b" strokeWidth="2" />
                        <circle cx="22" cy="22" r="17" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="2 1" />
                        {/* Shapla Waterlily stylized silhouette */}
                        <path
                          d="M 22 10 C 20 16 14 20 14 26 C 17 26 21 24 22 21 C 23 24 27 26 30 26 C 30 20 24 16 22 10 Z"
                          fill="#ffffff"
                        />
                        <path
                          d="M 22 14 C 21 18 18 21 18 25 C 20 25 21 23 22 21 C 23 23 24 25 26 25 C 26 21 23 18 22 14 Z"
                          fill="#f59e0b"
                        />
                        <text
                          x="22"
                          y="35"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="5"
                          fontWeight="bold"
                          fontFamily="'Hind Siliguri', sans-serif"
                        >
                          JU • ১৯৭০
                        </text>
                      </g>

                      {/* Right Chest: Batch 52 Crest */}
                      <g transform="translate(315, 128)">
                        <rect x="0" y="0" width="46" height="36" rx="6" fill="rgba(128,0,32,0.1)" stroke="#800020" strokeWidth="1.5" />
                        <text
                          x="23"
                          y="18"
                          textAnchor="middle"
                          fill={jerseyTheme.id === "white" ? "#800020" : "#f59e0b"}
                          fontSize="13"
                          fontWeight="900"
                          fontFamily="sans-serif"
                        >
                          BATCH
                        </text>
                        <text
                          x="23"
                          y="30"
                          textAnchor="middle"
                          fill={jerseyTheme.id === "white" ? "#1e293b" : "#ffffff"}
                          fontSize="11"
                          fontWeight="bold"
                          fontFamily="'Hind Siliguri', sans-serif"
                        >
                          ৫২তম
                        </text>
                      </g>

                      {/* Center Graphic: JU 52 Varsity Crest */}
                      <g transform="translate(250, 240)">
                        {/* Elegant Arc Arch Background Banner */}
                        <path
                          d="M -90 -20 Q 0 -45 90 -20 L 75 10 Q 0 -10 -75 10 Z"
                          fill="#800020"
                          stroke="#f59e0b"
                          strokeWidth="1.5"
                        />
                        <text
                          x="0"
                          y="-7"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="10.5"
                          fontWeight="bold"
                          letterSpacing="2.5"
                          fontFamily="sans-serif"
                        >
                          JAHANGIRNAGAR
                        </text>

                        {/* Bold Athletic Varsity "52" */}
                        <text
                          x="0"
                          y="62"
                          textAnchor="middle"
                          fill={jerseyTheme.id === "white" ? "#800020" : "#ffffff"}
                          stroke={jerseyTheme.id === "white" ? "#ffffff" : "#800020"}
                          strokeWidth="3"
                          fontSize="76"
                          fontWeight="900"
                          fontFamily="impact, 'Arial Black', sans-serif"
                          letterSpacing="4"
                          style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.25))" }}
                        >
                          52
                        </text>

                        {/* Subtext: Batch Day Celebration */}
                        <text
                          x="0"
                          y="88"
                          textAnchor="middle"
                          fill={jerseyTheme.id === "white" ? "#64748b" : "#cbd5e1"}
                          fontSize="11"
                          fontWeight="bold"
                          letterSpacing="2"
                          fontFamily="'Hind Siliguri', sans-serif"
                        >
                          ★ ব্যাচ ডে ২০২৬ ★
                        </text>
                      </g>

                      {/* Bottom Hem Tag */}
                      <g transform="translate(250, 505)">
                        <text
                          x="0"
                          y="0"
                          textAnchor="middle"
                          fill="rgba(100,116,139,0.7)"
                          fontSize="9"
                          fontWeight="600"
                          fontFamily="'Hind Siliguri', sans-serif"
                          letterSpacing="1.5"
                        >
                          স্মৃতির আঙিনায় ৫২তম ব্যাচ • জাহাঙ্গীরনগর বিশ্ববিদ্যালয়
                        </text>
                      </g>
                    </g>
                  )}

                  {/* ========================================================
                      BACK VIEW ARTWORK (Big 52, Graduate Arch)
                     ======================================================== */}
                  {activeSide === "back" && (
                    <g className="transition-opacity duration-300">
                      {/* Shoulder Arch: GRADUATE */}
                      <g transform="translate(250, 150)">
                        <path
                          d="M -110 0 Q 0 -35 110 0"
                          stroke="rgba(128,0,32,0.3)"
                          strokeWidth="28"
                          fill="none"
                        />
                        <text
                          x="0"
                          y="-4"
                          textAnchor="middle"
                          fill={jerseyTheme.id === "white" ? "#800020" : "#f59e0b"}
                          fontSize="19"
                          fontWeight="900"
                          letterSpacing="4"
                          fontFamily="sans-serif"
                        >
                          JU GRADUATE
                        </text>
                      </g>

                      {/* Giant Back Number 52 */}
                      <g transform="translate(250, 310)">
                        <text
                          x="0"
                          y="0"
                          textAnchor="middle"
                          fill={jerseyTheme.id === "white" ? "#800020" : "#ffffff"}
                          stroke={jerseyTheme.id === "white" ? "#f59e0b" : "#800020"}
                          strokeWidth="4"
                          fontSize="145"
                          fontWeight="900"
                          fontFamily="impact, 'Arial Black', sans-serif"
                          letterSpacing="6"
                          style={{ filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.3))" }}
                        >
                          52
                        </text>
                      </g>

                      {/* Lower Back Motto */}
                      <g transform="translate(250, 420)">
                        <rect x="-85" y="-14" width="170" height="28" rx="14" fill="rgba(128,0,32,0.12)" />
                        <text
                          x="0"
                          y="4"
                          textAnchor="middle"
                          fill={jerseyTheme.id === "white" ? "#800020" : "#ffffff"}
                          fontSize="12.5"
                          fontWeight="bold"
                          fontFamily="'Hind Siliguri', sans-serif"
                        >
                          ক্যাম্পাসের রক্তিম ভালোবাসায়
                        </text>
                      </g>
                    </g>
                  )}
                </svg>

                {/* ===== OVERLAY 1: FREEHAND DRAWING CANVAS ===== */}
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleStartDraw}
                  onMouseMove={handleMoveDraw}
                  onMouseUp={handleEndDraw}
                  onMouseLeave={handleEndDraw}
                  onTouchStart={handleStartDraw}
                  onTouchMove={handleMoveDraw}
                  onTouchEnd={handleEndDraw}
                  className={`absolute inset-0 w-full h-full z-20 ${
                    isDrawingMode ? "cursor-crosshair pointer-events-auto touch-none" : "pointer-events-none"
                  }`}
                />

                {/* ===== OVERLAY 2: AUTOGRAPH STAMPS & NOTES ===== */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                  {currentSideStamps.map((stamp) => (
                    <div
                      key={stamp.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 group pointer-events-auto cursor-pointer transition-transform hover:scale-110 hover:z-30"
                      style={{
                        left: `${stamp.posX}%`,
                        top: `${stamp.posY}%`,
                        transform: `translate(-50%, -50%) rotate(${stamp.rotation}deg)`,
                      }}
                      title={`${stamp.author_name} (${stamp.author_dept}): "${stamp.message}"`}
                    >
                      <div
                        className="px-2.5 py-1.5 rounded-lg border shadow-sm backdrop-blur-[2px] max-w-[150px] sm:max-w-[180px] select-none text-left"
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.88)",
                          borderColor: `${stamp.color}55`,
                          color: stamp.color,
                        }}
                      >
                        <div className="flex items-center gap-1 leading-tight">
                          <span className="text-[10px] font-bold truncate">
                            {stamp.author_name}
                          </span>
                          <span className="text-[8px] opacity-75 truncate">
                            • {stamp.author_dept}
                          </span>
                        </div>
                        <p
                          className={`text-xs mt-0.5 leading-snug line-clamp-2 ${
                            stamp.fontStyle === "cursive"
                              ? "font-cursive text-sm"
                              : stamp.fontStyle === "serif"
                              ? "font-serif"
                              : "font-body"
                          }`}
                        >
                          "{stamp.message}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtle Watermark for High-Res Export */}
                <div className="absolute bottom-2 right-4 text-[9px] font-bold text-muted-foreground/60 select-none z-0">
                  JU-52 Batch Day • batchday52ju.xyz/jersey
                </div>
              </div>
            </div>

            {/* Bottom Jersey Bar Indicators */}
            <div className="w-full max-w-lg mt-4 flex items-center justify-between text-xs text-muted-foreground px-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="w-3.5 h-3.5 text-primary" />
                মোট সাইন সংগৃহীত:{" "}
                <strong className="text-foreground">{signatures.length}</strong> জন
              </span>

              <button
                type="button"
                onClick={() => setIsStampModalOpen(true)}
                className="text-primary hover:underline font-bold flex items-center gap-1"
              >
                <Type className="w-3.5 h-3.5" />
                চিরকুট বা নাম যুক্ত করুন
              </button>
            </div>
          </div>

          {/* RIGHT: Autograph Input & Community Wall (Span 5) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* 1. Quick Sign Box */}
            <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold font-display flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-primary" />
                  <span>জার্সিতে অটোগ্রাফ দিন</span>
                </h2>
                <span className="text-[11px] bg-primary/10 text-primary font-bold px-2.5 py-0.5 rounded-full">
                  চিরকুট মোড
                </span>
              </div>

              <form onSubmit={handleSubmitStamp} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                      আপনার নাম / ডাকনাম *
                    </label>
                    <Input
                      placeholder="যেমন: আবির / মিতু"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="h-9 text-xs rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                      বিভাগ (Department)
                    </label>
                    <Input
                      placeholder="যেমন: সিএসই / ইংরেজি"
                      value={authorDept}
                      onChange={(e) => setAuthorDept(e.target.value)}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    বন্ধুদের উদ্দেশ্যে উইশ বা স্মৃতি চিরকুট *
                  </label>
                  <Textarea
                    placeholder="যেমন: বটতলার আড্ডা, টারজানের ক্যানটিন আর দোস্তদের হাসি আজীবন মনে থাকবে..."
                    value={stampMessage}
                    onChange={(e) => setStampMessage(e.target.value)}
                    className="text-xs rounded-xl resize-none h-18"
                    maxLength={140}
                    required
                  />
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
                    <span>{140 - stampMessage.length} অক্ষর বাকি</span>
                    <span>সাইড: {activeSide === "front" ? "সামনে" : "পেছনে"}</span>
                  </div>
                </div>

                {/* Marker Color & Font Style selection */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    {MARKER_COLORS.slice(0, 5).map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setStampColor(c.hex)}
                        className={`w-5 h-5 rounded-full transition-transform ${c.bg} ${
                          stampColor === c.hex ? "ring-2 ring-primary ring-offset-1 scale-110" : "opacity-75"
                        }`}
                        title={c.name}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setStampFont("cursive")}
                      className={`px-2 py-0.5 text-[11px] rounded transition-colors font-cursive ${
                        stampFont === "cursive" ? "bg-card shadow-sm font-bold text-primary" : "text-muted-foreground"
                      }`}
                    >
                      হাতের লেখা
                    </button>
                    <button
                      type="button"
                      onClick={() => setStampFont("sans")}
                      className={`px-2 py-0.5 text-[10px] rounded transition-colors font-sans ${
                        stampFont === "sans" ? "bg-card shadow-sm font-bold text-primary" : "text-muted-foreground"
                      }`}
                    >
                      বোল্ড
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 rounded-xl font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-md gap-1.5"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  জার্সিতে সাইন পোস্ট করুন
                </Button>
              </form>
            </div>

            {/* 2. Community Signature Feed & Wall */}
            <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold font-display flex items-center gap-1.5">
                    <MessageSquareHeart className="w-4 h-4 text-rose-500" />
                    <span>বন্ধুদের অটোগ্রাফ ফিড</span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    ব্যাচমেটদের রেখে যাওয়া শুভেচ্ছা ও স্মৃতিবার্তা
                  </p>
                </div>

                <span className="text-xs font-bold text-muted-foreground">
                  {filteredSignatures.length} টি চিরকুট
                </span>
              </div>

              {/* Search & Filter */}
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="বন্ধু বা বিভাগ খুঁজুন..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 text-xs rounded-xl"
                  />
                </div>

                {uniqueDepts.length > 0 && (
                  <select
                    value={selectedDeptFilter}
                    onChange={(e) => setSelectedDeptFilter(e.target.value)}
                    className="h-8 text-xs px-2.5 rounded-xl border border-input bg-background text-foreground"
                  >
                    <option value="all">সকল বিভাগ</option>
                    {uniqueDepts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Feed List */}
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {isLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-xs">অটোগ্রাফ লোড হচ্ছে...</span>
                  </div>
                ) : filteredSignatures.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    <Shirt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">কোনো অটোগ্রাফ পাওয়া যায়নি</p>
                    <p className="text-[10px] mt-0.5">প্রথম অটোগ্রাফটি আপনিই দিয়ে দিন!</p>
                  </div>
                ) : (
                  filteredSignatures.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl border border-border/60 bg-muted/30 hover:bg-muted/60 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs font-bold text-foreground">
                            {item.author_name}
                          </span>
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded-md">
                            {item.author_dept}
                          </span>
                        </div>
                        <span className="text-[9px] text-muted-foreground">
                          {item.side === "front" ? "সামনে" : "পেছনে"}
                        </span>
                      </div>

                      <p
                        className={`text-xs text-foreground/90 mt-1 leading-relaxed ${
                          item.fontStyle === "cursive" ? "font-cursive text-sm" : ""
                        }`}
                      >
                        "{item.message}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Floating Dialog / Modal for Detailed Stamp placement */}
      {isStampModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-card border border-border p-6 rounded-3xl shadow-2xl">
            <button
              type="button"
              onClick={() => setIsStampModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <h3 className="text-lg font-bold font-display flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>জার্সি অটোগ্রাফ চিরকুট</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                জার্সির যেকোনো ফাঁকা জায়গায় আপনার লেখা স্ট্যাম্প হিসেবে বসে যাবে
              </p>
            </div>

            <form onSubmit={handleSubmitStamp} className="space-y-4">
              <div>
                <label className="text-xs font-bold block mb-1">আপনার নাম *</label>
                <Input
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="আপনার পুরো নাম বা ডাকনাম"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">বিভাগ (Department)</label>
                <Input
                  value={authorDept}
                  onChange={(e) => setAuthorDept(e.target.value)}
                  placeholder="যেমন: গণযোগাযোগ ও সাংবাদিকতা"
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">উইশ চিরকুট *</label>
                <Textarea
                  value={stampMessage}
                  onChange={(e) => setStampMessage(e.target.value)}
                  placeholder="ব্যাচমেটদের জন্য চিরকুট..."
                  maxLength={140}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1.5">কালার নির্বাচন করুন</label>
                <div className="flex items-center gap-2">
                  {MARKER_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setStampColor(c.hex)}
                      className={`w-7 h-7 rounded-full transition-transform ${c.bg} ${
                        stampColor === c.hex ? "ring-2 ring-primary ring-offset-2 scale-110" : "opacity-80"
                      }`}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsStampModalOpen(false)}
                >
                  বাতিল
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary text-primary-foreground font-bold"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "জার্সিতে বসান"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
