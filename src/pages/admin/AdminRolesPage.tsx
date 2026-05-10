import { useEffect, useState } from "react";
import { UserPlus, RefreshCw } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

export function AdminRolesPage() {
  const { user } = useAuthStore();
  const [roles, setRoles] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from("user_roles").select("*").order("created_at", { ascending: false });
    if (data) setRoles(data);
  };

  const invite = async () => {
    if (!inviteEmail.trim()) { toast.error("Enter an email"); return; }
    setIsInviting(true);
    await supabase.from("user_roles").upsert({ email: inviteEmail.trim().toLowerCase(), role: inviteRole, invited_by: user?.id, is_active: true, updated_at: new Date().toISOString() });
    setIsInviting(false); setInviteEmail(""); toast.success(`${inviteEmail} added as ${inviteRole}`); load();
  };

  const updateRole = async (id: string, newRole: string) => {
    await supabase.from("user_roles").update({ role: newRole, updated_at: new Date().toISOString() }).eq("id", id);
    toast.success("Role updated"); load();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("user_roles").update({ is_active: !current }).eq("id", id);
    load();
  };

  return (
    <AdminLayout title="Roles & Invite">
      <div className="space-y-6 max-w-3xl">
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
          <h3 className="font-bold text-white mb-4">Invite / Grant Role</h3>
          <div className="flex gap-3 flex-wrap">
            <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="user@email.com"
              className="flex-1 min-w-48 bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400" />
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
              className="bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400">
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={invite} disabled={isInviting}
              className="bg-yellow-400 text-black font-bold px-5 py-3 rounded-xl hover:bg-yellow-300 flex items-center gap-2">
              {isInviting ? <RefreshCw size={14} className="animate-spin" /> : <UserPlus size={14} />} Add
            </button>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h3 className="font-bold text-white">User Roles ({roles.length})</h3>
          </div>
          {roles.length === 0 ? (
            <p className="text-gray-500 text-center py-8 text-sm">No users added yet</p>
          ) : (
            <div className="divide-y divide-white/5">
              {roles.map((role) => (
                <div key={role.id} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{role.email}</p>
                    <p className="text-xs text-gray-500">{new Date(role.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select value={role.role} onChange={(e) => updateRole(role.id, e.target.value)}
                      className="bg-[#0f0f0f] border border-white/20 text-white rounded-lg px-3 py-1.5 text-sm outline-none">
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button onClick={() => toggleActive(role.id, role.is_active)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${role.is_active ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>
                      {role.is_active ? "Active" : "Locked"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
