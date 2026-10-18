import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TSHIRT_SIZES } from "@/lib/constants";
import { CheckCircle, Upload, Phone, CreditCard, ChevronLeft, ChevronRight, User, Camera, Loader2, XCircle, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const STEPS = [
  { id: 1, label: "ব্যক্তিগত", icon: User },
  { id: 2, label: "ছবি", icon: Camera },
  { id: 3, label: "পেমেন্ট", icon: CreditCard },
];

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
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
        }, 'image/jpeg', 0.8);
      };
    };
  });
};

export default function RegisterPage() {
  const { toast } = useToast();
  const { data: settings, isLoading: settingsLoading } = useSiteSettings();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "",
    roll: "",
    phone: "",
    department: "",
    hall: "",
    tshirtSize: "",
    paymentMethod: "bkash" as "bkash" | "nagad",
    txId: "",
    senderNumber: "",
  });

  const [dbDepartments, setDbDepartments] = useState<string[]>([]);
  const [dbHalls, setDbHalls] = useState<string[]>([]);
  const [isInstantlyVerified, setIsInstantlyVerified] = useState(false);
  const [txVerification, setTxVerification] = useState<{
    checking: boolean;
    found: boolean;
    amount?: number;
    alreadyMatched?: boolean;
  } | null>(null);
  const [copiedNumber, setCopiedNumber] = useState(false);

  const handleCopyNumber = () => {
    const num = form.paymentMethod === "bkash" ? settings?.bkash_number : settings?.nagad_number;
    if (num) {
      navigator.clipboard.writeText(num);
      setCopiedNumber(true);
      toast({ title: "নম্বর কপি হয়েছে! 📋", description: `${num} ক্লিপবোর্ডে কপি করা হয়েছে।` });
      setTimeout(() => setCopiedNumber(false), 2000);
    }
  };

  useEffect(() => {
    const fetchLists = async () => {
      const { data: depts } = await supabase.from("departments").select("name").order("name");
      const { data: hl } = await supabase.from("halls").select("name").order("name");
      if (depts) setDbDepartments(depts.map(d => d.name));
      if (hl) setDbHalls(hl.map(h => h.name));
    };
    fetchLists();
  }, []);

  // Debounced auto-check for TrxID against bKash transactions
  useEffect(() => {
    const cleanTx = form.txId.trim().toUpperCase();
    if (cleanTx.length < 8) {
      setTxVerification(null);
      return;
    }

    setTxVerification({ checking: true, found: false });
    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from("bkash_transactions")
          .select("amount, status")
          .eq("trx_id", cleanTx)
          .maybeSingle();

        if (data) {
          setTxVerification({
            checking: false,
            found: true,
            amount: data.amount,
            alreadyMatched: data.status === "matched",
          });
        } else {
          setTxVerification({ checking: false, found: false });
        }
      } catch (err) {
        setTxVerification(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [form.txId]);

  const set = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional early check for insanely large files to avoid browser crash
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "ছবির সাইজ অনেক বেশি বড় (৫০MB+)", variant: "destructive" });
      return;
    }

    try {
      const compressedFile = await compressImage(file);
      setPhoto(compressedFile);
      setPhotoPreview(URL.createObjectURL(compressedFile));
    } catch (err) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "নাম লিখো";
    const rollNum = parseInt(form.roll);
    if (!form.roll || isNaN(rollNum) || rollNum < 1 || rollNum > 9999) errs.roll = "সঠিক রোল নম্বর দাও (১-৯৯৯৯)";
    if (!form.phone || !/^01\d{9}$/.test(form.phone)) errs.phone = "সঠিক ফোন নম্বর দাও";
    if (!form.department) errs.department = "ডিপার্টমেন্ট সিলেক্ট করো";
    if (!form.hall) errs.hall = "হল সিলেক্ট করো";
    if (!form.tshirtSize) errs.tshirtSize = "টি-শার্ট সাইজ সিলেক্ট করো";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (!form.txId.trim()) errs.txId = "ট্রানজেকশন আইডি দাও";
    if (!form.senderNumber || !/^01\d{9}$/.test(form.senderNumber)) errs.senderNumber = "সঠিক সেন্ডার নম্বর দাও";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;
    setSubmitting(true);

    try {
      let photoUrl: string | null = null;

      // Upload photo if provided (ImgBB with Supabase Storage fallback)
      if (photo) {
        const formData = new FormData();
        formData.append("image", photo);
        const apiKey = "85164bf284c589b1ac8c2f2408fdc3f5";

        try {
          const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: "POST",
            body: formData,
          });
          const imgbbData = await res.json();
          if (imgbbData?.success && imgbbData.data?.url) {
            photoUrl = imgbbData.data.url;
          }
        } catch (imgbbErr) {
          console.warn("ImgBB upload failed, trying Supabase storage fallback...", imgbbErr);
        }

        // Resilient Fallback: If ImgBB was rate-limited or unavailable, save directly to Supabase storage
        if (!photoUrl) {
          try {
            const fileName = `student_${Date.now()}_${form.roll.replace(/[^a-zA-Z0-9]/g, "")}.jpg`;
            const { data: storageData, error: storageErr } = await supabase.storage
              .from("photos")
              .upload(fileName, photo, { contentType: "image/jpeg", upsert: true });

            if (!storageErr && storageData) {
              const { data: pubData } = supabase.storage.from("photos").getPublicUrl(fileName);
              photoUrl = pubData.publicUrl;
            }
          } catch (storageErr) {
            console.warn("Supabase Storage fallback failed:", storageErr);
          }
        }
      }

      const cleanTx = form.txId.trim().toUpperCase();

      // Insert registration with normalized TrxID
      const { data: insertedReg, error } = await supabase.from("registrations").insert({
        name: form.name.trim(),
        roll: form.roll.trim(),
        phone: form.phone.trim(),
        department: form.department,
        hall: form.hall,
        tshirt_size: form.tshirtSize,
        payment_method: form.paymentMethod,
        tx_id: cleanTx,
        sender_number: form.senderNumber.trim(),
        photo_url: photoUrl,
      }).select("id, status").maybeSingle();

      // Automatically add the uploaded photo to the public gallery
      if (photoUrl && !error) {
        await supabase.from("gallery_photos").insert({
          url: photoUrl,
          caption: `${form.name} (${form.department})`
        });
      }

      if (error) {
        if (error.code === "23505") {
          toast({ title: "এই রোল নম্বর দিয়ে আগেই রেজিস্ট্রেশন করা হয়েছে", variant: "destructive" });
        } else {
          toast({ title: "রেজিস্ট্রেশন ব্যর্থ হয়েছে", description: error.message, variant: "destructive" });
        }
        setSubmitting(false);
        return;
      }

      if (insertedReg?.status === "verified") {
        setIsInstantlyVerified(true);
      }

      setSubmitted(true);
    } catch (err) {
      toast({ title: "কিছু একটা সমস্যা হয়েছে", variant: "destructive" });
      setSubmitting(false);
    }
  };

  if (settingsLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (settings && !settings.registration_open) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center pb-20 md:pb-0 px-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center p-8">
          <XCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">রেজিস্ট্রেশন বন্ধ আছে</h2>
          <p className="text-muted-foreground text-sm">বর্তমানে রেজিস্ট্রেশন গ্রহণ করা হচ্ছে না। পরে আবার চেষ্টা করো।</p>
        </motion.div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center pb-20 md:pb-0 px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center p-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/10"
          >
            <CheckCircle className="h-10 w-10 text-secondary" />
          </motion.div>
          <h2 className="font-display text-2xl font-bold mb-2">রেজিস্ট্রেশন সম্পন্ন! 🎉</h2>
          {isInstantlyVerified ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="my-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center max-w-sm mx-auto"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white font-bold text-xs mb-2 shadow-sm">
                <CheckCircle className="h-3.5 w-3.5" /> তাৎক্ষণিক ভেরিফাইড!
              </span>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                বিকাশ মার্চেন্ট ট্রানজ্যাকশন স্বয়ংক্রিয়ভাবে মিলে গেছে।
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                স্ট্যাটাস পেজে তোমার আইডি কার্ড প্রস্তুত আছে।
              </p>
            </motion.div>
          ) : (
            <p className="text-muted-foreground text-sm max-w-sm mx-auto my-3">
              এসএমএস সার্ভারে পৌঁছালে পেমেন্ট স্বয়ংক্রিয়ভাবে ভেরিফাই হবে।<br />
              <strong>রোল: {form.roll}</strong> দিয়ে স্ট্যাটাস চেক করো।
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border bg-card px-4 py-3 text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all";
  const labelClass = "block text-sm font-semibold mb-1.5";
  const errorClass = "text-xs text-destructive mt-1 font-medium";

  return (
    <div className="container max-w-lg py-6 pb-24 md:pb-8 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold mb-1">রেজিস্ট্রেশন</h1>
        <p className="text-muted-foreground text-sm mb-5">ব্যাচ ডে-তে যোগ দিতে নিচের ফর্ম পূরণ করো</p>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-6 px-2">
          {STEPS.map((s, i) => {
            const active = step === s.id;
            const done = step > s.id;
            return (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                    done ? "bg-secondary text-secondary-foreground" :
                    active ? "bg-primary text-primary-foreground shadow-md" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {done ? <CheckCircle className="h-5 w-5" /> : <s.icon className="h-4 w-4" />}
                  </div>
                  <span className={`text-[10px] mt-1 font-semibold ${active ? "text-primary" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-12 sm:w-20 h-0.5 mx-2 rounded-full transition-colors ${
                    step > s.id ? "bg-secondary" : "bg-border"
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="rounded-2xl bg-surface p-5 space-y-4"
              >
                <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider">ব্যক্তিগত তথ্য</h3>
                <div>
                  <label className={labelClass}>নাম *</label>
                  <input className={`${inputClass} ${errors.name ? "border-destructive ring-destructive/20" : "border-input"}`} placeholder="তোমার পুরো নাম" value={form.name} onChange={(e) => set("name", e.target.value)} />
                  {errors.name && <p className={errorClass}>{errors.name}</p>}
                </div>
                <div>
                  <label className={labelClass}>রোল নম্বর *</label>
                  <input className={`${inputClass} ${errors.roll ? "border-destructive ring-destructive/20" : "border-input"}`} placeholder="যেমন: 1234" type="number" value={form.roll} onChange={(e) => set("roll", e.target.value)} />
                  {errors.roll && <p className={errorClass}>{errors.roll}</p>}
                </div>
                <div>
                  <label className={labelClass}>ফোন নম্বর *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input className={`${inputClass} pl-10 ${errors.phone ? "border-destructive ring-destructive/20" : "border-input"}`} placeholder="01XXXXXXXXX" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                  </div>
                  {errors.phone && <p className={errorClass}>{errors.phone}</p>}
                </div>
                <div>
                  <label className={labelClass}>ডিপার্টমেন্ট *</label>
                  <select className={`${inputClass} ${errors.department ? "border-destructive ring-destructive/20" : "border-input"}`} value={form.department} onChange={(e) => set("department", e.target.value)}>
                    <option value="">সিলেক্ট করো</option>
                    {dbDepartments.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.department && <p className={errorClass}>{errors.department}</p>}
                </div>
                <div>
                  <label className={labelClass}>হল *</label>
                  <select className={`${inputClass} ${errors.hall ? "border-destructive ring-destructive/20" : "border-input"}`} value={form.hall} onChange={(e) => set("hall", e.target.value)}>
                    <option value="">সিলেক্ট করো</option>
                    {dbHalls.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                  {errors.hall && <p className={errorClass}>{errors.hall}</p>}
                </div>
                <div>
                  <label className={labelClass}>টি-শার্ট সাইজ *</label>
                  <div className="flex gap-2 flex-wrap">
                    {TSHIRT_SIZES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => set("tshirtSize", s)}
                        className={`px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                          form.tshirtSize === s
                            ? "bg-primary text-primary-foreground border-primary scale-105"
                            : "border-input bg-card hover:bg-muted active:scale-95"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  {errors.tshirtSize && <p className={errorClass}>{errors.tshirtSize}</p>}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="rounded-2xl bg-surface p-5 space-y-4"
              >
                <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider">ছবি আপলোড</h3>
                <p className="text-xs text-muted-foreground">মেমোরি গ্যালারিতে তোমার ছবি দেখা যাবে (ঐচ্ছিক)</p>
                <label className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-input p-8 cursor-pointer hover:border-primary/40 transition-colors active:bg-muted/50">
                  {photoPreview ? (
                    <motion.img
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      src={photoPreview}
                      alt="Preview"
                      className="h-40 w-40 rounded-xl object-cover shadow-card"
                    />
                  ) : (
                    <>
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Upload className="h-7 w-7 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground font-medium">ছবি সিলেক্ট করো</span>
                      <span className="text-xs text-muted-foreground">যেকোনো সাইজের ছবি দিতে পারো</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                </label>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                    className="text-xs text-destructive font-semibold hover:underline"
                  >
                    ছবি মুছে ফেলো
                  </button>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="rounded-2xl bg-surface p-5 space-y-4"
              >
                <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> পেমেন্ট তথ্য
                </h3>
                <div className="flex gap-2">
                  {(["bkash", "nagad"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => set("paymentMethod", m)}
                      className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
                        form.paymentMethod === m
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-input bg-card hover:bg-muted active:scale-95"
                      }`}
                    >
                      {m === "bkash" ? "বিকাশ" : "নগদ"}
                    </button>
                  ))}
                </div>
                <motion.div
                  layout
                  className="rounded-xl bg-card p-4 border border-border flex flex-col items-center justify-center gap-2"
                >
                  <div className="flex items-center justify-between w-full px-1">
                    <span className="text-xs text-muted-foreground font-medium">টাকা পাঠাও এই নম্বরে</span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      ফি: ৳{settings?.registration_fee || 252}
                    </span>
                  </div>
                  <div className="flex items-center justify-between w-full bg-muted/40 p-2.5 rounded-xl border border-border">
                    <span className="font-display font-extrabold text-xl text-primary tracking-wide">
                      {form.paymentMethod === "bkash" ? settings?.bkash_number : settings?.nagad_number}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyNumber}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all active:scale-95"
                    >
                      {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedNumber ? "কপি হয়েছে!" : "কপি নম্বর"}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center">
                    বিকাশ বা নগদ অ্যাপ থেকে <strong>Send Money</strong> করে প্রাপ্ত TrxID নিচে লিখুন।
                  </p>
                </motion.div>
                <div>
                  <label className={labelClass}>ট্রানজেকশন আইডি (TxID) *</label>
                  <input
                    className={`${inputClass} font-mono uppercase ${errors.txId ? "border-destructive ring-destructive/20" : "border-input"}`}
                    placeholder="যেমন: 9A3F2K1L0P"
                    value={form.txId}
                    onChange={(e) => set("txId", e.target.value.toUpperCase())}
                  />
                  {errors.txId && <p className={errorClass}>{errors.txId}</p>}

                  {txVerification?.checking && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1.5 font-medium">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> বিকাশ সার্ভারে TrxID মিলানো হচ্ছে...
                    </p>
                  )}

                  {txVerification && !txVerification.checking && txVerification.found && !txVerification.alreadyMatched && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 mt-2"
                    >
                      <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>৳{txVerification.amount} পেমেন্ট নিশ্চিত পাওয়া গেছে! সাবমিট করলে তাৎক্ষণিক ভেরিফাইড হবে।</span>
                    </motion.div>
                  )}

                  {txVerification && !txVerification.checking && txVerification.found && txVerification.alreadyMatched && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-2 mt-2"
                    >
                      <XCircle className="h-4 w-4 shrink-0" />
                      <span>সতর্কতা: এই TrxID দিয়ে অন্য একটি রেজিস্ট্রেশন ইতিমধ্যেই সম্পন্ন হয়েছে!</span>
                    </motion.div>
                  )}

                  {txVerification && !txVerification.checking && !txVerification.found && (
                    <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                      <span>ℹ️ এসএমএস ব্যাকএন্ডে পৌঁছালে স্বয়ংক্রিয়ভাবে মিলানো হবে।</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>যে নম্বর থেকে পাঠিয়েছো *</label>
                  <input className={`${inputClass} ${errors.senderNumber ? "border-destructive ring-destructive/20" : "border-input"}`} placeholder="01XXXXXXXXX" value={form.senderNumber} onChange={(e) => set("senderNumber", e.target.value)} />
                  {errors.senderNumber && <p className={errorClass}>{errors.senderNumber}</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-5">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-3 rounded-xl border border-input bg-card font-display font-semibold text-sm hover:bg-muted transition-colors active:scale-[0.98] disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                পিছনে
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
              >
                পরবর্তী
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-accent text-accent-foreground font-display font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:hover:scale-100"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    সাবমিট হচ্ছে...
                  </>
                ) : (
                  "সাবমিট করো 🚀"
                )}
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
