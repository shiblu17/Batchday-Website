import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Lock, Mail } from "lucide-react";
import { isSuperAdminEmail } from "@/lib/constants";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. First attempt standard Supabase Auth
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // 2. Cryptographic SHA-256 fallback for Super Admin (no plaintext password in JS bundle)
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(`ju52_salt_${password}`);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashHex = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        const SUPER_ADMIN_HASH =
          "c145831c695ff21cffa243accd032d3f93db4708ea9582b7501efbfb513a1bd5";

        if (isSuperAdminEmail(email) && hashHex === SUPER_ADMIN_HASH) {
          localStorage.setItem("ju52_admin_session", SUPER_ADMIN_HASH);
          localStorage.setItem("ju52_admin_login", "true");
          toast({ title: "লগইন সফল", description: "অ্যাডমিন প্যানেলে স্বাগতম!" });
          window.location.href = "/admin";
          return;
        }
      } catch (cryptoErr) {
        // Fallback silently if crypto API unavailable
      }

      toast({ title: "লগইন ব্যর্থ", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "লগইন ব্যর্থ", variant: "destructive" });
      setLoading(false);
      return;
    }

    const isSuperAdmin = isSuperAdminEmail(user.email);

    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) {
      console.warn("User role query notice:", roleError.message);
    }

    // If verified super admin but role row not yet reflected in user_roles, try inserting it
    if (isSuperAdmin && !roleData) {
      try {
        await supabase
          .from("user_roles")
          .upsert({ user_id: user.id, role: "admin" as any });
      } catch (err) {
        console.warn("Could not upsert role:", err);
      }
    }

    if (!roleData && !isSuperAdmin) {
      await supabase.auth.signOut();
      toast({
        title: "অ্যাক্সেস নিষিদ্ধ",
        description: "আপনার অ্যাডমিন অ্যাক্সেস নেই।",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    navigate("/admin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="font-display text-2xl">অ্যাডমিন লগইন</CardTitle>
          <CardDescription>JU-52 অ্যাডমিন প্যানেলে প্রবেশ করুন</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">ইমেইল</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">পাসওয়ার্ড</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" required />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "লগইন হচ্ছে..." : "লগইন"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
