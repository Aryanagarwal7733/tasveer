function safeGet(id) {
  const el = document.getElementById(id);
  // Only warn for truly critical elements, not optional CMS elements
  const optionalIds = [
    'theme-toggle-btn', 'debug-cart-count', 'tasveer-debug-console-wrap',
    'debug-active-cat', 'cms-bento-grid', 'bento-grid-container',
    'cms-bento-tag', 'cms-bento-title', 'cart-final-total-val',
    'cart-items-list', 'wishlist-items-list', 'quickview-modal-overlay'
  ];
  if (!el && !optionalIds.includes(id)) {
    console.warn(`[Tasveer] Missing element: #${id}`);
  }
  return el;
}

// Production Live Razorpay Integration (Tasveer by Prince Studio)
window.RAZORPAY_KEY_ID = 'rzp_live_TRFmjNYX9knTwo';

