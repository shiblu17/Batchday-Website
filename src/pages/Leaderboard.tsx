import { motion } from "framer-motion";
import Leaderboard from "@/components/Leaderboard";

export default function LeaderboardPage() {
  return (
    <div className="container py-12 md:py-20 px-4 min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent inline-block">
            🏆 লিডারবোর্ড
          </h1>
          <p className="text-muted-foreground text-lg">কোন হল বা ডিপার্টমেন্ট এগিয়ে আছে দেখো!</p>
        </div>

        <Leaderboard />
      </motion.div>
    </div>
  );
}
