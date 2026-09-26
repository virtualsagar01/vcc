import 'dotenv/config';
import express from 'express';
import crypto from 'node:crypto';
import cors from 'cors';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, Order, AppSettings } from './src/types';
import { DEFAULT_SETTINGS, INITIAL_PRODUCTS } from './src/utils/storage';

const PORT = Number(process.env.PORT || 3000);
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_TOKEN_TTL_SECONDS = 60 * 60 * 12;
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'payment-screenshots';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[Backend] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured.');
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const app = express();
app.use(cors({ origin: (process.env.FRONTEND_URL || '*').split(',').map(s => s.trim()), credentials: true }));
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

function normalizeProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug || String(row.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    category: row.category || 'gift_cards',
    category_label: row.category_label || String(row.category || '').replace(/_/g, ' '),
    description: row.description || '',
    short_description: row.short_description || row.description || '',
    image_url: row.image_url || 'gift-card',
    theme_accent: row.theme_accent || 'gold',
    base_usd: Number(row.base_usd || 0),
    issuance_fee_usd: Number(row.issuance_fee_usd || 0),
    funding_fee_percent: Number(row.funding_fee_percent || 0),
    processing_fee_usd: Number(row.processing_fee_usd || 0),
    is_virtual: Boolean(row.is_virtual),
    min_amount: Number(row.min_amount || 0),
    max_amount: Number(row.max_amount || 0),
    denominations: Array.isArray(row.denominations) ? row.denominations.map(Number) : [],
    features: Array.isArray(row.features) ? row.features : [],
    validity: row.validity || 'Instant',
    delivery_time: row.delivery_time || 'Instant',
    starting_price_npr: Number(row.starting_price_npr || 0),
    active: row.active !== false,
    display_order: Number(row.display_order || 0),
    badge_text: row.badge_text || undefined,
    support_note: row.support_note || undefined,
  } as Product;
}

function normalizeSettings(row: any): AppSettings {
  return { ...DEFAULT_SETTINGS, ...(row || {}), id: 1 } as AppSettings;
}

function normalizeOrder(row: any): Order {
  return {
    ...row,
    amount_usd: Number(row.amount_usd || 0),
    total_npr: Number(row.total_npr || 0),
    product_category: row.product_category || 'gift_cards',
    payment_method: row.payment_method || 'esewa',
    card_details: row.card_details || undefined,
  } as Order;
}

function signAdminToken(payload: { sub: string; exp: number }) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', ADMIN_TOKEN_SECRET).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function verifyAdminToken(token: string) {
  const [body, signature] = token.split('.');
  if (!body || !signature || !ADMIN_TOKEN_SECRET) return false;
  const expected = crypto.createHmac('sha256', ADMIN_TOKEN_SECRET).update(body).digest('base64url');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return payload?.sub === 'admin' && Number(payload.exp) > Math.floor(Date.now() / 1000);
  } catch { return false; }
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token || !verifyAdminToken(token)) return res.status(401).json({ error: 'Invalid or expired admin session' });
  next();
}

async function seedIfNeeded() {
  const { count, error } = await supabase.from('products').select('id', { count: 'exact', head: true });
  if (!error && count === 0) {
    const rows = INITIAL_PRODUCTS.map(p => ({
      name: p.name,
      slug: p.slug,
      category: p.category,
      category_label: p.category_label,
      description: p.description,
      short_description: p.short_description,
      image_url: p.image_url,
      theme_accent: p.theme_accent,
      base_usd: p.base_usd,
      issuance_fee_usd: p.issuance_fee_usd,
      funding_fee_percent: p.funding_fee_percent,
      processing_fee_usd: p.processing_fee_usd,
      is_virtual: p.is_virtual,
      min_amount: p.min_amount,
      max_amount: p.max_amount,
      denominations: p.denominations,
      features: p.features,
      validity: p.validity,
      delivery_time: p.delivery_time,
      starting_price_npr: p.starting_price_npr,
      badge_text: p.badge_text || null,
      support_note: p.support_note || null,
      active: p.active !== false,
      display_order: p.display_order ?? 0,
    }));
    const result = await supabase.from('products').insert(rows);
    if (result.error) console.warn('[Backend] Product seed failed:', result.error.message);
  }
  const { data: settings } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
  if (!settings) await supabase.from('settings').upsert({ id: 1, ...DEFAULT_SETTINGS });
}

