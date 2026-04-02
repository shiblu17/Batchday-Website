import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Gamepad2, BrainCircuit, XSquare, Play, Footprints, Dices } from "lucide-react";

const games = [
  {
    path: "/game/flappy",
    title: "Flappy Student",
    description: "বাস বাঁচিয়ে বাধা পার হও!",
    icon: Gamepad2,
    color: "bg-sky-100 text-sky-600",
    gradient: "from-sky-500 to-blue-600",
  },
  {
    path: "/game/memory",
    title: "JU মেমোরি ম্যাচ",
    description: "কার্ড উল্টিয়ে ছবি মেলাও",
    icon: BrainCircuit,
    color: "bg-fuchsia-100 text-fuchsia-600",
    gradient: "from-fuchsia-500 to-purple-600",
  },
  {
    path: "/game/tictactoe",
    title: "টিক-ট্যাক-টো",
    description: "বন্ধুর সাথে বা এআই-এর সাথে খেলো",
    icon: XSquare,
    color: "bg-emerald-100 text-emerald-600",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    path: "/game/dinorun",
    title: "জাবি রানার",
    description: "ক্যাম্পাসের বাধা পার হও!",
    icon: Footprints,
    color: "bg-orange-100 text-orange-600",
    gradient: "from-orange-500 to-red-600",
  },
];

export default function GameHub() {
  return (
    <div className="container max-w-4xl py-12 px-4 pb-24 md:pb-12 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Gamepad2 className="h-10 w-10 text-primary" />
        </div>
        <h1 className="font-display text-4xl font-extrabold mb-4">গেম জোন 🎮</h1>
        <p className="text-muted-foreground text-lg mb-12 max-w-xl mx-auto">
          реজিস্ট্রেশনের ফাকে একটু বিরতি নাও! জাবি ৫২ ব্যাচ ডে-র এই স্পেশাল গেমগুলো খেলে তোমার বেস্ট স্কোর সেট করো।
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 text-left">
        {games.map((game, i) => (
          <motion.div
            key={game.path}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to={game.path}
              className={`block rounded-3xl overflow-hidden shadow-card border border-border bg-card group relative h-full`}
            >
              <div className={`h-32 bg-gradient-to-br ${game.gradient} p-6 relative overflow-hidden`}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20">
                  <game.icon className="w-32 h-32 text-white" />
                </div>
              </div>
              
              <div className="p-6 relative">
                <div className={`absolute -top-10 right-6 w-14 h-14 rounded-2xl ${game.color} flex items-center justify-center shadow-lg`}>
                  <game.icon className="w-7 h-7" />
                </div>
                
                <h2 className="font-display text-xl font-bold mb-2">{game.title}</h2>
                <p className="text-sm text-muted-foreground mb-6">{game.description}</p>
                
                <div className="flex items-center text-sm font-bold opacity-80 group-hover:opacity-100 transition-opacity">
                  <span className={`bg-clip-text text-transparent bg-gradient-to-r ${game.gradient}`}>
                    খেলতে শুরু করো
                  </span>
                  <Play className="w-4 h-4 ml-2 fill-current" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
