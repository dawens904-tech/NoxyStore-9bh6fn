/**
 * Contact Page — multi-FAQ accordion, support form with name/email/type/message/photo upload
 * Desktop: two-column (FAQ left, form right) | Mobile: stacked with tab switcher
 */
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronRight, Upload, X, Send, Check, Loader2 } from "lucide-react";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

// ─── FAQ Data ─────────────────────────────────────────────────────────────────
const FAQ_CATEGORIES = [
  {
    category: "Orders & Payments",
    icon: "💳",
    items: [
      {
        q: "How long does a top-up take to complete?",
        a: "Most top-ups are delivered instantly (within 1–5 minutes). During peak hours or for some games, it may take up to 30 minutes. If it has been more than 1 hour, please contact us.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept Visa, Mastercard, JCB, American Express, PayPal, and major cryptocurrencies (BTC, ETH, USDT). More methods are being added regularly.",
      },
      {
        q: "Can I cancel or refund my order?",
        a: "Orders that have already been processed or delivered cannot be cancelled. If there is a technical issue or incorrect delivery, please submit a ticket within 24 hours.",
      },
      {
        q: "Why was my payment declined?",
        a: "Your bank may have blocked the transaction for security. Try a different payment method, or contact your bank. Make sure your billing address matches your card details.",
      },
    ],
  },
  {
    category: "Account & Security",
    icon: "🔐",
    items: [
      {
        q: "How do I reset my password?",
        a: "Go to Login → Forgot Password and enter your registered email. You'll receive a 4-digit OTP to verify your identity and set a new password.",
      },
      {
        q: "My account was compromised. What do I do?",
        a: "Immediately change your password and enable a Passkey for extra security. Contact our support team via this form with subject 'Account Security' and we'll assist you within 2 hours.",
      },
      {
        q: "How do I enable two-factor authentication?",
        a: "We use Passkeys (Face ID / Fingerprint / PIN) as a secure 2FA alternative. Go to Account → Passkey to create one. This replaces traditional 2FA apps.",
      },
    ],
  },
  {
    category: "Top-up & Game IDs",
    icon: "🎮",
    items: [
      {
        q: "I entered the wrong game ID. What happens?",
        a: "If the top-up was delivered to the wrong account, we cannot reverse it as it was sent to the game server. Always double-check your User ID and Server ID before confirming.",
      },
      {
        q: "Where do I find my User ID / Server ID?",
        a: "This varies per game. For Mobile Legends, it's in your profile under 'Basic Info'. For PUBG Mobile, it's in your in-game profile. Search '<game name> how to find user ID' for specific guides.",
      },
      {
        q: "The top-up was successful but I didn't receive diamonds/credits.",
        a: "Restart your game client and check your purchase history in-game. If still missing after 30 minutes, submit a support ticket with your Order ID and we'll investigate.",
      },
    ],
  },
  {
    category: "VIP & Points",
    icon: "⭐",
    items: [
      {
        q: "How do I earn VIP points?",
        a: "Points are earned on every purchase (amount varies by VIP tier), daily logins (+2 pts), inviting friends, and leaving reviews. Check the Points page for full details.",
      },
      {
        q: "When does my VIP membership expire?",
        a: "VIP membership is valid for 12 months from activation. It renews automatically if you maintain the required spending threshold. Check VIP Benefits page for details.",
      },
      {
        q: "Can I transfer my points or coupons to another account?",
        a: "Points and coupons are non-transferable and tied to your account. They cannot be cashed out or moved to another user.",
      },
    ],
  },
  {
    category: "Affiliate & Referrals",
    icon: "🤝",
    items: [
      {
        q: "How does the affiliate program work?",
        a: "Create your store link, share it, and earn a commission on every order placed through your link. Commission rates vary from 3%–10% based on your affiliate tier.",
      },
      {
        q: "When are affiliate commissions paid out?",
        a: "Commissions are settled monthly. Minimum payout is $10. Payouts are sent via Payoneer or direct bank transfer within 5 business days of the settlement date.",
      },
    ],
  },
];

// ─── Support Types ─────────────────────────────────────────────────────────────
const SUPPORT_TYPES = [
  "Order not received",
  "Wrong amount delivered",
  "Payment issue / declined",
  "Wrong game ID entered",
  "Refund request",
  "Account hacked / security",
  "Coupon / points issue",
  "Affiliate / commission",
  "Technical bug / error",
  "Partnership inquiry",
  "Other",
];

