import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { isSuperAdminEmail } from "@/lib/constants";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionToken = localStorage.getItem("ju52_admin_session");
    const SUPER_ADMIN_HASH =
      "c145831c695ff21cffa243accd032d3f93db4708ea9582b7501efbfb513a1bd5";

    if (sessionToken === SUPER_ADMIN_HASH) {
      setUser({ id: "admin", email: "atiquzzaman116592@gmail.com" } as User);
      setIsAdmin(true);
      setLoading(false);
      return;
    }

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
        } else {
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

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
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem("ju52_admin_login");
    localStorage.removeItem("ju52_admin_session");
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  };

  return { user, isAdmin, loading, signOut };
}
