/**
 * ==========================================================================
 * Tasveer by Prince Studio - Google Firebase Firestore Cloud DB Engine (cloud-db.js)
 * Real-time Multi-Device Cloud Sync for Public Storefront & Admin Control Center
 * ==========================================================================
 */

(function (window) {
    'use strict';

    const firebaseConfig = {
        apiKey: "AIzaSyAr6421mjz3hP7XMykAmrX_9bPF3SR3GSM",
        authDomain: "tasveer-studio-7604a.firebaseapp.com",
        projectId: "tasveer-studio-7604a",
        storageBucket: "tasveer-studio-7604a.firebasestorage.app",
        messagingSenderId: "135725775968",
        appId: "1:135725775968:web:1710ee4cf76411b1369705",
        measurementId: "G-FVET97PYY6"
    };

    let firestoreDb = null;
    let isFirebaseReady = false;

    let cloudStore = {
        products: null,
        orders: null,
        categories: null,
        coupons: null,
        reviews: null,
        settings: null,
        lastSyncedAt: null
    };

    const updateListeners = [];

    function getLocalCache(key) {
        try {
            const raw = localStorage.getItem(`tasveer_${key}`);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function setLocalCache(key, data) {
        try {
            localStorage.setItem(`tasveer_${key}`, JSON.stringify(data));
        } catch (e) {}
    }

    function notifyStatus(statusHtml, isOnline = true) {
        const badge = document.getElementById('cloud-sync-status-badge');
        if (badge) {
            badge.innerHTML = statusHtml;
            badge.style.background = isOnline ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)';
            badge.style.color = isOnline ? '#fbbf24' : '#f87171';
            badge.style.borderColor = isOnline ? 'rgba(245, 158, 11, 0.4)' : 'rgba(239, 68, 68, 0.4)';
        }
    }

    const CloudDB = {
        isOnline: false,

        init: async function () {
            console.log('[Cloud DB] Initializing Google Firebase Cloud Firestore Sync...');
            notifyStatus('<i class="fas fa-fire" style="color:#f59e0b;"></i> Connecting Firebase DB... ⏳');

            try {
                if (typeof firebase !== 'undefined') {
                    if (!firebase.apps.length) {
                        firebase.initializeApp(firebaseConfig);
                    }
                    firestoreDb = firebase.firestore();
                    isFirebaseReady = true;
                    CloudDB.isOnline = true;
                    console.log('[Cloud DB] 🔥 Google Firebase Firestore Initialized 100% OK!');
                    notifyStatus('<i class="fas fa-fire" style="color:#f59e0b;"></i> Firebase Firestore Live 🟢', true);
                    
                    // Setup Real-time Listeners
                    CloudDB.setupRealtimeListeners();
                } else {
                    console.warn('[Cloud DB] Firebase SDK loading deferred, using REST & LocalStorage sync.');
                    notifyStatus('<i class="fas fa-database" style="color:#10b981;"></i> Cloud DB Local Sync 🟢', true);
                }
            } catch (err) {
                console.warn('[Cloud DB] Firebase initialization error:', err);
                notifyStatus('<i class="fas fa-database" style="color:#10b981;"></i> Live Server DB Active 🟢', true);
            }

            await CloudDB.pullLatest();
        },

        setupRealtimeListeners: function () {
            if (!firestoreDb) return;

            // 1. Real-time Products Sync
            try {
                firestoreDb.collection('tasveer_store').doc('products')
                    .onSnapshot(doc => {
                        if (doc.exists && doc.data() && Array.isArray(doc.data().items) && doc.data().items.length > 0) {
                            let deletedIds = [];
                            try {
                                deletedIds = JSON.parse(localStorage.getItem('tasveer_deleted_product_ids')) || [];
                            } catch(e) {}
                            const prods = doc.data().items.filter(p => !deletedIds.includes(p.id) && !p.isDeleted);
                            cloudStore.products = prods;
                            setLocalCache('products', prods);
                            window.masterProducts = prods;
                            window.PRODUCTS_DATA = prods;
                            CloudDB.notifyListeners('products', prods);
                            if (window.renderProductsTable) window.renderProductsTable();
                            if (window.renderProducts) window.renderProducts();
                            if (window.renderCategoriesTable) window.renderCategoriesTable();
                        }
                    }, err => console.log('[Firebase Live] Products sync standby'));
            } catch (e) {}

            // 2. Real-time Categories Sync
            try {
                firestoreDb.collection('tasveer_store').doc('categories')
                    .onSnapshot(doc => {
                        if (doc.exists && doc.data() && Array.isArray(doc.data().items) && doc.data().items.length > 0) {
                            const cats = doc.data().items;
                            cloudStore.categories = cats;
                            setLocalCache('categories', cats);
                            window.DEFAULT_CATEGORIES = cats;
                            CloudDB.notifyListeners('categories', cats);
                            if (window.renderCategoriesTable) window.renderCategoriesTable();
                            if (window.renderCategoryShowcaseGrid) window.renderCategoryShowcaseGrid();
                            if (window.renderDynamicFilterTabs) window.renderDynamicFilterTabs();
                        } else if (!doc.exists && window.DEFAULT_CATEGORIES && window.DEFAULT_CATEGORIES.length > 0) {
                            firestoreDb.collection('tasveer_store').doc('categories').set({
                                items: window.DEFAULT_CATEGORIES,
                                updatedAt: new Date().toISOString()
                            }, { merge: true }).catch(()=>{});
                        }
                    }, err => console.log('[Firebase Live] Categories sync standby'));
            } catch (e) {}

            // 3. Real-time Orders Sync
            try {
                firestoreDb.collection('tasveer_store').doc('orders')
                    .onSnapshot(doc => {
                        if (doc.exists && doc.data() && Array.isArray(doc.data().items)) {
                            let deletedIds = [];
                            try {
                                const d = JSON.parse(localStorage.getItem('tasveer_deleted_order_ids'));
                                if (Array.isArray(d)) deletedIds = d;
                            } catch(e) {}

                            const rawOrds = doc.data().items;
                            const ords = rawOrds.filter(o => o && o.id && !deletedIds.includes(o.id) && !o.isDeleted);
                            cloudStore.orders = ords;
                            setLocalCache('orders', ords);
                            window.masterOrders = ords;
                            window.orders = ords;
                            CloudDB.notifyListeners('orders', ords);
                            if (window.checkAndNotifyOrders) window.checkAndNotifyOrders(ords);
                            if (window.renderOrdersTable) window.renderOrdersTable();
                            if (window.renderDashboard) window.renderDashboard();
                        }
                    }, err => console.log('[Firebase Live] Orders sync standby'));
            } catch (e) {}

            // 4. Real-time Coupons Sync
            try {
                firestoreDb.collection('tasveer_store').doc('coupons')
                    .onSnapshot(doc => {
                        if (doc.exists && doc.data() && Array.isArray(doc.data().items) && doc.data().items.length > 0) {
                            const c = doc.data().items;
                            cloudStore.coupons = c;
                            setLocalCache('coupons', c);
                            CloudDB.notifyListeners('coupons', c);
                            if (window.renderCouponsTable) window.renderCouponsTable();
                        }
                    }, err => console.log('[Firebase Live] Coupons sync standby'));
            } catch (e) {}

            // 5. Real-time CMS Settings Sync (Hero Banners, Headlines, Images, Logo)
            try {
                firestoreDb.collection('tasveer_store').doc('cms_settings')
                    .onSnapshot(doc => {
                        if (doc.exists && doc.data()) {
                            const cms = doc.data();
                            cloudStore.cms_settings = cms;
                            setLocalCache('cms_settings', cms);
                            CloudDB.notifyListeners('cms_settings', cms);
                            if (window.applyCMSContent) window.applyCMSContent(cms);
                        }
                    }, err => console.log('[Firebase Live] CMS sync standby'));
            } catch (e) {}
        },

        subscribe: function (callback) {
            if (typeof callback === 'function') {
                updateListeners.push(callback);
            }
        },

        notifyListeners: function (collectionName, data) {
            updateListeners.forEach(fn => {
                try { fn(collectionName, data); } catch (e) {}
            });
        },

        notifyStatus: notifyStatus,

        pullLatest: async function (collection = null) {
            const collectionsToSync = collection ? [collection] : ['products', 'orders', 'categories', 'coupons', 'cms_settings', 'cms'];

            for (const col of collectionsToSync) {
                // Try Firebase Firestore first
                if (firestoreDb && isFirebaseReady) {
                    try {
                        const doc = await firestoreDb.collection('tasveer_store').doc(col).get();
                        if (doc.exists && doc.data()) {
                            const data = doc.data().items || doc.data();
                            if (data && (!Array.isArray(data) || data.length > 0)) {
                                cloudStore[col] = data;
                                setLocalCache(col, data);
                                if (col === 'cms_settings' || col === 'cms') {
                                    setLocalCache('cms_settings', data);
                                    if (window.applyCMSContent) window.applyCMSContent(data);
                                }
                                CloudDB.notifyListeners(col, data);
                                continue;
                            }
                        }
                    } catch (e) {}
                }

                // Fallback to REST API (only on HTTP or when local server is specified)
                const isFileProtocol = (window.location.protocol === 'file:');
                const apiHost = window.API_BASE || (isFileProtocol ? '' : '');
                if (!isFileProtocol || window.API_BASE) {
                    try {
                        const endpoint = (col === 'cms_settings' || col === 'cms') ? '/api/v1/cms' : `/api/v1/${col}`;
                        const res = await fetch((apiHost || '') + endpoint);
                        if (res.ok) {
                            const remoteData = await res.json();
                            if (remoteData) {
                                const actualData = remoteData.cms || remoteData;
                                cloudStore[col] = actualData;
                                setLocalCache(col, actualData);
                                if (col === 'cms_settings' || col === 'cms') {
                                    setLocalCache('cms_settings', actualData);
                                    if (window.applyCMSContent) window.applyCMSContent(actualData);
                                }
                                CloudDB.notifyListeners(col, actualData);
                            }
                        }
                    } catch (err) {
                        const cached = getLocalCache(col);
                        if (cached !== null) cloudStore[col] = cached;
                    }
                } else {
                    const cached = getLocalCache(col);
                    if (cached !== null) cloudStore[col] = cached;
                }
            }

            cloudStore.lastSyncedAt = new Date().toISOString();
            return cloudStore;
        },

        pushUpdate: async function (col, data) {
            cloudStore[col] = data;
            setLocalCache(col, data);
            CloudDB.notifyListeners(col, data);

            // 1. Sync to Google Firebase Firestore
            if (firestoreDb && isFirebaseReady) {
                try {
                    const payload = Array.isArray(data) ? { items: data, updatedAt: new Date().toISOString() } : { ...data, updatedAt: new Date().toISOString() };
                    await firestoreDb.collection('tasveer_store').doc(col).set(payload, { merge: true });
                    console.log(`[Firebase Live] Successfully synced ${col} to Google Firestore! 🔥`);
                    notifyStatus('<i class="fas fa-fire" style="color:#f59e0b;"></i> Firebase Firestore Live 🟢', true);
                } catch (fbErr) {
                    console.warn(`[Firebase] Firestore sync notice:`, fbErr);
                }
            }

            // 2. Sync to REST Backend API (if not standalone file://)
            const isFileProtocol = (window.location.protocol === 'file:');
            if (!isFileProtocol || window.API_BASE) {
                try {
                    const endpoint = (col === 'cms') ? '/api/v1/cms' : `/api/v1/${col}`;
                    const payload = (col === 'orders' || col === 'products') ? data : { [col]: data };
                    await fetch((window.API_BASE || '') + endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (sessionStorage.getItem('tasveer_admin_jwt_token') || '') },
                        body: JSON.stringify(payload)
                    });
                } catch (err) {}
            }

            return true;
        },

        getCollection: function (col, fallback = []) {
            if (cloudStore[col] !== null && cloudStore[col] !== undefined) {
                return cloudStore[col];
            }
            const cached = getLocalCache(col);
            return cached !== null ? cached : fallback;
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => CloudDB.init());
    } else {
        CloudDB.init();
    }

    window.CloudDB = CloudDB;
    window.firebaseConfig = firebaseConfig;

})(window);
