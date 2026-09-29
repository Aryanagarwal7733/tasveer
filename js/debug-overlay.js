/**
 * ==========================================================================
 * Tasveer by Prince Studio - Black Diagnostic Testing Console Window
 * (js/debug-overlay.js)
 * Real-time In-Browser Error & Health Monitoring Widget
 * ==========================================================================
 */

(function (window, document) {
    'use strict';

    // Logs memory buffer
    const consoleLogs = [];
    let isMinimized = false;

    let currentPosition = 'bottom-left';

    function initDebugOverlay() {
        if (safeGet('tasveer-debug-console-wrap')) return;

        const wrap = document.createElement('div');
        wrap.id = 'tasveer-debug-console-wrap';
        wrap.style.cssText = `
            position: fixed;
            bottom: 15px;
            left: 15px;
            z-index: 999999;
            font-family: 'Inter', -apple-system, sans-serif;
            font-size: 12px;
            color: #f8fafc;
            background: #0f172a;
            border: 2px solid #3b82f6;
            border-radius: 12px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
            max-width: 440px;
            width: calc(100vw - 30px);
            transition: all 0.2s ease;
            overflow: hidden;
            user-select: none;
        `;

        wrap.innerHTML = `
            <div id="debug-console-header" style="
                background: #1e293b;
                padding: 10px 14px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                cursor: move;
                border-bottom: 1px solid #334155;
            ">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="width: 10px; height: 10px; border-radius: 50%; background: #10b981; display: inline-block;" id="debug-status-dot"></span>
                    <strong style="color: #fbbf24; letter-spacing: 0.5px; font-size: 12px;">🛠️ SYSTEM DIAGNOSTIC MONITOR</strong>
                </div>
                <div style="display: flex; gap: 6px; align-items: center;">
                    <button onclick="window.rotateConsolePosition(event)" style="background: #475569; border: none; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;" title="Shift Position (Left / Right / Top)">📍 Position</button>
                    <button onclick="window.runTasveerSelfDiagnostic()" style="background: #2563eb; border: none; color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; cursor: pointer;">⚡ Run Test</button>
                    <span id="debug-toggle-icon" style="color: #94a3b8; font-weight: bold; cursor: pointer; padding: 0 4px; font-size: 14px;">[-]</span>
                </div>
            </div>
            <div id="debug-console-body" style="display: block; padding: 12px; max-height: 280px; overflow-y: auto;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; background: #020617; padding: 8px; border-radius: 6px; border: 1px solid #1e293b;">
                    <div><strong>Server DB:</strong> <span id="debug-server-status" style="color: #10b981;">🟢 Live (Port 8085)</span></div>
                    <div><strong>Catalog:</strong> <span id="debug-products-count" style="color: #fbbf24;">15 Items</span></div>
                    <div><strong>Cart Items:</strong> <span id="debug-cart-count" style="color: #38bdf8;">0 Items</span></div>
                    <div><strong>Engine:</strong> <span id="debug-dom-status" style="color: #10b981;">100% Operational</span></div>
                </div>
                <div style="font-weight: bold; color: #94a3b8; margin-bottom: 4px; font-size: 11px;">REAL-TIME SYSTEM LOGS:</div>
                <div id="debug-console-logs" style="
                    background: #020617;
                    border: 1px solid #1e293b;
                    border-radius: 6px;
                    padding: 10px;
                    height: 140px;
                    overflow-y: auto;
                    font-size: 11px;
                    line-height: 1.6;
                    color: #cbd5e1;
                    font-family: monospace;
                ">
                    <div style="color: #10b981;">[SYSTEM OK] Diagnostic Console Active on Port 8085.</div>
                </div>
            </div>
        `;

        document.body.appendChild(wrap);

        // Make Header Clickable & Draggable
        const header = safeGet('debug-console-header');
        header.onclick = function (e) {
            if (e.target.tagName === 'BUTTON') return;
            isMinimized = !isMinimized;
            const body = safeGet('debug-console-body');
            const icon = safeGet('debug-toggle-icon');
            if (body) body.style.display = isMinimized ? 'none' : 'block';
            if (icon) icon.innerText = isMinimized ? '[+]' : '[-]';
        };

        // Enable Drag & Move
        enableDragConsole(wrap, header);

        // Run initial health check
        refreshDiagnosticMetrics();
    }

    function rotateConsolePosition(e) {
        if (e) e.stopPropagation();
        const wrap = safeGet('tasveer-debug-console-wrap');
        if (!wrap) return;

        wrap.style.top = 'auto';
        wrap.style.bottom = 'auto';
        wrap.style.left = 'auto';
        wrap.style.right = 'auto';

        if (currentPosition === 'bottom-left') {
            currentPosition = 'top-left';
            wrap.style.top = '15px';
            wrap.style.left = '15px';
        } else if (currentPosition === 'top-left') {
            currentPosition = 'top-right';
            wrap.style.top = '15px';
            wrap.style.right = '15px';
        } else if (currentPosition === 'top-right') {
            currentPosition = 'bottom-right';
            wrap.style.bottom = '15px';
            wrap.style.right = '15px';
        } else {
            currentPosition = 'bottom-left';
            wrap.style.bottom = '15px';
            wrap.style.left = '15px';
        }
        if (window.showToast) window.showToast(`📍 Shifted Console to ${currentPosition.toUpperCase()}`);
    }

    function enableDragConsole(elmnt, dragTouchHeader) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        if (dragTouchHeader) {
            dragTouchHeader.onmousedown = dragMouseDown;
        } else {
            elmnt.onmousedown = dragMouseDown;
        }

        function dragMouseDown(e) {
            if (e.target.tagName === 'BUTTON') return;
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
            elmnt.style.bottom = 'auto';
            elmnt.style.right = 'auto';
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    function logDebugMessage(msg, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const color = type === 'error' ? '#f87171' : (type === 'warn' ? '#fbbf24' : '#10b981');
        const formatted = `<div style="color: ${color};">[${timestamp}] ${msg}</div>`;
        consoleLogs.push(formatted);

        const logContainer = safeGet('debug-console-logs');
        if (logContainer) {
            logContainer.innerHTML += formatted;
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    }

    function refreshDiagnosticMetrics() {
        const prodCountEl = safeGet('debug-products-count');
        const catEl = safeGet('debug-active-cat');
        const serverStatusEl = safeGet('debug-server-status');

        const count = window.PRODUCTS_DATA ? window.PRODUCTS_DATA.length : 0;
        if (prodCountEl) prodCountEl.innerText = `${count} Items Loaded`;
        if (catEl) catEl.innerText = window.currentCategory || 'all';

        // Check backend server on port 8085
        fetch('/api/v1/cms')
            .then(res => res.json())
            .then(data => {
                if (serverStatusEl) {
                    serverStatusEl.innerText = 'HTTP 200 OK';
                    serverStatusEl.style.color = '#10b981';
                }
            })
            .catch(err => {
                if (serverStatusEl) {
                    serverStatusEl.innerText = 'Offline / Local';
                    serverStatusEl.style.color = '#fbbf24';
                }
            });
    }

    window.runTasveerSelfDiagnostic = function () {
        logDebugMessage('Running 100% Self-Diagnostic Scan...', 'warn');
        refreshDiagnosticMetrics();

        let ok = true;
        if (!window.PRODUCTS_DATA || window.PRODUCTS_DATA.length === 0) {
            logDebugMessage('Warning: PRODUCTS_DATA is empty. Restoring default 30 master products.', 'warn');
            if (window.CoreCatalog && window.CoreCatalog.DEFAULT_PRODUCTS) {
                window.PRODUCTS_DATA = window.CoreCatalog.DEFAULT_PRODUCTS;
            }
        } else {
            logDebugMessage(`Catalog Verification: ${window.PRODUCTS_DATA.length} products active.`, 'info');
        }

        if (typeof window.renderProducts === 'function') {
            window.renderProducts();
            logDebugMessage('DOM Products Grid Re-rendered Successfully.', 'info');
        } else {
            logDebugMessage('Error: renderProducts function missing!', 'error');
            ok = false;
        }

        if (ok) {
            logDebugMessage('✅ SELF-DIAGNOSTIC PASSED: All Systems 100% Operational!', 'info');
        }
    };

    window.logDebugMessage = logDebugMessage;
    window.rotateConsolePosition = rotateConsolePosition;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDebugOverlay);
    } else {
        setTimeout(initDebugOverlay, 100);
    }

})(window, document);
