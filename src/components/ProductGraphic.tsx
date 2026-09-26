import React from 'react';
import { Gamepad2, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { Product } from '../types';

interface ProductGraphicProps {
  product: Product;
  size?: 'sm' | 'md' | 'lg';
}

export const ProductGraphic: React.FC<ProductGraphicProps> = ({ product, size = 'md' }) => {
  const heightClass = size === 'sm' ? 'h-36' : size === 'lg' ? 'h-72' : 'h-48';

  switch (product.image_url) {
    case 'virtual-card':
      return (
        <div
          className={`relative w-full ${heightClass} overflow-hidden rounded-xl bg-[#09090b] flex items-center justify-center border border-white/10`}
          style={{
            background: 'radial-gradient(circle at 50% 50%, #1e1026 0%, #08080c 100%)',
          }}
        >
          {/* Subtle neon glow rim */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-purple-600/20 to-blue-600/20 opacity-75 blur-xl" />

          {/* Mini Card Graphic */}
          <div className="relative z-10 w-4/5 max-w-[260px] rounded-lg p-3 border border-pink-500/40 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black shadow-[0_0_20px_rgba(236,72,153,0.3)]">
            <div className="flex items-center justify-between text-[9px] text-neutral-400">
              <span className="font-bold tracking-widest text-[#E5E4E2]">VIRTUAL CARD NEPAL</span>
              <span className="text-red-400 font-bold">🇳🇵</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-4 w-6 rounded bg-gradient-to-r from-amber-400 to-yellow-600 shadow-inner" />
              <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            </div>
            <div className="mt-2 font-mono text-[11px] tracking-wider text-slate-200">
              4578 •••• •••• 9021
            </div>
            <div className="mt-1 flex items-center justify-between text-[8px] text-neutral-400">
              <span>RAMESH TAMANG</span>
              <span className="font-bold text-white tracking-widest">VISA</span>
            </div>
          </div>

          {/* Pay Badges */}
          <div className="absolute bottom-2 right-3 flex items-center gap-1.5 text-[9px] text-neutral-400 bg-black/60 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-sm">
            <span>Pay with</span>
            <span className="font-semibold text-emerald-400 flex items-center gap-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> eSewa
            </span>
          </div>
        </div>
      );

    case 'rewarble-mastercard':
      return (
        <div
          className={`relative w-full ${heightClass} overflow-hidden rounded-xl bg-[#080d1a] flex items-center justify-center border border-white/10`}
          style={{
            background: 'radial-gradient(circle at 60% 40%, #0d1e3d 0%, #050811 100%)',
          }}
        >
          {/* Golden luxury ambient sparkles */}
          <div className="absolute inset-0 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />

          {/* Card Mockup */}
          <div className="relative z-10 w-4/5 max-w-[260px] rounded-lg p-3 border border-amber-500/30 bg-gradient-to-br from-[#0e172a] via-[#090e1a] to-black shadow-[0_0_25px_rgba(212,175,55,0.2)]">
            <div className="flex items-center justify-between text-[9px]">
              <div className="flex items-center gap-1">
                <span className="text-amber-400 text-xs">👑</span>
                <span className="font-extrabold tracking-wider text-blue-300">Rewarble</span>
              </div>
              <span className="text-amber-300 text-[9px] font-mono">PREPAID</span>
            </div>
            <div className="mt-2 h-4 w-6 rounded bg-gradient-to-r from-amber-300 to-amber-600" />
            <div className="mt-2 font-mono text-[11px] tracking-wider text-slate-300">
              5412 •••• •••• 3456
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[8px] text-neutral-400">INSTANT MASTER</span>
              <div className="flex">
                <div className="h-3.5 w-3.5 rounded-full bg-red-600" />
                <div className="h-3.5 w-3.5 -ml-1.5 rounded-full bg-amber-500" />
              </div>
            </div>
          </div>

          <div className="absolute top-2 right-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5" /> Zero FX
          </div>
        </div>
      );

    case 'mastercard-prepaid':
      return (
        <div
          className={`relative w-full ${heightClass} overflow-hidden rounded-xl bg-[#080808] flex items-center justify-center border border-white/10`}
          style={{
            background: 'radial-gradient(circle at 50% 50%, #151b2e 0%, #06080e 100%)',
          }}
        >
          {/* Stack of cards illusion */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Top glowing card */}
            <div className="relative w-44 rounded-md p-2.5 border border-red-500/40 bg-gradient-to-r from-red-900/60 via-purple-900/60 to-blue-900/60 shadow-[0_10px_25px_rgba(239,68,68,0.3)]">
              <div className="flex justify-between items-center text-[8px] text-white/80">
                <span className="font-bold">Mastercard Prepaid</span>
                <span>$1–$150</span>
              </div>
              <div className="mt-1.5 font-mono text-[9px] text-neutral-300">5412 •••• •••• 3456</div>
              <div className="mt-1 flex justify-between items-center">
                <span className="text-[7px] text-neutral-400">INSTANT DELIVERY</span>
                <div className="flex">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <div className="h-2.5 w-2.5 -ml-1 rounded-full bg-yellow-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Features badge */}
          <div className="absolute bottom-2 left-3 text-[9px] text-neutral-400 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded border border-white/5">
            <Zap className="h-3 w-3 text-amber-400" /> Works Worldwide
          </div>
        </div>
      );

    case 'google-play':
      return (
        <div
          className={`relative w-full ${heightClass} overflow-hidden rounded-xl bg-[#06120e] flex items-center justify-center border border-white/10`}
          style={{
            background: 'radial-gradient(circle at 50% 50%, #0d2a1d 0%, #040907 100%)',
          }}
        >
          <div className="absolute inset-0 bg-emerald-500/10 blur-xl" />

          {/* Google Play Card Center */}
          <div className="relative z-10 w-40 rounded-xl p-3 border border-emerald-400/40 bg-gradient-to-br from-[#0c2217] to-[#040c08] shadow-[0_0_25px_rgba(16,185,129,0.3)] text-center">
            <div className="flex items-center justify-center">
              {/* Play Triangle Icon */}
              <svg viewBox="0 0 24 24" className="h-8 w-8 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">
                <path d="M4 3l16 9-16 9V3z" fill="url(#playGrad)" />
                <defs>
                  <linearGradient id="playGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#34D399" />
                    <stop offset="50%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#F59E0B" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="mt-1 font-bold text-white text-xs tracking-wide">Google Play</div>
            <div className="text-[9px] text-emerald-400 font-mono">US REGION CODE</div>
          </div>

          <div className="absolute bottom-2 right-2 text-[8px] bg-black/60 px-2 py-0.5 rounded border border-white/10 text-neutral-300">
            PUBG • COD • Apps
          </div>
        </div>
      );

    case 'razer-gold':
      return (
        <div
          className={`relative w-full ${heightClass} overflow-hidden rounded-xl bg-[#051006] flex items-center justify-center border border-white/10`}
          style={{
            background: 'radial-gradient(circle at 50% 50%, #08290e 0%, #020a04 100%)',
          }}
        >
          <div className="absolute inset-0 bg-[#00FF00]/15 blur-xl" />

          <div className="relative z-10 w-40 rounded-xl p-3 border border-[#00FF00]/40 bg-[#061608] shadow-[0_0_25px_rgba(0,255,0,0.3)] text-center">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-600 via-amber-400 to-yellow-200 text-black font-black text-sm shadow">
              Z
            </div>
            <div className="mt-1.5 font-bold text-[#00FF00] tracking-wider text-xs uppercase">
              RAZER GOLD
            </div>
            <div className="text-[8px] text-neutral-300">Global Direct PIN</div>
          </div>

          <div className="absolute bottom-2 left-2 text-[8px] text-emerald-400 bg-black/70 px-2 py-0.5 rounded border border-emerald-500/30">
            42,000+ Games
          </div>
        </div>
      );

    case 'free-fire':
      return (
        <div
          className={`relative w-full ${heightClass} overflow-hidden rounded-xl bg-[#1a0802] flex items-center justify-center border border-white/10`}
          style={{
            background: 'radial-gradient(circle at 50% 50%, #3d1205 0%, #0d0301 100%)',
          }}
        >
          <div className="absolute inset-0 bg-orange-600/20 blur-xl" />

          <div className="relative z-10 flex flex-col items-center">
            {/* Fiery Diamond Crystal */}
            <div className="relative flex h-14 w-14 items-center justify-center rotate-45 rounded-lg bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 shadow-[0_0_30px_rgba(249,115,22,0.6)] border border-yellow-200">
              <span className="-rotate-45 text-white font-black text-base drop-shadow">💎</span>
            </div>
            <span className="mt-3 font-extrabold text-amber-400 text-xs tracking-wider uppercase">
              FREE FIRE NEPAL
            </span>
            <span className="text-[8px] text-neutral-400">UID Direct Recharge</span>
          </div>

          <div className="absolute bottom-2 right-2 text-[8px] text-amber-300 bg-black/60 px-2 py-0.5 rounded border border-amber-500/20">
            No Password Needed
          </div>
        </div>
      );

    case 'mobile-legends':
      return (
        <div
          className={`relative w-full ${heightClass} overflow-hidden rounded-xl bg-[#040b1a] flex items-center justify-center border border-white/10`}
          style={{
            background: 'radial-gradient(circle at 50% 50%, #0a1f42 0%, #03060f 100%)',
          }}
        >
          <div className="absolute inset-0 bg-blue-600/25 blur-xl" />

          <div className="relative z-10 flex flex-col items-center">
            {/* Electric Blue Diamond */}
            <div className="relative flex h-14 w-14 items-center justify-center rotate-45 rounded-lg bg-gradient-to-br from-cyan-300 via-blue-500 to-indigo-700 shadow-[0_0_30px_rgba(59,130,246,0.6)] border border-cyan-100">
              <span className="-rotate-45 text-white font-black text-base drop-shadow">💎</span>
            </div>
            <span className="mt-3 font-extrabold text-cyan-400 text-xs tracking-wider uppercase">
              MOBILE LEGENDS
            </span>
            <span className="text-[8px] text-neutral-400">User ID + Zone ID</span>
          </div>

          <div className="absolute bottom-2 left-2 text-[8px] text-cyan-300 bg-black/60 px-2 py-0.5 rounded border border-cyan-500/20">
            From Rs. 50
          </div>
        </div>
      );

    default:
      return (
        <div className={`relative w-full ${heightClass} rounded-xl bg-neutral-900 flex items-center justify-center border border-white/10`}>
          <Gamepad2 className="h-8 w-8 text-neutral-500" />
        </div>
      );
  }
};
