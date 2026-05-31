import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, GraduationCap, UserCircle2 } from "lucide-react";
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
    setSelectedHall("");
    setSelectedName("");
    setSearchTerm("");
  }, [selectedDept]);

  useEffect(() => {
    setSelectedName("");
    setSearchTerm("");
  }, [selectedHall]);

  const handleStart = () => {
    if (activeTab === 'batch52') {
      if (selectedName) {
        onStart(`${selectedName} ✅`); // Add verified badge
      }
    } else {
      if (nickname.trim()) {
        onStart(nickname.trim().substring(0, 20));
      }
    }
  };

  return (
    <div 
      className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border-2 border-border"
      >
        <div className="bg-primary/10 p-6 pb-4 text-center border-b border-border/50">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-3 shadow-lg">
            <Gamepad2 className="h-8 w-8" />
          </div>
          <h2 className="font-display text-2xl font-black text-foreground">{gameTitle}</h2>
          <p className="text-sm text-muted-foreground mt-1">খেলতে তোমার পরিচয় দাও</p>
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="flex p-1 bg-muted rounded-xl mb-6">
            <button
              onClick={() => setActiveTab('batch52')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
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
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'guest' 
                  ? 'bg-background text-primary shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserCircle2 className="w-4 h-4" />
              গেস্ট
            </button>
          </div>

          <div className="min-h-[200px]">
            <AnimatePresence mode="wait">
              {activeTab === 'batch52' ? (
                <motion.div
                  key="batch52"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 ml-1">ডিপার্টমেন্ট</label>
                    <select 
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="w-full bg-background text-foreground border border-input rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all appearance-none"
                    >
                      <option value="" className="text-foreground bg-background">সিলেক্ট করো...</option>
                      {departments.map(d => <option key={d} value={d} className="text-foreground bg-background">{d}</option>)}
                    </select>
                  </div>

                  {selectedDept && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                      <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 ml-1">হল</label>
                      <select 
                        value={selectedHall}
                        onChange={(e) => setSelectedHall(e.target.value)}
                        className="w-full bg-background text-foreground border border-input rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all appearance-none"
                      >
                        <option value="" className="text-foreground bg-background">সিলেক্ট করো...</option>
                        {halls.map(h => <option key={h} value={h} className="text-foreground bg-background">{h}</option>)}
                      </select>
                    </motion.div>
                  )}

                  {selectedHall && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                      <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 ml-1">তোমার নাম</label>
                      <div className="relative">
                        <input 
                          type="text"
                          placeholder="নাম সার্চ করো..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full bg-background text-foreground border border-input rounded-t-xl px-4 py-2.5 text-sm outline-none border-b-0"
                        />
                        <div className="max-h-32 overflow-y-auto border border-input rounded-b-xl bg-background divide-y divide-border">
                          {filteredNames.length === 0 ? (
                            <div className="p-3 text-sm text-center text-muted-foreground">কোনো নাম পাওয়া যায়নি</div>
                          ) : (
                            filteredNames.map(name => (
                              <button
                                key={name}
                                onClick={() => {
                                  setSelectedName(name);
                                  setSearchTerm(name);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-primary/10 transition-colors ${selectedName === name ? 'bg-primary/20 font-bold text-primary' : 'text-foreground'}`}
                              >
                                {name}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="guest"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4 pt-4"
                >
                  <div className="text-center mb-6">
                    <p className="text-sm text-muted-foreground">তুমি ব্যাচের বাইরের হলে যেকোনো একটি নিকনেম দিয়ে খেলতে পারো।</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 ml-1">নিকনেম</label>
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

          <div className="mt-6">
            <button 
               onClick={handleStart}
               disabled={(activeTab === 'batch52' && !selectedName) || (activeTab === 'guest' && !nickname.trim())}
               className="w-full px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-display font-bold text-lg shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              খেলা শুরু করো 🚀
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
