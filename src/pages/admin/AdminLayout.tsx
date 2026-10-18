import { Outlet, useLocation, Navigate, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, ShieldAlert, ArrowLeft, CheckCircle2 } from "lucide-react";
import { ADMIN_SECTIONS, type AdminSectionKey } from "@/utils/adminPermissionsService";

const ROUTE_SECTION_MAP: Record<string, AdminSectionKey> = {
  payments: "payments",
  export: "export",
  scanner: "scanner",
  gallery: "gallery",
  reels: "reels",
  settings: "settings",
  leaderboard: "leaderboard",
  timeline: "timeline",
  confessions: "confessions",
  roles: "roles",
};

function RestrictedAccessScreen({
  moderatorProfile,
  attemptedSection,
}: {
  moderatorProfile: any;
  attemptedSection?: string;
}) {
  const allowedSectionsMeta = ADMIN_SECTIONS.filter((s) =>
    moderatorProfile?.allowedSections?.includes(s.key)
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4 border border-destructive/20 shadow-lg shadow-destructive/5 animate-pulse">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold font-display text-foreground tracking-tight mb-2">
        🚫 অ্যাক্সেস সংরক্ষিত (Restricted Area)
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        দুঃখিত! আপনার বর্তমান মডারেটর অ্যাকাউন্টে এই সেকশনে প্রবেশের অনুমতি নেই।
      </p>

      {moderatorProfile && (
        <div className="w-full bg-card border border-border rounded-xl p-4 text-left mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
            <div>
              <p className="text-xs text-muted-foreground">আপনার প্রোফাইল</p>
              <p className="text-sm font-semibold text-foreground">
                {moderatorProfile.name} ({moderatorProfile.email})
              </p>
            </div>
            <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-primary/10 text-primary border border-primary/20">
              {moderatorProfile.roleTitle || "মডারেটর"}
            </span>
          </div>

          <p className="text-xs font-semibold text-muted-foreground mb-2">
            আপনার অনুমোদিত সেকশনসমূহ:
          </p>
          {allowedSectionsMeta.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {allowedSectionsMeta.map((sec) => (
                <Link
                  key={sec.key}
                  to={sec.url}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium bg-muted hover:bg-primary hover:text-white transition-colors border border-border"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  {sec.title}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-destructive">
              কোনো সেকশনের অনুমতি পাওয়া যায়নি। সুপার অ্যাডমিনের সহায়তা নিন।
            </p>
          )}
        </div>
      )}

      {allowedSectionsMeta.length > 0 ? (
        <Button asChild className="gap-2">
          <Link to={allowedSectionsMeta[0].url}>
            <ArrowLeft className="w-4 h-4" />
            অনুমোদিত সেকশনে যান ({allowedSectionsMeta[0].title})
          </Link>
        </Button>
      ) : (
        <Button asChild variant="outline">
          <Link to="/">ওয়েবসাইটে ফিরে যান</Link>
        </Button>
      )}
    </div>
  );
}

export default function AdminLayout() {
  const { user, signOut, isSuperAdmin, moderatorProfile, hasAccess } = useAuth();
  const location = useLocation();

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const isRootAdmin = pathSegments.length === 1 && pathSegments[0] === "admin";
  const subSlug = pathSegments.length >= 2 ? pathSegments[1] : null;

  // If moderator visits /admin directly without general overview access, route to their first allowed section
  if (!isSuperAdmin && isRootAdmin && moderatorProfile?.allowedSections?.length) {
    const hasFinanceOrExport = moderatorProfile.allowedSections.some(
      (s) => s === "payments" || s === "export"
    );
    if (!hasFinanceOrExport) {
      const firstAllowed = ADMIN_SECTIONS.find((s) =>
        moderatorProfile.allowedSections.includes(s.key)
      );
      if (firstAllowed) {
        return <Navigate to={firstAllowed.url} replace />;
      }
    }
  }

  // Check route guard
  let isDenied = false;
  if (!isSuperAdmin && subSlug) {
    if (subSlug === "roles") {
      isDenied = true;
    } else if (subSlug in ROUTE_SECTION_MAP) {
      const key = ROUTE_SECTION_MAP[subSlug];
      if (!hasAccess(key)) {
        isDenied = true;
      }
    }
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 gap-3 shrink-0">
            <SidebarTrigger />
            <span className="font-display font-bold text-primary text-lg">JU-52</span>
            <span className="text-xs text-muted-foreground">Admin</span>
            <div className="ml-auto flex items-center gap-2">
              {isSuperAdmin ? (
                <span className="text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full hidden sm:inline-flex items-center gap-1">
                  👑 সুপার অ্যাডমিন
                </span>
              ) : (
                <span className="text-[11px] font-semibold bg-secondary/15 text-secondary-foreground border border-secondary/30 px-2.5 py-1 rounded-full hidden sm:inline-flex items-center gap-1">
                  🛡️ {moderatorProfile?.roleTitle || "মডারেটর"}
                </span>
              )}
              <span className="text-xs text-muted-foreground hidden sm:inline">{user?.email}</span>
              <Button variant="ghost" size="icon" onClick={signOut} title="লগআউট">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {isDenied ? (
              <RestrictedAccessScreen
                moderatorProfile={moderatorProfile}
                attemptedSection={subSlug || ""}
              />
            ) : (
              <Outlet />
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
