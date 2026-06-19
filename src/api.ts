import { 
  User, Admin, Service, Equipment, Package, 
  Booking, Cart, Payment, Reward, GalleryImage, 
  StudioDetails, Notification 
} from "./types.js";

const BASE_URL = ""; // Relative paths will hit Express directly

function getHeaders() {
  const token = localStorage.getItem("studio_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  async register(payload: any): Promise<{ token: string; user: User }> {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async login(payload: any): Promise<{ token: string; user: User }> {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async loginAdmin(payload: any): Promise<{ token: string; admin: Admin }> {
    const res = await fetch(`${BASE_URL}/api/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async me(): Promise<{ user: User | Admin }> {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async updateProfile(payload: { username: string; phone: string }): Promise<{ user: User }> {
    const res = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // Studio Details
  async getStudioDetails(): Promise<StudioDetails> {
    const res = await fetch(`${BASE_URL}/api/studio-details`);
    return handleResponse(res);
  },

  async updateStudioDetails(payload: Partial<StudioDetails>): Promise<{ details: StudioDetails }> {
    const res = await fetch(`${BASE_URL}/api/studio-details`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // Services
  async getServices(): Promise<Service[]> {
    const res = await fetch(`${BASE_URL}/api/services`);
    return handleResponse(res);
  },

  async addService(payload: Partial<Service>): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/services`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async updateService(id: number, payload: Partial<Service>): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/services/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async deleteService(id: number): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/services/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Equipments
  async getEquipments(): Promise<Equipment[]> {
    const res = await fetch(`${BASE_URL}/api/equipments`);
    return handleResponse(res);
  },

  async addEquipment(payload: Partial<Equipment>): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/equipments`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async updateEquipment(id: number, payload: Partial<Equipment>): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/equipments/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async deleteEquipment(id: number): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/equipments/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Packages
  async getPackages(): Promise<Package[]> {
    const res = await fetch(`${BASE_URL}/api/packages`);
    return handleResponse(res);
  },

  async addPackage(payload: Partial<Package>): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/packages`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async updatePackage(id: number, payload: Partial<Package>): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/packages/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async deletePackage(id: number): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/packages/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Gallery
  async getGallery(): Promise<GalleryImage[]> {
    const res = await fetch(`${BASE_URL}/api/gallery`);
    return handleResponse(res);
  },

  async addGalleryImage(payload: Partial<GalleryImage>): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/gallery`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async deleteGalleryImage(id: number): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/gallery/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Cart
  async getCart(): Promise<Cart> {
    const res = await fetch(`${BASE_URL}/api/cart`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async saveCart(payload: { 
    event_name?: string | null; 
    event_date?: string | null; 
    event_location?: string | null; 
    package_id?: number | null; 
    equipment_ids?: number[] | null; 
  }): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/cart`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async clearCart(): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/cart`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Bookings
  async checkout(payload: {
    event_name: string;
    event_date: string;
    event_location: string;
    package_id: number | null;
    equipment_ids: number[] | null;
    redeem_points: boolean;
  }): Promise<{ 
    bookingId: number; 
    totalPrice: number; 
    advancePaymentNeeded: number; 
    discountApplied: number; 
  }> {
    const res = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async getBookings(): Promise<Booking[]> {
    const res = await fetch(`${BASE_URL}/api/bookings`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getBookingDetails(id: number): Promise<Booking & { payments: Payment[] }> {
    const res = await fetch(`${BASE_URL}/api/bookings/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async updateBooking(id: number, payload: { status?: string; payment_status?: string }): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/bookings/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async deleteBooking(id: number): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/bookings/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Payments
  async makePayment(payload: { booking_id: number; amount: number; stage: string }): Promise<{
    message: string;
    transaction_id: string;
    stage: string;
    amount: number;
  }> {
    const res = await fetch(`${BASE_URL}/api/payments`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // Rewards
  async getRewards(): Promise<{ total_points: number; history: Reward[] }> {
    const res = await fetch(`${BASE_URL}/api/rewards`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    const res = await fetch(`${BASE_URL}/api/notifications`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async sendNotification(payload: { user_id: number; title: string; message: string; type?: string; sent_via?: string }): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/notifications`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // Users Admin management
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${BASE_URL}/api/users`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async updateUser(id: number, payload: Partial<User>): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/users/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async deleteUser(id: number): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/users/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Admin Dashboard stats
  async getStats(): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // FCM & Offline Missed Bookings Catch-Up
  async registerFcmToken(token: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/admin/register-fcm-token`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ token }),
    });
    return handleResponse(res);
  },

  async getMissedBookings(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/api/admin/missed-bookings`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async markMissedBookingsRead(logIds: number[]): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/admin/mark-logs-read`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ logIds }),
    });
    return handleResponse(res);
  },

  // Password retrieval api services
  async requestPasswordRetrieval(identifier: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier }),
    });
    return handleResponse(res);
  },

  async getPasswordRetrievals(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/api/admin/password-retrievals`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async approvePasswordRetrieval(id: number): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/admin/password-retrievals/${id}/approve`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async declinePasswordRetrieval(id: number): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/admin/password-retrievals/${id}/decline`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Customer Reviews
  async getReviews(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/api/reviews`);
    return handleResponse(res);
  },

  async addReview(payload: { booking_id: number; rating: number; review_text: string }): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/reviews`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  }
};
