/**
 * ==========================================================================
 * Tasveer by Prince Studio - Admin Orders & Shipping Module (js/admin-orders.js)
 * Orders Queue, HD Photo Download, WhatsApp Soft-Proof & Printable Shipping Labels
 * ==========================================================================
 */

(function (window, document) {
    'use strict';

    const safeStorage = {
        getItem: function (key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
        setItem: function (key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
    };

    function getDeletedOrderIds() {
        try {
            const raw = safeStorage.getItem('tasveer_deleted_order_ids');
            return raw ? JSON.parse(raw) : [];
        } catch(e) {
            return [];
        }
    }

    function addDeletedOrderIds(ids) {
        if (!Array.isArray(ids) || ids.length === 0) return;
        try {
            const current = getDeletedOrderIds();
            const set = new Set([...current, ...ids]);
            const updated = Array.from(set);
            safeStorage.setItem('tasveer_deleted_order_ids', JSON.stringify(updated));
            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
                firebase.firestore().collection('tasveer_store').doc('deleted_orders').set({
                    ids: updated,
                    updatedAt: new Date().toISOString()
                }, { merge: true }).catch(() => {});
            }
        } catch(e) {}
    }

    function getOrdersArray() {
        const deletedIds = getDeletedOrderIds();
        let list = null;
        try {
            const saved = JSON.parse(safeStorage.getItem('tasveer_orders'));
            if (Array.isArray(saved)) list = saved;
        } catch(e) {}

        if (!list && window.CloudDB) {
            const cloud = window.CloudDB.getCollection('orders');
            if (Array.isArray(cloud)) list = cloud;
        }

        if (!list && window.masterOrders && Array.isArray(window.masterOrders)) {
            list = window.masterOrders;
        }

        if (!list) {
            list = [];
        }

        // Strictly filter out any deleted orders so they NEVER reappear!
        list = list.filter(o => o && o.id && !deletedIds.includes(o.id) && !o.isDeleted);

        window.masterOrders = list;
        window.orders = list;
        return list;
    }

    let orders = getOrdersArray();

    function renderOrdersTable() {
        const tbody = safeGet('orders-tbody');
        if (!tbody) return;

        orders = getOrdersArray();
        const activeOrders = orders;

        if (activeOrders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:#94a3b8;font-size:0.95rem;"><i class="fas fa-inbox" style="font-size:1.6rem;margin-bottom:8px;display:block;color:#475569;"></i>No customer orders in queue. Queue is clean! ✨</td></tr>`;
            updateSelectedOrdersCount();
            return;
        }

        tbody.innerHTML = activeOrders.map(o => {
            const photoBtn = o.photoUrl ? `
                <a href="${o.photoUrl}" target="_blank" download class="btn-sm btn-outline" title="Download HD Customer Photo" style="color:var(--gold-bright); border-color:var(--gold-primary); display:inline-flex; align-items:center; gap:4px; margin-top:4px;">
                    <i class="fas fa-download"></i> HD Photo
                </a>
            ` : `<span style="font-size:0.75rem; color:#64748b;">No Photo</span>`;

            const isPaid = (o.paymentStatus === 'PAID' || o.paymentStatus === 'SUCCESS' || (o.paymentId && o.paymentId.startsWith('pay_')));
            const paymentBadge = isPaid ? `
                <span class="badge" style="background:#059669; color:#ffffff; padding:4px 8px; border-radius:6px; font-weight:800; font-size:0.75rem; display:inline-flex; align-items:center; gap:4px; box-shadow:0 2px 6px rgba(5,150,105,0.3);">
                    <i class="fas fa-check-circle"></i> PAID
                </span>
                <div style="font-size:0.72rem; color:#34d399; font-family:monospace; margin-top:3px; word-break:break-all;" title="Payment ID">
                    ${o.paymentId || 'UPI Direct / Online'}
                </div>
            ` : `
                <span class="badge" style="background:#d97706; color:#ffffff; padding:4px 8px; border-radius:6px; font-weight:800; font-size:0.75rem; display:inline-flex; align-items:center; gap:4px; box-shadow:0 2px 6px rgba(217,119,6,0.3);">
                    <i class="fas fa-clock"></i> PENDING
                </span>
                <div style="margin-top:4px;">
                    <button class="btn-sm" onclick="toggleOrderPaymentStatus('${o.id}')" style="background:rgba(255,255,255,0.1); border:1px solid #94a3b8; color:#cbd5e1; font-size:0.68rem; padding:2px 6px; border-radius:4px; cursor:pointer;" title="Mark as Paid">
                        ✓ Mark Paid
                    </button>
                </div>
            `;

            return `
                <tr id="order-row-${o.id}">
                    <td style="text-align:center;">
                        <input type="checkbox" class="order-select-chk" value="${o.id}" onchange="updateSelectedOrdersCount()" style="width:17px; height:17px; cursor:pointer; accent-color:#f59e0b;">
                    </td>
                    <td>
                        <strong style="color:var(--gold-bright); font-size:0.95rem;">${o.id}</strong><br>
                        <small style="color:#64748b;">${o.awb || 'EXPRESS'}</small>
                    </td>
                    <td>
                        <strong style="color:#ffffff;">${o.customerName || 'Valued Customer'}</strong><br>
                        <a href="tel:${o.phone || ''}" style="color:#38bdf8; font-size:0.82rem; text-decoration:none;"><i class="fas fa-phone-alt" style="font-size:0.75rem;"></i> ${o.phone || 'No Phone'}</a><br>
                        <small style="color:#94a3b8; font-size:0.75rem;">${o.address || 'Sawai Madhopur'} (${o.pincode || '322001'})</small>
                    </td>
                    <td><span style="color:#cbd5e1; font-size:0.85rem;">${o.date || '2026-08-16'}</span></td>
                    <td><strong style="color:#fef08a; font-size:1rem;">₹${o.total || 499}</strong></td>
                    <td>${paymentBadge}</td>
                    <td>
                        <select onchange="updateOrderStatus('${o.id}', this.value)" class="status-select" style="background:#1e293b; color:#ffffff; border:1px solid #475569; padding:4px 8px; border-radius:6px; font-weight:700; font-size:0.8rem;">
                            <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>Processing</option>
                            <option value="Printed" ${o.status === 'Printed' ? 'selected' : ''}>Lab Printed</option>
                            <option value="Framed" ${o.status === 'Framed' ? 'selected' : ''}>Framed</option>
                            <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                            <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                            <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </td>
                    <td>
                        <div style="font-size:0.8rem; color:#cbd5e1;">${(o.items || []).map(i => `${i.title || 'Frame'} (x${i.qty || 1})`).join(', ') || 'Custom Frame'}</div>
                        ${photoBtn}
                    </td>
                    <td>
                        <div style="display:flex; gap:6px;">
                            <button class="btn-sm btn-outline" onclick="sendWhatsAppSoftProof('${o.id}')" title="Send WhatsApp Soft-Proof Preview" style="color:var(--whatsapp-color, #25D366); border-color:#25D366; padding:5px 8px;">
                                <i class="fab fa-whatsapp"></i>
                            </button>
                            <button class="btn-sm btn-outline" onclick="printShippingLabelModal('${o.id}')" title="Print Shipping Label & Invoice" style="padding:5px 8px;">
                                <i class="fas fa-print"></i>
                            </button>
                            <button class="btn-sm btn-danger" onclick="deleteOrder('${o.id}')" title="Move to Trash" style="padding:5px 8px;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function toggleOrderPaymentStatus(orderId) {
        orders = getOrdersArray();
        const ord = orders.find(o => o.id === orderId);
        if (ord) {
            ord.paymentStatus = (ord.paymentStatus === 'PAID') ? 'PENDING' : 'PAID';
            if (ord.paymentStatus === 'PAID' && !ord.paymentId) {
                ord.paymentId = 'UPI-ADMIN-VERIFIED-' + Math.floor(1000 + Math.random() * 9000);
            }
            window.masterOrders = orders;
            window.orders = orders;
            safeStorage.setItem('tasveer_orders', JSON.stringify(orders));

            // 1. Firebase Firestore Cloud Sync
            if (window.CloudDB && window.CloudDB.pushUpdate) {
                window.CloudDB.pushUpdate('orders', orders);
            }

            // 2. Direct Firestore Doc Push if SDK is active
            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
                try {
                    firebase.firestore().collection('tasveer_store').doc('orders').set({
                        items: orders,
                        updatedAt: new Date().toISOString()
                    }, { merge: true }).catch(err => console.warn('Firestore payment toggle sync:', err));
                } catch(err) {}
            }

            // 3. REST API
            fetch((window.API_BASE || '') + '/api/v1/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (sessionStorage.getItem('tasveer_admin_jwt_token') || '') },
                body: JSON.stringify(orders)
            }).catch(() => {});

            if (window.showToast) window.showToast(`✅ Order ${orderId} Payment set to: ${ord.paymentStatus}`);
            renderOrdersTable();
            if (window.renderDashboard) window.renderDashboard();
        }
    }

    function updateOrderStatus(orderId, newStatus) {
        orders = getOrdersArray();
        const ord = orders.find(o => o.id === orderId);
        if (ord) {
            ord.status = newStatus;
            safeStorage.setItem('tasveer_orders', JSON.stringify(orders));
            window.masterOrders = orders;
            window.orders = orders;

            // 1. Firebase Firestore Cloud Sync
            if (window.CloudDB && window.CloudDB.pushUpdate) {
                window.CloudDB.pushUpdate('orders', orders);
            }

            // 2. Direct Firestore Doc Push if SDK is active
            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
                try {
                    firebase.firestore().collection('tasveer_store').doc('orders').set({
                        items: orders,
                        updatedAt: new Date().toISOString()
                    }, { merge: true }).catch(err => console.warn('Firestore update sync:', err));
                } catch(err) {}
            }

            // 3. Sync to REST API
            fetch((window.API_BASE || '') + '/api/v1/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (sessionStorage.getItem('tasveer_admin_jwt_token') || '') },
                body: JSON.stringify(orders)
            }).then(() => {
                if (window.showToast) window.showToast(`✅ Order ${orderId} → ${newStatus}`);
            }).catch(e => {
                if (window.showToast) window.showToast(`✅ Status updated`);
            });

            renderOrdersTable();
            if (window.renderDashboard) window.renderDashboard();
        }
    }

    function sendWhatsAppSoftProof(orderId) {
        const ord = orders.find(o => o.id === orderId);
        if (!ord) return;

        const phone = (ord.phone || '').replace(/[^0-9]/g, '');
        const targetPhone = phone.length === 10 ? '91' + phone : phone || '917231900124';

        const msg = encodeURIComponent(`*TASVEER STUDIO SOFT-PROOF PREVIEW*\n\nDear ${ord.customerName || 'Customer'},\nYour custom photo frame order *${ord.id}* is ready for print approval!\n\n*Specs:* ${ord.items ? ord.items.map(i => i.title).join(', ') : 'Custom Frame'}\n\nPlease reply *APPROVED* to start printing & framing!`);
        window.open(`https://wa.me/${targetPhone}?text=${msg}`, '_blank');
        if (window.showToast) window.showToast(`Opened WhatsApp Soft-Proof for Order ${orderId}`);
    }

    function printShippingLabelModal(orderId) {
        const ord = orders.find(o => o.id === orderId);
        if (!ord) return;

        let modal = safeGet('shipping-label-print-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'shipping-label-print-modal';
            modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); z-index:99999; display:flex; align-items:center; justify-content:center; padding:20px;';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div style="background:#fff; color:#000; padding:25px; border-radius:12px; max-width:500px; width:100%; font-family:sans-serif; box-shadow:0 20px 50px rgba(0,0,0,0.5);">
                <div style="border-bottom:2px solid #000; padding-bottom:10px; margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <h2 style="font-family:serif; margin:0;">TASVEER STUDIO</h2>
                        <span style="font-size:0.75rem; color:#555;">Sawai Madhopur, Rajasthan | Ph: +91 72319 00124</span>
                    </div>
                    <div style="text-align:right;">
                        <strong style="font-size:1.1rem; color:#d97706;">PRIORITY EXPRESS</strong><br>
                        <small>AWB: ${ord.awb || 'LOCAL-SWM-EXPRESS'}</small>
                    </div>
                </div>

                <div style="border:1px dashed #333; padding:12px; margin-bottom:15px; background:#fafafa;">
                    <span style="font-size:0.7rem; color:#666; text-transform:uppercase; font-weight:bold;">DELIVER TO (CUSTOMER):</span><br>
                    <strong style="font-size:1.1rem; display:block; margin-top:4px;">${ord.customerName || 'Valued Customer'}</strong>
                    <div style="font-size:0.9rem; margin-top:4px; line-height:1.4;">
                        ${ord.address || 'Main Market Road, Sawai Madhopur'}<br>
                        <strong>PIN:</strong> ${ord.pincode || '322001'} | <strong>PH:</strong> ${ord.phone || '+91 72319 00124'}
                    </div>
                </div>

                <div style="font-size:0.85rem; border-top:1px solid #ccc; padding-top:10px; margin-bottom:15px;">
                    <strong>ORDER ITEMS:</strong> ${(ord.items || []).map(i => `${i.title} (x${i.qty || 1})`).join(', ')}<br>
                    <strong>PAYMENT MODE:</strong> ${ord.paymentMethod || 'UPI'} | <strong>AMOUNT:</strong> ₹${ord.total}
                </div>

                <div style="display:flex; justify-content:space-between; gap:10px;">
                    <button onclick="safeGet('shipping-label-print-modal').style.display='none'" style="padding:10px 20px; border:1px solid #999; background:#fff; border-radius:6px; cursor:pointer; font-weight:bold;">Close</button>
                    <button onclick="window.print()" style="padding:10px 20px; border:none; background:#f59e0b; color:#000; border-radius:6px; cursor:pointer; font-weight:bold;"><i class="fas fa-print"></i> Print Label Slip</button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    }

    function toggleSelectAllOrders(isChecked) {
        const checkboxes = document.querySelectorAll('.order-select-chk');
        checkboxes.forEach(chk => { chk.checked = isChecked; });
        updateSelectedOrdersCount();
    }

    function updateSelectedOrdersCount() {
        const selected = document.querySelectorAll('.order-select-chk:checked');
        const count = selected.length;
        const countEl = safeGet('selected-orders-count');
        const bulkBar = safeGet('bulk-orders-actions');
        const selectAll = safeGet('select-all-orders');
        const allBoxes = document.querySelectorAll('.order-select-chk');

        if (countEl) countEl.innerText = count;
        if (bulkBar) bulkBar.style.display = count > 0 ? 'inline-flex' : 'none';
        if (selectAll && allBoxes.length > 0) {
            selectAll.checked = (count === allBoxes.length);
        }
    }

    function deleteOrder(orderId) {
        if (!confirm(`🗑️ Kya aap Order #${orderId} ko permanent delete karna chahte hain?`)) return;

        addDeletedOrderIds([orderId]);
        let currentOrders = getOrdersArray();
        currentOrders = currentOrders.filter(o => o.id !== orderId);

        window.masterOrders = currentOrders;
        window.orders = currentOrders;
        safeStorage.setItem('tasveer_orders', JSON.stringify(currentOrders));

        // 1. Firebase Firestore Cloud Sync
        if (window.CloudDB && window.CloudDB.pushUpdate) {
            window.CloudDB.pushUpdate('orders', currentOrders);
        }

        // 2. Direct Firestore Doc Push
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
            try {
                firebase.firestore().collection('tasveer_store').doc('orders').set({
                    items: currentOrders,
                    updatedAt: new Date().toISOString()
                }, { merge: false }).catch(err => console.warn('Firestore delete sync:', err));
            } catch(err) {}
        }

        // 3. Sync deletion to backend REST API
        fetch((window.API_BASE || '') + '/api/v1/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (sessionStorage.getItem('tasveer_admin_jwt_token') || '') },
            body: JSON.stringify(currentOrders)
        }).catch(() => {});

        if (window.showToast) window.showToast(`🗑️ Order #${orderId} permanently deleted!`, 'success');
        updateSelectedOrdersCount();
        renderOrdersTable();
        if (window.renderDashboard) window.renderDashboard();
    }

    function deleteSelectedOrders() {
        const selectedCheckboxes = Array.from(document.querySelectorAll('.order-select-chk:checked'));
        const selectedIds = selectedCheckboxes.map(c => c.value);
        if (selectedIds.length === 0) {
            if (window.showToast) window.showToast('Please select at least 1 order to delete!', 'warn');
            return;
        }

        if (!confirm(`🗑️ Kya aap selected ${selectedIds.length} orders ko permanent delete karna chahte hain?`)) return;

        addDeletedOrderIds(selectedIds);
        let currentOrders = getOrdersArray();
        currentOrders = currentOrders.filter(o => !selectedIds.includes(o.id));

        window.masterOrders = currentOrders;
        window.orders = currentOrders;
        safeStorage.setItem('tasveer_orders', JSON.stringify(currentOrders));

        // 1. Firebase Firestore Cloud Sync
        if (window.CloudDB && window.CloudDB.pushUpdate) {
            window.CloudDB.pushUpdate('orders', currentOrders);
        }

        // 2. Direct Firestore Doc Push
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
            try {
                firebase.firestore().collection('tasveer_store').doc('orders').set({
                    items: currentOrders,
                    updatedAt: new Date().toISOString()
                }, { merge: false }).catch(err => console.warn('Firestore bulk delete sync:', err));
            } catch(err) {}
        }

        // 3. Sync to backend REST API
        fetch((window.API_BASE || '') + '/api/v1/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (sessionStorage.getItem('tasveer_admin_jwt_token') || '') },
            body: JSON.stringify(currentOrders)
        }).catch(() => {});

        if (window.showToast) window.showToast(`🗑️ ${selectedIds.length} orders permanently deleted!`, 'success');

        const selectAll = safeGet('select-all-orders');
        if (selectAll) selectAll.checked = false;
        updateSelectedOrdersCount();
        renderOrdersTable();
        if (window.renderDashboard) window.renderDashboard();
    }

    function deleteAllOrders() {
        let currentOrders = getOrdersArray();
        if (currentOrders.length === 0) {
            if (window.showToast) window.showToast('Queue is already empty!', 'info');
            return;
        }

        if (!confirm(`⚠️ WARNING: Kya aap SABHI (${currentOrders.length}) orders ko ek sath permanent delete karna chahte hain?`)) return;

        const allIds = currentOrders.map(o => o.id);
        addDeletedOrderIds(allIds);

        currentOrders = [];
        window.masterOrders = [];
        window.orders = [];
        safeStorage.setItem('tasveer_orders', JSON.stringify([]));

        // 1. Firebase Firestore Cloud Sync
        if (window.CloudDB && window.CloudDB.pushUpdate) {
            window.CloudDB.pushUpdate('orders', []);
        }

        // 2. Direct Firestore Doc Push
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
            try {
                firebase.firestore().collection('tasveer_store').doc('orders').set({
                    items: [],
                    updatedAt: new Date().toISOString()
                }, { merge: false }).catch(err => console.warn('Firestore delete all sync:', err));
            } catch(err) {}
        }

        // 3. Sync to backend REST API
        fetch((window.API_BASE || '') + '/api/v1/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (sessionStorage.getItem('tasveer_admin_jwt_token') || '') },
            body: JSON.stringify([])
        }).catch(() => {});

        if (window.showToast) window.showToast(`🗑️ All orders permanently deleted!`, 'success');

        const selectAll = safeGet('select-all-orders');
        if (selectAll) selectAll.checked = false;
        updateSelectedOrdersCount();
        renderOrdersTable();
        if (window.renderDashboard) window.renderDashboard();
    }

    function renderShippingTable() {
        renderOrdersTable();
    }

    function renderCustomersTable() {
        const tbody = safeGet('customers-tbody');
        if (!tbody) return;

        const customerMap = {};
        orders.filter(o => !o.isDeleted).forEach(o => {
            const key = o.phone || o.customerName;
            if (!customerMap[key]) {
                customerMap[key] = { name: o.customerName, phone: o.phone, email: o.email || 'customer@gmail.com', ordersCount: 0, totalSpent: 0 };
            }
            customerMap[key].ordersCount += 1;
            customerMap[key].totalSpent += parseFloat(o.total) || 0;
        });

        const custs = Object.values(customerMap);
        if (custs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px;color:#94a3b8;">No customer directory entries yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = custs.map(c => `
            <tr>
                <td><strong>${c.name}</strong></td>
                <td>${c.phone}</td>
                <td>${c.email}</td>
                <td><span class="badge badge-info">${c.ordersCount} Orders</span></td>
                <td><strong style="color:var(--gold-bright);">₹${c.totalSpent}</strong></td>
            </tr>
        `).join('');
    }

    // Expose Orders API
    window.renderOrdersTable = renderOrdersTable;
    window.toggleOrderPaymentStatus = toggleOrderPaymentStatus;
    window.updateOrderStatus = updateOrderStatus;
    window.sendWhatsAppSoftProof = sendWhatsAppSoftProof;
    window.printShippingLabelModal = printShippingLabelModal;
    window.deleteOrder = deleteOrder;
    window.toggleSelectAllOrders = toggleSelectAllOrders;
    window.updateSelectedOrdersCount = updateSelectedOrdersCount;
    window.deleteSelectedOrders = deleteSelectedOrders;
    window.deleteAllOrders = deleteAllOrders;
    window.renderShippingTable = renderShippingTable;
    window.renderCustomersTable = renderCustomersTable;

})(window, document);
