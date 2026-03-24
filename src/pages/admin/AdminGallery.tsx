import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, Trash2, ImageIcon } from "lucide-react";

function useGalleryPhotos() {
  return useQuery({
    queryKey: ["gallery-photos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_photos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export default function AdminGallery() {
  const { data: photos = [], isLoading } = useGalleryPhotos();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "ফাইল সাইজ ১০MB এর বেশি", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `gallery/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("photos").getPublicUrl(filePath);

      const { error: insertError } = await supabase.from("gallery_photos").insert({
        url: urlData.publicUrl,
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
            <span className="text-xs text-muted-foreground">Max 10MB</span>
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
      )}
    </div>
  );
}