// ─── FAQ Accordion ─────────────────────────────────────────────────────────────
function FaqAccordion() {
  const [openCat, setOpenCat] = useState<number | null>(0);
  const [openItem, setOpenItem] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {FAQ_CATEGORIES.map((cat, ci) => (
        <div key={ci} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <button
            onClick={() => setOpenCat(openCat === ci ? null : ci)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{cat.icon}</span>
              <span className="font-bold text-gray-900 text-base">{cat.category}</span>
              <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{cat.items.length}</span>
            </div>
            <ChevronDown
              size={18}
              className={`text-gray-400 transition-transform duration-200 ${openCat === ci ? "rotate-180" : ""}`}
            />
          </button>

          {openCat === ci && (
            <div className="border-t border-gray-100 divide-y divide-gray-50">
              {cat.items.map((item, ii) => {
                const key = `${ci}-${ii}`;
                const isOpen = openItem === key;
                return (
                  <div key={ii}>
                    <button
                      onClick={() => setOpenItem(isOpen ? null : key)}
                      className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className={`text-sm pr-4 leading-snug ${isOpen ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                        {item.q}
                      </span>
                      <ChevronDown
                        size={14}
                        className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 bg-yellow-50/50">
                        <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Contact Form ──────────────────────────────────────────────────────────────
function ContactForm() {
  const { user } = useAuthStore();
  const [name, setName] = useState(user?.nickname || "");
  const [email, setEmail] = useState(user?.email || "");
  const [supportType, setSupportType] = useState("");
  const [showTypeDrop, setShowTypeDrop] = useState(false);
  const [message, setMessage] = useState("");
  const [photos, setPhotos] = useState<{ file: File; preview: string; url?: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 3) {
      toast.error("Maximum 3 photos allowed");
      return;
    }
    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} exceeds 5MB limit`); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotos((prev) => [...prev, { file, preview: ev.target?.result as string }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const photo of photos) {
      const ext = photo.file.name.split(".").pop() || "jpg";
      const path = `contact/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const buffer = await photo.file.arrayBuffer();
      const { error } = await supabase.storage
        .from("chat-images")
        .upload(path, buffer, { contentType: photo.file.type, upsert: false });
      if (error) { console.error("Upload error:", error); continue; }
      const { data } = supabase.storage.from("chat-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error("Please enter your name"); return; }
    if (!email.trim() || !email.includes("@")) { toast.error("Please enter a valid email"); return; }
    if (!supportType) { toast.error("Please select a support type"); return; }
    if (!message.trim() || message.trim().length < 20) { toast.error("Please describe your issue (at least 20 characters)"); return; }

    setIsSubmitting(true);

    let photoUrls: string[] = [];
    if (photos.length > 0) {
      setIsUploading(true);
      photoUrls = await uploadPhotos();
      setIsUploading(false);
    }

    const tid = `TKT-${Date.now()}`;
    const content = [
      `[CONTACT FORM]`,
      `Name: ${name.trim()}`,
      `Type: ${supportType}`,
      `\n${message.trim()}`,
      photoUrls.length > 0 ? `\nAttachments: ${photoUrls.join(", ")}` : "",
    ].filter(Boolean).join("\n");

    const { error: sessionErr } = await supabase.from("chat_sessions").upsert({
      id: tid,
      user_email: email.trim(),
      status: "waiting",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const { error: msgErr } = await supabase.from("chat_messages").insert({
      session_id: tid,
      user_email: email.trim(),
      sender: "user",
      content,
      image_url: photoUrls[0] || null,
      created_at: new Date().toISOString(),
    });

    setIsSubmitting(false);

    if (sessionErr || msgErr) {
      toast.error("Failed to submit. Please try again.");
      console.error({ sessionErr, msgErr });
      return;
    }

    setTicketId(tid);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={28} className="text-green-600" />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">Message Sent!</h3>
        <p className="text-gray-500 text-sm mb-1">Your support request has been submitted.</p>
        <p className="text-xs text-gray-400 font-mono mb-6">Ticket ID: {ticketId}</p>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          Our team will review your message and respond to <strong>{email}</strong> within 2–24 hours depending on volume.
        </p>
        <button
          onClick={() => { setSubmitted(false); setMessage(""); setPhotos([]); setSupportType(""); }}
          className="w-full border border-gray-200 rounded-xl py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 className="text-xl font-black text-gray-900">Contact Support</h2>
        <p className="text-sm text-gray-500 mt-0.5">We usually respond within 2–24 hours</p>
      </div>

      <div className="px-6 py-6 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-yellow-400 transition-colors placeholder-gray-400"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-yellow-400 transition-colors placeholder-gray-400"
          />
        </div>

        {/* Support Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Support Type <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <button
              onClick={() => setShowTypeDrop(!showTypeDrop)}
              className={`w-full border rounded-xl px-4 py-3 text-sm text-left flex items-center justify-between transition-colors ${supportType ? "border-yellow-400 text-gray-800" : "border-gray-200 text-gray-400"}`}
            >
              {supportType || "Select support category"}
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${showTypeDrop ? "rotate-180" : ""}`} />
            </button>
            {showTypeDrop && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 mt-1 max-h-60 overflow-y-auto">
                {SUPPORT_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => { setSupportType(type); setShowTypeDrop(false); }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0 flex items-center justify-between ${supportType === type ? "text-yellow-700 font-semibold bg-yellow-50" : "text-gray-700"}`}
                  >
                    {type}
                    {supportType === type && <Check size={14} className="text-yellow-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Message <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
              placeholder="Please describe your issue in detail. Include your order ID, game name, and any relevant information."
              rows={5}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-yellow-400 transition-colors resize-none placeholder-gray-400"
            />
            <span className="absolute bottom-3 right-3 text-xs text-gray-400">{message.length}/1000</span>
          </div>
          {message.length > 0 && message.trim().length < 20 && (
            <p className="text-xs text-red-500 mt-1">Please provide more detail (at least 20 characters)</p>
          )}
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Screenshots / Photos <span className="text-gray-400 font-normal">(optional, max 3)</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            {photos.map((photo, idx) => (
              <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80"
                >
                  <X size={10} className="text-white" />
                </button>
              </div>
            ))}
            {photos.length < 3 && (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 hover:border-yellow-400 hover:bg-yellow-50 transition-colors flex-shrink-0"
              >
                <Upload size={16} className="text-gray-400" />
                <span className="text-[10px] text-gray-400 font-medium">Add photo</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
          <p className="text-xs text-gray-400 mt-1.5">JPG, PNG, WEBP • Max 5MB per file</p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || isUploading}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all ${
            isSubmitting || isUploading
              ? "bg-yellow-200 text-yellow-600 cursor-not-allowed"
              : "bg-yellow-400 hover:bg-yellow-300 text-black"
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {isUploading ? "Uploading photos…" : "Submitting…"}
            </>
          ) : (
            <>
              <Send size={18} />
              Send Message
            </>
          )}
        </button>

        <p className="text-xs text-gray-400 text-center leading-relaxed">
          By submitting this form you agree to our{" "}
          <a href="/privacy" className="text-yellow-600 hover:underline">Privacy Policy</a>.
          Typical response time: 2–24 hours.
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function ContactPage() {
  const navigate = useNavigate();
  const [mobileTab, setMobileTab] = useState<"faq" | "contact">("faq");

  return (
    <>
      {/* ── Desktop ── */}
      <div className="hidden lg:block min-h-screen bg-[#f5f5f5]">
        <DesktopHeader />

        {/* Breadcrumb */}
        <div className="max-w-[1280px] mx-auto px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <button onClick={() => navigate("/")} className="hover:text-gray-700">Home</button>
            <ChevronRight size={14} />
            <span className="text-gray-800 font-medium">Contact Us</span>
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto px-6 pb-12">
          {/* Hero */}
          <div className="bg-gradient-to-r from-yellow-400 to-amber-400 rounded-2xl p-8 mb-8 flex items-center justify-between shadow-sm overflow-hidden relative">
            <div className="relative z-10">
              <h1 className="text-3xl font-black text-gray-900 mb-2">How can we help?</h1>
              <p className="text-gray-700 text-base max-w-md leading-relaxed">
                Browse our FAQ for instant answers, or send us a message and we'll respond within 24 hours.
              </p>
            </div>
            <div className="absolute right-8 top-0 bottom-0 flex items-center opacity-20">
              <svg viewBox="0 0 200 200" className="w-48 h-48">
                <circle cx="100" cy="100" r="80" fill="none" stroke="black" strokeWidth="4"/>
                <path d="M60 80 Q100 50 140 80 Q140 120 100 140 Q60 120 60 80Z" fill="black"/>
                <circle cx="100" cy="145" r="8" fill="black"/>
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Left: FAQ */}
            <div>
              <h2 className="text-xl font-black text-gray-900 mb-4">Frequently Asked Questions</h2>
              <FaqAccordion />
            </div>

            {/* Right: Form */}
            <div>
              <ContactForm />
            </div>
          </div>
        </div>

        <Footer />
      </div>

      {/* ── Mobile ── */}
      <div className="lg:hidden min-h-screen bg-[#f8f8f8]" style={{ paddingBottom: "5rem" }}>
        <Header showMenu />

        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-yellow-400 to-amber-400 px-4 py-6">
          <h1 className="text-2xl font-black text-gray-900">How can we help?</h1>
          <p className="text-gray-700 text-sm mt-1">Browse FAQ or contact our support team.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
          <button
            onClick={() => setMobileTab("faq")}
            className={`flex-1 py-3.5 text-sm font-bold border-b-2 transition-colors ${mobileTab === "faq" ? "border-yellow-400 text-gray-900" : "border-transparent text-gray-500"}`}
          >
            FAQ
          </button>
          <button
            onClick={() => setMobileTab("contact")}
            className={`flex-1 py-3.5 text-sm font-bold border-b-2 transition-colors ${mobileTab === "contact" ? "border-yellow-400 text-gray-900" : "border-transparent text-gray-500"}`}
          >
            Contact Us
          </button>
        </div>

        <div className="px-4 py-5">
          {mobileTab === "faq" && (
            <>
              <FaqAccordion />
              <div className="mt-6 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
                <p className="text-sm font-semibold text-gray-700 mb-1">Didn't find your answer?</p>
                <p className="text-xs text-gray-500 mb-4">Contact our support team directly.</p>
                <button
                  onClick={() => setMobileTab("contact")}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 rounded-xl text-sm"
                >
                  Contact Support
                </button>
              </div>
            </>
          )}
          {mobileTab === "contact" && <ContactForm />}
        </div>

        <BottomNav />
      </div>
    </>
  );
}
