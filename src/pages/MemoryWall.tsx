import { motion } from 'framer-motion';

// Mock Cloudinary Image URLs for demonstration
const mockImages = [
  "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=500&h=700&fit=crop", // Event 1 (Tall)
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop", // Event 2 (Wide)
  "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=500&h=500&fit=crop", // Event 3 (Square)
  "https://images.unsplash.com/photo-1525926577800-7f28c2e08616?w=500&h=800&fit=crop", // Event 4 (Tall)
  "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&h=400&fit=crop", // Event 5 (Wide)
  "https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=500&h=600&fit=crop", // Event 6 (Medium)
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=500&h=500&fit=crop", // Event 7
  "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=500&h=750&fit=crop", // Event 8
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=700&h=500&fit=crop", // Event 9
];

export default function MemoryWall() {
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
            A beautiful collection of our best moments. Share your photos and become part of the JU 52nd Batch legacy.
          </p>
        </div>
        
        {/* Masonry Grid Setup using CSS Columns */}
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
           {mockImages.map((src, i) => (
             <motion.div 
               key={i} 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               whileInView={{ opacity: 1, scale: 1, y: 0 }}
               viewport={{ once: true, margin: "-50px" }}
               transition={{ duration: 0.6, delay: (i % 4) * 0.1 }}
               className="break-inside-avoid relative group rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-white"
             >
               <img 
                 src={src} 
                 alt={`Memory ${i+1}`} 
                 className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                 loading="lazy"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                 <p className="text-white font-bold text-lg drop-shadow-md">JU 52 Fest</p>
                 <p className="text-white/80 text-sm font-medium">Uploaded by User</p>
               </div>
             </motion.div>
           ))}
        </div>
        
        <div className="mt-20 text-center">
            <button className="bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold py-4 px-10 rounded-full shadow-[0_10px_30px_-10px_rgba(128,0,0,0.3)] transition-all active:scale-95 text-lg inline-flex items-center group">
              <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center mr-3 group-hover:bg-white group-hover:text-primary transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </span>
              Upload New Memory
            </button>
        </div>
      </div>
    </div>
  )
}
