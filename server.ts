import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { Order, Product, AppSettings } from './src/types';
import { DEFAULT_SETTINGS, INITIAL_PRODUCTS, INITIAL_ORDERS } from './src/utils/storage';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// Works safely in both bundled CJS and ES modules
const currentDir = typeof __dirname !== 'undefined' 
  ? __dirname 
  : path.resolve();

const PORT = 3000;

// Initialize Firebase Admin lazily
let adminDb: Firestore | null = null;
function getAdminDb() {
  if (!adminDb) {
    initializeApp();
    adminDb = getFirestore();
  }
  return adminDb;
}

// Database wrapper functions interacting with Firestore
async function readDb(): Promise<{ settings: AppSettings; products: Product[]; orders: Order[] }> {
  const db = getAdminDb();
  const [settingsSnap, productsSnap, ordersSnap] = await Promise.all([
    db.collection('settings').doc('config').get(),
    db.collection('products').get(),
    db.collection('orders').get(),
  ]);

  return {
    settings: (settingsSnap.data() as AppSettings) || DEFAULT_SETTINGS,
    products: productsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Product)),
    orders: ordersSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Order)),
  };
}

async function writeDb(data: { settings?: AppSettings; products?: Product[]; orders?: Order[] }): Promise<void> {
  const db = getAdminDb();
  const batch = db.batch();
  
  if (data.settings) {
    batch.set(db.collection('settings').doc('config'), data.settings, { merge: true });
  }
  
  if (data.products) {
    for (const product of data.products) {
        batch.set(db.collection('products').doc(product.id), product, { merge: true });
    }
  }

  if (data.orders) {
    for (const order of data.orders) {
        batch.set(db.collection('orders').doc(order.id), order, { merge: true });
    }
  }

  await batch.commit();
}

// Automatically synchronizes live forex market rate and applies loyal customer markup (6-7%)
async function syncLiveForexRate(customMarkup?: number): Promise<{ liveRate: number; newExchangeRate: number; markupPercent: number }> {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!response.ok) throw new Error(`Forex API status ${response.status}`);
    const data = (await response.json()) as { rates?: { NPR?: number } };
    const liveRate = data.rates?.NPR ? Number(data.rates.NPR.toFixed(2)) : 153.68;
    
    const { settings } = await readDb();
    const markupPercent = customMarkup !== undefined 
      ? customMarkup 
      : (settings.markup_percent !== undefined ? settings.markup_percent : 6.5);
    
    // Only 6-7% more than live rate as requested for loyal customer base
    const newExchangeRate = Number((liveRate * (1 + markupPercent / 100)).toFixed(2));
    
    const updatedSettings = {
      ...settings,
      live_forex_rate: liveRate,
      markup_percent: markupPercent,
      exchange_rate: newExchangeRate,
      commission_percent: 0.0,
      auto_sync_live_rate: true,
      rate_last_synced: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await writeDb({ settings: updatedSettings });
    console.log(`[Backend] Synced Live Forex Rate: 1 USD = Rs. ${liveRate} NPR | Loyal Store Rate (+${markupPercent}%): Rs. ${newExchangeRate} NPR`);
    return { liveRate, newExchangeRate, markupPercent };
  } catch (err) {
    console.warn('[Backend] Failed to fetch live exchange rate, using fallback', err);
    const { settings } = await readDb();
    const liveRate = settings.live_forex_rate || 153.68;
    const markupPercent = settings.markup_percent !== undefined ? settings.markup_percent : 6.5;
    const newExchangeRate = Number((liveRate * (1 + markupPercent / 100)).toFixed(2));
    return { liveRate, newExchangeRate, markupPercent };
  }
}

