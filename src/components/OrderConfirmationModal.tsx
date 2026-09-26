import React, { useState } from 'react';
import { Check, Copy, Clock, MessageSquare, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Order, AppSettings } from '../types';
import { formatNPR } from '../utils/pricing';

interface OrderConfirmationModalProps {
  order: Order;
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onTrackOrder: (orderId: string) => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  settings,
  isOpen,
  onClose,
  onTrackOrder,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.order_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappMessage = encodeURIComponent(
    `Hello Virtual Card Nepal, I just placed order ${order.order_id} for ${order.product_name} (Rs. ${order.total_npr}). Please verify my eSewa payment.`
  );
  const whatsappUrl = `https://wa.me/${settings.contact_whatsapp.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl border border-[#D4AF37]/40 bg-[#101011] p-6 sm:p-8 shadow-[0_25px_70px_rgba(212,175,55,0.25)] text-center my-auto">
        {/* Metallic crown bar */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#F5D77F] text-black shadow-lg">
          <Check className="h-7 w-7 stroke-[3]" />
        </div>

        <span className="inline-block rounded-full bg-emerald-950 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
          Order Received & Pending Verification
        </span>

        <h2 className="mt-3 text-2xl sm:text-3xl font-black text-white tracking-wide">
          Thank You, {order.customer_name}!
        </h2>

        <p className="mt-1 text-xs sm:text-sm text-neutral-300">
          Your payment screenshot has been uploaded. Our verification team is reviewing it now.
        </p>

        {/* Highlighted Order ID Box */}
        <div className="mt-6 rounded-xl border border-[#E5E4E2]/30 bg-black/70 p-4">
          <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
            Your Unique Order Tracking ID
          </div>
          <div className="mt-1 flex items-center justify-center gap-3">
            <span className="font-mono text-2xl sm:text-3xl font-black tracking-widest text-[#F3E5AB]">
              {order.order_id}
            </span>
            <button
              type="button"
              onClick={handleCopyOrderId}
              className="flex items-center gap-1.5 rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:text-white transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Copied!' : 'Copy ID'}</span>
            </button>
          </div>
          <p className="text-[10px] text-neutral-400 mt-2">
            Save this Order ID. You can check your delivery status anytime with no customer login needed.
          </p>
        </div>

        {/* Order details summary */}
        <div className="mt-5 rounded-xl border border-white/10 bg-neutral-950/60 p-4 text-left text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-neutral-400">Product:</span>
            <span className="font-semibold text-white">{order.product_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Amount USD:</span>
            <span className="font-mono text-amber-300 font-bold">${order.amount_usd} USD</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Total Paid (eSewa):</span>
            <span className="font-mono text-emerald-400 font-black text-sm">{formatNPR(order.total_npr)}</span>
          </div>
          {order.card_name && (
            <div className="flex justify-between">
              <span className="text-neutral-400">Name on Card:</span>
              <span className="font-mono text-neutral-200">{order.card_name}</span>
            </div>
          )}
          {order.billing_address && (
            <div className="flex justify-between">
              <span className="text-neutral-400">Card AVS Address:</span>
              <span className="font-mono text-amber-200/90 truncate max-w-[240px]">{order.billing_address}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-neutral-400">Delivery Destination:</span>
            <span className="text-neutral-200 font-mono">{order.customer_email} / {order.customer_phone}</span>
          </div>
        </div>

        {/* Security Alert: Save Name & Address */}
        <div className="mt-3 rounded-lg border border-amber-500/30 bg-black/50 p-2.5 text-left text-[11px] text-amber-200/90 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#D4AF37] shrink-0" />
          <span>
            <strong>Reminder:</strong> Please save the name (<strong>{order.card_name || order.customer_name}</strong>) and address you provided. Your card will be activated with these details for international payment verifications.
          </span>
        </div>

        {/* Delivery instruction banner */}
        <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-950/20 p-3.5 text-left flex items-start gap-3">
          <Clock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-neutral-300">
            <span className="font-bold text-amber-300 block mb-0.5">What Happens Next?</span>
            We will verify your payment and send card details to your email and WhatsApp within{' '}
            <strong className="text-white">5–15 minutes</strong>.
          </div>
        </div>

        {/* Note: Stick with us for offers */}
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
          <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
          <span>Stick with us for offers, discounts & exclusive giveaways.</span>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-1/2 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 px-4 text-xs font-bold text-white transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Notify on WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={() => onTrackOrder(order.order_id)}
            className="w-full sm:w-1/2 flex items-center justify-center gap-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 py-3 px-4 text-xs font-bold text-white transition-all"
          >
            <span>Track Order Status</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 text-xs text-neutral-400 hover:text-white transition-colors"
        >
          Return to Store
        </button>
      </div>
    </div>
  );
};
