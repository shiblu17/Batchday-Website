import { motion } from "framer-motion";

interface Props {
  rank: number;
  name: string;
  total: number;
  registered: number;
}

const medals: Record<number, { emoji: string; border: string }> = {
  1: { emoji: "🥇", border: "border-l-accent" },
  2: { emoji: "🥈", border: "border-l-muted-foreground" },
  3: { emoji: "🥉", border: "border-l-accent/60" },
};

export default function LeaderboardCard({ rank, name, total, registered }: Props) {
  const pct = Math.round((registered / total) * 100);
  const medal = medals[rank];

  return (
    <div className={`relative flex flex-col gap-2 rounded-2xl bg-white/50 p-5 shadow-sm border-l-[6px] ${
      medal?.border || "border-l-gray-200"
    } hover:shadow-md transition-all duration-300 group`}>
      
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 shadow-inner group-hover:scale-110 transition-transform">
          {medal ? (
            <span className="text-2xl">{medal.emoji}</span>
          ) : (
            <span className="font-display font-bold text-sm text-gray-400">#{rank}</span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-lg md:text-xl text-slate-800 truncate">
            {name}
          </h3>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-1">
        <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden shadow-inner">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent relative"
            initial={{ width: 0 }}
            whileInView={{ width: `${pct}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem]" />
          </motion.div>
        </div>
        <span className="text-base font-black text-primary tabular-nums shrink-0">{pct}%</span>
      </div>
    </div>
  );
}
