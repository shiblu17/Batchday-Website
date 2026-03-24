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
    <div className={`flex items-center gap-3 md:gap-4 rounded-xl bg-card p-3 md:p-4 shadow-card border-l-4 ${
      medal?.border || "border-l-border"
    } hover:shadow-card-hover transition-shadow`}>
      <div className="flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-lg bg-surface">
        {medal ? (
          <span className="text-lg md:text-xl">{medal.emoji}</span>
        ) : (
          <span className="font-display font-bold text-xs text-muted-foreground">#{rank}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-xs md:text-sm truncate">{name}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
              initial={{ width: 0 }}
              whileInView={{ width: `${pct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            />
          </div>
          <span className="text-[11px] font-bold text-primary tabular-nums shrink-0">{pct}%</span>
        </div>
        <p className="text-[10px] md:text-[11px] text-muted-foreground mt-0.5">{registered}/{total} জন</p>
      </div>
    </div>
  );
}
