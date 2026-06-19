import React, { useState } from "react";
import { Booking, Payment } from "../types.js";
import { CheckCircle2, CreditCard, Lock, Calendar, Check, MapPin } from "lucide-react";

interface PaymentWizardProps {
  booking: Booking;
  payments: Payment[];
  onPayStage: (stage: string, amount: number) => Promise<any>;
  onGoBack: () => void;
}

export default function PaymentWizard({
  booking,
  payments,
  onPayStage,
  onGoBack
}: PaymentWizardProps) {
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ txnId: string; amount: number; stage: string } | null>(null);

  // Billing calculation
  const total = booking.total_price;
  const advanceAmount = Math.round(total * 0.20);
  const shootAmount = Math.round(total * 0.70);
  const finalAmount = total - advanceAmount - shootAmount;

  // Determine current active payment stage
  const hasPaidAdvance = payments.some(p => p.stage === "20_percent" && p.status === "completed") || booking.payment_status !== "pending";
  const hasPaidShoot = payments.some(p => p.stage === "70_percent" && p.status === "completed") || ["90_percent_paid", "fully_paid"].includes(booking.payment_status);
  const hasPaidFinal = payments.some(p => p.stage === "10_percent" && p.status === "completed") || booking.payment_status === "fully_paid";

  let nextStage = "20_percent";
  let nextAmount = advanceAmount;
  let stageLabel = "20% Advance Booking Fee";

  if (hasPaidAdvance && !hasPaidShoot) {
    nextStage = "70_percent";
    nextAmount = shootAmount;
    stageLabel = "70% Post Wedding/Shoot Fee";
  } else if (hasPaidAdvance && hasPaidShoot && !hasPaidFinal) {
    nextStage = "10_percent";
    nextAmount = finalAmount;
    stageLabel = "10% Final Album Delivery Fee";
  }

  const handleSimulatePayment = async () => {
    setLoading(true);
    try {
      const res = await onPayStage(nextStage, nextAmount);
      setSuccessData({
        txnId: res.transaction_id,
        amount: res.amount,
        stage: res.stage
      });
    } catch (err: any) {
      alert("Payment failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-scale-in text-left">
      {/* Back link */}
      <div className="text-left">
        <button
          onClick={onGoBack}
          className="text-xs font-black uppercase tracking-widest text-[#D4AF37] hover:text-white transition-colors cursor-pointer"
        >
          ← Back to My Bookings
        </button>
      </div>

      {successData ? (
        /* Success Screen */
        <div className="bg-footer-dark border border-luxury-gold/15 p-8 rounded-3xl text-center space-y-6 shadow-2xl backdrop-blur-md">
          <div className="mx-auto bg-emerald-950/40 border border-emerald-500/20 p-4 rounded-full w-20 h-20 flex items-center justify-center text-emerald-400 shadow-lg">
            <CheckCircle2 className="h-10 w-10 stroke-[2]" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white uppercase tracking-wider font-display">Transaction Success!</h3>
            <p className="text-xs text-zinc-305 font-semibold">
              Your payment has been processed securely. Confirmation receipt delivered.
            </p>
          </div>

          {/* Receipt details */}
          <div className="bg-deep-navy/70 p-5 rounded-2xl text-left border border-luxury-gold/15 space-y-2 text-xs">
            <div className="flex justify-between font-bold">
              <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Booking Reference</span>
              <span className="font-extrabold text-white">#{booking.id}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Transaction ID</span>
              <span className="font-mono text-soft-gold font-bold">{successData.txnId}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Paid Stage</span>
              <span className="font-extrabold text-white">
                {successData.stage === "20_percent" ? "20% Advance" : successData.stage === "70_percent" ? "70% Shoot Event" : "10% Album Delivery"}
              </span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t border-luxury-gold/10">
              <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Amount Transferred</span>
              <span className="font-extrabold text-soft-gold text-sm">₹{successData.amount.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* SIMULATED WHATSAPP NOTIFICATION PREVIEW */}
          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 text-left">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-emerald-600 text-white p-1 rounded-lg">
                <Check className="h-3 w-3 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">WhatsApp Notification Delivered</span>
            </div>
            <div className="bg-deep-navy border border-luxury-gold/10 p-3 rounded-xl text-xs text-zinc-350 leading-relaxed relative">
              <p className="font-black text-white mb-1 tracking-wider uppercase text-[10px]">MD PHOTOGRAPHY AUTOMATION</p>
              <p className="font-bold text-white">📸 <strong>Booking update successful!</strong></p>
              <p className="text-zinc-405 mt-1">• <strong>Booking ID:</strong> #{booking.id}</p>
              <p className="text-zinc-405">• <strong>Event:</strong> {booking.event_name}</p>
              <p className="text-zinc-405">• <strong>Date:</strong> {booking.event_date}</p>
              <p className="text-zinc-405">• <strong>Transferred:</strong> ₹{successData.amount.toLocaleString("en-IN")}</p>
              <p className="text-zinc-405">• <strong>Status:</strong> Completed</p>
              <p className="text-[9px] text-[#A3A3A3] mt-2">Open portal to track deliveries live.</p>
              <div className="absolute right-2 bottom-1 text-[9px] text-[#A3A3A3]">Just Now ✓✓</div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setSuccessData(null);
                onGoBack();
              }}
              className="px-6 py-2.5 bg-luxury-gold hover:bg-soft-gold text-deep-navy text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-md border border-luxury-gold"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      ) : (
        /* Real interactive payment controls */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          
          {/* Order Details */}
          <div className="bg-footer-dark/80 border border-luxury-gold/15 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-6">
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-[#D4AF37] bg-luxury-gold/10 border border-luxury-gold/25 px-2.5 py-1 rounded-lg">
                Ref #{booking.id}
              </span>
              <h4 className="text-xl font-black text-white uppercase mt-4 font-display">
                {booking.event_name}
              </h4>
            </div>

            <div className="space-y-3.5 border-t border-luxury-gold/10 pt-4 text-xs font-semibold text-zinc-300">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#D4AF37]" />
                <span>Shoot Date: {booking.event_date}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#D4AF37]" />
                <span>Location: {booking.event_location}</span>
              </div>
              {booking.package_name && (
                <div className="flex justify-between pt-2">
                  <span className="text-zinc-405 mr-1.5">Selected Package:</span>
                  <span className="font-black text-soft-gold uppercase tracking-wider">{booking.package_name}</span>
                </div>
              )}
            </div>

            {/* Stages overview */}
            <div className="border-t border-luxury-gold/10 pt-4 space-y-3">
              <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest font-display">Payment Stages</p>
              
              <div className="flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all bg-deep-navy/40 border-luxury-gold/10">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${hasPaidAdvance ? "bg-emerald-500 animate-pulse" : "bg-[#F4D03F]"}`} />
                  <span className="text-white">20% Booking Confirmation</span>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded mr-1.5 font-bold uppercase tracking-wider ${hasPaidAdvance ? "bg-emerald-950/50 text-emerald-400" : "bg-luxury-gold/10 text-soft-gold border border-luxury-gold/20"}`}>
                    {hasPaidAdvance ? "Paid" : "Due"}
                  </span>
                  <span className="text-white">₹{advanceAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all bg-deep-navy/40 border-luxury-gold/10">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${hasPaidShoot ? "bg-emerald-500 animate-pulse" : "bg-zinc-550"}`} />
                  <span className="text-white">70% Post-Event Shoot</span>
                </div>
                <div className="text-right">
                   <span className={`text-[10px] px-1.5 py-0.5 rounded mr-1.5 font-bold uppercase tracking-wider ${hasPaidShoot ? "bg-emerald-950/50 text-emerald-400" : hasPaidAdvance ? "bg-luxury-gold/10 text-soft-gold border border-luxury-gold/20" : "bg-deep-navy text-zinc-500"}`}>
                    {hasPaidShoot ? "Paid" : hasPaidAdvance ? "Due" : "Locked"}
                  </span>
                  <span className="text-white">₹{shootAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all bg-deep-navy/40 border-[#F4D03F]/10">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${hasPaidFinal ? "bg-emerald-500" : "bg-zinc-550"}`} />
                  <span className="text-white">10% Album Delivery Final</span>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded mr-1.5 font-bold uppercase tracking-wider ${hasPaidFinal ? "bg-emerald-950/50 text-emerald-400" : hasPaidShoot ? "bg-luxury-gold/10 text-soft-gold border border-luxury-gold/20" : "bg-deep-navy text-zinc-500"}`}>
                    {hasPaidFinal ? "Paid" : hasPaidShoot ? "Due" : "Locked"}
                  </span>
                  <span className="text-white">₹{finalAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reference & Instructions pane */}
          <div className="bg-footer-dark/80 border border-luxury-gold/15 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-6 flex flex-col justify-between">
            <div>
              <p className="text-xs text-[#D4AF37] font-extrabold uppercase tracking-widest">Payment Reference & Guide</p>
              <h4 className="text-lg font-black text-white mt-1 uppercase tracking-wide">
                Booking Ref: <span className="text-soft-gold font-mono">#{booking.id}</span>
              </h4>
            </div>

            {hasPaidFinal ? (
              <div className="p-6 text-center bg-emerald-950/20 rounded-2xl border border-emerald-500/25 space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                <p className="text-sm font-black text-white">Fully Settled!</p>
                <p className="text-xs text-zinc-300 font-semibold">All stage payments for this booking have been fully approved and recorded by the studio.</p>
              </div>
            ) : (
              <div className="space-y-4 bg-deep-navy/60 border border-luxury-gold/15 p-5 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-[#D4AF37] tracking-wider">How to Settle Stage Fee</p>
                <p className="text-[11px] text-zinc-300 leading-relaxed font-semibold">
                  Direct online credit card payment option has been removed. To clear your current stage fee 
                  (<span className="font-bold text-white">{stageLabel}</span>) of <span className="font-bold text-soft-gold">₹{nextAmount.toLocaleString("en-IN")}</span>, 
                  please complete the payment offline or manually (via UPI, cash, or bank transfer) and share your booking reference <span className="font-mono text-soft-gold font-black text-xs">#{booking.id}</span> with the admin.
                </p>
                
                <div className="pt-2 border-t border-luxury-gold/10">
                  <p className="text-[9px] text-[#A3A3A3] font-bold uppercase tracking-widest">Cashier Coordination</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const text = `Hello MD Photography! I need to settle the stage payment for booking Reference: #${booking.id}.\n\n📅 Event: ${booking.event_name}\n📌 Stage: ${stageLabel}\n💰 Amount Due: ₹${nextAmount.toLocaleString("en-IN")}`;
                    window.open(`https://wa.me/919177112000?text=${encodeURIComponent(text)}`, "_blank");
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider text-[10px] rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  💬 Share Reference on WhatsApp
                </button>
              </div>
            )}
            
            <div className="bg-deep-navy/40 p-4 rounded-xl border border-dashed border-luxury-gold/10 text-center">
              <span className="text-[9px] text-[#A3A3A3] font-black uppercase tracking-wider block">Manual Verification System</span>
              <p className="text-[9px] text-zinc-400 mt-1 leading-normal">
                Stage updates are logged inside the system manually by the administrator. Please preserve your reference ID #{booking.id}.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