app.post('/api/uploads/image', requireAdmin, async (req, res) => {
  try {
    const dataUrl = String(req.body?.data_url || '');
    const folder = String(req.body?.folder || 'products').replace(/[^a-zA-Z0-9_-]/g, '');
    const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: 'Invalid image data' });
    const mime = match[1];
    const bytes = Buffer.from(match[2], 'base64');
    if (bytes.length > 6 * 1024 * 1024) return res.status(400).json({ error: 'Image must be under 6MB' });
    const ext = (mime.split('/')[1] || 'jpg').replace('jpeg', 'jpg').split('+')[0];
    const filename = `${folder}/${Date.now()}-${crypto.randomBytes(5).toString('hex')}.${ext}`;
    const upload = await supabase.storage.from('site-assets').upload(filename, bytes, { contentType: mime, upsert: false });
    if (upload.error) throw upload.error;
    const url = supabase.storage.from('site-assets').getPublicUrl(filename).data.publicUrl;
    res.json({ url });
  } catch (e: any) { res.status(400).json({ error: e.message || 'Image upload failed' }); }
});

app.post('/api/admin/login', (req, res) => {
  if (!ADMIN_PASSWORD || !ADMIN_TOKEN_SECRET) return res.status(503).json({ error: 'Admin authentication is not configured on the server.' });
  const password = String(req.body?.password || '');
  if (!password || password.length > 256) return res.status(401).json({ error: 'Invalid admin credentials.' });
  const expected = Buffer.from(ADMIN_PASSWORD);
  const supplied = Buffer.from(password);
  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }
  const exp = Math.floor(Date.now() / 1000) + ADMIN_TOKEN_TTL_SECONDS;
  res.json({ token: signAdminToken({ sub: 'admin', exp }), expires_at: new Date(exp * 1000).toISOString() });
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'Virtual Card Nepal API', timestamp: new Date().toISOString() }));

app.get('/api/settings', async (_req, res) => {
  const { data, error } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  res.json(normalizeSettings(data));
});

app.get('/api/exchange-rate/live', async (_req, res) => {
  const { data } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
  const settings = normalizeSettings(data);
  res.json({
    live_forex_rate: settings.live_forex_rate || settings.exchange_rate,
    markup_percent: settings.markup_percent || 0,
    store_exchange_rate: settings.exchange_rate,
    rate_last_synced: settings.rate_last_synced || new Date().toISOString(),
  });
});

