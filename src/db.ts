import sqlite3 from "sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const DB_PATH = path.resolve(process.cwd(), "studio.db");

// Promisified DB execution helpers
export class Database {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error("Error opening SQLite database:", err.message);
      } else {
        console.log("Connected to SQLite database at:", DB_PATH);
      }
    });
  }

  run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row as T);
      });
    });
  }

  all<T>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as T[]);
      });
    });
  }

  exec(sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

export const dbInstance = new Database();

export async function initDatabase() {
  console.log("Initializing SQLite tables...");

  // 1. users Table
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. admins Table
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  // 3. services Table
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      image_url TEXT,
      description TEXT,
      starting_price REAL NOT NULL
    )
  `);

  // 4. equipments Table
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS equipments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      image_url TEXT,
      duration TEXT NOT NULL
    )
  `);

  // 5. packages Table
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      price REAL NOT NULL,
      description TEXT
    )
  `);

  // 6. package_items Table
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS package_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      package_id INTEGER NOT NULL,
      equipment_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY(package_id) REFERENCES packages(id) ON DELETE CASCADE
    )
  `);

  // 7. bookings Table
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      event_name TEXT NOT NULL,
      event_date TEXT NOT NULL,
      event_location TEXT NOT NULL,
      package_id INTEGER,
      package_name TEXT,
      package_price REAL,
      subtotal REAL NOT NULL,
      discount REAL DEFAULT 0,
      total_price REAL NOT NULL,
      advance_paid REAL DEFAULT 0,
      status TEXT NOT NULL, -- draft, confirmed, completed, cancelled
      payment_status TEXT NOT NULL, -- pending, 20_percent_paid, 90_percent_paid, fully_paid
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // 8. booking_equipments Table
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS booking_equipments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      equipment_name TEXT NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY(booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    )
  `);

  // 9. cart Table
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      event_name TEXT,
      event_date TEXT,
      event_location TEXT,
      package_id INTEGER,
      equipment_ids TEXT, -- JSON string array of equipment IDs
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 10. payments Table
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      stage TEXT NOT NULL, -- 20_percent, 70_percent, 10_percent
      transaction_id TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL, -- pending, completed, failed
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(booking_id) REFERENCES bookings(id)
    )
  `);

  // 11. rewards Table
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      booking_id INTEGER,
      points_earned INTEGER DEFAULT 0,
      points_redeemed INTEGER DEFAULT 0,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // 12. gallery Table
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_url TEXT NOT NULL,
      title TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 13. studio_details Table
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS studio_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      tagline TEXT,
      logo_url TEXT,
      mobile TEXT,
      whatsapp TEXT,
      address TEXT,
      email TEXT,
      maps_url TEXT
    )
  `);

  // 14. notifications Table
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL, -- Email, WhatsApp, In-App
      sent_via TEXT NOT NULL, -- Email, WhatsApp
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // 15. booking_logs Table for maintaining missed admin notifications
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS booking_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      event_name TEXT NOT NULL,
      event_date TEXT NOT NULL,
      total_price REAL NOT NULL,
      admin_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 16. password_retrievals Table for storing pending forgot password requests
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS password_retrievals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      phone TEXT NOT NULL,
      temp_password TEXT NOT NULL,
      status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'declined'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // 17. reviews Table for user feedback
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      event_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      review_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("Tables created successfully. Seeding default data...");

  // Seed default admin
  const adminExists = await dbInstance.get("SELECT * FROM admins WHERE email = ?", ["admin@mdphotography.com"]);
  if (!adminExists) {
    const adminHashedPassword = await bcrypt.hash("admin123", 10);
    await dbInstance.run(
      "INSERT INTO admins (username, email, password) VALUES (?, ?, ?)",
      ["admin", "admin@mdphotography.com", adminHashedPassword]
    );
    console.log("Default admin seeded: admin@mdphotography.com / admin123");
  }

  // Seed default studio_details
  const detailsExists = await dbInstance.get("SELECT * FROM studio_details LIMIT 1");
  if (!detailsExists) {
    await dbInstance.run(
      `INSERT INTO studio_details (name, tagline, logo_url, mobile, whatsapp, address, email, maps_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "MD Photography",
        "Capturing Memories Forever",
        "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=200",
        "+91 98765 43210",
        "+91 98765 43210",
        "123 Frame Lane, Memory Street, Hyderabad, Telangana, 500001",
        "contact@mdphotography.com",
        "https://maps.google.com/?q=MD+Photography+Hyderabad"
      ]
    );
    console.log("Default studio details seeded.");
  }

  // Seed default services (always clear and re-insert to keep names, descriptions, and starting prices in-sync)
  await dbInstance.run("DELETE FROM services");
  // Reset sequence if applicable
  try {
    await dbInstance.run("DELETE FROM sqlite_sequence WHERE name='services'");
  } catch (e) {
    // Non-blocking
  }

  const defaultServices = [
    {
      name: "Engagement",
      starting_price: 20000,
      desc: "Capture the precious ring-exchange moment with pre-designed couple portraits. (100 pic with 1xAlbum and video)",
      img: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "Pre/post Wedding shoot in outdoor",
      starting_price: 25000,
      desc: "A creative cinematic session at aesthetic outdoor spots before your big day. (photo soft copy and vedio 3 min song with edit)",
      img: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "Haldi & Nalugu",
      starting_price: 20000,
      desc: "Fun-filled candid portraits and reels covered in joyous turmeric colors (100 pic with IxAlbum and video)",
      img: "https://images.unsplash.com/photo-1607190074257-dd4b7af0309f?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "Mehendi",
      starting_price: 20000,
      desc: "Intricate henna detail photography paired with energetic group dancing clips. (100 pic with 1xAlbum and yldea)",
      img: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "Birthday Parties",
      starting_price: 20000,
      desc: "Active games, party sessions, and quick candid photobooths for guests. (100 pic with 1xAlbum and video)",
      img: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "Mini Events",
      starting_price: 12000,
      desc: "Vibrant coverage of themed stages, laughter, and high-energy cake cuttings. only photos (100 pic with 1xAlbum)",
      img: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "Naming Ceremony",
      starting_price: 20000,
      desc: "Candid family memories of the child's naming rituals and celebrations. (100 pic with 1xAlbum and video)",
      img: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "New Born Baby Shoot",
      starting_price: 12000,
      desc: "Adorable baby portraits with safe thematic props and comforting set lighting. (only photo soft copy)",
      img: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "pre/Post outdoor photo shoot",
      starting_price: 15000,
      desc: "Relaxed couple portraits post-ceremony designed for beautiful memory books. (soft copy only)",
      img: "https://images.unsplash.com/photo-1507504038482-7621c210ee20?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "Public Events",
      starting_price: 20000,
      desc: "Sharp event coverage with crowd interaction clips, banner designs, and live feeds. (soft copy only photo and video)",
      img: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "Reception",
      starting_price: 25000,
      desc: "Elegant stage portraits and comprehensive coverage of evening banquets. (150 pic with 1xAlbum and video)",
      img: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "Short Films & Ads",
      starting_price: 35000,
      desc: "Cinematic commercial and short media production with sound recording. wedding Promo's, Teasers",
      img: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "Srimantham / Seemantham",
      starting_price: 20000,
      desc: "Beautifully capturing the traditional baby shower rituals with family blessings. (100 pic with 1xAlbum and video)",
      img: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "Wedding",
      starting_price: 25000,
      desc: "Complete emotional and high-fidelity coverage of the sacred vows and rituals. (120 pic with 1xAlbum and video)",
      img: "https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=600"
    }
  ];

  for (const service of defaultServices) {
    await dbInstance.run(
      "INSERT INTO services (name, image_url, description, starting_price) VALUES (?, ?, ?, ?)",
      [service.name, service.img, service.desc, service.starting_price]
    );
  }
  console.log("Seeded 14 default services successfully.");

  // Seed default equipments (8 of them)
  const equipmentsCount = await dbInstance.get<{ count: number }>("SELECT COUNT(*) as count FROM equipments");
  if (equipmentsCount && equipmentsCount.count === 0) {
    const defaultEquipments = [
      { name: "Traditional Photography", price: 25000, desc: "Standard candid stage coverage with raw backups.", duration: "Full Event", img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=600" },
      { name: "Candid Photography", price: 35000, desc: "Premium documentary-style emotional captures.", duration: "Full Event", img: "https://images.unsplash.com/photo-1520390138845-1200dfa2790d?auto=format&fit=crop&q=80&w=600" },
      { name: "Traditional Videography", price: 60000, desc: "High quality full long-form wedding movie coverage.", duration: "Full Event", img: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=600" },
      { name: "Candid Videography", price: 65000, desc: "Aesthetic cinematic films & short high-intensity teaser.", duration: "Full Event", img: "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&q=80&w=600" },
      { name: "Drone Shoot", price: 70000, desc: "Airborne scenic and sweeping entrance video captures.", duration: "4 Hours", img: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&q=80&w=600" },
      { name: "Live Streaming + LED Screen", price: 85000, desc: "Broadcast live streams to YouTube with crisp display screens on-site.", duration: "Full Event", img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=600" },
      { name: "Cinematic Shoot", price: 110000, desc: "Ultra HD slow motion sequences, dedicated color grading.", duration: "2 Days", img: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=600" },
      { name: "Total Cinematic Wedding", price: 170000, desc: "A-Z documentary film crew with dual primary cams, drones & crane rigs.", duration: "3 Days", img: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600" }
    ];

    for (const eq of defaultEquipments) {
      await dbInstance.run(
        "INSERT INTO equipments (name, price, description, image_url, duration) VALUES (?, ?, ?, ?, ?)",
        [eq.name, eq.price, eq.desc, eq.img, eq.duration]
      );
    }
    console.log("Seeded 8 default equipments.");
  }

  // Seed default Packages
  const packagesCount = await dbInstance.get<{ count: number }>("SELECT COUNT(*) as count FROM packages");
  if (packagesCount && packagesCount.count === 0) {
    const defaultPackages = [
      {
        id: 1,
        name: "Basic Package",
        price: 44000,
        desc: "Includes Traditional Photography, Traditional Videography, 35+1 Album, Video Mixing, and 1 Family Photo Frame.",
        items: [
          { name: "Traditional Photography", qty: 1 },
          { name: "Traditional Videography", qty: 1 },
          { name: "Album (35+1)", qty: 1 },
          { name: "Video Mixing", qty: 1 },
          { name: "Family Photo Frame", qty: 1 }
        ]
      },
      {
        id: 2,
        name: "Premium Package",
        price: 52000,
        desc: "Includes Traditional Photography, Traditional Videography, 50+1 Album, Video Mixing, and 1 Family Photo Frame.",
        items: [
          { name: "Traditional Photography", qty: 1 },
          { name: "Traditional Videography", qty: 1 },
          { name: "Album (50+1)", qty: 1 },
          { name: "Video Mixing", qty: 1 },
          { name: "Family Photo Frame", qty: 1 }
        ]
      },
      {
        id: 3,
        name: "Silver Package",
        price: 73000,
        desc: "Includes Traditional Photography, Candid Photography, Traditional Videography, 60+2 Album, Video Mixing, and 2 Family Photo Frames.",
        items: [
          { name: "Traditional Photography", qty: 1 },
          { name: "Candid Photography", qty: 1 },
          { name: "Traditional Videography", qty: 1 },
          { name: "Album (60+2)", qty: 1 },
          { name: "Video Mixing", qty: 1 },
          { name: "Family Photo Frame", qty: 2 }
        ]
      },
      {
        id: 4,
        name: "Silver Premium Package",
        price: 100000,
        desc: "Includes Traditional Photography, Candid Photography, Traditional Videography, Audiocone sound recording, 2 Live LED TVs, 60+2 Album, Video Mixing, and 2 Family Photo Frames.",
        items: [
          { name: "Traditional Photography", qty: 1 },
          { name: "Candid Photography", qty: 1 },
          { name: "Traditional Videography", qty: 1 },
          { name: "Traditional Videography (Audiocone)", qty: 1 },
          { name: "Live LED Smart TV", qty: 2 },
          { name: "Album (60+2)", qty: 1 },
          { name: "Video Mixing", qty: 1 },
          { name: "Family Photo Frame", qty: 2 }
        ]
      },
      {
        id: 5,
        name: "Gold Package",
        price: 125000,
        desc: "Includes Traditional Photography, Candid Photography, Traditional Videography, Audiocone sound recording, Drone Shoot, 80+2 Album, Video Mixing, and 2 Family Photo Frames.",
        items: [
          { name: "Traditional Photography", qty: 1 },
          { name: "Candid Photography", qty: 1 },
          { name: "Traditional Videography", qty: 1 },
          { name: "Traditional Videography (Audiocone)", qty: 1 },
          { name: "Drone Shoot", qty: 1 },
          { name: "Album (80+2)", qty: 1 },
          { name: "Video Mixing", qty: 1 },
          { name: "Family Photo Frame", qty: 2 }
        ]
      },
      {
        id: 6,
        name: "Diamond Package",
        price: 156000,
        desc: "Includes Traditional Photography, Traditional Videography, Candid Photography, Audiocone sound recording, 1 Drone Shoot, 1 Live LED Screen, 100+2 Album, Video Mixing, and 2 Family Photo Frames.",
        items: [
          { name: "Traditional Photography", qty: 1 },
          { name: "Traditional Videography", qty: 1 },
          { name: "Candid Photography", qty: 1 },
          { name: "Traditional Videography (Audiocone)", qty: 1 },
          { name: "Drone Shoot", qty: 1 },
          { name: "Live LED Screen", qty: 1 },
          { name: "Album (100+2)", qty: 1 },
          { name: "Video Mixing", qty: 1 },
          { name: "Family Photo Frame", qty: 2 }
        ]
      },
      {
        id: 7,
        name: "Luxury Package",
        price: 173000,
        desc: "Includes Traditional Photography, Candid Photography, Candid Videography, Traditional Videography, Audiocone sound, Drone Shoot, 2 LED Screens, Pre Wedding Shoot, 120+3 Album, and Video Mixing.",
        items: [
          { name: "Traditional Photography", qty: 1 },
          { name: "Candid Photography", qty: 1 },
          { name: "Candid Videography", qty: 1 },
          { name: "Traditional Videography", qty: 1 },
          { name: "Traditional Videography (Audiocone)", qty: 1 },
          { name: "Drone Shoot", qty: 1 },
          { name: "LED Screens", qty: 2 },
          { name: "Pre Wedding Shoot", qty: 1 },
          { name: "Album (120+3)", qty: 1 },
          { name: "Video Mixing", qty: 1 }
        ]
      }
    ];

    for (const pkg of defaultPackages) {
      await dbInstance.run(
        "INSERT INTO packages (id, name, price, description) VALUES (?, ?, ?, ?)",
        [pkg.id, pkg.name, pkg.price, pkg.desc]
      );

      for (const item of pkg.items) {
        await dbInstance.run(
          "INSERT INTO package_items (package_id, equipment_name, quantity) VALUES (?, ?, ?)",
          [pkg.id, item.name, item.qty]
        );
      }
    }
    console.log("Seeded 7 default packages and details.");
  }

  // Seed default gallery images (8 of them matching the studio grid)
  await dbInstance.run("DELETE FROM gallery");
  const defaultGallery = [
    { url: "/backend/gallery/g1.jpg", title: "Premium Candid Shot" },
    { url: "/backend/gallery/g2.jpg", title: "Fatherly Affection" },
    { url: "/backend/gallery/g3.jpg", title: "Cinematic Outdoor Portrait" },
    { url: "/backend/gallery/g4.jpg", title: "Traditional Costume Portrait" },
    { url: "/backend/gallery/g5.jpg", title: "Cute Krishna Costume Shoot" },
    { url: "/backend/gallery/g6.jpg", title: "High-Tech Macro Framing" },
    { url: "/backend/gallery/g7.jpg", title: "Adorable Toddler Smile" },
    { url: "/backend/gallery/g8.jpg", title: "Heritage Street Decor" }
  ];

  for (const gal of defaultGallery) {
    await dbInstance.run(
      "INSERT INTO gallery (image_url, title) VALUES (?, ?)",
      [gal.url, gal.title]
    );
  }
  console.log("Seeded 8 default gallery images from backend/gallery.");

  // Seed default reviews if table is empty
  const reviewsCount = await dbInstance.get<{ count: number }>("SELECT COUNT(*) as count FROM reviews");
  if (reviewsCount && reviewsCount.count === 0) {
    const defaultReviews = [
      {
        booking_id: 1,
        username: "Sanjana & Rahul",
        event_name: "Wedding Ceremony Booking",
        rating: 5,
        review_text: "MD Photography completely redefined our memories! The candid cinematography feels like a Bollywood movie, and their duplicate prevention billing saved us ₹40,000 in redundant gear costs! Highly endorse them."
      },
      {
        booking_id: 2,
        username: "Venkat Rao",
        event_name: "Haldi & Upanayanam Shoots",
        rating: 5,
        review_text: "Extremely structured group. The crew arrived 30 minutes early, shot beautiful drone angles, and the website's stage payment model (paying 20% advance and 10% after actual album delivery) is very secure."
      },
      {
        booking_id: 3,
        username: "Anjali Deshmukh",
        event_name: "New Born & Naming Ceremony",
        rating: 5,
        review_text: "So patient with my 1-month-old! They used secure soft lighting props and delivered a beautifully layouted family frame. Earned high loyalty rewards points that I'll use on his first birthday!"
      }
    ];
    for (const r of defaultReviews) {
      await dbInstance.run(
        "INSERT INTO reviews (booking_id, username, event_name, rating, review_text) VALUES (?, ?, ?, ?, ?)",
        [r.booking_id, r.username, r.event_name, r.rating, r.review_text]
      );
    }
  }
}
