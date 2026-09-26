import { Product, Order, AppSettings } from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'vcn_products_v1',
  ORDERS: 'vcn_orders_v1',
  SETTINGS: 'vcn_settings_v1',
  ADMIN_AUTH: 'vcn_admin_auth_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  id: 1,
  brand_name: 'Virtual Card Nepal',
  brand_tagline: 'Black Matte Platinum Virtual Dollar Cards & Gift Cards',
  custom_domain: 'virtualcardnepal.com',
  exchange_rate: 163.67,
  commission_percent: 0.0,
  live_forex_rate: 153.68,
  markup_percent: 6.5,
  auto_sync_live_rate: true,
  rate_last_synced: '2026-09-21T02:30:00Z',
  esewa_qr_url: '',
  esewa_id: '9841234567',
  esewa_account_name: 'Virtual Card Nepal Official',
  contact_whatsapp: '+977 9841234567',
  contact_email: 'support@virtualcardnepal.com',
  contact_telegram: '@VirtualCardNepal',
  contact_phone: '+977 9841234567',
  social_facebook: 'https://facebook.com/VirtualCardNepal',
  social_instagram: 'https://instagram.com/virtualcardnepal',
  social_tiktok: 'https://tiktok.com/@virtualcardnepal',
  social_youtube: 'https://youtube.com/@VirtualCardNepal',
  store_notice: '⚡ Instant automated delivery within 5–15 minutes after eSewa payment verification!',
  footer_text: 'Nepal’s #1 trusted provider of reloadable international Visa & Mastercard Virtual Dollar Cards. Instant activation for ChatGPT, Claude, Netflix, Ads & Steam with eSewa.',
  support_hours: '24/7 Priority WhatsApp & Ticket Support',
  payment_methods: [
    { id: 'esewa', name: 'eSewa', type: 'esewa', enabled: true, instructions: 'Scan the QR and pay the exact NPR amount.' },
    { id: 'crypto', name: 'USDT Crypto', type: 'crypto', enabled: true, network: 'TRC20', wallet_address: '', instructions: 'Send the exact amount, then submit the transaction ID.' },
  ],
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-virtual-dollar-card',
    name: 'Virtual Dollar Card (Reloadable)',
    slug: 'virtual-dollar-card',
    category: 'virtual_cards_reloadable',
    category_label: 'Virtual Cards — Reloadable',
    description: 'High-limit international Visa Virtual Dollar Card designed for Nepalese creators, developers, and shoppers. Supported on Apple Pay, Google Pay, and Samsung Pay with full 3DS SMS/Email OTP security. Reload anytime from $10 to $20,000.',
    short_description: 'Reloadable $10–$20,000 Visa Virtual Card with 5-year validity & 3DS security.',
    image_url: 'virtual-card',
    theme_accent: 'gold',
    base_usd: 10,
    issuance_fee_usd: 8.0,
    funding_fee_percent: 3.5,
    processing_fee_usd: 1.5,
    is_virtual: true,
    min_amount: 10,
    max_amount: 20000,
    denominations: [10, 25, 50, 100, 250, 500, 1000],
    features: [
      'Reloadable anytime from $10 to $20,000',
      '5-Year Validity with zero monthly maintenance fee',
      'Works on ChatGPT Plus, Claude, Midjourney, Netflix',
      'Supports Facebook Ads, Google Ads & AWS hosting',
      'Apple Pay, Google Pay & Samsung Pay integration',
      'Real-time 3DS SMS/Email verification OTP code',
    ],
    validity: '5 Years',
    delivery_time: '5–15 Minutes',
    starting_price_npr: 3550,
    badge_text: 'Most Popular',
    support_note: 'Name on card is required during checkout for 3DS verification.',
  },
  {
    id: 'prod-prepaid-card-fixed',
    name: 'Prepaid Visa Card (Fixed Balance)',
    slug: 'prepaid-visa-fixed',
    category: 'virtual_cards_preloaded',
    category_label: 'Virtual Cards — Preloaded',
    description: 'A preloaded, fixed-balance Visa card ready for immediate use. Perfect for one-time payments or testing services.',
    short_description: 'Preloaded fixed-balance Visa card.',
    image_url: 'prepaid-visa',
    theme_accent: 'platinum',
    base_usd: 20,
    issuance_fee_usd: 2.0,
    funding_fee_percent: 0,
    processing_fee_usd: 0.0,
    is_virtual: false,
    min_amount: 20,
    max_amount: 20,
    denominations: [20, 50, 100],
    features: ['Fixed balance', 'Immediate use', 'Visa compatible'],
    validity: '1 Year',
    delivery_time: 'Instant',
    starting_price_npr: 3500,
  },
  {
    id: 'prod-google-play-us',
    name: 'Google Play US Gift Card',
    slug: 'google-play-us',
    category: 'gift_cards',
    category_label: 'Gift Cards',
    description: 'Official Google Play Store US digital gift card code.',
    short_description: 'US Google Play Gift Card.',
    image_url: 'google-play',
    theme_accent: 'neon-blue',
    base_usd: 10,
    issuance_fee_usd: 1.0,
    funding_fee_percent: 2.0,
    processing_fee_usd: 0.5,
    is_virtual: false,
    min_amount: 10,
    max_amount: 100,
    denominations: [10, 25, 50, 100],
    features: ['Official code', 'US region only', 'Instant delivery'],
    validity: 'Lifetime',
    delivery_time: 'Instant',
    starting_price_npr: 1800,
  },
  {
    id: 'prod-other-gift-cards',
    name: 'Steam Wallet Gift Card',
    slug: 'steam-wallet-gift-card',
    category: 'gift_cards',
    category_label: 'Gift Cards',
    description: 'Generic gift cards for major platforms.',
    short_description: 'Gift card for Steam, Apple, etc.',
    image_url: 'gift-card',
    theme_accent: 'gold',
    base_usd: 10,
    issuance_fee_usd: 1.0,
    funding_fee_percent: 2.0,
    processing_fee_usd: 0.5,
    is_virtual: false,
    min_amount: 10,
    max_amount: 100,
    denominations: [10, 25, 50, 100],
    features: ['Official code', 'Various platforms', 'Instant delivery'],
    validity: 'Lifetime',
    delivery_time: 'Instant',
    starting_price_npr: 1800,
  },
  {
    id: 'prod-apple-gift-card',
    name: 'iTunes / Apple Gift Card',
    slug: 'apple-gift-card',
    category: 'gift_cards_apple',
    category_label: 'Gift Cards — iTunes / Apple',
    description: 'Apple gift card for App Store, iCloud, Apple Music and supported Apple services.',
    short_description: 'Apple / iTunes digital gift card.',
    image_url: 'apple-gift-card',
    theme_accent: 'platinum',
    base_usd: 10,
    issuance_fee_usd: 1,
    funding_fee_percent: 2,
    processing_fee_usd: 0.5,
    is_virtual: false,
    min_amount: 5,
    max_amount: 200,
    denominations: [5, 10, 25, 50, 100, 200],
    features: ['Apple / iTunes', 'US region supported', 'Instant delivery'],
    validity: 'Lifetime',
    delivery_time: 'Instant',
    starting_price_npr: 1200,
    badge_text: 'Apple',
  },
  {
    id: 'prod-rewarble-mastercard',
    name: 'Rewarble Mastercard',
    slug: 'rewarble-mastercard',
    category: 'gift_cards',
    category_label: 'Gift Cards — General',
    description: 'Prepaid Mastercard product with instant digital delivery for supported online purchases.',
    short_description: 'Prepaid Mastercard · Instant Delivery.',
    image_url: 'rewarble-mastercard',
    theme_accent: 'platinum',
    base_usd: 25,
    issuance_fee_usd: 2,
    funding_fee_percent: 2.5,
    processing_fee_usd: 0.5,
    is_virtual: false,
    min_amount: 10,
    max_amount: 150,
    denominations: [10, 25, 50, 100, 150],
    features: ['Prepaid Mastercard', 'Instant delivery', 'Supported online merchants'],
    validity: '1 Year',
    delivery_time: 'Instant',
    starting_price_npr: 6900,
    badge_text: 'Instant Delivery',
  },
  {
    id: 'prod-mastercard-prepaid',
    name: 'Mastercard Prepaid',
    slug: 'mastercard-prepaid',
    category: 'gift_cards',
    category_label: 'Gift Cards — General',
    description: 'Fixed-value Mastercard prepaid product for supported international online payments.',
    short_description: '$1 to $150 · Instant Delivery.',
    image_url: 'mastercard-prepaid',
    theme_accent: 'gold',
    base_usd: 10,
    issuance_fee_usd: 1.5,
    funding_fee_percent: 2,
    processing_fee_usd: 0.5,
    is_virtual: false,
    min_amount: 1,
    max_amount: 150,
    denominations: [1, 5, 10, 25, 50, 100, 150],
    features: ['$1–$150 denominations', 'Worldwide merchant support', 'Instant delivery'],
    validity: '1 Year',
    delivery_time: 'Instant',
    starting_price_npr: 2400,
  },
  {
    id: 'prod-mobile-legends',
    name: 'Mobile Legends Diamonds',
    slug: 'mobile-legends-diamonds',
    category: 'game_topups',
    category_label: 'Game Top-ups',
    description: 'Mobile Legends diamond top-up for Nepal region using Player ID and Zone ID.',
    short_description: 'Nepal Region · Instant Delivery.',
    image_url: 'mobile-legends',
    theme_accent: 'neon-blue',
    base_usd: 1,
    issuance_fee_usd: 0,
    funding_fee_percent: 0,
    processing_fee_usd: 0,
    is_virtual: false,
    min_amount: 1,
    max_amount: 50,
    denominations: [1, 5, 10, 20, 50],
    features: ['Nepal region', 'Player ID + Zone ID', 'Instant delivery'],
    validity: 'Permanent',
    delivery_time: 'Instant',
    starting_price_npr: 50,
  },
  {
    id: 'prod-game-topup',
    name: 'Game Top-up (PUBG/Free Fire)',
    slug: 'game-topup',
    category: 'game_topups',
    category_label: 'Game Top-ups',
    description: 'Direct game top-up.',
    short_description: 'Game currency top-up.',
    image_url: 'game-topup',
    theme_accent: 'fire-orange',
    base_usd: 5,
    issuance_fee_usd: 0.5,
    funding_fee_percent: 1.0,
    processing_fee_usd: 0.0,
    is_virtual: false,
    min_amount: 5,
    max_amount: 50,
    denominations: [5, 10, 20, 50],
    features: ['Direct top-up', 'Instant delivery', 'Safe'],
    validity: 'Permanent',
    delivery_time: 'Instant',
    starting_price_npr: 900,
  },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1001',
    order_id: 'VCN-2026-0001',
    customer_name: 'Ramesh Tamang',
    customer_email: 'ramesh.tamang98@gmail.com',
    customer_phone: '+977 9801234567',
    card_name: 'RAMESH TAMANG',
    billing_address: 'Lazimpat, Kathmandu 44600, Nepal',
    product_id: 'prod-virtual-dollar-card',
    product_name: 'Virtual Dollar Card (Reloadable)',
    product_category: 'virtual_cards_reloadable',
    amount_usd: 50,
    total_npr: 10738,
    payment_screenshot_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    status: 'Completed',
    notes: 'Please verify fast, need it for Facebook ads campaign.',
    internal_notes: 'Verified eSewa TxnID: 98124976. Issued Visa Virtual card.',
    card_details: {
      cardNumber: '4578 •••• •••• 9021',
      expiry: '12/28',
      cvv: '372',
      deliveredAt: '2026-09-19T14:35:00Z',
      instructions: 'Add card in Apple Wallet or billing portal. OTP sent to your WhatsApp.',
    },
    created_at: '2026-09-19T14:15:00Z',
    payment_method: 'esewa',
  },
  {
    id: 'ord-1002',
    order_id: 'VCN-2026-0002',
    customer_name: 'Pooja Shrestha',
    customer_email: 'pooja.shrestha@outlook.com',
    customer_phone: '+977 9849876543',
    billing_address: 'Pokhara-8, Kaski',
    product_id: 'prod-google-play-us',
    product_name: 'Google Play US Gift Card',
    product_category: 'gift_cards',
    amount_usd: 25,
    total_npr: 4768,
    payment_screenshot_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
    status: 'Paid',
    notes: 'For Google One 100GB storage renewal.',
    internal_notes: 'eSewa payment confirmed. Ready for code dispatch.',
    created_at: '2026-09-20T08:42:00Z',
    payment_method: 'esewa',
  },
  {
    id: 'ord-1003',
    order_id: 'VCN-2026-0003',
    customer_name: 'Bikash Gurung',
    customer_email: 'bikash.gurung.pro@gmail.com',
    customer_phone: '+977 9811223344',
    card_name: 'BIKASH GURUNG',
    product_id: 'prod-virtual-dollar-card',
    product_name: 'Virtual Dollar Card (Reloadable)',
    product_category: 'virtual_cards_reloadable',
    amount_usd: 100,
    total_npr: 20436,
    payment_screenshot_url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&auto=format&fit=crop&q=80',
    status: 'Pending Verification',
    notes: 'Kindly confirm eSewa transfer Rs. 20,436.',
    created_at: '2026-09-20T10:10:00Z',
    payment_method: 'esewa',
  },
];

