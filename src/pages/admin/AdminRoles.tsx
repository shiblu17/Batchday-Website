import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Key,
  Check,
  Copy,
  Edit,
  Trash2,
  Lock,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff,
  Film,
  MessageCircleHeart,
  CreditCard,
  QrCode,
  ImageIcon,
  Trophy,
  CalendarDays,
  Download,
  Settings,
  ShieldAlert,
  Search,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ADMIN_SECTIONS,
  type AdminSectionKey,
  type ModeratorUser,
  fetchModerators,
  saveModerators,
  hashModeratorPassword,
} from "@/utils/adminPermissionsService";
import { toast } from "sonner";

// Mapping icon names to Lucide icons
const SECTION_ICONS: Record<string, any> = {
  Film,
  MessageCircleHeart,
  CreditCard,
  QrCode,
  ImageIcon,
  Trophy,
  CalendarDays,
  Download,
  Settings,
  GraduationCap,
};

// 1-Click Role Presets
interface RolePreset {
  name: string;
  roleTitle: string;
  sections: AdminSectionKey[];
  badgeColor: string;
  icon: any;
}

const ROLE_PRESETS: RolePreset[] = [
  {
    name: "রিলস মডারেটর",
    roleTitle: "রিলস মডারেটর",
    sections: ["reels"],
    badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    icon: Film,
  },
  {
    name: "কনফেশন মডারেটর",
    roleTitle: "কনফেশন মডারেটর",
    sections: ["confessions"],
    badgeColor: "bg-pink-500/10 text-pink-600 border-pink-500/20",
    icon: MessageCircleHeart,
  },
  {
    name: "গেট স্ক্যানার",
    roleTitle: "গেট ভেরিফায়ার",
    sections: ["scanner"],
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icon: QrCode,
  },
  {
    name: "পেমেন্ট ভেরিফায়ার",
    roleTitle: "পেমেন্ট অফিসার",
    sections: ["payments"],
    badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: CreditCard,
  },
  {
    name: "মিডিয়া ও গ্যালারি",
    roleTitle: "মিডিয়া টিম",
    sections: ["gallery", "reels"],
    badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: ImageIcon,
  },
  {
    name: "শিক্ষার্থী ডেটাবেজ অ্যাডমিন",
    roleTitle: "ডেটাবেজ মডারেটর",
    sections: ["students"],
    badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: GraduationCap,
  },
  {
    name: "অল-রাউন্ডার (নন-ফাইন্যান্স)",
    roleTitle: "ইভেন্ট কো-অর্ডিনেটর",
    sections: ["reels", "confessions", "scanner", "gallery", "leaderboard", "timeline"],
    badgeColor: "bg-primary/10 text-primary border-primary/20",
    icon: Sparkles,
  },
];

