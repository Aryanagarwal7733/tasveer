const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tasveer_studio';

let isConnected = false;

async function connectDB() {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    await autoSeedInitialData();
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection warning/error: ${error.message}`);
    console.log('[MongoDB] Running in resilience mode: Local memory/file fallback will handle requests if MongoDB is offline.');
  }
}

async function autoSeedInitialData() {
  try {
    const Product = require('../models/Product');
    const CMS = require('../models/CMS');
    const Coupon = require('../models/Coupon');
    const Order = require('../models/Order');
    const User = require('../models/User');

    // 1. Seed Products if count is 0
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      const dbPath = path.join(__dirname, '..', 'db_compressed.json');
      if (fs.existsSync(dbPath)) {
        const raw = fs.readFileSync(dbPath, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.products) && data.products.length > 0) {
          const validProducts = data.products.map(p => ({
            id: p.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name: p.name || p.title || 'Untitled Product',
            title: p.title || p.name || 'Untitled Product',
            category: p.category || 'cat_photo_prints',
            price: Number(p.price || p.basePrice || 99),
            originalPrice: Number(p.originalPrice || 199),
            basePrice: Number(p.basePrice || p.price || 99),
            rating: Number(p.rating || 5),
            reviews: Number(p.reviews || 10),
            badge: p.badge || '',
            stock: Number(p.stock || 50),
            sku: p.sku || '',
            image: p.image || 'tasveer-banner.jpg',
            desc: p.desc || '',
            details: p.details || {},
            sizes: p.sizes || [],
            moldings: p.moldings || [],
            formats: p.formats || [],
            isDeleted: Boolean(p.isDeleted),
            isActive: !p.isDeleted
          }));

          await Product.insertMany(validProducts);
          console.log(`[MongoDB Seeder] Successfully seeded ${validProducts.length} products into MongoDB!`);
        }
      }
    }

    // 2. Seed CMS settings if none
    const cmsDoc = await CMS.findOne({ key: 'main' });
    if (!cmsDoc) {
      let defaultCms = {
        key: 'main',
        cms: {
          logoTitle: "Tasveer",
          logoSub: "by Prince Studio",
          heroTitle: "Crafting Royal <span>Gallery Art</span> For Your Walls",
          heroSubtext: "Upload your personal photos, select real Italian wood moldings, white mount borders, and order with instant UPI & WhatsApp soft-proof approval!",
          heroBtnText: "📸 Upload & Frame Photo (₹499)",
          announcementText: "Official Prince Studio Online Art Gallery | Custom Framing",
          heroImageUrl: "hero-poster.png"
        },
        draft_cms: null,
        published_status: "published",
        bento_header: {
          tag: "Gallery Architecture",
          title: "Framing Collections Bento Grid"
        },
        bento_cards: [
          { id: "bento_1", title: "Italian Wooden Wall Frames", desc: "Handcrafted solid teak & oak wood borders with acid-free white matting.", image: "https://images.unsplash.com/photo-1544457070-4cd773b4d71e?w=800&auto=format&fit=crop", tag: "Bestseller", category: "cat_photo_frames", size: "bento-large" },
          { id: "bento_2", title: "Canvas Prints", desc: "100% Cotton Textured HD prints.", image: "https://images.unsplash.com/photo-1579541814924-49fef17c5be5?w=600&auto=format&fit=crop", tag: "Fine Art", category: "cat_canvas_prints", size: "bento-tall" },
          { id: "bento_3", title: "Glossy Acrylic Prints", desc: "Shatterproof float glass style.", image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop", tag: "3D Float", category: "cat_acrylic", size: "bento-standard" },
          { id: "bento_4", title: "Custom HD Posters", desc: "Premium 300GSM matte lab prints.", image: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=500&auto=format&fit=crop", tag: "Studio HD", category: "cat_poster_frames", size: "bento-standard" }
        ],
        advantages: [
          { id: "adv_1", icon: "fa-hammer", title: "Handcrafted Teak Wood", desc: "Premium solid natural wood moldings sourced from certified forests." },
          { id: "adv_2", icon: "fa-shield-alt", title: "100% Acid Free Mounts", desc: "Museum-grade matting protects your photographs for 100+ years." },
          { id: "adv_3", icon: "fa-award", title: "Lifetime Color Guarantee", desc: "300GSM archival paper prints guaranteed against fading." },
          { id: "adv_4", icon: "fa-truck-fast", title: "24hr Express Delivery", desc: "Fast local dispatch across Sawai Madhopur & doorstep delivery across India." }
        ],
        faqs: [
          { id: "faq_1", question: "How long does custom photo framing take?", answer: "Local orders in Sawai Madhopur are ready within 24 hours. Express shipping across India takes 3-5 business days." },
          { id: "faq_2", question: "What is the recommended photo resolution?", answer: "For 12x18 inch frames or larger, we recommend images above 2000x3000 pixels (3MB+). Our engine automatically checks photo DPI." },
          { id: "faq_3", question: "Do you provide white mount borders?", answer: "Yes, all our wooden wall frames come with 100% acid-free white matting options ranging from 10mm to 30mm width." }
        ],
        social_links: {
          whatsapp: "https://wa.me/917231900124",
          instagram: "https://instagram.com/princestudioswm",
          facebook: "https://facebook.com/princestudiomadhopur",
          youtube: "https://youtube.com/@princestudiomadhopur"
        },
        footer: {
          aboutTitle: "Tasveer by Prince Studio",
          aboutText: "Premier custom photo framing, acrylic prints, and canvas art gallery studio in Sawai Madhopur, Rajasthan.",
          phone: "+91 72319 00124",
          email: "Princestudioswm@gmail.com",
          address: "Main Market Road, Sawai Madhopur, Rajasthan 322001",
          copyright: "© 2026 Tasveer by Prince Studio. All Rights Reserved."
        }
      };

      const dbPath = path.join(__dirname, '..', 'db_compressed.json');
      if (fs.existsSync(dbPath)) {
        try {
          const raw = fs.readFileSync(dbPath, 'utf8');
          const data = JSON.parse(raw);
          if (data.cms) defaultCms.cms = { ...defaultCms.cms, ...data.cms };
          if (data.bento_header) defaultCms.bento_header = data.bento_header;
          if (data.bento_cards) defaultCms.bento_cards = data.bento_cards;
          if (data.advantages) defaultCms.advantages = data.advantages;
          if (data.footer) defaultCms.footer = data.footer;
        } catch (e) {}
      }

      await CMS.create(defaultCms);
      console.log('[MongoDB Seeder] Successfully seeded CMS & Bento Grid data into MongoDB!');
    }

    // 3. Seed Coupons if none
    const couponCount = await Coupon.countDocuments();
    if (couponCount === 0) {
      await Coupon.insertMany([
        { code: "WELCOME10", discountType: "percent", value: 10, minCart: 300, expiry: "2026-12-31", isActive: true },
        { code: "TASVEER100", discountType: "fixed", value: 100, minCart: 500, expiry: "2026-12-31", isActive: true }
      ]);
      console.log('[MongoDB Seeder] Seeded default coupons into MongoDB!');
    }

    // 4. Seed Admin User
    const adminUser = await User.findOne({ username: 'admin' });
    if (!adminUser) {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('prince123', 10);
      await User.create({ username: 'admin', password: hash, role: 'admin' });
      console.log('[MongoDB Seeder] Seeded default admin account (admin / prince123) into MongoDB!');
    }
  } catch (seedErr) {
    console.warn('[MongoDB Seeder] Seeding warning:', seedErr.message);
  }
}

module.exports = { connectDB, mongoose, isConnected: () => isConnected };
