import React from 'react';
import { CreditCard, Search, MessageCircle, BookOpen, ShieldCheck, RefreshCw } from 'lucide-react';
import { AppSettings } from '../types';

interface MobileBottomBarProps {
  settings: AppSettings;
  onOpenStore: () => void;
  onOpenTrackOrder: () => void;
  onOpenActiveCards: () => void;
  onOpenReload?: () => void;
  onOpenAdmin?: () => void;
  onOpenGuides?: () => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  settings,
  onOpenStore,
  onOpenTrackOrder,
  onOpenActiveCards,
  onOpenReload,
  onOpenAdmin,
  onOpenGuides,
}) => {
  const whatsappUrl = `https://wa.me/${settings.contact_whatsapp.replace(/[^0-9]/g, '')}`;

  const handleGuidesClick = () => {
    if (onOpenGuides) {
      onOpenGuides();
    } else {
      window.location.href = '/posts';
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0C]/95 backdrop-blur-lg border-t border-white/10 px-2 py-2 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.8)]">
      <div className="grid grid-cols-6 items-center gap-1 text-center">
        {/* Explore Cards */}
        <button
          type="button"
          onClick={onOpenStore}
          className="flex flex-col items-center justify-center py-1 rounded-xl text-neutral-300 hover:text-white active:scale-95 transition-all min-h-[44px]"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#D4AF37]/15 text-[#D4AF37]">
            <CreditCard className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-medium mt-1">Store</span>
        </button>

        {/* Active Cards Section */}
        <button
          type="button"
          onClick={onOpenActiveCards}
          className="flex flex-col items-center justify-center py-1 rounded-xl text-neutral-300 hover:text-white active:scale-95 transition-all min-h-[44px]"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 border border-[#D4AF37]/40 text-[#F3E5AB]">
            <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
          </div>
          <span className="text-[10px] font-medium mt-1 text-[#F3E5AB]">Active Cards</span>
        </button>

        {/* Track Order */}
        <button
          type="button"
          onClick={onOpenTrackOrder}
          className="flex flex-col items-center justify-center py-1 rounded-xl text-neutral-300 hover:text-white active:scale-95 transition-all min-h-[44px]"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 border border-white/10 text-neutral-300">
            <Search className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-medium mt-1">Track</span>
        </button>

        {/* WhatsApp Direct */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center py-1 rounded-xl text-emerald-400 active:scale-95 transition-all min-h-[44px]"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
            <MessageCircle className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-medium mt-1 text-emerald-300">WhatsApp</span>
        </a>

        <button type="button" onClick={onOpenReload} className="flex flex-col items-center justify-center py-1 rounded-xl text-emerald-300 active:scale-95 transition-all min-h-[44px]"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-950/80 border border-emerald-500/30"><RefreshCw className="h-4 w-4"/></div><span className="text-[10px] font-medium mt-1">Reload</span></button>

        {/* Guides & FAQs - Replaced public admin button */}
        <button
          type="button"
          onClick={handleGuidesClick}
          className="flex flex-col items-center justify-center py-1 rounded-xl text-neutral-300 hover:text-[#D4AF37] active:scale-95 transition-all min-h-[44px]"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 border border-white/10 text-neutral-300">
            <BookOpen className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-medium mt-1">Guides</span>
        </button>
      </div>
    </div>
  );
};
