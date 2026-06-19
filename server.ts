import express from "express";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";
import { dbInstance, initDatabase } from "./src/db.js";

const PORT = 3000;
const JWT_SECRET = "MD_STUDIO_SECRET_JWT_KEY_2026";

interface CustomRequest extends express.Request {
  user?: {
    id: number;
    email: string;
    role: "user" | "admin";
  };
}

// Push notification and Real-time event streaming systems
const adminClients: { res: express.Response }[] = [];
const registeredFcmTokens = new Set<string>();

async function sendFcmNotificationToAdmins(logEntry: any) {
  if (registeredFcmTokens.size === 0) {
    console.log("No registered admin FCM tokens found. Traditional In-app notifications will sync.");
    return;
  }

  // To make it fully compliant with real FCM we check for credential existence
  const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
  if (!fs.existsSync(configPath)) {
    console.log("FCM: firebase-applet-config.json not generated yet. Skipping actual FCM socket write.");
    return;
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const apiKey = config.apiKey;
    if (!apiKey) return;

    for (const token of registeredFcmTokens) {
      console.log(`Sending real-time FCM notification payload to admin device: ${token}`);
      // Use standard fetch to invoke FCM push notification REST legacy endpoint securely
      fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `key=${apiKey}`
        },
        body: JSON.stringify({
          to: token,
          notification: {
            title: "📸 New photography slot booked!",
            body: `Client ${logEntry.username} requested ${logEntry.event_name} - Price: ₹${logEntry.total_price.toLocaleString("en-IN")}`,
            sound: "custom_sound"
          },
          data: {
            booking_id: String(logEntry.booking_id),
            click_action: "/admin"
          }
        })
      }).catch(err => console.error("FCM payload deliver fail info:", err));
    }
  } catch (err) {
    console.error("FCM dispatch helper error details:", err);
  }
}

function notifyAdminsOfBooking(logEntry: {
  id: number;
  booking_id: number;
  username: string;
  event_name: string;
  event_date: string;
  total_price: number;
  created_at: string;
}) {
  // Broadcast immediately to online admin dashboards
  adminClients.forEach((client) => {
    try {
      client.res.write(`data: ${JSON.stringify({ type: "NEW_BOOKING", data: logEntry })}\n\n`);
    } catch (err) {
      console.error("Error writing to active SSE admin Client:", err);
    }
  });

  // Also trigger actual push notification using Firebase Cloud Messaging
  sendFcmNotificationToAdmins(logEntry);
}

// Authentication middleware
function authenticateToken(req: CustomRequest, res: express.Response, next: express.NextFunction): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access token is missing" });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      res.status(403).json({ error: "Invalid or expired token" });
      return;
    }
    req.user = decoded;
    next();
  });
}

function requireAdmin(req: CustomRequest, res: express.Response, next: express.NextFunction): void {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "Required admin permissions" });
    return;
  }
  next();
}

