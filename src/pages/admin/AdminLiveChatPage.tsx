import { useEffect, useRef, useState } from "react";
import { Send, X, RefreshCw, MessageSquare } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

export function AdminLiveChatPage() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSessions();
    const i = setInterval(loadSessions, 5000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (!activeSession) return;
    loadMessages(activeSession);
    const i = setInterval(() => loadMessages(activeSession), 3000);
    return () => clearInterval(i);
  }, [activeSession]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const loadSessions = async () => {
    const { data } = await supabase.from("chat_sessions").select("*")
      .in("status", ["waiting", "live", "ai"]).order("updated_at", { ascending: false });
    if (data) setSessions(data);
  };

  const loadMessages = async (sid: string) => {
    const { data } = await supabase.from("chat_messages").select("*").eq("session_id", sid).order("created_at");
    if (data) setMessages(data);
  };

  const joinSession = async (sid: string) => {
    setActiveSession(sid);
    await supabase.from("chat_sessions").update({ status: "live", admin_email: user?.email, admin_joined_at: new Date().toISOString() }).eq("id", sid);
    await supabase.from("chat_messages").insert({ session_id: sid, sender: "admin", content: "A support agent has joined. How can I help you?" });
    await loadMessages(sid);
    toast.success("Joined chat");
  };

  const send = async () => {
    if (!input.trim() || !activeSession || isSending) return;
    setIsSending(true);
    const text = input.trim();
    setInput("");
    await supabase.from("chat_messages").insert({ session_id: activeSession, sender: "admin", content: text });
    await loadMessages(activeSession);
    setIsSending(false);
  };

  const closeSession = async (sid: string) => {
    await supabase.from("chat_sessions").update({ status: "ai", closed_at: new Date().toISOString() }).eq("id", sid);
    await supabase.from("chat_messages").insert({ session_id: sid, sender: "ai", content: "Support agent closed this chat. AI support is now available." });
    setActiveSession(null); setMessages([]); loadSessions();
    toast.success("Chat closed");
  };

  const waiting = sessions.filter(s => s.status === "waiting").length;

  return (
    <AdminLayout title={`Live Chat${waiting > 0 ? ` (${waiting} waiting)` : ""}`}>
      <div className="flex gap-4 max-w-5xl" style={{ height: "calc(100vh - 160px)" }}>
        {/* Sessions list */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-2 overflow-y-auto">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-bold text-white">Sessions</p>
            <button onClick={loadSessions} className="text-gray-400 hover:text-white"><RefreshCw size={14} /></button>
          </div>
          {sessions.length === 0 ? (
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 text-center">
              <MessageSquare size={24} className="text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-xs">No active sessions</p>
            </div>
          ) : sessions.map((s) => (
            <button key={s.id} onClick={() => { if (activeSession !== s.id) joinSession(s.id); }}
              className={`text-left p-3 rounded-xl border transition-all ${activeSession === s.id ? "border-yellow-400/50 bg-yellow-400/10" : s.status === "waiting" ? "border-orange-400/50 bg-orange-400/5" : "border-white/10 bg-[#1a1a1a]"}`}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-bold text-white truncate">{s.user_email || "Guest"}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  s.status === "waiting" ? "bg-orange-500/30 text-orange-400"
                  : s.status === "live" ? "bg-green-500/30 text-green-400"
                  : "bg-gray-500/30 text-gray-400"
                }`}>{s.status.toUpperCase()}</span>
              </div>
              <p className="text-[10px] text-gray-600">{new Date(s.updated_at).toLocaleTimeString()}</p>
            </button>
          ))}
        </div>

        {/* Chat area */}
        {activeSession ? (
          <div className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <p className="text-sm font-bold text-white">{sessions.find(s => s.id === activeSession)?.user_email || "Unknown"}</p>
              <div className="flex gap-2">
                <button onClick={() => closeSession(activeSession)} className="bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl px-3 py-1.5 text-xs font-semibold">Close</button>
                <button onClick={() => { setActiveSession(null); setMessages([]); }} className="text-gray-500 hover:text-white"><X size={16} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                    msg.sender === "admin" ? "bg-yellow-400 text-black"
                    : msg.sender === "ai" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    : "bg-white/10 text-white"
                  }`}>
                    {msg.image_url ? <img src={msg.image_url} alt="" className="rounded-xl max-w-full" /> : msg.content}
                    <p className={`text-[10px] mt-1 ${msg.sender === "admin" ? "text-black/50" : "text-gray-500"}`}>
                      {msg.sender === "admin" ? "You" : msg.sender === "ai" ? "AI" : "User"} · {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="px-4 py-3 border-t border-white/10 flex gap-2">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
                placeholder="Type a reply…"
                className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400 placeholder-gray-600" />
              <button onClick={send} disabled={!input.trim() || isSending}
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${input.trim() ? "bg-yellow-400 hover:bg-yellow-300" : "bg-white/10"}`}>
                <Send size={16} className={input.trim() ? "text-black" : "text-gray-600"} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={48} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold">Select a session to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
