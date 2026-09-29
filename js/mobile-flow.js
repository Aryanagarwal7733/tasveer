/**
 * ==========================================================================
 * Tasveer by Prince Studio - Mobile Multi-Screen E-Commerce Engine (js/mobile-flow.js)
 * Amazon & Flipkart Style Multi-Screen Flow for Mobile Viewports (< 768px)
 * ==========================================================================
 */

(function (window, document) {
    'use strict';

    // Screen State Stack
    const navigationStack = ['home'];
    let currentMobileProduct = null;
    let currentMobileCategory = null;
    let highlightsInterval = null;
    let currentSlideIndex = 0;

    // Mobile Highlights Slider Data
    const FEATURED_HIGHLIGHTS = [
        {
            id: 'hl_1',
            title: '🔥 Archival Studio Photo Prints',
            subtitle: 'Passport, 4x6 Postcards & 12x18 Posters from ₹49',
            badge: 'HOT SELLING',
            image: 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=800&auto=format&fit=crop',
            targetType: 'category',
            targetId: 'cat_photo_prints',
            cta: 'Order Prints Now'
        },
        {
            id: 'hl_2',
            title: '👑 Handcrafted Teak Wood Frames',
            subtitle: 'Real wood moulding with smooth museum velvet backing',
            badge: 'PREMIUM ART',
            image: 'https://images.unsplash.com/photo-1546484475-7f7bd55792da?w=800&auto=format&fit=crop',
            targetType: 'category',
            targetId: 'cat_photo_frames',
            cta: 'Explore Wooden Frames'
        },
        {
            id: 'hl_3',
            title: '🎨 100% Cotton Canvas Wraps',
            subtitle: 'Gallery quality stretched canvas prints for living rooms',
            badge: 'TRENDING NOW',
            image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop',
            targetType: 'category',
            targetId: 'cat_canvas_prints',
            cta: 'View Canvas Art'
        },
        {
            id: 'hl_4',
            title: '🎁 Birthday & Anniversary Collages',
            subtitle: 'Turn 12 to 50 family memories into one majestic wall frame',
            badge: 'GIFT SPECIAL',
            image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop',
            targetType: 'category',
            targetId: 'cat_collage_frames',
            cta: 'Create Collage Frame'
        }
    ];

    const MobileFlow = {
        isMobile: function () {
            return window.innerWidth <= 768;
        },

        init: function () {
            console.log('[Highlights & Mobile Engine] Initializing Studio Highlights & Flow...');
            // Render Highlights Banner on both Desktop and Mobile
            MobileFlow.renderHighlightsSlider();

            if (MobileFlow.isMobile()) {
                MobileFlow.goHome();
                MobileFlow.setupHistoryListener();

                // Mobile Category card click binding
                window.openCategoryOnMobile = function (catId) {
                    MobileFlow.openCategory(catId);
                };

                // Mobile Product card click binding
                window.openProductOnMobile = function (prodId) {
                    MobileFlow.openProduct(prodId);
                };

                // Auto-open deep linked product on mobile
                try {
                    const urlParams = new URLSearchParams(window.location.search);
                    const targetProd = urlParams.get('product') || urlParams.get('p') || urlParams.get('buy') || (window.location.hash ? window.location.hash.replace('#', '').replace('m_product_', '') : null);
                    if (targetProd) {
                        setTimeout(() => {
                            MobileFlow.openProduct(targetProd);
                        }, 350);
                    }
                } catch (e) {}
            }
        },

        setupHistoryListener: function () {
            window.addEventListener('popstate', function (e) {
                if (!MobileFlow.isMobile()) return;
                if (navigationStack.length > 1) {
                    navigationStack.pop();
                    const prevScreen = navigationStack[navigationStack.length - 1];
                    MobileFlow.renderScreen(prevScreen, false);
                }
            });
        },

        pushState: function (screenName) {
            navigationStack.push(screenName);
            try {
                window.history.pushState({ screen: screenName }, '', `#m_${screenName}`);
            } catch (e) {}
        },

        renderScreen: function (screenName, push = true) {
            if (push && screenName !== 'home') MobileFlow.pushState(screenName);

            const overlayScreens = ['category', 'product', 'checkout', 'success'];
            overlayScreens.forEach(s => {
                const el = document.getElementById(`mobile-screen-${s}`);
                if (el) {
                    if (s === screenName) {
                        el.classList.add('active');
                        el.style.display = 'flex';
                    } else {
                        el.classList.remove('active');
                        el.style.display = 'none';
                    }
                }
            });

            // Prevent background page scrolling when an overlay is open
            if (screenName !== 'home') {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        goBack: function () {
            if (navigationStack.length > 1) {
                window.history.back();
            } else {
                MobileFlow.goHome();
            }
        },

        goHome: function () {
            navigationStack.length = 0;
            navigationStack.push('home');
            MobileFlow.renderScreen('home', false);
            try {
                window.history.pushState({ screen: 'home' }, '', '#');
            } catch (e) {}
        },

        // 1. HIGHLIGHTS CAROUSEL ENGINE (DESKTOP & MOBILE)
        renderHighlightsSlider: function () {
            const container = document.getElementById('mobile-highlights-container');
            if (!container) return;

            container.innerHTML = `
                <div class="mobile-highlights-wrap">
                    <div class="mobile-highlights-slides" id="mobile-highlights-slides">
                        ${FEATURED_HIGHLIGHTS.map((hl, idx) => `
                            <div class="mobile-highlight-slide ${idx === 0 ? 'active' : ''}" onclick="MobileFlow.handleHighlightTap('${hl.targetType}', '${hl.targetId}')">
                                <img src="${hl.image}" alt="${hl.title}" loading="lazy">
                                <div class="mobile-highlight-overlay">
                                    <span class="mobile-highlight-badge">${hl.badge}</span>
                                    <h3 class="mobile-highlight-title">${hl.title}</h3>
                                    <p class="mobile-highlight-sub">${hl.subtitle}</p>
                                    <button class="mobile-highlight-btn" onclick="MobileFlow.handleHighlightTap('${hl.targetType}', '${hl.targetId}')">
                                        ${hl.cta} <i class="fas fa-arrow-right"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <!-- Desktop / Tablet Navigation Arrows -->
                    <button type="button" class="highlights-nav-btn prev" onclick="MobileFlow.prevSlide(event)" aria-label="Previous Highlight">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button type="button" class="highlights-nav-btn next" onclick="MobileFlow.nextSlide(event)" aria-label="Next Highlight">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                    <div class="mobile-highlights-dots" id="mobile-highlights-dots">
                        ${FEATURED_HIGHLIGHTS.map((_, idx) => `
                            <span class="mobile-dot ${idx === 0 ? 'active' : ''}" onclick="MobileFlow.goToSlide(${idx})"></span>
                        `).join('')}
                    </div>
                </div>
            `;

            MobileFlow.startHighlightsAutoPlay();
        },

        startHighlightsAutoPlay: function () {
            if (highlightsInterval) clearInterval(highlightsInterval);
            highlightsInterval = setInterval(() => {
                currentSlideIndex = (currentSlideIndex + 1) % FEATURED_HIGHLIGHTS.length;
                MobileFlow.updateSlideUI();
            }, 5000);
        },

        goToSlide: function (idx) {
            currentSlideIndex = idx;
            MobileFlow.updateSlideUI();
            MobileFlow.startHighlightsAutoPlay();
        },

        prevSlide: function (e) {
            if (e) e.stopPropagation();
            currentSlideIndex = (currentSlideIndex - 1 + FEATURED_HIGHLIGHTS.length) % FEATURED_HIGHLIGHTS.length;
            MobileFlow.updateSlideUI();
            MobileFlow.startHighlightsAutoPlay();
        },

        nextSlide: function (e) {
            if (e) e.stopPropagation();
            currentSlideIndex = (currentSlideIndex + 1) % FEATURED_HIGHLIGHTS.length;
            MobileFlow.updateSlideUI();
            MobileFlow.startHighlightsAutoPlay();
        },

        updateSlideUI: function () {
            const slides = document.querySelectorAll('.mobile-highlight-slide');
            const dots = document.querySelectorAll('.mobile-dot');
            slides.forEach((s, idx) => {
                s.classList.toggle('active', idx === currentSlideIndex);
            });
            dots.forEach((d, idx) => {
                d.classList.toggle('active', idx === currentSlideIndex);
            });
        },

        handleHighlightTap: function (type, id) {
            if (type === 'category') {
                if (window.innerWidth <= 768 && MobileFlow.openCategory) {
                    MobileFlow.openCategory(id);
                } else if (window.filterCategory) {
                    window.filterCategory(id);
                    const shopSection = document.getElementById('shop');
                    if (shopSection) shopSection.scrollIntoView({ behavior: 'smooth' });
                }
            } else if (type === 'product') {
                if (window.innerWidth <= 768 && MobileFlow.openProduct) {
                    MobileFlow.openProduct(id);
                } else if (window.openProductDetailsDrawer) {
                    window.openProductDetailsDrawer(id);
                } else if (window.ProductDrawer && window.ProductDrawer.open) {
                    window.ProductDrawer.open(id);
                }
            }
        },

        // 2. CATEGORY SCREEN
        openCategory: function (catId) {
            currentMobileCategory = catId;
            const titleEl = document.getElementById('mobile-cat-header-title');
            const productsListEl = document.getElementById('mobile-cat-products-list');
            if (!productsListEl) return;

            // Fetch live products
            let allProds = (window.PRODUCTS_DATA && window.PRODUCTS_DATA.length > 0)
                ? window.PRODUCTS_DATA
                : (window.CoreCatalog?.DEFAULT_PRODUCTS || []);

            const categories = window.DEFAULT_CATEGORIES || [];
            const catObj = categories.find(c => c.id === catId);
            const catName = catObj ? catObj.name : 'Category Collection';

            if (titleEl) titleEl.innerText = catName;

            const filteredProds = allProds.filter(p => {
                if (p.isDeleted) return false;
                if (catId === 'all') return true;
                if (catId === 'cat_photo_prints') {
                    return p.category === 'cat_photo_prints' || (p.id && p.id.startsWith('prod_pp_'));
                }
                return p.category === catId;
            });

            if (filteredProds.length === 0) {
                productsListEl.innerHTML = `
                    <div style="text-align:center; padding:50px 20px; color:#94a3b8;">
                        <i class="fas fa-box-open" style="font-size:3rem; margin-bottom:12px; color:var(--gold-primary);"></i>
                        <p>No products available in this category yet.</p>
                    </div>
                `;
            } else {
                productsListEl.innerHTML = filteredProds.map(p => `
                    <div class="mobile-product-card" onclick="MobileFlow.openProduct('${p.id}')">
                        <div class="mobile-prod-thumb">
                            <img src="${p.image}" alt="${p.title}">
                            ${p.badge ? `<span class="mobile-card-badge">${p.badge}</span>` : ''}
                        </div>
                        <div class="mobile-prod-details">
                            <h4 class="mobile-prod-title">${p.title || p.name}</h4>
                            <p class="mobile-prod-desc">${p.desc ? p.desc.substring(0, 50) + '...' : ''}</p>
                            <div class="mobile-prod-rating">
                                <span>⭐ ${p.rating || 4.9}</span> (${p.reviews || 24})
                            </div>
                            <div class="mobile-prod-price-row">
                                <span class="mobile-prod-price">₹${p.price || p.basePrice || 499}</span>
                                ${p.originalPrice ? `<span class="mobile-prod-oldprice">₹${p.originalPrice}</span>` : ''}
                                <span class="mobile-view-tag">View Options <i class="fas fa-chevron-right"></i></span>
                            </div>
                        </div>
                    </div>
                `).join('');
            }

            MobileFlow.renderScreen('category');
        },

        // 3. PRODUCT DETAIL SCREEN
        openProduct: function (prodId) {
            let allProds = (window.PRODUCTS_DATA && window.PRODUCTS_DATA.length > 0)
                ? window.PRODUCTS_DATA
                : (window.CoreCatalog?.DEFAULT_PRODUCTS || []);

            let p = allProds.find(item => item.id === prodId);
            if (!p) {
                p = allProds.find(item => item.id === 'prod_201') || allProds.find(item => item.id === 'prod_101') || allProds[0];
            }
            if (!p) return;

            const isCanvas = p.hasFormats || p.category === 'cat_canvas_prints' || (p.formats && p.formats.length > 0);
            const defaultFormat = isCanvas ? 'Canvas Print (Roll)' : null;

            let initialSizes = p.sizes || [
                { name: '12x18"', price: p.price || 499 },
                { name: 'A4 Size', price: Math.max(49, (p.price || 499) - 100) },
                { name: '18x24"', price: (p.price || 499) + 200 }
            ];

            if (isCanvas && p.sizeChart && p.sizeChart.length > 0) {
                initialSizes = p.sizeChart.map(sc => ({
                    name: sc.size,
                    label: sc.label || sc.size,
                    price: sc.rollPrice || p.price
                }));
            }

            const normalizedSizes = initialSizes.map(s => typeof s === 'string' ? { name: s, price: p.price } : s);

            currentMobileProduct = {
                ...p,
                selectedFormat: defaultFormat,
                selectedSize: normalizedSizes[0] ? normalizedSizes[0].name : 'Standard',
                sizePrice: normalizedSizes[0] ? normalizedSizes[0].price : p.price,
                selectedPaper: isCanvas ? 'Archival Canvas Cotton' : 'Ultra-HD Glossy',
                customPhotoUrl: p.image
            };

            const container = document.getElementById('mobile-product-screen-body');
            if (!container) return;

            const formatHtml = isCanvas ? `
                <!-- Canvas Format Selector (Roll vs Gallery Wrap) -->
                <div class="mobile-pdp-option-group" style="background:rgba(245,158,11,0.06); border:1px solid rgba(245,158,11,0.25); border-radius:12px; padding:12px; margin-bottom:14px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <label class="mobile-option-label" style="margin-bottom:0; color:#f59e0b; font-weight:800;"><i class="fas fa-layer-group"></i> 1. Select Canvas Format:</label>
                        <button type="button" onclick="MobileFlow.openSizeChartModal('${p.id}')" style="background:none; border:none; color:#38bdf8; font-size:0.75rem; font-weight:700; cursor:pointer; text-decoration:underline;">
                            <i class="fas fa-ruler"></i> Size Chart
                        </button>
                    </div>
                    <div class="mobile-format-pills" style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                        <button type="button" class="mobile-format-pill active" onclick="MobileFlow.selectCanvasFormat(this, 'roll')" style="padding:10px 8px; border-radius:8px; border:2px solid #f59e0b; background:#1e293b; color:#fff; font-weight:700; font-size:0.82rem; cursor:pointer; text-align:center;">
                            📜 Canvas Print (Roll)<br><small style="color:#94a3b8; font-size:0.68rem; font-weight:normal;">Unframed in Safety Tube</small>
                        </button>
                        <button type="button" class="mobile-format-pill" onclick="MobileFlow.selectCanvasFormat(this, 'gallery_wrap')" style="padding:10px 8px; border-radius:8px; border:1px solid #475569; background:#0f172a; color:#cbd5e1; font-weight:700; font-size:0.82rem; cursor:pointer; text-align:center;">
                            🪵 Gallery Wrap (Frame)<br><small style="color:#94a3b8; font-size:0.68rem; font-weight:normal;">1.5" Stretched Wood Frame</small>
                        </button>
                    </div>
                </div>
            ` : '';

            container.innerHTML = `
                <!-- Product Main Image with Zoom -->
                <div class="mobile-pdp-gallery">
                    <img id="mobile-pdp-main-img" src="${p.image}" alt="${p.title}">
                    <label for="mobile-pdp-file-input" class="mobile-pdp-upload-btn">
                        <i class="fas fa-cloud-upload-alt"></i> Upload Custom Photo
                    </label>
                    <input type="file" id="mobile-pdp-file-input" accept="image/*" style="display:none;" onchange="MobileFlow.handleCustomPhotoUpload(event)">
                </div>

                <!-- Product Info -->
                <div class="mobile-pdp-info">
                    <span class="mobile-pdp-category">${p.category ? p.category.replace('cat_', '').replace('_', ' ').toUpperCase() : 'STUDIO ART'}</span>
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                        <h2 class="mobile-pdp-title" style="margin:0;">${p.title || p.name}</h2>
                        <button type="button" onclick="window.shareProduct('${p.id}')" style="background:#22c55e; color:#fff; border:none; border-radius:20px; padding:6px 12px; font-size:0.78rem; font-weight:700; display:flex; align-items:center; gap:5px; flex-shrink:0; cursor:pointer; box-shadow:0 4px 10px rgba(34,197,94,0.3);">
                            <i class="fab fa-whatsapp"></i> Share
                        </button>
                    </div>
                    <div class="mobile-pdp-rating-row">
                        <span class="mobile-star-badge">⭐ ${p.rating || 4.9}</span>
                        <span class="mobile-review-count">${p.reviews || 48} Customer Reviews</span>
                        <span class="mobile-sku-badge">SKU: ${p.sku || p.id}</span>
                    </div>
                    <div class="mobile-pdp-price-box">
                        <span class="mobile-pdp-price" id="mobile-pdp-live-price">₹${currentMobileProduct.sizePrice}</span>
                        ${p.originalPrice ? `<span class="mobile-pdp-oldprice">₹${p.originalPrice}</span>` : ''}
                        <span class="mobile-pdp-discount">Special Studio Price</span>
                    </div>

                    ${formatHtml}

                    <!-- Size Variant Selector -->
                    <div class="mobile-pdp-option-group">
                        <label class="mobile-option-label"><i class="fas fa-ruler-combined"></i> ${isCanvas ? '2. ' : ''} Select Size Option:</label>
                        <div class="mobile-size-pills" id="mobile-pdp-size-pills-container">
                            ${normalizedSizes.map((s, idx) => `
                                <button type="button" class="mobile-size-pill ${idx === 0 ? 'active' : ''}" 
                                        onclick="MobileFlow.selectSize(this, '${s.name}', ${s.price})">
                                    ${s.name} (₹${s.price})
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Paper Material (2 Free Options) -->
                    <div class="mobile-pdp-option-group">
                        <label class="mobile-option-label"><i class="fas fa-scroll"></i> Select Finish / Media Material:</label>
                        <div class="mobile-paper-pills">
                            <button type="button" class="mobile-paper-pill active" onclick="MobileFlow.selectPaper(this, '${isCanvas ? '380GSM Museum Textured Cotton' : 'Ultra-HD Glossy'}')">
                                ✨ ${isCanvas ? '380GSM Textured Cotton' : 'Ultra-HD Glossy (+₹0)'}
                            </button>
                            <button type="button" class="mobile-paper-pill" onclick="MobileFlow.selectPaper(this, '${isCanvas ? '350GSM Fine Art Silk Matte' : 'Archival Silk Matte'}')">
                                📜 ${isCanvas ? '350GSM Fine Art Silk Matte' : 'Archival Silk Matte (+₹0)'}
                            </button>
                        </div>
                    </div>

                    <!-- Trust & Guarantee -->
                    <div class="mobile-pdp-guarantee">
                        <div class="mobile-g-item"><i class="fas fa-truck" style="color:#10b981;"></i> Free Express Shipping</div>
                        <div class="mobile-g-item"><i class="fab fa-whatsapp" style="color:#22c55e;"></i> WhatsApp Digital Proof Approval</div>
                        <div class="mobile-g-item"><i class="fas fa-shield-alt" style="color:var(--gold-primary);"></i> 100+ Years Fade-Proof Warranty</div>
                    </div>

                    <!-- Description -->
                    <div class="mobile-pdp-desc-box">
                        <h4>Product Details & Craftsmanship</h4>
                        <p>${p.desc || 'Premium high-definition studio print created with 12-color archival pigment inks on archival media.'}</p>
                    </div>
                </div>

                <!-- Sticky Bottom Bar -->
                <div class="mobile-sticky-bottom-bar">
                    <button class="mobile-btn-cart" onclick="MobileFlow.addToCartCurrent()">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                    <button class="mobile-btn-buy" onclick="MobileFlow.buyNowCurrent()">
                        <i class="fas fa-bolt"></i> Order Now
                    </button>
                </div>
            `;

            MobileFlow.renderScreen('product');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        selectCanvasFormat: function (btn, formatId) {
            document.querySelectorAll('.mobile-format-pill').forEach(b => {
                b.classList.remove('active');
                b.style.border = '1px solid #475569';
                b.style.background = '#0f172a';
                b.style.color = '#cbd5e1';
            });
            btn.classList.add('active');
            btn.style.border = '2px solid #f59e0b';
            btn.style.background = '#1e293b';
            btn.style.color = '#ffffff';

            if (!currentMobileProduct) return;

            const isWrap = (formatId === 'gallery_wrap');
            currentMobileProduct.selectedFormat = isWrap ? 'Gallery Wrap (Frame)' : 'Canvas Print (Roll)';

            // Dynamically recalculate size prices
            const sizeChart = currentMobileProduct.sizeChart || [];
            let newSizes = [];
            if (sizeChart.length > 0) {
                newSizes = sizeChart.map(sc => ({
                    name: sc.size,
                    price: isWrap ? (sc.wrapPrice || sc.price * 1.8) : (sc.rollPrice || sc.price)
                }));
            } else {
                newSizes = (currentMobileProduct.sizes || []).map(s => {
                    const base = typeof s === 'string' ? currentMobileProduct.price : s.price;
                    return {
                        name: typeof s === 'string' ? s : s.name,
                        price: isWrap ? Math.round(base * 1.8) : base
                    };
                });
            }

            // Re-render size pills
            const pillsContainer = document.getElementById('mobile-pdp-size-pills-container');
            if (pillsContainer && newSizes.length > 0) {
                pillsContainer.innerHTML = newSizes.map((s, idx) => `
                    <button type="button" class="mobile-size-pill ${idx === 0 ? 'active' : ''}" 
                            onclick="MobileFlow.selectSize(this, '${s.name}', ${s.price})">
                        ${s.name} (₹${s.price})
                    </button>
                `).join('');

                // Update current product with first size
                currentMobileProduct.selectedSize = newSizes[0].name;
                currentMobileProduct.sizePrice = newSizes[0].price;

                const priceEl = document.getElementById('mobile-pdp-live-price');
                if (priceEl) priceEl.innerText = `₹${newSizes[0].price}`;
            }

            if (window.showToast) window.showToast(`Selected: ${currentMobileProduct.selectedFormat} ✨`);
        },

        openSizeChartModal: function (prodId) {
            let p = currentMobileProduct;
            if (!p && window.products) p = window.products.find(item => item.id === prodId);
            if (!p) return;

            const chart = p.sizeChart || [
                { size: '8x12"', label: '8 × 12 Inch (20 × 30 cm)', rollPrice: 299, wrapPrice: 599 },
                { size: '12x18"', label: '12 × 18 Inch (30 × 45 cm)', rollPrice: 499, wrapPrice: 899 },
                { size: '16x24"', label: '16 × 24 Inch (40 × 60 cm)', rollPrice: 799, wrapPrice: 1399 },
                { size: '20x30"', label: '20 × 30 Inch (50 × 75 cm)', rollPrice: 1199, wrapPrice: 1999 },
                { size: '24x36"', label: '24 × 36 Inch (60 × 90 cm)', rollPrice: 1599, wrapPrice: 2699 }
            ];

            let modal = document.getElementById('canvas-size-chart-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'canvas-size-chart-modal';
                modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); z-index:99999; display:flex; align-items:center; justify-content:center; padding:16px;';
                document.body.appendChild(modal);
            }

            modal.innerHTML = `
                <div style="background:#0f172a; border:1px solid #f59e0b; border-radius:14px; padding:20px; max-width:480px; width:100%; color:#fff; box-shadow:0 20px 50px rgba(0,0,0,0.8); font-family:sans-serif;">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #334155; padding-bottom:12px; margin-bottom:14px;">
                        <h3 style="margin:0; color:#f59e0b; font-size:1.1rem;"><i class="fas fa-ruler-combined"></i> Canvas Size Chart & Rates</h3>
                        <button onclick="document.getElementById('canvas-size-chart-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:1.4rem; cursor:pointer;">&times;</button>
                    </div>

                    <div style="overflow-x:auto; margin-bottom:14px;">
                        <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:left;">
                            <thead>
                                <tr style="background:#1e293b; color:#f59e0b; border-bottom:2px solid #475569;">
                                    <th style="padding:8px 10px;">Size</th>
                                    <th style="padding:8px 10px;">📜 Roll Rate</th>
                                    <th style="padding:8px 10px;">🪵 Frame Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${chart.map(r => `
                                    <tr style="border-bottom:1px solid #334155;">
                                        <td style="padding:8px 10px; font-weight:700;">${r.label || r.size}</td>
                                        <td style="padding:8px 10px; color:#34d399; font-weight:800;">₹${r.rollPrice || 299}</td>
                                        <td style="padding:8px 10px; color:#fbbf24; font-weight:800;">₹${r.wrapPrice || 599}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div style="font-size:0.75rem; color:#94a3b8; line-height:1.4; background:#1e293b; padding:10px; border-radius:8px; margin-bottom:14px;">
                        <strong style="color:#fff;">💡 Summary:</strong><br>
                        • <strong>Canvas Roll:</strong> 100% Cotton Textured Museum Canvas delivered rolled in a safety tube.<br>
                        • <strong>Gallery Wrap:</strong> 1.5" Solid Pinewood stretched frame ready to hang on wall!
                    </div>

                    <button onclick="document.getElementById('canvas-size-chart-modal').style.display='none'" style="width:100%; padding:10px; background:#f59e0b; color:#000; border:none; border-radius:8px; font-weight:800; cursor:pointer;">
                        Got It & Select Size
                    </button>
                </div>
            `;
            modal.style.display = 'flex';
        },

        selectSize: function (btn, sizeName, price) {
            document.querySelectorAll('.mobile-size-pills .mobile-size-pill').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            if (currentMobileProduct) {
                currentMobileProduct.selectedSize = sizeName;
                currentMobileProduct.sizePrice = price;
                const priceEl = document.getElementById('mobile-pdp-live-price');
                if (priceEl) priceEl.innerText = `₹${price}`;
            }
        },

        selectPaper: function (btn, paperName) {
            document.querySelectorAll('.mobile-paper-pills .mobile-paper-pill').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            if (currentMobileProduct) {
                currentMobileProduct.selectedPaper = paperName;
            }
        },

        handleCustomPhotoUpload: function (event) {
            const file = event.target.files && event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (evt) {
                const raw = evt.target.result;
                const img = new Image();
                img.onload = function () {
                    const canvas = document.createElement('canvas');
                    let w = img.width, h = img.height;
                    const ratio = w / h;
                    const orientation = ratio > 1.15 ? 'landscape' : (ratio >= 0.88 && ratio <= 1.15 ? 'square' : 'portrait');

                    const maxDim = 1200;
                    if (w > maxDim || h > maxDim) {
                        if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
                        else { w = Math.round((w * maxDim) / h); h = maxDim; }
                    }
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    const comp = canvas.toDataURL('image/jpeg', 0.88);

                    const preview = document.getElementById('mobile-pdp-main-img');
                    const gallery = document.querySelector('.mobile-pdp-gallery');
                    if (gallery) {
                        gallery.classList.remove('is-portrait', 'is-landscape', 'is-square');
                        gallery.classList.add(`is-${orientation}`);
                    }
                    if (preview) {
                        preview.src = comp;
                        preview.style.objectFit = 'contain';
                    }
                    if (currentMobileProduct) {
                        currentMobileProduct.customPhotoUrl = comp;
                        currentMobileProduct.orientation = orientation;
                    }
                    if (window.showToast) window.showToast(`✅ 100% Full Photo Fitted (${orientation.toUpperCase()}) 📸`);
                };
                img.src = raw;
            };
            reader.readAsDataURL(file);
        },

        addToCartCurrent: function () {
            if (!currentMobileProduct) return;
            const fullTitle = currentMobileProduct.selectedFormat 
                ? `${currentMobileProduct.title || currentMobileProduct.name} [${currentMobileProduct.selectedFormat}]`
                : (currentMobileProduct.title || currentMobileProduct.name);

            const item = {
                id: currentMobileProduct.id,
                title: fullTitle,
                price: currentMobileProduct.sizePrice,
                size: currentMobileProduct.selectedSize,
                format: currentMobileProduct.selectedFormat || 'Standard',
                paper: currentMobileProduct.selectedPaper,
                image: currentMobileProduct.customPhotoUrl || currentMobileProduct.image,
                quantity: 1
            };

            if (window.CartStorage && window.CartStorage.addItem) {
                window.CartStorage.addItem(item);
            } else if (window.addToCart) {
                window.addToCart(currentMobileProduct.id);
            }

            if (window.showToast) window.showToast(`✅ "${item.title}" added to cart! 🛒`);
            if (window.openCartDrawer) window.openCartDrawer();
        },

        buyNowCurrent: function () {
            if (!currentMobileProduct) return;
            const fullTitle = currentMobileProduct.selectedFormat 
                ? `${currentMobileProduct.title || currentMobileProduct.name} [${currentMobileProduct.selectedFormat}]`
                : (currentMobileProduct.title || currentMobileProduct.name);

            const checkoutItem = {
                id: currentMobileProduct.id,
                title: fullTitle,
                price: currentMobileProduct.sizePrice,
                size: currentMobileProduct.selectedSize,
                format: currentMobileProduct.selectedFormat || 'Standard',
                paper: currentMobileProduct.selectedPaper,
                image: currentMobileProduct.customPhotoUrl || currentMobileProduct.image,
                quantity: 1
            };

            MobileFlow.openCheckout(checkoutItem);
        },

        // 4. CHECKOUT SCREEN
        openCheckout: function (singleItem = null) {
            const container = document.getElementById('mobile-checkout-screen-body');
            if (!container) return;

            let items = [];
            if (singleItem) {
                items = [singleItem];
            } else if (window.cart && Array.isArray(window.cart) && window.cart.length > 0) {
                items = window.cart;
            } else {
                try {
                    const saved = JSON.parse(localStorage.getItem('tasveer_cart') || '[]');
                    if (Array.isArray(saved) && saved.length > 0) items = saved;
                } catch(e) {}
            }

            if (items.length === 0) {
                if (window.showToast) window.showToast('🛒 Cart is empty! Please add a photo or frame first.', 'warn');
                MobileFlow.goHome();
                return;
            }

            MobileFlow.renderScreen('checkout');

            const subtotal = items.reduce((acc, item) => acc + ((item.price || 499) * (item.quantity || item.qty || 1)), 0);

            container.innerHTML = `
                <!-- Order Summary Bar -->
                <div class="mobile-checkout-summary">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <strong style="color:var(--walnut-primary, #4a2e19); font-size:0.98rem;"><i class="fas fa-shopping-bag" style="color:var(--gold-primary, #cc8e35);"></i> Order Items (${items.length})</strong>
                        <span style="font-weight:900; color:var(--walnut-primary, #4a2e19); font-size:1.15rem;">₹${subtotal}</span>
                    </div>
                    <div class="mobile-chk-items-mini">
                        ${items.map(it => `
                            <div class="mobile-chk-item-row">
                                <img src="${it.image}" alt="${it.title}">
                                <div style="flex:1;">
                                    <div style="font-weight:700; color:var(--text-main, #1f1a17); font-size:0.9rem;">${it.title}</div>
                                    <div style="font-size:0.78rem; color:var(--text-muted, #595149);">${it.size} • ${it.paper || 'Ultra-HD Glossy'}</div>
                                </div>
                                <div style="font-weight:800; color:var(--walnut-primary, #4a2e19); font-size:0.95rem;">₹${it.price * (it.quantity || 1)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Shipping Address Form -->
                <form id="mobile-checkout-form" onsubmit="MobileFlow.handlePlaceOrder(event, ${JSON.stringify(items).replace(/"/g, '&quot;')}, ${subtotal})">
                    <div class="mobile-form-card">
                        <div class="mobile-form-header"><i class="fas fa-truck"></i> Delivery Information</div>
                        
                        <div class="mobile-input-group">
                            <label>Full Customer Name *</label>
                            <input type="text" id="m-chk-name" class="mobile-input" placeholder="e.g. Rahul Sharma" required>
                        </div>

                        <div class="mobile-input-group">
                            <label>WhatsApp Mobile Number (For Order Status & Proof) *</label>
                            <input type="tel" id="m-chk-phone" class="mobile-input" placeholder="10-digit Mobile Number" pattern="[0-9]{10}" required>
                        </div>

                        <div class="mobile-input-group">
                            <label>Delivery Street Address / Colony / House No. *</label>
                            <textarea id="m-chk-address" class="mobile-input" rows="2" placeholder="Complete Doorstep Address" required></textarea>
                        </div>

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                            <div class="mobile-input-group">
                                <label>City / Town *</label>
                                <input type="text" id="m-chk-city" class="mobile-input" placeholder="e.g. Sawai Madhopur" required>
                            </div>
                            <div class="mobile-input-group">
                                <label>PIN Code *</label>
                                <input type="text" id="m-chk-pin" class="mobile-input" placeholder="6-digit Pincode" pattern="[0-9]{6}" required>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Options -->
                    <div class="mobile-form-card">
                        <div class="mobile-form-header"><i class="fas fa-credit-card"></i> Payment Method</div>
                        <div class="mobile-pay-options">
                            <label class="mobile-pay-option active">
                                <input type="radio" name="mobile_payment_method" value="online" checked>
                                <div class="mobile-pay-label">
                                    <strong><i class="fas fa-qrcode" style="color:#22c55e;"></i> Instant UPI / QR Code / Cards (Razorpay)</strong>
                                    <span>GPay, PhonePe, Paytm, Any UPI App</span>
                                </div>
                            </label>
                            <label class="mobile-pay-option">
                                <input type="radio" name="mobile_payment_method" value="cod">
                                <div class="mobile-pay-label">
                                    <strong><i class="fas fa-store" style="color:var(--gold-primary);"></i> Cash on Delivery / Studio Pickup</strong>
                                    <span>Pay when your framed photo is ready</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Sticky Place Order Button -->
                    <div class="mobile-sticky-bottom-bar">
                        <button type="submit" class="mobile-btn-buy" style="width:100%;">
                            <i class="fas fa-lock"></i> Place Order & Pay ₹${subtotal}
                        </button>
                    </div>
                </form>
            `;

            MobileFlow.renderScreen('checkout');
        },

        // 5. PLACE ORDER & BACKEND WHATSAPP DISPATCH
        handlePlaceOrder: function (e, items, totalAmount) {
            if (e) e.preventDefault();

            const name = document.getElementById('m-chk-name')?.value.trim();
            const phone = document.getElementById('m-chk-phone')?.value.trim();
            const address = document.getElementById('m-chk-address')?.value.trim();
            const city = document.getElementById('m-chk-city')?.value.trim();
            const pin = document.getElementById('m-chk-pin')?.value.trim();
            const paymentMethod = document.querySelector('input[name="mobile_payment_method"]:checked')?.value || 'online';

            // 1. Strict Name Check
            if (!name || name.length < 2) {
                alert('⚠️ Please enter your Full Name.');
                document.getElementById('m-chk-name')?.focus();
                return;
            }

            // 2. Strict 10-Digit Phone Check
            const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
            if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
                alert('⚠️ Please enter a valid 10-digit WhatsApp Mobile Number for Order Confirmation.');
                document.getElementById('m-chk-phone')?.focus();
                return;
            }

            // 3. Strict Delivery Address Check
            if (!address || address.length < 6) {
                alert('⚠️ Delivery Address is required!\n\nPlease enter your complete doorstep address (House No., Street, Colony, Landmark) so we can dispatch your framed photo.');
                document.getElementById('m-chk-address')?.focus();
                return;
            }

            // 4. Strict 6-Digit Pincode Check
            if (!pin || !/^\d{6}$/.test(pin)) {
                alert('⚠️ Please enter a valid 6-digit Postal Pincode.');
                document.getElementById('m-chk-pin')?.focus();
                return;
            }

            const formattedAddress = city ? `${address}, ${city} - ${pin}` : `${address} - ${pin}`;
            const orderId = 'TAS-' + Math.floor(100000 + Math.random() * 900000);
            const orderData = {
                orderId: orderId,
                id: orderId,
                customer: {
                    name: name,
                    phone: '91' + cleanPhone,
                    address: formattedAddress
                },
                items: items,
                totalAmount: totalAmount,
                total: totalAmount,
                paymentMethod: paymentMethod === 'online' ? 'Razorpay UPI / Online' : 'Cash On Delivery',
                paymentStatus: paymentMethod === 'online' ? 'Pending (Awaiting Payment)' : 'Pending (Cash On Delivery)',
                status: 'Processing',
                createdAt: new Date().toISOString()
            };

            if (paymentMethod === 'online') {
                if (window.Razorpay) {
                    const razorpayKey = window.RAZORPAY_KEY_ID || localStorage.getItem('tasveer_razorpay_key') || 'rzp_live_TRFmjNYX9knTwo';
                    const options = {
                        key: razorpayKey,
                        amount: Math.round(totalAmount * 100),
                        currency: 'INR',
                        name: 'Tasveer by Prince Studio',
                        description: `Order #${orderId}`,
                        image: 'hero-poster.png',
                        handler: function (response) {
                            console.log('✅ Real Razorpay Success:', response);
                            orderData.paymentStatus = 'PAID';
                            orderData.paymentId = response.razorpay_payment_id;
                            orderData.status = 'Confirmed';
                            MobileFlow.finalizeOrderAndConfirm(orderData);
                        },
                        prefill: {
                            name: name,
                            contact: phone,
                            email: 'customer@tasviir.in'
                        },
                        theme: { color: '#d97706' },
                        modal: {
                            ondismiss: function () {
                                if (window.showToast) window.showToast('⚠️ Payment was not completed / Cancelled.', 'warn');
                                orderData.paymentStatus = 'Pending (Payment Incomplete)';
                                MobileFlow.savePendingOrder(orderData);
                                alert('⚠️ Payment was cancelled or incomplete.\n\nAapka order "Pending Payment" status me save ho gaya hai. Aap ise Cash on Delivery me convert kar sakte hain ya dobara pay kar sakte hain.');
                            }
                        }
                    };

                    try {
                        const rzp = new window.Razorpay(options);
                        rzp.on('payment.failed', function (resp) {
                            orderData.paymentStatus = 'Failed (' + (resp.error?.description || 'Declined') + ')';
                            MobileFlow.savePendingOrder(orderData);
                            alert('❌ Payment Failed: ' + (resp.error?.description || 'Declined by Bank'));
                        });
                        rzp.open();
                        return;
                    } catch (err) {
                        console.warn('Razorpay open fallback:', err);
                    }
                }
            } else {
                // Cash on Delivery
                orderData.paymentStatus = 'Pending (Cash On Delivery)';
                orderData.status = 'Confirmed';
                MobileFlow.finalizeOrderAndConfirm(orderData);
            }
        },

        savePendingOrder: function(orderData) {
            try {
                let savedOrders = JSON.parse(localStorage.getItem('tasveer_orders') || '[]');
                savedOrders = savedOrders.filter(o => (o.id !== orderData.id && o.orderId !== orderData.orderId));
                savedOrders.unshift(orderData);
                localStorage.setItem('tasveer_orders', JSON.stringify(savedOrders));

                if (window.CloudDB && window.CloudDB.pushUpdate) {
                    window.CloudDB.pushUpdate('orders', savedOrders);
                }
            } catch (err) {}
        },

        finalizeOrderAndConfirm: function (orderData) {
            // Save order locally and sync to Firebase
            try {
                let savedOrders = JSON.parse(localStorage.getItem('tasveer_orders') || '[]');
                savedOrders.unshift(orderData);
                localStorage.setItem('tasveer_orders', JSON.stringify(savedOrders));

                if (window.CloudDB && window.CloudDB.pushUpdate) {
                    window.CloudDB.pushUpdate('orders', savedOrders);
                }
            } catch (err) {}

            // Send Confirmation FROM Prince Studio Backend TO Customer's WhatsApp Number
            MobileFlow.dispatchBackendWhatsAppConfirmation(orderData);

            // Render Success Screen
            MobileFlow.renderSuccessScreen(orderData);
        },

        dispatchBackendWhatsAppConfirmation: function (order) {
            if (window.WhatsAppGateway) {
                window.WhatsAppGateway.dispatchOrderNotifications(order);
            }
            console.log(`[WhatsApp Gateway Dispatch] Triggered automated WhatsApp bot for Order ${order.orderId}!`);
        },

        renderSuccessScreen: function (order) {
            const container = document.getElementById('mobile-success-screen-body');
            if (!container) return;

            const itemsStr = (order.items && order.items.length > 0)
                ? order.items.map((i, idx) => `  ${idx + 1}. ${i.title || i.name} (x${i.qty || i.quantity || 1}) - ₹${(i.price || 499) * (i.qty || i.quantity || 1)}`).join('\n')
                : `  1. Custom Frame - ₹${order.totalAmount || 499}`;

            const msg = [
                `🎉 *ORDER CONFIRMATION - TASVEER BY PRINCE STUDIO* 🎉`,
                ``,
                `Hello Prince Studio Team, I have placed an order on your website!`,
                ``,
                `📦 *Order ID:* ${order.orderId}`,
                `👤 *Customer Name:* ${order.customer.name}`,
                `📞 *Phone:* ${order.customer.phone}`,
                `📍 *Address:* ${order.customer.address}`,
                ``,
                `🖼️ *Items Ordered:*`,
                itemsStr,
                ``,
                `💰 *Total Amount:* ₹${order.totalAmount}`,
                `💳 *Payment Status:* ${order.paymentStatus || 'Pending'}`,
                `🧾 *Payment ID:* ${order.paymentId || 'N/A'}`,
                ``,
                `🚚 *Estimated Dispatch:* 24-48 Hours`,
                ``,
                `Please confirm my order and share photo proof approval! 🙏✨`
            ].join('\n');

            const whatsappUrl = `https://wa.me/917231900124?text=${encodeURIComponent(msg)}`;

            container.innerHTML = `
                <div class="mobile-success-card">
                    <div class="mobile-success-icon"><i class="fas fa-check-circle"></i></div>
                    <h2 style="font-family:var(--font-heading); color:var(--walnut-primary, #4a2e19); font-size:1.5rem; margin-bottom:6px; font-weight:800;">Order Confirmed!</h2>
                    <p style="color:var(--text-muted, #595149); font-size:0.88rem; margin-bottom:16px;">Order ID: <strong style="color:var(--gold-primary, #cc8e35);">${order.orderId}</strong></p>

                    <div style="background:rgba(22,163,74,0.08); border:1px solid rgba(22,163,74,0.25); border-radius:12px; padding:14px; margin-bottom:18px; text-align:left;">
                        <div style="display:flex; align-items:center; gap:8px; color:#16a34a; font-weight:800; margin-bottom:4px; font-size:0.95rem;">
                            <i class="fab fa-whatsapp" style="font-size:1.3rem;"></i> WhatsApp Confirmation Ready!
                        </div>
                        <div style="font-size:0.82rem; color:var(--text-main, #1f1a17); line-height:1.45;">
                            Click below to send your order receipt and receive digital photo proofs directly on WhatsApp.
                        </div>
                    </div>

                    <a href="${whatsappUrl}" target="_blank" class="btn" style="background:#25D366; color:#ffffff; width:100%; padding:14px; font-weight:800; font-size:0.95rem; border-radius:10px; display:inline-flex; align-items:center; justify-content:center; gap:8px; text-decoration:none; box-shadow:0 4px 14px rgba(37,211,102,0.4); margin-bottom:12px;">
                        <i class="fab fa-whatsapp" style="font-size:1.3rem;"></i> 💬 Open WhatsApp Receipt & Chat
                    </a>

                    <div class="mobile-success-summary-box">
                        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                            <span>Customer:</span>
                            <strong style="color:var(--text-main, #1f1a17);">${order.customer.name}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                            <span>Total Amount:</span>
                            <strong style="color:var(--walnut-primary, #4a2e19); font-size:1.15rem; font-weight:900;">₹${order.totalAmount}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <span>Payment:</span>
                            <strong style="color:#16a34a; font-weight:800;">${order.paymentStatus}</strong>
                        </div>
                    </div>

                    <button class="btn btn-outline" style="width:100%; margin-top:14px; padding:12px; border-radius:10px; background:#ffffff; color:var(--walnut-primary); border-color:var(--border-color);" onclick="MobileFlow.goHome()">
                        <i class="fas fa-home"></i> Back to Studio Home
                    </button>
                </div>
            `;

            MobileFlow.renderScreen('success');

            // Auto-trigger WhatsApp redirect after 1.2s on mobile
            setTimeout(() => {
                try {
                    window.open(whatsappUrl, '_blank');
                } catch(e) {
                    window.location.href = whatsappUrl;
                }
            }, 1200);
        }
    };

    // Auto-init on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', MobileFlow.init);
    } else {
        MobileFlow.init();
    }

    // Expose MobileFlow globally
    window.MobileFlow = MobileFlow;

})(window, document);
