import { useNavigate } from "react-router-dom";
import { Shield, Headphones, CreditCard } from "lucide-react";

function XIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.843L1.254 2.25H8.08l4.257 5.629L18.244 2.25z"/></svg>;
}
function YoutubeIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
}
function DiscordIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>;
}

export function Footer() {
  const navigate = useNavigate();
  return (
    <footer className="hidden lg:block bg-[#111111] text-white mt-16">
      {/* Trust bar */}
      <div className="bg-[#1a1a1a] border-b border-white/10 py-8">
        <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-3 gap-6">
          {[
            { icon: Shield, title: "100% Safe Transaction", desc: "All transactions are fully protected. Your data is never shared." },
            { icon: Headphones, title: "24/7 Customer Service", desc: "Our support team is always available to help you before, during, and after your purchase." },
            { icon: CreditCard, title: "Full Refund Guarantee", desc: "If goods are undelivered or unusable, we promise a 100% refund." },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-400/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <item.icon size={22} className="text-yellow-400" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">{item.title}</p>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-[1280px] mx-auto px-6 py-12">
        <div className="grid grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <button onClick={() => navigate("/")} className="font-black text-2xl tracking-tight mb-3 block">
              <span className="text-yellow-400">NOXY</span><span className="text-white">STORE</span><span className="text-yellow-400 text-sm">.gg</span>
            </button>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">The trusted gaming marketplace for top-ups, game coins, gift cards, and more. Safe, fast, and affordable.</p>
            {/* Payment badges */}
            <div className="flex items-center gap-3 flex-wrap">
              {[
                { label: "VISA", bg: "bg-[#1A1F71]", text: "text-white" },
                { label: "MC", bg: "bg-[#EB001B]", text: "text-white" },
                { label: "PayPal", bg: "bg-[#003087]", text: "text-white" },
                { label: "BTC", bg: "bg-[#F7931A]", text: "text-white" },
              ].map((p) => (
                <span key={p.label} className={`${p.bg} ${p.text} text-[10px] font-black px-2.5 py-1 rounded-lg`}>{p.label}</span>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="font-bold text-white text-sm mb-4">Store</p>
            <ul className="space-y-2.5">
              {[
                { label: "All Games", path: "/games" },
                { label: "Top Up", path: "/categories?filter=Top%20Up" },
                { label: "Gift Cards", path: "/categories?filter=Gift%20Card" },
                { label: "Game Keys", path: "/categories?filter=Game%20Keys" },
              ].map((link) => (
                <li key={link.label}><button onClick={() => navigate(link.path)} className="text-gray-400 hover:text-white text-sm transition-colors">{link.label}</button></li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-bold text-white text-sm mb-4">Account</p>
            <ul className="space-y-2.5">
              {[
                { label: "My Account", path: "/account" },
                { label: "My Orders", path: "/account" },
                { label: "My Coupons", path: "/coupons" },
                { label: "Invite Friends", path: "/invite" },
                { label: "Affiliate Program", path: "/affiliate" },
              ].map((link) => (
                <li key={link.label}><button onClick={() => navigate(link.path)} className="text-gray-400 hover:text-white text-sm transition-colors">{link.label}</button></li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-bold text-white text-sm mb-4">Support</p>
            <ul className="space-y-2.5">
              {[
                { label: "Help Center", path: "/support" },
                { label: "AI Support", path: "/support/ai" },
                { label: "Feedback", path: "/feedback" },
                { label: "About Us", path: "/about" },
                { label: "Privacy Policy", path: "/about" },
              ].map((link) => (
                <li key={link.label}><button onClick={() => navigate(link.path)} className="text-gray-400 hover:text-white text-sm transition-colors">{link.label}</button></li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between mt-10 pt-8 border-t border-white/10">
          <p className="text-gray-500 text-sm">© {new Date().getFullYear()} NoxyStore.com · All rights reserved</p>
          <div className="flex items-center gap-3">
            {[
              { href: "https://x.com/DawensH91377", icon: <XIcon />, bg: "bg-black hover:bg-gray-800" },
              { href: "https://www.youtube.com/@NoxyStore.com_Official", icon: <YoutubeIcon />, bg: "bg-[#FF0000] hover:bg-[#CC0000]" },
              { href: "https://discord.gg/NUpGeKrKK", icon: <DiscordIcon />, bg: "bg-[#5865F2] hover:bg-[#4752C4]" },
            ].map((s, i) => (
              <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" className={`w-9 h-9 ${s.bg} rounded-full flex items-center justify-center text-white transition-colors`}>{s.icon}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
