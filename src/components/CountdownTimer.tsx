import { motion, AnimatePresence } from "framer-motion";

interface CountdownProps {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const AnimatedNumber = ({ value, label }: { value: number, label: string }) => {
  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <div className="relative overflow-hidden w-16 h-20 sm:w-20 sm:h-24 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-xl border border-white/20">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: -20, opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center font-display text-4xl sm:text-5xl font-black text-white tabular-nums tracking-tighter"
          >
            {String(value).padStart(2, "0")}
          </motion.span>
        </AnimatePresence>
        
        {/* Glossy overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-2xl" />
      </div>
      <span className="text-xs sm:text-sm font-bold text-primary-foreground/70 uppercase tracking-widest">{label}</span>
    </div>
  );
};

export const CountdownTimer = ({ days, hours, minutes, seconds }: CountdownProps) => {
  return (
    <div className="flex justify-center gap-3 sm:gap-6 pt-6 pb-2">
      <AnimatedNumber value={days} label="দিন" />
      <span className="text-3xl text-white/30 font-bold self-start mt-4 sm:mt-6 hidden sm:block">:</span>
      <AnimatedNumber value={hours} label="ঘণ্টা" />
      <span className="text-3xl text-white/30 font-bold self-start mt-4 sm:mt-6 hidden sm:block">:</span>
      <AnimatedNumber value={minutes} label="মিনিট" />
      <span className="text-3xl text-white/30 font-bold self-start mt-4 sm:mt-6 hidden sm:block">:</span>
      <AnimatedNumber value={seconds} label="সেকেন্ড" />
    </div>
  );
};
