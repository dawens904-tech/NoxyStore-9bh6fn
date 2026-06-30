import React from 'react';
import { 
  Gamepad2, 
  DollarSign, 
  Star, 
  Gift, 
  Sword, 
  BadgePercent, 
  Zap, 
  ShieldCheck, 
  Headphones,
  Wheat
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { DesktopHeader } from '@/components/layout/DesktopHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Real headers */}
      <div className="lg:hidden"><Header showMenu /></div>
      <div className="hidden lg:block"><DesktopHeader /></div>

      {/* ── Hero Section ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ minHeight: '520px' }}>
        <img
          src="/images/IMG_8724.JPG"
          alt="NoxyStore background"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ objectPosition: 'center 20%' }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/20 via-[#0a0a0a]/30 to-[#0a0a0a]" />

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-12 pb-40 lg:pb-48 lg:pt-20 max-w-3xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-yellow-400 rounded-xl flex items-center justify-center shadow-2xl">
              <Gamepad2 className="w-7 h-7 lg:w-9 lg:h-9 text-black" />
            </div>
            <span className="text-3xl lg:text-4xl font-black italic text-yellow-400 drop-shadow-2xl tracking-tight">NOXYSTORE</span>
          </div>

          <h1 className="text-xl lg:text-3xl font-black mb-3 drop-shadow-lg">About Us</h1>
          <p className="text-gray-200 text-sm lg:text-base max-w-xl mx-auto leading-relaxed drop-shadow">
            NoxyStore is a Secure and Trusted Game Store chosen by millions of players worldwide,
            offering game top-up, item trading, game currency services, and much more.
          </p>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <div className="bg-[#0a0a0a] px-4 py-8 lg:py-12">
        <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto lg:gap-8">
          {[
            { value: '150+', label: 'Games Supported on NoxyStore' },
            { value: '99%',  label: 'Purchases received 5-star reviews' },
            { value: '5M+',  label: "Gamers' Choice" },
          ].map((stat) => (
            <div key={stat.value} className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Wheat className="w-3 h-3 text-yellow-600 opacity-60" />
                <span className="text-2xl lg:text-4xl font-black text-white">{stat.value}</span>
                <Wheat className="w-3 h-3 text-yellow-600 opacity-60" />
              </div>
              <p className="text-[11px] lg:text-sm text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── What We Offer ─────────────────────────────────────────── */}
      <div className="bg-white text-gray-900 px-4 py-12 lg:py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl lg:text-3xl font-black text-center mb-3">What does NoxyStore offer?</h2>
          <p className="text-center text-gray-500 text-sm lg:text-base max-w-xl mx-auto mb-10">
            Game top-up, game currency trading, game keys, gift cards, and game items for 150+ games.
            Safe, convenient, and efficient!
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { color: 'bg-orange-400', icon: <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-white" />, title: 'Game Top-Up', desc: 'Safe, reliable, and cost-effective top-up services for 80+ games.' },
              { color: 'bg-yellow-400', icon: <Star className="w-5 h-5 lg:w-6 lg:h-6 text-white" />, title: 'Game Coins', desc: 'Simple and affordable way to get in-game currency for 25+ games.' },
              { color: 'bg-red-400',    icon: <Gift className="w-5 h-5 lg:w-6 lg:h-6 text-white" />, title: 'Keys & Gift Cards', desc: 'Secure and fast delivery for Apple, Steam gift cards and more.' },
              { color: 'bg-blue-400',   icon: <Sword className="w-5 h-5 lg:w-6 lg:h-6 text-white" />, title: 'Game Items', desc: 'Direct, cost-effective service for in-game item purchases.' },
            ].map((item) => (
              <div key={item.title} className="bg-gray-50 rounded-2xl p-5 lg:p-6 text-center hover:shadow-md transition-shadow">
                <div className={`w-11 h-11 lg:w-14 lg:h-14 ${item.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  {item.icon}
                </div>
                <h3 className="font-black text-sm lg:text-base mb-1.5">{item.title}</h3>
                <p className="text-[11px] lg:text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Why Choose Us ─────────────────────────────────────────── */}
      <div className="bg-gray-100 text-gray-900 px-4 py-12 lg:py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl lg:text-3xl font-black text-center mb-3">Why choose NoxyStore?</h2>
          <p className="text-center text-gray-500 text-sm lg:text-base max-w-xl mx-auto mb-10">
            We provide a seamless and affordable game trading experience for players worldwide.
            Play more and pay less.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              { icon: <BadgePercent className="w-6 h-6 text-yellow-600" />, bg: 'bg-yellow-50', title: 'Best Prices', desc: 'Most competitive recharge prices — up to 30% off.' },
              { icon: <Zap className="w-6 h-6 text-blue-600" />, bg: 'bg-blue-50', title: 'Fast Delivery', desc: 'Fastest delivery in just 3 minutes for non-stop gaming.' },
              { icon: <ShieldCheck className="w-6 h-6 text-green-600" />, bg: 'bg-green-50', title: '100% Safe', desc: 'Professional and secure transactions with full data protection.' },
              { icon: <Headphones className="w-6 h-6 text-purple-600" />, bg: 'bg-purple-50', title: '24/7 Support', desc: 'Support team available anytime before, during, and after purchase.' },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className={`w-14 h-14 lg:w-16 lg:h-16 ${item.bg} rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm`}>
                  {item.icon}
                </div>
                <h3 className="font-black text-sm lg:text-base mb-1">{item.title}</h3>
                <p className="text-[11px] lg:text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop footer */}
      <div className="hidden lg:block">
        <Footer />
      </div>

      <BottomNav />
    </div>
  );
}
make desktop version better show photo header an like mobile also remove dark in footer make white only add mobile footer.
