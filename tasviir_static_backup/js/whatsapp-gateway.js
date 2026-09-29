/**
 * ==========================================================================
 * Tasveer by Prince Studio - Automated WhatsApp Cloud Gateway (js/whatsapp-gateway.js)
 * 100% Background Automated WhatsApp Messaging for Orders, Payments & Shipping
 * Supports UltraMsg & Green-API Instance Gateways
 * ==========================================================================
 */

(function (window) {
    'use strict';

    const safeStorage = {
        getItem: function (key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
        setItem: function (key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
    };

    const WhatsAppGateway = {
        // Default Studio Credentials (can be configured via Admin Portal)
        getConfig: function () {
            return {
                provider: safeStorage.getItem('tasveer_wa_provider') || window.WA_PROVIDER || 'aisensy', // 'aisensy' | 'meta' | 'authkey' | 'fast2sms' | 'ultramsg' | 'greenapi'
                instanceId: safeStorage.getItem('tasveer_wa_instance') || window.WA_INSTANCE_ID || '1334066966446336',
                token: safeStorage.getItem('tasveer_wa_token') || window.WA_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhODU3YTI1MmY0MGY3MTdkYmNkOTU1MyIsIm5hbWUiOiJUYXNlZXIuaW4iLCJhcHBOYW1lIjoiQWlTZW5zeSIsImNsaWVudElkIjoiNmE4NTdhMjUyZjQwZjcxN2RiY2Q5NTRjIiwiYWN0aXZlUGxhbiI6IlBST19NT05USExZIiwiaWF0IjoxNzg3MTMyNzE0fQ.oktepAA3d4Wy5jzQhWLZeE1ygGze0kNkD82812k3qqk',
                adminPhone: safeStorage.getItem('tasveer_wa_admin_phone') || '917231900124',
                isEnabled: safeStorage.getItem('tasveer_wa_enabled') !== 'false'
            };
        },

        setConfig: function (config) {
            if (config.provider) safeStorage.setItem('tasveer_wa_provider', config.provider);
            if (config.instanceId !== undefined) safeStorage.setItem('tasveer_wa_instance', config.instanceId);
            if (config.token !== undefined) safeStorage.setItem('tasveer_wa_token', config.token);
            if (config.adminPhone) safeStorage.setItem('tasveer_wa_admin_phone', config.adminPhone);
            if (config.isEnabled !== undefined) safeStorage.setItem('tasveer_wa_enabled', config.isEnabled ? 'true' : 'false');
        },

        // Format Indian mobile numbers into standard 91XXXXXXXXXX format
        formatPhone: function (phone) {
            if (!phone) return '';
            let p = phone.toString().replace(/[^0-9]/g, '');
            if (p.length === 10) return '91' + p;
            if (p.length === 11 && p.startsWith('0')) return '91' + p.substring(1);
            if (p.length === 12 && p.startsWith('91')) return p;
            return p;
        },

        // Send direct text message via Authkey, Meta Cloud, AiSensy, UltraMsg or Green-API
        sendMessage: async function (toPhone, messageText) {
            const config = WhatsAppGateway.getConfig();
            const formattedPhone = WhatsAppGateway.formatPhone(toPhone);
            const clean10Phone = formattedPhone.startsWith('91') && formattedPhone.length === 12 ? formattedPhone.substring(2) : formattedPhone;

            if (!formattedPhone || !messageText) {
                console.warn('[WhatsApp Gateway] Missing phone or message content.');
                return false;
            }

            if (!config.token) {
                console.info('[WhatsApp Gateway] Gateway API Key / Token pending. Message ready for', formattedPhone);
                return false;
            }

            try {
                if (config.provider === 'fast2sms') {
                    // Fast2SMS API (Quick Transactional & WhatsApp Alerts)
                    const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(config.token)}&route=q&message=${encodeURIComponent(messageText)}&language=english&flash=0&numbers=${encodeURIComponent(clean10Phone)}`;
                    const resp = await fetch(url, { method: 'GET' }).catch(() => null);
                    const res = resp ? await resp.json().catch(() => ({})) : {};
                    console.log('✅ [Gateway Fast2SMS Response]:', res);
                    return res && (res.return === true || res.status_code === 200);
                } else if (config.provider === 'authkey') {
                    // Authkey.io Pay-As-You-Go API (~15 paise per msg)
                    const url = `https://api.authkey.io/request?authkey=${encodeURIComponent(config.token)}&mobile=${encodeURIComponent(clean10Phone)}&country_code=91&sid=${encodeURIComponent(config.instanceId || '1001')}&company=PrinceStudio&body=${encodeURIComponent(messageText)}`;
                    let resp = await fetch(url, { method: 'GET' }).catch(() => null);
                    if (!resp || !resp.ok) {
                        const fallbackUrl = `https://console.authkey.io/rest/api/request.php?authkey=${encodeURIComponent(config.token)}&mobile=${encodeURIComponent(clean10Phone)}&country_code=91&sid=${encodeURIComponent(config.instanceId || '1001')}&body=${encodeURIComponent(messageText)}`;
                        resp = await fetch(fallbackUrl, { method: 'GET' }).catch(() => null);
                    }
                    const res = resp ? await resp.json().catch(() => ({})) : {};
                    console.log('✅ [WhatsApp Gateway Authkey Response]:', res);
                    return res && (res.status === 'success' || res.message === 'submitted' || res.log_id || res.id);
                } else if (config.provider === 'meta') {
                    // Official Meta WhatsApp Cloud API
                    const url = `https://graph.facebook.com/v19.0/${config.instanceId}/messages`;
                    const resp = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${config.token}`
                        },
                        body: JSON.stringify({
                            messaging_product: 'whatsapp',
                            to: formattedPhone,
                            type: 'text',
                            text: { preview_url: false, body: messageText }
                        })
                    });
                    const res = await resp.json();
                    console.log('✅ [WhatsApp Gateway Meta Cloud Success]:', res);
                    return res && res.messages && res.messages.length > 0;
                } else if (config.provider === 'aisensy') {
                    // AiSensy WhatsApp API
                    const url = 'https://backend.aisensy.com/campaign/t1/api/v2';
                    const resp = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            apiKey: config.token,
                            campaignName: 'order_confirmation',
                            destination: formattedPhone,
                            userName: 'Valued Customer',
                            templateParams: [messageText]
                        })
                    });
                    const res = await resp.json();
                    console.log('✅ [WhatsApp Gateway AiSensy Success]:', res);
                    return res && res.success;
                } else if (config.provider === 'ultramsg') {
                    // UltraMsg API Endpoint
                    const url = `https://api.ultramsg.com/${config.instanceId}/messages/chat`;
                    const params = new URLSearchParams();
                    params.append('token', config.token);
                    params.append('to', formattedPhone);
                    params.append('body', messageText);

                    const resp = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: params.toString()
                    });
                    const res = await resp.json();
                    console.log('✅ [WhatsApp Gateway UltraMsg Success]:', res);
                    return res && (res.sent === 'true' || res.id);
                } else if (config.provider === 'greenapi') {
                    // Green-API Endpoint
                    const url = `https://api.green-api.com/waInstance${config.instanceId}/sendMessage/${config.token}`;
                    const resp = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chatId: `${formattedPhone}@c.us`,
                            message: messageText
                        })
                    });
                    const res = await resp.json();
                    console.log('✅ [WhatsApp Gateway GreenAPI Success]:', res);
                    return res && res.idMessage;
                }
            } catch (err) {
                console.warn('[WhatsApp Gateway Network Error]:', err);
                return false;
            }
        },

        // 1. Send Order Confirmation TO Customer
        sendOrderConfirmationToCustomer: async function (order) {
            if (!order) return;
            const customerPhone = order.phone || (order.customer && order.customer.phone);
            const customerName = order.customerName || (order.customer && order.customer.name) || 'Valued Customer';
            const orderId = order.id || order.orderId || 'TAS-' + Math.floor(10000 + Math.random() * 90000);
            const total = order.total || order.totalAmount || 499;
            const status = order.paymentStatus || 'Pending';
            const address = order.address || (order.customer && order.customer.address) || 'Sawai Madhopur';

            const itemsStr = (order.items && order.items.length > 0)
                ? order.items.map((i, idx) => `  ${idx + 1}. ${i.title || i.name} (x${i.qty || i.quantity || 1}) - ₹${(i.price || 499) * (i.qty || i.quantity || 1)}`).join('\n')
                : `  1. Custom Photo Frame - ₹${total}`;

            const msg = [
                `🎉 *ORDER CONFIRMED - TASVEER BY PRINCE STUDIO* 🎉`,
                ``,
                `Namaste *${customerName}* ji,`,
                `Aapka order successfully receive ho gaya hai! Hamari studio team ne aapke photo frame ka production process start kar diya hai.`,
                ``,
                `📦 *Order ID:* ${orderId}`,
                `💰 *Total Amount:* ₹${total}`,
                `💳 *Payment Status:* ${status}`,
                `📍 *Delivery Address:* ${address}`,
                ``,
                `🖼️ *Items Ordered:*`,
                itemsStr,
                ``,
                `🚚 *Estimated Dispatch:* 24-48 Hours`,
                ``,
                `Aapke photo frame ka digital soft-proof preview jald hi aapke is WhatsApp number par share kiya jayega.`,
                ``,
                `Aapka Dhanyawad! 🙏`,
                `*Prince Studio, Sawai Madhopur* | 📞 Helpline: +91 72319 00124`
            ].join('\n');

            return await WhatsAppGateway.sendMessage(customerPhone, msg);
        },

        // 2. Send Real-Time New Order Alert TO Prince Studio Admin
        sendNewOrderAlertToAdmin: async function (order) {
            const config = WhatsAppGateway.getConfig();
            if (!config.adminPhone) return;

            const customerPhone = order.phone || (order.customer && order.customer.phone) || 'N/A';
            const customerName = order.customerName || (order.customer && order.customer.name) || 'Customer';
            const orderId = order.id || order.orderId;
            const total = order.total || order.totalAmount || 499;
            const status = order.paymentStatus || 'Pending';

            const msg = [
                `🔔 *NEW WEBSITE ORDER ALERT - PRINCE STUDIO* 🔔`,
                ``,
                `A new order has just been placed on tasviir.in!`,
                ``,
                `📦 *Order ID:* ${orderId}`,
                `👤 *Customer:* ${customerName}`,
                `📞 *Phone:* ${customerPhone}`,
                `💰 *Amount:* ₹${total}`,
                `💳 *Payment:* ${status}`,
                ``,
                `👉 Check Admin Portal to view/download HD Photo & print shipping label: https://tasviir.in/admin.html`
            ].join('\n');

            return await WhatsAppGateway.sendMessage(config.adminPhone, msg);
        },

        // 3. Complete Order Dispatch Trigger (Customer + Admin Notification)
        dispatchOrderNotifications: function (order) {
            WhatsAppGateway.sendOrderConfirmationToCustomer(order);
            WhatsAppGateway.sendNewOrderAlertToAdmin(order);
        }
    };

    window.WhatsAppGateway = WhatsAppGateway;

})(window);
