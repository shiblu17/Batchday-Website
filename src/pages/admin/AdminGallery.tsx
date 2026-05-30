import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, Trash2, ImageIcon } from "lucide-react";

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now()
            }));
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.85);
      };
    };
  });
};

function useGalleryPhotos(page: number) {
  const LIMIT = 24;
  return useQuery({
    queryKey: ["gallery-photos", page],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from("gallery_photos")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(0, page * LIMIT - 1);
      if (error) throw error;
      return { data, count };
    },
  });
}

export default function AdminGallery() {
  const [page, setPage] = useState(1);
  const { data: queryData, isLoading } = useGalleryPhotos(page);
  const photos = queryData?.data || [];
  const totalCount = queryData?.count || 0;
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Safety check for insanely large files to avoid browser Out-Of-Memory crash
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "ফাইলের সাইজ অনেক বেশি বড় (৫০MB+)", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const compressedFile = await compressImage(file);
      const formData = new FormData();
      formData.append("image", compressedFile);

      const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
      if (!apiKey) throw new Error("ImgBB API Key is missing in .env");

      const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: "POST",
        body: formData,
      });
      const imgbbData = await res.json();

      if (!imgbbData.success) {
        throw new Error(imgbbData.error?.message || "Failed to upload to ImgBB");
      }

      const imageUrl = imgbbData.data.url;

      const { error: insertError } = await supabase.from("gallery_photos").insert({
        url: imageUrl,
        caption: caption || null,
      });
      if (insertError) throw insertError;

      setCaption("");
      await queryClient.invalidateQueries({ queryKey: ["gallery-photos"] });
      toast({ title: "ছবি আপলোড হয়েছে ✅" });
    } catch (err: any) {
      toast({ title: "আপলোড ব্যর্থ", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("gallery_photos").delete().eq("id", id);
    if (error) {
      toast({ title: "ডিলিট ব্যর্থ", variant: "destructive" });
    } else {
      await queryClient.invalidateQueries({ queryKey: ["gallery-photos"] });
      toast({ title: "ছবি মুছে ফেলা হয়েছে" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">🖼️ গ্যালারি ম্যানেজমেন্ট</h1>

      {/* Upload section */}
      <div className="rounded-xl bg-card shadow-card p-5 mb-6">
        <h2 className="font-display font-semibold text-base mb-3">নতুন ছবি আপলোড</h2>
        <div className="space-y-3">
          <Input
            placeholder="ক্যাপশন (ঐচ্ছিক)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <label className="flex items-center gap-2">
            <Button disabled={uploading} asChild variant="outline">
              <span className="cursor-pointer">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                ছবি সিলেক্ট করো
              </span>
            </Button>
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            <span className="text-xs text-muted-foreground">DSLR বা যেকোনো হাই-কোয়ালিটি ছবি দিন</span>
          </label>
        </div>
      </div>

      {/* Photo grid */}
      {photos.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">কোনো ছবি নেই</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative rounded-xl overflow-hidden shadow-card bg-card">
                <img
                  src={photo.url}
                  alt={photo.caption || "Gallery photo"}
                  className="w-full aspect-square object-cover"
                />
                {photo.caption && (
                  <p className="p-2 text-xs text-muted-foreground truncate">{photo.caption}</p>
                )}
                <button
                  onClick={() => handleDelete(photo.id)}
                  className="absolute top-2 right-2 h-8 w-8 rounded-lg bg-destructive/90 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="ডিলিট করো"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          
          {photos.length < totalCount && (
            <div className="mt-8 text-center">
              <Button onClick={() => setPage(p => p + 1)} variant="outline" className="rounded-full px-8">
                আরো ছবি দেখুন
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
