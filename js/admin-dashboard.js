/**
 * ==========================================================================
 * Tasveer by Prince Studio - Admin Dashboard & Analytics (js/admin-dashboard.js)
 * Financial Analytics Command Center, Revenue Reports & Chart.js Engine
 * ==========================================================================
 */

(function (window, document) {
    'use strict';

    let salesChartInstance = null;

    function renderDashboard() {
        const orders = window.masterOrders || window.orders || [];
        const products = window.masterProducts || window.products || [];

        const activeOrders = orders.filter(o => !o.isDeleted);
        const totalRevenue = activeOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
        const pendingCount = activeOrders.filter(o => (o.status || 'Processing') === 'Processing').length;
        const totalProductsCount = products.filter(p => !p.isDeleted).length;

        const revEl = safeGet('stat-total-revenue');
        if (revEl) revEl.innerText = `₹${totalRevenue.toLocaleString()}`;

        const ordEl = safeGet('stat-total-orders');
        if (ordEl) ordEl.innerText = activeOrders.length;

        const pendEl = safeGet('stat-pending-orders');
        if (pendEl) pendEl.innerText = pendingCount;

        const prodEl = safeGet('stat-total-products');
        if (prodEl) prodEl.innerText = totalProductsCount;

        renderSalesChart(activeOrders);
        renderRecentOrdersWidget(activeOrders);
    }

    function renderSalesChart(orders) {
        const ctx = safeGet('salesChart');
        if (!ctx) return;

        if (salesChartInstance) {
            salesChartInstance.destroy();
        }

        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const dataPoints = [1200, 2400, 1800, 3200, 4500, 6800, 8900];

        try {
            salesChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Revenue (₹)',
                        data: dataPoints,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
                    }
                }
            });
        } catch (e) {
            console.warn('[Dashboard] Chart render skipped:', e);
        }
    }

    function renderRecentOrdersWidget(orders) {
        const tbody = safeGet('dash-recent-orders-tbody') || safeGet('recent-orders-tbody');
        if (!tbody) return;

        const recent = orders.filter(o => !o.isDeleted).slice(0, 7);
        if (recent.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:#94a3b8;">No recent orders recorded yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = recent.map(o => {
            const isPaid = (o.paymentStatus === 'PAID' || o.paymentStatus === 'SUCCESS' || (o.paymentId && o.paymentId.startsWith('pay_')));
            const paymentBadge = isPaid ? `
                <span class="badge" style="background:#059669; color:#ffffff; padding:3px 8px; border-radius:6px; font-weight:800; font-size:0.72rem; display:inline-flex; align-items:center; gap:4px;">
                    <i class="fas fa-check-circle"></i> PAID
                </span>
            ` : `
                <span class="badge" style="background:#d97706; color:#ffffff; padding:3px 8px; border-radius:6px; font-weight:800; font-size:0.72rem; display:inline-flex; align-items:center; gap:4px;">
                    <i class="fas fa-clock"></i> PENDING
                </span>
            `;

            return `
                <tr>
                    <td><strong style="color:var(--gold-bright);">${o.id}</strong></td>
                    <td>${o.customerName || 'Customer'}</td>
                    <td>${o.date || '2026-08-16'}</td>
                    <td><strong style="color:#fef08a;">₹${o.total || 499}</strong></td>
                    <td>${paymentBadge}</td>
                    <td><span class="badge badge-warning" style="font-size:0.75rem;">${o.status || 'Processing'}</span></td>
                    <td>
                        <button class="btn-sm btn-outline" onclick="switchAdminTab('orders')" style="font-size:0.72rem; padding:3px 8px;">
                            View
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Expose Dashboard API
    window.renderDashboard = renderDashboard;

})(window, document);
