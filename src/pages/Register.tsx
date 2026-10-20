import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { TSHIRT_SIZES } from "@/lib/constants";
import {
  CheckCircle,
  Upload,
  Phone,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  User,
  Camera,
  Loader2,
  XCircle,
  Copy,
  Check,
  GraduationCap,
  Sparkles,
  AlertTriangle,
  Ruler,
  Lock,
  Unlock,
  Search,
  Building2,
  Info,
  HelpCircle,
  MessageCircle,
  PhoneCall,
  Edit3,
  RotateCcw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import initialVoters from "@/data/voters.json";
import { fetchAllBatch52Students } from "@/utils/studentDataService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const TSHIRT_SIZE_DETAILS = [
  { size: "S", chest: "36\"", length: "26\"", bangla: "স্মল (S)" },
  { size: "M", chest: "38\"", length: "27\"", bangla: "মিডিয়াম (M)" },
  { size: "L", chest: "40\"", length: "28\"", bangla: "লার্জ (L - সাধারণ ফিট)" },
  { size: "XL", chest: "42\"", length: "29\"", bangla: "এক্সট্রা লার্জ (XL)" },
  { size: "XXL", chest: "44\"", length: "30\"", bangla: "ডাবল এক্সেল (XXL)" },
  { size: "3XL", chest: "46\"", length: "31\"", bangla: "ট্রিপল এক্সেল (3XL)" },
];

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

  // 52nd Batch Student Autofill & Verification States
  const [studentsList, setStudentsList] = useState<{
    name: string;
    department: string;
    hall: string;
    roll: string;
    reg: string;
  }[]>(() =>
    (initialVoters as any[]).map((v) => ({
      name: v.name || "",
      department: v.dept || "",
      hall: v.hall || "",
      roll: String(v.rollNo || "").trim(),
      reg: String(v.regNo || "").trim(),
    }))
  );
  const [matchedStudent, setMatchedStudent] = useState<{
    name: string;
    department: string;
    hall: string;
    roll: string;
    reg: string;
  } | null>(null);
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState<{
    checking: boolean;
    registered: boolean;
    existingName?: string;
    status?: string;
  } | null>(null);

  // Helpline & Data Correction State
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({
    issueType: "hall",
    details: "",
    contactPhone: "",
  });

  const helplineNumber = settings?.bkash_number || "01700000000";
  const rawNum = helplineNumber.replace(/[^0-9]/g, "");
  const waNum = rawNum.startsWith("88")
    ? rawNum
    : `88${rawNum.startsWith("0") ? rawNum : "0" + rawNum}`;

  const currentRollText = form.roll || "উল্লেখ নেই";
  const currentNameText = form.name || matchedStudent?.name || "উল্লেখ নেই";
  const currentDeptText = form.department || matchedStudent?.department || "উল্লেখ নেই";
  const currentHallText = form.hall || matchedStudent?.hall || "উল্লেখ নেই";

  const waMessage = `আসসালামু আলাইকুম অ্যাডমিন,\nআমি জাহাঙ্গীরনগর বিশ্ববিদ্যালয় ৫২তম ব্যাচের শিক্ষার্থী।\n🎓 ক্লাস রোল: ${currentRollText}\n👤 নাম: ${currentNameText}\n🏛️ বিভাগ: ${currentDeptText}\n🏠 হল: ${currentHallText}\n\n⚠️ সমস্যা: আমার ডেটাবেজের তথ্য সংশোধন প্রয়োজন। দয়া করে অ্যাডমিন প্যানেল থেকে ঠিক করে দিন।`;

  const whatsappHelplineUrl = `https://wa.me/${waNum}?text=${encodeURIComponent(waMessage)}`;

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

    // Fetch fresh 52nd batch student list in background & subscribe to Realtime Admin changes
    fetchAllBatch52Students()
      .then((data) => {
        if (data && data.length > 0) {
          setStudentsList(
            data.map((d) => ({
              name: d.name || "",
              department: d.department || "",
              hall: d.hall || "",
              roll: String(d.roll_no || "").trim(),
              reg: String(d.reg_no || "").trim(),
            }))
          );
        }
      })
      .catch((err) => console.warn("Failed to fetch fresh students from Supabase", err));

    // Realtime WebSocket channel for instant auto-sync when Admin updates any student record
    const channel = supabase
      .channel("register_page_batch52_live_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "batch52_students" },
        (payload) => {
          if (payload.eventType === "UPDATE" && payload.new) {
            const u: any = payload.new;
            const updatedRoll = String(u.roll_no || "").trim();
            const updatedStudent = {
              name: u.name || "",
              department: u.department || "",
              hall: u.hall || "",
              roll: updatedRoll,
              reg: String(u.reg_no || "").trim(),
            };

            setStudentsList((prev) =>
              prev.map((s) => (s.roll === updatedRoll ? updatedStudent : s))
            );

            // If the user currently has this student's roll typed in the form!
            setForm((prev) => {
              if (prev.roll.trim() === updatedRoll) {
                toast({
                  title: "ডেটাবেজ আপডেট হয়েছে! ✨",
                  description: `অ্যাডমিন প্যানেল থেকে তোমার তথ্য (${updatedStudent.name}) লাইভ সিঙ্ক করা হয়েছে।`,
                });
                return {
                  ...prev,
                  name: updatedStudent.name,
                  department: updatedStudent.department,
                  hall: updatedStudent.hall,
                };
              }
              return prev;
            });

            setMatchedStudent((curr) => {
              if (curr && curr.roll === updatedRoll) {
                return updatedStudent;
              }
              return curr;
            });
          } else if (payload.eventType === "INSERT" && payload.new) {
            const n: any = payload.new;
            const newStudent = {
              name: n.name || "",
              department: n.department || "",
              hall: n.hall || "",
              roll: String(n.roll_no || "").trim(),
              reg: String(n.reg_no || "").trim(),
            };
            setStudentsList((prev) => [
              ...prev.filter((s) => s.roll !== newStudent.roll),
              newStudent,
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Live Auto-fill and Duplicate Registration Check on Roll Change
  useEffect(() => {
    const cleanRoll = form.roll.trim();
    if (!cleanRoll) {
      setMatchedStudent(null);
      setIsAutoFilled(false);
      setAlreadyRegistered(null);
      return;
    }

    // Match by class roll or registration number (if 6+ digits)
    const match = studentsList.find(
      (s) => s.roll === cleanRoll || (cleanRoll.length >= 6 && s.reg === cleanRoll)
    );

    if (match) {
      setMatchedStudent(match);
      setIsAutoFilled(true);

      // Auto-populate form fields (Always set name to matched student!)
      setForm((prev) => ({
        ...prev,
        name: match.name,
        department: manualOverride && prev.department ? prev.department : match.department,
        hall: manualOverride && prev.hall ? prev.hall : match.hall,
        roll: match.roll,
      }));

      // Clear any previous validation errors for auto-filled fields
      setErrors((prev) => ({
        ...prev,
        roll: "",
        name: "",
        department: "",
        hall: "",
      }));

      // Check if this roll has already been registered in registrations table
      setAlreadyRegistered({ checking: true, registered: false });
      const timer = setTimeout(async () => {
        try {
          const { data } = await supabase
            .from("registrations")
            .select("id, name, roll, status")
            .eq("roll", match.roll)
            .maybeSingle();

          if (data) {
            setAlreadyRegistered({
              checking: false,
              registered: true,
              existingName: data.name,
              status: data.status,
            });
          } else {
            setAlreadyRegistered({ checking: false, registered: false });
          }
        } catch (e) {
          setAlreadyRegistered(null);
        }
      }, 350);

      return () => clearTimeout(timer);
    } else {
      setMatchedStudent(null);
      setIsAutoFilled(false);

      if (cleanRoll.length >= 2) {
        setAlreadyRegistered({ checking: true, registered: false });
        const timer = setTimeout(async () => {
          try {
            const { data } = await supabase
              .from("registrations")
              .select("id, name, roll, status")
              .eq("roll", cleanRoll)
              .maybeSingle();

            if (data) {
              setAlreadyRegistered({
                checking: false,
                registered: true,
                existingName: data.name,
                status: data.status,
              });
            } else {
              setAlreadyRegistered({ checking: false, registered: false });
            }
          } catch (e) {
            setAlreadyRegistered(null);
          }
        }, 400);

        return () => clearTimeout(timer);
      } else {
        setAlreadyRegistered(null);
      }
    }
  }, [form.roll, studentsList]);

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
    if (!form.roll || isNaN(rollNum) || rollNum < 1 || rollNum > 9999) {
      errs.roll = "সঠিক রোল নম্বর দাও (১-৯৯৯৯)";
    } else if (alreadyRegistered?.registered) {
      errs.roll = "এই রোল দিয়ে ইতিমধ্যেই রেজিস্ট্রেশন করা হয়েছে";
    }
    if (!form.phone || !/^01\d{9}$/.test(form.phone)) errs.phone = "সঠিক ফোন নম্বর দাও (১১ ডিজিট)";
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
                className="rounded-2xl bg-surface p-5 space-y-4 shadow-sm border border-border/50"
              >
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <h3 className="font-display font-semibold text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> ব্যক্তিগত তথ্য
                  </h3>
                  <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                    ৫২তম ব্যাচ
                  </span>
                </div>

                {/* Helpful info callout */}
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    তোমার <strong className="text-foreground font-bold">ক্লাস রোল নম্বর</strong> লিখলেই নাম, বিভাগ ও আবাসিক হল স্বয়ংক্রিয়ভাবে পূরণ হয়ে যাবে!
                  </p>
                </div>

                {/* Roll Number Input (Prominent & First) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelClass + " mb-0"}>ক্লাস রোল নম্বর *</label>
                    <span className="text-[11px] text-muted-foreground font-mono">যেমন: 1227</span>
                  </div>
                  <div className="relative">
                    <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      className={`${inputClass} pl-10 font-mono text-base font-bold ${
                        errors.roll || alreadyRegistered?.registered
                          ? "border-destructive ring-destructive/20"
                          : matchedStudent
                          ? "border-emerald-500/50 bg-emerald-500/5"
                          : "border-input"
                      }`}
                      placeholder="তোমার রোল নম্বর লিখো"
                      value={form.roll}
                      onChange={(e) => set("roll", e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                    />
                    {alreadyRegistered?.checking && (
                      <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
                    )}
                  </div>
                  {errors.roll && <p className={errorClass}>{errors.roll}</p>}

                  {/* Case 1: Verified Batch 52 Student Card */}
                  {matchedStudent && !alreadyRegistered?.registered && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          ✓
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                            {matchedStudent.name}
                          </p>
                          <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                            রেজি: {matchedStudent.reg} • ৫২তম ব্যাচ ভেরিফাইড
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        ভেরিফাইড 🎓
                      </span>
                    </motion.div>
                  )}

                  {/* Case 2: Already Registered Warning Card */}
                  {alreadyRegistered?.registered && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2.5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 space-y-2.5"
                    >
                      <div className="flex items-start gap-2.5 text-destructive">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold">
                            এই রোল ({form.roll}) দিয়ে ইতিমধ্যেই রেজিস্ট্রেশন সম্পন্ন হয়েছে!
                          </p>
                          {alreadyRegistered.existingName && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              রেজিস্ট্রেশনকারী: <strong className="text-foreground">{alreadyRegistered.existingName}</strong>
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="w-full text-xs font-bold border-destructive/30 hover:bg-destructive/10 text-destructive gap-1.5 h-8.5 rounded-xl"
                      >
                        <Link to="/status">
                          <Search className="w-3.5 h-3.5" /> তোমার রেজিস্ট্রেশন স্ট্যাটাস ও আইডি কার্ড দেখো
                        </Link>
                      </Button>
                    </motion.div>
                  )}

                  {/* Case 3: Roll typed (3+ digits) but not in Batch 52 list */}
                  {!matchedStudent && form.roll.length >= 3 && !alreadyRegistered?.checking && !alreadyRegistered?.registered && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2"
                    >
                      <Info className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>তালিকাভুক্ত রোলের সাথে মেলেনি। রোল সঠিক হলে নাম, বিভাগ ও হল নিজে নির্বাচন করো।</span>
                    </motion.div>
                  )}
                </div>

                {/* Name Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelClass + " mb-0"}>পুরো নাম *</label>
                    {isAutoFilled && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> স্বয়ংক্রিয়ভাবে পূরণকৃত
                      </span>
                    )}
                  </div>
                  <input
                    className={`${inputClass} ${errors.name ? "border-destructive ring-destructive/20" : "border-input"}`}
                    placeholder="যেমন: MD. RAHIM AHMED"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                  />
                  {errors.name && <p className={errorClass}>{errors.name}</p>}
                </div>

                {/* Phone Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelClass + " mb-0"}>ফোন নম্বর *</label>
                    <span className="text-[11px] text-muted-foreground font-mono">১১ ডিজিট</span>
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      className={`${inputClass} pl-10 font-mono ${errors.phone ? "border-destructive ring-destructive/20" : "border-input"}`}
                      placeholder="01XXXXXXXXX"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value.replace(/[^0-9]/g, "").slice(0, 11))}
                    />
                  </div>
                  {errors.phone && <p className={errorClass}>{errors.phone}</p>}
                </div>

                {/* Department */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelClass + " mb-0"}>ডিপার্টমেন্ট *</label>
                    {isAutoFilled && !manualOverride ? (
                      <button
                        type="button"
                        onClick={() => setManualOverride(true)}
                        className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <Unlock className="w-3 h-3" /> পরিবর্তন করতে চাও?
                      </button>
                    ) : manualOverride && matchedStudent ? (
                      <button
                        type="button"
                        onClick={() => {
                          setManualOverride(false);
                          setForm((f) => ({
                            ...f,
                            department: matchedStudent.department,
                            hall: matchedStudent.hall,
                          }));
                        }}
                        className="text-[11px] font-semibold text-muted-foreground hover:underline flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> ডেটাবেজ মান ফিরিয়ে নাও
                      </button>
                    ) : null}
                  </div>
                  {isAutoFilled && !manualOverride ? (
                    <div className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm font-semibold text-foreground flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-600" />
                        <span>{form.department || "বিভাগ লোড হচ্ছে..."}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        লকড ✓
                      </span>
                    </div>
                  ) : (
                    <select
                      className={`${inputClass} ${errors.department ? "border-destructive ring-destructive/20" : "border-input"}`}
                      value={form.department}
                      onChange={(e) => set("department", e.target.value)}
                    >
                      <option value="">সিলেক্ট করো</option>
                      {dbDepartments.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  )}
                  {errors.department && <p className={errorClass}>{errors.department}</p>}
                </div>

                {/* Hall */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelClass + " mb-0"}>আবাসিক হল *</label>
                    {isAutoFilled && !manualOverride ? (
                      <button
                        type="button"
                        onClick={() => setManualOverride(true)}
                        className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <Unlock className="w-3 h-3" /> পরিবর্তন করতে চাও?
                      </button>
                    ) : manualOverride && matchedStudent ? (
                      <button
                        type="button"
                        onClick={() => {
                          setManualOverride(false);
                          setForm((f) => ({
                            ...f,
                            department: matchedStudent.department,
                            hall: matchedStudent.hall,
                          }));
                        }}
                        className="text-[11px] font-semibold text-muted-foreground hover:underline flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> ডেটাবেজ মান ফিরিয়ে নাও
                      </button>
                    ) : null}
                  </div>
                  {isAutoFilled && !manualOverride ? (
                    <div className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm font-semibold text-foreground flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-600" />
                        <span>{form.hall || "হল লোড হচ্ছে..."}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        লকড ✓
                      </span>
                    </div>
                  ) : (
                    <select
                      className={`${inputClass} ${errors.hall ? "border-destructive ring-destructive/20" : "border-input"}`}
                      value={form.hall}
                      onChange={(e) => set("hall", e.target.value)}
                    >
                      <option value="">সিলেক্ট করো</option>
                      {dbHalls.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  )}
                  {errors.hall && <p className={errorClass}>{errors.hall}</p>}
                </div>

                {/* T-Shirt Size with Size Guide Chart */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelClass + " mb-0"}>টি-শার্ট সাইজ *</label>
                    <button
                      type="button"
                      onClick={() => setSizeGuideOpen(true)}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Ruler className="w-3.5 h-3.5" /> সাইজ চার্ট (Chart)
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {TSHIRT_SIZES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => set("tshirtSize", s)}
                        className={`px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                          form.tshirtSize === s
                            ? "bg-primary text-primary-foreground border-primary scale-105 shadow-sm"
                            : "border-input bg-card hover:bg-muted active:scale-95"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  {errors.tshirtSize && <p className={errorClass}>{errors.tshirtSize}</p>}
                </div>

                {/* 💬 ডেটাবেজ সংশোধন ও অ্যাডমিন হেল্পলাইন কার্ড */}
                <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/5 via-card to-secondary/5 p-4 space-y-3 shadow-sm mt-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">
                          নাম, বিভাগ বা হলে কোনো ভুল আছে?
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          অ্যাডমিন প্যানেল থেকে সংশোধন করলেই লাইভ সিঙ্ক হয়ে যাবে!
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    অফিসিয়াল ডেটাবেজে তোমার নামের বানান, হল বা বিভাগ ভুল থাকলে অথবা রোল খুঁজে না পেলে চিন্তার কোনো কারণ নেই। সরাসরি হেল্পলাইনে মেসেজ পাঠাও, অ্যাডমিন প্যানেল থেকে ঠিক করার সাথে সাথেই তোমার স্ক্রিনে তা <strong>অটো সিঙ্ক (Live Auto-Sync)</strong> হয়ে যাবে।
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    {/* WhatsApp Button */}
                    <a
                      href={whatsappHelplineUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex-1"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>হোয়াটসঅ্যাপে এডমিনকে জানান</span>
                    </a>

                    {/* Quick Correction Request Modal Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setCorrectionForm({
                          issueType: "hall",
                          details: "",
                          contactPhone: form.phone || "",
                        });
                        setCorrectionModalOpen(true);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all active:scale-95 flex-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>সংশোধন রিকোয়েস্ট পাঠান</span>
                    </button>
                  </div>
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
                  <input
                    className={`${inputClass} font-mono ${errors.senderNumber ? "border-destructive ring-destructive/20" : "border-input"}`}
                    placeholder="01XXXXXXXXX"
                    value={form.senderNumber}
                    onChange={(e) => set("senderNumber", e.target.value.replace(/[^0-9]/g, "").slice(0, 11))}
                  />
                  {errors.senderNumber && <p className={errorClass}>{errors.senderNumber}</p>}
                </div>

                {/* Review Info Card before Submitting */}
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3 shadow-sm mt-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                        চূড়ান্ত তথ্য প্রিভিউ (Review)
                      </span>
                    </div>
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Photo Preview"
                        className="w-8 h-8 rounded-full object-cover border border-primary/30"
                      />
                    ) : (
                      <span className="text-[11px] font-semibold text-primary">৫২তম ব্যাচ</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">শিক্ষার্থীর নাম</span>
                      <span className="font-bold text-foreground truncate block">{form.name || "-"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">রোল ও রেজি</span>
                      <span className="font-mono font-bold text-foreground">
                        {form.roll} {matchedStudent?.reg ? `(${matchedStudent.reg})` : ""}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">বিভাগ</span>
                      <span className="font-semibold text-foreground truncate block">{form.department || "-"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">আবাসিক হল</span>
                      <span className="font-semibold text-foreground truncate block">{form.hall || "-"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">টি-শার্ট সাইজ</span>
                      <span className="inline-block px-2 py-0.5 rounded-md bg-primary/15 text-primary font-bold text-xs">
                        {form.tshirtSize || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">ফি ও মাধ্যম</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        ৳{settings?.registration_fee || 252} ({form.paymentMethod === "bkash" ? "বিকাশ" : "নগদ"})
                      </span>
                    </div>
                  </div>
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
                disabled={submitting || !!alreadyRegistered?.registered}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-accent text-accent-foreground font-display font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:hover:scale-100 cursor-pointer disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    সাবমিট হচ্ছে...
                  </>
                ) : alreadyRegistered?.registered ? (
                  "ইতিমধ্যেই রেজিস্ট্রেশন সম্পন্ন হয়েছে ⚠️"
                ) : (
                  "সাবমিট করো 🚀"
                )}
              </button>
            )}
          </div>
        </form>
      </motion.div>

      {/* T-Shirt Size Guide Dialog Modal */}
      <Dialog open={sizeGuideOpen} onOpenChange={setSizeGuideOpen}>
        <DialogContent className="rounded-3xl max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Ruler className="w-5 h-5 text-primary" />
              <span>টি-শার্ট সাইজ গাইড (JU 52nd Batch)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              সঠিক সাইজ নিশ্চিত করতে নিচে ইঞ্চিতে পরিমাপ দেওয়া হলো। ক্লিক করে সরাসরি নির্বাচন করতে পারো।
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted font-bold text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-2.5 px-3">সাইজ</th>
                  <th className="py-2.5 px-3">বুক (Chest)</th>
                  <th className="py-2.5 px-3">লম্বা (Length)</th>
                  <th className="py-2.5 px-3 text-right">নির্বাচন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {TSHIRT_SIZE_DETAILS.map((item) => (
                  <tr
                    key={item.size}
                    onClick={() => {
                      set("tshirtSize", item.size);
                      setSizeGuideOpen(false);
                      toast({ title: `টি-শার্ট সাইজ "${item.size}" সিলেক্ট হয়েছে! 👕` });
                    }}
                    className={`cursor-pointer transition-colors hover:bg-primary/5 ${
                      form.tshirtSize === item.size ? "bg-primary/10 font-bold" : ""
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-foreground">
                      <span className="px-2 py-0.5 rounded bg-muted font-mono">{item.size}</span>
                      <span className="text-[10px] text-muted-foreground ml-1.5 font-normal">({item.bangla})</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">{item.chest}</td>
                    <td className="py-2.5 px-3 font-mono">{item.length}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          form.tshirtSize === item.size
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-primary hover:text-white"
                        }`}
                      >
                        {form.tshirtSize === item.size ? "সিলেক্টেড ✓" : "বেছে নাও"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 p-3 rounded-xl bg-muted/60 text-[11px] text-muted-foreground flex items-center gap-2">
            <Info className="w-4 h-4 text-primary shrink-0" />
            <span>টিপস: একটু ঢিলেঢালা বা কম্ফোর্টেবল পছন্দ করলে রেগুলার সাইজের চেয়ে ১ সাইজ বড় নিতে পারো।</span>
          </div>
        </DialogContent>
      </Dialog>

      {/* 📝 Quick Data Correction Request Modal */}
      <Dialog open={correctionModalOpen} onOpenChange={setCorrectionModalOpen}>
        <DialogContent className="rounded-3xl max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary" />
              <span>তথ্য সংশোধনের অনুরোধ (Helpline)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              অফিসিয়াল ডেটাবেজে কোনো তথ্যে ভুল থাকলে নিচে বিস্তারিত লিখে সরাসরি অ্যাডমিনকে জানান। অ্যাডমিন প্যানেলে আপডেট করার সাথে সাথে তোমার ফর্ম স্বয়ংক্রিয়ভাবে লাইভ সিঙ্ক হয়ে যাবে।
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fullMsg = `*JU ৫২তম ব্যাচ - তথ্য সংশোধন অনুরোধ* 🎓\n• ক্লাস রোল: ${form.roll || "উল্লেখ নেই"}\n• বর্তমান নাম: ${form.name || "উল্লেখ নেই"}\n• বিভাগ: ${form.department || "উল্লেখ নেই"}\n• বর্তমান হল: ${form.hall || "উল্লেখ নেই"}\n• সংশোধনের বিষয়: ${
                correctionForm.issueType === "hall"
                  ? "আবাসিক হল ভুল"
                  : correctionForm.issueType === "department"
                  ? "বিভাগ ভুল"
                  : correctionForm.issueType === "name"
                  ? "নামের বানান ভুল"
                  : correctionForm.issueType === "missing_roll"
                  ? "রোল তালিকায় পাওয়া যাচ্ছে না"
                  : "অন্যান্য সমস্যা"
              }\n• যা সংশোধন করতে হবে: ${correctionForm.details}\n• যোগাযোগ নম্বর: ${correctionForm.contactPhone || form.phone || "উল্লেখ নেই"}\n\nদয়া করে অ্যাডমিন প্যানেল থেকে তথ্যটি আপডেট করে দিন।`;

              const targetUrl = `https://wa.me/${waNum}?text=${encodeURIComponent(fullMsg)}`;
              window.open(targetUrl, "_blank");
              setCorrectionModalOpen(false);
              toast({
                title: "হোয়াটসঅ্যাপে পাঠানো হচ্ছে... 💬",
                description: "অ্যাডমিন তথ্য আপডেট করলেই তোমার রেজিস্ট্রেশন ফর্মে লাইভ সিঙ্ক হয়ে যাবে।",
              });
            }}
            className="space-y-3.5 mt-2"
          >
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                ক্লাস রোল নম্বর
              </label>
              <input
                readOnly
                value={form.roll || "ফর্মের রোল খালি"}
                className="w-full rounded-xl border bg-muted/50 px-3.5 py-2.5 text-xs font-mono font-bold text-foreground"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                কোন তথ্যে ভুল আছে?
              </label>
              <select
                value={correctionForm.issueType}
                onChange={(e) =>
                  setCorrectionForm({ ...correctionForm, issueType: e.target.value })
                }
                className="w-full rounded-xl border bg-card px-3.5 py-2.5 text-xs font-medium"
              >
                <option value="hall">আবাসিক হল ভুল আছে</option>
                <option value="department">বিভাগের নাম ভুল আছে</option>
                <option value="name">নামের বানানে ভুল আছে</option>
                <option value="missing_roll">তালিকায় আমার রোল পাওয়া যাচ্ছে না</option>
                <option value="other">অন্যান্য সমস্যা</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                সঠিক তথ্য কী হবে? বিস্তারিত লিখুন *
              </label>
              <textarea
                required
                rows={3}
                placeholder="যেমন: আমার সঠিক হল বীর প্রতীক তারামন বিবি হল (বর্তমানে জাহানারা ইমাম হল দেখাচ্ছে)"
                value={correctionForm.details}
                onChange={(e) =>
                  setCorrectionForm({ ...correctionForm, details: e.target.value })
                }
                className="w-full rounded-xl border bg-card p-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                তোমার ফোন নম্বর
              </label>
              <input
                placeholder="01XXXXXXXXX"
                value={correctionForm.contactPhone || form.phone}
                onChange={(e) =>
                  setCorrectionForm({
                    ...correctionForm,
                    contactPhone: e.target.value.replace(/[^0-9]/g, "").slice(0, 11),
                  })
                }
                className="w-full rounded-xl border bg-card px-3.5 py-2.5 text-xs font-mono"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCorrectionModalOpen(false)}
                className="flex-1 rounded-xl text-xs"
              >
                বাতিল
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                হোয়াটসঅ্যাপে পাঠান
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
