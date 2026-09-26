import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageCircle,
  TrendingUp,
  Award,
  Globe,
  DollarSign,
} from 'lucide-react';
import { Product, AppSettings, Order, ProductCategory } from './types';
import { DEFAULT_SETTINGS } from './utils/storage';
import {
  apiFetchOrders,
  apiFetchProducts,
  apiFetchSettings,
} from './utils/api';
import { calculateOrderPrice, formatNPR, formatUSD } from './utils/pricing';
import { BlackMatteCard } from './components/BlackMatteCard';
import { ProductGraphic } from './components/ProductGraphic';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { TrackOrderModal } from './components/TrackOrderModal';
import { AdminPanel } from './components/AdminPanel';
import { PostsDirectory } from './components/PostsDirectory';

import { MobileBottomBar } from './components/MobileBottomBar';
import { ActiveCardsModal } from './components/ActiveCardsModal';
import { ReloadCardModal } from './components/ReloadCardModal';

export function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [orders, setOrders] = useState<Order[]>([]);

  // Category filter for Store
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Hero Quick Calculator State
  const [heroCardAmount, setHeroCardAmount] = useState<number>(50);
  const [heroCardName, setHeroCardName] = useState<string>('VIRTUAL CARD NEPAL');

  // URL Path Router for /posts
  const [isPostsRoute, setIsPostsRoute] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      const h = window.location.hash.toLowerCase();
      return p === '/posts' || p.startsWith('/posts/') || h === '#/posts' || h === '#posts';
    }
    return false;
  });

  // Secret admin route detector (domain.com/rootkesh or domain.com/frukissn)
  const isSecretAdminRoute = () => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase().replace(/\/+$/, '');
      const secretPath = process.env.NEXT_PUBLIC_ADMIN_ROUTE_PATH || '/fkinr';
      return p === secretPath || p.endsWith(secretPath);
    }
    return false;
  };

  // Modals
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [checkoutData, setCheckoutData] = useState<{
    product: Product;
    amountUSD: number;
    cardName?: string;
  } | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [trackOrderId, setTrackOrderId] = useState<string>('');
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState<boolean>(false);
  const [isActiveCardsOpen, setIsActiveCardsOpen] = useState<boolean>(false);
  const [isReloadOpen, setIsReloadOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(() => isSecretAdminRoute());


  // Load initial data from the Render API
  const loadData = async () => {
    try {
      console.log('Loading data from backend API...');
      const [remoteSettings, remoteProducts, remoteOrders] = await Promise.all([
        apiFetchSettings().catch(e => { console.warn('getSettings failed', e); return null; }),
        apiFetchProducts().catch(e => { console.warn('getProducts failed', e); return null; }),
        apiFetchOrders().catch(e => { console.warn('getOrders failed', e); return null; }),
      ]);
      console.log('Data loaded:', { settings: remoteSettings, products: remoteProducts, orders: remoteOrders });
      if (remoteSettings) setSettings(remoteSettings);
      if (remoteProducts && remoteProducts.length > 0) setProducts(remoteProducts);
      if (remoteOrders) setOrders(remoteOrders);
    } catch (err) {
      console.error('Failed to sync from backend API', err);
    }
  };

  useEffect(() => {
    loadData();

    // Background poller every 15s to keep orders fresh across all devices
    const interval = setInterval(() => {
      loadData();
    }, 15000);

    // Listen to URL popstate or hashchange
    const handleLocationChange = () => {
      const p = window.location.pathname.toLowerCase();
      const h = window.location.hash.toLowerCase();
      setIsPostsRoute(p === '/posts' || p.startsWith('/posts/') || h === '#/posts' || h === '#posts');
      if (isSecretAdminRoute()) {
        setIsAdminOpen(true);
      }
    };

    // Secret emergency admin shortcut (Ctrl+Shift+A or Cmd+Shift+A)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsAdminOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const handleCloseAdmin = () => {
    setIsAdminOpen(false);
    // If the browser URL currently reflects the secret admin route, silently revert to /
    if (typeof window !== 'undefined' && isSecretAdminRoute()) {
      if (window.location.hash.includes('rootkesh') || window.location.hash.includes('frukissn')) {
        window.location.hash = '';
      }
      if (window.location.pathname.includes('rootkesh') || window.location.pathname.includes('frukissn')) {
        if (window.history.pushState) {
          window.history.pushState({}, '', '/');
        }
      }
    }
  };

  // Primary Virtual Card product for Hero quick buy
  const primaryVirtualCard = useMemo(() => {
    return products.find((p) => p.is_virtual) || products[0];
  }, [products]);

  // Hero price calculation
  const heroPriceCalc = useMemo(() => {
    if (!primaryVirtualCard) return null;
    return calculateOrderPrice(heroCardAmount, primaryVirtualCard, settings);
  }, [heroCardAmount, primaryVirtualCard, settings]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'ALL') return products.filter((p) => p.active !== false);
    return products.filter((p) => p.active !== false && p.category === selectedCategory);
  }, [products, selectedCategory]);

  const handleOpenStore = () => {
    const el = document.getElementById('store-catalog');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // If user navigates to /posts (directly or via URL)
  if (isPostsRoute) {
    return (
      <>
        <PostsDirectory
          settings={settings}
          onBackToApp={() => {
            setIsPostsRoute(false);
            if (typeof window !== 'undefined' && window.history.pushState) {
              window.history.pushState({}, '', '/');
            }
          }}
          onSelectProductToOrder={() => {
            setIsPostsRoute(false);
            if (typeof window !== 'undefined' && window.history.pushState) {
              window.history.pushState({}, '', '/');
            }
            setTimeout(() => {
              handleOpenStore();
            }, 100);
          }}
        />
        {/* Modals can still be launched if opened */}
        {isTrackOrderOpen && (
          <TrackOrderModal
            initialOrderId={trackOrderId}
            settings={settings}
            isOpen={isTrackOrderOpen}
            onClose={() => {
              setIsTrackOrderOpen(false);
              setTrackOrderId('');
            }}
          />
        )}
        {isAdminOpen && (
          <AdminPanel
            orders={orders}
            products={products}
            settings={settings}
            isOpen={isAdminOpen}
            onClose={handleCloseAdmin}
            onRefreshData={loadData}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col selection:bg-[#D4AF37]/30 selection:text-[#F3E5AB]">
      {/* Header with live ticker & navigation */}
      <Header
        settings={settings}
        onOpenStore={handleOpenStore}
        onOpenHowItWorks={handleOpenHowItWorks}
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
        onOpenActiveCards={() => setIsActiveCardsOpen(true)}
        onOpenReload={() => setIsReloadOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* HERO SECTION: Black Matte Platinum Showcase */}
        <section className="relative overflow-hidden pt-8 pb-16 sm:pt-12 sm:pb-24 border-b border-white/5">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-[#D4AF37]/10 via-[#E5E4E2]/5 to-transparent blur-[120px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            {/* Top Eyebrow Tag */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900/90 border border-[#D4AF37]/40 px-3.5 py-1 text-xs font-semibold text-[#F3E5AB] shadow-[0_0_15px_rgba(212,175,55,0.15)]">
                <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
                <span>Next-Gen Black Matte Platinum Cards</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>No Customer Login Needed</span>
              </span>
            </div>

            {/* Headline */}
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                <span className="text-white">Virtual Dollar Cards &amp; Top-ups.</span>
                <br />
                <span className="bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#E5E4E2] bg-clip-text text-transparent">
                  Issued Instantly in Nepal.
                </span>
              </h1>
              <p className="mt-4 text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto leading-relaxed">
                Pay for OpenAI, ChatGPT Plus, Facebook Ads, Steam, Netflix, AWS, and global subscriptions with your
                eSewa account. Loaded from <strong className="text-white">$10 to $20,000 USD</strong>.
              </p>
            </div>

            {/* Hero Interactive Card Stage + Live Calculator */}
            <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
              {/* Left: 3D Black Matte Card Visual */}
              <div className="lg:col-span-6 flex flex-col items-center justify-center">
                <div className="relative group">
                  {/* Subtle card glow on hover */}
                  <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#D4AF37]/30 to-[#E5E4E2]/20 opacity-50 blur-lg transition duration-500 group-hover:opacity-100" />
                  <BlackMatteCard
                    cardholderName={heroCardName || 'VIRTUAL CARD NEPAL'}
                    amountUSD={heroCardAmount}
                    compact={false}
                    className="transform transition-transform duration-300 hover:scale-[1.02]"
                  />
                </div>
                <div className="mt-3 text-center text-[11px] text-neutral-500 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>3D Secure (3DS OTP) • 5-Year Expiry • Universal Acceptance</span>
                </div>
              </div>

              {/* Right: Tactile Quick Configurator & eSewa Price Calculator */}
              <div className="lg:col-span-6 rounded-2xl border border-white/10 bg-[#111113]/90 p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-[#D4AF37]" /> Instant Card Configurator
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono">1 USD = Rs. {settings.exchange_rate}</span>
                </div>

                {/* Amount Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-300">Choose Card Balance (USD)</label>
                    <span className="font-mono text-xl font-black text-[#F3E5AB]">${heroCardAmount} USD</span>
                  </div>

                  <input
                    type="range"
                    min={10}
                    max={500}
                    step={5}
                    value={heroCardAmount}
                    onChange={(e) => setHeroCardAmount(Number(e.target.value))}
                    className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                  />

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[10, 25, 50, 75, 100, 250, 500].map((preset) => {
                      const isDiscounted = preset > 50;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setHeroCardAmount(preset)}
                          className={`relative rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                            heroCardAmount === preset
                              ? 'bg-[#D4AF37] text-black shadow'
                              : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                          }`}
                        >
                          ${preset}
                          {isDiscounted && (
                            <span className="ml-1 text-[9px] font-bold text-emerald-400">
                              {preset <= 100 ? '-5%' : preset <= 250 ? '-8%' : '-10%'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Volume discount notification if amount > 50 */}
                  {heroPriceCalc && heroPriceCalc.discountPercent > 0 && (
                    <div className="flex items-center justify-between rounded-lg bg-emerald-950/70 border border-emerald-500/40 px-3 py-1.5 text-xs text-emerald-300 shadow-sm animate-fadeIn">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>{heroPriceCalc.discountPercent}% Big Purchase Discount Applied!</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-300">
                        Save {formatNPR(heroPriceCalc.discountAmountNPR)}
                      </span>
                    </div>
                  )}

                  {/* Cardholder Name input for embossing */}
                  <div className="pt-2">
                    <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                      Embossed Name on Card
                    </label>
                    <input
                      type="text"
                      value={heroCardName}
                      onChange={(e) => setHeroCardName(e.target.value.toUpperCase())}
                      placeholder="YOUR FULL NAME"
                      className="w-full rounded-lg bg-black/60 border border-white/10 px-3 py-1.5 text-xs font-mono uppercase text-[#F3E5AB] focus:border-[#D4AF37] focus:outline-none"
                      maxLength={24}
                    />
                  </div>

                  {/* Calculated Price in NPR */}
                  {heroPriceCalc && (
                    <div className="rounded-xl border border-white/10 bg-black/60 p-3.5 space-y-1.5">
                      <div className="flex justify-between text-xs text-neutral-400">
                        <span>Subtotal USD:</span>
                        <span className="font-mono text-neutral-200">{formatUSD(heroPriceCalc.grossUSD)}</span>
                      </div>
                      {heroPriceCalc.discountPercent > 0 && (
                        <div className="flex justify-between text-xs text-emerald-400 font-semibold">
                          <span>Volume Discount ({heroPriceCalc.discountPercent}% OFF):</span>
                          <span className="font-mono">-{formatNPR(heroPriceCalc.discountAmountNPR)} (-{formatUSD(heroPriceCalc.discountAmountUSD)})</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-1 border-t border-white/5">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-neutral-400">Total Payable (eSewa)</div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-[#60BB46] tracking-tight">
                              {formatNPR(heroPriceCalc.finalNPR)}
                            </span>
                            {heroPriceCalc.discountPercent > 0 && (
                              <span className="text-xs text-neutral-500 line-through font-mono">
                                {formatNPR(heroPriceCalc.grossNPR)}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="rounded-full bg-emerald-950 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                          Instant eSewa QR
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Instant Checkout CTA */}
                  <button
                    type="button"
                    onClick={() => {
                      if (primaryVirtualCard) {
                        setCheckoutData({
                          product: primaryVirtualCard,
                          amountUSD: heroCardAmount,
                          cardName: heroCardName,
                        });
                      }
                    }}
                    className="w-full group flex items-center justify-center gap-2 rounded-xl py-3 px-5 font-bold text-black text-sm uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)]"
                    style={{
                      background: 'linear-gradient(135deg, #F5D77F 0%, #D4AF37 50%, #B8921F 100%)',
                    }}
                  >
                    <span>Get Card Now • {heroPriceCalc ? formatNPR(heroPriceCalc.finalNPR) : ''}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <div className="text-center text-[10px] text-neutral-500">
                    ⚡ No login required • Dispatched to your WhatsApp &amp; Email in 5–15 mins
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Compatibility Badges */}
            <div className="mt-14 pt-8 border-t border-white/5 text-center">
              <div className="text-xs uppercase tracking-widest text-neutral-500 font-semibold mb-4">
                Tested &amp; 100% Compatible Across Global Platforms
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs font-semibold text-neutral-400">
                {[
                  'ChatGPT Plus & OpenAI',
                  'Midjourney AI',
                  'Facebook & Meta Ads',
                  'Google Workspace & Ads',
                  'Steam Wallet',
                  'Apple Store & iCloud',
                  'Netflix & Spotify',
                  'AWS & Cloud Servers',
                  'Telegram Premium',
                ].map((plat, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-neutral-900/90 border border-white/10 px-3 py-1.5 text-neutral-300 shadow-sm"
                  >
                    {plat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* STORE CATALOG SECTION */}
        <section id="store-catalog" className="py-16 sm:py-20 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {/* Catalog Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div>
                <div className="text-xs uppercase tracking-wider text-[#D4AF37] font-semibold mb-1">
                  Online Store Catalog
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Virtual Cards, Gift Cards &amp; Game Top-ups
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                  Transparent dynamic pricing in NPR. Select your product to configure denominations.
                </p>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
                {[
                  { id: 'ALL', label: 'All Products' },
                  { id: 'virtual_cards_preloaded', label: 'Virtual Cards — Preloaded' },
                  { id: 'virtual_cards_reloadable', label: 'Virtual Cards — Reloadable' },
                  { id: 'gift_cards', label: 'Gift Cards — General' },
                  { id: 'gift_cards_apple', label: 'Gift Cards — Apple / iTunes' },
                  { id: 'game_topups', label: 'Game Top-ups' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-[#D4AF37] text-black font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                        : 'bg-neutral-900/80 text-neutral-400 hover:text-white hover:bg-neutral-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Big Purchase Volume Discount Banner */}
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-amber-950/30 p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
                    <span>Big Purchase Volume Discount Available on Every Product!</span>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-2.5 py-0.5 uppercase font-bold">
                      5% to 15% OFF
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    Orders above $50 automatically unlock progressive discounts: 5% (&gt;$50), 8% (&gt;$100), 10% (&gt;$250), 12.5% (&gt;$500) up to 15% (&gt;$1,000)!
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                  🔥 Automatic at Checkout
                </span>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const sampleCalc = calculateOrderPrice(product.base_usd || 10, product, settings);

                return (
                  <div
                    key={product.id}
                    className="group rounded-2xl border border-white/10 bg-[#0e0e10] p-5 flex flex-col justify-between transition-all duration-300 hover:border-[#D4AF37]/50 hover:shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
                  >
                    <div>
                      {/* Product Visual Header */}
                      <div className="mb-4">
                        <ProductGraphic product={product} size="md" />
                      </div>

                      {/* Category & Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="rounded-full bg-neutral-900 border border-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-neutral-300">
                          {product.category_label}
                        </span>
                        <span className="rounded-full bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-300 flex items-center gap-1">
                          <Sparkles className="h-2.5 w-2.5" /> 5%–15% OFF &gt;$50
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-base font-bold text-white group-hover:text-[#F3E5AB] transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{product.short_description}</p>

                      {/* Feature Checklist */}
                      <ul className="mt-3 space-y-1 text-[11px] text-neutral-300">
                        {product.features.slice(0, 3).map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3 w-3 text-[#D4AF37] shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Bottom Pricing & CTA */}
                    <div className="mt-5 pt-3 border-t border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-neutral-500">Starting from</div>
                          <div className="font-mono text-base font-black text-[#F3E5AB]">
                            {formatNPR(sampleCalc.finalNPR)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-neutral-500">Delivery</div>
                          <div className="text-xs font-semibold text-emerald-400">{product.delivery_time}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedProductForDetail(product)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-4 font-bold text-xs uppercase tracking-wider text-black transition-all group-hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                        style={{
                          background: 'linear-gradient(135deg, #F5D77F 0%, #D4AF37 50%, #B8921F 100%)',
                        }}
                      >
                        <span>Configure &amp; Buy</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS (4 SIMPLE STEPS) */}
        <section id="how-it-works" className="py-16 sm:py-20 border-b border-white/5 bg-[#080809]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs uppercase tracking-wider text-[#D4AF37] font-semibold">Fast &amp; Seamless</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                How It Works • 4 Simple Steps
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-2">
                Order your dollar cards without logging in. Verified securely via official eSewa QR.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  step: '01',
                  title: 'Select & Customize',
                  desc: 'Pick your virtual card or gift card. Choose your exact balance from $10 up to $20,000 USD.',
                  icon: CreditCard,
                },
                {
                  step: '02',
                  title: 'Scan eSewa QR',
                  desc: 'Scan our verified merchant QR code with the eSewa app and transfer the calculated NPR amount.',
                  icon: Zap,
                },
                {
                  step: '03',
                  title: 'Attach Receipt',
                  desc: 'Enter your email & WhatsApp, upload the eSewa receipt screenshot, and receive your unique Order ID.',
                  icon: ShieldCheck,
                },
                {
                  step: '04',
                  title: 'Instant Delivery',
                  desc: 'Our staff manually verifies the payment and dispatches your card details within 5–15 minutes.',
                  icon: Clock,
                },
              ].map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <div
                    key={idx}
                    className="relative rounded-2xl border border-white/10 bg-[#101012] p-6 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-mono text-2xl font-black text-[#D4AF37]/50">{item.step}</span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 border border-white/10 text-[#D4AF37]">
                          <IconComp className="h-5 w-5" />
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                      <p className="text-xs text-neutral-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Track Bar inside How it works */}
            <div className="mt-12 rounded-2xl border border-[#D4AF37]/30 bg-neutral-950 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white">Already placed an order?</h4>
                <p className="text-xs text-neutral-400">Enter your Order ID (e.g. VCN-2026-0001) to check live verification status.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsTrackOrderOpen(true)}
                className="rounded-xl bg-neutral-800 hover:bg-neutral-700 px-5 py-2.5 text-xs font-bold text-white transition-colors shrink-0 flex items-center gap-1.5"
              >
                <Search className="h-4 w-4 text-[#D4AF37]" />
                <span>Track My Order ID</span>
              </button>
            </div>
          </div>
        </section>

        {/* PRICING TRANSPARENCY & FORMULA BANNER */}
        <section className="py-12 border-b border-white/5 bg-[#060608]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-[#D4AF37]" />
                <h3 className="text-base font-bold text-white">100% Transparent Dynamic Pricing Formula</h3>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                We believe in zero hidden fees. Every order follows our standard pricing equation:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="rounded-xl bg-black/60 p-4 border border-white/5 space-y-1 text-neutral-300">
                  <div className="text-[10px] uppercase font-bold text-amber-300 font-sans">Step 1: Total USD</div>
                  <div>total_usd = amount + issuance_fee</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ (amount * funding_fee%)</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ processing_fee</div>
                </div>

                <div className="rounded-xl bg-black/60 p-4 border border-white/5 space-y-1 text-neutral-300">
                  <div className="text-[10px] uppercase font-bold text-emerald-400 font-sans">Step 2: Price in NPR</div>
                  <div>price_npr = total_usd * exchange_rate</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;* (1 + commission_percent / 100)</div>
                  <div className="text-neutral-500 text-[10px]">Rounded to nearest rupee</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer
        settings={settings}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          handleOpenStore();
        }}
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
        onOpenActiveCards={() => setIsActiveCardsOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Mobile Bottom Quick Bar for seamless phone navigation */}
      <MobileBottomBar
        settings={settings}
        onOpenStore={handleOpenStore}
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
        onOpenActiveCards={() => setIsActiveCardsOpen(true)}
        onOpenReload={() => setIsReloadOpen(true)}
        onOpenGuides={() => setIsPostsRoute(true)}
      />

      {/* MODALS */}
      {/* 1. Product Detail & Amount Configurator Modal */}
      {selectedProductForDetail && (
        <ProductDetailModal
          product={selectedProductForDetail}
          settings={settings}
          isOpen={!!selectedProductForDetail}
          onClose={() => setSelectedProductForDetail(null)}
          onProceedToCheckout={(product, amountUSD, cardholderName) => {
            setSelectedProductForDetail(null);
            setCheckoutData({ product, amountUSD, cardName: cardholderName });
          }}
        />
      )}

      {/* 2. Checkout Modal with eSewa QR & Screenshot Upload */}
      {checkoutData && (
        <CheckoutModal
          product={checkoutData.product}
          amountUSD={checkoutData.amountUSD}
          cardNameInitial={checkoutData.cardName}
          settings={settings}
          isOpen={!!checkoutData}
          onClose={() => setCheckoutData(null)}
          onOrderSuccess={(newOrder) => {
            setCheckoutData(null);
            loadData();
            setConfirmedOrder(newOrder);
          }}
        />
      )}

      {/* 3. Order Confirmation Modal */}
      {confirmedOrder && (
        <OrderConfirmationModal
          order={confirmedOrder}
          settings={settings}
          isOpen={!!confirmedOrder}
          onClose={() => setConfirmedOrder(null)}
          onTrackOrder={(orderId) => {
            setConfirmedOrder(null);
            setTrackOrderId(orderId);
            setIsTrackOrderOpen(true);
          }}
        />
      )}

      {/* 4. Track Order Status Modal */}
      <TrackOrderModal
        initialOrderId={trackOrderId}
        settings={settings}
        isOpen={isTrackOrderOpen}
        onClose={() => {
          setIsTrackOrderOpen(false);
          setTrackOrderId('');
        }}
        onOpenActiveCards={() => setIsActiveCardsOpen(true)}
      />

      {/* 5. Active Cards & CVV Inspection Modal */}
      <ActiveCardsModal
        settings={settings}
        isOpen={isActiveCardsOpen}
        onClose={() => setIsActiveCardsOpen(false)}
        onOpenStore={handleOpenStore}
      />

      {isReloadOpen && <ReloadCardModal settings={settings} isOpen={isReloadOpen} onClose={() => setIsReloadOpen(false)} />}

      {/* 6. Admin Panel Modal */}
      {isAdminOpen && (
        <AdminPanel
          orders={orders}
          products={products}
          settings={settings}
          isOpen={isAdminOpen}
          onClose={handleCloseAdmin}
          onRefreshData={loadData}
        />
      )}
    </div>
  );
}

export default App;
