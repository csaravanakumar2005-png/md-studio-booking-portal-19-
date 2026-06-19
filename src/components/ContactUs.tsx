import React from "react";
import { MessageSquare, Phone, MapPin, Mail, Navigation, ExternalLink, Instagram, Youtube } from "lucide-react";
import { StudioDetails } from "../types.js";

interface ContactUsProps {
  details: StudioDetails;
}

export default function ContactUs({ details }: ContactUsProps) {
  const whatsappUrl = `https://wa.me/${(details.whatsapp || "").replace(/[^0-9]/g, "")}`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left animate-scale-in">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-black text-white uppercase tracking-wide font-display">Get in Touch with MD Photography</h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto font-semibold">
          Connect with our team directly. Stop by our Renigunta location or strike an immediate chat over WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contacts details column */}
        <div className="bg-footer-dark/80 border border-luxury-gold/15 p-6 rounded-3xl space-y-6 shadow-xl backdrop-blur-md">
          <h4 className="text-sm font-black uppercase text-[#D4AF37] tracking-wider font-display">Contact Information</h4>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="bg-deep-navy border border-luxury-gold/20 text-[#D4AF37] p-2.5 rounded-xl shrink-0">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Call Studio Team</p>
                <p className="text-sm font-black text-white mt-1">{details.mobile || "+91 98765 43210"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-xl shrink-0">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">WhatsApp Channels</p>
                <p className="text-sm font-black text-white mt-1">{details.whatsapp || "+91 98765 43210"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="bg-deep-navy border border-luxury-gold/20 text-[#D4AF37] p-2.5 rounded-xl shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Official Email</p>
                <p className="text-sm font-black text-white mt-1">{details.email || "contact@mdphotography.com"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="bg-deep-navy border border-luxury-gold/20 text-[#D4AF37] p-2.5 rounded-xl shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Office Address</p>
                <p className="text-xs text-zinc-300 font-semibold leading-relaxed mt-1">{details.address || "123, Frame Lane, Hyderabad, India"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="bg-pink-950/40 border border-pink-500/20 text-pink-400 p-2.5 rounded-xl shrink-0">
                <Instagram className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Instagram</p>
                <a 
                  href="https://www.instagram.com/mdphotography.234?igsh=amVwYm12dXdtbXc2" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs font-black text-white hover:text-[#D4AF37] hover:underline mt-1 block"
                >
                  @mdphotography_official (Visual Feeds)
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="bg-rose-950/40 border border-rose-500/20 text-rose-400 p-2.5 rounded-xl shrink-0">
                <Youtube className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">YouTube Cinematic Reels</p>
                <a 
                  href="https://youtube.com/@krishnamurthy-md?si=gwxKPNJttyGhfHP2" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs font-black text-white hover:text-[#D4AF37] hover:underline mt-1 block"
                >
                  @mdphotographystudio (Cinematic Work)
                </a>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-luxury-gold/15">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              <MessageSquare className="h-4 w-4 stroke-[2]" />
              Chat With Photographer
            </a>
            <p className="text-[10px] text-zinc-400 font-semibold text-center mt-2">
              Opens WhatsApp chat directly. Real-time slot consults with professional operators.
            </p>
          </div>
        </div>

        {/* Map / Google Maps embed column */}
        <div className="bg-footer-dark/80 border border-luxury-gold/15 p-6 rounded-3xl space-y-4 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div className="text-left">
            <h4 className="text-sm font-black uppercase text-[#D4AF37] tracking-wider font-display">Google Map Location</h4>
            <p className="text-xs text-zinc-300 font-semibold mt-1">Our administrative studio and gallery workspace in Renigunta.</p>
          </div>

          {/* Interactive Map View */}
          <div className="relative h-56 bg-deep-navy rounded-2xl overflow-hidden border border-luxury-gold/15 shadow-inner">
            <iframe
              title="Google Map Place"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15509.608472417052!2d79.5041315!3d13.6332861!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a4d4950558c11b1%3A0x96946d666baaa078!2sMD%20photography%20Renigunta!5e0!3m2!1sen!2sin!4v1781772040036!5m2!1sen!2sin"
              className="w-full h-full border-0 opacity-80 filter invert-90 hue-rotate-180"
              allowFullScreen={false}
              loading="lazy"
            />
          </div>

          <a
            href={details.maps_url || "https://maps.app.goo.gl/YkEZFfxKc89KbnXt7"}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 border border-luxury-gold/25 bg-deep-navy rounded-xl text-xs font-black uppercase text-zinc-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Navigation className="h-3.5 w-3.5 text-[#F4D03F]" />
            Open in Google Maps App
            <ExternalLink className="h-3 w-3 text-zinc-400" />
          </a>
        </div>
      </div>
    </div>
  );
}
