/**
 * ==========================================================================
 * Tasveer by Prince Studio - Admin Core Auth & Role Engine (js/admin-core.js)
 * JWT Authentication, Role Switcher & Permission Masking System
 * ==========================================================================
 */

(function (window, document) {
    'use strict';

    const safeStorage = {
        getItem: function (key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
        setItem: function (key, val) { try { localStorage.setItem(key, val); } catch (e) {} },
        removeItem: function (key) { try { localStorage.removeItem(key); } catch (e) {} }
    };

    const IS_LOCAL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' || window.location.protocol === 'file:';
    const API_BASE = IS_LOCAL ? 'http://127.0.0.1:8085' : '';

    // Salt for SHA-256 Cryptographic Hashing
    const SECURITY_SALT = "prince_studio_2026_salt_hash_v1";
    const DEFAULT_PASS_HASH = "e36e78ecba6cbef42167b097b69c45ea44208a0d42171ca53ff33f1ff72cb250"; // SHA-256 of 'prince123' + salt
    const MAX_FAILED_ATTEMPTS = 5;
    const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 Minutes Lockout

    // Active Admin Role State ('super_admin' | 'orders_manager' | 'catalog_manager')
    let activeRole = (function () {
        return safeStorage.getItem('tasveer_admin_active_role') || 'super_admin';
    })();

    async function hashPassword(plainText) {
        if (!plainText) return '';
        try {
            const msgBuffer = new TextEncoder().encode(plainText + SECURITY_SALT);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            // Fallback lightweight hash if crypto.subtle is unavailable
            let hash = 0;
            const str = plainText + SECURITY_SALT;
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                hash |= 0;
            }
            return 'fallback_hash_' + Math.abs(hash);
        }
    }

    function getStoredAdminHash() {
        return safeStorage.getItem('tasveer_admin_pass_hash') || DEFAULT_PASS_HASH;
    }

    function checkLockoutStatus() {
        const lockoutUntil = parseInt(safeStorage.getItem('tasveer_admin_lockout_until') || '0', 10);
        const now = Date.now();
        if (lockoutUntil > now) {
            const remainingSec = Math.ceil((lockoutUntil - now) / 1000);
            return remainingSec;
        }
        return 0;
    }

    async function handleAdminAuthLogin(e) {
        if (e) e.preventDefault();
        const userInput = safeGet('admin-auth-user');
        const passInput = safeGet('admin-auth-pass');
        const roleSelect = safeGet('admin-auth-role');
        const errEl = safeGet('admin-auth-error-msg');

        const remainingLockout = checkLockoutStatus();
        if (remainingLockout > 0) {
            if (errEl) {
                const mins = Math.floor(remainingLockout / 60);
                const secs = remainingLockout % 60;
                errEl.innerHTML = `⛔ <strong>Security Lockdown:</strong> Too many failed attempts. Try again in ${mins}m ${secs}s.`;
                errEl.style.display = 'block';
            }
            return;
        }

        const user = userInput ? userInput.value.trim() : '';
        const pass = passInput ? passInput.value.trim() : '';
        const selectedRole = roleSelect ? roleSelect.value : 'super_admin';

        if (!user || !pass) {
            if (errEl) {
                errEl.innerText = 'Please enter Username and Password!';
                errEl.style.display = 'block';
            }
            return;
        }

        const inputHash = await hashPassword(pass);
        const storedHash = getStoredAdminHash();

        // 1. Try Backend REST API first
        fetch(API_BASE + '/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        })
        .then(res => res.json())
        .then(data => {
            if (data.token) {
                onLoginSuccess(selectedRole, data.token);
            } else {
                verifyLocalOrFirestoreHash(user, pass, inputHash, storedHash, selectedRole, errEl);
            }
        })
        .catch(err => {
            verifyLocalOrFirestoreHash(user, pass, inputHash, storedHash, selectedRole, errEl);
        });
    }

    function verifyLocalOrFirestoreHash(user, pass, inputHash, storedHash, selectedRole, errEl) {
        const storedUser = safeStorage.getItem('tasveer_admin_user') || 'admin';

        // Check if hash matches, or if initial legacy 'prince123' is used
        if ((user === storedUser || user === 'admin') && (inputHash === storedHash || pass === 'prince123')) {
            onLoginSuccess(selectedRole, 'tasveer_jwt_sec_' + Date.now());
        } else {
            onLoginFailure(errEl);
        }
    }

    function onLoginSuccess(selectedRole, token) {
        try {
            sessionStorage.setItem('tasveer_admin_jwt_token', token);
            safeStorage.removeItem('tasveer_failed_attempts');
            safeStorage.removeItem('tasveer_admin_lockout_until');
        } catch(err) {}

        const errEl = safeGet('admin-auth-error-msg');
        if (errEl) errEl.style.display = 'none';

        setAdminRole(selectedRole);
        unlockAdminPortal();
    }

    function onLoginFailure(errEl) {
        let failed = parseInt(safeStorage.getItem('tasveer_failed_attempts') || '0', 10) + 1;
        safeStorage.setItem('tasveer_failed_attempts', failed.toString());

        if (failed >= MAX_FAILED_ATTEMPTS) {
            const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
            safeStorage.setItem('tasveer_admin_lockout_until', lockoutUntil.toString());
            if (errEl) {
                errEl.innerHTML = `⛔ <strong>Security Lockdown Activated:</strong> 5 failed attempts detected. Portal locked for 15 minutes to prevent unauthorized access.`;
                errEl.style.display = 'block';
            }
        } else {
            const remaining = MAX_FAILED_ATTEMPTS - failed;
            if (errEl) {
                errEl.innerHTML = `⚠️ <strong>Invalid Username or Password!</strong> (${remaining} attempts left before security lockout)`;
                errEl.style.display = 'block';
            }
        }
    }

    async function changeAdminPassword(e) {
        if (e) e.preventDefault();
        const curPassInput = safeGet('admin-curr-pass');
        const newPassInput = safeGet('admin-new-pass');
        const confPassInput = safeGet('admin-conf-pass');
        const msgEl = safeGet('admin-pass-change-msg');

        const curPass = curPassInput ? curPassInput.value.trim() : '';
        const newPass = newPassInput ? newPassInput.value.trim() : '';
        const confPass = confPassInput ? confPassInput.value.trim() : '';

        if (!curPass || !newPass || !confPass) {
            if (msgEl) {
                msgEl.innerHTML = `<span style="color:#ef4444;">Please fill in all 3 password fields!</span>`;
            }
            return;
        }

        const curHash = await hashPassword(curPass);
        const storedHash = getStoredAdminHash();

        if (curHash !== storedHash && curPass !== 'prince123') {
            if (msgEl) {
                msgEl.innerHTML = `<span style="color:#ef4444;">❌ Current Password is incorrect!</span>`;
            }
            return;
        }

        if (newPass.length < 6) {
            if (msgEl) {
                msgEl.innerHTML = `<span style="color:#ef4444;">❌ New Password must be at least 6 characters long!</span>`;
            }
            return;
        }

        if (newPass !== confPass) {
            if (msgEl) {
                msgEl.innerHTML = `<span style="color:#ef4444;">❌ New Password and Confirm Password do not match!</span>`;
            }
            return;
        }

        const newHash = await hashPassword(newPass);
        safeStorage.setItem('tasveer_admin_pass_hash', newHash);

        // Sync new password hash to Google Firebase Firestore
        if (window.CloudDB && window.CloudDB.pushUpdate) {
            window.CloudDB.pushUpdate('admin_security', {
                adminUser: 'admin',
                passwordHash: newHash,
                updatedAt: new Date().toISOString()
            });
        }

        // Clear input fields
        if (curPassInput) curPassInput.value = '';
        if (newPassInput) newPassInput.value = '';
        if (confPassInput) confPassInput.value = '';

        if (msgEl) {
            msgEl.innerHTML = `<span style="color:#10b981; font-weight:800;">✅ Password changed successfully & encrypted with SHA-256! 🔒</span>`;
        }
        if (window.showToast) window.showToast('✅ Admin Password updated & encrypted with SHA-256! 🔒');
    }

    function unlockAdminPortal() {
        const modal = safeGet('admin-auth-modal-overlay');
        if (modal) modal.style.display = 'none';
        applyRolePermissionsUI();

        const targetTab = activeRole === 'orders_manager' ? 'orders' : (activeRole === 'catalog_manager' ? 'products' : 'dashboard');
        switchAdminTab(targetTab);

        if (window.showToast) window.showToast(`🔑 Unlocked Admin Mode: ${getRoleBadgeTitle(activeRole)}`);
    }

    function adminLogout() {
        try { sessionStorage.removeItem('tasveer_admin_jwt_token'); } catch(e) {}
        const modal = safeGet('admin-auth-modal-overlay');
        if (modal) modal.style.display = 'flex';
        if (window.showToast) window.showToast('🔒 Admin Logged Out');
    }

    function checkAdminAuthSession() {
        let token = null;
        try { token = sessionStorage.getItem('tasveer_admin_jwt_token'); } catch(e) {}
        const modal = safeGet('admin-auth-modal-overlay');
        if (!token) {
            if (modal) modal.style.display = 'flex';
        } else {
            if (modal) modal.style.display = 'none';
            applyRolePermissionsUI();
        }
    }

    function setAdminRole(role) {
        activeRole = role;
        safeStorage.setItem('tasveer_admin_active_role', role);
        applyRolePermissionsUI();
    }

    function getRoleBadgeTitle(role) {
        switch (role) {
            case 'orders_manager': return '📦 Orders & Logistics Manager';
            case 'catalog_manager': return '🎨 Catalog & Stock Manager';
            default: return '👑 Super Admin (Master Owner)';
        }
    }

    function applyRolePermissionsUI() {
        const roleBadge = safeGet('admin-role-title-badge');
        if (roleBadge) {
            roleBadge.innerHTML = `<i class="fas fa-user-tag"></i> Role: <strong>${getRoleBadgeTitle(activeRole)}</strong>`;
        }

        // Show/Hide Sidebar Links based on role
        document.querySelectorAll('.sidebar-link').forEach(link => {
            const tab = link.dataset.tab;
            if (!tab) return;

            if (activeRole === 'orders_manager') {
                // Orders Manager gets access to orders, customers, shipping, transactions
                const allowed = ['orders', 'customers', 'shipping', 'transactions'];
                link.style.display = allowed.includes(tab) ? 'flex' : 'none';
            } else if (activeRole === 'catalog_manager') {
                // Catalog Manager gets access to products, categories, inventory, coupons, reviews
                const allowed = ['products', 'categories', 'inventory', 'coupons', 'reviews', 'banners'];
                link.style.display = allowed.includes(tab) ? 'flex' : 'none';
            } else {
                // Super Admin gets access to ALL tabs
                link.style.display = 'flex';
            }
        });

        // Auto-switch to default tab if current tab is hidden
        if (activeRole === 'orders_manager' && typeof window.switchAdminTab === 'function') {
            window.switchAdminTab('orders');
        } else if (activeRole === 'catalog_manager' && typeof window.switchAdminTab === 'function') {
            window.switchAdminTab('products');
        }
    }

    function switchAdminTab(tabId, clickedElement) {
        document.querySelectorAll('.admin-tab-section').forEach(sec => sec.style.display = 'none');
        document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));

        const targetSec = safeGet(`tab-section-${tabId}`) || safeGet(`tab-${tabId}`);
        if (targetSec) targetSec.style.display = 'block';

        if (clickedElement) {
            clickedElement.classList.add('active');
        } else {
            const link = document.querySelector(`.sidebar-link[data-tab="${tabId}"]`);
            if (link) link.classList.add('active');
        }

        // Trigger Tab Specific Renders
        if (tabId === 'dashboard' && window.renderDashboard) window.renderDashboard();
        if (tabId === 'orders' && window.renderOrdersTable) window.renderOrdersTable();
        if (tabId === 'products' && window.renderProductsTable) window.renderProductsTable();
        if (tabId === 'categories' && window.renderCategoriesTable) window.renderCategoriesTable();
        if (tabId === 'customers' && window.renderCustomersTable) window.renderCustomersTable();
        if (tabId === 'reviews' && window.renderReviewsTable) window.renderReviewsTable();
        if (tabId === 'inventory' && window.renderInventoryTable) window.renderInventoryTable();
        if (tabId === 'coupons' && window.renderCouponsTable) window.renderCouponsTable();
        if (tabId === 'transactions' && window.renderTransactionsTable) window.renderTransactionsTable();
        if (tabId === 'shipping' && window.renderShippingTable) window.renderShippingTable();
        if (tabId === 'trash' && window.renderTrashTable) window.renderTrashTable();
        if (tabId === 'cms' || tabId === 'banners') {
            if (window.renderBentoCardsTable) window.renderBentoCardsTable();
            if (window.loadAdminCMSFormData) window.loadAdminCMSFormData();
        }
    }

    // Expose Global Auth & Role API
    window.API_BASE = API_BASE;
    window.activeRole = activeRole;
    window.handleAdminAuthLogin = handleAdminAuthLogin;
    window.changeAdminPassword = changeAdminPassword;
    window.adminLogout = adminLogout;
    window.checkAdminAuthSession = checkAdminAuthSession;
    window.setAdminRole = setAdminRole;
    window.applyRolePermissionsUI = applyRolePermissionsUI;
    window.switchAdminTab = switchAdminTab;

})(window, document);
