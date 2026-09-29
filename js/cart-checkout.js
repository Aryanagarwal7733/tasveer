/**
 * ==========================================================================
 * Tasveer by Prince Studio - Cart & Checkout Engine (js/cart-checkout.js)
 * Shopping Cart, Wishlist, Coupon Discount, UPI QR Modal & WhatsApp Checkout
 * ==========================================================================
 */

(function (window, document) {
    'use strict';

    const safeStorage = {
        getItem: function (key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
        setItem: function (key, val) { try { localStorage.setItem(key, val); } catch (e) {} },
        removeItem: function (key) { try { localStorage.removeItem(key); } catch (e) {} }
    };

    // Master Single Source of Truth Cart Array
    if (!window.cart || !Array.isArray(window.cart)) {
        window.cart = (function () {
            try {
                const saved = JSON.parse(safeStorage.getItem('tasveer_cart'));
                if (saved && Array.isArray(saved)) return saved;
            } catch (e) {}
            return [];
        })();
    }
    let cart = window.cart;

    let wishlist = (function () {
        try {
            const saved = JSON.parse(safeStorage.getItem('tasveer_wishlist'));
            if (saved && Array.isArray(saved)) return saved;
        } catch (e) {}
        return [];
    })();

    let activeCoupon = null;

    const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500';

    /** Base64 photos can exceed localStorage's ~5MB quota and freeze the site. */
    function stripHeavyDataUrl(value) {
        return (typeof value === 'string' && value.startsWith('data:')) ? PLACEHOLDER_IMAGE : value;
    }

    function sanitizeCartItemForStorage(item) {
        const copy = { ...item };
        copy.image = stripHeavyDataUrl(copy.image);
        if (copy.photoUrl) {
            copy.photoUrl = stripHeavyDataUrl(copy.photoUrl);
            if (copy.photoUrl === PLACEHOLDER_IMAGE && item.photoUrl && item.photoUrl.startsWith('data:')) {
                copy.hasCustomPhoto = true;
            }
        }
        return copy;
    }

    function openCartDrawer() {
        openCheckoutPage();
    }

    function closeCartDrawer() {
        closeCheckoutPage();
    }

    function _showCheckoutDrawer(drawer) {
        drawer.classList.add('open');
        drawer.style.cssText = [
            'display:flex !important',
            'opacity:1 !important',
            'visibility:visible !important',
            'pointer-events:auto !important',
            'z-index:100000 !important',
            'position:fixed !important',
            'top:0 !important',
            'left:0 !important',
            'width:100% !important',
            'height:100% !important',
            'background:rgba(0,0,0,0.8) !important'
        ].join(';');
        const inner = drawer.querySelector('.cart-drawer');
        if (inner) {
            inner.style.cssText = [
                'right:0 !important',
                'display:flex !important',
                'flex-direction:column !important',
                'max-width:720px !important',
                'width:100% !important',
                'height:100% !important',
                'background:#0f172a !important',
                'color:#f8fafc !important',
                'z-index:100001 !important'
            ].join(';');
        }
    }

    function _hideCheckoutDrawer(drawer) {
        drawer.classList.remove('open');
        drawer.style.display = 'none';
        drawer.style.opacity = '0';
        drawer.style.visibility = 'hidden';
        drawer.style.pointerEvents = 'none';
        const inner = drawer.querySelector('.cart-drawer');
        if (inner) inner.style.right = '-720px';
    }

    function openWishlistDrawer() {
        const drawer = safeGet('wishlist-modal-overlay');
        if (drawer) drawer.classList.add('open');
        renderWishlistItems();
    }

    function closeWishlistDrawer() {
        const drawer = safeGet('wishlist-modal-overlay');
        if (drawer) drawer.classList.remove('open');
    }

    function addToCart(productIdOrObject) {
        if (typeof productIdOrObject === 'object' && productIdOrObject !== null) {
            const customObj = productIdOrObject;
            const existing = cart.find(item => item.id === customObj.id);
            if (existing) {
                existing.qty = (existing.qty || 1) + (customObj.qty || customObj.quantity || 1);
            } else {
                cart.push({
                    id: customObj.id || 'cart_' + Date.now(),
                    title: customObj.title || 'Custom Frame',
                    price: customObj.price || 499,
                    image: customObj.image || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500',
                    qty: customObj.qty || customObj.quantity || 1,
                    size: customObj.size || '12x18"',
                    frame: customObj.frame || 'Custom Wood'
                });
            }
            saveCartState();
            if (window.showToast) window.showToast(`🛒 Added "${customObj.title}" to Cart!`);
            return;
        }

        const productId = productIdOrObject;
        const allProducts = (window.PRODUCTS_DATA && window.PRODUCTS_DATA.length > 0) ? window.PRODUCTS_DATA : ((window.masterProducts && window.masterProducts.length > 0) ? window.masterProducts : (window.DEFAULT_PRODUCTS || []));
        let prod = allProducts.find(p => p.id === productId);
        if (!prod) {
            prod = { id: productId, title: 'Studio Photo Frame', price: 499, image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500' };
        }

        const existing = cart.find(item => item.id === prod.id);
        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({
                id: prod.id,
                title: prod.title || prod.name || 'Custom Frame',
                price: prod.price || prod.basePrice || 499,
                image: prod.image || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500',
                qty: 1,
                size: '12x18"',
                frame: 'Italian Teak Wood'
            });
        }
        saveCartState();
        if (window.logDebugMessage) window.logDebugMessage(`🛒 Added "${prod.title || prod.name}" to Cart (Total items: ${cart.length})`, 'info');
        if (window.showToast) window.showToast(`🛒 Added "${prod.title || prod.name}" to Cart!`);
    }

    function buyNow(productIdOrObject) {
        addToCart(productIdOrObject);
        setTimeout(() => {
            if (typeof window.openCheckoutPage === 'function') {
                window.openCheckoutPage();
            } else if (typeof window.openCartDrawer === 'function') {
                window.openCartDrawer();
            }
        }, 150);
    }

    function addCustomItemToCart() {
        const state = window.customizerState || {};
        const finalPrice = (state.basePrice || 499) + (state.frameExtra || 0) + (state.paperExtra || 0) + (state.glassExtra || 0);

        const photoCanvas = safeGet('photo-canvas');
        const liveSrc = (photoCanvas && photoCanvas.src) ? photoCanvas.src : null;

        const customItem = {
            id: 'custom_' + Date.now(),
            title: `Custom Photo Frame (${state.size || '12x18"'})`,
            price: finalPrice,
            image: state.uploadedImageSrc || liveSrc || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500',
            qty: 1,
            size: state.size || '12x18"',
            frame: state.frameStyle || 'Teak Wood',
            filter: state.photoFilter || 'None'
        };

        cart.push(customItem);
        saveCartState();
        if (window.showToast) window.showToast('✅ Custom Photo Frame added to Cart!');
    }

    function toggleWishlist(productId) {
        const idx = wishlist.indexOf(productId);
        if (idx > -1) {
            wishlist.splice(idx, 1);
            if (window.showToast) window.showToast('Removed from Wishlist');
        } else {
            wishlist.push(productId);
            if (window.showToast) window.showToast('❤️ Saved to Wishlist!');
        }
        safeStorage.setItem('tasveer_wishlist', JSON.stringify(wishlist));
        if (window.renderProducts) window.renderProducts();
    }

    function updateCartQty(index, delta) {
        if (!cart[index]) return;
        cart[index].qty += delta;
        if (cart[index].qty <= 0) {
            cart.splice(index, 1);
        }
        saveCartState();
        renderCartItems();
        renderCheckoutOrderSummary();
    }

    function saveCartState() {
        const c = window.cart || [];
        try {
            safeStorage.setItem('tasveer_cart', JSON.stringify(c.map(sanitizeCartItemForStorage)));
        } catch (e) {
            console.warn('[Cart] localStorage save failed — clearing heavy photo data and retrying.', e);
            try {
                safeStorage.setItem('tasveer_cart', JSON.stringify(c.map(function (item) {
                    const lean = sanitizeCartItemForStorage(item);
                    delete lean.photoUrl;
                    return lean;
                })));
            } catch (retryErr) {
                console.error('[Cart] Could not persist cart:', retryErr);
            }
        }
        updateCartBadgeCount();
    }

    function updateCartBadgeCount() {
        const c = window.cart || [];
        const count = c.reduce((sum, item) => sum + (item.qty || 1), 0);
        document.querySelectorAll('.cart-count-badge').forEach(el => {
            el.innerText = count;
            el.style.display = count > 0 ? 'inline-block' : 'none';
        });

        const debugCartCountEl = safeGet('debug-cart-count');
        if (debugCartCountEl) debugCartCountEl.innerText = `${count} Items`;
    }

    function calculateSubtotal() {
        const c = window.cart || [];
        return c.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseInt(item.qty) || 1)), 0);
    }

    function renderCartItems() {
        const container = safeGet('cart-items-body') || safeGet('cart-items-list');
        if (!container) return;

        const c = window.cart || [];
        if (c.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #64748b;">
                    <i class="fas fa-shopping-bag" style="font-size: 3rem; margin-bottom: 15px; color: #d97706;"></i>
                    <h3 style="color: #29180c; font-family: var(--font-heading);">Your Shopping Cart is Empty</h3>
                    <p style="font-size: 0.85rem; margin-top: 6px; color: #64748b;">Explore our framing catalog to add custom items.</p>
                </div>
            `;
            updateCartPriceSummary(0, 0);
            return;
        }

        container.innerHTML = c.map((item, idx) => `
            <div style="display: flex; gap: 14px; padding: 14px; border: 1px solid #e2e8f0; border-radius: 10px; background: #ffffff; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.04); margin-bottom: 10px;">
                <img src="${item.image}" alt="${item.title}" style="width: 65px; height: 65px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0;">
                <div style="flex: 1;">
                    <strong style="display: block; font-size: 0.92rem; color: #29180c; font-weight: 800; line-height: 1.3;">${item.title}</strong>
                    <span style="font-size: 0.8rem; color: #b45309; font-weight: 700;">${item.specs || item.size || '12x18"'} | ₹${item.price}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button onclick="window.updateCartQty(${idx}, -1)" style="width: 28px; height: 28px; border-radius: 50%; border: 1px solid #cbd5e1; background: #f8fafc; color: #29180c; font-weight: 800; cursor: pointer;">-</button>
                    <span style="font-weight: 800; font-size: 0.95rem; color: #29180c;">${item.qty}</span>
                    <button onclick="window.updateCartQty(${idx}, 1)" style="width: 28px; height: 28px; border-radius: 50%; border: 1px solid #cbd5e1; background: #f8fafc; color: #29180c; font-weight: 800; cursor: pointer;">+</button>
                </div>
            </div>
        `).join('');
        calculateCartTotal();
    }

    function calculateCartTotal() {
        const subtotal = calculateSubtotal();
        let discount = 0;
        if (activeCoupon) {
            discount = activeCoupon.discountType === 'percent' ? (subtotal * activeCoupon.value / 100) : activeCoupon.value;
        }
        updateCartPriceSummary(subtotal, discount);
    }

    function updateCartPriceSummary(subtotal, discount) {
        const subtotalEl = safeGet('cart-subtotal-val');
        const finalEl = safeGet('cart-final-total-val');
        const finalPrice = Math.max(0, subtotal - discount);

        if (subtotalEl) subtotalEl.innerText = `₹${subtotal}`;
        if (finalEl) finalEl.innerText = `₹${finalPrice}`;
    }

    function getAvailableCoupons() {
        let list = [
            { code: 'WELCOME10', discountType: 'percent', value: 10, minCart: 300 },
            { code: 'TASVEER100', discountType: 'fixed', value: 100, minCart: 500 }
        ];
        try {
            const stored = JSON.parse(localStorage.getItem('tasveer_coupons'));
            if (stored && Array.isArray(stored) && stored.length > 0) {
                list = stored;
            }
        } catch (e) {}
        return list;
    }

    function applyCoupon() {
        const codeInput = safeGet('chk-coupon-input-val') || safeGet('cart-coupon-input') || safeGet('coupon-input-val');
        const resultMsg = safeGet('chk-coupon-result-msg') || safeGet('coupon-result-msg');
        if (!codeInput) return;

        const code = codeInput.value.trim().toUpperCase();
        if (!code) {
            if (resultMsg) {
                resultMsg.innerHTML = '<span style="color:#f87171;font-weight:700;">⚠️ Please enter a coupon code.</span>';
            }
            if (window.showToast) window.showToast('⚠️ Please enter a coupon code.', 'warn');
            return;
        }

        const subtotal = calculateSubtotal();
        if (subtotal <= 0) {
            if (resultMsg) {
                resultMsg.innerHTML = '<span style="color:#f87171;font-weight:700;">⚠️ Add products to cart first!</span>';
            }
            if (window.showToast) window.showToast('⚠️ Add products to cart first!', 'warn');
            return;
        }

        // Fetch latest coupons from server or localStorage
        fetch((window.API_BASE || '') + '/api/v1/coupons')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    try { localStorage.setItem('tasveer_coupons', JSON.stringify(data)); } catch(e){}
                }
            })
            .catch(() => {});

        const available = getAvailableCoupons();
        const matched = available.find(c => c.code.toUpperCase() === code);

        if (!matched) {
            activeCoupon = null;
            if (resultMsg) {
                resultMsg.innerHTML = `<span style="color:#f87171;font-weight:700;">❌ Invalid coupon code: "${code}"</span>`;
            }
            if (window.showToast) window.showToast(`❌ Invalid coupon code: ${code}`, 'warn');
            calculateCartTotal();
            renderCheckoutOrderSummary();
            return;
        }

        const minCart = parseFloat(matched.minCart) || 0;
        if (subtotal < minCart) {
            activeCoupon = null;
            const errMsg = `⚠️ Coupon "${code}" requires minimum order value of ₹${minCart} (Current: ₹${subtotal})`;
            if (resultMsg) {
                resultMsg.innerHTML = `<span style="color:#fbbf24;font-weight:700;">${errMsg}</span>`;
            }
            if (window.showToast) window.showToast(errMsg, 'warn');
            calculateCartTotal();
            renderCheckoutOrderSummary();
            return;
        }

        activeCoupon = matched;
        const discountVal = matched.discountType === 'percent' 
            ? Math.round((subtotal * matched.value) / 100) 
            : matched.value;
        const discountText = matched.discountType === 'percent' ? `${matched.value}% OFF (₹${discountVal})` : `₹${matched.value} Flat OFF`;

        const successMsg = `✅ Applied ${matched.code} - ${discountText}!`;
        if (resultMsg) {
            resultMsg.innerHTML = `<span style="color:#10b981;font-weight:700;">${successMsg}</span>`;
        }
        if (window.showToast) window.showToast(successMsg);

        renderCartItems();
        renderCheckoutOrderSummary();
    }

    let selectedPaymentMethod = 'UPI';

    function selectPaymentMethod(method, cardElement) {
        selectedPaymentMethod = method;
        document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('active'));
        if (cardElement) {
            cardElement.classList.add('active');
        }
        if (window.showToast) window.showToast(`💳 Payment Mode Selected: ${method}`);
    }

    function renderWishlistItems() {
        const container = safeGet('wishlist-items-body') || safeGet('wishlist-items-list');
        if (!container) return;

        if (wishlist.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);">No saved items in wishlist yet.</div>`;
            return;
        }

        const prods = (window.PRODUCTS_DATA || []).filter(p => wishlist.includes(p.id));
        container.innerHTML = prods.map(p => `
            <div style="display:flex; gap:12px; align-items:center; padding:10px; border-bottom:1px solid var(--border-color);">
                <img src="${p.image}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;">
                <div style="flex:1;">
                    <strong>${p.title || p.name}</strong>
                    <div style="color:var(--gold-primary); font-weight:700;">₹${p.price || p.basePrice}</div>
                </div>
                <button onclick="window.addToCart('${p.id}')" class="btn btn-primary" style="padding:6px 12px; font-size:0.75rem;">Add to Cart</button>
            </div>
        `).join('');
    }

    function openCheckoutPage() {
        const c = window.cart || [];
        if (c.length === 0) {
            try {
                const saved = JSON.parse(localStorage.getItem('tasveer_cart') || '[]');
                if (Array.isArray(saved) && saved.length > 0) window.cart = saved;
            } catch(e) {}
        }
        if (!window.cart || window.cart.length === 0) {
            if (window.showToast) window.showToast('🛒 Cart is empty! Please add items first.', 'warn');
            return;
        }

        // If on mobile view, route directly to MobileFlow checkout screen
        if (window.innerWidth <= 768 && window.MobileFlow && typeof window.MobileFlow.openCheckout === 'function') {
            window.MobileFlow.openCheckout();
            return;
        }

        // Close product details drawer if open
        const detailsOverlay = safeGet('product-details-overlay');
        if (detailsOverlay) {
            detailsOverlay.classList.remove('open');
            detailsOverlay.style.display = '';
        }
        const drawer = safeGet('checkout-drawer-overlay');
        if (!drawer) return;
        _showCheckoutDrawer(drawer);
        renderCheckoutOrderSummary();
    }

    function closeCheckoutPage() {
        const drawer = safeGet('checkout-drawer-overlay');
        if (drawer) {
            drawer.classList.remove('open');
            drawer.style.display = 'none';
            drawer.style.opacity = '0';
            drawer.style.visibility = 'hidden';
            drawer.style.pointerEvents = 'none';

            const inner = drawer.querySelector('.cart-drawer');
            if (inner) inner.style.right = '-720px';
        }
    }

    function renderCheckoutOrderSummary() {
        const c = window.cart || [];
        const summaryList = safeGet('chk-order-summary-list');
        const subtotalEl = safeGet('chk-subtotal-val');
        const totalEl = safeGet('chk-total-val');
        const discountEl = safeGet('chk-discount-val');

        if (summaryList) {
            if (c.length === 0) {
                summaryList.innerHTML = `<div style="text-align:center; padding:15px; color:#94a3b8; font-size:0.85rem;">Your Cart is empty! Select a product to order.</div>`;
            } else {
                summaryList.innerHTML = c.map((i, idx) => `
                    <div style="display:flex; gap:10px; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #1e293b; padding-bottom:8px; background:#0f172a; padding:8px 10px; border-radius:6px; border:1px solid #334155;">
                        <img src="${i.image || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500'}" style="width:42px; height:42px; object-fit:cover; border-radius:4px; border:1px solid #334155;">
                        <div style="flex:1;">
                            <strong style="color:#f8fafc; font-size:0.82rem; display:block; line-height:1.2;">${i.title}</strong>
                            <small style="color:#fbbf24; font-weight:700;">${i.specs || i.size || '12x18"'} | ₹${i.price}</small>
                        </div>
                        <div style="display:flex; align-items:center; gap:6px;">
                            <button type="button" onclick="window.updateCartQty(${idx}, -1)" style="width:24px; height:24px; border-radius:50%; border:1px solid #475569; background:#1e293b; color:#fff; font-weight:800; cursor:pointer;">-</button>
                            <span style="font-weight:800; font-size:0.85rem; color:#fff;">${i.qty}</span>
                            <button type="button" onclick="window.updateCartQty(${idx}, 1)" style="width:24px; height:24px; border-radius:50%; border:1px solid #475569; background:#1e293b; color:#fff; font-weight:800; cursor:pointer;">+</button>
                        </div>
                    </div>
                `).join('');
            }
        }

        const subtotal = calculateSubtotal();
        let discount = 0;
        if (activeCoupon) {
            discount = activeCoupon.discountType === 'percent' ? (subtotal * activeCoupon.value) / 100 : activeCoupon.value;
        }

        const total = Math.max(0, subtotal - discount);

        if (subtotalEl) subtotalEl.innerText = `₹${subtotal}`;
        if (discountEl) discountEl.innerText = `-₹${discount}`;
        if (totalEl) totalEl.innerText = `₹${total}`;
    }

    function checkCheckoutPincode() {
        const pinInput = safeGet('chk-cust-pincode');
        const statusEl = safeGet('chk-pincode-status-msg');
        if (!pinInput || !statusEl) return;

        const pin = pinInput.value.trim();
        if (pin.length === 6 && /^\d+$/.test(pin)) {
            if (pin.startsWith('322')) {
                statusEl.innerHTML = `<span style="color: #10b981; font-weight:700;">✅ Local Studio Express Available in Sawai Madhopur (1-2 Days Delivery)!</span>`;
            } else {
                statusEl.innerHTML = `<span style="color: var(--gold-bright); font-weight:700;">🚚 Pan-India DTDC Express Delivery Available (3-5 Days Delivery)!</span>`;
            }
        } else {
            statusEl.innerHTML = `<span style="color: #f87171; font-weight:700;">⚠️ Enter a valid 6-digit Pincode.</span>`;
        }
    }

    let lastCreatedOrderId = 'TAS-90812';
    let lastCreatedOrderObj = null;

    function submitCheckoutOrder(e) {
        if (e) {
            try { e.preventDefault(); } catch(err) {}
            try { e.stopPropagation(); } catch(err) {}
        }
        if (!cart || cart.length === 0) {
            if (window.showToast) window.showToast('Your Shopping Cart is empty!', 'warn');
            return false;
        }

        const nameInput = document.getElementById('chk-cust-name') || document.getElementById('checkout-cust-name') || document.getElementById('cust-name');
        const phoneInput = document.getElementById('chk-cust-phone') || document.getElementById('checkout-cust-phone') || document.getElementById('cust-phone');
        const addressInput = document.getElementById('chk-cust-address') || document.getElementById('checkout-cust-address') || document.getElementById('cust-address');
        const pincodeInput = document.getElementById('chk-cust-pincode') || document.getElementById('checkout-cust-pincode') || document.getElementById('cust-pincode');
        const cityInput = document.getElementById('chk-cust-city') || document.getElementById('checkout-cust-city') || document.getElementById('cust-city');

        const name = (nameInput && nameInput.value.trim()) || '';
        const phone = (phoneInput && phoneInput.value.trim()) || '';
        const address = (addressInput && addressInput.value.trim()) || '';
        const pincode = (pincodeInput && pincodeInput.value.trim()) || '';
        const city = (cityInput && cityInput.value.trim()) || '';

        // 1. Strict Name Validation
        if (!name || name.length < 2) {
            alert('⚠️ Please enter your Full Name to proceed with your order.');
            if (nameInput) { nameInput.focus(); nameInput.style.borderColor = '#f87171'; }
            if (window.showToast) window.showToast('⚠️ Full Name is required!', 'warn');
            return false;
        }

        // 2. Strict 10-Digit Mobile Phone Validation
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const validPhone = (cleanPhone.length === 10 && /^[6-9]/.test(cleanPhone)) || (cleanPhone.length === 12 && cleanPhone.startsWith('91'));
        if (!validPhone) {
            alert('⚠️ Please enter a valid 10-digit Mobile Phone Number for WhatsApp Order Confirmation.');
            if (phoneInput) { phoneInput.focus(); phoneInput.style.borderColor = '#f87171'; }
            if (window.showToast) window.showToast('⚠️ Valid 10-digit mobile number required!', 'warn');
            return false;
        }

        // 3. Strict Delivery Address Validation
        if (!address || address.length < 6) {
            alert('⚠️ Delivery Address is required!\n\nPlease enter your complete doorstep delivery address (House No., Street, Colony, Landmark) so we can dispatch your framed photo.');
            if (addressInput) { addressInput.focus(); addressInput.style.borderColor = '#f87171'; }
            if (window.showToast) window.showToast('⚠️ Complete Delivery Address is required!', 'warn');
            return false;
        }

        // 4. Strict 6-Digit Pincode Validation
        if (!pincode || !/^\d{6}$/.test(pincode)) {
            alert('⚠️ Please enter a valid 6-digit Delivery Pincode.');
            if (pincodeInput) { pincodeInput.focus(); pincodeInput.style.borderColor = '#f87171'; }
            if (window.showToast) window.showToast('⚠️ Valid 6-digit Pincode required!', 'warn');
            return false;
        }

        const fullAddress = city ? `${address}, ${city}` : address;

        const subtotal = calculateSubtotal();
        const discount = activeCoupon ? (activeCoupon.discountType === 'percent' ? (subtotal * activeCoupon.value / 100) : activeCoupon.value) : 0;
        let finalTotal = Math.max(0, subtotal - discount);
        if (finalTotal === 0 && cart.length > 0) {
            finalTotal = cart.reduce((sum, i) => sum + ((i.price || 499) * (i.qty || 1)), 0);
        }
        if (finalTotal === 0) finalTotal = 499;

        lastCreatedOrderId = 'TAS-' + Math.floor(10000 + Math.random() * 90000);

        const newOrder = {
            id: lastCreatedOrderId,
            customerName: name,
            phone: cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone,
            address: fullAddress,
            pincode: pincode,
            items: cart.map(i => ({ title: i.title, qty: i.qty || 1, price: i.price })),
            total: finalTotal,
            status: 'Processing',
            paymentMethod: selectedPaymentMethod || 'UPI',
            paymentStatus: 'Pending',
            date: new Date().toISOString().split('T')[0],
            awb: pincode.startsWith('322') ? 'LOCAL-SWM-EXPRESS' : 'DTDC-' + Math.floor(10000 + Math.random() * 90000)
        };

        lastCreatedOrderObj = newOrder;
        window.lastCreatedOrder = newOrder;

        let existingOrders = [];
        try {
            const saved = JSON.parse(safeStorage.getItem('tasveer_orders'));
            if (saved && Array.isArray(saved) && saved.length > 0) existingOrders = saved;
        } catch(e) {}
        if (existingOrders.length === 0 && window.CloudDB) {
            const c = window.CloudDB.getCollection('orders');
            if (c && Array.isArray(c) && c.length > 0) existingOrders = c;
        }
        if (existingOrders.length === 0 && window.masterOrders) {
            existingOrders = window.masterOrders;
        }
        if (existingOrders.length === 0 && window.DEFAULT_ORDERS) {
            existingOrders = [...window.DEFAULT_ORDERS];
        }

        existingOrders = existingOrders.filter(o => o.id !== newOrder.id);
        existingOrders.unshift(newOrder);

        window.masterOrders = existingOrders;
        window.orders = existingOrders;
        window.ORDERS_DATA = existingOrders;
        safeStorage.setItem('tasveer_orders', JSON.stringify(existingOrders));

        // 1. Direct Real-time Google Firebase Firestore Cloud Sync
        if (window.CloudDB && window.CloudDB.pushUpdate) {
            window.CloudDB.pushUpdate('orders', existingOrders);
        }

        // 2. Direct Firestore Doc Push if SDK is active
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
            try {
                firebase.firestore().collection('tasveer_store').doc('orders').set({
                    items: existingOrders,
                    updatedAt: new Date().toISOString()
                }, { merge: true }).catch(err => console.warn('Firestore direct order sync:', err));
            } catch(err) {}
        }

        // 3. Fallback REST API
        fetch((window.API_BASE || '') + '/api/v1/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(existingOrders)
        }).catch(err => {});

        // 4. Automated Cloud WhatsApp Bot Dispatch (Customer + Studio Admin)
        if (window.WhatsAppGateway) {
            try {
                window.WhatsAppGateway.dispatchOrderNotifications(newOrder);
            } catch(e) {
                console.warn('WhatsApp gateway dispatch error:', e);
            }
        }

        window.cart.length = 0;
        saveCartState();
        closeCheckoutPage();
        
        // Directly trigger Live Razorpay Official UPI & Cards Gateway
        if (window.Razorpay) {
            triggerRazorpayCheckout();
        } else {
            openPaymentModal();
        }
        return false;
    }

    function triggerRazorpayCheckout(customAmount) {
        const subtotal = calculateSubtotal();
        const discount = activeCoupon ? (activeCoupon.discountType === 'percent' ? (subtotal * activeCoupon.value / 100) : activeCoupon.value) : 0;
        let finalTotal = customAmount || Math.max(0, subtotal - discount);
        if (finalTotal === 0 && lastCreatedOrderObj && lastCreatedOrderObj.total) {
            finalTotal = lastCreatedOrderObj.total;
        }
        if (finalTotal === 0 && window.lastCreatedOrder && window.lastCreatedOrder.total) {
            finalTotal = window.lastCreatedOrder.total;
        }
        if (finalTotal === 0) finalTotal = 499;

        const amountInPaise = Math.round(finalTotal * 100);
        const orderRef = (lastCreatedOrderId || (lastCreatedOrderObj && lastCreatedOrderObj.id) || 'TAS' + Math.floor(10000 + Math.random() * 90000));
        const custName = (lastCreatedOrderObj && lastCreatedOrderObj.customerName) || (safeGet('chk-cust-name') && safeGet('chk-cust-name').value) || (window.userAuth && window.userAuth.name) || 'Customer';
        
        let rawPhone = (lastCreatedOrderObj && lastCreatedOrderObj.phone) || (safeGet('chk-cust-phone') && safeGet('chk-cust-phone').value) || (window.userAuth && window.userAuth.phone) || '9772259583';
        let cleanPhone = rawPhone.replace(/\D/g, '');
        if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
            cleanPhone = cleanPhone.substring(1);
        } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
            cleanPhone = cleanPhone.substring(2);
        }
        if (cleanPhone.length !== 10) {
            cleanPhone = '9772259583';
        }

        const custEmail = (window.userAuth && window.userAuth.email) || 'customer@tasviir.in';
        const razorpayKey = window.RAZORPAY_KEY_ID || localStorage.getItem('tasveer_razorpay_key') || 'rzp_live_TRFmjNYX9knTwo';

        if (window.Razorpay) {
            try {
                const options = {
                    key: razorpayKey,
                    amount: amountInPaise,
                    currency: 'INR',
                    name: 'Tasveer by Prince Studio',
                    description: 'Order #' + orderRef,
                    image: 'hero-poster.png',
                    notes: {
                        order_id: orderRef,
                        customer_name: custName,
                        phone: cleanPhone,
                        address: (lastCreatedOrderObj && lastCreatedOrderObj.address) || ''
                    },
                    handler: function (response) {
                        console.log('✅ Razorpay Payment Success:', response);
                        const paymentId = response.razorpay_payment_id;
                        if (window.showToast) window.showToast('🎉 Payment Successful! ID: ' + paymentId);
                        
                        // 1. Update In-Memory Order Objects
                        if (lastCreatedOrderObj) {
                            lastCreatedOrderObj.paymentStatus = 'PAID';
                            lastCreatedOrderObj.paymentId = paymentId;
                            lastCreatedOrderObj.status = 'Confirmed';
                        }
                        if (window.lastCreatedOrder) {
                            window.lastCreatedOrder.paymentStatus = 'PAID';
                            window.lastCreatedOrder.paymentId = paymentId;
                            window.lastCreatedOrder.status = 'Confirmed';
                        }

                        // 2. Persist PAID status immediately to LocalStorage & Firebase Firestore!
                        try {
                            let orders = JSON.parse(safeStorage.getItem('tasveer_orders') || '[]');
                            const targetId = (lastCreatedOrderObj && lastCreatedOrderObj.id) || (window.lastCreatedOrder && window.lastCreatedOrder.id);
                            orders = orders.map(o => {
                                if (o.id === targetId || o.orderId === targetId) {
                                    return { ...o, paymentStatus: 'PAID', paymentId: paymentId, status: 'Confirmed' };
                                }
                                return o;
                            });
                            safeStorage.setItem('tasveer_orders', JSON.stringify(orders));
                            window.masterOrders = orders;
                            window.orders = orders;

                            if (window.CloudDB && window.CloudDB.pushUpdate) {
                                window.CloudDB.pushUpdate('orders', orders);
                            }
                            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
                                firebase.firestore().collection('tasveer_store').doc('orders').set({
                                    items: orders,
                                    updatedAt: new Date().toISOString()
                                }, { merge: true }).catch(() => {});
                            }
                        } catch(err) {
                            console.warn('Payment status persistence error:', err);
                        }

                        closePaymentModal();
                        showOrderConfirmedModal(lastCreatedOrderObj);

                        // 3. Dispatch Updated Automated WhatsApp Confirmation
                        if (window.WhatsAppGateway) {
                            try {
                                window.WhatsAppGateway.dispatchOrderNotifications({
                                    ...lastCreatedOrderObj,
                                    paymentStatus: 'PAID',
                                    paymentId: paymentId
                                });
                            } catch(e) {}
                        }
                    },
                    prefill: {
                        name: custName,
                        contact: cleanPhone,
                        email: custEmail
                    },
                    theme: {
                        color: '#d97706'
                    },
                    modal: {
                        ondismiss: function() {
                            openPaymentModal();
                        }
                    }
                };

                const rzp = new window.Razorpay(options);
                rzp.on('payment.failed', function (resp){
                    if (window.showToast) window.showToast('⚠️ Razorpay test mode: Please scan the QR code to pay with PhonePe/GPay', 'info');
                    openPaymentModal();
                });
                rzp.open();
            } catch(e) {
                console.warn('Razorpay init fallback:', e);
                openPaymentModal();
            }
        } else {
            openPaymentModal();
        }
    }

    function showOrderConfirmedModal(orderObj) {
        const ord = orderObj || lastCreatedOrderObj || { id: 'TAS-90812', customerName: 'Customer', address: 'Sawai Madhopur', total: 499 };
        lastCreatedOrderObj = ord;
        window.lastCreatedOrder = ord;
        
        const idEl = safeGet('conf-order-id');
        const addrEl = safeGet('conf-order-address');
        const totalEl = safeGet('conf-order-total');
        const upiBtnPriceEl = safeGet('conf-upi-btn-price');
        const dateEl = safeGet('conf-delivery-date');

        if (idEl) idEl.innerText = ord.id;
        if (addrEl) addrEl.innerText = `${ord.address} (${ord.pincode || '322001'})`;
        if (totalEl) totalEl.innerText = `₹${ord.total}`;
        if (upiBtnPriceEl) upiBtnPriceEl.innerText = `₹${ord.total}`;

        const isPaid = (ord.paymentStatus === 'PAID') || (ord.paymentId && ord.paymentId.startsWith('pay_'));
        const payStatusEl = safeGet('conf-payment-status');
        if (payStatusEl) {
            if (isPaid) {
                payStatusEl.innerHTML = `<span style="color:#059669; font-weight:800;"><i class="fas fa-check-circle"></i> PAID ONLINE (${ord.paymentId || 'Verified'})</span>`;
            } else {
                payStatusEl.innerHTML = `<span style="color:#d97706; font-weight:800;"><i class="fas fa-clock"></i> PENDING (Awaiting Payment / COD)</span>`;
            }
        }

        // Hide "Pay via Instant UPI QR" button if payment is ALREADY COMPLETED!
        const upiPayBtn = safeGet('conf-upi-pay-btn');
        if (upiPayBtn) {
            upiPayBtn.style.display = isPaid ? 'none' : 'flex';
        }

        const estDate = new Date();
        estDate.setDate(estDate.getDate() + (ord.pincode && ord.pincode.startsWith('322') ? 2 : 4));
        if (dateEl) dateEl.innerText = estDate.toDateString();

        const modal = safeGet('order-confirm-modal-overlay');
        if (modal) {
            modal.classList.add('open');
            modal.style.display = 'flex';
        }
    }

    function closeOrderConfirmedModal() {
        const modal = safeGet('order-confirm-modal-overlay');
        if (modal) {
            modal.classList.remove('open');
            modal.style.display = 'none';
        }
    }

    function openPaymentModalFromOrder() {
        closeOrderConfirmedModal();
        triggerRazorpayCheckout();
    }

    function openPaymentModal() {
        const subtotal = calculateSubtotal();
        const discount = activeCoupon ? (activeCoupon.discountType === 'percent' ? (subtotal * activeCoupon.value / 100) : activeCoupon.value) : 0;
        let finalTotal = Math.max(0, subtotal - discount);
        if (finalTotal === 0 && lastCreatedOrderObj && lastCreatedOrderObj.total) {
            finalTotal = lastCreatedOrderObj.total;
        }
        if (finalTotal === 0 && window.lastCreatedOrder && window.lastCreatedOrder.total) {
            finalTotal = window.lastCreatedOrder.total;
        }
        if (finalTotal === 0 && window.cart && window.cart.length > 0) {
            finalTotal = window.cart.reduce((sum, i) => sum + ((i.price || 499) * (i.qty || 1)), 0);
        }
        if (finalTotal === 0) finalTotal = 499;

        const totalEl = safeGet('upi-total-amount');
        if (totalEl) totalEl.innerText = `₹${finalTotal}`;

        const cleanAmount = (finalTotal % 1 === 0) ? finalTotal.toString() : finalTotal.toFixed(2);
        const upiId = 'Q90009203@ybl';
        const storeName = 'PrinceStudio';

        const universalUpiUrl = `upi://pay?pa=${upiId}&pn=${storeName}&am=${cleanAmount}&cu=INR`;

        const qrImg = safeGet('upi-qr-image');
        if (qrImg) {
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(universalUpiUrl)}`;
            qrImg.onerror = function() {
                this.src = `https://quickchart.io/qr?size=300&text=${encodeURIComponent(universalUpiUrl)}`;
            };
        }

        const modal = safeGet('payment-modal-overlay');
        if (modal) {
            modal.classList.add('open');
            modal.style.cssText = [
                'display:flex !important',
                'opacity:1 !important',
                'visibility:visible !important',
                'pointer-events:auto !important',
                'z-index:200000 !important',
                'position:fixed !important',
                'top:0 !important',
                'left:0 !important',
                'width:100% !important',
                'height:100% !important',
                'background:rgba(0,0,0,0.85) !important',
                'align-items:center !important',
                'justify-content:center !important'
            ].join(';');
        }
    }

    function triggerDirectUpiPayment(app) {
        const subtotal = calculateSubtotal();
        const discount = activeCoupon ? (activeCoupon.discountType === 'percent' ? (subtotal * activeCoupon.value / 100) : activeCoupon.value) : 0;
        let amount = Math.max(0, subtotal - discount);
        if (amount === 0 && lastCreatedOrderObj && lastCreatedOrderObj.total) {
            amount = lastCreatedOrderObj.total;
        }
        if (amount === 0 && window.lastCreatedOrder && window.lastCreatedOrder.total) {
            amount = window.lastCreatedOrder.total;
        }
        if (amount === 0) amount = 499;

        const cleanAmount = (amount % 1 === 0) ? amount.toString() : amount.toFixed(2);
        const orderRef = (lastCreatedOrderId || 'TAS' + Math.floor(10000 + Math.random() * 90000));
        const upiId = 'Q90009203@ybl';
        const storeName = 'PrinceStudio';

        const universalUri = `upi://pay?pa=${upiId}&pn=${storeName}&mc=5999&tr=${orderRef}&tn=Order${orderRef}&am=${cleanAmount}&cu=INR`;

        // Automatically copy UPI ID to clipboard as instant fallback
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(upiId).catch(() => {});
        }

        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobile) {
            if (window.showToast) window.showToast(`🚀 Opening UPI Payment (₹${cleanAmount})... Select PhonePe / Google Pay / Paytm!`);
            
            try {
                window.location.href = universalUri;
            } catch(e) {
                const link = document.createElement('a');
                link.href = universalUri;
                link.target = '_self';
                document.body.appendChild(link);
                link.click();
                setTimeout(() => {
                    try { document.body.removeChild(link); } catch(err) {}
                }, 300);
            }
        } else {
            if (window.showToast) window.showToast(`📱 On PC/Laptop: Please scan the QR code below on your phone with PhonePe, Google Pay, or Paytm!`, 'info');
            const qrBox = document.querySelector('.upi-qr-box');
            if (qrBox) {
                qrBox.style.transition = 'transform 0.2s, box-shadow 0.2s';
                qrBox.style.transform = 'scale(1.04)';
                qrBox.style.boxShadow = '0 0 25px rgba(217, 119, 6, 0.5)';
                setTimeout(() => {
                    qrBox.style.transform = 'scale(1)';
                    qrBox.style.boxShadow = '';
                }, 600);
            }
        }
    }

    function copyUpiId() {
        const upi = 'Q90009203@ybl';
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(upi).then(() => {
                if (window.showToast) window.showToast('✅ UPI ID Copied: ' + upi + ' (Paste in any UPI App to Pay)');
            }).catch(() => {
                prompt('Copy Prince Studio UPI ID:', upi);
            });
        } else {
            prompt('Copy Prince Studio UPI ID:', upi);
        }
    }

    function downloadUpiQrImage() {
        const qrImg = safeGet('upi-qr-image');
        if (!qrImg || !qrImg.src) {
            if (window.showToast) window.showToast('QR Code not ready yet!', 'warn');
            return;
        }
        const a = document.createElement('a');
        a.href = qrImg.src;
        a.download = `Tasveer_UPI_QR_Q90009203.png`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            try { document.body.removeChild(a); } catch(e) {}
        }, 300);
        if (window.showToast) window.showToast('📸 QR Code Image Saved! Open PhonePe ➔ Tap Scanner ➔ Scan from Gallery! 🎉');
    }

    function redirectToWhatsAppOrder(isPaidParam, paymentIdParam) {
        const ord = lastCreatedOrderObj || window.lastCreatedOrder || { id: 'TAS-' + Math.floor(10000 + Math.random() * 90000), total: 499, customerName: 'Customer' };
        const isPaid = isPaidParam || (ord.paymentStatus === 'PAID') || (ord.paymentId && ord.paymentId.startsWith('pay_'));
        const payId = paymentIdParam || ord.paymentId || (isPaid ? 'PAID-ONLINE' : 'UPI-QR-PENDING');
        const statusText = isPaid ? '✅ PAID (Razorpay Online Transfer)' : '⏳ PENDING (Awaiting QR Scan / Confirmation)';

        const name = ord.customerName || (safeGet('chk-cust-name') && safeGet('chk-cust-name').value) || (safeGet('cust-name') && safeGet('cust-name').value) || (window.userAuth && window.userAuth.name) || 'Valued Customer';
        const phone = ord.phone || (safeGet('chk-cust-phone') && safeGet('chk-cust-phone').value) || (safeGet('cust-phone') && safeGet('cust-phone').value) || (window.userAuth && window.userAuth.phone) || '+91 98290 12345';
        const address = ord.address || (safeGet('chk-cust-address') && safeGet('chk-cust-address').value) || (safeGet('cust-address') && safeGet('cust-address').value) || 'Sawai Madhopur';
        const items = (ord.items && ord.items.length > 0) ? ord.items.map((i, idx) => `  ${idx + 1}. ${i.title || 'Photo Frame'} (x${i.qty || 1}) - ₹${(i.price || 499) * (i.qty || 1)}`).join('\n') : `  1. Custom Photo Frame (x1) - ₹${ord.total || 499}`;

        const msg = [
            `🎉 *ORDER CONFIRMATION - TASVEER BY PRINCE STUDIO* 🎉`,
            ``,
            `Hello Prince Studio Team, I have placed an order on your website!`,
            ``,
            `📦 *Order ID:* ${ord.id}`,
            `👤 *Customer Name:* ${name}`,
            `📞 *Phone:* ${phone}`,
            `📍 *Delivery Address:* ${address} (${ord.pincode || '322001'})`,
            ``,
            `🖼️ *Items Ordered:*`,
            items,
            ``,
            `💰 *Total Amount:* ₹${ord.total || 499}`,
            `💳 *Payment Status:* ${statusText}`,
            `🧾 *Payment / Reference ID:* ${payId}`,
            ``,
            `🚚 *Estimated Dispatch:* 24-48 Hours`,
            ``,
            `Please confirm my order and share printing/dispatch updates! 🙏✨`
        ].join('\n');

        const whatsappUrl = `https://wa.me/917231900124?text=${encodeURIComponent(msg)}`;
        
        try {
            window.open(whatsappUrl, '_blank');
        } catch(e) {
            window.location.href = whatsappUrl;
        }

        if (window.showToast) window.showToast('💬 Opening WhatsApp Order Receipt for ' + ord.id);
    }

    function checkoutWhatsApp() {
        if (!cart || cart.length === 0) {
            if (window.showToast) window.showToast('Cart is empty!', 'warn');
            return;
        }

        const name = safeGet('chk-cust-name')?.value || 'Valued Customer';
        const address = safeGet('chk-cust-address')?.value || 'Sawai Madhopur';
        const phone = safeGet('chk-cust-phone')?.value || '+91 98290 12345';
        const subtotal = calculateSubtotal();

        let itemsText = cart.map((i, idx) => `${idx + 1}. ${i.title} (x${i.qty}) - ₹${i.price * i.qty}`).join('\n');
        const text = encodeURIComponent(`*NEW CUSTOMER ORDER - Tasveer by Prince Studio*\n\n*Name:* ${name}\n*Phone:* ${phone}\n*Address:* ${address}\n\n*Order Items:*\n${itemsText}\n\n*Total Price:* ₹${subtotal}\n\nPlease confirm my order and share dispatch updates!`);

        window.open(`https://wa.me/917231900124?text=${text}`, '_blank');
        if (window.showToast) window.showToast('Order Sent to WhatsApp!');
        window.cart.length = 0;
        saveCartState();
        closePaymentModal();
        closeCartDrawer();
    }

    function openPaymentModalFromOrder() {
        closeOrderConfirmedModal();
        triggerRazorpayCheckout();
    }

    function closePaymentModal() {
        const modal = safeGet('payment-modal-overlay');
        if (modal) {
            modal.classList.remove('open');
            modal.style.cssText = '';
            modal.style.display = 'none';
        }
    }

    function openTrackOrderModalFromConfirmation() {
        closeOrderConfirmedModal();
        if (window.openTrackOrderModal) window.openTrackOrderModal(lastCreatedOrderId);
    }

    // Expose to Window
    window.cart = cart;
    window.wishlist = wishlist;
    window.openCartDrawer = openCartDrawer;
    window.closeCartDrawer = closeCartDrawer;
    window.openWishlistDrawer = openWishlistDrawer;
    window.closeWishlistDrawer = closeWishlistDrawer;
    window.addToCart = addToCart;
    window.buyNow = buyNow;
    window.addCustomItemToCart = addCustomItemToCart;
    window.toggleWishlist = toggleWishlist;
    window.updateCartQty = updateCartQty;
    window.applyCoupon = applyCoupon;
    window.openPaymentModal = openPaymentModal;
    window.closePaymentModal = closePaymentModal;
    window.triggerRazorpayCheckout = triggerRazorpayCheckout;
    window.triggerDirectUpiPayment = triggerDirectUpiPayment;
    window.downloadUpiQrImage = downloadUpiQrImage;
    window.checkoutWhatsApp = checkoutWhatsApp;
    window.updateCartBadgeCount = updateCartBadgeCount;
    window.saveCartState = saveCartState;
    window.selectPaymentMethod = selectPaymentMethod;
    window.openCheckoutPage = openCheckoutPage;
    window.closeCheckoutPage = closeCheckoutPage;
    window.checkCheckoutPincode = checkCheckoutPincode;
    window.submitCheckoutOrder = submitCheckoutOrder;
    window.showOrderConfirmedModal = showOrderConfirmedModal;
    window.closeOrderConfirmedModal = closeOrderConfirmedModal;
    window.copyUpiId = copyUpiId;
    window.redirectToWhatsAppOrder = redirectToWhatsAppOrder;
    window.openPaymentModalFromOrder = openPaymentModalFromOrder;
    window.openTrackOrderModalFromConfirmation = openTrackOrderModalFromConfirmation;
    window.sanitizeCartItemForStorage = sanitizeCartItemForStorage;

})(window, document);
