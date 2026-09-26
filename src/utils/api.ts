import { Order, Product, AppSettings, ReloadTransaction } from '../types';
import {
  getStoredOrders,
  saveOrders,
  getStoredProducts,
  saveProducts,
  getStoredSettings,
  saveSettings,
} from './storage';

/**
 * Backend API Client for Virtual Card Nepal
 * 
 * Interacts with the real full-stack Express server endpoints.
 * Automatically synchronizes with local state cache so the UI updates
 * instantly across multiple browser windows or offline test scenarios.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('vcn_admin_session');
}

export async function apiAdminLogin(password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) throw new Error(data.error || 'Invalid admin credentials.');
  sessionStorage.setItem('vcn_admin_session', data.token);
}

export function apiAdminLogout() { if (typeof window !== 'undefined') sessionStorage.removeItem('vcn_admin_session'); }
export function hasAdminSession(): boolean { return Boolean(getAdminToken()); }

async function apiRequest(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
  const token = getAdminToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}

// Helper to check if server API is reachable
export async function checkBackendHealth(): Promise<{ status: string; service?: string }> {
  try {
    const res = await apiRequest(`/health`);
    if (res.ok) {
      return await res.json();
    }
    return { status: 'degraded' };
  } catch {
    return { status: 'offline' };
  }
}

// 1. SETTINGS API
export async function apiFetchSettings(): Promise<AppSettings> {
  try {
    const res = await apiRequest('/settings');
    if (res.ok) {
      const settings = await res.json();
      saveSettings(settings);
      return settings;
    }
  } catch (err) {
    console.warn('[API] Failed to fetch settings from backend, using cached state', err);
  }
  return getStoredSettings();
}

export async function apiUpdateSettings(settings: AppSettings): Promise<AppSettings> {
  // Optimistically save to local cache
  saveSettings(settings);

  try {
    const res = await apiRequest(`/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      const updated = await res.json();
      saveSettings(updated);
      return updated;
    }
  } catch (err) {
    console.warn('[API] Backend sync failed for settings', err);
  }
  throw new Error('Backend unavailable. Settings were not saved.');
}

export async function apiSyncLiveExchangeRate(markupPercent: number = 6.5): Promise<AppSettings | null> {
  try {
    const res = await apiRequest(`/exchange-rate/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markup_percent: markupPercent }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.settings) {
        saveSettings(data.settings);
        return data.settings;
      }
    }
  } catch (err) {
    console.warn('[API] Failed to trigger server forex sync', err);
  }
  return null;
}

export async function apiGetLiveExchangeRate(): Promise<{
  live_forex_rate: number;
  markup_percent: number;
  store_exchange_rate: number;
  rate_last_synced: string;
} | null> {
  try {
    const res = await apiRequest('/exchange-rate/live');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[API] Failed to fetch live rate info', err);
  }
  return null;
}

// 2. PRODUCTS API
export async function apiFetchProducts(): Promise<Product[]> {
  try {
    const res = await apiRequest('/products');
    if (res.ok) {
      const products = await res.json();
      if (Array.isArray(products) && products.length > 0) {
        saveProducts(products);
        return products;
      }
    }
  } catch (err) {
    console.warn('[API] Failed to fetch products from backend, using cached state', err);
  }
  return getStoredProducts();
}

export async function apiSaveProducts(products: Product[]): Promise<void> {
  saveProducts(products);
}

export async function apiCreateProduct(product: Product): Promise<Product> {
  const res = await apiRequest('/products', { method: 'POST', body: JSON.stringify(product) });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to create product');
  return await res.json();
}

export async function apiUpdateProduct(product: Product): Promise<Product> {
  const res = await apiRequest(`/products/${encodeURIComponent(product.id)}`, { method: 'PUT', body: JSON.stringify(product) });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to update product');
  return await res.json();
}

export async function apiDeleteProduct(productId: string): Promise<void> {
  const res = await apiRequest(`/products/${encodeURIComponent(productId)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete product');
}

// 3. ORDERS API
export async function apiFetchOrders(): Promise<Order[]> {
  if (!hasAdminSession()) return [];
  try {
    const res = await apiRequest('/orders');
    if (res.ok) {
      const orders = await res.json();
      if (Array.isArray(orders)) {
        saveOrders(orders);
        return orders;
      }
    }
  } catch (err) {
    console.warn('[API] Failed to fetch orders from backend, using cached state', err);
  }
  return getStoredOrders();
}

export async function apiFetchOrderById(idOrOrderId: string): Promise<Order | null> {
  try {
    const res = await apiRequest(`/orders/${encodeURIComponent(idOrOrderId)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`[API] Order lookup failed on backend for ${idOrOrderId}`, err);
  }

  // Fallback to local cache
  const cached = getStoredOrders();
  const found = cached.find(
    (o) =>
      o.id === idOrOrderId ||
      o.order_id.toUpperCase() === idOrOrderId.toUpperCase()
  );
  return found || null;
}

export async function apiCreateOrder(
  orderPayload: Omit<Order, 'id' | 'order_id' | 'created_at'>
): Promise<Order> {
  try {
    const res = await apiRequest(`/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });

    if (res.ok) {
      const createdOrder: Order = await res.json();
      // Sync local cache
      const current = getStoredOrders();
      saveOrders([createdOrder, ...current.filter((o) => o.id !== createdOrder.id)]);
      return createdOrder;
    }
  } catch (err) {
    console.warn('[API] Server order creation error, saving locally fallback', err);
  }

  throw new Error('Backend unavailable. Your order was not submitted; please try again.');
}

export async function apiUpdateOrderStatus(
  orderId: string,
  status: Order['status'],
  internal_notes?: string
): Promise<Order | null> {
  try {
    const res = await apiRequest(`/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, internal_notes }),
    });

    if (res.ok) {
      const updated = await res.json();
      const current = getStoredOrders();
      const idx = current.findIndex((o) => o.id === orderId || o.order_id === orderId);
      if (idx !== -1) {
        current[idx] = updated;
        saveOrders(current);
      }
      return updated;
    }
  } catch (err) {
    console.warn('[API] Failed to update order status on server', err);
  }

  // Local fallback
  const current = getStoredOrders();
  const idx = current.findIndex((o) => o.id === orderId || o.order_id === orderId);
  if (idx !== -1) {
    current[idx] = {
      ...current[idx],
      status,
      internal_notes: internal_notes !== undefined ? internal_notes : current[idx].internal_notes,
      updated_at: new Date().toISOString(),
    };
    saveOrders(current);
    return current[idx];
  }
  return null;
}

export async function apiIssueCard(
  orderId: string,
  cardData: {
    cardNumber?: string;
    expiry?: string;
    cvv?: string;
    voucherCode?: string;
    instructions?: string;
  }
): Promise<Order | null> {
  try {
    const res = await apiRequest(`/orders/${encodeURIComponent(orderId)}/issue-card`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cardData),
    });

    if (res.ok) {
      const updated = await res.json();
      const current = getStoredOrders();
      const idx = current.findIndex((o) => o.id === orderId || o.order_id === orderId);
      if (idx !== -1) {
        current[idx] = updated;
        saveOrders(current);
      }
      return updated;
    }
  } catch (err) {
    console.warn('[API] Failed to issue card on server', err);
  }

  // Local fallback
  const current = getStoredOrders();
  const idx = current.findIndex((o) => o.id === orderId || o.order_id === orderId);
  if (idx !== -1) {
    current[idx] = {
      ...current[idx],
      status: 'Completed',
      card_details: {
        ...cardData,
        deliveredAt: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    };
    saveOrders(current);
    return current[idx];
  }
  return null;
}

// 4. ACTIVE CARDS SECURE LOOKUP
export async function apiLookupActiveCards(
  identifier: string,
  securityKey: string,
  verificationType: 'cvv' | 'cardholder'
): Promise<{ success: boolean; orders?: Order[]; error?: string }> {
  try {
    const res = await apiRequest(`/cards/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, securityKey, verificationType }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, orders: data.orders };
    }
    return { success: false, error: data.error || 'Verification failed' };
  } catch {
    // Client-side fallback if server offline
    const cleanId = identifier.trim().toLowerCase();
    const cleanKey = securityKey.trim().toUpperCase();
    const all = getStoredOrders();

    const matched = all.filter(
      (o) =>
        o.order_id.toLowerCase() === cleanId ||
        o.customer_email.toLowerCase() === cleanId
    );

    if (matched.length === 0) {
      return { success: false, error: 'No order found matching that Order ID or Email.' };
    }

    const verified = matched.filter((order) => {
      if (verificationType === 'cvv') {
        const cvv = (order.card_details?.cvv || '').trim().toUpperCase();
        return cvv && cvv === cleanKey;
      } else {
        const name = (order.card_name || order.customer_name || '').trim().toUpperCase();
        return name.includes(cleanKey) || cleanKey.includes(name);
      }
    });

    if (verified.length === 0) {
      return {
        success: false,
        error: `Security verification failed: Incorrect ${
          verificationType === 'cvv' ? 'CVV code' : 'cardholder name'
        } for this account.`,
      };
    }

    return { success: true, orders: verified };
  }
}


export async function apiUploadImage(dataUrl: string, folder = 'products'): Promise<string> {
  const res = await apiRequest('/uploads/image', { method: 'POST', body: JSON.stringify({ data_url: dataUrl, folder }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) throw new Error(data.error || 'Image upload failed');
  return data.url;
}

export async function apiCreateReload(payload: { identifier: string; security_key: string; amount_usd: number; payment_method: 'esewa'|'crypto'; transaction_id?: string; transaction_url?: string; payment_screenshot_url?: string }): Promise<ReloadTransaction> {
  const res = await apiRequest('/reloads', { method: 'POST', body: JSON.stringify(payload) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Reload request failed');
  return data;
}

export async function apiFetchReloadTransactions(): Promise<ReloadTransaction[]> {
  const res = await apiRequest('/reloads');
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to load reload transactions');
  return res.json();
}

export async function apiApproveReload(reloadId: string, status: 'Approved'|'Rejected', internal_notes = ''): Promise<ReloadTransaction> {
  const res = await apiRequest(`/reloads/${encodeURIComponent(reloadId)}/status`, { method: 'PATCH', body: JSON.stringify({ status, internal_notes }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to update reload');
  return data;
}
