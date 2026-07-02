/**
 * AuthContext — thin React context wrapper over Zustand authStore.
 * Use `useAuth()` in any component to access auth state without
 * importing the store directly.
 */
import { createContext, useContext, type ReactNode } from "react";
import { useAuthStore, mapSupabaseUser } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: Partial<User>) => void;
  logout: () => void;
  updateBalance: (amount: number) => void;
  /** Sign in with Google OAuth (PKCE flow) */
  signInWithGoogle: () => Promise<void>;
  /** Sign in with Discord OAuth */
  signInWithDiscord: () => Promise<void>;
  /** Send OTP to email */
  sendOtp: (email: string) => Promise<void>;
  /** Verify OTP — returns true on success */
  verifyOtp: (email: string, token: string) => Promise<boolean>;
  /** Set password after OTP verification (for registration) */
  setPassword: (password: string, username?: string) => Promise<void>;
  /** Sign in with email + password */
  signInWithPassword: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const store = useAuthStore();

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        queryParams: { access_type: "offline", prompt: "consent" },
        skipBrowserRedirect: false,
      },
    });
    if (error) throw error;
  };

  const signInWithDiscord = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: window.location.origin,
        skipBrowserRedirect: false,
      },
    });
    if (error) throw error;
  };

  const sendOtp = async (email: string) => {
    // Check if email is banned before allowing signup/OTP
    const { data: banData } = await supabase
      .from("banned_users")
      .select("email, reason")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();
    if (banData) {
      throw new Error("This email has been banned from NoxyStore. Reason: " + (banData.reason || "Policy violation"));
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
  };

  const verifyOtp = async (email: string, token: string): Promise<boolean> => {
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: "email",
    });
    if (error) throw error;
    return true;
  };

  const setPassword = async (password: string, username?: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password,
      data: username ? { username } : undefined,
    });
    if (error) throw error;
    if (data.user) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("email", data.user.email)
        .single();
      store.login(mapSupabaseUser(data.user, roleData?.role || "user"));
    }
  };

  const signInWithPassword = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    if (data.user) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("email", data.user.email)
        .single();
      store.login(mapSupabaseUser(data.user, roleData?.role || "user"));
      await store.syncOrdersFromDB(data.user.email!);
    }
  };

  const value: AuthContextValue = {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    login: store.login,
    logout: store.logout,
    updateBalance: store.updateBalance,
    signInWithGoogle,
    signInWithDiscord,
    sendOtp,
    verifyOtp,
    setPassword,
    signInWithPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook to consume auth context in any component */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
