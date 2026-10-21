import React from 'react';
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2, MapPin } from 'lucide-react';

// Customer cart. Quantities are in kg; prices are per kg.
export function CartPage({ items, onChangeQty, onRemove, onBack, onCheckout }) {
  const subtotal = items.reduce((sum, i) => sum + i.quantityKg * i.pricePerKg, 0);

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
      <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm font-bold text-[#B8562D] cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> Continue shopping
      </button>

      <h1 className="font-headline font-bold text-2xl text-[#1A1C18] flex items-center gap-2">
        <ShoppingCart className="w-6 h-6 text-[#B8562D]" /> My Cart
      </h1>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-[#DCD6C8] space-y-3">
          <ShoppingCart className="w-10 h-10 text-[#1A1C18]/30 mx-auto" />
          <p className="text-sm text-[#1A1C18]/60">Your cart is empty.</p>
          <button type="button" onClick={onBack} className="bg-[#B8562D] text-white text-sm font-bold px-5 py-2 rounded-xl cursor-pointer">
            Browse fresh produce
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <ul className="lg:col-span-2 bg-white rounded-2xl border border-[#DCD6C8] divide-y divide-[#EBE7DC]">
            {items.map((item) => (
              <li key={item.listingId} className="p-4 flex gap-4">
                <img src={item.imageUrl} alt={item.cropName} className="w-20 h-20 rounded-xl object-cover bg-[#EBE7DC] shrink-0" />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-[#1A1C18] truncate">{item.cropName}</h3>
                      <p className="text-xs text-[#1A1C18]/60 truncate">{item.variety}</p>
                    </div>
                    <button type="button" onClick={() => onRemove(item.listingId)} className="text-[#B8562D] cursor-pointer p-1" aria-label={`Remove ${item.cropName}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-[#1A1C18]/60 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {item.farmerName} · {item.location}
                  </p>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center border border-[#DCD6C8] rounded-lg">
                      <button type="button" onClick={() => onChangeQty(item.listingId, item.quantityKg - 1)} disabled={item.quantityKg <= 1}
                        className="p-1.5 cursor-pointer disabled:opacity-30" aria-label="Decrease quantity">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-sm font-bold">{item.quantityKg} kg</span>
                      <button type="button" onClick={() => onChangeQty(item.listingId, item.quantityKg + 1)} disabled={item.quantityKg >= item.maxKg}
                        className="p-1.5 cursor-pointer disabled:opacity-30" aria-label="Increase quantity">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-[#1A1C18]/60">₹{item.pricePerKg}/kg</div>
                      <div className="font-bold text-[#1A1C18]">₹{(item.quantityKg * item.pricePerKg).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="bg-white rounded-2xl border border-[#DCD6C8] p-5 space-y-3 h-fit">
            <h2 className="font-bold text-[#1A1C18]">Order Summary</h2>
            <div className="flex justify-between text-sm">
              <span className="text-[#1A1C18]/70">Items ({items.length})</span>
              <span className="font-semibold">₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#1A1C18]/70">Delivery</span>
              <span className="font-semibold text-[#3F6B3A]">Free</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-[#EBE7DC]">
              <span className="font-bold">Total</span>
              <span className="font-headline font-bold text-xl text-[#B8562D]">₹{subtotal.toLocaleString()}</span>
            </div>
            <button type="button" onClick={onCheckout}
              className="w-full bg-[#B8562D] hover:bg-[#9E4823] text-white font-bold py-3 rounded-xl cursor-pointer">
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