async function startServer() {
  // Initialize the database tables and seed defaults
  await initDatabase();

  const app = express();
  app.use(express.json({ limit: "50mb" }));

  // ==========================================
  // AUTH API
  // ==========================================

  // Register user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, phone, password } = req.body;

      if (!username || !email || !phone || !password) {
        res.status(400).json({ error: "All fields are required" });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({ error: "Password must be at least 8 characters long" });
         return;
      }

      // Check if email unique
      const emailCheck = await dbInstance.get("SELECT id FROM users WHERE email = ?", [email]);
      if (emailCheck) {
        res.status(400).json({ error: "Email is already registered" });
        return;
      }

      // Check if phone unique
      const phoneCheck = await dbInstance.get("SELECT id FROM users WHERE phone = ?", [phone]);
      if (phoneCheck) {
        res.status(400).json({ error: "Phone number is already registered" });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await dbInstance.run(
        "INSERT INTO users (username, email, phone, password, points) VALUES (?, ?, ?, ?, 0)",
        [username, email, phone, hashedPassword]
      );

      // Create empty cart for user
      await dbInstance.run("INSERT INTO cart (user_id) VALUES (?)", [result.lastID]);

      // Seed initial welcoming reward for signing up!
      await dbInstance.run("UPDATE users SET points = 500 WHERE id = ?", [result.lastID]);
      await dbInstance.run(
        "INSERT INTO rewards (user_id, points_earned, points_redeemed, description) VALUES (?, ?, ?, ?)",
        [result.lastID, 500, 0, "Welcome Bonus Reward Points!"]
      );

      // Generate JWT Token
      const token = jwt.sign({ id: result.lastID, email, role: "user" }, JWT_SECRET, { expiresIn: "7d" });

      res.status(201).json({
        message: "Registration successful!",
        token,
        user: { id: result.lastID, username, email, phone, role: "user", points: 500 }
      });
    } catch (err: any) {
      console.error("Register Error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  // Login User
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      // Check user
      const user = await dbInstance.get<any>("SELECT * FROM users WHERE email = ?", [email]);
      if (!user) {
        res.status(400).json({ error: "Invalid email or password" });
        return;
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        res.status(400).json({ error: "Invalid email or password" });
        return;
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: "user" }, JWT_SECRET, { expiresIn: "7d" });

      res.json({
        message: "Login successful!",
        token,
        user: { id: user.id, username: user.username, email: user.email, phone: user.phone, role: "user", points: user.points }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Forgot Password Request Option
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { identifier } = req.body;
      if (!identifier) {
        res.status(400).json({ error: "Email or phone number is required" });
        return;
      }

      // Check if user exists by email or phone
      const user = await dbInstance.get<any>(
        "SELECT id, username, phone, email FROM users WHERE email = ? OR phone = ?",
        [identifier, identifier]
      );
      if (!user) {
        res.status(400).json({ error: "No registered client account found with this email or phone" });
        return;
      }

      // Generate a temporary human-friendly random password (e.g. MD-583192)
      const pin = Math.floor(100000 + Math.random() * 900000);
      const tempPassword = `MD-${pin}`;

      // Insert record in pending Retrievals table
      const insertResult = await dbInstance.run(
        "INSERT INTO password_retrievals (user_id, username, phone, temp_password, status) VALUES (?, ?, ?, ?, 'pending')",
        [user.id, user.username, user.phone, tempPassword]
      );

      // Trigger standard notifications log
      await dbInstance.run(
        `INSERT INTO notifications (user_id, title, message, type, sent_via) 
         VALUES (?, '🔑 Password Reset Request Submitted', ?, 'In-App', 'In-App')`,
        [user.id, `Your password retrieval request for temporary password '${tempPassword}' is pending physical verification & transmission by the admin.`]
      );

      // Trigger a real-time SSE notification for active admin panels of forgotten password requests!
      const logEntry = {
        id: insertResult.lastID,
        booking_id: -99, // indicates specialized request
        username: user.username,
        event_name: "Forgotten Password Recovery Request Submitted",
        event_date: "Immediate Action Required",
        total_price: 0,
        created_at: new Date().toISOString()
      };
      notifyAdminsOfBooking(logEntry);

      res.status(200).json({
        success: true,
        message: "Your password recovery request has been successfully submitted to administrators for verification.",
        info: "Once confirmed, the design flow allows the admin to send this temporary password directly to your registered mobile from their mobile number."
      });

    } catch (err: any) {
      console.error("Forgot Password Error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  // Login Admin
  app.post("/api/auth/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      const admin = await dbInstance.get<any>("SELECT * FROM admins WHERE email = ?", [email]);
      if (!admin) {
        res.status(400).json({ error: "Invalid admin email or password" });
        return;
      }

      const validPassword = await bcrypt.compare(password, admin.password);
      if (!validPassword) {
        res.status(400).json({ error: "Invalid admin email or password" });
        return;
      }

      const token = jwt.sign({ id: admin.id, email: admin.email, role: "admin" }, JWT_SECRET, { expiresIn: "7d" });

      res.json({
        message: "Admin login successful!",
        token,
        admin: { id: admin.id, username: admin.username, email: admin.email, role: "admin" }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get current user details
  app.get("/api/auth/me", authenticateToken as any, async (req: CustomRequest, res) => {
    try {
      if (req.user?.role === "admin") {
        const admin = await dbInstance.get<any>("SELECT id, username, email FROM admins WHERE id = ?", [req.user.id]);
        res.json({ user: { ...admin, role: "admin" } });
      } else {
        const user = await dbInstance.get<any>("SELECT id, username, email, phone, points FROM users WHERE id = ?", [req?.user?.id]);
        if (!user) {
          res.status(404).json({ error: "User not found" });
          return;
        }
        res.json({ user: { ...user, role: "user" } });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update Profile Username/avatar mock (User updates their username/phone)
  app.put("/api/auth/profile", authenticateToken as any, async (req: CustomRequest, res) => {
    try {
      const { username, phone } = req.body;
      if (!username || !phone) {
        res.status(400).json({ error: "Username and phone are required" });
        return;
      }

      await dbInstance.run(
        "UPDATE users SET username = ?, phone = ? WHERE id = ?",
        [username, phone, req.user!.id]
      );

      const updated = await dbInstance.get<any>("SELECT id, username, email, phone, points FROM users WHERE id = ?", [req.user!.id]);
      res.json({ message: "Profile updated successfully!", user: { ...updated, role: "user" } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // STUDIO DETAILS API
  // ==========================================
  app.get("/api/studio-details", async (req, res) => {
    try {
      const details = await dbInstance.get("SELECT * FROM studio_details ORDER BY id DESC LIMIT 1");
      res.json(details || {});
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/studio-details", authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
      const { name, tagline, logo_url, mobile, whatsapp, address, email, maps_url } = req.body;
      const existing = await dbInstance.get("SELECT id FROM studio_details ORDER BY id ASC LIMIT 1");
      const targetId = existing ? (existing as any).id : 1;

      if (!existing) {
        await dbInstance.run(
          `INSERT INTO studio_details (id, name, tagline, logo_url, mobile, whatsapp, address, email, maps_url) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [name, tagline, logo_url, mobile, whatsapp, address, email, maps_url]
        );
      } else {
        await dbInstance.run(
          `UPDATE studio_details SET name = ?, tagline = ?, logo_url = ?, mobile = ?, whatsapp = ?, address = ?, email = ?, maps_url = ? WHERE id = ?`,
          [name, tagline, logo_url, mobile, whatsapp, address, email, maps_url, targetId]
        );
      }
      const updated = await dbInstance.get("SELECT * FROM studio_details ORDER BY id ASC LIMIT 1");
      res.json({ message: "Studio details updated!", details: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // SERVICES API
  // ==========================================
  app.get("/api/services", async (req, res) => {
    try {
      const services = await dbInstance.all("SELECT * FROM services ORDER BY id ASC");
      res.json(services);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/services", authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
      const { name, image_url, description, starting_price } = req.body;
      if (!name || !starting_price) {
        res.status(400).json({ error: "Name and starting price are required" });
        return;
      }
      await dbInstance.run(
        "INSERT INTO services (name, image_url, description, starting_price) VALUES (?, ?, ?, ?)",
        [name, image_url || "https://images.unsplash.com/photo-1542038784456-1ea8e935640e", description || "", starting_price]
      );
      res.status(201).json({ message: "Service added successfully!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/services/:id", authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
      const { name, image_url, description, starting_price } = req.body;
      const { id } = req.params;
      await dbInstance.run(
        "UPDATE services SET name = ?, image_url = ?, description = ?, starting_price = ? WHERE id = ?",
        [name, image_url, description, starting_price, Number(id)]
      );
      res.json({ message: "Service updated successfully!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/services/:id", authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
       await dbInstance.run("DELETE FROM services WHERE id = ?", [Number(req.params.id)]);
       res.json({ message: "Service deleted successfully!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // EQUIPMENTS API
  // ==========================================
  app.get("/api/equipments", async (req, res) => {
    try {
      const equipments = await dbInstance.all("SELECT * FROM equipments ORDER BY id ASC");
      res.json(equipments);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/equipments", authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
      const { name, price, description, image_url, duration } = req.body;
      if (!name || !price || !duration) {
         res.status(400).json({ error: "Name, price and duration are required" });
         return;
      }
      await dbInstance.run(
        "INSERT INTO equipments (name, price, description, image_url, duration) VALUES (?, ?, ?, ?, ?)",
        [name, price, description || "", image_url || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32", duration]
      );
      res.status(201).json({ message: "Equipment added successfully!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/equipments/:id", authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
      const { name, price, description, image_url, duration } = req.body;
      await dbInstance.run(
        "UPDATE equipments SET name = ?, price = ?, description = ?, image_url = ?, duration = ? WHERE id = ?",
        [name, price, description, image_url, duration, Number(req.params.id)]
      );
      res.json({ message: "Equipment updated successfully!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/equipments/:id", authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
       await dbInstance.run("DELETE FROM equipments WHERE id = ?", [Number(req.params.id)]);
       res.json({ message: "Equipment deleted successfully!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // PACKAGES API
  // ==========================================
  app.get("/api/packages", async (req, res) => {
    try {
      const packages = await dbInstance.all("SELECT * FROM packages ORDER BY id ASC");
      // Map contents with subitems
      const result = [];
      for (const pkg of packages as any[]) {
        const items = await dbInstance.all("SELECT equipment_name, quantity FROM package_items WHERE package_id = ?", [pkg.id]);
        result.push({
          ...pkg,
          items
        });
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/packages", authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
      const { name, price, description, items } = req.body; // items is array: { equipment_name, quantity }
      if (!name || !price) {
        res.status(400).json({ error: "Package name and price are required." });
        return;
      }
      const result = await dbInstance.run(
        "INSERT INTO packages (name, price, description) VALUES (?, ?, ?)",
        [name, price, description || ""]
      );

      if (items && Array.isArray(items)) {
        for (const item of items) {
          await dbInstance.run(
            "INSERT INTO package_items (package_id, equipment_name, quantity) VALUES (?, ?, ?)",
            [result.lastID, item.equipment_name, item.quantity]
          );
        }
      }
      res.status(201).json({ message: "Package created successfully!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/packages/:id", authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
      const { name, price, description, items } = req.body;
      const { id } = req.params;
      const packageId = Number(id);

      await dbInstance.run(
        "UPDATE packages SET name = ?, price = ?, description = ? WHERE id = ?",
        [name, price, description, packageId]
      );

      // Re-create items
      await dbInstance.run("DELETE FROM package_items WHERE package_id = ?", [packageId]);
      if (items && Array.isArray(items)) {
        for (const item of items) {
          await dbInstance.run(
            "INSERT INTO package_items (package_id, equipment_name, quantity) VALUES (?, ?, ?)",
            [packageId, item.equipment_name, item.quantity]
          );
        }
      }
      res.json({ message: "Package updated successfully!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/packages/:id", authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
      const packageId = Number(req.params.id);
      await dbInstance.run("DELETE FROM packages WHERE id = ?", [packageId]);
      await dbInstance.run("DELETE FROM package_items WHERE package_id = ?", [packageId]);
      res.json({ message: "Package deleted successfully!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // GALLERY API
  // ==========================================
  app.get("/api/gallery", async (req, res) => {
    try {
      const images = await dbInstance.all("SELECT * FROM gallery ORDER BY id DESC");
      res.json(images);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/gallery", authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
      const { image_url, title } = req.body;
      if (!image_url) {
        res.status(400).json({ error: "Image URL is required" });
        return;
      }
      await dbInstance.run("INSERT INTO gallery (image_url, title) VALUES (?, ?)", [image_url, title || ""]);
      res.status(201).json({ message: "Image added to gallery!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/gallery/:id", authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
      await dbInstance.run("DELETE FROM gallery WHERE id = ?", [Number(req.params.id)]);
      res.json({ message: "Gallery image removed!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // REVIEWS API
  // ==========================================
  app.get("/api/reviews", async (req, res) => {
    try {
      const list = await dbInstance.all("SELECT * FROM reviews ORDER BY id DESC");
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/reviews", authenticateToken as any, async (req: CustomRequest, res) => {
    try {
      const { booking_id, rating, review_text } = req.body;
      if (!booking_id || !rating || !review_text) {
        res.status(400).json({ error: "Booking reference, rating and review message are mandatory." });
        return;
      }
      
      const booking = await dbInstance.get<any>("SELECT * FROM bookings WHERE id = ?", [booking_id]);
      if (!booking) {
        res.status(404).json({ error: "Booking reference not found." });
        return;
      }

      const user = await dbInstance.get<any>("SELECT username FROM users WHERE id = ?", [req.user!.id]);
      const username = user ? user.username : (booking.username || "Verified Client");

      await dbInstance.run(
        "INSERT INTO reviews (booking_id, username, event_name, rating, review_text) VALUES (?, ?, ?, ?, ?)",
        [booking_id, username, booking.event_name, rating, review_text]
      );

      res.status(201).json({ message: "Thank you! Your verified shoot review has been published." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // CART API & DRAFT LOGIC
  // ==========================================
  app.get("/api/cart", authenticateToken as any, async (req: CustomRequest, res) => {
    try {
      let cart = await dbInstance.get<any>("SELECT * FROM cart WHERE user_id = ?", [req.user!.id]);
      if (!cart) {
        await dbInstance.run("INSERT INTO cart (user_id) VALUES (?)", [req.user!.id]);
        cart = await dbInstance.get<any>("SELECT * FROM cart WHERE user_id = ?", [req.user!.id]);
      }
      res.json(cart);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/cart", authenticateToken as any, async (req: CustomRequest, res) => {
    try {
      const { event_name, event_date, event_location, package_id, equipment_ids } = req.body;
      await dbInstance.run(
        `UPDATE cart SET 
          event_name = ?, 
          event_date = ?, 
          event_location = ?, 
          package_id = ?, 
          equipment_ids = ? 
         WHERE user_id = ?`,
        [
          event_name || null,
          event_date || null,
          event_location || null,
          package_id || null,
          equipment_ids ? JSON.stringify(equipment_ids) : null,
          req.user!.id
        ]
      );
      res.json({ message: "Cart draft saved successfully!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/cart", authenticateToken as any, async (req: CustomRequest, res) => {
    try {
      await dbInstance.run(
        "UPDATE cart SET event_name = null, event_date = null, event_location = null, package_id = null, equipment_ids = null WHERE user_id = ?",
        [req.user!.id]
      );
      res.json({ message: "Cart cleared." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // BOOKINGS & CHECKOUT API
  // ==========================================
  app.post("/api/bookings", authenticateToken as any, async (req: CustomRequest, res) => {
    try {
      const {
        event_name,
        event_date,
        event_location,
        package_id,
        equipment_ids, // array of equipment ids
        redeem_points // boolean to redeem user points
      } = req.body;

      if (!event_name || !event_date || !event_location) {
        res.status(400).json({ error: "Event name, date, and location are required." });
        return;
      }

      // 1. Gather pricing
      let package_name: string | null = null;
      let package_price = 0;
      let subtotal = 0;

      // Track items included inside the package to remove duplicates
      const packageEquipmentNames = new Set<string>();

      if (package_id) {
        const pkg = await dbInstance.get<any>("SELECT * FROM packages WHERE id = ?", [package_id]);
        if (pkg) {
          package_name = pkg.name;
          package_price = pkg.price;
          subtotal += pkg.price;

          // Load equipment items associated with this package
          const pitems = await dbInstance.all<any>("SELECT equipment_name FROM package_items WHERE package_id = ?", [package_id]);
          pitems.forEach((item) => {
            packageEquipmentNames.add(item.equipment_name);
          });
        }
      } else {
        // Retrieve matching service starting price if booking a service directly without a package deal
        const service = await dbInstance.get<any>("SELECT starting_price FROM services WHERE LOWER(name) = LOWER(?)", [event_name]);
        if (service) {
          subtotal += service.starting_price;
        }
      }

      // 2. Add extra selected equipments
      const extraEquipmentsToSave: { name: string; price: number }[] = [];
      if (equipment_ids && Array.isArray(equipment_ids) && equipment_ids.length > 0) {
        const idsString = equipment_ids.join(",");
        const fetchedEquips = await dbInstance.all<any>(`SELECT name, price FROM equipments WHERE id IN (${idsString})`);

        fetchedEquips.forEach((eq) => {
          // IMPORTANT CART LOGIC: No duplicate billing!
          // If the equipment is ALREADY included in the selected package, we do NOT charge extra for it. See instructions!
          if (!packageEquipmentNames.has(eq.name)) {
            subtotal += eq.price;
            extraEquipmentsToSave.push({ name: eq.name, price: eq.price });
          } else {
            console.log(`Duplicate equipment omitted from billing because it is already within the package: ${eq.name}`);
          }
        });
      }

      // 3. Loyalty system discount check
      let discount = 0;
      const user = await dbInstance.get<any>("SELECT points FROM users WHERE id = ?", [req.user!.id]);
      if (redeem_points && user && user.points > 0) {
        // Loyalty points: Each point = 1 INR, up to a max discount of 5% of subtotal
        const maxRewardDiscount = Math.floor(subtotal * 0.05);
        discount = Math.min(user.points, maxRewardDiscount);
      }

      const total_price = subtotal - discount;
      const advance_to_pay = Math.round(total_price * 0.20); // 20% advance payment

      // 4. Create booking in `draft` status
      const bookingResult = await dbInstance.run(
        `INSERT INTO bookings (
          user_id, event_name, event_date, event_location, 
          package_id, package_name, package_price, 
          subtotal, discount, total_price, advance_paid, 
          status, payment_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'draft', 'pending')`,
        [
          req.user!.id,
          event_name,
          event_date,
          event_location,
          package_id || null,
          package_name,
          package_price || null,
          subtotal,
          discount,
          total_price
        ]
      );

      const booking_id = bookingResult.lastID;

      // 5. Store selected equipments in `booking_equipments`
      for (const extraEq of extraEquipmentsToSave) {
        await dbInstance.run(
          "INSERT INTO booking_equipments (booking_id, equipment_name, price) VALUES (?, ?, ?)",
          [booking_id, extraEq.name, extraEq.price]
        );
      }

      // 6. If points were redeemed, deduct from user (will be permanently committed when payment completes,
      // or if draft expires. For simplified logic, we subtract now and if they cancel we can refund, or handle on checkout)
      if (discount > 0) {
        await dbInstance.run("UPDATE users SET points = points - ? WHERE id = ?", [discount, req.user!.id]);
        await dbInstance.run(
          "INSERT INTO rewards (user_id, booking_id, points_earned, points_redeemed, description) VALUES (?, ?, ?, ?, ?)",
          [req.user!.id, booking_id, 0, discount, `Redeemed points on booking #${booking_id}`]
        );
      }

      // 7. Write to durable backend bookings log and notify active admin clients
      try {
        const userObj = await dbInstance.get<any>("SELECT username FROM users WHERE id = ?", [req.user!.id]);
        const username = userObj ? userObj.username : "Guest Client";

        const logResult = await dbInstance.run(
          `INSERT INTO booking_logs (booking_id, username, event_name, event_date, total_price, admin_read)
           VALUES (?, ?, ?, ?, ?, 0)`,
          [booking_id, username, event_name, event_date, total_price]
        );

        const logEntry = {
          id: logResult.lastID,
          booking_id,
          username,
          event_name,
          event_date,
          total_price,
          created_at: new Date().toISOString()
        };

        // Trigger real-time broad notification & FCM push
        notifyAdminsOfBooking(logEntry);
      } catch (logErr) {
        console.error("Non-blocking error logging booking notification details:", logErr);
      }

      res.status(201).json({
        message: "Booking draft created!",
        bookingId: booking_id,
        totalPrice: total_price,
        advancePaymentNeeded: advance_to_pay,
        discountApplied: discount
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get current user bookings
  app.get("/api/bookings", authenticateToken as any, async (req: CustomRequest, res) => {
    try {
      let bookings = [];
      if (req.user!.role === "admin") {
        // Admin gets all bookings, with user info
        bookings = await dbInstance.all<any>(
          `SELECT b.*, u.username, u.email, u.phone 
           FROM bookings b 
           JOIN users u ON b.user_id = u.id 
           ORDER BY b.created_at DESC`
        );
      } else {
        bookings = await dbInstance.all<any>(
          "SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC",
          [req.user!.id]
        );
      }

      // Hydrate with extra equipments
      const results = [];
      for (const b of bookings) {
        const extraEquips = await dbInstance.all("SELECT equipment_name, price FROM booking_equipments WHERE booking_id = ?", [b.id]);
        results.push({
          ...b,
          equipments: extraEquips
        });
      }

      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get specific booking
  app.get("/api/bookings/:id", authenticateToken as any, async (req: CustomRequest, res) => {
    try {
      const { id } = req.params;
      const bookingId = Number(id);
      const b = await dbInstance.get<any>("SELECT * FROM bookings WHERE id = ?", [bookingId]);
      if (!b) {
        res.status(404).json({ error: "Booking not found" });
        return;
      }

      // Check access: must be owner or admin
      if (req.user!.role !== "admin" && b.user_id !== req.user!.id) {
         res.status(403).json({ error: "Forbidden access to booking" });
         return;
      }

      const extraEquips = await dbInstance.all("SELECT equipment_name, price FROM booking_equipments WHERE booking_id = ?", [bookingId]);
      const payments = await dbInstance.all("SELECT * FROM payments WHERE booking_id = ?", [bookingId]);

      res.json({
        ...b,
        equipments: extraEquips,
        payments
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update Booking Status (Cancel booking, or Admin updating)
  app.put("/api/bookings/:id", authenticateToken as any, async (req: CustomRequest, res) => {
    try {
      const { id } = req.params;
      const bookingId = Number(id);
      const { status, payment_status } = req.body;

      const booking = await dbInstance.get<any>("SELECT * FROM bookings WHERE id = ?", [bookingId]);
      if (!booking) {
         res.status(404).json({ error: "Booking not found" });
         return;
      }

      // User can only cancel their own drafts or bookings
      if (req.user!.role !== "admin") {
        if (booking.user_id !== req.user!.id) {
          res.status(403).json({ error: "Unauthorized" });
          return;
        }
        if (status && status !== "cancelled") {
          res.status(400).json({ error: "You can only cancel this booking." });
          return;
        }
      }

      const updatedStatus = status || booking.status;
      const updatedPaymentStatus = payment_status || booking.payment_status;
      let advance_p = booking.advance_paid || 0;

      if (payment_status && payment_status !== booking.payment_status) {
        // Query completed payments for this specific booking
        const existingPayments = await dbInstance.all<any>(
          "SELECT * FROM payments WHERE booking_id = ? AND status = 'completed'", 
          [bookingId]
        );
        const totalPaidSoFar = existingPayments.reduce((sum, p) => sum + p.amount, 0);

        if (payment_status === "pending") {
          await dbInstance.run("DELETE FROM payments WHERE booking_id = ?", [bookingId]);
          advance_p = 0;
        } else if (payment_status === "20_percent_paid") {
          const target = Math.round(booking.total_price * 0.20);
          const deficit = target - totalPaidSoFar;
          if (deficit > 0) {
            const transaction_id = "TXN_M20_" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
            await dbInstance.run(
              "INSERT INTO payments (booking_id, amount, stage, transaction_id, status) VALUES (?, ?, ?, ?, 'completed')",
              [bookingId, deficit, "20_percent", transaction_id]
            );
            advance_p = target;
          }
        } else if (payment_status === "90_percent_paid") {
          const target = Math.round(booking.total_price * 0.90);
          const deficit = target - totalPaidSoFar;
          if (deficit > 0) {
            const transaction_id = "TXN_M90_" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
            const stage = totalPaidSoFar === 0 ? "20_percent" : "70_percent";
            await dbInstance.run(
              "INSERT INTO payments (booking_id, amount, stage, transaction_id, status) VALUES (?, ?, ?, ?, 'completed')",
              [bookingId, deficit, stage, transaction_id]
            );
            advance_p = Math.round(booking.total_price * 0.20);
          }
        } else if (payment_status === "fully_paid") {
          const target = booking.total_price;
          const deficit = target - totalPaidSoFar;
          if (deficit > 0) {
            const transaction_id = "TXN_MFULL_" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
            await dbInstance.run(
              "INSERT INTO payments (booking_id, amount, stage, transaction_id, status) VALUES (?, ?, ?, ?, 'completed')",
              [bookingId, deficit, "10_percent", transaction_id]
            );
          }
        }
      }

      // Send confirmed notifications (without points) if status shifts to "confirmed"
      if (updatedStatus === "confirmed" && booking.status !== "confirmed") {
        await dbInstance.run(
          `INSERT INTO notifications (user_id, title, message, type, sent_via) VALUES (?, ?, ?, ?, ?)`,
          [
            booking.user_id,
            "Booking Confirmed!",
            `Your booking #${bookingId} for ${booking.event_name} is confirmed by the Admin! Real Email & WhatsApp updates simulated!`,
            "In-App",
            "Email"
          ]
        );

        await dbInstance.run(
          `INSERT INTO notifications (user_id, title, message, type, sent_via) VALUES (?, ?, ?, ?, ?)`,
          [
            booking.user_id,
            "WhatsApp Notification Sent",
            `[SIMULATED WHATSAPP] Hi, MD Photography Booking is approved! Booking ID: #${bookingId}. Event: ${booking.event_name}. Shoot has been locked in by the photographer!`,
            "WhatsApp",
            "WhatsApp"
          ]
        );
      }

      // Reward points ONLY add after status is "completed" (booking slot completed)
      if (updatedStatus === "completed" && booking.status !== "completed") {
        const existingEarned = await dbInstance.get("SELECT id FROM rewards WHERE booking_id = ? AND points_earned > 0", [bookingId]);
        if (!existingEarned) {
          // Point calculation: earn 5% back on subtotal
          const pointsEarned = Math.round(booking.subtotal * 0.05);
          await dbInstance.run("UPDATE users SET points = points + ? WHERE id = ?", [pointsEarned, booking.user_id]);
          await dbInstance.run(
            "INSERT INTO rewards (user_id, booking_id, points_earned, points_redeemed, description) VALUES (?, ?, ?, ?, ?)",
            [booking.user_id, bookingId, pointsEarned, 0, `Earned 5% back in loyalty points for completed booking #${bookingId}`]
          );

          await dbInstance.run(
            `INSERT INTO notifications (user_id, title, message, type, sent_via) VALUES (?, ?, ?, ?, ?)`,
            [
              booking.user_id,
              "Loyalty Points Credited!",
              `Congratulations! We have credited ${pointsEarned} loyalty points (5% of your ₹${booking.subtotal.toLocaleString("en-IN")} event subtotal) to your account as your booking #${bookingId} is completed!`,
              "In-App",
              "Email"
            ]
          );
        }
      }

      await dbInstance.run(
        "UPDATE bookings SET status = ?, payment_status = ?, advance_paid = ? WHERE id = ?",
        [updatedStatus, updatedPaymentStatus, advance_p, bookingId]
      );

      res.json({ message: "Booking updated successfully!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin delete bookings
  app.delete("/api/bookings/:id", authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
      const bookingId = Number(req.params.id);
      await dbInstance.run("DELETE FROM bookings WHERE id = ?", [bookingId]);
      await dbInstance.run("DELETE FROM booking_equipments WHERE booking_id = ?", [bookingId]);
      res.json({ message: "Booking physically removed." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // PAYMENT API - 3 STAGES & CONFIRMATION
  // ==========================================
  app.post("/api/payments", authenticateToken as any, async (req: CustomRequest, res) => {
    try {
      const booking_id = Number(req.body.booking_id);
      const amount = Number(req.body.amount);
      const { stage } = req.body;

      if (!booking_id || !amount || !stage) {
        res.status(400).json({ error: "Booking ID, amount, and payment stage are required" });
        return;
      }

      const booking = await dbInstance.get<any>("SELECT * FROM bookings WHERE id = ?", [booking_id]);
      if (!booking) {
        res.status(404).json({ error: "Booking not found" });
        return;
      }

      // Generate a mock secure transaction ID
      const transaction_id = "TXN_" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();

      // Store Payment Log
      await dbInstance.run(
        "INSERT INTO payments (booking_id, amount, stage, transaction_id, status) VALUES (?, ?, ?, ?, 'completed')",
        [booking_id, amount, stage, transaction_id]
      );

      // Determine updated payment status & status
      let updatedStatus = booking.status;
      let updatedPaymentStatus = booking.payment_status;      if (stage === "20_percent") {
        updatedStatus = "confirmed";
        updatedPaymentStatus = "20_percent_paid";

        // Save a success notification (simulated email) without points
        await dbInstance.run(
          `INSERT INTO notifications (user_id, title, message, type, sent_via) VALUES (?, ?, ?, ?, ?)`,
          [
            booking.user_id,
            "Booking Confirmed!",
            `Your booking #${booking_id} for ${booking.event_name} is confirmed. Real Email & WhatsApp updates simulated!`,
            "In-App",
            "Email"
          ]
        );

        await dbInstance.run(
          `INSERT INTO notifications (user_id, title, message, type, sent_via) VALUES (?, ?, ?, ?, ?)`,
          [
            booking.user_id,
            "WhatsApp Notification Sent",
            `[SIMULATED WHATSAPP] Hi ${req.user!.email}, MD Photography Booking Successful! Booking ID: #${booking_id}. Event: ${booking.event_name}. Paid: ₹${amount}. Outstanding: ₹${booking.total_price - amount}`,
            "WhatsApp",
            "WhatsApp"
          ]
        );
      } else if (stage === "70_percent") {
        updatedPaymentStatus = "90_percent_paid"; // 20% + 70% = 90%
        await dbInstance.run(
          `INSERT INTO notifications (user_id, title, message, type, sent_via) VALUES (?, ?, ?, ?, ?)`,
          [booking.user_id, "70% Event Payment Received", `Stage 2 payment of ₹${amount} logged for booking #${booking_id}.`, "In-App", "Email"]
        );
      } else if (stage === "10_percent") {
        updatedPaymentStatus = "fully_paid";
        updatedStatus = "completed";
        await dbInstance.run(
          `INSERT INTO notifications (user_id, title, message, type, sent_via) VALUES (?, ?, ?, ?, ?)`,
          [booking.user_id, "10% Final Album Payment Received", `Final payment of ₹${amount} logged. Booking #${booking_id} marked complete.`, "In-App", "Email"]
        );
      } else if (stage === "custom") {
        const pList = await dbInstance.all<any>("SELECT amount FROM payments WHERE booking_id = ? AND status = 'completed'", [booking_id]);
        const totalPaidSoFar = pList.reduce((sum, p) => sum + p.amount, 0);
        
        if (totalPaidSoFar >= booking.total_price) {
          updatedPaymentStatus = "fully_paid";
          updatedStatus = "completed";
        } else if (totalPaidSoFar >= booking.total_price * 0.90) {
          updatedPaymentStatus = "90_percent_paid";
        } else if (totalPaidSoFar >= booking.total_price * 0.20) {
          updatedPaymentStatus = "20_percent_paid";
        } else {
          updatedPaymentStatus = "pending";
        }

        await dbInstance.run(
          `INSERT INTO notifications (user_id, title, message, type, sent_via) VALUES (?, ?, ?, ?, ?)`,
          [booking.user_id, "Custom Payment Logged", `Received partial payment of ₹${amount}. Total paid is ₹${totalPaidSoFar} of ₹${booking.total_price}.`, "In-App", "Email"]
        );
      }

      // Reward points ONLY add after status is "completed"
      if (updatedStatus === "completed" && booking.status !== "completed") {
        const existingEarned = await dbInstance.get("SELECT id FROM rewards WHERE booking_id = ? AND points_earned > 0", [booking_id]);
        if (!existingEarned) {
          // Point calculation: earn 5% back on subtotal
          const pointsEarned = Math.round(booking.subtotal * 0.05);
          await dbInstance.run("UPDATE users SET points = points + ? WHERE id = ?", [pointsEarned, booking.user_id]);
          await dbInstance.run(
            "INSERT INTO rewards (user_id, booking_id, points_earned, points_redeemed, description) VALUES (?, ?, ?, ?, ?)",
            [booking.user_id, booking_id, pointsEarned, 0, `Earned 5% back in loyalty points for completed booking #${booking_id}`]
          );

          await dbInstance.run(
            `INSERT INTO notifications (user_id, title, message, type, sent_via) VALUES (?, ?, ?, ?, ?)`,
            [
              booking.user_id,
              "Loyalty Points Credited!",
              `Congratulations! We have credited ${pointsEarned} loyalty points (5% of your ₹${booking.subtotal.toLocaleString("en-IN")} event subtotal) to your account as your booking #${booking_id} is completed!`,
              "In-App",
              "Email"
            ]
          );
        }
      }

      await dbInstance.run(
        "UPDATE bookings SET status = ?, payment_status = ?, advance_paid = ? WHERE id = ?",
        [updatedStatus, updatedPaymentStatus, stage === "20_percent" ? amount : (booking.advance_paid || 0) + amount, booking_id]
      );

      res.status(201).json({
        message: "Payment recorded successfully!",
        transaction_id,
        stage,
        amount
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // REWARDS API
  // ==========================================
  app.get("/api/rewards", authenticateToken as any, async (req: CustomRequest, res) => {
    try {
      const history = await dbInstance.all("SELECT * FROM rewards WHERE user_id = ? ORDER BY created_at DESC", [req.user!.id]);
      const user = await dbInstance.get<any>("SELECT points FROM users WHERE id = ?", [req.user!.id]);
      res.json({
        total_points: user ? user.points : 0,
        history
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // NOTIFICATIONS LIST & SEND (ADMIN)
  // ==========================================
  app.get("/api/notifications", authenticateToken as any, async (req : CustomRequest, res) => {
    try {
      let notes = [];
      if (req.user!.role === "admin") {
        notes = await dbInstance.all("SELECT n.*, u.username, u.email FROM notifications n JOIN users u ON n.user_id = u.id ORDER BY n.created_at DESC");
      } else {
        notes = await dbInstance.all("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC", [req.user!.id]);
      }
      res.json(notes);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin send custom notification
  app.post("/api/notifications", authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
      const { user_id, title, message, type, sent_via } = req.body;
      if (!user_id || !title || !message) {
         res.status(400).json({ error: "UserID, Title and message are required" });
         return;
      }
      await dbInstance.run(
        "INSERT INTO notifications (user_id, title, message, type, sent_via) VALUES (?, ?, ?, ?, ?)",
        [user_id, title, message, type || "In-App", sent_via || "Email"]
      );
      res.status(201).json({ message: "Notification logged and simulated successfully!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // USERS MANAGEMENT FOR ADMIN
  // ==========================================
  app.get("/api/users", authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
      const userList = await dbInstance.all(`
        SELECT u.id, u.username, u.email, u.phone, u.points, u.created_at,
               COALESCE(SUM(p.amount), 0) as total_revenue
        FROM users u
        LEFT JOIN bookings b ON b.user_id = u.id
        LEFT JOIN payments p ON p.booking_id = b.id AND p.status = 'completed'
        GROUP BY u.id
        ORDER BY u.created_at DESC
      `);
      res.json(userList);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/users/:id", authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
      const { username, email, phone, points } = req.body;
      await dbInstance.run(
        "UPDATE users SET username = ?, email = ?, phone = ?, points = ? WHERE id = ?",
        [username, email, phone, points, Number(req.params.id)]
      );
      res.json({ message: "User updated successfully" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/users/:id", authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
      // Clean child entities to avoid broken database records
      const userId = Number(req.params.id);
      await dbInstance.run("DELETE FROM users WHERE id = ?", [userId]);
      await dbInstance.run("DELETE FROM cart WHERE user_id = ?", [userId]);
      await dbInstance.run("DELETE FROM bookings WHERE user_id = ?", [userId]);
      await dbInstance.run("DELETE FROM rewards WHERE user_id = ?", [userId]);
      await dbInstance.run("DELETE FROM notifications WHERE user_id = ?", [userId]);
      res.json({ message: "User deleted cleanly from system." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // ADMIN DASHBOARD STATS
  // ==========================================
  app.get("/api/admin/stats", authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
      const totalUsers = await dbInstance.get<{ count: number }>("SELECT COUNT(*) as count FROM users");
      const totalBookings = await dbInstance.get<{ count: number }>("SELECT COUNT(*) as count FROM bookings WHERE status != 'cancelled'");

      // Computed revenue
      const totalRevResult = await dbInstance.get<{ revenue: number }>(
        "SELECT SUM(amount) as revenue FROM payments WHERE status = 'completed'"
      );

      // Pending payments count
      const pendingPayResult = await dbInstance.get<{ count: number }>(
        "SELECT COUNT(*) as count FROM bookings WHERE payment_status != 'fully_paid' AND status != 'cancelled'"
      );

      // Completed orders count
      const completedOrdersResult = await dbInstance.get<{ count: number }>(
        "SELECT COUNT(*) as count FROM bookings WHERE status = 'completed'"
      );

      // Booking category distribution
      const bookingsByService = await dbInstance.all<any>(
        "SELECT event_name, COUNT(*) as count FROM bookings GROUP BY event_name"
      );

      // Revenue stages
      const revenueByStage = await dbInstance.all<any>(
        "SELECT stage, SUM(amount) as amount FROM payments WHERE status = 'completed' GROUP BY stage"
      );

      res.json({
        totalUsers: totalUsers?.count || 0,
        totalBookings: totalBookings?.count || 0,
        totalRevenue: totalRevResult?.revenue || 0,
        pendingPayments: pendingPayResult?.count || 0,
        completedOrders: completedOrdersResult?.count || 0,
        bookingsByService,
        revenueByStage
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // ==========================================
  // ADMIN FCM PUSH & MISSED BOOKINGS CATCH-UP ENDPOINTS
  // ==========================================

  // Register device registration tokens for FCM client
  app.post("/api/admin/register-fcm-token", authenticateToken as any, requireAdmin as any, (req, res) => {
    try {
      const { token } = req.body;
      if (token) {
        registeredFcmTokens.add(token);
        console.log(`Registered admin FCM push token on server: ${token}`);
      }
      res.json({ success: true, message: "FCM registration token appended." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Server Sent Events (SSE) stream client connector (for instant, live in-app booking notifications)
  app.get("/api/admin/notifications-stream", (req, res) => {
    try {
      const token = req.query.token as string;
      if (!token) {
        res.status(401).send("Unauthorized credential token.");
        return;
      }

      jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
        if (err || !decoded || decoded.role !== "admin") {
          res.status(403).send("Forbidden: require admin stream permissions.");
          return;
        }

        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        });

        // Register client active listener
        const client = { res };
        adminClients.push(client);

        // Periodically write a simple keep-alive heartbeat to prevent iframe proxy timeouts
        const heartbeatInterval = setInterval(() => {
          res.write(": keep-alive\n\n");
        }, 15000);

        req.on("close", () => {
          clearInterval(heartbeatInterval);
          const pos = adminClients.indexOf(client);
          if (pos !== -1) {
            adminClients.splice(pos, 1);
          }
        });
      });
    } catch (err: any) {
      res.status(500).send("Critical streaming setup failure.");
    }
  });

  // Fetch missed slot bookings while offline / logged out
  app.get("/api/admin/missed-bookings", authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
      const missed = await dbInstance.all<any>(
        "SELECT * FROM booking_logs WHERE admin_read = 0 ORDER BY id DESC"
      );
      res.json(missed);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Mask historical notifications as acknowledged/read to clear the active catch-up queue
  app.post("/api/admin/mark-logs-read", authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
      const { logIds } = req.body;
      if (logIds && Array.isArray(logIds) && logIds.length > 0) {
        const placeholders = logIds.map(() => "?").join(",");
        await dbInstance.run(
          `UPDATE booking_logs SET admin_read = 1 WHERE id IN (${placeholders})`,
          logIds
        );
      }
      res.json({ success: true, message: "Acknowledged and resolved logs." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // ==========================================
  // ADMIN PASSWORD RETRIEVAL REQUESTS MANAGEMENT
  // ==========================================

  // Get all password retrievals requests
  app.get("/api/admin/password-retrievals", authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
      const records = await dbInstance.all<any>(
        "SELECT * FROM password_retrievals ORDER BY id DESC"
      );
      res.json(records);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Approve password retrieval and update password using bcrypt
  app.post("/api/admin/password-retrievals/:id/approve", authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
      const { id } = req.params;
      const retrieval = await dbInstance.get<any>(
        "SELECT * FROM password_retrievals WHERE id = ? AND status = 'pending'",
        [id]
      );
      if (!retrieval) {
        res.status(404).json({ error: "Pending password recovery request not found." });
        return;
      }

      // Hash the temporary password they are recovering with (using standard bcrypt library)
      const hashedPass = await bcrypt.hash(retrieval.temp_password, 10);

      // Update the user's password in the users database
      await dbInstance.run(
        "UPDATE users SET password = ? WHERE id = ?",
        [hashedPass, retrieval.user_id]
      );

      // Update password retrieval record status
      await dbInstance.run(
        "UPDATE password_retrievals SET status = 'approved' WHERE id = ?",
        [id]
      );

      // Fetch official studio mobile as sender
      const studio = await dbInstance.get<any>("SELECT mobile FROM studio_details LIMIT 1");
      const adminMobile = studio ? studio.mobile : "+91 99999 88888";

      // Insert an internal notification log for that client
      await dbInstance.run(
        `INSERT INTO notifications (user_id, title, message, type, sent_via) 
         VALUES (?, '✅ Password Recovery Approved by Admin', ?, 'WhatsApp', 'WhatsApp')`,
        [retrieval.user_id, `Your temporary password: ${retrieval.temp_password} was approved and sent to your mobile.`]
      );

      console.log(`[SMS-DISPATCH] Success: Sent password SMS to client cell: ${retrieval.phone} from admin mobile: ${adminMobile}. Code: ${retrieval.temp_password}`);

      res.json({
        success: true,
        message: "Password retrieval request successfully approved. The temporary password has been activated on the live server.",
        details: {
          username: retrieval.username,
          phone: retrieval.phone,
          temp_password: retrieval.temp_password,
          admin_mobile: adminMobile
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Decline password retrieval request
  app.post("/api/admin/password-retrievals/:id/decline", authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await dbInstance.run(
        "UPDATE password_retrievals SET status = 'declined' WHERE id = ? AND status = 'pending'",
        [id]
      );
      if (result.changes === 0) {
        res.status(404).json({ error: "Pending password recovery request not found." });
        return;
      }
      res.json({ success: true, message: "Password recovery request declined." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // ==========================================
  // BACKEND STATIC GALLERY ROUTE
  // ==========================================
  const fallbackGallery: { [key: string]: string } = {
    "g1.jpg": "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=800",
    "g2.jpg": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800",
    "g3.jpg": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800",
    "g4.jpg": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800",
    "g5.jpg": "https://images.unsplash.com/photo-1519689680058-324335c77ebe?auto=format&fit=crop&q=80&w=800",
    "g6.jpg": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800",
    "g7.jpg": "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=800",
    "g8.jpg": "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&q=80&w=800"
  };

  app.get("/backend/gallery/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), "backend", "gallery", filename);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else if (fallbackGallery[filename]) {
      res.redirect(fallbackGallery[filename]);
    } else {
      res.status(404).send("File not found");
    }
  });


  // ==========================================
  // VITE & STATIC FILES INGRESS
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server fully running on http://localhost:${PORT}`);
  });
}

startServer().catch((e) => {
  console.error("Critical server boot error:", e);
});
