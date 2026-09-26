import React from 'react';
import { Wifi } from 'lucide-react';

interface BlackMatteCardProps {
  cardholderName?: string;
  amountUSD?: number;
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
  brand?: 'VISA' | 'MASTERCARD' | 'REWARBLE';
  variant?: 'platinum' | 'gold' | 'neon';
  compact?: boolean;
  className?: string;
}

export const BlackMatteCard: React.FC<BlackMatteCardProps> = ({
  cardholderName = 'RAMESH TAMANG',
  amountUSD,
  cardNumber = '4578  2461  7835  9021',
  expiry = '12/28',
  cvv = '372',
  brand = 'VISA',
  variant = 'platinum',
  compact = false,
  className = '',
}) => {
  return (
    <div
      className={`relative select-none overflow-hidden rounded-2xl transition-all duration-300 ${
        compact ? 'h-44 w-72 p-4 text-xs' : 'h-56 w-96 p-6 text-sm'
      } ${className}`}
      style={{
        background: 'linear-gradient(135deg, #161616 0%, #0d0d0d 45%, #050505 100%)',
        boxShadow:
          variant === 'neon'
            ? '0 20px 40px -15px rgba(220, 38, 38, 0.35), 0 0 25px rgba(59, 130, 246, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.25)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(229, 228, 226, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
      }}
    >
      {/* Metallic edge sheen */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-[#E5E4E2]/25 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.08]" />

      {/* Subtle brushed metal micro-texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            'radial-gradient(circle at 100% 0%, rgba(212, 175, 55, 0.2) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(59, 130, 246, 0.15) 0%, transparent 60%)',
        }}
      />

      {/* Nepal Double-Pennant Flag Watermark */}
      <div className="pointer-events-none absolute right-4 top-3 h-12 w-10 opacity-30">
        <svg viewBox="0 0 100 120" className="h-full w-full fill-red-600 stroke-blue-900 stroke-[5]">
          <path d="M 5 5 L 90 60 L 45 60 L 95 115 L 5 115 Z" />
          <circle cx="35" cy="40" r="10" fill="white" />
          <circle cx="35" cy="90" r="12" fill="white" />
        </svg>
      </div>

      {/* Top Header: Logo + Brand */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Folded 'V' Icon */}
          <div className="flex h-6 w-6 items-center justify-center rounded bg-[#0A0A0A] border border-[#E5E4E2]/40 shadow-inner">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-[#E5E4E2] stroke-[2.5]">
              <path d="M4 4l8 16 8-16-8 7-8-7z" />
            </svg>
          </div>
          <span className="font-semibold tracking-widest text-[#E5E4E2] text-[10px] uppercase">
            VIRTUAL CARD NEPAL
          </span>
        </div>

        {amountUSD ? (
          <div className="rounded-full bg-[#D4AF37]/15 px-2.5 py-0.5 border border-[#D4AF37]/35 text-[#F3E5AB] font-bold text-[11px]">
            ${amountUSD} USD
          </div>
        ) : (
          <span className="text-[10px] tracking-wider font-mono text-neutral-400 uppercase">
            PREPAID
          </span>
        )}
      </div>

      {/* Center: Chip + Contactless */}
      <div className="relative z-10 mt-4 flex items-center gap-3">
        {/* Realistic EMV Gold/Platinum Chip */}
        <div className="relative h-8 w-11 rounded-md border border-[#D4AF37]/60 bg-gradient-to-br from-[#F5D77F] via-[#D4AF37] to-[#AA7C11] p-1 shadow-sm">
          <div className="h-full w-full rounded-[2px] border border-black/25 grid grid-cols-2 gap-0.5 opacity-80">
            <div className="border-r border-b border-black/30" />
            <div className="border-b border-black/30" />
            <div className="border-r border-black/30" />
            <div className="" />
          </div>
        </div>

        {/* Contactless waves */}
        <Wifi className="h-5 w-5 rotate-90 text-[#E5E4E2]/70" />
      </div>

      {/* Card Number: Embossed styling */}
      <div className="relative z-10 mt-3 font-mono text-base tracking-[0.22em] text-[#E5E4E2] drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
        {cardNumber}
      </div>

      {/* Bottom Row: Cardholder Name, Expiry, CVV, Card Brand */}
      <div className="relative z-10 mt-3 flex items-end justify-between">
        <div>
          <div className="text-[9px] uppercase tracking-wider text-neutral-400">Cardholder Name</div>
          <div className="font-semibold uppercase tracking-wider text-[#F3E5AB] text-xs drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
            {cardholderName || 'CARDHOLDER NAME'}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <div className="text-[8px] uppercase tracking-wider text-neutral-400">Valid Thru</div>
            <div className="font-mono text-[11px] text-[#E5E4E2]">{expiry}</div>
          </div>
          <div>
            <div className="text-[8px] uppercase tracking-wider text-neutral-400">CVV</div>
            <div className="font-mono text-[11px] text-[#E5E4E2]">{cvv}</div>
          </div>

          {/* Visa or Mastercard Logo */}
          {brand === 'VISA' ? (
            <div className="font-black italic text-lg tracking-tighter text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              VISA<span className="text-[8px] not-italic tracking-normal text-neutral-400 block -mt-1 font-sans">VIRTUAL</span>
            </div>
          ) : (
            <div className="flex items-center">
              <div className="h-5 w-5 rounded-full bg-[#EB001B] opacity-95" />
              <div className="h-5 w-5 -ml-2.5 rounded-full bg-[#F79E1B] opacity-95" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
