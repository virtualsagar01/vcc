export type ProductCategory = 'virtual_cards' | 'prepaid_cards' | 'preloaded_cards' | 'google_gift_cards' | 'other_gift_cards' | 'game_topups';

export type OrderStatus = 'Pending Verification' | 'Paid' | 'Completed' | 'Cancelled';

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  category_label: string;
  description: string;
  short_description: string;
  image_url: string;
  theme_accent: 'gold' | 'neon-blue' | 'razer-green' | 'fire-orange' | 'platinum';
  base_usd: number;
  issuance_fee_usd: number;
  funding_fee_percent: number;
  processing_fee_usd: number;
  is_virtual: boolean;
  min_amount: number;
  max_amount: number;
  denominations: number[];
  features: string[];
  validity: string;
  delivery_time: string;
  starting_price_npr: number;
  badge_text?: string;
  support_note?: string;
}

export interface CardDeliveryDetails {
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
  voucherCode?: string;
  pin?: string;
  playerId?: string;
  zoneId?: string;
  deliveredAt?: string;
  instructions?: string;
}

export interface Order {
  id: string;
  order_id: string; // e.g. VCN-2026-0001
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  card_name?: string;
  billing_address?: string;
  product_id: string;
  product_name: string;
  product_category: ProductCategory;
  amount_usd: number;
  total_npr: number;
  discount_percent?: number;
  discount_amount_npr?: number;
  discount_amount_usd?: number;
  payment_screenshot_url: string;
  payment_method: 'esewa' | 'crypto';
  transaction_id?: string;
  transaction_url?: string;
  status: OrderStatus;
  notes?: string;
  internal_notes?: string;
  card_details?: CardDeliveryDetails;
  created_at: string;
  updated_at?: string;
}

export interface AppSettings {
  id: number;
  brand_name: string;
  brand_tagline: string;
  custom_domain: string;
  exchange_rate: number; // e.g. 163.67 (Live rate + 6.5% loyal markup)
  commission_percent: number; // 0% or transparent breakdown
  live_forex_rate?: number; // e.g. 153.68 (official bank rate)
  markup_percent?: number; // e.g. 6.5 (6% - 7% markup over live rate)
  auto_sync_live_rate?: boolean;
  rate_last_synced?: string;
  esewa_qr_url: string;
  esewa_id: string;
  esewa_account_name: string;
  contact_whatsapp: string;
  contact_email: string;
  contact_telegram: string;
  contact_phone: string;
  social_facebook: string;
  social_instagram: string;
  social_tiktok: string;
  social_youtube: string;
  store_notice: string;
  footer_text: string;
  support_hours: string;
  crypto_payment_address?: string;
  crypto_payment_network?: string;
  updated_at?: string;
}

export interface PostArticle {
  id: string;
  slug: string;
  number: number;
  title: string;
  description: string;
  keywords: string[];
  category: string;
  readTime: string;
  publishedDate: string;
  author: string;
  content: string[];
  faq: Array<{ question: string; answer: string }>;
}

export interface PriceBreakdown {
  amountUSD: number;
  issuanceFeeUSD: number;
  fundingFeeUSD: number;
  processingFeeUSD: number;
  totalUSD: number;
  grossUSD: number;
  discountPercent: number;
  discountAmountUSD: number;
  discountAmountNPR: number;
  grossNPR: number;
  exchangeRate: number;
  liveForexRate?: number;
  markupPercent?: number;
  commissionPercent: number;
  commissionAmountNPR: number;
  subtotalNPR: number;
  finalNPR: number;
}
