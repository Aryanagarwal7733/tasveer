const { connectDB } = require('../config/db');
const app = require('../server');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('[Vercel Serverless] DB connection error:', err.message);
  }

  // Ensure req.url retains /api prefix for Express routing if stripped by Vercel rewrites
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }

  return app(req, res);
};
