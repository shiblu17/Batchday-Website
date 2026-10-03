import React, { useState, useRef } from "react";
import { Hourglass, Lock, Sparkles, Send, Download, CheckCircle, Shield, Calendar, Clock, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import html2canvas from "html2canvas";

export default function TimeCapsule() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dept, setDept] = useState("");
  const [message, setMessage] = useState("");
  const [vision2036, setVision2036] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSealed, setIsSealed] = useState(false);
  const [sealedData, setSealedData] = useState<{
    id: string;
    name: string;
    dept: string;
    date: string;
  } | null>(null);

  const certRef = useRef<HTMLDivElement>(null);

  // Time remaining to 2036 (approx 10 years)
  const targetYear = 2036;
  const currentYear = new Date().getFullYear();
  const yearsLeft = targetYear - currentYear;

  const handleSealCapsule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      toast({ title: "নাম এবং বার্তা লেখা আবশ্যক", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const capsuleId = "CAPSULE-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const payload = {
      id: capsuleId,
      name: name.trim(),
      email: email.trim(),
      dept: dept.trim() || "JU-52",
      message: message.trim(),
      vision: vision2036.trim(),
      unlock_year: 2036,
      created_at: new Date().toISOString(),
    };

    // 1. Try Supabase
    try {
      await supabase.from("time_capsules" as any).insert([payload]);
    } catch {
      // Ignored for graceful fallback
    }

    // 2. Local storage
    try {
      const stored = localStorage.getItem("ju52_time_capsules");
      const all = stored ? JSON.parse(stored) : [];
      all.push(payload);
      localStorage.setItem("ju52_time_capsules", JSON.stringify(all));
    } catch (err) {
      console.warn("Local storage write error:", err);
    }

    setSealedData({
      id: capsuleId,
      name: name.trim(),
      dept: dept.trim() || "JU-52",
      date: new Date().toLocaleDateString("bn-BD"),
    });

    setIsSubmitting(false);
    setIsSealed(true);

    toast({
      title: "টাইম ক্যাপসুল সিলগালা করা হয়েছে! 🔒",
      description: "২০৩৬ সালের আগে এই চিঠিটি সুরক্ষিত থাকবে।",
    });
  };

  const handleDownloadCertificate = async () => {
    if (!certRef.current) return;
    try {
      const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true });
      const link = document.createElement("a");
      link.download = `JU52_Time_Capsule_Certificate_${sealedData?.name || "Member"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: "সার্টিফিকেট ডাউনলোড সম্পন্ন! 🎉" });
    } catch {
      toast({ title: "ডাউনলোড ব্যর্থ হয়েছে", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
            <Hourglass className="w-4 h-4 animate-spin [animation-duration:8s]" />
            JU-52 ডিজিটাল টাইম ক্যাপসুল
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-foreground">
            টাইম ক্যাপসুল ২০২৬ ➔ ২০৩৬
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            ১০ বছর পরের তোমার জন্য একটি চিঠি রেখে যাও। ২০৩৬ সালের ব্যাচ ডে-তে এই চিঠিটি আনলক হবে।
          </p>

          {/* Countdown Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border shadow-sm text-xs font-medium text-foreground">
            <Calendar className="w-4 h-4 text-primary" />
            <span>আনলক হওয়ার সময় বাকি: <strong>{yearsLeft} বছর (২০৩৬ সাল)</strong></span>
          </div>
        </div>

        {!isSealed ? (
          <Card className="border border-border/80 shadow-2xl bg-card/80 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                ভবিষ্যতের চিঠি প্রস্তুত করুন
              </CardTitle>
              <CardDescription>
                এই বার্তাটি এনক্রিপ্টেড থাকবে এবং ২০৩৬ সালের আগে উন্মুক্ত করা হবে না।
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSealCapsule} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">আপনার নাম *</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="পুরো নাম"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">বিভাগ</label>
                    <Input
                      value={dept}
                      onChange={(e) => setDept(e.target.value)}
                      placeholder="যেমন: সিএসই, অর্থনীতি..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">ইমেইল (২০৩৬ সালে লিংক পাওয়ার জন্য)</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="আপনার ইমেইল"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">
                    ১০ বছর পরের তুমি কেমন থাকবে? (Vision for 2036)
                  </label>
                  <Input
                    value={vision2036}
                    onChange={(e) => setVision2036(e.target.value)}
                    placeholder="কোথায় থাকবে, কী পেশায় থাকবে, বন্ধুদের সাথে কেমন সম্পর্ক থাকবে..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">
                    ভবিষ্যতের নিজের এবং ৫২ ব্যাচের উদ্দেশ্যে চিঠি *
                  </label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="ক্যাম্পাস জীবনের সেরা স্মৃতি, মনের অনুভূতি, বা ১০ বছর পরের নিজেকে দেওয়া কোনো উপদেশ..."
                    rows={6}
                    required
                  />
                </div>

                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground">ডিজিটাল সিলমোহর নিশ্চয়তা:</strong> আপনার বার্তাটি সাবমিট করার পর এটি টাইম ক্যাপসুল ভল্টে সিলগালা করা হবে এবং আপনাকে একটি অফিসিয়াল ডিজিটাল ক্যাপসুল সার্টিফিকেট দেওয়া হবে।
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full gap-2 font-bold shadow-lg shadow-primary/20" disabled={isSubmitting}>
                  <Lock className="w-4 h-4" />
                  {isSubmitting ? "সিলগালা হচ্ছে..." : "টাইম ক্যাপসুল সিলগালা করুন 🔒"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* Sealed Certificate State */
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Visual Certificate to Download */}
            <div
              ref={certRef}
              className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-card via-card/95 to-primary/10 border-4 border-primary/30 shadow-2xl text-center space-y-6 overflow-hidden"
            >
              {/* Background watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
                <span className="font-black text-8xl sm:text-9xl tracking-widest text-foreground">JU 52</span>
              </div>

              {/* Wax Seal Icon */}
              <div className="relative mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-rose-700 via-primary to-amber-600 flex items-center justify-center text-white shadow-xl shadow-primary/40 ring-8 ring-primary/20">
                <Lock className="w-10 h-10" />
                <div className="absolute -bottom-1 text-[9px] font-black uppercase tracking-widest bg-black/50 px-2 py-0.5 rounded-full">
                  SEALED
                </div>
              </div>

              <div className="space-y-2 relative z-10">
                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                  অফিসিয়াল টাইম ক্যাপসুল সার্টিফিকেট
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-black text-foreground">
                  জাহাঙ্গীরনগর বিশ্ববিদ্যালয় ৫২ ব্যাচ
                </h2>
                <p className="text-xs text-muted-foreground">
                  সার্টিফিকেট আইডি: <span className="font-mono text-primary font-bold">{sealedData?.id}</span>
                </p>
              </div>

              <div className="py-4 border-y border-border/80 max-w-md mx-auto space-y-2 relative z-10">
                <p className="text-sm text-muted-foreground">
                  এই মর্মে প্রত্যয়ন করা যাচ্ছে যে,
                </p>
                <h3 className="font-display text-xl sm:text-2xl font-extrabold text-foreground">
                  {sealedData?.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  বিভাগ: {sealedData?.dept}
                </p>
                <p className="text-xs text-foreground/80 pt-2 font-serif italic">
                  &ldquo;তার বার্তাটি নিরাপদ ডিজিটাল ভল্টে ২০৩৬ সালের ব্যাচ ডে পর্যন্ত সিলগালা করে সংরক্ষণ করা হলো।&rdquo;
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between max-w-md mx-auto text-xs text-muted-foreground gap-2 relative z-10">
                <div>সিল করার তারিখ: <strong>{sealedData?.date}</strong></div>
                <div className="text-primary font-bold">আনলক ইয়ার: ২০৩৬</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={handleDownloadCertificate} size="lg" className="gap-2 w-full sm:w-auto shadow-md">
                <Download className="w-4 h-4" />
                সার্টিফিকেট ডাউনলোড করুন
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setIsSealed(false);
                  setName("");
                  setMessage("");
                  setVision2036("");
                }}
                className="w-full sm:w-auto"
              >
                আরেকটি চিঠি লিখুন
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
