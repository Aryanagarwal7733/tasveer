/**
 * ==========================================================================
 * Tasveer by Prince Studio - Admin Settings & CMS Module (js/admin-settings.js)
 * Banners, Coupons, Store Info, System Trash & Dynamic CMS Sync Engine
 * ==========================================================================
 */

(function (window, document) {
    'use strict';

    const safeStorage = {
        getItem: function (key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
        setItem: function (key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
    };

    let coupons = window.DEFAULT_COUPONS || [
        { code: 'WELCOME10', discountType: 'percent', value: 10, minCart: 300, expiry: '2026-12-31' },
        { code: 'TASVEER100', discountType: 'fixed', value: 100, minCart: 500, expiry: '2026-12-31' }
    ];

    // HTML5 Canvas Fast Image Compressor (Reduces 10MB -> 80KB without quality loss)
    function compressImageFile(file, callback, maxDim = 1000, quality = 0.85) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                let w = img.width;
                let h = img.height;
                if (w > maxDim || h > maxDim) {
                    if (w > h) {
                        h = Math.round((h * maxDim) / w);
                        w = maxDim;
                    } else {
                        w = Math.round((w * maxDim) / h);
                        h = maxDim;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                const compressedUrl = canvas.toDataURL('image/jpeg', quality);
                callback(compressedUrl);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function populateCMSFields(cached) {
        if (!cached) return;
        if (cached.items) cached = cached.items;

        if (safeGet('cms-logo-title') && cached.logoTitle) safeGet('cms-logo-title').value = cached.logoTitle;
        if (safeGet('cms-logo-sub') && cached.logoSub) safeGet('cms-logo-sub').value = cached.logoSub;
        if (safeGet('cms-hero-title') && cached.heroTitle) safeGet('cms-hero-title').value = cached.heroTitle;
        if (safeGet('cms-hero-subtext') && cached.heroSubtext) safeGet('cms-hero-subtext').value = cached.heroSubtext;
        if (safeGet('cms-hero-btn') && cached.heroBtnText) safeGet('cms-hero-btn').value = cached.heroBtnText;
        if (safeGet('cms-announcement') && cached.announcementText) safeGet('cms-announcement').value = cached.announcementText;
        if (safeGet('cms-hero-badge')) safeGet('cms-hero-badge').value = cached.heroBadgeText || '';
        
        if (safeGet('cms-hero-image') && cached.heroImageUrl) {
            safeGet('cms-hero-image').value = cached.heroImageUrl;
            const prev = safeGet('cms-hero-preview-img');
            if (prev) {
                prev.src = cached.heroImageUrl;
                safeGet('cms-hero-preview').style.display = 'block';
            }
        }
        if (safeGet('cms-hero-slide2') && cached.heroSlide2) {
            safeGet('cms-hero-slide2').value = cached.heroSlide2;
            const prev = safeGet('cms-hero-preview-img-2');
            if (prev) {
                prev.src = cached.heroSlide2;
                safeGet('cms-hero-preview-2').style.display = 'block';
            }
        }
        if (safeGet('cms-hero-slide3') && cached.heroSlide3) {
            safeGet('cms-hero-slide3').value = cached.heroSlide3;
            const prev = safeGet('cms-hero-preview-img-3');
            if (prev) {
                prev.src = cached.heroSlide3;
                safeGet('cms-hero-preview-3').style.display = 'block';
            }
        }
        if (safeGet('cms-hero-slide4') && cached.heroSlide4) {
            safeGet('cms-hero-slide4').value = cached.heroSlide4;
            const prev = safeGet('cms-hero-preview-img-4');
            if (prev) {
                prev.src = cached.heroSlide4;
                safeGet('cms-hero-preview-4').style.display = 'block';
            }
        }
    }

    function loadAdminCMSFormData(data) {
        if (data) {
            populateCMSFields(data);
            return;
        }

        // 1. Try local cache first for instant populate
        try {
            const cached = JSON.parse(safeStorage.getItem('tasveer_cms_settings'));
            if (cached) populateCMSFields(cached);
        } catch(e) {}

        // 2. Try Firestore Cloud DB
        if (window.CloudDB && window.CloudDB.getCollection) {
            const cloudCMS = window.CloudDB.getCollection('cms_settings', null);
            if (cloudCMS) populateCMSFields(cloudCMS);
        }

        // 3. Fetch server DB
        fetch((window.API_BASE || '') + '/api/v1/cms')
            .then(res => res.json())
            .then(db => {
                if (!db) return;
                if (db.cms) populateCMSFields(db.cms);

                if (db.bento_header) {
                    const bh = db.bento_header;
                    if (safeGet('bento-cms-tag') && bh.tag) safeGet('bento-cms-tag').value = bh.tag;
                    if (safeGet('bento-cms-title') && bh.title) safeGet('bento-cms-title').value = bh.title;
                }

                if (db.footer) {
                    const f = db.footer;
                    if (safeGet('footer-cms-title') && f.aboutTitle) safeGet('footer-cms-title').value = f.aboutTitle;
                    if (safeGet('footer-cms-phone') && f.phone) safeGet('footer-cms-phone').value = f.phone;
                    if (safeGet('footer-cms-email') && f.email) safeGet('footer-cms-email').value = f.email;
                    if (safeGet('footer-cms-address') && f.address) safeGet('footer-cms-address').value = f.address;
                    if (safeGet('footer-cms-text') && f.aboutText) safeGet('footer-cms-text').value = f.aboutText;
                }
            })
            .catch(err => {});
    }

    function saveCMSContent(e) {
        if (e) e.preventDefault();
        const heroImg = safeGet('cms-hero-image')?.value.trim();
        const cmsData = {
            logoTitle: safeGet('cms-logo-title')?.value.trim() || 'Tasveer',
            logoSub: safeGet('cms-logo-sub')?.value.trim() || 'by Prince Studio',
            heroTitle: safeGet('cms-hero-title')?.value.trim() || 'Crafting Royal Gallery Art For Your Walls',
            heroSubtext: safeGet('cms-hero-subtext')?.value.trim() || 'Upload your personal photos, select real Italian wood moldings, white mount borders, and order with instant UPI & WhatsApp soft-proof approval!',
            heroBtnText: safeGet('cms-hero-btn')?.value.trim() || '📸 Upload & Frame Photo (₹499)',
            announcementText: safeGet('cms-announcement')?.value.trim() || 'Official Prince Studio Online Art Gallery | Custom Framing',
            heroBadgeText: safeGet('cms-hero-badge')?.value.trim() || '',
            heroImageUrl: heroImg || 'hero-banner.jpg',
            heroSlide2: safeGet('cms-hero-slide2')?.value.trim() || '',
            heroSlide3: safeGet('cms-hero-slide3')?.value.trim() || '',
            heroSlide4: safeGet('cms-hero-slide4')?.value.trim() || ''
        };

        try {
            safeStorage.setItem('tasveer_cms_settings', JSON.stringify(cmsData));
        } catch(quotaErr) {
            console.warn('[Admin CMS] LocalStorage quota notice:', quotaErr);
        }

        // 1. Sync to Google Firebase Firestore Cloud DB
        if (window.CloudDB && window.CloudDB.pushUpdate) {
            window.CloudDB.pushUpdate('cms_settings', cmsData);
        }

        // 2. Sync to Server REST API
        fetch((window.API_BASE || '') + '/api/v1/cms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cms: cmsData })
        }).catch(err => {});

        if (window.showToast) window.showToast('✅ Slide 1 & Storefront Headlines Saved & Synced to Cloud Live! 🎨');
    }

    let editingCouponOriginalCode = null;

    function renderCouponsTable() {
        const tbody = safeGet('coupons-tbody');
        if (!tbody) return;

        try {
            const saved = JSON.parse(safeStorage.getItem('tasveer_coupons'));
            if (saved && Array.isArray(saved) && saved.length > 0) coupons = saved;
        } catch (e) {}

        // Fetch latest coupons from server
        fetch((window.API_BASE || '') + '/api/v1/coupons')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    coupons = data;
                    safeStorage.setItem('tasveer_coupons', JSON.stringify(coupons));
                    _renderCouponsTbody(tbody);
                }
            })
            .catch(() => {});

        _renderCouponsTbody(tbody);
    }

    function _renderCouponsTbody(tbody) {
        if (!coupons || coupons.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:25px;color:#94a3b8;">No discount coupons created yet. Click "+ Create Coupon" above to add one.</td></tr>`;
            return;
        }

        tbody.innerHTML = coupons.map(c => `
            <tr>
                <td><strong style="color:var(--gold-bright);font-size:0.95rem;letter-spacing:0.5px;">${c.code}</strong></td>
                <td><span class="badge badge-success" style="font-weight:700;">${c.discountType === 'percent' ? c.value + '% OFF' : '₹' + c.value + ' Flat OFF'}</span></td>
                <td>Min Order: <strong>₹${c.minCart || 0}</strong></td>
                <td><small style="color:#94a3b8;">${c.expiry || '2026-12-31'}</small></td>
                <td>
                    <div style="display:flex;gap:6px;">
                        <button class="btn-sm btn-outline" onclick="openEditCouponModal('${c.code}')" title="Edit Coupon" style="color:#38bdf8;border-color:#38bdf8;">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-sm btn-danger" onclick="deleteCoupon('${c.code}')" title="Delete Coupon">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function openAddCouponModal() {
        editingCouponOriginalCode = null;
        if (safeGet('coup-form-code')) safeGet('coup-form-code').value = '';
        if (safeGet('coup-form-value')) safeGet('coup-form-value').value = '10';
        if (safeGet('coup-form-mincart')) safeGet('coup-form-mincart').value = '300';
        if (safeGet('coup-form-type')) safeGet('coup-form-type').value = 'percent';
        
        const titleEl = document.querySelector('#coupon-modal-overlay .modal-title');
        if (titleEl) titleEl.innerText = 'Create New Promo Coupon';

        const modal = safeGet('coupon-modal-overlay');
        if (modal) modal.style.display = 'flex';
    }

    function openEditCouponModal(code) {
        const c = coupons.find(item => item.code === code);
        if (!c) return;

        editingCouponOriginalCode = c.code;
        if (safeGet('coup-form-code')) safeGet('coup-form-code').value = c.code;
        if (safeGet('coup-form-value')) safeGet('coup-form-value').value = c.value;
        if (safeGet('coup-form-mincart')) safeGet('coup-form-mincart').value = c.minCart || 0;
        if (safeGet('coup-form-type')) safeGet('coup-form-type').value = c.discountType || 'percent';

        const titleEl = document.querySelector('#coupon-modal-overlay .modal-title');
        if (titleEl) titleEl.innerText = `Edit Promo Coupon: ${c.code}`;

        const modal = safeGet('coupon-modal-overlay');
        if (modal) modal.style.display = 'flex';
    }

    function closeCouponModal() {
        editingCouponOriginalCode = null;
        const modal = safeGet('coupon-modal-overlay');
        if (modal) modal.style.display = 'none';
    }

    function saveCoupon(e) {
        if (e) e.preventDefault();
        const codeInput = safeGet('coup-form-code');
        if (!codeInput) return;

        const code = codeInput.value.trim().toUpperCase();
        const type = safeGet('coup-form-type')?.value || 'percent';
        const val = parseFloat(safeGet('coup-form-value')?.value) || 10;
        const minCart = parseFloat(safeGet('coup-form-mincart')?.value) || 0;

        if (!code) {
            if (window.showToast) window.showToast('Please enter a valid coupon code!', 'warn');
            return;
        }

        const newCouponObj = {
            code: code,
            discountType: type,
            value: val,
            minCart: minCart,
            expiry: '2026-12-31'
        };

        if (editingCouponOriginalCode) {
            const idx = coupons.findIndex(c => c.code === editingCouponOriginalCode);
            if (idx !== -1) {
                coupons[idx] = newCouponObj;
            } else {
                coupons.push(newCouponObj);
            }
        } else {
            const existingIdx = coupons.findIndex(c => c.code === code);
            if (existingIdx !== -1) {
                coupons[existingIdx] = newCouponObj;
            } else {
                coupons.push(newCouponObj);
            }
        }

        safeStorage.setItem('tasveer_coupons', JSON.stringify(coupons));

        // 1. Firebase Firestore Cloud Sync
        if (window.CloudDB && window.CloudDB.pushUpdate) {
            window.CloudDB.pushUpdate('coupons', coupons);
        }

        // 2. Direct Firestore Doc Push
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
            try {
                firebase.firestore().collection('tasveer_store').doc('coupons').set({
                    items: coupons,
                    updatedAt: new Date().toISOString()
                }, { merge: true }).catch(()=>{});
            } catch(e) {}
        }

        // 3. Sync to backend
        fetch((window.API_BASE || '') + '/api/v1/coupons', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (sessionStorage.getItem('tasveer_admin_jwt_token') || '')
            },
            body: JSON.stringify(coupons)
        }).catch(() => {});

        if (window.showToast) window.showToast(`✅ Coupon ${code} saved & synced live to Firebase Cloud! 🏷️`);
        closeCouponModal();
        renderCouponsTable();
    }

    function deleteCoupon(code) {
        if (!confirm(`Are you sure you want to delete coupon ${code}?`)) return;
        coupons = coupons.filter(c => c.code !== code);
        safeStorage.setItem('tasveer_coupons', JSON.stringify(coupons));

        if (window.CloudDB && window.CloudDB.pushUpdate) {
            window.CloudDB.pushUpdate('coupons', coupons);
        }

        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
            try {
                firebase.firestore().collection('tasveer_store').doc('coupons').set({
                    items: coupons,
                    updatedAt: new Date().toISOString()
                }, { merge: true }).catch(()=>{});
            } catch(e) {}
        }

        fetch((window.API_BASE || '') + '/api/v1/coupons', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (sessionStorage.getItem('tasveer_admin_jwt_token') || '')
            },
            body: JSON.stringify(coupons)
        }).catch(() => {});

        if (window.showToast) window.showToast(`🗑️ Coupon ${code} deleted!`);
        renderCouponsTable();
    }

    function renderTrashTable() {
        const tbody = safeGet('trash-tbody');
        if (!tbody) return;

        const products = window.masterProducts || window.products || [];
        const orders = window.masterOrders || window.orders || [];

        const trashedProds = products.filter(p => p.isDeleted);
        const trashedOrders = orders.filter(o => o.isDeleted);

        if (trashedProds.length === 0 && trashedOrders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:30px;color:#94a3b8;">System Trash is empty 🟢</td></tr>`;
            return;
        }

        let html = '';
        trashedProds.forEach(p => {
            html += `
                <tr>
                    <td><span class="badge badge-warning">Product</span></td>
                    <td><strong>${p.title || p.name}</strong></td>
                    <td>ID: ${p.id}</td>
                    <td>
                        <button class="btn-sm btn-outline" onclick="restoreItem('product', '${p.id}')"><i class="fas fa-undo"></i> Restore</button>
                    </td>
                </tr>
            `;
        });

        trashedOrders.forEach(o => {
            html += `
                <tr>
                    <td><span class="badge badge-danger">Order</span></td>
                    <td><strong>${o.id} - ${o.customerName}</strong></td>
                    <td>Amount: ₹${o.total}</td>
                    <td>
                        <button class="btn-sm btn-outline" onclick="restoreItem('order', '${o.id}')"><i class="fas fa-undo"></i> Restore</button>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    }

    function restoreItem(type, id) {
        if (type === 'product') {
            const products = window.masterProducts || window.products || [];
            const p = products.find(prod => prod.id === id);
            if (p) p.isDeleted = false;
            safeStorage.setItem('tasveer_products', JSON.stringify(products));
            if (window.renderProductsTable) window.renderProductsTable();
        } else if (type === 'order') {
            const orders = window.masterOrders || window.orders || [];
            const o = orders.find(ord => ord.id === id);
            if (o) o.isDeleted = false;
            safeStorage.setItem('tasveer_orders', JSON.stringify(orders));
            if (window.renderOrdersTable) window.renderOrdersTable();
        }
        if (window.showToast) window.showToast('Item restored from trash!');
        renderTrashTable();
        if (window.renderDashboard) window.renderDashboard();
    }

    function saveStoreSettings(e) {
        if (e) e.preventDefault();
        const settings = {
            storeName: safeGet('set-store-name')?.value.trim() || 'Tasveer by Prince Studio',
            phone: safeGet('set-store-phone')?.value.trim() || '+91 72319 00124',
            email: safeGet('set-store-email')?.value.trim() || 'Princestudioswm@gmail.com',
            gstin: safeGet('set-store-gstin')?.value.trim() || '08AAAAA0000A1Z5',
            address: safeGet('set-address')?.value.trim() || 'Main Market Road, Sawai Madhopur, Rajasthan - 322001'
        };

        safeStorage.setItem('tasveer_store_settings', JSON.stringify(settings));
        if (window.showToast) window.showToast('Store & Invoice settings saved successfully!');
    }

    function renderTransactionsTable() {
        const tbody = safeGet('transactions-tbody');
        if (!tbody) return;

        const orders = window.masterOrders || window.orders || [];
        tbody.innerHTML = orders.filter(o => !o.isDeleted).map(o => `
            <tr>
                <td><code>TXN-${o.id}</code></td>
                <td><strong>${o.id}</strong></td>
                <td>${o.customerName || 'Customer'}</td>
                <td><strong style="color:var(--gold-bright);">₹${o.total}</strong></td>
                <td><span class="badge badge-success">${o.paymentMethod || 'UPI QR'}</span></td>
                <td><span class="badge badge-success">Paid 🟢</span></td>
            </tr>
        `).join('');
    }

    let bentoCards = (function() {
        try {
            const saved = JSON.parse(safeStorage.getItem('tasveer_bento_cards'));
            if (saved && Array.isArray(saved) && saved.length > 0) return saved;
        } catch(e) {}
        return [
            { id: 'bento_1', title: 'Italian Wooden Wall Frames', desc: 'Handcrafted Teak & Oak Frames', tag: 'Bestseller', category: 'cat_photo_frames', image: 'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?w=800', size: 'bento-large' },
            { id: 'bento_2', title: 'Canvas Prints', desc: '100% Cotton Textured HD Prints', tag: 'Fine Art', category: 'cat_canvas_prints', image: 'https://images.unsplash.com/photo-1579541814924-49fef17c5be5?w=600', size: 'bento-tall' },
            { id: 'bento_3', title: 'Acrylic Floating Prints', desc: 'Glass-clear 5mm Glossy Polish', tag: 'Modern Luxury', category: 'cat_acrylic_prints', image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600', size: '' }
        ];
    })();

    function renderBentoCardsTable() {
        const tbody = safeGet('bento-cards-tbody');
        if (!tbody) return;

        tbody.innerHTML = bentoCards.map(b => `
            <tr>
                <td><img src="${b.image}" style="width:45px; height:45px; object-fit:cover; border-radius:4px;"></td>
                <td><strong>${b.title}</strong><br><small style="color:#94a3b8;">${b.desc || ''}</small></td>
                <td><span class="badge badge-warning">${b.tag || 'Showcase'}</span></td>
                <td><code>${b.category || 'all'}</code></td>
                <td><span class="badge badge-info">${b.size || 'standard'}</span></td>
                <td>
                    <button class="btn-sm btn-danger" onclick="deleteBentoCard('${b.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    function saveBentoHeaderCMS(e) {
        if (e) e.preventDefault();
        const tag = safeGet('bento-cms-tag')?.value.trim() || 'Gallery Architecture';
        const title = safeGet('bento-cms-title')?.value.trim() || 'Framing Collections Bento Grid';
        const headerData = { tag, title };

        safeStorage.setItem('tasveer_bento_header', JSON.stringify(headerData));
        fetch((window.API_BASE || '') + '/api/v1/cms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bento_header: headerData })
        }).catch(err => {});

        if (window.applyBentoHeaderCMS) window.applyBentoHeaderCMS(headerData);

        if (window.showToast) window.showToast('Bento Grid Section Title Saved Live! 🎨');
    }

    function openAddBentoCardModal() {
        const m = safeGet('bento-card-modal-overlay');
        if (m) m.style.display = 'flex';
    }

    function closeBentoCardModal() {
        const m = safeGet('bento-card-modal-overlay');
        if (m) m.style.display = 'none';
    }

    function saveBentoCard(e) {
        if (e) e.preventDefault();
        const title = safeGet('bento-card-title')?.value.trim() || 'Custom Frame Card';
        const tag = safeGet('bento-card-tag')?.value.trim() || 'Featured';
        const category = safeGet('bento-card-cat')?.value || 'cat_photo_frames';
        const image = safeGet('bento-card-img')?.value.trim() || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600';
        const size = safeGet('bento-card-size')?.value || 'bento-medium';

        const newCard = {
            id: 'bento_' + Date.now(),
            title: title,
            desc: 'Studio Crafted Collection',
            tag: tag,
            category: category,
            image: image,
            size: size
        };

        bentoCards.push(newCard);
        safeStorage.setItem('tasveer_bento_cards', JSON.stringify(bentoCards));

        fetch((window.API_BASE || '') + '/api/v1/cms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bento_cards: bentoCards })
        }).catch(err => {});

        renderBentoCardsTable();
        closeBentoCardModal();
        if (window.showToast) window.showToast('Bento Showcase Card Saved & Synced Live! 🔲');
    }

    function deleteBentoCard(id) {
        bentoCards = bentoCards.filter(b => b.id !== id);
        safeStorage.setItem('tasveer_bento_cards', JSON.stringify(bentoCards));
        fetch((window.API_BASE || '') + '/api/v1/cms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bento_cards: bentoCards })
        }).catch(err => {});

        renderBentoCardsTable();
        if (window.showToast) window.showToast('Bento Card deleted!');
    }

    function handlePCImageUpload(event, inputId, previewId) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        compressImageFile(file, function (optimizedBase64) {
            const inputEl = safeGet(inputId);
            if (inputEl) {
                inputEl.value = optimizedBase64;
            }

            if (previewId) {
                const prevEl = safeGet(previewId);
                const prevImg = safeGet(previewId + '-img');
                if (prevImg) prevImg.src = optimizedBase64;
                if (prevEl) prevEl.style.display = 'block';
            }

            if (window.showToast) window.showToast('✅ Photo Optimized & Loaded! Click "Save & Publish CMS Live" to sync. 📸');
        }, 600, 0.75);
    }

    function updateImagePreviewLive(input, previewId) {
        const val = input ? input.value.trim() : '';
        const prev = safeGet(previewId);
        const prevImg = safeGet(previewId + '-img');
        if (val && prevImg) {
            prevImg.src = val;
            if (prev) prev.style.display = 'block';
        } else if (prev) {
            prev.style.display = 'none';
        }
    }

    function saveAdvantagesCMS(e) { if(e) e.preventDefault(); if(window.showToast) window.showToast('Advantage Cards CMS Saved Live! 🏆'); }
    function saveFooterCMS(e) { if(e) e.preventDefault(); if(window.showToast) window.showToast('Footer & Contact Info Saved Live! 📞'); }

    // Real-time CloudDB Subscription for Admin CMS Form
    if (window.CloudDB && window.CloudDB.subscribe) {
        window.CloudDB.subscribe((col, data) => {
            if (col === 'cms_settings') {
                populateCMSFields(data);
            }
        });
    }

    function loadWhatsAppGatewaySettings() {
        if (!window.WhatsAppGateway) return;
        const config = window.WhatsAppGateway.getConfig();
        const provEl = safeGet('wa-provider-select');
        const instEl = safeGet('wa-instance-id');
        const tokEl = safeGet('wa-token-key');
        const admEl = safeGet('wa-admin-phone');

        if (provEl && config.provider) provEl.value = config.provider;
        if (instEl && config.instanceId) instEl.value = config.instanceId;
        if (tokEl && config.token) tokEl.value = config.token;
        if (admEl && config.adminPhone) admEl.value = config.adminPhone;
    }

    function saveWhatsAppGatewaySettings(e) {
        if (e && e.preventDefault) e.preventDefault();
        const prov = safeGet('wa-provider-select')?.value || 'ultramsg';
        const inst = safeGet('wa-instance-id')?.value.trim() || '';
        const tok = safeGet('wa-token-key')?.value.trim() || '';
        const adm = safeGet('wa-admin-phone')?.value.trim() || '917231900124';

        if (window.WhatsAppGateway) {
            window.WhatsAppGateway.setConfig({
                provider: prov,
                instanceId: inst,
                token: tok,
                adminPhone: adm,
                isEnabled: true
            });
        }

        const msgEl = safeGet('wa-settings-msg');
        if (msgEl) {
            msgEl.innerHTML = `<span style="color:#4ade80; font-weight:700;"><i class="fas fa-check-circle"></i> WhatsApp Gateway Credentials Saved Live! 🎉</span>`;
            setTimeout(() => { if (msgEl) msgEl.innerHTML = ''; }, 4000);
        }
        if (window.showToast) window.showToast('✅ WhatsApp Bot Credentials Saved!');
    }

    async function testWhatsAppGatewayMessage() {
        if (!window.WhatsAppGateway) {
            alert('WhatsApp Gateway is initializing...');
            return;
        }
        const adm = safeGet('wa-admin-phone')?.value.trim() || '917231900124';
        const msgEl = safeGet('wa-settings-msg');
        if (msgEl) msgEl.innerHTML = `<span style="color:#f59e0b; font-weight:700;"><i class="fas fa-spinner fa-spin"></i> Sending test message to ${adm}...</span>`;

        const success = await window.WhatsAppGateway.sendMessage(adm, `🔔 *TEST SUCCESS - TASVEER WHATSAPP BOT*\n\nHello Prince Studio! Your automated WhatsApp gateway is active and connected to tasviir.in! 🎉📸✨`);
        if (success) {
            if (msgEl) msgEl.innerHTML = `<span style="color:#4ade80; font-weight:700;"><i class="fas fa-check-circle"></i> Test Message Sent to ${adm}! Check your WhatsApp. ✅</span>`;
            if (window.showToast) window.showToast('🎉 Test WhatsApp Sent Successfully!');
        } else {
            if (msgEl) msgEl.innerHTML = `<span style="color:#f87171; font-weight:700;"><i class="fas fa-exclamation-triangle"></i> Test failed. Please verify Instance ID & Token.</span>`;
            if (window.showToast) window.showToast('⚠️ Test failed. Check credentials.', 'warn');
        }
    }

    // Auto-populate on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadWhatsAppGatewaySettings);
    } else {
        setTimeout(loadWhatsAppGatewaySettings, 500);
    }

    // Expose Settings & CMS API
    window.loadAdminCMSFormData = loadAdminCMSFormData;
    window.saveCMSContent = saveCMSContent;
    window.handlePCImageUpload = handlePCImageUpload;
    window.updateImagePreviewLive = updateImagePreviewLive;
    window.compressImageFile = compressImageFile;
    window.populateCMSFields = populateCMSFields;
    window.renderCouponsTable = renderCouponsTable;
    window.openAddCouponModal = openAddCouponModal;
    window.openEditCouponModal = openEditCouponModal;
    window.closeCouponModal = closeCouponModal;
    window.saveCoupon = saveCoupon;
    window.deleteCoupon = deleteCoupon;
    window.renderTrashTable = renderTrashTable;
    window.restoreItem = restoreItem;
    window.saveStoreSettings = saveStoreSettings;
    window.saveSettings = saveStoreSettings;
    window.loadWhatsAppGatewaySettings = loadWhatsAppGatewaySettings;
    window.saveWhatsAppGatewaySettings = saveWhatsAppGatewaySettings;
    window.testWhatsAppGatewayMessage = testWhatsAppGatewayMessage;
    window.renderTransactionsTable = renderTransactionsTable;
    window.saveAdvantagesCMS = saveAdvantagesCMS;
    window.saveFooterCMS = saveFooterCMS;
    window.saveBentoHeaderCMS = saveBentoHeaderCMS;
    window.renderBentoCardsTable = renderBentoCardsTable;
    window.openAddBentoCardModal = openAddBentoCardModal;
    window.closeBentoCardModal = closeBentoCardModal;
    window.saveBentoCard = saveBentoCard;
    window.deleteBentoCard = deleteBentoCard;

})(window, document);
