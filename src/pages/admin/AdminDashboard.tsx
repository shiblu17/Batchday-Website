import { motion } from "framer-motion";
import { Users, CreditCard, Clock, CheckCircle, UserCheck, Loader2, TrendingUp, BarChart as BarChartIcon } from "lucide-react";
import { useRegistrations } from "@/hooks/useRegistrations";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area 
} from 'recharts';

export default function AdminDashboard() {
  const { data: registrations = [], isLoading } = useRegistrations();
  const { data: settings } = useSiteSettings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const fee = typeof settings?.registration_fee === "number" ? settings.registration_fee : 500;
  const total = registrations.length;
  const verified = registrations.filter((r) => r.status === "verified").length;
  const pending = registrations.filter((r) => r.status === "pending").length;
  const attended = registrations.filter((r) => r.attended).length;
  const collection = verified * fee;

  const stats = [
    { label: "মোট রেজিস্ট্রেশন", value: total, icon: Users, color: "bg-primary/10 text-primary" },
    { label: "ভেরিফাইড", value: verified, icon: CheckCircle, color: "bg-secondary/10 text-secondary" },
    { label: "পেন্ডিং", value: pending, icon: Clock, color: "bg-accent/10 text-accent" },
    { label: "মোট কালেকশন", value: `৳${collection}`, icon: CreditCard, color: "bg-primary/10 text-primary" },
    { label: "উপস্থিতি", value: attended, icon: UserCheck, color: "bg-secondary/10 text-secondary" },
  ];

  // Process chart data
  const deptData: Record<string, number> = {};
  const dateData: Record<string, number> = {};

  registrations.forEach((r) => {
    deptData[r.department] = (deptData[r.department] || 0) + 1;
    const date = new Date(r.created_at).toLocaleDateString("en-US", { month: 'short', day: 'numeric' });
    dateData[date] = (dateData[date] || 0) + 1;
  });

  const deptChartData = Object.entries(deptData)
    .map(([name, value]) => ({ name, value }))
    .sort((a,b) => b.value - a.value)
    .slice(0, 10);

  const trendData = Object.entries(dateData)
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="pb-10">
      <h1 className="font-display text-2xl font-bold mb-6">ড্যাশবোর্ড ওভারভিউ</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100"
          >
            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${s.color} mb-4 shadow-inner`}>
              <s.icon className="h-6 w-6" />
            </div>
            <p className="font-display text-3xl font-black text-slate-800">{s.value}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Trend Chart */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="font-display font-bold text-slate-800">রেজিস্ট্রেশন প্রবণতা</h2>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#800000" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#800000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="value" stroke="#800000" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dept Chart */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <BarChartIcon className="h-5 w-5 text-primary" />
            <h2 className="font-display font-bold text-slate-800">টপ ডিপার্টমেন্ট</h2>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                   cursor={{ fill: '#f8fafc' }}
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" fill="#800000" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-display font-bold text-slate-800">সাম্প্রতিক রেজিস্ট্রেশন</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left p-3 font-semibold">নাম</th>
                <th className="text-left p-3 font-semibold">রোল</th>
                <th className="text-left p-3 font-semibold hidden md:table-cell">ডিপার্টমেন্ট</th>
                <th className="text-left p-3 font-semibold">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody>
              {registrations.slice(0, 5).map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3">{r.roll}</td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground truncate max-w-[200px]">{r.department}</td>
                  <td className="p-3"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
              {registrations.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">কোনো রেজিস্ট্রেশন নেই</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    pending: "bg-accent/10 text-accent",
    verified: "bg-secondary/10 text-secondary",
    rejected: "bg-destructive/10 text-destructive",
  };
  const labels: Record<string, string> = { pending: "পেন্ডিং", verified: "ভেরিফাইড", rejected: "রিজেক্টেড" };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${config[status]}`}>
      {labels[status]}
    </span>
  );
}
