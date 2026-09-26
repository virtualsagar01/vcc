import React, { useState, useEffect } from 'react';
import { X, Search, CheckCircle2, Clock, ShieldCheck, Copy, Check, MessageSquare, AlertCircle } from 'lucide-react';
import { Order, AppSettings } from '../types';
import { formatNPR } from '../utils/pricing';
import { getStoredOrders } from '../utils/storage';
import { apiFetchOrderById } from '../utils/api';
import { BlackMatteCard } from './BlackMatteCard';

interface TrackOrderModalProps {
  initialOrderId?: string;
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onOpenActiveCards?: () => void;
}

export const TrackOrderModal: React.FC<TrackOrderModalProps> = ({
  initialOrderId = '',
  settings,
  isOpen,
  onClose,
  onOpenActiveCards,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialOrderId);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (initialOrderId) {
      setSearchQuery(initialOrderId);
      handleSearch(initialOrderId);
    }
  }, [initialOrderId, isOpen]);

  if (!isOpen) return null;

  const handleSearch = async (idToSearch?: string) => {
    const q = (idToSearch || searchQuery).trim();
    if (!q) return;

    setSearched(true);
    // First try backend API
    const remoteOrder = await apiFetchOrderById(q);
    if (remoteOrder) {
      setCurrentOrder(remoteOrder);
      return;
    }

    // Fallback to local cache
    const orders = getStoredOrders();
    const found = orders.find(
      (o) =>
        o.order_id.toUpperCase() === q.toUpperCase() ||
        o.id.toUpperCase() === q.toUpperCase() ||
        o.customer_email.toUpperCase() === q.toUpperCase()
    );
    setCurrentOrder(found || null);
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-950 text-emerald-300 border-emerald-500/40';
      case 'Paid':
        return 'bg-blue-950 text-blue-300 border-blue-500/40';
      case 'Pending Verification':
        return 'bg-amber-950 text-amber-300 border-amber-500/40';
      case 'Cancelled':
        return 'bg-red-950 text-red-300 border-red-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl border border-[#E5E4E2]/25 bg-[#101011] shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <Search className="h-5 w-5 text-[#D4AF37]" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
              Track Order • No Login Needed
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Search Box */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                placeholder="Enter Order ID (e.g. VCN-2026-0001) or Email"
                className="w-full rounded-xl bg-neutral-900 border border-white/15 px-4 py-3 text-sm font-mono tracking-wider text-white uppercase focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => handleSearch()}
              className="rounded-xl px-5 py-3 font-bold text-black text-sm transition-all"
              style={{
                background: 'linear-gradient(135deg, #F5D77F 0%, #D4AF37 50%, #B8921F 100%)',
              }}
            >
              Search
            </button>
          </div>

          {/* Search Results */}
          {searched && !currentOrder && (
            <div className="mt-6 rounded-xl border border-red-500/30 bg-red-950/20 p-5 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-red-400 mb-2" />
              <div className="text-sm font-bold text-red-200">No order found with ID "{searchQuery}"</div>
              <p className="text-xs text-neutral-400 mt-1">
                Please verify your Order ID format (e.g. VCN-2026-XXXX) or message our WhatsApp team for lookup.
              </p>
            </div>
          )}

          {currentOrder && (
            <div className="mt-6 space-y-6">
              {/* Order Overview Header */}
              <div className="rounded-xl border border-white/10 bg-neutral-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-neutral-400">Order ID</div>
                  <div className="font-mono text-lg font-black text-[#F3E5AB]">{currentOrder.order_id}</div>
                  <div className="text-xs text-neutral-400">{currentOrder.product_name}</div>
                </div>

                <div className="flex flex-col sm:items-end">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-amber-300">
                      ${currentOrder.amount_usd} USD
                    </span>
                    <span className="text-neutral-500">•</span>
                    <span className="font-mono text-sm font-black text-emerald-400">
                      {formatNPR(currentOrder.total_npr)}
                    </span>
                  </div>
                  {currentOrder.discount_percent && currentOrder.discount_percent > 0 ? (
                    <span className="text-[10px] text-emerald-300 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded font-semibold mt-1">
                      🎉 {currentOrder.discount_percent}% Volume Discount Applied
                    </span>
                  ) : null}
                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold border ${getStatusBadge(
                        currentOrder.status
                      )}`}
                    >
                      {currentOrder.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1">
                    Placed: {new Date(currentOrder.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="rounded-xl border border-white/5 bg-neutral-900/40 p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">
                  Delivery Progress
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  {/* Step 1 */}
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-black font-bold mb-1 shadow">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-white">Order Received</span>
                    <span className="text-[10px] text-neutral-400">Screenshot Attached</span>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full font-bold mb-1 shadow ${
                        currentOrder.status === 'Paid' || currentOrder.status === 'Completed'
                          ? 'bg-emerald-500 text-black'
                          : 'bg-amber-500/20 border border-amber-500 text-amber-400 animate-pulse'
                      }`}
                    >
                      {currentOrder.status === 'Paid' || currentOrder.status === 'Completed' ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </div>
                    <span className="font-semibold text-white">eSewa Verification</span>
                    <span className="text-[10px] text-neutral-400">
                      {currentOrder.status === 'Pending Verification' ? 'In Progress' : 'Verified'}
                    </span>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full font-bold mb-1 shadow ${
                        currentOrder.status === 'Completed'
                          ? 'bg-emerald-500 text-black'
                          : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                      }`}
                    >
                      {currentOrder.status === 'Completed' ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                    </div>
                    <span className="font-semibold text-white">Card Issued</span>
                    <span className="text-[10px] text-neutral-400">
                      {currentOrder.status === 'Completed' ? 'Delivered' : 'Awaiting admin'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivered Card / Code Details if Completed */}
              {currentOrder.status === 'Completed' && currentOrder.card_details && (
                <div className="rounded-2xl border border-emerald-500/50 bg-emerald-950/20 p-5 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-emerald-400" />
                      <span className="text-sm font-bold text-white">Your Card & Voucher Details</span>
                    </div>
                    <span className="text-[10px] text-emerald-300 font-mono">
                      Delivered: {new Date(currentOrder.card_details.deliveredAt || currentOrder.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {currentOrder.card_details.cardNumber ? (
                    <div className="flex flex-col items-center">
                      <BlackMatteCard
                        cardholderName={currentOrder.card_name || currentOrder.customer_name}
                        amountUSD={currentOrder.amount_usd}
                        cardNumber={currentOrder.card_details.cardNumber}
                        expiry={currentOrder.card_details.expiry || '12/28'}
                        cvv={currentOrder.card_details.cvv || '372'}
                        compact={true}
                      />
                    </div>
                  ) : null}

                  {currentOrder.card_details.voucherCode && (
                    <div className="mt-4 rounded-xl border border-white/10 bg-black/80 p-4">
                      <div className="text-[10px] uppercase tracking-wider text-neutral-400">
                        Digital Voucher / PIN Code
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="font-mono text-xl font-black text-amber-300">
                          {currentOrder.card_details.voucherCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(currentOrder.card_details?.voucherCode || '');
                            setCopiedCode(true);
                            setTimeout(() => setCopiedCode(false), 2000);
                          }}
                          className="flex items-center gap-1 rounded bg-neutral-800 px-2.5 py-1 text-xs text-neutral-200 hover:text-white"
                        >
                          {copiedCode ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {currentOrder.card_details.instructions && (
                    <p className="mt-3 text-xs text-neutral-300 bg-black/40 p-3 rounded-lg border border-white/5">
                      💡 {currentOrder.card_details.instructions}
                    </p>
                  )}
                </div>
              )}

              {/* Status Note */}
              {currentOrder.status === 'Pending Verification' && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-neutral-300">
                    <span className="font-bold text-amber-300 block">Verification in Progress</span>
                    Our admin team is checking your payment on eSewa. Once verified, your credentials will appear
                    here and be delivered to <strong className="text-white">{currentOrder.customer_email}</strong>.
                  </div>
                </div>
              )}

              {/* WhatsApp Help CTA */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-400 border-t border-white/10">
                {onOpenActiveCards && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenActiveCards();
                    }}
                    className="text-[#D4AF37] hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>View in Active Cards &amp; CVV Vault →</span>
                  </button>
                )}
                <a
                  href={`https://wa.me/${settings.contact_whatsapp.replace(/[^0-9]/g, '')}?text=Hi,%20checking%20status%20of%20order%20${currentOrder.order_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-emerald-400 hover:underline font-semibold"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Chat on WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
