import React from 'react';
import { ShieldCheck, Search, Lock, MessageCircle, CreditCard, RefreshCw } from 'lucide-react';
import { AppSettings } from '../types';

interface HeaderProps {
  settings: AppSettings;
  onOpenStore: () => void;
  onOpenHowItWorks: () => void;
  onOpenTrackOrder: () => void;
  onOpenActiveCards: () => void;
  onOpenReload?: () => void;
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onOpenStore,
  onOpenHowItWorks,
  onOpenTrackOrder,
  onOpenActiveCards,
  onOpenReload,
  onOpenAdmin,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E5E4E2]/15 bg-[#0A0A0A]/90 backdrop-blur-md">
      {/* Top micro-ticker bar */}
      <div className="border-b border-white/5 bg-black/60 px-4 py-1.5 text-[11px] text-neutral-400">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="truncate">
              Today's Rate: <strong className="text-white font-mono">1 USD = Rs. {settings.exchange_rate} NPR</strong>{' '}
              <span className="text-emerald-400 font-semibold">
                (Only {settings.markup_percent || 6.5}% above live bank rate of Rs. {settings.live_forex_rate || 153.68})
              </span>
            </span>
            <span className="hidden lg:inline-flex items-center gap-1 ml-2 text-emerald-300 font-bold bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px]">
              🔥 Big Purchase Deal: 5% to 15% OFF for orders &gt; $50
            </span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <span className="hidden sm:flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="h-3 w-3" /> eSewa Verified Merchant
            </span>
            <a
              href={`https://wa.me/${settings.contact_whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
            >
              <MessageCircle className="h-3 w-3 text-emerald-400" />
              <span className="hidden sm:inline">WhatsApp:</span> {settings.contact_whatsapp}
            </a>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          {/* Folded 'V' Icon with metallic sheen */}
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-800 via-neutral-900 to-black border border-[#E5E4E2]/40 shadow-[0_2px_10px_rgba(0,0,0,0.8)] group-hover:border-[#D4AF37] transition-all">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-[#E5E4E2] stroke-[2.5] group-hover:stroke-[#D4AF37] transition-colors">
              <path d="M4 4l8 16 8-16-8 7-8-7z" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-wider text-[#E5E4E2] text-sm sm:text-base group-hover:text-white transition-colors">
                {settings.brand_name.split(' ')[0] || 'VIRTUAL'} {settings.brand_name.split(' ')[1] || 'CARD'}
              </span>
              <span className="font-bold text-[#D4AF37] text-sm sm:text-base">
                {settings.brand_name.split(' ').slice(2).join(' ') || 'NEPAL'}
              </span>
            </div>
            <div className="text-[9px] uppercase tracking-widest text-neutral-400 -mt-0.5 font-mono">
              {settings.brand_tagline || 'Black Matte Platinum'}
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-300">
          <button
            type="button"
            onClick={onOpenStore}
            className="hover:text-[#D4AF37] transition-colors cursor-pointer"
          >
            Products
          </button>
          <button
            type="button"
            onClick={onOpenHowItWorks}
            className="hover:text-[#D4AF37] transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={onOpenActiveCards}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#D4AF37]/10 text-[#F3E5AB] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 transition-colors cursor-pointer"
          >
            <CreditCard className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span className="font-semibold">Active Cards</span>
          </button>
          <button type="button" onClick={onOpenReload} className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"><RefreshCw className="h-3.5 w-3.5"/><span className="font-semibold">Reload</span></button>

          <button
            type="button"
            onClick={onOpenTrackOrder}
            className="flex items-center gap-1 hover:text-[#D4AF37] transition-colors cursor-pointer"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Track Order</span>
          </button>

        </nav>

        {/* CTA Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenActiveCards}
            className="flex sm:hidden items-center gap-1 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-2 py-1.5 text-xs text-[#F3E5AB]"
            title="Active Cards"
          >
            <CreditCard className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span>Cards</span>
          </button>

          <button type="button" onClick={onOpenReload} className="flex sm:hidden items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-1.5 text-xs text-emerald-300"><RefreshCw className="h-3.5 w-3.5"/><span>Reload</span></button>

          <button
            type="button"
            onClick={onOpenTrackOrder}
            className="flex sm:hidden items-center gap-1 rounded-lg bg-neutral-900 border border-white/10 px-2 py-1.5 text-xs text-neutral-300"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Track</span>
          </button>

          <button
            type="button"
            onClick={onOpenStore}
            className="rounded-xl px-4 py-2 text-xs font-bold text-black transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #F5D77F 0%, #D4AF37 50%, #B8921F 100%)',
            }}
          >
            Explore Cards
          </button>
        </div>
      </div>
    </header>
  );
};
