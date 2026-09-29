const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Ensure email logs directory exists for local backups & dev preview
const EMAIL_LOGS_DIR = path.join(__dirname, '..', 'logs', 'emails');
if (!fs.existsSync(EMAIL_LOGS_DIR)) {
  fs.mkdirSync(EMAIL_LOGS_DIR, { recursive: true });
}

/**
 * Creates and returns configured Nodemailer transporter
 */
function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass }
    });
  }
  return null;
}

/**
 * Generates Customer HTML Email Confirmation
 */
function generateCustomerEmailHTML(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemsRows = items.map(it => `
    <tr style="border-bottom: 1px solid #f0eee6;">
      <td style="padding: 14px 10px; vertical-align: top;">
        <div style="font-weight: 700; color: #18181b; font-size: 14px;">${it.title || it.name || 'Custom Framed Art'}</div>
        <div style="font-size: 12px; color: #71717a; margin-top: 3px;">
          ${it.size ? `<span>Size: <strong>${it.size}</strong></span> • ` : ''}
          ${it.frame ? `<span>Frame: <strong>${it.frame}</strong></span>` : ''}
        </div>
        ${it.customGdriveUrl ? `
          <div style="font-size: 11px; color: #d97706; margin-top: 4px;">
            <span>📷 High-Res Photo Attached</span>
          </div>
        ` : ''}
      </td>
      <td style="padding: 14px 10px; text-align: center; vertical-align: top; font-size: 13px; color: #52525b;">
        ${it.quantity || 1}
      </td>
      <td style="padding: 14px 10px; text-align: right; vertical-align: top; font-weight: 700; color: #18181b; font-size: 14px;">
        ₹${(Number(it.price || 0) * Number(it.quantity || 1)).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('');

  const shipping = order.shippingAddress || {};
  const formattedAddress = [
    shipping.address,
    shipping.city,
    shipping.pincode
  ].filter(Boolean).join(', ') || 'Standard Studio Delivery';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation #${order.orderNumber || order.id}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fafaf8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fafaf8; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table role="presentation" width="100%" style="max-width: 620px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 10px 30px rgba(0,0,0,0.06);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #18181b; padding: 36px 30px; text-align: center;">
              <div style="font-family: Georgia, serif; font-size: 26px; font-weight: 700; color: #ffffff; letter-spacing: 0.05em;">
                TASVEER
              </div>
              <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.3em; color: #d4d4d8; margin-top: 4px;">
                by Prince Studio • Sawai Madhopur
              </div>
              <div style="margin-top: 20px; display: inline-block; background-color: rgba(217, 119, 6, 0.2); border: 1px solid rgba(217, 119, 6, 0.4); padding: 6px 16px; rounded: 20px; border-radius: 20px; color: #fbbf24; font-size: 12px; font-weight: 700; letter-spacing: 0.05em;">
                ✓ ORDER CONFIRMED
              </div>
            </td>
          </tr>

          <!-- Greeting Body -->
          <tr>
            <td style="padding: 32px 30px 20px 30px;">
              <h1 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 700; color: #18181b;">
                Thank you for your order, ${order.customerName || 'Valued Art Lover'}!
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #52525b;">
                We have received your framing order. Our master artisans in Sawai Madhopur are preparing your artwork using 12-color archival giclée pigments and hand-milled solid wood frames.
              </p>

              <!-- Order Summary Meta Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fbfaf7; border: 1px solid #e7e5e0; border-radius: 14px; padding: 16px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 6px 12px; font-size: 12px; color: #71717a;">Order Number:</td>
                  <td style="padding: 6px 12px; font-size: 13px; font-weight: 700; color: #18181b; text-align: right;">${order.orderNumber || order.id}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 12px; font-size: 12px; color: #71717a;">Payment Method:</td>
                  <td style="padding: 6px 12px; font-size: 13px; font-weight: 700; color: #18181b; text-align: right;">${order.paymentMethod || 'Razorpay Online'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 12px; font-size: 12px; color: #71717a;">Payment Status:</td>
                  <td style="padding: 6px 12px; font-size: 13px; font-weight: 700; color: #059669; text-align: right;">✓ ${order.paymentStatus || 'Paid'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 12px; font-size: 12px; color: #71717a;">Tracking ID:</td>
                  <td style="padding: 6px 12px; font-size: 13px; font-weight: 700; color: #d97706; text-align: right;">${order.trackingNumber || 'TRK-StudioDispatch'}</td>
                </tr>
              </table>

              <!-- Items Table -->
              <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #71717a;">
                Items in Your Order
              </h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="border-bottom: 2px solid #e4e4e7;">
                    <th style="padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #a1a1aa;">Creation</th>
                    <th style="padding: 10px; text-align: center; font-size: 11px; text-transform: uppercase; color: #a1a1aa;">Qty</th>
                    <th style="padding: 10px; text-align: right; font-size: 11px; text-transform: uppercase; color: #a1a1aa;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>

              <!-- Pricing Totals -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top: 1px solid #e4e4e7; padding-top: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #71717a;">Subtotal</td>
                  <td style="padding: 4px 0; font-size: 13px; text-align: right; color: #18181b;">₹${(order.subtotal || order.totalAmount || 0).toLocaleString('en-IN')}</td>
                </tr>
                ${order.discount ? `
                  <tr>
                    <td style="padding: 4px 0; font-size: 13px; color: #059669;">Coupon Discount (${order.couponApplied || 'OFFER'})</td>
                    <td style="padding: 4px 0; font-size: 13px; text-align: right; color: #059669;">-₹${(order.discount).toLocaleString('en-IN')}</td>
                  </tr>
                ` : ''}
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #71717a;">Insured Multi-Layer Crating</td>
                  <td style="padding: 4px 0; font-size: 13px; text-align: right; color: #059669; font-weight: 600;">FREE</td>
                </tr>
                <tr style="border-top: 2px solid #18181b;">
                  <td style="padding: 12px 0 0 0; font-size: 16px; font-weight: 700; color: #18181b;">Total Paid</td>
                  <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: 700; text-align: right; color: #b45309; font-family: Georgia, serif;">₹${(order.totalAmount || 0).toLocaleString('en-IN')}</td>
                </tr>
              </table>

              <!-- Delivery Address -->
              <div style="background-color: #fafaf8; border: 1px solid #e7e5e0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.08em; color: #71717a; margin-bottom: 6px;">
                  📦 Shipping Destination:
                </div>
                <div style="font-size: 13px; font-weight: 600; color: #18181b;">${order.customerName} (${order.customerPhone})</div>
                <div style="font-size: 13px; color: #52525b; margin-top: 3px;">${formattedAddress}</div>
              </div>

              <!-- Assistance & WhatsApp Support CTA -->
              <div style="text-align: center; padding: 16px; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; margin-bottom: 10px;">
                <div style="font-size: 13px; font-weight: 700; color: #92400e; margin-bottom: 4px;">
                  Need assistance or soft-proof review?
                </div>
                <div style="font-size: 12px; color: #b45309; margin-bottom: 12px;">
                  Our framing workshop master is available on WhatsApp to guide you.
                </div>
                <a href="https://wa.me/917231900124?text=Hello%20Prince%20Studio!%20I%20have%20an%20inquiry%20regarding%20Order%20${order.orderNumber || order.id}" style="display: inline-block; background-color: #25d366; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 10px 22px; border-radius: 8px;">
                  💬 Chat on WhatsApp (+91 72319 00124)
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f4f4f5; padding: 20px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
              <div style="font-size: 12px; color: #71717a; margin-bottom: 4px;">
                © 2026 Tasveer by Prince Studio. All rights reserved.
              </div>
              <div style="font-size: 11px; color: #a1a1aa;">
                Main Market Road, Sawai Madhopur, Rajasthan 322001 • princestudio@tasviir.in
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generates Admin HTML Email Notification
 */
function generateAdminEmailHTML(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemsDetails = items.map((it, idx) => `
    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 10px;">
      <div style="font-weight: 700; font-size: 14px; color: #0f172a;">${idx + 1}. ${it.title || it.name || 'Framing Item'} (Qty: ${it.quantity || 1})</div>
      <div style="font-size: 12px; color: #475569; margin-top: 4px; line-height: 1.5;">
        • <strong>Size:</strong> ${it.size || 'Standard'}<br>
        • <strong>Moulding:</strong> ${it.frame || 'Custom Profile'}<br>
        • <strong>Price:</strong> ₹${Number(it.price || 0) * Number(it.quantity || 1)}
      </div>
      ${it.customGdriveUrl ? `
        <div style="margin-top: 8px; padding: 8px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px;">
          <strong style="color: #166534; font-size: 12px;">📁 Customer Uploaded Photo (Google Drive):</strong><br>
          <a href="${it.customGdriveUrl}" target="_blank" style="color: #2563eb; font-size: 12px; word-break: break-all; font-weight: 600;">
            ${it.customGdriveUrl}
          </a>
        </div>
      ` : ''}
    </div>
  `).join('');

  const shipping = order.shippingAddress || {};
  const formattedAddress = [
    shipping.address,
    shipping.city,
    shipping.pincode
  ].filter(Boolean).join(', ');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>👑 [NEW ORDER] #${order.orderNumber || order.id} - ₹${order.totalAmount}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 640px; background-color: #111827; border-radius: 18px; overflow: hidden; border: 1px solid rgba(245, 158, 11, 0.3); box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          
          <!-- Admin Alert Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 100%); padding: 24px; text-align: center; color: #ffffff;">
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.25em;">
                👑 WORKSHOP ALERT • NEW ORDER RECEIVED
              </div>
              <div style="font-size: 28px; font-weight: 800; margin-top: 6px;">
                ₹${(order.totalAmount || 0).toLocaleString('en-IN')}
              </div>
              <div style="font-size: 13px; opacity: 0.95; margin-top: 4px;">
                Order Number: <strong>${order.orderNumber || order.id}</strong>
              </div>
            </td>
          </tr>

          <!-- Order Content -->
          <tr>
            <td style="padding: 24px;">
              
              <!-- Customer Profile Card -->
              <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                <div style="font-size: 11px; text-transform: uppercase; color: #fbbf24; font-weight: 700; margin-bottom: 8px;">
                  👤 Customer Details
                </div>
                <div style="font-size: 15px; font-weight: 700; color: #f8fafc;">
                  ${order.customerName || 'Customer'}
                </div>
                <div style="font-size: 13px; color: #cbd5e1; margin-top: 4px;">
                  📱 WhatsApp Phone: <a href="tel:${order.customerPhone}" style="color: #38bdf8; text-decoration: none; font-weight: 600;">${order.customerPhone || 'N/A'}</a>
                  &nbsp;•&nbsp;
                  <a href="https://wa.me/91${(order.customerPhone || '').replace(/\D/g, '').slice(-10)}" style="color: #4ade80; text-decoration: none; font-weight: 700;">Open WhatsApp</a>
                </div>
                <div style="font-size: 13px; color: #cbd5e1; margin-top: 4px;">
                  ✉️ Email: <a href="mailto:${order.customerEmail}" style="color: #38bdf8; text-decoration: none;">${order.customerEmail || 'N/A'}</a>
                </div>
                <div style="font-size: 13px; color: #cbd5e1; margin-top: 6px; padding-top: 6px; border-top: 1px solid #334155;">
                  📍 <strong>Delivery Address:</strong> ${formattedAddress || 'Not provided'}
                </div>
              </div>

              <!-- Payment & Order Status -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #1e293b; border-radius: 12px; padding: 14px; margin-bottom: 20px; border: 1px solid #334155;">
                <tr>
                  <td style="font-size: 12px; color: #94a3b8; padding: 4px 8px;">Payment Gateway:</td>
                  <td style="font-size: 13px; font-weight: 700; color: #f8fafc; text-align: right; padding: 4px 8px;">${order.paymentMethod || 'Razorpay'}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #94a3b8; padding: 4px 8px;">Payment Status:</td>
                  <td style="font-size: 13px; font-weight: 700; color: #4ade80; text-align: right; padding: 4px 8px;">${order.paymentStatus || 'Paid'}</td>
                </tr>
                ${order.razorpayPaymentId ? `
                  <tr>
                    <td style="font-size: 12px; color: #94a3b8; padding: 4px 8px;">Razorpay Payment ID:</td>
                    <td style="font-size: 12px; font-family: monospace; color: #fbbf24; text-align: right; padding: 4px 8px;">${order.razorpayPaymentId}</td>
                  </tr>
                ` : ''}
              </table>

              <!-- Items in Order -->
              <div style="font-size: 12px; text-transform: uppercase; color: #fbbf24; font-weight: 700; margin-bottom: 10px;">
                🖼️ Order Items for Production:
              </div>
              ${itemsDetails}

              <!-- Admin Action CTA -->
              <div style="text-align: center; margin-top: 24px;">
                <a href="http://localhost:8085/admin" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #0f172a; text-decoration: none; font-weight: 800; font-size: 14px; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
                  🚀 Open Admin Portal to Manage Order
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0b0f19; padding: 16px; text-align: center; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b;">
              Tasveer by Prince Studio automated workshop order notification system.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Dispatches notification via EmailJS REST API
 */
async function sendViaEmailJS(order) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  const adminTemplateId = process.env.EMAILJS_TEMPLATE_ADMIN || 'template_iru34eg';
  const customerTemplateId = process.env.EMAILJS_TEMPLATE_CUSTOMER;

  if (!serviceId || !publicKey) {
    return { attempted: false, reason: 'EmailJS credentials not configured' };
  }

  const shipping = order.shippingAddress || {};
  const formattedAddress = [
    shipping.address,
    shipping.city,
    shipping.pincode
  ].filter(Boolean).join(', ') || 'Standard Studio Delivery';

  const items = Array.isArray(order.items) ? order.items : [];
  const itemsSummary = items.map((it, idx) => 
    `${idx + 1}. ${it.title || it.name || 'Framed Art'} | Size: ${it.size || 'Standard'} | Moulding: ${it.frame || 'Custom'} | Qty: ${it.quantity || 1} | ₹${Number(it.price || 0) * Number(it.quantity || 1)}`
  ).join('\n') || 'Framed Art Creation';

  const firstGdriveUrl = items.find(it => it.customGdriveUrl || it.gdriveUrl)?.customGdriveUrl 
    || items.find(it => it.gdriveUrl)?.gdriveUrl 
    || process.env.GDRIVE_FOLDER_URL 
    || 'https://drive.google.com/drive/folders/1qMAhARFgVLQNlxDXskipGaZFrTBXxYnT?usp=drive_link';

  const adminEmail = (process.env.ADMIN_EMAIL || 'tasviirframe@gmail.com').trim();
  const customerEmail = (order.customerEmail || '').trim();

  const baseParams = {
    order_number: order.orderNumber || order.id || 'N/A',
    customer_name: order.customerName || 'Customer',
    customer_email: customerEmail || 'customer@tasviir.in',
    customer_phone: order.customerPhone || 'N/A',
    admin_email: adminEmail,
    to_email: adminEmail,
    total_amount: (order.totalAmount || 0).toLocaleString('en-IN'),
    shipping_address: formattedAddress,
    payment_method: order.paymentMethod || 'Razorpay',
    payment_status: order.paymentStatus || 'Paid',
    payment_id: order.razorpayPaymentId || 'N/A',
    tracking_number: order.trackingNumber || 'TRK-StudioDispatch',
    items_summary: itemsSummary,
    gdrive_url: firstGdriveUrl
  };

  const results = { attempted: true, adminSent: false, customerSent: false, errors: [] };

  // 1. Dispatch Admin Notification via EmailJS
  try {
    const adminPayload = {
      service_id: serviceId,
      template_id: adminTemplateId,
      user_id: publicKey,
      template_params: {
        ...baseParams,
        to_email: adminEmail,
        recipient: adminEmail
      }
    };
    if (privateKey) adminPayload.accessToken = privateKey;

    const resAdmin = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:8085'
      },
      body: JSON.stringify(adminPayload)
    });

    if (resAdmin.ok) {
      console.log(`[EmailJS] ✓ Admin notification sent via template: ${adminTemplateId} to ${adminEmail}`);
      results.adminSent = true;
    } else {
      const errText = await resAdmin.text();
      console.warn(`[EmailJS] ✕ Admin notification failed:`, errText);
      results.errors.push(`Admin EmailJS error: ${errText}`);
    }
  } catch (err) {
    console.warn(`[EmailJS] ✕ Admin send error:`, err.message);
    results.errors.push(err.message);
  }

  // 2. Dispatch Customer Confirmation via EmailJS (if customer template configured)
  if (customerTemplateId && customerEmail && customerEmail.includes('@')) {
    try {
      const custPayload = {
        service_id: serviceId,
        template_id: customerTemplateId,
        user_id: publicKey,
        template_params: {
          ...baseParams,
          to_email: customerEmail,
          customer_email: customerEmail,
          email: customerEmail,
          recipient: customerEmail,
          user_email: customerEmail,
          to_name: order.customerName || 'Customer',
          reply_to: adminEmail
        }
      };
      if (privateKey) custPayload.accessToken = privateKey;

      const resCust = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:8085'
        },
        body: JSON.stringify(custPayload)
      });

      if (resCust.ok) {
        console.log(`[EmailJS] ✓ Customer notification sent via template: ${customerTemplateId}`);
        results.customerSent = true;
      } else {
        const errText = await resCust.text();
        console.warn(`[EmailJS] ✕ Customer notification failed:`, errText);
        results.errors.push(`Customer EmailJS error: ${errText}`);
      }
    } catch (err) {
      console.warn(`[EmailJS] ✕ Customer send error:`, err.message);
      results.errors.push(err.message);
    }
  }

  return results;
}

/**
 * Main dispatcher: Sends confirmation emails to both Customer and Admin
 * @param {Object} order - The complete order document
 * @returns {Promise<Object>} dispatch results summary
 */
async function sendOrderConfirmationEmails(order) {
  if (!order) return { success: false, message: 'No order data' };

  const customerEmail = (order.customerEmail || '').trim();
  const adminEmail = (process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'tasviirframe@gmail.com').trim();
  const fromEmail = process.env.FROM_EMAIL || `"Tasveer by Prince Studio" <${adminEmail}>`;

  const customerHTML = generateCustomerEmailHTML(order);
  const adminHTML = generateAdminEmailHTML(order);

  // 1. Always save a copy to local disk logs for instant preview & auditing
  const orderIdSafe = (order.orderNumber || order.id || 'order').replace(/[^a-zA-Z0-9_-]/g, '_');
  const timestamp = Date.now();
  const customerLogFile = path.join(EMAIL_LOGS_DIR, `${orderIdSafe}_customer_${timestamp}.html`);
  const adminLogFile = path.join(EMAIL_LOGS_DIR, `${orderIdSafe}_admin_${timestamp}.html`);

  try {
    fs.writeFileSync(customerLogFile, customerHTML, 'utf8');
    fs.writeFileSync(adminLogFile, adminHTML, 'utf8');
    console.log(`[Email Service] Saved local copies of order emails to: ${customerLogFile} and ${adminLogFile}`);
  } catch (logErr) {
    console.warn('[Email Service] Failed saving local email log:', logErr.message);
  }

  // 2. Dispatch via EmailJS if configured
  let emailjsResult = null;
  if (process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_PUBLIC_KEY) {
    emailjsResult = await sendViaEmailJS(order);
  }

  // 3. Dispatch via Nodemailer if SMTP transporter is available
  const transporter = getTransporter();

  if (!transporter && !emailjsResult?.attempted) {
    console.log(`\n======================================================`);
    console.log(`[Email Service Simulation Mode]`);
    console.log(`ℹ️  Neither SMTP nor EmailJS credentials are fully set in .env.`);
    console.log(`📩 Customer Email prepared for: ${customerEmail || 'customer (pending input)'}`);
    console.log(`📩 Admin Email prepared for:    ${adminEmail}`);
    console.log(`📁 Saved full HTML previews to:  ${EMAIL_LOGS_DIR}`);
    console.log(`======================================================\n`);

    return {
      success: true,
      mode: 'simulated',
      customerEmail: customerEmail || 'simulated@tasviir.in',
      adminEmail,
      message: 'Emails formatted and saved locally (configure EmailJS or SMTP in .env for live transmission)',
      customerLogFile,
      adminLogFile
    };
  }

  // 4. Live SMTP dispatch if transporter available
  const results = {
    customerSent: emailjsResult?.customerSent || false,
    adminSent: emailjsResult?.adminSent || false,
    emailjs: emailjsResult,
    errors: [...(emailjsResult?.errors || [])]
  };

  if (transporter) {
    const emailPromises = [];

    // Customer Email
    if (customerEmail && customerEmail.includes('@') && !customerEmail.includes('example.com')) {
      emailPromises.push(
        transporter.sendMail({
          from: fromEmail,
          to: customerEmail,
          subject: `🎨 Order Confirmed: #${order.orderNumber || order.id} - Tasveer by Prince Studio`,
          html: customerHTML
        }).then(info => {
          console.log(`[Email Service] ✓ Customer email sent to ${customerEmail}: ${info.messageId}`);
          results.customerSent = true;
        }).catch(err => {
          console.error(`[Email Service] ✕ Failed sending customer email to ${customerEmail}:`, err.message);
          results.errors.push(`Customer email error: ${err.message}`);
        })
      );
    }

    // Admin Email
    if (adminEmail && adminEmail.includes('@')) {
      emailPromises.push(
        transporter.sendMail({
          from: fromEmail,
          to: adminEmail,
          subject: `👑 [NEW ORDER] #${order.orderNumber || order.id} - ₹${order.totalAmount || 0} from ${order.customerName || 'Customer'}`,
          html: adminHTML
        }).then(info => {
          console.log(`[Email Service] ✓ Admin notification sent to ${adminEmail}: ${info.messageId}`);
          results.adminSent = true;
        }).catch(err => {
          console.error(`[Email Service] ✕ Failed sending admin notification to ${adminEmail}:`, err.message);
          results.errors.push(`Admin email error: ${err.message}`);
        })
      );
    }

    await Promise.allSettled(emailPromises);
  }

  return {
    success: true,
    mode: 'live',
    ...results
  };
}

module.exports = {
  sendOrderConfirmationEmails,
  generateCustomerEmailHTML,
  generateAdminEmailHTML,
  sendViaEmailJS
};

