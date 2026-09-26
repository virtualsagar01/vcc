import React, { useState } from 'react';
import { X, Upload, Check, AlertCircle, ShieldCheck, Phone, Mail, User, MapPin, Copy, ExternalLink } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, AppSettings, Order } from '../types';
import { calculateOrderPrice, formatNPR } from '../utils/pricing';
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
  product, amountUSD, cardNameInitial = '', settings, isOpen, onClose, onOrderSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cardName, setCardName] = useState(cardNameInitial || '');
  const [billingAddress, setBillingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [screenshotName, setScreenshotName] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [transactionUrl, setTransactionUrl] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'esewa' | 'crypto'>(() => methods.some((m) => m.type === 'esewa') ? 'esewa' : 'crypto');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const configuredMethods = settings.payment_methods?.filter((m) => m.enabled) || [];
  const methods = configuredMethods.length
    ? configuredMethods
    : [
        { id: 'esewa', name: 'eSewa', type: 'esewa' as const, enabled: true },
        { id: 'crypto', name: 'Crypto', type: 'crypto' as const, enabled: true, network: settings.crypto_payment_network, wallet_address: settings.crypto_payment_address },
      ];
  const cryptoMethod = methods.find((m) => m.type === 'crypto');
  const esewaMethod = methods.find((m) => m.type === 'esewa');
  const priceCalc = calculateOrderPrice(amountUSD, product, settings);

  if (!isOpen) return null;

  const handleFileUpload = (file?: File) => {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Screenshot must be 5 MB or smaller.');
      return;
    }
    setError(null);
    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onload = () => setScreenshotPreview(String(reader.result || ''));
    reader.onerror = () => setError('Unable to read that image. Please try again.');
    reader.readAsDataURL(file);
  };

  const copyWallet = async () => {
    const wallet = cryptoMethod?.wallet_address || settings.crypto_payment_address || '';
    if (!wallet) return;
    try {
      await navigator.clipboard.writeText(wallet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch { setError('Could not copy the wallet address.'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) return setError('Please enter your full name.');
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Please enter a valid email address.');
    if (!phone.trim()) return setError('Please enter your WhatsApp number.');
    if (product.is_virtual && !cardName.trim()) return setError('Please enter your card name.');
    if (paymentMethod === 'esewa' && !screenshotPreview) return setError('Please upload your eSewa payment screenshot.');
    if (paymentMethod === 'crypto' && !transactionId.trim()) return setError('Please enter your crypto transaction ID.');

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
        payment_screenshot_url: screenshotPreview || '',
        payment_method: paymentMethod,
        transaction_id: transactionId.trim() || undefined,
        transaction_url: transactionUrl.trim() || undefined,
        status: 'Pending Verification',
        notes: notes.trim() || undefined,
      });
      try { confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#D4AF37', '#E5E4E2', '#60BB46'] }); } catch {}
      onOrderSuccess(order);
    } catch (err: any) {
      setError(err?.message && !String(err.message).toLowerCase().includes('backend') ? String(err.message) : 'Something went wrong. Please try again.');
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-0 sm:p-4 overflow-y-auto">
      <div className="relative my-auto flex max-h-[100dvh] w-full max-w-4xl flex-col overflow-hidden bg-[#0f0f10] shadow-2xl sm:max-h-[94vh] sm:rounded-2xl sm:border sm:border-white/10">
        <div className="h-1 shrink-0 bg-gradient-to-r from-[#D4AF37] via-[#E5E4E2] to-[#D4AF37]" />
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-neutral-950 px-4 py-3 sm:px-6">
          <div><h2 className="text-lg font-bold text-white sm:text-xl">Secure checkout</h2><p className="text-xs text-neutral-500">No account required</p></div>
          <button type="button" onClick={onClose} aria-label="Close checkout" className="rounded-full p-2 text-neutral-400 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="min-h-0 overflow-y-auto p-4 sm:p-6">
          {error && <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" /><span>{error}</span></div>}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#D4AF37]"><User className="h-4 w-4" /> Customer information</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Full name" required icon={<User className="h-4 w-4" />} value={fullName} onChange={setFullName} placeholder="Ramesh Tamang" />
                <Field label="WhatsApp number" required icon={<Phone className="h-4 w-4" />} value={phone} onChange={setPhone} placeholder="+977 98XXXXXXXX" type="tel" />
              </div>
              <Field label="Email address" required icon={<Mail className="h-4 w-4" />} helper="Your order details will be sent here." value={email} onChange={setEmail} placeholder="name@gmail.com" type="email" />

              {product.is_virtual && <div>
                <label className="mb-1 block text-sm font-medium text-neutral-200">Card name <span className="text-red-400">*</span></label>
                <input required maxLength={26} value={cardName} onChange={(e) => setCardName(e.target.value.toUpperCase())} placeholder="VIRTUAL CARD NEPAL" className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-3 text-sm uppercase tracking-wide text-white outline-none focus:border-[#D4AF37]" />
                <p className="mt-1 text-xs text-neutral-500">Name shown on your virtual card.</p>
              </div>}

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-200">Billing address</label>
                <div className="relative"><MapPin className="absolute left-3 top-3.5 h-4 w-4 text-neutral-500" /><input value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} placeholder="Ward, street, city, postal code" className="w-full rounded-xl border border-white/10 bg-neutral-900 py-3 pl-9 pr-3 text-sm text-white outline-none focus:border-[#D4AF37]" /></div>
                <p className="mt-1 text-xs text-neutral-500">Used for card billing verification.</p>
                <details className="mt-2 text-xs text-neutral-500"><summary className="cursor-pointer text-neutral-300">Why do I need this?</summary><p className="mt-2 leading-relaxed">Some merchants verify the cardholder name and billing address when processing international payments.</p></details>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-200">Notes <span className="text-neutral-500">(optional)</span></label>
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Player ID or anything we should know" className="w-full resize-none rounded-xl border border-white/10 bg-neutral-900 p-3 text-sm text-white outline-none focus:border-[#D4AF37]" />
              </div>

              <div className="rounded-xl border border-white/10 bg-neutral-950 p-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3"><div><p className="text-sm font-medium text-white">{product.name}</p><p className="text-xs text-neutral-500">${amountUSD}</p></div><span className="text-lg font-bold text-[#F3E5AB]">{formatNPR(priceCalc.finalNPR)}</span></div>
                <div className="flex items-center justify-between pt-3 text-sm"><span className="text-neutral-400">Total</span><strong className="text-white">{formatNPR(priceCalc.finalNPR)}</strong></div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#D4AF37]"><ShieldCheck className="h-4 w-4" /> Payment</div>
              <div className="grid grid-cols-2 gap-2">
                {methods.some((m) => m.type === 'esewa') && <button type="button" onClick={() => setPaymentMethod('esewa')} className={`rounded-xl border p-3 text-left transition ${paymentMethod === 'esewa' ? 'border-emerald-500 bg-emerald-950/30' : 'border-white/10 bg-neutral-950 hover:border-white/20'}`}><p className="text-sm font-semibold text-white">eSewa</p><p className="text-xs text-neutral-500">Screenshot required</p></button>}
                {methods.some((m) => m.type === 'crypto') && <button type="button" onClick={() => setPaymentMethod('crypto')} className={`rounded-xl border p-3 text-left transition ${paymentMethod === 'crypto' ? 'border-indigo-500 bg-indigo-950/30' : 'border-white/10 bg-neutral-950 hover:border-white/20'}`}><p className="text-sm font-semibold text-white">Crypto</p><p className="text-xs text-neutral-500">TXID required</p></button>}
              </div>

              {paymentMethod === 'esewa' && methods.some((m) => m.type === 'esewa') && <>
                <EsewaQR amountNPR={priceCalc.finalNPR} esewaId={settings.esewa_id} accountName={settings.esewa_account_name} />
                <UploadBox required name={screenshotName} preview={screenshotPreview} onFile={handleFileUpload} onRemove={() => { setScreenshotPreview(''); setScreenshotName(''); }} />
              </>}

              {paymentMethod === 'crypto' && <div className="space-y-3 rounded-xl border border-indigo-500/20 bg-indigo-950/10 p-4">
                <details open><summary className="cursor-pointer text-sm font-semibold text-white">Payment details</summary>
                  <div className="mt-3 space-y-3 text-sm">
                    <div><p className="text-xs text-neutral-500">Wallet address</p><div className="mt-1 flex gap-2"><code className="min-w-0 flex-1 break-all rounded-lg bg-black/40 p-2 text-xs text-indigo-200">{cryptoMethod?.wallet_address || settings.crypto_payment_address || 'Not configured'}</code><button type="button" onClick={copyWallet} className="shrink-0 rounded-lg border border-white/10 px-3 text-xs text-white hover:bg-white/10">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button></div></div>
                    <div><p className="text-xs text-neutral-500">Network</p><p className="mt-1 text-white">{cryptoMethod?.network || settings.crypto_payment_network || 'Not configured'}</p></div>
                    <div><p className="text-xs text-neutral-500">Amount to send</p><p className="mt-1 font-semibold text-[#F3E5AB]">{formatNPR(priceCalc.finalNPR)} equivalent</p></div>
                  </div>
                </details>
                <div><label className="mb-1 block text-sm font-medium text-neutral-200">Transaction ID / TXID <span className="text-red-400">*</span></label><input required value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Paste your transaction ID" className="w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-3 text-sm text-white outline-none focus:border-indigo-400" /></div>
                <div><label className="mb-1 block text-sm font-medium text-neutral-200">Blockchain explorer URL <span className="text-neutral-500">(optional)</span></label><div className="relative"><ExternalLink className="absolute left-3 top-3.5 h-4 w-4 text-neutral-500" /><input value={transactionUrl} onChange={(e) => setTransactionUrl(e.target.value)} placeholder="https://..." className="w-full rounded-xl border border-white/10 bg-neutral-950 py-3 pl-9 pr-3 text-sm text-white outline-none focus:border-indigo-400" /></div></div>
                <UploadBox required={false} name={screenshotName} preview={screenshotPreview} onFile={handleFileUpload} onRemove={() => { setScreenshotPreview(''); setScreenshotName(''); }} />
              </div>}

              <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-gradient-to-r from-[#F3D56B] to-[#D4AF37] px-5 py-3.5 text-sm font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? 'Submitting…' : paymentMethod === 'crypto' ? 'Submit Crypto Payment' : 'Submit Order'}</button>
              <p className="text-center text-xs text-neutral-500">Your order is reviewed before delivery.</p>
            </section>
          </div>
        </form>
      </div>
    </div>
  );
};

function Field({ label, required, helper, icon, value, onChange, placeholder, type = 'text' }: { label: string; required?: boolean; helper?: string; icon?: React.ReactNode; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <div><label className="mb-1 block text-sm font-medium text-neutral-200">{label} {required && <span className="text-red-400">*</span>}</label><div className="relative">{icon && <span className="absolute left-3 top-3.5 text-neutral-500">{icon}</span>}<input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`w-full rounded-xl border border-white/10 bg-neutral-900 py-3 text-sm text-white outline-none focus:border-[#D4AF37] ${icon ? 'pl-9' : 'px-3'}`} /></div>{helper && <p className="mt-1 text-xs text-neutral-500">{helper}</p>}</div>;
}

function UploadBox({ required, name, preview, onFile, onRemove }: { required: boolean; name: string; preview: string; onFile: (file?: File) => void; onRemove: () => void }) {
  return <div><div className="mb-1 flex items-center justify-between"><label className="text-sm font-medium text-neutral-200">Payment screenshot {required ? <span className="text-red-400">*</span> : <span className="text-neutral-500">(optional)</span>}</label>{preview && <button type="button" onClick={onRemove} className="text-xs text-red-300 hover:text-red-200">Remove</button>}</div>{preview ? <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30"><img src={preview} alt="Payment screenshot preview" className="max-h-52 w-full object-contain" /><div className="flex items-center justify-between gap-2 border-t border-white/10 px-3 py-2 text-xs text-neutral-400"><span className="truncate">{name}</span><label className="cursor-pointer text-[#F3D56B] hover:text-white">Replace<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} /></label></div></div> : <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-neutral-950 p-4 text-center transition hover:border-[#D4AF37]/60"><Upload className="mb-2 h-5 w-5 text-neutral-500" /><span className="text-sm text-neutral-300">Upload payment screenshot</span><span className="mt-1 text-xs text-neutral-600">JPG, PNG or WEBP · max 5 MB{required ? '' : ' · optional'}</span><input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} /></label>}</div>;
}
