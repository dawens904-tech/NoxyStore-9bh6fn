/**
 * Feedback Page — list of tickets + New Ticket modal
 * Desktop: DesktopHeader + AccountSidebar + content panel (like BalancePage)
 * Mobile: full-screen with back arrow
 */
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, ChevronDown, Plus, ChevronRight, MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { AccountSidebar } from "@/components/features/AccountSidebar";
import { BottomNav } from "@/components/layout/BottomNav";

const CLASSIFICATIONS = [
  "Payment issues",
  "Top-up not received",
  "Wrong UID/Server",
  "Refund request",
  "Account security",
  "Technical issue",
  "Other",
];

interface Ticket {
  id: string;
  classification: string;
  content: string;
  contact_email: string;
  status: string;
  created_at: string;
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 bg-gray-100 flex items-center justify-center mb-4">
        <MessageSquare size={36} className="text-gray-300" />
      </div>
      <p className="text-gray-500 font-semibold text-sm">No tickets yet</p>
      <p className="text-gray-400 text-xs mt-1">Submit a new ticket to get support</p>
    </div>
  );
}

// ── New Ticket Form ───────────────────────────────────────────────────────────
function NewTicketForm({
  onClose,
  onSubmitted,
  defaultEmail,
}: {
  onClose: () => void;
  onSubmitted: (ticket: Ticket) => void;
  defaultEmail: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [classification, setClassification] = useState("Payment issues");
  const [content, setContent] = useState("");
  const [contactEmail, setContactEmail] = useState(defaultEmail);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    const ext = file.name.split(".").pop();
    const path = `chat/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("chat-images").upload(path, file);
    if (error) { toast.error("Upload failed"); return; }
    const { data: urlData } = supabase.storage.from("chat-images").getPublicUrl(path);
    setScreenshots((prev) => [...prev, urlData.publicUrl]);
    toast.success("Screenshot attached");
  };

  const handleSubmit = async () => {
    if (!content.trim()) { toast.error("Please describe your issue"); return; }
    if (!contactEmail.trim()) { toast.error("Please enter your contact email"); return; }
    setIsSubmitting(true);

    const ticketId = `TKT-${Date.now()}`;
    await supabase.from("chat_messages").insert({
      session_id: ticketId,
      user_email: contactEmail,
      sender: "user",
      content: `[TICKET] Classification: ${classification}\n\n${content}${screenshots.length > 0 ? `\n\nScreenshots: ${screenshots.join(", ")}` : ""}`,
    });
    await supabase.from("chat_sessions").upsert({
      id: ticketId,
      user_email: contactEmail,
      status: "waiting",
      updated_at: new Date().toISOString(),
    });

    setIsSubmitting(false);
    toast.success("Ticket submitted! Our team will contact you via email.");
    onSubmitted({
      id: ticketId,
      classification,
      content,
      contact_email: contactEmail,
      status: "open",
      created_at: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="space-y-5">
      {/* Classification */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Classification</label>
        <div className="relative">
          <button
            onClick={() => setShowClassDropdown(!showClassDropdown)}
            className="w-full border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm text-gray-800 font-medium flex items-center justify-between focus:border-yellow-400 focus:outline-none"
          >
            {classification}
            <ChevronDown size={15} className="text-gray-500" />
          </button>
          {showClassDropdown && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-lg z-20 mt-0.5 overflow-hidden">
              {CLASSIFICATIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => { setClassification(c); setShowClassDropdown(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                    classification === c ? "text-yellow-600 font-semibold bg-yellow-50" : "text-gray-700"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Question content */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Question content</label>
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 400))}
            placeholder="Describe your issue in detail..."
            rows={7}
            className="w-full border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none resize-none placeholder-gray-400 focus:border-yellow-400"
          />
          <span className="absolute bottom-3 right-3 text-xs text-gray-400">{content.length}/400</span>
        </div>
      </div>

      {/* Screenshots */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Screenshots <span className="font-normal text-gray-400">(optional, max 3)</span></label>
        <div className="flex gap-2 flex-wrap">
          {screenshots.map((url, i) => (
            <div key={i} className="relative w-20 h-20">
              <img src={url} alt="screenshot" className="w-full h-full object-cover" />
              <button
                onClick={() => setScreenshots((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 flex items-center justify-center"
              >
                <X size={10} className="text-white" />
              </button>
            </div>
          ))}
          {screenshots.length < 3 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 border-2 border-dashed border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <Plus size={20} className="text-gray-400" />
            </button>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </div>

      {/* Contact email */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Contact Email *</label>
        <input
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none placeholder-gray-400 focus:border-yellow-400"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-4 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : "Submit Ticket"}
      </button>
    </div>
  );
}

// ── Ticket List ───────────────────────────────────────────────────────────────
function TicketList({ tickets }: { tickets: Ticket[] }) {
  if (tickets.length === 0) return <EmptyState />;
  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <div key={ticket.id} className="bg-gray-50 border border-gray-100 p-4">
          <div className="flex items-start justify-between mb-2">
            <span className="text-sm font-bold text-gray-800">{ticket.classification}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 ${
              ticket.status === "open" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
            }`}>
              {ticket.status === "open" ? "OPEN" : "RESOLVED"}
            </span>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{ticket.content}</p>
          <p className="text-xs text-gray-400 mt-2">{new Date(ticket.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function FeedbackPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showNewTicket, setShowNewTicket] = useState(false);

  const handleSubmitted = (ticket: Ticket) => {
    setTickets((prev) => [ticket, ...prev]);
  };

  return (
    <>
      {/* ── Desktop ── */}
      <div className="hidden lg:block min-h-screen bg-[#f5f5f5]">
        <DesktopHeader />
        <div className="max-w-[1280px] mx-auto px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <button onClick={() => navigate("/")} className="hover:text-gray-700">Home</button>
            <ChevronRight size={14} />
            <button onClick={() => navigate("/account")} className="hover:text-gray-700">Account</button>
            <ChevronRight size={14} />
            <span className="text-gray-800 font-medium">Feedback</span>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto px-6 pb-12">
          <div className="flex gap-6">
            <AccountSidebar activePage="feedback" className="sticky top-[72px] self-start" />

            {/* Content */}
            <div className="flex-1">
              {!showNewTicket ? (
                <>
                  {/* Header card */}
                  <div className="bg-white p-6 mb-4 flex items-center justify-between shadow-sm">
                    <div>
                      <h1 className="text-xl font-black text-gray-900">Feedback & Support</h1>
                      <p className="text-sm text-gray-500 mt-0.5">Submit a ticket and our team will respond via email</p>
                    </div>
                    <button
                      onClick={() => setShowNewTicket(true)}
                      className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-5 py-3 transition-colors"
                    >
                      <Plus size={16} /> New Ticket
                    </button>
                  </div>

                  {/* Ticket list */}
                  <div className="bg-white p-6 shadow-sm">
                    <h2 className="text-sm font-bold text-gray-700 mb-4">My Tickets ({tickets.length})</h2>
                    <TicketList tickets={tickets} />
                  </div>
                </>
              ) : (
                <>
                  {/* Back header */}
                  <div className="bg-white p-6 mb-4 flex items-center gap-3 shadow-sm">
                    <button onClick={() => setShowNewTicket(false)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors">
                      <ArrowLeft size={18} className="text-gray-700" />
                    </button>
                    <h1 className="text-xl font-black text-gray-900">New Ticket</h1>
                  </div>

                  {/* Form */}
                  <div className="bg-white p-6 shadow-sm">
                    <NewTicketForm
                      onClose={() => setShowNewTicket(false)}
                      onSubmitted={handleSubmitted}
                      defaultEmail={user?.email || ""}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile ── */}
      <div className="lg:hidden min-h-screen bg-[#f5f5f5] flex flex-col">
        {/* Header */}
        <div className="bg-[#0a0a0a] sticky top-0 z-40">
          <div className="flex items-center gap-3 px-4 py-3.5" style={{ paddingTop: "calc(0.875rem + env(safe-area-inset-top))" }}>
            <button
              onClick={showNewTicket ? () => setShowNewTicket(false) : () => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <span className="text-white font-bold flex-1 text-center text-base">
              {showNewTicket ? "New Ticket" : "Feedback"}
            </span>
            <div className="w-8" />
          </div>
        </div>

        {!showNewTicket ? (
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-4">
                <TicketList tickets={tickets} />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-4" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
              <button
                onClick={() => setShowNewTicket(true)}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-4 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} /> New Ticket
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-5" style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}>
            <NewTicketForm
              onClose={() => setShowNewTicket(false)}
              onSubmitted={handleSubmitted}
              defaultEmail={user?.email || ""}
            />
          </div>
        )}

        <BottomNav />
      </div>
    </>
  );
}
