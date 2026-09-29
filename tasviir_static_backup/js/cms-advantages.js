/**
 * ==========================================================================
 * Tasveer by Prince Studio - CMS & UI Layout Engine (js/cms-advantages.js)
 * Backend Server CMS Sync, Bento Grid, Advantages & Dark/Light Theme Engine
 * ==========================================================================
 */

(function (window, document) {
    'use strict';

    const safeStorage = {
        getItem: function (key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
        setItem: function (key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
    };

    const API_BASE = (window.location.protocol === 'file:') ? 'http://127.0.0.1:8085' : '';

    function fetchBackendServerCMS() {
        // Apply existing user settings first
        const existingCMS = safeStorage.getItem('tasveer_cms_settings');
        if (existingCMS) {
            try {
                const parsed = JSON.parse(existingCMS);
                if (parsed) applyCMSContent(parsed);
            } catch(e) {}
        }

        fetch(API_BASE + '/api/v1/cms')
            .then(res => res.json())
            .then(db => {
                if (!db) return;
                if (db.cms) {
                    const current = JSON.parse(safeStorage.getItem('tasveer_cms_settings') || '{}');
                    // Never overwrite custom uploaded user photos with default paintbrush sample
                    if (!current.heroImageUrl || current.heroImageUrl.includes('unsplash.com')) {
                        safeStorage.setItem('tasveer_cms_settings', JSON.stringify(db.cms));
                        applyCMSContent(db.cms);
                    }
                }
                if (db.bento_header) {
                    safeStorage.setItem('tasveer_bento_header', JSON.stringify(db.bento_header));
                }
                if (db.bento_cards && Array.isArray(db.bento_cards)) {
                    safeStorage.setItem('tasveer_bento_cards', JSON.stringify(db.bento_cards));
                }
                if (db.advantages) {
                    safeStorage.setItem('tasveer_advantages', JSON.stringify(db.advantages));
                    applyAdvantagesCMS(db.advantages);
                }
                if (db.footer) {
                    safeStorage.setItem('tasveer_footer', JSON.stringify(db.footer));
                    applyFooterCMS(db.footer);
                }
                renderDynamicBentoGrid();
            })
            .catch(e => {});
    }

    let heroSlideIndex = 0;
    let heroSlideTimer = null;
    let currentHeroSlides = [];

    function renderHeroSlideshow(slides) {
        const track = document.getElementById('hero-slides-track');
        const dotsContainer = document.getElementById('hero-slider-dots');
        const prevBtn = document.querySelector('.hero-nav-prev');
        const nextBtn = document.querySelector('.hero-nav-next');
        if (!track) return;

        currentHeroSlides = (slides || []).filter(s => s && s.trim().length > 0);
        if (currentHeroSlides.length === 0) {
            try {
                const cached = JSON.parse(safeStorage.getItem('tasveer_cms_settings') || '{}');
                if (cached.heroImageUrl) {
                    if (cached.heroImageUrl.includes('iVBORw0KGgoAAAANSUhEUgAABhsAAAYb') || cached.heroImageUrl === 'hero-poster.png' || cached.heroImageUrl === 'logo.png') {
                        cached.heroImageUrl = 'hero-banner.jpg';
                        safeStorage.setItem('tasveer_cms_settings', JSON.stringify(cached));
                    }
                    currentHeroSlides = [cached.heroImageUrl];
                }
            } catch(e) {}
        }
        if (currentHeroSlides.length === 0) {
            currentHeroSlides = ['hero-banner.jpg'];
        }

        if (heroSlideIndex >= currentHeroSlides.length) heroSlideIndex = 0;

        track.innerHTML = currentHeroSlides.map((url, i) => {
            const isVideo = url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('video/') || url.startsWith('data:video');
            return `
                <div class="hero-slide ${i === heroSlideIndex ? 'active' : ''}" data-index="${i}">
                    ${isVideo ? `
                        <video src="${url}" autoplay loop muted playsinline style="width:100%; height:auto; max-height:490px; object-fit:cover; border-radius:10px; display:block;"></video>
                    ` : `
                        <img src="${url}" onerror="this.src='hero-banner.jpg'" alt="Tasveer Studio Photo Wall Frame Slide ${i+1}">
                    `}
                </div>
            `;
        }).join('');

        if (dotsContainer) {
            if (currentHeroSlides.length > 1) {
                dotsContainer.style.display = 'flex';
                dotsContainer.innerHTML = currentHeroSlides.map((_, i) => `
                    <div class="hero-dot ${i === heroSlideIndex ? 'active' : ''}" onclick="goToHeroSlide(${i})"></div>
                `).join('');
            } else {
                dotsContainer.style.display = 'none';
            }
        }

        if (prevBtn && nextBtn) {
            const showNav = currentHeroSlides.length > 1;
            prevBtn.style.display = showNav ? 'flex' : 'none';
            nextBtn.style.display = showNav ? 'flex' : 'none';
        }

        startHeroSlideTimer();
    }

    function goToHeroSlide(index) {
        if (currentHeroSlides.length <= 1) return;
        heroSlideIndex = (index + currentHeroSlides.length) % currentHeroSlides.length;

        const slides = document.querySelectorAll('.hero-slide');
        slides.forEach((el, i) => {
            if (i === heroSlideIndex) el.classList.add('active');
            else el.classList.remove('active');
        });

        const dots = document.querySelectorAll('.hero-dot');
        dots.forEach((el, i) => {
            if (i === heroSlideIndex) el.classList.add('active');
            else el.classList.remove('active');
        });

        startHeroSlideTimer();
    }

    function nextHeroSlide() {
        goToHeroSlide(heroSlideIndex + 1);
    }

    function prevHeroSlide() {
        goToHeroSlide(heroSlideIndex - 1);
    }

    function isAdminLoggedIn() {
        try {
            return sessionStorage.getItem('tasveer_admin_logged_in') === 'true' || 
                   sessionStorage.getItem('adminAuthenticated') === 'true' ||
                   localStorage.getItem('tasveer_admin_logged_in') === 'true';
        } catch(e) {
            return false;
        }
    }

    function handleHeroDragOver(e) {
        if (!isAdminLoggedIn()) return;
        if (e) e.preventDefault();
        const dropzone = document.getElementById('gallery-hero-frame-dropzone');
        if (dropzone) dropzone.classList.add('drag-over');
    }

    function handleHeroDragLeave(e) {
        if (!isAdminLoggedIn()) return;
        if (e) e.preventDefault();
        const dropzone = document.getElementById('gallery-hero-frame-dropzone');
        if (dropzone) dropzone.classList.remove('drag-over');
    }

    function handleHeroDrop(e) {
        if (!isAdminLoggedIn()) return;
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const dropzone = document.getElementById('gallery-hero-frame-dropzone');
        if (dropzone) dropzone.classList.remove('drag-over');

        const files = e.dataTransfer ? e.dataTransfer.files : null;
        if (files && files.length > 0) {
            processDirectHeroImageFile(files[0]);
        }
    }

    function handleHeroDirectUpload(e) {
        if (!isAdminLoggedIn()) {
            if (window.showToast) window.showToast('Access restricted: Please login as Admin to modify storefront banners.', 'warn');
            return;
        }
        const file = e.target.files ? e.target.files[0] : null;
        if (file) {
            processDirectHeroImageFile(file);
        }
    }

    function processDirectHeroImageFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            if (window.showToast) window.showToast('Please select a valid image file (JPG, PNG, WebP)!', 'warn');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new Image();
            img.onload = function () {
                const maxDim = 1200;
                let w = img.width;
                let h = img.height;
                if (w > maxDim || h > maxDim) {
                    if (w > h) {
                        h = Math.round((h * maxDim) / w);
                        w = maxDim;
                    } else {
                        w = Math.round((w * maxDim) / h);
                        h = maxDim;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                const compressedUrl = canvas.toDataURL('image/jpeg', 0.88);

                // 1. Immediately update active hero slide on screen
                renderHeroSlideshow([compressedUrl]);

                // 2. Persist to tasveer_cms_settings
                let cms = {};
                try {
                    cms = JSON.parse(safeStorage.getItem('tasveer_cms_settings') || '{}');
                } catch(e) {}
                cms.heroImageUrl = compressedUrl;
                safeStorage.setItem('tasveer_cms_settings', JSON.stringify(cms));

                // 3. Push to Firestore Cloud DB
                if (window.CloudDB && window.CloudDB.pushUpdate) {
                    window.CloudDB.pushUpdate('cms_settings', cms);
                }

                if (window.showToast) window.showToast('✅ Banner Photo Replaced & Saved Instantly! 🎨🎉');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    function startHeroSlideTimer() {
        if (heroSlideTimer) clearInterval(heroSlideTimer);
        if (currentHeroSlides.length > 1) {
            heroSlideTimer = setInterval(() => {
                nextHeroSlide();
            }, 5000);
        }
    }

    function applyCMSContent(cmsData) {
        try {
            let cms = cmsData || JSON.parse(safeStorage.getItem('tasveer_cms_settings')) || null;
            if (!cms) return;
            if (cms.items) cms = cms.items;

            // Persist to safeStorage so it never reverts on refresh
            safeStorage.setItem('tasveer_cms_settings', JSON.stringify(cms));

            // 1. Logo Title & Subtitle
            const logoTitleEl = document.querySelector('.brand-title h1, .brand-title a, .sidebar-brand h2');
            if (logoTitleEl && cms.logoTitle) logoTitleEl.innerText = cms.logoTitle;

            const logoSubEl = document.querySelector('.brand-title span, .sidebar-brand span');
            if (logoSubEl && cms.logoSub) logoSubEl.innerText = cms.logoSub;

            // 2. Hero Main Heading
            const heroHeadingEl = document.querySelector('.hero-main-heading');
            if (heroHeadingEl && cms.heroTitle) heroHeadingEl.innerHTML = cms.heroTitle;

            // 3. Hero Subtext Paragraph
            const heroSubtextEl = document.querySelector('.hero-subtext');
            if (heroSubtextEl) {
                let subtext = cms.heroSubtext || cms.heroSubtitle || 'Upload your personal photos, select real Italian wood moldings, white mount borders, and order with instant UPI & WhatsApp soft-proof approval!';
                subtext = subtext.replace(/, preview in 3D virtual rooms/gi, '').replace(/preview in 3D virtual rooms, and /gi, '');
                heroSubtextEl.innerText = subtext;
            }

            // 4. Hero Action Button
            const heroBtnEl = document.querySelector('.hero-btns .btn-primary');
            if (heroBtnEl) {
                let btnTxt = cms.heroBtnText || '📸 Upload Photo & Frame (₹499)';
                if (btnTxt.includes('3D') || btnTxt.includes('Customizer')) {
                    btnTxt = '📸 Upload Photo & Frame (₹499)';
                }
                heroBtnEl.innerHTML = `<i class="fas fa-camera"></i> ${btnTxt}`;
                heroBtnEl.onclick = function(e) {
                    if (e && e.preventDefault) e.preventDefault();
                    if (window.openProductDetailsDrawer) window.openProductDetailsDrawer('prod_201');
                };
            }

            // 5. Multi-Photo Hero Carousel Slideshow
            const slideList = [];
            if (cms.heroImageUrl) {
                if (cms.heroImageUrl.includes('iVBORw0KGgoAAAANSUhEUgAABhsAAAYb') || cms.heroImageUrl === 'hero-poster.png' || cms.heroImageUrl === 'logo.png') {
                    cms.heroImageUrl = 'hero-banner.jpg';
                    safeStorage.setItem('tasveer_cms_settings', JSON.stringify(cms));
                }
                slideList.push(cms.heroImageUrl);
            } else {
                slideList.push('hero-banner.jpg');
            }
            if (cms.heroSlide2) slideList.push(cms.heroSlide2);
            if (cms.heroSlide3) slideList.push(cms.heroSlide3);
            if (cms.heroSlide4) slideList.push(cms.heroSlide4);
            renderHeroSlideshow(slideList);

            // 6. Hero Image Badge Tag (e.g. 'Royal Gold Finish' or hidden)
            const badgeEl = document.querySelector('.floating-badge-tag, #hero-floating-badge');
            if (badgeEl) {
                if (cms.heroBadgeText && cms.heroBadgeText.trim() !== '') {
                    badgeEl.innerHTML = `<i class="fas fa-shield-alt"></i> ${cms.heroBadgeText.trim()}`;
                    badgeEl.style.display = 'inline-flex';
                } else {
                    badgeEl.style.display = 'none';
                }
            }

            // 7. Announcement Bar
            const annEl = document.querySelector('.top-bar .container, .top-bar-text');
            if (annEl && cms.announcementText) {
                annEl.innerHTML = `<i class="fas fa-bullhorn" style="color:var(--gold-bright);"></i> ${cms.announcementText}`;
            }
        } catch (e) {
            console.warn('[CMS Engine] applyCMSContent error:', e);
        }
    }

    function applyAdvantagesCMS(advantages) {
        try {
            const advs = advantages || JSON.parse(safeStorage.getItem('tasveer_advantages')) || null;
            if (!advs || !Array.isArray(advs)) return;

            const boxes = document.querySelectorAll('.advantages-grid .adv-box');
            advs.forEach((item, index) => {
                if (boxes[index]) {
                    const titleEl = boxes[index].querySelector('h4');
                    const descEl = boxes[index].querySelector('p');
                    if (titleEl && item.title) titleEl.innerText = item.title;
                    if (descEl && item.desc) descEl.innerText = item.desc;
                }
            });
        } catch (e) {}
    }

    function applyFooterCMS(footerData) {
        try {
            const f = footerData || JSON.parse(safeStorage.getItem('tasveer_footer')) || null;
            if (!f) return;

            const fTitle = document.querySelector('.footer-col h3');
            const fText = document.querySelector('.footer-col p');
            if (fTitle && f.aboutTitle) fTitle.innerText = f.aboutTitle;
            if (fText && f.aboutText) fText.innerText = f.aboutText;
        } catch (e) {}
    }

    function applyBentoHeaderCMS(bentoHeader) {
        try {
            const bh = bentoHeader || JSON.parse(safeStorage.getItem('tasveer_bento_header')) || null;
            if (!bh) return;
            const tagEl = safeGet('cms-bento-tag');
            const titleEl = safeGet('cms-bento-title');
            if (tagEl && bh.tag) tagEl.innerText = bh.tag;
            if (titleEl && bh.title) titleEl.innerText = bh.title;
        } catch(e) {}
    }

    function renderDynamicBentoGrid() {
        const grid = safeGet('cms-bento-grid') || safeGet('bento-grid-container');
        if (!grid) return;

        const defaultCards = [
            { category: 'cat_photo_frames', title: 'Royal Wooden Wall Frames', desc: 'Handcrafted Teak & Oak Frames', tag: 'Bestseller', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600', size: 'bento-large' },
            { category: 'cat_collage_frames', title: 'Multi-Photo Collages', desc: 'Birthday & Anniversary Grids', tag: 'Trending', image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600', size: 'bento-medium' },
            { category: 'cat_canvas_prints', title: 'Museum Cotton Canvas Wraps', desc: '100% Textured Cotton', tag: 'Premium', image: 'https://images.unsplash.com/photo-1579541814924-49fef17c5be5?w=600', size: 'bento-medium' }
        ];

        let bentoCards = defaultCards;
        try {
            const stored = JSON.parse(safeStorage.getItem('tasveer_bento_cards'));
            if (stored && Array.isArray(stored) && stored.length > 0) bentoCards = stored;
        } catch (e) {}

        grid.innerHTML = bentoCards.map(b => `
            <div class="bento-card ${b.size || ''}" onclick="window.filterCategory('${b.category || 'all'}')" style="cursor:pointer;">
                <img src="${b.image}" alt="${b.title}">
                <div class="bento-content">
                    ${b.tag ? `<span class="bento-tag">${b.tag}</span>` : ''}
                    <h3>${b.title}</h3>
                    <p>${b.desc || 'Handcrafted Studio Collection'}</p>
                    <span class="bento-link">Explore Collection <i class="fas fa-arrow-right"></i></span>
                </div>
            </div>
        `).join('');
    }

    function initTheme() {
        const themeBtn = safeGet('theme-toggle-btn');
        const savedTheme = safeStorage.getItem('tasveer_theme') || 'dark';

        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            if (themeBtn) themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
        }

        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', newTheme);
                safeStorage.setItem('tasveer_theme', newTheme);
                themeBtn.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
                if (window.showToast) window.showToast(`Switched to ${newTheme} mode`);
            });
        }
    }

    function toggleFaq(headerElement) {
        const item = headerElement.parentElement;
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
    }

    // Expose to Window
    window.fetchBackendServerCMS = fetchBackendServerCMS;
    window.applyCMSContent = applyCMSContent;
    window.applyAdvantagesCMS = applyAdvantagesCMS;
    window.applyFooterCMS = applyFooterCMS;
    window.renderDynamicBentoGrid = renderDynamicBentoGrid;
    window.initTheme = initTheme;
    window.toggleFaq = toggleFaq;
    window.nextHeroSlide = nextHeroSlide;
    window.prevHeroSlide = prevHeroSlide;
    window.goToHeroSlide = goToHeroSlide;
    window.handleHeroDragOver = handleHeroDragOver;
    window.handleHeroDragLeave = handleHeroDragLeave;
    window.handleHeroDrop = handleHeroDrop;
    window.handleHeroDirectUpload = handleHeroDirectUpload;

    function initCMS() {
        if (isAdminLoggedIn()) {
            document.body.classList.add('admin-logged-in');
        }
        applyCMSContent();
        fetchBackendServerCMS();
        initTheme();

        if (window.CloudDB && window.CloudDB.subscribe) {
            window.CloudDB.subscribe((col, data) => {
                if (col === 'cms_settings' || col === 'cms') {
                    applyCMSContent(data);
                }
                if (col === 'advantages') {
                    applyAdvantagesCMS(data);
                }
            });
        }

        window.addEventListener('storage', (e) => {
            if (e.key === 'tasveer_cms_settings') {
                applyCMSContent();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCMS);
    } else {
        initCMS();
    }

})(window, document);
