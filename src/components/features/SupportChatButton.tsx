/**
 * SupportChatButton — Floating 24/7 support button visible on all desktop pages.
 * Matches LootBar photo 15: white pill with "24/7" text and headset icon.
 */
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

export function SupportChatButton() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <button
      onClick={() => navigate("/support")}
      className="fixed bottom-8 right-6 z-[999] hidden lg:flex items-center gap-2 bg-white shadow-xl border border-gray-100 rounded-full pl-4 pr-3 py-3 hover:shadow-2xl hover:scale-105 transition-all duration-200 group"
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}
    >
      <span className="text-sm font-bold text-gray-800 whitespace-nowrap">24/7</span>
      <div className="w-9 h-9 rounded-full bg-yellow-400 flex items-center justify-center group-hover:bg-yellow-300 transition-colors flex-shrink-0">
        {/* Headset icon */}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-900">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
        </svg>
      </div>
    </button>
  );
}
