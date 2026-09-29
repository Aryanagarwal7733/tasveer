/* ==========================================================================
   Tasveer by Prince Studio - Master Admin Bootstrapper Orchestrator (admin.js)
   Clean, Lightweight Bootstrapper Orchestrating All Modular Admin Sub-Systems
   ========================================================================= */

(function (window, document) {
    'use strict';

    const safeStorage = {
        getItem: function (key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
        setItem: function (key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
    };

    const API_BASE = (window.location.protocol === 'file:') ? 'http://127.0.0.1:8085' : '';

    let masterOrders = [];
    let masterProducts = [];

    function initAdminOrchestrator() {
        console.log('[Tasveer Admin] Bootstrapping Fast Role-Based Sub-Systems...');

        if (window.checkAdminAuthSession) window.checkAdminAuthSession();
        if (window.applyRolePermissionsUI) window.applyRolePermissionsUI();

        // 1. Instant Fast Memory Cache Load
        try {
            const savedOrders = JSON.parse(safeStorage.getItem('tasveer_orders') || '[]');
            if (Array.isArray(savedOrders)) {
                masterOrders = savedOrders;
                window.masterOrders = savedOrders;
                window.orders = savedOrders;
            }
        } catch(e) {}

        // 2. Render Active View Instantly (<15ms)
        if (window.renderDashboard) window.renderDashboard();
        if (window.renderOrdersTable) window.renderOrdersTable();

        console.log('[Tasveer Admin] Ultra-Fast Initial Paint Ready ⚡');
    }

    let lastOrderCount = 0;
    let isInitialLoadDone = false;
    let audioUnlocked = false;
    let pendingAnnouncement = null;

    function unlockAudioAndPlayPending() {
        if (audioUnlocked) return;
        audioUnlocked = true;

        // Remove listeners immediately so no future click touches audio
        document.removeEventListener('click', unlockAudioAndPlayPending);
        document.removeEventListener('touchstart', unlockAudioAndPlayPending);
        document.removeEventListener('keydown', unlockAudioAndPlayPending);

        if (pendingAnnouncement) {
            const order = pendingAnnouncement;
            pendingAnnouncement = null;
            setTimeout(() => {
                playOrderNotification(order, true);
            }, 300);
        }
    }

    document.addEventListener('click', unlockAudioAndPlayPending, { once: true, passive: true });
    document.addEventListener('touchstart', unlockAudioAndPlayPending, { once: true, passive: true });
    document.addEventListener('keydown', unlockAudioAndPlayPending, { once: true, passive: true });

    function playOrderNotification(order, forceVoice = true) {
        // 1. Play Audio Chime
        const audio = document.getElementById('admin-order-chime');
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => {
                console.log('[Admin Sound AutoPlay Pending User Click]:', e);
                pendingAnnouncement = order;
            });
        }

        // 2. Clear Natural Voice Speech Announcement ("Order received in your website Tasveer")
        try {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const text = "Order received on your website Tasveer";
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.95;
                utterance.pitch = 1.05;
                utterance.volume = 1.0;
                utterance.lang = 'en-IN';

                // Try to find natural Indian/English voice
                const voices = window.speechSynthesis.getVoices();
                if (voices && voices.length > 0) {
                    const preferredVoice = voices.find(v => (v.lang === 'en-IN' || v.name.includes('India') || v.name.includes('Google') || v.name.includes('Natural')));
                    if (preferredVoice) utterance.voice = preferredVoice;
                }

                window.speechSynthesis.speak(utterance);
            }
        } catch(e) {
            console.warn('[Speech Synthesis Warning]:', e);
        }

        // 3. Prominent Floating Golden Banner & Toast
        const orderId = order && (order.id || order.orderId) ? (order.id || order.orderId) : 'TAS-NEW';
        const cust = order && (order.customerName || (order.customer && order.customer.name)) ? `from ${order.customerName || order.customer.name}` : '';
        const amt = order && (order.total || order.totalAmount) ? `• ₹${order.total || order.totalAmount}` : '';
        
        showToast(`🔔 ORDER RECEIVED ON YOUR WEBSITE TASVEER! 📸✨<br><small style="color:#fde68a; font-weight:700;">${orderId} ${cust} ${amt}</small>`, 'success');
    }

    function checkAndNotifyOrders(ordersList) {
        if (!Array.isArray(ordersList) || ordersList.length === 0) return;
        
        const currentCount = ordersList.length;
        const latestOrder = ordersList[0];

        if (!isInitialLoadDone) {
            isInitialLoadDone = true;
            lastOrderCount = currentCount;
            // Never play chime or voice on initial login / admin open!
            return;
        } else if (currentCount > lastOrderCount) {
            // ONLY play live chime and voice when a REAL NEW order arrives during active session!
            lastOrderCount = currentCount;
            playOrderNotification(latestOrder, true);
        }
    }

    function pollBackendOrders() {
        // 1. Check LocalStorage & CloudDB Orders
        let localOrders = [];
        try {
            const saved = JSON.parse(safeStorage.getItem('tasveer_orders'));
            if (Array.isArray(saved) && saved.length > 0) localOrders = saved;
        } catch(e) {}

        if (localOrders.length > 0) {
            masterOrders = localOrders;
            window.masterOrders = localOrders;
            window.orders = localOrders;
            checkAndNotifyOrders(localOrders);
        }

        // 2. Poll REST API only on local server development
        if (API_BASE) {
            fetch(API_BASE + '/api/v1/orders')
                .then(res => res.json())
                .then(serverOrders => {
                    if (!Array.isArray(serverOrders)) return;

                    let deletedIds = [];
                    try {
                        const d = JSON.parse(safeStorage.getItem('tasveer_deleted_order_ids'));
                        if (Array.isArray(d)) deletedIds = d;
                    } catch(e) {}

                    const validServerOrders = serverOrders.filter(so => !deletedIds.includes(so.id));
                    const mergedOrders = [...masterOrders];

                    let hasNew = false;
                    validServerOrders.forEach(so => {
                        const existing = mergedOrders.find(lo => lo.id === so.id);
                        if (!existing) {
                            mergedOrders.unshift(so);
                            hasNew = true;
                        }
                    });

                    masterOrders = mergedOrders;
                    window.masterOrders = mergedOrders;
                    window.orders = mergedOrders;
                    safeStorage.setItem('tasveer_orders', JSON.stringify(mergedOrders));

                    if (hasNew) {
                        checkAndNotifyOrders(mergedOrders);
                        if (window.renderOrdersTable) window.renderOrdersTable();
                        if (window.renderDashboard) window.renderDashboard();
                    }
                })
                .catch(() => {});
        }
    }

    function showToast(message, type = 'info') {
        let toastBox = document.getElementById('admin-toast-box');
        if (!toastBox) {
            toastBox = document.createElement('div');
            toastBox.id = 'admin-toast-box';
            toastBox.style.cssText = 'position:fixed; top:25px; right:25px; z-index:999999; display:flex; flex-direction:column; gap:10px; pointer-events:none; max-width:420px;';
            document.body.appendChild(toastBox);
        }

        const toast = document.createElement('div');
        const bg = type === 'success' ? 'linear-gradient(135deg, #1c1917, #064e3b)' : 'linear-gradient(135deg, #1c1917, #29180c)';
        const border = type === 'success' ? '#10b981' : '#f59e0b';
        toast.style.cssText = `background:${bg}; color:#fff; padding:15px 22px; border-radius:12px; border:2px solid ${border}; font-size:0.92rem; box-shadow:0 15px 35px rgba(0,0,0,0.85); pointer-events:auto; font-weight:800; font-family:sans-serif; line-height:1.4; animation:slideDown 0.4s ease;`;
        toast.innerHTML = `<div style="display:flex; align-items:center; gap:10px;"><span>${message}</span></div>`;
        toastBox.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.5s ease';
                setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 500);
            }
        }, 5000);
    }

    function testAdminSound() {
        unlockAudioAndPlayPending();
        playOrderNotification({ id: 'TAS-76217', customerName: 'Prince Studio', total: 499 }, true);
    }

    // Expose Global Admin State & API
    window.masterOrders = masterOrders;
    window.masterProducts = masterProducts;
    window.showToast = showToast;
    window.playOrderNotification = playOrderNotification;
    window.checkAndNotifyOrders = checkAndNotifyOrders;
    window.testAdminSound = testAdminSound;
    window.initAdminOrchestrator = initAdminOrchestrator;

    // Bootstrapper listener
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdminOrchestrator);
    } else {
        setTimeout(initAdminOrchestrator, 50);
    }

})(window, document);
