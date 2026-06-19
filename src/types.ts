export interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  points: number;
  created_at?: string;
  role: "user";
  total_revenue?: number;
}

export interface Admin {
  id: number;
  username: string;
  email: string;
  role: "admin";
}

export interface Service {
  id: number;
  name: string;
  image_url: string;
  description: string;
  starting_price: number;
}

export interface Equipment {
  id: number;
  name: string;
  price: number;
  description: string;
  image_url: string;
  duration: string;
}

export interface PackageItem {
  equipment_name: string;
  quantity: number;
}

export interface Package {
  id: number;
  name: string;
  price: number;
  description: string;
  items: PackageItem[];
}

export interface Booking {
  id: number;
  user_id: number;
  event_name: string;
  event_date: string;
  event_location: string;
  package_id: number | null;
  package_name: string | null;
  package_price: number | null;
  subtotal: number;
  discount: number;
  total_price: number;
  advance_paid: number;
  status: "draft" | "confirmed" | "completed" | "cancelled";
  payment_status: "pending" | "20_percent_paid" | "90_percent_paid" | "fully_paid";
  created_at: string;
  equipments?: { equipment_name: string; price: number }[];
  username?: string; // Hydrated for admin panel
  email?: string;    // Hydrated for admin panel
  phone?: string;    // Hydrated for admin panel
}

export interface Cart {
  id: number;
  user_id: number;
  event_name: string | null;
  event_date: string | null;
  event_location: string | null;
  package_id: number | null;
  equipment_ids: string | null; // JSON String
}

export interface Payment {
  id: number;
  booking_id: number;
  amount: number;
  stage: "20_percent" | "70_percent" | "10_percent";
  transaction_id: string;
  status: "pending" | "completed" | "failed";
  created_at: string;
}

export interface Reward {
  id: number;
  user_id: number;
  booking_id: number | null;
  points_earned: number;
  points_redeemed: number;
  description: string;
  created_at: string;
}

export interface GalleryImage {
  id: number;
  image_url: string;
  title: string | null;
  created_at?: string;
}

export interface StudioDetails {
  id: number;
  name: string;
  tagline: string;
  logo_url: string;
  mobile: string;
  whatsapp: string;
  address: string;
  email: string;
  maps_url: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  sent_via: string;
  created_at: string;
  username?: string; // Hydrated
  email?: string;    // Hydrated
}
