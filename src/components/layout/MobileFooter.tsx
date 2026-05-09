import { useNavigate } from "react-router-dom";

function XIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.843L1.254 2.25H8.08l4.257 5.629L18.244 2.25z"/></svg>;
}
function YoutubeIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
}
function DiscordIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>;
}

export function MobileFooter() {
  const navigate = useNavigate();
  return (
    <footer className="lg:hidden bg-[#111111] text-white px-4 py-8 mt-8">
      {/* Logo */}
      <button onClick={() => navigate("/")} className="font-black text-xl tracking-tight mb-4 block">
        <span className="text-yellow-400">NOXY</span><span className="text-white">STORE</span><span className="text-yellow-400 text-xs">.gg</span>
      </button>

      {/* Links */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {[
          { label: "All Games", path: "/games" },
          { label: "Categories", path: "/categories" },
          { label: "My Coupons", path: "/coupons" },
          { label: "Invite Friends", path: "/invite" },
          { label: "Affiliate", path: "/affiliate" },
          { label: "Help Center", path: "/support" },
          { label: "About Us", path: "/about" },
          { label: "Feedback", path: "/feedback" },
        ].map((link) => (
          <button key={link.label} onClick={() => navigate(link.path)} className="text-gray-400 text-sm text-left py-1">{link.label}</button>
        ))}
      </div>

      {/* Payment */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {[
          { label: "VISA", bg: "bg-[#1A1F71]" },
          { label: "MC", bg: "bg-[#EB001B]" },
          { label: "PayPal", bg: "bg-[#003087]" },
          { label: "BTC", bg: "bg-[#F7931A]" },
        ].map((p) => (
          <span key={p.label} className={`${p.bg} text-white text-[10px] font-black px-2.5 py-1 rounded-lg`}>{p.label}</span>
        ))}
      </div>

      {/* Social */}
      <div className="flex items-center gap-3 mb-5">
        {[
          { href: "https://x.com/DawensH91377", icon: <XIcon />, bg: "bg-black" },
          { href: "https://www.youtube.com/@NoxyStore.com_Official", icon: <YoutubeIcon />, bg: "bg-[#FF0000]" },
          { href: "https://discord.gg/NUpGeKrKK", icon: <DiscordIcon />, bg: "bg-[#5865F2]" },
        ].map((s, i) => (
          <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" className={`w-8 h-8 ${s.bg} rounded-full flex items-center justify-center text-white`}>{s.icon}</a>
        ))}
      </div>

      <p className="text-gray-600 text-xs">© {new Date().getFullYear()} NoxyStore.com · All rights reserved</p>
    </footer>
  );
}
