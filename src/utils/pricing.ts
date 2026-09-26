import { Product, AppSettings, PriceBreakdown } from '../types';

/**
 * Dynamic Volume Discount Tier:
 * Purchases above $50 receive progressive 5% to 15% discount as the amount scales up:
 *  - Up to $50: 0% discount
 *  - $50.01 – $100: 5% discount
 *  - $100.01 – $250: 8% discount
 *  - $250.01 – $500: 10% discount
 *  - $500.01 – $1,000: 12.5% discount
 *  - Above $1,000 (up to $20,000): 15% maximum discount
 */
export function getVolumeDiscountPercent(amountUSD: number): number {
  if (amountUSD <= 50) return 0;
  if (amountUSD <= 100) return 5;
  if (amountUSD <= 250) return 8;
  if (amountUSD <= 500) return 10;
  if (amountUSD <= 1000) return 12.5;
  return 15;
}

export interface NextDiscountTierInfo {
  currentDiscount: number;
  nextThreshold: number | null;
  nextDiscount: number | null;
  amountNeeded: number | null;
}

export function getNextDiscountTier(amountUSD: number): NextDiscountTierInfo {
  const currentDiscount = getVolumeDiscountPercent(amountUSD);
  
  if (amountUSD <= 50) {
    return {
      currentDiscount: 0,
      nextThreshold: 51,
      nextDiscount: 5,
      amountNeeded: Math.max(1, 51 - amountUSD),
    };
  }
  if (amountUSD <= 100) {
    return {
      currentDiscount: 5,
      nextThreshold: 101,
      nextDiscount: 8,
      amountNeeded: Math.max(1, 101 - amountUSD),
    };
  }
  if (amountUSD <= 250) {
    return {
      currentDiscount: 8,
      nextThreshold: 251,
      nextDiscount: 10,
      amountNeeded: Math.max(1, 251 - amountUSD),
    };
  }
  if (amountUSD <= 500) {
    return {
      currentDiscount: 10,
      nextThreshold: 501,
      nextDiscount: 12.5,
      amountNeeded: Math.max(1, 501 - amountUSD),
    };
  }
  if (amountUSD <= 1000) {
    return {
      currentDiscount: 12.5,
      nextThreshold: 1001,
      nextDiscount: 15,
      amountNeeded: Math.max(1, 1001 - amountUSD),
    };
  }
  return {
    currentDiscount: 15,
    nextThreshold: null,
    nextDiscount: null,
    amountNeeded: null,
  };
}

/**
 * Calculates total price in USD and NPR based on:
 * 1. gross_usd = amount + issuance_fee_usd + (amount * funding_fee_percent / 100) + processing_fee_usd
 * 2. gross_npr = gross_usd * exchange_rate * (1 + commission_percent / 100)
 * 3. volume discount = 5% to 15% discount for amount > $50
 * 4. final_npr = gross_npr - discount_npr
 */
export function calculateOrderPrice(
  amountUSD: number,
  product: Product,
  settings: AppSettings
): PriceBreakdown {
  const safeAmount = Math.max(0, amountUSD || 0);
  const issuanceFeeUSD = Number(product.issuance_fee_usd || 0);
  const fundingFeePercent = Number(product.funding_fee_percent || 0);
  const fundingFeeUSD = (safeAmount * fundingFeePercent) / 100;
  const processingFeeUSD = Number(product.processing_fee_usd || 0);

  const grossUSD = safeAmount + issuanceFeeUSD + fundingFeeUSD + processingFeeUSD;

  const exchangeRate = Number(settings.exchange_rate || 163.67);
  const commissionPercent = Number(settings.commission_percent || 0.0);
  const liveForexRate = settings.live_forex_rate || Number((exchangeRate / 1.065).toFixed(2));
  const markupPercent = settings.markup_percent !== undefined ? settings.markup_percent : 6.5;

  const baseNPR = grossUSD * exchangeRate;
  const commissionAmountNPR = baseNPR * (commissionPercent / 100);
  const grossPriceNPR = baseNPR * (1 + commissionPercent / 100);
  const grossNPR = Math.round(grossPriceNPR);

  // Volume Discount Calculation (> $50 triggers 5%–15%)
  const discountPercent = getVolumeDiscountPercent(safeAmount);
  const discountAmountUSD = Number(((grossUSD * discountPercent) / 100).toFixed(2));
  const discountAmountNPR = Math.round(grossPriceNPR * (discountPercent / 100));

  const finalNPR = Math.max(0, grossNPR - discountAmountNPR);
  const totalUSD = Number(Math.max(0, grossUSD - discountAmountUSD).toFixed(2));

  return {
    amountUSD: safeAmount,
    issuanceFeeUSD: Number(issuanceFeeUSD.toFixed(2)),
    fundingFeeUSD: Number(fundingFeeUSD.toFixed(2)),
    processingFeeUSD: Number(processingFeeUSD.toFixed(2)),
    grossUSD: Number(grossUSD.toFixed(2)),
    totalUSD,
    discountPercent,
    discountAmountUSD,
    discountAmountNPR,
    grossNPR,
    exchangeRate,
    liveForexRate,
    markupPercent,
    commissionPercent,
    commissionAmountNPR: Math.round(commissionAmountNPR),
    subtotalNPR: Math.round(baseNPR),
    finalNPR,
  };
}

export function formatNPR(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString('en-IN')}`;
}

export function formatUSD(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
