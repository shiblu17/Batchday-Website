import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  GraduationCap,
  Search,
  Plus,
  Pencil,
  Trash2,
  Download,
  Building2,
  Users,
  Radio,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  FilterX,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import initialVoters from "@/data/voters.json";
import { fetchAllBatch52Students } from "@/utils/studentDataService";

export const JU_52_DEPARTMENTS = [
  "Accounting and Information Systems",
  "Anthropology",
  "Archaeology",
  "Bangla",
  "Biochemistry and Molecular Biology",
  "Biotechnology and Genetic Engineering",
  "Botany",
  "Chemistry",
  "Computer Science and Engineering",
  "Drama and Dramatics",
  "Economics",
  "English",
  "Environmental Sciences",
  "Finance and Banking",
  "Fine Art",
  "Geography and Environment",
  "Geological Sciences",
  "Government and Politics",
  "History",
  "Institute of Business Administration (IBA-JU)",
  "Institute of Comparative Literature and Culture (ICLC)",
  "Institute of Information Technology (IIT)",
  "International Relations",
  "Journalism and Media Studies",
  "Law and Justice",
  "Management Studies",
  "Marketing",
  "Mathematics",
  "Microbiology",
  "Pharmacy",
  "Philosophy",
  "Physics",
  "Public Administration",
  "Public Health and Informatics",
  "Statistics and Data Science",
  "Urban and Regional Planning",
  "Zoology",
];

export const JU_52_HALLS = [
  "A F M Kamaluddin Hall",
  "Al Beruni Hall",
  "Begum Khaleda Zia Hall",
  "Begum Sufia Kamal Hall",
  "Bir Protik Taramon Bibi Hall",
  "Bishwakabi Rabindranath Tagore Hall",
  "Fazilatunnesa Hall",
  "Jahanara Imam Hall",
  "Jatiya Kabi Kazi Nazrul Islam Hall",
  "JULY-24 JAGORONI HALL",
  "Mir Mosharraf Hossain Hall",
  "Mowlana Bhashani Hall",
  "Nawab Faizunnesa Hall",
  "NAWAB SALIMULLAH HALL",
  "Pritilata Hall",
  "SHAHEED FELANI KHATUN HALL",
  "Shaheed Rafiq-Jabbar Hall",
  "Shaheed Salam-Barkat Hall",
  "SHER-E-BANGLA A. K. FAZLUL HUQ HALL",
];

interface Student {
  id: string;
  name: string;
  department: string;
  hall: string;
  reg_no: string;
  roll_no: string;
  session?: string;
  sl_no?: number | null;
}

