import { useEffect, useState, useRef } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Send, RefreshCw, Trash2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

interface GroupMessage {
  id: string;
  session_id: string;
  sender: string;
  content: string;
  user_email: string | null;
  created_at: string;
}

const GROUP_SESSION_ID = "global-group-chat";

export function AdminGroupChatPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadMessages(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function loadMessages() {
    setLoading(true);
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", GROUP_SESSION_ID)
      .order("created_at", { ascending: true })
      .limit(100);
    setMessages(data || []);
    setLoading(false);
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;
    const { error } = await supabase.from("chat_messages").insert({
      session_id: GROUP_SESSION_ID,
      sender: "admin",
      content: newMessage.trim(),
      user_email: user?.email,
    });
    if (error) { toast.error("Failed to send"); return; }
    setNewMessage("");
    loadMessages();
  }

  async function deleteMessage(id: string) {
    await supabase.from("chat_messages").delete().eq("id", id);
    setMessages(prev => prev.filter(m => m.id !== id));
  }

  async function clearAll() {
    if (!confirm("Clear all group messages?")) return;
    await supabase.from("chat_messages").delete().eq("session_id", GROUP_SESSION_ID);
    setMessages([]);
    toast.success("Chat cleared");
  }

  const isAdmin = (sender: string) => sender === "admin";

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white">
          <div>
            <h1 className="text-lg font-black text-gray-900">Group Chat</h1>
            <p className="text-xs text-gray-400">{messages.length} messages in global chat</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadMessages} className="text-gray-400 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={clearAll} className="flex items-center gap-1.5 text-red-500 border border-red-200 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-50">
              <Trash2 size={14} /> Clear All
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f5f5f5]">
          {loading ? (
            <div className="text-center py-8 text-sm text-gray-400">Loading messages…</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">No messages yet</div>
          ) : messages.map(msg => (
            <div key={msg.id} className={`flex items-start gap-2 group ${isAdmin(msg.sender) ? "justify-end" : "justify-start"}`}>
              {!isAdmin(msg.sender) && (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-700 flex-shrink-0">
                  {(msg.user_email || msg.sender)?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <div className={`max-w-[70%]`}>
                {!isAdmin(msg.sender) && (
                  <p className="text-[10px] text-gray-400 font-semibold mb-0.5 px-1">{msg.user_email || msg.sender}</p>
                )}
                <div className={`px-4 py-2.5 rounded-2xl text-sm relative ${isAdmin(msg.sender) ? "bg-yellow-400 text-black rounded-br-md" : "bg-white text-gray-900 rounded-bl-md shadow-sm"}`}>
                  {msg.content}
                  <p className="text-[10px] opacity-60 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</p>
                </div>
              </div>
              <button onClick={() => deleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 transition-opacity self-center">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-white border-t border-gray-200 p-3 flex gap-2">
          <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Send a message as admin…"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400" />
          <button onClick={sendMessage} className="bg-yellow-400 text-black px-4 rounded-xl font-bold hover:bg-yellow-300">
            <Send size={16} />
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