export default function AdminRoles() {
  const { isSuperAdmin, user } = useAuth();
  const [moderators, setModerators] = useState<ModeratorUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog State for Add/Edit
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedModerator, setSelectedModerator] = useState<ModeratorUser | null>(null);

  // Form Fields
  const [formId, setFormId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRoleTitle, setFormRoleTitle] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formAllowedSections, setFormAllowedSections] = useState<AdminSectionKey[]>([]);
  const [formIsActive, setFormIsActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New Password state for password reset
  const [newPassword, setNewPassword] = useState("");

  // Load moderators on mount
  useEffect(() => {
    loadModeratorsList();
  }, []);

  const loadModeratorsList = async () => {
    setIsLoading(true);
    try {
      const data = await fetchModerators();
      setModerators(data);
    } catch (err) {
      toast.error("মডারেটরদের তালিকা লোড করতে সমস্যা হয়েছে");
    } finally {
      setIsLoading(false);
    }
  };

  // Open modal for new moderator
  const handleOpenAdd = () => {
    setFormId(null);
    setFormName("");
    setFormEmail("");
    setFormRoleTitle("মডারেটর");
    setFormPassword("");
    setFormAllowedSections(["reels"]);
    setFormIsActive(true);
    setShowPassword(false);
    setIsDialogOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (mod: ModeratorUser) => {
    setFormId(mod.id);
    setFormName(mod.name);
    setFormEmail(mod.email);
    setFormRoleTitle(mod.roleTitle);
    setFormPassword(""); // Leave empty unless changing
    setFormAllowedSections(mod.allowedSections || []);
    setFormIsActive(mod.isActive);
    setShowPassword(false);
    setIsDialogOpen(true);
  };

  // Apply Role Preset
  const handleApplyPreset = (preset: RolePreset) => {
    setFormRoleTitle(preset.roleTitle);
    setFormAllowedSections(preset.sections);
    toast.info(`'${preset.name}' প্রিসেট সক্রিয় করা হয়েছে`);
  };

  // Toggle individual section permission
  const handleToggleSection = (key: AdminSectionKey) => {
    setFormAllowedSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Select / Deselect All
  const handleSelectAll = () => {
    setFormAllowedSections(ADMIN_SECTIONS.map((s) => s.key));
  };
  const handleDeselectAll = () => {
    setFormAllowedSections([]);
  };

  // Save Moderator (Create or Update)
  const handleSaveModerator = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = formEmail.toLowerCase().trim();
    const cleanName = formName.trim();
    const cleanTitle = formRoleTitle.trim();

    if (!cleanName || !cleanEmail || !cleanTitle) {
      toast.error("অনুগ্রহ করে নাম, ইমেইল এবং পদবী পূরণ করুন");
      return;
    }

    if (!formId && !formPassword.trim()) {
      toast.error("নতুন মডারেটরের জন্য পাসওয়ার্ড প্রদান করা আবশ্যক");
      return;
    }

    if (formAllowedSections.length === 0) {
      toast.error("কমপক্ষে একটি সেকশনের অনুমতি নির্বাচন করুন");
      return;
    }

    setIsSaving(true);
    try {
      let updatedList = [...moderators];

      if (formId) {
        // Updating existing
        const index = updatedList.findIndex((m) => m.id === formId);
        if (index !== -1) {
          const current = updatedList[index];
          let passwordHash = current.passwordHash;
          if (formPassword.trim()) {
            passwordHash = await hashModeratorPassword(formPassword.trim());
          }

          updatedList[index] = {
            ...current,
            name: cleanName,
            email: cleanEmail,
            roleTitle: cleanTitle,
            passwordHash,
            allowedSections: formAllowedSections,
            isActive: formIsActive,
            updatedAt: new Date().toISOString(),
          };
        }
      } else {
        // Creating new
        const exists = updatedList.some((m) => m.email.toLowerCase() === cleanEmail);
        if (exists) {
          toast.error("এই ইমেইল দিয়ে ইতিমধ্যে একজন মডারেটর রয়েছে!");
          setIsSaving(false);
          return;
        }

        const passwordHash = await hashModeratorPassword(formPassword.trim());
        const newMod: ModeratorUser = {
          id: `mod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          email: cleanEmail,
          name: cleanName,
          roleTitle: cleanTitle,
          passwordHash,
          allowedSections: formAllowedSections,
          isActive: formIsActive,
          createdAt: new Date().toISOString(),
        };

        updatedList.push(newMod);
      }

      const success = await saveModerators(updatedList);
      if (success) {
        setModerators(updatedList);
        setIsDialogOpen(false);
        toast.success(
          formId ? "মডারেটরের তথ্য সফলভাবে আপডেট হয়েছে!" : "নতুন মডারেটর সফলভাবে তৈরি হয়েছে!"
        );
      } else {
        toast.error("তথ্য সেভ করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।");
      }
    } catch (err) {
      toast.error("একটি অপ্রত্যাশিত ত্রুটি ঘটেছে");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Active/Inactive status
  const handleToggleStatus = async (mod: ModeratorUser) => {
    const updated = moderators.map((m) =>
      m.id === mod.id ? { ...m, isActive: !m.isActive, updatedAt: new Date().toISOString() } : m
    );
    setModerators(updated);
    const success = await saveModerators(updated);
    if (success) {
      toast.success(
        mod.isActive ? `'${mod.name}' ডিঅ্যাক্টিভ করা হয়েছে` : `'${mod.name}' সক্রিয় করা হয়েছে`
      );
    } else {
      toast.error("স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে");
      loadModeratorsList();
    }
  };

  // Delete Moderator
  const handleDeleteModerator = async () => {
    if (!selectedModerator) return;
    setIsSaving(true);
    try {
      const updated = moderators.filter((m) => m.id !== selectedModerator.id);
      const success = await saveModerators(updated);
      if (success) {
        setModerators(updated);
        setIsDeleteDialogOpen(false);
        setSelectedModerator(null);
        toast.success("মডারেটর মুছে ফেলা হয়েছে!");
      } else {
        toast.error("মুছতে সমস্যা হয়েছে");
      }
    } catch {
      toast.error("ব্যর্থ হয়েছে");
    } finally {
      setIsSaving(false);
    }
  };

  // Password Reset
  const handleResetPassword = async () => {
    if (!selectedModerator || !newPassword.trim()) {
      toast.error("নতুন পাসওয়ার্ড লিখুন");
      return;
    }
    setIsSaving(true);
    try {
      const passwordHash = await hashModeratorPassword(newPassword.trim());
      const updated = moderators.map((m) =>
        m.id === selectedModerator.id
          ? { ...m, passwordHash, updatedAt: new Date().toISOString() }
          : m
      );
      const success = await saveModerators(updated);
      if (success) {
        setModerators(updated);
        setIsPasswordResetOpen(false);
        toast.success(`'${selectedModerator.name}' এর পাসওয়ার্ড পরিবর্তন করা হয়েছে!`);
        setNewPassword("");
      } else {
        toast.error("পাসওয়ার্ড আপডেট ব্যর্থ হয়েছে");
      }
    } catch {
      toast.error("ত্রুটি ঘটেছে");
    } finally {
      setIsSaving(false);
    }
  };

  // Copy Login credentials snippet
  const handleCopyCredentials = (mod: ModeratorUser) => {
    const text = `🔐 JU-52 ব্যাচ ডে অ্যাডমিন অ্যাক্সেস\n👤 নাম: ${mod.name}\n🏷️ পদবী: ${mod.roleTitle}\n📧 ইমেইল: ${mod.email}\n🌐 লগইন লিংক: https://batchday52ju.xyz/admin/login\n\n📌 আপনার অনুমোদিত সেকশনসমূহে কাজ শুরু করার জন্য উপরের লিংকে গিয়ে লগইন করুন।`;
    navigator.clipboard.writeText(text);
    toast.success("লগইন নির্দেশিকা ক্লিপবোর্ডে কপি হয়েছে!");
  };

  // Filter moderators by search query
  const filteredModerators = moderators.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.roleTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <ShieldAlert className="w-12 h-12 text-destructive mb-3" />
        <h2 className="text-xl font-bold">অ্যাক্সেস সংরক্ষিত</h2>
        <p className="text-sm text-muted-foreground mt-1">
          শুধুমাত্র প্রধান সুপার অ্যাডমিন টিম ও পারমিশন নিয়ন্ত্রণ করতে পারবেন।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
              👑 সুপার অ্যাডমিন কন্ট্রোল
            </span>
            <span className="text-xs text-muted-foreground">
              {user?.email}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-display tracking-tight text-foreground flex items-center gap-3">
            টিম ও রোল পারমিশন
            <ShieldCheck className="w-7 h-7 text-primary shrink-0" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            স্বেচ্ছাসেবক ও সহকারীদের পুরো অ্যাডমিন কন্ট্রোল না দিয়ে কেবল নির্দিষ্ট সেকশনের
            (রিলস, কনফেশনস, স্ক্যানার বা গ্যালারি) চেক-বক্স পারমিশন প্রদান করুন।
          </p>
        </div>

        <div className="flex items-center gap-2 z-10 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={loadModeratorsList}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            রিফ্রেশ
          </Button>
          <Button onClick={handleOpenAdd} className="gap-2 shadow-md shadow-primary/20">
            <UserPlus className="w-4 h-4" />
            + নতুন মডারেটর
          </Button>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">মোট মডারেটর</p>
            <p className="text-2xl font-bold font-display">{moderators.length}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">সক্রিয় সহকারী</p>
            <p className="text-2xl font-bold font-display text-emerald-600">
              {moderators.filter((m) => m.isActive).length}
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">নিরাপত্তা এনক্রিপশন</p>
            <p className="text-sm font-semibold text-blue-600 flex items-center gap-1 mt-1">
              <Check className="w-4 h-4" /> SHA-256 সল্টেড
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="নাম, ইমেইল বা পদবী খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <div className="text-xs text-muted-foreground self-end sm:self-center">
          দেখাচ্ছে: {filteredModerators.length} জন মডারেটর
        </div>
      </div>

      {/* Moderators List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-card border border-border rounded-2xl">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">মডারেটরদের তালিকা লোড হচ্ছে...</p>
        </div>
      ) : filteredModerators.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-dashed border-border rounded-2xl p-6">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-3 text-muted-foreground">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold">কোনো মডারেটর পাওয়া যায়নি</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            {searchQuery
              ? "আপনার সার্চ অনুসন্ধানের সাথে কোনো মডারেটর মেলেনি।"
              : "এখনও কাউকে মডারেটর হিসেবে যুক্ত করা হয়নি। নির্দিষ্ট সেকশনের দায়িত্ব দিতে নতুন মডারেটর যুক্ত করুন।"}
          </p>
          {!searchQuery && (
            <Button onClick={handleOpenAdd} className="mt-4 gap-2">
              <UserPlus className="w-4 h-4" />
              প্রথম মডারেটর যুক্ত করুন
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredModerators.map((mod) => (
              <motion.div
                key={mod.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-card border rounded-2xl p-5 shadow-sm transition-all duration-200 flex flex-col justify-between ${
                  mod.isActive
                    ? "border-border hover:border-primary/40 hover:shadow-md"
                    : "border-border/50 opacity-60 bg-muted/20"
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border border-primary/20 shrink-0">
                        {mod.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-sm line-clamp-1">{mod.name}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-1">{mod.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={mod.isActive}
                        onCheckedChange={() => handleToggleStatus(mod)}
                        title={mod.isActive ? "সক্রিয় (ক্লিক করে নিষ্ক্রিয় করুন)" : "নিষ্ক্রিয়"}
                      />
                    </div>
                  </div>

                  {/* Role Title Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-secondary/15 text-secondary-foreground border border-secondary/30">
                      🛡️ {mod.roleTitle}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        mod.isActive
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {mod.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                    </span>
                  </div>

                  {/* Allowed Sections Badges */}
                  <div className="mb-4">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      অনুমোদিত সেকশন ({mod.allowedSections?.length || 0})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {mod.allowedSections?.map((secKey) => {
                        const secMeta = ADMIN_SECTIONS.find((s) => s.key === secKey);
                        const Icon = secMeta ? SECTION_ICONS[secMeta.iconName] || Shield : Shield;
                        return (
                          <span
                            key={secKey}
                            className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border ${
                              secMeta?.isSensitive
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                : "bg-muted/80 text-foreground border-border"
                            }`}
                          >
                            <Icon className="w-3 h-3" />
                            {secMeta?.title || secKey}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-border flex items-center justify-between gap-2 mt-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => handleCopyCredentials(mod)}
                    title="লগইন নির্দেশিকা কপি করুন"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    কপি লিংক
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => {
                        setSelectedModerator(mod);
                        setNewPassword("");
                        setIsPasswordResetOpen(true);
                      }}
                      title="পাসওয়ার্ড পরিবর্তন"
                    >
                      <Key className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleOpenEdit(mod)}
                      title="এডিট করুন"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        setSelectedModerator(mod);
                        setIsDeleteDialogOpen(true);
                      }}
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add / Edit Moderator Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-display flex items-center gap-2">
              {formId ? <Edit className="w-5 h-5 text-primary" /> : <UserPlus className="w-5 h-5 text-primary" />}
              {formId ? "মডারেটরের তথ্য পরিবর্তন করুন" : "নতুন মডারেটর যুক্ত করুন"}
            </DialogTitle>
            <DialogDescription>
              সহকারী বা ভলান্টিয়ারের তথ্য দিন এবং তারা কোন কোন সেকশনে কাজ করবেন তা নির্ধারণ করুন।
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveModerator} className="space-y-5 pt-2">
            {/* Basic Info Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="mod-name" className="text-xs font-semibold">
                  নাম <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="mod-name"
                  placeholder="যেমন: তানভীর হাসান"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mod-email" className="text-xs font-semibold">
                  ইমেইল অ্যাড্রেস <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="mod-email"
                  type="email"
                  placeholder="example@gmail.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mod-role" className="text-xs font-semibold">
                  পদবী / রোল টাইটেল <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="mod-role"
                  placeholder="যেমন: রিলস মডারেটর / গেট ভেরিফায়ার"
                  value={formRoleTitle}
                  onChange={(e) => setFormRoleTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mod-pass" className="text-xs font-semibold">
                  {formId ? "নতুন পাসওয়ার্ড (পরিবর্তন করতে চাইলে)" : "লগইন পাসওয়ার্ড *" }
                </Label>
                <div className="relative">
                  <Input
                    id="mod-pass"
                    type={showPassword ? "text" : "password"}
                    placeholder={formId ? "অপরিবর্তিত রাখতে ফাঁকা রাখুন" : "একটি শক্তিশালী পাসওয়ার্ড দিন"}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    required={!formId}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* 1-Click Role Presets */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  এক-ক্লিকে রোল প্রিসেট বাছাই করুন
                </Label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ROLE_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${preset.badgeColor}`}
                  >
                    <preset.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Section Checkboxes */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    অনুমোদিত সেকশনসমূহ ({formAllowedSections.length}/{ADMIN_SECTIONS.length})
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    যে যে সেকশনে টিক চিহ্ন থাকবে, এই মডারেটর শুধুমাত্র সেগুলোতে প্রবেশ করতে পারবেন।
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px] px-2 text-primary"
                    onClick={handleSelectAll}
                  >
                    সব সিলেক্ট
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px] px-2 text-muted-foreground"
                    onClick={handleDeselectAll}
                  >
                    সব বাতিল
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ADMIN_SECTIONS.map((section) => {
                  const isChecked = formAllowedSections.includes(section.key);
                  const Icon = SECTION_ICONS[section.iconName] || Shield;

                  return (
                    <div
                      key={section.key}
                      onClick={() => handleToggleSection(section.key)}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                        isChecked
                          ? "bg-primary/5 border-primary/40 shadow-xs"
                          : "bg-card border-border hover:bg-muted/30"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${
                          isChecked
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30 bg-background"
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-xs font-bold text-foreground">
                            {section.title}
                          </span>
                          {section.isSensitive && (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1 py-0 bg-amber-500/10 text-amber-600 border-amber-500/30"
                            >
                              সংবেদনশীল
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {section.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border">
              <div>
                <Label className="text-xs font-bold">অ্যাকাউন্ট স্ট্যাটাস</Label>
                <p className="text-[11px] text-muted-foreground">
                  সক্রিয় রাখলে এই মডারেটর লগইন করতে পারবেন।
                </p>
              </div>
              <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
              >
                বাতিল
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {formId ? "আপডেট করুন" : "সংরক্ষণ করুন"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={isPasswordResetOpen} onOpenChange={setIsPasswordResetOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              পাসওয়ার্ড পরিবর্তন করুন
            </DialogTitle>
            <DialogDescription>
              {selectedModerator?.name} ({selectedModerator?.email}) এর জন্য একটি নতুন পাসওয়ার্ড সেট করুন।
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">নতুন পাসওয়ার্ড</Label>
              <Input
                type="text"
                placeholder="যেমন: ju52@secret2026"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                পাসওয়ার্ডটি সেভ করে মডারেটরের সাথে শেয়ার করুন।
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPasswordResetOpen(false)}
              disabled={isSaving}
            >
              বাতিল
            </Button>
            <Button onClick={handleResetPassword} disabled={isSaving || !newPassword.trim()}>
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : "পাসওয়ার্ড সেভ করুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              মডারেটর মুছে ফেলবেন?
            </DialogTitle>
            <DialogDescription>
              আপনি কি নিশ্চিতভাবে{" "}
              <strong className="text-foreground">{selectedModerator?.name}</strong> কে মডারেটর তালিকা
              থেকে মুছে ফেলতে চান? এর ফলে তিনি আর অ্যাডমিন প্যানেলে লগইন করতে পারবেন না।
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSaving}
            >
              বাতিল
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteModerator}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              হ্যাঁ, মুছে ফেলুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
