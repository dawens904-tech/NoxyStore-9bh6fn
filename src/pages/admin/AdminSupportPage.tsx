/**
 * AdminSupportPage — Admin customer support chat panel
 *
 * Features:
 * - View all active/waiting chat sessions
 * - Enter any session to chat live with the user
 * - AI "Generate Suggestions" button → 5 quick replies from ai-support edge
 * - Admin picks one suggestion (or types manually) and sends
 * - When admin is in a session, the AI auto-reply is blocked
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import AdminSidebar from "./AdminSidebar";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import {
  MessageSquare, Send, Sparkles, Loader2, ChevronLeft,
  Circle, Clock, CheckCircle2, X, RefreshCw, User,
} from "lucide-react";
import { FunctionsHttpError } from "@supabase/supabase-js";

interface ChatSession {
  id: string;
  user_email: string | null;
  status: "ai" | "waiting" | "live" | "closed";
  admin_email: string | null;
  created_at: string;
  updated_at: string;
  lastMessage?: string;
  unreadCount?: number;
}

interface ChatMessage {
  id: string;
  session_id: string;
  user_email: string | null;
  sender: "user" | "admin" | "ai";
  content: string;
  image_url?: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  waiting: "bg-orange-400",
  live: "bg-green-500",
  ai: "bg-blue-400",
  closed: "bg-gray-300",
};

const STATUS_LABELS: Record<string, string> = {
  waiting: "Waiting",
  live: "Live",
  ai: "AI Only",
  closed: "Closed",
};

export default function AdminSupportPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "waiting" | "live" | "ai" | "closed">("all");
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user || user.role !== "admin") { navigate("/"); return; }
    loadSessions();
    // Poll sessions every 5s
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!selectedSession) return;
    loadMessages(selectedSession.id);
    // Poll messages every 3s when in a session
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadMessages(selectedSession.id), 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedSession?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSessions = async () => {
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(100);

    if (error) { console.error("loadSessions error:", error.message); return; }
    if (!data) return;

    // Attach last message preview
    const enriched: ChatSession[] = await Promise.all(
      data.map(async (s) => {
        const { data: lastMsgs } = await supabase
          .from("chat_messages")
          .select("content, sender, created_at")
          .eq("session_id", s.id)
          .order("created_at", { ascending: false })
          .limit(1);
        const lastMsg = lastMsgs?.[0];
        return {
          ...s,
          lastMessage: lastMsg?.content?.slice(0, 60) || "No messages yet",
        } as ChatSession;
      })
    );

    setSessions(enriched);
    setIsLoadingSessions(false);

    // Keep selected session in sync
    if (selectedSession) {
      const updated = enriched.find((s) => s.id === selectedSession.id);
      if (updated) setSelectedSession(updated);
    }
  };

  const loadMessages = async (sessionId: string) => {
    setIsLoadingMessages(true);
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as ChatMessage[]);
    setIsLoadingMessages(false);
  };

  const enterSession = async (session: ChatSession) => {
    setSelectedSession(session);
    setSuggestions([]);
    setInput("");

    // Set session status to "live" and assign this admin
    if (session.status !== "closed") {
      await supabase
        .from("chat_sessions")
        .update({
          status: "live",
          admin_email: user?.email,
          admin_joined_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.id);

      // Notify user that admin joined
      await supabase.from("chat_messages").insert({
        session_id: session.id,
        user_email: session.user_email,
        sender: "ai",
        content: "✅ A NoxyStore support agent has joined the chat. AI auto-replies are now paused.",
      });
    }
  };

  const leaveSession = async () => {
    if (!selectedSession) return;
    // Re-enable AI mode
    await supabase.from("chat_sessions").update({
      status: "ai",
      admin_email: null,
      updated_at: new Date().toISOString(),
    }).eq("id", selectedSession.id);

    await supabase.from("chat_messages").insert({
      session_id: selectedSession.id,
      user_email: selectedSession.user_email,
      sender: "ai",
      content: "The support agent has left the chat. AI support is now re-enabled. Type your message and we will respond shortly.",
    });

    setSelectedSession(null);
    setMessages([]);
    setSuggestions([]);
    toast.success("Left session — AI support re-enabled");
    loadSessions();
  };

  const closeSession = async () => {
    if (!selectedSession) return;
    await supabase.from("chat_sessions").update({
      status: "closed",
      closed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", selectedSession.id);

    await supabase.from("chat_messages").insert({
      session_id: selectedSession.id,
      user_email: selectedSession.user_email,
      sender: "ai",
      content: "This support session has been closed. Thank you for contacting NoxyStore. If you need further assistance, please start a new chat.",
    });

    toast.success("Session closed");
    setSelectedSession(null);
    setMessages([]);
    setSuggestions([]);
    loadSessions();
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !selectedSession || isSending) return;
    setIsSending(true);
    setInput("");
    setSuggestions([]);

    const { data: inserted } = await supabase.from("chat_messages").insert({
      session_id: selectedSession.id,
      user_email: selectedSession.user_email,
      sender: "admin",
      content: text.trim(),
    }).select().single();

    if (inserted) setMessages((prev) => [...prev, inserted as ChatMessage]);

    await supabase.from("chat_sessions").update({
      updated_at: new Date().toISOString(),
    }).eq("id", selectedSession.id);

    setIsSending(false);
  };

  const generateSuggestions = async () => {
    if (!selectedSession || isGeneratingSuggestions) return;
    setIsGeneratingSuggestions(true);
    setSuggestions([]);

    // Build conversation history for AI
    const history = messages
      .filter((m) => m.content && !m.content.startsWith("✅") && !m.content.startsWith("The support agent"))
      .map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.content || "[image]",
      }));

    const { data, error } = await supabase.functions.invoke("ai-support", {
      body: {
        messages: history,
        userEmail: selectedSession.user_email,
        sessionId: selectedSession.id,
        suggestMode: true, // returns 5 suggestions, does NOT save to DB
      },
    });

    setIsGeneratingSuggestions(false);

    if (error) {
      let msg = error.message;
      if (error instanceof FunctionsHttpError) {
        try { msg = await error.context?.text(); } catch { /* */ }
      }
      toast.error("AI suggestion failed: " + msg);
      return;
    }

    if (data?.suggestions && Array.isArray(data.suggestions)) {
      setSuggestions(data.suggestions);
    } else if (data?.reply) {
      // Fallback: split single reply into lines
      const lines = data.reply.split("\n").filter((l: string) => l.trim().length > 0).slice(0, 5);
      setSuggestions(lines);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const filteredSessions = sessions.filter((s) => {
    if (activeFilter === "all") return s.status !== "closed";
    return s.status === activeFilter;
  });

  if (!user || user.role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <AdminSidebar />
      <main className="ml-64 flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex flex-1 overflow-hidden">

          {/* ── Session List Panel ── */}
          <div className={`flex flex-col border-r border-gray-200 bg-white transition-all duration-200 ${selectedSession ? "w-80 flex-shrink-0" : "flex-1"}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h1 className="text-lg font-black text-gray-900">Customer Support</h1>
                <p className="text-xs text-gray-500 mt-0.5">{sessions.filter(s => s.status === "waiting").length} waiting · {sessions.filter(s => s.status === "live").length} live</p>
              </div>
              <button onClick={loadSessions} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors" title="Refresh">
                <RefreshCw size={14} className={isLoadingSessions ? "animate-spin text-gray-400" : "text-gray-600"} />
              </button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 px-4 py-3 border-b border-gray-100 overflow-x-auto">
              {(["all", "waiting", "live", "ai", "closed"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
                    activeFilter === f ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {f === "all" ? "Active" : STATUS_LABELS[f]}
                  {f === "waiting" && sessions.filter(s => s.status === "waiting").length > 0 && (
                    <span className="ml-1 bg-orange-500 text-white rounded-full px-1.5 text-[10px]">
                      {sessions.filter(s => s.status === "waiting").length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Session list */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingSessions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={20} className="animate-spin text-gray-400" />
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <MessageSquare size={32} className="text-gray-200 mb-3" />
                  <p className="text-gray-500 font-semibold text-sm">No sessions</p>
                  <p className="text-gray-400 text-xs mt-1">New chats will appear here automatically</p>
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => enterSession(session)}
                    className={`w-full text-left px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      selectedSession?.id === session.id ? "bg-yellow-50 border-l-2 border-l-yellow-400" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <User size={16} className="text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-sm font-bold text-gray-900 truncate">{session.user_email || "Guest"}</p>
                          <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{formatTime(session.updated_at)}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{session.lastMessage}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Circle size={7} className={`${STATUS_COLORS[session.status]} fill-current rounded-full`} />
                          <span className={`text-[10px] font-semibold ${
                            session.status === "waiting" ? "text-orange-500" :
                            session.status === "live" ? "text-green-600" :
                            "text-gray-400"
                          }`}>{STATUS_LABELS[session.status]}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ── Chat Panel ── */}
          {selectedSession && (
            <div className="flex-1 flex flex-col min-w-0 bg-[#eef0f3]">
              {/* Chat header */}
              <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
                <button onClick={leaveSession} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                  <ChevronLeft size={20} className="text-gray-600" />
                </button>
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User size={15} className="text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm">{selectedSession.user_email || "Guest"}</p>
                  <div className="flex items-center gap-1">
                    <Circle size={7} className={`${STATUS_COLORS[selectedSession.status]} fill-current rounded-full`} />
                    <span className="text-xs text-gray-500">{STATUS_LABELS[selectedSession.status]}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={generateSuggestions}
                    disabled={isGeneratingSuggestions}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60"
                  >
                    {isGeneratingSuggestions ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    AI Suggest
                  </button>
                  <button
                    onClick={closeSession}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition-colors border border-red-200"
                  >
                    <CheckCircle2 size={12} /> Close
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {isLoadingMessages && messages.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={20} className="animate-spin text-gray-400" />
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === "admin" ? "flex-row-reverse" : "flex-row"}`}>
                      {msg.sender !== "admin" && (
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${msg.sender === "ai" ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-600"}`}>
                          {msg.sender === "ai" ? "AI" : "U"}
                        </div>
                      )}
                      <div className={`max-w-[70%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.sender === "admin"
                          ? "bg-yellow-400 text-gray-900 rounded-br-sm"
                          : msg.sender === "ai"
                          ? "bg-blue-50 text-blue-900 border border-blue-100 rounded-bl-sm"
                          : "bg-white text-gray-800 rounded-bl-sm"
                      }`}>
                        {msg.sender === "admin" && <p className="text-[10px] font-bold text-gray-700 mb-1 opacity-70">You (Admin)</p>}
                        {msg.image_url ? (
                          <img src={msg.image_url} alt="attachment" className="rounded-xl max-w-full" />
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                        <p className={`text-[10px] mt-1 opacity-60 ${msg.sender === "admin" ? "text-right" : ""}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* AI Suggestions */}
              {suggestions.length > 0 && (
                <div className="bg-white border-t border-blue-100 px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={13} className="text-blue-500" />
                      <span className="text-xs font-bold text-blue-700">AI Quick Replies — click to use</span>
                    </div>
                    <button onClick={() => setSuggestions([])} className="text-gray-400 hover:text-gray-600">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setInput(s); setSuggestions([]); }}
                        className="w-full text-left text-xs text-gray-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg px-3 py-2 transition-colors leading-relaxed"
                      >
                        <span className="font-bold text-blue-500 mr-1.5">{idx + 1}.</span>{s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input bar */}
              <div className="bg-white border-t border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
                    placeholder="Type a message to the customer…"
                    className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm text-gray-800 outline-none placeholder-gray-400"
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || isSending}
                    className="w-10 h-10 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    {isSending ? <Loader2 size={15} className="animate-spin text-black" /> : <Send size={15} className="text-black" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Empty state when no session selected ── */}
          {!selectedSession && !isLoadingSessions && (
            <div className="hidden" />
          )}
        </div>
      </main>
    </div>
  );
}
