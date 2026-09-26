import React, { useState, useMemo } from 'react';
import { X, CheckCircle2, ShieldAlert, Sparkles, ArrowRight, DollarSign, Clock, ShieldCheck } from 'lucide-react';
import { Product, AppSettings } from '../types';
import { calculateOrderPrice, formatNPR, formatUSD } from '../utils/pricing';
import { BlackMatteCard } from './BlackMatteCard';
import { ProductGraphic } from './ProductGraphic';

interface ProductDetailModalProps {
  product: Product;
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: (product: Product, amountUSD: number, cardholderName?: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  settings,
  isOpen,
  onClose,
  onProceedToCheckout,
}) => {
  const [amountUSD, setAmountUSD] = useState<number>(product.base_usd || 10);
  const [customCardName, setCustomCardName] = useState<string>('RAMESH TAMANG');

  const priceBreakdown = useMemo(() => {
    return calculateOrderPrice(amountUSD, product, settings);
  }, [amountUSD, product, settings]);

  if (!isOpen) return null;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountUSD(Number(e.target.value));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (val >= 0 && val <= (product.max_amount || 20000)) {
      setAmountUSD(val);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl rounded-2xl border border-[#E5E4E2]/25 bg-[#101010] shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden my-auto">
        {/* Top Header bar with gold accent line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#D4AF37] via-[#E5E4E2] to-[#D4AF37]" />

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <span className="inline-block rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-0.5 text-xs font-semibold text-amber-300">
              {product.category_label}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">{product.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[80vh] overflow-y-auto">
          {/* Left Column: Card/Graphic visualizer & features */}
          <div className="lg:col-span-6 flex flex-col items-center">
            {product.is_virtual ? (
              <div className="w-full flex flex-col items-center">
                <div className="text-xs uppercase tracking-widest text-neutral-400 mb-2 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-400" /> Interactive Live Card Preview
                </div>
                <BlackMatteCard
                  cardholderName={customCardName || 'CARDHOLDER NAME'}
                  amountUSD={amountUSD}
                  compact={false}
                  className="scale-90 sm:scale-100 origin-top transform-gpu"
                />

                {/* Cardholder name input for real-time embossing preview */}
                <div className="w-full mt-3 bg-neutral-900/60 p-3 rounded-xl border border-white/5">
                  <label className="text-xs text-neutral-300 font-medium block mb-1">
                    Cardholder Full Name (Embossed on Card)
                  </label>
                  <input
                    type="text"
                    value={customCardName}
                    onChange={(e) => setCustomCardName(e.target.value.toUpperCase())}
                    placeholder="E.G. RAMESH TAMANG"
                    className="w-full rounded-lg bg-black/60 border border-[#E5E4E2]/25 px-3 py-2 text-xs uppercase font-mono tracking-wider text-[#F3E5AB] focus:border-[#D4AF37] focus:outline-none"
                    maxLength={26}
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">
                    This name will be linked to your virtual 3DS verification.
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full">
                <ProductGraphic product={product} size="lg" />
              </div>
            )}

            {/* Features list */}
            <div className="mt-5 w-full rounded-xl bg-neutral-900/40 p-4 border border-white/5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" /> Key Features & Guarantees
              </h4>
              <ul className="space-y-2 text-xs text-neutral-300">
                {product.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-blue-400" /> Delivery: {product.delivery_time}
                </span>
                <span>Validity: {product.validity}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Denominations or Reloadable Slider + Price calculation */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              {/* Product description */}
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">{product.description}</p>

              {/* Big Purchase Volume Discount Banner */}
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-emerald-950/20 p-3.5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                    <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Big Purchase Discount (Orders &gt; $50)</span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                    5% – 15% OFF
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] pt-2 border-t border-emerald-500/20">
                  <div className={`p-1.5 rounded-lg border transition-all ${amountUSD > 50 && amountUSD <= 100 ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 font-bold scale-[1.03]' : 'border-white/5 bg-black/40 text-neutral-400'}`}>
                    <div className="font-semibold">&gt;$50</div>
                    <div className="text-emerald-400 font-bold">5% OFF</div>
                  </div>
                  <div className={`p-1.5 rounded-lg border transition-all ${amountUSD > 100 && amountUSD <= 250 ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 font-bold scale-[1.03]' : 'border-white/5 bg-black/40 text-neutral-400'}`}>
                    <div className="font-semibold">&gt;$100</div>
                    <div className="text-emerald-400 font-bold">8% OFF</div>
                  </div>
                  <div className={`p-1.5 rounded-lg border transition-all ${amountUSD > 250 && amountUSD <= 500 ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 font-bold scale-[1.03]' : 'border-white/5 bg-black/40 text-neutral-400'}`}>
                    <div className="font-semibold">&gt;$250</div>
                    <div className="text-emerald-400 font-bold">10% OFF</div>
                  </div>
                  <div className={`p-1.5 rounded-lg border transition-all ${amountUSD > 500 && amountUSD <= 1000 ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 font-bold scale-[1.03]' : 'border-white/5 bg-black/40 text-neutral-400'}`}>
                    <div className="font-semibold">&gt;$500</div>
                    <div className="text-emerald-400 font-bold">12.5% OFF</div>
                  </div>
                  <div className={`p-1.5 rounded-lg border transition-all ${amountUSD > 1000 ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 font-bold scale-[1.03]' : 'border-white/5 bg-black/40 text-neutral-400'}`}>
                    <div className="font-semibold">&gt;$1000</div>
                    <div className="text-emerald-400 font-bold">15% OFF</div>
                  </div>
                </div>
              </div>

              {/* Amount Selection */}
              <div className="mt-4 rounded-xl bg-black/50 p-4 border border-white/10">
                {product.is_virtual ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                        Choose Card Balance (USD)
                      </label>
                      <div className="flex items-center gap-2">
                        {priceBreakdown.discountPercent > 0 && (
                          <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold">
                            {priceBreakdown.discountPercent}% DISCOUNT ACTIVE
                          </span>
                        )}
                        <span className="text-base font-black text-amber-300">${amountUSD} USD</span>
                      </div>
                    </div>

                    {/* Numeric Input & Preset buttons */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative flex-1">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                        <input
                          type="number"
                          min={product.min_amount}
                          max={product.max_amount}
                          value={amountUSD}
                          onChange={handleNumberInputChange}
                          className="w-full rounded-lg bg-neutral-900 border border-white/15 pl-9 pr-3 py-2 text-sm font-bold text-white focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>
                      <span className="text-xs text-neutral-400">($10 – $20,000)</span>
                    </div>

                    {/* Slider */}
                    <input
                      type="range"
                      min={product.min_amount}
                      max={1000} // Slider up to $1000 for quick tactile drag, larger can be typed
                      step={5}
                      value={Math.min(amountUSD, 1000)}
                      onChange={handleSliderChange}
                      className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                    />

                    {/* Quick presets */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {[10, 25, 50, 75, 100, 250, 500, 1000].map((preset) => {
                        const isDiscounted = preset > 50;
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setAmountUSD(preset)}
                            className={`relative rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                              amountUSD === preset
                                ? 'bg-[#D4AF37] text-black font-bold shadow'
                                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                            }`}
                          >
                            ${preset}
                            {isDiscounted && (
                              <span className="ml-1 text-[9px] font-bold text-emerald-400">
                                {preset <= 100 ? '-5%' : preset <= 250 ? '-8%' : preset <= 500 ? '-10%' : preset <= 1000 ? '-12.5%' : '-15%'}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300 block mb-2">
                      Select Denomination (USD / Value)
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {product.denominations.map((denom) => {
                        const isSelected = amountUSD === denom;
                        const denomCalc = calculateOrderPrice(denom, product, settings);
                        return (
                          <button
                            key={denom}
                            type="button"
                            onClick={() => setAmountUSD(denom)}
                            className={`relative flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all ${
                              isSelected
                                ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                                : 'border-white/10 bg-neutral-900/80 text-neutral-300 hover:border-white/25 hover:bg-neutral-800'
                            }`}
                          >
                            {denomCalc.discountPercent > 0 && (
                              <span className="absolute -top-2 -right-1 rounded-full bg-emerald-500 text-black text-[9px] font-black px-1.5 py-0.5 shadow-sm">
                                -{denomCalc.discountPercent}%
                              </span>
                            )}
                            <span className="font-bold text-sm text-amber-300">${denom}</span>
                            <span className="text-[10px] text-neutral-400 mt-0.5">
                              {formatNPR(denomCalc.finalNPR)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Price Breakdown Box */}
              <div className="mt-4 rounded-xl border border-white/10 bg-neutral-950/80 p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 flex items-center justify-between">
                  <span>Real-time Pricing Breakdown</span>
                  {priceBreakdown.discountPercent > 0 && (
                    <span className="text-emerald-400 font-bold text-[11px]">
                      🔥 {priceBreakdown.discountPercent}% Discount Applied
                    </span>
                  )}
                </div>
                <div className="space-y-1.5 text-xs text-neutral-300 border-b border-white/10 pb-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Card / Voucher Balance:</span>
                    <span className="font-mono">{formatUSD(priceBreakdown.amountUSD)}</span>
                  </div>
                  {priceBreakdown.issuanceFeeUSD > 0 && (
                    <div className="flex justify-between">
                      <span className="text-neutral-400">One-time Issuance Fee:</span>
                      <span className="font-mono">{formatUSD(priceBreakdown.issuanceFeeUSD)}</span>
                    </div>
                  )}
                  {priceBreakdown.fundingFeeUSD > 0 && (
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Funding Fee ({product.funding_fee_percent}%):</span>
                      <span className="font-mono">{formatUSD(priceBreakdown.fundingFeeUSD)}</span>
                    </div>
                  )}
                  {priceBreakdown.processingFeeUSD > 0 && (
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Card Processing Fee:</span>
                      <span className="font-mono">{formatUSD(priceBreakdown.processingFeeUSD)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-neutral-200 font-medium pt-1 border-t border-white/5">
                    <span>Subtotal USD:</span>
                    <span className="font-mono text-amber-200">{formatUSD(priceBreakdown.grossUSD)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-neutral-400">
                    <span>Loyal Customer Rate:</span>
                    <span className="font-mono text-emerald-400 font-medium">
                      1 USD = Rs. {priceBreakdown.exchangeRate} NPR ({priceBreakdown.markupPercent || 6.5}% over live forex)
                    </span>
                  </div>

                  {/* Volume Discount Line */}
                  {priceBreakdown.discountPercent > 0 ? (
                    <div className="flex justify-between items-center bg-emerald-950/50 border border-emerald-500/40 rounded-lg p-2 text-emerald-300 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                        Big Purchase Discount ({priceBreakdown.discountPercent}% OFF):
                      </span>
                      <span className="font-mono text-sm font-bold text-emerald-300">
                        -{formatNPR(priceBreakdown.discountAmountNPR)} (-{formatUSD(priceBreakdown.discountAmountUSD)})
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-300/80 bg-amber-950/20 border border-amber-500/20 rounded p-1.5 flex items-center gap-1">
                      <span>💡</span>
                      <span>Order above $50 to instantly unlock 5% to 15% discount!</span>
                    </div>
                  )}
                </div>

                {/* Final Total in NPR */}
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-neutral-400">Final Total in NPR</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                        {formatNPR(priceBreakdown.finalNPR)}
                      </span>
                      {priceBreakdown.discountPercent > 0 && (
                        <span className="text-sm text-neutral-500 line-through font-mono">
                          {formatNPR(priceBreakdown.grossNPR)}
                        </span>
                      )}
                    </div>
                    {priceBreakdown.discountPercent > 0 && (
                      <div className="text-[11px] text-emerald-400 font-medium">
                        You save {formatNPR(priceBreakdown.discountAmountNPR)} on this purchase!
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-950 px-2 py-0.5 text-[10px] text-emerald-300 border border-emerald-500/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Pay with eSewa
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Buy Now CTA */}
            <div className="mt-5">
              <button
                type="button"
                onClick={() => onProceedToCheckout(product, amountUSD, customCardName)}
                className="w-full group relative flex items-center justify-center gap-2 rounded-xl py-3.5 px-6 font-bold text-black transition-all duration-300 shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:shadow-[0_0_35px_rgba(212,175,55,0.6)]"
                style={{
                  background: 'linear-gradient(135deg, #F5D77F 0%, #D4AF37 50%, #B8921F 100%)',
                }}
              >
                <span className="text-sm tracking-wide uppercase">Buy Now • {formatNPR(priceBreakdown.finalNPR)}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <div className="mt-2 text-center text-[11px] text-neutral-400">
                🔒 Instant delivery • No customer account needed • 100% money back guarantee
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
