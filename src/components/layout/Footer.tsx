import { Link } from "react-router-dom";
import { Shield, Headphones, CreditCard } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-8 rounded-2xl overflow-hidden">
      {/* Why Choose Us */}
      <div className="bg-gray-50 py-10 px-8">
        <h2 className="text-xl font-black text-gray-900 mb-6">Why Choose Us?</h2>
        <div className="grid grid-cols-3 gap-6">
          {[
            {
              icon: <Shield className="h-7 w-7 text-green-600" />,
              bg: "bg-green-100",
              title: "100% Safe Transaction",
              desc: "We ensure efficient, professional, and secure transactions with full protection of your data.",
            },
            {
              icon: <Headphones className="h-7 w-7 text-blue-600" />,
              bg: "bg-blue-100",
              title: "24/7 Customer Service",
              desc: "Our reliable team is available anytime, offering fast and convenient assistance before and after your purchase.",
            },
            {
              icon: <CreditCard className="h-7 w-7 text-orange-600" />,
              bg: "bg-orange-100",
              title: "Full Refund Guarantee",
              desc: "NoxyStore offers competitive prices and fast delivery. If goods are undelivered or unusable, we promise a 100% refund.",
            },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-4">
              <div className={`p-3 ${item.bg} rounded-xl flex-shrink-0`}>{item.icon}</div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="flex flex-wrap items-center justify-center gap-4 py-6 border-y border-gray-100 px-8">
        <img src="https://cdn.worldvectorlogo.com/logos/visa-2.svg" alt="Visa" className="h-5 opacity-60" />
        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b7/MasterCard_Logo.svg" alt="Mastercard" className="h-5 opacity-60" />
        <img src="https://cdn.worldvectorlogo.com/logos/paypal-2.svg" alt="PayPal" className="h-5 opacity-60" />
        <img src="https://cdn.worldvectorlogo.com/logos/apple-pay.svg" alt="Apple Pay" className="h-5 opacity-60" />
        <img src="https://cdn.worldvectorlogo.com/logos/google-pay-2.svg" alt="Google Pay" className="h-5 opacity-60" />
      </div>

      {/* Footer Links */}
      <div className="grid grid-cols-4 gap-8 px-8 py-8">
        <div>
          <h3 className="font-bold text-gray-900 mb-3 text-sm">Site Navigation</h3>
          <ul className="space-y-2 text-sm text-gray-500">
            <li><Link to="/categories?filter=Top+Up" className="hover:text-gray-800 transition-colors">Genshin Impact Top Up</Link></li>
            <li><Link to="/categories?filter=Top+Up" className="hover:text-gray-800 transition-colors">Honkai Star Rail Top Up</Link></li>
            <li><Link to="/categories?filter=Game+Coins" className="hover:text-gray-800 transition-colors">Game Coins</Link></li>
            <li><Link to="/categories?filter=Gift+Card" className="hover:text-gray-800 transition-colors">iTunes Gift Card US</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 mb-3 text-sm">Services</h3>
          <ul className="space-y-2 text-sm text-gray-500">
            <li><Link to="/about" className="hover:text-gray-800 transition-colors">About Us</Link></li>
            <li><Link to="/support" className="hover:text-gray-800 transition-colors">Help Center</Link></li>
            <li><Link to="/feedback" className="hover:text-gray-800 transition-colors">Feedback</Link></li>
            <li><Link to="/support/vip" className="hover:text-gray-800 transition-colors">VIP Service</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 mb-3 text-sm">Business</h3>
          <ul className="space-y-2 text-sm text-gray-500">
            <li><Link to="/affiliate" className="hover:text-gray-800 transition-colors">Affiliate Program</Link></li>
            <li><Link to="/affiliate" className="hover:text-gray-800 transition-colors">Open a Store</Link></li>
            <li><Link to="/invite" className="hover:text-gray-800 transition-colors">Invite for Coupons</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 mb-3 text-sm">Follow Us</h3>
          <div className="flex flex-wrap gap-2">
            <a href="https://discord.gg/NUpGeKrKK" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-[#5865F2] rounded-full flex items-center justify-center hover:opacity-80 transition-opacity">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
            </a>
            <a href="https://x.com/DawensH91377" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-black rounded-full flex items-center justify-center hover:opacity-80 transition-opacity">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.843L1.254 2.25H8.08l4.257 5.629L18.244 2.25z"/></svg>
            </a>
            <a href="https://www.youtube.com/@NoxyStore.com_Official" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-[#FF0000] rounded-full flex items-center justify-center hover:opacity-80 transition-opacity">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
          </div>
          <div className="mt-3">
            <h3 className="font-bold text-gray-900 mb-2 text-sm">Partners</h3>
            <ul className="space-y-1.5 text-sm text-gray-500">
              <li><a href="https://lootbar.gg/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-800 transition-colors">Lootbar.gg</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-100 px-8 py-4 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} NoxyStore.com — Official Gaming Top-Up Platform
      </div>
    </footer>
  );
}
