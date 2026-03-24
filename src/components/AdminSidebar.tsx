import { LayoutDashboard, CreditCard, Download, QrCode, ArrowLeft, Settings, ImageIcon, Trophy, MessageCircleHeart, CalendarDays } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, Link } from "react-router-dom";
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

const items = [
  { title: "ড্যাশবোর্ড", url: "/admin", icon: LayoutDashboard },
  { title: "পেমেন্ট ভেরিফিকেশন", url: "/admin/payments", icon: CreditCard },
  { title: "ডেটা এক্সপোর্ট", url: "/admin/export", icon: Download },
  { title: "QR স্ক্যানার", url: "/admin/scanner", icon: QrCode },
  { title: "গ্যালারি", url: "/admin/gallery", icon: ImageIcon },
  { title: "সাইট সেটিংস", url: "/admin/settings", icon: Settings },
  { title: "লিডারবোর্ড", url: "/admin/leaderboard", icon: Trophy },
  { title: "টাইমলাইন", url: "/admin/timeline", icon: CalendarDays },
  { title: "কনফেশনস", url: "/admin/confessions", icon: MessageCircleHeart },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) =>
    path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {!collapsed && (
              <span className="font-display font-bold text-primary">অ্যাডমিন প্যানেল</span>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
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
