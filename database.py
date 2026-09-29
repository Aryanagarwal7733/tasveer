import json
import os

DB_FILE = os.path.join(os.path.dirname(__file__), 'db.json')

DEFAULT_DB = {
    "cms": {
        "logoTitle": "Tasveer",
        "logoSub": "by Prince Studio",
        "heroTitle": "Crafting Royal <span>Gallery Art</span> For Your Walls",
        "heroSubtext": "Upload your personal photos, select real Italian wood moldings, white mount borders, and order with instant UPI & WhatsApp soft-proof approval!",
        "heroBtnText": "📸 Upload & Frame Photo (₹499)",
        "announcementText": "Official Prince Studio Online Art Gallery | Custom Framing",
        "heroImageUrl": "hero-poster.png"
    },
    "draft_cms": None,
    "published_status": "published",
    "advantages": [
        { "id": "adv_1", "icon": "fa-hammer", "title": "Handcrafted Teak Wood", "desc": "Premium solid natural wood moldings sourced from certified forests." },
        { "id": "adv_2", "icon": "fa-shield-alt", "title": "100% Acid Free Mounts", "desc": "Museum-grade matting protects your photographs for 100+ years." },
        { "id": "adv_3", "icon": "fa-award", "title": "Lifetime Color Guarantee", "desc": "300GSM archival paper prints guaranteed against fading." },
        { "id": "adv_4", "icon": "fa-truck-fast", "title": "24hr Express Delivery", "desc": "Fast local dispatch across Sawai Madhopur & doorstep delivery across India." }
    ],
    "faqs": [
        { "id": "faq_1", "question": "How long does custom photo framing take?", "answer": "Local orders in Sawai Madhopur are ready within 24 hours. Express shipping across India takes 3-5 business days." },
        { "id": "faq_2", "question": "What is the recommended photo resolution?", "answer": "For 12x18 inch frames or larger, we recommend images above 2000x3000 pixels (3MB+). Our engine automatically checks photo DPI." },
        { "id": "faq_3", "question": "Do you provide white mount borders?", "answer": "Yes, all our wooden wall frames come with 100% acid-free white matting options ranging from 10mm to 30mm width." }
    ],
    "social_links": {
        "whatsapp": "https://wa.me/917231900124",
        "instagram": "https://instagram.com/princestudioswm",
        "facebook": "https://facebook.com/princestudiomadhopur",
        "youtube": "https://youtube.com/@princestudiomadhopur"
    },
    "footer": {
        "aboutTitle": "Tasveer by Prince Studio",
        "aboutText": "Premier custom photo framing, acrylic prints, and canvas art gallery studio in Sawai Madhopur, Rajasthan.",
        "phone": "+91 72319 00124",
        "email": "Princestudioswm@gmail.com",
        "address": "Main Market Road, Sawai Madhopur, Rajasthan 322001",
        "copyright": "© 2026 Tasveer by Prince Studio. All Rights Reserved."
    },
    "bento_header": {
        "tag": "Gallery Architecture",
        "title": "Framing Collections Bento Grid"
    },
    "bento_cards": [
        { "id": "bento_1", "title": "Italian Wooden Wall Frames", "desc": "Handcrafted solid teak & oak wood borders with acid-free white matting.", "image": "https://images.unsplash.com/photo-1544457070-4cd773b4d71e?w=800&auto=format&fit=crop", "tag": "Bestseller", "category": "cat_photo_frames", "size": "bento-large" },
        { "id": "bento_2", "title": "Canvas Prints", "desc": "100% Cotton Textured HD prints.", "image": "https://images.unsplash.com/photo-1579541814924-49fef17c5be5?w=600&auto=format&fit=crop", "tag": "Fine Art", "category": "cat_canvas_prints", "size": "bento-tall" },
        { "id": "bento_3", "title": "Glossy Acrylic Prints", "desc": "Shatterproof float glass style.", "image": "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop", "tag": "3D Float", "category": "cat_acrylic", "size": "bento-standard" },
        { "id": "bento_4", "title": "Custom HD Posters", "desc": "Premium 300GSM matte lab prints.", "image": "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=500&auto=format&fit=crop", "tag": "Studio HD", "category": "cat_poster_frames", "size": "bento-standard" }
    ],
    "orders": [],
    "categories": [],
    "products": [],
    "coupons": [
        { "code": "WELCOME10", "discountType": "percent", "value": 10, "minCart": 300, "expiry": "2026-12-31" },
        { "code": "TASVEER100", "discountType": "fixed", "value": 100, "minCart": 500, "expiry": "2026-12-31" }
    ]
}

TMP_DB_FILE = '/tmp/db.json'

def load_db():
    # If on Vercel /tmp has updated db, load from /tmp
    if os.path.exists(TMP_DB_FILE):
        try:
            with open(TMP_DB_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass

    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass

    return DEFAULT_DB

def save_db(data):
    # Try writing to standard DB_FILE first (works locally / VPS)
    written = False
    try:
        with open(DB_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        written = True
    except Exception:
        pass

    # Also write to /tmp/db.json (works on Vercel / AWS Lambda / Serverless)
    try:
        with open(TMP_DB_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        written = True
    except Exception:
        pass

    return written
