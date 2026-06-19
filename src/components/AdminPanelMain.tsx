import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Service, Equipment, Package, Booking, 
  User, GalleryImage, StudioDetails, Notification as StudioNotification 
} from "../types.js";
import { api } from "../api.js";
import { 
  Users, Calendar, IndianRupee, ShieldAlert, CheckCircle2, 
  Plus, Edit, Trash2, Camera, PackageOpen, Image, HeartHandshake,
  Send, RefreshCw, Layers, Check, MessageSquare
} from "lucide-react";

interface AdminPanelMainProps {
  onLogout: () => void;
}

export default function AdminPanelMain({ onLogout }: AdminPanelMainProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "services" | "equipments" | "packages" | "gallery" | "details" | "orders" | "revenue" | "passwords" | "calendar">("dashboard");
  
  // Password retrieval management state
  const [passwordRetrievals, setPasswordRetrievals] = useState<any[]>([]);
  const [loadingRetrievals, setLoadingRetrievals] = useState<boolean>(false);
  
  // Dashboard Metrics
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Entities state
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [studioDetails, setStudioDetails] = useState<StudioDetails | null>(null);
  const [orders, setOrders] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<StudioNotification[]>([]);

  // Editing items flags
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [editingEquipmentId, setEditingEquipmentId] = useState<number | null>(null);
  const [editingPackageId, setEditingPackageId] = useState<number | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  // Creation/Editing Forms State
  const [serviceForm, setServiceForm] = useState({ name: "", starting_price: 15000, description: "", image_url: "" });
  const [equipmentForm, setEquipmentForm] = useState({ name: "", price: 20000, description: "", image_url: "", duration: "Full Event" });
  const [packageForm, setPackageForm] = useState({ name: "", price: 50000, description: "", items: [] as { equipment_name: string; quantity: number }[] });
  const [packageItemInput, setPackageItemInput] = useState({ equipment_name: "", quantity: 1 });
  const [userForm, setUserForm] = useState({ username: "", email: "", phone: "", points: 0 });
  const [studioForm, setStudioForm] = useState<Partial<StudioDetails>>({});
  const [galleryForm, setGalleryForm] = useState({ image_url: "", title: "" });
  const [notifForm, setNotifForm] = useState({ user_id: 0, title: "", message: "", type: "In-App", sent_via: "Email" });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [customPayBookingId, setCustomPayBookingId] = useState<number | null>(null);
  const [customPayAmount, setCustomPayAmount] = useState<number>(2000);
  const [customPayStage, setCustomPayStage] = useState<string>("custom");
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    resolve: (val: boolean) => void;
  } | null>(null);

  // FCM & Real-time Live Notification states
  const [fcmToken, setFcmToken] = useState<string>(localStorage.getItem("admin_fcm_token") || "");
  const [isSubscribed, setIsSubscribed] = useState<boolean>(Notification.permission === "granted");
  const [permissionBlocked, setPermissionBlocked] = useState<boolean>(Notification.permission === "denied");
  const [isInIframe, setIsInIframe] = useState<boolean>(false);
  const [missedBookings, setMissedBookings] = useState<any[]>([]);
  const [isCatchUpOpen, setIsCatchUpOpen] = useState<boolean>(false);
  const [onlineStatus, setOnlineStatus] = useState<boolean>(navigator.onLine);
  const [newRealtimeAlerts, setNewRealtimeAlerts] = useState<any[]>([]);

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch (_) {
      setIsInIframe(true);
    }
  }, []);

  // Highly robust, client-synthesized audio tone that mimics a high-tech camera shutter & chime
  // Bypasses missing file issues and executes completely natively in-browser!
  const playCustomNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playTone = (time: number, freq: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, time);
        
        gain.gain.setValueAtTime(0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(time);
        osc.stop(time + duration);
      };

      // Play double "Shutter Focus" electronic notification chime
      playTone(audioCtx.currentTime, 587.33, 0.12); // D5 chime
      playTone(audioCtx.currentTime + 0.12, 880, 0.25); // A5 chime

      // Generate soft white noise to simulate camera shutter snapping back-to-back
      const bufferSize = audioCtx.sampleRate * 0.15;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noiseSource = audioCtx.createBufferSource();
      noiseSource.buffer = buffer;
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1000;
      
      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.1, audioCtx.currentTime + 0.18);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.32);
      
      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(audioCtx.destination);
      
      noiseSource.start(audioCtx.currentTime + 0.18);
      noiseSource.stop(audioCtx.currentTime + 0.32);
    } catch (err) {
      console.warn("Client sound synthesis gesture blocked or audio init error:", err);
    }
  };

  // Request standard desktop push notifications permission and register mock/real FCM token
  const requestNotificationPermission = async () => {
    try {
      if (!("Notification" in window)) {
        triggerAlert("Notifications are not supported on this browser.");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setIsSubscribed(true);
        setPermissionBlocked(false);
        let mockToken = localStorage.getItem("admin_fcm_token");
        if (!mockToken) {
          mockToken = "fcm_dev_tok_" + Math.random().toString(36).substring(2, 12);
          localStorage.setItem("admin_fcm_token", mockToken);
        }
        setFcmToken(mockToken);
        await api.registerFcmToken(mockToken);
        triggerAlert("FCM Push Notifications enabled with Camera Shutter sound!");
        playCustomNotificationSound();
      } else {
        setPermissionBlocked(true);
        triggerAlert("Permission denied. Browsers block notification permissions inside iframes.");
      }
    } catch (err: any) {
      setPermissionBlocked(true);
      console.error("FCM Permission flow error:", err);
    }
  };

  // Load backend slots booking logs and trigger catch-up modal if logged out/reconnect
  const loadMissedBookings = async () => {
    try {
      const missed = await api.getMissedBookings();
      setMissedBookings(missed);
      if (missed.length > 0) {
        setIsCatchUpOpen(true);
        playCustomNotificationSound();
      }
    } catch (err) {
      console.error("Error loading missed bookings:", err);
    }
  };

  // Mark caught up bookings as read and clear queue
  const acknowledgeMissedBookings = async () => {
    if (missedBookings.length === 0) return;
    try {
      const logIds = missedBookings.map((b) => b.id);
      await api.markMissedBookingsRead(logIds);
      setMissedBookings([]);
      setIsCatchUpOpen(false);
      triggerAlert("Successfully caught up! Buffered notifications cleared.");
    } catch (err: any) {
      triggerAlert("Error acknowledging catch up: " + err.message);
    }
  };

  // Reconnection and online-offline state watcher
  useEffect(() => {
    const handleOnline = async () => {
      setOnlineStatus(true);
      triggerAlert("⚡ Reconnected to network. Loading buffered slot bookings...");
      await loadMissedBookings();
    };

    const handleOffline = () => {
      setOnlineStatus(false);
      triggerAlert("⚠️ Offline. Booking events will be logged and buffered securely.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check for buffered/missed bookings upon logging back in / mounting
    loadMissedBookings();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Server Sent Events (SSE) stream listener for real-time live push alerts
  useEffect(() => {
    const token = localStorage.getItem("studio_token");
    if (!token) return;

    const sseUrl = `/api/admin/notifications-stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "NEW_BOOKING") {
          const log = payload.data;
          
          // Sound effect trigger immediately!
          playCustomNotificationSound();

          // Standard system desktop push notification click trigger
          if (Notification.permission === "granted") {
            const nativeNotif = new Notification("📸 Slot Booked!", {
              body: `${log.username} booked ${log.event_name} - Price: ₹${log.total_price.toLocaleString("en-IN")}`,
              tag: "new-booking-event"
            });
            nativeNotif.onclick = () => {
              window.focus();
            };
          }

          // Push immediate client alert list
          setNewRealtimeAlerts(prev => [log, ...prev]);

          // Seamless auto-refresh of main panels stats and orders lists in the background
          loadAllData();
        }
      } catch (err) {
        console.error("SSE live parse error:", err);
      }
    };

    eventSource.onerror = () => {
      console.log("Stream offline or re-routing; offline booking engine is active.");
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const loadAllData = async () => {
    setLoadingStats(true);
    try {
      const statsRes = await api.getStats();
      setStats(statsRes);

      const [u, s, e, p, g, d, o, n] = await Promise.all([
        api.getUsers(),
        api.getServices(),
        api.getEquipments(),
        api.getPackages(),
        api.getGallery(),
        api.getStudioDetails(),
        api.getBookings(),
        api.getNotifications()
      ]);

      setUsers(u);
      setServices(s);
      setEquipments(e);
      setPackages(p);
      setGallery(g);
      setStudioDetails(d);
      setStudioForm(d);
      setOrders(o);
      setNotifications(n);

      if (u.length > 0) {
        setNotifForm(prev => ({ ...prev, user_id: u[0].id }));
      }
      
      // Load password retrievals too
      loadPasswordRetrievals();
    } catch (err: any) {
      console.error("Admin Load Error:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadPasswordRetrievals = async () => {
    setLoadingRetrievals(true);
    try {
      const records = await api.getPasswordRetrievals();
      setPasswordRetrievals(records);
    } catch (err: any) {
      console.error("Error loading password retrievals:", err);
    } finally {
      setLoadingRetrievals(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (activeTab === "passwords") {
      loadPasswordRetrievals();
    }
  }, [activeTab]);

  const triggerAlert = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  const askConfirmation = (title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        title,
        message,
        resolve: (val: boolean) => {
          setConfirmState(null);
          resolve(val);
        }
      });
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          callback(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // ==========================================
  // SERVICES HANDLERS
  // ==========================================
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingServiceId) {
        await api.updateService(editingServiceId, serviceForm);
        triggerAlert("Service updated!");
      } else {
        await api.addService(serviceForm);
        triggerAlert("Service added!");
      }
      setServiceForm({ name: "", starting_price: 15000, description: "", image_url: "" });
      setEditingServiceId(null);
      await loadAllData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditService = (service: Service) => {
    setEditingServiceId(service.id);
    setServiceForm({
      name: service.name,
      starting_price: service.starting_price,
      description: service.description,
      image_url: service.image_url
    });
  };

  const handleDeleteService = async (id: number) => {
    const isConfirmed = await askConfirmation(
      "Delete Service Category",
      "Are you sure you want to delete this service category? This action is permanent."
    );
    if (isConfirmed) {
      try {
        await api.deleteService(id);
        triggerAlert("Service deleted successfully.");
        await loadAllData();
      } catch (err: any) {
        alert("Failed to delete service: " + err.message);
      }
    }
  };

  // ==========================================
  // EQUIPMENTS HANDLERS
  // ==========================================
  const handleSaveEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingEquipmentId) {
        await api.updateEquipment(editingEquipmentId, equipmentForm);
        triggerAlert("Equipment updated successfully!");
      } else {
        await api.addEquipment(equipmentForm);
        triggerAlert("Equipment added successfully!");
      }
      setEquipmentForm({ name: "", price: 20000, description: "", image_url: "", duration: "Full Event" });
      setEditingEquipmentId(null);
      await loadAllData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEquipment = (eq: Equipment) => {
    setEditingEquipmentId(eq.id);
    setEquipmentForm({
      name: eq.name,
      price: eq.price,
      description: eq.description,
      image_url: eq.image_url,
      duration: eq.duration
    });
  };

  const handleDeleteEquipment = async (id: number) => {
    const isConfirmed = await askConfirmation(
      "Delete Studio Equipment / Role",
      "Are you sure you want to delete this equipment/service role? This will remove it from the master catalog."
    );
    if (isConfirmed) {
      try {
        await api.deleteEquipment(id);
        triggerAlert("Equipment removed.");
        await loadAllData();
      } catch (err: any) {
        alert("Failed to delete equipment: " + err.message);
      }
    }
  };

  // ==========================================
  // PACKAGES HANDLERS
  // ==========================================
  const addPackageItem = () => {
    if (!packageItemInput.equipment_name) return;
    setPackageForm(prev => ({
      ...prev,
      items: [...prev.items, { ...packageItemInput }]
    }));
    setPackageItemInput({ equipment_name: "", quantity: 1 });
  };

  const removePackageItem = (idx: number) => {
    setPackageForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingPackageId) {
        await api.updatePackage(editingPackageId, packageForm);
        triggerAlert("Package updated successfully.");
      } else {
        await api.addPackage(packageForm);
        triggerAlert("Package added successfully.");
      }
      setPackageForm({ name: "", price: 50000, description: "", items: [] });
      setEditingPackageId(null);
      await loadAllData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPackage = (pkg: Package) => {
    setEditingPackageId(pkg.id);
    setPackageForm({
      name: pkg.name,
      price: pkg.price,
      description: pkg.description,
      items: pkg.items || []
    });
  };

  const handleDeletePackage = async (id: number) => {
    const isConfirmed = await askConfirmation(
      "Delete Studio Package",
      "Are you sure you want to delete this custom bundle package? Clients will no longer be able to select it."
    );
    if (isConfirmed) {
      try {
        await api.deletePackage(id);
        triggerAlert("Package deleted.");
        await loadAllData();
      } catch (err: any) {
        alert("Failed to delete package: " + err.message);
      }
    }
  };

  // ==========================================
  // GALLERY HANDLERS
  // ==========================================
  const handleAddGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryForm.image_url) return;
    setLoading(true);
    try {
      await api.addGalleryImage(galleryForm);
      setGalleryForm({ image_url: "", title: "" });
      triggerAlert("Gallery image uploaded!");
      await loadAllData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGallery = async (id: number) => {
    const isConfirmed = await askConfirmation(
      "Remove Gallery Asset",
      "Are you sure you want to delete this image from the public gallery reel?"
    );
    if (isConfirmed) {
      try {
        await api.deleteGalleryImage(id);
        triggerAlert("Gallery image deleted.");
        await loadAllData();
      } catch (err: any) {
        alert("Failed to delete gallery image: " + err.message);
      }
    }
  };

  // ==========================================
  // USERS HANDLERS
  // ==========================================
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    setLoading(true);
    try {
      await api.updateUser(editingUserId, userForm);
      setEditingUserId(null);
      triggerAlert("User details modified!");
      await loadAllData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const launchDirectWhatsApp = (phone: string, text: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const launchDirectEmail = (email: string, subject: string, body: string) => {
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, "_blank");
  };


  const handleEditUser = (u: User) => {
    setEditingUserId(u.id);
    setUserForm({
      username: u.username,
      email: u.email,
      phone: u.phone,
      points: u.points
    });
  };

  const handleDeleteUser = async (id: number) => {
    const isConfirmed = await askConfirmation(
      "DANGER: Permanent User Erase",
      "Are you absolutely sure? This will permanently delete this client's profile, as well as all of their associated bookings, carts, rewards, and notification logs from the physical database!"
    );
    if (isConfirmed) {
      await api.deleteUser(id);
      triggerAlert("User erased cleanly from database.");
      await loadAllData();
    }
  };

  // ==========================================
  // STUDIO DETAILS HANDLERS
  // ==========================================
  const handleUpdateStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateStudioDetails(studioForm);
      triggerAlert("Studio branding configured successfully!");
      await loadAllData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // NOTIFICATION HANDLERS
  // ==========================================
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (notifForm.user_id === 0) {
      alert("No user selected.");
      return;
    }
    setLoading(true);
    try {
      await api.sendNotification(notifForm);
      
      const targetUser = users.find(u => u.id === notifForm.user_id);
      if (targetUser) {
        const text = `*${notifForm.title}*\n\n${notifForm.message}`;
        if (notifForm.type === "WhatsApp" || notifForm.sent_via === "WhatsApp") {
          if (targetUser.phone) {
            launchDirectWhatsApp(targetUser.phone, text);
          } else {
            triggerAlert("Client profile has no phone number associated.");
          }
        } else if (notifForm.type === "Email" || notifForm.sent_via === "Email") {
          if (targetUser.email) {
            launchDirectEmail(targetUser.email, notifForm.title, notifForm.message);
          } else {
            triggerAlert("Client profile has no email address associated.");
          }
        }
      }

      setNotifForm(prev => ({ ...prev, title: "", message: "" }));
      triggerAlert("Alert logged! Prefilled draft is now opened in your WhatsApp/Email client.");
      await loadAllData();
    } catch (err: any) {
       alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // STAGED LOG TRANSACTION STATUS
  // ==========================================
  const handleAdvanceStagePayment = async (bookingId: number, currentStatus: string, subtotal: number) => {
    let nextStage = "";
    let nextAmount = 0;

    if (currentStatus === "pending") {
      nextStage = "20_percent";
      nextAmount = Math.round(subtotal * 0.20);
    } else if (currentStatus === "20_percent_paid") {
      nextStage = "70_percent";
      nextAmount = Math.round(subtotal * 0.70);
    } else if (currentStatus === "90_percent_paid") {
      nextStage = "10_percent";
      nextAmount = Math.round(subtotal * 0.10);
    } else {
      alert("This booking is already fully paid!");
      return;
    }

    const isConfirmed = await askConfirmation(
      "Authorize Stage Payment",
      `Authorize simulated invoice receipt of ₹${nextAmount.toLocaleString("en-IN")} stage payment for booking #${bookingId}?`
    );
    if (isConfirmed) {
      setLoading(true);
      try {
        await api.makePayment({
          booking_id: bookingId,
          amount: nextAmount,
          stage: nextStage
        });
        triggerAlert("Simulated payments logged and recorded successfully.");
        
        const ord = orders.find(o => o.id === bookingId);
        if (ord) {
          const stageLabel = nextStage === "20_percent" ? "20% (Booking Advance)" : nextStage === "70_percent" ? "90% (Shoot Fee Approved)" : "100% (Final Balance Cleared)";
          const templateText = `Hello ${ord.username || "Client"},\n\nWe have received and approved your stage payment of ₹${nextAmount.toLocaleString("en-IN")} (${stageLabel}) for Booking #${bookingId}. 🎉\n\nThank you for cooperating! ✨`;
          if (ord.phone) {
            launchDirectWhatsApp(ord.phone, templateText);
          } else if (ord.email) {
            launchDirectEmail(ord.email, "md photography - Stage Payment Confirmed", templateText);
          }
        }

        await loadAllData();
      } catch (err: any) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row antialiased">
      {/* Offline/Missed Bookings Catch-Up Modal overlay */}
      <AnimatePresence>
        {isCatchUpOpen && missedBookings.length > 0 && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white max-w-lg w-full rounded-3xl p-6 shadow-xl border border-blue-50 text-left space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-purple-50 rounded-xl text-purple-600">
                    <RefreshCw className="h-5 w-5 animate-spin" style={{ animationDuration: "3s" }} />
                  </span>
                  <div>
                    <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">🔄 Catch-Up Hub</h3>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">
                      {missedBookings.length} Missed Slot Bookings Registered
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-slate-500 text-xs leading-relaxed">
                While you were offline or logged out, the following customers booked slots. 
                We caught these events on the backend so you never miss a client request!
              </p>

              <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                {missedBookings.map((log) => (
                  <div key={log.id} className="bg-slate-50 border border-slate-100 p-3.5 r-2xl rounded-2xl flex items-center justify-between text-xs gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-slate-800">{log.username}</span>
                        <span className="text-purple-600 text-[10px] font-black uppercase bg-purple-50 px-1.5 py-0.5 rounded-md">
                          BUFFERED
                        </span>
                      </div>
                      <p className="text-slate-600">
                        Slot: <span className="font-bold text-slate-800">{log.event_name}</span>
                      </p>
                      <p className="text-[10px] text-slate-400">Date: {log.event_date} | Recorded: {new Date(log.created_at).toLocaleString("en-IN")}</p>
                    </div>
                    <span className="font-black text-emerald-600 font-mono bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-100 shrink-0">
                      ₹{log.total_price.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t text-xs">
                <span className="text-slate-400">Custom sound played</span>
                <button
                  onClick={acknowledgeMissedBookings}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-black px-6 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4 text-white" />
                  Acknowledge & Sync
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar navigation */}
      <div className="w-full md:w-64 bg-white p-6 flex flex-col justify-between border-r border-slate-200 text-left shrink-0">
        <div className="space-y-6">
          <div className="border-b border-light-200 pb-4">
            <h2 className="text-lg font-black text-purple-600 uppercase tracking-widest flex items-center gap-2">
              <Plus className="h-5 w-5 stroke-[2.5]" />
              Studio Control
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">MD System Authority Panel</p>
          </div>

          <nav className="space-y-1.5 text-xs font-black uppercase tracking-wider">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer ${activeTab === "dashboard" ? "bg-slate-900 border border-luxury-gold/30 text-[#D4AF37] font-black shadow-md md:scale-102" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              Dashboard Stats
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer ${activeTab === "orders" ? "bg-slate-900 border border-luxury-gold/30 text-[#D4AF37] font-black shadow-md md:scale-102" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              Orders & Payments
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer ${activeTab === "calendar" ? "bg-slate-900 border border-luxury-gold/30 text-[#D4AF37] font-black shadow-md md:scale-102" : "text-slate-600 hover:bg-slate-50 hover:text-slate-905"}`}
            >
              📅 Events Date Calendar
            </button>
            <button
              onClick={() => setActiveTab("revenue")}
              className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer ${activeTab === "revenue" ? "bg-slate-900 border border-luxury-gold/30 text-[#D4AF37] font-black shadow-md md:scale-102" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              📊 Client Revenue Table
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer ${activeTab === "users" ? "bg-slate-900 border border-luxury-gold/30 text-[#D4AF37] font-black shadow-md md:scale-102" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              System Users (Clients)
            </button>
            <button
              onClick={() => setActiveTab("services")}
              className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer ${activeTab === "services" ? "bg-slate-900 border border-luxury-gold/30 text-[#D4AF37] font-black shadow-md md:scale-102" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              Services Inventory
            </button>
            <button
              onClick={() => setActiveTab("equipments")}
              className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer ${activeTab === "equipments" ? "bg-slate-900 border border-luxury-gold/30 text-[#D4AF37] font-black shadow-md md:scale-102" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              Equipments list
            </button>
            <button
              onClick={() => setActiveTab("packages")}
              className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer ${activeTab === "packages" ? "bg-slate-900 border border-luxury-gold/30 text-[#D4AF37] font-black shadow-md md:scale-102" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              Custom Packages
            </button>
            <button
              onClick={() => setActiveTab("gallery")}
              className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer ${activeTab === "gallery" ? "bg-slate-900 border border-luxury-gold/30 text-[#D4AF37] font-black shadow-md md:scale-102" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              Gallery Images
            </button>
            <button
              onClick={() => setActiveTab("details")}
              className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer ${activeTab === "details" ? "bg-slate-900 border border-luxury-gold/30 text-[#D4AF37] font-black shadow-md md:scale-102" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              Studio Branding
            </button>
            <button
              onClick={() => setActiveTab("passwords")}
              className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer ${activeTab === "passwords" ? "bg-slate-900 border border-luxury-gold/30 text-[#D4AF37] font-black shadow-md md:scale-102" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              🔑 Password Recovery Hub
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-200 mt-6">
          <button
            onClick={onLogout}
            className="w-full text-center py-2.5 bg-rose-50 border border-rose-100 hover:bg-rose-600 hover:text-white text-rose-600 font-extrabold text-xs rounded-xl transition-all uppercase tracking-wider cursor-pointer shadow-sm"
          >
            Leave Admin Panel
          </button>
        </div>
      </div>

      {/* Main Dynamic Viewport */}
      <div className="flex-grow p-6 md:p-8 space-y-6 overflow-y-auto text-slate-805">
        
        {/* Alerts and notifications banner */}
        {message && (
          <div className="fixed bottom-4 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-lg font-bold flex items-center gap-2 text-xs">
            <CheckCircle2 className="h-4.5 w-4.5" />
            {message}
          </div>
        )}

        <div className="flex justify-between items-center border-b border-slate-200 pb-4">
          <div className="text-left">
            <h1 className="text-2xl font-black uppercase tracking-wide text-slate-900">MD Administrative Center</h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">Manage bookings, dynamic inventory matrices, deduplication billing, and custom client notifications.</p>
          </div>
          <button
            onClick={loadAllData}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl transition-all flex items-center gap-1.5 text-xs font-black uppercase tracking-wider cursor-pointer shadow-sm"
          >
            <RefreshCw className="h-4 w-4 text-purple-600" />
            Refresh Core
          </button>
        </div>

        {loadingStats ? (
          <div className="text-center py-12">
            <p className="text-sm text-zinc-400 font-semibold">Loading system files and synchronizing SQLite databases...</p>
          </div>
        ) : (
          <>
            {/* 1. TAB: DASHBOARD STATS */}
            {activeTab === "dashboard" && stats && (
              <div className="space-y-8">
                {/* FCM Push Notification Configuration Panel */}
                <div id="fcm-push-manager" className="bg-slate-900 border border-slate-800 text-white p-6 rounded-3xl relative overflow-hidden shadow-md space-y-4">
                  <div className="absolute top-0 right-0 -mr-6 -mt-6 w-36 h-36 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1 z-10 text-left">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${onlineStatus ? "bg-emerald-400 animate-pulse" : "bg-rose-500 animate-ping"}`} />
                        <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 font-mono">
                          {onlineStatus ? "Device Online" : "Device Offline (Server-side Buffer Enabled)"}
                        </span>
                      </div>
                      <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                        <span>🔔 Firebase Cloud Messaging (FCM) Hub</span>
                      </h3>
                      <p className="text-zinc-400 text-xs max-w-xl leading-relaxed">
                        Register your device for immediate push notifications with a custom camera shutter sound.
                        If you're offline or logged out, our system buffers slots, triggering a catch-up sync once reconnected.
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 shrink-0 z-10">
                      {isSubscribed ? (
                        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded-xl text-xs font-black">
                          <Check className="h-4 w-4" />
                          Live Push Active
                        </div>
                      ) : (
                        <button
                          onClick={requestNotificationPermission}
                          className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-black px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer border-0"
                        >
                          <RefreshCw className="h-4 w-4 text-white" />
                          Enable Live Push
                        </button>
                      )}

                      <button
                        onClick={playCustomNotificationSound}
                        className="bg-slate-800 hover:bg-slate-700 text-zinc-300 border border-slate-700 text-xs font-black px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Camera className="h-4 w-4 text-purple-400" />
                        Test Sound
                      </button>
                    </div>
                  </div>

                  {/* Extremely Helpful Visual Guide for Iframe Denials */}
                  {(permissionBlocked || isInIframe) && (
                    <div className="bg-purple-950/40 border border-purple-800/50 p-4 rounded-2xl text-left text-xs text-purple-200 space-y-2 pointer-events-auto z-10 relative">
                      <div className="flex items-start gap-2">
                        <span className="text-sm">💡</span>
                        <div className="space-y-1 col-span-1">
                          <p className="font-bold text-white">Why "Permission Denied" happened or may happen:</p>
                          <p className="text-zinc-300 leading-relaxed">
                            Web browsers automatically block and deny native Notification requests when running **inside an iframe tool** (like the AI Studio web preview pane).
                          </p>
                          <div className="pt-1.5 space-y-1 bg-amber-500/15 border border-amber-500/20 px-3 py-2 rounded-xl text-amber-200">
                            <p className="font-black">📌 HOW TO FIX THIS INSTANTLY:</p>
                            <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-100">
                              <li>Click the <span className="font-extrabold bg-zinc-800 px-1.5 py-0.5 rounded-xs">↗️ Open in standard New Tab</span> button in the top-right corner of your preview.</li>
                              <li>Or directly visit your stand-alone URL: <a href="https://ais-pre-4shgt6upi56mzwcxmaamsf-885248605043.asia-east1.run.app" target="_blank" rel="noreferrer" className="underline font-bold text-yellow-300 hover:text-yellow-400">Open Public Page 📸</a></li>
                              <li>Login as Administrator, go to the Admin Panel, and click <span className="font-extrabold">"Enable Live Push"</span> again. Your browser will prompt you to click "Allow"!</li>
                            </ol>
                          </div>
                          <p className="text-zinc-400 text-[11px] mt-1 pt-1 border-t border-purple-900/65">
                            *Note: Even without allowing browser permissions, you will still hear the synchronized live camera-shutter audio chime while this panel is open!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Instant Real-Time Booking Stream Alerts */}
                {newRealtimeAlerts.length > 0 && (
                  <div id="live-stream-alerts" className="bg-yellow-50/50 border border-yellow-200/60 p-5 rounded-3xl text-left space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-yellow-800 font-black text-[10px] uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-yellow-500 animate-ping" />
                        ⚡ Live Stream Alerts
                      </div>
                      <button 
                        onClick={() => setNewRealtimeAlerts([])}
                        className="text-[10px] text-yellow-600 hover:text-yellow-800 font-bold uppercase tracking-wider bg-transparent border-0 cursor-pointer"
                      >
                        Clear Live Queue
                      </button>
                    </div>
                    <div className="space-y-2">
                      <AnimatePresence>
                        {newRealtimeAlerts.map((alert) => (
                          <motion.div
                            key={alert.id || alert.booking_id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-white p-3.5 rounded-2xl shadow-xs border border-yellow-100 flex items-center justify-between gap-4 text-xs"
                          >
                            <div className="text-left">
                              <span className="font-extrabold text-slate-800">{alert.username}</span>
                              <span className="text-slate-500 mx-1">booked slot for</span>
                              <span className="font-black text-purple-600">{alert.event_name}</span>
                              <p className="text-[10px] text-slate-400 mt-0.5">Event Date: {alert.event_date} | Received: Just Now</p>
                            </div>
                            <span className="font-black text-emerald-600 font-mono text-sm bg-emerald-50 px-2.5 py-1 rounded-lg">
                              ₹{alert.total_price.toLocaleString("en-IN")}
                            </span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-white border border-blue-50 p-5 rounded-2xl text-left shadow-sm">
                    <Users className="h-5 w-5 text-blue-600 mb-2.5" />
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Clients</span>
                    <p className="text-2xl font-black mt-1 text-slate-800">{stats.totalUsers}</p>
                  </div>
                  <div className="bg-white border border-blue-50 p-5 rounded-2xl text-left shadow-sm">
                    <Calendar className="h-5 w-5 text-blue-600 mb-2.5" />
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Bookings Logged</span>
                    <p className="text-2xl font-black mt-1 text-slate-800">{stats.totalBookings}</p>
                  </div>
                  <div className="bg-white border border-blue-50 p-5 rounded-2xl text-left shadow-sm">
                    <IndianRupee className="h-5 w-5 text-emerald-600 mb-2.5" />
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Revenue Settled</span>
                    <p className="text-2xl font-black mt-1 text-emerald-600 font-mono">₹{(stats.totalRevenue || 0).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="bg-white border border-blue-50 p-5 rounded-2xl text-left shadow-sm">
                    <Layers className="h-5 w-5 text-blue-600 mb-2.5" />
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Pending Payments</span>
                    <p className="text-2xl font-black mt-1 text-slate-800">{stats.pendingPayments}</p>
                  </div>
                  <div className="bg-white border border-blue-50 p-5 rounded-2xl text-left col-span-2 lg:col-span-1 shadow-sm">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mb-2.5" />
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Completions</span>
                    <p className="text-2xl font-black mt-1 text-slate-800">{stats.completedOrders}</p>
                  </div>
                </div>

                {/* SVG Visual Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
                  {/* Chart 1: Revenue by stage */}
                  <div className="bg-white border border-blue-50 p-6 rounded-3xl shadow-sm">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Revenue Ledger By Stage Trigger</h3>
                    <div className="mt-6 flex flex-col justify-center h-48 relative">
                      {/* Simple responsive bar charts matching stage */}
                      <div className="space-y-4">
                        {["20_percent", "70_percent", "10_percent"].map((stage) => {
                          const val = stats.revenueByStage?.find((s: any) => s.stage === stage)?.amount || 0;
                          const total = stats.totalRevenue || 1;
                          const percentage = Math.round((val / total) * 100);

                          return (
                            <div key={stage} className="space-y-1 text-xs">
                              <div className="flex justify-between font-black uppercase tracking-wider text-slate-500">
                                <span>{stage === "20_percent" ? "20% Booking Fee" : stage === "70_percent" ? "70% Event Shoot Fee" : "10% Album Fee"}</span>
                                <span className="text-blue-600 font-bold">₹{val.toLocaleString("en-IN")} ({percentage}%)</span>
                              </div>
                              <div className="w-full h-3 bg-slate-100 rounded-lg overflow-hidden border border-slate-200/50">
                                <div className="h-full bg-blue-600 rounded-lg" style={{ width: `${percentage || 1}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Chart 2: Bookings Per Category */}
                  <div className="bg-white border border-blue-50 p-6 rounded-3xl shadow-sm">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Popular Shoots Category</h3>
                    <div className="mt-6 space-y-3 max-h-48 overflow-y-auto">
                      {stats.bookingsByService?.length === 0 ? (
                        <p className="text-xs text-slate-500">No category bookings recorded.</p>
                      ) : (
                        stats.bookingsByService?.map((b: any, index: number) => {
                          return (
                            <div key={index} className="flex justify-between items-center text-xs text-slate-700">
                              <span className="font-semibold text-slate-600">📅 {b.event_name}</span>
                              <span className="font-extrabold bg-blue-50 border border-blue-100 px-3 py-1 rounded-xl text-blue-600">{b.count} custom slots</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Simulated Custom Client Alert Sender */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  <div className="bg-white border border-blue-50 p-6 rounded-3xl shadow-sm">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <Send className="h-4.5 w-4.5 text-blue-600" />
                      Client Notification Alert Desk
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">Broadcast automated or standard alerts, invoices, and scheduling notes.</p>
                    
                    <form onSubmit={handleSendNotification} className="mt-4 space-y-3.5 text-xs">
                      <div className="space-y-1">
                        <label className="font-black uppercase tracking-wider text-slate-400 text-[10px]">Target User (Receiver)</label>
                        <select
                          value={notifForm.user_id}
                          onChange={(e) => setNotifForm({ ...notifForm, user_id: parseInt(e.target.value) })}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-xs font-bold"
                        >
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-black uppercase tracking-wider text-slate-400 text-[10px]">Alert Title</label>
                        <input
                          type="text"
                          required
                          value={notifForm.title}
                          onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
                          placeholder="e.g., Album Ready for Delivery!"
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-xs font-semibold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-black uppercase tracking-wider text-slate-400 text-[10px]">Custom Message</label>
                        <textarea
                          required
                          rows={3}
                          value={notifForm.message}
                          onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })}
                          placeholder="Enter broadcast details..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-xs font-semibold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">Simulation Type</label>
                          <select
                            value={notifForm.type}
                            onChange={(e) => setNotifForm({ ...notifForm, type: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-850"
                          >
                            <option value="In-App">In-App Banner</option>
                            <option value="WhatsApp">WhatsApp Message</option>
                            <option value="Email">Email Confirmation</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">Delivery Channel</label>
                          <select
                            value={notifForm.sent_via}
                            onChange={(e) => setNotifForm({ ...notifForm, sent_via: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-850"
                          >
                            <option value="Email">Email SMTP Sim</option>
                            <option value="WhatsApp">WhatsApp API Sim</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all cursor-pointer uppercase tracking-wider text-[11px] shadow-sm"
                      >
                        {loading ? "Sending..." : "Compile & Deliver Alert ✓"}
                      </button>
                    </form>
                  </div>

                  {/* Broadcast History log */}
                  <div className="bg-white border border-blue-50 p-6 rounded-3xl flex flex-col justify-between shadow-sm">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Simulated Notification History</h3>
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold">Live tracking of SMTP drafts and WhatsApp simulation payloads sent.</p>
                      
                      <div className="mt-4 space-y-3 max-h-60 overflow-y-auto pr-1">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-slate-450 italic mt-4">History is empty.</p>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-left text-xs space-y-1">
                              <div className="flex justify-between font-bold text-blue-600">
                                <span>{n.title}</span>
                                <span className="text-[10px] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded text-blue-600 font-extrabold">{n.type}</span>
                              </div>
                              <p className="text-slate-600 text-[11px] leading-relaxed font-semibold">{n.message}</p>
                              <p className="text-[9px] text-slate-400 font-bold pt-1">
                                Sent to client #{n.user_id} via {n.sent_via} • {n.created_at}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EVENT DATE CALENDAR TAB */}
            {activeTab === "calendar" && (() => {
              const calendarByDate: Record<string, Booking[]> = {};
              orders.forEach((ord) => {
                if (!ord.event_date) return;
                if (!calendarByDate[ord.event_date]) {
                  calendarByDate[ord.event_date] = [];
                }
                calendarByDate[ord.event_date].push(ord);
              });

              const datesList = Object.keys(calendarByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

              return (
                <div className="bg-white border border-blue-50 rounded-3xl p-6 text-left space-y-6 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-base font-black uppercase tracking-widest text-[#041C32] flex items-center gap-2 font-display">
                        📅 Scheduled Shoots & Event Calendar
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 font-semibold font-sans">
                        Comprehensive summary of photography slots and active customer booking logs indexed by scheduling date.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sidebar list */}
                    <div className="lg:col-span-1 space-y-3">
                      <h4 className="text-xs font-black uppercase text-[#D4AF37] tracking-wider font-display">
                        Scheduled Dates ({datesList.length})
                      </h4>
                      {datesList.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No booked shooting dates on file.</p>
                      ) : (
                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                          {datesList.map((dt) => {
                            const bookingsForDate = calendarByDate[dt];
                            return (
                              <div
                                key={dt}
                                className="p-3 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl border border-slate-200/60 space-y-1.5 cursor-pointer text-left"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-black text-slate-900">{dt}</span>
                                  <span className="text-[9px] font-black uppercase bg-[#041C32] text-[#D4AF37] px-2 py-0.5 rounded-full">
                                    {bookingsForDate.length} {bookingsForDate.length === 1 ? 'Shoot' : 'Shoots'}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  {bookingsForDate.map((b) => (
                                    <p key={b.id} className="text-[10px] text-slate-600 truncate font-semibold">
                                      📸 #{b.id} - <span className="capitalize">{b.event_name}</span> ({b.username || "Client"})
                                    </p>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Main Daily Details Pane */}
                    <div className="lg:col-span-2 space-y-4">
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                        Timeline Daily Itinerary
                      </h4>

                      {datesList.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-3xl bg-slate-50">
                          No upcoming bookings scheduled yet.
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                          {datesList.map((dt) => {
                            const bookingsForDate = calendarByDate[dt];
                            return (
                              <div key={dt} className="p-5 bg-gradient-to-r from-slate-50 via-slate-50/50 to-white border border-slate-200 rounded-2xl text-left space-y-3">
                                <span className="inline-block text-[10px] font-black bg-slate-950 text-[#D4AF37] px-3 py-1 rounded-full border border-luxury-gold/25">
                                  📅 Scheduled on: {dt}
                                </span>

                                <div className="divide-y divide-slate-100 space-y-2.5">
                                  {bookingsForDate.map((b, idx) => (
                                    <div key={b.id} className={`pt-2.5 ${idx === 0 ? 'pt-0 border-t-0' : 'border-t border-slate-100'} text-xs space-y-1.5`}>
                                      <div className="flex justify-between items-start flex-wrap gap-2">
                                        <div>
                                          <p className="font-extrabold text-slate-900 capitalize text-sm">
                                            #{b.id} - {b.event_name}
                                          </p>
                                          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                            Client: <span className="font-bold text-slate-705 capitalize">{b.username || "Guest"}</span> ({b.phone})
                                          </p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                          b.status === "confirmed" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                                          b.status === "completed" ? "bg-blue-100 text-blue-800 border border-blue-200" :
                                          b.status === "cancelled" ? "bg-rose-100 text-rose-800 border border-rose-200" :
                                          "bg-blue-50 text-blue-700 border border-blue-100"
                                        }`}>
                                          {b.status === "draft" ? "Awaiting Conf." : b.status}
                                        </span>
                                      </div>

                                      <div className="text-[10px] font-semibold text-slate-500 space-y-0.5 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">
                                        <p>📍 Location: <span className="font-bold text-slate-700">{b.event_location}</span></p>
                                        {b.package_name && <p>📦 Creative Package: <span className="font-bold text-slate-705">{b.package_name}</span></p>}
                                        {b.equipments && b.equipments.length > 0 && (
                                          <p>⚙️ Gear Add-ons: <span className="font-bold text-slate-705">{b.equipments.map(e => e.equipment_name).join(", ")}</span></p>
                                        )}
                                        <p className="text-[9px] text-amber-600 mt-1 font-black">💰 Total price: ₹{b.total_price.toLocaleString("en-IN")} (Advance paid: ₹{b.advance_paid.toLocaleString()})</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 2. TAB: ORDERS & ACTIVE BOOKINGS */}
            {activeTab === "orders" && (
              <div className="bg-white border border-blue-50 rounded-3xl p-6 text-left space-y-4 shadow-sm">
                <h3 className="text-base font-black uppercase tracking-widest text-slate-900">All Client Bookings & Payments</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-700">
                    <thead className="text-[10px] uppercase font-black tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="p-3">Ref ID</th>
                        <th className="p-3">User Details</th>
                        <th className="p-3">Event Spec</th>
                        <th className="p-3">Subtotal</th>
                        <th className="p-3">Paid Adv.</th>
                        <th className="p-3">Booking Status</th>
                        <th className="p-3">Payment Stage</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-4 text-center text-slate-400 italic">No active bookings recorded.</td>
                        </tr>
                      ) : (
                        orders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3 font-mono font-bold text-blue-600">#{ord.id}</td>
                            <td className="p-3 text-slate-800">
                              <p className="font-bold text-slate-900">{ord.username || "Client"}</p>
                              <p className="text-[10px] text-slate-500">{ord.email}</p>
                              <p className="text-[10px] text-slate-500">{ord.phone}</p>
                            </td>
                            <td className="p-3">
                              <p className="font-black text-slate-800">{ord.event_name}</p>
                              <p className="text-[10px] text-blue-650 font-extrabold">{ord.event_date}</p>
                              <p className="text-[10px] text-slate-500 truncate max-w-xs">📍 {ord.event_location}</p>
                              {ord.package_name && <p className="text-[9px] text-slate-450 italic font-medium">Package: {ord.package_name}</p>}
                            </td>
                            <td className="p-3 font-bold text-slate-950">₹{ord.total_price.toLocaleString("en-IN")}</td>
                            <td className="p-3 text-emerald-600 font-bold">₹{ord.advance_paid.toLocaleString("en-IN")}</td>
                            <td className="p-3">
                              <select
                                value={ord.status}
                                onChange={async (e) => {
                                  const nextStatus = e.target.value;
                                  try {
                                    if (nextStatus === "confirmed" && ord.status === "draft") {
                                      await api.updateBooking(ord.id, { status: "confirmed", payment_status: "20_percent_paid" });
                                      triggerAlert("Booking approved! Client notified with confirmed slot details.");
                                      
                                      const confirmText = `Hello ${ord.username || "Client"},\n\nYour md photography slot is CONFIRMED! 📸\n\n📌 Service: ${ord.service_name || "Photography Package"}\n📅 Date: ${ord.event_date || "Scheduled Date"}\n⏰ Time: ${ord.event_time || "Scheduled Time"}\n💰 Price: ₹${ord.total_price.toLocaleString("en-IN")}\n💸 Booking Advance (20%): ₹${Math.round(ord.total_price * 0.2).toLocaleString("en-IN")}\n\nWe have locked our calendar for you. Looking forward to our session! ✨`;
                                      if (ord.phone) {
                                        launchDirectWhatsApp(ord.phone, confirmText);
                                      } else if (ord.email) {
                                        launchDirectEmail(ord.email, "md photography - Slot Confirmed!", confirmText);
                                      }
                                    } else {
                                      await api.updateBooking(ord.id, { status: nextStatus });
                                      triggerAlert(`Booking status updated to ${nextStatus}`);
                                      if (nextStatus === "completed") {
                                        triggerAlert("Shoot marked completed! Client awarded 5% back in loyalty points.");
                                      }

                                      const statusText = `Hello ${ord.username || "Client"},\n\nThis is to notify you that your booking #${ord.id} status has been updated to: ${nextStatus.toUpperCase()}. 🤝\n\nThank you for choosing MD Photography! ✨`;
                                      if (ord.phone) {
                                        launchDirectWhatsApp(ord.phone, statusText);
                                      } else if (ord.email) {
                                        launchDirectEmail(ord.email, `Booking Status Update: ${nextStatus.toUpperCase()}`, statusText);
                                      }
                                    }
                                    await loadAllData();
                                  } catch (err: any) {
                                    triggerAlert("Error: " + err.message);
                                  }
                                }}
                                className={`px-2 py-1 bg-white border rounded-xl text-[10px] font-black uppercase cursor-pointer outline-none focus:ring-1 focus:ring-blue-600 ${
                                  ord.status === "confirmed" ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
                                  ord.status === "completed" ? "text-blue-700 bg-blue-50 border-blue-200" :
                                  ord.status === "cancelled" ? "text-rose-700 bg-rose-50 border-rose-200" :
                                  "text-indigo-700 bg-indigo-50 border-indigo-200"
                                }`}
                              >
                                <option value="draft">Pending Confirmation</option>
                                <option value="confirmed">Confirmed Slot</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td className="p-3">
                              <select
                                value={ord.payment_status}
                                onChange={async (e) => {
                                  const nextPay = e.target.value;
                                  try {
                                    await api.updateBooking(ord.id, { payment_status: nextPay });
                                    triggerAlert(`Booking payment stage updated to ${nextPay}`);
                                    const payLabel = nextPay === "fully_paid" ? "fully paid (100%)" : nextPay === "90_percent_paid" ? "90% paid" : "20% paid";
                                    const payText = `Hello ${ord.username || "Client"},\n\nYour payment status for Booking Ref #${ord.id} has been updated to: ${payLabel.toUpperCase()}! 👍\n\nThank you for your payment and support! ✨`;
                                    if (ord.phone) {
                                      launchDirectWhatsApp(ord.phone, payText);
                                    } else if (ord.email) {
                                      launchDirectEmail(ord.email, "md photography - Payment Confirmed", payText);
                                    }
                                    await loadAllData();
                                  } catch (err: any) {
                                    triggerAlert("Error: " + err.message);
                                  }
                                }}
                                className={`px-2 py-1 bg-white border rounded-xl text-[10px] font-black cursor-pointer outline-none focus:ring-1 focus:ring-blue-600 ${
                                  ord.payment_status === "fully_paid" ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
                                  ord.payment_status === "90_percent_paid" ? "text-blue-700 bg-blue-50 border-blue-200" :
                                  ord.payment_status === "20_percent_paid" ? "text-amber-700 bg-amber-50 border-amber-200" :
                                  "text-rose-700 bg-rose-50 border-rose-200"
                                }`}
                              >
                                <option value="pending">0% Paid (Pending)</option>
                                <option value="20_percent_paid">20% (₹{Math.round(ord.total_price * 0.20).toLocaleString("en-IN")}) Paid (Advance)</option>
                                <option value="90_percent_paid">90% (₹{Math.round(ord.total_price * 0.90).toLocaleString("en-IN")}) Paid (Shoot)</option>
                                <option value="fully_paid">100% (₹{ord.total_price.toLocaleString("en-IN")}) Paid (Fully Paid)</option>
                              </select>
                            </td>
                            <td className="p-3 text-right space-y-1.5 min-w-[140px]">
                              {ord.status === "draft" && (
                                <button
                                  onClick={async () => {
                                    const isConfirmed = await askConfirmation(
                                      "Approve Event Slot",
                                      `Confirm and block the calendar slot for ${ord.username || "Client"}? This moves status to Confirmed.`
                                    );
                                    if (isConfirmed) {
                                      await api.updateBooking(ord.id, { status: "confirmed", payment_status: "20_percent_paid" });
                                      
                                      const confirmText = `Hello ${ord.username || "Client"},\n\nYour md photography slot is CONFIRMED! 📸\n\n📌 Service: ${ord.service_name || "Photography Package"}\n📅 Date: ${ord.event_date || "Scheduled Date"}\n⏰ Time: ${ord.event_time || "Scheduled Time"}\n💰 Price: ₹${ord.total_price.toLocaleString("en-IN")}\n💸 Booking Advance (20%): ₹${Math.round(ord.total_price * 0.2).toLocaleString("en-IN")}\n\nWe have locked our calendar for you. Looking forward to our session! ✨`;
                                      
                                      if (ord.phone) {
                                        launchDirectWhatsApp(ord.phone, confirmText);
                                      } else if (ord.email) {
                                        launchDirectEmail(ord.email, "md photography - Slot Confirmed!", confirmText);
                                      }
                                      
                                      triggerAlert("Slot approved! Direct chat thread has been opened with the confirmation template.");
                                      await loadAllData();
                                    }
                                  }}
                                  className="w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] py-1 px-1.5 rounded-lg transition-all cursor-pointer shadow-sm"
                                >
                                  Approve & Confirm Slot
                                </button>
                              )}
                              {ord.status !== "draft" && ord.payment_status !== "fully_paid" && ord.status !== "cancelled" && (
                                <div className="space-y-1 mt-1">
                                  <button
                                    onClick={() => handleAdvanceStagePayment(ord.id, ord.payment_status, ord.total_price)}
                                    className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] py-1 px-1.5 rounded-lg transition-all cursor-pointer shadow-sm"
                                  >
                                    {ord.payment_status === "pending" ? "Recv Advance (20%)" : ord.payment_status === "20_percent_paid" ? "Recv Shoot (70%)" : "Close Final (10%)"}
                                  </button>

                                  {customPayBookingId === ord.id ? (
                                    <div className="bg-slate-100 p-2 rounded-lg text-left space-y-1.5 border border-slate-200 shadow-inner mt-1">
                                      <span className="text-[9px] text-slate-500 font-bold block">Amount Received (₹):</span>
                                      <input 
                                        type="number"
                                        placeholder="Enter Amount"
                                        value={customPayAmount}
                                        onChange={(e) => setCustomPayAmount(Number(e.target.value))}
                                        className="w-full px-2 py-1 text-[11px] border bg-white rounded font-bold text-slate-800 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                      />
                                      <div className="flex gap-1 justify-end">
                                        <button
                                          onClick={async () => {
                                            if (customPayAmount <= 0) {
                                              triggerAlert("Please enter an amount greater than 0");
                                              return;
                                            }
                                            setLoading(true);
                                            try {
                                              await api.makePayment({
                                                booking_id: ord.id,
                                                amount: customPayAmount,
                                                stage: "custom"
                                              });
                                              triggerAlert(`Recorded custom payment of ₹${customPayAmount.toLocaleString("en-IN")} successfully!`);
                                              const customPayText = `Hello ${ord.username || "Client"},\n\nWe have recorded your custom payment of ₹${customPayAmount.toLocaleString("en-IN")} for booking Reference #${ord.id}. 👍\n\nThank you for choosing MD Photography! ✨`;
                                              if (ord.phone) {
                                                launchDirectWhatsApp(ord.phone, customPayText);
                                              } else if (ord.email) {
                                                launchDirectEmail(ord.email, "md photography - Payment Confirmed", customPayText);
                                              }
                                              setCustomPayBookingId(null);
                                              setCustomPayAmount(2000);
                                              await loadAllData();
                                            } catch (err: any) {
                                              triggerAlert("Error: " + err.message);
                                            } finally {
                                              setLoading(false);
                                            }
                                          }}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] px-2 py-1 rounded cursor-pointer transition-colors"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={() => setCustomPayBookingId(null)}
                                          className="bg-slate-300 hover:bg-slate-400 text-slate-700 font-bold text-[9px] px-2 py-1 rounded cursor-pointer transition-colors"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setCustomPayBookingId(ord.id);
                                        setCustomPayAmount(2000);
                                      }}
                                      className="w-full text-center bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 font-black text-[9px] py-1 px-1 rounded-lg transition-all cursor-pointer shadow-sm"
                                    >
                                      💸 Enter Custom Amount
                                    </button>
                                  )}
                                </div>
                              )}
                              {ord.status !== "cancelled" && (
                                <button
                                  onClick={async () => {
                                    const isConfirmed = await askConfirmation(
                                      "Cancel Event Booking",
                                      "Are you sure you want to cancel and void this client booking slot?"
                                    );
                                    if (isConfirmed) {
                                      await api.updateBooking(ord.id, { status: "cancelled" });
                                      triggerAlert("Booking voided!");
                                      await loadAllData();
                                    }
                                  }}
                                  className="w-full text-center bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 border border-rose-100 font-bold text-[10px] py-1 px-1.5 rounded-lg transition-all cursor-pointer shadow-sm"
                                >
                                  Cancel Booking
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  const isConfirmed = await askConfirmation(
                                    "Physical Erase Booking Record",
                                    "Are you sure you want to completely delete this booking record from the server? This action is permanent."
                                  );
                                  if (isConfirmed) {
                                    await api.deleteBooking(ord.id);
                                    triggerAlert("Order deleted.");
                                    await loadAllData();
                                  }
                                }}
                                className="w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-[9px] py-0.5 px-1.5 rounded-lg border border-slate-200/50"
                              >
                                Physical Erase
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. TAB: SYSTEM USERS */}
            {activeTab === "users" && (
              <div className="space-y-6 text-left">
                {editingUserId && (
                  <form onSubmit={handleUpdateUser} className="bg-white border border-blue-50 p-6 rounded-3xl space-y-4 max-w-md shadow-sm">
                    <h4 className="text-sm font-black uppercase text-blue-600">Edit Client profile</h4>
                    <div className="space-y-2 text-xs">
                      <div className="space-y-1">
                        <label className="text-slate-500 font-bold">Username</label>
                        <input
                          type="text" required
                          value={userForm.username}
                          onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 font-bold">Email</label>
                        <input
                          type="email" required
                          value={userForm.email}
                          onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 font-bold">Phone</label>
                        <input
                          type="text" required
                          value={userForm.phone}
                          onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 font-bold">Loyalty Points</label>
                        <input
                          type="number" required
                          value={userForm.points}
                          onChange={(e) => setUserForm({ ...userForm, points: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg text-xs cursor-pointer shadow-sm">Save details</button>
                      <button type="button" onClick={() => setEditingUserId(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs">Cancel</button>
                    </div>
                  </form>
                )}

                <div className="bg-white border border-blue-50 rounded-3xl p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4 mb-4">
                    <div>
                      <h3 className="text-base font-black uppercase tracking-widest text-slate-900">Registered System Clients</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Filter clients and see financial contribution per customer profile
                      </p>
                    </div>
                    {/* Search Field */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="🔍 Filter clients by username..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="w-full md:w-64 px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white text-slate-800 font-medium"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-700">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black border-b border-slate-200">
                        <tr>
                          <th className="p-3">User ID</th>
                          <th className="p-3">Username</th>
                          <th className="p-3">Email Address</th>
                          <th className="p-3">Phone Number</th>
                          <th className="p-3">Loyalty Balance</th>
                          <th className="p-3">Revenue Contribution</th>
                          <th className="p-3 text-right">Settings</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map((u) => (
                           <tr key={u.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-mono text-slate-400">#{u.id}</td>
                            <td className="p-3 font-bold text-slate-850">{u.username}</td>
                            <td className="p-3 text-slate-600">{u.email}</td>
                            <td className="p-3 text-slate-650">{u.phone}</td>
                            <td className="p-3 text-blue-600 font-black">{u.points} points</td>
                             <td className="p-3 font-mono text-emerald-600 font-bold">
                               ₹{(u.total_revenue || 0).toLocaleString("en-IN")}
                             </td>
                            <td className="p-3 text-right flex justify-end gap-2">
                              <button
                                onClick={() => handleEditUser(u)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 border border-rose-100 rounded transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                </div>
              </div>
            )}

            {/* NEW TAB: CLIENTS REVENUE GRAPH/TABULAR SUMMARY */}
            {activeTab === "revenue" && (() => {
              const totalVerifiedRevenue = users.reduce((sum, u) => sum + (u.total_revenue || 0), 0);
              const topContributingClient = users.length > 0
                ? [...users].sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))[0]
                : null;
              const avgCustomerValue = users.length > 0 ? (totalVerifiedRevenue / users.length) : 0;
              const activeContributorsCount = users.filter(u => (u.total_revenue || 0) > 0).length;
              const filteredRevenueUsers = users.filter(u => 
                u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                u.phone.includes(userSearchQuery)
              );

              return (
                <div className="space-y-6 text-left">
                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-3xl p-5 shadow-xs">
                      <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Total Realized Revenue</span>
                      <h3 className="text-2xl font-black text-emerald-950 mt-1">₹{totalVerifiedRevenue.toLocaleString("en-IN")}</h3>
                      <p className="text-[10px] text-emerald-600 mt-1 font-bold">Sum of all completed stage payments</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Top Client Profile</span>
                      <h3 className="text-sm font-black text-slate-800 mt-1 truncate">
                        {topContributingClient && (topContributingClient.total_revenue || 0) > 0 
                          ? `${topContributingClient.username}`
                          : "N/A"
                        }
                      </h3>
                      <p className="text-[10px] text-emerald-600 mt-1 font-bold font-mono">
                        {topContributingClient && (topContributingClient.total_revenue || 0) > 0 
                          ? `₹${topContributingClient.total_revenue.toLocaleString("en-IN")} contributed`
                          : "No payments recorded"
                        }
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Average Customer Value</span>
                      <h3 className="text-2xl font-black text-purple-600 mt-1">₹{Math.round(avgCustomerValue).toLocaleString("en-IN")}</h3>
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold">Total Revenue / Total Users</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Active Paid Customers</span>
                      <h3 className="text-2xl font-black text-blue-605 mt-1">{activeContributorsCount} / {users.length}</h3>
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                        {users.length > 0 ? ((activeContributorsCount / users.length) * 100).toFixed(0) : 0}% contribution rate
                      </p>
                    </div>
                  </div>

                  {/* Table View */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
                    <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4 mb-4">
                      <div>
                        <h3 className="text-base font-black uppercase tracking-widest text-slate-900">Client Revenue statistics</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          List view of individual user financial returns and billing history
                        </p>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="🔍 Filter client name/phone/email..."
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          className="w-full md:w-64 px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-slate-50 font-medium focus:outline-none focus:ring-1 focus:ring-purple-600 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] font-black tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="p-3">Reference ID</th>
                            <th className="p-3">Client Username</th>
                            <th className="p-3">Email ID</th>
                            <th className="p-3">Contact</th>
                            <th className="p-3">Loyalty balance</th>
                            <th className="p-3 text-right">Revenue Generated</th>
                            <th className="p-3 text-right">Revenue Share</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                          {filteredRevenueUsers.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                                No customer entries match the search terms.
                              </td>
                            </tr>
                          ) : (
                            filteredRevenueUsers.map((u) => {
                              const sharePct = totalVerifiedRevenue > 0
                                ? ((u.total_revenue || 0) / totalVerifiedRevenue * 100).toFixed(1)
                                : "0.0";
                              return (
                                <tr key={u.id} className="hover:bg-slate-50/50">
                                  <td className="p-3 font-mono text-slate-400">#{u.id}</td>
                                  <td className="p-3 font-bold text-slate-900">{u.username}</td>
                                  <td className="p-3 text-slate-500">{u.email}</td>
                                  <td className="p-3 text-slate-500">{u.phone || "N/A"}</td>
                                  <td className="p-3 text-purple-600 font-black">{u.points} Points</td>
                                  <td className="p-3 text-right font-mono text-emerald-600 font-black text-sm">
                                    ₹{(u.total_revenue || 0).toLocaleString("en-IN")}
                                  </td>
                                  <td className="p-3 text-right font-mono text-slate-400 font-bold">{sharePct}%</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 4. TAB: SERVICES INVENTORY */}
            {activeTab === "services" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
                {/* Form column */}
                <div className="bg-white border border-purple-100 p-6 rounded-3xl h-fit shadow-xs">
                  <h3 className="text-sm font-black uppercase text-purple-700 flex items-center gap-1.5">
                    <Camera className="h-4.5 w-4.5" />
                    {editingServiceId ? "Modify Shoot Category" : "Establish Shoot Category"}
                  </h3>
                  
                  <form onSubmit={handleSaveService} className="mt-4 space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Category Name</label>
                      <input
                        type="text" required
                        value={serviceForm.name}
                        onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-slate-50 text-slate-950"
                        placeholder="e.g., Srimantham / Seemantham"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Starting Price (₹)</label>
                      <input
                        type="number" required
                        value={serviceForm.starting_price}
                        onChange={(e) => setServiceForm({ ...serviceForm, starting_price: parseInt(e.target.value) })}
                        className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-slate-50 text-slate-950"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-extrabold text-slate-600 uppercase tracking-wide text-[10px] block">Service Cover Image</label>
                      <div className="space-y-1.5 animate-fade-in">
                        <input
                          type="file"
                          id="service-image-file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, (base64) => setServiceForm({ ...serviceForm, image_url: base64 }))}
                          className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                        />
                        <div className="text-[10px] text-slate-400 font-bold text-center">or paste URL below</div>
                        <input
                          type="text"
                          value={serviceForm.image_url}
                          onChange={(e) => setServiceForm({ ...serviceForm, image_url: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-purple-100 bg-slate-50 text-slate-800 text-xs"
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>
                      {serviceForm.image_url && (
                        <img src={serviceForm.image_url} className="h-14 w-full object-cover rounded-lg border border-purple-100 mt-1" alt="Preview" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Category Bio / Descr</label>
                      <textarea
                        rows={3}
                        value={serviceForm.description}
                        onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-slate-50 focus:outline-none text-slate-950"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button type="submit" className="flex-grow py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-xs cursor-pointer">
                        {editingServiceId ? "Save Configurations" : "Add Shoot Category"}
                      </button>
                      {editingServiceId && (
                        <button type="button" onClick={() => { setEditingServiceId(null); setServiceForm({ name: "", starting_price: 15000, description: "", image_url: "" }); }} className="px-3 bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold rounded-xl">Cancel</button>
                      )}
                    </div>
                  </form>
                </div>

                {/* List column */}
                <div className="lg:col-span-2 bg-white border border-purple-100 rounded-3xl p-6 shadow-xs">
                  <h3 className="text-sm font-black uppercase text-slate-800">Categories Matrix ({services.length})</h3>
                  
                  <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {services.map((ser) => (
                      <div key={ser.id} className="flex justify-between items-center p-3 bg-purple-50/20 rounded-2xl border border-purple-100 text-xs text-slate-800">
                        <div className="flex items-center gap-3">
                          <img src={ser.image_url} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                          <div>
                            <p className="font-bold text-slate-950">{ser.name}</p>
                            <p className="text-slate-500 text-[10px] line-clamp-1 truncate max-w-sm">{ser.description}</p>
                            <p className="text-purple-600 font-extrabold text-[10px] mt-0.5">Starting at: ₹{ser.starting_price.toLocaleString("en-IN")}</p>
                          </div>
                        </div>

                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => handleEditService(ser)} className="p-1.5 bg-purple-50 text-purple-700 border border-purple-100 rounded hover:bg-purple-100"><Edit className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDeleteService(ser.id)} className="p-1.5 bg-rose-50 border border-rose-100 text-rose-600 rounded hover:bg-rose-600 hover:text-white"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 5. TAB: EQUIPMENTS MANAGER */}
            {activeTab === "equipments" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
                {/* Form column */}
                <div className="bg-white border border-purple-100 p-6 rounded-3xl h-fit shadow-xs">
                  <h3 className="text-sm font-black uppercase text-purple-700 flex items-center gap-1.5">
                    <Plus className="h-4.5 w-4.5" />
                    {editingEquipmentId ? "Edit Equipment" : "Add Equipment Profile"}
                  </h3>

                  <form onSubmit={handleSaveEquipment} className="mt-4 space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Equipment Name</label>
                      <input
                        type="text" required
                        value={equipmentForm.name}
                        onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-slate-50 text-slate-950"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600">Price (₹)</label>
                        <input
                          type="number" required
                          value={equipmentForm.price}
                          onChange={(e) => setEquipmentForm({ ...equipmentForm, price: parseInt(e.target.value) })}
                          className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-slate-50 text-slate-950"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600">Duration</label>
                        <input
                          type="text" required
                          value={equipmentForm.duration}
                          onChange={(e) => setEquipmentForm({ ...equipmentForm, duration: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-slate-50 text-slate-950"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="font-extrabold text-slate-600 uppercase tracking-wide text-[10px] block">Equipment Reference Image</label>
                      <div className="space-y-1.5 animate-fade-in">
                        <input
                          type="file"
                          id="equipment-image-file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, (base64) => setEquipmentForm({ ...equipmentForm, image_url: base64 }))}
                          className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                        />
                        <div className="text-[10px] text-slate-400 font-bold text-center">or paste URL below</div>
                        <input
                          type="text"
                          value={equipmentForm.image_url}
                          onChange={(e) => setEquipmentForm({ ...equipmentForm, image_url: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-purple-100 bg-slate-50 text-slate-800 text-xs"
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>
                      {equipmentForm.image_url && (
                        <img src={equipmentForm.image_url} className="h-14 w-full object-cover rounded-lg border border-purple-100 mt-1" alt="Preview" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Short Bio / Specs</label>
                      <textarea
                        rows={3}
                        value={equipmentForm.description}
                        onChange={(e) => setEquipmentForm({ ...equipmentForm, description: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-slate-50 focus:outline-none text-slate-950"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button type="submit" className="flex-grow py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-xs cursor-pointer">
                        {editingEquipmentId ? "Save Specs" : "Add Equipment Unit"}
                      </button>
                      {editingEquipmentId && (
                        <button type="button" onClick={() => { setEditingEquipmentId(null); setEquipmentForm({ name: "", price: 20000, description: "", image_url: "", duration: "Full Event" }); }} className="px-3 bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold rounded-xl">Cancel</button>
                      )}
                    </div>
                  </form>
                </div>

                {/* List column */}
                <div className="lg:col-span-2 bg-white border border-purple-100 rounded-3xl p-6 shadow-xs">
                  <h3 className="text-sm font-black uppercase text-slate-800">Equipments Inventory list ({equipments.length})</h3>

                  <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {equipments.map((eq) => (
                      <div key={eq.id} className="flex justify-between items-center p-3 bg-purple-50/20 rounded-2xl border border-purple-100 text-xs text-slate-800">
                        <div className="flex items-center gap-3">
                          <img src={eq.image_url} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                          <div>
                            <p className="font-bold text-slate-950">{eq.name}</p>
                            <p className="text-slate-500 text-[10px] max-w-sm truncate">{eq.description}</p>
                            <p className="text-purple-600 font-extrabold text-[10px] mt-0.5">Rate: ₹{eq.price.toLocaleString("en-IN")} ({eq.duration})</p>
                          </div>
                        </div>

                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => handleEditEquipment(eq)} className="p-1.5 bg-purple-50 text-purple-700 border border-purple-100 rounded hover:bg-purple-100"><Edit className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDeleteEquipment(eq.id)} className="p-1.5 bg-rose-50 border border-rose-100 text-rose-600 rounded hover:bg-rose-600 hover:text-white"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 6. TAB: PACKAGES CUSTOMIZER */}
            {activeTab === "packages" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
                {/* Form column */}
                <div className="bg-white border border-purple-100 p-6 rounded-3xl h-fit space-y-5 shadow-xs">
                  <h3 className="text-sm font-black uppercase text-purple-700 flex items-center gap-1.5">
                    <PackageOpen className="h-4.5 w-4.5" />
                    {editingPackageId ? "Modify Deal Package" : "Publish Deal Package"}
                  </h3>

                  <form onSubmit={handleSavePackage} className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Package Name</label>
                      <input
                        type="text" required
                        value={packageForm.name}
                        onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-slate-50 text-slate-950"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Calculated Package price (₹)</label>
                      <input
                        type="number" required
                        value={packageForm.price}
                        onChange={(e) => setPackageForm({ ...packageForm, price: parseInt(e.target.value) })}
                        className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-slate-50 text-slate-950"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Short Bio / Highlights</label>
                      <textarea
                        rows={2}
                        value={packageForm.description}
                        onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-slate-50 focus:outline-none text-slate-950"
                      />
                    </div>

                    {/* Inclusion matrix */}
                    <div className="border-t border-purple-100 pt-4 space-y-3">
                      <label className="font-bold text-slate-600 block uppercase text-[10px]">Customize Inclusions Builder</label>
                      
                      <div className="flex gap-2 text-xs">
                        <input
                          type="text"
                          placeholder="e.g., Album (50+1)"
                          value={packageItemInput.equipment_name}
                          onChange={(e) => setPackageItemInput({ ...packageItemInput, equipment_name: e.target.value })}
                          className="flex-grow px-3 py-2 rounded-xl bg-slate-50 border border-purple-100 text-slate-950"
                        />
                        <input
                          type="number"
                          value={packageItemInput.quantity}
                          onChange={(e) => setPackageItemInput({ ...packageItemInput, quantity: parseInt(e.target.value) || 1 })}
                          className="w-16 px-2 py-2 rounded-xl bg-slate-50 border border-purple-100 text-center text-slate-950"
                        />
                        <button type="button" onClick={addPackageItem} className="px-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 cursor-pointer">+</button>
                      </div>

                      <div className="space-y-1.5 pt-2">
                        {packageForm.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-purple-50/50 p-2 rounded-lg text-[11px] font-semibold border border-purple-100 text-slate-800">
                            <span>{item.quantity}x {item.equipment_name}</span>
                            <button type="button" onClick={() => removePackageItem(idx)} className="text-rose-600 font-black hover:text-rose-800">Delete</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button type="submit" className="flex-grow py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-xs cursor-pointer">
                        {editingPackageId ? "Authorize Modification" : "Publish Deal Package"}
                      </button>
                      {editingPackageId && (
                        <button type="button" onClick={() => { setEditingPackageId(null); setPackageForm({ name: "", price: 50000, description: "", items: [] }); }} className="px-3 bg-slate-200 text-slate-700 hover:bg-slate-350 font-bold rounded-xl">Cancel</button>
                      )}
                    </div>
                  </form>
                </div>

                {/* List column */}
                <div className="lg:col-span-2 bg-white border border-purple-100 rounded-3xl p-6 shadow-xs">
                  <h3 className="text-sm font-black uppercase text-slate-800">Published Studio Packages ({packages.length})</h3>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {packages.map((pkg) => (
                      <div key={pkg.id} className="p-4 bg-purple-50/20 border border-purple-100 rounded-2xl text-xs space-y-3 flex flex-col justify-between text-slate-800">
                        <div>
                          <div className="flex justify-between font-black">
                            <span className="text-purple-700 text-sm font-black">{pkg.name}</span>
                            <span className="text-slate-950 font-mono">₹{pkg.price.toLocaleString("en-IN")}</span>
                          </div>
                          <p className="text-slate-500 text-[10px] mt-1 leading-relaxed">{pkg.description}</p>
                          
                          <div className="pt-3 border-t border-purple-100/60 mt-3 space-y-1 text-left text-[11px] text-slate-755">
                            <p className="font-extrabold text-slate-600 text-[10px] uppercase">Bundle covers:</p>
                            {pkg.items?.map((item, id) => (
                              <p key={id}>• {item.quantity}x {item.equipment_name}</p>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-purple-100/60 justify-end">
                          <button onClick={() => handleEditPackage(pkg)} className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded hover:bg-purple-100 transition-colors flex items-center gap-1 text-[11px]"><Edit className="h-3 w-3" /> Edit</button>
                          <button onClick={() => handleDeletePackage(pkg.id)} className="px-3 py-1 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 border border-rose-100 rounded transition-all flex items-center gap-1 text-[11px]"><Trash2 className="h-3 w-3" /> Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 7. TAB: GALLERY REEL IMAGES */}
            {activeTab === "gallery" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
                {/* Upload Section */}
                <div className="bg-white border border-purple-100 p-6 rounded-3xl h-fit shadow-xs">
                  <h3 className="text-sm font-black uppercase text-purple-700 flex items-center gap-1.5">
                    <Plus className="h-4.5 w-4.5" /> Introduce Gallery Asset
                  </h3>

                  <form onSubmit={handleAddGallery} className="mt-4 space-y-4 text-xs">
                    <div className="space-y-2">
                      <label className="font-extrabold text-slate-600 uppercase tracking-wide text-[10px] block">Gallery Image Asset</label>
                      <div className="space-y-1.5 animate-fade-in">
                        <input
                          type="file"
                          id="gallery-image-file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, (base64) => setGalleryForm({ ...galleryForm, image_url: base64 }))}
                          className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                        />
                        <div className="text-[10px] text-slate-400 font-bold text-center">or paste URL below</div>
                        <input
                          type="text"
                          value={galleryForm.image_url}
                          onChange={(e) => setGalleryForm({ ...galleryForm, image_url: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-purple-100 bg-slate-50 text-slate-800 text-xs"
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>
                      {galleryForm.image_url && (
                        <img src={galleryForm.image_url} className="h-14 w-full object-cover rounded-lg border border-purple-100 mt-1" alt="Preview" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Asset Portrait Title</label>
                      <input
                        type="text"
                        value={galleryForm.title}
                        onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-slate-50 text-slate-950"
                        placeholder="e.g., Traditional Haldi Candid Frame"
                      />
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl transition-colors cursor-pointer">
                      {loading ? "Injecting..." : "Publish To Gallery Grid ✓"}
                    </button>
                  </form>
                </div>

                {/* Grid Section */}
                <div className="lg:col-span-2 bg-white border border-purple-100 rounded-3xl p-6 shadow-xs">
                  <h3 className="text-sm font-black uppercase text-slate-800">Live Gallery Grid Store</h3>
                  
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {gallery.map((img) => (
                      <div key={img.id} className="relative group rounded-xl overflow-hidden border border-purple-100 aspect-video">
                        <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-purple-50/95 border-t border-purple-100 p-2 text-[10px] text-slate-800 flex justify-between items-center font-bold">
                          <span className="truncate max-w-[120px]">{img.title || "Untitled"}</span>
                          <button
                            onClick={() => handleDeleteGallery(img.id)}
                            className="text-rose-600 hover:text-rose-800 font-extrabold cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 8. TAB: STUDIO BRANDING INFO */}
            {activeTab === "details" && (
              <div className="bg-white border border-purple-100 rounded-3xl p-6 text-left max-w-2xl mx-auto shadow-xs">
                <h3 className="text-sm font-black uppercase text-purple-700 flex items-center gap-1.5">
                  <HeartHandshake className="h-4.5 w-4.5" />
                  Edit Studio Branding Elements
                </h3>

                <form onSubmit={handleUpdateStudio} className="mt-6 space-y-4 text-xs">
                  <div className="space-y-2">
                    <label className="font-extrabold text-slate-600 uppercase tracking-wide text-[10px] block font-bold">Studio Logo / Brand Mark</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                      <div className="space-y-1.5">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, (base64) => setStudioForm({ ...studioForm, logo_url: base64 }))}
                          className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={studioForm.logo_url || ""}
                          onChange={(e) => setStudioForm({ ...studioForm, logo_url: e.target.value })}
                          placeholder="Or paste image URL"
                          className="w-full px-3 py-2 rounded-xl border border-purple-100 bg-slate-50 text-slate-800 text-xs focus:outline-none"
                        />
                      </div>
                      {studioForm.logo_url ? (
                        <div className="flex gap-2 items-center justify-center border border-purple-100 rounded-xl p-2 bg-purple-50/20">
                          <img src={studioForm.logo_url} className="h-10 w-10 object-contain rounded" alt="Logo Preview" />
                          <span className="text-[10px] text-slate-500 font-bold">Logo Preview</span>
                        </div>
                      ) : (
                        <div className="text-center text-slate-400 text-[10px] border border-dashed border-purple-100 rounded-xl p-4">No logo configured</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Studio Name</label>
                    <input
                      type="text" required
                      value={studioForm.name || ""}
                      onChange={(e) => setStudioForm({ ...studioForm, name: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-slate-50 text-slate-950 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Tagline / Motto</label>
                    <input
                      type="text" required
                      value={studioForm.tagline || ""}
                      onChange={(e) => setStudioForm({ ...studioForm, tagline: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-slate-50 text-slate-950 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Contact Number</label>
                      <input
                        type="text" required
                        value={studioForm.mobile || ""}
                        onChange={(e) => setStudioForm({ ...studioForm, mobile: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-slate-50 text-slate-950 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">WhatsApp API Phone</label>
                      <input
                        type="text" required
                        value={studioForm.whatsapp || ""}
                        onChange={(e) => setStudioForm({ ...studioForm, whatsapp: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-slate-50 text-slate-950 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Operating Email</label>
                    <input
                      type="email" required
                      value={studioForm.email || ""}
                      onChange={(e) => setStudioForm({ ...studioForm, email: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-slate-50 text-slate-950 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Street / Venue HQ Address</label>
                    <textarea
                      rows={2} required
                      value={studioForm.address || ""}
                      onChange={(e) => setStudioForm({ ...studioForm, address: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-slate-50 text-slate-950 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Google Maps Coordination Link</label>
                    <input
                      type="text" required
                      value={studioForm.maps_url || ""}
                      onChange={(e) => setStudioForm({ ...studioForm, maps_url: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-slate-50 text-slate-950 focus:outline-none"
                    />
                  </div>

                  <button type="submit" disabled={loading} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer">
                    {loading ? "Rebranding..." : "Apply Global Studio Rebrand ✓"}
                  </button>
                </form>
              </div>
            )}

            {/* 9. TAB: PASSWORD CONTROL CENTER */}
            {activeTab === "passwords" && (
              <div className="bg-white border border-purple-100 rounded-3xl p-6 text-left max-w-5xl mx-auto shadow-xs space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-purple-50">
                  <div>
                    <h3 className="text-base font-black uppercase text-purple-700 flex items-center gap-1.5">
                      🔑 User Password Recovery Desk
                    </h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
                      Security-verified password recovery queue
                    </p>
                  </div>
                  <button
                    onClick={loadPasswordRetrievals}
                    disabled={loadingRetrievals}
                    className="self-start md:self-auto px-4 py-2 border border-purple-100 hover:bg-purple-50 text-purple-700 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer bg-white"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingRetrievals ? "animate-spin" : ""}`} />
                    Refresh Queue
                  </button>
                </div>

                {loadingRetrievals ? (
                  <div className="py-20 text-center text-xs text-slate-500 font-mono font-bold animate-pulse">
                    Scanning database logs for retrievals...
                  </div>
                ) : passwordRetrievals.length === 0 ? (
                  <div className="py-20 text-center border-2 border-dashed border-purple-50 rounded-2xl bg-purple-50/10 space-y-2">
                    <p className="text-xs font-black text-slate-400">No pass retrieval requests found in the system registry.</p>
                    <p className="text-[10px] text-slate-400 font-medium font-sans">When clients use the "Forgot Password" option, it will show up here for live dispatch.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
                    <table className="w-full border-collapse text-left text-xs bg-white">
                      <thead>
                        <tr className="bg-purple-50/40 border-b border-light-200 text-[10px] font-black uppercase tracking-wider text-purple-900 select-none">
                          <th className="p-4">Requested At</th>
                          <th className="p-4">Client Detail</th>
                          <th className="p-4">Temp Password</th>
                          <th className="p-4">Sender Phone (Admin Mobile)</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-center">Security Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {passwordRetrievals.map((req: any) => {
                          const isPending = req.status === "pending";
                          return (
                            <tr key={req.id} className="hover:bg-purple-50/10 transition-colors">
                              <td className="p-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                                {new Date(req.created_at).toLocaleString()}
                              </td>
                              <td className="p-4">
                                <div className="space-y-0.5">
                                  <p className="font-extrabold text-slate-900">{req.username}</p>
                                  <p className="text-[10px] text-slate-500 font-semibold">{req.phone}</p>
                                </div>
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <span className="px-2 py-1 bg-stone-100 font-mono font-bold rounded-md select-all text-xs border border-stone-200 text-slate-800">
                                  {req.temp_password}
                                </span>
                              </td>
                              <td className="p-4 whitespace-nowrap font-mono font-bold text-slate-650">
                                {studioDetails?.mobile || "Not set"}
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  req.status === "approved" 
                                    ? "bg-emerald-100 text-emerald-800" 
                                    : req.status === "declined" 
                                    ? "bg-rose-100 text-rose-800" 
                                    : "bg-amber-100 text-amber-800 animate-pulse"
                                }`}>
                                  {req.status}
                                </span>
                              </td>
                              <td className="p-4 text-center whitespace-nowrap">
                                {isPending ? (
                                  <div className="inline-flex gap-2">
                                    <button
                                      onClick={async () => {
                                        const confirmed = await askConfirmation(
                                          "Approve Temp Password Retrieval?",
                                          `Are you sure you want to approve this request? This will change ${req.username}'s active login password to '${req.temp_password}', and simulate notifying their mobile number (${req.phone}).`
                                        );
                                        if (!confirmed) return;
                                        try {
                                          await api.approvePasswordRetrieval(req.id);
                                          triggerAlert(`Approved! Temporary password hash has updated the client's logins. SMS simulated and routed.`);
                                          loadPasswordRetrievals();
                                        } catch (err: any) {
                                          triggerAlert("Error: " + err.message);
                                        }
                                      }}
                                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-lg transition-all text-[11px] flex items-center gap-1 cursor-pointer"
                                    >
                                      Approve & Notify SMS
                                    </button>
                                    <button
                                      onClick={async () => {
                                        const confirmed = await askConfirmation(
                                          "Decline Retrieval Request?",
                                          `Rejecting this request will discard the recovery code and keep the client's original active password unaltered. Proceed?`
                                        );
                                        if (!confirmed) return;
                                        try {
                                          await api.declinePasswordRetrieval(req.id);
                                          triggerAlert("Password retrieval discarded.");
                                          loadPasswordRetrievals();
                                        } catch (err: any) {
                                          triggerAlert("Error: " + err.message);
                                        }
                                      }}
                                      className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 text-slate-600 font-black rounded-lg transition-all text-[11px] cursor-pointer"
                                    >
                                      Decline
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic font-bold">No active action needed</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Custom Promise-Based Confirmation Modal */}
      <AnimatePresence>
        {confirmState && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => confirmState.resolve(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 text-left shadow-2xl border border-slate-100 z-10"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900">
                    {confirmState.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    {confirmState.message}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => confirmState.resolve(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => confirmState.resolve(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm animate-pulse"
                >
                  Confirm Action
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
