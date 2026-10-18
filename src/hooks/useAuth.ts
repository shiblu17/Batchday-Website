import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { isSuperAdminEmail } from "@/lib/constants";
import {
  getModeratorSession,
  clearModeratorSession,
  checkHasAccess,
  type ModeratorUser,
  type AdminSectionKey,
} from "@/utils/adminPermissionsService";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [moderatorProfile, setModeratorProfile] = useState<ModeratorUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionToken = localStorage.getItem("ju52_admin_session");
    const SUPER_ADMIN_HASH =
      "c145831c695ff21cffa243accd032d3f93db4708ea9582b7501efbfb513a1bd5";

    // 1. Super Admin Session Check
    if (sessionToken === SUPER_ADMIN_HASH) {
      setUser({ id: "super_admin", email: "atiquzzaman116592@gmail.com" } as User);
      setIsAdmin(true);
      setIsSuperAdmin(true);
      setLoading(false);
      return;
    }

    // 2. Moderator Session Check
    const modSession = getModeratorSession();
    if (modSession) {
      setUser({ id: modSession.id, email: modSession.email } as User);
      setModeratorProfile(modSession);
      setIsAdmin(true);
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }

    // 3. Supabase Auth Subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const isSuper = isSuperAdminEmail(currentUser.email);
          const { data } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", currentUser.id)
            .eq("role", "admin")
            .maybeSingle();

          setIsAdmin(!!data || isSuper);
          setIsSuperAdmin(isSuper);
        } else {
          setIsAdmin(false);
          setIsSuperAdmin(false);
        }
        setLoading(false);
      }
    );

    // Initial Supabase Session Check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const isSuper = isSuperAdminEmail(currentUser.email);
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", currentUser.id)
          .eq("role", "admin")
          .maybeSingle();

        setIsAdmin(!!data || isSuper);
        setIsSuperAdmin(isSuper);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem("ju52_admin_login");
    localStorage.removeItem("ju52_admin_session");
    clearModeratorSession();
    await supabase.auth.signOut().catch(() => {});
    window.location.href = "/admin/login";
  };

  const hasAccess = (sectionKey: AdminSectionKey): boolean => {
    if (isSuperAdmin) return true;
    return checkHasAccess(user?.email, sectionKey, moderatorProfile);
  };

  return {
    user,
    isAdmin,
    isSuperAdmin,
    moderatorProfile,
    hasAccess,
    loading,
    signOut,
  };
}
