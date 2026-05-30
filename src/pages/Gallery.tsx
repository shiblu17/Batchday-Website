import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sponsors from "@/components/Sponsors";

function useGalleryPhotos(page: number) {
  const LIMIT = 24;
  return useQuery({
    queryKey: ["gallery-photos", page],
    queryFn: async () => {
      try {
        const { data, error, count } = await supabase
          .from("gallery_photos")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(0, page * LIMIT - 1);
        if (error) throw error;
        return { data: data || [], count: count || 0 };
      } catch (err) {
        console.error("Supabase fetch error:", err);
        return { data: [], count: 0 };
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
  const [page, setPage] = useState(1);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const { data: queryData, isLoading } = useGalleryPhotos(page);
  const photos = queryData?.data || [];
  const totalCount = queryData?.count || 0;

  return (
    <div className="container py-6 md:py-8 pb-24 md:pb-8 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="text-center md:text-left mb-6">
          <h1 className="font-display text-2xl font-bold mb-1">📸 মেমোরি গ্যালারি</h1>
          <p className="text-muted-foreground text-sm">৫২তম ব্যাচের স্মৃতিগুলো</p>
        </div>
        
        <div className="-mx-4 sm:-mx-8 md:-mx-0">
          <Sponsors type="gallery" />
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 mt-8 mx-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
              <ImageIcon className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="font-display text-2xl font-bold text-slate-400">স্মৃতিগুলো এখনো জমা হয়নি!</h3>
            <p className="text-slate-400 text-sm mt-3 max-w-xs mx-auto">
              ৫২তম ব্যাচের মেমোরি গ্যালারিটি এখনো খালি আছে। অ্যাডমিন থেকে ছবি আপলোড করলেই এখানে ভেসে উঠবে।
            </p>
          </motion.div>
        </div>
      ) : (
        <>
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
                onClick={() => setSelectedPhoto(photo)}
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

          {photos.length < totalCount && (
            <div className="mt-12 text-center pb-8">
              <Button 
                onClick={() => setPage(p => p + 1)} 
                variant="outline" 
                className="rounded-full px-8 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm font-semibold"
              >
                আরো ছবি দেখুন
              </Button>
            </div>
          )}
        </>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute -top-12 right-0 md:-right-12 p-2 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full"
              >
                <X className="h-6 w-6" />
              </button>
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption || "Gallery photo large"}
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
              {selectedPhoto.caption && (
                <p className="mt-4 text-white font-medium text-center text-sm bg-black/60 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-md">
                  {selectedPhoto.caption}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
