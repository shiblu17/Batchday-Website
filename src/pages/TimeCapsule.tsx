import React, { useState, useRef, useMemo } from "react";
import {
  Lock,
  Send,
  Download,
  Calendar,
  Clock,
  Heart,
  Sparkles,
  User,
  Mail,
  Shield,
  CheckCircle,
  HelpCircle,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import html2canvas from "html2canvas";

export default function TimeCapsule() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dept, setDept] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSealed, setIsSealed] = useState(false);
  const [sealedData, setSealedData] = useState<{
    id: string;
    name: string;
    email: string;
    dept: string;
    date: string;
    deliveryDate: string;
  } | null>(null);

  const certRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Delivery date: 02 October 2036 (10 years from 2026)
  const deliveryDateStr = "02 Oct 2036";
  const targetDate = useMemo(() => new Date("2036-10-02T00:00:00"), []);
  
  const daysLeft = useMemo(() => {
    const diff = targetDate.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [targetDate]);

  const prompts = [
    "What are you scared of right now?",
    "Who do you hope is still in your life?",
    "What does success mean to you today?",
    "What would make your present self proud?",
  ];

  const handleInsertPrompt = (prompt: string) => {
    setMessage((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) {
        return `${prompt}\n`;
      }
      return `${trimmed}\n\n• ${prompt}\n`;
    });
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSealCapsule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast({
        title: "Please write your letter",
        description: "Your letter cannot be empty before sealing.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const capsuleId =
      "CAPSULE-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const payload = {
      id: capsuleId,
      name: name.trim() || "Anonymous Batchmate",
      email: email.trim(),
      dept: dept.trim() || "JU-52",
      message: message.trim(),
      unlock_year: 2036,
      delivery_date: "2036-10-02",
      created_at: new Date().toISOString(),
    };

    // 1. Save to dedicated time_capsules table
    try {
      await supabase.from("time_capsules").insert({
        capsule_code: capsuleId,
        name: payload.name,
        email: payload.email,
        dept: payload.dept,
        message: payload.message,
        unlock_year: 2036,
      });
    } catch (err) {
      console.warn("time_capsules insert warning:", err);
    }

    // 2. Dual-save to gallery_photos for backwards compatibility
    try {
      await supabase.from("gallery_photos").insert({
        url: "https://batchday52ju.xyz/time-capsule",
        caption: `[CAPSULE]:${JSON.stringify(payload)}`,
      });
    } catch (err) {
      console.warn("Gallery fallback warning:", err);
    }

    // 3. Save locally
    try {
      const stored = localStorage.getItem("ju52_time_capsules");
      const all = stored ? JSON.parse(stored) : [];
      all.push(payload);
      localStorage.setItem("ju52_time_capsules", JSON.stringify(all));
    } catch (err) {
      console.warn("LocalStorage warning:", err);
    }

    setSealedData({
      id: capsuleId,
      name: payload.name,
      email: payload.email,
      dept: payload.dept,
      date: new Date().toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      deliveryDate: deliveryDateStr,
    });

    setIsSubmitting(false);
    setIsSealed(true);

    toast({
      title: "Letter Sealed! 🔒 ✈",
      description: "Your time capsule letter has been securely stored for 2036.",
    });
  };

  const handleDownloadCertificate = async () => {
    if (!certRef.current) return;
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });
      const link = document.createElement("a");
      link.download = `JU52_Time_Capsule_${sealedData?.name || "Letter"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: "Certificate Downloaded! 🎉" });
    } catch {
      toast({ title: "Failed to generate certificate", variant: "destructive" });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "JU-52 Time Capsule (2026 ➔ 2036)",
        text: "I just sealed a letter to my future self for 2036 at Jahangirnagar University Batch Day 52! Write yours too.",
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied to clipboard! 📋" });
    }
  };

  return (
    <div className="relative min-h-screen text-stone-100 overflow-x-hidden selection:bg-rose-900 selection:text-white">
      {/* Background with custom artwork and rich burgundy wine atmospheric gradient */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
        style={{
          backgroundImage: `url(/time-capsule-bg.jpg)`,
        }}
      />
      {/* Deep Burgundy & Starlight Overlay for authentic vintage mood */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#2a0610]/80 via-[#3d0916]/75 to-[#1c0309]/90 backdrop-blur-[1px] pointer-events-none" />

      {/* Main Content Container */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        
        {/* Top Header Section */}
        <div className="text-center space-y-4 mb-8 sm:mb-12">
          {/* Eyebrow Label */}
          <div className="inline-flex items-center justify-center gap-2 tracking-[0.35em] text-xs font-semibold text-amber-200/90 uppercase select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping inline-block" />
            T I M E &nbsp; C A P S U L E
            <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping inline-block" />
          </div>

          {/* Main Headline with Serif Typography */}
          <h1 className="font-serif-vintage text-3xl sm:text-5xl md:text-6xl text-white font-normal leading-tight tracking-tight drop-shadow-lg max-w-3xl mx-auto">
            To the person I'll become,
            <span className="block italic font-light text-rose-200/90 mt-1 sm:mt-2">
              from the person I am today.
            </span>
          </h1>

          {/* Subtitle Description */}
          <p className="text-xs sm:text-sm md:text-base text-rose-100/80 max-w-xl mx-auto leading-relaxed font-light">
            Write a letter to your future self — 10 years from now. Your dreams,
            your fears, your hopes, or just a random thought. We'll keep it safe,
            and you'll get to read it back in 10 years.
          </p>

          {/* Metadata Badge */}
          <div className="pt-1">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs text-rose-100 font-medium shadow-sm">
              <span className="text-emerald-400 font-bold">☑</span>
              <span>Written in 2026 • Intended for 2036</span>
            </div>
          </div>
        </div>

        {!isSealed ? (
          /* Stationery Letter Card Form */
          <div className="relative max-w-2xl mx-auto">
            {/* Realistic Paperclip Graphic Top Left */}
            <div
              className="absolute -top-4 left-6 sm:left-10 z-20 w-8 h-12 pointer-events-none drop-shadow-md select-none transform -rotate-6"
              title="Paperclip"
            >
              <svg viewBox="0 0 32 48" fill="none" className="w-full h-full">
                <path
                  d="M12 8 C12 4, 20 4, 20 8 L20 34 C20 42, 6 42, 6 34 L6 14 C6 8, 16 8, 16 14 L16 32"
                  stroke="#8b8273"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 8 C12 4, 20 4, 20 8 L20 34 C20 42, 6 42, 6 34 L6 14 C6 8, 16 8, 16 14 L16 32"
                  stroke="#e6decb"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Vintage Stationery Paper Card */}
            <div className="bg-[#FAF5EB] text-[#2c221e] rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.2)] border border-[#e8dfcf] p-6 sm:p-10 relative overflow-hidden transition-all duration-300">
              
              {/* Subtle Paper Grain / Lines */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.035]"
                style={{
                  backgroundImage: `repeating-linear-gradient(0deg, #000, #000 1px, transparent 1px, transparent 28px)`,
                }}
              />

              {/* Form Header */}
              <div className="flex items-center justify-between border-b border-[#e4d8c6] pb-4 mb-6">
                <div className="flex items-center gap-2 text-xs font-bold tracking-[0.25em] text-[#786656] uppercase">
                  <span>✉</span>
                  <span>WRITE YOUR LETTER</span>
                </div>
                <div className="text-[11px] font-mono text-[#968372]">
                  JU 52 • 2026-2036
                </div>
              </div>

              <form onSubmit={handleSealCapsule} className="space-y-5">
                {/* Inputs Grid: Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name (Optional) */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-[#4a3d34] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#786656]" />
                      Your name (optional)
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Al-Amin, or leave blank"
                      className="w-full bg-[#fdfaf5] border border-[#dcd0bf] rounded-xl px-3.5 py-2.5 text-sm text-[#2c221e] placeholder:text-[#a89b8d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#701626]/20 focus:border-[#701626] transition-all"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5 text-left">
                    <div className="flex items-baseline justify-between">
                      <label className="text-xs font-semibold text-[#4a3d34] flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#786656]" />
                        Your email address
                      </label>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-[#fdfaf5] border border-[#dcd0bf] rounded-xl px-3.5 py-2.5 text-sm text-[#2c221e] placeholder:text-[#a89b8d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#701626]/20 focus:border-[#701626] transition-all"
                    />
                    <p className="text-[10px] text-[#8c7a6b] italic">
                      We'll send your letter to you in 10 years.
                    </p>
                  </div>
                </div>

                {/* Delivery Date Field */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-[#4a3d34] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#786656]" />
                    When should we deliver it?
                  </label>
                  <div className="w-full bg-[#f4ece0] border border-[#d9ccba] rounded-xl px-3.5 py-2.5 text-sm text-[#4a3d34] flex items-center justify-between select-none">
                    <span className="font-medium">
                      02 Oct 2036 (10 years from now)
                    </span>
                    <span className="text-[11px] font-semibold text-[#701626] bg-[#701626]/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  </div>
                </div>

                {/* Letter Body Textarea */}
                <div className="space-y-1.5 text-left relative">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#4a3d34] font-serif-vintage italic">
                      Dear future me...
                    </label>
                  </div>

                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={2000}
                      rows={7}
                      placeholder="Dear future me,&#10;&#10;I hope life has been kind to you. As I write this on Batch Day 52 at Jahangirnagar University, here is what is in my heart right now..."
                      className="w-full bg-[#fdfaf5] border border-[#dcd0bf] rounded-xl p-4 pb-8 text-sm sm:text-base text-[#2c221e] leading-relaxed placeholder:text-[#a89b8d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#701626]/20 focus:border-[#701626] transition-all resize-none font-serif-vintage"
                      required
                    />

                    {/* Character Counter */}
                    <div className="absolute bottom-2.5 right-3 text-[11px] font-mono text-[#8c7a6b] select-none bg-[#fdfaf5]/90 px-1.5 py-0.5 rounded">
                      {message.length} / 2000
                    </div>
                  </div>
                </div>

                {/* CTA Button: Seal My Letter ✈ */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full group bg-[#701626] hover:bg-[#861a2e] active:scale-[0.99] text-[#fbf7ee] text-sm sm:text-base font-semibold py-3.5 px-6 rounded-full shadow-lg shadow-[#701626]/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <span>
                      {isSubmitting ? "Sealing your capsule..." : "Seal My Letter"}
                    </span>
                    <span className="text-base group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform">
                      ✈
                    </span>
                  </button>
                </div>

                {/* Security Footnote */}
                <div className="text-center text-xs text-[#8c7a6b] flex items-center justify-center gap-1.5 pt-1">
                  <Lock className="w-3.5 h-3.5 text-[#701626]" />
                  <span>Your letter will be kept safe and private.</span>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* Sealed State / Certificate View */
          <div className="max-w-xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
            {/* Visual Sealed Certificate */}
            <div
              ref={certRef}
              className="relative bg-[#FAF5EB] text-[#2c221e] rounded-3xl p-8 sm:p-12 shadow-2xl border-4 border-[#701626]/30 text-center space-y-6 overflow-hidden"
            >
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
                <span className="font-serif-vintage text-8xl font-black">
                  JU 52
                </span>
              </div>

              {/* Red Wax Seal Stamp Badge */}
              <div className="relative mx-auto w-24 h-24 rounded-full bg-gradient-to-tr from-[#570e1d] via-[#701626] to-[#921e34] flex flex-col items-center justify-center text-amber-100 shadow-xl shadow-[#701626]/40 ring-8 ring-[#701626]/20 select-none">
                <Lock className="w-8 h-8 text-amber-200" />
                <span className="text-[9px] font-black uppercase tracking-widest mt-1 text-amber-100">
                  SEALED
                </span>
                <span className="text-[7px] text-amber-200/80 tracking-tighter">
                  2026 - 2036
                </span>
              </div>

              {/* Certificate Titles */}
              <div className="space-y-1 relative z-10">
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#701626]">
                  Official Time Capsule Vault
                </span>
                <h2 className="font-serif-vintage text-2xl sm:text-3xl font-bold text-[#2c221e]">
                  Jahangirnagar University
                </h2>
                <p className="text-xs text-[#786656]">
                  Certificate ID:{" "}
                  <span className="font-mono font-bold text-[#701626]">
                    {sealedData?.id}
                  </span>
                </p>
              </div>

              {/* Certificate Body */}
              <div className="py-5 border-y border-[#dcd0bf] max-w-sm mx-auto space-y-2 relative z-10">
                <p className="text-xs text-[#786656] italic">
                  This certifies that a future letter written by
                </p>
                <h3 className="font-serif-vintage text-xl sm:text-2xl font-bold text-[#2c221e]">
                  {sealedData?.name}
                </h3>
                {sealedData?.email && (
                  <p className="text-xs text-[#786656]">
                    Recipient: {sealedData?.email}
                  </p>
                )}
                <p className="text-xs text-[#52443a] pt-2 font-serif-vintage italic leading-relaxed">
                  &ldquo;has been sealed in the JU Batch 52 Digital Vault. It is
                  scheduled to be unlocked and sent on{" "}
                  <strong>{sealedData?.deliveryDate}</strong>.&rdquo;
                </p>
              </div>

              {/* Delivery Details */}
              <div className="flex items-center justify-between max-w-sm mx-auto text-xs text-[#786656] relative z-10">
                <div>
                  Sealed on: <strong>{sealedData?.date}</strong>
                </div>
                <div className="text-[#701626] font-bold">
                  Unlock Date: Oct 2036
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={handleDownloadCertificate}
                size="lg"
                className="bg-[#701626] hover:bg-[#861a2e] text-[#fbf7ee] gap-2 w-full sm:w-auto shadow-md rounded-full font-medium"
              >
                <Download className="w-4 h-4" />
                Download Certificate
              </Button>
              <Button
                onClick={handleShare}
                variant="outline"
                size="lg"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 gap-2 w-full sm:w-auto rounded-full font-medium"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => {
                  setIsSealed(false);
                  setMessage("");
                  setName("");
                  setEmail("");
                }}
                className="text-rose-200 hover:text-white hover:bg-white/10 w-full sm:w-auto rounded-full"
              >
                Write Another Letter
              </Button>
            </div>
          </div>
        )}

        {/* Bottom Elements: Prompts Sticky Note, Countdown Pill, Cursive Note */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {/* Bottom-Left Pinned Sticky Note */}
          <div className="flex justify-center md:justify-start">
            <div className="relative bg-[#FFF9E6] text-[#3d3228] p-4 sm:p-5 rounded-2xl shadow-xl border border-[#ebdcb9] max-w-xs transform -rotate-1 hover:rotate-0 transition-transform duration-300">
              {/* Pushpin at top center */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 select-none pointer-events-none drop-shadow">
                <span className="text-xl">📌</span>
              </div>

              <div className="text-xs font-bold text-[#69543f] mb-2.5 flex items-center gap-1.5 pt-1">
                <HelpCircle className="w-3.5 h-3.5 text-[#701626]" />
                A few prompts, if you need them:
              </div>

              <div className="space-y-1.5 text-xs text-[#52443a] leading-relaxed">
                {prompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleInsertPrompt(prompt)}
                    className="block text-left w-full hover:text-[#701626] hover:translate-x-0.5 transition-all cursor-pointer font-serif-vintage italic"
                  >
                    • {prompt}
                  </button>
                ))}
              </div>

              <div className="text-[10px] text-[#968372] mt-3 italic text-right">
                click prompt to add ♡
              </div>
            </div>
          </div>

          {/* Bottom-Center Countdown Pill */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-xs sm:text-sm text-rose-100 font-medium shadow-xl">
              <span className="text-amber-300 text-base">⌛</span>
              <span>
                <strong className="text-white font-mono font-bold">
                  {daysLeft.toLocaleString()}
                </strong>{" "}
                days until your future self opens this.
              </span>
            </div>
          </div>

          {/* Bottom-Right Handwritten Script */}
          <div className="flex justify-center md:justify-end text-center md:text-right">
            <div className="font-cursive text-2xl sm:text-3xl text-amber-200/90 italic tracking-wide select-none drop-shadow-md">
              Small words. Big tomorrows. ♡
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
