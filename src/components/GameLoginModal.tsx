import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, GraduationCap, UserCircle2, CheckCircle2 } from "lucide-react";
import votersData from "@/data/voters.json";

interface Voter {
  name: string;
  dept: string;
  hall: string;
}

interface GameLoginModalProps {
  gameTitle: string;
  onStart: (nickname: string) => void;
}

export default function GameLoginModal({ gameTitle, onStart }: GameLoginModalProps) {
  const [activeTab, setActiveTab] = useState<'batch52' | 'guest'>('batch52');
  const [nickname, setNickname] = useState("");

  // Batch 52 Selections
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedHall, setSelectedHall] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  const voters = votersData as Voter[];

  // Auto-load saved nickname if any
  useEffect(() => {
    const saved = localStorage.getItem("ju_game_nickname_v2");
    if (saved) {
      if (saved.endsWith("✅")) {
        const cleanName = saved.replace("✅", "").trim();
        const matched = voters.find(v => v.name === cleanName);
        if (matched) {
          setSelectedDept(matched.dept);
          setSelectedHall(matched.hall);
          setSelectedName(matched.name);
          setSearchTerm(matched.name);
        }
      } else {
        setNickname(saved);
        setActiveTab("guest");
      }
    }
  }, [voters]);

  // Unique Departments
  const departments = useMemo(() => {
    const depts = new Set<string>();
    voters.forEach(v => depts.add(v.dept));
    return Array.from(depts).sort();
  }, [voters]);

  // Unique Halls based on Selected Department
  const halls = useMemo(() => {
    if (!selectedDept) return [];
    const h = new Set<string>();
    voters.forEach(v => {
      if (v.dept === selectedDept) h.add(v.hall);
    });
    return Array.from(h).sort();
  }, [selectedDept, voters]);

  // Names based on Selected Department + Hall
  const availableNames = useMemo(() => {
    if (!selectedDept || !selectedHall) return [];
    return voters
      .filter(v => v.dept === selectedDept && v.hall === selectedHall)
      .map(v => v.name)
      .sort();
  }, [selectedDept, selectedHall, voters]);

  // Filtered names based on search term
  const filteredNames = useMemo(() => {
    if (!searchTerm) return availableNames;
    return availableNames.filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [availableNames, searchTerm]);

  // Reset downstream selections when upstream changes
  useEffect(() => {
    if (!selectedDept) {
      setSelectedHall("");
      setSelectedName("");
      setSearchTerm("");
    }
  }, [selectedDept]);

  useEffect(() => {
    if (!selectedHall) {
      setSelectedName("");
      setSearchTerm("");
    }
  }, [selectedHall]);

  const handleStart = () => {
    if (activeTab === 'batch52') {
      if (selectedName) {
        onStart(`${selectedName} ✅`);
      }
    } else {
      if (nickname.trim()) {
        onStart(nickname.trim().substring(0, 20));
      }
    }
  };

  const isReadyToStart = (activeTab === 'batch52' && !!selectedName) || (activeTab === 'guest' && !!nickname.trim());

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-[9999] p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-card w-full max-w-md my-auto max-h-[92dvh] flex flex-col rounded-3xl shadow-2xl overflow-hidden border-2 border-border text-foreground"
      >
        {/* Header */}
        <div className="bg-primary/10 p-4 sm:p-5 text-center border-b border-border/50 shrink-0">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-2 shadow-lg">
            <Gamepad2 className="h-6 w-6" />
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-black text-foreground">{gameTitle}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">খেলতে তোমার পরিচয় নিশ্চিত করো</p>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Tabs */}
          <div className="flex p-1 bg-muted rounded-xl">
            <button
              onClick={() => setActiveTab('batch52')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'batch52' 
                  ? 'bg-background text-primary shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              ৫২ ব্যাচ
            </button>
            <button
              onClick={() => setActiveTab('guest')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'guest' 
                  ? 'bg-background text-primary shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserCircle2 className="w-4 h-4" />
              গেস্ট
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'batch52' ? (
              <motion.div
                key="batch52"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 ml-1">ডিপার্টমেন্ট</label>
                  <select 
                    value={selectedDept}
                    onChange={(e) => {
                      setSelectedDept(e.target.value);
                      setSelectedHall("");
                      setSelectedName("");
                      setSearchTerm("");
                    }}
                    className="w-full bg-background text-foreground border border-input rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  >
                    <option value="">ডিপার্টমেন্ট সিলেক্ট করো...</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {selectedDept && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 ml-1">হল</label>
                    <select 
                      value={selectedHall}
                      onChange={(e) => {
                        setSelectedHall(e.target.value);
                        setSelectedName("");
                        setSearchTerm("");
                      }}
                      className="w-full bg-background text-foreground border border-input rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    >
                      <option value="">হল সিলেক্ট করো...</option>
                      {halls.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </motion.div>
                )}

                {selectedHall && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 ml-1">তোমার নাম</label>
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="নাম সার্চ বা সিলেক্ট করো..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-background text-foreground border border-input rounded-t-xl px-3.5 py-2 text-sm outline-none border-b-0"
                      />
                      <div className="max-h-28 overflow-y-auto border border-input rounded-b-xl bg-background divide-y divide-border">
                        {filteredNames.length === 0 ? (
                          <div className="p-2.5 text-xs text-center text-muted-foreground">কোনো নাম পাওয়া যায়নি</div>
                        ) : (
                          filteredNames.map(name => (
                            <button
                              key={name}
                              onClick={() => {
                                setSelectedName(name);
                                setSearchTerm(name);
                              }}
                              className={`w-full text-left px-3.5 py-2 text-sm hover:bg-primary/10 transition-colors flex items-center justify-between ${
                                selectedName === name ? 'bg-primary/20 font-bold text-primary' : 'text-foreground'
                              }`}
                            >
                              <span>{name}</span>
                              {selectedName === name && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {selectedName && (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-600 text-xs font-bold"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>সিলেক্টেড: {selectedName} ✅</span>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="guest"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-3 pt-2"
              >
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">ব্যাচের বাইরের কেউ হলে একটি প্রিয় নিকনেম দিয়ে শুরু করো।</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 ml-1">নিকনেম</label>
                  <input 
                    type="text" 
                    placeholder="যেমন: গেমিং কিং" 
                    maxLength={20}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full bg-background border border-input rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-center font-bold"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pinned Action Footer - Guaranteed Visible Always! */}
        <div className="p-4 pt-3 bg-card border-t border-border/50 shrink-0">
          <button 
            onClick={handleStart}
            disabled={!isReadyToStart}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white font-display font-bold text-base sm:text-lg shadow-lg shadow-primary/25 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            খেলা শুরু করো 🚀
          </button>
        </div>
      </motion.div>
    </div>
  );
}
