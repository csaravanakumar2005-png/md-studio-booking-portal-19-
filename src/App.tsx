import React, { useState, useEffect } from "react";
import { api } from "./api.js";
import { User, Admin, Service, Equipment, Package, Booking, GalleryImage, StudioDetails } from "./types.js";
import ServicesList from "./components/ServicesList.js";
import EquipmentsList from "./components/EquipmentsList.js";
import PackagesList from "./components/PackagesList.js";
import CartView from "./components/CartView.js";
import PaymentWizard from "./components/PaymentWizard.js";
import ContactUs from "./components/ContactUs.js";
import Benefits from "./components/Benefits.js";
import AdminPanelMain from "./components/AdminPanelMain.js";
import PrintInvoiceModal from "./components/PrintInvoiceModal.js";
import { MDLogo } from "./components/MDLogo.js";
// @ts-ignore
import mdLogoImg from "./assets/images/logo.jpg";

// Lucide Icons
import { 
  Camera, Calendar, Compass, ShoppingCart, MessageSquare, Phone,
  User as UserIcon, LogOut, Sun, Moon, ArrowRight, Award, 
  MapPin, NotebookPen, FileSpreadsheet, Lock, AlertCircle, Sparkles, Check,
  FileText, Printer, ChevronDown, X, Star
} from "lucide-react";

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register" | "admin">("login");
  
  // Forgot Password States
  const [isForgotPass, setIsForgotPass] = useState<boolean>(false);
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState("");
  const [forgotInfoMessage, setForgotInfoMessage] = useState("");

  // Login/Register Form inputs
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Global static tables from SQLite
  const [services, setServices] = useState<Service[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [studioDetails, setStudioDetails] = useState<StudioDetails | null>(null);

  // User Dashboard Tabs
  // "home" (Services catalog + gallery grid), "book_slot", "equipments", "packages", "cart", "payments", "benefits", "contact"
  const [userTab, setUserTab] = useState<"home" | "book_slot" | "equipments" | "packages" | "cart" | "payments" | "benefits" | "contact" | "profile">("home");

  // Booking Builder states
  const [bookingEvent, setBookingEvent] = useState({ name: "Wedding", date: "", location: "" });
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<number[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  
  // Active Invoice Checkout Payment state
  const [checkoutBooking, setCheckoutBooking] = useState<Booking | null>(null);
  const [bookingPayments, setBookingPayments] = useState<any[]>([]);

  // Editing Profile Avatar state
  const [editProfileMode, setEditProfileMode] = useState(false);
  const [userFormName, setUserFormName] = useState("");
  const [userFormPhone, setUserFormPhone] = useState("");

  // Loader flags
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Showcases State (modals)
  const [isServicesShowcaseOpen, setIsServicesShowcaseOpen] = useState(false);
  const [isEquipmentsShowcaseOpen, setIsEquipmentsShowcaseOpen] = useState(false);
  const [isPackagesShowcaseOpen, setIsPackagesShowcaseOpen] = useState(false);
  
  // Custom dropdown select on book event screen
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);

  // Quick Book configuration states
  const [quickBookTarget, setQuickBookTarget] = useState<{
    type: "service" | "equipment" | "package";
    id: number | null;
    name: string;
    price: number;
  } | null>(null);

  const [quickBookEventName, setQuickBookEventName] = useState("");
  const [quickBookEventDate, setQuickBookEventDate] = useState("");
  const [quickBookEventLocation, setQuickBookEventLocation] = useState("");

  const handleQuickBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBookTarget) return;

    let finalEventName = quickBookEventName;
    if (quickBookTarget.type === "service") {
      finalEventName = quickBookTarget.name;
    }

    if (!finalEventName || !quickBookEventDate || !quickBookEventLocation) {
      alert("Please enter all details correctly to continue!");
      return;
    }

    setIsActionLoading(true);
    try {
      const updatedEvent = {
        name: finalEventName,
        date: quickBookEventDate,
        location: quickBookEventLocation
      };
      
      setBookingEvent(updatedEvent);

      let currentSelectedPackageId = selectedPackageId;
      let currentSelectedEquipmentIds = [...selectedEquipmentIds];

      if (quickBookTarget.type === "package") {
        currentSelectedPackageId = quickBookTarget.id;
        setSelectedPackageId(quickBookTarget.id);
      } else if (quickBookTarget.type === "equipment") {
        const eqId = quickBookTarget.id!;
        if (!currentSelectedEquipmentIds.includes(eqId)) {
          currentSelectedEquipmentIds.push(eqId);
          setSelectedEquipmentIds(currentSelectedEquipmentIds);
        }
      }

      await api.saveCart({
        event_name: updatedEvent.name,
        event_date: updatedEvent.date,
        event_location: updatedEvent.location,
        package_id: currentSelectedPackageId,
        equipment_ids: currentSelectedEquipmentIds
      });

      setQuickBookTarget(null);
      
      // Close any drawers
      setIsServicesShowcaseOpen(false);
      setIsEquipmentsShowcaseOpen(false);
      setIsPackagesShowcaseOpen(false);

      // Redirect straight to Cart tab
      setUserTab("cart");
    } catch (err: any) {
      alert("Error booking item: " + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Sync token auth on mount
  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem("studio_token");
      if (token) {
        try {
          const res = await api.me();
          if ("points" in res.user) {
            setCurrentUser(res.user as User);
            setUserFormName(res.user.username);
            setUserFormPhone(res.user.phone);
          } else {
            setCurrentAdmin(res.user as Admin);
          }
        } catch (err) {
          localStorage.removeItem("studio_token");
        }
      }
      setIsAuthLoading(false);
    }
    checkAuth();
  }, []);

  // Fetch initial branding & catalogs
  useEffect(() => {
    async function fetchCatalogs() {
      try {
        const [d, s, e, p, g] = await Promise.all([
          api.getStudioDetails(),
          api.getServices(),
          api.getEquipments(),
          api.getPackages(),
          api.getGallery()
        ]);
        setStudioDetails(d);
        setServices(s);
        setEquipments(e);
        setPackages(p);
        setGallery(g);
      } catch (err) {
        console.error("Error loaded catalogs:", err);
      }
    }
    fetchCatalogs();
  }, [currentUser, currentAdmin]);

  // Sync Global Theme
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const handleLogout = () => {
    localStorage.removeItem("studio_token");
    setCurrentUser(null);
    setCurrentAdmin(null);
    setSelectedEquipmentIds([]);
    setSelectedPackageId(null);
    setBookingEvent({ name: "Wedding", date: "", location: "" });
    setCheckoutBooking(null);
    setUserTab("home");
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsActionLoading(true);

    try {
      if (authMode === "admin") {
        const res = await api.loginAdmin({ email, password });
        localStorage.setItem("studio_token", res.token);
        setCurrentAdmin(res.admin);
        setAuthError("");
      } else if (authMode === "login") {
        const res = await api.login({ email, password });
        localStorage.setItem("studio_token", res.token);
        setCurrentUser(res.user);
        setUserFormName(res.user.username);
        setUserFormPhone(res.user.phone);
        setUserTab("home");
      } else {
        // Register field checks
        if (password !== confirmPassword) {
          throw new Error("Password and confirm password do not match!");
        }
        if (password.length < 8) {
          throw new Error("Password must remain at least 8 characters long.");
        }
        const res = await api.register({ username, email, phone, password });
        localStorage.setItem("studio_token", res.token);
        setCurrentUser(res.user);
        setUserFormName(res.user.username);
        setUserFormPhone(res.user.phone);
        setUserTab("home");
      }
      
      // Clean form inputs
      setUsername("");
      setEmail("");
      setPhone("");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setAuthError(err.message || "An unexpected error occurred during auth.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsActionLoading(true);
    setForgotSuccessMessage("");
    setForgotInfoMessage("");

    try {
      const res = await api.requestPasswordRetrieval(forgotIdentifier);
      setForgotSuccessMessage(res.message);
      setForgotInfoMessage(res.info || "");
      setForgotIdentifier("");
    } catch (err: any) {
      setAuthError(err.message || "Failed to submit password retrieval request.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Profiles update handler
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      const res = await api.updateProfile({ username: userFormName, phone: userFormPhone });
      setCurrentUser(res.user);
      setEditProfileMode(false);
      alert("Profile details updated cleanly!");
    } catch (err: any) {
      alert("Fail modify profiles: " + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Cart draft trigger to booking slot flow
  const handleSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingEvent.name || !bookingEvent.date || !bookingEvent.location) {
      alert("Please fill in event specification details fully!");
      return;
    }

    setIsActionLoading(true);
    try {
      // Opt-in automatic save draft to backend sqlite cart
      await api.saveCart({
        event_name: bookingEvent.name,
        event_date: bookingEvent.date,
        event_location: bookingEvent.location,
        package_id: selectedPackageId,
        equipment_ids: selectedEquipmentIds
      });

      // Advance to selection sub-tab
      setUserTab("equipments");
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleEquipment = (id: number) => {
    setSelectedEquipmentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectPackage = (id: number | null) => {
    setSelectedPackageId(id);
    // OPTIONALLY save cart changes dynamically
    api.saveCart({
      event_name: bookingEvent.name,
      event_date: bookingEvent.date,
      event_location: bookingEvent.location,
      package_id: id,
      equipment_ids: selectedEquipmentIds
    }).catch(console.error);
  };

  const handleClearCart = async () => {
    setIsActionLoading(true);
    try {
      await api.clearCart();
      setSelectedEquipmentIds([]);
      setSelectedPackageId(null);
      setBookingEvent({ name: "Wedding", date: "", location: "" });
      setUserTab("home");
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Final confirmation to generate invoice in database
  const handleCheckoutFinal = async (redeemPoints: boolean) => {
    setIsActionLoading(true);
    try {
      const res = await api.checkout({
        event_name: bookingEvent.name,
        event_date: bookingEvent.date,
        event_location: bookingEvent.location,
        package_id: selectedPackageId,
        equipment_ids: selectedEquipmentIds,
        redeem_points: redeemPoints
      });

      // Clear layout draft cart in backend
      await api.clearCart();

      // Retrieve full hydrated Booking object to transition to payment stage
      const freshBooking = await api.getBookingDetails(res.bookingId);
      setCheckoutBooking(freshBooking);
      setBookingPayments(freshBooking.payments || []);

      // Clean local selectors
      setSelectedEquipmentIds([]);
      setSelectedPackageId(null);
      setBookingEvent({ name: "Wedding", date: "", location: "" });

      // Refresh current user info to reflect points deduction
      try {
        const ures = await api.me();
        if (ures && ures.user) {
          setCurrentUser(ures.user);
        }
      } catch (meErr) {
        console.error("Could not refresh active user stats:", meErr);
      }

      // Open My Bookings tab directly!
      setUserTab("profile");
    } catch (err: any) {
      alert("Checkout error: " + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Payment triggers inside wizard
  const handlePayStageTrigger = async (stage: string, amount: number) => {
    if (!checkoutBooking) return;
    const res = await api.makePayment({
      booking_id: checkoutBooking.id,
      amount,
      stage
    });

    // Refetch booking detail updates
    const updated = await api.getBookingDetails(checkoutBooking.id);
    setCheckoutBooking(updated);
    setBookingPayments(updated.payments || []);

    // Refresh client rewards profile
    api.me().then((r) => {
      if ("points" in r.user) {
        setCurrentUser(r.user as User);
      }
    }).catch(console.error);

    return res;
  };

  // Open pay wizard for former listings
  const handleResumeBookingPayment = async (b: Booking) => {
    setIsActionLoading(true);
    try {
      const details = await api.getBookingDetails(b.id);
      setCheckoutBooking(details);
      setBookingPayments(details.payments || []);
      setUserTab("payments");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Loader component
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-100">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto" />
          <p className="text-sm">Initiating MD Photography Booking Platform...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: ADMIN PORTAL PORTAL
  // ==========================================
  if (currentAdmin) {
    return <AdminPanelMain onLogout={handleLogout} />;
  }

  // ==========================================
  // VIEW: AUTHENTICATION SCREEN FOR NON-LOGGED
  // ==========================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-grad-navy flex flex-col justify-center items-center p-4 relative font-sans antialiased selection:bg-luxury-gold selection:text-deep-navy">
        {/* Decorative ambient gold background glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-luxury-gold/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-soft-gold/5 rounded-full blur-3xl pointer-events-none" />

        {/* Theme and Admin helper controls */}
        <div className="absolute top-4 right-4 flex gap-2 z-20">
          <button
            id="theme_toggle_btn"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2.5 bg-deep-navy border border-luxury-gold/20 hover:border-luxury-gold/80 rounded-xl transition-all text-[#D4AF37] cursor-pointer shadow-md"
          >
            {theme === "dark" ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-soft-gold" />}
          </button>
        </div>

        <div className="w-full max-w-4xl bg-deep-navy rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[580px] border border-luxury-gold/20 relative z-10">
          {/* Left Column: Premium Cinematic Banner with elegant Deep Navy / Gold theme */}
          <div className="md:w-5/12 bg-footer-dark text-white p-8 flex flex-col justify-between shrink-0 text-left border-r border-[#D4AF37]/20">
            <div className="space-y-4 flex flex-col items-center text-center">
              <span className="bg-luxury-gold/10 border border-luxury-gold/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#F4D03F]">
                PRO STUDIO PORTFOLIO
              </span>
              <div className="w-full bg-deep-navy/30 backdrop-blur-md rounded-2xl border border-luxury-gold/10 py-4 shadow-xl">
                <MDLogo />
              </div>
            </div>

            <div className="space-y-5 my-6">
              <div className="flex gap-3 items-start">
                <div className="p-2.5 bg-deep-navy border border-luxury-gold/30 rounded-xl h-10 w-10 flex items-center justify-center shrink-0">
                  <Camera className="h-5 w-5 text-[#F4D03F]" />
                </div>
                <div>
                  <h5 className="font-extrabold text-xs text-[#D4AF37] uppercase tracking-wider">Premium Photography</h5>
                  <p className="text-[10px] text-zinc-300 mt-1 leading-relaxed">Capture life's precious moments with extreme clarity, high frame-rates and pro cameras.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-2.5 bg-deep-navy border border-luxury-gold/30 rounded-xl h-10 w-10 flex items-center justify-center shrink-0">
                  <Compass className="h-5 w-5 text-[#F4D03F]" />
                </div>
                <div>
                  <h5 className="font-extrabold text-xs text-[#D4AF37] uppercase tracking-wider">Cinematic Videography</h5>
                  <p className="text-[10px] text-zinc-300 mt-1 leading-relaxed">Drone sweeps, premium traditional videos, steadicams & real-time LED streams.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-2.5 bg-deep-navy border border-luxury-gold/30 rounded-xl h-10 w-10 flex items-center justify-center shrink-0">
                  <Award className="h-5 w-5 text-[#F4D03F]" />
                </div>
                <div>
                  <h5 className="font-extrabold text-xs text-[#D4AF37] uppercase tracking-wider">Special Packages</h5>
                  <p className="text-[10px] text-zinc-300 mt-1 leading-relaxed">Luxury wedding bundles & custom traditional event deals with physical albums.</p>
                </div>
              </div>
            </div>

            <p className="italic text-[10px] text-light-gray/40 font-medium border-t border-[#D4AF37]/10 pt-4 text-center">
              "Your memories, our cinema."
            </p>
          </div>

          {/* Right Column: Interaction Form */}
          <div className="md:w-7/12 bg-deep-navy p-8 md:p-10 flex flex-col justify-center text-left border-l border-luxury-gold/15">
            <div className="mb-4">
              <h3 className="text-2xl font-black text-white tracking-tight uppercase">
                {isForgotPass ? "Password Recovery Hub" : authMode === "admin" ? "Admin Access Gate" : authMode === "login" ? "Welcome Back" : "Create Your Account"}
              </h3>
              <p className="text-zinc-400 text-xs mt-1">
                {isForgotPass ? "Submit a secure verification request to retrieve your account." : authMode === "admin" ? "Authorized personnel exclusive access portal." : authMode === "login" ? "Login to book slots and manage orders." : "Sign up to book events with MD Photography."}
              </p>
            </div>

            {/* Custom Tab Track Selector (Matching Movie style Gold pill on black) */}
            {!isForgotPass && (
              <div className="flex bg-footer-dark p-1 rounded-xl mb-6 max-w-[280px] border border-luxury-gold/20">
                <button
                  type="button"
                  onClick={() => { setAuthMode("register"); setAuthError(""); }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${authMode === "register" ? "bg-luxury-gold text-deep-navy shadow-md font-bold" : "text-zinc-400 hover:text-white"}`}
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode("login"); setAuthError(""); }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${authMode === "login" ? "bg-luxury-gold text-deep-navy shadow-md font-bold" : "text-zinc-400 hover:text-white"}`}
                >
                  Login
                </button>
              </div>
            )}

            {isForgotPass ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 text-xs font-bold text-zinc-300">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest">Registered Email or Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-luxury-gold/20 bg-footer-dark text-white placeholder-zinc-500 focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold text-xs"
                    placeholder="e.g. user@gmail.com or +91 XXXXX XXXXX"
                  />
                </div>

                {authError && (
                  <div className="p-3 bg-rose-950/40 border border-rose-500/20 text-rose-300 rounded-xl text-[11px] flex items-center gap-1.5 font-semibold font-sans">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    <span>{authError}</span>
                  </div>
                )}

                {forgotSuccessMessage && (
                  <div className="p-4 bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs space-y-1 font-sans">
                    <p className="font-extrabold flex items-center gap-1.5 text-emerald-400 uppercase tracking-wider text-[10px]">
                      <Check className="h-4 w-4 shrink-0" />
                      Recovery Request Logged
                    </p>
                    <p className="text-[11px] font-medium leading-relaxed text-zinc-300">{forgotSuccessMessage}</p>
                    {forgotInfoMessage && (
                      <p className="text-[10px] italic pt-1.5 border-t border-emerald-800/40 text-emerald-400 font-bold leading-normal">
                        💡 Note: {forgotInfoMessage}
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="w-full py-3 bg-luxury-gold text-deep-navy font-black rounded-xl transition-all shadow-lg hover:shadow-[0_0_15px_rgba(244,208,63,0.4)] hover:bg-soft-gold flex items-center justify-center gap-1.5 cursor-pointer mt-4 uppercase tracking-widest text-[11px] btn-premium border border-luxury-gold"
                >
                  <span>{isActionLoading ? "Submitting Request..." : "Request Password Retrieval"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                <div className="mt-5 border-t border-luxury-gold/10 pt-4 text-center">
                  <button
                    type="button"
                    onClick={() => { setIsForgotPass(false); setAuthError(""); setForgotSuccessMessage(""); setForgotInfoMessage(""); }}
                    className="text-[11px] text-[#D4AF37] font-extrabold hover:text-soft-gold uppercase tracking-wider cursor-pointer bg-transparent border-0"
                  >
                    ← Back to Standard Client Login Gate
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs font-bold text-zinc-300">
                {authMode === "register" && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest">Full Name</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-luxury-gold/20 bg-footer-dark text-white placeholder-zinc-500 focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold text-xs"
                      placeholder="Enter portrait profile username"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-luxury-gold/20 bg-footer-dark text-white placeholder-zinc-500 focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold text-xs"
                    placeholder="you@example.com"
                  />
                </div>

                {authMode === "register" && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest">Mobile Number</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-luxury-gold/20 bg-footer-dark text-white placeholder-zinc-500 focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold text-xs"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center pr-1 select-none">
                    <label className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest">Password</label>
                    {authMode === "login" && (
                      <button
                        type="button"
                        onClick={() => { setIsForgotPass(true); setAuthError(""); setForgotSuccessMessage(""); setForgotInfoMessage(""); }}
                        className="text-[10px] text-[#D4AF37] hover:text-soft-gold transition-colors uppercase tracking-wider font-extrabold cursor-pointer border-0 bg-transparent"
                      >
                        forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-luxury-gold/20 bg-footer-dark text-white placeholder-zinc-500 focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold text-xs"
                    placeholder="••••••••"
                  />
                </div>

                {authMode === "register" && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest">Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-luxury-gold/20 bg-footer-dark text-white placeholder-zinc-500 focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold text-xs"
                      placeholder="••••••••"
                    />
                  </div>
                )}

                {authError && (
                  <div className="p-3 bg-rose-950/40 border border-rose-500/20 text-rose-300 rounded-xl text-[11px] flex items-center gap-1.5 font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="w-full py-3 bg-luxury-gold text-deep-navy font-black rounded-xl transition-all shadow-lg hover:shadow-[0_0_15px_rgba(244,208,63,0.4)] hover:bg-soft-gold flex items-center justify-center gap-1.5 cursor-pointer mt-4 uppercase tracking-widest text-[11px] btn-premium border border-luxury-gold"
                >
                  <span>{isActionLoading ? "Authenticating..." : authMode === "admin" ? "Access Gate" : authMode === "login" ? "Login" : "Sign Up"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            )}

            {!isForgotPass && (
              <div className="mt-5 border-t border-luxury-gold/10 pt-4 flex flex-col sm:flex-row justify-between items-center text-[11px] text-zinc-400 gap-2 font-black">
                {authMode === "login" ? (
                  <>
                    <button type="button" onClick={() => { setAuthMode("register"); setAuthError(""); }} className="hover:text-soft-gold transition-colors uppercase tracking-wider cursor-pointer border-0 bg-transparent">Don't have an account? Sign up</button>
                    <button type="button" onClick={() => { setAuthMode("admin"); setAuthError(""); }} className="hover:text-[#D4AF37] transition-colors uppercase tracking-wider cursor-pointer text-[#D4AF37] border-0 bg-transparent">Administrative Portal</button>
                  </>
                ) : authMode === "register" ? (
                  <>
                    <button type="button" onClick={() => { setAuthMode("login"); setAuthError(""); }} className="hover:text-soft-gold transition-colors uppercase tracking-wider cursor-pointer border-0 bg-transparent">Already have an account? Login</button>
                    <button type="button" onClick={() => { setAuthMode("admin"); setAuthError(""); }} className="hover:text-[#D4AF37] transition-colors uppercase tracking-wider cursor-pointer text-[#D4AF37] border-0 bg-transparent">Admin access</button>
                  </>
                ) : (
                  <button type="button" onClick={() => { setAuthMode("login"); setAuthError(""); }} className="w-full text-center hover:text-soft-gold transition-colors uppercase tracking-wider cursor-pointer font-extrabold text-[#D4AF37] border-0 bg-transparent">Standard Client Login Gate</button>
                )}
              </div>
            )}

            {/* Quick credentials helper */}
            <div className="mt-4 p-3 bg-footer-dark border border-luxury-gold/20 text-[#D4AF37] rounded-xl text-[10px] font-medium space-y-1 font-mono">
              <span className="font-black text-[#F4D03F] block uppercase tracking-wider">🔑 System Access Gateways:</span>
              <p>• Admin: admin@mdphotography.com / admin123</p>
              <p>• Bookings/Client: Register dynamically to book instant slots!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: REGISTERED CLIENT USER PORTAL
  // ==========================================
  return (
    <div className={`min-h-screen bg-grad-navy text-white flex flex-col justify-between transition-colors antialiased font-sans selection:bg-luxury-gold selection:text-deep-navy`}>
      
      {/* 👤 TOP HEADER NAVIGATION PANEL (Deep Navy & Luxury Gold Elegant Theme) */}
      <header className="bg-footer-dark border-b border-luxury-gold/20 px-4 md:px-8 py-3.5 shrink-0 transition-all sticky top-0 z-40 shadow-md text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Top Left Profile info */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div 
              onClick={() => setUserTab("profile")}
              className="bg-deep-navy text-[#D4AF37] h-10 w-10 rounded-full flex items-center justify-center font-black text-sm cursor-pointer shadow-md hover:bg-[#0A3D62] transition-all shrink-0 relative border border-luxury-gold/30"
            >
              <span>{currentUser.username.charAt(0).toUpperCase()}</span>
              <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 h-3 w-3 rounded-full border-2 border-deep-navy" />
            </div>
            
            <div className="text-left font-sans">
              <p className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
                Hi, {currentUser.username} 👋
              </p>
              <button 
                onClick={() => setUserTab("profile")}
                className="text-[10px] uppercase font-black tracking-wider text-[#D4AF37] hover:text-soft-gold hover:underline block text-left"
              >
                {currentUser.points} loyal points
              </button>
            </div>
          </div>

          {/* Top Center: Studio Brand Logo details */}
          <div className="hidden md:block text-center space-y-0.5">
            <h1 className="text-sm font-black uppercase tracking-widest flex items-center justify-center gap-1.5 text-[#D4AF37]">
              <Camera className="h-4 w-4 text-[#F4D03F]" />
              {studioDetails?.name || "MD Photography Studio"}
            </h1>
            <p className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-widest">
              {studioDetails?.tagline || "Your Premiere Cinematic Photographers"}
            </p>
          </div>

          {/* Top Right Buttons controls */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end text-white">
            {/* Book Event tab buttons */}
            <button
              onClick={() => setUserTab("book_slot")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5 transition-all outline-none cursor-pointer ${userTab === "book_slot" ? "bg-luxury-gold text-deep-navy shadow-md border border-luxury-gold hover:shadow-[0_0_15px_rgba(244,208,63,0.5)]" : "bg-deep-navy border border-luxury-gold/20 text-[#D4AF37] hover:bg-[#0A3D62]"}`}
            >
              <NotebookPen className="h-3.5 w-3.5" />
              <span>Book Event</span>
            </button>

            {/* Cart indicators */}
            <button
              onClick={() => {
                if (!bookingEvent.name || !bookingEvent.date || !bookingEvent.location) {
                  setUserTab("book_slot");
                } else {
                  setUserTab("cart");
                }
              }}
              className="p-2.5 bg-deep-navy border border-luxury-gold/20 text-white rounded-full hover:bg-[#0A3D62] transition-all shrink-0 relative cursor-pointer"
              title="View Cart"
            >
              <ShoppingCart className="h-4 w-4 text-[#D4AF37]" />
              {(selectedEquipmentIds.length > 0 || selectedPackageId) && (
                <div className="absolute -top-1 -right-1 bg-luxury-gold text-deep-navy rounded-full h-4 w-4 flex items-center justify-center text-[8px] font-black shadow-xs">
                  {selectedEquipmentIds.length + (selectedPackageId ? 1 : 0)}
                </div>
              )}
            </button>

            {/* Theme switcher */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2.5 bg-deep-navy border border-luxury-gold/20 text-[#D4AF37] rounded-full hover:bg-[#0A3D62] transition-all shrink-0 cursor-pointer"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-soft-gold" />}
            </button>
          </div>
        </div>
      </header>

       {/* CORE CONTENT SWITCHING LOGS */}
      <main id="main-content-area" className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
        
        {/* Banner Section matching Cinema style */}
        {userTab === "home" && (
          <div>
            {/* Custom Large Hero Banner in premium Navy/Gold gradient */}
            <div className="bg-gradient-to-tr from-[#041C32] via-[#06283D] to-[#0A3D62] text-white p-8 md:p-12 rounded-[2.5rem] text-left relative overflow-hidden mb-8 border border-luxury-gold/20 shadow-xl">
              <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-luxury-gold/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute right-12 bottom-0 w-64 h-64 bg-soft-gold/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="space-y-4 lg:col-span-7">
                  <span className="text-[#D4AF37] text-[9px] md:text-[11px] font-black uppercase tracking-widest bg-luxury-gold/10 px-3 py-1 rounded-full border border-luxury-gold/30">
                    📸 FEATURED CREATIVE CINEMA STUDIO
                  </span>
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight mt-3 text-white uppercase font-display">MD PHOTOGRAPHY</h1>
                  <p className="text-zinc-300 text-xs md:text-sm mt-3 leading-relaxed font-semibold">
                    Capturing life's most exquisite milestones with state-of-the-art cinema rigging, prime lenses, and flawless color correction templates.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-3">
                    <button
                      onClick={() => setUserTab("book_slot")}
                      className="bg-luxury-gold text-deep-navy font-extrabold text-xs md:text-sm px-6 py-3 rounded-xl transition-all flex items-center gap-2 hover:bg-soft-gold hover:shadow-[0_0_15px_rgba(244,208,63,0.5)] cursor-pointer hover:scale-102 active:translate-y-0.5 btn-premium"
                    >
                      <NotebookPen className="h-4 w-4" />
                      Book Your Event
                    </button>
                    <button
                      onClick={() => setUserTab("profile")}
                      className="bg-deep-navy/80 hover:bg-deep-navy border border-luxury-gold/35 text-[#D4AF37] font-extrabold text-xs md:text-sm px-6 py-3 rounded-xl transition-all flex items-center gap-2 active:translate-y-0.5 cursor-pointer"
                    >
                      <Camera className="h-4 w-4" />
                      My Bookings
                    </button>
                  </div>
                </div>

                {/* Studio branding Image / Vector Render on the right side */}
                <div className="lg:col-span-5 w-full bg-deep-navy/60 rounded-3xl overflow-hidden border border-luxury-gold/15 shadow-2xl relative select-none flex items-center justify-center p-2">
                  <div className="w-full h-full bg-footer-dark/80 rounded-2xl border border-luxury-gold/10">
                    <MDLogo />
                  </div>
                </div>
              </div>
            </div>

            {/* All Services, Equipment, Packages and Chart & communication block */}
            <div className="space-y-1 text-left mb-6">
              <h3 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-wide font-display">
                <span className="w-1.5 h-6 bg-luxury-gold rounded-full inline-block animate-pulse-glow" />
                Explore Our Collections
              </h3>
              <p className="text-xs text-zinc-400 font-medium">Select premium services, browse cinema-grade lenses, choose value bundles, or connect instantly with our team.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              
              {/* Clickable Card 1: Services (Luxury Gold Glass) */}
              <div 
                onClick={() => setIsServicesShowcaseOpen(true)}
                className="bg-footer-dark/80 backdrop-blur-md border border-luxury-gold/15 hover:border-luxury-gold/60 p-6 rounded-3xl text-left cursor-pointer hover:-translate-y-1 transition-all duration-300 shadow-xl text-white hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] group"
              >
                <div className="p-2 bg-luxury-gold/10 text-[#D4AF37] rounded-2xl w-11 h-11 flex items-center justify-center mb-4 border border-luxury-gold/20 group-hover:scale-105 transition-transform">
                  <Camera className="h-6 w-6 stroke-[2]" />
                </div>
                <h5 className="font-extrabold text-sm uppercase tracking-widest text-[#D4AF37] group-hover:text-soft-gold duration-350">Services</h5>
                <p className="text-[10px] text-zinc-400 font-bold mt-1 uppercase tracking-wide">Events we cover</p>
              </div>

              {/* Clickable Card 2: Equipment (Luxury Gold Glass) */}
              <div 
                onClick={() => setIsEquipmentsShowcaseOpen(true)}
                className="bg-footer-dark/80 backdrop-blur-md border border-luxury-gold/15 hover:border-luxury-gold/60 p-6 rounded-3xl text-left cursor-pointer hover:-translate-y-1 transition-all duration-300 shadow-xl text-white hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] group"
              >
                <div className="p-2 bg-luxury-gold/10 text-[#D4AF37] rounded-2xl w-11 h-11 flex items-center justify-center mb-4 border border-luxury-gold/20 group-hover:scale-105 transition-transform">
                  <Compass className="h-6 w-6 stroke-[2]" />
                </div>
                <h5 className="font-extrabold text-sm uppercase tracking-widest text-[#D4AF37] group-hover:text-soft-gold duration-350">Equipment</h5>
                <p className="text-[10px] text-zinc-400 font-bold mt-1 uppercase tracking-wide">Pick your mix</p>
              </div>

              {/* Clickable Card 3: Packages (Luxury Gold Glass) */}
              <div 
                onClick={() => setIsPackagesShowcaseOpen(true)}
                className="bg-footer-dark/80 backdrop-blur-md border border-luxury-gold/15 hover:border-luxury-gold/60 p-6 rounded-3xl text-left cursor-pointer hover:-translate-y-1 transition-all duration-300 shadow-xl text-white hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] group"
              >
                <div className="p-2 bg-luxury-gold/10 text-[#D4AF37] rounded-2xl w-11 h-11 flex items-center justify-center mb-4 border border-luxury-gold/20 group-hover:scale-105 transition-transform">
                  <Award className="h-6 w-6 stroke-[2]" />
                </div>
                <h5 className="font-extrabold text-sm uppercase tracking-widest text-[#D4AF37] group-hover:text-soft-gold duration-350">Special Packages</h5>
                <p className="text-[10px] text-zinc-400 font-bold mt-1 uppercase tracking-wide">Bundled deals</p>
              </div>

              {/* Clickable Card 4: Chart & info (Luxury Gold Glass) */}
              <div 
                onClick={() => setIsChatOpen(true)}
                className="bg-footer-dark/80 backdrop-blur-md border border-luxury-gold/15 hover:border-luxury-gold/60 p-6 rounded-3xl text-left cursor-pointer hover:-translate-y-1 transition-all duration-300 shadow-xl text-white hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] group"
              >
                <div className="p-2 bg-luxury-gold/10 text-[#D4AF37] rounded-2xl w-11 h-11 flex items-center justify-center mb-4 border border-luxury-gold/20 group-hover:scale-105 transition-transform">
                  <MessageSquare className="h-6 w-6 stroke-[2]" />
                </div>
                <h5 className="font-extrabold text-sm uppercase tracking-widest text-[#D4AF37] group-hover:text-soft-gold duration-350">Chart & Info</h5>
                <p className="text-[10px] text-zinc-400 font-bold mt-1 uppercase tracking-wide">Talk to us</p>
              </div>

            </div>
          </div>
        )}

        {/* 1. DRAFT BOOKING FLOW SLOT */}
        {userTab === "book_slot" && (
          <div className="max-w-xl mx-auto bg-white border border-purple-100 p-8 rounded-3xl text-left shadow-2xl space-y-6 relative block">
            <div className="text-center space-y-2">
              <span className="bg-purple-50 border border-purple-150 px-3 py-1 rounded text-[10px] uppercase font-black tracking-widest text-purple-600">
                Studio Planner Gate
              </span>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-wide mt-2">Book Shooting Slot</h3>
              <p className="text-xs text-slate-500">Secure shooting slots. You will select package and equipments during consecutive steps.</p>
            </div>

            <form onSubmit={handleSlotSubmit} className="space-y-4 text-xs font-bold text-slate-700">
              <div className="space-y-2">
                <label className="text-slate-500 uppercase tracking-wider text-[10px] font-black">Shoot Event Name / Type</label>
                <input
                  type="text"
                  required
                  placeholder="Enter manual event name (e.g. Dream Wedding Shoot)"
                  value={bookingEvent.name || ""}
                  onChange={(e) => setBookingEvent({ ...bookingEvent, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-600 text-left font-sans text-xs cursor-text shadow-xs"
                />
                
                {/* Suggestions row beneath */}
                <div className="pt-1.5">
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1.5">Standard Specialties (Click to autofill)</span>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 border border-slate-100 rounded-lg bg-slate-50">
                    {services.map((ser) => (
                      <button
                        key={ser.id}
                        type="button"
                        onClick={() => setBookingEvent({ ...bookingEvent, name: ser.name })}
                        className={`text-[10px] px-2.5 py-1 uppercase rounded-lg border font-black transition-all cursor-pointer ${
                          bookingEvent.name === ser.name
                            ? "bg-purple-600 text-white border-purple-650"
                            : "bg-white border-slate-200 text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        {ser.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 uppercase tracking-wider text-[11px] font-black">Select Event Shoot Date</label>
                <input
                  type="date"
                  required
                  value={bookingEvent.date}
                  onChange={(e) => setBookingEvent({ ...bookingEvent, date: e.target.value })}
                  className="w-full px-3.5 py-3 rounded-xl border border-purple-100 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 font-medium text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 uppercase tracking-wider text-[11px] font-black">Shoot Location / Venue HQ</label>
                <input
                  type="text"
                  required
                  value={bookingEvent.location}
                  onChange={(e) => setBookingEvent({ ...bookingEvent, location: e.target.value })}
                  placeholder="e.g., Grand Palace Road, Ameerpet, Hyd"
                  className="w-full px-3.5 py-3 rounded-xl border border-purple-100 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 font-medium text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg font-black transition-all cursor-pointer text-center block uppercase tracking-widest text-[11px]"
              >
                Proceed to Equipments & Packages Selection →
              </button>
            </form>
          </div>
        )}

         {/* 2. ONLY SHOWCASE GALLERY GRID TAB (Removed Services list from home, keep only gallery) */}
         {userTab === "home" && (
           <div className="space-y-10">
             {/* STUDIO GRAPHIC GALLERY GRID (All pictures loaded from admin panel) */}
             <div className="border-t border-luxury-gold/15 pt-8 text-left space-y-4">
               <div className="space-y-1">
                 <h4 className="text-base font-black text-white flex items-center gap-1.5 font-display uppercase tracking-wider">
                   <Compass className="h-4.5 w-4.5 text-[#D4AF37]" />
                   Live Studio Showcase Gallery Grid
                 </h4>
                 <p className="text-xs text-zinc-400 font-semibold font-sans">Captured through extreme precision and state-of-the-art cinema rigging.</p>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {gallery.map((gal) => (
                   <div key={gal.id} className="relative group rounded-2xl overflow-hidden aspect-video bg-footer-dark border border-luxury-gold/15 shadow-md">
                     <img 
                       src={gal.image_url} 
                       alt={gal.title || ""} 
                       referrerPolicy="no-referrer"
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                     />
                     <div className="absolute inset-x-0 bottom-0 bg-slate-900/85 backdrop-blur-xs p-2 text-white text-[10px] text-left opacity-0 group-hover:opacity-100 transition-opacity">
                       <p className="font-bold text-[#D4AF37]">{gal.title || "MD Masterpiece Frame"}</p>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           </div>
         )}

        {/* 3. EQUIPMENTS LIST TAB */}
        {userTab === "equipments" && (
          <EquipmentsList
            equipments={equipments}
            selectedIds={selectedEquipmentIds}
            onToggleEquipment={handleToggleEquipment}
            onAddToCart={() => setUserTab("packages")}
            onGoBack={() => setUserTab("book_slot")}
          />
        )}

        {/* 4. PACKAGES LIST TAB */}
        {userTab === "packages" && (
          <PackagesList
            packages={packages}
            equipments={equipments}
            selectedPackageId={selectedPackageId}
            selectedEquipmentIds={selectedEquipmentIds}
            onSelectPackage={handleSelectPackage}
            onToggleEquipment={handleToggleEquipment}
            onGoToCart={() => setUserTab("cart")}
            onGoBack={() => setUserTab("equipments")}
          />
        )}

        {/* 5. INVOICED CART VIEW TAB */}
        {userTab === "cart" && (
          <CartView
            draftEvent={bookingEvent}
            selectedPackage={packages.find((p) => p.id === selectedPackageId) || null}
            selectedEquipments={equipments.filter((e) => selectedEquipmentIds.includes(e.id))}
            userPoints={currentUser.points}
            onClearCart={handleClearCart}
            onCheckout={handleCheckoutFinal}
            isLoading={isActionLoading}
            services={services}
            onUpdateEventDetails={(details) => setBookingEvent(details)}
            onEditTab={(tab) => {
              if (tab === "packages") {
                setIsPackagesShowcaseOpen(true);
              } else if (tab === "equipments") {
                setIsEquipmentsShowcaseOpen(true);
              }
            }}
          />
        )}

        {/* 6. PAYMENT SYSTEM TAB */}
        {userTab === "payments" && checkoutBooking && (
          <PaymentWizard
            booking={checkoutBooking}
            payments={bookingPayments}
            onPayStage={handlePayStageTrigger}
            onGoBack={() => setUserTab("home")}
          />
        )}

        {/* 7. REWARDS HISTORY TAB & MY BOOKINGS INDEX */}
        {userTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
            {/* Forms Profile configurations */}
            <div className="bg-white border border-purple-100 p-6 rounded-3xl space-y-6 max-h-fit shadow-sm">
              <div>
                <h4 className="text-base font-black text-slate-900">Configure Client Profile</h4>
                <p className="text-xs text-slate-500 mt-1">Update profile parameters stored across the SQLite cluster.</p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-bold text-slate-600">
                <div className="space-y-1">
                  <label className="text-slate-550">Client Username</label>
                  <input
                    type="text" required
                    value={userFormName}
                    onChange={(e) => setUserFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-slate-800 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-550">Client Phone Number</label>
                  <input
                    type="text" required
                    value={userFormPhone}
                    onChange={(e) => setUserFormPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-slate-800 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <button
                  type="submit" disabled={isActionLoading}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  {isActionLoading ? "Optimizing..." : "Update Details ✓"}
                </button>
              </form>

              {/* Reward points status */}
              <div className="bg-gradient-to-r from-purple-700 to-indigo-900 text-white p-5 rounded-2xl relative overflow-hidden shadow-md">
                <h5 className="text-xs font-black text-white uppercase tracking-widest">Rewards Loyalty Points</h5>
                <p className="text-3xl font-black mt-2">{currentUser.points} Pts</p>
                <p className="text-[10px] text-purple-100 mt-1">Discounts automatically available up to 5% off consecutive bookings!</p>
              </div>
            </div>

            {/* My Bookings timeline index */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-purple-100 p-6 rounded-3xl space-y-4 shadow-sm">
                <h4 className="text-base font-black text-slate-800">My Shoot Ledger Bookings</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <MyBookingsView onResumePayment={handleResumeBookingPayment} studioDetails={studioDetails} currentUser={currentUser} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. BENEFITS INFRASTRUCTURE GRID */}
        {userTab === "benefits" && <Benefits />}

        {/* 9. CONTACT US DETAILS MAP */}
        {userTab === "contact" && studioDetails && <ContactUs details={studioDetails} />}

      </main>

      {/* 📱 BOTTOM MOBILE RESPONSIVE NAVIGATION BAR */}
      <footer className="bg-white border-t border-luxury-gold/15 px-4 py-2.5 sticky bottom-0 z-30 shadow-md">
        <nav className="max-w-md mx-auto flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-500">
          <button
            onClick={() => setUserTab("home")}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all border ${userTab === "home" ? "text-[#D4AF37] bg-slate-900 border-luxury-gold/30 font-bold shadow-xs scale-102" : "border-transparent hover:text-slate-900"}`}
          >
            <Compass className="h-4.5 w-4.5 shrink-0" />
            <span>Home</span>
          </button>

          <button
            onClick={() => setUserTab("benefits")}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all border ${userTab === "benefits" ? "text-[#D4AF37] bg-slate-900 border-luxury-gold/30 font-bold shadow-xs scale-102" : "border-transparent hover:text-slate-900"}`}
          >
            <Award className="h-4.5 w-4.5 shrink-0" />
            <span>Benefits</span>
          </button>

          <button
            onClick={() => setUserTab("contact")}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all border ${userTab === "contact" ? "text-[#D4AF37] bg-slate-900 border-luxury-gold/30 font-bold shadow-xs scale-102" : "border-transparent hover:text-slate-900"}`}
          >
            <MessageSquare className="h-4.5 w-4.5 shrink-0" />
            <span>Contact</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-rose-500 hover:bg-rose-500/5 transition-all outline-none border border-transparent"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            <span>Logout</span>
          </button>
        </nav>
      </footer>

      {/* CHART & COMMUNICATION POPUP MODAL */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex justify-center items-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl text-left space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-105 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-indigo-600" />
                <h4 className="font-extrabold text-base text-slate-850 dark:text-white">Chart & Communication</h4>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="p-1 px-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Want to speak directly with the photographer or candid team? Use the quick contact channels below:
            </p>

            {/* Simulated Live Operator Header */}
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="bg-indigo-600 text-white h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs">
                    MD
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 h-2.5 w-2.5 rounded-full border border-white" />
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-black text-slate-800 dark:text-emerald-300">MD Support Operator</p>
                  <p className="text-[9px] text-[#2ebd59] font-bold">● Active Online</p>
                </div>
              </div>
              <span className="text-[9px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-md">Avg Reply: 2 Min</span>
            </div>

            {/* Active click triggers */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => alert("Simulating Voice Calling standard MD Photography HQ hotline support: +91 91511 23456")}
                className="py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all outline-none"
              >
                <Phone className="h-4 w-4 text-indigo-605" />
                <span className="text-[10px] font-black text-slate-800 dark:text-slate-200">Call Photographer</span>
              </button>
              <button 
                onClick={() => {
                  const presetMsg = encodeURIComponent("Hi MD Photography! I want to confirm my wedding candid slot booking.");
                  window.open(`https://wa.me/919151123456?text=${presetMsg}`, "_blank");
                }}
                className="py-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/15 dark:hover:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/40 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all outline-none"
              >
                <MessageSquare className="h-4 w-4 text-emerald-600" />
                <span className="text-[10px] font-black text-slate-850 dark:text-slate-200">WhatsApp Chat</span>
              </button>
            </div>

            {/* Live custom message simulator input */}
            <div className="space-y-1.5 border-t border-slate-120 dark:border-slate-800 pt-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-bold">Instant Live Inquiry</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ask about photography rates, lens mix..."
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      alert("Inquiry successfully delivered to the MD Team queue! Expect a priority support callback shortly.");
                      (e.target as HTMLInputElement).value = "";
                    }
                  }}
                />
                <button 
                  onClick={() => alert("Inquiry successfully delivered to the MD Team queue! Expect a priority support callback shortly.")}
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-xl transition-all"
                >
                  Send
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 🔮 GLASSMORPHIC CABINET DRAWER: SERVICES SHOWCASE (Occupies 75% of Viewport) */}
      {isServicesShowcaseOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setIsServicesShowcaseOpen(false)}
          />
          
          {/* Slide-in Content Panel (occupies 75% of the tab width) */}
          <div className="relative w-full md:w-[75%] h-full bg-white/95 backdrop-blur-xl shadow-2xl border-l border-purple-100 flex flex-col z-10 transition-transform duration-300">
            {/* Header */}
            <div className="p-6 border-b border-purple-100 bg-white flex items-center justify-between shadow-xs">
              <div className="text-left">
                <span className="text-[10px] uppercase font-black bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md border border-purple-100 tracking-widest">
                  Official Catalogs
                </span>
                <h3 className="text-xl font-black text-slate-950 uppercase tracking-wide mt-1.5 flex items-center gap-2">
                  <Camera className="h-5 w-5 text-purple-600" />
                  Available Creative Services
                </h3>
              </div>
              <button 
                onClick={() => setIsServicesShowcaseOpen(false)}
                className="p-2 hover:bg-purple-50 text-slate-500 hover:text-purple-750 rounded-full transition-colors cursor-pointer border border-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
             {/* Scrollable List content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
              <ServicesList 
                services={services} 
                onBookSlot={(name) => {
                  setBookingEvent(prev => ({ ...prev, name }));
                  setIsServicesShowcaseOpen(false);
                  setUserTab("book_slot");
                }} 
                authenticated={true} 
                onOpenLogin={() => {}} 
                onQuickBook={(service) => {
                  setQuickBookTarget({
                    type: "service",
                    id: service.id,
                    name: service.name,
                    price: service.starting_price
                  });
                  setQuickBookEventName(service.name);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 🛠️ GLASSMORPHIC CABINET DRAWER: EQUIPMENT SHOWCASE (Occupies 75% of Viewport) */}
      {isEquipmentsShowcaseOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setIsEquipmentsShowcaseOpen(false)}
          />
          
          <div className="relative w-full md:w-[75%] h-full bg-white/95 backdrop-blur-xl shadow-2xl border-l border-purple-100 flex flex-col z-10">
            <div className="p-6 border-b border-purple-100 bg-white flex items-center justify-between shadow-xs">
              <div className="text-left">
                <span className="text-[10px] uppercase font-black bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md border border-purple-100 tracking-widest">
                  Gear Rig Inventory
                </span>
                <h3 className="text-xl font-black text-slate-950 uppercase tracking-wide mt-1.5 flex items-center gap-2">
                  <Compass className="h-5 w-5 text-purple-600" />
                  Available Shoot Equipment & Rigging
                </h3>
              </div>
              <button 
                onClick={() => setIsEquipmentsShowcaseOpen(false)}
                className="p-2 hover:bg-purple-50 text-slate-500 hover:text-purple-750 rounded-full transition-colors cursor-pointer border border-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
              <EquipmentsList
                equipments={equipments}
                selectedIds={selectedEquipmentIds}
                onToggleEquipment={handleToggleEquipment}
                onAddToCart={() => {
                  setIsEquipmentsShowcaseOpen(false);
                  setIsPackagesShowcaseOpen(true);
                }}
                onGoBack={() => {
                  setIsEquipmentsShowcaseOpen(false);
                  setUserTab("book_slot");
                }}
                onQuickBook={(eq) => {
                  setQuickBookTarget({
                    type: "equipment",
                    id: eq.id,
                    name: eq.name,
                    price: eq.price
                  });
                  setQuickBookEventName("");
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 📦 GLASSMORPHIC CABINET DRAWER: SPECIAL PACKAGES SHOWCASE (Occupies 75% of Viewport) */}
      {isPackagesShowcaseOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setIsPackagesShowcaseOpen(false)}
          />
          
          <div className="relative w-full md:w-[75%] h-full bg-white/95 backdrop-blur-xl shadow-2xl border-l border-purple-100 flex flex-col z-10">
            <div className="p-6 border-b border-purple-100 bg-white flex items-center justify-between shadow-xs">
              <div className="text-left">
                <span className="text-[10px] uppercase font-black bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md border border-purple-100 tracking-widest">
                  Curated Masterplans
                </span>
                <h3 className="text-xl font-black text-slate-950 uppercase tracking-wide mt-1.5 flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  Special Studio Bundled Packages
                </h3>
              </div>
              <button 
                onClick={() => setIsPackagesShowcaseOpen(false)}
                className="p-2 hover:bg-purple-50 text-slate-500 hover:text-purple-750 rounded-full transition-colors cursor-pointer border border-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
              <PackagesList
                packages={packages}
                equipments={equipments}
                selectedPackageId={selectedPackageId}
                selectedEquipmentIds={selectedEquipmentIds}
                onSelectPackage={handleSelectPackage}
                onToggleEquipment={handleToggleEquipment}
                onGoToCart={() => {
                  setIsPackagesShowcaseOpen(false);
                  setUserTab("cart");
                }}
                onGoBack={() => {
                  setIsPackagesShowcaseOpen(false);
                  setIsEquipmentsShowcaseOpen(true);
                }}
                onQuickBook={(pkg) => {
                  setQuickBookTarget({
                    type: "package",
                    id: pkg.id,
                    name: pkg.name,
                    price: pkg.price
                  });
                  setQuickBookEventName("");
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 🔮 QUICK BOOK LIGHTWEIGHT OVERLAY MODAL */}
      {quickBookTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setQuickBookTarget(null)}
          />
          
          <div className="relative bg-white border border-purple-150 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 z-10 text-left">
            <div>
              <span className="bg-purple-100 border border-purple-200 text-purple-700 px-2.5 py-1 rounded text-[9px] uppercase font-black tracking-widest">
                Lightning Booking Assistant
              </span>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide mt-2">
                Book {quickBookTarget.type === "service" ? "Specialty Service" : quickBookTarget.type === "package" ? "Pack Deal" : "Studio Gear"}
              </h3>
              <p className="text-xs text-slate-500 font-bold mt-1">
                You are booking <span className="font-extrabold text-blue-650">{quickBookTarget.name}</span> (₹{quickBookTarget.price.toLocaleString("en-IN")})
              </p>
            </div>

            <form onSubmit={handleQuickBookSubmit} className="space-y-4 text-xs font-bold text-slate-700">
              {quickBookTarget.type !== "service" ? (
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider text-[10px] font-black">Shoot Event Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wedding, Anniversary party"
                    value={quickBookEventName}
                    onChange={(e) => setQuickBookEventName(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-purple-100 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 text-xs font-medium"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider text-[10px] font-black">Pre-selected Cinematics Service</label>
                  <input
                    type="text"
                    disabled
                    value={quickBookTarget.name}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-100 bg-slate-100 text-slate-400 text-xs font-black uppercase cursor-not-allowed"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-500 uppercase tracking-wider text-[10px] font-black">Shoot Date</label>
                <input
                  type="date"
                  required
                  value={quickBookEventDate}
                  onChange={(e) => setQuickBookEventDate(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-purple-100 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 uppercase tracking-wider text-[10px] font-black">Shoot Venue Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hyderabad, Bangalore Palace"
                  value={quickBookEventLocation}
                  onChange={(e) => setQuickBookEventLocation(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-purple-100 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 text-xs font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg border border-purple-650 font-black transition-all cursor-pointer text-center block uppercase tracking-widest text-[11px]"
              >
                Go directly to Cart with Details →
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Client helper subcomponent to show user specific booking records
function MyBookingsView({ onResumePayment, studioDetails, currentUser }: { 
  onResumePayment: (b: Booking) => void;
  studioDetails: StudioDetails | null;
  currentUser: User | null;
}) {
  const [bList, setBList] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeInvoiceBooking, setActiveInvoiceBooking] = useState<Booking | null>(null);
  const [reviewForms, setReviewForms] = useState<Record<number, { rating: number; text: string; submitted: boolean }>>({});

  useEffect(() => {
    api.getBookings().then((res) => {
      setBList(res);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const handleReviewSubmit = async (bookingId: number, rating: number, text: string) => {
    if (!text.trim()) {
      alert("Please write a short review text first.");
      return;
    }
    try {
      await api.addReview({ booking_id: bookingId, rating, review_text: text });
      setReviewForms(prev => ({
        ...prev,
        [bookingId]: { rating, text, submitted: true }
      }));
      alert("Thank you! Your verified shoot review has been successfully registered and displayed on our Benefits page.");
    } catch (e: any) {
      alert("Failed to submit review: " + e.message);
    }
  };

  if (loading) return <p className="text-xs text-slate-500">Retrieving booking archive...</p>;
  if (bList.length === 0) return <p className="text-xs text-slate-500 italic py-4">No historical shoots or slots booked yet. Click Book Slot to get started!</p>;

  return (
    <div className="space-y-4">
      {bList.map((b) => {
        const rForm = reviewForms[b.id] || { rating: 5, text: "", submitted: false };
        return (
          <div key={b.id} className="p-4 bg-slate-50 border border-blue-50 rounded-2xl flex flex-col items-stretch gap-4">
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
              <div className="text-left space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-blue-600">#{b.id}</span>
                  <p className="text-xs font-extrabold text-slate-800 capitalize">{b.event_name}</p>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                    b.status === "confirmed" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                    b.status === "completed" ? "bg-blue-105 text-blue-800 border border-blue-200" :
                    b.status === "cancelled" ? "bg-rose-100 text-rose-800 border border-rose-200" :
                    "bg-blue-50 text-blue-700 border border-blue-100"
                  }`}>
                    {b.status === "draft" ? "Pending Confirmation" : b.status === "confirmed" ? "Confirmed Slot" : b.status}
                  </span>
                </div>

                <div className="text-[10px] text-slate-500 space-y-0.5 font-semibold">
                  <p>📅 Requested: {b.event_date}</p>
                  <p>📍 Location: {b.event_location}</p>
                  {b.package_name && <p>📦 Selection: {b.package_name} (₹{b.package_price.toLocaleString()})</p>}
                  {b.equipments && b.equipments.length > 0 && (
                    <p>⚙️ Extra inclusions: {b.equipments.map(e => e.equipment_name).join(", ")}</p>
                  )}
                </div>
              </div>

              <div className="text-right flex flex-col items-end justify-between self-stretch shrink-0 w-full md:w-auto">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-semibold">Outstanding Total</span>
                  <span className="text-sm font-black text-slate-850">₹{b.total_price.toLocaleString("en-IN")}</span>
                </div>

                {b.status === "draft" && (
                  <p className="text-[9px] text-blue-600 font-extrabold mt-2 italic bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                    ⌛ Awaiting Admin Confirmation
                  </p>
                )}

                <div className="flex flex-col gap-1.5 mt-2 w-full md:w-44">
                  {b.status !== "completed" && b.status !== "cancelled" && b.status !== "draft" && (
                    <button
                      id={`pay_stage_ref_${b.id}`}
                      onClick={() => onResumePayment(b)}
                      className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-wider rounded-lg shadow-sm focus:outline-none transition-all cursor-pointer text-center"
                    >
                      Track & Pay Stage Fee →
                    </button>
                  )}

                  {(b.status === "confirmed" || b.status === "completed") && (
                    <button
                      id={`download_invoice_ref_${b.id}`}
                      onClick={() => setActiveInvoiceBooking(b)}
                      className="w-full px-3 py-1.5 border border-slate-200 hover:border-blue-600 hover:text-blue-650 text-slate-700 font-extrabold text-[10px] rounded-lg shadow-xs focus:outline-none transition-all cursor-pointer text-center flex items-center justify-center gap-1 bg-white hover:bg-slate-50"
                    >
                      <FileText className="h-3 w-3 inline text-slate-400" />
                      Download Receipt
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Inline Review Panel for Completed Shoots */}
            {b.status === "completed" && (
              <div className="mt-2 p-4 bg-white border border-amber-300 rounded-2xl space-y-2 text-left shadow-xs">
                <p className="text-[10px] font-black uppercase text-amber-600 tracking-wider flex items-center gap-1">
                  ⭐ Verified Client Feedback & Reviews
                </p>
                {rForm.submitted ? (
                  <p className="text-[11px] text-emerald-600 font-black">
                    ✓ Feedback submitted! Your review is live on the Benefits wall.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-[10px] text-slate-500 font-medium">Please share your experience on this completed slot:</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((starVal) => (
                        <button
                          key={starVal}
                          onClick={() => setReviewForms(prev => ({
                            ...prev,
                            [b.id]: { ...(prev[b.id] || { rating: 5, text: "", submitted: false }), rating: starVal }
                          }))}
                          className="focus:outline-none cursor-pointer"
                        >
                          <Star className={`h-4 w-4 ${rForm.rating >= starVal ? "fill-amber-500 text-amber-500" : "text-slate-300"}`} />
                        </button>
                      ))}
                      <span className="text-[10px] font-black text-slate-700 ml-2">{rForm.rating} / 5 Stars</span>
                    </div>
                    <textarea
                      value={rForm.text}
                      onChange={(e) => setReviewForms(prev => ({
                        ...prev,
                        [b.id]: { ...(prev[b.id] || { rating: 5, text: "", submitted: false }), text: e.target.value }
                      }))}
                      placeholder="Loved the lighting and camera work? Write details..."
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs font-sans placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                      rows={2}
                    />
                    <button
                      onClick={() => handleReviewSubmit(b.id, rForm.rating, rForm.text)}
                      className="px-3.5 py-1.5 bg-slate-900 border border-[#D4AF37] text-[#D4AF37] hover:bg-slate-800 font-black text-[9px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                    >
                      Publish Review
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {activeInvoiceBooking && (
        <PrintInvoiceModal
          booking={activeInvoiceBooking}
          studioDetails={studioDetails}
          currentUser={currentUser}
          onClose={() => setActiveInvoiceBooking(null)}
        />
      )}
    </div>
  );
}
