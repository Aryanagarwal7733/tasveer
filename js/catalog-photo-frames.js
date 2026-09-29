/**
 * ==========================================================================
 * Tasveer by Prince Studio - Photo Frames Catalog Module (js/catalog-photo-frames.js)
 * Dedicated, lightweight data file for all Photo Frame products
 * ==========================================================================
 */

(function (window) {
    'use strict';

    const PHOTO_FRAMES_DATA = [
        { 
            id: 'prod_201', 
            title: 'Italian Teak Wood Wall Frame', 
            name: 'Italian Teak Wood Wall Frame', 
            category: 'cat_photo_frames', 
            subcategory: 'sub_single_frame', 
            price: 499, 
            basePrice: 499, 
            originalPrice: 899, 
            desc: 'Handcrafted solid teak wood frame with mount and protective glass front.', 
            badge: 'Royal Teak', 
            image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop', 
            stock: 50, 
            rating: 5.0, 
            reviews: 45, 
            sizes: [
                { name: '12x18"', price: 499 },
                { name: 'A4 Size', price: 349 },
                { name: '18x24"', price: 799 },
                { name: '24x36"', price: 1299 }
            ] 
        },
        { 
            id: 'prod_202', 
            title: 'Minimalist Black Solid Wood Frame', 
            name: 'Minimalist Black Solid Wood Frame', 
            category: 'cat_photo_frames', 
            subcategory: 'sub_single_frame', 
            price: 399, 
            basePrice: 399, 
            originalPrice: 699, 
            desc: 'Sleek matte black wooden wall frame with modern bevelled profile.', 
            badge: 'Popular', 
            image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&auto=format&fit=crop', 
            stock: 65, 
            rating: 4.9, 
            reviews: 52, 
            sizes: [
                { name: '12x18"', price: 399 },
                { name: 'A4 Size', price: 299 },
                { name: '18x24"', price: 699 }
            ] 
        }
    ];

    window.PHOTO_FRAMES_CATALOG = PHOTO_FRAMES_DATA;

})(window);