export function getStoredProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PRODUCTS;
  }
}

export function saveProducts(products: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (err) {
    console.error('Failed to save products', err);
  }
}

export function getStoredOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ORDERS;
  }
}

export function saveOrders(orders: Order[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  } catch (err) {
    console.error('Failed to save orders', err);
  }
}

export function addOrder(newOrder: Omit<Order, 'id' | 'order_id' | 'created_at'>): Order {
  const currentOrders = getStoredOrders();
  const year = new Date().getFullYear();
  const count = currentOrders.length + 1;
  const orderIdNumber = String(count).padStart(4, '0');
  const order_id = `VCN-${year}-${orderIdNumber}`;

  const order: Order = {
    ...newOrder,
    id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    order_id,
    created_at: new Date().toISOString(),
  };

  const updated = [order, ...currentOrders];
  saveOrders(updated);
  return order;
}

export function updateOrder(orderId: string, updates: Partial<Order>): Order | null {
  const currentOrders = getStoredOrders();
  const index = currentOrders.findIndex((o) => o.id === orderId || o.order_id === orderId);
  if (index === -1) return null;

  const updatedOrder = {
    ...currentOrders[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  currentOrders[index] = updatedOrder;
  saveOrders(currentOrders);
  return updatedOrder;
}

export function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings', err);
  }
}

export function isAdminAuthenticated(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  } catch {
    return false;
  }
}

export function setAdminAuthenticated(auth: boolean): void {
  try {
    if (auth) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    }
  } catch (err) {
    console.error('Failed to update admin auth', err);
  }
}