async function startServer() {
  const app = express();

  // Middleware for body parsing (support large payload for payment receipt image data)
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // ==========================================
  // BACKEND REST API ENDPOINTS (/api/*)
  // ==========================================

  // 1. Health check & system status
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Virtual Card Nepal Core Backend',
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // 2. Settings endpoints
  app.get('/api/settings', async (req, res) => {
    try {
      const db = await readDb();
      res.json(db.settings);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve settings' });
    }
  });

  // 2b. Live Forex & Loyal Rate Sync Endpoints
  app.get('/api/exchange-rate/live', async (req, res) => {
    try {
      const db = await readDb();
      const liveRate = db.settings.live_forex_rate || 153.68;
      const markupPercent = db.settings.markup_percent !== undefined ? db.settings.markup_percent : 6.5;
      const storeRate = db.settings.exchange_rate || Number((liveRate * (1 + markupPercent / 100)).toFixed(2));
      
      res.json({
        live_forex_rate: liveRate,
        markup_percent: markupPercent,
        store_exchange_rate: storeRate,
        rate_last_synced: db.settings.rate_last_synced || new Date().toISOString(),
        savings_vs_traditional_banks: 'Up to Rs. 15-20 NPR saved per USD compared to black market brokers & bank cards',
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to get live rate status' });
    }
  });

  app.post('/api/exchange-rate/sync', async (req, res) => {
    try {
      const requestedMarkup = req.body.markup_percent !== undefined ? Number(req.body.markup_percent) : 6.5;
      const result = await syncLiveForexRate(requestedMarkup);
      const db = await readDb();
      res.json({
        success: true,
        message: `Synced with live forex: 1 USD = Rs. ${result.liveRate} NPR (+${result.markupPercent}% markup = Rs. ${result.newExchangeRate} NPR)`,
        settings: db.settings,
        result,
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to sync exchange rate with live market' });
    }
  });

  app.put('/api/settings', async (req, res) => {
    try {
      const db = await readDb();
      const updatedSettings: AppSettings = {
        ...db.settings,
        ...req.body,
        updated_at: new Date().toISOString(),
      };
      await writeDb({ settings: updatedSettings });
      res.json(updatedSettings);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // 3. Products endpoints
  app.get('/api/products', async (req, res) => {
    try {
      const db = await readDb();
      res.json(db.products);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve products' });
    }
  });

  app.post('/api/products', async (req, res) => {
    try {
      const db = await readDb();
      const newProduct: Product = {
        ...req.body,
        id: req.body.id || `prod-${Date.now()}`,
      };
      db.products.push(newProduct);
      await writeDb({ products: db.products });
      res.status(201).json(newProduct);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  app.put('/api/products/:id', async (req, res) => {
    try {
      const db = await readDb();
      const idx = db.products.findIndex((p) => p.id === req.params.id);
      if (idx === -1) {
        return res.status(404).json({ error: 'Product not found' });
      }
      db.products[idx] = { ...db.products[idx], ...req.body };
      await writeDb({ products: db.products });
      res.json(db.products[idx]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    try {
      const db = await readDb();
      db.products = db.products.filter((p) => p.id !== req.params.id);
      await writeDb({ products: db.products });
      res.json({ success: true, message: 'Product deleted' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  // 4. Orders endpoints
  app.get('/api/orders', async (req, res) => {
    try {
      const db = await readDb();
      // Return sorted with latest orders first
      const sorted = [...db.orders].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      res.json(sorted);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve orders' });
    }
  });

  app.get('/api/orders/:id', async (req, res) => {
    try {
      const db = await readDb();
      const query = req.params.id.toUpperCase();
      const order = db.orders.find(
        (o) => o.id === req.params.id || o.order_id.toUpperCase() === query
      );
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(order);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve order' });
    }
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const db = await readDb();
      const year = new Date().getFullYear();
      const count = db.orders.length + 1;
      const orderIdNumber = String(count).padStart(4, '0');
      const order_id = `VCN-${year}-${orderIdNumber}`;

      const newOrder: Order = {
        id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        order_id,
        customer_name: req.body.customer_name || 'Customer',
        customer_email: req.body.customer_email || '',
        customer_phone: req.body.customer_phone || '',
        card_name: req.body.card_name || req.body.customer_name || '',
        billing_address: req.body.billing_address || '',
        product_id: req.body.product_id,
        product_name: req.body.product_name,
        product_category: req.body.product_category || 'virtual_cards',
        amount_usd: Number(req.body.amount_usd) || 10,
        total_npr: Number(req.body.total_npr) || 0,
        payment_screenshot_url: req.body.payment_screenshot_url || '',
        status: req.body.status || 'Pending Verification',
        notes: req.body.notes || '',
        internal_notes: req.body.internal_notes || '',
        payment_method: req.body.payment_method || 'esewa',
        created_at: new Date().toISOString(),
      };

      db.orders.unshift(newOrder);
      await writeDb({ orders: db.orders });

      console.log(`[Backend] New Order Created: ${newOrder.order_id} for ${newOrder.customer_name} (${newOrder.customer_email})`);
      res.status(201).json(newOrder);
    } catch (err) {
      console.error('Failed to create order', err);
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  // Admin updates order status or internal notes
  app.patch('/api/orders/:id/status', async (req, res) => {
    try {
      const db = await readDb();
      const query = req.params.id.toUpperCase();
      const idx = db.orders.findIndex(
        (o) => o.id === req.params.id || o.order_id.toUpperCase() === query
      );

      if (idx === -1) {
        return res.status(404).json({ error: 'Order not found' });
      }

      db.orders[idx] = {
        ...db.orders[idx],
        status: req.body.status || db.orders[idx].status,
        internal_notes: req.body.internal_notes !== undefined ? req.body.internal_notes : db.orders[idx].internal_notes,
        updated_at: new Date().toISOString(),
      };

      await writeDb({ orders: db.orders });
      res.json(db.orders[idx]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update order status' });
    }
  });

  // Admin issues card details to specific order
  app.post('/api/orders/:id/issue-card', async (req, res) => {
    try {
      const db = await readDb();
      const query = req.params.id.toUpperCase();
      const idx = db.orders.findIndex(
        (o) => o.id === req.params.id || o.order_id.toUpperCase() === query
      );

      if (idx === -1) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const { cardNumber, expiry, cvv, voucherCode, instructions } = req.body;

      db.orders[idx] = {
        ...db.orders[idx],
        status: 'Completed',
        card_details: {
          cardNumber: cardNumber || undefined,
          expiry: expiry || undefined,
          cvv: cvv || undefined,
          voucherCode: voucherCode || undefined,
          deliveredAt: new Date().toISOString(),
          instructions: instructions || 'Your card credentials are active for international use.',
        },
        internal_notes: `${db.orders[idx].internal_notes || ''}\n[Card Issued on ${new Date().toLocaleString()}]`.trim(),
        updated_at: new Date().toISOString(),
      };

      await writeDb({ orders: db.orders });
      console.log(`[Backend] Card issued for order ${db.orders[idx].order_id}`);
      res.json(db.orders[idx]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to issue card details' });
    }
  });

  // 5. Active Cards & Security Verification Lookup Endpoint
  app.post('/api/cards/lookup', async (req, res) => {
    try {
      const { identifier, securityKey, verificationType } = req.body;
      const cleanId = (identifier || '').trim().toLowerCase();
      const cleanKey = (securityKey || '').trim().toUpperCase();

      if (!cleanId || !cleanKey) {
        return res.status(400).json({ error: 'Identifier and security verification key are required' });
      }

      const db = await readDb();
      // Match by order_id or customer_email
      const matchedOrders = db.orders.filter(
        (o) =>
          o.order_id.toLowerCase() === cleanId ||
          o.customer_email.toLowerCase() === cleanId
      );

      if (matchedOrders.length === 0) {
        return res.status(404).json({ error: 'No order found matching that Order ID or Email' });
      }

      // Verify secondary key (CVV or Name)
      const verified = matchedOrders.filter((order) => {
        if (verificationType === 'cvv') {
          const cvv = (order.card_details?.cvv || '').trim().toUpperCase();
          return cvv && cvv === cleanKey;
        } else {
          const name = (order.card_name || order.customer_name || '').trim().toUpperCase();
          return name.includes(cleanKey) || cleanKey.includes(name);
        }
      });

      if (verified.length === 0) {
        return res.status(401).json({
          error: `Security verification failed: Incorrect ${
            verificationType === 'cvv' ? 'CVV code' : 'cardholder name'
          } for this account.`,
        });
      }

      res.json({
        success: true,
        orders: verified,
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to perform security verification' });
    }
  });

  // 6. Admin Authentication endpoint
  app.post('/api/admin/login', (req, res) => {
    try {
      const { password } = req.body;
      // Default admin password or check
      if (password === 'admin123' || password === process.env.ADMIN_PASSWORD) {
        res.json({
          success: true,
          token: `vcn_admin_${Date.now()}`,
          message: 'Admin authenticated successfully',
        });
      } else {
        res.status(401).json({ success: false, error: 'Invalid admin credentials' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Authentication service error' });
    }
  });

  // ==========================================
  // VITE DEV SERVER OR PRODUCTION STATIC FILES
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(currentDir, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), async () => {
    console.log(`Server listening on port ${PORT}`);
    
    // Ensure DB is seeded if empty
    const db = getAdminDb();
    const settingsSnap = await db.collection('settings').doc('config').get();
    if (!settingsSnap.exists) {
        console.log('[Backend] Seeding database...');
        await writeDb({
            settings: DEFAULT_SETTINGS,
            products: INITIAL_PRODUCTS,
            orders: INITIAL_ORDERS
        });
    }

    // Sync live market forex rate on startup
    syncLiveForexRate().catch((e) => console.error('Initial forex rate sync failed', e));
  });
}

startServer();
