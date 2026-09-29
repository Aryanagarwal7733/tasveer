const mongoose = require('mongoose');

const CMSSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  cms: {
    logoTitle: { type: String, default: 'Tasveer' },
    logoSub: { type: String, default: 'by Prince Studio' },
    heroTitle: { type: String, default: 'Crafting Royal <span>Gallery Art</span> For Your Walls' },
    heroSubtext: { type: String, default: 'Upload your personal photos, select real Italian wood moldings, white mount borders, and order with instant UPI & WhatsApp soft-proof approval!' },
    heroBtnText: { type: String, default: '📸 Upload & Frame Photo (₹499)' },
    announcementText: { type: String, default: 'Official Prince Studio Online Art Gallery | Custom Framing' },
    heroImageUrl: { type: String, default: 'hero-poster.png' }
  },
  draft_cms: { type: mongoose.Schema.Types.Mixed, default: null },
  published_status: { type: String, default: 'published' },
  bento_header: { type: mongoose.Schema.Types.Mixed },
  bento_cards: { type: [mongoose.Schema.Types.Mixed], default: [] },
  advantages: { type: [mongoose.Schema.Types.Mixed], default: [] },
  faqs: { type: [mongoose.Schema.Types.Mixed], default: [] },
  social_links: { type: mongoose.Schema.Types.Mixed },
  footer: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true
});

module.exports = mongoose.model('CMS', CMSSchema);
