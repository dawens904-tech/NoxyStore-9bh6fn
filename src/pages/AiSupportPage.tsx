
/**
 * AI Support Chat Page — powered by OnSpace AI with full order context
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { FunctionsHttpError } from "@supabase/supabase-js";

interface Message {
  role: "user" | "assistant";
  content: string;
  ts?: Date;
}

const QUICK_QUESTIONS = [
  "Is it safe to top up on NoxyStore?",
  "How can I refund the balance to my bank?",
  "I entered the wrong UID/Server/Information. What should I do?",
  "How do I file a complaint against a seller/If the seller cannot resolve my issue, can I ask the platform for help?",
  "Why hasn't my purchase/top-up item arrived yet?",
];

let batchIndex = 0;

export function AiSupportPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `ai_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`);
  const [questionBatch, setQuestionBatch] = useState(QUICK_QUESTIONS.slice(0, 5));
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: text.trim(), ts: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

    // Save user message to DB
    supabase.from("chat_messages").insert({
      session_id: sessionId,
      user_email: user?.email,
      sender: "user",
      content: text.trim(),
    }).then(() => {});

    const { data, error } = await supabase.functions.invoke("ai-support", {
      body: {
        messages: history,
        userEmail: user?.email,
        sessionId,
      },
    });

    if (error) {
      let errMsg = error.message;
      if (error instanceof FunctionsHttpError) {
        try { errMsg = await error.context?.text() || errMsg; } catch {}
      }
      console.error("[AI Support]", errMsg);
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        ts: new Date(),
      }]);
    } else {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: data.reply,
        ts: new Date(),
      }]);
    }
    setIsLoading(false);
  }, [messages, isLoading, user, sessionId]);

  const handleNewBatch = () => {
    batchIndex = (batchIndex + 1) % Math.ceil(QUICK_QUESTIONS.length / 5);
    const start = batchIndex * 5;
    setQuestionBatch(QUICK_QUESTIONS.slice(start, start + 5).concat(
      QUICK_QUESTIONS.slice(0, Math.max(0, 5 - (QUICK_QUESTIONS.length - start)))
    ));
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* Header */}
      <div className="bg-white sticky top-0 z-40 border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/support")} className="p-1">
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <div className="w-9 h-9 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="4" fill="black"/>
              <path d="M8 9h8M8 12h5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">AI support</p>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-xs text-gray-500">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mb-1">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                  <rect x="2" y="2" width="20" height="20" rx="4" fill="black"/>
                  <path d="M7 9h10M7 13h7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-yellow-400 text-black rounded-br-md"
                : "bg-white text-gray-800 rounded-bl-md shadow-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-end gap-2">
            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                <rect x="2" y="2" width="20" height="20" rx="4" fill="black"/>
                <path d="M7 9h10M7 13h7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                {[0,1,2].map((i) => (
                  <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick Questions */}
      {messages.length === 0 && (
        <div className="px-4 pb-2">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="font-bold text-gray-900 text-sm">Do you want to know</span>
              <button onClick={handleNewBatch} className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded-full px-3 py-1.5 hover:bg-gray-50">
                <RefreshCw size={10} /> Change a new batch
              </button>
            </div>
            {questionBatch.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="w-full text-left px-4 py-3 border-b border-gray-100 last:border-0 flex items-start justify-between gap-2 hover:bg-gray-50 text-sm text-gray-700"
              >
                <span>{i + 1}. {q}</span>
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm text-gray-800 outline-none placeholder-gray-400"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
              input.trim() && !isLoading ? "bg-yellow-400 hover:bg-yellow-300" : "bg-gray-200"
            }`}
          >
            <Send size={16} className={input.trim() && !isLoading ? "text-black" : "text-gray-400"} />
          </button>
        </div>
      </div>
    </div>
  );
}
