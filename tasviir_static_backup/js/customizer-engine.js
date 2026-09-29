/**
 * ==========================================================================
 * Tasveer by Prince Studio - 3D Customizer Engine (js/customizer-engine.js)
 * Room Backdrops, Frame Styles, Photo Editing Filters, Sizes & Live Price Math
 * ==========================================================================
 */

(function (window, document) {
    'use strict';

    const customizerState = {
        size: '12x18',
        basePrice: 499,
        sizeExtra: 0,
        frameStyle: 'frame-wood',
        frameExtra: 0,
        paperFinish: 'matte',
        paperExtra: 0,
        glassProtection: 'acrylic',
        glassExtra: 0,
        photoFilter: 'filter-none',
        uploadedImageSrc: null,
        photoRotation: 0
    };

    const SIZE_PRICES = {
        'A4 (8x12")': 349,
        '12x18"': 499,
        '18x24"': 799,
        '24x36"': 1299
    };

    const FRAME_EXTRAS = {
        'frame-wood': 0,
        'frame-black': 0,
        'frame-gold': 150,
        'frame-acrylic': 250
    };

    const PAPER_EXTRAS = {
        'matte': 0,
        'glossy': 50,
        'canvas': 150
    };

    const GLASS_EXTRAS = {
        'acrylic': 0,
        'anti-glare': 50,
        'no-glass': -30
    };

    function initCustomizerEngine() {
        // 1. Photo Editing Filter Buttons
        document.querySelectorAll('.filter-opt-btn').forEach(btn => {
            btn.onclick = function () {
                document.querySelectorAll('.filter-opt-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const filterClass = this.dataset.filter || 'filter-none';
                const photoEl = safeGet('photo-canvas');
                if (photoEl) photoEl.className = `photo-canvas ${filterClass}`;
                customizerState.photoFilter = filterClass;
                recalculateCustomizerPrice();
            };
        });

        // 2. Frame Design Style Buttons
        document.querySelectorAll('.frame-opt-btn').forEach(btn => {
            btn.onclick = function () {
                document.querySelectorAll('.frame-opt-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const frameClass = this.dataset.frame || 'frame-wood';
                const mockupEl = safeGet('frame-mockup');
                if (mockupEl) {
                    mockupEl.className = `frame-mockup ${frameClass}`;
                }
                customizerState.frameStyle = frameClass;
                customizerState.frameExtra = FRAME_EXTRAS[frameClass] || 0;
                recalculateCustomizerPrice();
            };
        });

        // 3. Select Size & Dimensions Buttons
        document.querySelectorAll('.size-opt-btn').forEach(btn => {
            btn.onclick = function () {
                document.querySelectorAll('.size-opt-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const sizeVal = this.dataset.size || '12x18"';
                customizerState.size = sizeVal;
                customizerState.basePrice = SIZE_PRICES[sizeVal] || 499;
                recalculateCustomizerPrice();
            };
        });

        // 4. Paper & Media Finish Buttons
        document.querySelectorAll('.paper-opt-btn').forEach(btn => {
            btn.onclick = function () {
                document.querySelectorAll('.paper-opt-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const paperVal = this.dataset.paper || 'matte';
                customizerState.paperFinish = paperVal;
                customizerState.paperExtra = PAPER_EXTRAS[paperVal] || 0;
                recalculateCustomizerPrice();
            };
        });

        // 5. Front Glass & Protection Buttons
        document.querySelectorAll('.glass-opt-btn').forEach(btn => {
            btn.onclick = function () {
                document.querySelectorAll('.glass-opt-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const glassVal = this.dataset.glass || 'acrylic';
                customizerState.glassProtection = glassVal;
                customizerState.glassExtra = GLASS_EXTRAS[glassVal] || 0;
                recalculateCustomizerPrice();
            };
        });
    }

    function recalculateCustomizerPrice() {
        const finalPrice = customizerState.basePrice + customizerState.frameExtra + customizerState.paperExtra + customizerState.glassExtra;
        const priceEl = safeGet('custom-price') || safeGet('customizer-final-price');
        if (priceEl) priceEl.innerText = `₹${finalPrice}`;

        const summaryEl = safeGet('custom-specs-desc') || safeGet('customizer-selection-summary');
        if (summaryEl) {
            const frameName = customizerState.frameStyle.replace('frame-', '').toUpperCase();
            summaryEl.innerText = `Size: ${customizerState.size} | Frame: ${frameName} | Paper: ${customizerState.paperFinish} | Glass: ${customizerState.glassProtection}`;
        }
    }

    function switchRoomBackdrop(backdropClass, btnElement) {
        const roomBox = safeGet('visualizer-preview-container') || safeGet('customizer-room-backdrop');
        if (roomBox) {
            roomBox.className = `visualizer-preview-container ${backdropClass}`;
        }
        if (btnElement) {
            const parent = btnElement.parentElement;
            if (parent) parent.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btnElement.classList.add('active');
        }
        if (window.logDebugMessage) window.logDebugMessage(`Switched Room Backdrop to ${backdropClass}`);
    }

    function applyPhotoFilter(filterClass, btnElement) {
        const photoEl = safeGet('photo-canvas');
        if (photoEl) photoEl.className = `photo-canvas ${filterClass}`;
        customizerState.photoFilter = filterClass;
        if (btnElement) {
            const parent = btnElement.parentElement;
            if (parent) parent.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btnElement.classList.add('active');
        }
        recalculateCustomizerPrice();
    }

    function applyFrameStyle(frameClass, btnElement) {
        const mockupEl = safeGet('frame-mockup');
        if (mockupEl) mockupEl.className = `frame-mockup ${frameClass}`;
        customizerState.frameStyle = frameClass;
        customizerState.frameExtra = FRAME_EXTRAS[frameClass] || 0;
        if (btnElement) {
            const parent = btnElement.parentElement;
            if (parent) parent.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btnElement.classList.add('active');
        }
        recalculateCustomizerPrice();
    }

    function applyPaperFinish(paperVal, btnElement) {
        customizerState.paperFinish = paperVal;
        customizerState.paperExtra = PAPER_EXTRAS[paperVal] || 0;
        if (btnElement) {
            const parent = btnElement.parentElement;
            if (parent) parent.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btnElement.classList.add('active');
        }
        recalculateCustomizerPrice();
    }

    function applyGlassProtection(glassVal, btnElement) {
        customizerState.glassProtection = glassVal;
        customizerState.glassExtra = GLASS_EXTRAS[glassVal] || 0;
        if (btnElement) {
            const parent = btnElement.parentElement;
            if (parent) parent.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btnElement.classList.add('active');
        }
        recalculateCustomizerPrice();
    }

    function applyCustomizerSize(sizeVal, btnElement) {
        customizerState.size = sizeVal;
        customizerState.basePrice = SIZE_PRICES[sizeVal] || SIZE_PRICES[`${sizeVal}"`] || 499;
        if (btnElement) {
            const parent = btnElement.parentElement;
            if (parent) parent.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btnElement.classList.add('active');
        }
        recalculateCustomizerPrice();
    }

    function rotateCustomizerPhoto() {
        customizerState.photoRotation = (customizerState.photoRotation + 90) % 360;
        const img = safeGet('photo-canvas') || safeGet('main-photo-preview');
        if (img) {
            img.style.transform = `rotate(${customizerState.photoRotation}deg)`;
        }
    }

    function handleMainPhotoUpload(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        const statusEl = safeGet('main-upload-status');
        if (statusEl) statusEl.innerText = '⚡ Processing HD Image Upload...';

        const reader = new FileReader();
        reader.onload = function (e) {
            const imgSrc = e.target.result;
            customizerState.uploadedImageSrc = imgSrc;

            const imgEl = safeGet('photo-canvas') || safeGet('main-photo-preview');
            if (imgEl) {
                imgEl.src = imgSrc;
                imgEl.style.display = 'block';
            }
            const drawerImg = safeGet('drawer-photo-preview');
            if (drawerImg) drawerImg.src = imgSrc;

            if (statusEl) statusEl.innerText = `✅ Loaded: ${file.name}`;
            if (window.showToast) window.showToast(`📸 Photo Applied Live: ${file.name}`);
            if (window.logDebugMessage) window.logDebugMessage(`Uploaded custom user photo: ${file.name}`);
        };
        reader.readAsDataURL(file);
    }

    // Expose Customizer API to Window
    window.customizerState = customizerState;
    window.initCustomizerEngine = initCustomizerEngine;
    window.recalculateCustomizerPrice = recalculateCustomizerPrice;
    window.switchRoomBackdrop = switchRoomBackdrop;
    window.applyPhotoFilter = applyPhotoFilter;
    window.applyFrameStyle = applyFrameStyle;
    window.applyPaperFinish = applyPaperFinish;
    window.applyGlassProtection = applyGlassProtection;
    window.applyCustomizerSize = applyCustomizerSize;
    window.rotateCustomizerPhoto = rotateCustomizerPhoto;
    window.handleMainPhotoUpload = handleMainPhotoUpload;

})(window, document);
