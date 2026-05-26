import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Lock, ShieldOff } from "lucide-react";

interface AdminRouteProps {
  children: React.ReactNode;
}

type Status = "checking" | "allowed" | "denied" | "unauthenticated";

// Cache admin check result for the session to avoid repeated DB calls
let cachedAdminEmail: string | null = null;
let cachedResult: boolean | null = null;

export default function AdminRoute({ children }: AdminRouteProps) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>("checking");
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function checkAdmin() {
      // Fast path: use cached result if same session user
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        if (mounted) { setStatus("unauthenticated"); navigate("/login"); }
        return;
      }

      const email = session.user.email ?? "";
      if (mounted) setUserEmail(email);

      // Use cached result for same email
      if (cachedAdminEmail === email && cachedResult !== null) {
        if (mounted) setStatus(cachedResult ? "allowed" : "denied");
        return;
      }

      // Query user_roles table — single fast lookup
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("email", email)
        .eq("role", "admin")
        .eq("is_active", true)
        .maybeSingle();

      const isAdmin = !error && data !== null;

      // Cache result
      cachedAdminEmail = email;
      cachedResult = isAdmin;

      if (mounted) setStatus(isAdmin ? "allowed" : "denied");
    }

    checkAdmin();
    return () => { mounted = false; };
  }, [navigate]);

  // Autoplay video when denied
  useEffect(() => {
    if (status === "denied" && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [status]);

  if (status === "checking") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm font-medium tracking-wide">Verifying access…</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  if (status === "denied") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        {/* Full-square video */}
        <div className="w-full max-w-2xl aspect-square bg-black overflow-hidden relative">
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
          </video>

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4 px-6">
            <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center mb-2">
              <ShieldOff className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-white text-2xl font-black tracking-tight text-center">
              Access Denied
            </h1>
            <p className="text-gray-300 text-sm text-center max-w-xs">
              <span className="text-yellow-400 font-semibold">{userEmail || "Your account"}</span> does not have admin privileges.
            </p>
            <p className="text-gray-500 text-xs text-center">
              Ou pa gen pèmisyon pou akseye zòn sa a.
            </p>
          </div>
        </div>

        {/* Action bar below video */}
        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition border border-white/20"
          >
            ← Go Home
          </button>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition flex items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Sign In as Admin
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
