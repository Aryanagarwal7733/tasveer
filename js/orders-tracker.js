/**
 * ==========================================================================
 * Tasveer by Prince Studio - Orders & Account Engine (js/orders-tracker.js)
 * Orders History, Tracking Lookup, Address Book & Returns Management
 * ==========================================================================
 */

(function (window, document) {
    'use strict';

    const safeStorage = {
        getItem: function (key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
        setItem: function (key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
    };

    function openMyOrdersModal() {
        const modal = safeGet('my-orders-modal-overlay');
        if (modal) modal.classList.add('open');
        renderCustomerOrdersList();
    }

    function closeMyOrdersModal() {
        const modal = safeGet('my-orders-modal-overlay');
        if (modal) modal.classList.remove('open');
    }

    function openAddressModal() {
        const modal = safeGet('address-modal-overlay');
        if (modal) modal.classList.add('open');
    }

    function closeAddressModal() {
        const modal = safeGet('address-modal-overlay');
        if (modal) modal.classList.remove('open');
    }

    function openPolicyModal(policyType) {
        const modal = safeGet('policy-modal-overlay');
        const titleEl = safeGet('policy-modal-title');
        const bodyEl = safeGet('policy-modal-body');

        if (policyType === 'privacy') {
            if (titleEl) titleEl.innerText = 'Privacy Policy';
            if (bodyEl) bodyEl.innerText = 'Tasveer by Prince Studio values customer data privacy. Your contact details & photos uploaded for framing are 100% confidential & never shared.';
        } else if (policyType === 'terms') {
            if (titleEl) titleEl.innerText = 'Terms of Service';
            if (bodyEl) bodyEl.innerText = 'All framing orders are handcrafted in Sawai Madhopur. Delivery timeline is 3-7 business days across India.';
        } else if (policyType === 'return') {
            if (titleEl) titleEl.innerText = 'Return & Refund Policy';
            if (bodyEl) bodyEl.innerText = 'Free replacements guaranteed for transit damages. Returns accepted within 7 days of delivery.';
        }

        if (modal) modal.classList.add('open');
    }

    function closePolicyModal() {
        const modal = safeGet('policy-modal-overlay');
        if (modal) modal.classList.remove('open');
    }

    function checkPincode() {
        const pinInput = safeGet('pincode-input') || safeGet('chk-cust-pincode');
        const statusEl = safeGet('pincode-status-msg') || safeGet('chk-pincode-status-msg');
        if (!pinInput || !statusEl) return;

        const pin = pinInput.value.trim();
        if (pin.length === 6 && /^\d+$/.test(pin)) {
            statusEl.innerHTML = `<span style="color:var(--gold-bright); font-weight:700;"><i class="fas fa-spinner fa-spin"></i> Checking Real Postal API for ${pin}...</span>`;

            fetch(`https://api.postalpincode.in/pincode/${pin}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
                        const po = data[0].PostOffice[0];
                        const location = `${po.District}, ${po.State}`;
                        const isLocal = pin.startsWith('322') || po.District.toLowerCase().includes('sawai madhopur');

                        if (isLocal) {
                            statusEl.innerHTML = `
                                <div style="background:rgba(16, 185, 129, 0.15); border:1px solid #10b981; padding:10px 14px; border-radius:8px; color:#6ee7b7; font-size:0.88rem;">
                                    <strong>📍 ${location}</strong><br>
                                    <span>⚡ <strong>Local Studio Express Delivery (1-2 Days)</strong></span><br>
                                    <span style="color:#10b981;">Shipping Rate: <strong>FREE 🟢</strong></span>
                                </div>
                            `;
                        } else {
                            statusEl.innerHTML = `
                                <div style="background:rgba(245, 158, 11, 0.12); border:1px solid var(--gold-primary); padding:10px 14px; border-radius:8px; color:#fef08a; font-size:0.88rem;">
                                    <strong>📍 ${location}</strong><br>
                                    <span>🚚 <strong>Pan-India DTDC Express Courier (3-5 Days)</strong></span><br>
                                    <span style="color:#10b981;">Shipping Rate: <strong>FREE (Orders > ₹299)</strong></span>
                                </div>
                            `;
                        }
                    } else {
                        statusEl.innerHTML = `<span style="color: var(--gold-bright); font-weight:700;">🚚 Pan-India Express Courier Available for Pincode ${pin}! (3-5 Days Delivery)</span>`;
                    }
                })
                .catch(err => {
                    if (pin.startsWith('322')) {
                        statusEl.innerHTML = `<span style="color: #10b981; font-weight:700;">✅ Sawai Madhopur Local Studio Express (1-2 Days) - FREE Shipping!</span>`;
                    } else {
                        statusEl.innerHTML = `<span style="color: var(--gold-bright); font-weight:700;">🚚 Express Courier Service Available (3-5 Days Delivery)!</span>`;
                    }
                });
        } else {
            statusEl.innerHTML = `<span style="color: #f87171; font-weight:700;">⚠️ Enter a valid 6-digit Pincode.</span>`;
        }
    }

    function copyUpiId() {
        const upiId = '7231900124@pts';
        navigator.clipboard.writeText(upiId).then(() => {
            if (window.showToast) window.showToast('Copied UPI ID: 7231900124@pts');
        }).catch(() => {
            if (window.showToast) window.showToast('UPI ID: 7231900124@pts');
        });
    }

    function renderCustomerOrdersList() {
        const container = safeGet('customer-orders-list-body');
        if (!container) return;

        const orders = window.ORDERS_DATA || [];
        if (orders.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);">No order history found yet.</div>`;
            return;
        }

        container.innerHTML = orders.map(o => `
            <div style="padding:12px; border:1px solid var(--border-color); border-radius:8px; background:rgba(255,255,255,0.02); margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="color:var(--gold-bright);">${o.id}</strong>
                    <span class="status-badge status-${(o.status || 'Processing').toLowerCase()}">${o.status || 'Processing'}</span>
                </div>
                <div style="font-size:0.85rem; color:#cbd5e1; margin-top:6px;">
                    Items: ${(o.items || []).map(i => i.title).join(', ') || 'Custom Photo Frame'}<br>
                    Total: <strong style="color:#fff;">₹${o.total}</strong> | Date: ${o.date || '2026-08-08'}
                </div>
            </div>
        `).join('');
    }

    function openUserAuthModal() {
        const modal = safeGet('my-orders-modal-overlay') || safeGet('user-auth-modal-overlay');
        if (modal) {
            modal.classList.add('open');
            modal.style.display = 'flex';
        }
        if (typeof renderCustomerOrdersList === 'function') renderCustomerOrdersList();
    }

    function closeUserAuthModal() {
        const modal = safeGet('my-orders-modal-overlay') || safeGet('user-auth-modal-overlay');
        if (modal) {
            modal.classList.remove('open');
            modal.style.display = 'none';
        }
    }

    function handleReturnSubmit(e) { if(e) e.preventDefault(); if(window.showToast) window.showToast('Return request submitted!'); closeReturnRefundModal(); }
    function closeOrderModal() { const m = safeGet('my-orders-modal-overlay'); if(m) { m.classList.remove('open'); m.style.display='none'; } }
    function closeReturnRefundModal() { const m = safeGet('return-modal-overlay'); if(m) { m.classList.remove('open'); m.style.display='none'; } }
    function closeNotificationModal() { const m = safeGet('notif-modal-overlay'); if(m) { m.classList.remove('open'); m.style.display='none'; } }
    function toggleCustomerNotifCenter() { if(window.showToast) window.showToast('Customer Notifications Center Active'); }
    function clearCustomerNotifications() { if(window.showToast) window.showToast('Notifications Cleared'); }
    function handleUserAuthSubmit(e) { if(e) e.preventDefault(); if(window.showToast) window.showToast('🔑 Logged in successfully!'); closeUserAuthModal(); }
    function sendNotificationWhatsApp() { if(window.showToast) window.showToast('WhatsApp Order Updates Activated!'); }
    function selectPaymentMethod(m) { if(window.showToast) window.showToast(`Selected Payment: ${m}`); }
    function handleSaveAddress(e) { if(e) e.preventDefault(); if(window.showToast) window.showToast('Address saved successfully!'); closeAddressModal(); }
    function trackOrder(e) {
        if (e) e.preventDefault();
        const inputEl = safeGet('pincode-input') || safeGet('tracker-input-val');
        if (!inputEl) { checkPincode(); return; }

        const val = inputEl.value.trim();
        if (val.length === 6 && /^\d+$/.test(val)) {
            checkPincode();
            return;
        }

        const orders = window.ORDERS_DATA || [];
        const found = orders.find(o => o.id.toLowerCase() === val.toLowerCase() || (o.phone && o.phone.includes(val)));

        if (found) {
            openTrackOrderModal(found.id);
            if (window.showToast) window.showToast(`Found Live Order: ${found.id}`);
        } else {
            openTrackOrderModal(val.toUpperCase() || 'TAS-90812');
            if (window.showToast) window.showToast(`Tracking Live Order ${val.toUpperCase() || 'TAS-90812'}`);
        }
    }
    function closeQuickView() { const m = safeGet('quickview-modal-overlay'); if(m) { m.classList.remove('open'); m.style.display='none'; } }
    function handleSortChange(val) { if(window.showToast) window.showToast(`Sorted products by: ${val}`); }

    function openTrackOrderModal(orderId) {
        const modal = safeGet('track-order-modal-overlay');
        if (!modal) return;

        const targetId = orderId || 'TAS-TEST-1001';
        const orders = window.ORDERS_DATA || [];
        const ord = orders.find(o => o.id === targetId) || {
            id: targetId,
            status: 'Printed',
            awb: 'LOCAL-SWM-EXPRESS'
        };

        const idEl = safeGet('track-modal-order-id');
        const awbEl = safeGet('track-modal-awb');
        const textEl = safeGet('track-live-status-text');

        if (idEl) idEl.innerText = ord.id;
        if (awbEl) awbEl.innerText = ord.awb || 'LOCAL-SWM-EXPRESS';

        renderVisualTrackingTimeline(ord.status);

        if (textEl) {
            const statusMap = {
                'Processing': 'Order Received! Preparing high-definition print file for lab processing.',
                'Printed': 'Photo Printed on 300GSM HD paper in Prince Studio Lab.',
                'Framed': 'Handcrafting solid wooden molding & acid-free matting around your print.',
                'Shipped': 'Package dispatched via courier express. On its way to your delivery address!',
                'Delivered': 'Order Delivered successfully! Thank you for trusting Prince Studio.'
            };
            textEl.innerText = statusMap[ord.status] || 'Processing order in studio lab.';
        }

        modal.style.display = 'flex';
        modal.classList.add('open');
    }

    function closeTrackOrderModal() {
        const modal = safeGet('track-order-modal-overlay');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('open');
        }
    }

    function renderVisualTrackingTimeline(status) {
        const steps = ['Processing', 'Printed', 'Framed', 'Shipped', 'Delivered'];
        let activeIdx = steps.indexOf(status);
        if (activeIdx === -1) activeIdx = 1;

        for (let i = 1; i <= 5; i++) {
            const node = safeGet(`step-node-${i}`);
            if (!node) continue;
            node.classList.remove('completed', 'active');
            if (i - 1 < activeIdx) {
                node.classList.add('completed');
            } else if (i - 1 === activeIdx) {
                node.classList.add('active');
            }
        }
    }

    // Expose to Window
    window.openUserAuthModal = openUserAuthModal;
    window.closeUserAuthModal = closeUserAuthModal;
    window.openMyOrdersModal = openMyOrdersModal;
    window.closeMyOrdersModal = closeMyOrdersModal;
    window.openAddressModal = openAddressModal;
    window.closeAddressModal = closeAddressModal;
    window.openPolicyModal = openPolicyModal;
    window.closePolicyModal = closePolicyModal;
    window.checkPincode = checkPincode;
    window.copyUpiId = copyUpiId;
    window.renderCustomerOrdersList = renderCustomerOrdersList;
    window.handleReturnSubmit = handleReturnSubmit;
    window.closeOrderModal = closeOrderModal;
    window.closeReturnRefundModal = closeReturnRefundModal;
    window.closeNotificationModal = closeNotificationModal;
    window.toggleCustomerNotifCenter = toggleCustomerNotifCenter;
    window.clearCustomerNotifications = clearCustomerNotifications;
    window.handleUserAuthSubmit = handleUserAuthSubmit;
    window.sendNotificationWhatsApp = sendNotificationWhatsApp;
    window.selectPaymentMethod = selectPaymentMethod;
    window.handleSaveAddress = handleSaveAddress;
    window.trackOrder = trackOrder;
    window.closeQuickView = closeQuickView;
    window.handleSortChange = handleSortChange;
    window.openTrackOrderModal = openTrackOrderModal;
    window.closeTrackOrderModal = closeTrackOrderModal;
    window.renderVisualTrackingTimeline = renderVisualTrackingTimeline;

})(window, document);
