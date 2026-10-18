import React, { useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Lock,
  Download,
  Calendar,
  Sparkles,
  User,
  Mail,
  PenTool,
  HelpCircle,
  Share2,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
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

  // Dynamic dates: exactly 10 years from the day the letter is written
  const today = useMemo(() => new Date(), []);
  const deliveryDate = useMemo(() => {
    const d = new Date(today);
    d.setFullYear(d.getFullYear() + 10);
    return d;
  }, [today]);

  const deliveryDateStr = useMemo(() => {
    return deliveryDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [deliveryDate]);

  const unlockYear = useMemo(() => deliveryDate.getFullYear(), [deliveryDate]);

  const daysLeft = useMemo(() => {
    const diff = deliveryDate.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [deliveryDate]);

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
      unlock_year: unlockYear,
      delivery_date: deliveryDate.toISOString().split("T")[0],
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
        unlock_year: unlockYear,
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
      date: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      deliveryDate: deliveryDateStr,
    });

    setIsSubmitting(false);
    setIsSealed(true);

    toast({
      title: "Letter Sealed! 🔒 ✈",
      description: "Your time capsule letter has been securely sealed for 2036.",
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
    <div className="relative min-h-screen bg-[#F6EDE0] text-[#2c1d1a] overflow-x-hidden selection:bg-[#7c2237] selection:text-white">
      {/* MOBILE BACKGROUND: Top Sky, JU Monument, Paper Airplane, Moon & Celestial Clock (100% width, NO side cropping!) */}
      <div
        className="absolute top-0 left-0 right-0 h-[480px] sm:h-[580px] lg:hidden z-0 bg-no-repeat pointer-events-none opacity-95"
        style={{
          backgroundImage: `url(/time-capsule-bg.jpg)`,
          backgroundSize: "100% auto",
          backgroundPosition: "top center",
        }}
      />
      {/* Mobile soft parchment veil on left: conceals background duplicate text while keeping moon & clock crisp on right */}
      <div className="absolute top-0 left-0 w-full sm:w-[65%] h-[380px] sm:h-[450px] lg:hidden z-0 bg-gradient-to-r from-[#F6EDE0] via-[#F6EDE0]/95 to-transparent pointer-events-none" />
      {/* Mobile top-to-body smooth gradient fade */}
      <div className="absolute top-[320px] sm:top-[440px] left-0 right-0 h-[180px] lg:hidden z-0 bg-gradient-to-b from-transparent via-[#F6EDE0]/80 to-[#F6EDE0] pointer-events-none" />

      {/* MOBILE BACKGROUND: Bottom Desk Artwork (Mahogany Desk, Red Envelope with Wax Seal, Pens, Fallen Leaves) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[420px] sm:h-[500px] lg:hidden z-0 bg-no-repeat pointer-events-none opacity-95"
        style={{
          backgroundImage: `url(/time-capsule-bg.jpg)`,
          backgroundSize: "100% auto",
          backgroundPosition: "bottom center",
        }}
      />
      {/* Mobile bottom fade blend */}
      <div className="absolute bottom-[320px] sm:bottom-[420px] left-0 right-0 h-[120px] lg:hidden z-0 bg-gradient-to-b from-[#F6EDE0] to-transparent pointer-events-none" />

      {/* DESKTOP BACKGROUND: Full High-Res Immersion */}
      <div
        className="hidden lg:block fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-85 transition-opacity duration-700"
        style={{
          backgroundImage: `url(/time-capsule-bg.jpg)`,
        }}
      />
      {/* Desktop subtle atmospheric vignette */}
      <div className="hidden lg:block fixed inset-0 z-0 bg-gradient-to-r from-[#F6EDE0]/85 via-[#F6EDE0]/50 to-[#4a0f1d]/75 pointer-events-none" />

      {/* Floating Back to Home button (no top bar banner) */}
      <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white text-[#7c2237] text-xs font-semibold border border-[#e2d5c3] shadow-xs backdrop-blur-sm transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
      </div>

      {/* Main Page Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-16">
        {!isSealed ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* LEFT COLUMN: Clean Hero Typography without any clunky glass card */}
            <div className="lg:col-span-5 space-y-5 pt-1 lg:pt-6">
              
              {/* Eyebrow Label with subtle dot */}
              <div className="flex items-center gap-2 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7c2237]" />
                <span className="tracking-[0.3em] text-xs font-bold text-[#7c2237] uppercase">
                  T I M E &nbsp; C A P S U L E
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="font-serif-vintage text-3xl sm:text-4xl xl:text-5xl text-[#2c181b] font-normal leading-[1.15]">
                To the person
                <span className="block font-medium mt-0.5">I'll become,</span>
                <span className="block italic font-light text-[#7c2237] mt-1 sm:mt-2">
                  from the person I am today.
                </span>
              </h1>

              {/* Paragraph Subtitle */}
              <p className="text-xs sm:text-sm text-[#4d3632] leading-relaxed max-w-md font-serif-vintage">
                Write a letter to your future self — 10 years from now. Your
                dreams, your fears, your hopes, or just a random thought. We'll
                keep it safe, and you'll get to read it back in 10 years.
              </p>

              {/* Meta Checkbox Pill */}
              <div className="pt-1">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-[#e2d3be] text-xs text-[#4d3632] font-medium shadow-xs">
                  <span className="text-emerald-600 font-bold text-sm">☑</span>
                  <span>Written in {today.getFullYear()} • Intended for {unlockYear}</span>
                </div>
              </div>

              {/* Pinned Yellow Memo Note (Desktop view) */}
              <div className="hidden lg:block pt-6">
                <div className="relative bg-[#FFF9E5] text-[#3d2e24] p-5 rounded-2xl shadow-xl border border-[#ebdcb9] max-w-sm transform -rotate-1 hover:rotate-0 transition-transform duration-300">
                  {/* Pushpin */}
                  <div className="absolute -top-3.5 left-8 select-none pointer-events-none drop-shadow">
                    <span className="text-2xl">📌</span>
                  </div>

                  <div className="text-xs font-bold text-[#69543f] mb-3 flex items-center gap-1.5 pt-1">
                    <HelpCircle className="w-4 h-4 text-[#7c2237]" />
                    <span>A few prompts, if you need them:</span>
                  </div>

                  <div className="space-y-2 text-xs text-[#4a392d]">
                    {prompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleInsertPrompt(prompt)}
                        className="block text-left w-full hover:text-[#7c2237] hover:translate-x-1 transition-all cursor-pointer font-serif-vintage italic"
                      >
                        • {prompt}
                      </button>
                    ))}
                  </div>

                  <div className="text-[10px] text-[#968372] mt-3 italic text-right font-serif-vintage">
                    click any prompt to write ♡
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: The Stationery Letter Card */}
            <div className="lg:col-span-7">
              <div className="relative max-w-xl mx-auto lg:ml-auto">
                
                {/* Paperclip Graphic at Top-Left */}
                <div
                  className="absolute -top-4 left-6 sm:left-10 z-20 w-8 h-12 pointer-events-none drop-shadow-md select-none transform -rotate-6"
                  title="Paperclip"
                >
                  <svg viewBox="0 0 32 48" fill="none" className="w-full h-full">
                    <path
                      d="M12 8 C12 4, 20 4, 20 8 L20 34 C20 42, 6 42, 6 34 L6 14 C6 8, 16 8, 16 14 L16 32"
                      stroke="#786c5e"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 8 C12 4, 20 4, 20 8 L20 34 C20 42, 6 42, 6 34 L6 14 C6 8, 16 8, 16 14 L16 32"
                      stroke="#dcd0bf"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Stationery Sheet Paper */}
                <div className="bg-[#FAF5E8] text-[#2c1d1a] rounded-2xl shadow-[0_20px_50px_-15px_rgba(70,15,30,0.35),0_0_0_1px_rgba(226,213,195,0.8)] border border-[#e2d5c3] p-6 sm:p-9 relative overflow-hidden transition-all duration-300">
                  
                  {/* Subtle Paper Lines */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-[0.03]"
                    style={{
                      backgroundImage: `repeating-linear-gradient(0deg, #000, #000 1px, transparent 1px, transparent 28px)`,
                    }}
                  />

                  {/* Inner decorative framing border */}
                  <div className="border border-[#e4d8c7] rounded-xl p-5 sm:p-7 relative z-10 bg-[#FAF5E8]/80">
                    
                    {/* Header: WRITE YOUR LETTER */}
                    <div className="flex items-center justify-between border-b border-[#e4d8c7] pb-3 mb-5">
                      <div className="flex items-center gap-2 text-xs font-bold tracking-[0.25em] text-[#7c2237] uppercase">
                        <span>✉</span>
                        <span>WRITE YOUR LETTER</span>
                      </div>
                      <div className="text-[11px] font-mono text-[#8c7768]">
                        JU 52 • {today.getFullYear()}-{unlockYear}
                      </div>
                    </div>

                    <form onSubmit={handleSealCapsule} className="space-y-4">
                      {/* Name Field */}
                      <div className="space-y-1 text-left">
                        <label className="text-xs font-medium text-[#4a3a34] flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#7c2237]" />
                          Your name (optional)
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Al-Amin (or leave blank)"
                          className="w-full bg-[#fdfbf6] border border-[#d9cdbc] rounded-xl px-3.5 py-2.5 text-sm text-[#2c1d1a] placeholder:text-[#a89b8d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7c2237]/20 focus:border-[#7c2237] transition-all"
                        />
                      </div>

                      {/* Email Field */}
                      <div className="space-y-1 text-left">
                        <label className="text-xs font-medium text-[#4a3a34] flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-[#7c2237]" />
                          Your email address
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full bg-[#fdfbf6] border border-[#d9cdbc] rounded-xl px-3.5 py-2.5 text-sm text-[#2c1d1a] placeholder:text-[#a89b8d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7c2237]/20 focus:border-[#7c2237] transition-all"
                        />
                        <p className="text-[10px] text-[#8c7768] italic">
                          We'll send your letter to you in 10 years.
                        </p>
                      </div>

                      {/* Delivery Date Field */}
                      <div className="space-y-1 text-left">
                        <label className="text-xs font-medium text-[#4a3a34] flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#7c2237]" />
                          When should we deliver it?
                        </label>
                        <div className="w-full bg-[#f4ebe0] border border-[#d6c7b3] rounded-xl px-3.5 py-2.5 text-sm text-[#4a3a34] flex items-center justify-between select-none">
                          <span className="font-medium text-xs sm:text-sm">
                            {deliveryDateStr} (10 years from today)
                          </span>
                          <span className="text-[11px] font-semibold text-[#7c2237] bg-[#7c2237]/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        </div>
                      </div>

                      {/* Textarea Field */}
                      <div className="space-y-1 text-left">
                        <label className="text-xs font-serif-vintage italic text-[#4a3a34] flex items-center gap-1.5">
                          <PenTool className="w-3.5 h-3.5 text-[#7c2237]" />
                          Dear future me...
                        </label>
                        <div className="relative">
                          <textarea
                            ref={textareaRef}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            maxLength={2000}
                            rows={6}
                            placeholder="Dear future me,&#10;&#10;I hope life has been kind to you. Today in 2026 at Jahangirnagar University, here is what is in my heart..."
                            className="w-full bg-[#fdfbf6] border border-[#d9cdbc] rounded-xl p-3.5 pb-8 text-sm sm:text-base text-[#2c1d1a] leading-relaxed placeholder:text-[#a89b8d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7c2237]/20 focus:border-[#7c2237] transition-all resize-none font-serif-vintage"
                            required
                          />
                          {/* Character Counter */}
                          <div className="absolute bottom-2.5 right-3 text-[11px] font-mono text-[#8c7768] select-none bg-[#fdfbf6]/90 px-1.5 py-0.5 rounded">
                            {message.length} / 2000
                          </div>
                        </div>
                      </div>

                      {/* CTA Button: Seal My Letter ✈ */}
                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full group bg-[#7c2237] hover:bg-[#922841] active:scale-[0.99] text-white text-sm sm:text-base font-semibold py-3.5 px-6 rounded-full shadow-lg shadow-[#7c2237]/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                          <span>
                            {isSubmitting
                              ? "Sealing your capsule..."
                              : "Seal My Letter"}
                          </span>
                          <span className="text-base group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform">
                            ✈
                          </span>
                        </button>
                      </div>

                      {/* Privacy Footnote */}
                      <div className="text-center text-xs text-[#8c7768] flex items-center justify-center gap-1.5 pt-1">
                        <Lock className="w-3.5 h-3.5 text-[#7c2237]" />
                        <span>Your letter will be kept safe and private.</span>
                      </div>
                    </form>

                  </div>
                </div>

              </div>
            </div>

          </div>
        ) : (
          /* Sealed State: Authentic Parchment Certificate */
          <div className="max-w-xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500 pt-4">
            
            {/* Visual Certificate Card for Download */}
            <div
              ref={certRef}
              className="relative bg-[#FAF5E8] text-[#2c1d1a] rounded-3xl p-8 sm:p-12 shadow-2xl border-4 border-[#7c2237]/30 text-center space-y-6 overflow-hidden"
            >
              {/* Subtle watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
                <span className="font-serif-vintage text-8xl font-black">
                  JU 52
                </span>
              </div>

              {/* Digital Wax Seal Stamp */}
              <div className="relative mx-auto w-24 h-24 rounded-full bg-gradient-to-tr from-[#521323] via-[#7c2237] to-[#992944] flex flex-col items-center justify-center text-amber-100 shadow-xl shadow-[#7c2237]/40 ring-8 ring-[#7c2237]/20 select-none">
                <Lock className="w-8 h-8 text-amber-200" />
                <span className="text-[9px] font-black uppercase tracking-widest mt-1 text-amber-100">
                  SEALED
                </span>
                <span className="text-[7px] text-amber-200/80 tracking-tighter">
                  {today.getFullYear()} - {unlockYear}
                </span>
              </div>

              {/* Titles */}
              <div className="space-y-1 relative z-10">
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#7c2237]">
                  Official Time Capsule Vault
                </span>
                <h2 className="font-serif-vintage text-2xl sm:text-3xl font-bold text-[#2c1d1a]">
                  Jahangirnagar University
                </h2>
                <p className="text-xs text-[#786656]">
                  Certificate ID:{" "}
                  <span className="font-mono font-bold text-[#7c2237]">
                    {sealedData?.id}
                  </span>
                </p>
              </div>

              {/* Certificate Body Text */}
              <div className="py-5 border-y border-[#dcd0bf] max-w-sm mx-auto space-y-2 relative z-10">
                <p className="text-xs text-[#786656] italic">
                  This certifies that a future letter written by
                </p>
                <h3 className="font-serif-vintage text-xl sm:text-2xl font-bold text-[#2c1d1a]">
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
                <div className="text-[#7c2237] font-bold">
                  Unlock Date: {sealedData?.deliveryDate}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleDownloadCertificate}
                className="bg-[#7c2237] hover:bg-[#922841] text-white py-3 px-6 rounded-full font-medium text-sm flex items-center justify-center gap-2 shadow-md w-full sm:w-auto cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download Certificate
              </button>
              <button
                onClick={handleShare}
                className="bg-white hover:bg-stone-50 text-[#7c2237] border border-[#e2d5c3] py-3 px-6 rounded-full font-medium text-sm flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={() => {
                  setIsSealed(false);
                  setMessage("");
                  setName("");
                  setEmail("");
                }}
                className="text-[#7c2237] hover:underline text-xs py-2 px-4 cursor-pointer"
              >
                Write Another Letter
              </button>
            </div>

          </div>
        )}

        {/* Mobile-Only Prompts Sticky Note */}
        {!isSealed && (
          <div className="lg:hidden mt-8 flex justify-center">
            <div className="relative bg-[#FFF9E5] text-[#3d2e24] p-5 rounded-2xl shadow-xl border border-[#ebdcb9] max-w-sm w-full transform -rotate-1 hover:rotate-0 transition-transform duration-300">
              <div className="absolute -top-3.5 left-8 select-none pointer-events-none drop-shadow">
                <span className="text-2xl">📌</span>
              </div>
              <div className="text-xs font-bold text-[#69543f] mb-3 flex items-center gap-1.5 pt-1">
                <HelpCircle className="w-4 h-4 text-[#7c2237]" />
                <span>A few prompts, if you need them:</span>
              </div>
              <div className="space-y-2 text-xs text-[#4a392d]">
                {prompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleInsertPrompt(prompt)}
                    className="block text-left w-full hover:text-[#7c2237] transition-all cursor-pointer font-serif-vintage italic"
                  >
                    • {prompt}
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-[#968372] mt-3 italic text-right font-serif-vintage">
                click any prompt to write ♡
              </div>
            </div>
          </div>
        )}

        {/* Bottom Elements: Countdown & Cursive Tagline */}
        <div className="mt-12 sm:mt-16 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-[#e2d5c3]/60 pt-6">
          {/* Countdown Pill */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-md border border-[#e2d5c3] text-xs sm:text-sm text-[#4a322e] font-medium shadow-sm">
            <span className="text-[#7c2237] text-base">⌛</span>
            <span>
              <strong className="text-[#7c2237] font-mono font-bold">
                {daysLeft.toLocaleString()}
              </strong>{" "}
              days until your future self opens this.
            </span>
          </div>

          {/* Right Cursive Note */}
          <div className="font-cursive text-2xl sm:text-3xl text-[#7c2237] italic tracking-wide select-none drop-shadow-xs">
            Small words. Big tomorrows. ♡
          </div>
        </div>

      </main>
    </div>
  );
}
