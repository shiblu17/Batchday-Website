import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Film,
  Trash2,
  Play,
  Pause,
  ExternalLink,
  Flame,
  Search,
  RefreshCw,
  Loader2,
  Music2,
  Sparkles,
  Eye,
  X,
  Volume2,
  VolumeX,
  Server,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Activity,
  Wifi,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getFilterCss } from "@/utils/reelsCustomization";
import {
  getActiveCloudinaryPool,
  pingCloudinaryAccount,
  addCustomCloudinaryAccount,
  removeCustomCloudinaryAccount,
  getCustomCloudinaryAccounts,
  getAccountExhaustionInfo,
  clearAccountExhausted,
  type CloudinaryAccount,
  type CloudinaryServerHealth,
} from "@/utils/cloudinaryReelsService";

interface AdminReelItem {
  id: string;
  url: string;
  caption?: string;
  rawCaption?: string;
  uploaderName: string;
  department: string;
  fileId?: string;
  filterId?: string;
  audioType?: "original" | "itunes";
  audioTitle?: string;
  audioArtist?: string;
  audioArtwork?: string;
  audioPreviewUrl?: string;
  created_at: string;
  fire: number;
}

export default function AdminReels() {
  const [reels, setReels] = useState<AdminReelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [previewReel, setPreviewReel] = useState<AdminReelItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Cloudinary Servers Pool State
  const [serverPool, setServerPool] = useState<CloudinaryAccount[]>(() => getActiveCloudinaryPool());
  const [serverHealthMap, setServerHealthMap] = useState<Record<string, CloudinaryServerHealth>>({});
  const [isPingingAll, setIsPingingAll] = useState(false);
  const [showAddServerModal, setShowAddServerModal] = useState(false);
  const [newCloudName, setNewCloudName] = useState("");
  const [newUploadPreset, setNewUploadPreset] = useState("");
  const [isTestingNewServer, setIsTestingNewServer] = useState(false);
  const [newServerTestResult, setNewServerTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchReels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("gallery_photos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        // Filter strictly reels and videos (excluding legacy test reels)
        const LEGACY_CUTOFF = "2026-10-18T10:45:00.000Z";
        const videoRows = data.filter((row: any) => {
          if (row.created_at && row.created_at < LEGACY_CUTOFF) {
            return false;
          }
          const urlLower = (row.url || "").toLowerCase();
          const cap = row.caption || "";
          return (
            cap.startsWith("[REEL") ||
            urlLower.includes(".mp4") ||
            urlLower.includes(".webm") ||
            urlLower.includes("cloudinary.com") ||
            urlLower.includes("res.cloudinary.com")
          );
        });

        const parsed: AdminReelItem[] = videoRows.map((row: any) => {
          let uploaderName = "ব্যাচমেট";
          let department = "জাহাঙ্গীরনগর বিশ্ববিদ্যালয়";
          let cleanCaption = "";
          let fileId: string | undefined;
          let filterId: string = "normal";
          let audioType: "original" | "itunes" = "original";
          let audioTitle: string | undefined;
          let audioArtist: string | undefined;
          let audioArtwork: string | undefined;
          let audioPreviewUrl: string | undefined;

          if (row.caption && row.caption.startsWith("[REEL")) {
            const metaMatch = row.caption.match(/^\[REEL:?([^\]]*)\]/);
            if (metaMatch && metaMatch[1]) {
              const parts = metaMatch[1].split("|");
              fileId = parts[0] || undefined;
              parts.slice(1).forEach((part: string) => {
                const [k, ...vArr] = part.split(":");
                const v = vArr.join(":");
                if (k === "flt") filterId = v;
                if (k === "aud") audioType = v === "itunes" ? "itunes" : "original";
                if (k === "tt") audioTitle = decodeURIComponent(v);
                if (k === "ta") audioArtist = decodeURIComponent(v);
                if (k === "tar") audioArtwork = decodeURIComponent(v);
                if (k === "tp") audioPreviewUrl = decodeURIComponent(v);
              });
            }

            const remainder = row.caption.replace(/^\[REEL:?[^\]]*\]\s*/, "");
            const nameMatch = remainder.match(/^([^(]+)\s*\(([^)]+)\)(?::\s*(.*))?$/);
            if (nameMatch) {
              uploaderName = nameMatch[1].trim();
              department = nameMatch[2].trim();
              cleanCaption = nameMatch[3]?.trim() || "";
            } else {
              cleanCaption = remainder;
            }
          } else {
            cleanCaption = row.caption || "";
          }

          const localFire = parseInt(localStorage.getItem(`reel_fire_${row.id}`) || "0", 10) || 1;

          return {
            id: row.id,
            url: row.url,
            rawCaption: row.caption,
            caption: cleanCaption,
            uploaderName,
            department,
            fileId,
            filterId,
            audioType,
            audioTitle,
            audioArtist,
            audioArtwork,
            audioPreviewUrl,
            created_at: row.created_at,
            fire: localFire,
          };
        });

        setReels(parsed);
      }
    } catch (err: any) {
      console.error("Error fetching reels for admin:", err);
      toast.error("রিলস লোড হতে পারেনি: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Diagnostic ping for all Cloudinary servers
  const runDiagnosticPing = async (silent = false) => {
    setIsPingingAll(true);
    const pool = getActiveCloudinaryPool();
    setServerPool(pool);

    const promises = pool.map(async (account) => {
      setServerHealthMap((prev) => ({
        ...prev,
        [account.cloudName]: {
          cloudName: account.cloudName,
          uploadPreset: account.uploadPreset,
          status: "checking",
        },
      }));

      const res = await pingCloudinaryAccount(account);
      setServerHealthMap((prev) => ({
        ...prev,
        [account.cloudName]: res,
      }));
      return res;
    });

    const results = await Promise.all(promises);
    setIsPingingAll(false);

    const exhaustedList = results.filter((r) => r.status === "exhausted");
    const degradedList = results.filter((r) => r.status === "degraded");

    if (!silent) {
      if (exhaustedList.length > 0) {
        toast.error(`⚠️ সতর্কতা: ${exhaustedList.length}টি সার্ভারের লিমিট/কোটা শেষ হয়েছে! অবিলম্বে নতুন সার্ভার যুক্ত করুন।`);
      } else if (degradedList.length > 0) {
        toast.warning(`⚠️ ${degradedList.length}টি সার্ভারে সংযোগ সমস্যা দেখা দিয়েছে।`);
      } else {
        toast.success("✅ সকল ক্লাউডিনারি সার্ভার ১০০% সুস্থ ও আপলোডের জন্য প্রস্তুত!");
      }
    }
  };

  useEffect(() => {
    fetchReels();
    runDiagnosticPing(true);
  }, []);

  const handleTestNewServer = async () => {
    if (!newCloudName.trim() || !newUploadPreset.trim()) {
      toast.error("দয়া করে Cloud Name এবং Upload Preset উভয়ই লিখুন");
      return;
    }
    setIsTestingNewServer(true);
    setNewServerTestResult(null);
    try {
      const res = await pingCloudinaryAccount({
        cloudName: newCloudName.trim(),
        uploadPreset: newUploadPreset.trim(),
      });
      if (res.status === "healthy") {
        setNewServerTestResult({
          success: true,
          message: `সংযোগ সফল! লেটেন্সি: ${res.latencyMs}ms। সার্ভারটি সম্পূর্ণ সচল।`,
        });
      } else {
        setNewServerTestResult({
          success: false,
          message: res.errorMessage || "সংযোগ ব্যর্থ হয়েছে। দয়া করে ক্লাউড নাম ও আনসাইন্ড প্রিসেট যাচাই করুন।",
        });
      }
    } catch (err: any) {
      setNewServerTestResult({
        success: false,
        message: err.message || "সার্ভার রেসপন্স দেয়নি।",
      });
    } finally {
      setIsTestingNewServer(false);
    }
  };

  const handleSaveNewServer = () => {
    if (!newCloudName.trim() || !newUploadPreset.trim()) {
      toast.error("দয়া করে Cloud Name এবং Upload Preset উভয়ই লিখুন");
      return;
    }
    addCustomCloudinaryAccount({
      cloudName: newCloudName.trim(),
      uploadPreset: newUploadPreset.trim(),
    });
    toast.success(`🎉 সার্ভার '${newCloudName.trim()}' সফলভাবে পুলে যুক্ত হয়েছে!`);
    setNewCloudName("");
    setNewUploadPreset("");
    setNewServerTestResult(null);
    setShowAddServerModal(false);
    const updated = getActiveCloudinaryPool();
    setServerPool(updated);
    runDiagnosticPing(false);
  };

  const handleRemoveServer = (cloudName: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে '${cloudName}' সার্ভারটি পুল থেকে মুছে ফেলতে চান?`)) return;
    removeCustomCloudinaryAccount(cloudName);
    toast.info(`সার্ভার '${cloudName}' পুল থেকে সরানো হয়েছে।`);
    const updated = getActiveCloudinaryPool();
    setServerPool(updated);
  };

  const handleResetExhaustion = (cloudName: string) => {
    clearAccountExhausted(cloudName);
    toast.success(`'${cloudName}' এর লিমিট ফ্ল্যাগ রিসেট করা হয়েছে।`);
    setServerHealthMap((prev) => ({
      ...prev,
      [cloudName]: {
        ...prev[cloudName],
        status: "unknown",
        errorMessage: undefined,
      },
    }));
    const acc = serverPool.find((s) => s.cloudName === cloudName);
    if (acc) {
      pingCloudinaryAccount(acc).then((res) => {
        setServerHealthMap((prev) => ({ ...prev, [cloudName]: res }));
      });
    }
  };

  // Delete Reel
  const handleDeleteReel = async (id: string, name: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে @${name} এর এই রিলসটি পুরোপুরি মুছে ফেলতে চান? এটি মুছে ফেললে তা লাইভ ফিড থেকেও অদৃশ্য হয়ে যাবে।`)) {
      return;
    }

    setDeletingId(id);
    try {
      const { error } = await supabase.from("gallery_photos").delete().eq("id", id);
      if (error) throw error;

      toast.success("রিলসটি সফলভাবে মুছে ফেলা হয়েছে! 🗑️");
      setReels((prev) => prev.filter((r) => r.id !== id));
      if (previewReel?.id === id) {
        setPreviewReel(null);
      }
    } catch (err: any) {
      console.error("Delete reel failed:", err);
      toast.error("রিলস মোছা সম্ভব হয়নি: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered Reels
  const filteredReels = reels.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      r.uploaderName.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q) ||
      (r.caption || "").toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q);

    const matchDept = selectedDept === "all" || r.department === selectedDept;
    return matchSearch && matchDept;
  });

  // Extract distinct departments
  const departments = Array.from(new Set(reels.map((r) => r.department).filter(Boolean)));

  // Total stats
  const totalFireCount = reels.reduce((acc, r) => acc + (r.fire || 1), 0);
  const totalCreators = new Set(reels.map((r) => r.uploaderName)).size;

  // Server pool metrics
  const hasExhaustedServers = serverPool.some(
    (s) => serverHealthMap[s.cloudName]?.status === "exhausted" || getAccountExhaustionInfo(s.cloudName).isExhausted
  );
  const exhaustedServerNames = serverPool
    .filter((s) => serverHealthMap[s.cloudName]?.status === "exhausted" || getAccountExhaustionInfo(s.cloudName).isExhausted)
    .map((s) => s.cloudName);

  const healthyServersCount = serverPool.filter(
    (s) => (serverHealthMap[s.cloudName]?.status || "healthy") === "healthy" && !getAccountExhaustionInfo(s.cloudName).isExhausted
  ).length;

  const isLowCapacity = healthyServersCount <= 2;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              রিলস মডারেশন ও কন্ট্রোল
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-sans font-semibold">
                লাইভ
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              ব্যাচমেটদের আপলোড করা রিলস পর্যবেক্ষণ, প্রিভিউ ও যেকোনো অপ্রীতিকর কনটেন্ট এক ক্লিকে ডিলিট করার ব্যবস্থা।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReels}
            disabled={loading}
            className="rounded-full gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            রিফ্রেশ
          </Button>

          <Button
            size="sm"
            asChild
            className="bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white rounded-full gap-1.5 text-xs font-semibold shadow-md"
          >
            <a href="/stream" target="_blank" rel="noreferrer">
              <ExternalLink className="w-3.5 h-3.5" />
              লাইভ ফিড দেখো
            </a>
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium block">মোট রিলস</span>
            <span className="text-2xl font-bold font-display text-foreground mt-0.5 block">
              {reels.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Film className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium block">মোট ক্রিয়েটর</span>
            <span className="text-2xl font-bold font-display text-foreground mt-0.5 block">
              {totalCreators}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium block">ফায়ার রিঅ্যাকশন</span>
            <span className="text-2xl font-bold font-display text-amber-500 mt-0.5 block flex items-center gap-1">
              {totalFireCount} <Flame className="w-4 h-4 fill-amber-500" />
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium block">সার্ভার পুল হেলথ</span>
            <span className={`text-base sm:text-lg font-bold font-display mt-0.5 block flex items-center gap-1.5 ${
              hasExhaustedServers ? "text-rose-500" : "text-emerald-500"
            }`}>
              <span className={`w-2 h-2 rounded-full ${hasExhaustedServers ? "bg-rose-500 animate-ping" : "bg-emerald-500 animate-pulse"}`} />
              {healthyServersCount}/{serverPool.length} সচল
            </span>
            <span className="text-[10px] text-muted-foreground block font-mono">
              {serverPool.length * 25} GB মোট পুল
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            hasExhaustedServers ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
          }`}>
            <Server className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ================== ⚠️ REAL-TIME SERVER QUOTA & HEALTH ALERT BANNER ================== */}
      {(hasExhaustedServers || isLowCapacity) && (
        <div className="relative overflow-hidden rounded-3xl border-2 border-rose-500/70 bg-gradient-to-r from-rose-950/80 via-zinc-950 to-amber-950/70 p-5 shadow-[0_0_30px_rgba(244,63,94,0.3)] animate-in fade-in duration-300">
          <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-lg animate-pulse">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-white tracking-wide">
                    ⚠️ জরুরি নোটিফিকেশন: রিলস সার্ভারের লিমিট শেষ হয়ে আসছে!
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold font-mono uppercase tracking-wider animate-pulse">
                    Action Required
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-1 max-w-2xl leading-relaxed">
                  {hasExhaustedServers ? (
                    <>
                      সার্ভার <strong className="text-rose-400 font-mono">[{exhaustedServerNames.join(", ")}]</strong>-এর ক্লাউডিনারি ফ্রি কোটা/ক্রেডিট লিমিট শেষ হয়ে গেছে বা সংযোগ বিচ্ছিন্ন! সাধারণ ব্যবহারকারীদের নিরবচ্ছিন্ন রিলস আপলোড চালু রাখতে অবিলম্বে আরও সার্ভার কানেক্ট করুন।
                    </>
                  ) : (
                    <>
                      পুলে সক্রিয় সার্ভার কমে মাত্র <strong className="text-amber-400 font-mono">{healthyServersCount}</strong> টি রয়েছে! যেকোনো সময় আপলোড ব্যাহত হতে পারে। অবিলম্বে নতুন সার্ভার যুক্ত করুন।
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 sm:self-center">
              <Button
                size="sm"
                onClick={() => setShowAddServerModal(true)}
                className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs rounded-full px-5 h-9 shadow-lg shadow-rose-600/30 gap-1.5 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ আরও সার্ভার কানেক্ট করো</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runDiagnosticPing(false)}
                disabled={isPingingAll}
                className="border-white/20 hover:bg-white/10 text-zinc-200 rounded-full text-xs h-9"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isPingingAll ? "animate-spin" : ""}`} />
                রিচেক
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================== CLOUDINARY SERVER POOL & LIVE QUOTA MONITOR ================== */}
      <div className="p-5 rounded-3xl bg-card border border-border shadow-sm space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  ক্লাউডিনারি রিলস সার্ভার পুল ও ব্যান্ডউইথ হেলথ
                </h2>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                  hasExhaustedServers
                    ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                }`}>
                  {healthyServersCount}/{serverPool.length} সচল ({Math.round((healthyServersCount / Math.max(1, serverPool.length)) * 100)}%)
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                লোড-ব্যালেন্সিং ক্লাউডিনারি সার্ভারগুলোর রিয়েল-টাইম কোটা, রেসপন্স টাইম ও ভিডিও লোড পর্যবেক্ষণ।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => runDiagnosticPing(false)}
              disabled={isPingingAll}
              className="rounded-full gap-1.5 text-xs h-8"
              title="সকল ক্লাউডিনারি সার্ভারের লাইভ হেলথ চেক করুন"
            >
              <Activity className={`w-3.5 h-3.5 text-cyan-500 ${isPingingAll ? "animate-spin" : ""}`} />
              <span>{isPingingAll ? "যাচাই হচ্ছে..." : "ডায়াগনস্টিক টেস্ট (Ping All)"}</span>
            </Button>

            <Button
              size="sm"
              onClick={() => {
                setNewCloudName("");
                setNewUploadPreset("");
                setNewServerTestResult(null);
                setShowAddServerModal(true);
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full gap-1.5 text-xs font-semibold h-8 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ নতুন সার্ভার কানেক্ট করো</span>
            </Button>
          </div>
        </div>

        {/* Server Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {serverPool.map((account, index) => {
            const health = serverHealthMap[account.cloudName];
            const isEx = health?.status === "exhausted" || getAccountExhaustionInfo(account.cloudName).isExhausted;
            const isChecking = health?.status === "checking";
            const isDegraded = health?.status === "degraded";

            // Calculate videos on this account
            const accountReelsCount = reels.filter((r) =>
              r.url.toLowerCase().includes(account.cloudName.toLowerCase())
            ).length;
            const estMbUsed = Math.round(accountReelsCount * 1.5);
            const quotaPercent = Math.min(100, Math.max(1, Math.round((estMbUsed / 25000) * 100)));

            const isCustom = getCustomCloudinaryAccounts().some(
              (c) => c.cloudName.toLowerCase() === account.cloudName.toLowerCase()
            );

            return (
              <div
                key={account.cloudName}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  isEx
                    ? "bg-rose-500/10 border-rose-500/60 shadow-sm shadow-rose-500/15"
                    : isDegraded
                    ? "bg-amber-500/10 border-amber-500/40"
                    : "bg-muted/20 border-border hover:border-primary/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground font-mono">
                        #{index + 1} {account.cloudName}
                      </span>
                      {isCustom && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-medium">
                          Custom
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    {isChecking ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 flex items-center gap-1">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        চেক হচ্ছে
                      </span>
                    ) : isEx ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-500 border border-rose-500/40 flex items-center gap-1 animate-pulse">
                        <XCircle className="w-2.5 h-2.5" />
                        লিমিট শেষ
                      </span>
                    ) : isDegraded ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        সংযোগ সমস্যা
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        সচল {health?.latencyMs ? `(${health.latencyMs}ms)` : ""}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-muted-foreground space-y-0.5">
                    <p className="truncate font-mono">
                      প্রিসেট: <span className="text-foreground">{account.uploadPreset}</span>
                    </p>
                    <p className="text-xs font-semibold text-foreground">
                      {accountReelsCount}টি রিলস হোস্টেড (~{estMbUsed} MB)
                    </p>
                    {health?.errorMessage && (
                      <p className="text-[10px] text-rose-500 font-medium truncate" title={health.errorMessage}>
                        ⚠️ {health.errorMessage}
                      </p>
                    )}
                  </div>

                  {/* Quota Usage Bar */}
                  <div className="mt-2.5 space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>ব্যবহৃত কোটা</span>
                      <span className="font-mono">{quotaPercent}% / ২৫ GB</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isEx
                            ? "bg-rose-500"
                            : quotaPercent > 70
                            ? "bg-amber-500"
                            : "bg-gradient-to-r from-emerald-500 to-cyan-500"
                        }`}
                        style={{ width: `${quotaPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-1 text-[11px]">
                  <button
                    onClick={async () => {
                      setServerHealthMap((prev) => ({
                        ...prev,
                        [account.cloudName]: { ...prev[account.cloudName], status: "checking" },
                      }));
                      const res = await pingCloudinaryAccount(account);
                      setServerHealthMap((prev) => ({ ...prev, [account.cloudName]: res }));
                      if (res.status === "healthy") {
                        toast.success(`${account.cloudName} সার্ভার সম্পূর্ণ সচল! (${res.latencyMs}ms)`);
                      } else {
                        toast.error(`${account.cloudName}: ${res.errorMessage || "ত্রুটি পাওয়া গেছে"}`);
                      }
                    }}
                    disabled={isChecking}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <Wifi className="w-3 h-3" />
                    পিং টেস্ট
                  </button>

                  <div className="flex items-center gap-2">
                    {isEx && (
                      <button
                        onClick={() => handleResetExhaustion(account.cloudName)}
                        className="text-[10px] text-amber-500 hover:underline"
                        title="কোটা লিমিট সতর্কবার্তা রিসেট করুন"
                      >
                        রিসেট
                      </button>
                    )}
                    {isCustom && (
                      <button
                        onClick={() => handleRemoveServer(account.cloudName)}
                        className="text-[10px] text-rose-500 hover:underline"
                        title="এই সার্ভারটি পুল থেকে মুছুন"
                      >
                        মুছুন
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-card border border-border shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ক্রিয়েটরের নাম, বিভাগ বা ক্যাপশন দিয়ে সার্চ করো..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-xl bg-muted/40 border-border text-xs h-9"
          />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="h-9 px-3 text-xs rounded-xl bg-muted/40 border border-border text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">সব ডিপার্টমেন্ট ({reels.length})</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs font-mono">রিলস ডেটাবেস লোড হচ্ছে...</span>
        </div>
      ) : filteredReels.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl p-6">
          <Film className="w-10 h-10 mx-auto text-muted-foreground/60 mb-2" />
          <h3 className="text-base font-bold text-foreground">কোনো রিলস পাওয়া যায়নি</h3>
          <p className="text-xs text-muted-foreground mt-1">
            সার্চ ফিল্টার রিসেট করে আবার চেষ্টা করুন।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReels.map((reel) => (
            <div
              key={reel.id}
              className="group relative bg-card border border-border hover:border-primary/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Top Meta Header */}
              <div className="p-3.5 pb-2.5 flex items-center justify-between border-b border-border/50 bg-muted/20">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {reel.uploaderName.charAt(0) || "U"}
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-foreground block truncate">
                      @{reel.uploaderName}
                    </span>
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {reel.department}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    <Flame className="w-3 h-3 fill-amber-500" />
                    {reel.fire}
                  </span>
                </div>
              </div>

              {/* Video Player Box / Thumbnail */}
              <div className="relative aspect-[9/13] bg-black overflow-hidden flex items-center justify-center">
                <video
                  src={reel.url}
                  preload="metadata"
                  playsInline
                  muted
                  style={{ filter: getFilterCss(reel.filterId) }}
                  className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
                />

                {/* Quick Preview Trigger Overlay */}
                <button
                  onClick={() => setPreviewReel(reel)}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/10 transition-colors group/play"
                  title="সম্পূর্ণ রিলস প্রিভিউ করো"
                >
                  <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover/play:scale-110 active:scale-95 transition-transform shadow-xl">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </button>

                {/* Filter & Music Badges on Video */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                  {reel.filterId && reel.filterId !== "normal" && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-amber-300 border border-white/10">
                      ✨ {reel.filterId}
                    </span>
                  )}
                  {reel.audioTitle && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-pink-300 border border-white/10 flex items-center gap-1 truncate max-w-[160px] ml-auto">
                      <Music2 className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{reel.audioTitle}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Details & Actions */}
              <div className="p-3.5 space-y-2.5">
                {reel.caption ? (
                  <p className="text-xs text-foreground/90 line-clamp-2 leading-relaxed">
                    {reel.caption}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">ক্যাপশন নেই</p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                  <span>
                    {new Date(reel.created_at).toLocaleDateString("bn-BD", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewReel(reel)}
                      className="h-7 px-2.5 text-[11px] rounded-lg gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      প্রিভিউ
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={deletingId === reel.id}
                      onClick={() => handleDeleteReel(reel.id, reel.uploaderName)}
                      className="h-7 px-2.5 text-[11px] rounded-lg gap-1 bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                    >
                      {deletingId === reel.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                      ডিলিট
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Preview Modal */}
      {previewReel && (
        <AdminReelPreviewModal
          reel={previewReel}
          onClose={() => setPreviewReel(null)}
          onDelete={() => handleDeleteReel(previewReel.id, previewReel.uploaderName)}
        />
      )}

      {/* ================== ADD NEW CLOUDINARY SERVER MODAL ================== */}
      <Dialog open={showAddServerModal} onOpenChange={setShowAddServerModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Server className="w-5 h-5 text-primary" />
              নতুন ক্লাউডিনারি সার্ভার কানেক্ট করুন
            </DialogTitle>
            <DialogDescription className="text-xs">
              ফ্রি ২৫ GB স্টোরেজ যুক্ত করতে আপনার ক্লাউডিনারি অ্যাকাউন্টের Cloud Name এবং Unsigned Upload Preset লিখুন।
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Cloud Name (ক্লাউড নাম) *
              </label>
              <Input
                placeholder="যেমন: batchday8"
                value={newCloudName}
                onChange={(e) => setNewCloudName(e.target.value.trim())}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Upload Preset (আনসাইন্ড প্রিসেট) *
              </label>
              <Input
                placeholder="যেমন: batchday8"
                value={newUploadPreset}
                onChange={(e) => setNewUploadPreset(e.target.value.trim())}
                className="text-xs"
              />
            </div>

            {/* Test Connection Button & Result Box */}
            <div className="pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestNewServer}
                disabled={isTestingNewServer || !newCloudName || !newUploadPreset}
                className="w-full text-xs h-8 gap-1.5"
              >
                {isTestingNewServer ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    সংযোগ পরীক্ষা হচ্ছে...
                  </>
                ) : (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-cyan-500" />
                    সংযোগ পরীক্ষা করুন (Test Connection)
                  </>
                )}
              </Button>

              {newServerTestResult && (
                <div
                  className={`mt-2.5 p-2.5 rounded-xl text-xs flex items-start gap-2 border ${
                    newServerTestResult.success
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                  }`}
                >
                  {newServerTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                  )}
                  <span>{newServerTestResult.message}</span>
                </div>
              )}
            </div>

            {/* Cloudinary Quick Tips */}
            <div className="p-3 rounded-xl bg-muted/30 border border-border/60 text-[11px] text-muted-foreground space-y-1">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-primary" />
                সহজ নির্দেশিকা:
              </span>
              <p>১. cloudinary.com-এ গিয়ে একটি নতুন ফ্রি অ্যাকাউন্ট খুলুন (২৫ GB ফ্রি ব্যান্ডউইথ)।</p>
              <p>২. Settings ➔ Upload ➔ <strong>Add upload preset</strong>-এ ক্লিক করুন।</p>
              <p>৩. Signing Mode অপশনটি <strong>Unsigned</strong> নির্বাচন করে সেভ করুন।</p>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAddServerModal(false);
                setNewServerTestResult(null);
              }}
              className="text-xs"
            >
              বাতিল
            </Button>
            <Button
              size="sm"
              onClick={handleSaveNewServer}
              disabled={!newCloudName || !newUploadPreset}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4"
            >
              সেভ ও পুলে যুক্ত করো
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Dedicated Admin Reel Preview Dialog Modal
 */
function AdminReelPreviewModal({
  reel,
  onClose,
  onDelete,
}: {
  reel: AdminReelItem;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
      if (audioRef.current && reel.audioPreviewUrl) {
        audioRef.current.play().catch(() => {});
      }
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm max-h-[90vh] bg-zinc-950 rounded-3xl border border-white/15 overflow-hidden flex flex-col text-white shadow-2xl">
        {/* Top Header */}
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-zinc-900/60 z-10">
          <div>
            <span className="text-xs font-bold text-white block">@{reel.uploaderName}</span>
            <span className="text-[10px] text-zinc-400 block">{reel.department}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="destructive"
              onClick={onDelete}
              className="h-7 px-2.5 rounded-full text-xs gap-1 bg-rose-600 hover:bg-rose-700"
            >
              <Trash2 className="w-3 h-3" />
              ডিলিট করো
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[380px]">
          {reel.audioPreviewUrl && (
            <audio
              ref={audioRef}
              src={reel.audioPreviewUrl}
              loop
              autoPlay
              muted={isMuted}
            />
          )}

          <video
            ref={videoRef}
            src={reel.url}
            autoPlay
            loop
            playsInline
            muted={isMuted}
            style={{ filter: getFilterCss(reel.filterId) }}
            className="w-full h-full object-cover cursor-pointer"
            onClick={togglePlay}
          />

          {/* Center Play/Pause Indicator */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/40"
            >
              <div className="w-14 h-14 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white">
                <Play className="w-6 h-6 ml-0.5 fill-white" />
              </div>
            </button>
          )}

          {/* Mute Toggle Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
        </div>

        {/* Footer Info */}
        <div className="p-3.5 bg-zinc-900/80 border-t border-white/10 text-xs space-y-2">
          {reel.caption && (
            <p className="text-zinc-200 line-clamp-2">{reel.caption}</p>
          )}
          {reel.audioTitle && (
            <div className="flex items-center gap-1.5 text-[11px] text-pink-400">
              <Music2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{reel.audioTitle} • {reel.audioArtist}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
