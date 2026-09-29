/**
 * ==========================================================================
 * Tasveer by Prince Studio - Collage Frames Catalog Module (js/catalog-collage-frames.js)
 * Dedicated, lightweight data file for all Multi-Photo Collage Frame products
 * ==========================================================================
 */

(function (window) {
    'use strict';

    const COLLAGE_FRAMES_DATA = [
        { 
            id: 'prod_301', 
            title: 'Royal Birthday Memories Photo Collage', 
            name: 'Royal Birthday Memories Photo Collage', 
            category: 'cat_collage_frames', 
            subcategory: 'sub_birthday_collage', 
            price: 599, 
            basePrice: 599, 
            originalPrice: 1199, 
            desc: 'Multi-photo custom birthday grid layout with personal message typography.', 
            badge: 'Birthday Special', 
            image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop', 
            stock: 40, 
            rating: 5.0, 
            reviews: 64, 
            sizes: [
                { name: '12x18"', price: 599 },
                { name: '18x24"', price: 899 },
                { name: '24x36"', price: 1399 }
            ] 
        },
        { 
            id: 'prod_302', 
            title: 'Wedding Anniversary Couples Collage', 
            name: 'Wedding Anniversary Couples Collage', 
            category: 'cat_collage_frames', 
            subcategory: 'sub_anniversary_collage', 
            price: 699, 
            basePrice: 699, 
            originalPrice: 1299, 
            desc: 'Romantic anniversary frame grid for treasured couple memories.', 
            badge: 'Romantic', 
            image: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&auto=format&fit=crop', 
            stock: 35, 
            rating: 4.9, 
            reviews: 41, 
            sizes: [
                { name: '12x18"', price: 699 },
                { name: '18x24"', price: 999 },
                { name: '24x36"', price: 1499 }
            ] 
        },
        { 
            id: 'prod_303', 
            title: '12-Month Family Memory Calendar Collage', 
            name: '12-Month Family Memory Calendar Collage', 
            category: 'cat_collage_frames', 
            subcategory: 'sub_calendar_collage', 
            price: 799, 
            basePrice: 799, 
            originalPrice: 1499, 
            desc: 'Custom 12 month photo calendar grid layout for whole year memories.', 
            badge: 'New Year', 
            image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&auto=format&fit=crop', 
            stock: 30, 
            rating: 4.8, 
            reviews: 33, 
            sizes: [
                { name: '12x18"', price: 799 },
                { name: '18x24"', price: 1099 }
            ] 
        }
    ];

    window.COLLAGE_FRAMES_CATALOG = COLLAGE_FRAMES_DATA;

})(window);
