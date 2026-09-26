import React, { useState } from 'react';
import { Copy, Check, QrCode, ShieldCheck } from 'lucide-react';
import { formatNPR } from '../utils/pricing';

interface EsewaQRProps {
  amountNPR: number;
  esewaId?: string;
  accountName?: string;
  orderId?: string;
  compact?: boolean;
}

export const EsewaQR: React.FC<EsewaQRProps> = ({
  amountNPR,
  esewaId = '9841234567',
  accountName = 'Virtual Card Nepal Official',
  orderId,
  compact = false,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(esewaId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(String(amountNPR));
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  return (
    <div
      className={`rounded-2xl border border-[#60BB46]/40 bg-[#0e1711] p-5 shadow-[0_10px_30px_rgba(96,187,70,0.1)] ${
        compact ? 'max-w-xs' : 'max-w-md w-full'
      }`}
    >
      {/* Header with eSewa Green branding */}
      <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#60BB46] text-white font-black text-sm shadow">
            e
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide">eSewa Official QR</div>
            <div className="text-[10px] text-emerald-400/90">{accountName}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-emerald-950/80 px-2 py-0.5 border border-emerald-500/30 text-[10px] text-emerald-300">
          <ShieldCheck className="h-3 w-3 text-emerald-400" />
          <span>Verified Merchant</span>
        </div>
      </div>

      {/* QR Code graphic */}
      <div className="mt-4 flex flex-col items-center">
        <div className="relative rounded-xl border-2 border-[#60BB46]/60 bg-white p-3 shadow-lg">
          {/* Stylized QR Code SVG */}
          <svg viewBox="0 0 160 160" className="h-40 w-40">
            {/* Background */}
            <rect width="160" height="160" fill="white" />
            
            {/* Corner Markers */}
            {/* Top-Left */}
            <rect x="10" y="10" width="36" height="36" fill="#1B5E20" rx="4" />
            <rect x="16" y="16" width="24" height="24" fill="white" />
            <rect x="22" y="22" width="12" height="12" fill="#1B5E20" rx="2" />

            {/* Top-Right */}
            <rect x="114" y="10" width="36" height="36" fill="#1B5E20" rx="4" />
            <rect x="120" y="16" width="24" height="24" fill="white" />
            <rect x="126" y="22" width="12" height="12" fill="#1B5E20" rx="2" />

            {/* Bottom-Left */}
            <rect x="10" y="114" width="36" height="36" fill="#1B5E20" rx="4" />
            <rect x="16" y="120" width="24" height="24" fill="white" />
            <rect x="22" y="126" width="12" height="12" fill="#1B5E20" rx="2" />

            {/* Simulated Data Pattern Matrix */}
            <g fill="#166534">
              <rect x="52" y="14" width="6" height="6" />
              <rect x="64" y="14" width="6" height="6" />
              <rect x="76" y="14" width="6" height="6" />
              <rect x="94" y="14" width="6" height="6" />

              <rect x="52" y="26" width="12" height="6" />
              <rect x="70" y="26" width="6" height="12" />
              <rect x="88" y="26" width="18" height="6" />

              <rect x="14" y="52" width="12" height="6" />
              <rect x="32" y="52" width="12" height="6" />
              <rect x="52" y="52" width="18" height="18" />
              <rect x="76" y="52" width="12" height="6" />
              <rect x="94" y="52" width="12" height="12" />
              <rect x="114" y="52" width="6" height="6" />
              <rect x="126" y="52" width="18" height="6" />

              <rect x="14" y="64" width="6" height="12" />
              <rect x="32" y="64" width="6" height="18" />
              <rect x="76" y="64" width="12" height="18" />
              <rect x="126" y="64" width="12" height="12" />
              <rect x="144" y="64" width="6" height="18" />

              <rect x="14" y="88" width="18" height="6" />
              <rect x="52" y="76" width="18" height="6" />
              <rect x="94" y="76" width="18" height="6" />
              <rect x="114" y="76" width="6" height="18" />

              <rect x="52" y="88" width="6" height="18" />
              <rect x="64" y="88" width="18" height="12" />
              <rect x="94" y="88" width="12" height="6" />
              <rect x="126" y="88" width="18" height="6" />

              <rect x="52" y="114" width="12" height="6" />
              <rect x="70" y="114" width="12" height="12" />
              <rect x="88" y="114" width="6" height="6" />
              <rect x="100" y="114" width="18" height="6" />
              <rect x="126" y="114" width="6" height="18" />
              <rect x="138" y="114" width="12" height="6" />

              <rect x="52" y="126" width="6" height="18" />
              <rect x="64" y="132" width="18" height="6" />
              <rect x="88" y="126" width="18" height="18" />
              <rect x="114" y="138" width="12" height="6" />
              <rect x="138" y="126" width="12" height="18" />
            </g>

            {/* Center Logo in QR */}
            <circle cx="80" cy="80" r="16" fill="white" stroke="#60BB46" strokeWidth="2" />
            <text x="80" y="86" textAnchor="middle" fill="#60BB46" fontSize="18" fontWeight="bold" fontFamily="sans-serif">
              e
            </text>
          </svg>

          {/* Scan watermark prompt */}
          <div className="mt-1 text-center text-[9px] font-semibold text-neutral-600">
            SCAN WITH ESEWA APP
          </div>
        </div>

        {/* Amount to pay */}
        <div className="mt-4 text-center">
          <div className="text-[11px] uppercase tracking-wider text-neutral-400">Total Payable Amount</div>
          <div className="flex items-center justify-center gap-2 mt-0.5">
            <span className="text-2xl font-black text-[#60BB46]">{formatNPR(amountNPR)}</span>
            <button
              type="button"
              onClick={handleCopyAmount}
              className="flex items-center gap-1 rounded bg-neutral-800 px-2 py-1 text-[10px] text-neutral-300 hover:text-white transition-colors"
              title="Copy Amount"
            >
              {copiedAmount ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copiedAmount ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* eSewa ID / Phone */}
        <div className="mt-3 flex w-full items-center justify-between rounded-lg bg-black/60 px-3 py-2 border border-white/5">
          <div className="text-left">
            <div className="text-[10px] text-neutral-400">eSewa ID (Send Money)</div>
            <div className="font-mono text-xs font-bold text-emerald-300">{esewaId}</div>
          </div>
          <button
            type="button"
            onClick={handleCopyId}
            className="flex items-center gap-1 rounded bg-emerald-950 px-2.5 py-1 text-xs text-emerald-300 border border-emerald-600/40 hover:bg-emerald-900 transition-colors"
          >
            {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
          </button>
        </div>

        {orderId && (
          <div className="mt-2 text-[10px] text-neutral-400 text-center">
            Include Remarks in eSewa: <span className="font-mono font-bold text-amber-300">{orderId}</span>
          </div>
        )}
      </div>
    </div>
  );
};
