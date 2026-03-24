import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_DEPARTMENTS = [
  { id: 'd1', name: 'Computer Science', total: 60, registered: 45 },
  { id: 'd2', name: 'Economics', total: 80, registered: 40 },
  { id: 'd3', name: 'Physics', total: 50, registered: 48 },
  { id: 'd4', name: 'Pharmacy', total: 45, registered: 40 },
  { id: 'd5', name: 'English', total: 70, registered: 30 },
].map(d => ({ ...d, ratio: (d.registered / d.total) * 100 })).sort((a,b) => b.ratio - a.ratio);

const MOCK_HALLS = [
  { id: 'h1', name: 'Mir Mosharraf Hossain Hall', registered: 120 },
  { id: 'h2', name: 'Al-Beruni Hall', registered: 95 },
  { id: 'h3', name: 'Bangabandhu Hall', registered: 150 },
  { id: 'h4', name: 'Fazilatunnesa Hall', registered: 140 },
].sort((a,b) => b.registered - a.registered);

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<'departments'|'halls'>('departments');

  return (
    <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(128,0,0,0.1)] p-8 md:p-12 border border-white relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="flex justify-center space-x-2 md:space-x-6 mb-12 relative z-10 w-full max-w-sm mx-auto bg-gray-100/80 p-1.5 rounded-full">
        <button
          onClick={() => setActiveTab('departments')}
          className={`flex-1 py-3 px-6 rounded-full font-bold transition-all duration-300 ${
            activeTab === 'departments' 
              ? 'bg-primary text-secondary shadow-xl shadow-primary/20 scale-100'
              : 'bg-transparent text-gray-500 hover:text-primary'
          }`}
        >
          Top Departments
        </button>
        <button
          onClick={() => setActiveTab('halls')}
          className={`flex-1 py-3 px-6 rounded-full font-bold transition-all duration-300 ${
            activeTab === 'halls' 
              ? 'bg-primary text-secondary shadow-xl shadow-primary/20 scale-100'
              : 'bg-transparent text-gray-500 hover:text-primary'
          }`}
        >
          Top Halls
        </button>
      </div>

      <div className="space-y-8 relative z-10 min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === 'departments' && (
            <motion.div 
              key="departments"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              {MOCK_DEPARTMENTS.map((dept, index) => (
                <div key={dept.id} className="relative group">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-xl font-bold text-slate-800 flex items-center">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm mr-3">
                        {index + 1}
                      </span>
                      {dept.name}
                    </span>
                    <div className="text-right">
                      <span className="block text-xl font-black text-primary">
                        {dept.ratio.toFixed(1)}%
                      </span>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {dept.registered} / {dept.total} Registers
                      </span>
                    </div>
                  </div>
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner flex items-center">
                    <motion.div 
                      style={{ width: 0 }}
                      animate={{ width: `${dept.ratio}%` }}
                      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: index * 0.1 }}
                      className="h-full bg-gradient-to-r from-primary to-[#b30000] rounded-full relative"
                    >
                       <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] opacity-50" />
                    </motion.div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'halls' && (
            <motion.div 
              key="halls"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              {MOCK_HALLS.map((hall, index) => {
                const maxReg = MOCK_HALLS[0].registered;
                const ratio = (hall.registered / maxReg) * 100;
                return (
                  <div key={hall.id} className="relative group">
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-xl font-bold text-slate-800 flex items-center">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary/20 text-yellow-700 text-sm mr-3">
                          {index + 1}
                        </span>
                        {hall.name}
                      </span>
                      <div className="text-right">
                        <span className="block text-xl font-black text-secondary drop-shadow-sm">
                          {hall.registered}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Registered
                        </span>
                      </div>
                    </div>
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner flex items-center">
                      <motion.div 
                        style={{ width: 0 }}
                        animate={{ width: `${ratio}%` }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: index * 0.1 }}
                        className="h-full bg-gradient-to-r from-yellow-400 to-secondary rounded-full relative"
                      >
                         <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] opacity-50" />
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
