/**
 * GroupChatPage — Public community chat room.
 * All users (and guests) can read messages.
 * Logged-in users can send text, photos, and voice notes.
 * Uses 3-second polling for real-time feel.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Send, Image, Mic, MicOff, X, Play, Pause,
  Users, Shield
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

const POLL_INTERVAL = 3000;
const BUCKET = "chat-images";
const SESSION_ID = "group-chat-main";
const MAX_VOICE_SECONDS = 60;

interface ChatMessage {
  id: string;
  sender: string;        // display name
  user_id?: string;
  content: string;
  image_url?: string;
  is_read: boolean;
  created_at: string;
}

// ─── Voice recorder hook ────────────────────────────────────────────────────
function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(async () => {
    setAudioBlob(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_VOICE_SECONDS) { stop(); return s + 1; }
          return s + 1;
        });
      }, 1000);
    } catch {
      toast.error("Microphone access denied");
    }
  }, []);

  const stop = useCallback(() => {
    mediaRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  }, []);

  const cancel = useCallback(() => {
    stop();
    setAudioBlob(null);
    setSeconds(0);
  }, [stop]);

  return { recording, seconds, audioBlob, start, stop, cancel, setAudioBlob };
}

// ─── Audio player bubble ────────────────────────────────────────────────────
function AudioBubble({ src }: { src: string }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;
    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.ontimeupdate = () => setProgress(audio.currentTime / (audio.duration || 1));
    audio.onended = () => { setPlaying(false); setProgress(0); };
    return () => { audio.pause(); };
  }, [src]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <button
        onClick={toggle}
        className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0"
      >
        {playing ? <Pause size={14} className="text-black" /> : <Play size={14} className="text-black ml-0.5" />}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 rounded-full transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span className="text-[10px] text-gray-400">
          {Math.round(duration)}s voice
        </span>
      </div>
    </div>
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const seed = encodeURIComponent(name);
  return (
    <div className="w-9 h-9 rounded-full overflow-hidden bg-yellow-100 border-2 border-yellow-300 flex-shrink-0">
      <img
        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=fef3c7`}
        alt={name}
        className="w-full h-full"
      />
    </div>
  );
}

// ─── Message bubble ────────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn }: { msg: ChatMessage; isOwn: boolean }) {
  const isVoice = msg.image_url?.includes("/voice/") || msg.content === "__voice__";
  const isImage = msg.image_url && !isVoice;
  const time = new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (isOwn) {
    return (
      <div className="flex flex-col items-end gap-1 mb-3">
        <span className="text-[10px] text-gray-400 mr-1">You · {time}</span>
        <div className="flex items-end gap-2">
          <div className="max-w-[75vw] lg:max-w-[400px]">
            {isImage && (
              <img
                src={msg.image_url!}
                alt="photo"
                className="max-w-full rounded-tl-2xl rounded-tr-sm rounded-b-2xl border border-yellow-200 max-h-60 object-cover block mb-1"
              />
            )}
            {isVoice && msg.image_url && (
              <div className="bg-yellow-400 text-black px-4 py-3 rounded-tl-2xl rounded-tr-sm rounded-b-2xl mb-1">
                <AudioBubble src={msg.image_url} />
              </div>
            )}
            {!isVoice && msg.content && msg.content !== "__image__" && (
              <div className="bg-yellow-400 text-black px-4 py-2.5 rounded-tl-2xl rounded-tr-sm rounded-b-2xl text-sm font-medium break-words">
                {msg.content}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 mb-3">
      <Avatar name={msg.sender} />
      <div className="max-w-[75vw] lg:max-w-[400px]">
        <span className="text-[10px] text-gray-400 ml-1">{msg.sender} · {time}</span>
        {isImage && (
          <img
            src={msg.image_url!}
            alt="photo"
            className="max-w-full rounded-tr-2xl rounded-tl-sm rounded-b-2xl border border-gray-200 max-h-60 object-cover block mt-1"
          />
        )}
        {isVoice && msg.image_url && (
          <div className="bg-white border border-gray-200 text-gray-900 px-4 py-3 rounded-tr-2xl rounded-tl-sm rounded-b-2xl mt-1">
            <AudioBubble src={msg.image_url} />
          </div>
        )}
        {!isVoice && msg.content && msg.content !== "__image__" && (
          <div className="bg-white border border-gray-200 text-gray-900 px-4 py-2.5 rounded-tr-2xl rounded-tl-sm rounded-b-2xl text-sm break-words mt-1">
            {msg.content}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export function GroupChatPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [imagePreview, setImagePreview] = useState<{ file: File; url: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const voice = useVoiceRecorder();

  const displayName = user?.username || user?.email?.split("@")[0] || "Guest";

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", SESSION_ID)
      .order("created_at", { ascending: true })
      .limit(100);
    if (data) setMessages(data as ChatMessage[]);
    // Simulate online count (real: would need presence tracking)
    setOnlineCount(Math.floor(Math.random() * 20) + 5);
  }, []);

  useEffect(() => {
    fetchMessages();
    pollerRef.current = setInterval(fetchMessages, POLL_INTERVAL);
    return () => { if (pollerRef.current) clearInterval(pollerRef.current); };
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split(".").pop() || "bin";
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) { toast.error("Upload failed"); return null; }
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return urlData.publicUrl;
  };

  const sendMessage = async (opts?: { content?: string; imageUrl?: string; isVoice?: boolean }) => {
    if (!isAuthenticated) { toast.error("Please log in to send messages"); navigate("/login"); return; }
    if (sending) return;
    const content = opts?.content ?? text.trim();
    const imageUrl = opts?.imageUrl;
    if (!content && !imageUrl) return;
    setSending(true);
    try {
      await supabase.from("chat_messages").insert({
        session_id: SESSION_ID,
        user_email: user!.email,
        user_id: user!.id,
        sender: displayName,
        content: imageUrl && !content ? (opts?.isVoice ? "__voice__" : "__image__") : content,
        image_url: imageUrl || null,
        is_read: false,
      });
      setText("");
      await fetchMessages();
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleSendText = () => {
    if (!text.trim()) return;
    sendMessage({ content: text.trim() });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    const url = URL.createObjectURL(file);
    setImagePreview({ file, url });
  };

  const handleSendImage = async () => {
    if (!imagePreview) return;
    setSending(true);
    const imageUrl = await uploadFile(imagePreview.file, "chat");
    setImagePreview(null);
    if (imageUrl) await sendMessage({ imageUrl, content: text.trim() || "" });
    setSending(false);
  };

  const handleSendVoice = async () => {
    if (!voice.audioBlob) return;
    setSending(true);
    const file = new File([voice.audioBlob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
    const imageUrl = await uploadFile(file, "chat/voice");
    voice.setAudioBlob(null);
    if (imageUrl) await sendMessage({ imageUrl, isVoice: true });
    setSending(false);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-40 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="text-gray-700 p-1">
          <ArrowLeft size={20} />
        </button>
        <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
          <Users size={18} className="text-black" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-900 text-sm">NoxyStore Community</p>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-xs text-gray-500">{onlineCount} online</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-gray-400">
          <Shield size={14} />
          <span className="text-xs">Safe</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
              <Users size={28} className="text-yellow-500" />
            </div>
            <p className="font-bold text-gray-700 mb-1">NoxyStore Community</p>
            <p className="text-sm text-gray-400 max-w-xs">
              Say hello! This is the beginning of the community chat. All members can see your messages.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isOwn={msg.user_id === user?.id || msg.user_email === user?.email}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="px-4 py-3 bg-white border-t border-gray-200 flex items-center gap-3 flex-shrink-0">
          <div className="relative">
            <img src={imagePreview.url} alt="preview" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center"
            >
              <X size={12} />
            </button>
          </div>
          <div className="flex-1">
            {text && <p className="text-sm text-gray-600 truncate mb-2">"{text}"</p>}
            <button
              onClick={handleSendImage}
              disabled={sending}
              className="bg-yellow-400 text-black font-bold px-5 py-2 text-sm disabled:opacity-60"
              style={{ borderRadius: 0 }}
            >
              {sending ? "Sending..." : "Send Photo"}
            </button>
          </div>
        </div>
      )}

      {/* Voice preview */}
      {voice.audioBlob && !voice.recording && (
        <div className="px-4 py-3 bg-white border-t border-gray-200 flex items-center gap-3 flex-shrink-0">
          <div className="flex-1">
            <AudioBubble src={URL.createObjectURL(voice.audioBlob)} />
          </div>
          <button onClick={voice.cancel} className="text-gray-400 p-1"><X size={18} /></button>
          <button
            onClick={handleSendVoice}
            disabled={sending}
            className="bg-yellow-400 text-black font-bold px-5 py-2 text-sm disabled:opacity-60"
            style={{ borderRadius: 0 }}
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      )}

      {/* Recording indicator */}
      {voice.recording && (
        <div className="px-4 py-3 bg-red-50 border-t border-red-200 flex items-center gap-3 flex-shrink-0">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm text-red-600 font-semibold flex-1">
            Recording... {voice.seconds}s / {MAX_VOICE_SECONDS}s
          </span>
          <button
            onClick={voice.stop}
            className="bg-red-500 text-white font-bold px-4 py-2 text-sm"
            style={{ borderRadius: 0 }}
          >
            Stop
          </button>
          <button onClick={voice.cancel} className="text-gray-400 p-1"><X size={18} /></button>
        </div>
      )}

      {/* Input bar */}
      {!imagePreview && !voice.audioBlob && !voice.recording && (
        <div className="px-3 py-3 bg-white border-t border-gray-200 flex items-center gap-2 flex-shrink-0"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          {/* Photo */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-yellow-500 transition-colors flex-shrink-0"
          >
            <Image size={20} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />

          {/* Text input */}
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendText(); } }}
            placeholder={isAuthenticated ? "Message community..." : "Log in to send messages"}
            disabled={!isAuthenticated}
            className="flex-1 bg-gray-100 px-4 py-2.5 text-sm outline-none text-gray-900 placeholder-gray-400 disabled:opacity-60"
            style={{ borderRadius: 24 }}
          />

          {/* Voice */}
          <button
            onClick={voice.recording ? voice.stop : voice.start}
            disabled={!isAuthenticated}
            className={`w-10 h-10 flex items-center justify-center transition-colors flex-shrink-0 disabled:opacity-40 ${voice.recording ? "text-red-500" : "text-gray-500 hover:text-yellow-500"}`}
          >
            {voice.recording ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Send */}
          {text.trim() && (
            <button
              onClick={handleSendText}
              disabled={sending || !isAuthenticated}
              className="w-10 h-10 bg-yellow-400 flex items-center justify-center disabled:opacity-60 flex-shrink-0"
              style={{ borderRadius: "50%" }}
            >
              <Send size={16} className="text-black" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
fix this page add real message saved real userr online mode and also add real voice send and stop like whatsapp and Add a pinned system welcome message in the group chat and give admins a gold crown badge next to their name in GroupChatPage.tsx to distinguish them from regular users.
