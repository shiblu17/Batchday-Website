import { motion } from "framer-motion";
import { useSiteSettings } from "@/hooks/useSiteSettings";

function getYouTubeVideoId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export default function Sponsors({ 
  type = "confession",
  mobileAspect = "aspect-[21/9]",
  wrapperClass = ""
}: { 
  type?: "confession" | "leaderboard" | "status" | "gallery",
  mobileAspect?: string,
  wrapperClass?: string
}) {
  const { data: settings } = useSiteSettings();
  
  // Fallback to default if settings not loaded or empty
  const defaultUrl = "https://youtu.be/e_5anFAQIps";
  const videoUrl = type === "gallery"
    ? (settings?.sponsor_video_url_4 || defaultUrl)
    : type === "status"
      ? (settings?.sponsor_video_url_3 || defaultUrl)
      : type === "leaderboard" 
        ? (settings?.sponsor_video_url_2 || defaultUrl) 
        : (settings?.sponsor_video_url || defaultUrl);
    
  const ytId = getYouTubeVideoId(videoUrl);

  return (
    <div className={wrapperClass}>
      {/* Mobile Design: Boxed Narrow Banner with Border & Rounded Corners */}
      <div className={`md:hidden ${!wrapperClass ? "mx-4 sm:mx-8" : ""}`}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className={`w-full ${mobileAspect} rounded-2xl overflow-hidden bg-white/40 border border-white/60 shadow-md backdrop-blur-md relative flex justify-center items-center p-1.5 bg-gradient-to-br from-rose-50/50 to-fuchsia-50/50`}
        >
          <div className="w-full h-full rounded-xl overflow-hidden relative shadow-inner pointer-events-none bg-black">
            {ytId ? (
              <div className="absolute top-1/2 left-1/2 w-[200vw] sm:w-[150vw] aspect-video -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
                  allow="autoplay; encrypted-media"
                  className="w-full h-full border-0 scale-[1.05]"
                  style={{ pointerEvents: 'none' }}
                />
              </div>
            ) : (
              <video
                src={videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover object-center absolute top-0 left-0"
              />
            )}
          </div>
        </motion.div>
      </div>

      {/* PC Design: Boxed Narrow Banner with Border & Rounded Corners (No Text) */}
      <div className={`hidden md:block ${!wrapperClass ? "w-full" : ""}`}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-[1.5rem] overflow-hidden bg-white/40 border border-white/60 shadow-md backdrop-blur-md relative flex justify-center items-center p-2 bg-gradient-to-br from-rose-50/50 to-fuchsia-50/50 h-28 lg:h-32 w-full"
        >
          <div className="w-full h-full rounded-[1.2rem] overflow-hidden relative shadow-inner pointer-events-none bg-black">
            {ytId ? (
              <div className="absolute top-1/2 left-1/2 w-[150vw] lg:w-[120vw] xl:w-[100vw] aspect-video -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
                  allow="autoplay; encrypted-media"
                  className="w-full h-full border-0 scale-[1.02]"
                  style={{ pointerEvents: 'none' }}
                />
              </div>
            ) : (
              <video
                src={videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover object-center absolute top-0 left-0"
              />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
