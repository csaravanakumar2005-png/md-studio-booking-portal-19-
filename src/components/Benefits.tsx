import React, { useState, useEffect } from "react";
import { Award, Star, ShieldCheck, Heart } from "lucide-react";
import { api } from "../api.js";

export default function Benefits() {
  const [dbReviews, setDbReviews] = useState<any[]>([]);

  useEffect(() => {
    async function loadReviews() {
      try {
        const data = await api.getReviews();
        if (data && data.length > 0) {
          setDbReviews(data);
        }
      } catch (err) {
        console.error("Error loading reviews:", err);
      }
    }
    loadReviews();
  }, []);

  const achievements = [
    { label: "15+ Years", desc: "Of high fidelity professional storytelling across India." },
    { label: "1,500+ Shoots", desc: "Successfully shot traditional & candid ceremonies." },
    { label: "100% On-Time", desc: "Guaranteed album prints and film delivery stages." },
    { label: "4.9★ Google", desc: "Top-rated premium photography crew in Renigunta." }
  ];

  const awards = [
    { title: "Best Wedding Filmmakers  (2024)", org: "Regional Artisans Association" },
    { title: "Excellence in Candid Photography (2023)", org: "Indian Photo Guild Awards" },
    { title: "Top Creative Documentary Directors (2021)", org: "National Visual Media Forum" }
  ];

  const staticReviews = [
    {
      name: "MOHANBABU",
      type: "Wedding Ceremony ",
      text: "Thank you so much Krishnamurthy bro and Team. We feel best experience with you team.",
      stars: 5
    },
    {
      name: "Venkat Rao",
      type: "Haldi & Upanayanam Shoots",
      text: "Extremely structured group. The crew arrived 30 minutes early, shot beautiful drone angles, and the website's stage payment model (paying 20% advance and 10% after actual album delivery) is very secure.",
      stars: 5
    },
    {
      name: "MOHANBABU",
      type: "New Born & Naming Ceremony",
      text: "Thank you so much Krishnamurthy bro and Team. We feel best experience with you team",
      stars: 5
    }
  ];

  const displayedReviews = dbReviews.length > 0
    ? dbReviews.map((r: any) => ({
        name: r.username || "Verified Client",
        type: r.event_name || "Completed Shoot Portfolio",
        text: r.review_text,
        stars: r.rating || 5
      }))
    : staticReviews;

  return (
    <div className="max-w-4xl mx-auto space-y-12 text-left animate-scale-in">
      {/* Hero Benefits Headline */}
      <div className="text-center space-y-2">
        <span className="text-[10px] uppercase text-[#D4AF37] font-black tracking-widest bg-luxury-gold/10 border border-luxury-gold/30 px-3 py-1.5 rounded-xl">
          Why Choose MD Photography
        </span>
        <h3 className="text-2xl font-black text-white mt-3 uppercase tracking-wide font-display">
          Capturing Memories with Perfection & Trust
        </h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto font-semibold">
          We combine cutting-edge cinema rigs, experienced wedding artists, and an honest transparent pricing platform.
        </p>
      </div>

      {/* Grid of Achievements */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {achievements.map((ach, idx) => (
          <div key={idx} className="bg-footer-dark border border-luxury-gold/15 p-5 rounded-2xl text-center shadow-lg backdrop-blur-md">
            <span className="text-2xl font-black text-[#D4AF37] block font-display">{ach.label}</span>
            <span className="text-[11px] font-semibold text-zinc-300 block mt-1.5 leading-normal">{ach.desc}</span>
          </div>
        ))}
      </div>

      {/* Experience of Photographers & Crew / Awards section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* Experience details */}
        <div className="bg-footer-dark/80 p-6 rounded-3xl border border-luxury-gold/15 space-y-4 shadow-xl backdrop-blur-md">
          <h4 className="text-sm font-black uppercase text-[#D4AF37] flex items-center gap-2 font-display">
            <ShieldCheck className="h-5 w-5 text-luxury-gold" />
            Our Creative Crew Standard
          </h4>
          <p className="text-xs text-zinc-300 leading-relaxed font-semibold">
            Every chief shooter at MD Photography brings at least 8 years of intensive wedding and event photography experience. We only operate high-end sensors guarantee incredible low-light focus and beautiful dynamic reach.
          </p>
          <div className="space-y-2 text-xs font-semibold text-zinc-400">
            <p className="flex items-center gap-2 text-[11px]"><span className="text-luxury-gold font-bold">✓</span> Advanced colorists and video mixing suites included</p>
            <p className="flex items-center gap-2 text-[11px]"><span className="text-luxury-gold font-bold">✓</span> Dynamic backups and direct cloud galleries</p>
            <p className="flex items-center gap-2 text-[11px]"><span className="text-luxury-gold font-bold">✓</span> Professional light technicians for traditional venues</p>
          </div>
        </div>

        {/* Awards */}
        <div className="bg-footer-dark/80 border border-luxury-gold/15 p-6 rounded-3xl space-y-4 shadow-xl backdrop-blur-md">
          <h4 className="text-sm font-black uppercase text-[#D4AF37] flex items-center gap-2 font-display">
            <Award className="h-5 w-5 text-luxury-gold" />
            Studio Merited Honors
          </h4>
          <div className="space-y-3.5">
            {awards.map((aw, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="bg-deep-navy border border-luxury-gold/20 p-2 rounded-lg text-luxury-gold mt-0.5">
                  <Star className="h-4 w-4 fill-luxury-gold stroke-luxury-gold" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-white">{aw.title}</p>
                  <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">{aw.org}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Reviews section */}
      <div className="space-y-4">
        <h4 className="text-sm font-black uppercase text-white flex items-center gap-1.5 font-display">
          <Heart className="h-4.5 w-4.5 text-[#D4AF37] fill-[#D4AF37]" />
          Client Sagas & Testimonials
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayedReviews.map((rev, idx) => (
            <div key={idx} className="bg-footer-dark/90 border border-luxury-gold/15 p-5 rounded-2xl flex flex-col justify-between shadow-xl backdrop-blur-md hover:border-luxury-gold/40 transition-colors">
              <p className="text-xs text-zinc-300 leading-relaxed italic font-semibold">
                "{rev.text}"
              </p>

              <div className="mt-5 border-t border-luxury-gold/10 pt-3 flex justify-between items-center">
                <div className="text-left">
                  <p className="text-xs font-bold text-white">{rev.name}</p>
                  <p className="text-[10px] text-[#D4AF37] mt-0.5">{rev.type}</p>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: rev.stars }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-luxury-gold stroke-luxury-gold" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
