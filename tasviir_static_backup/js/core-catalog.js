/**
 * ==========================================================================
 * Tasveer by Prince Studio - Master Core Catalog (js/core-catalog.js)
 * 30 Master Products Across 10 Categories with Layer-by-Layer Subcategories & Sizes
 * ==========================================================================
 */

(function (window) {
    'use strict';

    const DEFAULT_CATEGORIES = [
        { id: 'cat_photo_prints', name: 'Photo Print', icon: 'fa-print', desc: 'Archival Matte & Glossy Lab Prints', parentId: null },
        { id: 'cat_photo_frames', name: 'Photo Frame', icon: 'fa-vector-square', desc: 'Teak Wood & Solid Oak Wall Frames', parentId: null },
        { id: 'cat_collage_frames', name: 'Collage Frame', icon: 'fa-border-all', desc: 'Multi-Photo Birthday & Anniversary Collages', parentId: null },
        { id: 'cat_canvas_prints', name: 'Canvas Print', icon: 'fa-paint-brush', desc: '100% Textured Cotton Museum Canvases', parentId: null },
        { id: 'cat_gallery_frames', name: 'Gallery Frame', icon: 'fa-image', desc: 'Curated 3-Piece & 5-Piece Wall Sets', parentId: null },
        { id: 'cat_poster_frames', name: 'Poster Frame', icon: 'fa-scroll', desc: '300GSM HD Minimalist Posters', parentId: null },
        { id: 'cat_mug_prints', name: 'Mug Print', icon: 'fa-mug-hot', desc: 'Magic Heat Reveal & Ceramic Mugs', parentId: null },
        { id: 'cat_sticker_prints', name: 'Sticker Print', icon: 'fa-sticky-note', desc: 'Waterproof Vinyl & Die-Cut Stickers', parentId: null },
        { id: 'cat_light_frames', name: 'Light Frame', icon: 'fa-lightbulb', desc: 'Backlit LED Glass & Acrylic Light Frames', parentId: null },
        { id: 'cat_box_frames', name: 'Box / Shadow Frame', icon: 'fa-cube', desc: 'Deep Shadow Box Memory Keepsakes', parentId: null },
        
        // --- SUBCATEGORIES FOR LAYER-BY-LAYER DRILL-DOWN ---
        { id: 'sub_single_frame', name: 'Single Photo Frame', icon: 'fa-square', desc: 'Single Portrait or Landscape Wall Frame', parentId: 'cat_photo_frames' },
        { id: 'sub_birthday_collage', name: 'Birthday Collage', icon: 'fa-birthday-cake', desc: 'Custom Birthday Wishes Photo Grid', parentId: 'cat_collage_frames' },
        { id: 'sub_anniversary_collage', name: 'Anniversary Collage', icon: 'fa-heart', desc: 'Couples & Wedding Anniversary Grid', parentId: 'cat_collage_frames' },
        { id: 'sub_calendar_collage', name: 'Calendar Collage', icon: 'fa-calendar-alt', desc: '12-Month Custom Photo Calendar Grid', parentId: 'cat_collage_frames' },
        { id: 'sub_canvas_single', name: 'Single Canvas Wrap', icon: 'fa-paint-brush', desc: 'Stretched Gallery Canvas Wrap', parentId: 'cat_canvas_prints' },
        { id: 'sub_canvas_set', name: 'Canvas Triptych Set', icon: 'fa-th-large', desc: '3-Panel Split Canvas Wall Art', parentId: 'cat_canvas_prints' }
    ];

    function getAllModularProducts() {
        const photoPrints = window.PHOTO_PRINTS_CATALOG || [];
        const photoFrames = window.PHOTO_FRAMES_CATALOG || [];
        const collageFrames = window.COLLAGE_FRAMES_CATALOG || [];
        const canvasPrints = window.CANVAS_PRINTS_CATALOG || [];
        const otherProducts = window.OTHER_PRODUCTS_CATALOG || [];

        return [
            ...photoPrints,
            ...photoFrames,
            ...collageFrames,
            ...canvasPrints,
            ...otherProducts
        ];
    }

    const DEFAULT_PRODUCTS = getAllModularProducts();

    window.DEFAULT_CATEGORIES = DEFAULT_CATEGORIES;
    window.DEFAULT_PRODUCTS = DEFAULT_PRODUCTS;
    window.PRODUCTS_DATA = DEFAULT_PRODUCTS;

    window.CoreCatalog = {
        DEFAULT_CATEGORIES: DEFAULT_CATEGORIES,
        DEFAULT_PRODUCTS: DEFAULT_PRODUCTS,
        getAllModularProducts: getAllModularProducts,
        getCategories: function () {
            try {
                const stored = JSON.parse(localStorage.getItem('tasveer_categories'));
                if (stored && Array.isArray(stored) && stored.length > 0) return stored;
            } catch (e) {}
            return DEFAULT_CATEGORIES;
        },
        getProducts: function () {
            try {
                const stored = JSON.parse(localStorage.getItem('tasveer_products'));
                if (stored && Array.isArray(stored) && stored.length > 0) return stored;
            } catch (e) {}
            return getAllModularProducts();
        }
    };

})(window);
