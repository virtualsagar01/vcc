import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Search,
  KeyRound,
  ExternalLink,
  Smartphone,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { Order, AppSettings } from '../types';
import { BlackMatteCard } from './BlackMatteCard';
import { getStoredOrders } from '../utils/storage';
import { apiLookupActiveCards } from '../utils/api';
import { formatNPR } from '../utils/pricing';

interface ActiveCardsModalProps {
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onOpenStore?: () => void;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

export const ActiveCardsModal: React.FC<ActiveCardsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onOpenStore,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [securityKey, setSecurityKey] = useState('');
  const [verificationType, setVerificationType] = useState<'cvv' | 'cardholder'>('cvv');
  
  // Rate limiting & Brute Force Prevention State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState<number | null>(null);
  
  const [matchingOrders, setMatchingOrders] = useState<Order[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Card details visibility toggle
  const [revealedCardMap, setRevealedCardMap] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);

    // Check if locked out
    if (lockoutTimer && lockoutTimer > Date.now()) {
      const remaining = Math.ceil((lockoutTimer - Date.now()) / 1000);
      setSearchError(`Too many failed verification attempts. Please wait ${remaining}s before trying again.`);
      return;
    }

    const cleanId = identifier.trim().toLowerCase();
    const cleanKey = securityKey.trim().toUpperCase();

    if (!cleanId) {
      setSearchError('Please enter your Order ID or registered email address.');
      return;
    }
    if (!cleanKey) {
      setSearchError(`Please enter your security ${verificationType === 'cvv' ? 'CVV code' : 'registered cardholder name'}.`);
      return;
    }

    // Call server API verification endpoint
    const result = await apiLookupActiveCards(cleanId, cleanKey, verificationType);

    if (!result.success || !result.orders || result.orders.length === 0) {
      recordFailedAttempt(result.error || 'Verification failed. Please check credentials.');
      return;
    }

