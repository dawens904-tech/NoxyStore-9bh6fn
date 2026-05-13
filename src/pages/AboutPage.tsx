/**
 * About Us Page — NoxyStore info + legal links
 */
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";

const LINKS = [
  { label: "About Us", href: "/about-us" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Cookie Policy", href: "/cookies" },
];

function NavItem({ label, href }: { label: string; href: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(href)}
      className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-gray-50 transition-colors"
    >
      <span className="font-medium text-gray-800">{label}</span>
      <ChevronRight size={18} className="text-gray-400" />
    </button>
  );
}

export function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <div className="bg-white sticky top-0 z-40 border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft size={20} className="text-gray-700" /></button>
          <h1 className="font-bold text-gray-900 flex-1 text-center">About Us</h1>
          <div className="w-8" />
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-yellow-50 to-amber-100 px-4 py-10 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-black mb-1">
            <span className="text-yellow-500">NOXY</span><span className="text-gray-900">STORE</span><span className="text-yellow-500">.com</span>
          </div>
          <p className="text-sm text-gray-500">Official Gaming Top-Up Platform</p>
        </div>
      </div>

      {/* Links */}
      <div className="bg-white mt-3 divide-y divide-gray-100">
        {LINKS.map((item) => (
          <NavItem key={item.label} label={item.label} href={item.href} />
        ))}
      </div>

      <div className="px-4 py-6 text-center text-xs text-gray-400">
        <p>© {new Date().getFullYear()} NoxyStore.com · All rights reserved</p>
        <p className="mt-1">Powered by Lootbar.gg Reseller Network</p>
      </div>
    </div>
  );
}

