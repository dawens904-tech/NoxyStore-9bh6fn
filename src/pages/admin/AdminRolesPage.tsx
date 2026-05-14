import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Plus, Trash2, RefreshCw, Shield, User } from "lucide-react";

interface UserRole {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

const ROLES = ["admin", "moderator", "user"];
const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  moderator: "bg-purple-100 text-purple-700",
  user: "bg-gray-100 text-gray-600",
};

export function AdminRolesPage() {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", role: "moderator" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadRoles(); }, []);

  async function loadRoles() {
    setLoading(true);
    const { data } = await supabase.from("user_roles").select("*").order("created_at", { ascending: false });
    setRoles(data || []);
    setLoading(false);
  }

  async function addRole() {
    if (!form.email.trim()) { toast.error("Email required"); return; }
    setSaving(true);
    const { data: profile } = await supabase.from("user_profiles").select("id").eq("email", form.email).single();
    const { error } = await supabase.from("user_roles").upsert({
      email: form.email,
      role: form.role,
      user_id: profile?.id || null,
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "email" });
    if (error) { toast.error(error.message); setSaving(false); return; }
    toast.success(`Role set to ${form.role}`);
    setForm({ email: "", role: "moderator" });
    setShowForm(false);
    setSaving(false);
    loadRoles();
  }

  async function removeRole(id: string) {
    if (!confirm("Remove this role?")) return;
    await supabase.from("user_roles").delete().eq("id", id);
    toast.success("Role removed");
    loadRoles();
  }

  async function changeRole(id: string, newRole: string) {
    await supabase.from("user_roles").update({ role: newRole, updated_at: new Date().toISOString() }).eq("id", id);
    loadRoles();
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Shield size={20} className="text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">User Roles</h1>
              <p className="text-sm text-gray-500">Manage admin and moderator access</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={loadRoles} className="border border-gray-200 text-gray-500 px-3 py-2 rounded-lg hover:text-gray-800"><RefreshCw size={14} /></button>
            <button onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-yellow-400 text-black font-bold px-4 py-2 rounded-xl text-sm hover:bg-yellow-300">
              <Plus size={15} /> Add Role
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
            <h3 className="font-bold text-gray-900 mb-4">Grant Role</h3>
            <div className="flex gap-3">
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="user@email.com" className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400" />
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none bg-white">
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
              <button onClick={addRole} disabled={saving} className="bg-yellow-400 text-black font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-yellow-300 disabled:opacity-50">
                {saving ? "…" : "Grant"}
              </button>
              <button onClick={() => setShowForm(false)} className="border border-gray-200 text-gray-500 px-4 py-2.5 rounded-xl text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
          ) : roles.length === 0 ? (
            <div className="p-8 text-center">
              <User size={32} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No roles configured</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Added</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {roles.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.email}</td>
                    <td className="px-4 py-3">
                      <select value={r.role} onChange={e => changeRole(r.id, e.target.value)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border-0 outline-none cursor-pointer ${ROLE_COLORS[r.role] || "bg-gray-100 text-gray-600"}`}>
                        {ROLES.map(ro => <option key={ro} value={ro}>{ro.charAt(0).toUpperCase() + ro.slice(1)}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {r.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => removeRole(r.id)} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
