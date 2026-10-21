import React, { useState } from 'react';
import {
  ArrowLeft, Minus, Plus, ShoppingCart, Zap, MapPin, User, Calendar, Leaf, Award, Package, Phone,
  Edit3, Trash2, Send, IndianRupee, ClipboardList, Scale,
} from 'lucide-react';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

// One crop listing as a full page. mode:
//   'customer' – per-kg price, quantity picker, Add to Cart / Buy Now
//   'retailer' – per-quintal price, Place Procurement Offer
//   'farmer'   – the farmer's own listing: sales stats, its orders, Edit / Delete
export function ProductPage({
  listing, mode, moreFromFarmer = [], onOpenProduct, onBack,
  cartQty = 0, onAddToCart, onBuyNow, onPlaceOffer,
  orders = [], onEdit, onDelete,
}) {
  const [qty, setQty] = useState(1);
  const perKg = listing.pricePerKg != null;
  const price = perKg ? listing.pricePerKg : listing.pricePerQuintal;
  const unit = perKg ? 'kg' : 'quintal';
  const accent = mode === 'farmer' ? '#3F6B3A' : '#B8562D';

  // customer quantity picker (qty may be '' while typing)
  const max = Math.max(1, listing.quantityKg - cartQty);
  const clamp = (n) => Math.max(1, Math.min(Number(n) || 1, max));
  const qtyKg = clamp(qty);
  const soldOut = listing.quantityKg - cartQty <= 0;

  const available = perKg
    ? `${listing.quantityKg.toLocaleString()} kg`
    : `${(listing.quantityKg / 100).toLocaleString()} quintal (${listing.quantityKg.toLocaleString()} kg)`;
  const facts = [
    [Award, 'Quality grade', `Grade ${listing.qualityGrade}`],
    [Leaf, 'Farming', listing.isOrganic ? 'Organic' : 'Conventional'],
    [Package, 'Available', available],
    [Calendar, 'Harvested', fmtDate(listing.harvestDate)],
  ];

  const liveOrders = orders.filter((o) => o.status !== 'Rejected');
  const soldKg = liveOrders.reduce((s, o) => s + (Number(o.quantityKg) || 0), 0);
  const revenue = liveOrders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
      <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm font-bold cursor-pointer" style={{ color: accent }}>
        <ArrowLeft className="w-4 h-4" /> {mode === 'farmer' ? 'Back to my listings' : 'Back to products'}
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white rounded-2xl border border-[#DCD6C8] p-4 sm:p-6">
        <div className="relative rounded-xl overflow-hidden bg-[#EBE7DC] aspect-square">
          <img src={listing.imageUrl} alt={listing.cropName} className="w-full h-full object-cover" />
          {listing.isOrganic && (
            <span className="absolute top-3 left-3 bg-[#3F6B3A] text-white text-xs font-bold px-2.5 py-1 rounded-md">Organic</span>
          )}
        </div>

        <div className="space-y-5">
          <div>
            {mode === 'farmer' && (
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E2ECD8] text-[#3F6B3A]">
                {perKg ? 'Selling to Customers' : 'Selling to Retailers'}
              </span>
            )}
            <h1 className="font-headline font-bold text-3xl text-[#1A1C18] mt-1">{listing.cropName}</h1>
            <p className="text-sm text-[#1A1C18]/70 mt-1">{listing.variety}</p>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-headline font-bold text-3xl" style={{ color: accent }}>₹{(price ?? 0).toLocaleString()}</span>
            <span className="text-sm text-[#1A1C18]/60">per {unit}{mode === 'retailer' && ' · farmer ask price'}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {facts.map(([Icon, label, value]) => (
              <div key={label} className="bg-[#F4F1E8] rounded-xl p-3 border border-[#DCD6C8]/60">
                <div className="flex items-center gap-1.5 text-[11px] text-[#1A1C18]/60 font-semibold uppercase">
                  <Icon className="w-3.5 h-3.5" /> {label}
                </div>
                <div className="font-bold text-sm text-[#1A1C18] mt-0.5">{value}</div>
              </div>
            ))}
          </div>

          {mode === 'customer' && (soldOut ? (
            <p className="text-sm font-semibold text-[#B8562D]">All available stock is already in your cart.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">Quantity</span>
                <div className="flex items-center border border-[#DCD6C8] rounded-lg">
                  <button type="button" onClick={() => setQty(clamp(qtyKg - 1))} disabled={qtyKg <= 1} className="p-2 cursor-pointer disabled:opacity-30" aria-label="Decrease quantity">
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={max}
                    value={qty}
                    onChange={(e) => setQty(e.target.value === '' ? '' : clamp(e.target.value))}
                    onBlur={() => setQty(qtyKg)}
                    className="w-14 text-center text-sm font-bold focus:outline-hidden"
                    aria-label="Quantity in kg"
                  />
                  <button type="button" onClick={() => setQty(clamp(qtyKg + 1))} disabled={qtyKg >= max} className="p-2 cursor-pointer disabled:opacity-30" aria-label="Increase quantity">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-[#1A1C18]/60">kg</span>
                <span className="ml-auto font-bold text-[#1A1C18]">₹{(qtyKg * listing.pricePerKg).toLocaleString()}</span>
              </div>
              {cartQty > 0 && <p className="text-xs text-[#3F6B3A] font-semibold">{cartQty} kg already in your cart.</p>}
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => onAddToCart(qtyKg)}
                  className="flex items-center justify-center gap-1.5 border-2 border-[#B8562D] text-[#B8562D] font-bold py-3 rounded-xl cursor-pointer hover:bg-[#FCEEE7]">
                  <ShoppingCart className="w-4 h-4" /> Add to Cart
                </button>
                <button type="button" onClick={() => onBuyNow(qtyKg)}
                  className="flex items-center justify-center gap-1.5 bg-[#B8562D] hover:bg-[#9E4823] text-white font-bold py-3 rounded-xl cursor-pointer">
                  <Zap className="w-4 h-4" /> Buy Now
                </button>
              </div>
            </div>
          ))}

          {mode === 'retailer' && (
            <div className="space-y-2">
              <p className="text-xs text-[#1A1C18]/70">Send the farmer a bulk purchase offer with your quantity, price per quintal and delivery mandi.</p>
              <button type="button" onClick={onPlaceOffer}
                className="w-full flex items-center justify-center gap-1.5 bg-[#B8562D] hover:bg-[#9E4823] text-white font-bold py-3 rounded-xl cursor-pointer">
                <Send className="w-4 h-4" /> Place Procurement Offer
              </button>
            </div>
          )}

          {mode === 'farmer' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {[
                  [ClipboardList, 'Orders', liveOrders.length],
                  [Scale, 'Sold', `${soldKg.toLocaleString()} kg`],
                  [IndianRupee, 'Revenue', `₹${revenue.toLocaleString()}`],
                ].map(([Icon, label, value]) => (
                  <div key={label} className="rounded-xl p-3 border border-[#3F6B3A]/30 bg-[#E2ECD8]/50">
                    <div className="flex items-center gap-1 text-[11px] text-[#1A1C18]/60 font-semibold uppercase"><Icon className="w-3.5 h-3.5" /> {label}</div>
                    <div className="font-bold text-base text-[#3F6B3A] mt-0.5">{value}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={onEdit}
                  className="flex items-center justify-center gap-1.5 bg-[#3F6B3A] hover:bg-[#355B31] text-white font-bold py-3 rounded-xl cursor-pointer">
                  <Edit3 className="w-4 h-4" /> Edit listing
                </button>
                <button type="button" onClick={onDelete}
                  className="flex items-center justify-center gap-1.5 border-2 border-[#B8562D] text-[#B8562D] font-bold py-3 rounded-xl cursor-pointer hover:bg-[#FCEEE7]">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          )}

          {mode !== 'farmer' && (
            <div className="border-t border-[#EBE7DC] pt-4 space-y-1.5 text-sm">
              <h2 className="font-bold text-[#1A1C18]">Sold by</h2>
              <p className="flex items-center gap-2"><User className="w-4 h-4 text-[#3F6B3A]" /> {listing.farmerName}</p>
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#3F6B3A]" /> {listing.location}</p>
              {listing.farmerPhone && (
                <a href={`tel:${listing.farmerPhone}`} className="flex items-center gap-2 text-[#3F6B3A] font-semibold">
                  <Phone className="w-4 h-4" /> {listing.farmerPhone}
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {mode === 'farmer' && (
        <section className="space-y-3">
          <h2 className="font-headline font-bold text-lg text-[#1A1C18]">Orders for this listing</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-[#1A1C18]/60 bg-white rounded-xl border border-[#DCD6C8] p-4">No orders yet.</p>
          ) : (
            <div className="bg-white rounded-xl border border-[#DCD6C8] overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F4F1E8] text-left text-xs">
                  <tr>
                    {['Buyer', 'Quantity', 'Amount', 'Date', 'Status'].map((h) => <th key={h} className="px-4 py-2 font-semibold">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-t border-[#EBE7DC]">
                      <td className="px-4 py-2 font-semibold">{o.buyerName}</td>
                      <td className="px-4 py-2">{o.quantityKg} kg</td>
                      <td className="px-4 py-2">₹{(o.totalAmount || 0).toLocaleString()}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{fmtDate(o.orderDate)}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{o.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {moreFromFarmer.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-headline font-bold text-lg text-[#1A1C18]">
            {mode === 'farmer' ? 'Your other listings' : `More from ${listing.farmerName}`}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {moreFromFarmer.map((p) => (
              <button key={p.id} type="button" onClick={() => onOpenProduct(p.id)}
                className="text-left bg-white rounded-xl border border-[#DCD6C8] overflow-hidden hover:border-[#B8562D]/50 cursor-pointer">
                <img src={p.imageUrl} alt={p.cropName} className="w-full h-28 object-cover bg-[#EBE7DC]" />
                <div className="p-2.5">
                  <div className="font-bold text-sm truncate">{p.cropName}</div>
                  <div className="text-xs font-bold" style={{ color: accent }}>
                    {p.pricePerKg != null ? `₹${p.pricePerKg}/kg` : `₹${(p.pricePerQuintal ?? 0).toLocaleString()}/Qtl`}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
