/**
 * ==========================================================================
 * Tasveer by Prince Studio - Canvas Prints Catalog Module (js/catalog-canvas-prints.js)
 * Dedicated, dynamic data file for all Cotton Canvas Art products
 * Supports: Canvas Print (Roll) & Gallery Wrap (Frame) with Dynamic Size Chart
 * ==========================================================================
 */

(function (window) {
    'use strict';

    const CANVAS_PRINTS_DATA = [
        { 
            id: 'prod_401', 
            title: '100% Cotton Museum Canvas Art', 
            name: '100% Cotton Museum Canvas Art', 
            category: 'cat_canvas_prints', 
            subcategory: 'sub_canvas_single', 
            price: 299, 
            basePrice: 299, 
            originalPrice: 799, 
            desc: 'Archival 380GSM textured 100% cotton canvas with 12-color pigment HD inks. Available in Unframed Protective Roll or Ready-to-Hang 1.5" Stretched Wooden Gallery Wrap.', 
            badge: 'Museum Textured Art', 
            image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop', 
            stock: 50, 
            rating: 5.0, 
            reviews: 42,
            hasFormats: true,
            formats: [
                { id: 'roll', name: 'Canvas Print (Roll)', icon: 'fa-scroll', desc: 'Unframed Rolled in Hard Protective Tube' },
                { id: 'gallery_wrap', name: 'Gallery Wrap (Frame)', icon: 'fa-vector-square', desc: '1.5" Solid Pinewood Stretched Frame (Ready to Hang)' }
            ],
            sizeChart: [
                { size: '8x12"', label: '8 × 12 Inch (20 × 30 cm)', rollPrice: 299, wrapPrice: 599, originalPrice: 999 },
                { size: '12x18"', label: '12 × 18 Inch (30 × 45 cm)', rollPrice: 499, wrapPrice: 899, originalPrice: 1499 },
                { size: '16x24"', label: '16 × 24 Inch (40 × 60 cm)', rollPrice: 799, wrapPrice: 1399, originalPrice: 2299 },
                { size: '20x30"', label: '20 × 30 Inch (50 × 75 cm)', rollPrice: 1199, wrapPrice: 1999, originalPrice: 3299 },
                { size: '24x36"', label: '24 × 36 Inch (60 × 90 cm)', rollPrice: 1599, wrapPrice: 2699, originalPrice: 4499 }
            ],
            sizes: [
                { name: '8x12"', price: 299 },
                { name: '12x18"', price: 499 },
                { name: '16x24"', price: 799 },
                { name: '20x30"', price: 1199 },
                { name: '24x36"', price: 1599 }
            ]
        },
        { 
            id: 'prod_402', 
            title: 'Triptych 3-Panel Split Canvas Set', 
            name: 'Triptych 3-Panel Split Canvas Set', 
            category: 'cat_canvas_prints', 
            subcategory: 'sub_canvas_set', 
            price: 999, 
            basePrice: 999, 
            originalPrice: 2499, 
            desc: '3-Piece split panoramic museum canvas art display. Available in Rolled Canvas Sheets or Complete 3-Panel Gallery Stretched Sets.', 
            badge: '3-Piece Set', 
            image: 'https://images.unsplash.com/photo-1579541814924-49fef17c5be5?w=600&auto=format&fit=crop', 
            stock: 25, 
            rating: 4.9, 
            reviews: 29,
            hasFormats: true,
            formats: [
                { id: 'roll', name: 'Canvas Print (Roll)', icon: 'fa-scroll', desc: '3 Unframed Rolled Canvas Prints' },
                { id: 'gallery_wrap', name: 'Gallery Wrap (Frame)', icon: 'fa-vector-square', desc: '3-Piece Stretched Pinewood Gallery Frames' }
            ],
            sizeChart: [
                { size: '12x18" (3-Set)', label: '12 × 18" (Each Panel)', rollPrice: 999, wrapPrice: 1799, originalPrice: 2999 },
                { size: '18x24" (3-Set)', label: '18 × 24" (Each Panel)', rollPrice: 1499, wrapPrice: 2799, originalPrice: 4499 },
                { size: '24x36" (3-Set)', label: '24 × 36" (Each Panel)', rollPrice: 2499, wrapPrice: 4499, originalPrice: 6999 }
            ],
            sizes: [
                { name: '12x18" (3-Set)', price: 999 },
                { name: '18x24" (3-Set)', price: 1499 },
                { name: '24x36" (3-Set)', price: 2499 }
            ]
        }
    ];

    window.CANVAS_PRINTS_CATALOG = CANVAS_PRINTS_DATA;

})(window);
