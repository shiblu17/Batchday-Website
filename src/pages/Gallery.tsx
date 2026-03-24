import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ImageIcon } from "lucide-react";

function useGalleryPhotos() {
  return useQuery({
    queryKey: ["gallery-photos"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("gallery_photos")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error("Supabase fetch error:", err);
        return [];
      }
    },
    retry: false,
  });
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } },
};

export default function GalleryPage() {
  const { data: photos = [], isLoading } = useGalleryPhotos();

  return (
    <div className="container py-6 md:py-8 pb-24 md:pb-8 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold mb-1">📸 মেমোরি গ্যালারি</h1>
        <p className="text-muted-foreground text-sm mb-6">৫২তম ব্যাচের স্মৃতিগুলো</p>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="text-sm">এখনো কোনো ছবি আপলোড হয়নি</p>
          <p className="text-xs mt-1">অ্যাডমিন গ্যালারিতে ছবি যোগ করলে এখানে দেখা যাবে</p>
        </div>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="columns-2 sm:columns-3 gap-3 space-y-3"
        >
          {photos.map((photo) => (
            <motion.div
              key={photo.id}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="break-inside-avoid rounded-xl overflow-hidden shadow-card group cursor-pointer"
            >
              <img
                src={photo.url}
                alt={photo.caption || "Gallery photo"}
                className="w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
              {photo.caption && (
                <div className="bg-card p-3">
                  <p className="text-xs text-muted-foreground">{photo.caption}</p>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
