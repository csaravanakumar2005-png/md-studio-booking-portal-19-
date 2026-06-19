import React, { useState } from "react";
import { Service } from "../types.js";
import { Search, Calendar } from "lucide-react";

interface ServicesListProps {
  services: Service[];
  onBookSlot: (serviceName: string) => void;
  authenticated: boolean;
  onOpenLogin: () => void;
  onQuickBook?: (service: Service) => void;
}

export default function ServicesList({ services, onBookSlot, authenticated, onOpenLogin, onQuickBook }: ServicesListProps) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "wedding" | "parties" | "public">("all");
  const [sortBy, setSortBy] = useState<"name" | "price-asc" | "price-desc">("name");

  // Categorize services dynamically based on name keywords
  const getCategory = (name: string): "wedding" | "parties" | "public" => {
    const lower = name.toLowerCase();
    if (lower.includes("wedding") || lower.includes("engagement") || lower.includes("reception") || lower.includes("haldi") || lower.includes("mehendi") || lower.includes("post") || lower.includes("seemantham")) {
      return "wedding";
    }
    if (lower.includes("birthday") || lower.includes("baby") || lower.includes("naming") || lower.includes("anniversary")) {
      return "parties";
    }
    return "public";
  };

  const filteredServices = services
    .filter((s) => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory = filterType === "all" || getCategory(s.name) === filterType;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "price-asc") {
        return a.starting_price - b.starting_price;
      } else {
        return b.starting_price - a.starting_price;
      }
    });

  const handleBookClick = (service: Service) => {
    if (!authenticated) {
      alert("Please login first to book a slot.");
      onOpenLogin();
    } else {
      if (onQuickBook) {
        onQuickBook(service);
      } else {
        onBookSlot(service.name);
      }
    }
  };

  return (
    <div id="services-section" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-footer-dark/80 p-5 rounded-2xl border border-luxury-gold/15 shadow-xl backdrop-blur-md">
        <div>
          <h3 className="text-xl font-black text-[#D4AF37] flex items-center gap-2 uppercase tracking-wide font-display">
            Our Studio Specialties
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Showing {filteredServices.length} dynamic, cinematic portfolios
          </p>
        </div>

        {/* Filters and sorting */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search portfolios..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); }}
              className="pl-9 pr-4 py-2 text-xs rounded-xl border border-luxury-gold/25 bg-deep-navy text-white focus:outline-none focus:border-luxury-gold w-full sm:w-48 placeholder-zinc-500"
            />
          </div>

          {/* Category Pills (Matching Movie style Gold pill on dark background) */}
          <div className="flex bg-deep-navy p-1 rounded-xl text-[11px] font-black uppercase tracking-wider border border-luxury-gold/20">
            <button
              onClick={() => { setFilterType("all"); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterType === "all" ? "bg-luxury-gold text-deep-navy font-bold shadow-md" : "text-zinc-400 hover:text-white"}`}
            >
              All
            </button>
            <button
              onClick={() => { setFilterType("wedding"); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterType === "wedding" ? "bg-luxury-gold text-deep-navy font-bold shadow-md" : "text-zinc-400 hover:text-white"}`}
            >
              Wedding
            </button>
            <button
              onClick={() => { setFilterType("parties"); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterType === "parties" ? "bg-luxury-gold text-deep-navy font-bold shadow-md" : "text-zinc-400 hover:text-white"}`}
            >
              Socials
            </button>
            <button
              onClick={() => { setFilterType("public"); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterType === "public" ? "bg-luxury-gold text-deep-navy font-bold shadow-md" : "text-zinc-400 hover:text-white"}`}
            >
              Ads
            </button>
          </div>

          {/* Sort Menu */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl border border-luxury-gold/25 bg-deep-navy text-white focus:outline-none focus:border-luxury-gold cursor-pointer"
          >
            <option value="name" className="bg-deep-navy">Sort: Name (A-Z)</option>
            <option value="price-asc" className="bg-deep-navy">Sort: Rate (Low to High)</option>
            <option value="price-desc" className="bg-deep-navy">Sort: Rate (High to Low)</option>
          </select>
        </div>
      </div>

      {filteredServices.length === 0 ? (
        <div className="text-center py-12 bg-footer-dark/40 rounded-3xl border border-dashed border-luxury-gold/20">
          <p className="text-sm text-zinc-400 font-semibold">No portfolios found matching your search. Try broadening your terms!</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                id={`service-card-${service.id}`}
                className="group flex flex-col bg-footer-dark/95 rounded-3xl overflow-hidden border border-luxury-gold/15 hover:border-luxury-gold/55 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] transition-all text-left duration-300 transform hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-deep-navy">
                  <img
                    src={service.image_url}
                    alt={service.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-luxury-gold text-deep-navy px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-md">
                    {getCategory(service.name)}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-grow">
                  <h4 className="text-base font-black text-white uppercase tracking-wide group-hover:text-soft-gold transition-colors font-display">
                    {service.name}
                  </h4>
                  <p className="text-xs text-zinc-300 mt-2 line-clamp-3 leading-relaxed flex-grow font-semibold">
                    {service.description}
                  </p>
                  
                  <div className="border-t border-luxury-gold/10 pt-4 mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">Starting from</span>
                      <p className="text-sm font-black text-soft-gold">
                        ₹{service.starting_price.toLocaleString("en-IN")}
                      </p>
                    </div>

                    <button
                      id={`btn-book-service-${service.id}`}
                      onClick={() => handleBookClick(service)}
                      className="px-4 py-2 bg-luxury-gold text-deep-navy font-black text-xs uppercase tracking-wider rounded-xl hover:bg-soft-gold hover:shadow-[0_0_12px_rgba(244,208,63,0.4)] transition-all flex items-center gap-1.5 cursor-pointer shadow-md btn-premium"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
