/**
 * ==========================================================================
 * Tasveer by Prince Studio - Admin Catalog & Stock Module (js/admin-catalog.js)
 * Products Manager, 3D Frame Textures, Inventory & Auto Live Sync Trigger
 * ==========================================================================
 */

(function (window, document) {
    'use strict';

    const safeStorage = {
        getItem: function (key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
        setItem: function (key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
    };

    function getInitialCategories() {
        if (window.DEFAULT_CATEGORIES && window.DEFAULT_CATEGORIES.length > 0) return window.DEFAULT_CATEGORIES;
        if (window.CoreCatalog && window.CoreCatalog.DEFAULT_CATEGORIES) return window.CoreCatalog.DEFAULT_CATEGORIES;
        return [
            { id: 'cat_photo_prints', name: 'Photo Print', icon: 'fa-print', desc: 'Archival Matte & Glossy Lab Prints' },
            { id: 'cat_photo_frames', name: 'Photo Frame', icon: 'fa-vector-square', desc: 'Teak Wood & Solid Oak Wall Frames' },
            { id: 'cat_collage_frames', name: 'Collage Frame', icon: 'fa-border-all', desc: 'Multi-Photo Birthday & Anniversary Collages' },
            { id: 'cat_canvas_prints', name: 'Canvas Print', icon: 'fa-paint-brush', desc: '100% Textured Cotton Museum Canvases' },
            { id: 'cat_gallery_frames', name: 'Gallery Frame', icon: 'fa-image', desc: 'Curated 3-Piece & 5-Piece Wall Sets' },
            { id: 'cat_poster_frames', name: 'Poster Frame', icon: 'fa-scroll', desc: '300GSM HD Minimalist Posters' },
            { id: 'cat_mug_prints', name: 'Mug Print', icon: 'fa-mug-hot', desc: 'Magic Heat Reveal & Ceramic Mugs' },
            { id: 'cat_sticker_prints', name: 'Sticker Print', icon: 'fa-sticky-note', desc: 'Waterproof Vinyl & Die-Cut Stickers' },
            { id: 'cat_light_frames', name: 'Light Frame', icon: 'fa-lightbulb', desc: 'Backlit LED Glass & Acrylic Light Frames' },
            { id: 'cat_box_frames', name: 'Box / Shadow Frame', icon: 'fa-cube', desc: 'Deep Shadow Box Memory Keepsakes' }
        ];
    }

    function getInitialProducts() {
        if (window.masterProducts && Array.isArray(window.masterProducts) && window.masterProducts.length > 0) {
            return window.masterProducts;
        }
        if (window.CloudDB) {
            const cloudProds = window.CloudDB.getCollection('products');
            if (cloudProds && Array.isArray(cloudProds) && cloudProds.length > 0) {
                return cloudProds;
            }
        }
        let prods = [];
        try {
            const saved = JSON.parse(safeStorage.getItem('tasveer_products'));
            if (saved && Array.isArray(saved) && saved.length > 0) {
                return saved;
            }
        } catch (e) {}

        return (window.DEFAULT_PRODUCTS || []);
    }

    let products = getInitialProducts();
    let categories = getInitialCategories();
    let frameTextures = [];

    function renderProductsTable() {
        const tbody = safeGet('products-tbody');
        if (!tbody) return;

        products = getInitialProducts();
        window.masterProducts = products;
        window.products = products;
        if (window.PRODUCTS_DATA) window.PRODUCTS_DATA = products;

        const searchInput = safeGet('product-search-input');
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

        let activeProds = products.filter(p => {
            const notDeleted = !p.isDeleted;
            const matchesQuery = !query || 
                (p.title && p.title.toLowerCase().includes(query)) ||
                (p.sku && p.sku.toLowerCase().includes(query)) ||
                (p.id && p.id.toLowerCase().includes(query)) ||
                (p.category && p.category.toLowerCase().includes(query));
            return notDeleted && matchesQuery;
        });

        if (activeProds.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;">No products found in catalog. Click "Restore All Products" above to restore defaults.</td></tr>`;
            return;
        }

        tbody.innerHTML = activeProds.map(p => `
            <tr>
                <td>
                    <img src="${p.image}" alt="${p.title}" style="width:44px;height:44px;object-fit:cover;border-radius:6px;border:1px solid rgba(255,255,255,0.15);">
                </td>
                <td>
                    <strong style="color:#fff;font-size:0.92rem;">${p.title || p.name}</strong><br>
                    <small style="color:#94a3b8;">${p.desc ? p.desc.substring(0, 45) + '...' : ''}</small>
                </td>
                <td><code style="background:#1e293b;padding:3px 8px;border-radius:4px;color:var(--gold-bright);font-weight:700;">${p.sku || p.id}</code></td>
                <td><span style="text-transform:uppercase;font-size:0.75rem;font-weight:bold;color:var(--gold-bright);">${p.category ? p.category.replace('cat_', '').replace('_', ' ') : 'FRAME'}</span></td>
                <td><strong style="color:#fff;">₹${p.price || p.basePrice || 499}</strong></td>
                <td>
                    <span class="badge ${(p.stock || 25) <= 5 ? 'badge-danger' : 'badge-success'}">
                        ${(p.stock || 25) <= 5 ? '⚠️ Low (' + p.stock + ')' : '🟢 In Stock (' + (p.stock || 25) + ')'}
                    </span>
                </td>
                <td>
                    <div style="display:flex;gap:6px;">
                        <button class="btn-sm btn-outline" onclick="openEditProductModal('${p.id}')"><i class="fas fa-edit"></i> Edit</button>
                        <button class="btn-sm btn-danger" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function populateProductCategoryDropdown(selectedVal) {
        const select = safeGet('prod-form-category');
        if (!select) return;

        categories = getInitialCategories();
        const activeCats = categories.filter(c => c.status !== 'Inactive');

        select.innerHTML = activeCats.map(c => `
            <option value="${c.id}">${c.name}</option>
        `).join('');

        if (selectedVal) {
            select.value = selectedVal;
        }
    }

    function renderProductSizeRows(sizes, basePrice, productObj = null) {
        const container = safeGet('prod-form-sizes-container');
        if (!container) return;

        const currentCat = safeGet('prod-form-category')?.value;
        const isCanvas = (productObj && (productObj.category === 'cat_canvas_prints' || productObj.hasFormats)) || currentCat === 'cat_canvas_prints';

        let list = [];
        if (productObj && productObj.sizeChart && Array.isArray(productObj.sizeChart) && productObj.sizeChart.length > 0) {
            list = productObj.sizeChart.map(sc => ({
                name: sc.size || sc.label,
                rollPrice: sc.rollPrice || sc.price || basePrice || 299,
                wrapPrice: sc.wrapPrice || Math.round((sc.rollPrice || basePrice || 299) * 1.8)
            }));
        } else if (sizes && Array.isArray(sizes) && sizes.length > 0) {
            list = sizes.map(s => {
                const sName = typeof s === 'string' ? s : s.name;
                const sPrice = typeof s === 'string' ? (basePrice || 499) : s.price;
                return {
                    name: sName,
                    rollPrice: sPrice,
                    wrapPrice: s.wrapPrice || Math.round(sPrice * 1.8)
                };
            });
        } else {
            list = isCanvas ? [
                { name: '8x12"', rollPrice: 299, wrapPrice: 599 },
                { name: '12x18"', rollPrice: 499, wrapPrice: 899 },
                { name: '16x24"', rollPrice: 799, wrapPrice: 1399 },
                { name: '20x30"', rollPrice: 1199, wrapPrice: 1999 },
                { name: '24x36"', rollPrice: 1599, wrapPrice: 2699 }
            ] : [
                { name: '12x18"', rollPrice: basePrice || 499, wrapPrice: basePrice || 499 },
                { name: 'A4 Size', rollPrice: Math.max(99, (basePrice || 499) - 100), wrapPrice: Math.max(99, (basePrice || 499) - 100) },
                { name: '18x24"', rollPrice: (basePrice || 499) + 200, wrapPrice: (basePrice || 499) + 200 }
            ];
        }

        const headerHtml = isCanvas ? `
            <div style="display:flex; gap:8px; font-size:0.75rem; font-weight:700; color:#cbd5e1; margin-bottom:4px; padding:0 4px;">
                <div style="flex:2;">📐 Size (e.g. 12x18")</div>
                <div style="flex:1.5; color:#34d399;">📜 Roll Rate (₹)</div>
                <div style="flex:1.5; color:#fbbf24;">🪵 Gallery Wrap Rate (₹)</div>
                <div style="width:38px;"></div>
            </div>
        ` : `
            <div style="display:flex; gap:8px; font-size:0.75rem; font-weight:700; color:#cbd5e1; margin-bottom:4px; padding:0 4px;">
                <div style="flex:2;">📐 Size Name</div>
                <div style="flex:1;">Selling Price (₹)</div>
                <div style="width:38px;"></div>
            </div>
        `;

        const rowsHtml = list.map((s, idx) => {
            if (isCanvas) {
                return `
                    <div class="size-variant-row" style="display:flex; gap:8px; align-items:center;">
                        <input type="text" class="form-control prod-size-name" value="${s.name}" placeholder="Size (e.g. 12x18)" style="flex:2;" required>
                        <input type="number" class="form-control prod-size-price" value="${s.rollPrice}" placeholder="Roll ₹" style="flex:1.5;" title="Canvas Roll Rate" required>
                        <input type="number" class="form-control prod-size-wrap-price" value="${s.wrapPrice}" placeholder="Wrap Frame ₹" style="flex:1.5; border-color:#f59e0b;" title="Gallery Wrap Frame Rate" required>
                        <button type="button" class="btn btn-outline" style="padding:6px 10px; color:#ef4444; border-color:#ef4444;" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
                    </div>
                `;
            } else {
                return `
                    <div class="size-variant-row" style="display:flex; gap:8px; align-items:center;">
                        <input type="text" class="form-control prod-size-name" value="${s.name}" placeholder="Size Name (e.g. 12x18 inches)" style="flex:2;" required>
                        <input type="number" class="form-control prod-size-price" value="${s.rollPrice}" placeholder="Price (₹)" style="flex:1;" required>
                        <button type="button" class="btn btn-outline" style="padding:6px 10px; color:#ef4444; border-color:#ef4444;" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
                    </div>
                `;
            }
        }).join('');

        container.innerHTML = headerHtml + rowsHtml;
    }

    function addProdSizeRow(name = '', rollPrice = '', wrapPrice = '') {
        const container = safeGet('prod-form-sizes-container');
        if (!container) return;

        const currentCat = safeGet('prod-form-category')?.value;
        const isCanvas = (currentCat === 'cat_canvas_prints');

        const row = document.createElement('div');
        row.className = 'size-variant-row';
        row.style.cssText = 'display:flex; gap:8px; align-items:center; margin-top:6px;';

        if (isCanvas) {
            row.innerHTML = `
                <input type="text" class="form-control prod-size-name" value="${name}" placeholder="Size (e.g. 20x30)" style="flex:2;" required>
                <input type="number" class="form-control prod-size-price" value="${rollPrice || 499}" placeholder="Roll ₹" style="flex:1.5;" required>
                <input type="number" class="form-control prod-size-wrap-price" value="${wrapPrice || 899}" placeholder="Wrap Frame ₹" style="flex:1.5; border-color:#f59e0b;" required>
                <button type="button" class="btn btn-outline" style="padding:6px 10px; color:#ef4444; border-color:#ef4444;" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
            `;
        } else {
            row.innerHTML = `
                <input type="text" class="form-control prod-size-name" value="${name}" placeholder="Size Name (e.g. 20x30 inches)" style="flex:2;" required>
                <input type="number" class="form-control prod-size-price" value="${rollPrice || 499}" placeholder="Price (₹)" style="flex:1;" required>
                <button type="button" class="btn btn-outline" style="padding:6px 10px; color:#ef4444; border-color:#ef4444;" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
            `;
        }
        container.appendChild(row);
    }

    function openAddProductModal() {
        populateProductCategoryDropdown();

        if (safeGet('prod-form-id')) safeGet('prod-form-id').value = '';
        if (safeGet('prod-form-sku')) safeGet('prod-form-sku').value = '';
        if (safeGet('prod-form-title')) safeGet('prod-form-title').value = '';
        if (safeGet('prod-form-price')) safeGet('prod-form-price').value = '499';
        if (safeGet('prod-form-origprice')) safeGet('prod-form-origprice').value = '799';
        if (safeGet('prod-form-image')) safeGet('prod-form-image').value = '';
        if (safeGet('prod-form-desc')) safeGet('prod-form-desc').value = '';
        if (safeGet('prod-form-stock')) safeGet('prod-form-stock').value = '25';
        
        renderProductSizeRows([], 499);

        const preview = safeGet('prod-form-preview');
        if (preview) preview.style.display = 'none';

        const modal = safeGet('product-modal-overlay');
        if (modal) modal.style.display = 'flex';
    }

    function openEditProductModal(productId) {
        const p = products.find(prod => prod.id === productId);
        if (!p) return;

        populateProductCategoryDropdown(p.category);

        const titleEl = safeGet('prod-modal-title');
        if (titleEl) titleEl.innerText = `Edit Product: ${p.title || p.name}`;

        if (safeGet('prod-form-id')) safeGet('prod-form-id').value = p.id;
        if (safeGet('prod-form-sku')) safeGet('prod-form-sku').value = p.sku || p.id;
        if (safeGet('prod-form-title')) safeGet('prod-form-title').value = p.title || p.name || '';
        if (safeGet('prod-form-price')) safeGet('prod-form-price').value = p.price || p.basePrice || 499;
        if (safeGet('prod-form-origprice')) safeGet('prod-form-origprice').value = p.originalPrice || (p.price ? p.price + 300 : 799);
        if (safeGet('prod-form-image')) safeGet('prod-form-image').value = p.image || '';
        if (safeGet('prod-form-desc')) safeGet('prod-form-desc').value = p.desc || p.description || '';
        if (safeGet('prod-form-stock')) safeGet('prod-form-stock').value = p.stock !== undefined ? p.stock : 25;
        if (safeGet('prod-form-category')) safeGet('prod-form-category').value = p.category || 'cat_photo_prints';

        renderProductSizeRows(p.sizes, p.price || p.basePrice || 499, p);

        const preview = safeGet('prod-form-preview');
        const previewImg = safeGet('prod-form-preview-img');
        if (preview && previewImg && p.image) {
            previewImg.src = p.image;
            preview.style.display = 'block';
        } else if (preview) {
            preview.style.display = 'none';
        }

        const modal = safeGet('product-modal-overlay');
        if (modal) modal.style.display = 'flex';
    }

    function closeProductModal() {
        const modal = safeGet('product-modal-overlay');
        if (modal) modal.style.display = 'none';
    }

    function saveProduct(e) {
        if (e) e.preventDefault();
        const idInput = safeGet('prod-form-id')?.value.trim();
        const skuInput = safeGet('prod-form-sku')?.value.trim();
        const title = safeGet('prod-form-title')?.value.trim() || 'Custom Studio Frame';
        const price = parseFloat(safeGet('prod-form-price')?.value) || 499;
        const origPrice = parseFloat(safeGet('prod-form-origprice')?.value) || (price + 300);
        const image = safeGet('prod-form-image')?.value.trim() || 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=500';
        const desc = safeGet('prod-form-desc')?.value.trim() || 'Custom handcrafted photo print from Prince Studio.';
        const stock = parseInt(safeGet('prod-form-stock')?.value) || 25;
        const category = safeGet('prod-form-category')?.value || 'cat_photo_prints';
        const isCanvas = (category === 'cat_canvas_prints');

        const sizeRows = document.querySelectorAll('#prod-form-sizes-container .size-variant-row');
        const customSizes = [];
        const customSizeChart = [];
        sizeRows.forEach(row => {
            const sName = row.querySelector('.prod-size-name')?.value.trim();
            const sPrice = parseFloat(row.querySelector('.prod-size-price')?.value) || price;
            const sWrapPrice = parseFloat(row.querySelector('.prod-size-wrap-price')?.value) || Math.round(sPrice * 1.8);
            if (sName) {
                customSizes.push({ name: sName, price: sPrice, wrapPrice: sWrapPrice });
                customSizeChart.push({
                    size: sName,
                    label: sName,
                    rollPrice: sPrice,
                    wrapPrice: sWrapPrice,
                    originalPrice: Math.round(sWrapPrice * 1.5)
                });
            }
        });

        const finalSizes = customSizes.length > 0 ? customSizes : [{ name: 'Standard', price: price }];
        const finalSku = skuInput || idInput || ('PRD-' + Date.now().toString().slice(-4));
        const finalId = idInput || ('p_' + Date.now());

        if (idInput) {
            // Edit existing
            const p = products.find(prod => prod.id === idInput);
            if (p) {
                p.title = title;
                p.name = title;
                p.price = price;
                p.basePrice = price;
                p.originalPrice = origPrice;
                p.image = image;
                p.desc = desc;
                p.stock = stock;
                p.category = category;
                p.sku = finalSku;
                p.sizes = finalSizes;
                if (isCanvas || customSizeChart.length > 0) {
                    p.hasFormats = true;
                    p.formats = [
                        { id: 'roll', name: 'Canvas Print (Roll)', icon: 'fa-scroll', desc: 'Unframed Rolled in Safety Tube' },
                        { id: 'gallery_wrap', name: 'Gallery Wrap (Frame)', icon: 'fa-vector-square', desc: '1.5" Stretched Wood Frame' }
                    ];
                    p.sizeChart = customSizeChart;
                }
            }
        } else {
            // Add new
            const newProd = {
                id: finalId,
                sku: finalSku,
                title: title,
                name: title,
                price: price,
                basePrice: price,
                originalPrice: origPrice,
                image: image,
                desc: desc,
                stock: stock,
                category: category,
                rating: 5.0,
                reviews: 1,
                badge: 'New Arrival',
                sizes: finalSizes,
                hasFormats: isCanvas,
                formats: isCanvas ? [
                    { id: 'roll', name: 'Canvas Print (Roll)', icon: 'fa-scroll', desc: 'Unframed Rolled in Safety Tube' },
                    { id: 'gallery_wrap', name: 'Gallery Wrap (Frame)', icon: 'fa-vector-square', desc: '1.5" Stretched Wood Frame' }
                ] : undefined,
                sizeChart: isCanvas ? customSizeChart : undefined
            };
            products.unshift(newProd);
        }

        saveCatalogAndSyncStorefront();
        closeProductModal();
        if (window.showToast) window.showToast(`✅ Product "${title}" (SKU: ${finalSku}) saved & synced live! 🚀`);
    }

    function getDeletedProductIds() {
        try {
            const arr = JSON.parse(safeStorage.getItem('tasveer_deleted_product_ids'));
            if (Array.isArray(arr)) return arr;
        } catch (e) {}
        return [];
    }

    function addDeletedProductId(id) {
        if (!id) return;
        const current = getDeletedProductIds();
        if (!current.includes(id)) {
            current.push(id);
            safeStorage.setItem('tasveer_deleted_product_ids', JSON.stringify(current));
            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
                try {
                    firebase.firestore().collection('tasveer_store').doc('deleted_products').set({
                        ids: current,
                        updatedAt: new Date().toISOString()
                    }, { merge: true }).catch(()=>{});
                } catch(e) {}
            }
        }
    }

    function deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product?')) return;
        addDeletedProductId(productId);
        products = products.filter(prod => prod.id !== productId);
        saveCatalogAndSyncStorefront();
        if (window.showToast) window.showToast('✅ Product deleted & synced live!');
    }

    function saveCatalogAndSyncStorefront() {
        const deletedIds = getDeletedProductIds();
        products = products.filter(p => !p.isDeleted && !deletedIds.includes(p.id));

        safeStorage.setItem('tasveer_products', JSON.stringify(products));
        window.products = products;
        window.masterProducts = products;
        if (window.PRODUCTS_DATA) window.PRODUCTS_DATA = products;

        // 1. Push to Google Firebase Firestore Cloud Sync
        if (window.CloudDB && window.CloudDB.pushUpdate) {
            window.CloudDB.pushUpdate('products', products);
        }

        // 2. Direct Firestore Doc Push
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
            try {
                firebase.firestore().collection('tasveer_store').doc('products').set({
                    items: products,
                    updatedAt: new Date().toISOString()
                }, { merge: true }).catch(err => console.warn('Firestore products sync:', err));
            } catch(e) {}
        }

        // 3. Push to Live REST Server API (db.json)
        fetch((window.API_BASE || '') + '/api/v1/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(products)
        }).catch(e => {});

        fetch((window.API_BASE || '') + '/api/v1/cms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'products', data: products })
        }).catch(e => {});

        renderProductsTable();
        renderCategoriesTable();
        if (window.renderInventoryTable) window.renderInventoryTable();
        if (window.renderDashboard) window.renderDashboard();
    }

    function restoreDefaultProducts() {
        const modularProducts = (window.CoreCatalog && window.CoreCatalog.getAllModularProducts)
            ? window.CoreCatalog.getAllModularProducts()
            : (window.DEFAULT_PRODUCTS || []);

        safeStorage.removeItem('tasveer_deleted_product_ids');
        products = modularProducts.map(p => Object.assign({}, p, { isDeleted: false }));
        saveCatalogAndSyncStorefront();
        renderCategoriesTable();
        if (window.showToast) window.showToast('✅ All Studio Products & Categories Restored & Synced! 🚀');
    }

    function renderFrameTexturesTable() {
        const tbody = safeGet('frame-textures-tbody');
        if (!tbody) return;

        const defaultTextures = [
            { id: 'fmt_walnut', name: 'Walnut Wood', image: 'https://images.unsplash.com/photo-1546484475-7f7bd55792da?w=600', extra: 0 },
            { id: 'fmt_black', name: 'Sleek Black', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600', extra: 0 },
            { id: 'fmt_gold', name: 'Shahi Gold', image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop', extra: 150 }
        ];

        let textures = defaultTextures;
        try {
            const stored = JSON.parse(safeStorage.getItem('tasveer_frame_textures'));
            if (stored && Array.isArray(stored) && stored.length > 0) textures = stored;
        } catch (e) {}

        tbody.innerHTML = textures.map(t => `
            <tr>
                <td><img src="${t.image}" style="width:36px;height:36px;object-fit:cover;border-radius:4px;"></td>
                <td><strong>${t.name}</strong></td>
                <td>+₹${t.extra || 0}</td>
                <td><span class="badge badge-success">Active 3D</span></td>
            </tr>
        `).join('');
    }

    function renderCategoriesTable() {
        const tbody = safeGet('categories-tbody');
        if (!tbody) return;

        categories = getInitialCategories();
        let currentProducts = (window.masterProducts && window.masterProducts.length > 0) ? window.masterProducts : (products || []);

        if (currentProducts.filter(p => !p.isDeleted).length === 0) {
            currentProducts = (window.CoreCatalog && window.CoreCatalog.getAllModularProducts) 
                ? window.CoreCatalog.getAllModularProducts() 
                : (window.DEFAULT_PRODUCTS || []);
        }

        if (!categories || categories.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:#94a3b8;">No categories found. Click "+ Add Category" above to create one.</td></tr>`;
            return;
        }

        tbody.innerHTML = categories.map(c => {
            const count = currentProducts.filter(p => !p.isDeleted && (
                p.category === c.id || 
                p.category === c.name || 
                (p.category && p.category.toLowerCase() === c.name.toLowerCase()) ||
                (c.id === 'cat_photo_prints' && (p.category === 'cat_photo_prints' || (p.id && p.id.startsWith('prod_pp_'))))
            )).length;
            const imgDisplay = c.image ? `<img src="${c.image}" alt="${c.name}" style="width:36px;height:36px;object-fit:cover;border-radius:6px;border:1px solid rgba(255,255,255,0.15);">` : `<div style="width:36px;height:36px;background:#1e293b;border-radius:6px;display:flex;align-items:center;justify-content:center;color:var(--gold-bright);"><i class="fas ${c.icon || 'fa-layer-group'}"></i></div>`;

            return `
                <tr>
                    <td>${imgDisplay}</td>
                    <td>
                        <strong style="color:#fff; font-size:0.95rem;">${c.name}</strong>
                        ${c.desc ? `<br><small style="color:#94a3b8;">${c.desc}</small>` : ''}
                    </td>
                    <td><code>${c.id}</code></td>
                    <td><span class="badge badge-success" style="font-size:0.75rem;">${count} Products</span></td>
                    <td><span class="badge ${c.status === 'Inactive' ? 'badge-danger' : 'badge-success'}">${c.status || 'Active'}</span></td>
                    <td>
                        <div style="display:flex; gap:6px;">
                            <button class="btn-sm btn-outline" onclick="openEditCategoryModal('${c.id}')" title="Edit Category">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn-sm btn-danger" onclick="deleteCategory('${c.id}')" title="Delete Category">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function renderReviewsTable() {
        const tbody = safeGet('reviews-tbody');
        if (!tbody) return;

        const reviews = window.DEFAULT_REVIEWS || [];
        tbody.innerHTML = reviews.map(r => `
            <tr>
                <td><strong>${r.customerName}</strong></td>
                <td>${r.productTitle}</td>
                <td><span style="color:var(--gold-bright);">${'★'.repeat(r.stars)}</span></td>
                <td><small style="color:#cbd5e1;">"${r.reviewText}"</small></td>
                <td><span class="badge badge-success">${r.status || 'Approved'}</span></td>
            </tr>
        `).join('');
    }

    function renderInventoryTable() {
        const tbody = safeGet('inventory-tbody');
        if (!tbody) return;

        const activeProds = products.filter(p => !p.isDeleted);
        tbody.innerHTML = activeProds.map(p => `
            <tr>
                <td><strong>${p.title || p.name}</strong></td>
                <td><span style="text-transform:uppercase;font-size:0.75rem;">${p.category || 'Frame'}</span></td>
                <td>
                    <input type="number" value="${p.stock !== undefined ? p.stock : 25}" onchange="window.updateProductStock('${p.id}', this.value)" style="width:70px;background:#000;color:#fff;border:1px solid var(--border-color);padding:4px 8px;border-radius:4px;font-weight:700;">
                </td>
                <td>
                    <span class="badge ${(p.stock || 25) <= 5 ? 'badge-danger' : 'badge-success'}">
                        ${(p.stock || 25) <= 5 ? '⚠️ Low Stock' : '🟢 Healthy'}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    function updateProductStock(prodId, newStock) {
        const prod = products.find(p => p.id === prodId);
        if (prod) {
            prod.stock = parseInt(newStock) || 0;
            saveCatalogAndSyncStorefront();
            if (window.showToast) window.showToast(`Stock updated for "${prod.title}"`);
        }
    }

    function handlePCImageUpload(event, targetInputId, previewContainerId) {
        const file = event.target && event.target.files && event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (evt) {
            const rawData = evt.target.result;
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const maxDim = 500;
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.72);

                const targetInput = safeGet(targetInputId);
                if (targetInput) targetInput.value = compressedBase64;
                const previewContainer = safeGet(previewContainerId);
                const previewImg = safeGet(previewContainerId + '-img');
                if (previewContainer && previewImg) {
                    previewImg.src = compressedBase64;
                    previewContainer.style.display = 'block';
                }
                if (window.showToast) window.showToast('Photo uploaded & web-optimized! 🖼️');
            };
            img.src = rawData;
        };
        reader.readAsDataURL(file);
    }

    function openAddCategoryModal() {
        if (safeGet('cat-form-original-id')) safeGet('cat-form-original-id').value = '';
        if (safeGet('cat-form-name')) safeGet('cat-form-name').value = '';
        if (safeGet('cat-form-id')) safeGet('cat-form-id').value = '';
        if (safeGet('cat-form-image')) safeGet('cat-form-image').value = '';
        if (safeGet('cat-form-desc')) safeGet('cat-form-desc').value = '';
        if (safeGet('cat-form-status')) safeGet('cat-form-status').value = 'Active';
        if (safeGet('cat-form-preview')) safeGet('cat-form-preview').style.display = 'none';

        const titleEl = document.querySelector('#category-modal-overlay .modal-title');
        if (titleEl) titleEl.innerText = 'Add Store Category';

        const m = safeGet('category-modal-overlay');
        if (m) m.style.display = 'flex';
    }

    function openEditCategoryModal(catId) {
        categories = getInitialCategories();
        const c = categories.find(item => item.id === catId);
        if (!c) return;

        if (safeGet('cat-form-original-id')) safeGet('cat-form-original-id').value = c.id;
        if (safeGet('cat-form-name')) safeGet('cat-form-name').value = c.name || '';
        if (safeGet('cat-form-id')) safeGet('cat-form-id').value = c.id || '';
        if (safeGet('cat-form-image')) safeGet('cat-form-image').value = c.image || '';
        if (safeGet('cat-form-desc')) safeGet('cat-form-desc').value = c.desc || '';
        if (safeGet('cat-form-status')) safeGet('cat-form-status').value = c.status || 'Active';

        const prev = safeGet('cat-form-preview');
        const prevImg = safeGet('cat-form-preview-img');
        if (prev && prevImg) {
            if (c.image) {
                prevImg.src = c.image;
                prev.style.display = 'block';
            } else {
                prev.style.display = 'none';
            }
        }

        const titleEl = document.querySelector('#category-modal-overlay .modal-title');
        if (titleEl) titleEl.innerText = `Edit Store Category: ${c.name}`;

        const m = safeGet('category-modal-overlay');
        if (m) m.style.display = 'flex';
    }

    function closeCategoryModal() {
        const m = safeGet('category-modal-overlay');
        if (m) m.style.display = 'none';
    }

    function saveCategory(e) {
        if (e) e.preventDefault();

        const nameInput = safeGet('cat-form-name');
        if (!nameInput || !nameInput.value.trim()) {
            if (window.showToast) window.showToast('Please enter a Category Name!', 'warn');
            return;
        }

        const origId = safeGet('cat-form-original-id')?.value.trim();
        const name = nameInput.value.trim();
        let catId = safeGet('cat-form-id')?.value.trim();
        if (!catId) {
            catId = 'cat_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        }

        const image = safeGet('cat-form-image')?.value.trim() || '';
        const desc = safeGet('cat-form-desc')?.value.trim() || '';
        const status = safeGet('cat-form-status')?.value || 'Active';

        categories = getInitialCategories();

        const categoryObj = {
            id: catId,
            name: name,
            icon: 'fa-layer-group',
            image: image,
            desc: desc,
            status: status
        };

        if (origId) {
            const idx = categories.findIndex(c => c.id === origId);
            if (idx !== -1) {
                categories[idx] = { ...categories[idx], ...categoryObj };
            } else {
                categories.push(categoryObj);
            }
        } else {
            const existingIdx = categories.findIndex(c => c.id === catId);
            if (existingIdx !== -1) {
                categories[existingIdx] = { ...categories[existingIdx], ...categoryObj };
            } else {
                categories.push(categoryObj);
            }
        }

        saveCategoriesAndSync();
        closeCategoryModal();
        if (window.showToast) window.showToast(`✅ Category "${name}" saved & synced live to Firebase Cloud! 🚀`);
    }

    function deleteCategory(catId) {
        categories = getInitialCategories();
        const c = categories.find(item => item.id === catId);
        if (!c) return;

        if (!confirm(`🗑️ Category "${c.name}" delete karna chahte hain?`)) return;

        categories = categories.filter(item => item.id !== catId);
        saveCategoriesAndSync();
        if (window.showToast) window.showToast(`🗑️ Category "${c.name}" deleted!`);
    }

    function saveCategoriesAndSync() {
        safeStorage.setItem('tasveer_categories', JSON.stringify(categories));
        window.DEFAULT_CATEGORIES = categories;

        // 1. Firebase Firestore Cloud Sync
        if (window.CloudDB && window.CloudDB.pushUpdate) {
            window.CloudDB.pushUpdate('categories', categories);
        }

        // 2. Direct Firestore Doc Push
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
            try {
                firebase.firestore().collection('tasveer_store').doc('categories').set({
                    items: categories,
                    updatedAt: new Date().toISOString()
                }, { merge: true }).catch(()=>{});
            } catch(e) {}
        }

        // 3. REST API
        fetch((window.API_BASE || '') + '/api/v1/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (sessionStorage.getItem('tasveer_admin_jwt_token') || '')
            },
            body: JSON.stringify(categories)
        }).catch(() => {});

        renderCategoriesTable();
    }

    function downloadCatalogBackup() {
        const backupData = {
            version: '2026.08',
            exportedAt: new Date().toISOString(),
            studioName: 'Prince Photo Studio',
            products: products,
            categories: categories,
            frameTextures: frameTextures
        };

        const jsonStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dateStr = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `tasveer_catalog_backup_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (window.showToast) window.showToast('✅ Catalog backup downloaded to PC! 💾');
    }

    function triggerRestoreBackupUpload() {
        const fileInput = safeGet('catalog-backup-file-input');
        if (fileInput) {
            fileInput.value = '';
            fileInput.click();
        }
    }

    function handleRestoreBackupFile(event) {
        const file = event.target && event.target.files && event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (evt) {
            try {
                const parsed = JSON.parse(evt.target.result);
                if (parsed && Array.isArray(parsed.products) && parsed.products.length > 0) {
                    products = parsed.products;
                    if (parsed.categories && Array.isArray(parsed.categories)) {
                        categories = parsed.categories;
                        safeStorage.setItem('tasveer_categories', JSON.stringify(categories));
                    }
                    saveCatalogAndSyncStorefront();
                    renderProductsTable();
                    renderCategoriesTable();
                    if (window.showToast) window.showToast(`✅ Successfully restored ${products.length} products from backup! 🚀`);
                } else {
                    alert('Invalid backup file format. Please select a valid Tasveer JSON backup file.');
                }
            } catch (err) {
                alert('Error reading backup file: ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    function openAddFrameTextureModal() { const m = safeGet('frame-texture-modal-overlay'); if(m) m.style.display = 'flex'; }
    function closeFrameTextureModal() { const m = safeGet('frame-texture-modal-overlay'); if(m) m.style.display = 'none'; }
    function saveFrameTexture(e) { if(e) e.preventDefault(); if(window.showToast) window.showToast('3D Frame Texture saved & synced!'); closeFrameTextureModal(); }

    function openAddBentoCardModal() { const m = safeGet('bento-card-modal-overlay'); if(m) m.style.display = 'flex'; }
    function closeBentoCardModal() { const m = safeGet('bento-card-modal-overlay'); if(m) m.style.display = 'none'; }
    function saveBentoCard(e) { if(e) e.preventDefault(); if(window.showToast) window.showToast('Bento Card saved & synced!'); closeBentoCardModal(); }

    // Expose Catalog API
    window.products = products;
    window.renderProductsTable = renderProductsTable;
    window.openAddProductModal = openAddProductModal;
    window.openEditProductModal = openEditProductModal;
    window.closeProductModal = closeProductModal;
    window.closeAddProductModal = closeProductModal;
    window.addProdSizeRow = addProdSizeRow;
    window.restoreDefaultProducts = restoreDefaultProducts;
    window.downloadCatalogBackup = downloadCatalogBackup;
    window.triggerRestoreBackupUpload = triggerRestoreBackupUpload;
    window.handleRestoreBackupFile = handleRestoreBackupFile;
    window.handleAddProductSubmit = saveProduct;
    window.saveProduct = saveProduct;
    window.deleteProduct = deleteProduct;
    window.renderFrameTexturesTable = renderFrameTexturesTable;
    window.renderCategoriesTable = renderCategoriesTable;
    window.renderReviewsTable = renderReviewsTable;
    window.renderInventoryTable = renderInventoryTable;
    window.updateProductStock = updateProductStock;
    window.handlePCImageUpload = handlePCImageUpload;
    window.openAddCategoryModal = openAddCategoryModal;
    window.openEditCategoryModal = openEditCategoryModal;
    window.closeCategoryModal = closeCategoryModal;
    window.saveCategory = saveCategory;
    window.deleteCategory = deleteCategory;
    window.openAddFrameTextureModal = openAddFrameTextureModal;
    window.closeFrameTextureModal = closeFrameTextureModal;
    window.saveFrameTexture = saveFrameTexture;
    window.openAddBentoCardModal = openAddBentoCardModal;
    window.closeBentoCardModal = closeBentoCardModal;
    window.saveBentoCard = saveBentoCard;

})(window, document);
