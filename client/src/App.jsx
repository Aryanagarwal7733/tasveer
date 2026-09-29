import React, { useState, useEffect } from 'react';

const API_BASE = '/api';

export default function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cms, setCms] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Customizer Modal State
  const [customizerProduct, setCustomizerProduct] = useState(null);
  const [customSize, setCustomSize] = useState('12x18');
  const [customFrame, setCustomFrame] = useState('teak');
  const [customMatting, setCustomMatting] = useState(15);
  const [uploadedPhoto, setUploadedPhoto] = useState(null);
  
  // Cart State
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('tasveer_mern_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');

  // Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: 'Sawai Madhopur',
    pincode: '322001',
    paymentMethod: 'UPI'
  });
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Tracker State
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [trackQuery, setTrackQuery] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackMsg, setTrackMsg] = useState('');

  // Admin Modal State
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('tasveer_token') || '');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminOrders, setAdminOrders] = useState([]);
  const [adminActiveTab, setAdminActiveTab] = useState('orders');

  // Save Cart to LocalStorage
  useEffect(() => {
    localStorage.setItem('tasveer_mern_cart', JSON.stringify(cart));
  }, [cart]);

  // Load Initial Data from MERN Backend
  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      const [resProd, resCat, resCms] = await Promise.all([
        fetch(`${API_BASE}/products`),
        fetch(`${API_BASE}/categories`),
        fetch(`${API_BASE}/cms`)
      ]);
      if (resProd.ok) {
        const prodData = await resProd.json();
        setProducts(prodData);
      }
      if (resCat.ok) {
        const catData = await resCat.json();
        setCategories(catData);
      }
      if (resCms.ok) {
        const cmsData = await resCms.json();
        setCms(cmsData);
      }
    } catch (err) {
      console.error('Error fetching data from MongoDB backend:', err);
    }
  }

  // Handle Photo Upload
  function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedPhoto(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  // Calculate Price for Customizer
  function getCustomPrice() {
    if (!customizerProduct) return 0;
    let base = Number(customizerProduct.price || customizerProduct.basePrice || 499);
    if (customSize === '8x12') base = Math.round(base * 0.75);
    if (customSize === '16x24') base = Math.round(base * 1.45);
    if (customSize === '20x30') base = Math.round(base * 1.95);
    if (customSize === '24x36') base = Math.round(base * 2.6);
    if (customFrame === 'gold') base += 250;
    if (customFrame === 'walnut') base += 150;
    if (customMatting > 0) base += 80;
    return base;
  }

  // Add to Cart
  function addToCart(product, isCustom = false) {
    const price = isCustom ? getCustomPrice() : Number(product.price || product.basePrice || 499);
    const item = {
      cartId: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      productId: product.id,
      title: product.title || product.name,
      price: price,
      image: isCustom && uploadedPhoto ? uploadedPhoto : (product.image || 'tasveer-banner.jpg'),
      isCustom: isCustom,
      size: isCustom ? customSize : 'Standard',
      frame: isCustom ? customFrame : 'Default',
      matting: isCustom ? `${customMatting}mm White Matting` : 'Standard',
      quantity: 1
    };

    setCart(prev => [item, ...prev]);
    setIsCartOpen(true);
    if (isCustom) setCustomizerProduct(null);
  }

  // Remove from Cart
  function removeFromCart(cartId) {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  }

  // Update Cart Quantity
  function updateQuantity(cartId, delta) {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  }

  // Coupon Validation
  async function applyCoupon() {
    try {
      const res = await fetch(`${API_BASE}/coupons`);
      if (res.ok) {
        const coupons = await res.json();
        const found = coupons.find(c => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.isActive !== false);
        if (found) {
          const subtotal = cart.reduce((acc, it) => acc + (it.price * it.quantity), 0);
          if (subtotal >= (found.minCart || 0)) {
            let disc = found.discountType === 'percent' ? Math.round((subtotal * found.value) / 100) : found.value;
            setAppliedDiscount(disc);
            setCouponMsg(`🎉 Coupon Applied: -₹${disc}`);
          } else {
            setCouponMsg(`⚠️ Minimum cart value of ₹${found.minCart} required`);
          }
        } else {
          setCouponMsg('❌ Invalid or expired coupon code');
        }
      }
    } catch (e) {
      setCouponMsg('Error checking coupon');
    }
  }

  // Calculate Totals
  const subtotal = cart.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  const discount = appliedDiscount;
  const shipping = subtotal > 499 ? 0 : 49;
  const finalTotal = Math.max(0, subtotal - discount + shipping);

  // Submit Order to MongoDB
  async function submitOrder(e) {
    e.preventDefault();
    if (cart.length === 0) return alert('Cart is empty!');
    if (!customer.name || !customer.phone || !customer.address) {
      return alert('Please fill in Name, Phone, and Delivery Address!');
    }

    const orderData = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      orderNumber: `TSV-${Math.floor(100000 + Math.random() * 900000)}`,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email || 'customer@tasviir.in',
      shippingAddress: {
        address: customer.address,
        city: customer.city,
        pincode: customer.pincode
      },
      items: cart,
      subtotal: subtotal,
      discount: discount,
      shipping: shipping,
      totalAmount: finalTotal,
      couponApplied: couponCode,
      paymentMethod: customer.paymentMethod,
      paymentStatus: customer.paymentMethod === 'UPI' ? 'Pending Approval' : 'COD Confirmed',
      orderStatus: 'Order Placed',
      trackingNumber: `TRK-PRINCE-${Math.floor(1000 + Math.random() * 9000)}`,
      timeline: [
        { status: 'Order Placed', time: new Date().toLocaleTimeString(), date: new Date().toLocaleDateString() }
      ]
    };

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (res.ok) {
        setOrderSuccess(orderData);
        setCart([]);
        setIsCheckoutOpen(false);
      } else {
        alert('Could not save order to server. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Order failed to connect to backend.');
    }
  }

  // Order Tracking
  async function trackOrder(e) {
    e.preventDefault();
    setTrackMsg('Searching order database...');
    try {
      const res = await fetch(`${API_BASE}/orders`);
      if (res.ok) {
        const allOrders = await res.json();
        const q = trackQuery.trim().toLowerCase();
        const found = allOrders.find(o => 
          (o.id && o.id.toLowerCase() === q) || 
          (o.orderNumber && o.orderNumber.toLowerCase() === q) || 
          (o.customerPhone && o.customerPhone.includes(q))
        );
        if (found) {
          setTrackedOrder(found);
          setTrackMsg('');
        } else {
          setTrackedOrder(null);
          setTrackMsg('❌ No matching order found. Please check Order ID or Phone.');
        }
      }
    } catch (err) {
      setTrackMsg('Error querying order database');
    }
  }

  // Admin Login
  async function handleAdminLogin(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setAdminToken(data.token);
        localStorage.setItem('tasveer_token', data.token);
        fetchAdminOrders();
      } else {
        alert(data.message || 'Invalid credentials');
      }
    } catch (err) {
      alert('Login error');
    }
  }

  async function fetchAdminOrders() {
    try {
      const res = await fetch(`${API_BASE}/orders`);
      if (res.ok) {
        const data = await res.json();
        setAdminOrders(data);
      }
    } catch (e) {}
  }

  async function updateOrderStatus(orderId, newStatus) {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus })
      });
      if (res.ok) {
        fetchAdminOrders();
        alert(`Order status updated to: ${newStatus}`);
      }
    } catch (e) {
      alert('Error updating order');
    }
  }

  // Filter Products
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      (p.title && p.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const cmsData = (cms && cms.cms) ? cms.cms : {
    logoTitle: "Tasveer",
    logoSub: "by Prince Studio",
    heroTitle: "Crafting Royal Gallery Art For Your Walls",
    heroSubtext: "Upload your personal photos, select real Italian wood moldings, white mount borders, and order with instant UPI & WhatsApp soft-proof approval!",
    heroBtnText: "📸 Upload & Frame Photo (₹499)",
    announcementText: "Official Prince Studio Online Art Gallery | Custom Framing"
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. TOP ANNOUNCEMENT BANNER */}
      <div style={{ background: 'linear-gradient(90deg, #b45309, #d97706, #b45309)', color: '#fff', textAlign: 'center', padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.5px' }}>
        <i className="fas fa-crown" style={{ marginRight: '8px', color: '#fef08a' }}></i>
        {cmsData.announcementText || "Official Prince Studio Online Art Gallery | Custom Framing"}
        <span style={{ marginLeft: '16px', background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '4px' }}>MERN Stack Live ⚡</span>
      </div>

      {/* 2. NAVIGATION BAR */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(16px)', background: 'rgba(10, 13, 20, 0.85)', borderBottom: '1px solid rgba(245, 158, 11, 0.15)', padding: '14px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          
          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setSelectedCategory('all')}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b, #78350f)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>
              <i className="fas fa-palette" style={{ color: '#fff', fontSize: '1.25rem' }}></i>
            </div>
            <div>
              <div className="font-cinzel" style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '1px', lineHeight: 1.1 }}>
                <span className="gold-text">{cmsData.logoTitle || "Tasveer"}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase' }}>
                {cmsData.logoSub || "by Prince Studio"}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ flex: 1, maxWidth: '420px', position: 'relative' }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}></i>
            <input 
              type="text" 
              placeholder="Search frames, canvas, dimensions..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: '9999px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#f8fafc', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn-outline" onClick={() => setIsTrackerOpen(true)}>
              <i className="fas fa-truck-fast"></i> Track Order
            </button>

            <button className="btn-gold" onClick={() => setIsCartOpen(true)}>
              <i className="fas fa-shopping-bag"></i> Cart
              {cart.length > 0 && (
                <span style={{ background: '#0f172a', color: '#fbbf24', borderRadius: '9999px', padding: '1px 8px', fontSize: '0.75rem', fontWeight: 800 }}>
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>

            <button className="btn-outline" onClick={() => { setIsAdminOpen(true); if(adminToken) fetchAdminOrders(); }}>
              <i className="fas fa-shield-alt"></i> Admin
            </button>
          </div>

        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section style={{ position: 'relative', padding: '60px 24px 80px', overflow: 'hidden', textAlign: 'center' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '9999px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', fontSize: '0.85rem', fontWeight: 600, marginBottom: '20px' }}>
            <i className="fas fa-sparkles"></i> Sawai Madhopur's Premier Luxury Art Studio
          </div>
          
          <h1 className="font-cinzel" style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '20px' }}>
            Crafting Royal <span className="gold-text">Gallery Art</span> For Your Walls
          </h1>
          
          <p style={{ fontSize: '1.1rem', color: '#94a3b8', lineHeight: 1.6, maxWidth: '720px', margin: '0 auto 32px' }}>
            {cmsData.heroSubtext || "Upload your personal photos, select real Italian wood moldings, white mount borders, and order with instant UPI & WhatsApp soft-proof approval!"}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button className="btn-gold" style={{ fontSize: '1.05rem', padding: '14px 32px' }} onClick={() => {
              const defaultProd = products.find(p => p.category === 'cat_photo_frames') || products[0];
              if (defaultProd) setCustomizerProduct(defaultProd);
            }}>
              <i className="fas fa-camera"></i> {cmsData.heroBtnText || "📸 Upload & Frame Photo (₹499)"}
            </button>
            <a href="#catalog" className="btn-outline" style={{ fontSize: '1rem', padding: '14px 28px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-th"></i> Explore Collections
            </a>
          </div>
        </div>
      </section>

      {/* 4. BENTO GRID SHOWCASE */}
      <section style={{ maxWidth: '1280px', margin: '0 auto 60px', padding: '0 24px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem', fontWeight: 700 }}>Gallery Architecture</span>
          <h2 className="font-cinzel" style={{ fontSize: '2rem', marginTop: '6px' }}>Framing Collections</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {[
            { title: "Italian Wooden Wall Frames", tag: "Bestseller", desc: "Solid teak & oak moldings with white matting", cat: "cat_photo_frames", icon: "fa-vector-square" },
            { title: "Museum Canvas Prints", tag: "Fine Art", desc: "100% Cotton Textured HD archival canvas", cat: "cat_canvas_prints", icon: "fa-palette" },
            { title: "Glossy Acrylic Prints", tag: "3D Float", desc: "Shatterproof float glass style luxury", cat: "cat_photo_frames", icon: "fa-gem" },
            { title: "Custom HD Lab Posters", tag: "Studio HD", desc: "Premium 300GSM matte lab prints", cat: "cat_photo_prints", icon: "fa-print" }
          ].map((card, i) => (
            <div 
              key={i} 
              className="glass-panel" 
              style={{ padding: '24px', cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden' }}
              onClick={() => setSelectedCategory(card.cat)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {card.tag}
                </span>
                <i className={`fas ${card.icon}`} style={{ color: 'rgba(245, 158, 11, 0.6)', fontSize: '1.5rem' }}></i>
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 700 }}>{card.title}</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5 }}>{card.desc}</p>
              <div style={{ marginTop: '16px', color: '#fbbf24', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                View Collection <i className="fas fa-arrow-right" style={{ fontSize: '0.75rem' }}></i>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CATEGORY FILTER TABS & PRODUCT CATALOG */}
      <section id="catalog" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px 80px', width: '100%', flex: 1 }}>
        
        {/* Category Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '32px' }} className="custom-scrollbar">
          <button 
            onClick={() => setSelectedCategory('all')}
            style={{ 
              padding: '10px 22px', 
              borderRadius: '9999px', 
              border: selectedCategory === 'all' ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)', 
              background: selectedCategory === 'all' ? 'var(--gold-gradient)' : 'rgba(255,255,255,0.05)', 
              color: selectedCategory === 'all' ? '#0f172a' : '#f8fafc', 
              fontWeight: 700, 
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            All Products ({products.length})
          </button>
          
          {[
            { id: 'cat_photo_frames', name: 'Photo Frames', icon: 'fa-vector-square' },
            { id: 'cat_canvas_prints', name: 'Canvas Prints', icon: 'fa-palette' },
            { id: 'cat_collage_frames', name: 'Collage Frames', icon: 'fa-th-large' },
            { id: 'cat_photo_prints', name: 'Photo Prints', icon: 'fa-print' },
            { id: 'cat_other', name: 'Specialty Gifts', icon: 'fa-gift' }
          ].map(cat => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{ 
                padding: '10px 20px', 
                borderRadius: '9999px', 
                border: selectedCategory === cat.id ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)', 
                background: selectedCategory === cat.id ? 'var(--gold-gradient)' : 'rgba(255,255,255,0.05)', 
                color: selectedCategory === cat.id ? '#0f172a' : '#f8fafc', 
                fontWeight: 700, 
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className={`fas ${cat.icon}`}></i> {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {filteredProducts.map(product => (
            <div key={product.id} className="glass-panel product-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              
              {/* Product Thumbnail */}
              <div style={{ position: 'relative', height: '240px', background: '#111827', overflow: 'hidden' }}>
                <img 
                  src={product.image || 'tasveer-banner.jpg'} 
                  alt={product.title || product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                  onError={(e) => { e.target.src = 'hero-poster.png'; }}
                />
                {product.badge && (
                  <span style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(15, 23, 42, 0.85)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '3px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                    {product.badge}
                  </span>
                )}
                <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(15, 23, 42, 0.85)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', color: '#fbbf24' }}>
                  <i className="fas fa-star"></i> {product.rating || 5} ({product.reviews || 12})
                </div>
              </div>

              {/* Product Info */}
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px', lineHeight: 1.4 }}>
                  {product.title || product.name}
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '16px', flex: 1 }}>
                  {product.desc || "Custom handcrafted photo framing with museum quality archival finish."}
                </p>

                {/* Pricing & Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                  <div>
                    <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fbbf24' }}>
                      ₹{product.price || product.basePrice || 499}
                    </span>
                    {product.originalPrice > product.price && (
                      <span style={{ fontSize: '0.85rem', color: '#64748b', textDecoration: 'line-through', marginLeft: '8px' }}>
                        ₹{product.originalPrice}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn-outline" 
                      style={{ padding: '8px 12px', fontSize: '0.85rem' }} 
                      title="Quick Add"
                      onClick={() => addToCart(product, false)}
                    >
                      <i className="fas fa-cart-plus"></i>
                    </button>
                    <button 
                      className="btn-gold" 
                      style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                      onClick={() => setCustomizerProduct(product)}
                    >
                      <i className="fas fa-crop-alt"></i> Frame
                    </button>
                  </div>
                </div>

              </div>

            </div>
          ))}
        </div>

      </section>

      {/* 6. PHOTO CUSTOMIZER MODAL */}
      {customizerProduct && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '860px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', position: 'relative' }}>
            
            <button 
              onClick={() => setCustomizerProduct(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
            >
              <i className="fas fa-times"></i>
            </button>

            <h2 className="font-cinzel" style={{ fontSize: '1.6rem', marginBottom: '8px' }}>
              Custom Frame Studio: <span className="gold-text">{customizerProduct.title || customizerProduct.name}</span>
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '24px' }}>
              Configure your photo, select wooden molding and white mount matting with live preview.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
              
              {/* Left Column: Live Frame Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#090d16', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                
                {/* Visualizer Frame Box */}
                <div className={`frame-preview-${customFrame}`} style={{ 
                  width: '240px', 
                  height: '300px', 
                  backgroundColor: '#ffffff', 
                  padding: `${customMatting}px`, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  overflow: 'hidden',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ width: '100%', height: '100%', background: '#222', overflow: 'hidden', position: 'relative' }}>
                    <img 
                      src={uploadedPhoto || customizerProduct.image || 'hero-poster.png'} 
                      alt="Preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <label className="btn-outline" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fas fa-upload"></i> Upload Your Photo
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                  </label>
                  {uploadedPhoto && (
                    <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '6px' }}>
                      <i className="fas fa-check-circle"></i> Custom Photo Attached
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column: Customizer Controls */}
              <div>
                
                {/* 1. Size Selection */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                    1. Select Frame Size
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {['8x12', '12x18', '16x24', '20x30', '24x36'].map(sz => (
                      <button 
                        key={sz} 
                        onClick={() => setCustomSize(sz)}
                        style={{
                          padding: '8px', 
                          borderRadius: '8px', 
                          border: customSize === sz ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                          background: customSize === sz ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.04)',
                          color: customSize === sz ? '#fbbf24' : '#fff',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {sz} inch
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Wooden Molding Selection */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                    2. Wooden Frame Molding
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {[
                      { id: 'teak', name: 'Italian Teak Wood', color: '#5c3a21' },
                      { id: 'gold', name: 'Royal Gold Border', color: '#b8860b' },
                      { id: 'walnut', name: 'Walnut Dark Finish', color: '#3b2219' },
                      { id: 'black', name: 'Matte Gallery Black', color: '#111' }
                    ].map(f => (
                      <button 
                        key={f.id} 
                        onClick={() => setCustomFrame(f.id)}
                        style={{
                          padding: '10px', 
                          borderRadius: '8px', 
                          border: customFrame === f.id ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                          background: customFrame === f.id ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.04)',
                          color: customFrame === f.id ? '#fbbf24' : '#fff',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          textAlign: 'left'
                        }}
                      >
                        <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: f.color, border: '1px solid #fff' }}></span>
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. White Matting Mount Width */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      3. Acid-Free White Mount
                    </label>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{customMatting}mm</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="30" 
                    step="5" 
                    value={customMatting} 
                    onChange={(e) => setCustomMatting(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#f59e0b' }}
                  />
                </div>

                {/* Live Price Calculation & Add Button */}
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Configured Price:</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24' }}>₹{getCustomPrice()}</div>
                  </div>
                  <button className="btn-gold" onClick={() => addToCart(customizerProduct, true)}>
                    <i className="fas fa-check"></i> Add to Cart
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* 7. CART DRAWER */}
      {isCartOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: '440px', background: '#0a0d14', height: '100%', borderLeft: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', flexDirection: 'column', padding: '24px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '20px' }}>
              <h3 className="font-cinzel" style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-shopping-bag" style={{ color: '#fbbf24' }}></i> Your Cart ({cart.length})
              </h3>
              <button onClick={() => setIsCartOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Cart Items List */}
            <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                  <i className="fas fa-box-open" style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.4 }}></i>
                  <p>Your cart is empty.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {cart.map(item => (
                    <div key={item.cartId} style={{ display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <img src={item.image} alt={item.title} style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>{item.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '8px' }}>
                          {item.size} • {item.frame}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 800, color: '#fbbf24', fontSize: '0.95rem' }}>₹{item.price * item.quantity}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button onClick={() => updateQuantity(item.cartId, -1)} style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer' }}>-</button>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.cartId, 1)} style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer' }}>+</button>
                            <button onClick={() => removeFromCart(item.cartId)} style={{ background: 'transparent', border: 'none', color: '#ef4444', marginLeft: '6px', cursor: 'pointer' }}>
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Coupon Code Section */}
            {cart.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', marginTop: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Coupon code (e.g. WELCOME10)" 
                    value={couponCode} 
                    onChange={(e) => setCouponCode(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem' }}
                  />
                  <button className="btn-outline" onClick={applyCoupon} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                    Apply
                  </button>
                </div>
                {couponMsg && <div style={{ fontSize: '0.8rem', color: couponMsg.includes('Applied') ? '#10b981' : '#f87171' }}>{couponMsg}</div>}
              </div>
            )}

            {/* Bill Summary */}
            {cart.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '14px', margin: '16px 0', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>
                  <span>Subtotal:</span> <span>₹{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#10b981', marginBottom: '6px' }}>
                    <span>Coupon Discount:</span> <span>-₹{discount}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>
                  <span>Shipping:</span> <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                  <span>Grand Total:</span> <span>₹{finalTotal}</span>
                </div>
              </div>
            )}

            {cart.length > 0 && (
              <button className="btn-gold" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} onClick={() => setIsCheckoutOpen(true)}>
                <i className="fas fa-lock"></i> Proceed to Checkout (₹{finalTotal})
              </button>
            )}

          </div>
        </div>
      )}

      {/* 8. CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', padding: '28px', position: 'relative' }}>
            <button onClick={() => setIsCheckoutOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>
              <i className="fas fa-times"></i>
            </button>

            <h3 className="font-cinzel" style={{ fontSize: '1.4rem', marginBottom: '6px' }}>
              <span className="gold-text">Delivery & Payment</span>
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
              Order directly with Prince Studio Sawai Madhopur. Soft-proof sent on WhatsApp.
            </p>

            <form onSubmit={submitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 600 }}>Full Name *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Aryan Sharma" 
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 600 }}>WhatsApp Number *</label>
                  <input 
                    type="tel" 
                    required 
                    placeholder="e.g. 9876543210" 
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 600 }}>Email Address</label>
                  <input 
                    type="email" 
                    placeholder="email@example.com" 
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 600 }}>Delivery Address *</label>
                <textarea 
                  required 
                  rows="2"
                  placeholder="House No., Street, Landmark" 
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', marginTop: '4px' }}
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 600 }}>City</label>
                  <input 
                    type="text" 
                    value={customer.city}
                    onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 600 }}>Pincode</label>
                  <input 
                    type="text" 
                    value={customer.pincode}
                    onChange={(e) => setCustomer({ ...customer, pincode: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Payment Mode</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {['UPI', 'COD', 'WhatsApp'].map(mode => (
                    <button 
                      type="button" 
                      key={mode}
                      onClick={() => setCustomer({ ...customer, paymentMethod: mode })}
                      style={{
                        padding: '10px', 
                        borderRadius: '8px', 
                        border: customer.paymentMethod === mode ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                        background: customer.paymentMethod === mode ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.04)',
                        color: customer.paymentMethod === mode ? '#fbbf24' : '#fff',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-gold" style={{ marginTop: '14px', padding: '12px', justifyContent: 'center' }}>
                <i className="fas fa-check-circle"></i> Place Order (₹{finalTotal})
              </button>
            </form>

          </div>
        </div>
      )}

      {/* 9. ORDER CONFIRMATION MODAL */}
      {orderSuccess && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '32px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 16px' }}>
              <i className="fas fa-check"></i>
            </div>
            <h3 className="font-cinzel" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Order Placed Successfully!</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '16px' }}>
              Saved to MongoDB. Our team at Prince Studio will inspect your soft-proof.
            </p>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Order Number:</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24' }}>{orderSuccess.orderNumber}</div>
            </div>
            <button className="btn-gold" onClick={() => setOrderSuccess(null)}>
              Continue Shopping
            </button>
          </div>
        </div>
      )}

      {/* 10. ORDER TRACKER MODAL */}
      {isTrackerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '28px', position: 'relative' }}>
            <button onClick={() => setIsTrackerOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>
              <i className="fas fa-times"></i>
            </button>

            <h3 className="font-cinzel" style={{ fontSize: '1.4rem', marginBottom: '8px' }}>
              <span className="gold-text">Track Your Frame Order</span>
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
              Live production status from Prince Studio framing workshop.
            </p>

            <form onSubmit={trackOrder} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input 
                type="text" 
                required 
                placeholder="Enter Order ID or WhatsApp Phone" 
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.9rem' }}
              />
              <button type="submit" className="btn-gold">Track</button>
            </form>

            {trackMsg && <div style={{ color: '#fbbf24', fontSize: '0.85rem', marginBottom: '16px' }}>{trackMsg}</div>}

            {trackedOrder && (
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 700 }}>{trackedOrder.orderNumber}</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>{trackedOrder.orderStatus}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '16px' }}>
                  Customer: {trackedOrder.customerName} • Total: ₹{trackedOrder.totalAmount}
                </div>

                {/* Progress Nodes */}
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginTop: '16px' }}>
                  {['Order Placed', 'Lab Printed', 'Wood Framed', 'Dispatched', 'Delivered'].map((step, idx) => {
                    const isPassed = ['Order Placed', 'Lab Printed', 'Wood Framed', 'Dispatched', 'Delivered'].indexOf(trackedOrder.orderStatus) >= idx;
                    return (
                      <div key={step} style={{ textAlign: 'center', zIndex: 1 }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isPassed ? '#10b981' : '#334155', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', margin: '0 auto 6px' }}>
                          {idx + 1}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: isPassed ? '#f8fafc' : '#64748b' }}>{step}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 11. ADMIN PORTAL MODAL */}
      {isAdminOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '880px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', position: 'relative' }}>
            <button onClick={() => setIsAdminOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>
              <i className="fas fa-times"></i>
            </button>

            <h3 className="font-cinzel" style={{ fontSize: '1.4rem', marginBottom: '8px' }}>
              <span className="gold-text">Prince Studio Admin Control Center</span>
            </h3>

            {!adminToken ? (
              <form onSubmit={handleAdminLogin} style={{ maxWidth: '360px', margin: '30px auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Login with MongoDB admin credentials (default: admin / prince123)</p>
                <input 
                  type="text" 
                  placeholder="Username" 
                  value={adminUsername} 
                  onChange={(e) => setAdminUsername(e.target.value)}
                  style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                />
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={adminPassword} 
                  onChange={(e) => setAdminPassword(e.target.value)}
                  style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                />
                <button type="submit" className="btn-gold" style={{ justifyContent: 'center' }}>
                  Login to Admin Center
                </button>
              </form>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '20px' }}>
                  <button 
                    onClick={() => { setAdminActiveTab('orders'); fetchAdminOrders(); }}
                    style={{ background: 'transparent', border: 'none', color: adminActiveTab === 'orders' ? '#fbbf24' : '#94a3b8', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Live Orders ({adminOrders.length})
                  </button>
                  <button 
                    onClick={() => setAdminActiveTab('products')}
                    style={{ background: 'transparent', border: 'none', color: adminActiveTab === 'products' ? '#fbbf24' : '#94a3b8', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Products Catalog ({products.length})
                  </button>
                  <a href="/admin" target="_blank" rel="noreferrer" style={{ color: '#fbbf24', textDecoration: 'none', marginLeft: 'auto', fontSize: '0.85rem' }}>
                    Open Full Admin Suite ↗
                  </a>
                </div>

                {adminActiveTab === 'orders' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {adminOrders.length === 0 ? (
                      <p style={{ color: '#64748b' }}>No orders found in MongoDB.</p>
                    ) : (
                      adminOrders.map(ord => (
                        <div key={ord.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 700, color: '#fbbf24' }}>{ord.orderNumber || ord.id} • ₹{ord.totalAmount}</div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                              {ord.customerName} ({ord.customerPhone}) • {ord.paymentMethod}
                            </div>
                          </div>
                          <select 
                            value={ord.orderStatus} 
                            onChange={(e) => updateOrderStatus(ord.id, e.target.value)}
                            style={{ padding: '6px 10px', borderRadius: '6px', background: '#1e293b', color: '#fff', border: '1px solid #475569' }}
                          >
                            <option value="Order Placed">Order Placed</option>
                            <option value="Lab Printed">Lab Printed</option>
                            <option value="Wood Framed">Wood Framed</option>
                            <option value="Dispatched">Dispatched</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {adminActiveTab === 'products' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    {products.map(p => (
                      <div key={p.id} style={{ background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{p.title || p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#fbbf24' }}>₹{p.price}</div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      )}

      {/* 12. FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(245, 158, 11, 0.15)', background: '#070a0f', padding: '40px 24px', textAlign: 'center', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="font-cinzel" style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }}>
            <span className="gold-text">Tasveer by Prince Studio</span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>
            Main Market Road, Sawai Madhopur, Rajasthan 322001 • Call: +91 72319 00124
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '0.85rem', color: '#94a3b8' }}>
            <span>MERN Stack Architecture</span>
            <span>•</span>
            <span>MongoDB 100% Operational</span>
            <span>•</span>
            <span>Express.js REST Engine</span>
            <span>•</span>
            <span>React Interface</span>
          </div>
          <p style={{ color: '#475569', fontSize: '0.75rem', marginTop: '16px' }}>
            © 2026 Tasveer by Prince Studio. All Rights Reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
