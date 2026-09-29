/* ==========================================================================
   Tasveer by Prince Studio - Enterprise E-Commerce Orchestrator Engine (app.js)
   Clean, Lightweight Bootstrapper Orchestrating All Modular Sub-Systems
   ========================================================================= */

(function (window, document) {
    'use strict';

    const safeStorage = {
        getItem: function (key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
        setItem: function (key, val) { try { localStorage.setItem(key, val); } catch (e) {} },
        removeItem: function (key) { try { localStorage.removeItem(key); } catch (e) {} }
    };

    function shareProduct(productId) {
        const pId = productId || window._currentDrawerProductId || 'prod_pp_1';
        let prod = null;
        if (window.PRODUCTS_DATA && Array.isArray(window.PRODUCTS_DATA)) {
            prod = window.PRODUCTS_DATA.find(p => p.id === pId);
        }
        if (!prod && window.DEFAULT_PRODUCTS && Array.isArray(window.DEFAULT_PRODUCTS)) {
            prod = window.DEFAULT_PRODUCTS.find(p => p.id === pId);
        }
        if (!prod) prod = { id: pId, title: 'Studio Custom Photo Print / Frame', price: 49 };

        const shareUrl = `https://tasviir.in/?product=${prod.id}`;
        const shareText = `📸 *Order ${prod.title || prod.name} Online* starting @ ₹${prod.price || 49} at Tasveer by Prince Studio! ⚡ Instant Photo Upload & Fast Pickup/Delivery: ${shareUrl}`;

        // Auto copy to clipboard
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(shareUrl);
            }
        } catch(e) {}

        if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
            navigator.share({
                title: `Order ${prod.title || prod.name} - Tasveer Studio`,
                text: shareText,
                url: shareUrl
            }).catch(() => {
                const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
                window.open(waUrl, '_blank');
            });
        } else {
            const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
            window.open(waUrl, '_blank');
        }

        if (window.showToast) {
            window.showToast('🔗 Direct Product Link copied & opened WhatsApp!');
        }
    }

    function copyProductLink(productId) {
        const pId = productId || window._currentDrawerProductId || 'prod_pp_1';
        const shareUrl = `https://tasviir.in/?product=${pId}`;
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(shareUrl);
                if (window.showToast) window.showToast(`🔗 Copied: ${shareUrl}`);
                else alert(`Copied link: ${shareUrl}`);
            } else {
                prompt('Copy Direct Product Link:', shareUrl);
            }
        } catch(e) {
            prompt('Copy Direct Product Link:', shareUrl);
        }
    }

    window.shareProduct = shareProduct;
    window.copyProductLink = copyProductLink;

    // 6 Dedicated Photo Print Products
    const PHOTO_PRINT_PRODUCTS = [
        { 
            id: 'prod_pp_1', 
            title: 'Passport Size Photos (Set of 8 / 16 / 32)', 
            name: 'Passport Size Photos (Set of 8 / 16 / 32)', 
            category: 'cat_photo_prints', 
            price: 49, 
            basePrice: 49, 
            originalPrice: 99, 
            desc: 'Studio standard 35x45mm passport & visa photos with white/blue background and precision die-cut.', 
            badge: 'Studio Urgent', 
            image: 'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?w=600&auto=format&fit=crop', 
            stock: 100, 
            rating: 5.0, 
            reviews: 64, 
            sizes: [
                { name: 'Set of 8 Photos', price: 49 },
                { name: 'Set of 16 Photos', price: 89 },
                { name: 'Set of 32 Photos', price: 149 }
            ] 
        },
        { 
            id: 'prod_pp_2', 
            title: 'Postcard & Table Photo Prints (4x6, 5x7, 6x8)', 
            name: 'Postcard & Table Photo Prints (4x6, 5x7, 6x8)', 
            category: 'cat_photo_prints', 
            price: 19, 
            basePrice: 19, 
            originalPrice: 49, 
            desc: 'Pocket & album size vibrant lab prints on 300GSM premium glossy or matte photo sheet.', 
            badge: 'Popular Album', 
            image: 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=600&auto=format&fit=crop', 
            stock: 150, 
            rating: 4.9, 
            reviews: 82, 
            sizes: [
                { name: '4x6" Postcard', price: 19 },
                { name: '5x7" Medium', price: 39 },
                { name: '6x8" Large', price: 59 }
            ] 
        },
        { 
            id: 'prod_pp_3', 
            title: 'A4 / 8x12 Studio HD Photo Print', 
            name: 'A4 / 8x12 Studio HD Photo Print', 
            category: 'cat_photo_prints', 
            price: 99, 
            basePrice: 99, 
            originalPrice: 199, 
            desc: 'Standard A4 document & 8x12" studio portrait lab print with 12-color archival pigment depth.', 
            badge: 'Bestseller', 
            image: 'https://images.unsplash.com/photo-1579541814924-49fef17c5be5?w=600&auto=format&fit=crop', 
            stock: 120, 
            rating: 5.0, 
            reviews: 94, 
            sizes: [
                { name: 'A4 Size (8.3x11.7")', price: 99 },
                { name: '8x12" Studio Standard', price: 99 },
                { name: '8x10" Portrait', price: 89 }
            ] 
        },
        { 
            id: 'prod_pp_4', 
            title: '12x18 Popular Wall Photo Print', 
            name: '12x18 Popular Wall Photo Print', 
            category: 'cat_photo_prints', 
            price: 199, 
            basePrice: 199, 
            originalPrice: 399, 
            desc: 'The most popular wall display print size in India. Non-fade archival colors for home decor.', 
            badge: 'Most Popular', 
            image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop', 
            stock: 90, 
            rating: 4.9, 
            reviews: 110, 
            sizes: [
                { name: '12x18" Wall Poster', price: 199 },
                { name: '12x15" Standard', price: 179 },
                { name: '10x15" Medium', price: 149 }
            ] 
        },
        { 
            id: 'prod_pp_5', 
            title: 'Custom Large Size Photo Print (16x20 to 30x40 & Custom)', 
            name: 'Custom Large Size Photo Print (16x20 to 30x40 & Custom)', 
            category: 'cat_photo_prints', 
            price: 299, 
            basePrice: 299, 
            originalPrice: 599, 
            desc: 'Large wall art prints from 16x20" up to 30x40", or enter your exact custom width and height.', 
            badge: 'Custom Size', 
            image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&auto=format&fit=crop', 
            stock: 60, 
            rating: 5.0, 
            reviews: 47, 
            sizes: [
                { name: '16x20"', price: 299 },
                { name: '18x24"', price: 399 },
                { name: '20x30"', price: 499 },
                { name: '24x36"', price: 699 },
                { name: '30x40"', price: 999 },
                { name: 'Custom Size (User Defined)', price: 499, isCustom: true }
            ] 
        },
        { 
            id: 'prod_pp_6', 
            title: 'Mega Large Format Exhibition Prints (36x48 to 44x100)', 
            name: 'Mega Large Format Exhibition Prints (36x48 to 44x100)', 
            category: 'cat_photo_prints', 
            price: 1499, 
            basePrice: 1499, 
            originalPrice: 2999, 
            desc: 'Commercial plotter ultra-large prints for exhibitions, backdrops, wedding banners and showroom walls.', 
            badge: 'Mega Plotter', 
            image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop', 
            stock: 40, 
            rating: 5.0, 
            reviews: 28, 
            sizes: [
                { name: '36x48"', price: 1499 },
                { name: '40x60"', price: 1999 },
                { name: '44x60"', price: 2499 },
                { name: '44x80"', price: 3299 },
                { name: '44x100"', price: 3999 }
            ] 
        }
    ];

    // Master Base Products Fallback across 10 Categories
    const DEFAULT_PRODUCTS = [
        ...PHOTO_PRINT_PRODUCTS,
        { id: 'p_frm_1', title: 'Classic Walnut Wood Frame (12x18")', name: 'Classic Walnut Wood Frame (12x18")', category: 'cat_photo_frames', price: 499, basePrice: 499, originalPrice: 799, rating: 5.0, reviews: 64, badge: 'Best Seller', stock: 25, image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500', desc: 'Handcrafted solid walnut wood border with off-white matting.' },
        { id: 'p_frm_2', title: 'Sleek Black Gallery Frame (A4)', name: 'Sleek Black Gallery Frame (A4)', category: 'cat_photo_frames', price: 349, basePrice: 349, originalPrice: 599, rating: 4.9, reviews: 42, badge: 'Top Pick', stock: 30, image: 'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?w=500', desc: 'Modern minimal synthetic black photo frame with acrylic.' },
        { id: 'p_col_1', title: 'Family Memories 9-in-1 Grid Frame', name: 'Family Memories 9-in-1 Grid Frame', category: 'cat_collage_frames', price: 799, basePrice: 799, originalPrice: 1299, rating: 5.0, reviews: 89, badge: 'Family Favorite', stock: 15, image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500', desc: 'Hold 9 precious family photos in one collage frame.' },
        { id: 'p_col_2', title: 'Love & Wedding Couple 4-in-1 Collage', name: 'Love & Wedding Couple 4-in-1 Collage', category: 'cat_collage_frames', price: 599, basePrice: 599, originalPrice: 999, rating: 4.8, reviews: 37, badge: 'Trending', stock: 20, image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=500', desc: 'Heart layout multi-photo frame ideal for wedding portraits.' },
        { id: 'p_can_1', title: 'Stretched Cotton Gallery Canvas (18x24")', name: 'Stretched Cotton Gallery Canvas (18x24")', category: 'cat_canvas_prints', price: 699, basePrice: 699, originalPrice: 1199, rating: 5.0, reviews: 45, badge: 'Fine Art', stock: 18, image: 'https://images.unsplash.com/photo-1579541814924-49fef17c5be5?w=500', desc: '100% natural cotton canvas stretched over pine wood frame.' },
        { id: 'p_can_2', title: 'Floating Frame Canvas Art (24x36")', name: 'Floating Frame Canvas Art (24x36")', category: 'cat_canvas_prints', price: 1299, basePrice: 1299, originalPrice: 1999, rating: 4.9, reviews: 28, badge: 'Luxury', stock: 10, image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop', desc: '3D shadow floating outer frame wrapped around canvas.' },
        { id: 'p_gal_1', title: 'Stairway Museum Gallery Set of 6', name: 'Stairway Museum Gallery Set of 6', category: 'cat_gallery_frames', price: 1899, basePrice: 1899, originalPrice: 2999, rating: 5.0, reviews: 52, badge: 'Complete Set', stock: 8, image: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=500', desc: 'Pre-designed 6-frame grid layout with hanging stencil template.' },
        { id: 'p_gal_2', title: 'Living Room Grid Gallery Set of 3 (12x18")', name: 'Living Room Grid Gallery Set of 3 (12x18")', category: 'cat_gallery_frames', price: 1199, basePrice: 1199, originalPrice: 1899, rating: 4.9, reviews: 34, badge: 'Hot Deal', stock: 12, image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500', desc: 'Trio matching wood gallery frames for living room main wall.' },
        { id: 'p_pos_1', title: 'Custom HD Wall Poster (12x18")', name: 'Custom HD Wall Poster (12x18")', category: 'cat_poster_frames', price: 149, basePrice: 149, originalPrice: 249, rating: 4.9, reviews: 42, badge: 'Best Seller', stock: 50, image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=500', desc: '300 GSM matte poster paper with non-fade HD color printing.' },
        { id: 'p_mug_1', title: 'Magic Heat-Reveal Photo Mug (11oz)', name: 'Magic Heat-Reveal Photo Mug (11oz)', category: 'cat_mug_prints', price: 299, basePrice: 299, originalPrice: 499, rating: 5.0, reviews: 76, badge: 'Magic Gift', stock: 60, image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500', desc: 'Black mug reveals your custom photo when hot liquid is poured in!' },
        { id: 'p_stk_1', title: 'Waterproof Die-Cut Vinyl Stickers (Set of 10)', name: 'Waterproof Die-Cut Vinyl Stickers (Set of 10)', category: 'cat_sticker_prints', price: 149, basePrice: 149, originalPrice: 299, rating: 4.9, reviews: 63, badge: 'Waterproof', stock: 150, image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500', desc: 'Custom photo stickers with scratch-resistant matte vinyl coating.' },
        { id: 'p_lgt_1', title: 'Glowing LED Backlit Acrylic Light Frame (12x18")', name: 'Glowing LED Backlit Acrylic Light Frame (12x18")', category: 'cat_light_frames', price: 999, basePrice: 999, originalPrice: 1599, rating: 5.0, reviews: 84, badge: 'Glowing LED', stock: 15, image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop', desc: 'Warm LED backlighting creates a magical glowing night light frame.' },
        { id: 'p_box_1', title: 'Deep 3D Memory Shadow Box Frame (10x10")', name: 'Deep 3D Memory Shadow Box Frame (10x10")', category: 'cat_box_frames', price: 699, basePrice: 699, originalPrice: 1099, rating: 5.0, reviews: 49, badge: '3D Memory', stock: 18, image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500', desc: 'Extra deep shadow box frame for souvenirs & 3D photos.' }
    ];

    function getLiveProducts() {
        let deletedIds = [];
        try {
            deletedIds = JSON.parse(safeStorage.getItem('tasveer_deleted_product_ids')) || [];
        } catch(e) {}

        if (window.masterProducts && Array.isArray(window.masterProducts) && window.masterProducts.length > 0) {
            return window.masterProducts.filter(p => !deletedIds.includes(p.id) && !p.isDeleted);
        }
        if (window.CloudDB) {
            const cloudProds = window.CloudDB.getCollection('products');
            if (cloudProds && Array.isArray(cloudProds) && cloudProds.length > 0) {
                return cloudProds.filter(p => !deletedIds.includes(p.id) && !p.isDeleted);
            }
        }
        let prods = [];
        try {
            const stored = JSON.parse(safeStorage.getItem('tasveer_products'));
            if (stored && Array.isArray(stored) && stored.length > 0) {
                return stored.filter(p => !deletedIds.includes(p.id) && !p.isDeleted);
            }
        } catch (e) {}

        const allModular = (window.CoreCatalog && window.CoreCatalog.getAllModularProducts) 
            ? window.CoreCatalog.getAllModularProducts() 
            : DEFAULT_PRODUCTS;

        prods = allModular.map(p => Object.assign({}, p, { isDeleted: false })).filter(p => !deletedIds.includes(p.id));
        return prods;
    }

    let PRODUCTS_DATA = getLiveProducts();

    window.DEFAULT_PRODUCTS = DEFAULT_PRODUCTS;
    window.PRODUCTS_DATA = PRODUCTS_DATA;
    window.masterProducts = PRODUCTS_DATA;

    let currentCategory = 'all';
    let searchQuery = '';
    let currentSort = 'featured';

    function tasveerInit() {
        if (window.fetchBackendServerCMS) window.fetchBackendServerCMS();
        if (window.initCustomizerEngine) window.initCustomizerEngine();
        if (window.initTheme) window.initTheme();

        PRODUCTS_DATA = getLiveProducts();
        window.PRODUCTS_DATA = PRODUCTS_DATA;

        renderCategoryShowcaseGrid();
        renderDynamicFilterTabs();
        renderProducts();

        if (window.updateCartBadgeCount) window.updateCartBadgeCount();
        if (window.logDebugMessage) window.logDebugMessage('Tasveer Studio Orchestrator Initialized 100% OK!');

        // Listen for Real-time Cloud DB updates
        if (window.CloudDB && window.CloudDB.subscribe) {
            window.CloudDB.subscribe((collection, data) => {
                if (collection === 'products' && Array.isArray(data) && data.length > 0) {
                    PRODUCTS_DATA = data;
                    window.PRODUCTS_DATA = data;
                    renderProducts();
                }
            });
        }

        // Listen for Cross-Tab Admin Saves
        window.addEventListener('storage', (e) => {
            if (e.key === 'tasveer_products') {
                PRODUCTS_DATA = getLiveProducts();
                window.PRODUCTS_DATA = PRODUCTS_DATA;
                renderProducts();
            }
        });

        // Deep Link Auto-Router (?product=... or ?buy=...)
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const targetProd = urlParams.get('product') || urlParams.get('p') || urlParams.get('buy') || (window.location.hash ? window.location.hash.replace('#', '') : null);
            if (targetProd) {
                setTimeout(() => {
                    if (window.openProductDetailsDrawer) {
                        window.openProductDetailsDrawer(targetProd);
                    } else if (window.ProductDrawer && window.ProductDrawer.open) {
                        window.ProductDrawer.open(targetProd);
                    }
                }, 350);
            }
        } catch(e) {}
    }

    function getLiveCategories() {
        try {
            const stored = JSON.parse(safeStorage.getItem('tasveer_categories'));
            if (stored && Array.isArray(stored) && stored.length > 0) return stored;
        } catch(e) {}
        if (window.CloudDB) {
            const cloud = window.CloudDB.getCollection('categories');
            if (cloud && Array.isArray(cloud) && cloud.length > 0) return cloud;
        }
        if (window.DEFAULT_CATEGORIES && Array.isArray(window.DEFAULT_CATEGORIES) && window.DEFAULT_CATEGORIES.length > 0) {
            return window.DEFAULT_CATEGORIES;
        }
        return [
            { id: 'cat_photo_prints', name: 'Photo Prints', icon: 'fa-print', desc: 'Archival Lab Prints', image: 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=500' },
            { id: 'cat_readymade_frames', name: 'Ready Made Frames', icon: 'fa-vector-square', desc: 'Pre-Framed Art & Ready Wall Frames', image: 'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?w=500' },
            { id: 'cat_photo_frames', name: 'Photo Frame', icon: 'fa-vector-square', desc: 'Teak Wood & Solid Oak', image: 'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?w=500' },
            { id: 'cat_collage_frames', name: 'Collage Frame', icon: 'fa-border-all', desc: 'Birthday & Anniversary', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500' },
            { id: 'cat_canvas_prints', name: 'Canvas Print', icon: 'fa-paint-brush', desc: 'Textured Museum Cotton', image: 'https://images.unsplash.com/photo-1579541814924-49fef17c5be5?w=500' },
            { id: 'cat_gallery_frames', name: 'Gallery Frame', icon: 'fa-image', desc: 'Curated Multi-Frame Sets', image: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=500' },
            { id: 'cat_poster_frames', name: 'Poster Frame', icon: 'fa-scroll', desc: '300GSM HD Minimalist', image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=500' },
            { id: 'cat_mug_prints', name: 'Mug Print', icon: 'fa-mug-hot', desc: 'Magic Heat Reveal Mugs', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500' },
            { id: 'cat_sticker_prints', name: 'Sticker Print', icon: 'fa-sticky-note', desc: 'Waterproof Die-Cut Vinyl', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500' },
            { id: 'cat_light_frames', name: 'Light Frame', icon: 'fa-lightbulb', desc: 'Glowing LED Backlit Frames', image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500' },
            { id: 'cat_box_frames', name: 'Box Frame', icon: 'fa-cube', desc: 'Deep 3D Memory Keepsakes', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500' }
        ];
    }

    function renderCategoryShowcaseGrid() {
        const grid = document.getElementById('category-showcase-grid');
        if (!grid) return;

        const cats = getLiveCategories().filter(c => c.status !== 'Inactive');
        if (cats.length === 0) return;

        const defaultImages = {
            'cat_photo_prints': 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=500',
            'cat_photo_frames': 'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?w=500',
            'cat_collage_frames': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500',
            'cat_canvas_prints': 'https://images.unsplash.com/photo-1579541814924-49fef17c5be5?w=500',
            'cat_gallery_frames': 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=500',
            'cat_poster_frames': 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=500',
            'cat_mug_prints': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500',
            'cat_sticker_prints': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500',
            'cat_light_frames': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500',
            'cat_box_frames': 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500'
        };

        grid.innerHTML = cats.map(c => {
            const img = c.image || defaultImages[c.id] || 'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?w=500';
            return `
                <div class="category-card" onclick="window.filterCategory('${c.id}')" style="cursor:pointer;">
                    <div class="category-img-wrap">
                        <img src="${img}" alt="${c.name}">
                        <span class="category-badge"><i class="fas ${c.icon || 'fa-layer-group'}"></i></span>
                    </div>
                    <div class="category-info">
                        <h4>${c.name}</h4>
                        <p>${c.desc || 'Handcrafted Frame'}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderDynamicFilterTabs() {
        const container = document.getElementById('filter-pills-container');
        if (!container) return;

        const cats = getLiveCategories().filter(c => c.status !== 'Inactive');
        const allTab = { id: 'all', name: 'All Items', icon: 'fa-th-large' };
        const fullList = [allTab, ...cats];

        container.innerHTML = fullList.map(c => `
            <button class="filter-btn ${currentCategory === c.id ? 'active' : ''}" onclick="window.filterCategory('${c.id}')">
                <i class="fas ${c.icon || 'fa-tag'}"></i> ${c.name}
            </button>
        `).join('');
    }

    function renderProducts() {
        const grid = document.getElementById('product-grid');
        if (!grid) return;

        let rawProducts = (PRODUCTS_DATA && PRODUCTS_DATA.length > 0) ? PRODUCTS_DATA : DEFAULT_PRODUCTS;

        let filtered = rawProducts.map(p => ({
            ...p,
            title: p.title || p.name || 'Framing Product',
            price: p.price || p.basePrice || 499,
            desc: p.desc || p.description || '',
            rating: p.rating || 4.9,
            reviews: p.reviews || 24
        })).filter(p => {
            const notDeleted = p.isDeleted !== true && p.isDeleted !== 'true';
            const matchesCategory = currentCategory === 'all' || 
                                    p.category === currentCategory ||
                                    (currentCategory === 'cat_readymade_frames' && (p.category === 'cat_readymade_frames' || p.category === 'Ready_Made_Frame' || p.category === 'Ready Made Frame')) ||
                                    (currentCategory === 'cat_photo_prints' && (p.category === 'cat_photo_prints' || p.category === 'Photo Print' || (p.id && p.id.startsWith('prod_pp_'))));
            const matchesSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  p.desc.toLowerCase().includes(searchQuery.toLowerCase());
            return notDeleted && matchesCategory && matchesSearch;
        });

        if (filtered.length === 0 && currentCategory === 'cat_photo_prints') {
            const photoPrints = window.PHOTO_PRINTS_CATALOG || PHOTO_PRINT_PRODUCTS;
            filtered = photoPrints.filter(p => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()));
        } else if (filtered.length === 0 && currentCategory === 'all') {
            PRODUCTS_DATA = getLiveProducts();
            filtered = PRODUCTS_DATA.filter(p => p.isDeleted !== true && p.isDeleted !== 'true');
        }

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fas fa-search-minus" style="font-size: 3rem; margin-bottom: 15px; color: #64748b;"></i>
                    <h3>No products found for "${currentCategory}"</h3>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(p => {
            const isWishlisted = (window.wishlist || []).includes(p.id);
            const catName = p.category ? p.category.replace('cat_', '').replace(/_/g, ' ').toUpperCase() : 'PHOTO PRINT';
            return `
                <div class="product-card">
                    <div class="card-image-wrap" onclick="window.openProductDetailsDrawer('${p.id}')" style="cursor:pointer;">
                        <img src="${p.image}" alt="${p.title}" loading="lazy">
                        ${p.badge ? `<span class="tag-badge">${p.badge}</span>` : `<span class="tag-badge" style="background:rgba(204,142,53,0.85);"><i class="fas fa-sparkles"></i> Studio HD</span>`}
                        <div class="card-quick-actions" onclick="event.stopPropagation();">
                            <button class="quick-action-btn" onclick="window.shareProduct('${p.id}')" title="Share on WhatsApp / Deep Link" style="color:#16a34a;">
                                <i class="fab fa-whatsapp"></i>
                            </button>
                            <button class="quick-action-btn" onclick="window.toggleWishlist('${p.id}')" title="Wishlist" style="color: ${isWishlisted ? '#ef4444' : 'inherit'};">
                                <i class="fas fa-heart"></i>
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                            <span class="card-category">${catName}</span>
                            <div style="display:flex; align-items:center; gap:2px; font-size:0.75rem; color:#f59e0b; font-weight:700;">
                                <i class="fas fa-star" style="font-size:0.7rem;"></i> 5.0
                            </div>
                        </div>
                        <h3 class="card-title" onclick="window.openProductDetailsDrawer('${p.id}')" style="cursor:pointer;" title="${p.title}">${p.title}</h3>
                        <div class="card-bottom">
                            <div class="price-row-mobile" style="display:flex; align-items:baseline; justify-content:space-between; margin-bottom:8px;">
                                <div>
                                    <span class="price-tag">₹${p.price}</span>
                                    ${p.originalPrice ? `<span class="old-price">₹${p.originalPrice}</span>` : `<span class="old-price">₹${p.price * 2}</span>`}
                                </div>
                                <span style="font-size:0.7rem; color:#16a34a; font-weight:700; background:#dcfce7; padding:2px 6px; border-radius:4px;">50% OFF</span>
                            </div>
                            <div class="card-btns-row" style="display:flex; gap:8px;">
                                <button type="button" class="buy-now-btn" onclick="window.openProductDetailsDrawer('${p.id}')" style="flex:1;">
                                    <i class="fas fa-magic"></i> Upload & Customize
                                </button>
                                <button type="button" class="add-cart-btn" onclick="window.addToCart('${p.id}')" title="Quick Add to Cart" style="width:42px; flex:none; padding:0; display:flex; align-items:center; justify-content:center;">
                                    <i class="fas fa-shopping-bag"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function filterCategory(catId) {
        if (window.innerWidth <= 768 && window.MobileFlow && window.MobileFlow.openCategory && catId !== 'all') {
            window.MobileFlow.openCategory(catId);
            return;
        }
        currentCategory = catId;
        window.currentCategory = catId;
        renderDynamicFilterTabs();
        renderProducts();
        if (window.logDebugMessage) window.logDebugMessage(`Filtered Category: ${catId}`);
    }

    function showToast(message, type = 'info') {
        let toastBox = document.getElementById('tasveer-toast-box');
        if (!toastBox) {
            toastBox = document.createElement('div');
            toastBox.id = 'tasveer-toast-box';
            toastBox.style.cssText = 'position:fixed; bottom:80px; left:20px; z-index:9999; display:flex; flex-direction:column; gap:8px; pointer-events:none;';
            document.body.appendChild(toastBox);
        }

        const toast = document.createElement('div');
        toast.style.cssText = 'background:#1e293b; color:#fff; padding:10px 16px; border-radius:8px; border:1px solid #334155; font-size:0.85rem; box-shadow:0 10px 25px rgba(0,0,0,0.5); pointer-events:auto; font-weight:bold;';
        toast.innerText = message;
        toastBox.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 3000);
    }

    // Expose Global State & API
    window.PRODUCTS_DATA = PRODUCTS_DATA;
    window.currentCategory = currentCategory;
    window.renderProducts = renderProducts;
    window.renderCategoryShowcaseGrid = renderCategoryShowcaseGrid;
    window.renderDynamicFilterTabs = renderDynamicFilterTabs;
    window.filterCategory = filterCategory;
    window.showToast = showToast;
    window.tasveerInit = tasveerInit;
    window.shareProduct = shareProduct;
    window.copyProductLink = copyProductLink;

    // Bootstrapper listener
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tasveerInit);
    } else {
        setTimeout(tasveerInit, 50);
    }

})(window, document);
