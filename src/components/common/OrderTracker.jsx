import React from 'react';
import { Check, ClipboardCheck, Package, Truck, Home, XCircle, Clock } from 'lucide-react';

// Order flow controlled by the farmer. `status` values are stored on the order document.
export const ORDER_STEPS = [
  { status: 'Accepted', label: 'Order Processed', action: 'Accept Order', Icon: ClipboardCheck },
  { status: 'Shipped', label: 'Order Shipped', action: 'Mark as Shipped', Icon: Package },
  { status: 'Out for Delivery', label: 'Order In Route', action: 'Mark as In Route', Icon: Truck },
  { status: 'Delivered', label: 'Order Arrived', action: 'Mark as Arrived', Icon: Home },
];

// -1 = waiting for the farmer to accept
export const stepIndex = (status) => ORDER_STEPS.findIndex((s) => s.status === status);
export const nextStep = (status) => ORDER_STEPS[stepIndex(status) + 1] || null;

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';

export function OrderTracker({ order }) {
  const current = stepIndex(order.status);
  const times = order.statusTimes || {};

  if (order.status === 'Rejected') {
    return (
      <div className="flex items-center gap-2 text-sm font-semibold text-[#B8562D] bg-[#FCEEE7] rounded-xl p-3">
        <XCircle className="w-5 h-5" /> Order declined by the farmer
        {order.paymentStatus === 'paid' && <span className="font-normal">· refund will be processed</span>}
      </div>
    );
  }

  return (
    <div className="bg-[#F4F1E8] rounded-xl p-4 sm:p-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="font-bold text-sm text-[#1A1C18]">
          ORDER <span className="text-[#B8562D] font-mono">#{order.id.slice(-8).toUpperCase()}</span>
        </div>
        <div className="text-right text-xs text-[#1A1C18]/70">
          {current < 0 ? (
            <span className="flex items-center gap-1 font-semibold text-[#B8562D]"><Clock className="w-3.5 h-3.5" /> Waiting for farmer to accept</span>
          ) : (
            <>Last update: <strong className="text-[#1A1C18]">{fmt(times[order.status] || order.updatedAt)}</strong></>
          )}
          {order.paymentId && <div>Payment <strong className="text-[#1A1C18] font-mono">{order.paymentId}</strong></div>}
        </div>
      </div>

      {/* progress line with one dot per step */}
      <div className="relative mx-3 sm:mx-6">
        <div className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 rounded-full bg-[#DCD6C8]" />
        <div
          className="absolute top-1/2 left-0 h-1.5 -translate-y-1/2 rounded-full bg-[#3F6B3A] transition-all"
          style={{ width: `${(Math.max(current, 0) / (ORDER_STEPS.length - 1)) * 100}%` }}
        />
        <div className="relative flex justify-between">
          {ORDER_STEPS.map((step, i) => (
            <div
              key={step.status}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-4 ${
                i <= current ? 'bg-[#3F6B3A] border-[#3F6B3A] text-white' : 'bg-white border-[#DCD6C8]'
              }`}
            >
              {i <= current && <Check className="w-4 h-4" strokeWidth={3} />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1 sm:gap-2">
        {ORDER_STEPS.map(({ status, label, Icon }, i) => (
          <div key={status} className={`flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-2 text-center sm:text-left ${i <= current ? 'text-[#1A1C18]' : 'text-[#1A1C18]/40'}`}>
            <Icon className="w-6 h-6 sm:w-8 sm:h-8 shrink-0" strokeWidth={1.5} />
            <div>
              <div className="text-[11px] sm:text-sm font-bold leading-tight">{label}</div>
              {times[status] && <div className="text-[10px] text-[#1A1C18]/60">{fmt(times[status])}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
