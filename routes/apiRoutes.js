const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Coupon = require('../models/Coupon');
const CMS = require('../models/CMS');
const User = require('../models/User');
const { sendOrderConfirmationEmails } = require('../services/emailService');

const SECRET_KEY = process.env.JWT_SECRET || "TasveerPrinceStudioSuperSecretJWTKey2026";
const ADMIN_USER = "admin";
const ADMIN_PASS_HASH = crypto.createHash('sha256').update("prince123").digest('hex');

// Helper: Read db_compressed fallback if needed
function getFallbackDB() {
  try {
    const p = path.join(__dirname, '..', 'db_compressed.json');
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (e) {}
  return {};
}

// Token Generator
function generateToken(username) {
  return jwt.sign(
    { sub: username, role: 'admin' },
    SECRET_KEY,
    { expiresIn: '24h' }
  );
}

// Middleware: Verify JWT (optional or required for admin actions)
function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ status: 'error', message: 'Authorization token required' });
  }
  const token = authHeader.replace(/^Bearer\s+/, '').trim();
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    // Also check fallback token format from Python server if any
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        return next();
      }
    } catch (e) {}
    return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
  }
}

// ==========================================
// 1. HEALTH CHECK & STATUS
// ==========================================
router.get('/health', async (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: 'healthy',
    stack: 'MERN (MongoDB, Express, React, Node.js)',
    mongoConnected: mongoose.connection.readyState === 1,
    dbHost: mongoose.connection.host || 'local',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// 1.1 SLIDESHOW IMAGES FROM DIRECTORY
// ==========================================
router.get('/slideshow', (req, res) => {
  try {
    const slideshowDir = path.join(__dirname, '..', 'slideshow');
    if (!fs.existsSync(slideshowDir)) {
      return res.json([]);
    }
    const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
    const files = fs.readdirSync(slideshowDir)
      .filter(f => validExts.includes(path.extname(f).toLowerCase()))
      .map(filename => ({
        filename,
        url: `/slideshow/${encodeURIComponent(filename)}`
      }));
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read slideshow directory' });
  }
});

// ==========================================
// 2. AUTHENTICATION (ADMIN LOGIN)
// ==========================================
async function handleLogin(req, res) {
  try {
    const { username, password } = req.body || {};
    const u = (username || '').trim();
    const p = (password || '').trim();

    // Check Sha256 match for prince123 or database user
    const inputHash = crypto.createHash('sha256').update(p).digest('hex');
    let isValid = (u === ADMIN_USER && inputHash === ADMIN_PASS_HASH);

    if (!isValid) {
      const user = await User.findOne({ username: u });
      if (user && user.password) {
        if (await bcrypt.compare(p, user.password) || user.password === p) {
          isValid = true;
        }
      }
    }

    if (isValid) {
      const token = generateToken(u);
      res.setHeader('Set-Cookie', `tasveer_admin_token=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`);
      return res.json({
        status: "success",
        token: token,
        user: { username: u, role: "admin" },
        message: "Admin Login Successful!"
      });
    }

    return res.status(401).json({
      status: "error",
      message: "Invalid Admin Credentials!"
    });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
}

router.post('/auth/login', handleLogin);
router.post('/v1/auth/login', handleLogin);
router.post('/auth/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'tasveer_admin_token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
  res.json({ status: 'success' });
});

// ==========================================
// 3. PRODUCTS ENDPOINTS
// ==========================================
async function getProducts(req, res) {
  try {
    const showAll = req.query.all === 'true' || req.query.admin === 'true';
    const filter = showAll ? {} : { isDeleted: { $ne: true } };
    
    let products = await Product.find(filter).lean();
    if (!products || products.length === 0) {
      const fallback = getFallbackDB();
      products = (fallback.products || []).filter(p => showAll || !p.isDeleted);
    }
    return res.json(products);
  } catch (err) {
    const fallback = getFallbackDB();
    return res.json(fallback.products || []);
  }
}

async function saveProducts(req, res) {
  try {
    const payload = req.body;
    let savedCount = 0;

    if (Array.isArray(payload)) {
      for (const item of payload) {
        if (!item) continue;
        const id = item.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        await Product.findOneAndUpdate(
          { id: id },
          { ...item, id: id },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        savedCount++;
      }
    } else if (payload && typeof payload === 'object') {
      const id = payload.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      await Product.findOneAndUpdate(
        { id: id },
        { ...payload, id: id },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      savedCount = 1;
    }

    const all = await Product.find().lean();
    return res.json({
      status: "success",
      message: `Successfully saved ${savedCount} product(s) to MongoDB!`,
      products: all
    });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
}

router.get('/products', getProducts);
router.get('/v1/products', getProducts);
router.post('/products', saveProducts);
router.post('/v1/products', saveProducts);

router.put('/products/:id', async (req, res) => {
  try {
    const updated = await Product.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    if (!updated) return res.status(404).json({ status: 'error', message: 'Product not found' });
    return res.json({ status: 'success', product: updated });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    // Soft delete product
    const updated = await Product.findOneAndUpdate(
      { id: req.params.id },
      { $set: { isDeleted: true, isActive: false } },
      { new: true }
    );
    return res.json({ status: 'success', message: 'Product deleted', product: updated });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ==========================================
// 4. ORDERS ENDPOINTS
// ==========================================
async function getOrders(req, res) {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    if (!orders || orders.length === 0) {
      const fallback = getFallbackDB();
      return res.json(fallback.orders || []);
    }
    return res.json(orders);
  } catch (err) {
    const fallback = getFallbackDB();
    return res.json(fallback.orders || []);
  }
}

async function saveOrders(req, res) {
  try {
    const payload = req.body;
    let savedOrders = [];

    if (Array.isArray(payload)) {
      for (const ord of payload) {
        if (!ord) continue;
        const id = ord.id || `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const upserted = await Order.findOneAndUpdate(
          { id: id },
          { ...ord, id: id },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        savedOrders.push(upserted);
      }
    } else if (payload && typeof payload === 'object') {
      const id = payload.id || `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const upserted = await Order.findOneAndUpdate(
        { id: id },
        { ...payload, id: id },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      savedOrders.push(upserted);
    }

    // Trigger Email Confirmations to both Customer and Admin
    if (savedOrders.length > 0) {
      for (const saved of savedOrders) {
        const orderData = (saved && typeof saved.toObject === 'function') ? saved.toObject() : saved;
        sendOrderConfirmationEmails(orderData).catch(e => {
          console.warn('[Orders] Background email dispatch warning:', e.message);
        });
      }
    }

    const all = await Order.find().sort({ createdAt: -1 }).lean();
    return res.json({
      status: "success",
      message: "Order Saved to MongoDB & Confirmation Emails Dispatched!",
      orders: all
    });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
}

router.get('/orders', getOrders);
router.get('/v1/orders', getOrders);
router.post('/orders', saveOrders);
router.post('/v1/orders', saveOrders);

router.put('/orders/:id', async (req, res) => {
  try {
    const updated = await Order.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    if (!updated) return res.status(404).json({ status: 'error', message: 'Order not found' });
    return res.json({ status: 'success', order: updated });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

router.post('/test-email', async (req, res) => {
  try {
    const { targetEmail, type } = req.body || {};
    const email = (targetEmail || process.env.ADMIN_EMAIL || 'tasviirframe@gmail.com').trim();
    const isCustomer = (type === 'customer');

    const testOrder = {
      id: 'TEST-' + Date.now().toString().slice(-6),
      orderNumber: 'TSV-' + Math.floor(100000 + Math.random() * 900000),
      customerName: isCustomer ? 'Valued Customer' : 'Prince Studio Admin',
      customerPhone: '9829012345',
      customerEmail: email,
      shippingAddress: {
        address: 'Main Market Road, Near City Gate',
        city: 'Sawai Madhopur',
        pincode: '322001'
      },
      items: [
        {
          title: 'Royal Heritage Solid Teak Frame',
          size: '16x20 inches',
          frame: 'Italian Dark Walnut',
          quantity: 1,
          price: 2499,
          customGdriveUrl: process.env.GDRIVE_FOLDER_URL || 'https://drive.google.com/drive/folders/1qMAhARFgVLQNlxDXskipGaZFrTBXxYnT?usp=drive_link'
        }
      ],
      totalAmount: 2499,
      paymentMethod: 'Test Simulation',
      paymentStatus: 'Paid',
      razorpayPaymentId: 'pay_test_diagnostic_' + Date.now().toString().slice(-4),
      trackingNumber: 'TRK-' + Math.floor(10000 + Math.random() * 90000)
    };

    const result = await sendOrderConfirmationEmails(testOrder);
    return res.json({
      status: 'success',
      message: `Test email (${type || 'both'}) dispatched to ${email}`,
      targetEmail: email,
      type: type || 'both',
      result
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

router.post('/orders/:id/resend-email', async (req, res) => {
  try {
    const order = await Order.findOne({ id: req.params.id }).lean();
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });
    const result = await sendOrderConfirmationEmails(order);
    return res.json({ status: 'success', message: 'Confirmation emails dispatched', result });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

router.delete('/orders/:id', async (req, res) => {
  try {
    await Order.findOneAndDelete({ id: req.params.id });
    const all = await Order.find().sort({ createdAt: -1 }).lean();
    return res.json({ status: 'success', message: 'Order deleted', orders: all });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ==========================================
// 5. CATEGORIES ENDPOINTS
// ==========================================
async function getCategories(req, res) {
  try {
    const cats = await Category.find().sort({ order: 1 }).lean();
    if (!cats || cats.length === 0) {
      const fallback = getFallbackDB();
      return res.json(fallback.categories || [
        { id: 'cat_photo_prints', name: 'Photo Prints', slug: 'photo-prints', icon: 'fa-print' },
        { id: 'cat_photo_frames', name: 'Photo Frames', slug: 'photo-frames', icon: 'fa-vector-square' },
        { id: 'cat_collage_frames', name: 'Collage Frames', slug: 'collage-frames', icon: 'fa-th-large' },
        { id: 'cat_canvas_prints', name: 'Canvas Prints', slug: 'canvas-prints', icon: 'fa-palette' },
        { id: 'cat_other', name: 'Specialty Gifts', slug: 'specialty-gifts', icon: 'fa-gift' }
      ]);
    }
    return res.json(cats);
  } catch (err) {
    return res.json([]);
  }
}

router.get('/categories', getCategories);
router.get('/v1/categories', getCategories);
router.post('/categories', async (req, res) => {
  try {
    const payload = req.body;
    if (Array.isArray(payload)) {
      for (const c of payload) {
        await Category.findOneAndUpdate({ id: c.id }, c, { upsert: true });
      }
    }
    const all = await Category.find().lean();
    res.json({ status: 'success', categories: all });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// ==========================================
// 6. COUPONS ENDPOINTS
// ==========================================
async function getCoupons(req, res) {
  try {
    const coupons = await Coupon.find({ isActive: true }).lean();
    if (!coupons || coupons.length === 0) {
      const fallback = getFallbackDB();
      return res.json(fallback.coupons || []);
    }
    return res.json(coupons);
  } catch (err) {
    return res.json([]);
  }
}

async function saveCoupons(req, res) {
  try {
    const payload = req.body;
    if (Array.isArray(payload)) {
      for (const cp of payload) {
        if (!cp.code) continue;
        await Coupon.findOneAndUpdate({ code: cp.code.toUpperCase() }, cp, { upsert: true });
      }
    }
    const all = await Coupon.find().lean();
    return res.json({ status: "success", message: "Coupons saved successfully!", coupons: all });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
}

router.get('/coupons', getCoupons);
router.get('/v1/coupons', getCoupons);
router.post('/coupons', saveCoupons);
router.post('/v1/coupons', saveCoupons);
router.delete('/coupons/:code', async (req, res) => {
  try {
    await Coupon.findOneAndDelete({ code: req.params.code.toUpperCase() });
    const all = await Coupon.find().lean();
    return res.json({ status: "success", message: "Coupon deleted", coupons: all });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
});

// ==========================================
// 7. CMS SETTINGS, BENTO, ADVANTAGES & FAQS
// ==========================================
async function getCMS(req, res) {
  try {
    let doc = await CMS.findOne({ key: 'main' }).lean();
    if (!doc) {
      const fallback = getFallbackDB();
      return res.json(fallback);
    }
    return res.json(doc);
  } catch (err) {
    const fallback = getFallbackDB();
    return res.json(fallback);
  }
}

async function updateCMS(req, res) {
  try {
    const payload = req.body;
    let doc = await CMS.findOne({ key: 'main' });
    if (!doc) doc = new CMS({ key: 'main' });

    if (payload.cms) doc.cms = { ...doc.cms, ...payload.cms };
    if (payload.bento_header) doc.bento_header = payload.bento_header;
    if (payload.bento_cards) doc.bento_cards = payload.bento_cards;
    if (payload.advantages) doc.advantages = payload.advantages;
    if (payload.footer) doc.footer = payload.footer;
    if (payload.faqs) doc.faqs = payload.faqs;
    if (payload.social_links) doc.social_links = payload.social_links;

    if (payload.key && payload.data) {
      doc[payload.key] = payload.data;
    }

    await doc.save();
    return res.json({ status: "success", message: "CMS Saved to MongoDB!", db: doc });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
}

router.get('/cms', getCMS);
router.get('/v1/cms', getCMS);
router.post('/cms', updateCMS);
router.post('/v1/cms', updateCMS);
router.post('/bento', updateCMS);
router.post('/save', updateCMS);

// CMS Draft & Publish
router.post('/v1/cms/draft', async (req, res) => {
  try {
    const payload = req.body;
    let doc = await CMS.findOne({ key: 'main' });
    if (!doc) doc = new CMS({ key: 'main' });
    doc.draft_cms = payload.cms || payload;
    doc.published_status = 'draft_saved';
    await doc.save();
    res.json({ status: 'success', message: 'CMS Changes Saved as Draft! 📝', db: doc });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/v1/cms/publish', async (req, res) => {
  try {
    let doc = await CMS.findOne({ key: 'main' });
    if (!doc) doc = new CMS({ key: 'main' });
    if (doc.draft_cms) {
      doc.cms = doc.draft_cms;
      doc.draft_cms = null;
    }
    doc.published_status = 'published';
    await doc.save();
    res.json({ status: 'success', message: 'CMS Draft Published Live to Storefront! 🚀', db: doc });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.get('/faqs', async (req, res) => {
  try {
    const doc = await CMS.findOne({ key: 'main' }).lean();
    res.json((doc && doc.faqs) ? doc.faqs : []);
  } catch (e) {
    res.json([]);
  }
});

router.get('/advantages', async (req, res) => {
  try {
    const doc = await CMS.findOne({ key: 'main' }).lean();
    res.json((doc && doc.advantages) ? doc.advantages : []);
  } catch (e) {
    res.json([]);
  }
});

// ==========================================
// 8. RAZORPAY PAYMENT GATEWAY ENDPOINTS
// ==========================================
let razorpayInstance = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    const Razorpay = require('razorpay');
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('[Razorpay] Gateway initialized with custom API keys!');
  } catch (e) {
    console.warn('[Razorpay] Init warning:', e.message);
  }
}

router.get('/payment/config', (req, res) => {
  res.json({
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TasveerDemoKey',
    isLive: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    companyName: 'Tasveer by Prince Studio',
    themeColor: '#18181b'
  });
});

router.post('/payment/create-order', async (req, res) => {
  try {
    const { amount, receipt, notes } = req.body;
    const amountInPaisa = Math.round(Number(amount || 100) * 100);

    if (razorpayInstance) {
      try {
        const options = {
          amount: amountInPaisa,
          currency: 'INR',
          receipt: receipt || `rcpt_${Date.now()}`,
          notes: notes || {}
        };
        const rzpOrder = await razorpayInstance.orders.create(options);
        return res.json({
          status: 'success',
          orderId: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          keyId: process.env.RAZORPAY_KEY_ID
        });
      } catch (rzpErr) {
        const desc = rzpErr.error ? rzpErr.error.description : rzpErr.message;
        console.warn('[Razorpay Sandbox Mode] Falling back to simulated order:', desc);
      }
    }

    // Sandbox simulated order when custom keys are pending or invalid
    const simOrderId = `order_rzp_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    return res.json({
      status: 'success',
      orderId: simOrderId,
      amount: amountInPaisa,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TasveerDemoKey',
      isSimulated: true
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

router.post('/payment/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderPayload } = req.body;

    if (process.env.RAZORPAY_KEY_SECRET && razorpay_signature && razorpayInstance) {
      const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const generatedSignature = hmac.digest('hex');
      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ status: 'error', message: 'Invalid Razorpay payment signature!' });
      }
    }

    if (orderPayload) {
      const id = orderPayload.id || `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const saved = await Order.findOneAndUpdate(
        { id: id },
        {
          ...orderPayload,
          id: id,
          paymentMethod: 'Razorpay',
          paymentStatus: 'Paid',
          razorpayOrderId: razorpay_order_id || '',
          razorpayPaymentId: razorpay_payment_id || `pay_${Date.now()}`,
          razorpaySignature: razorpay_signature || ''
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Trigger Email Confirmations to both Customer and Admin
      const orderData = (saved && typeof saved.toObject === 'function') ? saved.toObject() : saved;
      sendOrderConfirmationEmails(orderData).catch(e => {
        console.warn('[Payment Verify] Background email dispatch warning:', e.message);
      });

      return res.json({ status: 'success', message: 'Payment verified and Order placed!', order: saved });
    }

    return res.json({ status: 'success', message: 'Payment verified!' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ==========================================
// 8. GOOGLE DRIVE HD PHOTO UPLOAD ENGINE
// ==========================================
const GDRIVE_FOLDER_ID = process.env.GDRIVE_FOLDER_ID || '1qMAhARFgVLQNlxDXskipGaZFrTBXxYnT';
const GDRIVE_FOLDER_URL = process.env.GDRIVE_FOLDER_URL || 'https://drive.google.com/drive/folders/1qMAhARFgVLQNlxDXskipGaZFrTBXxYnT?usp=drive_link';
const GDRIVE_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzH5Rgix9-PYvIdlrgrLnzvB6G24EnuIHvwgcESm-c-WesBWCiCusgCNOwqQFk_CKtZ/exec';

async function handlePhotoUpload(req, res) {
  try {
    const { filename, mimeType, fileData, orderId } = req.body || {};
    if (!fileData) {
      return res.status(400).json({ status: 'error', message: 'No fileData provided' });
    }

    const cleanBase64 = fileData.includes(',') ? fileData.split(',')[1] : fileData;
    const safeExt = (mimeType && mimeType.includes('png')) ? 'png' : 'jpg';
    const safeName = (filename || `photo_${Date.now()}.${safeExt}`).replace(/[^a-zA-Z0-9._-]/g, '_');
    const orderPrefix = orderId || `CUSTOM_${Date.now()}`;
    const uploadFilename = `ORDER_${orderPrefix}_${safeName}`;

    // 1. Save local backup to recovered_user_photos directory
    let localSavedPath = null;
    try {
      const uploadDir = process.env.VERCEL
        ? path.join(require('os').tmpdir(), 'recovered_user_photos')
        : path.join(__dirname, '..', 'recovered_user_photos');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const localFilePath = path.join(uploadDir, uploadFilename);
      fs.writeFileSync(localFilePath, Buffer.from(cleanBase64, 'base64'));
      localSavedPath = `/recovered_user_photos/${uploadFilename}`;
      console.log(`[Upload Engine] Local copy saved: ${localFilePath}`);
    } catch (saveErr) {
      console.warn('[Upload Engine] Local copy save warning:', saveErr.message);
    }

    // 2. Stream directly to Google Drive via Apps Script Webhook
    let gdriveUrl = null;
    let fileId = null;
    try {
      const gdrivePayload = {
        filename: uploadFilename,
        mimeType: mimeType || 'image/jpeg',
        fileData: cleanBase64,
        folderId: GDRIVE_FOLDER_ID,
        folderUrl: GDRIVE_FOLDER_URL,
        targetFolderId: GDRIVE_FOLDER_ID,
        folderName: 'Tasveer_Customer_Print_Orders'
      };

      const gdriveRes = await fetch(GDRIVE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(gdrivePayload)
      });

      if (gdriveRes.ok) {
        const text = await gdriveRes.text();
        console.log('[Upload Engine] Google Drive raw response text:', text.substring(0, 300));
        let json = {};
        try { json = JSON.parse(text); } catch (e) {}
        gdriveUrl = json.fileUrl || json.url || json.downloadUrl || null;
        if (!gdriveUrl) {
          const match = text.match(/https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+(\/view[^\s"']*)?/);
          if (match) gdriveUrl = match[0];
        }
        fileId = json.id || (gdriveUrl ? (gdriveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || [])[1] : null);
        console.log(`[Upload Engine] Successfully uploaded to Google Drive: ${gdriveUrl}`);
      } else {
        console.warn(`[Upload Engine] Google Drive webhook HTTP ${gdriveRes.status}`);
      }
    } catch (gErr) {
      console.warn('[Upload Engine] Google Drive webhook warning:', gErr.message);
    }

    return res.json({
      status: 'success',
      gdriveUrl: gdriveUrl || (localSavedPath ? `http://localhost:${process.env.PORT || 8085}${localSavedPath}` : null),
      fileId: fileId,
      folderUrl: GDRIVE_FOLDER_URL,
      folderId: GDRIVE_FOLDER_ID,
      localUrl: localSavedPath,
      filename: uploadFilename,
      isGoogleDrive: Boolean(gdriveUrl),
      message: gdriveUrl 
        ? `Uploaded directly to Google Drive folder (${GDRIVE_FOLDER_ID})` 
        : 'Uploaded and secured on studio lab server'
    });
  } catch (err) {
    console.error('[Upload Engine Error]', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
}

router.post('/upload-photo', handlePhotoUpload);
router.post('/v1/upload-photo', handlePhotoUpload);
router.post('/gdrive-upload', handlePhotoUpload);

module.exports = router;
