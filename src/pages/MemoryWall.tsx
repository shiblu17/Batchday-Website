import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function MemoryWall() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('gallery_photos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setImages(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen py-16 px-4 bg-gradient-to-b from-[#FAFAFA] to-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 relative">
           <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -mr-10 -mt-20 pointer-events-none" />
           <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

          <h2 className="text-5xl md:text-6xl font-bold text-primary mb-6 drop-shadow-sm font-sans tracking-tight relative z-10">
            Memory Wall
          </h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed relative z-10">
            A beautiful collection of our best moments.
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-24 bg-white/50 backdrop-blur rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-700 mb-2">এখনো কোনো ছবি আপলোড করা হয়নি</h3>
            <p className="text-gray-500">রেজিস্ট্রেশনের সময় আপলোড করা ছবিগুলো এখানে দেখা যাবে।</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
             {images.map((img, i) => (
               <motion.div 
                 key={img.id} 
                 initial={{ opacity: 0, scale: 0.95, y: 20 }}
                 whileInView={{ opacity: 1, scale: 1, y: 0 }}
                 viewport={{ once: true, margin: "-50px" }}
                 transition={{ duration: 0.6, delay: (i % 4) * 0.1 }}
                 className="break-inside-avoid relative group rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-white"
               >
                 <img 
                   src={img.url} 
                   alt={img.caption || `Memory ${i+1}`} 
                   className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                   loading="lazy"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                   <p className="text-white font-bold text-sm drop-shadow-md">{img.caption || "JU 52"}</p>
                 </div>
               </motion.div>
             ))}
          </div>
        )}
      </div>
    </div>
  )
}
