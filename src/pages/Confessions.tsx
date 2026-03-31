import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquarePlus, MessageCircleHeart, ArrowLeft, Send, Loader2, Sparkles, Music, Search, X as CloseIcon, Play, Pause, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Confession {
  id: string;
  content: string;
  author_nickname: string;
  to_name?: string;
  song_info?: {
    name: string;
    artist: string;
    artwork: string;
    previewUrl?: string;
  };
  created_at: string;
  reactions?: {
    love?: number;
    haha?: number;
  };
}

export default function Confessions() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // form state
  const [content, setContent] = useState("");
  const [nickname, setNickname] = useState("");
  const [toName, setToName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // music playback state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  
  // local reaction tracking
  const [reactedConfessions, setReactedConfessions] = useState<Record<string, 'love' | 'haha'>>(() => {
    try {
      return JSON.parse(localStorage.getItem('ju52_reactions') || '{}');
    } catch {
      return {};
    }
  });

  // cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, [audio]);

  // music search state
  const [songSearch, setSongSearch] = useState("");
  const [songResults, setSongResults] = useState<any[]>([]);
  const [selectedSong, setSelectedSong] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (songSearch.trim().length > 2) {
        searchSongs(songSearch);
      } else {
        setSongResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [songSearch]);

  const searchSongs = async (term: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&limit=5&media=music`);
      const data = await response.json();
      setSongResults(data.results.map((r: any) => ({
        name: r.trackName,
        artist: r.artistName,
        artwork: r.artworkUrl100,
        previewUrl: r.previewUrl
      })));
    } catch (err) {
      console.error("Music search failed", err);
    }
    setIsSearching(false);
  };

  useEffect(() => {
    fetchConfessions();
    
    // Subscribe to new approved confessions and live reaction updates
    const channel = supabase
      .channel("public:confessions")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "confessions", filter: "is_approved=eq.true" }, (payload) => {
         // Add new confession to the top of the list instantly
         setConfessions(prev => {
           // Prevent duplicates
           if (prev.some(c => c.id === payload.new.id)) return prev;
           return [payload.new as Confession, ...prev];
         });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "confessions", filter: "is_approved=eq.true" }, (payload) => {
         // Hot-swap only the updated confession (reactions) seamlessly without reloading everything
         setConfessions(prev => prev.map(c => 
           c.id === payload.new.id ? payload.new as Confession : c
         ));
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchConfessions = async () => {
    setLoading(true);
    const { data, error } = await (supabase
      .from("confessions") as any)
      .select("*")
      .eq("is_approved", true)
      .order("created_at", { ascending: false });
      
    if (data && !error) setConfessions(data as unknown as Confession[]);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setSubmitting(true);
    const { error } = await (supabase.from("confessions") as any).insert({
      content: content.trim(),
      author_nickname: nickname.trim() || "অজ্ঞাত",
      to_name: toName.trim(),
      song_info: selectedSong
    });
    
    setSubmitting(false);
    if (error) {
      toast.error(`পাঠাতে সমস্যা হয়েছে! Error: ${error.message}`);
      console.error(error);
    } else {
      toast.success("সফলভাবে পাঠানো হয়েছে! অ্যাডমিন অ্যাপ্রুভ করলে এখানে দেখা যাবে।");
      setOpen(false);
      setContent("");
      setNickname("");
      setToName("");
      setSelectedSong(null);
      setSongSearch("");
    }
  };

  const handleReaction = async (id: string, type: 'love' | 'haha') => {
    if (reactedConfessions[id]) return; // Prevent multiple reactions
    
    // Save locally
    const params = { ...reactedConfessions, [id]: type };
    setReactedConfessions(params);
    localStorage.setItem('ju52_reactions', JSON.stringify(params));

    // Optimistic UI update
    setConfessions(prev => prev.map(c => {
      if (c.id === id) {
        const reactions = (c as any).reactions || {};
        return { ...c, reactions: { ...reactions, [type]: (reactions[type] || 0) + 1 } };
      }
      return c;
    }));

    // Actual update - in a real app, we would use a database function (RPC) to increment safely
    // Since I don't have the RPC yet, I'll fetch and update (race-condition prone but works for demo)
    const { data: current } = await (supabase.from("confessions") as any).select("reactions").eq("id", id).single();
    const reactions = current?.reactions || {};
    reactions[type] = (reactions[type] || 0) + 1;
    
    await (supabase.from("confessions") as any).update({ reactions }).eq("id", id);
  };
  
  const togglePlay = (confessionId: string, url: string) => {
    if (playingId === confessionId) {
      audio?.pause();
      setPlayingId(null);
    } else {
      // stop current
      if (audio) {
        audio.pause();
      }
      
      const newAudio = new Audio(url);
      newAudio.play();
      setAudio(newAudio);
      setPlayingId(confessionId);
      
      newAudio.onended = () => {
        setPlayingId(null);
      };
    }
  };
  const filteredConfessions = confessions.filter((c) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return c.to_name?.toLowerCase().includes(query) || c.author_nickname?.toLowerCase().includes(query) || c.content?.toLowerCase().includes(query);
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-slate-50 to-rose-50/30">
      <div className="container max-w-6xl py-8 min-h-[90vh] pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 px-2">
        <div>
          <h1 className="font-display text-4xl mt-4 md:mt-0 font-extrabold flex items-center gap-3">
            <MessageCircleHeart className="w-10 h-10 text-rose-500" />
            কনফেশন <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-fuchsia-600">ওয়াল</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-md text-sm md:text-base">
            মনের না বলা কথা, ব্যাচের মজার স্মৃতি বা সিক্রেট শেয়ার করো সবার সাথে! (তোমার পরিচয় সম্পূর্ণ গোপন থাকবে)
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full md:w-auto items-stretch sm:items-center gap-3 shrink-0">
          <div className="relative w-full sm:w-[220px] md:w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="কার উদ্দেশ্যে? নাম খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 sm:py-2.5 bg-white/80 backdrop-blur-sm border border-rose-100 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/50 shadow-sm transition-shadow"
            />
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold hover:shadow-lg hover:scale-105 active:scale-95 transition-all shadow-md shrink-0">
                <MessageSquarePlus className="w-5 h-5" />
                নতুন কনফেশন
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card rounded-3xl p-6 w-[95vw]">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl font-bold flex items-center justify-center gap-2 text-rose-600 mb-4">
                <Sparkles className="w-6 h-6" />
                মনের কথা শেয়ার করো
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="তোমার কনফেশন বা মজার স্মৃতি এখানে লেখো..."
                  className="w-full h-32 p-4 rounded-xl border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/50 text-foreground"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  value={toName}
                  onChange={(e) => setToName(e.target.value)}
                  placeholder="কার উদ্দেশ্যে? (যেমন: মীরা, ক-৫২)"
                  className="w-full p-4 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-rose-500/50 text-foreground"
                  maxLength={30}
                />
              </div>
              <div className="relative">
                {!selectedSong ? (
                  <>
                    <div className="relative">
                      <Music className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={songSearch}
                        onChange={(e) => setSongSearch(e.target.value)}
                        placeholder="একটি গান খুঁজে ব্যাকগ্রাউন্ডে দাও..."
                        className="w-full pl-10 p-4 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-rose-500/50 text-sm"
                      />
                      {isSearching && <Loader2 className="absolute right-3 top-4 h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                    {songResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                        {songResults.map((s, i) => (
                          <div 
                            key={i} 
                            onClick={() => setSelectedSong(s)}
                            className="p-3 flex items-center gap-3 hover:bg-muted cursor-pointer transition-colors border-b border-border last:border-0"
                          >
                            <img src={s.artwork} className="w-10 h-10 rounded-md" alt="" />
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold truncate">{s.name}</span>
                              <span className="text-[10px] text-muted-foreground truncate">{s.artist}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-3 bg-muted rounded-xl flex items-center justify-between gap-3 border border-border">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={selectedSong.artwork} className="w-12 h-12 rounded-lg shadow-sm" alt="" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold truncate">{selectedSong.name}</span>
                        <span className="text-[11px] text-muted-foreground truncate">{selectedSong.artist}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedSong(null)}
                      className="p-1.5 hover:bg-card rounded-full text-muted-foreground transition-colors"
                    >
                      <CloseIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="তোমার নাম/নিকনেম (ফাঁকা রাখলে 'অজ্ঞাত' দেখাবে)"
                  className="w-full p-4 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-rose-500/50 text-foreground"
                  maxLength={30}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                *পোস্টটি অ্যাডমিন প্যানেল থেকে ভেরিফাই হওয়ার পর পাবলিক ওয়ালে দেখা যাবে।
              </p>
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {submitting ? "পাঠানো হচ্ছে..." : "পোস্ট করে দাও"}
              </button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
        </div>
      ) : confessions.length === 0 ? (
        <div className="text-center py-24 bg-card/60 backdrop-blur rounded-[2.5rem] border border-border mt-8 mx-2 shadow-sm">
          <MessageCircleHeart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-display text-2xl font-bold text-foreground mb-2">এখনো কোনো কনফেশন আসেনি!</h3>
          <p className="text-muted-foreground text-sm">তুমিই প্রথম মনের কথা শেয়ার করো।</p>
        </div>
      ) : filteredConfessions.length === 0 ? (
        <div className="text-center py-24 bg-white/50 backdrop-blur-sm rounded-[2.5rem] mt-8 mx-2 shadow-sm">
          <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4 -scale-x-100" />
          <h3 className="font-display text-xl font-bold text-foreground mb-2">কোনো ফলাফল পাওয়া যায়নি</h3>
          <p className="text-muted-foreground text-sm">অন্য কোনো নাম দিয়ে চেষ্টা করো।</p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8 px-2 mt-12 pb-28">
          <AnimatePresence>
            {filteredConfessions.map((confession) => (
              <motion.div
                key={confession.id}
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="break-inside-avoid bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-white/50 shadow-xl overflow-hidden group flex flex-col transition-all duration-300"
              >
                {/* Card Header - To section */}
                <div className="p-6 pb-0 flex items-start justify-between">
                  {confession.to_name && (
                    <div className="px-5 py-1.5 bg-blue-100/80 text-blue-600 rounded-full text-[13px] font-bold tracking-tight">
                      To: {confession.to_name}
                    </div>
                  )}
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-100/50 px-3 py-1 rounded-full uppercase tracking-widest">
                   {new Date(confession.created_at).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <div className="p-8 pt-4 flex-1">
                  <p className="font-handwriting text-lg md:text-xl text-slate-800 leading-relaxed font-semibold">
                    {confession.content}
                  </p>
                </div>

                {/* Card Footer - Music info & Reactions */}
                <div className="bg-slate-50/80 border-t border-slate-100 p-6">
                  {confession.song_info && (
                    <div className="mb-4 p-3 bg-white/50 border border-slate-100 rounded-2xl flex items-center gap-3">
                      <div className="relative group/play flex-shrink-0">
                        <img src={confession.song_info.artwork} className="w-12 h-12 rounded-lg object-cover" alt="" />
                        <button 
                          onClick={() => togglePlay(confession.id, confession.song_info!.previewUrl!)}
                          className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover/play:opacity-100 transition-opacity rounded-lg"
                        >
                          {playingId === confession.id ? (
                            <Pause className="w-5 h-5 text-white fill-current" />
                          ) : (
                            <Play className="w-5 h-5 text-white fill-current translate-x-0.5" />
                          )}
                        </button>
                        {playingId === confession.id && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center animate-bounce">
                             <Volume2 className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-700 truncate">{confession.song_info.name}</span>
                          {playingId === confession.id && (
                            <div className="flex gap-0.5 items-end h-3">
                              <div className="w-0.5 bg-rose-500 animate-[music-bar_0.8s_ease-in-out_infinite]" />
                              <div className="w-0.5 bg-rose-500 animate-[music-bar_1s_ease-in-out_infinite]" />
                              <div className="w-0.5 bg-rose-500 animate-[music-bar_1.2s_ease-in-out_infinite]" />
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium truncate">{confession.song_info.artist}</span>
                      </div>
                      <button 
                         onClick={() => togglePlay(confession.id, confession.song_info!.previewUrl!)}
                         className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${playingId === confession.id ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                      >
                         {playingId === confession.id ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 translate-x-0.5" />}
                      </button>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">FROM</span>
                      <span className="text-sm font-bold text-slate-700 truncate max-w-[120px]">
                        {confession.author_nickname}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        disabled={!!reactedConfessions[confession.id]}
                        onClick={() => handleReaction(confession.id, 'love')}
                        className={`w-10 h-10 rounded-full shadow-sm flex items-center justify-center text-rose-500 transition-all border border-slate-100 ${reactedConfessions[confession.id] === 'love' ? 'bg-rose-50 border-rose-200' : 'bg-white hover:scale-110 active:scale-90'} ${reactedConfessions[confession.id] && reactedConfessions[confession.id] !== 'love' ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                      >
                        ❤️ <span className="text-[10px] ml-0.5 font-bold">{(confession as any).reactions?.love || 0}</span>
                      </button>
                      <button 
                         disabled={!!reactedConfessions[confession.id]}
                         onClick={() => handleReaction(confession.id, 'haha')}
                         className={`w-10 h-10 rounded-full shadow-sm flex items-center justify-center text-yellow-600 transition-all border border-slate-100 ${reactedConfessions[confession.id] === 'haha' ? 'bg-yellow-50 border-yellow-200' : 'bg-white hover:scale-110 active:scale-90'} ${reactedConfessions[confession.id] && reactedConfessions[confession.id] !== 'haha' ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                      >
                        😂 <span className="text-[10px] ml-0.5 font-bold">{(confession as any).reactions?.haha || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      </div>
    </div>
  );
}
