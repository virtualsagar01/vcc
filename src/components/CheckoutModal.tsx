import React, { useState } from 'react';
import { X, Upload, Check, AlertCircle, ArrowLeft, ShieldCheck, FileCheck, Phone, Mail, User, MapPin } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, AppSettings, Order } from '../types';
import { calculateOrderPrice, formatNPR, formatUSD } from '../utils/pricing';
import { addOrder } from '../utils/storage';
import { apiCreateOrder } from '../utils/api';
import { EsewaQR } from './EsewaQR';

interface CheckoutModalProps {
  product: Product;
  amountUSD: number;
  cardNameInitial?: string;
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  product,
  amountUSD,
  cardNameInitial = '',
  settings,
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cardName, setCardName] = useState(cardNameInitial || '');
  const [billingAddress, setBillingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [screenshotName, setScreenshotName] = useState<string>('');
  const methods = (settings.payment_methods?.length ? settings.payment_methods : [
    { id: 'esewa', name: 'eSewa', type: 'esewa' as const, enabled: true },
    { id: 'crypto', name: 'USDT Crypto', type: 'crypto' as const, enabled: true, network: settings.crypto_payment_network, wallet_address: settings.crypto_payment_address },
  ]).filter((m) => m.enabled);
  const [paymentMethod, setPaymentMethod] = useState<'esewa' | 'crypto'>((methods[0]?.type === 'crypto' ? 'crypto' : 'esewa'));

  const [transactionId, setTransactionId] = useState('');
  const [transactionUrl, setTransactionUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceCalc = calculateOrderPrice(amountUSD, product, settings);

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB.');
      return;
    }

    setError(null);
    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address for card delivery.');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter your WhatsApp phone number.');
      return;
    }
    if (product.is_virtual && !cardName.trim()) {
      setError('Please enter the name you want embossed on your virtual card.');
      return;
    }
    if (!screenshotPreview) {
      setError('Please upload your payment receipt screenshot to verify.');
      return;
    }
    if (paymentMethod === 'crypto' && !transactionId.trim()) {
      setError('Please enter the Transaction ID for your crypto payment.');
      return;
    }

    setIsSubmitting(true);

    try {
      const order = await apiCreateOrder({
        customer_name: fullName.trim(),
        customer_email: email.trim(),
        customer_phone: phone.trim(),
        card_name: product.is_virtual ? cardName.trim().toUpperCase() : undefined,
        billing_address: billingAddress.trim() || undefined,
        product_id: product.id,
        product_name: product.name,
        product_category: product.category,
        amount_usd: amountUSD,
        total_npr: priceCalc.finalNPR,
        payment_screenshot_url: screenshotPreview,
        payment_method: paymentMethod,
        transaction_id: transactionId.trim() || undefined,
        transaction_url: transactionUrl.trim() || undefined,
        status: 'Pending Verification',
        notes: notes.trim() || undefined,
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#E5E4E2', '#60BB46'],
        });
      } catch (err) {
        // Safe failover
      }

      setIsSubmitting(false);
      onOrderSuccess(order);
    } catch (err) {
      setIsSubmitting(false);
      setError('Failed to create order. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl rounded-2xl border border-[#E5E4E2]/25 bg-[#0f0f10] shadow-[0_30px_70px_rgba(0,0,0,0.95)] overflow-hidden my-auto">
        {/* Gold accent line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#D4AF37] via-[#E5E4E2] to-[#D4AF37]" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-neutral-950">
          <div className="flex items-center gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
              Secure Checkout • No Login Needed
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-5 rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Customer and Card Details */}
            <div className="lg:col-span-6 space-y-4">
              <div className="text-xs uppercase tracking-wider text-[#D4AF37] font-semibold flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> 1. Customer & Delivery Information
              </div>

              {/* CRITICAL NOTE FOR CUSTOMER */}
              <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-neutral-900 p-3.5 shadow-sm">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-[#F3E5AB] block mb-0.5">
                      ⚠️ Please save your Name & Billing Address
                    </span>
                    <p className="text-[11px] text-amber-200/80 leading-relaxed">
                      Your virtual card will be permanently issued and registered with these exact details. When making online payments (e.g. Netflix, OpenAI, Facebook Ads, AWS), you must enter this exact cardholder name and billing address for 3DS AVS verification.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Full Legal Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="E.g. Ramesh Tamang"
                    className="w-full rounded-lg bg-neutral-900 border border-white/15 pl-9 pr-3 py-2 text-xs sm:text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Email Address (Card Delivery) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@gmail.com"
                      className="w-full rounded-lg bg-neutral-900 border border-white/15 pl-9 pr-3 py-2 text-xs sm:text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    WhatsApp Phone Number <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+977 98XXXXXXXX"
                      className="w-full rounded-lg bg-neutral-900 border border-white/15 pl-9 pr-3 py-2 text-xs sm:text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {product.is_virtual && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3">
                  <label className="block text-xs font-bold text-[#F3E5AB] mb-1">
                    Name to Emboss on Virtual Card <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    placeholder="RAMESH TAMANG"
                    className="w-full rounded-lg bg-black/70 border border-amber-500/40 px-3 py-2 text-xs font-mono uppercase tracking-wider text-[#F3E5AB] focus:border-[#D4AF37] focus:outline-none"
                    maxLength={26}
                  />
                  <span className="text-[10px] text-amber-200/70 mt-1 block">
                    Must match your legal name for 3DS international SMS/Email security.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Billing Address <span className="text-amber-400 font-semibold">(Card AVS Address)</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                  <input
                    type="text"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    placeholder="E.g. Ward 4, Lazimpat, Kathmandu 44600"
                    className="w-full rounded-lg bg-neutral-900 border border-white/15 pl-9 pr-3 py-2 text-xs sm:text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  💾 Please save this exact address — your card will be registered with this address for international billing verification.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Order Notes / Player UID <span className="text-neutral-500">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions or player ID for top-up..."
                  className="w-full rounded-lg bg-neutral-900 border border-white/15 p-2.5 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              {/* Order Summary Pill */}
              <div className="rounded-xl border border-white/10 bg-neutral-950 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between items-center text-neutral-300 font-semibold border-b border-white/10 pb-2">
                  <span>{product.name}</span>
                  <span className="text-amber-300 font-bold">${amountUSD} USD</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Exchange Rate + Fees:</span>
                  <span>1 USD = Rs. {priceCalc.exchangeRate}</span>
                </div>

                {priceCalc.discountPercent > 0 ? (
                  <>
                    <div className="flex justify-between text-neutral-400">
                      <span>Original NPR:</span>
                      <span className="line-through text-neutral-500 font-mono">{formatNPR(priceCalc.grossNPR)}</span>
                    </div>
                    <div className="flex justify-between items-center rounded-lg bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-1 text-emerald-300 font-medium">
                      <span className="flex items-center gap-1">
                        <span>🎉</span> Big Purchase Discount ({priceCalc.discountPercent}% OFF):
                      </span>
                      <span className="font-bold font-mono">-{formatNPR(priceCalc.discountAmountNPR)}</span>
                    </div>
                  </>
                ) : (
                  amountUSD <= 50 && (
                    <div className="text-[11px] text-amber-300/80 bg-amber-950/20 border border-amber-500/20 rounded px-2 py-1">
                      💡 Tip: Orders above $50 qualify for 5% to 15% instant volume discount!
                    </div>
                  )
                )}

                <div className="flex justify-between items-center pt-1 text-sm font-bold border-t border-white/10">
                  <div>
                    <span className="text-white block">Payable Total:</span>
                    {priceCalc.discountPercent > 0 && (
                      <span className="text-[10px] text-emerald-400 font-normal">
                        Includes {priceCalc.discountPercent}% volume savings!
                      </span>
                    )}
                  </div>
                  <span className="text-xl font-black text-emerald-400">{formatNPR(priceCalc.finalNPR)}</span>
                </div>
              </div>
            </div>

            {/* Right Column: eSewa Payment QR & Screenshot Upload */}
            <div className="lg:col-span-6 space-y-4">
              <div className="text-xs uppercase tracking-wider text-[#60BB46] font-semibold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> 2. Choose Payment Method & Upload Proof
              </div>

              {/* Embedded eSewa QR widget */}
              <EsewaQR
                amountNPR={priceCalc.finalNPR}
                esewaId={settings.esewa_id}
                accountName={settings.esewa_account_name}
              />

              {/* Upload Screenshot Dropzone */}
              <div>
                <label className="block text-xs font-bold text-neutral-200 mb-1">
                  Payment Method <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    className={`rounded-lg p-2 text-xs border ${
                      paymentMethod === 'esewa' ? 'bg-emerald-950 border-emerald-500' : 'bg-neutral-900 border-white/10'
                    }`}
                    onClick={() => setPaymentMethod('esewa')}
                  >
                    eSewa
                  </button>
                  <button
                    type="button"
                    className={`rounded-lg p-2 text-xs border ${
                      paymentMethod === 'crypto' ? 'bg-indigo-950 border-indigo-500' : 'bg-neutral-900 border-white/10'
                    }`}
                    onClick={() => setPaymentMethod('crypto')}
                  >
                    Crypto (USDT/BTC)
                  </button>
                </div>

                {paymentMethod === 'crypto' && (
                  <div className="mb-3 p-3 rounded-lg bg-neutral-900 border border-indigo-500/30 text-xs text-neutral-300">
                    <p>Send to Address: <span className="font-mono text-indigo-300">{methods.find((m) => m.type === 'crypto')?.wallet_address || settings.crypto_payment_address || 'NOT_SET'}</span></p>
                    <p>Network: <span className="font-mono text-indigo-300">{methods.find((m) => m.type === 'crypto')?.network || settings.crypto_payment_network || 'TRC20'}</span></p>
                  </div>
                )}

                <label className="block text-xs font-bold text-neutral-200 mb-1">
                  Upload Payment Screenshot <span className="text-red-400">*</span>
                </label>
                {/* ... (rest of screenshot upload) */}
                
                {paymentMethod === 'crypto' && (
                  <>
                    <label className="block text-xs font-medium text-neutral-300 mt-3 mb-1">
                      Transaction ID <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full rounded-lg bg-neutral-900 border border-white/15 px-3 py-2 text-xs text-white"
                    />
                    <label className="block text-xs font-medium text-neutral-300 mt-2 mb-1">
                      Transaction Link (Optional)
                    </label>
                    <input
                      type="text"
                      value={transactionUrl}
                      onChange={(e) => setTransactionUrl(e.target.value)}
                      className="w-full rounded-lg bg-neutral-900 border border-white/15 px-3 py-2 text-xs text-white"
                    />
                  </>
                )}
              </div>
[...content truncated...]

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl py-3.5 px-6 font-bold text-black transition-all shadow-[0_0_30px_rgba(96,187,70,0.3)] hover:shadow-[0_0_40px_rgba(96,187,70,0.5)] disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #74d858 0%, #60BB46 50%, #469a2f 100%)',
                }}
              >
                {isSubmitting ? (
                  <span className="text-sm uppercase tracking-wider">Generating Order ID...</span>
                ) : (
                  <span className="text-sm uppercase tracking-wider">
                    Submit Order • {formatNPR(priceCalc.finalNPR)}
                  </span>
                )}
              </button>
              <p className="text-center text-[10px] text-neutral-400">
                You will receive a unique Order ID to track your instant card delivery.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
