import { useEffect, useState, useRef } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Send, RefreshCw, User, X } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

interface ChatSession {
  id: string;
  user_email: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  session_id: string;
  sender: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

export function AdminLiveChatPage() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadSessions(); }, []);
  useEffect(() => {
    if (activeSession) loadMessages(activeSession.id);
  }, [activeSession]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function loadSessions() {
    setLoading(true);
    const { data } = await supabase.from("chat_sessions").select("*").order("updated_at", { ascending: false }).limit(50);
    setSessions(data || []);
    setLoading(false);
  }

  async function loadMessages(sessionId: string) {
    const { data } = await supabase.from("chat_messages").select("*").eq("session_id", sessionId).order("created_at", { ascending: true });
    setMessages(data || []);
  }

  async function sendMessage() {
    if (!newMessage.trim() || !activeSession) return;
    const { error } = await supabase.from("chat_messages").insert({
      session_id: activeSession.id,
      sender: "admin",
      content: newMessage.trim(),
      user_email: user?.email,
    });
    if (error) { toast.error("Failed to send message"); return; }
    setNewMessage("");
    loadMessages(activeSession.id);
    await supabase.from("chat_sessions").update({ updated_at: new Date().toISOString() }).eq("id", activeSession.id);
  }

  async function closeSession(sessionId: string) {
    await supabase.from("chat_sessions").update({ status: "closed", closed_at: new Date().toISOString() }).eq("id", sessionId);
    toast.success("Session closed");
    loadSessions();
    if (activeSession?.id === sessionId) setActiveSession(null);
  }

  const statusColor = (s: string) => s === "open" ? "bg-green-400" : s === "ai" ? "bg-blue-400" : "bg-gray-300";

  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Sessions list */}
        <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Live Chat</h2>
            <button onClick={loadSessions} className="text-gray-400 hover:text-gray-600"><RefreshCw size={15} /></button>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-400">Loading…</div>
            ) : sessions.map(session => (
              <button key={session.id} onClick={() => setActiveSession(session)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${activeSession?.id === session.id ? "bg-yellow-50" : ""}`}>
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center">
                    <User size={16} className="text-gray-500" />
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${statusColor(session.status)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{session.user_email || "Anonymous"}</p>
                  <p className="text-xs text-gray-400">{new Date(session.updated_at).toLocaleString()}</p>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{session.status}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat panel */}
        {activeSession ? (
          <div className="flex-1 flex flex-col bg-[#f5f5f5]">
            <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900 text-sm">{activeSession.user_email || "Anonymous"}</p>
                <p className="text-xs text-gray-400 font-mono">{activeSession.id.slice(0, 12)}…</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => loadMessages(activeSession.id)} className="text-gray-400 hover:text-gray-600"><RefreshCw size={15} /></button>
                <button onClick={() => closeSession(activeSession.id)} className="flex items-center gap-1.5 bg-red-50 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-100">
                  <X size={12} /> Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${msg.sender === "admin" ? "bg-yellow-400 text-black rounded-br-md" : "bg-white text-gray-900 rounded-bl-md shadow-sm"}`}>
                    {msg.content}
                    <p className="text-[10px] opacity-60 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="bg-white border-t border-gray-200 p-3 flex gap-2">
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Type a message…" className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400" />
              <button onClick={sendMessage} className="bg-yellow-400 text-black px-4 rounded-xl font-bold hover:bg-yellow-300">
                <Send size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <User size={28} className="text-gray-300" />
              </div>
              <p className="text-sm font-semibold">Select a conversation</p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
