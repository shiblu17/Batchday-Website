import { motion } from "framer-motion";

const YOUTUBE_VIDEO_ID = "e_5anFAQIps";

export default function Sponsors() {
  return (
    <>
      {/* Mobile Design: Narrow Edge-to-edge Banner */}
      <div className="md:hidden w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full bg-black border-y border-border/30 shadow-sm relative overflow-hidden h-20"
        >
          {/* aspect-video ensures the iframe itself is perfectly 16:9 so YouTube never adds black bars */}
          <div className="absolute top-1/2 left-1/2 w-[200vw] sm:w-[150vw] aspect-video -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <iframe
              src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${YOUTUBE_VIDEO_ID}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
              allow="autoplay; encrypted-media"
              className="w-full h-full border-0"
              style={{ pointerEvents: 'none' }}
            />
          </div>
        </motion.div>
      </div>

      {/* PC Design: Boxed Narrow Banner with Border & Rounded Corners (No Text) */}
      <div className="hidden md:block w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-[1.5rem] overflow-hidden bg-white/40 border border-white/60 shadow-md backdrop-blur-md relative flex justify-center items-center p-2 bg-gradient-to-br from-rose-50/50 to-fuchsia-50/50 h-28 lg:h-32 w-full"
        >
          <div className="w-full h-full rounded-[1.2rem] overflow-hidden relative shadow-inner pointer-events-none bg-black">
            {/* aspect-video ensures 16:9 ratio, preventing YouTube from adding side black bars */}
            <div className="absolute top-1/2 left-1/2 w-[150vw] lg:w-[120vw] xl:w-[100vw] aspect-video -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <iframe
                src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${YOUTUBE_VIDEO_ID}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
                allow="autoplay; encrypted-media"
                className="w-full h-full border-0 scale-[1.02]"
                style={{ pointerEvents: 'none' }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