    // Successfully verified!
    setFailedAttempts(0);
    setLockoutTimer(null);
    setMatchingOrders(result.orders);
    setHasSearched(true);
  };

  const recordFailedAttempt = (msg: string) => {
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);

    if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockUntil = Date.now() + LOCKOUT_SECONDS * 1000;
      setLockoutTimer(lockUntil);
      setSearchError(
        `Anti-bruteforce lock triggered (5 failed attempts). System locked for ${LOCKOUT_SECONDS} seconds.`
      );
      // Auto countdown timer
      const interval = setInterval(() => {
        if (Date.now() >= lockUntil) {
          setLockoutTimer(null);
          setFailedAttempts(0);
          clearInterval(interval);
        }
      }, 1000);
    } else {
      setSearchError(`${msg} (${MAX_FAILED_ATTEMPTS - nextAttempts} attempts remaining before temporary lockout)`);
    }
    setHasSearched(true);
    setMatchingOrders([]);
  };

  const toggleReveal = (orderId: string) => {
    setRevealedCardMap((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-2xl border border-[#D4AF37]/35 bg-[#0e0e10] shadow-[0_30px_90px_rgba(0,0,0,0.95)] overflow-hidden my-auto">
        {/* Gold top accent line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#D4AF37] via-[#E5E4E2] to-[#D4AF37]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-neutral-800 to-black border border-[#D4AF37]/40 text-[#D4AF37]">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                <span>Active Cards & Digital Credentials</span>
                <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] text-emerald-400 border border-emerald-500/30">
                  Protected
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                Securely inspect your activated virtual cards and credential details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Security Notice / Rate Limiting Banner */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 flex items-start gap-3 text-xs">
            <ShieldCheck className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div className="text-neutral-300">
              <span className="font-bold text-[#F3E5AB] block mb-0.5">
                Anti-Bruteforce 2-Factor Security Verification
              </span>
              To protect customer card numbers from unauthorized queries, credential access requires your{' '}
              <strong className="text-white">Order ID or Registered Email</strong> paired with your{' '}
              <strong className="text-amber-300">CVV code</strong> or{' '}
              <strong className="text-amber-300">registered cardholder name</strong>.
            </div>
          </div>

          {/* Verification Form */}
          <form onSubmit={handleLookup} className="rounded-xl border border-white/10 bg-neutral-950 p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Primary Identifier */}
              <div>
                <label className="block text-xs font-semibold text-neutral-200 mb-1.5">
                  Order ID or Customer Email <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. VCN-2026-0001 or name@gmail.com"
                    className="w-full rounded-lg bg-neutral-900 border border-white/15 pl-9 pr-3 py-2 text-xs sm:text-sm font-mono text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              {/* Security Verification Key */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-neutral-200">
                    Security Verification Key <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setVerificationType('cvv')}
                      className={`px-1.5 py-0.5 rounded transition-colors ${
                        verificationType === 'cvv'
                          ? 'bg-[#D4AF37] text-black font-bold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      By CVV
                    </button>
                    <span className="text-neutral-600">|</span>
                    <button
                      type="button"
                      onClick={() => setVerificationType('cardholder')}
                      className={`px-1.5 py-0.5 rounded transition-colors ${
                        verificationType === 'cardholder'
                          ? 'bg-[#D4AF37] text-black font-bold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      By Name
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                  <input
                    type={verificationType === 'cvv' ? 'password' : 'text'}
                    required
                    value={securityKey}
                    onChange={(e) => setSecurityKey(e.target.value)}
                    placeholder={
                      verificationType === 'cvv'
                        ? '3-digit CVV (e.g. 372)'
                        : 'Exact name embossed on card'
                    }
                    maxLength={verificationType === 'cvv' ? 4 : 32}
                    className="w-full rounded-lg bg-neutral-900 border border-white/15 pl-9 pr-3 py-2 text-xs sm:text-sm font-mono uppercase tracking-wider text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {searchError && (
              <div className="rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-200 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            {/* Lookup CTA Button */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] text-neutral-400">
                {failedAttempts > 0 && failedAttempts < MAX_FAILED_ATTEMPTS && (
                  <span className="text-amber-400 font-mono">
                    Security Attempts: {failedAttempts}/{MAX_FAILED_ATTEMPTS}
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={Boolean(lockoutTimer && lockoutTimer > Date.now())}
                className="rounded-xl px-5 py-2.5 font-bold text-black text-xs transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #F5D77F 0%, #D4AF37 50%, #B8921F 100%)',
                }}
              >
                Verify & Unlock Card Details
              </button>
            </div>
          </form>

          {/* VERIFIED ACTIVE CARDS RESULTS */}
          {hasSearched && matchingOrders.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Authenticated Active Cards ({matchingOrders.length})</span>
                </h3>
                <span className="text-[11px] text-emerald-400 font-mono">3DS Secure Status: Active</span>
              </div>

              {matchingOrders.map((order) => {
                const isRevealed = revealedCardMap[order.id];
                const cardDetails = order.card_details;
                const isVirtual = order.product_category === 'virtual_cards_reloadable' || order.product_category === 'virtual_cards_preloaded';

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-white/15 bg-neutral-950/80 p-5 space-y-4 shadow-xl"
                  >
                    {/* Header info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-black text-[#F3E5AB]">{order.order_id}</span>
                          <span className="rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold px-2 py-0.5">
                            {order.status}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-300 mt-0.5">{order.product_name} • ${order.amount_usd} USD</div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {isVirtual && cardDetails && (
                          <button
                            type="button"
                            onClick={() => {
                              const fullText = `Card Number: ${cardDetails.cardNumber}\nExpiry: ${cardDetails.expiry || '12/29'}\nCVV: ${cardDetails.cvv}\nCardholder: ${order.card_name || order.customer_name}\nBilling Address: ${order.billing_address || 'N/A'}`;
                              handleCopy(fullText, `all-${order.id}`);
                            }}
                            className="flex items-center gap-1.5 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/40 px-3 py-1.5 text-xs text-[#F3E5AB] hover:bg-[#D4AF37]/25 transition-colors"
                            title="Copy all card credentials to clipboard"
                          >
                            {copiedKey === `all-${order.id}` ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-[#D4AF37]" />}
                            <span>{copiedKey === `all-${order.id}` ? 'All Copied!' : 'Copy All'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleReveal(order.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-neutral-900 border border-white/10 px-3 py-1.5 text-xs text-neutral-200 hover:text-white transition-colors"
                        >
                          {isRevealed ? <EyeOff className="h-3.5 w-3.5 text-amber-400" /> : <Eye className="h-3.5 w-3.5 text-emerald-400" />}
                          <span>{isRevealed ? 'Mask Sensitive Info' : 'Reveal Full Credentials'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Virtual Card Graphic */}
                    {isVirtual && cardDetails && cardDetails.cardNumber ? (
                      <div className="flex flex-col items-center justify-center pt-2">
                        <BlackMatteCard
                          cardholderName={order.card_name || order.customer_name}
                          amountUSD={order.amount_usd}
                          cardNumber={
                            isRevealed
                              ? cardDetails.cardNumber
                              : cardDetails.cardNumber.replace(/(\d{4}\s\d{4}\s)\d{4}\s(\d{4})/, '$1•••• $2')
                          }
                          expiry={cardDetails.expiry || '12/29'}
                          cvv={isRevealed ? cardDetails.cvv || '372' : '•••'}
                          compact={false}
                        />

                        <div className="w-full mt-4 rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/5 p-4 flex items-center justify-between">
                          <div><div className="text-[10px] uppercase tracking-wider text-neutral-500">Available Balance</div><div className="text-2xl font-black text-[#F3E5AB]">${Number(cardDetails.balanceUSD ?? order.amount_usd ?? 0).toFixed(2)} USD</div></div>
                          <div className="text-right text-[10px] text-neutral-500">Reloadable card<br/><span className="text-emerald-400">Reload anytime</span></div>
                        </div>

                        {/* Copyable Quick-Access Table */}
                        <div className="w-full mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          {/* Card Number */}
                          <div className="rounded-xl bg-black/70 border border-white/10 p-2.5 flex items-center justify-between">
                            <div>
                              <div className="text-[10px] text-neutral-400 uppercase font-bold">Card Number</div>
                              <div className="font-mono text-xs text-white font-semibold mt-0.5">
                                {isRevealed ? cardDetails.cardNumber : '•••• •••• •••• ' + cardDetails.cardNumber.slice(-4)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(cardDetails.cardNumber || '', `num-${order.id}`)}
                              className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                              title="Copy Card Number"
                            >
                              {copiedKey === `num-${order.id}` ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>

                          {/* Expiry */}
                          <div className="rounded-xl bg-black/70 border border-white/10 p-2.5 flex items-center justify-between">
                            <div>
                              <div className="text-[10px] text-neutral-400 uppercase font-bold">Expiry (MM/YY)</div>
                              <div className="font-mono text-xs text-white font-semibold mt-0.5">
                                {cardDetails.expiry || '12/29'}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(cardDetails.expiry || '12/29', `exp-${order.id}`)}
                              className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                              title="Copy Expiry"
                            >
                              {copiedKey === `exp-${order.id}` ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>

                          {/* CVV */}
                          <div className="rounded-xl bg-black/70 border border-white/10 p-2.5 flex items-center justify-between">
                            <div>
                              <div className="text-[10px] text-neutral-400 uppercase font-bold">CVV Security Code</div>
                              <div className="font-mono text-xs text-white font-semibold mt-0.5">
                                {isRevealed ? cardDetails.cvv : '•••'}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(cardDetails.cvv || '', `cvv-${order.id}`)}
                              className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                              title="Copy CVV"
                            >
                              {copiedKey === `cvv-${order.id}` ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Registered AVS Address Info */}
                        <div className="w-full mt-3 rounded-xl border border-white/10 bg-black/50 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-neutral-400 uppercase font-bold block">Registered Cardholder & Billing Address (AVS)</span>
                            <span className="text-white font-medium">
                              {order.card_name || order.customer_name} • {order.billing_address || 'Registered with issuance partner (AVS Matched)'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(`${order.card_name || order.customer_name}, ${order.billing_address || ''}`, `addr-${order.id}`)}
                            className="flex items-center gap-1 rounded bg-neutral-800 px-2.5 py-1 text-[11px] text-neutral-300 hover:text-white"
                          >
                            {copiedKey === `addr-${order.id}` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            <span>Copy Details</span>
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {/* Voucher / Gift Code details if applicable */}
                    {cardDetails && cardDetails.voucherCode && (
                      <div className="rounded-xl border border-white/10 bg-black/80 p-4">
                        <div className="text-[10px] uppercase tracking-wider text-neutral-400">Digital Gift / Game Voucher Code</div>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="font-mono text-xl font-black text-amber-300">
                            {isRevealed ? cardDetails.voucherCode : '••••-••••-••••-' + cardDetails.voucherCode.slice(-4)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(cardDetails.voucherCode || '', `vouch-${order.id}`)}
                            className="flex items-center gap-1 rounded bg-neutral-800 px-3 py-1.5 text-xs text-neutral-200 hover:text-white"
                          >
                            {copiedKey === `vouch-${order.id}` ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                            <span>{copiedKey === `vouch-${order.id}` ? 'Copied' : 'Copy Voucher'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Instructions note */}
                    {cardDetails && cardDetails.instructions && (
                      <div className="rounded-xl bg-neutral-900/60 p-3 text-xs text-neutral-300 border border-white/5">
                        <span className="text-[#D4AF37] font-bold">Fulfillment Note: </span>
                        {cardDetails.instructions}
                      </div>
                    )}

                    {/* Pending delivery banner if order not finished */}
                    {order.status !== 'Completed' && (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200">
                        ⏳ <strong>Order Status: {order.status}</strong> — The card credentials will be populated as soon as the admin verifies your eSewa payment.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* If search done but no orders found or status not ready */}
          {hasSearched && matchingOrders.length === 0 && !searchError && (
            <div className="rounded-xl border border-white/10 bg-neutral-950 p-6 text-center text-xs text-neutral-400">
              No active cards matching those credentials. Please check your Order ID and CVV.
            </div>
          )}

          {/* Quick links & Support */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400 border-t border-white/10">
            <span className="text-[11px]">
              Need to buy a new virtual dollar card or top up balance?
            </span>
            <div className="flex items-center gap-3">
              {onOpenStore && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenStore();
                  }}
                  className="text-[#D4AF37] font-bold hover:underline"
                >
                  Browse Cards →
                </button>
              )}
              <a
                href={`https://wa.me/${settings.contact_whatsapp.replace(/[^0-9]/g, '')}?text=Hello,%20I%20need%20assistance%20with%20my%20active%20virtual%20card.`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 font-bold hover:underline"
              >
                WhatsApp Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
