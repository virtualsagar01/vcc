import React, { useState } from 'react';
import {
  X,
  Lock,
  LogOut,
  LayoutDashboard,
  ShoppingBag,
  Layers,
  Settings as SettingsIcon,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  DollarSign,
  CreditCard,
  Copy,
  Check,
  Code,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Order, Product, AppSettings, OrderStatus, ProductCategory } from '../types';
import { formatNPR, formatUSD } from '../utils/pricing';
import {
  saveOrders,
  saveProducts,
  saveSettings,
  setAdminAuthenticated,
} from '../utils/storage';
import {
  apiIssueCard,
  apiUpdateOrderStatus,
  apiUpdateSettings,
  apiSyncLiveExchangeRate,
  apiCreateProduct,
  apiUpdateProduct,
  apiDeleteProduct,
  apiAdminLogin,
  apiAdminLogout,
  hasAdminSession,
  apiUploadImage,
  apiFetchReloadTransactions,
  apiApproveReload,
} from '../utils/api';

interface AdminPanelProps {
  orders: Order[];
  products: Product[];
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;

}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  orders,
  products,
  settings,
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  React.useEffect(() => { setIsAuthenticated(hasAdminSession()); }, []);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Tabs: 'dashboard' | 'orders' | 'products' | 'settings' | 'supabase_sql'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'transactions' | 'products' | 'settings' | 'supabase_sql'>('dashboard');
  const [reloadTransactions, setReloadTransactions] = useState<any[]>([]);
  React.useEffect(() => { if (isAuthenticated && activeTab === 'transactions') apiFetchReloadTransactions().then(setReloadTransactions).catch(console.error); }, [isAuthenticated, activeTab]);

  // Selected Order for viewing / modifying
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  // Card issuance inputs
  const [issuedCardNumber, setIssuedCardNumber] = useState('');
  const [issuedExpiry, setIssuedExpiry] = useState('12/29');
  const [issuedCvv, setIssuedCvv] = useState('');
  const [issuedVoucherCode, setIssuedVoucherCode] = useState('');
  const [issuedInstructions, setIssuedInstructions] = useState('');

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<AppSettings>({ ...settings });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [isSyncingRate, setIsSyncingRate] = useState(false);
  const [syncRateMessage, setSyncRateMessage] = useState<string | null>(null);

  const handleSyncLiveRate = async () => {
    setIsSyncingRate(true);
    setSyncRateMessage(null);
    try {
      const markup = settingsForm.markup_percent !== undefined ? settingsForm.markup_percent : 6.5;
      const updated = await apiSyncLiveExchangeRate(markup);
      if (updated) {
        setSettingsForm({ ...updated });
        setSyncRateMessage(
          `Synced with Live Forex! Live Rate: Rs. ${updated.live_forex_rate} NPR. Loyal Store Rate (+${updated.markup_percent}%): Rs. ${updated.exchange_rate} NPR.`
        );
        onRefreshData();
      } else {
        // Fallback calculation
        const fallbackLive = 153.68;
        const newRate = Number((fallbackLive * (1 + markup / 100)).toFixed(2));
        const updatedSettings: AppSettings = {
          ...settingsForm,
          live_forex_rate: fallbackLive,
          markup_percent: markup,
          exchange_rate: newRate,
          commission_percent: 0.0,
        };
        setSettingsForm(updatedSettings);
        await apiUpdateSettings(updatedSettings);
        setSyncRateMessage(`Applied ${markup}% loyal markup: Rs. ${newRate} NPR per USD.`);
        onRefreshData();
      }
    } catch {
      setSyncRateMessage('Failed to sync live rate feed.');
    } finally {
      setIsSyncingRate(false);
    }
  };

  // Product edit / create modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  // Filter orders
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [orderSearch, setOrderSearch] = useState<string>('');

  // Copy helper for SQL schema
  const [copiedSQL, setCopiedSQL] = useState(false);

  if (!isOpen) return null;

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try { await apiAdminLogin(password); } catch (error: any) { setLoginError(error?.message || 'Invalid admin credentials.'); return; }
    setIsAuthenticated(true);
    setAdminAuthenticated(true);
    onRefreshData();
  };

  const handleLogout = async () => {
    apiAdminLogout();
    setIsAuthenticated(false);
    setAdminAuthenticated(false);
  };

  // Order status update
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const updated = orders.map((o) => {
      if (o.id === orderId || o.order_id === orderId) {
        return {
          ...o,
          status: newStatus,
          updated_at: new Date().toISOString(),
        };
      }
      return o;
    });
    saveOrders(updated);
    if (selectedOrder) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
    // Sync with backend database
    await apiUpdateOrderStatus(orderId, newStatus, selectedOrder?.internal_notes);
    onRefreshData();
  };

  // Dispatch card credentials
  const handleDispatchCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const cardPayload = {
      cardNumber: issuedCardNumber || selectedOrder.card_details?.cardNumber,
      expiry: issuedExpiry || selectedOrder.card_details?.expiry,
      cvv: issuedCvv || selectedOrder.card_details?.cvv,
      voucherCode: issuedVoucherCode || selectedOrder.card_details?.voucherCode,
      instructions: issuedInstructions || selectedOrder.card_details?.instructions,
    };

    const updated = orders.map((o) => {
      if (o.id === selectedOrder.id) {
        return {
          ...o,
          status: 'Completed' as OrderStatus,
          card_details: {
            ...cardPayload,
            deliveredAt: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        };
      }
      return o;
    });

    saveOrders(updated);
    setSelectedOrder({
      ...selectedOrder,
      status: 'Completed',
      card_details: {
        ...cardPayload,
        deliveredAt: new Date().toISOString(),
      },
    });

    // Persist to server backend
    await apiIssueCard(selectedOrder.id, cardPayload);
    onRefreshData();
    alert('Card credentials successfully issued and permanently stored in database!');
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiUpdateSettings(settingsForm);
    setSettingsSaved(true);
    onRefreshData();
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  // Save Product (Create or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    let updatedList: Product[];
    if (isCreatingProduct) {
      updatedList = [editingProduct, ...products];
    } else {
      updatedList = products.map((p) => (p.id === editingProduct.id ? editingProduct : p));
    }

    try {
      if (isCreatingProduct) {
        await apiCreateProduct(editingProduct);
      } else {
        await apiUpdateProduct(editingProduct);
      }
      saveProducts(updatedList);
      setEditingProduct(null);
      setIsCreatingProduct(false);
      onRefreshData();
    } catch (error: any) {
      alert(error?.message || 'Failed to save product.');
    }
  };

  // Delete product
  const handleDeleteProduct = async (prodId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await apiDeleteProduct(prodId);
      const updated = products.filter((p) => p.id !== prodId);
      saveProducts(updated);
      onRefreshData();
    } catch (error: any) {
      alert(error?.message || 'Failed to delete product.');
    }
  };

  // Calculate stats
  const totalOrdersCount = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'Pending Verification');
  const completedOrders = orders.filter((o) => o.status === 'Completed');
  const totalRevenueNPR = orders
    .filter((o) => o.status === 'Completed' || o.status === 'Paid')
    .reduce((sum, o) => sum + (o.total_npr || 0), 0);

  // Filtered orders list
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = orderStatusFilter === 'ALL' || o.status === orderStatusFilter;
    const matchesSearch =
      o.order_id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customer_email.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.product_name.toLowerCase().includes(orderSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const supabaseSchemaSQL = "-- Virtual Card Nepal \u2014 Supabase schema\n-- Run this once in Supabase SQL Editor.\n\ncreate extension if not exists pgcrypto;\n\ncreate sequence if not exists vcn_order_sequence start 1;\n\ncreate table if not exists products (\n  id uuid primary key default gen_random_uuid(),\n  name text not null,\n  slug text,\n  category text,\n  category_label text,\n  description text,\n  short_description text,\n  image_url text,\n  theme_accent text,\n  base_usd numeric(10,2) default 0,\n  issuance_fee_usd numeric(10,2) default 0,\n  funding_fee_percent numeric(5,2) default 0,\n  processing_fee_usd numeric(10,2) default 0,\n  is_virtual boolean default false,\n  min_amount numeric(10,2),\n  max_amount numeric(10,2),\n  denominations jsonb default '[]'::jsonb,\n  features jsonb default '[]'::jsonb,\n  validity text,\n  delivery_time text,\n  starting_price_npr numeric(12,2) default 0,\n  badge_text text,\n  support_note text,\n  active boolean default true,\n  display_order int default 0,\n  created_at timestamptz default now()\n);\n\ncreate table if not exists orders (\n  id uuid primary key default gen_random_uuid(),\n  order_id text unique not null,\n  customer_name text not null,\n  customer_email text not null,\n  customer_phone text,\n  card_name text,\n  billing_address text,\n  product_id uuid references products(id) on delete set null,\n  product_name text,\n  product_category text,\n  amount_usd numeric(10,2),\n  total_npr numeric(12,2),\n  payment_screenshot_url text,\n  payment_method text default 'esewa',\n  transaction_id text,\n  transaction_url text,\n  status text default 'Pending Verification',\n  notes text,\n  internal_notes text,\n  card_details jsonb,\n  created_at timestamptz default now(),\n  updated_at timestamptz\n);\n\ncreate table if not exists settings (\n  id int primary key default 1,\n  brand_name text default 'Virtual Card Nepal',\n  brand_tagline text default 'Black Matte Platinum Virtual Dollar Cards & Gift Cards',\n  custom_domain text default '',\n  exchange_rate numeric(10,2) default 173.00,\n  commission_percent numeric(5,2) default 4.00,\n  live_forex_rate numeric(10,2),\n  markup_percent numeric(5,2),\n  auto_sync_live_rate boolean default false,\n  rate_last_synced timestamptz,\n  esewa_qr_url text,\n  esewa_id text,\n  esewa_account_name text,\n  contact_whatsapp text,\n  contact_email text,\n  contact_telegram text,\n  contact_phone text,\n  social_facebook text,\n  social_instagram text,\n  social_tiktok text,\n  social_youtube text,\n  store_notice text,\n  footer_text text,\n  support_hours text,\n  crypto_payment_address text,\n  crypto_payment_network text,\n  updated_at timestamptz,\n  constraint settings_single_row check (id = 1)\n);\n\ninsert into settings (id, exchange_rate, commission_percent, brand_name)\nvalues (1, 173.00, 4.00, 'Virtual Card Nepal')\non conflict (id) do nothing;\n\n-- Generate VCN-YYYY-0001 style IDs atomically.\ncreate or replace function next_order_number()\nreturns bigint\nlanguage sql\nsecurity definer\nas $$ select nextval('vcn_order_sequence'); $$;\n\ngrant execute on function next_order_number() to anon, authenticated, service_role;\n\n-- Storage bucket used by checkout uploads.\ninsert into storage.buckets (id, name, public)\nvalues ('payment-screenshots', 'payment-screenshots', true)\non conflict (id) do update set public = true;\n\n-- Public catalog/settings reads are handled by Render using the service role.\n-- Keep tables inaccessible to browser clients so the service role is the only DB writer.\nalter table products enable row level security;\nalter table orders enable row level security;\nalter table settings enable row level security;\n\ndrop policy if exists \"public products read\" on products;\ndrop policy if exists \"public settings read\" on settings;\n\n-- No anon/authenticated table policies are required because the app talks to Postgres through Render.\n-- Admin authentication is handled entirely by Render; the client receives only a short-lived signed session token.\n";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-black/95 backdrop-blur-md">
      <div className="relative w-full max-w-7xl rounded-2xl border border-[#E5E4E2]/25 bg-[#0a0a0b] shadow-[0_30px_90px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* Top Metallic Banner */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#D4AF37] via-[#E5E4E2] to-[#D4AF37]" />

        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A0A0A] border border-[#D4AF37]/50 text-[#F3E5AB]">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Virtual Card Nepal • Admin Control Center
                </h1>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                  STAFF ONLY
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">Order verification, dynamic pricing & product fees</p>
            </div>
          </div>

          <div className="flex items-center gap-2">

            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 rounded-lg bg-neutral-900 border border-white/10 px-3 py-1.5 text-xs text-neutral-300 hover:text-red-400 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-full p-2 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main Body */}
        {!isAuthenticated ? (
          /* Login View */
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center max-w-md mx-auto w-full my-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-900 border border-[#D4AF37]/30 shadow-lg text-[#D4AF37] mb-4">
              <Lock className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide">Admin Authentication</h2>
            <p className="text-xs text-neutral-400 text-center mt-1 mb-6">
              Enter your admin credentials to access orders, eSewa receipts, and live rates.
            </p>

            <form onSubmit={handleLogin} className="w-full space-y-4">
              {loginError && (
                <div className="rounded-lg bg-red-950/50 border border-red-500/40 p-3 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Admin Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full rounded-lg bg-neutral-900 border border-white/15 px-3 py-2.5 text-xs sm:text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl py-3 px-4 font-bold text-black text-sm transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)]"
                style={{
                  background: 'linear-gradient(135deg, #F5D77F 0%, #D4AF37 50%, #B8921F 100%)',
                }}
              >
                Sign In to Admin Panel
              </button>


              {/* Secret Admin Route Notice */}
              <div className="mt-4 p-3 rounded-xl bg-neutral-900/90 border border-white/10 text-center space-y-1 text-xs">
                <div className="text-neutral-400 text-[11px] font-medium">Hidden Admin Access Routes:</div>
                <div className="font-mono text-[11px] text-[#F3E5AB]">
                  <span className="text-[#D4AF37]">/rootkesh</span> &bull; <span className="text-[#D4AF37]">/frukissn</span>
                </div>
                <div className="text-[10px] text-neutral-500 pt-0.5">
                  Public buttons removed from storefront. Emergency Hotkey: <kbd className="px-1 py-0.5 rounded bg-black border border-white/20 text-neutral-300">Ctrl+Shift+A</kbd>
                </div>
              </div>
            </form>
          </div>
        ) : (
          /* Logged In Dashboard Layout */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-60 border-b md:border-b-0 md:border-r border-white/10 bg-neutral-950 p-3 flex md:flex-col gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all shrink-0 ${
                  activeTab === 'dashboard'
                    ? 'bg-[#D4AF37]/15 text-[#F3E5AB] border border-[#D4AF37]/30'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all shrink-0 ${
                  activeTab === 'orders'
                    ? 'bg-[#D4AF37]/15 text-[#F3E5AB] border border-[#D4AF37]/30'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="h-4 w-4" />
                  <span>Orders</span>
                </div>
                {pendingOrders.length > 0 && (
                  <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-black text-black">
                    {pendingOrders.length}
                  </span>
                )}
              </button>

              <button type="button" onClick={() => setActiveTab('transactions')} className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all shrink-0 ${activeTab === 'transactions' ? 'bg-[#D4AF37]/15 text-[#F3E5AB] border border-[#D4AF37]/30' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'}`}><div className="flex items-center gap-2.5"><RefreshCw className="h-4 w-4"/><span>Transactions</span></div><span className="rounded-full bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 text-[10px]">{reloadTransactions.filter((r:any)=>r.status==='Pending Verification').length}</span></button>

              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all shrink-0 ${
                  activeTab === 'products'
                    ? 'bg-[#D4AF37]/15 text-[#F3E5AB] border border-[#D4AF37]/30'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>Products & Fees</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all shrink-0 ${
                  activeTab === 'settings'
                    ? 'bg-[#D4AF37]/15 text-[#F3E5AB] border border-[#D4AF37]/30'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <SettingsIcon className="h-4 w-4" />
                <span>Rates & eSewa QR</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('supabase_sql')}
                className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all shrink-0 ${
                  activeTab === 'supabase_sql'
                    ? 'bg-[#D4AF37]/15 text-[#F3E5AB] border border-[#D4AF37]/30'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Code className="h-4 w-4" />
                <span>Supabase & SQL</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 p-5 sm:p-6 overflow-y-auto bg-[#0d0d0f]">
              {/* 1. DASHBOARD TAB */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-white/10 bg-neutral-950 p-4">
                      <div className="text-xs text-neutral-400 uppercase tracking-wider">Total Orders</div>
                      <div className="text-2xl sm:text-3xl font-black text-white mt-1">{totalOrdersCount}</div>
                      <div className="text-[10px] text-neutral-500 mt-1">Across all categories</div>
                    </div>

                    <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
                      <div className="text-xs text-amber-400 uppercase tracking-wider">Pending Verification</div>
                      <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-1">
                        {pendingOrders.length}
                      </div>
                      <div className="text-[10px] text-amber-400/80 mt-1">Awaiting eSewa check</div>
                    </div>

                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
                      <div className="text-xs text-emerald-400 uppercase tracking-wider">Completed / Issued</div>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                        {completedOrders.length}
                      </div>
                      <div className="text-[10px] text-emerald-400/80 mt-1">Cards & vouchers delivered</div>
                    </div>

                    <div className="rounded-xl border border-[#D4AF37]/40 bg-neutral-950 p-4">
                      <div className="text-xs text-[#D4AF37] uppercase tracking-wider">Total Revenue</div>
                      <div className="text-2xl sm:text-3xl font-black text-[#F3E5AB] mt-1">
                        {formatNPR(totalRevenueNPR)}
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-1">USD @ {settings.exchange_rate} NPR</div>
                    </div>
                  </div>

                  {/* Recent Orders Quick Table */}
                  <div className="rounded-xl border border-white/10 bg-neutral-950 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-white tracking-wide">Recent Orders Awaiting Action</h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab('orders')}
                        className="text-xs text-[#D4AF37] hover:underline"
                      >
                        View all orders →
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-white/10 text-neutral-400 uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">Order ID</th>
                            <th className="py-2.5 px-3">Customer</th>
                            <th className="py-2.5 px-3">Product</th>
                            <th className="py-2.5 px-3">Total NPR</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {orders.slice(0, 5).map((ord) => (
                            <tr key={ord.id} className="hover:bg-white/[0.02]">
                              <td className="py-3 px-3 font-mono font-bold text-[#F3E5AB]">{ord.order_id}</td>
                              <td className="py-3 px-3">
                                <div className="font-semibold text-white">{ord.customer_name}</div>
                                <div className="text-[10px] text-neutral-400">{ord.customer_phone}</div>
                              </td>
                              <td className="py-3 px-3 text-neutral-300">{ord.product_name}</td>
                              <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                                {formatNPR(ord.total_npr)}
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                                    ord.status === 'Completed'
                                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                                      : ord.status === 'Paid'
                                      ? 'bg-blue-950 text-blue-300 border-blue-500/40'
                                      : 'bg-amber-950 text-amber-300 border-amber-500/40'
                                  }`}
                                >
                                  {ord.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedOrder(ord);
                                    setActiveTab('orders');
                                  }}
                                  className="rounded bg-neutral-800 hover:bg-neutral-700 px-2.5 py-1 text-[11px] text-white"
                                >
                                  Review
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. ORDERS MANAGEMENT TAB */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  {/* Filters Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl bg-neutral-950 p-4 border border-white/10">
                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                      <input
                        type="text"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder="Search customer, ID, phone..."
                        className="w-full rounded-lg bg-neutral-900 border border-white/15 pl-9 pr-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                      {['ALL', 'Pending Verification', 'Paid', 'Completed', 'Cancelled'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setOrderStatusFilter(st)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-all ${
                            orderStatusFilter === st
                              ? 'bg-[#D4AF37] text-black font-bold'
                              : 'bg-neutral-900 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Orders Table */}
                  <div className="rounded-xl border border-white/10 bg-neutral-950 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-white/10 text-neutral-400 uppercase tracking-wider text-[10px] bg-black/40">
                          <tr>
                            <th className="py-3 px-4">Order ID</th>
                            <th className="py-3 px-4">Customer</th>
                            <th className="py-3 px-4">Product</th>
                            <th className="py-3 px-4">USD / NPR</th>
                            <th className="py-3 px-4">Receipt</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredOrders.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-neutral-500">
                                No orders matching the criteria.
                              </td>
                            </tr>
                          ) : (
                            filteredOrders.map((ord) => (
                              <tr key={ord.id} className="hover:bg-white/[0.02]">
                                <td className="py-3.5 px-4 font-mono font-bold text-[#F3E5AB]">
                                  {ord.order_id}
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="font-semibold text-white">{ord.customer_name}</div>
                                  <div className="text-[10px] text-neutral-400">{ord.customer_email}</div>
                                  <div className="text-[10px] text-emerald-400 font-mono">{ord.customer_phone}</div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="text-neutral-200">{ord.product_name}</div>
                                  {ord.card_name && (
                                    <div className="text-[10px] text-amber-300/80 font-mono">
                                      Card: {ord.card_name}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 font-mono">
                                  <div className="text-neutral-300">${ord.amount_usd} USD</div>
                                  <div className="text-emerald-400 font-bold">{formatNPR(ord.total_npr)}</div>
                                  {ord.discount_percent && ord.discount_percent > 0 ? (
                                    <span className="inline-block text-[9px] text-emerald-300 bg-emerald-950/70 border border-emerald-500/30 px-1.5 py-0.5 rounded font-sans font-bold mt-0.5">
                                      -{ord.discount_percent}% Discount
                                    </span>
                                  ) : null}
                                </td>
                                <td className="py-3.5 px-4">
                                  {ord.payment_screenshot_url ? (
                                    <button
                                      type="button"
                                      onClick={() => setEnlargedImage(ord.payment_screenshot_url)}
                                      className="group relative h-10 w-10 rounded border border-white/20 overflow-hidden block"
                                    >
                                      <img
                                        src={ord.payment_screenshot_url}
                                        alt="eSewa Receipt"
                                        className="h-full w-full object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Eye className="h-3.5 w-3.5 text-white" />
                                      </div>
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-neutral-500">None</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span
                                    className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                                      ord.status === 'Completed'
                                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                                        : ord.status === 'Paid'
                                        ? 'bg-blue-950 text-blue-300 border-blue-500/40'
                                        : ord.status === 'Cancelled'
                                        ? 'bg-red-950 text-red-300 border-red-500/40'
                                        : 'bg-amber-950 text-amber-300 border-amber-500/40'
                                    }`}
                                  >
                                    {ord.status}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-neutral-400 text-[10px]">
                                  {new Date(ord.created_at).toLocaleDateString()}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedOrder(ord);
                                      setIssuedCardNumber(ord.card_details?.cardNumber || '');
                                      setIssuedExpiry(ord.card_details?.expiry || '12/29');
                                      setIssuedCvv(ord.card_details?.cvv || '');
                                      setIssuedVoucherCode(ord.card_details?.voucherCode || '');
                                      setIssuedInstructions(ord.card_details?.instructions || '');
                                    }}
                                    className="rounded-lg bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 text-xs text-white font-medium"
                                  >
                                    Inspect / Dispatch
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'transactions' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"><div><h3 className="text-lg font-black text-white">Reload & Payment Transactions</h3><p className="text-xs text-neutral-500">Crypto TXIDs, explorer links, eSewa receipts and card balance reloads.</p></div><button onClick={()=>apiFetchReloadTransactions().then(setReloadTransactions)} className="rounded-xl bg-neutral-800 px-3 py-2 text-xs text-white">Refresh</button></div>
                  <div className="rounded-2xl border border-white/10 overflow-x-auto bg-neutral-950"><table className="w-full min-w-[850px] text-left text-xs"><thead className="bg-black/50 text-neutral-500"><tr><th className="p-3">Reload ID</th><th>Customer</th><th>Amount</th><th>Method / TXID</th><th>Status</th><th>Action</th></tr></thead><tbody>{reloadTransactions.length===0?<tr><td colSpan={6} className="p-8 text-center text-neutral-500">No reload transactions yet.</td></tr>:reloadTransactions.map((r:any)=><tr key={r.id} className="border-t border-white/5"><td className="p-3 font-mono text-[#F3E5AB]">{r.reload_id}<div className="text-[9px] text-neutral-600">{r.order_id}</div></td><td><div className="text-white">{r.customer_name}</div><div className="text-neutral-500">{r.customer_email}</div></td><td className="font-mono text-emerald-300">${r.amount_usd}<div className="text-neutral-500">Rs. {Number(r.total_npr).toLocaleString()}</div></td><td><div className="uppercase text-neutral-300">{r.payment_method}</div><div className="font-mono text-[10px] text-indigo-300 max-w-[220px] truncate">{r.transaction_id || 'eSewa receipt'}</div>{r.transaction_url&&<a href={r.transaction_url} target="_blank" rel="noreferrer" className="text-[10px] text-sky-400">Open explorer ↗</a>}</td><td><span className="rounded-full border border-white/10 px-2 py-1 text-[10px]">{r.status}</span></td><td><div className="flex gap-2">{r.status==='Pending Verification'&&<><button onClick={async()=>{await apiApproveReload(r.reload_id,'Approved','Payment verified by admin');const x=await apiFetchReloadTransactions();setReloadTransactions(x);onRefreshData();}} className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-bold text-white">Approve</button><button onClick={async()=>{await apiApproveReload(r.reload_id,'Rejected','Payment rejected by admin');setReloadTransactions(await apiFetchReloadTransactions());}} className="rounded-lg bg-red-900 px-2.5 py-1.5 text-[10px] font-bold text-red-200">Reject</button></>}</div></td></tr>)}</tbody></table></div>
                </div>
              )}

              {/* 3. PRODUCTS MANAGEMENT TAB */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl bg-neutral-950 p-4 border border-white/10">
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-wide">Product Catalog & Fee Settings</h3>
                      <p className="text-xs text-neutral-400">Configure issuance fees, funding %, and USD limits</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingProduct(true);
                        setEditingProduct({
                          id: crypto.randomUUID(),
                          name: '',
                          slug: '',
                          category: 'virtual_cards_reloadable',
                          category_label: 'Virtual Cards — Reloadable',
                          description: '',
                          short_description: '',
                          image_url: 'virtual-card',
                          theme_accent: 'gold',
                          base_usd: 10,
                          issuance_fee_usd: 5,
                          funding_fee_percent: 3.5,
                          processing_fee_usd: 1,
                          is_virtual: true,
                          min_amount: 10,
                          max_amount: 20000,
                          denominations: [10, 25, 50, 100],
                          features: ['Instant delivery', 'Works internationally', '3DS Secure'],
                          validity: '5 Years',
                          delivery_time: '5–15 Mins',
                          starting_price_npr: 2500,
                        });
                      }}
                      className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-black"
                      style={{
                        background: 'linear-gradient(135deg, #F5D77F 0%, #D4AF37 100%)',
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add New Product</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((prod) => (
                      <div
                        key={prod.id}
                        className="rounded-xl border border-white/10 bg-neutral-950 p-4 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="rounded bg-neutral-900 border border-white/10 px-2 py-0.5 text-[10px] font-semibold text-neutral-300">
                              {prod.category_label}
                            </span>
                            <span className="font-mono text-xs font-bold text-amber-300">
                              {prod.is_virtual ? 'Reloadable ($10–$20k)' : 'Fixed Denominations'}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-white">{prod.name}</h4>
                          <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{prod.short_description}</p>

                          {/* Fee breakdown pills */}
                          <div className="mt-3 grid grid-cols-3 gap-1 text-[10px] text-neutral-300 bg-neutral-900/60 p-2 rounded-lg border border-white/5">
                            <div>
                              <div className="text-neutral-500">Issuance</div>
                              <div className="font-mono font-semibold">${prod.issuance_fee_usd}</div>
                            </div>
                            <div>
                              <div className="text-neutral-500">Funding %</div>
                              <div className="font-mono font-semibold">{prod.funding_fee_percent}%</div>
                            </div>
                            <div>
                              <div className="text-neutral-500">Processing</div>
                              <div className="font-mono font-semibold">${prod.processing_fee_usd}</div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                          <span className="text-[10px] text-neutral-400">Validity: {prod.validity}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setIsCreatingProduct(false);
                                setEditingProduct({ ...prod });
                              }}
                              className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white"
                              title="Edit Product"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="p-1.5 rounded bg-neutral-800 hover:bg-red-900/60 text-neutral-300 hover:text-red-400"
                              title="Delete Product"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. SETTINGS TAB */}
              {activeTab === 'settings' && (
                <div className="max-w-2xl mx-auto rounded-xl border border-white/10 bg-neutral-950 p-6">
                  <h3 className="text-base font-bold text-white tracking-wide mb-1">
                    Exchange Rates, Fees & eSewa Configuration
                  </h3>
                  <p className="text-xs text-neutral-400 mb-6">
                    Adjust real-time USD/NPR conversion and eSewa merchant payment details.
                  </p>

                  <form onSubmit={handleSaveSettings} className="space-y-4">
                    {settingsSaved && (
                      <div className="rounded-lg bg-emerald-950/50 border border-emerald-500/40 p-3 text-xs text-emerald-300 flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        <span>Settings saved successfully! All store prices recalculated.</span>
                      </div>
                    )}

                    {/* Loyal Customer 6-7% Forex Automation Box */}
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Loyal Customer Live Rate Engine (6%–7% Fair Markup)
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded font-mono font-semibold">
                          Live Forex Sync
                        </span>
                      </div>

                      <p className="text-[11px] text-neutral-300 leading-relaxed">
                        To maintain a loyal repeat customer base, we charge only <strong>6% to 7% above the live forex rate</strong> with zero hidden broker fees. Traditional banks and black market agents charge 12%–18% more.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                        <div className="rounded-lg bg-black/60 border border-white/10 p-2.5">
                          <span className="text-[10px] text-neutral-400 block font-sans">Live Bank Rate</span>
                          <span className="text-sm font-bold text-white">
                            Rs. {settingsForm.live_forex_rate || 153.68} NPR
                          </span>
                        </div>
                        <div className="rounded-lg bg-black/60 border border-white/10 p-2.5">
                          <span className="text-[10px] text-neutral-400 block font-sans">Loyal Markup (%)</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <input
                              type="number"
                              min={5}
                              max={10}
                              step={0.1}
                              value={settingsForm.markup_percent !== undefined ? settingsForm.markup_percent : 6.5}
                              onChange={(e) => {
                                const newMarkup = Number(e.target.value);
                                const live = settingsForm.live_forex_rate || 153.68;
                                const calculated = Number((live * (1 + newMarkup / 100)).toFixed(2));
                                setSettingsForm({
                                  ...settingsForm,
                                  markup_percent: newMarkup,
                                  exchange_rate: calculated,
                                });
                              }}
                              className="w-16 rounded bg-neutral-900 border border-white/20 px-2 py-0.5 text-xs text-emerald-300 font-bold focus:outline-none focus:border-emerald-400"
                            />
                            <span className="text-xs text-neutral-400 font-sans">% (6-7%)</span>
                          </div>
                        </div>
                        <div className="rounded-lg bg-black/60 border border-white/10 p-2.5">
                          <span className="text-[10px] text-neutral-400 block font-sans">Active Store Rate</span>
                          <span className="text-sm font-bold text-emerald-400">
                            Rs. {settingsForm.exchange_rate} NPR
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <span className="text-[10px] text-neutral-400">
                          Last Synced: {settingsForm.rate_last_synced ? new Date(settingsForm.rate_last_synced).toLocaleTimeString() : 'Auto on boot'}
                        </span>
                        <button
                          type="button"
                          onClick={handleSyncLiveRate}
                          disabled={isSyncingRate}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${isSyncingRate ? 'animate-spin' : ''}`} />
                          {isSyncingRate ? 'Fetching Live Forex...' : '🔄 Sync with Live Bank Rate'}
                        </button>
                      </div>

                      {syncRateMessage && (
                        <div className="rounded-lg bg-emerald-950/80 border border-emerald-500/50 p-2 text-[11px] text-emerald-300">
                          {syncRateMessage}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1">
                          USD to NPR Exchange Rate
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs text-neutral-500 font-mono">Rs.</span>
                          <input
                            type="number"
                            step="0.1"
                            required
                            value={settingsForm.exchange_rate}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, exchange_rate: Number(e.target.value) })
                            }
                            className="w-full rounded-lg bg-neutral-900 border border-white/15 pl-9 pr-3 py-2 text-xs sm:text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                          />
                        </div>
                        <span className="text-[10px] text-neutral-500 mt-1 block">Default: 173.00 NPR per USD</span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1">
                          Global Platform Commission (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            required
                            value={settingsForm.commission_percent}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, commission_percent: Number(e.target.value) })
                            }
                            className="w-full rounded-lg bg-neutral-900 border border-white/15 px-3 py-2 text-xs sm:text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-neutral-500 font-mono">%</span>
                        </div>
                        <span className="text-[10px] text-neutral-500 mt-1 block">Default: 4.00%</span>
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1">
                          eSewa Merchant Phone / ID
                        </label>
                        <input
                          type="text"
                          required
                          value={settingsForm.esewa_id}
                          onChange={(e) => setSettingsForm({ ...settingsForm, esewa_id: e.target.value })}
                          className="w-full rounded-lg bg-neutral-900 border border-white/15 px-3 py-2 text-xs sm:text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1">
                          eSewa Account Holder Name
                        </label>
                        <input
                          type="text"
                          required
                          value={settingsForm.esewa_account_name}
                          onChange={(e) => setSettingsForm({ ...settingsForm, esewa_account_name: e.target.value })}
                          className="w-full rounded-lg bg-neutral-900 border border-white/15 px-3 py-2 text-xs sm:text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1">
                          Contact WhatsApp
                        </label>
                        <input
                          type="text"
                          value={settingsForm.contact_whatsapp}
                          onChange={(e) => setSettingsForm({ ...settingsForm, contact_whatsapp: e.target.value })}
                          className="w-full rounded-lg bg-neutral-900 border border-white/15 px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1">Contact Email</label>
                        <input
                          type="email"
                          value={settingsForm.contact_email}
                          onChange={(e) => setSettingsForm({ ...settingsForm, contact_email: e.target.value })}
                          className="w-full rounded-lg bg-neutral-900 border border-white/15 px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1">
                          Contact Telegram
                        </label>
                        <input
                          type="text"
                          value={settingsForm.contact_telegram}
                          onChange={(e) => setSettingsForm({ ...settingsForm, contact_telegram: e.target.value })}
                          className="w-full rounded-lg bg-neutral-900 border border-white/15 px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Social Media Links */}
                    <div className="border-t border-white/10 pt-4">
                      <div className="text-xs font-bold text-neutral-200 uppercase tracking-wider mb-3">
                        Social Media &amp; Community Channels
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-neutral-300 mb-1">Facebook Page URL</label>
                          <input
                            type="url"
                            placeholder="https://facebook.com/..."
                            value={settingsForm.social_facebook || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, social_facebook: e.target.value })}
                            className="w-full rounded-lg bg-neutral-900 border border-white/15 px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-300 mb-1">Instagram URL</label>
                          <input
                            type="url"
                            placeholder="https://instagram.com/..."
                            value={settingsForm.social_instagram || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, social_instagram: e.target.value })}
                            className="w-full rounded-lg bg-neutral-900 border border-white/15 px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-300 mb-1">TikTok URL</label>
                          <input
                            type="url"
                            placeholder="https://tiktok.com/@..."
                            value={settingsForm.social_tiktok || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, social_tiktok: e.target.value })}
                            className="w-full rounded-lg bg-neutral-900 border border-white/15 px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-300 mb-1">YouTube URL</label>
                          <input
                            type="url"
                            placeholder="https://youtube.com/@..."
                            value={settingsForm.social_youtube || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, social_youtube: e.target.value })}
                            className="w-full rounded-lg bg-neutral-900 border border-white/15 px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-4">
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Store Announcement Notice Banner
                      </label>
                      <input
                        type="text"
                        value={settingsForm.store_notice}
                        onChange={(e) => setSettingsForm({ ...settingsForm, store_notice: e.target.value })}
                        className="w-full rounded-lg bg-neutral-900 border border-white/15 px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div><h4 className="text-sm font-bold text-white">Payment Methods</h4><p className="text-[10px] text-neutral-500">Enable, edit, or remove customer payment methods.</p></div>
                        <button type="button" onClick={() => setSettingsForm({ ...settingsForm, payment_methods: [...(settingsForm.payment_methods || []), { id: crypto.randomUUID(), name: 'New Method', type: 'other', enabled: true, instructions: '' }] })} className="rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white">+ Add</button>
                      </div>
                      {(settingsForm.payment_methods || []).map((method, index) => (
                        <div key={method.id} className="grid grid-cols-1 sm:grid-cols-6 gap-2 rounded-lg border border-white/5 bg-neutral-900/60 p-3">
                          <input value={method.name} onChange={(e) => { const a=[...(settingsForm.payment_methods||[])]; a[index]={...a[index],name:e.target.value}; setSettingsForm({...settingsForm,payment_methods:a}); }} className="sm:col-span-2 rounded bg-neutral-950 border border-white/10 px-2 py-1.5 text-white text-xs" placeholder="Method name" />
                          <select value={method.type} onChange={(e) => { const a=[...(settingsForm.payment_methods||[])]; a[index]={...a[index],type:e.target.value as any}; setSettingsForm({...settingsForm,payment_methods:a}); }} className="rounded bg-neutral-950 border border-white/10 px-2 py-1.5 text-white text-xs"><option value="esewa">eSewa</option><option value="crypto">Crypto</option><option value="bank">Bank</option><option value="other">Other</option></select>
                          <input value={method.wallet_address || ''} onChange={(e) => { const a=[...(settingsForm.payment_methods||[])]; a[index]={...a[index],wallet_address:e.target.value}; setSettingsForm({...settingsForm,payment_methods:a}); }} className="sm:col-span-2 rounded bg-neutral-950 border border-white/10 px-2 py-1.5 text-white text-xs" placeholder="Wallet / account / QR URL" />
                          <label className="rounded bg-neutral-950 border border-white/10 px-2 py-1.5 text-[10px] text-neutral-400 cursor-pointer">Upload QR<input type="file" accept="image/*" className="hidden" onChange={async(e)=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=async()=>{try{const url=await apiUploadImage(String(r.result),'payment-methods');const a=[...(settingsForm.payment_methods||[])];a[index]={...a[index],qr_url:url};setSettingsForm({...settingsForm,payment_methods:a});}catch(err:any){alert(err.message)}};r.readAsDataURL(f)}}/></label>
                          <div className="flex items-center gap-2"><label className="flex items-center gap-1 text-[10px] text-neutral-300"><input type="checkbox" checked={method.enabled} onChange={(e) => { const a=[...(settingsForm.payment_methods||[])]; a[index]={...a[index],enabled:e.target.checked}; setSettingsForm({...settingsForm,payment_methods:a}); }} /> Enabled</label><button type="button" onClick={() => { const a=[...(settingsForm.payment_methods||[])]; a.splice(index,1); setSettingsForm({...settingsForm,payment_methods:a}); }} className="text-red-400 text-[10px]">Remove</button></div>
                          <textarea value={method.instructions || ''} onChange={(e) => { const a=[...(settingsForm.payment_methods||[])]; a[index]={...a[index],instructions:e.target.value}; setSettingsForm({...settingsForm,payment_methods:a}); }} className="sm:col-span-5 rounded bg-neutral-950 border border-white/10 px-2 py-1.5 text-white text-xs" placeholder="Customer payment instructions" rows={2} />
                        </div>
                      ))}
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-xl py-3 font-bold text-black text-xs sm:text-sm uppercase tracking-wider transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #F5D77F 0%, #D4AF37 100%)',
                      }}
                    >
                      Save Configuration
                    </button>
                  </form>
                </div>
              )}

              {/* 5. SUPABASE SQL SCHEMA TAB */}
              {activeTab === 'supabase_sql' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-white/10 bg-neutral-950 p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-white tracking-wide">
                          Production Supabase PostgreSQL Schema & Free Hosting Setup
                        </h3>
                        <p className="text-xs text-neutral-400">
                          Copy and paste this script directly into your Supabase SQL Editor.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(supabaseSchemaSQL);
                          setCopiedSQL(true);
                          setTimeout(() => setCopiedSQL(false), 2000);
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-3.5 py-1.5 text-xs font-bold text-black"
                      >
                        {copiedSQL ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        <span>{copiedSQL ? 'Copied SQL!' : 'Copy SQL Script'}</span>
                      </button>
                    </div>

                    {/* SQL code view */}
                    <div className="mt-3 relative rounded-xl border border-white/10 bg-black p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-96">
                      <pre>{supabaseSchemaSQL}</pre>
                    </div>
                  </div>

                  {/* Deployment Guide */}
                  <div className="rounded-xl border border-white/10 bg-neutral-950 p-5 space-y-3 text-xs text-neutral-300">
                    <h4 className="font-bold text-white text-sm">Free Hosting Setup Instructions (Vercel + Supabase)</h4>
                    <ol className="list-decimal list-inside space-y-1.5 text-neutral-300">
                      <li>Create a free account at <strong>supabase.com</strong> and create a new project.</li>
                      <li>Go to the <strong>SQL Editor</strong> tab in Supabase and paste the SQL script above. Click <strong>Run</strong>.</li>
                      <li>In Supabase Storage, confirm the <code>payment-screenshots</code> bucket is set to <strong>Public</strong>.</li>
                      <li>Copy your Supabase Project URL and Anon Key from <strong>Settings &gt; API</strong>.</li>
                      <li>Deploy this project to <strong>Vercel</strong> and configure your environment variables.</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Order Detail Inspection Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="relative w-full max-w-3xl rounded-2xl border border-[#D4AF37]/50 bg-[#121214] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-black text-[#F3E5AB]">
                    {selectedOrder.order_id}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      selectedOrder.status === 'Completed'
                        ? 'bg-emerald-950 text-emerald-300'
                        : selectedOrder.status === 'Paid'
                        ? 'bg-blue-950 text-blue-300'
                        : 'bg-amber-950 text-amber-300'
                    }`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-full p-1.5 text-neutral-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Customer & Payment Details */}
                <div className="space-y-3 text-xs">
                  <div className="rounded-xl bg-black/60 p-3.5 border border-white/5 space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-neutral-400">Customer Info</div>
                    <div className="font-bold text-white text-sm">{selectedOrder.customer_name}</div>
                    <div className="text-neutral-300">{selectedOrder.customer_email}</div>
                    <div className="text-emerald-400 font-mono">{selectedOrder.customer_phone}</div>
                    {selectedOrder.card_name && (
                      <div className="pt-1 text-amber-300">
                        Cardholder Name: <strong>{selectedOrder.card_name}</strong>
                      </div>
                    )}
                    {selectedOrder.billing_address && (
                      <div className="text-neutral-400">Billing: {selectedOrder.billing_address}</div>
                    )}
                    {selectedOrder.notes && (
                      <div className="pt-1 text-neutral-300 bg-neutral-900/80 p-2 rounded">
                        Notes: {selectedOrder.notes}
                      </div>
                    )}
                  </div>

                  {/* Payment Amount */}
                  <div className="rounded-xl bg-black/60 p-3.5 border border-white/5 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-neutral-400">Pricing Verification</div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Product:</span>
                      <span className="text-white font-medium">{selectedOrder.product_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">USD Amount:</span>
                      <span className="font-mono text-amber-300">${selectedOrder.amount_usd}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm pt-1 border-t border-white/5">
                      <span className="text-white">Amount Paid (eSewa):</span>
                      <span className="font-mono text-emerald-400">{formatNPR(selectedOrder.total_npr)}</span>
                    </div>
                  </div>

                  {/* Status Change Buttons */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1.5">
                      Change Order Status
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'Paid')}
                        className="rounded-lg bg-blue-900/60 hover:bg-blue-800 p-2 text-center text-xs font-semibold text-blue-200 border border-blue-500/30"
                      >
                        Mark as Paid (Verified)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'Completed')}
                        className="rounded-lg bg-emerald-900/60 hover:bg-emerald-800 p-2 text-center text-xs font-semibold text-emerald-200 border border-emerald-500/30"
                      >
                        Mark as Completed
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'Pending Verification')}
                        className="rounded-lg bg-amber-900/60 hover:bg-amber-800 p-2 text-center text-xs font-semibold text-amber-200 border border-amber-500/30"
                      >
                        Mark as Pending
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'Cancelled')}
                        className="rounded-lg bg-red-900/60 hover:bg-red-800 p-2 text-center text-xs font-semibold text-red-200 border border-red-500/30"
                      >
                        Mark as Cancelled
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Payment Screenshot & Dispatch Card Details */}
                <div className="space-y-4">
                  {/* eSewa Screenshot thumbnail */}
                  <div>
                    <div className="text-[10px] uppercase font-bold text-neutral-400 mb-1.5">
                      eSewa Payment Screenshot (Click to Enlarge)
                    </div>
                    {selectedOrder.payment_screenshot_url ? (
                      <div
                        onClick={() => setEnlargedImage(selectedOrder.payment_screenshot_url)}
                        className="cursor-pointer group relative rounded-xl border border-white/20 overflow-hidden bg-black max-h-48"
                      >
                        <img
                          src={selectedOrder.payment_screenshot_url}
                          alt="eSewa Receipt"
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="rounded bg-black/80 px-2 py-1 text-xs text-white flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" /> Click to Zoom
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-neutral-900 p-6 text-center text-xs text-neutral-500">
                        No screenshot attached
                      </div>
                    )}
                  </div>

                  {/* Dispatch Card Details Form */}
                  <form onSubmit={handleDispatchCard} className="rounded-xl border border-white/10 bg-neutral-950 p-3.5 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white flex items-center gap-1.5 text-xs">
                        <CreditCard className="h-4 w-4 text-[#D4AF37]" />
                        <span>Issue Card / Voucher Credentials</span>
                      </div>
                      {(selectedOrder.product_category === 'virtual_cards_reloadable' || selectedOrder.product_category === 'virtual_cards_preloaded') && (
                        <button
                          type="button"
                          onClick={() => {
                            const seg1 = '4' + Math.floor(100 + Math.random() * 900);
                            const seg2 = Math.floor(1000 + Math.random() * 9000);
                            const seg3 = Math.floor(1000 + Math.random() * 9000);
                            const seg4 = Math.floor(1000 + Math.random() * 9000);
                            setIssuedCardNumber(`${seg1} ${seg2} ${seg3} ${seg4}`);
                            setIssuedExpiry('12/29');
                            setIssuedCvv(String(Math.floor(100 + Math.random() * 900)));
                            setIssuedInstructions('Activate in your Apple / Google Wallet or input into merchant checkout.');
                          }}
                          className="text-[10px] text-[#D4AF37] hover:underline font-semibold"
                        >
                          ⚡ Auto-Generate
                        </button>
                      )}
                    </div>

                    {selectedOrder.product_category === 'virtual_cards_reloadable' || selectedOrder.product_category === 'virtual_cards_preloaded' ? (
                      <>
                        <div>
                          <label className="block text-[10px] text-neutral-400">Card Number (16 Digits)</label>
                          <input
                            type="text"
                            value={issuedCardNumber}
                            onChange={(e) => setIssuedCardNumber(e.target.value)}
                            placeholder="4578 2461 7835 9021"
                            className="w-full rounded bg-neutral-900 border border-white/15 px-2.5 py-1.5 text-xs font-mono text-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-neutral-400">Valid Thru</label>
                            <input
                              type="text"
                              value={issuedExpiry}
                              onChange={(e) => setIssuedExpiry(e.target.value)}
                              placeholder="12/29"
                              className="w-full rounded bg-neutral-900 border border-white/15 px-2.5 py-1.5 text-xs font-mono text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-neutral-400">CVV</label>
                            <input
                              type="text"
                              value={issuedCvv}
                              onChange={(e) => setIssuedCvv(e.target.value)}
                              placeholder="372"
                              className="w-full rounded bg-neutral-900 border border-white/15 px-2.5 py-1.5 text-xs font-mono text-white"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div>
                        <label className="block text-[10px] text-neutral-400">Voucher / PIN Code</label>
                        <input
                          type="text"
                          value={issuedVoucherCode}
                          onChange={(e) => setIssuedVoucherCode(e.target.value)}
                          placeholder="e.g. RG-8894-3982-NEP"
                          className="w-full rounded bg-neutral-900 border border-white/15 px-2.5 py-1.5 text-xs font-mono text-amber-300"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] text-neutral-400">Instructions / Notes to Customer</label>
                      <input
                        type="text"
                        value={issuedInstructions}
                        onChange={(e) => setIssuedInstructions(e.target.value)}
                        placeholder="Link with Apple Pay or redeem in game store."
                        className="w-full rounded bg-neutral-900 border border-white/15 px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2 text-xs font-bold text-white transition-colors"
                    >
                      Save & Complete Order Delivery
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Zoom Lightbox for Screenshot */}
        {enlargedImage && (
          <div
            onClick={() => setEnlargedImage(null)}
            className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/95 cursor-zoom-out"
          >
            <div className="relative max-w-4xl max-h-[90vh]">
              <img
                src={enlargedImage}
                alt="eSewa Receipt Zoomed"
                className="max-h-[85vh] w-auto rounded-xl border border-white/20 object-contain shadow-2xl"
              />
              <button
                type="button"
                onClick={() => setEnlargedImage(null)}
                className="absolute top-2 right-2 rounded-full bg-black/80 p-2 text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Product Editor Modal (CRUD) */}
        {editingProduct && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="relative w-full max-w-2xl rounded-2xl border border-white/20 bg-[#141416] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white">
                  {isCreatingProduct ? 'Create New Product' : `Edit: ${editingProduct.name}`}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="rounded-full p-1.5 text-neutral-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="mt-4 space-y-3.5 text-xs">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full rounded bg-neutral-900 border border-white/15 px-3 py-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-300 font-semibold mb-1">Category</label>
                    <select
                      value={editingProduct.category}
                      onChange={(e) => {
                        const cat = e.target.value as ProductCategory;
                        const labels: Record<ProductCategory, string> = {
                          virtual_cards_preloaded: 'Virtual Cards — Preloaded',
                          virtual_cards_reloadable: 'Virtual Cards — Reloadable',
                          gift_cards: 'Gift Cards — General',
                          gift_cards_apple: 'Gift Cards — iTunes / Apple',
                          game_topups: 'Game Top-ups',
                        };
                        setEditingProduct({
                          ...editingProduct,
                          category: cat,
                          category_label: labels[cat],
                        });
                      }}
                      className="w-full rounded bg-neutral-900 border border-white/15 px-3 py-2 text-white"
                    >
                      <option value="virtual_cards_preloaded">Virtual Cards — Preloaded</option>
                      <option value="virtual_cards_reloadable">Virtual Cards — Reloadable</option>
                      <option value="gift_cards">Gift Cards — General</option>
                      <option value="gift_cards_apple">Gift Cards — iTunes / Apple</option>
                      <option value="game_topups">Game Top-ups</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-300 font-semibold mb-1">Is Virtual (Reloadable $10–$20k)?</label>
                    <select
                      value={editingProduct.is_virtual ? 'true' : 'false'}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, is_virtual: e.target.value === 'true' })
                      }
                      className="w-full rounded bg-neutral-900 border border-white/15 px-3 py-2 text-white"
                    >
                      <option value="true">Yes (Reloadable Virtual Card)</option>
                      <option value="false">No (Fixed Denominations)</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                  <label className="block text-neutral-300 font-semibold mb-1">Service Thumbnail</label>
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    {editingProduct.image_url && /^https?:/.test(editingProduct.image_url) && <img src={editingProduct.image_url} className="h-20 w-20 rounded-xl object-cover border border-white/10" />}
                    <input type="file" accept="image/*" className="text-xs text-neutral-400" onChange={async (e) => { const file=e.target.files?.[0]; if(!file)return; const reader=new FileReader(); reader.onload=async()=>{ try { const url=await apiUploadImage(String(reader.result),'products'); setEditingProduct({...editingProduct,image_url:url}); } catch(err:any){ alert(err.message); } }; reader.readAsDataURL(file); }} />
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-1">Upload a storefront image; it is stored in Supabase Storage and immediately used by the product.</p>
                </div>

                {/* Fees Configuration */}
                <div className="grid grid-cols-3 gap-3 bg-black/40 p-3 rounded-lg border border-white/5">
                  <div>
                    <label className="block text-neutral-400 text-[10px]">Issuance Fee (USD)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingProduct.issuance_fee_usd}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, issuance_fee_usd: Number(e.target.value) })
                      }
                      className="w-full rounded bg-neutral-900 border border-white/15 px-2.5 py-1.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 text-[10px]">Funding Fee (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingProduct.funding_fee_percent}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, funding_fee_percent: Number(e.target.value) })
                      }
                      className="w-full rounded bg-neutral-900 border border-white/15 px-2.5 py-1.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 text-[10px]">Processing Fee (USD)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingProduct.processing_fee_usd}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, processing_fee_usd: Number(e.target.value) })
                      }
                      className="w-full rounded bg-neutral-900 border border-white/15 px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 rounded bg-neutral-900 border border-white/10 px-3 py-2 text-neutral-300">
                    <input type="checkbox" checked={editingProduct.active !== false} onChange={(e) => setEditingProduct({ ...editingProduct, active: e.target.checked })} /> Active on storefront
                  </label>
                  <div><label className="block text-neutral-400 text-[10px]">Display Order</label><input type="number" value={editingProduct.display_order ?? 0} onChange={(e) => setEditingProduct({ ...editingProduct, display_order: Number(e.target.value) })} className="w-full rounded bg-neutral-900 border border-white/15 px-2.5 py-1.5 text-white" /></div>
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full rounded bg-neutral-900 border border-white/15 p-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">
                    Fixed Denominations (Comma-separated USD numbers)
                  </label>
                  <input
                    type="text"
                    value={editingProduct.denominations.join(', ')}
                    onChange={(e) => {
                      const nums = e.target.value
                        .split(',')
                        .map((n) => Number(n.trim()))
                        .filter((n) => !isNaN(n) && n > 0);
                      setEditingProduct({ ...editingProduct, denominations: nums });
                    }}
                    placeholder="e.g. 5, 10, 25, 50, 100"
                    className="w-full rounded bg-neutral-900 border border-white/15 px-3 py-2 text-white font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="rounded px-4 py-2 text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-[#D4AF37] px-5 py-2 font-bold text-black"
                  >
                    Save Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
