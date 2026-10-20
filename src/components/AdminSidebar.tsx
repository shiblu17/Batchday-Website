import {
  LayoutDashboard,
  CreditCard,
  Download,
  QrCode,
  ArrowLeft,
  Settings,
  ImageIcon,
  Trophy,
  MessageCircleHeart,
  CalendarDays,
  Film,
  Users,
  GraduationCap,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { AdminSectionKey } from "@/utils/adminPermissionsService";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  sectionKey?: AdminSectionKey;
}

const items: MenuItem[] = [
  { title: "ড্যাশবোর্ড", url: "/admin", icon: LayoutDashboard },
  { title: "পেমেন্ট ভেরিফিকেশন", url: "/admin/payments", icon: CreditCard, sectionKey: "payments" },
  { title: "শিক্ষার্থী ডেটাবেজ", url: "/admin/students", icon: GraduationCap, sectionKey: "students" },
  { title: "ডেটা এক্সপোর্ট", url: "/admin/export", icon: Download, sectionKey: "export" },
  { title: "QR স্ক্যানার", url: "/admin/scanner", icon: QrCode, sectionKey: "scanner" },
  { title: "গ্যালারি", url: "/admin/gallery", icon: ImageIcon, sectionKey: "gallery" },
  { title: "রিলস ও স্ট্রিম", url: "/admin/reels", icon: Film, sectionKey: "reels" },
  { title: "সাইট সেটিংস", url: "/admin/settings", icon: Settings, sectionKey: "settings" },
  { title: "লিডারবোর্ড", url: "/admin/leaderboard", icon: Trophy, sectionKey: "leaderboard" },
  { title: "টাইমলাইন", url: "/admin/timeline", icon: CalendarDays, sectionKey: "timeline" },
  { title: "কনফেশনস", url: "/admin/confessions", icon: MessageCircleHeart, sectionKey: "confessions" },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { isSuperAdmin, hasAccess, moderatorProfile } = useAuth();

  // Filter items based on user permissions
  const visibleItems = items.filter((item) => {
    if (isSuperAdmin) return true;
    if (!item.sectionKey) return true;
    return hasAccess(item.sectionKey);
  });

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-display font-bold text-primary">অ্যাডমিন প্যানেল</span>
                <span className="text-[10px] text-muted-foreground font-sans">
                  {isSuperAdmin
                    ? "👑 সুপার অ্যাডমিন"
                    : `🛡️ ${moderatorProfile?.roleTitle || "মডারেটর"}`}
                </span>
              </div>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                      activeClassName="bg-primary/10 text-primary font-semibold"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Super Admin ONLY: Team & Roles Manager */}
              {isSuperAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/admin/roles"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-amber-500 hover:bg-amber-500/10 transition-colors border border-amber-500/20 my-1.5"
                      activeClassName="bg-amber-500/20 text-amber-400 font-semibold border-amber-500/40"
                    >
                      <Users className="h-4 w-4 shrink-0 text-amber-500" />
                      {!collapsed && <span>টিম ও পারমিশন</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Back to site */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    to="/"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors mt-4"
                  >
                    <ArrowLeft className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>সাইটে ফিরে যাও</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