app.post('/api/exchange-rate/sync', requireAdmin, async (req, res) => {
  try {
    const requestedMarkup = Number(req.body.markup_percent ?? 6.5);
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    const json: any = await response.json();
    const live = Number(json?.rates?.NPR || 0);
    if (!live) throw new Error('NPR rate unavailable');
    const storeRate = Number((live * (1 + requestedMarkup / 100)).toFixed(2));
    const payload = { live_forex_rate: Number(live.toFixed(2)), markup_percent: requestedMarkup, exchange_rate: storeRate, commission_percent: 0, auto_sync_live_rate: true, rate_last_synced: new Date().toISOString(), updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from('settings').upsert({ id: 1, ...payload }).select().single();
    if (error) throw error;
    res.json({ success: true, settings: normalizeSettings(data), result: { liveRate: live, newExchangeRate: storeRate, markupPercent: requestedMarkup } });
  } catch (error: any) {
    res.status(502).json({ error: error.message || 'Failed to sync exchange rate' });
  }
});

app.put('/api/settings', requireAdmin, async (req, res) => {
  const payload = { ...req.body, id: 1, updated_at: new Date().toISOString() };
  const { data, error } = await supabase.from('settings').upsert(payload).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(normalizeSettings(data));
});

app.get('/api/products', async (_req, res) => {
  const { data, error } = await supabase.from('products').select('*').order('display_order', { ascending: true }).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json((data || []).map(normalizeProduct));
});

app.post('/api/products', requireAdmin, async (req, res) => {
  const payload = { ...req.body };
  delete payload.id;
  const { data, error } = await supabase.from('products').insert(payload).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(normalizeProduct(data));
});

app.put('/api/products/:id', requireAdmin, async (req, res) => {
  const paramId = String(req.params.id);
  const { data, error } = await supabase.from('products').update(req.body).eq('id', paramId).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(normalizeProduct(data));
});

app.delete('/api/products/:id', requireAdmin, async (req, res) => {
  const paramId = String(req.params.id);
  const { error } = await supabase.from('products').delete().eq('id', paramId);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.get('/api/orders', requireAdmin, async (_req, res) => {
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json((data || []).map(normalizeOrder));
});

app.get('/api/orders/:id', async (req, res) => {
  const q = String(req.params.id);
  let { data } = await supabase.from('orders').select('*').eq('order_id', q.toUpperCase()).maybeSingle();
  if (!data && /^[0-9a-f-]{36}$/i.test(q)) {
    const byId = await supabase.from('orders').select('*').eq('id', q).maybeSingle();
    data = byId.data;
  }
  if (!data) return res.status(404).json({ error: 'Order not found' });
  const order = normalizeOrder(data);
  // Public tracking never exposes card credentials or internal notes.
  if (!(req.headers.authorization || '').startsWith('Bearer ')) {
    delete (order as any).card_details;
    delete (order as any).internal_notes;
  }
  res.json(order);
});

app.post('/api/orders', async (req, res) => {
  const b = req.body || {};
  if (!b.customer_name || !b.customer_email || !b.product_id) return res.status(400).json({ error: 'Name, email and product are required' });
  if (b.payment_method === 'crypto' && !String(b.transaction_id || '').trim()) return res.status(400).json({ error: 'Crypto Transaction ID is required' });
  if (b.payment_method !== 'crypto' && !b.payment_screenshot_url) return res.status(400).json({ error: 'Payment screenshot is required' });

  let screenshotUrl = '';
  try {
    if (!b.payment_screenshot_url) { screenshotUrl = ''; } else {
    const dataUrl = String(b.payment_screenshot_url);
    const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: 'Payment screenshot must be a valid image upload' });
    const mime = match[1];
    const ext = mime.split('/')[1].replace('jpeg', 'jpg').split('+')[0];
    const bytes = Buffer.from(match[2], 'base64');
    if (bytes.length > 5 * 1024 * 1024) return res.status(400).json({ error: 'Payment screenshot must be under 5MB' });
    const filename = `${new Date().getFullYear()}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const upload = await supabase.storage.from(STORAGE_BUCKET).upload(filename, bytes, { contentType: mime, upsert: false });
    if (upload.error) throw upload.error;
    const publicUrl = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename).data.publicUrl;
    screenshotUrl = publicUrl;
    }
  } catch (e: any) {
    return res.status(400).json({ error: `Payment screenshot upload failed: ${e.message || 'unknown error'}` });
  }

  const { data: seq, error: seqError } = await supabase.rpc('next_order_number');
  if (seqError) return res.status(500).json({ error: 'Unable to generate Order ID. Run the supplied Supabase schema first.' });
  const year = new Date().getFullYear();
  const order_id = `VCN-${year}-${String(Number(seq)).padStart(4, '0')}`;
  const insertPayload = {
    order_id,
    customer_name: b.customer_name,
    customer_email: b.customer_email,
    customer_phone: b.customer_phone || null,
    card_name: b.card_name || null,
    billing_address: b.billing_address || null,
    product_id: b.product_id,
    product_name: b.product_name || null,
    product_category: b.product_category || 'gift_cards',
    amount_usd: Number(b.amount_usd || 0),
    total_npr: Number(b.total_npr || 0),
    payment_screenshot_url: screenshotUrl,
    payment_method: b.payment_method || 'esewa',
    transaction_id: b.transaction_id || null,
    transaction_url: b.transaction_url || null,
    status: 'Pending Verification',
    notes: b.notes || null,
  };
  const { data, error } = await supabase.from('orders').insert(insertPayload).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(normalizeOrder(data));
});

app.patch('/api/orders/:id/status', requireAdmin, async (req, res) => {
  const paramId = String(req.params.id);
  const updates = { status: req.body.status, internal_notes: req.body.internal_notes, updated_at: new Date().toISOString() };
  let query = supabase.from('orders').update(updates).eq('order_id', paramId.toUpperCase()).select().single();
  let { data, error } = await query;
  if (error && /^[0-9a-f-]{36}$/i.test(paramId)) { data = (await supabase.from('orders').update(updates).eq('id', paramId).select().single()).data; error = null; }
  if (error || !data) return res.status(400).json({ error: error?.message || 'Order not found' });
  res.json(normalizeOrder(data));
});

app.post('/api/orders/:id/issue-card', requireAdmin, async (req, res) => {
  const paramId = String(req.params.id);
  let { data: current, error: findError } = await supabase.from('orders').select('internal_notes').eq('order_id', paramId.toUpperCase()).maybeSingle();
  if (!current && /^[0-9a-f-]{36}$/i.test(paramId)) { const byId = await supabase.from('orders').select('internal_notes').eq('id', paramId).maybeSingle(); current = byId.data; findError = byId.error; }
  if (findError || !current) return res.status(404).json({ error: 'Order not found' });
  const card_details = { ...req.body, balanceUSD: Number(req.body?.balanceUSD ?? 0) || undefined, deliveredAt: new Date().toISOString() };
  const linkedOrder = await supabase.from('orders').select('amount_usd, product_category').eq('order_id', paramId.toUpperCase()).maybeSingle();
  if (linkedOrder.data?.product_category === 'virtual_cards_reloadable') card_details.balanceUSD = Number(linkedOrder.data.amount_usd || 0);
  const updates = { status: 'Completed', card_details, updated_at: new Date().toISOString(), internal_notes: `${current.internal_notes || ''}\n[Card Issued ${new Date().toISOString()}]`.trim() };
  let query = supabase.from('orders').update(updates).eq('order_id', paramId.toUpperCase()).select().single();
  let { data, error } = await query;
  if (error && /^[0-9a-f-]{36}$/i.test(paramId)) { data = (await supabase.from('orders').update(updates).eq('id', paramId).select().single()).data; error = null; }
  if (error || !data) return res.status(400).json({ error: error?.message || 'Order not found' });
  res.json(normalizeOrder(data));
});

app.post('/api/cards/lookup', async (req, res) => {
  const identifier = String(req.body.identifier || '').trim().toLowerCase();
  const key = String(req.body.securityKey || '').trim().toUpperCase();
  const type = req.body.verificationType === 'cvv' ? 'cvv' : 'cardholder';
  const { data, error } = await supabase.from('orders').select('*').or(`order_id.ilike.${identifier},customer_email.ilike.${identifier}`).eq('status', 'Completed');
  if (error || !data?.length) return res.status(404).json({ error: 'No completed order found matching that Order ID or Email.' });
  const verified = data.filter((row: any) => {
    if (type === 'cvv') return String(row.card_details?.cvv || '').toUpperCase() === key;
    const name = String(row.card_name || row.customer_name || '').toUpperCase();
    return name.includes(key) || key.includes(name);
  });
  if (!verified.length) return res.status(401).json({ error: 'Security verification failed.' });
  res.json({ success: true, orders: verified.map(normalizeOrder) });
});

app.post('/api/reloads', async (req, res) => {
  const b = req.body || {};
  const identifier = String(b.identifier || '').trim();
  const securityKey = String(b.security_key || '').trim().toUpperCase();
  const amount = Number(b.amount_usd || 0);
  if (!identifier || !securityKey || !Number.isFinite(amount) || amount < 10 || amount > 20000) return res.status(400).json({ error: 'Valid card identifier, verification key and $10–$20,000 amount are required.' });
  if (b.payment_method === 'crypto' && !String(b.transaction_id || '').trim()) return res.status(400).json({ error: 'Crypto Transaction ID is required.' });
  if (b.payment_method === 'esewa' && !b.payment_screenshot_url) return res.status(400).json({ error: 'eSewa payment screenshot is required.' });
  const { data: rows, error } = await supabase.from('orders').select('*').eq('status','Completed');
  if (error) return res.status(500).json({ error: error.message });
  const needle = identifier.toLowerCase();
  const matches = (rows || []).filter((r:any) => {
    const card = String(r.card_details?.cardNumber || '').replace(/\D/g,'');
    const id = String(r.order_id || '').toLowerCase();
    const email = String(r.customer_email || '').toLowerCase();
    return id === needle || email === needle || (card && card === needle.replace(/\D/g,''));
  }).filter((r:any) => String(r.product_category || '').includes('virtual_cards_reloadable') && r.card_details?.cardNumber);
  if (!matches.length) return res.status(404).json({ error: 'No active reloadable card found for that identifier.' });
  const order = matches.find((r:any) => String(r.card_details?.cvv || '').toUpperCase() === securityKey || String(r.card_name || r.customer_name || '').toUpperCase() === securityKey);
  if (!order) return res.status(401).json({ error: 'Card verification failed.' });
  let screenshotUrl = '';
  if (b.payment_screenshot_url) {
    const match = String(b.payment_screenshot_url).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: 'Invalid payment screenshot.' });
    const mime = match[1]; const bytes = Buffer.from(match[2], 'base64');
    if (bytes.length > 5 * 1024 * 1024) return res.status(400).json({ error: 'Screenshot must be under 5MB.' });
    const ext = mime.split('/')[1].replace('jpeg','jpg').split('+')[0];
    const path = `reloads/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const up = await supabase.storage.from(STORAGE_BUCKET).upload(path, bytes, { contentType: mime, upsert:false });
    if (up.error) return res.status(400).json({ error: up.error.message });
    screenshotUrl = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
  }
  const { data: seq, error: seqError } = await supabase.rpc('next_order_number');
  if (seqError) return res.status(500).json({ error: 'Unable to generate reload ID.' });
  const reload_id = `RLD-${new Date().getFullYear()}-${String(Number(seq)).padStart(4,'0')}`;
  const settingsRow = (await supabase.from('settings').select('*').eq('id',1).maybeSingle()).data;
  const rate = Number(settingsRow?.exchange_rate || 173);
  const total_npr = Number((amount * rate).toFixed(2));
  const { data, error: insertError } = await supabase.from('reload_transactions').insert({ reload_id, order_id: order.order_id, customer_name: order.customer_name, customer_email: order.customer_email, card_identifier: identifier, amount_usd: amount, total_npr, payment_method: b.payment_method || 'esewa', transaction_id: b.transaction_id || null, transaction_url: b.transaction_url || null, payment_screenshot_url: screenshotUrl || null, status:'Pending Verification' }).select().single();
  if (insertError) return res.status(500).json({ error: insertError.message });
  res.status(201).json(data);
});

app.get('/api/reloads', requireAdmin, async (_req,res) => { const {data,error}=await supabase.from('reload_transactions').select('*').order('created_at',{ascending:false}); if(error)return res.status(500).json({error:error.message}); res.json(data||[]); });

app.patch('/api/reloads/:id/status', requireAdmin, async (req,res) => {
  const paramId = String(req.params.id);
  const status = req.body?.status; if (!['Approved','Rejected'].includes(status)) return res.status(400).json({error:'Invalid reload status'});
  const {data: reload,error: findError}=await supabase.from('reload_transactions').select('*').eq('reload_id',paramId.toUpperCase()).maybeSingle();
  if(findError||!reload)return res.status(404).json({error:'Reload transaction not found'});
  if(reload.status === 'Approved') return res.status(409).json({error:'Reload already approved'});
  if(status === 'Approved') {
    const {data: order,error: oe}=await supabase.from('orders').select('*').eq('order_id',reload.order_id).maybeSingle();
    if(oe||!order)return res.status(404).json({error:'Linked card order not found'});
    const current=Number(order.card_details?.balanceUSD || order.amount_usd || 0);
    const updatedDetails={...(order.card_details||{}), balanceUSD:Number((current+Number(reload.amount_usd)).toFixed(2)), lastReloadedAt:new Date().toISOString()};
    const {error: ue}=await supabase.from('orders').update({card_details:updatedDetails,updated_at:new Date().toISOString()}).eq('id',order.id);
    if(ue)return res.status(500).json({error:ue.message});
  }
  const {data,error}=await supabase.from('reload_transactions').update({status,internal_notes:req.body?.internal_notes||null,updated_at:new Date().toISOString()}).eq('id',reload.id).select().single();
  if(error)return res.status(500).json({error:error.message}); res.json(data);
});

// Backend is API-only in the Vercel + Render deployment. A tiny root response is useful for Render health checks.
app.get('/', (_req, res) => res.json({ service: 'Virtual Card Nepal API', status: 'ok' }));

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Virtual Card Nepal API listening on ${PORT}`);
  try { await seedIfNeeded(); } catch (e) { console.warn('[Backend] Supabase seed check failed:', e); }
});
