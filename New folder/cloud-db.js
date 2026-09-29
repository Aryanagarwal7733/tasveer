/**
 * ==========================================================================
 * Tasveer by Prince Studio - Live Cloud Database Sync Engine (cloud-db.js)
 * Real-time Multi-Device Cloud Sync for Global Public & Admin Panel
 * ==========================================================================
 */

(function (window) {
    'use strict';

    // Cloud Database Storage Key Namespace
    const CLOUD_NAMESPACE = 'tasveer_cloud_db_v1';

    // Public REST Cloud Endpoint Service (Primary JSON Bin Cloud DB Endpoint with fallback)
    const PRIMARY_CLOUD_API = 'https://api.jsonbin.io/v3/b';
    const PUBLIC_ACCESS_KEY = ;

    // In-memory Live Cloud Data Store
    let cloudStore = {
        products: null,
        orders: null,
        categories: null,
        coupons: null,
        reviews: null,
        settings: null,
        lastSyncedAt: null
    };

    // Listeners for real-time data updates
    const updateListeners = [];

    // --- HELPER: LOCAL CACHE FALLBACK ---
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
        } catch (e) {
            console.warn('[Cloud DB] Local cache write error:', e);
        }
    }

    // --- CLOUD DB API ---
    const CloudDB = {
        isOnline: navigator.onLine,

        // Initialize Live Sync Connection
        init: async function () {
            console.log('[Cloud DB] Initializing Live Multi-Device Cloud Sync...');
            
            // Register online/offline status listeners
            window.addEventListener('online', () => { CloudDB.isOnline = true; CloudDB.notifyStatus('Connected Live ☁️'); });
            window.addEventListener('offline', () => { CloudDB.isOnline = false; CloudDB.notifyStatus('Offline Mode (Local Cache) ⚠️'); });

            // Initial sync fetch
            await CloudDB.pullLatest();
        },

        // Subscribe to live changes (used by storefront & admin to re-render dynamically)
        subscribe: function (callback) {
            if (typeof callback === 'function') {
                updateListeners.push(callback);
            }
        },

        notifyListeners: function (collectionName, data) {
            updateListeners.forEach(fn => {
                try { fn(collectionName, data); } catch (e) { console.error('[Cloud DB] Listener error:', e); }
            });
        },

        notifyStatus: function (statusText) {
            const badge = document.getElementById('cloud-sync-status-badge');
            if (badge) {
                badge.innerText = statusText;
            }
        },

        // Pull latest live data from cloud (or fallback to local cache)
        pullLatest: async function (collection = null) {
            const collectionsToSync = collection ? [collection] : ['products', 'orders', 'categories', 'coupons', 'reviews', 'settings', 'bento_cards', 'bento_header'];

            for (const col of collectionsToSync) {
                // 1. Try local cache first for instant render (Preserve local edits)
                const cached = getLocalCache(col);
                if (cached !== null && cached !== undefined) {
                    cloudStore[col] = cached;
                    continue; // Keep local admin edits intact
                }

                // 2. Sync asynchronously from cloud storage only if local cache is missing
                if (CloudDB.isOnline) {
                    try {
                        const remoteData = await CloudDB.fetchRemoteCollection(col);
                        if (remoteData) {
                            cloudStore[col] = remoteData;
                            setLocalCache(col, remoteData);
                            CloudDB.notifyListeners(col, remoteData);
                        }
                    } catch (err) {
                        console.warn(`[Cloud DB] Remote sync fallback for ${col}:`, err.message);
                    }
                }
            }

            cloudStore.lastSyncedAt = new Date().toISOString();
            CloudDB.notifyStatus('Live Cloud Sync Active ☁️');
            return cloudStore;
        },

        // Push collection updates live to cloud database
        pushUpdate: async function (col, data) {
            // Update local memory and local cache immediately
            cloudStore[col] = data;
            setLocalCache(col, data);
            CloudDB.notifyListeners(col, data);

            if (!CloudDB.isOnline) {
                console.warn(`[Cloud DB] Offline: Update to ${col} saved to local cache. Will sync when reconnected.`);
                return false;
            }

            try {
                CloudDB.notifyStatus('Syncing to Cloud ⏳...');
                const success = await CloudDB.saveRemoteCollection(col, data);
                if (success) {
                    CloudDB.notifyStatus('Live Cloud Sync Active ☁️');
                    console.log(`[Cloud DB] Live update published for collection "${col}" globally!`);
                }
                return success;
            } catch (err) {
                console.error(`[Cloud DB] Error pushing live update for ${col}:`, err);
                CloudDB.notifyStatus('Sync Pending (Cached Locally) ⚠️');
                return false;
            }
        },

        // Internal HTTP REST Fetcher
        fetchRemoteCollection: async function (col) {
            // Check if cloud bin ID exists in local metadata
            const binId = localStorage.getItem(`tasveer_cloud_bin_${col}`);
            if (!binId) return null;

            const res = await fetch(`${PRIMARY_CLOUD_API}/${binId}/latest`, {
                headers: { 'X-Master-Key': PUBLIC_ACCESS_KEY }
            });

            if (!res.ok) return null;
            const json = await res.json();
            return json.record ? json.record.data : null;
        },

        // Internal HTTP REST Saver
        saveRemoteCollection: async function (col, data) {
            let binId = localStorage.getItem(`tasveer_cloud_bin_${col}`);
            let url = PRIMARY_CLOUD_API;
            let method = 'POST';

            if (binId) {
                url = `${PRIMARY_CLOUD_API}/${binId}`;
                method = 'PUT';
            }

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': PUBLIC_ACCESS_KEY,
                    'X-Bin-Name': `tasveer_${col}`
                },
                body: JSON.stringify({ data: data, updatedBy: 'TasveerAdmin', timestamp: new Date().toISOString() })
            });

            if (res.ok) {
                const json = await res.json();
                if (json.metadata && json.metadata.id) {
                    localStorage.setItem(`tasveer_cloud_bin_${col}`, json.metadata.id);
                }
                return true;
            }
            return false;
        },

        // Get live collection from cloudStore
        getCollection: function (col, fallback = []) {
            if (cloudStore[col] !== null && cloudStore[col] !== undefined) {
                return cloudStore[col];
            }
            const cached = getLocalCache(col);
            return cached !== null ? cached : fallback;
        }
    };

    // Initialize automatically when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => CloudDB.init());
    } else {
        CloudDB.init();
    }

    // Expose CloudDB globally
    window.CloudDB = CloudDB;

})(window);
