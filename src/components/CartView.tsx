import React, { useState } from "react";
import { Package, Equipment, Service } from "../types.js";
import { Calendar, MapPin, Receipt, Sparkles, ShoppingBag, Trash2, Check, Edit2 } from "lucide-react";

interface CartViewProps {
  draftEvent: { name: string; date: string; location: string };
  selectedPackage: Package | null;
  selectedEquipments: Equipment[];
  userPoints: number;
  onClearCart: () => void;
  onCheckout: (redeemPoints: boolean) => void;
  isLoading: boolean;
  services?: Service[];
  onUpdateEventDetails?: (details: { name: string; date: string; location: string }) => void;
  onEditTab?: (tab: "packages" | "equipments") => void;
}

export default function CartView({
  draftEvent,
  selectedPackage,
  selectedEquipments,
  userPoints,
  onClearCart,
  onCheckout,
  isLoading,
  services = [],
  onUpdateEventDetails,
  onEditTab
}: CartViewProps) {
  const [redeem, setRedeem] = useState(false);
  const [tempCartName, setTempCartName] = useState(draftEvent.name || "");
  const [tempCartDate, setTempCartDate] = useState(draftEvent.date || "");
  const [tempCartLocation, setTempCartLocation] = useState(draftEvent.location || "");
  const [showDirectDetailsForm, setShowDirectDetailsForm] = useState(false);

  // Sync temp state when draftEvent changes
  React.useEffect(() => {
    if (draftEvent.name) setTempCartName(draftEvent.name);
    if (draftEvent.date) setTempCartDate(draftEvent.date);
    if (draftEvent.location) setTempCartLocation(draftEvent.location);
  }, [draftEvent]);

  // Core Pricing Calculation & Duplicate Deduplication
  const packageEquipmentNames = new Set<string>();
  if (selectedPackage) {
    selectedPackage.items.forEach((item) => {
      packageEquipmentNames.add(item.equipment_name.toLowerCase());
    });
  }

  // Check if there's a base service matching the event name
  const matchedService = services.find(s => s.name.toLowerCase() === draftEvent.name.toLowerCase());
  const serviceBasePrice = matchedService ? matchedService.starting_price : 0;

  let subtotal = 0;
  let packagePrice = 0;

  if (selectedPackage) {
    packagePrice = selectedPackage.price;
    subtotal += selectedPackage.price;
  } else if (serviceBasePrice > 0) {
    subtotal += serviceBasePrice;
  }

  // Determine which other equipments are billed extra (non-duplicate)
  const extraEquipmentsPaid = selectedEquipments.filter((eq) => {
    if (!selectedPackage) return true;
    // Check if equipment name is contained in the package inclusions
    return !Array.from(packageEquipmentNames).some(name => 
      eq.name.toLowerCase().includes(name) || 
      name.includes(eq.name.toLowerCase())
    );
  });

  const duplicateEquipmentsOmitted = selectedEquipments.filter((eq) => {
    if (!selectedPackage) return false;
    return Array.from(packageEquipmentNames).some(name => 
      eq.name.toLowerCase().includes(name) || 
      name.includes(eq.name.toLowerCase())
    );
  });

  const extraEquipmentsTotal = extraEquipmentsPaid.reduce((sum, item) => sum + item.price, 0);
  subtotal += extraEquipmentsTotal;

  // Rewards: discounts up to 5% with points
  const maxDiscountAvailable = Math.floor(subtotal * 0.05);
  const discountApplied = redeem ? Math.min(userPoints, maxDiscountAvailable) : 0;

  const total = subtotal - discountApplied;

  const handleCheckoutClick = () => {
    onCheckout(redeem);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-scale-in text-left">
      {/* Draft Event & Selected Items Column */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Event Details Badge */}
        <div className="bg-footer-dark/80 border border-luxury-gold/15 p-6 rounded-3xl backdrop-blur-md shadow-xl text-left">
          <div className="flex justify-between items-center">
            <h4 className="text-base font-black text-[#D4AF37] flex items-center gap-2 uppercase tracking-wide font-display">
              <Calendar className="h-5 w-5 text-[#F4D03F]" />
              Event Summary Draft
            </h4>
            <button
              onClick={onClearCart}
              className="text-xs text-red-400 hover:text-red-300 font-extrabold uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Reset Draft
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-luxury-gold/10 pt-4">
            <div>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Event Name</p>
              <p className="text-sm font-black text-white uppercase tracking-wide mt-1">
                {draftEvent.name || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Requested Date</p>
              <p className="text-sm font-black text-soft-gold mt-1">
                {draftEvent.date || "Not Selected"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Shoot Location</p>
              <p className="text-sm font-black text-white mt-1 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-luxury-gold shrink-0" />
                <span className="truncate">{draftEvent.location || "N/A"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Selected Items details */}
        <div className="bg-footer-dark/80 border border-luxury-gold/15 p-6 rounded-3xl backdrop-blur-md shadow-xl text-left">
          <h4 className="text-base font-black text-[#D4AF37] flex items-center gap-2 uppercase tracking-wide font-display">
            <ShoppingBag className="h-5 w-5 text-[#F4D03F]" />
            Selected Cart Items
          </h4>

          <div className="mt-4 space-y-4">
            {/* Packages section */}
            {selectedPackage ? (
              <div className="p-4 bg-deep-navy/70 border border-luxury-gold/25 rounded-2xl">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] uppercase font-black text-[#D4AF37] bg-luxury-gold/10 border border-luxury-gold/25 px-2.5 py-1 rounded-lg">
                      Core Package Selection
                    </span>
                    <h5 className="font-black text-white uppercase tracking-wider mt-2.5">{selectedPackage.name}</h5>
                    <p className="text-[10px] text-zinc-300 mt-1 leading-relaxed font-semibold">{selectedPackage.description}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1 shrink-0">
                    <span className="font-black text-soft-gold text-sm">
                      ₹{selectedPackage.price.toLocaleString("en-IN")}
                    </span>
                    {onEditTab && (
                      <button
                        onClick={() => onEditTab("packages")}
                        className="text-[10px] text-[#D4AF37] hover:text-white bg-luxury-gold/10 border border-luxury-gold/25 px-2.5 py-1 rounded-lg font-black uppercase tracking-wide transition-colors mt-2"
                      >
                        Change Package
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : serviceBasePrice > 0 ? (
              <div className="p-4 bg-deep-navy/70 border border-luxury-gold/20 rounded-2xl">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] uppercase font-black text-soft-gold bg-luxury-gold/10 border border-luxury-gold/20 px-2.5 py-1 rounded-lg">
                      Base Event Starting Rate
                    </span>
                    <h5 className="font-black text-white uppercase tracking-wider mt-2.5">{draftEvent.name}</h5>
                    <p className="text-[10px] text-zinc-350 mt-1 leading-relaxed font-semibold">Standard service starting portfolio pricing</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1 shrink-0">
                    <span className="font-black text-soft-gold text-sm">
                      ₹{serviceBasePrice.toLocaleString("en-IN")}
                    </span>
                    {onEditTab && (
                      <button
                        onClick={() => onEditTab("packages")}
                        className="text-[10px] text-[#D4AF37] hover:text-white bg-luxury-gold/10 border border-luxury-gold/25 px-2.5 py-1 rounded-lg font-black uppercase tracking-wide transition-colors mt-2"
                      >
                        Select Bundle Pack
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 border border-luxury-gold/15 border-dashed rounded-2xl text-center flex flex-col items-center justify-center gap-1.5 bg-deep-navy/30">
                <p className="text-xs text-zinc-300 font-extrabold uppercase">No package or base service rate selected.</p>
                {onEditTab && (
                  <button
                    onClick={() => onEditTab("packages")}
                    className="text-[10px] bg-luxury-gold text-deep-navy hover:bg-soft-gold px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider"
                  >
                    Select Package Now
                  </button>
                )}
              </div>
            )}

            {/* Equipments paid extra */}
            <div className="space-y-2">
              <div className="flex justify-between items-center border-b border-luxury-gold/10 pb-1.5">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Extra Billed Gear</p>
                {onEditTab && (
                  <button
                    onClick={() => onEditTab("equipments")}
                    className="text-[10px] text-[#D4AF37] hover:text-white font-extrabold uppercase tracking-wider"
                  >
                    Add/Change Equipment
                  </button>
                )}
              </div>
              {extraEquipmentsPaid.length > 0 ? (
                extraEquipmentsPaid.map((eq) => (
                  <div key={eq.id} className="flex justify-between items-center p-3 bg-deep-navy/40 rounded-xl border border-luxury-gold/10">
                    <div>
                      <p className="text-xs font-bold text-white">{eq.name}</p>
                      <p className="text-[9px] text-[#D4AF37] mt-0.5 uppercase tracking-wide font-black">{eq.duration}</p>
                    </div>
                    <span className="text-sm font-black text-soft-gold">
                      ₹{eq.price.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-405 font-semibold italic">No extra gear add-ons billed.</p>
              )}
            </div>

            {/* Deduplicated / Omitted Inclusions (Duplicate Prevention Log) */}
            {duplicateEquipmentsOmitted.length > 0 && (
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl text-left">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  ✓ Dynamic Deduplication Applied ({duplicateEquipmentsOmitted.length})
                </p>
                <div className="mt-2 space-y-1.5">
                  {duplicateEquipmentsOmitted.map((eq) => (
                    <div key={eq.id} className="flex justify-between text-xs text-zinc-300 font-semibold">
                      <span>{eq.name} (In Selected Package)</span>
                      <span className="line-through text-zinc-500">₹{eq.price.toLocaleString("en-IN")} (₹0)</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-emerald-400 mt-2 font-black uppercase tracking-wider">
                  Duplicate charges omitted since these accessories are already provided inside your package!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Summary Column */}
      <div className="space-y-6">
        
        {/* Loyalty points card */}
        <div className="bg-gradient-to-r from-[#041C32] to-[#0A3D62] border border-luxury-gold/30 text-white rounded-3xl p-6 text-left shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-32 h-32 bg-luxury-gold/10 rounded-full" />
          <h4 className="text-sm font-black flex items-center gap-1.5 uppercase tracking-wide text-soft-gold font-display">
            <Sparkles className="h-4 w-4" />
            Studio Loyalty Points
          </h4>
          <p className="text-3xl font-black mt-3 text-white font-display">
            {userPoints} <span className="text-xs font-black uppercase tracking-wider text-zinc-400 font-sans">Points</span>
          </p>
          <div className="border-t border-luxury-gold/10 pt-3 mt-3">
            <p className="text-[10px] text-zinc-300 leading-relaxed font-semibold">
              Earn 5% of the shoot value as points upon successful completion! Redeem points during checkout for up to a 5% discount on consecutive shoots.
            </p>
          </div>

          {userPoints > 0 && maxDiscountAvailable > 0 && (
            <div className="mt-4 flex items-center justify-between p-3 bg-deep-navy/80 border border-luxury-gold/20 rounded-xl">
              <div className="text-left">
                <p className="text-xs font-black text-white uppercase tracking-wide">Redeem rewards?</p>
                <p className="text-[10px] text-soft-gold font-semibold">Save up to ₹{maxDiscountAvailable.toLocaleString("en-IN")} right now</p>
              </div>
              <input
                type="checkbox"
                checked={redeem}
                onChange={(e) => setRedeem(e.target.checked)}
                className="h-4.5 w-4.5 accent-luxury-gold rounded cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Invoice pricing summary */}
        <div className="bg-footer-dark/80 border border-luxury-gold/15 rounded-3xl p-6 text-left shadow-xl backdrop-blur-md">
          <h4 className="text-sm font-black text-[#D4AF37] flex items-center gap-1.5 uppercase tracking-widest font-display">
            <Receipt className="h-4 w-4 text-[#F4D03F]" />
            Pricing Invoice
          </h4>

          <div className="mt-4 space-y-3.5 border-b border-luxury-gold/10 pb-4">
            {selectedPackage && (
              <div className="flex justify-between text-xs text-zinc-305 font-semibold">
                <span>{selectedPackage.name}</span>
                <span className="font-extrabold text-white">₹{packagePrice.toLocaleString("en-IN")}</span>
              </div>
            )}
            {extraEquipmentsTotal > 0 && (
              <div className="flex justify-between text-xs text-zinc-305 font-semibold">
                <span>Premium Equipment Add-ons ({extraEquipmentsPaid.length})</span>
                <span className="font-extrabold text-white">₹{extraEquipmentsTotal.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-zinc-400 font-semibold">
              <span>Subtotal</span>
              <span className="font-extrabold text-white">₹{subtotal.toLocaleString("en-IN")}</span>
            </div>

            {discountApplied > 0 && (
              <div className="flex justify-between text-xs text-emerald-400 font-bold">
                <span>Loyalty Discount Applied</span>
                <span className="font-black">-₹{discountApplied.toLocaleString("en-IN")}</span>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-black text-zinc-400 uppercase tracking-wider">Estimated Total</span>
              <span className="text-2xl font-black text-soft-gold">
                ₹{total.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Split specifications */}
            <div className="p-3 bg-deep-navy/80 border border-luxury-gold/15 rounded-2xl space-y-2 text-[10px]">
              <div className="flex justify-between font-black text-[#D4AF37] uppercase tracking-wide">
                <span>Project Booking Value</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-zinc-300 font-semibold">
                <span>20% Advance Booking Fee</span>
                <span>₹{Math.round(total * 0.20).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-zinc-300 font-semibold">
                <span>70% Post-Shoot Balance</span>
                <span>₹{Math.round(total * 0.70).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-zinc-300 font-semibold">
                <span>10% Album Delivery Balance</span>
                <span>₹{(total - Math.round(total * 0.20) - Math.round(total * 0.70)).toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Terms and conditions notice */}
            <div className="text-[10px] text-zinc-300 space-y-2 bg-deep-navy/40 p-4 rounded-2xl border border-luxury-gold/10 font-semibold leading-relaxed text-left">
              <span className="font-extrabold text-[#D4AF37] uppercase tracking-widest block text-[9px] mb-1">📋 Terms & Conditions</span>
              <ul className="list-disc pl-4 space-y-1.5 text-zinc-400">
                <li>Album must should be taken before due date we are not responsible for your data after due date.</li>
                <li>No refund is issued once slot was confirmed.</li>
                <li>20% Advance Booking Fee is locked to reserve the event date.</li>
                <li>Food & Stay: Crew food and travel/accommodation to be arranged by the client for outstation shoots</li>
                <li>Extra Hours: Any extension beyond the agreed timings will be charged at ₹ per hour</li>
                <li>Copyrights: MD Photographer reserves the right to use photos/videos for social media promotion unless specified otherwise.</li>
              </ul>
            </div>

            <button
              id="confirm-slot-booking"
              onClick={handleCheckoutClick}
              disabled={isLoading || !draftEvent.name || !draftEvent.date || !draftEvent.location}
              className="w-full py-3.5 bg-luxury-gold text-deep-navy disabled:opacity-40 rounded-2xl text-xs font-black uppercase tracking-widest shadow-md hover:bg-soft-gold hover:shadow-[0_0_15px_rgba(244,208,63,0.5)] transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer border border-luxury-gold btn-premium"
            >
              <Check className="h-4 w-4 stroke-[3]" />
              {isLoading ? "Securing Slot..." : `Confirm Slot Booking Request`}
            </button>
            
            {(!draftEvent.name || !draftEvent.date || !draftEvent.location) && (
              <div className="bg-red-950/20 border border-red-500/25 p-4 rounded-2xl text-left space-y-3">
                <p className="text-[11px] text-red-400 font-extrabold leading-relaxed">
                  ⚠️ You are missing some event details:
                  {!draftEvent.name && " • Event Name"}
                  {!draftEvent.date && " • Date"}
                  {!draftEvent.location && " • Location"}
                </p>
                
                {!showDirectDetailsForm ? (
                  <button
                    type="button"
                    onClick={() => setShowDirectDetailsForm(true)}
                    className="w-full py-2 bg-red-650 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer text-center shadow-xs"
                  >
                    Enter Details
                  </button>
                ) : (
                  <div className="space-y-2.5 pt-2 border-t border-red-500/20">
                    <p className="text-[10px] font-black uppercase text-red-400">Supply Event Information</p>
                    
                    {!draftEvent.name && (
                      <div>
                        <label className="text-[9px] uppercase font-bold text-red-400">Event Name</label>
                        <input
                          type="text"
                          value={tempCartName}
                          onChange={(e) => setTempCartName(e.target.value)}
                          placeholder="e.g. Wedding, Anniversary, Baby Shoot"
                          className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-luxury-gold/20 bg-deep-navy text-white focus:outline-none focus:border-luxury-gold"
                        />
                      </div>
                    )}

                    {!draftEvent.date && (
                      <div>
                        <label className="text-[9px] uppercase font-bold text-red-400">Requested Date</label>
                        <input
                          type="date"
                          value={tempCartDate}
                          onChange={(e) => setTempCartDate(e.target.value)}
                          className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-luxury-gold/20 bg-deep-navy text-white focus:outline-none focus:border-luxury-gold"
                        />
                      </div>
                    )}

                    {!draftEvent.location && (
                      <div>
                        <label className="text-[9px] uppercase font-bold text-red-400">Shoot Location</label>
                        <input
                          type="text"
                          value={tempCartLocation}
                          onChange={(e) => setTempCartLocation(e.target.value)}
                          placeholder="e.g. Bangalore Palace, Taj West End"
                          className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-luxury-gold/20 bg-deep-navy text-white focus:outline-none focus:border-luxury-gold"
                        />
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateEventDetails) {
                            onUpdateEventDetails({
                              name: tempCartName || draftEvent.name,
                              date: tempCartDate || draftEvent.date,
                              location: tempCartLocation || draftEvent.location
                            });
                          }
                          setShowDirectDetailsForm(false);
                        }}
                        disabled={(!draftEvent.name && !tempCartName) || (!draftEvent.date && !tempCartDate) || (!draftEvent.location && !tempCartLocation)}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer text-center"
                      >
                        Save Details
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDirectDetailsForm(false)}
                        className="py-1.5 px-3 bg-deep-navy hover:bg-[#0A3D62] text-zinc-300 font-bold text-[11px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer text-center"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