export default function AdminStudents() {
  // Start with local bundled data for 0ms initial load
  const [students, setStudents] = useState<Student[]>(() =>
    (initialVoters as any[]).map((v, idx) => ({
      id: v.id || `local_${idx}`,
      name: v.name,
      department: v.dept,
      hall: v.hall,
      reg_no: v.regNo || "",
      roll_no: v.rollNo || "",
      session: "2022-2023",
      sl_no: idx + 1,
    }))
  );

  const [loading, setLoading] = useState(true);
  const [realtimeActive, setRealtimeActive] = useState(false);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedHall, setSelectedHall] = useState("ALL");
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Form states
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    department: JU_52_DEPARTMENTS[0],
    hall: JU_52_HALLS[0],
    reg_no: "",
    roll_no: "",
  });

  const [saving, setSaving] = useState(false);

  // Fetch all students from Supabase (bypassing 1000 row limit) & Setup Realtime Listener
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const allData = await fetchAllBatch52Students();
      if (allData && allData.length > 0) {
        setStudents(allData as Student[]);
      }
    } catch (err: any) {
      console.error("Supabase fetch error:", err);
      toast.error("সুপাবেজ থেকে ডেটা লোড করা যায়নি: " + (err?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();

    // Setup Supabase Realtime WebSocket subscription
    const channel = supabase
      .channel("admin_batch52_students_live_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "batch52_students" },
        (payload) => {
          setRealtimeActive(true);
          console.log("⚡ [Realtime Admin Sync] Event:", payload.eventType);

          if (payload.eventType === "INSERT" && payload.new) {
            const n: any = payload.new;
            setStudents((prev) => [
              n,
              ...prev.filter((s) => s.id !== n.id),
            ]);
            toast.success(`নতুন শিক্ষার্থী "${n.name}" রিয়েল-টাইমে যুক্ত হয়েছে!`);
          } else if (payload.eventType === "UPDATE" && payload.new) {
            const u: any = payload.new;
            setStudents((prev) =>
              prev.map((s) => (s.id === u.id ? { ...s, ...u } : s))
            );
            toast.info(`শিক্ষার্থী "${u.name}" এর তথ্য রিয়েল-টাইমে আপডেট হয়েছে!`);
          } else if (payload.eventType === "DELETE" && payload.old) {
            const d: any = payload.old;
            setStudents((prev) => prev.filter((s) => s.id !== d.id));
            toast.warning(`একটি রেকর্ড রিয়েল-টাইমে মুছে ফেলা হয়েছে।`);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeActive(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    const q = search.toLowerCase().trim();
    return students.filter((s) => {
      if (selectedDept !== "ALL" && s.department !== selectedDept) return false;
      if (selectedHall !== "ALL" && s.hall !== selectedHall) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.reg_no.toLowerCase().includes(q) ||
        s.roll_no.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        s.hall.toLowerCase().includes(q)
      );
    });
  }, [students, search, selectedDept, selectedHall]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedDept, selectedHall, pageSize]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormData({
      name: "",
      department: JU_52_DEPARTMENTS[0],
      hall: JU_52_HALLS[0],
      reg_no: "",
      roll_no: "",
    });
    setAddModalOpen(true);
  };

  // Submit Add Student
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formData.name.trim().toUpperCase();
    const cleanReg = formData.reg_no.trim();
    const cleanRoll = formData.roll_no.trim();

    if (!cleanName || !cleanReg || !cleanRoll) {
      toast.error("নাম, রেজিস্ট্রেশন ও রোল নম্বর আবশ্যক!");
      return;
    }

    setSaving(true);
    const newId = `CUSTOM_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newStudent: Student = {
      id: newId,
      name: cleanName,
      department: formData.department,
      hall: formData.hall,
      reg_no: cleanReg,
      roll_no: cleanRoll,
      session: "2022-2023",
      sl_no: students.length + 1,
    };

    try {
      const { error } = await supabase.from("batch52_students").insert([newStudent as any]);
      if (error) {
        toast.error("সুপাবেজে যোগ করা যায়নি: " + error.message);
      } else {
        // Immediate local state update
        setStudents((prev) => [newStudent, ...prev.filter((s) => s.id !== newId)]);
        toast.success(`✓ শিক্ষার্থী "${cleanName}" সফলভাবে যুক্ত হয়েছে!`);
        setAddModalOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || "ত্রুটি হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      department: student.department,
      hall: student.hall,
      reg_no: student.reg_no,
      roll_no: student.roll_no,
    });
    setEditModalOpen(true);
  };

  // Submit Edit Student
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const cleanName = formData.name.trim().toUpperCase();
    const cleanReg = formData.reg_no.trim();
    const cleanRoll = formData.roll_no.trim();

    if (!cleanName || !cleanReg || !cleanRoll) {
      toast.error("নাম, রেজিস্ট্রেশন ও রোল নম্বর আবশ্যক!");
      return;
    }

    setSaving(true);
    const updatedPayload = {
      name: cleanName,
      department: formData.department,
      hall: formData.hall,
      reg_no: cleanReg,
      roll_no: cleanRoll,
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase
        .from("batch52_students")
        .update(updatedPayload as any)
        .eq("id", editingStudent.id);

      if (error) {
        toast.error("আপডেট করা যায়নি: " + error.message);
      } else {
        // Immediate local state update
        setStudents((prev) =>
          prev.map((s) =>
            s.id === editingStudent.id ? { ...s, ...updatedPayload } : s
          )
        );
        toast.success(`✓ "${cleanName}" এর তথ্য সফলভাবে আপডেট হয়েছে!`);
        setEditModalOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || "ত্রুটি হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (student: Student) => {
    setStudentToDelete(student);
    setDeleteConfirmOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("batch52_students")
        .delete()
        .eq("id", studentToDelete.id);

      if (error) {
        toast.error("মুছে ফেলা যায়নি: " + error.message);
      } else {
        setStudents((prev) => prev.filter((s) => s.id !== studentToDelete.id));
        toast.success(`✓ "${studentToDelete.name}" সফলভাবে মুছে ফেলা হয়েছে!`);
        setDeleteConfirmOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || "ত্রুটি হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  // Export JSON Backup
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(
      {
        metadata: {
          canonicalSession: "2022-2023",
          batchLabel: "JU 52nd Batch / ৫২তম আবর্তন",
          exportedAt: new Date().toISOString(),
          recordCount: filteredStudents.length,
        },
        records: filteredStudents,
      },
      null,
      2
    );

    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `JU52_Students_Database_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("JSON ফাইল সফলভাবে ডাউনলোড হয়েছে!");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner / Header */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-2">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>JU 52nd Batch Master Database</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-foreground tracking-tight">
              শিক্ষার্থী ডেটাবেজ ম্যানেজমেন্ট
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
              জাহাঙ্গীরনগর বিশ্ববিদ্যালয় ৫২তম আবর্তনের (সেশন ২০২২–২৩) শিক্ষার্থী তালিকা রিয়েল-টাইমে সংযোজন (Add), সংশোধন (Edit), বা বাতিল (Delete) করুন।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Realtime Status Badge */}
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                realtimeActive
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                  : "bg-muted text-muted-foreground border-border"
              }`}
            >
              <Radio
                className={`w-3.5 h-3.5 ${
                  realtimeActive ? "animate-pulse text-emerald-500" : ""
                }`}
              />
              <span>{realtimeActive ? "সুপাবেজ রিয়েলটাইম লাইভ" : "কানেক্টিং..."}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchStudents}
              disabled={loading}
              className="gap-1.5"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>রিফ্রেশ</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportJSON}
              className="gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON ব্যাকআপ</span>
            </Button>

            <Button
              onClick={handleOpenAdd}
              size="sm"
              className="gap-1.5 bg-primary text-primary-foreground font-bold shadow-md hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন শিক্ষার্থী যুক্ত করুন</span>
            </Button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-border/60">
          <div className="bg-muted/40 rounded-2xl p-4 border border-border/50">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>মোট শিক্ষার্থী</span>
              <Users className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="text-2xl font-black text-foreground mt-1">
              {students.length.toLocaleString()} <span className="text-xs font-semibold text-muted-foreground">জন</span>
            </div>
            <div className="text-[10px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              ১০০% ভেরিফাইড (সেশন ২২-২৩)
            </div>
          </div>

          <div className="bg-muted/40 rounded-2xl p-4 border border-border/50">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>আবাসিক হল</span>
              <Building2 className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-foreground mt-1">
              ১৯ <span className="text-xs font-semibold text-muted-foreground">টি হল</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              ছাত্র ও ছাত্রী হলসমূহ
            </div>
          </div>

          <div className="bg-muted/40 rounded-2xl p-4 border border-border/50">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>বিভাগ ও ইনস্টিটিউট</span>
              <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-foreground mt-1">
              ৩৭ <span className="text-xs font-semibold text-muted-foreground">টি বিভাগ</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              অফিশিয়াল কোড ভেরিফাইড
            </div>
          </div>

          <div className="bg-muted/40 rounded-2xl p-4 border border-border/50">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>ফিল্টারকৃত রেকর্ড</span>
              <Search className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {filteredStudents.length.toLocaleString()} <span className="text-xs font-semibold text-muted-foreground">জন</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              বর্তমান সার্চ ও ফিল্টারে
            </div>
          </div>
        </div>
      </div>

      {/* Controls & Filters Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Live Search Input */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="নাম, রোল, রেজি. নম্বর দিয়ে সার্চ করুন..."
              className="pl-9 bg-background rounded-xl"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="ALL">সকল বিভাগ ({JU_52_DEPARTMENTS.length}টি)</option>
              {JU_52_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Hall Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedHall}
              onChange={(e) => setSelectedHall(e.target.value)}
              className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="ALL">সকল হল ({JU_52_HALLS.length}টি)</option>
              {JU_52_HALLS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <div className="sm:col-span-1 flex justify-end">
            {(search || selectedDept !== "ALL" || selectedHall !== "ALL") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearch("");
                  setSelectedDept("ALL");
                  setSelectedHall("ALL");
                }}
                title="ফিল্টার ক্লিয়ার করুন"
              >
                <FilterX className="w-4 h-4 text-muted-foreground hover:text-destructive" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-muted-foreground font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">শিক্ষার্থীর নাম ও বিভাগ</th>
                <th className="py-3 px-4">হল ও সেশন</th>
                <th className="py-3 px-4">রেজিস্ট্রেশন ও রোল</th>
                <th className="py-3 px-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <p className="text-sm font-semibold">কোনো শিক্ষার্থী পাওয়া যায়নি!</p>
                    <p className="text-xs mt-1">সার্চ ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।</p>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((s, index) => {
                  const serialNumber = (currentPage - 1) * pageSize + index + 1;
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className="py-3 px-4 text-center text-muted-foreground font-mono">
                        {serialNumber}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-foreground text-sm tracking-tight">
                          {s.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {s.department}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">
                          {s.hall}
                        </div>
                        <Badge
                          variant="secondary"
                          className="mt-0.5 text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20"
                        >
                          সেশন ২০২২-২০২৩
                        </Badge>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <div className="text-foreground font-medium">
                          রেজি: {s.reg_no}
                        </div>
                        <div className="text-muted-foreground text-[11px]">
                          রোল: <span className="font-bold text-foreground">{s.roll_no}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(s)}
                            className="h-8 px-2.5 text-xs gap-1 border-blue-500/30 text-blue-600 hover:bg-blue-500 hover:text-white dark:hover:text-white"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>এডিট</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDelete(s)}
                            className="h-8 px-2.5 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>বাদ</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground bg-muted/20">
          <div className="flex items-center gap-2">
            <span>প্রতি পেজে:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-background border border-input rounded-lg px-2 py-1 text-xs outline-none"
            >
              <option value={25}>২৫</option>
              <option value={50}>৫০</option>
              <option value={100}>১০০</option>
              <option value={200}>২০০</option>
            </select>
            <span>
              মোট {filteredStudents.length} জনের মধ্যে {Math.min((currentPage - 1) * pageSize + 1, filteredStudents.length)}–
              {Math.min(currentPage * pageSize, filteredStudents.length)} দেখানো হচ্ছে
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2.5"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              পূর্ববর্তী
            </Button>

            <span className="px-3 font-semibold text-foreground">
              {currentPage} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-2.5"
            >
              পরবর্তী
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* MODAL 1: ➕ Add Student */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary inline-flex items-center justify-center text-sm">
                ➕
              </span>
              <span>নতুন শিক্ষার্থী যুক্ত করুন</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              জাহাঙ্গীরনগর বিশ্ববিদ্যালয় ৫২তম আবর্তনের শিক্ষার্থীর তথ্য ইনপুট দিন। এটি সরাসরি সুপাবেজ ক্লাউডে সংরক্ষিত হবে।
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 mt-2 text-xs">
            <div>
              <label className="block font-bold text-foreground mb-1">
                শিক্ষার্থীর পূর্ণ নাম *
              </label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="যেমন: MD. RAHIM HOSSAIN"
                className="bg-background rounded-xl uppercase text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-foreground mb-1">
                বিভাগ / ইনস্টিটিউট *
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                {JU_52_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-foreground mb-1">
                আবাসিক হল *
              </label>
              <select
                value={formData.hall}
                onChange={(e) => setFormData({ ...formData, hall: e.target.value })}
                className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                {JU_52_HALLS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-foreground mb-1">
                  রেজিস্ট্রেশন নম্বর *
                </label>
                <Input
                  required
                  value={formData.reg_no}
                  onChange={(e) => setFormData({ ...formData, reg_no: e.target.value })}
                  placeholder="2023xxxxxxx"
                  className="bg-background rounded-xl font-mono text-sm"
                />
              </div>
              <div>
                <label className="block font-bold text-foreground mb-1">
                  ক্লাস রোল নম্বর *
                </label>
                <Input
                  required
                  value={formData.roll_no}
                  onChange={(e) => setFormData({ ...formData, roll_no: e.target.value })}
                  placeholder="যেমন: 1540"
                  className="bg-background rounded-xl font-mono text-sm"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
              >
                বাতিল
              </Button>
              <Button type="submit" disabled={saving} className="font-bold">
                {saving ? "যোগ হচ্ছে..." : "যুক্ত করুন"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: ✏️ Edit Student */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <span className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 inline-flex items-center justify-center text-sm">
                ✏️
              </span>
              <span>শিক্ষার্থীর তথ্য সংশোধন করুন</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              পরিবর্তনগুলো সাথে সাথে সুপাবেজ ডেটাবেজে এবং ওয়েবসাইটে লাইভ কার্যকর হবে।
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 mt-2 text-xs">
            <div>
              <label className="block font-bold text-foreground mb-1">
                শিক্ষার্থীর পূর্ণ নাম *
              </label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-background rounded-xl uppercase text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-foreground mb-1">
                বিভাগ / ইনস্টিটিউট *
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                {JU_52_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-foreground mb-1">
                আবাসিক হল *
              </label>
              <select
                value={formData.hall}
                onChange={(e) => setFormData({ ...formData, hall: e.target.value })}
                className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                {JU_52_HALLS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-foreground mb-1">
                  রেজিস্ট্রেশন নম্বর *
                </label>
                <Input
                  required
                  value={formData.reg_no}
                  onChange={(e) => setFormData({ ...formData, reg_no: e.target.value })}
                  className="bg-background rounded-xl font-mono text-sm"
                />
              </div>
              <div>
                <label className="block font-bold text-foreground mb-1">
                  ক্লাস রোল নম্বর *
                </label>
                <Input
                  required
                  value={formData.roll_no}
                  onChange={(e) => setFormData({ ...formData, roll_no: e.target.value })}
                  className="bg-background rounded-xl font-mono text-sm"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
              >
                বাতিল
              </Button>
              <Button type="submit" disabled={saving} className="font-bold">
                {saving ? "আপডেট হচ্ছে..." : "আপডেট সেভ করুন"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: 🗑️ Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-3xl max-w-md p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
              <span>🗑️</span>
              <span>শিক্ষার্থী রেকর্ড মুছে ফেলতে চান?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground pt-2">
              আপনি কি নিশ্চিতভাবে{" "}
              <strong className="text-foreground font-bold">
                "{studentToDelete?.name}"
              </strong>{" "}
              (রেজি: {studentToDelete?.reg_no}, রোল: {studentToDelete?.roll_no}, বিভাগ: {studentToDelete?.department}) এর রেকর্ডটি ডেটাবেজ থেকে মুছে ফেলতে চান?
              <br />
              <span className="text-destructive font-semibold mt-1 inline-block">
                এই পরিবর্তনটি সরাসরি ক্লাউড ডেটাবেজে কার্যকর হবে।
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-4">
            <AlertDialogCancel disabled={saving}>বাতিল করুন</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
            >
              {saving ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, মুছে ফেলুন"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
