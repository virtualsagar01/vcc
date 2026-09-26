import React from 'react';
import {
  ShieldCheck,
  Lock,
  CreditCard,
  Sparkles,
  MessageSquare,
  Send,
  Mail,
  Phone,
  Globe,
  Server,
  Share2,
} from 'lucide-react';
import { AppSettings, ProductCategory } from '../types';

interface FooterProps {
  settings: AppSettings;
  onSelectCategory: (category: ProductCategory) => void;
  onOpenTrackOrder: () => void;
  onOpenActiveCards?: () => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onSelectCategory,
  onOpenTrackOrder,
  onOpenActiveCards,
  onOpenAdmin,
}) => {
  return (
    <footer className="border-t border-white/10 bg-[#060607] text-neutral-400 text-xs pb-20 md:pb-0">
      {/* Trust & Guarantee Banner */}
      <div className="border-b border-white/5 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 border border-[#D4AF37]/30 text-[#D4AF37] mb-2">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="font-bold text-white text-xs">100% Verified Delivery</div>
            <div className="text-[11px] text-neutral-500 mt-0.5">Dispatched in 5–15 minutes</div>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 border border-[#60BB46]/30 text-[#60BB46] mb-2">
              <span className="font-black text-base">e</span>
            </div>
            <div className="font-bold text-white text-xs">eSewa Official Merchant</div>
            <div className="text-[11px] text-neutral-500 mt-0.5">Instant QR Scan & Pay</div>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 border border-blue-500/30 text-blue-400 mb-2">
              <Lock className="h-5 w-5" />
            </div>
            <div className="font-bold text-white text-xs">3D Secure (3DS) OTP</div>
            <div className="text-[11px] text-neutral-500 mt-0.5">Works on OpenAI, Ads & Steam</div>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 border border-purple-500/30 text-purple-400 mb-2">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="font-bold text-white text-xs">No Account Needed</div>
            <div className="text-[11px] text-neutral-500 mt-0.5">Track with Order ID</div>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Brand Column */}
        <div className="md:col-span-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 border border-[#D4AF37]/50 text-[#F3E5AB]">
              <CreditCard className="h-4 w-4" />
            </div>
            <span className="font-bold text-white tracking-wider text-sm uppercase">
              {settings.brand_name}
            </span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            {settings.footer_text ||
              "Nepal's premier provider of black matte platinum virtual dollar cards, prepaid cards, gift cards, and game top-ups. Designed for seamless international subscriptions, cloud hosting, and gaming."}
          </p>

          {/* Contact buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <a
              href={`https://wa.me/${settings.contact_whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-900 transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>WhatsApp: {settings.contact_whatsapp}</span>
            </a>
            <a
              href={`mailto:${settings.contact_email}`}
              className="flex items-center gap-1.5 rounded-lg bg-neutral-900 border border-white/10 px-3 py-1.5 text-xs text-neutral-300 hover:text-white transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Email Support</span>
            </a>
          </div>

          {/* Social Links */}
          <div className="pt-2 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Connect with Us</div>
            <div className="flex flex-wrap items-center gap-2">
              {settings.social_facebook && (
                <a
                  href={settings.social_facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-neutral-900 border border-white/10 px-2.5 py-1 text-[11px] text-neutral-300 hover:text-blue-400 hover:border-blue-400/30 transition-all"
                >
                  Facebook
                </a>
              )}
              {settings.social_instagram && (
                <a
                  href={settings.social_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-neutral-900 border border-white/10 px-2.5 py-1 text-[11px] text-neutral-300 hover:text-pink-400 hover:border-pink-400/30 transition-all"
                >
                  Instagram
                </a>
              )}
              {settings.social_tiktok && (
                <a
                  href={settings.social_tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-neutral-900 border border-white/10 px-2.5 py-1 text-[11px] text-neutral-300 hover:text-cyan-400 hover:border-cyan-400/30 transition-all"
                >
                  TikTok
                </a>
              )}
              {settings.social_youtube && (
                <a
                  href={settings.social_youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-neutral-900 border border-white/10 px-2.5 py-1 text-[11px] text-neutral-300 hover:text-red-400 hover:border-red-400/30 transition-all"
                >
                  YouTube
                </a>
              )}
              {settings.contact_telegram && (
                <a
                  href={`https://t.me/${settings.contact_telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-neutral-900 border border-white/10 px-2.5 py-1 text-[11px] text-neutral-300 hover:text-sky-400 hover:border-sky-400/30 transition-all flex items-center gap-1"
                >
                  <Send className="h-3 w-3" />
                  <span>Telegram</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="md:col-span-3 space-y-2">
          <div className="font-bold uppercase tracking-wider text-xs text-white">Product Catalog</div>
          <ul className="space-y-1.5 text-xs">
            <li>
              <button
                type="button"
                onClick={() => onSelectCategory('virtual_cards_reloadable')}
                className="hover:text-[#D4AF37] transition-colors cursor-pointer"
              >
                Virtual Dollar Cards ($10–$20,000)
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectCategory('virtual_cards_preloaded')}
                className="hover:text-[#D4AF37] transition-colors cursor-pointer"
              >
                Prepaid Visa & Mastercard
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectCategory('gift_cards')}
                className="hover:text-[#D4AF37] transition-colors cursor-pointer"
              >
                Steam & Apple Gift Cards
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectCategory('game_topups')}
                className="hover:text-[#D4AF37] transition-colors cursor-pointer"
              >
                PUBG UC & Free Fire Diamonds
              </button>
            </li>
          </ul>
        </div>

        {/* Customer Service & Fast Tracking */}
        <div className="md:col-span-3 space-y-2">
          <div className="font-bold uppercase tracking-wider text-xs text-white">Order Assistance</div>
          <ul className="space-y-1.5 text-xs">
            {onOpenActiveCards && (
              <li>
                <button
                  type="button"
                  onClick={onOpenActiveCards}
                  className="text-[#D4AF37] font-semibold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <CreditCard className="h-3 w-3" />
                  <span>My Active Cards &amp; CVV Portal →</span>
                </button>
              </li>
            )}
            <li>
              <button
                type="button"
                onClick={onOpenTrackOrder}
                className="text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                Track Live Order by ID
              </button>
            </li>
            <li>
              <span>Payment: eSewa QR Verification</span>
            </li>
            <li>
              <span>Support Hours: {settings.support_hours || '24/7 Priority Support'}</span>
            </li>
            <li>
              <span>Turnaround: 5 to 15 Minutes</span>
            </li>

          </ul>
        </div>

        {/* Note / Disclaimer */}
        <div className="md:col-span-2 space-y-2">
          <div className="font-bold uppercase tracking-wider text-xs text-white">Security & Terms</div>
          <p className="text-[11px] text-neutral-500 leading-relaxed">
            All virtual cards are issued in compliance with international payment network standards. Cards support 3DS
            secure OTP.
          </p>
          <div className="text-[10px] text-amber-300/80 pt-1">
            {settings.store_notice || '⚡ Instant automated delivery within 5–15 minutes after eSewa payment!'}
          </div>
        </div>
      </div>

      {/* Bottom copyright - Stealth admin trigger on click */}
      <div 
        onClick={onOpenAdmin}
        className="border-t border-white/5 py-4 px-4 sm:px-6 text-center text-[11px] text-neutral-500 cursor-default select-none hover:text-neutral-400 transition-colors"
        title=""
      >
        © {new Date().getFullYear()} {settings.brand_name}. All rights reserved. {settings.brand_tagline}.
      </div>
    </footer>
  );
};

