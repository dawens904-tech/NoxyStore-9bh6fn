import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * AdminRoute — wraps any admin page and enforces role='admin' in user_roles table.
 * - Not authenticated → redirects to /login
 * - Authenticated but not admin → shows video error page
 * - Admin → renders children
 */
export default function AdminRoute({ children }: AdminRouteProps) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "allowed" | "denied" | "unauthenticated">("loading");

  useEffect(() => {
    let mounted = true;

    async function check() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        if (mounted) setStatus("unauthenticated");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("email", session.user.email)
        .eq("role", "admin")
        .maybeSingle();

      if (mounted) {
        setStatus(roleData ? "allowed" : "denied");
      }
    }

    check();
    return () => { mounted = false; };
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white/50 text-sm font-mono">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    navigate("/login");
    return null;
  }

  if (status === "denied") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
        {/* Auto-play muted video fills the area */}
        <div className="w-full max-w-4xl aspect-video bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-80"
          >
            {/* Replace src with your actual restricted-access video URL */}
            <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Overlay message */}
        <div className="mt-8 text-center max-w-md">
          <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/40 text-red-400 px-4 py-2 rounded-full text-sm font-bold mb-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Access Denied
          </div>
          <h2 className="text-white text-2xl font-black mb-2">Restricted Area</h2>
          <p className="text-white/50 text-sm mb-6">
            You don't have permission to access this page.<br />
            Admin privileges are required.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-colors text-sm"
          >
            Go Back to Store
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
