require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { connectDB } = require('./config/db');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 8085;

// Connect to MongoDB (for standalone server mode)
if (require.main === module) {
  connectDB();
}

// CORS Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// Body Parsing Middleware with 50MB limit for high-res photo frames/customizer base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Custom Headers & CSP
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.header(
    'Content-Security-Policy',
    "default-src 'self' https: data: blob:; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; " +
    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; " +
    "font-src 'self' data: https://cdnjs.cloudflare.com https://fonts.gstatic.com; " +
    "img-src 'self' data: blob: https:; " +
    `connect-src 'self' http://127.0.0.1:${PORT} http://localhost:${PORT} https:; ` +
    "frame-src 'self' https:;"
  );
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Dynamic Favicon Handler
app.get(['/favicon.ico', '/favicon.png'], (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🖼️</text></svg>");
});

// Mount MERN REST API routes under /api
app.use('/api', apiRoutes);

// Admin route alias
function getCookieValue(req, name) {
  const cookies = String(req.headers.cookie || '').split(';');
  const entry = cookies.find(cookie => cookie.trim().startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.trim().slice(name.length + 1)) : '';
}

function requireAdminPage(req, res, next) {
  const token = getCookieValue(req, 'tasveer_admin_token');
  if (!token) {
    return res.redirect('/admin-login');
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'TasveerPrinceStudioSuperSecretJWTKey2026');
    if (decoded.role !== 'admin') throw new Error('Invalid admin role');
    next();
  } catch (error) {
    res.clearCookie?.('tasveer_admin_token');
    return res.redirect('/admin-login');
  }
}

app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-login.html'));
});

app.get(['/admin', '/admin.html'], requireAdminPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// React Storefront route
app.get(['/react', '/react-storefront'], (req, res) => {
  res.sendFile(path.join(__dirname, 'react-storefront.html'));
});

// Full Storefront route
app.get(['/storefront', '/legacy'], (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// React Client Production Build static serving (if built)
const clientBuildPath = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(clientBuildPath)) {
  console.log('[MERN App] Serving compiled React Frontend from client/dist');
  app.use(express.static(clientBuildPath));
}

// Serve root static assets (images, css, js, html)
app.use(express.static(__dirname));

// Fallback for SPA or Storefront
app.get('*', (req, res) => {
  // If request is for an api endpoint not caught
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  // If React client build exists, serve React's index.html
  if (fs.existsSync(path.join(clientBuildPath, 'index.html'))) {
    return res.sendFile(path.join(clientBuildPath, 'index.html'));
  }
  // Otherwise serve storefront index.html
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err.message);
  res.status(500).json({ status: 'error', message: err.message || 'Internal Server Error' });
});

// Start Server if run directly
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚀 [Tasveer MERN Stack Enterprise Server Live]`);
    console.log(`🌐 Local URL:    http://localhost:${PORT}`);
    console.log(`🌐 Network URL:  http://127.0.0.1:${PORT}`);
    console.log(`📊 Admin Portal: http://localhost:${PORT}/admin`);
    const dbMasked = (process.env.MONGODB_URI || '').replace(/:([^@]+)@/, ':****@');
    console.log(`🗄️  Database:     MongoDB on ${dbMasked || 'mongodb://127.0.0.1:27017/tasveer_studio'}`);
    console.log(`======================================================\n`);
  });
}

module.exports = app;
