import { MessageCircle } from "lucide-react";
import { useState } from "react";

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-20 right-4 z-40">
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 mb-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">Live Support</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-3">Hi! How can we help you today?</p>
          <div className="space-y-2">
            {["Track my order", "Payment issue", "Top-up not received"].map((q) => (
              <button
                key={q}
                className="w-full text-left text-sm bg-gray-50 hover:bg-yellow-50 border border-gray-200 hover:border-yellow-300 rounded-xl px-3 py-2 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-13 h-13 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow active:scale-95"
        style={{ width: 52, height: 52 }}
      >
        <MessageCircle size={24} className="text-white" />
        <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
      </button>
    </div>
  );
}
