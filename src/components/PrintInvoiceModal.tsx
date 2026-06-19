import React from "react";
import { createPortal } from "react-dom";
import { X, Printer, CheckCircle, Clock, AlertCircle, FileText, Landmark, ShieldCheck } from "lucide-react";
import { Booking, StudioDetails } from "../types.js";
// @ts-ignore
import mdLogoImg from "../assets/images/logo.jpeg";

interface PrintInvoiceModalProps {
  booking: Booking;
  studioDetails: StudioDetails | null;
  currentUser: { username: string; email: string; phone: string } | null;
  onClose: () => void;
}

export default function PrintInvoiceModal({
  booking,
  studioDetails,
  currentUser,
  onClose
}: PrintInvoiceModalProps) {
  const total = booking.total_price;
  const advanceAmount = Math.round(total * 0.20);
  const shootAmount = Math.round(total * 0.70);
  const finalAmount = total - advanceAmount - shootAmount;

  // Track paid milestones
  const isAdvancePaid = booking.payment_status !== "pending";
  const isShootPaid = ["90_percent_paid", "fully_paid"].includes(booking.payment_status);
  const isFinalPaid = booking.payment_status === "fully_paid";

  const totalPaid = (isFinalPaid ? total : (isShootPaid ? (advanceAmount + shootAmount) : (isAdvancePaid ? advanceAmount : 0)));
  const balanceOutstanding = total - totalPaid;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const invoiceIssueDate = formattedDate(booking.created_at || new Date().toISOString());

  // Invoice view content (Reused for screen Modal and the portal-based Print Node)
  // Standard highly readable black text on high contrast paper white background for pristine printing results!
  const InvoiceBody = ({ isForPrint }: { isForPrint: boolean }) => (
    <div className={`p-6 md:p-8 space-y-8 bg-white text-slate-900 ${isForPrint ? "text-slate-900 leading-normal" : "text-slate-800"}`}>
      {/* 1. Brand Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6 text-left">
        <div className="flex items-center gap-4">
          {mdLogoImg && (
            <img 
              src={mdLogoImg} 
              alt="MD Logo" 
              className="h-14 w-28 object-cover rounded border border-slate-200 bg-[#041C32] shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          )}
          <div>
            <div className="text-lg font-black tracking-wider text-slate-900 mb-1 flex items-center gap-1.5 font-sans">
              {studioDetails?.name || "MD Photography Studio"}
            </div>
            <p className="text-xs text-slate-500 font-medium italic">{studioDetails?.tagline || "Your Premiere Cinematic Photographers"}</p>
          </div>
        </div>

        <div className="text-left md:text-right shrink-0">
          <span className="inline-block text-[10px] font-black tracking-widest bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full uppercase mb-2">
            Official Tax Invoice
          </span>
          <p className="text-xs font-black text-slate-900">INVOICE NO: <span className="font-mono text-amber-600">#INV-2026-{(booking.id * 73 + 1243)}</span></p>
          <p className="text-[10px] text-slate-400 mt-0.5">Issue Date: {invoiceIssueDate}</p>
        </div>
      </div>

      {/* 2. Addresses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-left">
        <div>
          <h5 className="font-bold text-slate-400 uppercase tracking-widest text-[9px] mb-2 font-mono">FROM (CREATIVE PARTNER)</h5>
          <div className="space-y-1">
            <p className="font-black text-slate-800">{studioDetails?.name || "MD Photography Studio"}</p>
            <p className="text-slate-505 whitespace-pre-wrap leading-relaxed">{studioDetails?.address || "Studio Head Office, Ameerpet, Hyderabad"}</p>
            <p className="text-slate-500">📞 {studioDetails?.mobile || "+91 9177112000"}</p>
            <p className="text-slate-500">✉️ {studioDetails?.email || "contact@mdphotography.com"}</p>
          </div>
        </div>

        <div>
          <h5 className="font-bold text-slate-400 uppercase tracking-widest text-[9px] mb-2 font-mono">TO (VALUED CLIENT)</h5>
          <div className="space-y-1">
            <p className="font-black text-slate-800 capitalize">{booking.username || currentUser?.username || "Guest Client"}</p>
            <p className="text-slate-505">✉️ {booking.email || currentUser?.email || "N/A"}</p>
            <p className="text-slate-505">📞 {booking.phone || currentUser?.phone || "N/A"}</p>
            <p className="text-xs text-slate-400 italic">Loyalty Member Registered</p>
          </div>
        </div>
      </div>

      {/* 3. Event Summary Grid */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-left">
        <div>
          <span className="text-slate-450 block mb-0.5 text-[9px] uppercase font-bold">Booking Status</span>
          <span className="font-black text-emerald-600 flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5 inline text-emerald-550" />
            Confirmed Shoot
          </span>
        </div>
        <div>
          <span className="text-slate-450 block mb-0.5 text-[9px] uppercase font-bold">Shoot / Event Date</span>
          <span className="font-black text-slate-800">{formattedDate(booking.event_date)}</span>
        </div>
        <div>
          <span className="text-slate-450 block mb-0.5 text-[9px] uppercase font-bold">Category</span>
          <span className="font-black text-slate-800 capitalize">{booking.event_name}</span>
        </div>
        <div>
          <span className="text-slate-450 block mb-0.5 text-[9px] uppercase font-bold">Event Venue Location</span>
          <span className="font-black text-slate-800 truncate block text-left" title={booking.event_location}>{booking.event_location}</span>
        </div>
      </div>

      {/* 4. Table Inclusions */}
      <div className="space-y-2 text-left">
        <h5 className="font-bold text-slate-400 uppercase tracking-widest text-[9px] font-mono">BILLABLE INCLUSIONS & EQUIPMENT ADDONS</h5>
        
        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-55 text-slate-505 border-b border-slate-100 font-mono text-[10px]">
                <th className="p-3 w-10">SR.</th>
                <th className="p-3">ITEM DESCRIPTION & PARAMETERS</th>
                <th className="p-3 text-right">QUANTITY</th>
                <th className="p-3 text-right">UNIT PRICE</th>
                <th className="p-3 text-right">SUBTOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {/* Package Selection */}
              {booking.package_name && (
                <tr className="font-semibold text-slate-800 bg-white">
                  <td className="p-3 font-mono text-slate-400">01</td>
                  <td className="p-3">
                    <p className="font-black text-slate-900">{booking.package_name}</p>
                    <p className="text-[10px] text-slate-500 font-medium">Standard Creative Package Coverage</p>
                  </td>
                  <td className="p-3 text-right font-mono">1</td>
                  <td className="p-3 text-right font-mono">₹{booking.package_price?.toLocaleString("en-IN")}</td>
                  <td className="p-3 text-right font-semibold font-mono text-slate-900">₹{booking.package_price?.toLocaleString("en-IN")}</td>
                </tr>
              )}

              {/* Extra Equipments */}
              {booking.equipments && booking.equipments.map((eq, i) => (
                <tr key={i} className="text-slate-700 bg-white">
                  <td className="p-3 font-mono text-slate-400">{String(i + (booking.package_name ? 2 : 1)).padStart(2, "0")}</td>
                  <td className="p-3">
                    <p className="font-bold text-slate-800">{eq.equipment_name}</p>
                    <p className="text-[10px] text-slate-500">Additional premium equipment addition</p>
                  </td>
                  <td className="p-3 text-right font-mono">1</td>
                  <td className="p-3 text-right font-mono">₹{eq.price.toLocaleString("en-IN")}</td>
                  <td className="p-3 text-right font-mono text-slate-900">₹{eq.price.toLocaleString("en-IN")}</td>
                </tr>
              ))}

              {(!booking.package_name && (!booking.equipments || booking.equipments.length === 0)) && (
                <tr className="bg-white">
                  <td colSpan={5} className="p-4 text-center text-slate-400 italic">No inclusions recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Pricing Recap */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-t border-slate-100 pt-6 text-left">
        {/* Left Terms Column */}
        <div className="text-[10px] text-slate-450 space-y-1.5 max-w-sm">
          <p className="font-black text-slate-500 uppercase tracking-wider font-mono">PAYMENT WORKFLOW TERMS</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>20% Advance Booking Fee locked to reserve specific event slot date.</li>
            <li>70% Stage Payment due on completion of the primary event shoot day.</li>
            <li>10% Outstanding balance cleared upon final digital album and material handover.</li>
            <li>Payments are processed securely via secure local banking partners.</li>
            <li>Album must should be taken before due date we are not responsible for your data after due date.</li>
            <li>No refund is issued once slot was confirmed.</li>
            <li>Delivery Time: Raw photos (within 3 days), Edited Album & Films (within 30-45 days).</li>
            <li>Soft Copies: All raw and edited images via Cloud Link/Hard Drive.</li>
          </ul>
        </div>

        {/* Right Totals Col */}
        <div className="w-full md:w-80 text-xs space-y-2 text-slate-600 shrink-0 font-sans">
          <div className="flex justify-between font-medium">
            <span>Inclusions Subtotal:</span>
            <span className="font-mono text-slate-800">₹{booking.subtotal.toLocaleString("en-IN")}</span>
          </div>

          {booking.discount > 0 && (
            <div className="flex justify-between font-medium text-emerald-600">
              <span>Points Discount Redeemed:</span>
              <span className="font-mono">-₹{booking.discount.toLocaleString("en-IN")}</span>
            </div>
          )}

          <div className="flex justify-between font-medium">
            <span>Taxes & Cess (0% SGST/CGST):</span>
            <span className="font-mono text-slate-400">₹0</span>
          </div>

          <div className="flex justify-between font-black text-base text-slate-900 border-t border-dashed border-slate-200 pt-2 bg-slate-50 px-2.5 py-1.5 rounded-xl">
            <span>GRAND PROJECT TOTAL:</span>
            <span className="font-mono text-[#002B5B]">₹{total.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* 6. Milestone tracking breakdown logs */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4 text-xs text-left">
        <h6 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] font-mono flex items-center gap-1">
          <Landmark className="h-4 w-4 text-slate-500" />
          Milestone Payments Schedule Ledger
        </h6>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-3 rounded-xl border ${isAdvancePaid ? "bg-emerald-50 border-emerald-200" : "bg-slate-100 border-slate-200"}`}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-[10px]">1. 20% ADVANCE BOOKING</span>
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${isAdvancePaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {isAdvancePaid ? "Paid ✓" : "Pending"}
              </span>
            </div>
            <p className="font-mono font-bold text-slate-800">₹{advanceAmount.toLocaleString("en-IN")}</p>
          </div>

          <div className={`p-3 rounded-xl border ${isShootPaid ? "bg-emerald-50 border-emerald-200" : "bg-slate-100 border-slate-200"}`}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-[10px]">2. 70% POST SHOOT EVENT</span>
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${isShootPaid ? "bg-emerald-100 text-emerald-700" : "bg-slate-205 text-slate-600"}`}>
                {isShootPaid ? "Paid ✓" : "Outstanding"}
              </span>
            </div>
            <p className="font-mono font-bold text-slate-800">₹{shootAmount.toLocaleString("en-IN")}</p>
          </div>

          <div className={`p-3 rounded-xl border ${isFinalPaid ? "bg-emerald-50 border-emerald-200" : "bg-slate-100 border-slate-200"}`}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-[10px]">3. 10% ALBUM HANDOVER</span>
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${isFinalPaid ? "bg-emerald-100 text-emerald-700" : "bg-slate-205 text-slate-600"}`}>
                {isFinalPaid ? "Paid ✓" : "Outstanding"}
              </span>
            </div>
            <p className="font-mono font-bold text-slate-800">₹{finalAmount.toLocaleString("en-IN")}</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-2 gap-2 text-[11px] font-semibold border-t border-slate-100">
          <div className="flex items-center gap-1 text-slate-500">
            <span>Total Cleared Funds:</span>
            <span className="font-mono text-slate-800 font-bold">₹{totalPaid.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <span>Net Remaining Balance:</span>
            <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg">₹{balanceOutstanding.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* 7. Signatures footer */}
      <div className="flex justify-between items-end pt-12 text-[10px] text-slate-400">
        <div className="text-left space-y-1">
          <div className="h-10 flex items-center justify-start text-emerald-600 gap-1 font-mono text-[9px] font-black border border-dashed border-emerald-100 bg-emerald-50/50 px-3 py-1 rounded-xl">
            <ShieldCheck className="h-3.5 w-3.5 inline text-emerald-505" />
            SECURED STAMP BY {studioDetails?.name?.toUpperCase() || "MD PHOTOGRAPHY"}
          </div>
          <p className="border-t border-slate-200 w-36 pt-1 font-mono uppercase tracking-widest text-[8px]">ISSUING AUTHORITY</p>
        </div>

        <div className="text-right space-y-1">
          <div className="h-10"></div>
          <p className="border-t border-slate-200 w-36 ml-auto pt-1 font-mono uppercase tracking-widest text-[8px]">PHOTOGRAPHER SIGNATURE</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* A. DIGITAL POPUP SCREEN OVERLAY PREVIEW */}
      <div className="fixed inset-0 bg-[#041C32]/70 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
        <div className="bg-footer-dark rounded-3xl w-full max-w-4xl shadow-2xl border border-luxury-gold/25 overflow-hidden relative filter animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header Action bar inside popup */}
          <div className="bg-deep-navy px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-white border-b border-luxury-gold/15">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#F4D03F]" />
              <div className="text-left">
                <h4 id="invoice_modal_title" className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">MD Tax & Installment Invoice</h4>
                <p className="text-[10px] text-zinc-300 font-semibold mt-0.5 animate-pulse-glow">Review, print or download PDF ledger for booking #{booking.id}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              <button
                id="btn_invoice_print_now"
                onClick={handlePrint}
                className="bg-luxury-gold text-deep-navy hover:bg-soft-gold font-black text-[10px] uppercase tracking-widest px-4.5 py-2.5 rounded-xl inline-flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-md"
              >
                <Printer className="h-3.5 w-3.5 stroke-[2.5]" />
                Print / Save PDF
              </button>

              <button
                id="btn_invoice_close"
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white hover:bg-deep-navy border border-luxury-gold/20 rounded-xl transition-all cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Modal scroll area */}
          <div className="max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
            <InvoiceBody isForPrint={false} />
          </div>
        </div>
      </div>

      {/* B. DEDICATED DOM NODE AT BODY LEVEL EXCLUSIVELY SHOWN TO PRINTERS */}
      {createPortal(
        <div id="print-service-invoice" className="absolute top-0 left-0 w-full bg-white print:block">
          <InvoiceBody isForPrint={true} />
        </div>,
        document.body
      )}
    </>
  );
}
