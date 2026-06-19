import React from "react";
import { Package, Equipment } from "../types.js";
import { Check, Plus, ShoppingCart, Award, Sparkles } from "lucide-react";

interface PackagesListProps {
  packages: Package[];
  equipments: Equipment[];
  selectedPackageId: number | null;
  selectedEquipmentIds: number[];
  onSelectPackage: (id: number | null) => void;
  onToggleEquipment: (id: number) => void;
  onGoToCart: () => void;
  onGoBack: () => void;
  onQuickBook?: (pkg: Package) => void;
}

export default function PackagesList({
  packages,
  equipments,
  selectedPackageId,
  selectedEquipmentIds,
  onSelectPackage,
  onToggleEquipment,
  onGoToCart,
  onGoBack,
  onQuickBook
}: PackagesListProps) {
  
  // Find which equipment names are included in a given package's list of items
  const getPackageItemNames = (pkg: Package): string[] => {
    return pkg.items.map(item => item.equipment_name.toLowerCase());
  };

  // Check if an equipment is in a package
  const isEquipmentInPackage = (eq: Equipment, pkg: Package): boolean => {
    const includedNames = getPackageItemNames(pkg);
    return includedNames.some(name => 
      eq.name.toLowerCase().includes(name) || 
      name.includes(eq.name.toLowerCase())
    );
  };

  // Get remaining equipments (not included in the selected package)
  const getRemainingEquipments = (pkg: Package): Equipment[] => {
    return equipments.filter(eq => !isEquipmentInPackage(eq, pkg));
  };

  return (
    <div className="space-y-8 animate-scale-in">
      {/* Header section */}
      <div className="bg-footer-dark/80 p-5 rounded-2xl border border-luxury-gold/15 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl backdrop-blur-md">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-wide font-display">
            <Sparkles className="h-5 w-5 text-[#F4D03F]" />
            Core Photographic Packages
          </h3>
          <p className="text-xs text-zinc-300 mt-1 font-semibold">
            Choose exactly ONE primary pack. Additional gear that is not already covered can be added below.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onGoBack}
            className="px-4 py-2 border border-luxury-gold/20 rounded-xl text-xs font-black uppercase tracking-wider text-zinc-300 bg-deep-navy hover:text-white transition-colors cursor-pointer shadow-sm"
          >
            ← Back to Equipments
          </button>
          <button
            onClick={onGoToCart}
            className="px-5 py-2.5 bg-luxury-gold text-deep-navy text-xs font-black uppercase tracking-wider rounded-xl hover:bg-soft-gold hover:shadow-[0_0_15px_rgba(244,208,63,0.5)] transition-all cursor-pointer flex items-center gap-2 shadow-md btn-premium border border-luxury-gold"
          >
            <ShoppingCart className="h-4 w-4" />
            Proceed to Checkout →
          </button>
        </div>
      </div>

      {/* Grid of Packages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => {
          const isSelected = selectedPackageId === pkg.id;
          const remainingEquips = getRemainingEquipments(pkg);

          return (
            <div
              key={pkg.id}
              className={`flex flex-col rounded-3xl overflow-hidden border transition-all duration-300 ${
                isSelected
                  ? "border-luxury-gold bg-[#0A3D62]/45 shadow-xl shadow-luxury-gold/5 ring-1 ring-luxury-gold/30"
                  : "border-luxury-gold/10 bg-footer-dark/80 hover:border-luxury-gold/45 shadow-sm"
              }`}
            >
              {/* Header block */}
              <div className={`p-6 border-b text-left ${isSelected ? "border-luxury-gold/20 bg-deep-navy/35" : "border-luxury-gold/10"}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] uppercase font-black tracking-wider text-[#D4AF37] bg-deep-navy border border-luxury-gold/20 px-2.5 py-1 rounded-lg">
                      MD Collection
                    </span>
                    <h4 className="text-lg font-black text-[#D4AF37] uppercase tracking-wider mt-3 font-display">
                      {pkg.name}
                    </h4>
                  </div>
                  {isSelected && (
                    <span className="bg-luxury-gold px-2.5 py-1 rounded-xl text-[10px] font-black text-deep-navy uppercase tracking-wider shadow-md">
                      Selected
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-xl font-black text-soft-gold">₹</span>
                  <span className="text-3xl font-black text-soft-gold">
                    {pkg.price.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider ml-1">Lump sum</span>
                </div>
                <p className="text-[11px] text-zinc-300 mt-2 leading-relaxed font-semibold">
                  {pkg.description}
                </p>
              </div>

              {/* Items included */}
              <div className="p-6 flex-grow text-left bg-footer-dark/30">
                <span className="text-[10px] uppercase font-black text-[#D4AF37] tracking-widest block mb-1">
                  Inclusions ({pkg.items.length})
                </span>
                <ul className="mt-3 space-y-2.5">
                  {pkg.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                      <div className="bg-emerald-950/40 text-emerald-300 p-0.5 rounded-full mt-0.5 border border-emerald-500/20 shadow-sm">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <span className="font-extrabold text-white">
                        {item.quantity}x
                      </span>
                      <span className="flex-grow font-semibold text-zinc-300">
                        {item.equipment_name}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* REMAINING EQUIPMENTS MODULES */}
                <div className="border-t border-luxury-gold/10 pt-5 mt-5">
                  <span className="text-[10px] uppercase font-black text-[#D4AF37] tracking-widest block mb-1">
                    Add-ons Not In Package
                  </span>
                  <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
                    {remainingEquips.map((eq) => {
                      const isAdded = selectedEquipmentIds.includes(eq.id);
                      return (
                        <div
                          key={eq.id}
                          className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all ${
                            isAdded
                              ? "bg-[#0A3D62]/35 border-luxury-gold/45 text-soft-gold"
                              : "bg-deep-navy/55 border-luxury-gold/10 text-zinc-300"
                          }`}
                        >
                          <div className="text-left">
                            <p className="font-extrabold text-white text-[11px] line-clamp-1">{eq.name}</p>
                            <p className="text-[10px] font-black text-soft-gold mt-0.5 font-mono">₹{eq.price.toLocaleString("en-IN")}</p>
                          </div>
                          
                          <button
                            onClick={() => onToggleEquipment(eq.id)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isAdded
                                ? "bg-luxury-gold border-luxury-gold text-deep-navy"
                                : "bg-deep-navy hover:bg-[#0A3D62] text-[#D4AF37] border-luxury-gold/20"
                            }`}
                          >
                            {isAdded ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <Plus className="h-3.5 w-3.5 stroke-[3]" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action area */}
              <div className="p-4 bg-footer-dark border-t border-luxury-gold/10 flex flex-col gap-2">
                <button
                  id={`btn-select-package-${pkg.id}`}
                  onClick={() => onSelectPackage(isSelected ? null : pkg.id)}
                  className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-deep-navy text-zinc-300 hover:bg-[#0A3D62] border-luxury-gold/25"
                      : "bg-luxury-gold text-deep-navy hover:bg-soft-gold border-luxury-gold btn-premium shadow-md hover:shadow-[0_0_12px_rgba(244,208,63,0.4)]"
                  }`}
                >
                  {isSelected ? "Deselect Package" : "Select Package"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onQuickBook) onQuickBook(pkg);
                  }}
                  className="w-full py-2 bg-luxury-gold/10 hover:bg-luxury-gold/25 text-[#D4AF37] border border-luxury-gold/30 hover:border-luxury-gold rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
                >
                  Book Package
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Duplicate Prevention Notice check */}
      <div className="bg-footer-dark border border-luxury-gold/15 p-5 rounded-2xl text-left shadow-xl">
        <h5 className="text-xs font-black text-[#D4AF37] uppercase tracking-wide flex items-center gap-1.5">
          <Award className="h-4 w-4 text-emerald-400" />
          Smart Duplicate Prevention Rule
        </h5>
        <p className="text-[11px] text-zinc-300 mt-1.5 leading-relaxed font-semibold">
          If you selected individual gear before choosing a Package, any gear already included in your chosen Package is automatically deduplicated. We will only bill you for the core Package price. No double charges, guaranteed.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center bg-footer-dark p-4 rounded-2xl border border-luxury-gold/15 gap-4 shadow-xl text-white">
        <button
          onClick={() => onSelectPackage(null)}
          className="text-zinc-400 hover:text-white font-extrabold uppercase tracking-widest text-[10px] py-1 px-3 cursor-pointer"
        >
          Reset and use raw equipments only
        </button>
        <button
          onClick={onGoToCart}
          className="px-6 py-3 bg-luxury-gold text-deep-navy rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer hover:bg-soft-gold hover:shadow-[0_0_15px_rgba(244,208,63,0.5)] transition-all shadow-md btn-premium border border-luxury-gold"
        >
          Check out Cart Now →
        </button>
      </div>
    </div>
  );
}
