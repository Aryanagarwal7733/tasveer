/**
 * ==========================================================================
 * Tasveer by Prince Studio - Product Variation Details Drawer Module (js/product-drawer.js)
 * Isolated product variation customizer drawer engine
 * ==========================================================================
 */

(function (window) {
    'use strict';

    let currentDrawerState = {
        productId: null,
        productTitle: '',
        basePrice: 499,
        sizePrice: 499,
        frameExtra: 0,
        paperExtra: 0,
        selectedSize: '12x18"',
        selectedFrame: 'No Frame (Print Only)',
        selectedPaper: 'Ultra-HD Glossy',
        frameClass: 'frame-none',
        customPhotoUrl: '',
        originalPhotoName: ''
    };

    const ProductDrawer = {
        open: function (productId) {
            const targetId = productId || 'prod_201';
            if (window.innerWidth <= 768 && window.MobileFlow && window.MobileFlow.openProduct) {
                window.MobileFlow.openProduct(targetId);
                return;
            }

            const products = window.PRODUCTS_DATA || window.CoreCatalog?.DEFAULT_PRODUCTS || [];
            let prod = products.find(p => p.id === targetId);
            if (!prod) {
                prod = products.find(p => p.id === 'prod_201') || products.find(p => p.id === 'prod_101') || products[0];
            }
            if (!prod) return;

            const isCanvas = (prod.category === 'cat_canvas_prints' || prod.hasFormats || (prod.formats && prod.formats.length > 0));
            const defaultFormat = isCanvas ? 'Canvas Print (Roll)' : null;

            currentDrawerState = {
                productId: prod.id,
                productTitle: prod.title,
                basePrice: prod.price,
                sizePrice: prod.price,
                frameExtra: 0,
                paperExtra: 0,
                selectedFormat: defaultFormat,
                selectedSize: '12x18"',
                selectedFrame: 'No Frame (Print Only)',
                selectedPaper: isCanvas ? 'Archival Canvas Cotton' : 'Ultra-HD Glossy',
                frameClass: 'frame-none',
                customPhotoUrl: prod.image || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500',
                originalPhotoName: '',
                currentProd: prod
            };

            window._currentDrawerProductId = prod.id;
            window.currentDrawerState = currentDrawerState;

            const titleEl = safeGet('drawer-prod-title');
            if (titleEl) {
                titleEl.innerText = prod.title;
            }

            const previewEl = safeGet('drawer-photo-preview');
            if (previewEl) {
                previewEl.src = prod.image || 'hero-poster.png';
                previewEl.className = 'frame-none';
                ProductDrawer.autoFitPreviewImage(previewEl.src);
            }

            const mockup = safeGet('drawer-frame-mockup');
            if (mockup) {
                mockup.className = 'frame-mockup frame-none is-portrait';
            }

            const statusEl = safeGet('drawer-upload-status');
            if (statusEl) statusEl.innerText = '';

            // Frame Selection is completely hidden
            const frameSection = safeGet('drawer-frame-section');
            if (frameSection) {
                frameSection.style.display = 'none';
            }

            // Show/Hide Canvas Format Section
            const formatSection = safeGet('drawer-format-section');
            if (formatSection) {
                formatSection.style.display = isCanvas ? 'block' : 'none';
                // Reset active format pill to Roll
                document.querySelectorAll('#drawer-format-options .option-btn').forEach((b, idx) => {
                    if (idx === 0) b.classList.add('active');
                    else b.classList.remove('active');
                });
            }

            ProductDrawer.renderMediaGallery(prod);
            ProductDrawer.renderSizeOptions(prod, 'roll');
            ProductDrawer.renderPaperOptions(isCanvas);
            ProductDrawer.renderFrameOptions();
            ProductDrawer.recalculatePrice();

            const overlay = safeGet('product-details-overlay');
            if (overlay) {
                overlay.style.display = '';
                overlay.classList.add('open');
            }
        },

        close: function () {
            const overlay = safeGet('product-details-overlay');
            if (overlay) {
                overlay.classList.remove('open');
                overlay.style.display = '';
            }
        },

        
        renderMediaGallery: function (prod) {
            let mockup = safeGet('drawer-frame-mockup');
            if (!mockup) return;

            let mediaContainer = safeGet('drawer-media-slider-strip');
            if (!mediaContainer) {
                mediaContainer = document.createElement('div');
                mediaContainer.id = 'drawer-media-slider-strip';
                mediaContainer.style.cssText = 'display:flex; gap:8px; overflow-x:auto; padding:10px 4px 4px 4px; justify-content:center; align-items:center; margin-top:8px;';
                mockup.parentNode.insertBefore(mediaContainer, mockup.nextSibling);
            }

            // Gather all media items
            let mediaList = [];
            if (prod.media && Array.isArray(prod.media) && prod.media.length > 0) {
                mediaList = [...prod.media];
            } else {
                if (prod.image) mediaList.push({ type: 'image', url: prod.image });
                if (prod.videoUrl) mediaList.push({ type: 'video', url: prod.videoUrl });
            }

            if (mediaList.length <= 1) {
                mediaContainer.innerHTML = '';
                mediaContainer.style.display = 'none';
                return;
            }

            mediaContainer.style.display = 'flex';
            mediaContainer.innerHTML = mediaList.map((m, idx) => {
                const isVideo = (m.type === 'video');
                const isGif = (m.type === 'gif');
                const isFirst = (idx === 0);

                return `
                    <div class="drawer-media-thumb ${isFirst ? 'active' : ''}" onclick="window.ProductDrawer.switchMedia(${idx})" style="position:relative; width:54px; height:54px; border-radius:6px; overflow:hidden; border:2px solid ${isFirst ? '#d4af37' : '#cbd5e1'}; cursor:pointer; flex-shrink:0; background:#000; transition:all 0.2s ease;">
                        ${isVideo ? `
                            <video src="${m.url}" style="width:100%; height:100%; object-fit:cover;" muted></video>
                            <span style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.4); color:#f59e0b; font-size:0.9rem;"><i class="fas fa-play-circle"></i></span>
                        ` : `
                            <img src="${m.url}" style="width:100%; height:100%; object-fit:cover;">
                            ${isGif ? `<span style="position:absolute; top:2px; right:2px; font-size:0.55rem; background:#10b981; color:#fff; padding:1px 3px; border-radius:2px; font-weight:800;">GIF</span>` : ''}
                        `}
                    </div>
                `;
            }).join('');

            window._currentDrawerMediaList = mediaList;
        },

        switchMedia: function (idx) {
            const list = window._currentDrawerMediaList || [];
            const item = list[idx];
            if (!item) return;

            const previewImg = safeGet('drawer-photo-preview');
            const mockup = safeGet('drawer-frame-mockup');
            let videoEl = safeGet('drawer-video-player');

            // Highlight active thumb
            document.querySelectorAll('#drawer-media-slider-strip .drawer-media-thumb').forEach((el, i) => {
                if (i === idx) {
                    el.style.borderColor = '#d4af37';
                    el.style.transform = 'scale(1.08)';
                } else {
                    el.style.borderColor = '#cbd5e1';
                    el.style.transform = 'scale(1)';
                }
            });

            if (item.type === 'video') {
                if (previewImg) previewImg.style.display = 'none';
                if (!videoEl) {
                    videoEl = document.createElement('video');
                    videoEl.id = 'drawer-video-player';
                    videoEl.style.cssText = 'width:100%; max-height:300px; border-radius:8px; background:#000; object-fit:contain; display:block;';
                    videoEl.controls = true;
                    videoEl.autoplay = true;
                    videoEl.loop = true;
                    videoEl.playsInline = true;
                    mockup.querySelector('.frame-mat-inner')?.appendChild(videoEl);
                }
                videoEl.src = item.url;
                videoEl.style.display = 'block';
                videoEl.play().catch(()=>{});
            } else {
                if (videoEl) {
                    videoEl.pause();
                    videoEl.style.display = 'none';
                }
                if (previewImg) {
                    previewImg.src = item.url;
                    previewImg.style.display = 'block';
                    ProductDrawer.autoFitPreviewImage(item.url);
                }
            }
        },

        selectFormat: function (btn, formatId) {
            document.querySelectorAll('#drawer-format-options .option-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const isWrap = (formatId === 'gallery_wrap');
            currentDrawerState.selectedFormat = isWrap ? 'Gallery Wrap (Frame)' : 'Canvas Print (Roll)';

            const prod = currentDrawerState.currentProd;
            ProductDrawer.renderSizeOptions(prod, formatId);
            ProductDrawer.recalculatePrice();

            // Flipkart / Amazon style format image switch
            if (prod && prod.media && prod.media.length >= 2) {
                const targetIdx = isWrap ? 1 : 0;
                if (window.ProductDrawer.switchMedia) {
                    window.ProductDrawer.switchMedia(targetIdx);
                }
            }

            if (window.showToast) window.showToast(`Selected: ${currentDrawerState.selectedFormat} ✨`);
        },

        openSizeChartModal: function () {
            const prod = currentDrawerState.currentProd;
            const chart = (prod && prod.sizeChart && prod.sizeChart.length > 0) ? prod.sizeChart : [
                { size: '8x12"', label: '8 × 12 Inch (20 × 30 cm)', rollPrice: 299, wrapPrice: 599 },
                { size: '12x18"', label: '12 × 18 Inch (30 × 45 cm)', rollPrice: 499, wrapPrice: 899 },
                { size: '16x24"', label: '16 × 24 Inch (40 × 60 cm)', rollPrice: 799, wrapPrice: 1399 },
                { size: '20x30"', label: '20 × 30 Inch (50 × 75 cm)', rollPrice: 1199, wrapPrice: 1999 },
                { size: '24x36"', label: '24 × 36 Inch (60 × 90 cm)', rollPrice: 1599, wrapPrice: 2699 }
            ];

            let modal = safeGet('desktop-canvas-size-chart-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'desktop-canvas-size-chart-modal';
                modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); z-index:999999; display:flex; align-items:center; justify-content:center; padding:20px;';
                document.body.appendChild(modal);
            }

            modal.innerHTML = `
                <div style="background:#0f172a; border:2px solid #f59e0b; border-radius:16px; padding:24px; max-width:520px; width:100%; color:#fff; box-shadow:0 25px 60px rgba(0,0,0,0.9); font-family:sans-serif;">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #334155; padding-bottom:12px; margin-bottom:16px;">
                        <h3 style="margin:0; color:#f59e0b; font-size:1.2rem;"><i class="fas fa-ruler-combined"></i> Canvas Prints Rate & Size Chart</h3>
                        <button onclick="safeGet('desktop-canvas-size-chart-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:1.5rem; cursor:pointer;">&times;</button>
                    </div>

                    <div style="overflow-x:auto; margin-bottom:16px;">
                        <table style="width:100%; border-collapse:collapse; font-size:0.9rem; text-align:left;">
                            <thead>
                                <tr style="background:#1e293b; color:#f59e0b; border-bottom:2px solid #475569;">
                                    <th style="padding:10px 12px;">Size</th>
                                    <th style="padding:10px 12px;">📜 Roll Rate</th>
                                    <th style="padding:10px 12px;">🪵 Frame Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${chart.map(r => `
                                    <tr style="border-bottom:1px solid #334155;">
                                        <td style="padding:10px 12px; font-weight:700;">${r.label || r.size}</td>
                                        <td style="padding:10px 12px; color:#34d399; font-weight:800;">₹${r.rollPrice || 299}</td>
                                        <td style="padding:10px 12px; color:#fbbf24; font-weight:800;">₹${r.wrapPrice || 599}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div style="font-size:0.8rem; color:#94a3b8; line-height:1.5; background:#1e293b; padding:12px; border-radius:8px; margin-bottom:16px;">
                        <strong style="color:#fff;">💡 Options Summary:</strong><br>
                        • <strong>Canvas Print (Roll):</strong> 100% Cotton Textured Museum Canvas delivered rolled in a safety tube.<br>
                        • <strong>Gallery Wrap (Frame):</strong> 1.5" Solid Pinewood stretched frame ready to hang on your wall!
                    </div>

                    <button onclick="safeGet('desktop-canvas-size-chart-modal').style.display='none'" style="width:100%; padding:12px; background:#f59e0b; color:#000; border:none; border-radius:8px; font-weight:800; font-size:0.95rem; cursor:pointer;">
                        Close & Select Size
                    </button>
                </div>
            `;
            modal.style.display = 'flex';
        },

        renderSizeOptions: function (prod, formatId = 'roll') {
            const container = safeGet('drawer-size-options');
            if (!container) return;

            const isWrap = (formatId === 'gallery_wrap');
            let sizeList = [];

            if (prod && prod.sizeChart && Array.isArray(prod.sizeChart) && prod.sizeChart.length > 0) {
                sizeList = prod.sizeChart.map(sc => ({
                    name: sc.size,
                    price: isWrap ? (sc.wrapPrice || sc.price * 1.8) : (sc.rollPrice || sc.price)
                }));
            } else if (prod && prod.sizes && Array.isArray(prod.sizes) && prod.sizes.length > 0) {
                sizeList = prod.sizes.map((s, idx) => {
                    const sName = typeof s === 'string' ? s : s.name;
                    const base = typeof s === 'string' ? prod.price : s.price;
                    const sPrice = isWrap ? (s.wrapPrice || Math.round(base * 1.8)) : (s.rollPrice || base);
                    const sImg = (typeof s === 'object' && s.image) ? s.image : ((prod.media && prod.media[idx]) ? prod.media[idx].url : '');
                    return { name: sName, price: sPrice, image: sImg, index: idx };
                });
            } else {
                sizeList = [
                    { name: '8x12"', price: isWrap ? 599 : 299, image: (prod.media && prod.media[0]) ? prod.media[0].url : '', index: 0 },
                    { name: '12x18"', price: isWrap ? 899 : 499, image: (prod.media && prod.media[1]) ? prod.media[1].url : '', index: 1 },
                    { name: '16x24"', price: isWrap ? 1399 : 799, image: (prod.media && prod.media[2]) ? prod.media[2].url : '', index: 2 },
                    { name: '20x30"', price: isWrap ? 1999 : 1199, index: 3 },
                    { name: '24x36"', price: isWrap ? 2699 : 1599, index: 4 }
                ];
            }

            container.innerHTML = sizeList.map((s, idx) => {
                const isActive = idx === 0 ? 'active' : '';
                return `
                    <button class="option-btn drawer-opt-btn ${isActive}" 
                            data-size="${s.name}" 
                            data-price="${s.price}" 
                            data-custom="${s.isCustom ? 'true' : 'false'}"
                            data-image="${s.image || ''}"
                            data-index="${s.index !== undefined ? s.index : idx}"
                            onclick="ProductDrawer.selectSize(this)">
                        ${s.name} (₹${s.price})
                    </button>
                `;
            }).join('');

            currentDrawerState.selectedSize = sizeList[0].name;
            currentDrawerState.sizePrice = sizeList[0].price;

            const customBox = safeGet('drawer-custom-dim-box');
            if (customBox) customBox.style.display = sizeList[0].isCustom ? 'block' : 'none';
        },

        renderPaperOptions: function (isCanvas = false) {
            const container = safeGet('drawer-paper-options');
            if (!container) return;

            const papers = isCanvas ? [
                { id: 'canvas_cotton', name: '380GSM Museum Textured Cotton', extra: 0 },
                { id: 'canvas_silk', name: '350GSM Fine Art Silk Matte', extra: 0 }
            ] : [
                { id: 'glossy', name: 'Ultra-HD Glossy', extra: 0 },
                { id: 'matte', name: 'Archival Silk Matte', extra: 0 }
            ];

            container.innerHTML = papers.map((p, idx) => {
                const isActive = idx === 0 ? 'active' : '';
                return `
                    <button class="option-btn drawer-opt-btn ${isActive}" 
                            data-paper="${p.name}" 
                            data-extra="0" 
                            onclick="ProductDrawer.selectPaper(this)">
                        ${p.name}
                    </button>
                `;
            }).join('');

            currentDrawerState.selectedPaper = papers[0].name;
            currentDrawerState.paperExtra = 0;
        },

        renderFrameOptions: function () {
            const container = safeGet('drawer-frame-options');
            if (!container) return;

            const defaultTextures = [
                { id: 'fmt_walnut', name: 'Walnut Wood', image: 'https://images.unsplash.com/photo-1546484475-7f7bd55792da?w=600&auto=format&fit=crop', extra: 0, frameClass: 'frame-wood' },
                { id: 'fmt_black', name: 'Sleek Black', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop', extra: 0, frameClass: 'frame-black' },
                { id: 'fmt_gold', name: 'Shahi Gold', image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop', extra: 100, frameClass: 'frame-gold' },
                { id: 'fmt_white', name: 'Scandinavian White', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop', extra: 50, frameClass: 'frame-white' },
                { id: 'fmt_acrylic', name: 'Acrylic Floating', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop', extra: 200, frameClass: 'frame-acrylic' }
            ];

            let customTextures = [];
            try {
                const stored = JSON.parse(localStorage.getItem('tasveer_frame_textures'));
                if (stored && Array.isArray(stored) && stored.length > 0) {
                    customTextures = stored;
                }
            } catch(e) {}

            const allTextures = customTextures.length ? customTextures : defaultTextures;

            container.innerHTML = allTextures.map((t, idx) => {
                const frameClass = t.frameClass || (t.id.includes('gold') ? 'frame-gold' : t.id.includes('black') ? 'frame-black' : t.id.includes('acrylic') ? 'frame-acrylic' : t.id.includes('white') ? 'frame-white' : 'frame-wood');
                const isActive = idx === 0 ? 'active' : '';
                const extraLabel = t.extra > 0 ? ` (+₹${t.extra})` : '';
                const thumbImg = t.image ? `<img src="${t.image}" style="width:16px;height:16px;object-fit:cover;border-radius:3px;margin-right:6px;vertical-align:middle;border:1px solid rgba(255,255,255,0.3);">` : '';
                return `
                    <button class="option-btn drawer-opt-btn ${isActive}" 
                            data-frame="${frameClass}" 
                            data-extra="${t.extra || 0}" 
                            data-texture-url="${t.image || ''}"
                            onclick="ProductDrawer.selectFrame(this)">
                        ${thumbImg}${t.name}${extraLabel}
                    </button>
                `;
            }).join('');
        },

        selectSize: function (btn) {
            document.querySelectorAll('#drawer-size-options .option-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentDrawerState.sizePrice = parseFloat(btn.dataset.price) || currentDrawerState.basePrice;
            currentDrawerState.selectedSize = btn.dataset.size || btn.innerText.trim();

            const isCustom = btn.dataset.custom === 'true';
            const varImg = btn.dataset.image;
            const varIdx = parseInt(btn.dataset.index) || 0;

            // Flipkart / Amazon Style: Switch preview image on variation click!
            if (varImg && varImg.trim() !== '') {
                const previewImg = safeGet('drawer-photo-preview');
                if (previewImg) {
                    previewImg.src = varImg;
                    previewImg.style.display = 'block';
                    ProductDrawer.autoFitPreviewImage(varImg);
                }
            } else if (window.ProductDrawer.switchMedia) {
                window.ProductDrawer.switchMedia(varIdx);
            }

            const customBox = safeGet('drawer-custom-dim-box');
            if (customBox) {
                customBox.style.display = isCustom ? 'block' : 'none';
            }

            if (isCustom) {
                ProductDrawer.updateCustomSizeDim();
            } else {
                ProductDrawer.recalculatePrice();
            }
        },

        updateCustomSizeDim: function () {
            const w = parseFloat(safeGet('drawer-custom-w')?.value) || 20;
            const h = parseFloat(safeGet('drawer-custom-h')?.value) || 30;
            currentDrawerState.selectedSize = `${w}x${h}" Custom Size`;
            const sqInches = w * h;
            const calcPrice = Math.max(199, Math.round(sqInches * 0.9));
            currentDrawerState.sizePrice = calcPrice;
            ProductDrawer.recalculatePrice();
        },

        selectFrame: function (btn) {
            document.querySelectorAll('#drawer-frame-options .option-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentDrawerState.frameExtra = parseFloat(btn.dataset.extra) || 0;
            currentDrawerState.selectedFrame = btn.innerText.trim();
            currentDrawerState.frameClass = btn.dataset.frame || 'frame-wood';

            const mockup = safeGet('drawer-frame-mockup');
            if (mockup) {
                mockup.className = `frame-mockup ${currentDrawerState.frameClass}`;
                
                let pngOverlay = safeGet('drawer-frame-png-overlay');
                if (btn.dataset.textureUrl && (btn.dataset.textureUrl.startsWith('data:image') || btn.dataset.textureUrl.includes('.png') || btn.dataset.textureUrl.includes('unsplash'))) {
                    if (!pngOverlay) {
                        pngOverlay = document.createElement('img');
                        pngOverlay.id = 'drawer-frame-png-overlay';
                        pngOverlay.className = 'frame-overlay-png';
                        mockup.appendChild(pngOverlay);
                    }
                    pngOverlay.src = btn.dataset.textureUrl;
                    pngOverlay.style.display = 'block';
                } else if (pngOverlay) {
                    pngOverlay.style.display = 'none';
                }
            }

            ProductDrawer.recalculatePrice();
        },

        selectPaper: function (btn) {
            document.querySelectorAll('#drawer-paper-options .option-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentDrawerState.paperExtra = parseFloat(btn.dataset.extra) || 0;
            currentDrawerState.selectedPaper = btn.dataset.paper || btn.innerText.trim();
            ProductDrawer.recalculatePrice();
        },

        recalculatePrice: function () {
            const total = currentDrawerState.sizePrice + currentDrawerState.frameExtra + currentDrawerState.paperExtra;
            const priceEl = safeGet('drawer-final-price');
            if (priceEl) priceEl.innerText = `₹${total}`;
        },

        autoFitPreviewImage: function (srcUrl) {
            if (!srcUrl) return;
            const img = new Image();
            img.onload = function () {
                const w = img.naturalWidth || img.width;
                const h = img.naturalHeight || img.height;
                const ratio = w / h;
                const orientation = ratio > 1.15 ? 'landscape' : (ratio >= 0.88 && ratio <= 1.15 ? 'square' : 'portrait');
                currentDrawerState.orientation = orientation;
                ProductDrawer.applyOrientationToMockup(orientation, w, h);

                const badgeEl = safeGet('drawer-orientation-badge');
                if (badgeEl) {
                    const icon = orientation === 'landscape' ? '↔' : orientation === 'portrait' ? '↕' : '⏹';
                    badgeEl.innerHTML = `<i class="fas fa-check-circle" style="color:#16a34a;"></i> Auto: <strong>${orientation.toUpperCase()}</strong> (${icon} ${w}×${h}px)`;
                }
            };
            img.src = srcUrl;
        },

        handlePhotoUpload: function (e) {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            const statusEl = safeGet('drawer-upload-status');
            const previewEl = safeGet('drawer-photo-preview');
            if (statusEl) statusEl.innerText = '⚡ Analyzing photo dimensions & fitting frame...';

            const reader = new FileReader();
            reader.onload = function (evt) {
                const previewUrl = evt.target.result;

                if (previewEl) {
                    previewEl.src = previewUrl;
                    previewEl.style.display = 'block';
                }

                ProductDrawer.autoFitPreviewImage(previewUrl);

                currentDrawerState.customPhotoUrl = previewUrl;
                currentDrawerState.originalPhotoName = file.name;
                if (statusEl) statusEl.innerText = `✅ 100% Full Photo Fitted: ${file.name}`;
                if (window.logDebugMessage) window.logDebugMessage(`🖼️ Customer Photo Auto-Fitted: "${file.name}"`, 'info');
            };
            reader.readAsDataURL(file);

            if (window.HDPhotoEngine) {
                window.HDPhotoEngine.processCustomerPhoto(file, null, (hdData) => {
                    if (statusEl) statusEl.innerText = `✓ 100% Ultra HD Photo Synced (${hdData.fileSize || 'HD Ready'})`;
                    if (hdData.gdriveUrl) currentDrawerState.customPhotoUrl = hdData.gdriveUrl;
                });
            }
        },

        applyOrientationToMockup: function (orientation, w, h) {
            const mockupEl = safeGet('drawer-frame-mockup');
            const previewEl = safeGet('drawer-photo-preview');
            if (!mockupEl) return;
            
            mockupEl.classList.remove('is-portrait', 'is-landscape', 'is-square');
            mockupEl.classList.add(`is-${orientation}`);

            // Direct inline styling ensures 100% zero-crop regardless of CSS overrides
            if (orientation === 'portrait') {
                mockupEl.style.maxWidth = '210px';
                mockupEl.style.width = '100%';
                mockupEl.style.height = '290px';
                mockupEl.style.aspectRatio = '3/4';
            } else if (orientation === 'landscape') {
                mockupEl.style.maxWidth = '310px';
                mockupEl.style.width = '100%';
                mockupEl.style.height = '210px';
                mockupEl.style.aspectRatio = '4/3';
            } else {
                mockupEl.style.maxWidth = '240px';
                mockupEl.style.width = '100%';
                mockupEl.style.height = '240px';
                mockupEl.style.aspectRatio = '1/1';
            }

            if (previewEl) {
                previewEl.style.maxWidth = '100%';
                previewEl.style.maxHeight = '100%';
                previewEl.style.width = 'auto';
                previewEl.style.height = 'auto';
                previewEl.style.objectFit = 'contain';
                previewEl.style.display = 'block';
                previewEl.style.margin = '0 auto';
            }
        },

        toggleOrientation: function () {
            const cur = currentDrawerState.orientation || 'portrait';
            const next = cur === 'portrait' ? 'landscape' : 'portrait';
            currentDrawerState.orientation = next;
            ProductDrawer.applyOrientationToMockup(next);
            const badgeEl = safeGet('drawer-orientation-badge');
            if (badgeEl) {
                const icon = next === 'landscape' ? '↔' : '↕';
                badgeEl.innerHTML = `<i class="fas fa-sync-alt" style="color:var(--gold-primary);"></i> Manual: <strong>${next.toUpperCase()}</strong> (${icon})`;
            }
        },

        addToCart: function (e) {
            if (e && e.preventDefault) { e.preventDefault(); e.stopPropagation(); }
            const sizeP = parseFloat(currentDrawerState.sizePrice || currentDrawerState.basePrice || 499);
            const frameE = parseFloat(currentDrawerState.frameExtra || 0);
            const paperE = parseFloat(currentDrawerState.paperExtra || 0);
            let total = sizeP + frameE + paperE;
            if (isNaN(total) || total <= 0) total = 499;

            const formatText = currentDrawerState.selectedFormat ? ` [${currentDrawerState.selectedFormat}]` : '';
            const item = {
                id: `cart_${Date.now()}`,
                title: `${currentDrawerState.productTitle || 'Custom Frame'}${formatText} (${currentDrawerState.selectedSize || '12x18"'})`,
                price: total,
                image: currentDrawerState.customPhotoUrl || 'hero-poster.png',
                photoUrl: currentDrawerState.customPhotoUrl,
                specs: `Format: ${currentDrawerState.selectedFormat || 'Standard'} | Paper: ${currentDrawerState.selectedPaper || 'Matte'}`,
                qty: 1,
                quantity: 1
            };

            // 1. Close Product Details Drawer
            ProductDrawer.close();

            // 2. Add item to cart & open Cart Drawer IMMEDIATELY
            if (typeof window.addToCart === 'function') {
                window.addToCart(item);
            } else {
                if (!Array.isArray(window.cart)) window.cart = [];
                window.cart.push(item);
                if (window.saveCartState) window.saveCartState();
                else if (window.updateCartBadgeCount) window.updateCartBadgeCount();
                if (window.openCartDrawer) window.openCartDrawer();
            }

            if (window.logDebugMessage) window.logDebugMessage(`🛒 Product Drawer "Add to Cart" -> Opening Shopping Cart Drawer!`, 'info');
        },

        buyNow: function (e) {
            if (e && e.preventDefault) { e.preventDefault(); e.stopPropagation(); }
            const sizeP = parseFloat(currentDrawerState.sizePrice || currentDrawerState.basePrice || 499);
            const frameE = parseFloat(currentDrawerState.frameExtra || 0);
            const paperE = parseFloat(currentDrawerState.paperExtra || 0);
            let total = sizeP + frameE + paperE;
            if (isNaN(total) || total <= 0) total = 499;

            const formatText = currentDrawerState.selectedFormat ? ` [${currentDrawerState.selectedFormat}]` : '';
            const item = {
                id: `cart_${Date.now()}`,
                title: `${currentDrawerState.productTitle || 'Custom Frame'}${formatText} (${currentDrawerState.selectedSize || '12x18"'})`,
                price: total,
                image: currentDrawerState.customPhotoUrl || 'hero-poster.png',
                photoUrl: currentDrawerState.customPhotoUrl,
                specs: `Format: ${currentDrawerState.selectedFormat || 'Standard'} | Paper: ${currentDrawerState.selectedPaper || 'Matte'}`,
                qty: 1,
                quantity: 1
            };

            if (!Array.isArray(window.cart)) window.cart = [];
            window.cart.push(item);
            if (window.saveCartState) window.saveCartState();
            else if (window.updateCartBadgeCount) window.updateCartBadgeCount();

            // 1. Close Product Details Drawer
            ProductDrawer.close();

            // 2. Open Fast Express Checkout Drawer IMMEDIATELY
            if (typeof window.openCheckoutPage === 'function') {
                window.openCheckoutPage();
            } else if (typeof window.openPaymentModal === 'function') {
                window.openPaymentModal();
            }

            if (window.logDebugMessage) window.logDebugMessage(`⚡ Product Drawer "Buy Now" -> Opening Fast Express Checkout Drawer!`, 'warn');
        }
    };

    window.ProductDrawer = ProductDrawer;

    // Expose Global Helper Functions for HTML inline onclick
    window.openProductDetailsDrawer = ProductDrawer.open;
    window.closeProductDetailsDrawer = ProductDrawer.close;
    window.selectDrawerFormat = ProductDrawer.selectFormat;
    window.openCanvasSizeChartModal = ProductDrawer.openSizeChartModal;
    window.selectDrawerSize = ProductDrawer.selectSize;
    window.selectDrawerFrame = ProductDrawer.selectFrame;
    window.selectDrawerPaper = ProductDrawer.selectPaper;
    window.updateCustomSizeDim = ProductDrawer.updateCustomSizeDim;
    window.handleDrawerPhotoUpload = ProductDrawer.handlePhotoUpload;
    window.toggleDrawerOrientation = ProductDrawer.toggleOrientation;
    window.addDrawerItemToCart = ProductDrawer.addToCart;
    window.buyDrawerItemNow = ProductDrawer.buyNow;

})(window);
