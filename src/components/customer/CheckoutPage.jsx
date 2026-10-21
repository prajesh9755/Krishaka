import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Lock, MapPin } from 'lucide-react';
import { RAZORPAY_KEY_ID } from '../../config/razorpay';

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

// Delivery details + Razorpay payment. onPaid(details, paymentId) creates the orders.
export function CheckoutPage({ user, items, defaultAddress, onBack, onPaid }) {
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [address, setAddress] = useState(defaultAddress || '');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const total = items.reduce((sum, i) => sum + i.quantityKg * i.pricePerKg, 0);

  const pay = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    if (!(await loadRazorpay())) {
      setError('Could not load Razorpay. Check your internet connection.');
      setBusy(false);
      return;
    }
    const details = { name: name.trim(), phone: phone.trim(), address: address.trim(), note: note.trim() };
    const rzp = new window.Razorpay({
      key: RAZORPAY_KEY_ID,
      amount: Math.round(total * 100), // paise
      currency: 'INR',
      name: 'Krishaka',
      description: `${items.length} item(s) from Krishaka farmers`,
      prefill: { name: details.name, contact: details.phone, email: user.email || '' },
      notes: { address: details.address },
      theme: { color: '#B8562D' },
      handler: async (response) => {
        try {
          await onPaid(details, response.razorpay_payment_id);
        } catch (err) {
          setError(`Payment received (${response.razorpay_payment_id}) but saving the order failed: ${err.message}`);
          setBusy(false);
        }
      },
      modal: { ondismiss: () => setBusy(false) },
    });
    rzp.on('payment.failed', (resp) => {
      setError(`Payment failed: ${resp.error?.description || 'please try again.'}`);
      setBusy(false);
    });
    rzp.open();
  };

  const inputCls = 'w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm bg-white focus:border-[#B8562D] focus:outline-hidden';

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
      <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm font-bold text-[#B8562D] cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> Back to cart
      </button>
      <h1 className="font-headline font-bold text-2xl text-[#1A1C18]">Checkout</h1>

      <form onSubmit={pay} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-bold text-[#1A1C18] flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#B8562D]" /> Delivery details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs font-semibold block">Full name *
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label className="text-xs font-semibold block">Mobile number *
              <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </label>
          </div>
          <label className="text-xs font-semibold block">Delivery address *
            <textarea className={inputCls} rows={3} value={address} onChange={(e) => setAddress(e.target.value)}
              placeholder="House / flat, street, village / city, pincode" required />
          </label>
          <label className="text-xs font-semibold block">Note for farmer (optional)
            <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Deliver in the morning" />
          </label>
        </div>

        <div className="space-y-3">
          <h2 className="font-bold text-[#1A1C18]">Order summary</h2>
          <ul className="space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.listingId} className="flex justify-between gap-2">
                <span className="truncate">{i.cropName} · {i.quantityKg} kg</span>
                <span className="font-semibold shrink-0">₹{(i.quantityKg * i.pricePerKg).toLocaleString()}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between text-sm border-t border-[#DCD6C8] pt-2">
            <span className="text-[#1A1C18]/70">Delivery</span>
            <span className="font-semibold text-[#3F6B3A]">Free</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Total</span>
            <span className="font-headline font-bold text-xl text-[#B8562D]">₹{total.toLocaleString()}</span>
          </div>
          {error && <p className="text-sm text-[#B8562D]">{error}</p>}
          <button type="submit" disabled={busy || items.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-[#B8562D] hover:bg-[#9E4823] text-white font-bold py-3 rounded-xl cursor-pointer disabled:opacity-50">
            <CreditCard className="w-4 h-4" /> {busy ? 'Processing...' : `Pay ₹${total.toLocaleString()}`}
          </button>
          <p className="text-[11px] text-[#1A1C18]/60 flex items-center gap-1 justify-center"><Lock className="w-3 h-3" /> Secure payment by Razorpay</p>
        </div>
      </form>
    </main>
  );
}
