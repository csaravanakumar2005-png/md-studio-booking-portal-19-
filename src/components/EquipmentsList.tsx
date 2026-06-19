import React from "react";
import { Equipment } from "../types.js";
import { Check, Info } from "lucide-react";

interface EquipmentsListProps {
  equipments: Equipment[];
  selectedIds: number[];
  onToggleEquipment: (id: number) => void;
  onAddToCart: () => void;
  onGoBack: () => void;
  onQuickBook?: (equipment: Equipment) => void;
}

export default function EquipmentsList({
  equipments,
  selectedIds,
  onToggleEquipment,
  onAddToCart,
  onGoBack,
  onQuickBook
}: EquipmentsListProps) {
  return (
    <div className="space-y-6">
      <div className="bg-footer-dark/80 p-5 rounded-2xl border border-luxury-gold/15 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl backdrop-blur-md">
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-wide font-display">
            Professional Equipment Add-ons
          </h3>
          <p className="text-xs text-zinc-300 mt-1 font-semibold">
            Build your personalized dynamic bundle. Browse prime optics and lighting setups.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onGoBack}
            className="px-4 py-2 border border-luxury-gold/25 rounded-xl text-xs font-black uppercase tracking-wider text-zinc-300 hover:text-white bg-deep-navy transition-colors cursor-pointer shadow-sm"
          >
            ← Event Draft
          </button>
          <button
            onClick={onAddToCart}
            className="px-5 py-2.5 bg-luxury-gold text-deep-navy text-xs font-black uppercase tracking-wider rounded-xl hover:bg-soft-gold hover:shadow-[0_0_15px_rgba(244,208,63,0.4)] transition-all cursor-pointer shadow-md btn-premium border border-luxury-gold"
          >
             Select Packages →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-scale-in">
        {equipments.map((eq) => {
          const isSelected = selectedIds.includes(eq.id);
          return (
            <div
              key={eq.id}
              onClick={() => onToggleEquipment(eq.id)}
              className={`group flex flex-col h-full rounded-2xl overflow-hidden border cursor-pointer transition-all duration-300 text-left ${
                isSelected
                  ? "border-luxury-gold bg-[#0A3D62]/45 shadow-xl shadow-luxury-gold/5 ring-1 ring-luxury-gold/30"
                  : "border-luxury-gold/15 bg-footer-dark hover:border-luxury-gold/50 shadow-sm"
              }`}
            >
              {/* Image Section */}
              <div className="relative h-40 bg-deep-navy overflow-hidden">
                <img
                  src={eq.image_url}
                  alt={eq.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                />
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <span className="bg-deep-navy/90 backdrop-blur-sm px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider text-[#D4AF37] border border-luxury-gold/20">
                    {eq.duration}
                  </span>
                </div>
                {isSelected && (
                  <div className="absolute inset-0 bg-luxury-gold/10 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="bg-luxury-gold p-2 rounded-full shadow-lg text-deep-navy font-bold">
                      <Check className="h-4 w-4 stroke-[3]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Text info */}
              <div className="p-4 flex flex-col flex-grow bg-footer-dark/40">
                <div className="flex items-start justify-between gap-1.5 flex-grow">
                  <div>
                    <h4 className="text-xs font-black text-[#D4AF37] uppercase tracking-wide line-clamp-1 group-hover:text-soft-gold transition-colors font-display">
                      {eq.name}
                    </h4>
                    <p className="text-[10px] text-zinc-300 mt-1 line-clamp-2 leading-relaxed font-semibold">
                      {eq.description}
                    </p>
                  </div>
                </div>

                <div className="border-t border-luxury-gold/10 pt-3 mt-3 flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-[9px] text-[#A3A3A3] font-bold tracking-wider uppercase">Standard Rate</p>
                    <p className="text-sm font-black text-soft-gold">
                      ₹{eq.price.toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="cursor-pointer h-4 w-4 accent-luxury-gold rounded"
                    />
                    <span className="text-[11px] font-extrabold text-zinc-400 select-none uppercase tracking-wider text-[10px]">
                      {isSelected ? "Selected" : "Add"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onQuickBook) onQuickBook(eq);
                  }}
                  className="mt-3 w-full py-1.5 bg-luxury-gold text-deep-navy font-extrabold text-[10px] uppercase tracking-wider rounded-lg hover:bg-soft-gold hover:shadow-[0_0_10px_rgba(244,208,63,0.4)] transition-all text-center cursor-pointer block border border-luxury-gold"
                >
                  Book Equipment
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-footer-dark border border-luxury-gold/15 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-deep-navy p-2.5 rounded-xl text-soft-gold border border-luxury-gold/20">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-black text-white uppercase tracking-wide">
              Selected: {selectedIds.length} Extra Equipment module(s)
            </p>
            <p className="text-[10px] text-zinc-300 mt-0.5 font-semibold">
              Add-ons will be combined with any selected core studio package. No duplicate charges applied!
            </p>
          </div>
        </div>

        <button
          onClick={onAddToCart}
          className="px-6 py-3 bg-luxury-gold text-deep-navy rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer hover:bg-soft-gold hover:shadow-[0_0_15px_rgba(244,208,63,0.5)] transition-all shadow-md btn-premium border border-luxury-gold"
        >
          Review Selection & Go to Packages →
        </button>
      </div>
    </div>
  );
}
