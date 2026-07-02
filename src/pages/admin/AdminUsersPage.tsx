import { useState, useEffect, useCallback } from "react";
import AdminSidebar from "./AdminSidebar";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Users, Search, Ban, Trash2, LogOut, Gift, X, ChevronDown,
  RefreshCw, ShieldOff, Shield, Eye, Loader2, AlertTriangle, Coins, Tag, Wallet,
} from "lucide-react";

const BASE = "/secure-dashboard-92x2011";

interface UserRow {
  id: string;
  email: string;
  username: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  role: string;
  is_banned: boolean;
}

interface BanInfo {
  email: string;
  reason: string;
  created_at: string;
}

interface GiftForm {
  points: string;
  coins: string;
  balance: string;
  couponCode: string;
  couponType: "percent" | "fixed";
  couponValue: string;
  couponExpDays: string;
}

const defaultGift: GiftForm = {
  points: "",
  coins: "",
  balance: "",
  couponCode: "",
  couponType: "percent",
  couponValue: "",
  couponExpDays: "30",
};

export default function AdminUsersPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "admin" | "user">("all");
  const [filterBan, setFilterBan] = useState<"all" | "banned" | "active">("all");

  // modals
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [giftForm, setGiftForm] = useState<GiftForm>(defaultGift);
  const [giftLoading, setGiftLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch user profiles
      const { data: profiles, error } = await supabase
        .from("user_profiles")
        .select("id, email, username")
        .order("email");

      if (error) throw error;

      // Fetch roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("email, role");

      // Fetch banned emails
      const { data: bans } = await supabase
        .from("banned_users")
        .select("email");

      const roleMap = new Map((roles || []).map((r: any) => [r.email, r.role]));
      const bannedSet = new Set((bans || []).map((b: any) => b.email));

      const merged: UserRow[] = (profiles || []).map((p: any) => ({
        id: p.id,
        email: p.email,
        username: p.username,
        created_at: "",
        last_sign_in_at: null,
        role: roleMap.get(p.email) || "user",
        is_banned: bannedSet.has(p.email),
      }));

      setUsers(merged);
    } catch (err: any) {
      toast.error("Failed to fetch users: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter((u) => {
    const matchSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.username || "").toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchBan =
      filterBan === "all" ||
      (filterBan === "banned" && u.is_banned) ||
      (filterBan === "active" && !u.is_banned);
    return matchSearch && matchRole && matchBan;
  });

  // ─── Ban user (with force-logout) ─────────────────────────────────────────
  const handleBan = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      // 1. Add to banned_users table
      const { error } = await supabase.from("banned_users").upsert({
        email: selectedUser.email,
        reason: banReason || "Violated terms of service",
        banned_by: "admin",
      });
      if (error) throw error;

      // 2. Force-invalidate user's active sessions via admin edge function
      const { error: fnError } = await supabase.functions.invoke("admin-user-actions", {
        body: { action: "force_logout", userId: selectedUser.id },
      });
      if (fnError) {
        console.warn("Force logout warning (non-fatal):", fnError.message);
      }

      toast.success(`${selectedUser.email} has been banned and logged out.`);
      setShowBanModal(false);
      setBanReason("");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Unban user ──────────────────────────────────────────────────────────
  const handleUnban = async (user: UserRow) => {
    try {
      const { error } = await supabase
        .from("banned_users")
        .delete()
        .eq("email", user.email);
      if (error) throw error;
      toast.success(`${user.email} has been unbanned.`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ─── Delete user ─────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      // Delete related data
      await supabase.from("orders").delete().eq("user_email", selectedUser.email);
      await supabase.from("wallet_transactions").delete().eq("user_email", selectedUser.email);
      await supabase.from("user_coupons").delete().eq("user_email", selectedUser.email);
      await supabase.from("referral_codes").delete().eq("user_email", selectedUser.email);
      await supabase.from("chat_messages").delete().eq("user_email", selectedUser.email);
      await supabase.from("affiliate_stores").delete().eq("user_email", selectedUser.email);
      await supabase.from("user_bank_cards").delete().eq("user_email", selectedUser.email);
      await supabase.from("user_passkeys").delete().eq("user_email", selectedUser.email);
      await supabase.from("user_roles").delete().eq("email", selectedUser.email);
      // Profile deletion cascades to auth.users via FK
      await supabase.from("user_profiles").delete().eq("id", selectedUser.id);
      toast.success(`User ${selectedUser.email} and all data deleted.`);
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Gift coins / points / balance / coupon ──────────────────────────────
  const handleGift = async () => {
    if (!selectedUser) return;
    setGiftLoading(true);
    try {
      const ops: Promise<any>[] = [];

      if (giftForm.points && parseFloat(giftForm.points) > 0) {
        ops.push(
          supabase.from("wallet_transactions").insert({
            user_email: selectedUser.email,
            user_id: selectedUser.id,
            type: "points_earned",
            amount: parseFloat(giftForm.points),
            status: "completed",
            method: "admin_gift",
            description: "Admin granted points",
          })
        );
      }

      if (giftForm.coins && parseFloat(giftForm.coins) > 0) {
        ops.push(
          supabase.from("wallet_transactions").insert({
            user_email: selectedUser.email,
            user_id: selectedUser.id,
            type: "coins_earned",
            amount: parseFloat(giftForm.coins),
            status: "completed",
            method: "admin_gift",
            description: "Admin granted coins",
          })
        );
      }

      if (giftForm.balance && parseFloat(giftForm.balance) > 0) {
        ops.push(
          supabase.from("wallet_transactions").insert({
            user_email: selectedUser.email,
            user_id: selectedUser.id,
            type: "deposit",
            amount: parseFloat(giftForm.balance),
            status: "completed",
            method: "admin_gift",
            description: "Admin granted balance",
          })
        );
      }

      if (giftForm.couponCode && giftForm.couponValue) {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + parseInt(giftForm.couponExpDays || "30"));
        ops.push(
          supabase.from("user_coupons").insert({
            user_email: selectedUser.email,
            user_id: selectedUser.id,
            code: giftForm.couponCode.toUpperCase(),
            type: giftForm.couponType,
            discount_value: parseFloat(giftForm.couponValue),
            expires_at: expDate.toISOString(),
            description: `Admin coupon: ${giftForm.couponCode.toUpperCase()}`,
          })
        );
      }

      if (ops.length === 0) {
        toast.error("Please fill at least one gift field.");
        setGiftLoading(false);
        return;
      }

      await Promise.all(ops);
      toast.success(`Gifts sent to ${selectedUser.email}!`);
      setShowGiftModal(false);
      setGiftForm(defaultGift);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGiftLoading(false);
    }
  };

  const openBan = (u: UserRow) => {
    setSelectedUser(u);
    setShowBanModal(true);
    setShowInfoModal(false);
  };
  const openDelete = (u: UserRow) => {
    setSelectedUser(u);
    setShowDeleteModal(true);
    setShowInfoModal(false);
  };
  const openGift = (u: UserRow) => {
    setSelectedUser(u);
    setShowGiftModal(true);
    setShowInfoModal(false);
  };
  const openInfo = (u: UserRow) => {
    setSelectedUser(u);
    setShowInfoModal(true);
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
      <main className={`flex-1 transition-all duration-300 ${collapsed ? "md:ml-[60px]" : "md:ml-64"} p-6`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 flex items-center justify-center rounded-xl">
              <Users size={20} className="text-black" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">User Management</h1>
              <p className="text-xs text-slate-500">{users.length} registered users</p>
            </div>
          </div>
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email or username..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          <select
            value={filterBan}
            onChange={(e) => setFilterBan(e.target.value as any)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-yellow-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No users found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">User</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center font-bold text-yellow-700 text-sm flex-shrink-0">
                          {u.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">{u.username || "—"}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${
                        u.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                        u.is_banned
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {u.is_banned ? <Ban size={11} /> : <Shield size={11} />}
                        {u.is_banned ? "Banned" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openInfo(u)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                          title="View Info"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => openGift(u)}
                          className="p-1.5 rounded-lg bg-yellow-100 hover:bg-yellow-200 text-yellow-700 transition-colors"
                          title="Send Gift"
                        >
                          <Gift size={14} />
                        </button>
                        {u.is_banned ? (
                          <button
                            onClick={() => handleUnban(u)}
                            className="p-1.5 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-colors"
                            title="Unban"
                          >
                            <ShieldOff size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => openBan(u)}
                            className="p-1.5 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-700 transition-colors"
                            title="Ban"
                          >
                            <Ban size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => openDelete(u)}
                          className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: "Total Users", value: users.length, color: "bg-blue-100 text-blue-700" },
            { label: "Active", value: users.filter((u) => !u.is_banned).length, color: "bg-green-100 text-green-700" },
            { label: "Banned", value: users.filter((u) => u.is_banned).length, color: "bg-red-100 text-red-700" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <p className={`text-2xl font-black ${s.color.split(" ")[1]}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </main>

      {/* ─── Info Modal ─────────────────────────────────────────────────── */}
      {showInfoModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-black text-slate-900">User Info</h2>
              <button onClick={() => setShowInfoModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200">
                <X size={14} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center text-2xl font-black text-yellow-700">
                  {selectedUser.email[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{selectedUser.username || "No username"}</p>
                  <p className="text-sm text-slate-500">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">Role</p>
                  <p className="font-bold text-slate-800 capitalize">{selectedUser.role}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">Status</p>
                  <p className={`font-bold ${selectedUser.is_banned ? "text-red-600" : "text-green-600"}`}>
                    {selectedUser.is_banned ? "Banned" : "Active"}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 col-span-2">
                  <p className="text-xs text-slate-500 mb-1">User ID</p>
                  <p className="font-mono text-xs text-slate-700 break-all">{selectedUser.id}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => openGift(selectedUser)}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-400 rounded-xl text-sm font-bold text-black hover:bg-yellow-300"
                >
                  <Gift size={14} /> Send Gift
                </button>
                {selectedUser.is_banned ? (
                  <button
                    onClick={() => { handleUnban(selectedUser); setShowInfoModal(false); }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-xl text-sm font-bold text-green-700 hover:bg-green-200"
                  >
                    <ShieldOff size={14} /> Unban
                  </button>
                ) : (
                  <button
                    onClick={() => openBan(selectedUser)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-xl text-sm font-bold text-orange-700 hover:bg-orange-200"
                  >
                    <Ban size={14} /> Ban
                  </button>
                )}
                <button
                  onClick={() => openDelete(selectedUser)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 rounded-xl text-sm font-bold text-red-600 hover:bg-red-200"
                >
                  <Trash2 size={14} /> Delete All Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Gift Modal ──────────────────────────────────────────────────── */}
      {showGiftModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-black text-slate-900">Send Gift</h2>
                <p className="text-xs text-slate-500 mt-0.5">{selectedUser.email}</p>
              </div>
              <button onClick={() => setShowGiftModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200">
                <X size={14} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Points */}
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Coins size={14} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-600 mb-1">Points</p>
                  <input
                    type="number"
                    value={giftForm.points}
                    onChange={(e) => setGiftForm({ ...giftForm, points: e.target.value })}
                    placeholder="0"
                    className="w-full bg-transparent text-sm font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Coins */}
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Coins size={14} className="text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-600 mb-1">Coins</p>
                  <input
                    type="number"
                    value={giftForm.coins}
                    onChange={(e) => setGiftForm({ ...giftForm, coins: e.target.value })}
                    placeholder="0"
                    className="w-full bg-transparent text-sm font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Balance */}
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Wallet size={14} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-600 mb-1">Balance (USD)</p>
                  <input
                    type="number"
                    value={giftForm.balance}
                    onChange={(e) => setGiftForm({ ...giftForm, balance: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-transparent text-sm font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Coupon */}
              <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-purple-600" />
                  <p className="text-xs font-semibold text-slate-600">Coupon (optional)</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={giftForm.couponCode}
                    onChange={(e) => setGiftForm({ ...giftForm, couponCode: e.target.value })}
                    placeholder="COUPON CODE"
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400 uppercase"
                  />
                  <select
                    value={giftForm.couponType}
                    onChange={(e) => setGiftForm({ ...giftForm, couponType: e.target.value as any })}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="percent">% Off</option>
                    <option value="fixed">Fixed $</option>
                  </select>
                  <input
                    type="number"
                    value={giftForm.couponValue}
                    onChange={(e) => setGiftForm({ ...giftForm, couponValue: e.target.value })}
                    placeholder={giftForm.couponType === "percent" ? "10 (= 10%)" : "5 (= $5)"}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  <input
                    type="number"
                    value={giftForm.couponExpDays}
                    onChange={(e) => setGiftForm({ ...giftForm, couponExpDays: e.target.value })}
                    placeholder="Expire days"
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>

              <button
                onClick={handleGift}
                disabled={giftLoading}
                className="w-full py-3 bg-yellow-400 text-black font-black rounded-xl hover:bg-yellow-300 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {giftLoading ? <Loader2 size={16} className="animate-spin" /> : <Gift size={16} />}
                {giftLoading ? "Sending..." : "Send Gifts"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Ban Modal ───────────────────────────────────────────────────── */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-black text-slate-900 flex items-center gap-2">
                <Ban size={16} className="text-orange-600" /> Ban User
              </h2>
              <button onClick={() => setShowBanModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200">
                <X size={14} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-orange-50 rounded-xl p-3 text-sm text-orange-700 font-medium">
                Banning <strong>{selectedUser.email}</strong> will permanently block this email from creating new accounts.
              </div>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Reason for ban (optional)..."
                rows={3}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button
                onClick={handleBan}
                disabled={actionLoading}
                className="w-full py-3 bg-orange-500 text-white font-black rounded-xl hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
                Confirm Ban
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Modal ────────────────────────────────────────────────── */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-black text-slate-900 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-600" /> Delete User
              </h2>
              <button onClick={() => setShowDeleteModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200">
                <X size={14} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-red-50 rounded-xl p-3 text-sm text-red-700 font-medium space-y-1">
                <p>This will permanently delete <strong>{selectedUser.email}</strong> and ALL associated data:</p>
                <ul className="list-disc list-inside text-xs text-red-600 mt-1 space-y-0.5">
                  <li>Orders, wallet transactions</li>
                  <li>Coupons, referral codes</li>
                  <li>Chat messages, bank cards</li>
                  <li>Affiliate store, passkeys</li>
                </ul>
                <p className="font-bold text-red-700 mt-2">This action cannot be undone.</p>
              </div>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="w-full py-3 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Delete Everything
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-full py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
