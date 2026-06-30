import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import AdminSidebar from "./AdminSidebar";
import { toast } from "sonner";
import {
  Plus, Copy, Check, ToggleLeft, ToggleRight, Loader2, RefreshCw,
  Ticket, Gift, Tag, Search, X, Calendar, Hash, Users, TrendingUp,
} from "lucide-react";

interface RedeemCode {
  id: string;
  code: string;
  type: "coupon" | "gift";
  value: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

const BASE = "/secure-dashboard-92x2011";

function generateCode(prefix = "NOXY"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = prefix + "-";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function AdminCouponsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "coupon" | "gift">("all");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Form state
  const [form, setForm] = useState({
    code: generateCode(),
    type: "coupon" as "coupon" | "gift",
    value: "",
    max_uses: "1",
    expires_at: "",
    is_active: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (user.role !== "admin") { navigate("/"); return; }
    fetchCodes();
  }, [user]);

  const fetchCodes = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("admin_redeem_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { toast.error("Failed to load codes"); }
    else setCodes(data || []);
    setIsLoading(false);
  }, []);

  const handleCopy = (code: RedeemCode) => {
    navigator.clipboard.writeText(code.code).then(() => {
      setCopiedId(code.id);
      toast.success(`Copied: ${code.code}`);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleToggleActive = async (code: RedeemCode) => {
    setTogglingId(code.id);
    const { error } = await supabase
      .from("admin_redeem_codes")
      .update({ is_active: !code.is_active })
      .eq("id", code.id);
    if (error) { toast.error("Toggle failed"); }
    else {
      setCodes(prev => prev.map(c => c.id === code.id ? { ...c, is_active: !c.is_active } : c));
      toast.success(code.is_active ? "Code deactivated" : "Code activated");
    }
    setTogglingId(null);
  };

  const handleSubmit = async () => {
    if (!form.code.trim()) { toast.error("Code is required"); return; }
    if (!form.value || isNaN(Number(form.value)) || Number(form.value) <= 0) {
      toast.error("Enter a valid value greater than 0");
      return;
    }

    setIsSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active: form.is_active,
      used_count: 0,
      created_by: user?.email || null,
    };

    const { data, error } = await supabase
      .from("admin_redeem_codes")
      .insert(payload)
      .select()
      .single();

    if (error) {
      toast.error(error.message.includes("unique") ? "Code already exists" : error.message);
    } else {
      setCodes(prev => [data, ...prev]);
      toast.success(`Code "${data.code}" created!`);
      setShowForm(false);
      setForm({ code: generateCode(), type: "coupon", value: "", max_uses: "1", expires_at: "", is_active: true });
    }
    setIsSaving(false);
  };

  if (!user || user.role !== "admin") return null;

  const sidebarWidth = sidebarCollapsed ? "md:ml-[60px]" : "md:ml-64";

  const filtered = codes.filter(c => {
    const matchSearch = search === "" || c.code.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || c.type === filterType;
    const matchActive = filterActive === "all" || (filterActive === "active" ? c.is_active : !c.is_active);
    return matchSearch && matchType && matchActive;
  });

  const stats = {
    total: codes.length,
    active: codes.filter(c => c.is_active).length,
    totalUses: codes.reduce((sum, c) => sum + (c.used_count || 0), 0),
    coupons: codes.filter(c => c.type === "coupon").length,
  };

  const isExpired = (c: RedeemCode) => c.expires_at ? new Date(c.expires_at) < new Date() : false;
  const isExhausted = (c: RedeemCode) => c.max_uses !== null && (c.used_count || 0) >= c.max_uses;

  return (
    <div className="flex min-h-screen bg-[#f5f7fa]">
      <AdminSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />

      <main className={`ml-0 ${sidebarWidth} flex-1 p-4 md:p-8 max-w-full overflow-x-hidden transition-all duration-300 pt-16 md:pt-8`}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">Redeem Codes</h1>
            <p className="text-sm text-gray-500 mt-1">Manage coupon and gift codes for users</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchCodes}
              className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin text-gray-400" : "text-gray-600"} />
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-4 py-2.5 rounded-xl transition-colors text-sm"
            >
              <Plus size={15} /> New Code
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Codes", value: stats.total, icon: <Hash size={18} />, color: "bg-blue-500" },
            { label: "Active", value: stats.active, icon: <TrendingUp size={18} />, color: "bg-green-500" },
            { label: "Total Uses", value: stats.totalUses, icon: <Users size={18} />, color: "bg-purple-500" },
            { label: "Coupons", value: stats.coupons, icon: <Ticket size={18} />, color: "bg-yellow-500" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
              <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
                {s.icon}
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search codes…"
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-yellow-400 bg-gray-50"
            />
          </div>
          <div className="flex gap-1.5">
            {(["all", "coupon", "gift"] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all capitalize ${
                  filterType === t ? "bg-yellow-400 border-yellow-400 text-black" : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {t === "all" ? "All Types" : t === "coupon" ? "Coupon" : "Gift"}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {(["all", "active", "inactive"] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterActive(s)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all capitalize ${
                  filterActive === s ? "bg-gray-900 border-gray-900 text-white" : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {s === "all" ? "All Status" : s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Ticket size={40} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No codes found</p>
              <p className="text-xs mt-1">Create your first redeem code</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 border-b border-gray-100">
                    <th className="px-5 py-3 text-left font-semibold">Code</th>
                    <th className="px-5 py-3 text-left font-semibold">Type</th>
                    <th className="px-5 py-3 text-left font-semibold">Value</th>
                    <th className="px-5 py-3 text-left font-semibold hidden md:table-cell">Uses</th>
                    <th className="px-5 py-3 text-left font-semibold hidden lg:table-cell">Expires</th>
                    <th className="px-5 py-3 text-left font-semibold hidden lg:table-cell">Created</th>
                    <th className="px-5 py-3 text-left font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(code => {
                    const expired = isExpired(code);
                    const exhausted = isExhausted(code);
                    const effectiveStatus = !code.is_active ? "inactive" : expired ? "expired" : exhausted ? "exhausted" : "active";

                    return (
                      <tr key={code.id} className="hover:bg-gray-50/60 transition-colors">
                        {/* Code */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-gray-900 text-sm tracking-wider">{code.code}</span>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                            code.type === "coupon"
                              ? "bg-orange-50 text-orange-600 border border-orange-100"
                              : "bg-purple-50 text-purple-600 border border-purple-100"
                          }`}>
                            {code.type === "coupon" ? <Tag size={11} /> : <Gift size={11} />}
                            {code.type}
                          </span>
                        </td>

                        {/* Value */}
                        <td className="px-5 py-3.5">
                          <span className="font-black text-gray-900">
                            {code.type === "coupon" ? `${code.value}%` : `$${Number(code.value).toFixed(2)}`}
                          </span>
                        </td>

                        {/* Uses */}
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-semibold ${exhausted ? "text-red-500" : "text-gray-700"}`}>
                              {code.used_count ?? 0}
                            </span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-500">{code.max_uses ?? "∞"}</span>
                          </div>
                          {code.max_uses && (
                            <div className="w-16 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${exhausted ? "bg-red-400" : "bg-green-400"}`}
                                style={{ width: `${Math.min(100, ((code.used_count || 0) / code.max_uses) * 100)}%` }}
                              />
                            </div>
                          )}
                        </td>

                        {/* Expires */}
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          {code.expires_at ? (
                            <div className={`flex items-center gap-1 text-xs ${expired ? "text-red-500" : "text-gray-500"}`}>
                              <Calendar size={11} />
                              <span>{new Date(code.expires_at).toLocaleDateString()}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">Never</span>
                          )}
                        </td>

                        {/* Created */}
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <div className="text-xs text-gray-400">
                            {new Date(code.created_at).toLocaleDateString()}
                          </div>
                          {code.created_by && (
                            <div className="text-[10px] text-gray-300 truncate max-w-[120px]">{code.created_by}</div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border ${
                            effectiveStatus === "active" ? "bg-green-50 text-green-700 border-green-100" :
                            effectiveStatus === "expired" ? "bg-red-50 text-red-600 border-red-100" :
                            effectiveStatus === "exhausted" ? "bg-orange-50 text-orange-600 border-orange-100" :
                            "bg-gray-50 text-gray-500 border-gray-100"
                          }`}>
                            {effectiveStatus.toUpperCase()}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 justify-end">
                            {/* Copy */}
                            <button
                              onClick={() => handleCopy(code)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-500 hover:text-blue-600 transition-colors"
                              title="Copy code"
                            >
                              {copiedId === code.id ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                            </button>

                            {/* Toggle active */}
                            <button
                              onClick={() => handleToggleActive(code)}
                              disabled={togglingId === code.id}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                                code.is_active
                                  ? "bg-green-100 hover:bg-red-100 text-green-600 hover:text-red-600"
                                  : "bg-gray-100 hover:bg-green-100 text-gray-400 hover:text-green-600"
                              }`}
                              title={code.is_active ? "Deactivate" : "Activate"}
                            >
                              {togglingId === code.id ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : code.is_active ? (
                                <ToggleRight size={13} />
                              ) : (
                                <ToggleLeft size={13} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Result count */}
        {!isLoading && filtered.length > 0 && (
          <p className="text-xs text-gray-400 mt-3 text-right">{filtered.length} of {codes.length} codes</p>
        )}
      </main>

      {/* Create Code Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Ticket size={15} className="text-yellow-600" />
                </div>
                <h3 className="font-bold text-gray-900">Create Redeem Code</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Code *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    className="flex-1 border border-gray-200 px-4 py-3 text-sm outline-none focus:border-yellow-400 rounded-xl font-mono tracking-wider"
                    placeholder="NOXY-XXXXXXXX"
                  />
                  <button
                    onClick={() => setForm(f => ({ ...f, code: generateCode() }))}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-xl border border-gray-200 flex-shrink-0 transition-colors"
                  >
                    Generate
                  </button>
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["coupon", "gift"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold capitalize transition-all ${
                        form.type === t ? "border-yellow-400 bg-yellow-50 text-gray-900" : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {t === "coupon" ? <Tag size={14} /> : <Gift size={14} />}
                      {t === "coupon" ? "Coupon (% off)" : "Gift ($)"}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  {form.type === "coupon" ? "Coupon: percentage discount applied at checkout" : "Gift: fixed dollar amount added to user's wallet"}
                </p>
              </div>

              {/* Value */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Value * {form.type === "coupon" ? "(%) " : "($) "}
                </label>
                <input
                  type="number"
                  value={form.value}
                  onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  placeholder={form.type === "coupon" ? "e.g. 10 for 10%" : "e.g. 5.00 for $5"}
                  min="0"
                  max={form.type === "coupon" ? "100" : undefined}
                  step={form.type === "coupon" ? "1" : "0.01"}
                  className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-yellow-400 rounded-xl"
                />
              </div>

              {/* Max Uses */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Max Uses</label>
                <input
                  type="number"
                  value={form.max_uses}
                  onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                  placeholder="Leave empty for unlimited"
                  min="1"
                  className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-yellow-400 rounded-xl"
                />
                <p className="text-[10px] text-gray-400 mt-1">Leave blank for unlimited uses</p>
              </div>

              {/* Expiry */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Expiry Date</label>
                <input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                  className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-yellow-400 rounded-xl"
                />
                <p className="text-[10px] text-gray-400 mt-1">Leave blank for no expiry</p>
              </div>

              {/* Active toggle */}
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer">
                <span className="text-sm font-semibold text-gray-700">Activate immediately</span>
                <div
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${form.is_active ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-4" : "translate-x-0"}`} />
                </div>
              </label>
            </div>

            <div className="px-6 pb-6 flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSaving ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : "Create Code"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
